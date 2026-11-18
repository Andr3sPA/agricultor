import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DeleteFarmActivityForm,
  FarmActivityForm,
} from "@/features/farm-agenda/farm-agenda-forms";
import {
  getFarmActivities,
  groupFarmActivities,
} from "@/features/farm-agenda/farm-agenda-service";
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

  const { today, upcoming, past } = groupFarmActivities(activities, new Date());

  function activityList(list: NonNullable<typeof activities>) {
    return (
      <ul className="mt-5 space-y-4">
        {list.map((activity) => {
          const date = activity.scheduledFor.toISOString().slice(0, 10);
          return (
            <li className="rounded-2xl border border-slate-200 p-4 sm:p-5" key={activity.id}>
              <h3 className="text-lg font-semibold">
                {FARM_ACTIVITY_TYPES.find(({ value }) => value === activity.activityType)?.label}
              </h3>
              <p className="mt-1 text-sm font-medium text-emerald-900">
                {date === today && <>Hoy {"·"} </>}
                <time dateTime={date}>{dateFormatter.format(activity.scheduledFor)}</time>
              </p>
              {(activity.cropProduct || activity.notes) && (
                <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  {activity.cropProduct && (
                    <div>
                      <dt className="font-medium">Cultivo o producto</dt>
                      <dd className="wrap-anywhere">{activity.cropProduct}</dd>
                    </div>
                  )}
                  {activity.notes && (
                    <div className="sm:col-span-2">
                      <dt className="font-medium">Nota</dt>
                      <dd className="whitespace-pre-wrap wrap-anywhere">{activity.notes}</dd>
                    </div>
                  )}
                </dl>
              )}
              <DeleteFarmActivityForm activityId={activity.id} />
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline"
        href="/mi-cuenta"
      >
        Volver a mi cuenta
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">Mi agenda de labores</h1>
      <a
        className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white"
        href="#agregar-labor"
      >
        Agregar una labor
      </a>
      <section
        aria-labelledby="farm-activities-title"
        className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
      >
        <h2 className="text-2xl font-semibold" id="farm-activities-title">
          Hoy y próximas labores
        </h2>
        {upcoming.length > 0 ? activityList(upcoming) : (
          <p className="mt-4 text-slate-700">No tienes próximas labores en la agenda.</p>
        )}
        {past.length > 0 && (
          <details className="mt-5 border-t border-slate-200 pt-3">
            <summary className="min-h-12 cursor-pointer py-3 font-semibold text-emerald-900">
              Labores de fechas anteriores ({past.length})
            </summary>
            {activityList(past)}
          </details>
        )}
      </section>
      <section
        aria-labelledby="add-farm-activity-title"
        className="mt-6 scroll-mt-4 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8"
        id="agregar-labor"
        tabIndex={-1}
      >
        <h2 className="text-2xl font-semibold" id="add-farm-activity-title">
          Agregar una labor
        </h2>
        <FarmActivityForm />
      </section>
    </main>
  );
}
