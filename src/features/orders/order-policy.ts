import type { OrderStatus } from "@/generated/prisma/enums";
import type { UserRole } from "@/lib/auth/roles";

export type OrderActor = {
  userId: string;
  roles: readonly UserRole[];
};

export type OrderDecision = Extract<OrderStatus, "ACCEPTED" | "REJECTED">;

export function canRequestOrder(
  actor: OrderActor,
  producerId: string,
): boolean {
  return actor.roles.includes("BUYER") && actor.userId !== producerId;
}

export function canDecideOrder(
  actor: OrderActor,
  producerId: string,
): boolean {
  return actor.roles.includes("PRODUCER") && actor.userId === producerId;
}

export function transitionOrder(
  current: OrderStatus,
  decision: OrderDecision,
): OrderStatus | null {
  return current === "PENDING" ? decision : null;
}
