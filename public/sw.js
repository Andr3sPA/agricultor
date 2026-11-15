importScripts("/offline-policy.js");

const CACHE_NAME = "agricultor-offline-shell-v1";
const policy = self.AgricultorOfflinePolicy;
const shellHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#166534">
    <title>Agricultor - sin conexión</title>
    <style>
      body { margin: 0; padding: 2rem 1.25rem; color: #17231c; background: #f7faf7; font: 1rem/1.6 system-ui, sans-serif; }
      main { box-sizing: border-box; max-width: 38rem; margin: 10vh auto; padding: 2rem; border: 1px solid #d5e2d7; border-radius: 1.25rem; background: white; }
      h1 { line-height: 1.2; }
      a { color: #14532d; font-weight: 650; }
    </style>
  </head>
  <body>
    <main>
      <p>Agricultor</p>
      <h1>Estás sin conexión</h1>
      <p>Esta pantalla básica está disponible sin internet. No incluye productos ni cantidades guardadas: el catálogo y su disponibilidad solo se actualizan cuando hay conexión.</p>
      <p>Necesitas conexión para solicitar un producto. Las solicitudes no se guardan ni se confirman sin conexión.</p>
      <nav aria-label="Navegación">
        <a href="/">Inicio</a> · <a href="/catalogo">Catálogo (requiere conexión)</a>
      </nav>
    </main>
  </body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cacheUrl = new URL(policy.cachePath, self.location.origin);
      const request = new Request(cacheUrl, { credentials: "omit" });
      const response = new Response(shellHtml, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });

      if (!policy.isSafeShellCacheEntry(request, response, self.location.origin)) {
        throw new Error("La respuesta del shell offline no cumple la política de caché.");
      }

      await cache.put(request, response);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("agricultor-offline-shell-") &&
              name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!policy.isShellNavigation(request, self.location.origin)) {
    return;
  }

  event.respondWith(
    policy.fetchWithShellFallback(
      request,
      self.location.origin,
      (navigation) => fetch(navigation),
      async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(
          new URL(policy.cachePath, self.location.origin).href,
        );
      },
    ),
  );
});
