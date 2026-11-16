"use client";

import { useState } from "react";

type ShareProductButtonProps = {
  href: string;
  productName: string;
};

export function ShareProductButton({
  href,
  productName,
}: ShareProductButtonProps) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API no disponible.");
      }
      await navigator.clipboard.writeText(href);
      setMessage("Enlace copiado.");
    } catch {
      setMessage(
        "No se pudo copiar automáticamente. Selecciona el enlace y cópialo.",
      );
    }
  }

  async function shareProduct() {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title: productName, url: href });
      setMessage("Producto compartido.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setMessage(
        "No fue posible abrir el menú para compartir. Puedes copiar el enlace.",
      );
    }
  }

  return (
    <section
      aria-label="Compartir producto"
      className="mt-8 border-t border-slate-200 pt-6"
    >
      <h2 className="text-lg font-semibold">Compartir producto</h2>
      <label
        className="mt-3 block text-sm font-medium"
        htmlFor="public-product-link"
      >
        Enlace del producto
      </label>
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-700"
        id="public-product-link"
        onFocus={(event) => event.currentTarget.select()}
        readOnly
        value={href}
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          className="min-h-11 rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
          onClick={shareProduct}
          type="button"
        >
          Compartir producto
        </button>
        <button
          className="min-h-11 rounded-lg border border-emerald-900 px-4 py-2 font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
          onClick={copyLink}
          type="button"
        >
          Copiar enlace
        </button>
      </div>
      <p
        aria-live="polite"
        className="mt-3 min-h-6 text-sm text-slate-700"
        role="status"
      >
        {message}
      </p>
    </section>
  );
}
