import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { OrderActor } from "./order-policy";
import { decideOrder, requestOrder } from "./order-service";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const enabled = Boolean(testDatabaseUrl);

function assertDisposableLocalDatabase(connectionString: string): void {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (
    (url.protocol !== "postgres:" && url.protocol !== "postgresql:") ||
    !localHosts.has(url.hostname) ||
    !/^agricultor_test(?:_|$)/.test(databaseName)
  ) {
    throw new Error(
      "TEST_DATABASE_URL must point to a local disposable agricultor_test database.",
    );
  }
}

describe(
  "order persistence and inventory concurrency",
  { skip: enabled ? false : "Set TEST_DATABASE_URL to run against local PostgreSQL." },
  () => {
    let database: PrismaClient;
    let pool: Pool;
    let producer: OrderActor;
    let buyerOne: OrderActor;
    let buyerTwo: OrderActor;
    let reservedProductId: string;
    let contestedProductId: string;
    let fixtureUserIds: string[] = [];

    before(async () => {
      assertDisposableLocalDatabase(testDatabaseUrl!);
      pool = new Pool({ connectionString: testDatabaseUrl });
      database = new PrismaClient({ adapter: new PrismaPg(pool) });
      await database.$connect();

      const suffix = randomUUID();
      producer = { userId: `order-test-producer-${suffix}`, roles: ["PRODUCER"] };
      buyerOne = { userId: `order-test-buyer-one-${suffix}`, roles: ["BUYER"] };
      buyerTwo = { userId: `order-test-buyer-two-${suffix}`, roles: ["BUYER"] };
      fixtureUserIds = [producer.userId, buyerOne.userId, buyerTwo.userId];

      await database.user.createMany({
        data: fixtureUserIds.map((id) => ({
          id,
          name: "Prueba de integración",
          email: `${id}@example.test`,
        })),
      });
      await database.userRole.createMany({
        data: [
          { userId: producer.userId, role: "PRODUCER" },
          { userId: buyerOne.userId, role: "BUYER" },
          { userId: buyerTwo.userId, role: "BUYER" },
        ],
      });

      const productFields = {
        ownerId: producer.userId,
        name: "Producto de prueba",
        category: "OTHER",
        unit: "KG",
        priceCOP: 1000,
        municipality: "Local",
        isPublished: true,
      };
      const reservedProduct = await database.product.create({
        data: {
          ...productFields,
          availableQuantity: new Prisma.Decimal("5"),
        },
        select: { id: true },
      });
      const contestedProduct = await database.product.create({
        data: {
          ...productFields,
          name: "Última unidad",
          availableQuantity: new Prisma.Decimal("1"),
        },
        select: { id: true },
      });
      reservedProductId = reservedProduct.id;
      contestedProductId = contestedProduct.id;
    });

    after(async () => {
      if (database) {
        if (fixtureUserIds.length > 0) {
          await database.user.deleteMany({
            where: { id: { in: fixtureUserIds } },
          });
        }
        await database.$disconnect();
        await pool.end();
      }
    });

    it("persists a request, its history, and rejected stock release", async () => {
      const request = await requestOrder(
        buyerOne,
        { productId: reservedProductId, quantity: "2.5" },
        database,
      );
      assert.equal(request.ok, true);
      if (!request.ok) return;

      const pendingOrder = await database.order.findUniqueOrThrow({
        where: { id: request.orderId },
        include: { history: true },
      });
      assert.equal(pendingOrder.status, "PENDING");
      assert.equal(pendingOrder.history.length, 1);
      assert.ok(pendingOrder.requestedQuantity.equals("2.5"));

      const reserved = await database.product.findUniqueOrThrow({
        where: { id: reservedProductId },
      });
      assert.ok(reserved.availableQuantity.equals("2.5"));
      assert.ok(reserved.reservedQuantity.equals("2.5"));

      const decision = await decideOrder(
        producer,
        request.orderId,
        "REJECTED",
        database,
      );
      assert.equal(decision.ok, true);

      const rejectedOrder = await database.order.findUniqueOrThrow({
        where: { id: request.orderId },
        include: { history: true },
      });
      assert.equal(rejectedOrder.status, "REJECTED");
      assert.equal(rejectedOrder.history.length, 2);

      const restored = await database.product.findUniqueOrThrow({
        where: { id: reservedProductId },
      });
      assert.ok(restored.availableQuantity.equals("5"));
      assert.ok(restored.reservedQuantity.equals("0"));
    });

    it("allows only one concurrent request for the final unit", async () => {
      const requests = await Promise.all([
        requestOrder(
          buyerOne,
          { productId: contestedProductId, quantity: "1" },
          database,
        ),
        requestOrder(
          buyerTwo,
          { productId: contestedProductId, quantity: "1" },
          database,
        ),
      ]);
      const successful = requests.filter((request) => request.ok);

      assert.equal(successful.length, 1);
      assert.equal(
        requests.filter(
          (request) => !request.ok && request.code === "unavailable",
        ).length,
        1,
      );

      const product = await database.product.findUniqueOrThrow({
        where: { id: contestedProductId },
      });
      assert.ok(product.availableQuantity.equals("0"));
      assert.ok(product.reservedQuantity.equals("1"));

      const [request] = successful;
      if (request.ok) {
        const accepted = await decideOrder(
          producer,
          request.orderId,
          "ACCEPTED",
          database,
        );
        assert.equal(accepted.ok, true);
        const acceptedInventory = await database.product.findUniqueOrThrow({
          where: { id: contestedProductId },
        });
        assert.ok(acceptedInventory.availableQuantity.equals("0"));
        assert.ok(acceptedInventory.reservedQuantity.equals("0"));
      }
    });
  },
);
