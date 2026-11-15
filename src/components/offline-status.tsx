"use client";

import { useEffect, useState } from "react";

export function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error: unknown) => {
          console.error("No se pudo registrar el shell offline de Agricultor.", error);
        });
    }

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <p
      className="bg-amber-100 px-4 py-3 text-center text-sm font-medium text-amber-950"
      role="status"
      aria-live="polite"
    >
      Sin conexión: el catálogo y las cantidades no están actualizados. Se
      necesita internet para solicitar; las solicitudes no se guardan ni se
      confirman sin conexión.
    </p>
  );
}
