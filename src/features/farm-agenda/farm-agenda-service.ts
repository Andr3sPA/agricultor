import type { PrismaClient } from "@/generated/prisma/client";
import {
  canManageFarmAgenda,
  type FarmAgendaActor,
} from "./farm-agenda-access";

type FarmAgendaDatabase = Pick<PrismaClient, "farmActivity">;

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
