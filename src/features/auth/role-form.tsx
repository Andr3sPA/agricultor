"use client";

import { useActionState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { enableSelling } from "./role-actions";

export function SellForm() {
  const [state, action, pending] = useActionState(enableSelling, { message: "" });

  return (
    <form action={action} aria-busy={pending} className="mt-4 space-y-2">
      <button
        className="min-h-12 w-full rounded-md bg-[#edc574] px-5 py-3 font-semibold text-[#322714] hover:bg-[#e4b65b] disabled:opacity-60 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? <LoadingIndicator label="Abriendo ventas…" /> : "Vender productos"}
      </button>
      {state.message && <p className="text-sm text-red-800" role="alert">{state.message}</p>}
    </form>
  );
}
