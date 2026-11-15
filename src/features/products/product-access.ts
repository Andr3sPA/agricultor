import type { UserRole } from "@/lib/auth/roles";

export type ProductActor = {
  userId: string;
  roles: readonly UserRole[];
};

export function canManageProducts(roles: readonly UserRole[]): boolean {
  return roles.includes("PRODUCER");
}

export function canEditProduct(
  actor: ProductActor,
  ownerId: string,
): boolean {
  return canManageProducts(actor.roles) && actor.userId === ownerId;
}
