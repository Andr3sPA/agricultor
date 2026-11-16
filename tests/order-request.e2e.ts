import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  chromium,
  request as playwrightRequest,
  type APIRequestContext,
  type Browser,
  type Request,
} from "@playwright/test";
import { Pool } from "pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

function assertDisposableDatabase(connectionString: string): void {
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

async function getFreePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not allocate a local port for the E2E server.");
  }
  server.close();
  await once(server, "close");
  return address.port;
}

async function startServer(
  port: number,
  databaseUrl: string,
): Promise<ChildProcess> {
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: {
        ...process.env,
        AUTH_SECRET:
          process.env.AUTH_SECRET ?? randomBytes(32).toString("base64url"),
        DATABASE_URL: databaseUrl,
        NODE_ENV: "production",
        TEST_DATABASE_URL: databaseUrl,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  server.stdout?.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  server.stderr?.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });

  const baseUrl = `http://localhost:${port}`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`The E2E server exited before starting:\n${output}`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return server;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  server.kill();
  throw new Error(`The E2E server did not start in time:\n${output}`);
}

async function stopServer(server: ChildProcess): Promise<void> {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
}

async function main(): Promise<void> {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "Set TEST_DATABASE_URL to run the E2E test against disposable PostgreSQL.",
    );
  }
  assertDisposableDatabase(databaseUrl);

  const pool = new Pool({ connectionString: databaseUrl });
  const database = new PrismaClient({ adapter: new PrismaPg(pool) });
  let browser: Browser | undefined;
  let server: ChildProcess | undefined;
  let producerApi: APIRequestContext | undefined;
  const fixtureUserIds: string[] = [];

  try {
    await database.$connect();
    const suffix = randomUUID();
    const port = await getFreePort();
    server = await startServer(port, databaseUrl);
    const baseURL = `http://localhost:${port}`;
    producerApi = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
        Referer: `${baseURL}/crear-cuenta`,
      },
    });
    const producerEmail = `order-e2e-producer-${suffix}@example.test`;
    const producerPassword = `E2e-${randomUUID()}-pass`;
    const producerSignup = await producerApi.post("/api/auth/sign-up/email", {
      data: {
        name: "Productor de prueba E2E",
        email: producerEmail,
        password: producerPassword,
      },
    });
    assert.equal(
      producerSignup.ok(),
      true,
      `Producer signup failed: ${await producerSignup.text()}`,
    );
    const producerSignin = await producerApi.post("/api/auth/sign-in/email", {
      data: { email: producerEmail, password: producerPassword },
    });
    assert.equal(
      producerSignin.ok(),
      true,
      `Producer signin failed: ${await producerSignin.text()}`,
    );
    const producer = await database.user.findUniqueOrThrow({
      where: { email: producerEmail },
      select: { id: true },
    });
    fixtureUserIds.push(producer.id);
    await database.userRole.create({
      data: { userId: producer.id, role: "PRODUCER" },
    });

    const product = await database.product.create({
      data: {
        ownerId: producer.id,
        name: `Producto E2E ${suffix}`,
        category: "OTHER",
        availableQuantity: new Prisma.Decimal("5"),
        unit: "KG",
        priceCOP: 1000,
        municipality: "Local",
        isPublished: true,
      },
      select: { id: true, name: true },
    });
    const email = `order-e2e-buyer-${suffix}@example.test`;
    const password = `E2e-${randomUUID()}-pass`;
    const api = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
        Referer: `${baseURL}/iniciar-sesion`,
      },
    });

    try {
      const signup = await api.post("/api/auth/sign-up/email", {
        data: { name: "Comprador E2E", email, password },
      });
      assert.equal(signup.ok(), true, `Signup failed: ${await signup.text()}`);

      const buyer = await database.user.findUniqueOrThrow({
        where: { email },
        select: { id: true },
      });
      fixtureUserIds.push(buyer.id);

      const signin = await api.post("/api/auth/sign-in/email", {
        data: { email, password },
      });
      assert.equal(signin.ok(), true, `Signin failed: ${await signin.text()}`);

      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        storageState: await api.storageState(),
      });
      const page = await context.newPage();
      await page.goto(`${baseURL}/catalogo/${product.id}/pedido`);
      await page.getByRole("heading", { name: product.name }).waitFor();

      const form = page.locator("form");
      const idempotencyKey = await form
        .locator('input[name="idempotencyKey"]')
        .inputValue();
      assert.match(idempotencyKey, /^[A-Za-z0-9_-]{43}$/);
      await page.getByLabel("Cantidad que solicitas").fill("2");

      const isServerAction = (request: Request) =>
        request.method() === "POST" && Boolean(request.headers()["next-action"]);
      const firstAction = page.waitForRequest(isServerAction);
      await page.getByRole("button", { name: "Solicitar producto" }).click();
      const firstRequest = await firstAction;
      assert.ok(firstRequest.postData()?.includes(idempotencyKey));
      await page
        .getByRole("status")
        .getByText("Enviamos tu solicitud.")
        .waitFor();
      const firstResponse = await firstRequest.response();
      assert.equal(firstResponse?.status(), 200);

      const firstOrder = await database.order.findFirstOrThrow({
        where: { buyerId: buyer.id, productId: product.id },
        include: { history: true },
      });
      assert.equal(firstOrder.history.length, 1);
      assert.ok(firstOrder.requestedQuantity.equals("2"));

      const firstInventory = await database.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      assert.ok(firstInventory.availableQuantity.equals("3"));
      assert.ok(firstInventory.reservedQuantity.equals("2"));

      const requestBody = firstRequest.postDataBuffer();
      assert.ok(requestBody);
      const firstRequestHeaders = await firstRequest.allHeaders();
      const replayHeaders = Object.fromEntries(
        Object.entries(firstRequestHeaders).filter(([name]) =>
          [
            "accept",
            "content-type",
            "next-action",
            "next-router-state-tree",
            "next-url",
            "origin",
            "referer",
            "rsc",
          ].includes(name),
        ),
      );
      const replayResponse = await api.post(firstRequest.url(), {
        data: requestBody,
        headers: replayHeaders,
      });
      assert.equal(replayResponse?.status(), 200);
      assert.match(await replayResponse.text(), /Enviamos tu solicitud\./);

      assert.equal(
        await database.order.count({
          where: { buyerId: buyer.id, productId: product.id },
        }),
        1,
      );
      const replayedOrder = await database.order.findFirstOrThrow({
        where: { buyerId: buyer.id, productId: product.id },
        include: { history: true },
      });
      assert.equal(replayedOrder.id, firstOrder.id);
      assert.equal(replayedOrder.producerId, producer.id);
      assert.equal(replayedOrder.history.length, 1);
      const replayedInventory = await database.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      assert.ok(replayedInventory.availableQuantity.equals("3"));
      assert.ok(replayedInventory.reservedQuantity.equals("2"));

      await page.goto(`${baseURL}/mi-cuenta/pedidos`);
      await page
        .getByText("El productor debe revisar la solicitud.")
        .waitFor();
      await page.getByText("Esperando respuesta").waitFor();

      const producerContext = await browser.newContext({
        storageState: await producerApi.storageState(),
      });
      const producerPage = await producerContext.newPage();
      await producerPage.goto(`${baseURL}/mi-cuenta/pedidos`);
      await producerPage
        .getByRole("heading", { name: "Solicitudes recibidas" })
        .waitFor();
      await producerPage
        .getByRole("button", { name: "Aceptar pedido" })
        .click();
      await producerPage
        .getByRole("list", { name: "Seguimiento del pedido" })
        .getByText("Aceptado")
        .waitFor();
      const acceptedOrder = await database.order.findFirstOrThrow({
        where: { buyerId: buyer.id, productId: product.id },
        include: { history: true },
      });
      assert.equal(acceptedOrder.status, "ACCEPTED");
      assert.equal(acceptedOrder.history.length, 2);

      await page.goto(`${baseURL}/mi-cuenta/pedidos`);
      await page.getByText("Agricultor registra la aceptación").waitFor();
      await page
        .getByRole("list", { name: "Seguimiento del pedido" })
        .getByText("Aceptado")
        .waitFor();
      await producerContext.close();
      await context.close();
    } finally {
      await api.dispose();
    }
  } finally {
    await browser?.close();
    await producerApi?.dispose();
    if (server) await stopServer(server);
    if (fixtureUserIds.length > 0) {
      await database.user.deleteMany({
        where: { id: { in: fixtureUserIds } },
      });
    }
    await database.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
