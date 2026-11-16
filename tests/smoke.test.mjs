import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { once } from "node:events";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const nextCli = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const focusStyles = await readFile(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);
const orderRequestForm = await readFile(
  new URL("../src/features/orders/order-request-form.tsx", import.meta.url),
  "utf8",
);
const orderDecisionForm = await readFile(
  new URL("../src/features/orders/order-decision-form.tsx", import.meta.url),
  "utf8",
);
const roleForm = await readFile(
  new URL("../src/features/auth/role-form.tsx", import.meta.url),
  "utf8",
);
let server;
let serverError = "";
let url;

async function findAvailablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, host, resolve);
  });

  const address = probe.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) => {
    probe.close((error) => (error ? reject(error) : resolve()));
  });
  return address.port;
}

before(async () => {
  const port = await findAvailablePort();
  url = `http://${host}:${port}`;
  server = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", host, "--port", String(port)],
    {
      cwd: projectRoot,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
  server.stderr.setEncoding("utf8");
  server.stderr.on("data", (chunk) => {
    serverError = `${serverError}${chunk}`.slice(-4000);
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited before becoming ready.\n${serverError}`);
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
      await response.body?.cancel();
    } catch (error) {
      if (!(error instanceof TypeError) && error.name !== "TimeoutError") {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Production server did not become ready in time.\n${serverError}`);
});

after(async () => {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await once(server, "exit");
});

test("production home page renders the Spanish scaffold", async () => {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<html lang="es"/);
  assert.match(html, /Una plataforma para conectar el campo y el mercado/);
  assert.match(html, /Este espacio está en preparación\./);
});

test("production serves the offline worker, policy, and app manifest", async () => {
  const [workerResponse, policyResponse, manifestResponse] = await Promise.all([
    fetch(`${url}/sw.js`),
    fetch(`${url}/offline-policy.js`),
    fetch(`${url}/manifest.webmanifest`),
  ]);
  assert.equal(workerResponse.status, 200);
  assert.equal(policyResponse.status, 200);
  assert.equal(manifestResponse.status, 200);

  const [worker, policy] = await Promise.all([
    workerResponse.text(),
    policyResponse.text(),
  ]);
  const manifest = await manifestResponse.json();
  assert.match(worker, /AgricultorOfflinePolicy/);
  assert.match(policy, /AgricultorOfflinePolicy/);
  assert.equal(manifest.name, "Agricultor");
  assert.equal(manifest.start_url, "/");
});

test("interactive controls expose a visible keyboard focus indicator", () => {
  assert.match(
    focusStyles,
    /:focus-visible\s*\{\s*outline:\s*3px solid #166534;\s*outline-offset:\s*3px;/,
  );
});

test("order quantity validation is linked to its invalid field", () => {
  assert.match(orderRequestForm, /aria-invalid=\{Boolean\(state\.fieldErrors\?\.quantity\)\}/);
  assert.match(orderRequestForm, /"order-quantity-error"/);
  assert.match(orderRequestForm, /id="order-quantity-error"/);
});

test("action feedback distinguishes success statuses from errors", () => {
  for (const source of [orderRequestForm, orderDecisionForm, roleForm]) {
    assert.match(source, /role=\{state\.ok \? "status" : "alert"\}/);
  }
});

test("production registration page keeps labels associated with their fields", async () => {
  const response = await fetch(`${url}/crear-cuenta`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<label[^>]*for="name"[^>]*>Nombre<\/label>/);
  assert.match(html, /<input[^>]*id="name"[^>]*name="name"/);
  assert.match(html, /<label[^>]*for="email"[^>]*>Correo electrónico<\/label>/);
  assert.match(html, /<input[^>]*id="email"[^>]*name="email"/);
  assert.match(html, /<label[^>]*for="password"[^>]*>Contraseña<\/label>/);
  assert.match(html, /<input[^>]*id="password"[^>]*name="password"/);
});
