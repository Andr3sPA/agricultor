"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { canEditProduct, canManageProducts } from "./product-access";
import { validateProductInput, type ProductFieldErrors } from "./product-validation";

export type ProductFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: ProductFieldErrors;
};

function productData(data: {
  name: string;
  category: string;
  availableQuantity: string;
  unit: string;
  priceCOP: number;
  municipality: string;
}) {
  return {
    name: data.name,
    category: data.category,
    availableQuantity: new Prisma.Decimal(data.availableQuantity),
    unit: data.unit,
    priceCOP: data.priceCOP,
    municipality: data.municipality,
  };
}

function validationResult(formData: FormData) {
  return validateProductInput(Object.fromEntries(formData.entries()));
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { message: "Inicia sesión para gestionar tus productos." };
  }
  if (!canManageProducts(identity.roles)) {
    return { message: "Agrega el perfil de productor para gestionar productos." };
  }

  const result = validationResult(formData);
  if (!result.ok) {
    return { message: "Revisa los datos del producto.", fieldErrors: result.errors };
  }

  await prisma.product.create({
    data: {
      ownerId: identity.userId,
      ...productData(result.data),
    },
  });

  revalidatePath("/mi-cuenta");
  revalidatePath("/mi-cuenta/productos");
  return { ok: true, message: "Guardamos el producto en tu cuenta." };
}

export async function updateProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { message: "Inicia sesión para gestionar tus productos." };
  }
  if (!canManageProducts(identity.roles)) {
    return { message: "Agrega el perfil de productor para gestionar productos." };
  }

  const productId = formData.get("productId");
  if (typeof productId !== "string" || productId.length === 0) {
    return { message: "No encontramos ese producto en tu cuenta." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { ownerId: true },
  });

  if (!product || !canEditProduct(identity, product.ownerId)) {
    return { message: "No encontramos ese producto en tu cuenta." };
  }

  const result = validationResult(formData);
  if (!result.ok) {
    return { message: "Revisa los datos del producto.", fieldErrors: result.errors };
  }

  const updated = await prisma.product.updateMany({
    where: {
      id: productId,
      ownerId: identity.userId,
      reservedQuantity: {
        lte: new Prisma.Decimal("999999999.999").minus(
          result.data.availableQuantity,
        ),
      },
    },
    data: productData(result.data),
  });

  if (updated.count !== 1) {
    return {
      message:
        "No encontramos ese producto o la cantidad disponible más las reservas supera el inventario permitido.",
    };
  }

  revalidatePath("/mi-cuenta");
  revalidatePath("/mi-cuenta/productos");
  revalidatePath(`/mi-cuenta/productos/${productId}/editar`);
  return { ok: true, message: "Actualizamos el producto." };
}

export async function setProductPublication(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { message: "Inicia sesión para publicar tus productos." };
  }
  if (!canManageProducts(identity.roles)) {
    return { message: "Agrega el perfil de productor para publicar productos." };
  }

  const productId = formData.get("productId");
  const publishedValue = formData.get("isPublished");
  if (
    typeof productId !== "string" ||
    productId.length === 0 ||
    (publishedValue !== "true" && publishedValue !== "false")
  ) {
    return { message: "No pudimos actualizar la publicación del producto." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { ownerId: true },
  });
  if (!product || !canEditProduct(identity, product.ownerId)) {
    return { message: "No encontramos ese producto en tu cuenta." };
  }

  const isPublished = publishedValue === "true";
  const updated = await prisma.product.updateMany({
    where: {
      id: productId,
      ownerId: identity.userId,
      ...(isPublished ? { availableQuantity: { gt: 0 } } : {}),
    },
    data: { isPublished },
  });

  if (updated.count !== 1) {
    return {
      message:
        "No pudimos actualizar el producto. Verifica que sea tuyo y que tenga cantidad disponible para publicarlo.",
    };
  }

  revalidatePath("/mi-cuenta/productos");
  revalidatePath("/catalogo");
  return {
    ok: true,
    message: isPublished ? "Publicamos el producto." : "Retiramos el producto.",
  };
}
