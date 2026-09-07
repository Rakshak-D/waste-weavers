import { CustomOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { parseDateOnly, todayDateOnly } from "@/lib/rental/date";

export class CustomOrderServiceError extends Error {
  constructor(public readonly code: "VALIDATION" | "NOT_FOUND" | "INVALID_STATE", message: string) { super(message); this.name = "CustomOrderServiceError"; }
}

export type CustomOrderInput = { eventType: string; eventDate?: string | null; guestCount?: number | null; requirements: string; budget?: string | null; referenceFileUrl?: string | null };

function validateReference(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const reference = value.trim();
  if (reference.length > 2048 || !(reference.startsWith("/") || /^https:\/\//i.test(reference))) throw new CustomOrderServiceError("VALIDATION", "Reference must be a safe local path or HTTPS URL.");
  if (reference.includes("..")) throw new CustomOrderServiceError("VALIDATION", "Reference path is invalid.");
  return reference;
}

export function validateCustomOrderInput(input: CustomOrderInput) {
  const eventType = input.eventType.trim();
  const requirements = input.requirements.trim();
  if (!eventType || eventType.length > 80) throw new CustomOrderServiceError("VALIDATION", "Event type is required and must be concise.");
  if (requirements.length < 10 || requirements.length > 5000) throw new CustomOrderServiceError("VALIDATION", "Requirements must be between 10 and 5,000 characters.");
  let eventDate: Date | null = null;
  if (input.eventDate) { try { const normalized = parseDateOnly(input.eventDate, "Event date"); if (input.eventDate < todayDateOnly()) throw new CustomOrderServiceError("VALIDATION", "Event date cannot be in the past."); eventDate = normalized; } catch (error) { if (error instanceof CustomOrderServiceError) throw error; throw new CustomOrderServiceError("VALIDATION", error instanceof Error ? error.message : "Event date is invalid."); } }
  if (input.guestCount !== null && input.guestCount !== undefined && (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 100000)) throw new CustomOrderServiceError("VALIDATION", "Guest count must be a whole number between 1 and 100,000.");
  if (input.budget !== null && input.budget !== undefined && input.budget !== "") { const budget = Number(input.budget); if (!Number.isFinite(budget) || budget < 0 || budget > 100000000) throw new CustomOrderServiceError("VALIDATION", "Budget must be between ₹0 and ₹10 crore."); }
  return { eventType, eventDate, guestCount: input.guestCount ?? null, requirements, budget: input.budget ? input.budget : null, referenceFileUrl: validateReference(input.referenceFileUrl) };
}

export async function createCustomOrderRequest(userId: string, input: CustomOrderInput) {
  const data = validateCustomOrderInput(input);
  return prisma.customOrder.create({ data: { customerId: userId, eventType: data.eventType, eventDate: data.eventDate, guestCount: data.guestCount, requirements: data.requirements, budget: data.budget, referenceFileUrl: data.referenceFileUrl, status: CustomOrderStatus.REQUESTED } });
}

export async function getCustomerCustomOrders(userId: string) {
  return prisma.customOrder.findMany({ where: { customerId: userId }, orderBy: { createdAt: "desc" }, select: { id: true, eventType: true, eventDate: true, guestCount: true, requirements: true, budget: true, currency: true, referenceFileUrl: true, status: true, createdAt: true, updatedAt: true } });
}

export async function getCustomerCustomOrder(userId: string, id: string) {
  return prisma.customOrder.findFirst({ where: { id, customerId: userId }, select: { id: true, eventType: true, eventDate: true, guestCount: true, requirements: true, budget: true, currency: true, referenceFileUrl: true, status: true, createdAt: true, updatedAt: true } });
}
