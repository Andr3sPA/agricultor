import type { UserRole } from "@/lib/auth/roles";

export type FarmAgendaActor = {
  userId: string;
  roles: readonly UserRole[];
};

export function canManageFarmAgenda(roles: readonly UserRole[]): boolean {
  return roles.includes("PRODUCER");
}
