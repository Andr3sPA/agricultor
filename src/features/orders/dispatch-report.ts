import type { Prisma } from "@/generated/prisma/client";

function colombianMidnight(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const midnight = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== value) return null;
  return new Date(midnight.getTime() + 5 * 60 * 60 * 1000);
}

export function getDispatchDateFilter(from: string, through: string) {
  const first = colombianMidnight(from);
  const last = colombianMidnight(through);
  if ((from && !first) || (through && !last) || (first && last && first > last)) return null;
  return {
    ...(first ? { gte: first } : {}),
    ...(last ? { lt: new Date(last.getTime() + 86_400_000) } : {}),
  };
}

type DispatchOrder = {
  productName: string;
  unit: string;
  requestedQuantity: Prisma.Decimal;
};

export function dispatchGroupKey(productName: string, unit: string) {
  return JSON.stringify([productName, unit]);
}

export function groupDispatchOrders(orders: readonly DispatchOrder[]) {
  const groups = new Map<string, { productName: string; unit: string; quantity: Prisma.Decimal; count: number }>();
  for (const order of orders) {
    const key = dispatchGroupKey(order.productName, order.unit);
    const group = groups.get(key);
    if (group) {
      group.quantity = group.quantity.plus(order.requestedQuantity);
      group.count += 1;
    } else {
      groups.set(key, { productName: order.productName, unit: order.unit, quantity: order.requestedQuantity, count: 1 });
    }
  }
  return [...groups.values()]
    .sort((a, b) => a.productName.localeCompare(b.productName, "es-CO") || a.unit.localeCompare(b.unit));
}
