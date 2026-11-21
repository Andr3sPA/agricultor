"use client";

import { useActionState } from "react";
import type { OrderDeliveryDetails } from "@/generated/prisma/client";
import { confirmOrderDelivery } from "./order-delivery-action";

export function OrderDeliveryConfirmationForm({ delivery }: { delivery: OrderDeliveryDetails }) {
  const [state, action, pending] = useActionState(confirmOrderDelivery.bind(null, delivery), { message: "" });
  return (
    <form action={action} className="mt-3">
      <button className="min-h-11 rounded-lg bg-emerald-800 px-3 font-semibold text-white" disabled={pending} type="submit">
        Confirmar datos de entrega
      </button>
      {state.message && <p className="mt-2 text-sm" role={state.ok ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
