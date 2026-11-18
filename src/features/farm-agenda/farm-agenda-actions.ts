"use server";

import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { canManageFarmAgenda } from "./farm-agenda-access";
import {
  farmActivityData,
  removeFarmActivity,
  updateOwnedFarmActivity,
} from "./farm-agenda-service";
import {
  validateFarmActivityInput,
  type FarmActivityFieldErrors,
} from "./farm-agenda-validation";

export type FarmActivityFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: FarmActivityFieldErrors;
};

function validationResult(formData: FormData) {
  return validateFarmActivityInput(Object.fromEntries(formData.entries()));
}

export async function createFarmActivity(
  _previousState: FarmActivityFormState,
  formData: FormData,
): Promise<FarmActivityFormState> {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { message: "Inicia sesión para gestionar tu agenda." };
  }
  if (!canManageFarmAgenda(identity.roles)) {
    return { message: "Agrega el perfil de productor para gestionar tu agenda." };
  }

  const result = validationResult(formData);
  if (!result.ok) {
    return { message: "Revisa los datos de la actividad.", fieldErrors: result.errors };
  }

  await prisma.farmActivity.create({
    data: {
      userId: identity.userId,
      ...farmActivityData(result.data),
    },
  });

  revalidatePath("/mi-cuenta/agenda");
  revalidatePath("/mi-cuenta");
  return { ok: true, message: "Guardamos la actividad en tu agenda." };
}

export async function updateFarmActivity(
  _previousState: FarmActivityFormState,
  formData: FormData,
): Promise<FarmActivityFormState> {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { message: "Inicia sesión para gestionar tu agenda." };
  }
  if (!canManageFarmAgenda(identity.roles)) {
    return { message: "Agrega el perfil de productor para gestionar tu agenda." };
  }

  const activityId = formData.get("activityId");
  if (typeof activityId !== "string" || !activityId) {
    return { message: "No encontramos esa actividad en tu agenda." };
  }

  const result = validationResult(formData);
  if (!result.ok) {
    return { message: "Revisa los datos de la actividad.", fieldErrors: result.errors };
  }
  if (!(await updateOwnedFarmActivity(identity, activityId, result.data, prisma))) {
    return { message: "No encontramos esa actividad en tu agenda." };
  }

  revalidatePath("/mi-cuenta/agenda");
  revalidatePath(`/mi-cuenta/agenda/${encodeURIComponent(activityId)}/editar`);
  revalidatePath("/mi-cuenta");
  return { ok: true, message: "Guardamos los cambios en tu agenda." };
}

export async function deleteFarmActivity(
  _previousState: FarmActivityFormState,
  formData: FormData,
): Promise<FarmActivityFormState> {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { message: "Inicia sesión para gestionar tu agenda." };
  }
  if (!canManageFarmAgenda(identity.roles)) {
    return { message: "Agrega el perfil de productor para gestionar tu agenda." };
  }

  const activityId = formData.get("activityId");
  if (typeof activityId !== "string" || activityId.length === 0) {
    return { message: "No encontramos esa actividad en tu agenda." };
  }

  if (!(await removeFarmActivity(identity, activityId, prisma))) {
    return { message: "No encontramos esa actividad en tu agenda." };
  }

  revalidatePath("/mi-cuenta/agenda");
  revalidatePath("/mi-cuenta");
  return { ok: true, message: "Eliminamos la actividad de tu agenda." };
}
