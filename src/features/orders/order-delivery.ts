import { prisma } from "@/lib/db";

export async function isOrderDeliveryAvailable() {
  const [schema] = await prisma.$queryRaw<{ available: boolean }[]>`
    SELECT to_regclass('"OrderDeliveryDetails"') IS NOT NULL AS available
  `;
  return schema.available;
}

export async function isDeliveryConfirmationAvailable() {
  const [schema] = await prisma.$queryRaw<{ available: boolean }[]>`
    SELECT to_regclass('"OrderDeliveryConfirmation"') IS NOT NULL AS available
  `;
  return schema.available;
}
