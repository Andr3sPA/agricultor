"use client";

import { useActionState } from "react";
import type { OrderDeliveryDetails } from "@/generated/prisma/client";
import { markOrderReceived, rateReceivedOrder } from "./order-receipt-action";

const buttonClass = "min-h-11 rounded-lg bg-emerald-800 px-3 font-semibold text-white disabled:opacity-50";

export function OrderReceiptForm({ delivery }: { delivery: OrderDeliveryDetails }) {
  const [state, action, pending] = useActionState(markOrderReceived.bind(null, delivery), { message: "" });
  return (
    <details className="mt-3">
      <summary className="min-h-11 cursor-pointer font-semibold text-emerald-900">Ya recibí el pedido</summary>
      <form action={action} className="space-y-2">
        <p className="text-sm text-slate-700">Confirma solo si recibiste el pedido completo.</p>
        <button className={buttonClass} disabled={pending} type="submit">Confirmar recepción</button>
        {state.message && <p role="alert">{state.message}</p>}
      </form>
    </details>
  );
}

export function OrderRatingForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(rateReceivedOrder.bind(null, orderId), { message: "" });
  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <label className="w-full text-sm font-medium sm:w-auto">Califica al vendedor
        <select className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-2" defaultValue="" name="rating" required>
          <option value="">Elige de 1 a 5</option>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} de 5</option>)}
        </select>
      </label>
      <button className={buttonClass} disabled={pending} type="submit">Guardar calificación</button>
      {state.message && <p className="w-full" role="alert">{state.message}</p>}
    </form>
  );
}
