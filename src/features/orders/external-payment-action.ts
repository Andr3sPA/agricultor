"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type OrderDeliveryDetails } from "@/generated/prisma/client";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { isExternalPaymentAvailable, parseWompiPaymentLink } from "./external-payment";

type PaymentState = { message: string; ok?: boolean };

export async function saveExternalPayment(delivery: OrderDeliveryDetails, _previous: PaymentState, form: FormData): Promise<PaymentState> {
  const orderId = delivery.orderId;
  const actor = await getCurrentIdentity();
  if (!actor?.roles.includes("PRODUCER")) return { message: "Necesitas el perfil de vendedor." };
  if (!await isExternalPaymentAvailable()) return { message: "Esta opción todavía no está disponible." };
  const order = await prisma.order.findFirst({
    where: { id: orderId, producerId: actor.userId, status: "ACCEPTED" },
    select: { id: true, sellerContact: { select: { orderId: true } } },
  });
  if (!order) return { message: "No encontramos ese pedido aceptado en tu cuenta." };
  if (form.get("operation") === "remove") {
    await prisma.orderExternalPayment.deleteMany({ where: { orderId } });
    revalidatePath("/mi-cuenta/pedidos");
    return { ok: true, message: "Retiramos las instrucciones de pago." };
  }
  if (!order.sellerContact) return { message: "Comparte primero un WhatsApp para atender dudas sobre el pago." };
  const method = form.get("method");
  if (method !== "TRANSFER" && method !== "ON_DELIVERY" && method !== "WOMPI") {
    return { message: "Elige cómo se acordó pagar." };
  }
  const wompiUrl = method === "WOMPI" ? parseWompiPaymentLink(form.get("wompiUrl")) : null;
  if (method === "WOMPI" && (!wompiUrl || form.get("wompiChecked") !== "on")) {
    return { message: "Pega un enlace oficial de Wompi y confirma que corresponde a este pedido." };
  }
  try {
    const saved = await prisma.$executeRaw`
      WITH agreed AS (
        SELECT d."orderId"
        FROM "OrderDeliveryDetails" d
        JOIN "OrderDeliveryConfirmation" c ON c."orderId" = d."orderId"
        WHERE d."orderId" = ${orderId} AND d."method" = ${delivery.method}
          AND d."when" = ${delivery.when} AND d."place" = ${delivery.place}
          AND d."costCOP" = ${delivery.costCOP}
        FOR UPDATE OF d
      )
      INSERT INTO "OrderExternalPayment" ("orderId", "method", "wompiUrl")
      SELECT "orderId", ${method}, ${wompiUrl} FROM agreed
      ON CONFLICT ("orderId") DO UPDATE SET "method" = EXCLUDED."method", "wompiUrl" = EXCLUDED."wompiUrl"
    `;
    if (!saved) return { message: "Los datos de entrega cambiaron o aún no están confirmados." };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
    if (error.code === "P2010" && error.meta?.code === "23505") return { message: "Ese enlace ya está vinculado a otro pedido. Genera uno nuevo." };
    if (error.code === "P2010" && error.meta?.code === "23503") return { message: "La entrega cambió. Espera la confirmación del comprador." };
    throw error;
  }
  revalidatePath("/mi-cuenta/pedidos");
  return { ok: true, message: "Guardamos las instrucciones de pago." };
}
