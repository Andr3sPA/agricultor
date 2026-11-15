"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { isSelfAssignableRole } from "@/lib/auth/roles";

export type RoleActionState = {
  ok?: boolean;
  message?: string;
};

export async function adoptRole(
  _previousState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const identity = await getCurrentIdentity();

  if (!identity) {
    return { message: "Inicia sesión para agregar un perfil." };
  }

  const role = formData.get("role");
  if (!isSelfAssignableRole(role)) {
    return { message: "Ese perfil no se puede agregar desde este formulario." };
  }

  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId: identity.userId,
        role,
      },
    },
    create: {
      userId: identity.userId,
      role,
    },
    update: {},
  });

  revalidatePath("/mi-cuenta");
  return { ok: true, message: "Listo, agregamos ese perfil a tu cuenta." };
}
