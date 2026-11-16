import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DeleteFarmActivityForm,
  FarmActivityForm,
} from "@/features/farm-agenda/farm-agenda-forms";
import { getFarmActivities } from "@/features/farm-agenda/farm-agenda-service";
import { FARM_ACTIVITY_TYPES } from "@/features/farm-agenda/farm-agenda-validation";
import { canManageFarmAgenda } from "@/features/farm-agenda/farm-agenda-access";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeZone: "UTC",
});

export default async function FarmAgendaPage() {
  const identity = await getCurrentIdentity();
  if (!identity) {
    redirect("/iniciar-sesion");
  }
  if (!canManageFarmAgenda(identity.roles)) {
    redirect("/mi-cuenta");
  }

  const activities = await getFarmActivities(identity, prisma);
  if (!activities) {
    redirect("/mi-cuenta");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="font-semibold text-emerald-900 underline"
        href="/mi-cuenta"
      >
        Volver a mi cuenta
      </Link>
      <section className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Agricultor
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Mi agenda de labores</h1>
        <p className="mt-3 text-slate-700">
          Registra y consulta tus actividades planificadas.
        </p>
        <FarmActivityForm />
      </section>

      <section
        aria-labelledby="farm-activities-title"
        className="mt-8 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
      >
        <h2 className="text-2xl font-semibold" id="farm-activities-title">
          Actividades registradas
        </h2>
        {activities.length === 0 ? (
          <p className="mt-4 text-slate-700">
            Aún no tienes actividades en tu agenda.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {activities.map((activity) => (
              <li
                className="rounded-2xl border border-slate-200 p-5"
                key={activity.id}
              >
                <h3 className="text-lg font-semibold">
                  {
                    FARM_ACTIVITY_TYPES.find(
                      ({ value }) => value === activity.activityType,
                    )?.label
                  }
                </h3>
                <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium">Fecha</dt>
                    <dd>{dateFormatter.format(activity.scheduledFor)}</dd>
                  </div>
                  {activity.cropProduct && (
                    <div>
                      <dt className="font-medium">Cultivo o producto</dt>
                      <dd>{activity.cropProduct}</dd>
                    </div>
                  )}
                  {activity.notes && (
                    <div className="sm:col-span-2">
                      <dt className="font-medium">Nota</dt>
                      <dd className="whitespace-pre-wrap">{activity.notes}</dd>
                    </div>
                  )}
                </dl>
                <DeleteFarmActivityForm activityId={activity.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
