"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { isDeliveryConfirmationAvailable, isOrderDeliveryAvailable } from "./order-delivery";
import type { OrderDeliveryDetails } from "@/generated/prisma/client";
import { isOrderReceiptAvailable } from "./order-receipt";
import { hasPaymentReceipt } from "./external-payment";

type DeliveryState = { message: string; ok?: boolean };

export async function saveOrderDelivery(orderId: string, _state: DeliveryState, form: FormData): Promise<DeliveryState> {
  const actor = await getCurrentIdentity();
  if (!actor?.roles.includes("PRODUCER")) return { message: "Necesitas el perfil de vendedor." };
  const order = await prisma.order.findFirst({
    where: { id: orderId, producerId: actor.userId, status: "ACCEPTED" },
    select: { id: true },
  });
  if (!order) return { message: "No encontramos ese pedido aceptado en tu cuenta." };
  if (!await isOrderDeliveryAvailable()) return { message: "Esta opción todavía no está disponible." };
  if (await hasPaymentReceipt(order.id)) return { message: "El pago ya está confirmado. Acuerda cualquier ajuste con el comprador." };
  if (await isOrderReceiptAvailable() && await prisma.orderReceipt.findUnique({
    where: { orderId: order.id },
    select: { orderId: true },
  })) return { message: "El comprador ya confirmó la recepción de este pedido." };

  const method = form.get("method");
  const when = String(form.get("when") ?? "").trim();
  const place = String(form.get("place") ?? "").trim();
  const rawCost = form.get("costCOP");
  const costCOP = typeof rawCost === "string" && /^\d{1,10}$/.test(rawCost.trim()) ? Number(rawCost) : -1;
  if (method !== "PICKUP" && method !== "SHIPPING") return { message: "Elige envío o recogida." };
  if (!when || when.length > 100 || !place || place.length > 240 || /\0/.test(when + place)) {
    return { message: "Escribe cuándo y dónde se hará la entrega." };
  }
  if (costCOP < 0 || costCOP > 2147483647) return { message: "Escribe el costo en pesos enteros. Si es gratis, escribe 0." };
  const data = { method, when, place, costCOP };
  await prisma.orderDeliveryDetails.upsert({
    where: { orderId: order.id },
    create: { orderId: order.id, ...data },
    update: data,
  });
  revalidatePath("/mi-cuenta/pedidos");
  return { ok: true, message: "Guardamos los datos de entrega del pedido." };
}

export async function confirmOrderDelivery(
  delivery: OrderDeliveryDetails,
): Promise<DeliveryState> {
  const actor = await getCurrentIdentity();
  if (!actor?.roles.includes("BUYER")) return { message: "Necesitas el perfil de comprador." };
  if (!await isDeliveryConfirmationAvailable()) return { message: "Esta opción todavía no está disponible." };

  // Lock the exact version shown to the buyer so a concurrent edit either wins
  // before this confirmation or clears it immediately afterwards.
  const [result] = await prisma.$queryRaw<{ matched: boolean }[]>`
    WITH matching AS (
      SELECT d."orderId"
      FROM "OrderDeliveryDetails" d JOIN "Order" o ON o."id" = d."orderId"
      WHERE d."orderId" = ${delivery.orderId} AND o."buyerId" = ${actor.userId}
        AND o."status" = 'ACCEPTED'
        AND d."method" = ${delivery.method} AND d."when" = ${delivery.when}
        AND d."place" = ${delivery.place} AND d."costCOP" = ${delivery.costCOP}
      FOR UPDATE OF d
    ), confirmed AS (
      INSERT INTO "OrderDeliveryConfirmation" ("orderId")
      SELECT "orderId" FROM matching
      ON CONFLICT ("orderId") DO NOTHING
    )
    SELECT EXISTS (SELECT 1 FROM matching) AS matched
  `;
  revalidatePath("/mi-cuenta/pedidos");
  return result.matched
    ? { ok: true, message: "Confirmaste los datos de entrega." }
    : { message: "Los datos ya no coinciden. Revisa la entrega antes de confirmar." };
}
