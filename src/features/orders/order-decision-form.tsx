"use client";

import { useActionState } from "react";
import {
  decideOrderAction,
  type OrderFormState,
} from "./order-actions";

const initialState: OrderFormState = {};

export function OrderDecisionForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(
    decideOrderAction,
    initialState,
  );

  return (
    <form action={action} className="mt-4 flex flex-wrap gap-3">
      <input name="orderId" type="hidden" value={orderId} />
      <button
        className="rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        name="decision"
        type="submit"
        value="ACCEPTED"
      >
        Aceptar pedido
      </button>
      <button
        className="rounded-xl border border-red-800 px-4 py-2 font-semibold text-red-900 disabled:opacity-60"
        disabled={pending}
        name="decision"
        type="submit"
        value="REJECTED"
      >
        Rechazar pedido
      </button>
      {state.message && (
        <p className="basis-full text-sm text-slate-700" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
