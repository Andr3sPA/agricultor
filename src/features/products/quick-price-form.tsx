"use client";

import { useActionState } from "react";
import { updateProductPrice, type ProductFormState } from "./product-actions";

const initialState: ProductFormState = {};

export function QuickPriceForm({
  productId,
  priceCOP,
  unit,
  unitLabel,
}: {
  productId: string;
  priceCOP: number;
  unit: string;
  unitLabel: string;
}) {
  const [state, action, pending] = useActionState(
    updateProductPrice.bind(null, productId, unit, priceCOP),
    initialState,
  );
  const inputId = `precio-${productId}`;
  const error = state.fieldErrors?.priceCOP;

  return (
    <details className="mt-4 rounded-xl border border-emerald-900 px-4">
      <summary className="cursor-pointer py-3 font-semibold text-emerald-950">
        Cambiar precio
      </summary>
      <form action={action} className="space-y-2 pb-4">
        <label className="block text-sm font-medium" htmlFor={inputId}>
          Precio en pesos por {unitLabel}
        </label>
        <input
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={Boolean(error)}
          className="min-h-11 w-full max-w-xs rounded-lg border border-slate-300 px-3"
          defaultValue={state.values?.priceCOP ?? String(priceCOP)}
          id={inputId}
          inputMode="numeric"
          maxLength={25}
          name="priceCOP"
          type="text"
        />
        {error && <p className="text-sm text-rose-800" id={`${inputId}-error`} role="alert">{error}</p>}
        <div>
          <button
            className="min-h-11 rounded-xl bg-emerald-800 px-4 font-semibold text-white disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Guardando..." : "Guardar precio"}
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
