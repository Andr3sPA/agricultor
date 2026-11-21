"use client";

import { useActionState } from "react";
import type { OrderDeliveryDetails } from "@/generated/prisma/client";
import { saveOrderDelivery } from "./order-delivery-action";

const inputClass = "mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3";

export function OrderDeliveryForm({ orderId, delivery }: { orderId: string; delivery?: OrderDeliveryDetails }) {
  const [state, action, pending] = useActionState(saveOrderDelivery.bind(null, orderId), { message: "" });
  return (
    <details className="mt-4 rounded-xl border border-slate-200 px-3">
      <summary className="min-h-11 cursor-pointer py-3 font-semibold text-emerald-950">
        {delivery ? "Actualizar datos de entrega" : "Registrar datos de entrega"}
      </summary>
      <form action={action} className="space-y-3 pb-4">
        <p className="text-sm text-slate-700">Registra lo que acordaste con el comprador. Solo las partes de este pedido pueden verlo.</p>
        <label className="block text-sm font-medium">Forma de entrega
          <select className={inputClass} defaultValue={delivery?.method ?? ""} name="method" required>
            <option value="">Elige una opción</option>
            <option value="PICKUP">Recogida</option>
            <option value="SHIPPING">Envío</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Cuándo
          <input className={inputClass} defaultValue={delivery?.when} maxLength={100} name="when" placeholder="Ej. Viernes 20, de 8 a 10 a. m." required />
        </label>
        <label className="block text-sm font-medium">Lugar acordado
          <input className={inputClass} defaultValue={delivery?.place} maxLength={240} name="place" required />
        </label>
        <label className="block text-sm font-medium">Costo de entrega en pesos
          <input className={inputClass} defaultValue={delivery?.costCOP} inputMode="numeric" maxLength={10} name="costCOP" placeholder="Escribe 0 si es gratis" required />
        </label>
        <button className="min-h-11 rounded-lg bg-emerald-800 px-3 font-semibold text-white" disabled={pending} type="submit">
          Guardar datos de entrega
        </button>
        {state.message && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
      </form>
    </details>
  );
}
