"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { addFavorite, removeFavorite } from "./favorite-service";

export type FavoriteFormState = {
  ok?: boolean;
  isFavorite?: boolean;
  message?: string;
};

export async function toggleFavoriteAction(
  _previousState: FavoriteFormState,
  formData: FormData,
): Promise<FavoriteFormState> {
  const identity = await getCurrentIdentity();
  const shouldRemove = formData.get("isFavorite") === "true";
  const result = shouldRemove
    ? await removeFavorite(identity, formData.get("productId"), prisma)
    : await addFavorite(identity, formData.get("productId"), prisma);

  if (!result.ok) {
    const message = {
      unauthenticated: "Inicia sesión para guardar productos favoritos.",
      unauthorized: "Agrega el perfil de comprador para guardar favoritos.",
      invalid: "Selecciona un producto válido.",
      unavailable: "Este producto ya no está publicado o disponible.",
    }[result.code];
    return { message };
  }

  revalidatePath("/catalogo");
  revalidatePath("/mi-cuenta");
  revalidatePath("/mi-cuenta/favoritos");
  return {
    ok: true,
    isFavorite: !shouldRemove,
    message: shouldRemove
      ? "Quitamos el producto de tus favoritos."
      : "Guardamos el producto en tus favoritos.",
  };
}
