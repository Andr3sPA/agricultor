import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { RoleName } from "@/generated/prisma/enums";
import {
  assertHasRole,
  AuthenticationRequiredError,
  type UserRole,
} from "@/lib/auth/roles";

export async function getCurrentIdentity(): Promise<{
  userId: string;
  roles: UserRole[];
} | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
    select: { role: true },
  });

  return {
    userId: session.user.id,
    roles: userRoles.map(({ role }: { role: RoleName }) => role),
  };
}

export async function requireRole(requiredRole: UserRole) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    throw new AuthenticationRequiredError();
  }

  assertHasRole(identity.roles, requiredRole);
  return identity;
}
