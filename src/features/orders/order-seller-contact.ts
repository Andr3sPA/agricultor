import { prisma } from "@/lib/db";

export async function isOrderSellerContactAvailable() {
  const [schema] = await prisma.$queryRaw<{ available: boolean }[]>`
    SELECT to_regclass('"OrderSellerContact"') IS NOT NULL AS available
  `;
  return schema.available;
}
