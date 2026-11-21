"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { isOrderSellerContactAvailable } from "./order-seller-contact";

export async function saveOrderSellerContact(
  orderId: string,
  _previous: { message: string; ok?: boolean },
  formData: FormData,
): Promise<{ message: string; ok?: boolean }> {
  const actor = await getCurrentIdentity();
  if (!actor?.roles.includes("PRODUCER")) return { message: "Necesitas el perfil de vendedor." };
  const order = await prisma.order.findFirst({
    where: { id: orderId, producerId: actor.userId, status: "ACCEPTED" },
    select: { id: true },
  });
  if (!order) return { message: "No encontramos ese pedido aceptado en tu cuenta." };
  if (!await isOrderSellerContactAvailable()) return { message: "Esta opción todavía no está disponible." };

  if (formData.get("operacion") === "retirar") {
    await prisma.orderSellerContact.deleteMany({ where: { orderId: order.id } });
    revalidatePath("/mi-cuenta/pedidos");
    return { ok: true, message: "Retiramos el número compartido." };
  }
  const raw = formData.get("whatsapp");
  const normalized = typeof raw === "string" ? raw.trim().replace(/[ ()-]/g, "") : "";
  const number = normalized.replace(/^\+?57(?=3\d{9}$)/, "");
  if (!/^3\d{9}$/.test(number)) return { message: "Escribe un celular colombiano de 10 dígitos." };

  const whatsapp = `57${number}`;
  await prisma.orderSellerContact.upsert({
    where: { orderId: order.id },
    create: { orderId: order.id, whatsapp },
    update: { whatsapp },
  });
  revalidatePath("/mi-cuenta/pedidos");
  return { ok: true, message: "Compartimos el WhatsApp con el comprador de este pedido." };
}
