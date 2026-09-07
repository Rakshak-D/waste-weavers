import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthenticationRequiredError, AuthorizationDeniedError, requireRole } from "@/lib/auth/server";
import { createCustomerAddress, AddressValidationError } from "@/lib/account/address";
import { getCustomerAddresses } from "@/lib/account/service";

const addressSchema = z.object({ label: z.string().max(80).optional(), recipientName: z.string().trim().min(1).max(120), line1: z.string().trim().min(1).max(200), line2: z.string().max(200).optional(), city: z.string().trim().min(1).max(80), state: z.string().trim().min(1).max(80), postalCode: z.string().trim().min(3).max(20), country: z.string().trim().length(2).optional(), phone: z.string().max(30).optional() });

function failure(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Customer address access is required." }, { status: 403 });
  if (error instanceof AddressValidationError) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ message: "Address could not be saved." }, { status: 500 });
}

export async function GET() {
  try { const user = await requireRole("CUSTOMER"); return NextResponse.json(await getCustomerAddresses(user.id)); } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("CUSTOMER");
    const parsed = addressSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Please provide a complete address." }, { status: 400 });
    return NextResponse.json(await createCustomerAddress(user.id, parsed.data), { status: 201 });
  } catch (error) { return failure(error); }
}

