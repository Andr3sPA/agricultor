"use client";

import { useId, useRef, useState } from "react";

export function OrderCoordinationSummary({ summary }: { summary: string }) {
  const id = useId();
  const text = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setMessage("Resumen copiado.");
    } catch {
      text.current?.focus();
      text.current?.select();
      setMessage("El texto está seleccionado. Cópialo desde el menú de tu dispositivo.");
    }
  }

  return (
    <details className="mt-4 rounded-xl border border-emerald-900 px-4">
      <summary className="cursor-pointer py-3 font-semibold text-emerald-950">
        Coordinar entrega
      </summary>
      <div className="space-y-3 pb-4">
        <p className="text-sm text-slate-700">
          Copia el resumen y pégalo en WhatsApp u otro canal que ya uses.
          Acuerden si será envío o recogida, cuándo y dónde.
        </p>
        <label className="block text-sm font-medium" htmlFor={id}>
          Resumen del pedido
        </label>
        <textarea
          className="block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-950"
          id={id}
          readOnly
          ref={text}
          rows={5}
          value={summary}
        />
        <button
          className="min-h-11 rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900"
          onClick={copySummary}
          type="button"
        >
          Copiar resumen
        </button>
        <p className="text-sm text-slate-700" role="status">{message}</p>
      </div>
    </details>
  );
}
