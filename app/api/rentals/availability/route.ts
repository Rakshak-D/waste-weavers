import { NextResponse } from "next/server";
import { z } from "zod";

import { getAvailableInventoryUnits } from "@/lib/rental/availability";
import { DateRangeValidationError } from "@/lib/rental/date";

const requestSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  quantity: z.coerce.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid availability request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid availability request." }, { status: 400 });

  try {
    const result = await getAvailableInventoryUnits(parsed.data.productId, parsed.data, parsed.data.quantity);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DateRangeValidationError || error instanceof Error && error.message.startsWith("Quantity")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Availability could not be checked right now." }, { status: 500 });
  }
}
