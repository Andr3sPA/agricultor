import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import { canManageFarmAgenda } from "./farm-agenda-access";
import {
  getFarmActivities,
  groupFarmActivities,
  removeFarmActivity,
} from "./farm-agenda-service";
import { validateFarmActivityInput } from "./farm-agenda-validation";

type FarmAgendaDatabase = Pick<PrismaClient, "farmActivity">;

const validInput = {
  activityType: "SOWING",
  scheduledFor: "2026-11-20",
  cropProduct: "Maíz",
  notes: "Lote norte",
};

it("uses Colombia's day for upcoming tasks and shows past tasks newest first", () => {
  const activities = ["2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"].map(
    (date) => ({ scheduledFor: new Date(`${date}T00:00:00.000Z`) }),
  );
  const result = groupFarmActivities(activities, new Date("2026-11-21T03:00:00Z"));

  assert.equal(result.today, "2026-11-20");
  assert.deepEqual(result.upcoming, activities.slice(2));
  assert.deepEqual(result.past, [activities[1], activities[0]]);
  assert.equal(
    groupFarmActivities(activities, new Date("2026-11-21T05:00:00Z")).today,
    "2026-11-21",
  );
});

describe("farm agenda validation", () => {
  it("accepts a valid activity and normalizes optional blank fields", () => {
    const result = validateFarmActivityInput({
      ...validInput,
      cropProduct: " ",
      notes: "",
    });

    assert.deepEqual(result, {
      ok: true,
      data: {
        activityType: "SOWING",
        scheduledFor: "2026-11-20",
        cropProduct: null,
        notes: null,
      },
    });
  });

  it("rejects unknown activity types and impossible or malformed dates", () => {
    for (const scheduledFor of ["2026-02-30", "20-11-2026", ""]) {
      const result = validateFarmActivityInput({ ...validInput, scheduledFor });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.ok(result.errors.scheduledFor);
      }
    }

    const invalidType = validateFarmActivityInput({
      ...validInput,
      activityType: "SPRAYING",
    });
    assert.equal(invalidType.ok, false);
    if (!invalidType.ok) {
      assert.ok(invalidType.errors.activityType);
    }
  });

  it("rejects crop and note values beyond their storage limits", () => {
    const result = validateFarmActivityInput({
      ...validInput,
      cropProduct: "a".repeat(101),
      notes: "b".repeat(1001),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.cropProduct);
      assert.ok(result.errors.notes);
    }
  });
});

describe("farm agenda authorization", () => {
  it("allows only producers to manage an agenda", () => {
    assert.equal(canManageFarmAgenda(["PRODUCER"]), true);
    assert.equal(canManageFarmAgenda(["BUYER"]), false);
  });

  it("lists only the signed-in producer's activities", async () => {
    const queries: Array<Record<string, unknown>> = [];
    const database = {
      farmActivity: {
        findMany: async (args: Record<string, unknown>) => {
          queries.push(args);
          return [];
        },
      },
    } as unknown as FarmAgendaDatabase;

    await getFarmActivities(
      { userId: "producer-1", roles: ["PRODUCER"] },
      database,
    );
    const resultForBuyer = await getFarmActivities(
      { userId: "buyer-1", roles: ["BUYER"] },
      database,
    );

    assert.deepEqual(queries, [
      {
        where: { userId: "producer-1" },
        orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
      },
    ]);
    assert.equal(resultForBuyer, null);
  });

  it("deletes only an activity owned by the signed-in producer", async () => {
    const deleteQueries: Array<Record<string, unknown>> = [];
    const database = {
      farmActivity: {
        deleteMany: async (args: { where: Record<string, string> }) => {
          deleteQueries.push(args);
          return {
            count:
              args.where.userId === "producer-1" &&
              args.where.id === "activity-1"
                ? 1
                : 0,
          };
        },
      },
    } as unknown as FarmAgendaDatabase;

    const ownerDeleted = await removeFarmActivity(
      { userId: "producer-1", roles: ["PRODUCER"] },
      "activity-1",
      database,
    );
    const otherOwnerDeleted = await removeFarmActivity(
      { userId: "producer-2", roles: ["PRODUCER"] },
      "activity-1",
      database,
    );
    const buyerDeleted = await removeFarmActivity(
      { userId: "buyer-1", roles: ["BUYER"] },
      "activity-1",
      database,
    );

    assert.equal(ownerDeleted, true);
    assert.equal(otherOwnerDeleted, false);
    assert.equal(buyerDeleted, false);
    assert.deepEqual(deleteQueries, [
      { where: { id: "activity-1", userId: "producer-1" } },
      { where: { id: "activity-1", userId: "producer-2" } },
    ]);
  });
});
