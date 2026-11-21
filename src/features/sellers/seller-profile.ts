import { prisma } from "@/lib/db";

export async function isSellerProfileAvailable() {
  const [schema] = await prisma.$queryRaw<{ available: boolean }[]>`
    SELECT to_regclass('"SellerProfile"') IS NOT NULL AS available
  `;
  return schema.available;
}

export function getSellerProfileHref(id: string) {
  return `/vendedores/${encodeURIComponent(id)}`;
}
