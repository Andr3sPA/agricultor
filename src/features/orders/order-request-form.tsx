"use client";

import { useActionState } from "react";
import {
  requestOrderAction,
  type OrderFormState,
} from "./order-actions";

const initialState: OrderFormState = {};

export function OrderRequestForm({
  productId,
  availableQuantityLabel,
  idempotencyKey,
}: {
  productId: string;
  availableQuantityLabel: string;
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(
    requestOrderAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <input name="productId" type="hidden" value={productId} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <div>
        <label className="block font-medium" htmlFor="order-quantity">
          Cantidad que solicitas
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.quantity
              ? "order-quantity-availability order-quantity-error"
              : "order-quantity-availability"
          }
          aria-invalid={Boolean(state.fieldErrors?.quantity)}
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3"
          defaultValue={state.submittedQuantity ?? ""}
          id="order-quantity"
          inputMode="decimal"
          maxLength={13}
          name="quantity"
          placeholder="Ejemplo: 2,5"
          required
          type="text"
        />
        {state.fieldErrors?.quantity && (
          <p className="mt-1 text-sm text-red-800" id="order-quantity-error" role="alert">
            {state.fieldErrors.quantity}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-600" id="order-quantity-availability">
          Disponible ahora: {availableQuantityLabel}
        </p>
      </div>
      {state.message && (
        <p
          className="text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      )}
      <button
        className="min-h-12 w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Enviando…" : "Solicitar producto"}
      </button>
    </form>
  );
}
