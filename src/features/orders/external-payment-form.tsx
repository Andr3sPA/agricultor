"use client";

import { useActionState, useId, useState } from "react";
import type { OrderDeliveryDetails, OrderExternalPayment } from "@/generated/prisma/client";
import { saveExternalPayment } from "./external-payment-action";

export function ExternalPaymentForm({ delivery, payment }: { delivery: OrderDeliveryDetails; payment?: OrderExternalPayment }) {
  const [method, setMethod] = useState(payment?.method ?? "");
  const methodId = useId();
  const [state, action, pending] = useActionState(saveExternalPayment.bind(null, delivery), { message: "" });
  return (
    <details className="mt-3 rounded-xl border border-slate-200 px-3">
      <summary className="min-h-11 cursor-pointer py-3 font-semibold">Configurar pago del pedido</summary>
      <form action={action} className="space-y-3 pb-3" onReset={(event) => event.preventDefault()}>
        <div>
          <label className="block text-sm font-medium" htmlFor={methodId}>Forma de pago</label>
          <select className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" id={methodId} name="method" onChange={(event) => setMethod(event.target.value)} value={method}>
            <option value="">Elige una opción</option>
            <option value="TRANSFER">Transferencia directa</option>
            <option value="ON_DELIVERY">Pago contra entrega</option>
            <option value="WOMPI">Enlace Wompi</option>
          </select>
        </div>
        {method === "WOMPI" && (
          <>
            <label className="block text-sm font-medium">Enlace de Wompi
              <input className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" defaultValue={payment?.wompiUrl ?? ""} maxLength={250} name="wompiUrl" type="url" />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input className="mt-0.5 size-5" name="wompiChecked" type="checkbox" />
              El enlace es de mi comercio, tiene el total acordado y es de un solo uso.
            </label>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <button className="min-h-11 rounded-lg bg-emerald-800 px-3 font-semibold text-white" disabled={pending} type="submit">Guardar forma de pago</button>
          {payment && <button className="min-h-11 rounded-lg border border-slate-300 px-3 font-semibold" disabled={pending} formNoValidate name="operation" type="submit" value="remove">Retirar forma de pago</button>}
        </div>
        {state.message && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
      </form>
    </details>
  );
}
