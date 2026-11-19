"use client";

import { useActionState } from "react";
import type { ProductFormState } from "./product-actions";

const initialState: ProductFormState = {};

const fields = {
  priceCOP: {
    summary: "Cambiar precio",
    button: "Guardar precio",
    inputMode: "numeric",
  },
  availableQuantity: {
    summary: "Cambiar cantidad disponible",
    button: "Guardar cantidad",
    inputMode: "decimal",
  },
} as const;

export function QuickProductFieldForm({
  saveAction,
  field,
  productId,
  value,
  label,
  hint,
}: {
  saveAction: (previous: ProductFormState, data: FormData) => Promise<ProductFormState>;
  field: keyof typeof fields;
  productId: string;
  value: string;
  label: string;
  hint?: string;
}) {
  const [state, action, pending] = useActionState(saveAction, initialState);
  const inputId = `${field}-${productId}`;
  const error = state.fieldErrors?.[field];
  const description = [hint && `${inputId}-hint`, error && `${inputId}-error`]
    .filter(Boolean).join(" ") || undefined;
  const config = fields[field];

  return (
    <details className="mt-4 rounded-xl border border-emerald-900 px-4">
      <summary className="cursor-pointer py-3 font-semibold text-emerald-950">
        {config.summary}
      </summary>
      <form action={action} className="space-y-2 pb-4">
        <label className="block text-sm font-medium" htmlFor={inputId}>
          {label}
        </label>
        {hint && <p className="text-sm text-slate-700" id={`${inputId}-hint`}>{hint}</p>}
        <input
          aria-describedby={description}
          aria-invalid={Boolean(error)}
          className="min-h-11 w-full max-w-xs rounded-lg border border-slate-300 px-3"
          defaultValue={state.values?.[field] ?? value}
          id={inputId}
          inputMode={config.inputMode}
          maxLength={25}
          name={field}
          type="text"
        />
        {error && <p className="text-sm text-rose-800" id={`${inputId}-error`} role="alert">{error}</p>}
        <div>
          <button
            className="min-h-11 rounded-xl bg-emerald-800 px-4 font-semibold text-white disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Guardando..." : config.button}
          </button>
        </div>
        {state.message && (
          <p className={state.ok ? "text-sm text-emerald-900" : "text-sm text-rose-800"} role={state.ok ? "status" : "alert"}>
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}
