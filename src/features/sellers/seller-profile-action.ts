"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { getSellerProfileHref, isSellerProfileAvailable } from "./seller-profile";

type ProfileState = { message: string; ok?: boolean };

export async function saveSellerProfile(_previous: ProfileState, form: FormData): Promise<ProfileState> {
  const identity = await getCurrentIdentity();
  if (!identity?.roles.includes("PRODUCER")) return { message: "Necesitas el perfil de vendedor." };
  if (!await isSellerProfileAvailable()) return { message: "Esta opción todavía no está disponible." };
  const fields = ["name", "description", "municipality"] as const;
  const values = Object.fromEntries(fields.map((field) => {
    const value = form.get(field);
    return [field, typeof value === "string" ? value.trim() : ""];
  })) as Record<(typeof fields)[number], string>;
  if (
    values.name.length < 2 || values.name.length > 80 ||
    values.municipality.length < 2 || values.municipality.length > 100 ||
    !values.description || values.description.length > 600 ||
    fields.some((field) => values[field].includes("\0"))
  ) {
    return { message: "Revisa el nombre, el municipio y la descripción." };
  }
  const data = { ...values, published: form.get("published") === "on" };
  const profile = await prisma.sellerProfile.upsert({
    where: { ownerId: identity.userId },
    create: { ownerId: identity.userId, ...data },
    update: data,
    select: { id: true },
  });
  revalidatePath("/mi-cuenta/perfil-vendedor");
  revalidatePath(getSellerProfileHref(profile.id));
  revalidatePath("/catalogo/[productId]", "page");
  return { ok: true, message: data.published ? "Tu perfil está publicado." : "Guardamos tu perfil como privado." };
}
