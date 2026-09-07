import { describe, expect, it } from "vitest";

import {
  canAccessAccount,
  canAccessAdmin,
  roleForRegistration,
  type AuthenticatedUser,
} from "../lib/auth/authorization-policy";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { normalizeEmail, registrationSchema } from "../lib/auth/schemas";

const customer: AuthenticatedUser = {
  id: "customer-1",
  email: "customer@example.com",
  name: "Customer",
  role: "CUSTOMER",
};

const admin: AuthenticatedUser = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN",
};

describe("authorization policy", () => {
  it("denies unauthenticated account access", () => {
    expect(canAccessAccount(null)).toBe(false);
  });

  it("allows customers and admins into authenticated account areas", () => {
    expect(canAccessAccount(customer)).toBe(true);
    expect(canAccessAccount(admin)).toBe(true);
  });

  it("allows only admins into admin areas", () => {
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(customer)).toBe(false);
    expect(canAccessAdmin(admin)).toBe(true);
  });

  it("always assigns CUSTOMER during registration", () => {
    expect(roleForRegistration()).toBe("CUSTOMER");
  });
});

describe("credential handling", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("rejects weak or mismatched registration input", () => {
    expect(registrationSchema.safeParse({ name: "A", email: "bad", password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(registrationSchema.safeParse({ name: "A", email: "a@example.com", password: "Strong123", confirmPassword: "Different123" }).success).toBe(false);
  });

  it("hashes passwords and verifies only the original password", async () => {
    const password = "StrongDemo123";
    const passwordHash = await hashPassword(password);
    expect(passwordHash).not.toBe(password);
    expect(await verifyPassword(password, passwordHash)).toBe(true);
    expect(await verifyPassword("wrong-password", passwordHash)).toBe(false);
  });
});
