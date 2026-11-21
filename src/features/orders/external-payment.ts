import { prisma } from "@/lib/db";

export const paymentLabels = {
  TRANSFER: "Transferencia directa",
  ON_DELIVERY: "Pago contra entrega",
  WOMPI: "Enlace Wompi",
} as const;

export function parseWompiPaymentLink(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const link = value.trim();
  return /^https:\/\/checkout\.wompi\.co\/l\/[A-Za-z0-9_-]{1,200}$/.test(link) ? link : null;
}

export async function isExternalPaymentAvailable() {
  const [schema] = await prisma.$queryRaw<{ available: boolean }[]>`
    SELECT to_regclass('"OrderExternalPayment"') IS NOT NULL AS available
  `;
  return schema.available;
}
