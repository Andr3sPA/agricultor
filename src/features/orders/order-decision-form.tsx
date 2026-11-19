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
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const acceptButton = useRef<HTMLButtonElement>(null);
  const rejectButton = useRef<HTMLButtonElement>(null);
  const rejecting = decision === "REJECTED";
  const confirmationId = `confirmar-pedido-${orderId}`;

  return (
    <form action={action} className="mt-4 flex flex-wrap gap-3">
      <input name="orderId" type="hidden" value={orderId} />
      <button
        aria-controls={confirmationId}
        aria-expanded={decision === "ACCEPTED"}
        className="min-h-12 rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        onClick={() => setDecision(decision === "ACCEPTED" ? null : "ACCEPTED")}
        ref={acceptButton}
        type="button"
      >
        Aceptar pedido
      </button>
      <button
        aria-controls={confirmationId}
        aria-expanded={rejecting}
        className="min-h-12 rounded-xl border border-red-800 px-4 py-2 font-semibold text-red-900 disabled:opacity-60"
        disabled={pending}
        onClick={() => setDecision(rejecting ? null : "REJECTED")}
        ref={rejectButton}
        type="button"
      >
        Rechazar pedido
      </button>
      <div
        className={`basis-full space-y-3 rounded-xl p-4 ${rejecting ? "bg-red-50 text-red-950" : "bg-emerald-50 text-emerald-950"}`}
        hidden={decision === null}
        id={confirmationId}
      >
        <p className="text-sm">
          {rejecting
            ? "Al rechazar, la cantidad reservada vuelve a estar disponible."
            : "Al aceptar, la cantidad reservada se descuenta del inventario."}
          {" "}Esta decisión es definitiva.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-12 rounded-xl border border-emerald-800 px-4 py-2 font-semibold"
            disabled={pending}
            onClick={() => {
              setDecision(null);
              (rejecting ? rejectButton : acceptButton).current?.focus();
            }}
            type="button"
          >
            Dejar pendiente
          </button>
          {decision && (
            <button
              className={`min-h-12 rounded-xl px-4 py-2 font-semibold text-white disabled:opacity-60 ${rejecting ? "bg-red-800" : "bg-emerald-800"}`}
              disabled={pending}
              name="decision"
              type="submit"
              value={decision}
            >
              {pending ? "Guardando…" : rejecting ? "Confirmar rechazo" : "Confirmar aceptación"}
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
