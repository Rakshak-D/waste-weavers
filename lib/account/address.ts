import { prisma } from "@/lib/db/prisma";

export type AddressInput = {
  label?: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string;
};

export class AddressValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddressValidationError";
  }
}

export function normalizeAddress(input: AddressInput) {
  const values = [input.recipientName, input.line1, input.city, input.state, input.postalCode];
  if (values.some((value) => !value?.trim()) || input.postalCode.trim().length < 3) throw new AddressValidationError("Please provide a complete address.");
  const country = (input.country ?? "IN").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new AddressValidationError("Country must use a two-letter code.");
  return { label: input.label?.trim() || null, recipientName: input.recipientName.trim(), line1: input.line1.trim(), line2: input.line2?.trim() || null, city: input.city.trim(), state: input.state.trim(), postalCode: input.postalCode.trim(), country, phone: input.phone?.trim() || null };
}

export async function createCustomerAddress(userId: string, input: AddressInput) {
  return prisma.address.create({ data: { userId, ...normalizeAddress(input) } });
}

export async function updateCustomerAddress(userId: string, addressId: string, input: AddressInput) {
  const result = await prisma.address.updateMany({ where: { id: addressId, userId }, data: normalizeAddress(input) });
  if (result.count === 0) return null;
  return prisma.address.findUnique({ where: { id: addressId } });
}

export async function deleteCustomerAddress(userId: string, addressId: string): Promise<boolean> {
  const result = await prisma.address.deleteMany({ where: { id: addressId, userId } });
  return result.count > 0;
}

