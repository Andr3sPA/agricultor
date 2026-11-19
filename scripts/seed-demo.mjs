import { pathToFileURL } from "node:url";
import { Pool } from "pg";

const demoProducer = {
  id: "demo-productor-seguro",
  name: "Productor de demostración (sin acceso)",
  email: "productor-demo@example.invalid",
};

const demoProducts = [
  {
    id: "demo-maiz-amarillo",
    name: "DEMO - Maíz amarillo",
    category: "GRAINS",
    availableQuantity: "250.000",
    unit: "KG",
    priceCOP: 3200,
    municipality: "La Mesa",
  },
  {
    id: "demo-platano",
    name: "DEMO - Plátano hartón",
    category: "FRUITS",
    availableQuantity: "120.000",
    unit: "KG",
    priceCOP: 2800,
    municipality: "Fusagasugá",
  },
  {
    id: "demo-yuca",
    name: "DEMO - Yuca fresca",
    category: "TUBERS",
    availableQuantity: "80.000",
    unit: "KG",
    priceCOP: 2400,
    municipality: "Villeta",
  },
];

export function getSafeLocalDatabaseConfig(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  let databaseName;
  try {
    databaseName = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new Error("TEST_DATABASE_URL must name a local disposable database.");
  }

  const port = url.port ? Number(url.port) : 5432;
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !localHosts.has(url.hostname) ||
    !/^agricultor_test(?:_|$)/.test(databaseName) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      "TEST_DATABASE_URL must point to a local disposable agricultor_test database.",
    );
  }

  return {
    host: url.hostname.replace(/^\[|\]$/g, ""),
    port,
    database: databaseName,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: false,
  };
}

export function requireTestDatabaseUrl(environment = process.env) {
  const connectionString = environment.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Set TEST_DATABASE_URL to a local disposable agricultor_test database; DATABASE_URL is never used.",
    );
  }
  return connectionString;
}

export async function seedDemoData(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await client.query(
      `INSERT INTO "User" ("id", "name", "email", "updatedAt")
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT ("id") DO NOTHING
       RETURNING "id"`,
      [demoProducer.id, demoProducer.name, demoProducer.email],
    );
    if (user.rowCount === 0) {
      const existingUser = await client.query(
        `SELECT "name", "email" FROM "User" WHERE "id" = $1`,
        [demoProducer.id],
      );
      if (
        existingUser.rows[0]?.name !== demoProducer.name ||
        existingUser.rows[0]?.email !== demoProducer.email
      ) {
        throw new Error("The reserved demo producer id is already in use.");
      }
    }

    await client.query(
      `INSERT INTO "UserRole" ("userId", "role")
       VALUES ($1, 'PRODUCER')
       ON CONFLICT ("userId", "role") DO NOTHING`,
      [demoProducer.id],
    );

    for (const product of demoProducts) {
      const result = await client.query(
        `INSERT INTO "Product"
           ("id", "ownerId", "name", "category", "availableQuantity",
            "reservedQuantity", "unit", "priceCOP", "municipality",
            "isPublished", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, TRUE, CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO NOTHING
         RETURNING "id"`,
        [
          product.id,
          demoProducer.id,
          product.name,
          product.category,
          product.availableQuantity,
          product.unit,
          product.priceCOP,
          product.municipality,
        ],
      );
      if (result.rowCount === 0) {
        const existingProduct = await client.query(
          `SELECT "ownerId" FROM "Product" WHERE "id" = $1`,
          [product.id],
        );
        if (existingProduct.rows[0]?.ownerId !== demoProducer.id) {
          throw new Error(
            `The reserved demo product id ${product.id} is already in use.`,
          );
        }
      }
    }

    await client.query("COMMIT");
    return demoProducts.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const connectionString = requireTestDatabaseUrl();
  const pool = new Pool(getSafeLocalDatabaseConfig(connectionString));
  try {
    const count = await seedDemoData(pool);
    console.log(`Seeded ${count} demo products in the local test database.`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}
