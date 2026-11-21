"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export async function enableSelling() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/iniciar-sesion?intent=producer");

  const sellerRole = { userId: identity.userId, role: "PRODUCER" } as const;
  try {
    await prisma.userRole.upsert({
      where: { userId_role: sellerRole },
      create: sellerRole,
      update: {},
    });
  } catch {
    return { message: "No pudimos abrir tus ventas. Intenta de nuevo." };
  }

  revalidatePath("/mi-cuenta");
  redirect("/mi-cuenta/productos");
}
