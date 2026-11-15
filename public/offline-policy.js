(function (scope) {
  const shellCachePath = "/__agricultor_offline_shell__";
  const publicShellPaths = new Set(["/", "/catalogo"]);

  function parseRequest(request, origin) {
    try {
      return new URL(request.url, origin);
    } catch {
      return null;
    }
  }

  function isShellNavigation(request, origin) {
    const url = parseRequest(request, origin);
    return Boolean(
      request.method === "GET" &&
        request.mode === "navigate" &&
        url &&
        url.origin === origin &&
        publicShellPaths.has(url.pathname) &&
        url.search === "",
    );
  }

  function isSafeShellCacheEntry(request, response, origin) {
    const url = parseRequest(request, origin);
    return Boolean(
      request.method === "GET" &&
        request.credentials === "omit" &&
        url &&
        url.origin === origin &&
        url.pathname === shellCachePath &&
        url.search === "" &&
        response.status === 200 &&
        response.headers.get("content-type")?.startsWith("text/html") &&
        !response.headers.has("set-cookie"),
    );
  }

  async function fetchWithShellFallback(
    request,
    origin,
    fetchRequest,
    readShell,
  ) {
    try {
      return await fetchRequest(request);
    } catch (error) {
      if (!isShellNavigation(request, origin)) {
        throw error;
      }

      const shell = await readShell();
      if (!shell) {
        throw error;
      }
      return shell;
    }
  }

  scope.AgricultorOfflinePolicy = {
    cachePath: shellCachePath,
    isShellNavigation,
    isSafeShellCacheEntry,
    fetchWithShellFallback,
  };
})(self);
