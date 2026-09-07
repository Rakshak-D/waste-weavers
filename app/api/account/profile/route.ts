import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthenticationRequiredError, AuthorizationDeniedError, requireRole } from "@/lib/auth/server";
import { updateCustomerProfile } from "@/lib/account/service";

const profileSchema = z.object({ name: z.string().trim().min(1).max(120), phone: z.string().max(30).optional() });

export async function PATCH(request: Request) {
  try {
    const user = await requireRole("CUSTOMER");
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Please provide a valid name and phone number." }, { status: 400 });
    return NextResponse.json(await updateCustomerProfile(user.id, parsed.data));
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Customer profile access is required." }, { status: 403 });
    return NextResponse.json({ message: "Profile could not be updated." }, { status: 500 });
  }
}

