"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import type { OrderDeliveryDetails } from "@/generated/prisma/client";
import { isOrderReceiptAvailable } from "./order-receipt";

type State = { message: string };

export async function markOrderReceived(delivery: OrderDeliveryDetails): Promise<State> {
  const actor = await getCurrentIdentity();
  if (!actor?.roles.includes("BUYER")) return { message: "Necesitas el perfil de comprador." };
  if (!await isOrderReceiptAvailable()) return { message: "Esta opción todavía no está disponible." };

  const [result] = await prisma.$queryRaw<{ eligible: boolean }[]>`
    WITH eligible AS (
      SELECT o."id" FROM "Order" o
        JOIN "OrderDeliveryDetails" d ON d."orderId" = o."id"
        JOIN "OrderDeliveryConfirmation" c ON c."orderId" = o."id"
      WHERE o."id" = ${delivery.orderId} AND o."buyerId" = ${actor.userId} AND o."status" = 'ACCEPTED'
        AND d."method" = ${delivery.method} AND d."when" = ${delivery.when}
        AND d."place" = ${delivery.place} AND d."costCOP" = ${delivery.costCOP}
      FOR UPDATE OF d
    ), receipt AS (
      INSERT INTO "OrderReceipt" ("orderId") SELECT "id" FROM eligible
      ON CONFLICT ("orderId") DO NOTHING
    )
    SELECT EXISTS (SELECT 1 FROM eligible) AS eligible
  `;
  revalidatePath("/mi-cuenta/pedidos");
  return { message: result.eligible ? "" : "Revisa y confirma los datos de entrega antes de marcar el pedido como recibido." };
}

export async function rateReceivedOrder(orderId: string, _state: State, form: FormData): Promise<State> {
  const actor = await getCurrentIdentity();
  if (!actor?.roles.includes("BUYER")) return { message: "Necesitas el perfil de comprador." };
  if (!await isOrderReceiptAvailable()) return { message: "Esta opción todavía no está disponible." };
  const raw = form.get("rating");
  if (typeof raw !== "string" || !/^[1-5]$/.test(raw)) return { message: "Elige una calificación de 1 a 5." };

  const rating = await prisma.orderReceipt.updateMany({
    where: { orderId, rating: null, order: { buyerId: actor.userId, status: "ACCEPTED" } },
    data: { rating: Number(raw) },
  });
  revalidatePath("/mi-cuenta/pedidos");
  if (rating.count !== 1) return { message: "El pedido todavía no está recibido o ya tiene una calificación." };
  revalidatePath("/vendedores/[sellerId]", "page");
  return { message: "" };
}
