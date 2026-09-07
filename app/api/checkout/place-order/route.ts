import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthenticationRequiredError, AuthorizationDeniedError, requireRole } from "@/lib/auth/server";
import { CheckoutError, placeOrder } from "@/lib/checkout/service";

const addressSchema = z.object({
  label: z.string().max(80).optional(),
  recipientName: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).optional(),
  phone: z.string().max(30).optional(),
});

const checkoutSchema = z.object({
  addressId: z.string().min(1).optional(),
  newAddress: addressSchema.optional(),
}).refine((value) => Boolean(value.addressId) !== Boolean(value.newAddress), "Choose one delivery address.");

function failure(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Only customer accounts can checkout." }, { status: 403 });
  if (error instanceof CheckoutError) {
    const status = error.code === "INVENTORY_UNAVAILABLE" ? 409 : error.code === "PAYMENT_FAILED" ? 402 : error.code === "INVALID_ADDRESS" || error.code === "INVALID_CHECKOUT" ? 422 : 409;
    return NextResponse.json({ code: error.code, message: error.message }, { status });
  }
  return NextResponse.json({ message: "The order could not be placed right now." }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("CUSTOMER");
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Please provide a valid delivery address." }, { status: 400 });
    return NextResponse.json(await placeOrder(user.id, parsed.data), { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

