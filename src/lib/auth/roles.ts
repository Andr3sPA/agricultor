export const roles = [
  "PRODUCER",
  "BUYER",
  "TRADER",
  "ASSOCIATION",
  "ADMIN",
] as const;

export type UserRole = (typeof roles)[number];
export type SelfAssignableRole = Extract<
  UserRole,
  "PRODUCER" | "BUYER" | "TRADER"
>;

const selfAssignableRoles: readonly SelfAssignableRole[] = [
  "PRODUCER",
  "BUYER",
  "TRADER",
];

export function isSelfAssignableRole(
  value: unknown,
): value is SelfAssignableRole {
  return (
    typeof value === "string" &&
    selfAssignableRoles.some((role) => role === value)
  );
}

export function hasRole(
  userRoles: readonly UserRole[],
  requiredRole: UserRole,
): boolean {
  return userRoles.includes(requiredRole);
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Debes iniciar sesión para continuar.");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super("No tienes permiso para realizar esta acción.");
    this.name = "AuthorizationError";
  }
}

export function assertHasRole(
  userRoles: readonly UserRole[],
  requiredRole: UserRole,
): void {
  if (!hasRole(userRoles, requiredRole)) {
    throw new AuthorizationError();
  }
}
