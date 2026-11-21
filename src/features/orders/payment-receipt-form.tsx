"use client";

import { useActionState } from "react";
import { confirmExternalPayment } from "./external-payment-action";

export function PaymentReceiptForm({ orderId, method, wompiUrl, amountCOP }: {
  orderId: string;
  method: string;
  wompiUrl: string | null;
  amountCOP: string;
}) {
  const [state, action, pending] = useActionState(
    confirmExternalPayment.bind(null, orderId, method, wompiUrl, amountCOP),
    { message: "" },
  );
  return (
    <details>
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-emerald-900">Ya recibí el pago</summary>
      <form action={action} className="space-y-2">
        <p className="text-sm text-slate-700">Confirma solo después de verificar que recibiste el importe completo.</p>
        <button className="min-h-11 rounded-lg bg-emerald-800 px-3 font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
          Confirmar pago recibido
        </button>
        {state.message && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
      </form>
    </details>
  );
}
