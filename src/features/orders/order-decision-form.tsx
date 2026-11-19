"use client";

import { useActionState, useRef, useState } from "react";
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
  const [confirmingAcceptance, setConfirmingAcceptance] = useState(false);
  const acceptButton = useRef<HTMLButtonElement>(null);
  const confirmationId = `confirmar-pedido-${orderId}`;

  return (
    <form action={action} className="mt-4 flex flex-wrap gap-3">
      <input name="orderId" type="hidden" value={orderId} />
      <button
        aria-controls={confirmationId}
        aria-expanded={confirmingAcceptance}
        className="min-h-12 rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        onClick={() => setConfirmingAcceptance(!confirmingAcceptance)}
        ref={acceptButton}
        type="button"
      >
        Aceptar pedido
      </button>
      <button
        className="min-h-12 rounded-xl border border-red-800 px-4 py-2 font-semibold text-red-900 disabled:opacity-60"
        disabled={pending || confirmingAcceptance}
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
      <div
        className="basis-full space-y-3 rounded-xl bg-emerald-50 p-4 text-emerald-950"
        hidden={!confirmingAcceptance}
        id={confirmationId}
      >
        <p className="text-sm">
          Al aceptar, la cantidad reservada se descuenta del inventario.
          Esta decisión es definitiva.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-12 rounded-xl border border-emerald-800 px-4 py-2 font-semibold"
            disabled={pending}
            onClick={() => {
              setConfirmingAcceptance(false);
              acceptButton.current?.focus();
            }}
            type="button"
          >
            Dejar pendiente
          </button>
          {confirmingAcceptance && (
            <button
              className="min-h-12 rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
              disabled={pending}
              name="decision"
              type="submit"
              value="ACCEPTED"
            >
              {pending ? "Guardando…" : "Confirmar aceptación"}
            </button>
          )}
        </div>
      </div>
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
