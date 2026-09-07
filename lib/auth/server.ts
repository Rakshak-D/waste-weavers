import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  canAccessAdmin,
  type AuthenticatedUser,
} from "@/lib/auth/authorization-policy";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("Authorization denied.");
    this.name = "AuthorizationDeniedError";
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationRequiredError();
  return user;
}

export async function requireRole(role: "CUSTOMER" | "ADMIN"): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  if (user.role !== role) throw new AuthorizationDeniedError();
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  if (!canAccessAdmin(user)) throw new AuthorizationDeniedError();
  return user;
}

export async function requirePageUser(callbackUrl: string): Promise<AuthenticatedUser> {
  try {
    return await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw error;
  }
}

export async function requirePageAdmin(): Promise<AuthenticatedUser> {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login?callbackUrl=/admin");
    if (error instanceof AuthorizationDeniedError) redirect("/account");
    throw error;
  }
}
