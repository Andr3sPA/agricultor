import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canManageFarmAgenda } from "@/features/farm-agenda/farm-agenda-access";
import { FarmActivityForm } from "@/features/farm-agenda/farm-agenda-forms";
import { FARM_ACTIVITY_TYPES } from "@/features/farm-agenda/farm-agenda-validation";
import { getCurrentIdentity } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export default async function EditFarmActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/iniciar-sesion");
  if (!canManageFarmAgenda(identity.roles)) redirect("/mi-cuenta");

  const { activityId } = await params;
  const activity = await prisma.farmActivity.findFirst({
    where: { id: activityId, userId: identity.userId },
  });
  const type = FARM_ACTIVITY_TYPES.find(({ value }) => value === activity?.activityType);
  if (!activity || !type) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline"
        href="/mi-cuenta/agenda"
      >
        Volver a mi agenda
      </Link>
      <section className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold">Editar labor</h1>
        <FarmActivityForm
          activity={{
            id: activity.id,
            activityType: type.value,
            scheduledFor: activity.scheduledFor.toISOString().slice(0, 10),
            cropProduct: activity.cropProduct,
            notes: activity.notes,
          }}
        />
      </section>
    </main>
  );
}
