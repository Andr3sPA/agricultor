import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import { getProducerDashboardSummary } from "./producer-dashboard";

type DashboardDatabase = Pick<PrismaClient, "product" | "order">;

function databaseWith(
  productCount: (args: { where: Record<string, unknown> }) => number,
  orderGroups: Array<{
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    _count: { _all: number };
  }>,
  onOrderQuery: (producerId: string) => void = () => {},
): DashboardDatabase {
  return {
    product: {
      count: async (args: { where: Record<string, unknown> }) =>
        productCount(args),
    },
    order: {
      groupBy: async (args: { where: { producerId: string } }) => {
        onOrderQuery(args.where.producerId);
        return orderGroups;
      },
    },
  } as unknown as DashboardDatabase;
}

describe("producer dashboard summary", () => {
  it("limits aggregate counts to the signed-in producer", async () => {
    const productFilters: Record<string, unknown>[] = [];
    const orderProducers: string[] = [];
    const database = databaseWith((args) => {
      productFilters.push(args.where);
      return args.where.isPublished === true
        ? 2
        : args.where.availableQuantity
          ? 1
          : 3;
    }, [], (producerId) => orderProducers.push(producerId));

    const summary = await getProducerDashboardSummary(
      { userId: "producer-1", roles: ["PRODUCER"] },
      database,
    );

    assert.ok(summary);
    assert.deepEqual(productFilters, [
      { ownerId: "producer-1" },
      { ownerId: "producer-1", isPublished: true },
      { ownerId: "producer-1", availableQuantity: { equals: 0 } },
    ]);
    assert.deepEqual(orderProducers, ["producer-1"]);
  });

  it("counts published, sold-out, and each producer-order status", async () => {
    const summary = await getProducerDashboardSummary(
      { userId: "producer-1", roles: ["PRODUCER"] },
      databaseWith(
        ({ where }) =>
          where.isPublished === true
            ? 2
            : where.availableQuantity
              ? 1
              : 3,
        [
          { status: "PENDING", _count: { _all: 4 } },
          { status: "ACCEPTED", _count: { _all: 2 } },
          { status: "REJECTED", _count: { _all: 1 } },
        ],
      ),
    );

    assert.deepEqual(summary, {
      products: { published: 2, soldOut: 1, total: 3 },
      orders: { PENDING: 4, ACCEPTED: 2, REJECTED: 1 },
      hasProducts: true,
      hasOrders: true,
    });
  });

  it("returns empty states when the producer has no products or orders", async () => {
    const summary = await getProducerDashboardSummary(
      { userId: "producer-1", roles: ["PRODUCER"] },
      databaseWith(() => 0, []),
    );

    assert.deepEqual(summary, {
      products: { published: 0, soldOut: 0, total: 0 },
      orders: { PENDING: 0, ACCEPTED: 0, REJECTED: 0 },
      hasProducts: false,
      hasOrders: false,
    });
  });

  it("does not query dashboard data for a non-producer", async () => {
    let queries = 0;
    const database = databaseWith(
      () => {
        queries += 1;
        return 0;
      },
      [],
      () => {
        queries += 1;
      },
    );

    const summary = await getProducerDashboardSummary(
      { userId: "buyer-1", roles: ["BUYER"] },
      database,
    );

    assert.equal(summary, null);
    assert.equal(queries, 0);
  });
});
