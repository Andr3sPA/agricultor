import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "node:net";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  chromium,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Browser,
  type Request,
} from "@playwright/test";
import { Pool } from "pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { getColombianAgendaDate } from "@/features/farm-agenda/farm-agenda-service";

type CapturedResetEmail = {
  to: { email: string }[];
  textContent: string;
};

const E2E_BREVO_API_KEY = "local-e2e-brevo-key";

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

function isCapturedResetEmail(value: unknown): value is CapturedResetEmail {
  return (
    typeof value === "object" &&
    value !== null &&
    "to" in value &&
    Array.isArray(value.to) &&
    value.to.every(
      (recipient) =>
        typeof recipient === "object" &&
        recipient !== null &&
        "email" in recipient &&
        typeof recipient.email === "string",
    ) &&
    "textContent" in value &&
    typeof value.textContent === "string"
  );
}

async function startBrevoStub() {
  const messages: CapturedResetEmail[] = [];
  const server = createHttpServer((request, response) => {
    if (
      request.method !== "POST" ||
      request.url !== "/v3/smtp/email" ||
      request.headers["api-key"] !== E2E_BREVO_API_KEY
    ) {
      response.writeHead(404).end();
      return;
    }

    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      let payload: unknown;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString());
      } catch {
        response.writeHead(400).end();
        return;
      }

      if (!isCapturedResetEmail(payload)) {
        response.writeHead(400).end();
        return;
      }

      messages.push(payload);
      response
        .writeHead(201, { "content-type": "application/json" })
        .end(JSON.stringify({ messageId: "local-e2e-message" }));
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not start the local Brevo E2E stub.");
  }

  return {
    apiUrl: `http://127.0.0.1:${address.port}/v3/smtp/email`,
    messages,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function waitForResetEmail(
  messages: CapturedResetEmail[],
  email: string,
): Promise<CapturedResetEmail> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const message = messages.find((candidate) =>
      candidate.to.some((recipient) => recipient.email === email),
    );
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("The local Brevo E2E stub did not capture the reset email.");
}

