import type { PrismaClient } from "@/generated/prisma/client";
import {
  canManageFarmAgenda,
  type FarmAgendaActor,
} from "./farm-agenda-access";
import type { FarmActivityInput } from "./farm-agenda-validation";

type FarmAgendaDatabase = Pick<PrismaClient, "farmActivity">;

const colombianDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function groupFarmActivities<T extends { scheduledFor: Date }>(
  activities: readonly T[],
  now: Date,
) {
  const parts = Object.fromEntries(
    colombianDay.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const activity of activities) {
    const date = activity.scheduledFor.toISOString().slice(0, 10);
    (date < today ? past : upcoming).push(activity);
  }

  return { today, upcoming, past: past.reverse() };
}

export async function getFarmActivities(
  actor: FarmAgendaActor,
  database: FarmAgendaDatabase,
) {
  if (!canManageFarmAgenda(actor.roles)) {
    return null;
  }

  return database.farmActivity.findMany({
    where: { userId: actor.userId },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
  });
}

export async function removeFarmActivity(
  actor: FarmAgendaActor,
  activityId: string,
  database: FarmAgendaDatabase,
): Promise<boolean> {
  if (!canManageFarmAgenda(actor.roles)) {
    return false;
  }

  const deleted = await database.farmActivity.deleteMany({
    where: { id: activityId, userId: actor.userId },
  });
  return deleted.count === 1;
}

export function farmActivityData(input: FarmActivityInput) {
  return {
    ...input,
    scheduledFor: new Date(`${input.scheduledFor}T00:00:00.000Z`),
  };
}

export async function updateOwnedFarmActivity(
  actor: FarmAgendaActor,
  activityId: string,
  input: FarmActivityInput,
  database: FarmAgendaDatabase,
): Promise<boolean> {
  if (!canManageFarmAgenda(actor.roles)) return false;

  const updated = await database.farmActivity.updateMany({
    where: { id: activityId, userId: actor.userId },
    data: farmActivityData(input),
  });
  return updated.count === 1;
}
