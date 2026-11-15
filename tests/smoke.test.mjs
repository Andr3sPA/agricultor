import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { after, before, test } from "node:test";
import { once } from "node:events";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const nextCli = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
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
