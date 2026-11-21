"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { isOrderDeliveryAvailable } from "./order-delivery";

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
