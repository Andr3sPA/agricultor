import type { PrismaClient } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { canManageProducts, type ProductActor } from "@/features/products/product-access";

type DashboardDatabase = Pick<PrismaClient, "product" | "order">;

export type ProducerDashboardSummary = {
  products: {
    published: number;
    soldOut: number;
    total: number;
  };
  orders: Record<OrderStatus, number>;
  hasProducts: boolean;
  hasOrders: boolean;
};

export async function getProducerDashboardSummary(
  actor: ProductActor,
  database: DashboardDatabase,
): Promise<ProducerDashboardSummary | null> {
  if (!canManageProducts(actor.roles)) {
    return null;
  }

  const [totalProducts, publishedProducts, soldOutProducts, orderGroups] =
    await Promise.all([
      database.product.count({
        where: { ownerId: actor.userId },
      }),
      database.product.count({
        where: { ownerId: actor.userId, isPublished: true },
      }),
      database.product.count({
        where: { ownerId: actor.userId, availableQuantity: { equals: 0 } },
      }),
      database.order.groupBy({
        by: ["status"],
        where: { producerId: actor.userId },
        _count: { _all: true },
      }),
    ]);

  const orders: Record<OrderStatus, number> = {
    PENDING: 0,
    ACCEPTED: 0,
    REJECTED: 0,
  };

  for (const group of orderGroups) {
    orders[group.status] = group._count._all;
  }

  return {
    products: {
      published: publishedProducts,
      soldOut: soldOutProducts,
      total: totalProducts,
    },
    orders,
    hasProducts: totalProducts > 0,
    hasOrders: Object.values(orders).some((count) => count > 0),
  };
}
