"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSelfAssignableRole,
  type SelfAssignableRole,
} from "@/lib/auth/roles";
import { adoptRole, type RoleActionState } from "./role-actions";

const initialState: RoleActionState = {};

export function RoleForm({
  initialRole,
}: {
  initialRole?: SelfAssignableRole;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<SelfAssignableRole>(
    initialRole ?? "BUYER",
  );
  const [state, action, pending] = useActionState(adoptRole, initialState);

  useEffect(() => {
    if (
      state.ok &&
      initialRole === "PRODUCER" &&
      selectedRole === "PRODUCER"
    ) {
      router.replace("/mi-cuenta/productos");
      router.refresh();
    }
  }, [initialRole, router, selectedRole, state.ok]);

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
        value={selectedRole}
        onChange={(event) => {
          if (isSelfAssignableRole(event.target.value)) {
            setSelectedRole(event.target.value);
          }
        }}
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
        {pending
          ? "Guardando..."
          : initialRole === "PRODUCER" && selectedRole === "PRODUCER"
            ? "Agregar perfil y continuar"
            : "Agregar este perfil"}
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
