"use client";

import { useActionState } from "react";
import { adoptRole, type RoleActionState } from "./role-actions";

const initialState: RoleActionState = {};

export function RoleForm() {
  const [state, action, pending] = useActionState(adoptRole, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm font-medium" htmlFor="role">
        Puedes participar como
      </label>
      <select
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        id="role"
        name="role"
        required
      >
        <option value="BUYER">Comprador o compradora</option>
        <option value="PRODUCER">Productor o productora</option>
        <option value="TRADER">Comerciante</option>
      </select>
      <button
        className="rounded-xl border border-emerald-900 px-5 py-3 font-semibold text-emerald-950 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : "Agregar este perfil"}
      </button>
      {state.message && (
        <p
          className={state.ok ? "text-sm text-emerald-900" : "text-sm text-red-800"}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
