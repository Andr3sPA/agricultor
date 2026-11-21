"use client";

import { useActionState, useId } from "react";
import { saveOrderSellerContact } from "./order-seller-contact-action";

export function OrderSellerContactForm({ orderId, whatsapp }: { orderId: string; whatsapp?: string }) {
  const id = useId();
  const [state, action, pending] = useActionState(saveOrderSellerContact.bind(null, orderId), { message: "" });
  return (
    <form action={action} className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3">
      <label className="block font-medium" htmlFor={id}>WhatsApp del vendedor</label>
      <p className="text-sm text-slate-700" id={`${id}-ayuda`}>
        Al compartirlo, solo el comprador de este pedido podrá usarlo para contactarte.
      </p>
      <input
        aria-describedby={`${id}-ayuda`}
        className="min-h-12 w-full rounded-lg border border-slate-300 px-3"
        defaultValue={whatsapp?.slice(2) ?? ""}
        id={id}
        maxLength={24}
        name="whatsapp"
        placeholder="Celular de 10 dígitos"
        type="tel"
      />
      <div className="flex flex-wrap gap-2">
        <button className="min-h-11 rounded-lg bg-emerald-800 px-3 font-semibold text-white" disabled={pending} type="submit">
          Compartir WhatsApp
        </button>
        {whatsapp && (
          <button className="min-h-11 rounded-lg border border-slate-300 px-3 font-semibold" disabled={pending} name="operacion" type="submit" value="retirar">
            Retirar número
          </button>
        )}
      </div>
      {state.message && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
