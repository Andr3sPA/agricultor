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
        onClick={(event) => {
          if (
            !window.confirm(
              "¿Rechazar este pedido? La cantidad reservada volverá a estar disponible y no podrás cambiar la decisión.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        Rechazar pedido
      </button>
      {state.message && (
        <p
          className={`basis-full text-sm ${state.ok ? "text-emerald-900" : "text-red-800"}`}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
