import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaClient: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  const cachedClient = globalForPrisma.prisma ?? prismaClient;
  if (cachedClient) {
    return cachedClient;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL debe estar configurada.");
  }

  const client = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
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
