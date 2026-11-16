import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaClient: PrismaClient | undefined;
let testPool: Pool | undefined;

function createTestAdapter(connectionString: string): PrismaPg {
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

  testPool ??= new Pool({ connectionString });
  return new PrismaPg(testPool);
}

export function getPrismaClient(): PrismaClient {
  const cachedClient = globalForPrisma.prisma ?? prismaClient;
  if (cachedClient) {
    return cachedClient;
  }

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  const databaseUrl = process.env.DATABASE_URL;
  if (!testDatabaseUrl && !databaseUrl) {
    throw new Error("DATABASE_URL debe estar configurada.");
  }

  const client = new PrismaClient({
    adapter: testDatabaseUrl
      ? createTestAdapter(testDatabaseUrl)
      : new PrismaNeon({ connectionString: databaseUrl! }),
  });
  prismaClient = client;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma: PrismaClient = new Proxy(PrismaClient.prototype, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
