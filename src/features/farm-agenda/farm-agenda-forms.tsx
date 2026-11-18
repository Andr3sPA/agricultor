"use client";

import { useActionState, useRef, useState } from "react";
import {
  createFarmActivity,
  deleteFarmActivity,
  updateFarmActivity,
  type FarmActivityFormState,
} from "./farm-agenda-actions";
import { FARM_ACTIVITY_TYPES, type FarmActivityInput } from "./farm-agenda-validation";

const initialState: FarmActivityFormState = {};

function FormMessage({ state }: { state: FarmActivityFormState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`text-sm ${state.ok ? "text-emerald-900" : "text-red-800"}`}
      role={state.ok ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

export function FarmActivityForm({
  activity,
}: {
  activity?: FarmActivityInput & { id: string };
}) {
  const [state, action, pending] = useActionState(
    activity ? updateFarmActivity : createFarmActivity,
    initialState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-6 space-y-5">
      {activity && <input name="activityId" type="hidden" value={activity.id} />}
      <div>
        <label className="mb-2 block font-medium" htmlFor="activityType">
          Actividad
        </label>
        <select
          aria-describedby={errors.activityType ? "activityType-error" : undefined}
          aria-invalid={Boolean(errors.activityType)}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"
          defaultValue={activity?.activityType ?? ""}
          key={activity?.activityType}
          id="activityType"
          name="activityType"
          required
        >
          <option value="">Elige una actividad</option>
          {FARM_ACTIVITY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.activityType && (
          <p className="mt-1 text-sm text-red-800" id="activityType-error">
            {errors.activityType}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-medium" htmlFor="scheduledFor">
          Fecha
        </label>
        <input
          aria-describedby={errors.scheduledFor ? "scheduledFor-error" : undefined}
          aria-invalid={Boolean(errors.scheduledFor)}
          className="min-h-12 w-full rounded-xl border border-slate-300 px-4"
          defaultValue={activity?.scheduledFor ?? ""}
          id="scheduledFor"
          name="scheduledFor"
          required
          type="date"
        />
        {errors.scheduledFor && (
          <p className="mt-1 text-sm text-red-800" id="scheduledFor-error">
            {errors.scheduledFor}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-medium" htmlFor="cropProduct">
          Cultivo o producto <span className="font-normal">(opcional)</span>
        </label>
        <input
          aria-describedby={errors.cropProduct ? "cropProduct-error" : undefined}
          aria-invalid={Boolean(errors.cropProduct)}
          className="min-h-12 w-full rounded-xl border border-slate-300 px-4"
          defaultValue={activity?.cropProduct ?? ""}
          id="cropProduct"
          maxLength={100}
          name="cropProduct"
          type="text"
        />
        {errors.cropProduct && (
          <p className="mt-1 text-sm text-red-800" id="cropProduct-error">
            {errors.cropProduct}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-medium" htmlFor="notes">
          Nota <span className="font-normal">(opcional)</span>
        </label>
        <textarea
          aria-describedby={errors.notes ? "notes-error" : undefined}
          aria-invalid={Boolean(errors.notes)}
          className="min-h-28 w-full rounded-xl border border-slate-300 p-4"
          defaultValue={activity?.notes ?? ""}
          id="notes"
          maxLength={1000}
          name="notes"
          rows={4}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-800" id="notes-error">
            {errors.notes}
          </p>
        )}
      </div>

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : activity ? "Guardar cambios" : "Agregar a mi agenda"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteFarmActivityForm({
  activityId,
}: {
  activityId: string;
}) {
  const [state, action, pending] = useActionState(
    deleteFarmActivity,
    initialState,
  );
  const [confirming, setConfirming] = useState(false);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const confirmationId = `confirm-delete-labor-${activityId}`;

  return (
    <form action={action} className="mt-4">
      <input name="activityId" type="hidden" value={activityId} />
      <button
        aria-controls={confirmationId}
        aria-expanded={confirming}
        className="min-h-12 rounded-xl border border-red-800 px-4 py-2 font-semibold text-red-900 hover:bg-red-50 disabled:opacity-60"
        disabled={pending}
        onClick={() => setConfirming(!confirming)}
        ref={deleteTrigger}
        type="button"
      >
        Eliminar actividad
      </button>
      <div className="mt-3 space-y-3 rounded-xl bg-red-50 p-4" hidden={!confirming} id={confirmationId}>
        <p className="text-sm text-red-950">
          ¿Quieres borrar esta labor de tu agenda? Una vez borrada, no podrás recuperarla.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-12 rounded-xl border border-slate-500 px-4 py-2 font-semibold"
            disabled={pending}
            onClick={() => {
              setConfirming(false);
              deleteTrigger.current?.focus();
            }}
            type="button"
          >
            Conservar labor
          </button>
          {confirming && (
            <button
              className="min-h-12 rounded-xl bg-red-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Eliminando…" : "Sí, eliminar labor"}
            </button>
          )}
        </div>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
