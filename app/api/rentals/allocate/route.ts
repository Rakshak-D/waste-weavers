import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole, AuthenticationRequiredError, AuthorizationDeniedError } from "@/lib/auth/server";
import { allocateRentalInventory } from "@/lib/rental/allocation";
import { DateRangeValidationError } from "@/lib/rental/date";

const requestSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  quantity: z.coerce.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  let customer;
  try {
    customer = await requireRole("CUSTOMER");
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "You are not allowed to create a rental." }, { status: 403 });
    return NextResponse.json({ message: "Authorization could not be checked." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid rental allocation request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid rental allocation request." }, { status: 400 });

  try {
    const result = await allocateRentalInventory({ ...parsed.data, userId: customer.id });
    if (!result.success) {
      const status = result.code === "PRODUCT_NOT_FOUND" ? 404 : result.code === "PRODUCT_NOT_RENTABLE" ? 422 : 409;
      return NextResponse.json({ code: result.code, message: result.message }, { status });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof DateRangeValidationError || error instanceof Error && error.message.startsWith("Quantity")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Rental allocation could not be completed." }, { status: 500 });
  }
}