async function startServer(
  port: number,
  databaseUrl: string,
  brevoApiUrl: string,
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
        TZ: "UTC",
        TEST_DATABASE_URL: databaseUrl,
        AUTH_E2E_BASE_URL: `http://localhost:${port}`,
        API_KEY_BREVO: E2E_BREVO_API_KEY,
        BREVO_SENDER_EMAIL: "no-reply@example.test",
        BREVO_TEST_API_URL: brevoApiUrl,
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
  let brevoStub: Awaited<ReturnType<typeof startBrevoStub>> | undefined;
  const fixtureUserIds: string[] = [];

  try {
    await database.$connect();
    const suffix = randomUUID();
    const port = await getFreePort();
    brevoStub = await startBrevoStub();
    server = await startServer(port, databaseUrl, brevoStub.apiUrl);
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

    const municipality = `Municipio E2E ${suffix}`;
    const catalogProduct = {
      ownerId: producer.id,
      category: "OTHER",
      availableQuantity: new Prisma.Decimal("5"),
      unit: "KG",
      priceCOP: 1000,
      municipality,
      isPublished: true,
      updatedAt: new Date(),
    } as const;
    const product = await database.product.create({
      data: {
        ...catalogProduct,
        id: `${suffix}-last`,
        name: `Producto E2E ${suffix}`,
      },
      select: { id: true, name: true },
    });
    await database.product.createMany({
      data: Array.from({ length: 12 }, (_, index) => ({
        ...catalogProduct,
        id: `${suffix}-${index}`,
        name: `Oferta E2E ${index}`,
      })),
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

      const resetRequest = await api.post(
        "/api/auth/request-password-reset",
        {
          data: {
            email,
            redirectTo: `${baseURL}/restablecer-contrasena`,
          },
        },
      );
      assert.equal(
        resetRequest.ok(),
        true,
        `Password reset request failed: ${await resetRequest.text()}`,
      );
      const resetEmail = await waitForResetEmail(brevoStub.messages, email);
      const resetUrl = resetEmail.textContent.match(/https?:\/\/\S+/)?.[0];
      assert.ok(resetUrl, "The local reset email did not contain a link.");

      const localResetUrl = new URL(resetUrl);
      assert.ok(
        ["localhost", "127.0.0.1"].includes(localResetUrl.hostname),
        "The reset email did not contain a local E2E link.",
      );
      assert.equal(
        localResetUrl.protocol,
        "http:",
        "Local E2E reset links must use HTTP.",
      );

      const newPassword = `Reset-${randomUUID()}-pass`;
      browser = await chromium.launch({ headless: true });
      const anonymousContext = await browser.newContext();
      const anonymousPage = await anonymousContext.newPage();
      const catalogQuery = new URLSearchParams({
        producto: "e2e",
        categoria: "OTHER",
        municipio: municipality,
      });
      await anonymousPage.goto(`${baseURL}/catalogo?${catalogQuery}`);
      const resultCount = anonymousPage.getByRole("status").filter({
        hasText: "13 ofertas encontradas",
      });
      await expect(resultCount).toBeVisible();
      await anonymousPage.getByRole("link", { name: "Siguiente" }).click();
      catalogQuery.set("pagina", "2");
      const catalogUrl = `${baseURL}/catalogo?${catalogQuery}`;
      const orderContextUrl = `${baseURL}/catalogo/${product.id}/pedido?${catalogQuery}`;
      await anonymousPage.waitForURL(catalogUrl);
      await expect(resultCount).toBeVisible();
      const productLink = anonymousPage.getByRole("link", {
        name: product.name,
        exact: true,
      });
      await productLink.click();
      await anonymousPage.waitForURL(
        `${baseURL}/catalogo/${product.id}?${catalogQuery}`,
      );
      await anonymousPage
        .getByRole("link", { name: "Volver al catálogo" })
        .click();
      await anonymousPage.waitForURL(catalogUrl);
      await productLink.waitFor();
      await anonymousPage.getByRole("link", {
        name: `Solicitar este producto: ${product.name}`,
      }).click();
      await anonymousPage.waitForURL(orderContextUrl);
      await anonymousPage.getByRole("link", { name: "Volver al catálogo" }).click();
      await anonymousPage.waitForURL(catalogUrl);
      catalogQuery.set("orden", "precio-asc");
      await anonymousPage.goto(`${baseURL}/catalogo?${catalogQuery}`);
      const resetFilters = anonymousPage.getByRole("link", {
        name: "Restablecer filtros y orden",
      });
      await resetFilters.click();
      await anonymousPage.waitForURL(`${baseURL}/catalogo`);
      await expect(anonymousPage.getByLabel("Categoría")).toHaveValue("");
      await expect(anonymousPage.getByLabel("Nombre del producto")).toHaveValue("");
      await expect(anonymousPage.getByLabel("Municipio")).toHaveValue("");
      await expect(anonymousPage.getByLabel("Ordenar por")).toHaveValue("");
      await expect(resetFilters).toHaveCount(0);
      for (const path of ["/mi-cuenta", "/mi-cuenta/pedidos"]) {
        await anonymousPage.goto(`${baseURL}${path}`);
        assert.equal(
          new URL(anonymousPage.url()).pathname,
          "/iniciar-sesion",
          `${path} should require a session.`,
        );
      }
      await anonymousContext.close();
      const producerContext = await browser.newContext({
        storageState: await producerApi.storageState(),
      });
      const producerPage = await producerContext.newPage();
      await producerPage.setViewportSize({ width: 320, height: 640 });
      await producerPage.goto(`${baseURL}/mi-cuenta`);
      await producerPage.getByRole("link", { name: "Abrir conversor" }).click();
      await producerPage.getByLabel("Cantidad", { exact: true }).fill("10");
      await producerPage.getByLabel("Precio por kilo en pesos").fill("2.000");
      await producerPage.getByRole("button", { name: "Convertir unidades" }).click();
      const conversionResult = producerPage.getByRole("region", { name: "Resultado" });
      await expect(conversionResult).toContainText("10 Libras de 500 g = 5 Kilogramos (kg)");
      await expect(conversionResult).toContainText(/10\.000 COP/);
      await producerPage.getByRole("button", { name: "Intercambiar unidades" }).click();
      await expect(producerPage.getByLabel("Precio por libra de 500 g en pesos"))
        .toHaveValue("");
      await expect(conversionResult).toHaveCount(0);
      await producerPage.getByLabel("Cantidad", { exact: true }).fill("25");
      await producerPage.getByLabel("Convertir a", { exact: true })
        .selectOption({ label: "Arrobas de 12,5 kg" });
      await producerPage.getByLabel("Precio por arroba de 12,5 kg en pesos")
        .fill("32.000");
      await producerPage.getByRole("button", { name: "Convertir unidades" }).click();
      await expect(conversionResult).toContainText("25 Kilogramos (kg) = 2 Arrobas de 12,5 kg");
      await expect(conversionResult).toContainText(/64\.000 COP/);
      await producerPage.getByLabel("Convertir desde", { exact: true }).selectOption("bulto");
      await producerPage.getByLabel("Cantidad de bultos").fill("3");
      const bagWeight = producerPage.getByLabel("Peso de cada bulto en kilos");
      await producerPage.getByRole("button", { name: "Convertir unidades" }).click();
      await expect(bagWeight).toHaveAttribute("aria-invalid", "true");
      await bagWeight.fill("25,5");
      await producerPage.getByLabel("Precio por kilo en pesos").fill("2.000");
      await producerPage.getByRole("button", { name: "Convertir unidades" }).click();
      await expect(conversionResult).toContainText("3 bultos = 76,5 Kilogramos (kg)");
      await expect(conversionResult).toContainText(/153\.000 COP/);
      await producerPage.goto(`${baseURL}/mi-cuenta`);
      await producerPage.getByRole("link", { name: "Calcular costos y margen" }).click();
      await producerPage.getByLabel("Cantidad de producción").fill("2,5");
      await producerPage.getByLabel("Semillas", { exact: true }).fill("1.250,50");
      await producerPage.getByRole("button", { name: "Calcular costos y margen" }).click();
      const costResult = producerPage.getByRole("region", { name: "Resultado estimado" });
      await expect(costResult).toContainText(/Costo por unidad\s*\$\s*500,2/);
      await expect(costResult).toContainText(/Precio por unidad para cubrir tus costos\s*\$\s*501/);
      await expect(costResult.getByText("Ingreso esperado", { exact: true })).toHaveCount(0);
      await producerPage.getByLabel("Precio de venta por unidad").fill("$2.000");
      await expect(costResult).toContainText(/Ingreso esperado\s*\$\s*5\.000/);
      await expect(costResult).toContainText(/Ganancia o pérdida\s*\$\s*3\.749,5/);
      await producerPage.goto(`${baseURL}/mi-cuenta/productos`);
      const harvestName = `Papa E2E ${suffix}`;
      const harvestMunicipality = `Municipio para papa ${suffix}`;
      const cropName = producerPage.getByLabel("Nombre del producto");
      const cropCategory = producerPage.getByLabel("Categoría", { exact: true });
      const cropQuantity = producerPage.getByLabel("Cantidad disponible");
      const cropUnit = producerPage.getByLabel("Unidad de medida");
      const cropPrice = producerPage.getByLabel("Precio en pesos por unidad");
      const cropMunicipality = producerPage.getByLabel("Municipio o localidad");
      await cropName.fill(harvestName);
      await cropCategory.selectOption("TUBERS");
      await cropQuantity.fill("12,5");
      await cropUnit.selectOption("KG");
      await cropPrice.fill("2.00");
      await cropMunicipality.fill(harvestMunicipality);
      const addProduct = producerPage.getByRole("button", { name: "Agregar producto" });
      await addProduct.click();
      await expect(cropPrice).toHaveAttribute("aria-invalid", "true");
      await expect(cropName).toHaveValue(harvestName);
      await expect(cropCategory).toHaveValue("TUBERS");
      await expect(cropQuantity).toHaveValue("12,5");
      await expect(cropUnit).toHaveValue("KG");
      await expect(cropMunicipality).toHaveValue(harvestMunicipality);
      await cropPrice.fill("$2.000");
      await addProduct.click();
      const savedCrop = producerPage.getByRole("listitem").filter({ hasText: harvestName });
      const publicationShortcut = producerPage.getByRole("link", {
        name: "Ir al producto guardado para publicarlo",
      });
      await expect(publicationShortcut).toBeVisible();
      await publicationShortcut.click();
      await expect(savedCrop.getByText("Privado", { exact: true })).toBeVisible();
      const publicCatalog = await browser.newPage();
      const harvestCatalogUrl = `${baseURL}/catalogo?${new URLSearchParams({
        municipio: harvestMunicipality,
      })}`;
      await publicCatalog.goto(harvestCatalogUrl);
      await expect(publicCatalog.getByText("No encontramos productos con estos filtros."))
        .toBeVisible();
      await savedCrop.getByRole("button", { name: "Publicar en catálogo" }).click();
      await expect(savedCrop.getByText("Publicado", { exact: true })).toBeVisible();
      await publicCatalog.reload();
      const publicCrop = publicCatalog.getByRole("listitem").filter({ hasText: harvestName });
      await expect(publicCrop).toContainText("12,5 Kilogramo (kg)");
      await expect(publicCrop).toContainText(/2\.000/);
      await publicCatalog.getByLabel("Nombre del producto").fill("pApA");
      await publicCatalog.getByLabel("Municipio").fill("");
      await publicCatalog.getByRole("button", { name: "Buscar", exact: true }).click();
      await expect(publicCatalog.getByText("1 oferta encontrada", { exact: true })).toBeVisible();
      await expect(publicCrop).toBeVisible();
      await savedCrop.getByRole("link", { name: "Editar producto" }).click();
      await expect(
        producerPage.getByRole("heading", { name: "Editar producto" }),
      ).toBeVisible();
      await cropQuantity.fill("10,25");
      await cropPrice.fill("$2.500");
      await producerPage.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(producerPage.getByText("Actualizamos el producto.")).toBeVisible();
      const editedCrop = await database.product.findFirstOrThrow({
        where: { ownerId: producer.id, name: harvestName },
        select: { availableQuantity: true, priceCOP: true },
      });
      assert.ok(editedCrop.availableQuantity.equals("10.25"));
      assert.equal(editedCrop.priceCOP, 2500);
      await publicCatalog.reload();
      await expect(publicCrop).toContainText("10,25 Kilogramo (kg)");
      await expect(publicCrop).toContainText(/2\.500/);
      await producerPage.getByRole("link", { name: "Volver a mis productos" }).click();
      await savedCrop.getByRole("button", { name: "Retirar del catálogo" }).click();
      await expect(savedCrop.getByText("Privado", { exact: true })).toBeVisible();
      await publicCatalog.reload();
      await expect(publicCrop).toHaveCount(0);
      await publicCatalog.close();
      await producerPage.goto(`${baseURL}/mi-cuenta`);
      await producerPage.getByRole("link", { name: "Abrir mi agenda" }).click();
      const comingTasks = producerPage.getByRole("region", { name: "Hoy y próximas labores" });
      await expect(comingTasks.getByText("No tienes próximas labores en la agenda.")).toBeVisible();
      await producerPage.getByRole("link", { name: "Agregar una labor" }).click();
      const agendaForm = producerPage.getByRole("region", { name: "Agregar una labor" });
      await agendaForm.getByLabel("Actividad", { exact: true }).selectOption("HARVEST");
      await agendaForm.getByLabel("Fecha", { exact: true }).fill("2099-01-02");
      await agendaForm.getByLabel("Cultivo o producto").fill("Papa para cosechar");
      await agendaForm.getByRole("button", { name: "Agregar a mi agenda" }).click();
      await expect(comingTasks.getByText("Papa para cosechar")).toBeVisible();
      await agendaForm.getByLabel("Actividad", { exact: true }).selectOption("IRRIGATION");
      await agendaForm.getByLabel("Fecha", { exact: true }).fill(getColombianAgendaDate(new Date()));
      await agendaForm.getByLabel("Cultivo o producto").fill("Papa para regar hoy");
      await agendaForm.getByRole("button", { name: "Agregar a mi agenda" }).click();
      await expect(comingTasks.getByText("Papa para regar hoy", { exact: true })).toBeVisible();
      await producerPage.goto(`${baseURL}/mi-cuenta`);
      await expect(producerPage.getByRole("region", { name: "Agenda de labores" }))
        .toContainText("Tienes 1 labor para hoy.");
      await producerPage.getByRole("link", { name: "Abrir mi agenda" }).click();
      await expect(comingTasks.getByText("Papa para regar hoy", { exact: true })).toBeVisible();
      await agendaForm.getByLabel("Actividad", { exact: true }).selectOption("SOWING");
      await agendaForm.getByLabel("Fecha", { exact: true }).fill("2000-01-01");
      await agendaForm.getByLabel("Cultivo o producto").fill("Papa de registro anterior");
      await agendaForm.getByRole("button", { name: "Agregar a mi agenda" }).click();
      const history = comingTasks.getByText("Labores de fechas anteriores (1)", { exact: true });
      await expect(history).toBeVisible();
      await expect(comingTasks.getByText("Papa de registro anterior")).toBeHidden();
      await history.click();
      await expect(comingTasks.getByText("Papa de registro anterior")).toBeVisible();
      await comingTasks.getByRole("listitem").filter({ hasText: "Papa de registro anterior" })
        .getByRole("link", { name: "Editar labor" }).click();
      await expect(producerPage.getByRole("heading", { name: "Editar labor" })).toBeVisible();
      const scheduledFor = producerPage.getByLabel("Fecha", { exact: true });
      await expect(scheduledFor).toHaveValue("2000-01-01");
      await scheduledFor.fill("2099-01-03");
      await producerPage.getByLabel("Nota").fill("Revisar lote antes de sembrar");
      await producerPage.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(producerPage.getByText("Guardamos los cambios en tu agenda.")).toBeVisible();
      await producerPage.getByRole("link", { name: "Volver a mi agenda" }).click();
      await expect(comingTasks.getByText("Revisar lote antes de sembrar")).toBeVisible();
      await expect(comingTasks.getByText("Papa de registro anterior")).toHaveCount(1);
      await expect(history).toHaveCount(0);
      const rescheduled = comingTasks.getByRole("listitem").filter({
        hasText: "Papa de registro anterior",
      });
      const removeLabor = rescheduled.getByRole("button", { name: "Eliminar actividad" });
      await removeLabor.click();
      await rescheduled.getByRole("button", { name: "Conservar labor" }).click();
      await expect(removeLabor).toBeFocused();
      await expect(rescheduled).toBeVisible();
      await removeLabor.click();
      await rescheduled.getByRole("button", { name: "Sí, eliminar labor" }).click();
      await expect(rescheduled).toHaveCount(0);
      await expect(comingTasks.getByText("Papa para cosechar")).toBeVisible();
      await producerPage.setViewportSize({ width: 1280, height: 720 });
      await producerPage.goto(`${baseURL}/mi-cuenta/pedidos`);
      const producerOrdersSection = producerPage.getByRole("region", {
        name: "Solicitudes recibidas",
      });
      await producerOrdersSection
        .getByText("Aún no has recibido pedidos.")
        .waitFor();
      await producerOrdersSection
        .getByRole("link", { name: "Gestionar mis productos" })
        .waitFor();
      const resetContext = await browser.newContext();
      const resetPage = await resetContext.newPage();
      try {
        await resetPage.goto(localResetUrl.toString());
        await resetPage
          .getByRole("heading", { name: "Cambia tu contraseña" })
          .waitFor();
      } catch {
        throw new Error(
          "The local reset link did not reach the password reset form.",
        );
      }
      await resetPage
        .getByRole("textbox", { name: "Nueva contraseña", exact: true })
        .fill(newPassword);
      await resetPage
        .getByRole("textbox", {
          name: "Confirma la nueva contraseña",
          exact: true,
        })
        .fill(newPassword);
      await resetPage.getByRole("button", { name: "Guardar contraseña" }).click();
      await resetPage
        .getByRole("status")
        .getByText("Tu contraseña se actualizó.")
        .waitFor();
      await resetContext.close();

      const oldPasswordSignin = await api.post("/api/auth/sign-in/email", {
        data: { email, password },
      });
      assert.equal(oldPasswordSignin.ok(), false);
      const signin = await api.post("/api/auth/sign-in/email", {
        data: { email, password: newPassword },
      });
      assert.equal(signin.ok(), true, `Signin failed: ${await signin.text()}`);

      const context = await browser.newContext({
        viewport: { width: 320, height: 640 },
      });
      const page = await context.newPage();
      await page.goto(orderContextUrl);
      const signInLink = page.getByRole("link", { name: "Inicia sesión" });
      const signInBounds = await signInLink.boundingBox();
      assert.ok(signInBounds && signInBounds.height >= 48);
      await signInLink.click();
      await page.getByLabel("Correo electrónico").fill(email);
      await page.getByLabel("Contraseña").fill(newPassword);
      await page.getByRole("button", { name: "Iniciar sesión" }).click();
      await page.waitForURL(orderContextUrl);
      await page.getByRole("heading", { name: product.name }).waitFor();
      await page.getByText("Solicitud de compra", { exact: true }).waitFor();
      await expect(page.getByLabel("Cantidad que solicitas"))
        .toHaveAccessibleDescription("Disponible ahora: 5 Kilogramo (kg)");
      await expect(page.getByRole("link", { name: "Volver al catálogo" }))
        .toHaveAttribute("href", catalogUrl.slice(baseURL.length));
      assert.equal(
        await page.locator("html").evaluate(
          (root) => root.scrollWidth <= root.clientWidth,
        ),
        true,
        "The order form should fit a 320px viewport without horizontal scrolling.",
      );
      await page.goto(`${baseURL}/mi-cuenta`);
      await page
        .getByRole("heading", { name: "Encuentra productos locales" })
        .waitFor();
      await page
        .getByRole("link", { name: "Consultar mis pedidos" })
        .waitFor();
      await page.goto(`${baseURL}/mi-cuenta/pedidos`);
      const buyerOrdersSection = page.getByRole("region", {
        name: "Solicitudes que enviaste",
      });
      await buyerOrdersSection
        .getByText("Aún no has solicitado productos.")
        .waitFor();
      await buyerOrdersSection
        .getByRole("link", { name: "Explorar el catálogo" })
        .waitFor();
      await page.goto(`${baseURL}/mi-cuenta/productos`);
      assert.equal(
        new URL(page.url()).pathname,
        "/mi-cuenta",
        "A buyer should not access producer product management.",
      );
      await page.goto(`${baseURL}/catalogo/${product.id}/pedido`);
      await page.getByRole("heading", { name: product.name }).waitFor();

      const form = page.locator("form");
      const idempotencyKey = await form
        .locator('input[name="idempotencyKey"]')
        .inputValue();
      assert.match(idempotencyKey, /^[A-Za-z0-9_-]{43}$/);
      const requestedQuantity = page.getByLabel("Cantidad que solicitas");
      await requestedQuantity.fill("2,5");
      await expect(page.getByText(/Valor estimado\s*\$\s*2\.500 COP/)).toBeVisible();
      await requestedQuantity.fill("6,5");
      await expect(page.getByText("Valor estimado", { exact: false })).toHaveCount(0);
      await page.getByRole("button", { name: "Solicitar producto" }).click();
      await expect(page.getByText(/No pudimos reservar esa cantidad/)).toBeVisible();
      await expect(requestedQuantity).toHaveValue("6,5");
      await requestedQuantity.fill("2");

      const isServerAction = (request: Request) =>
        request.method() === "POST" && Boolean(request.headers()["next-action"]);
      const firstAction = page.waitForRequest(isServerAction);
      await page.getByRole("button", { name: "Solicitar producto" }).click();
      const firstRequest = await firstAction;
      assert.ok(firstRequest.postData()?.includes(idempotencyKey));
      await page
        .getByRole("status")
        .getByText("Tu solicitud está registrada.")
        .waitFor();
      const firstResponse = await firstRequest.response();
      assert.ok(firstResponse);

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
        maxRedirects: 0,
      });
      const trackingHref = `/mi-cuenta/pedidos?registrada=${firstOrder.id}#solicitud-${firstOrder.id}`;
      assert.ok([200, 303].includes(firstResponse.status()));
      assert.equal((await firstResponse.headerValue("x-action-redirect"))?.split(";")[0], trackingHref);
      assert.ok([200, 303].includes(replayResponse.status()));
      assert.equal(replayResponse.headers()["x-action-redirect"]?.split(";")[0], trackingHref);

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

      await expect(page.getByRole("button", { name: "Solicitar producto" })).toHaveCount(0);
      await page.waitForURL(`${baseURL}${trackingHref}`);
      await expect(page.locator(`[id="solicitud-${firstOrder.id}"]`)
        .getByRole("heading", { name: product.name, exact: true })).toBeInViewport();
      await expect(page.getByText("2 Kilogramo (kg)", { exact: true })).toBeVisible();
      await database.product.update({
        where: { id: product.id },
        data: { priceCOP: 1500 },
      });
      await page.reload();
      await expect(page.getByText(/\$\s*2\.000 COP/)).toBeVisible();
      await page
        .getByText("El productor debe revisar la solicitud.")
        .waitFor();
      await page
        .getByRole("list", { name: "Seguimiento de tu solicitud" })
        .getByText("Respuesta del productor")
        .waitFor();
      await page
        .getByRole("list", { name: "Seguimiento de tu solicitud" })
        .getByText("Esperando respuesta")
        .waitFor();

      await producerPage.goto(`${baseURL}/mi-cuenta/productos`);
      const inventoryCard = producerPage.getByRole("listitem").filter({ hasText: product.name });
      await expect(inventoryCard).toContainText(/Disponible para nuevos pedidos\s*3 Kilogramo/);
      await expect(inventoryCard).toContainText(/Reservado en pedidos pendientes\s*2 Kilogramo/);
      await inventoryCard.getByRole("link", { name: "Editar producto" }).click();
      await expect(producerPage.getByText("Reservado en pedidos pendientes", { exact: true }))
        .toBeVisible();
      await expect(producerPage.getByText("2 Kilogramo (kg)", { exact: true })).toBeVisible();
      await expect(producerPage.getByLabel("Cantidad disponible")).toHaveValue("3");
      await producerPage.goto(`${baseURL}/mi-cuenta/pedidos`);
      await expect(
        producerPage.getByText("2 Kilogramo (kg)", { exact: true }),
      ).toBeVisible();
      await expect(producerPage.getByText(/\$\s*2\.000 COP/)).toBeVisible();
      await producerPage
        .getByRole("heading", { name: "Solicitudes recibidas" })
        .waitFor();
      const pendingProducerRequests = producerPage.getByRole("region", { name: "Por responder" });
      const answeredProducerRequests = producerPage.getByRole("region", { name: "Ya respondidas" });
      await pendingProducerRequests
        .getByRole("button", { name: "Aceptar pedido" })
        .click();
      await producerPage
        .getByRole("list", { name: "Seguimiento de la solicitud recibida" })
        .getByText("Tu respuesta")
        .waitFor();
      await answeredProducerRequests
        .getByRole("list", { name: "Seguimiento de la solicitud recibida" })
        .getByText("Aceptado")
        .waitFor();
      await expect(pendingProducerRequests).toContainText("No tienes solicitudes por responder.");
      const acceptedOrder = await database.order.findFirstOrThrow({
        where: { buyerId: buyer.id, productId: product.id },
        include: { history: true },
      });
      assert.equal(acceptedOrder.status, "ACCEPTED");
      assert.equal(acceptedOrder.history.length, 2);
      const acceptance = acceptedOrder.history.find(
        (event) => event.toStatus === "ACCEPTED",
      );
      assert.ok(acceptance);
      const colombianTime = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Bogota",
      });

      await page.goto(`${baseURL}/mi-cuenta/pedidos`);
      await page
        .getByText("El productor aceptó esta solicitud.")
        .waitFor();
      await page
        .getByRole("list", { name: "Seguimiento de tu solicitud" })
        .getByText("Respuesta del productor")
        .waitFor();
      await page
        .getByRole("list", { name: "Seguimiento de tu solicitud" })
        .getByText("Aceptado")
        .waitFor();
      await expect(
        page.getByRole("list", { name: "Seguimiento de tu solicitud" }).locator("time"),
      ).toHaveText([
        colombianTime.format(acceptedOrder.createdAt),
        colombianTime.format(acceptance.createdAt),
      ]);

      await page.goto(`${baseURL}/catalogo/${product.id}/pedido`);
      await page.getByLabel("Cantidad que solicitas").fill("1");
      await page.getByRole("button", { name: "Solicitar producto" }).click();
      await page
        .getByRole("status")
        .getByText("Tu solicitud está registrada.")
        .waitFor();

      await producerPage.reload();
      await expect(pendingProducerRequests.getByRole("button", { name: "Rechazar pedido" }))
        .toBeVisible();
      await expect(answeredProducerRequests.getByText("Aceptado", { exact: true })).toBeVisible();
      let canceledRejectionMessage = "";
      producerPage.once("dialog", (dialog) => {
        assert.equal(dialog.type(), "confirm");
        canceledRejectionMessage = dialog.message();
        void dialog.dismiss();
      });
      await producerPage
        .getByRole("button", { name: "Rechazar pedido" })
        .click();
      assert.match(canceledRejectionMessage, /no podrás cambiar la decisión/);
      await producerPage
        .getByRole("list", { name: "Seguimiento de la solicitud recibida" })
        .first()
        .getByText("Tu respuesta")
        .waitFor();
      await producerPage
        .getByRole("list", { name: "Seguimiento de la solicitud recibida" })
        .first()
        .getByText("Esperando respuesta")
        .waitFor();

      let rejectedOrder = await database.order.findFirstOrThrow({
        where: { buyerId: buyer.id, productId: product.id, status: "PENDING" },
        include: { history: true },
      });
      assert.equal(rejectedOrder.history.length, 1);
      const rejectedOrderId = rejectedOrder.id;
      let reservedInventory = await database.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      assert.ok(reservedInventory.availableQuantity.equals("2"));
      assert.ok(reservedInventory.reservedQuantity.equals("1"));

      let confirmedRejectionMessage = "";
      producerPage.once("dialog", (dialog) => {
        assert.equal(dialog.type(), "confirm");
        confirmedRejectionMessage = dialog.message();
        void dialog.accept();
      });
      await producerPage
        .getByRole("button", { name: "Rechazar pedido" })
        .click();
      assert.match(confirmedRejectionMessage, /no podrás cambiar la decisión/);
      await producerPage
        .getByRole("list", { name: "Seguimiento de la solicitud recibida" })
        .first()
        .getByText("Tu respuesta")
        .waitFor();
      await producerPage
        .getByRole("list", { name: "Seguimiento de la solicitud recibida" })
        .first()
        .getByText("Rechazado")
        .waitFor();
      await producerPage
        .getByText(
          "La solicitud fue rechazada y la cantidad reservada volvió a estar disponible.",
        )
        .waitFor();
      rejectedOrder = await database.order.findFirstOrThrow({
        where: { id: rejectedOrderId },
        include: { history: true },
      });
      assert.equal(rejectedOrder.status, "REJECTED");
      assert.equal(rejectedOrder.history.length, 2);
      reservedInventory = await database.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      assert.ok(reservedInventory.availableQuantity.equals("3"));
      assert.ok(reservedInventory.reservedQuantity.equals("0"));
      await producerPage.goto(`${baseURL}/mi-cuenta/productos`);
      await expect(inventoryCard).toContainText(/Disponible para nuevos pedidos\s*3 Kilogramo/);
      await expect(inventoryCard.getByText("Reservado en pedidos pendientes")).toHaveCount(0);

      await page.goto(`${baseURL}/mi-cuenta/pedidos`);
      await page.getByText("El productor rechazó esta solicitud.").waitFor();
      await page
        .getByRole("list", { name: "Seguimiento de tu solicitud" })
        .first()
        .getByText("Respuesta del productor")
        .waitFor();
      await page
        .getByRole("list", { name: "Seguimiento de tu solicitud" })
        .first()
        .getByText("Rechazado")
        .waitFor();

      await page.goto(`${baseURL}/catalogo/${product.id}/pedido`);
      await page.getByLabel("Cantidad que solicitas").fill("3");
      await page.getByRole("button", { name: "Solicitar producto" }).click();
      await page.waitForURL(/\/mi-cuenta\/pedidos\?registrada=[^#]+#solicitud-/);
      await expect(page.locator(`[id="${new URL(page.url()).hash.slice(1)}"]`))
        .toContainText("Esperando respuesta");
      const exhaustedInventory = await database.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      assert.ok(exhaustedInventory.availableQuantity.equals("0"));

      await producerContext.close();
      await context.close();
    } finally {
      await api.dispose();
    }
  } finally {
    await browser?.close();
    await producerApi?.dispose();
    if (server) await stopServer(server);
    await brevoStub?.close();
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
