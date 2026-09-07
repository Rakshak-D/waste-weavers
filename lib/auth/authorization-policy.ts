import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
};

export function canAccessAccount(user: AuthenticatedUser | null): boolean {
  return user !== null;
}

export function canAccessAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === "ADMIN";
}

export function roleForRegistration(): UserRole {
  return "CUSTOMER";
}
