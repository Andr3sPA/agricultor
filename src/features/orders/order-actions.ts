"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { decideOrder, requestOrder } from "./order-service";

export type OrderFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

function messageFor(code: string): string {
  switch (code) {
    case "unauthenticated":
      return "Inicia sesión para continuar.";
    case "unauthorized":
      return "Necesitas el perfil correspondiente para continuar.";
    case "invalid":
      return "Revisa los datos del pedido.";
    case "unavailable":
      return "El producto ya no tiene esa cantidad disponible o no está publicado.";
    case "not-found":
      return "No encontramos ese pedido en tu cuenta.";
    case "already-decided":
      return "Este pedido ya fue atendido.";
    default:
      return "No pudimos actualizar el pedido.";
  }
}

export async function requestOrderAction(
  _previousState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const identity = await getCurrentIdentity();
  const result = await requestOrder(
    identity,
    {
      productId: formData.get("productId"),
      quantity: formData.get("quantity"),
    },
    prisma,
  );

  if (!result.ok) {
    return {
      message: messageFor(result.code),
      fieldErrors: result.fieldErrors,
    };
  }

  revalidatePath("/catalogo");
  revalidatePath("/mi-cuenta/pedidos");
  return {
    ok: true,
    message: "Enviamos tu solicitud. La cantidad quedó reservada mientras el productor responde.",
  };
}

export async function decideOrderAction(
  _previousState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const identity = await getCurrentIdentity();
  const result = await decideOrder(
    identity,
    formData.get("orderId"),
    formData.get("decision"),
    prisma,
  );

  if (!result.ok) {
    return { message: messageFor(result.code) };
  }

  revalidatePath("/mi-cuenta/pedidos");
  revalidatePath("/catalogo");
  return {
    ok: true,
    message:
      formData.get("decision") === "ACCEPTED"
        ? "Aceptamos el pedido y confirmamos la salida de la cantidad reservada."
        : "Rechazamos el pedido y devolvimos la cantidad a disponibilidad.",
  };
}
