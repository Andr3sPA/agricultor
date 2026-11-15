import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const origin = "https://agricultor.example";
const policySource = await readFile(
  new URL("../public/offline-policy.js", import.meta.url),
  "utf8",
);
const scope = {};
runInNewContext(policySource, { self: scope, URL });
const policy = scope.AgricultorOfflinePolicy;

function request(path, { method = "GET", mode = "navigate", credentials = "same-origin" } = {}) {
  return {
    url: new URL(path, origin).href,
    method,
    mode,
    credentials,
  };
}

test("only the generated, cookie-free offline shell is cacheable", () => {
  const shellRequest = request(policy.cachePath, {
    mode: "cors",
    credentials: "omit",
  });
  const shellResponse = new Response("<!doctype html>", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });

  assert.equal(policy.isSafeShellCacheEntry(shellRequest, shellResponse, origin), true);

  const excludedPaths = [
    "/",
    "/catalogo",
    "/catalogo?search=secret",
    "/iniciar-sesion",
    "/crear-cuenta",
    "/api/auth/get-session",
    "/api/auth/sign-in/email",
    "/mi-cuenta",
    "/mi-cuenta/pedidos",
    "/mi-cuenta/productos",
    "/catalogo/producto-1/pedido",
    "/api/orders",
    "/api/products",
    "/sw.js",
    "/offline-policy.js",
  ];

  for (const path of excludedPaths) {
    assert.equal(
      policy.isSafeShellCacheEntry(
        request(path, { mode: "cors", credentials: "omit" }),
        shellResponse,
        origin,
      ),
      false,
      `${path} must not be cacheable`,
    );
  }
  assert.equal(
    policy.isSafeShellCacheEntry(
      request(policy.cachePath, { mode: "cors" }),
      shellResponse,
      origin,
    ),
    false,
    "requests with same-origin credentials must not be cacheable",
  );
  assert.equal(
    policy.isSafeShellCacheEntry(
      shellRequest,
      new Response("private", {
        headers: {
          "content-type": "text/html",
          "set-cookie": "session=private",
        },
      }),
      origin,
    ),
    false,
    "responses setting cookies must not be cacheable",
  );
});

test("only exact public navigations qualify for offline shell fallback", () => {
  for (const path of ["/", "/catalogo"]) {
    assert.equal(policy.isShellNavigation(request(path), origin), true);
  }

  for (const path of [
    "/catalogo?filter=private",
    "/iniciar-sesion",
    "/mi-cuenta",
    "/mi-cuenta/pedidos",
    "/catalogo/producto-1/pedido",
    "/api/auth/get-session",
    "/api/orders",
  ]) {
    assert.equal(policy.isShellNavigation(request(path), origin), false, path);
  }
  assert.equal(
    policy.isShellNavigation(request("/catalogo", { method: "POST" }), origin),
    false,
  );
  assert.equal(
    policy.isShellNavigation(
      request("/catalogo", { mode: "cors" }),
      origin,
    ),
    false,
  );
});

test("an offline public navigation returns the static shell without caching the page", async () => {
  const navigation = request("/catalogo");
  const shell = new Response(
    "<h1>Estás sin conexión</h1><p>No incluye productos ni cantidades guardadas.</p>",
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
  let fetchCalls = 0;
  let cacheReads = 0;

  const response = await policy.fetchWithShellFallback(
    navigation,
    origin,
    async () => {
      fetchCalls += 1;
      throw new TypeError("Failed to fetch");
    },
    async () => {
      cacheReads += 1;
      return shell;
    },
  );

  assert.equal(fetchCalls, 1);
  assert.equal(cacheReads, 1);
  assert.match(await response.text(), /Estás sin conexión/);
});
