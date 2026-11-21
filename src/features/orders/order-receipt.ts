import { prisma } from "@/lib/db";

export async function isOrderReceiptAvailable() {
  const [schema] = await prisma.$queryRaw<{ available: boolean }[]>`
    SELECT to_regclass('"OrderReceipt"') IS NOT NULL AS available
  `;
  return schema.available;
}
