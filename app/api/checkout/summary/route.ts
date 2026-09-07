import { NextResponse } from "next/server";

import { AuthenticationRequiredError, AuthorizationDeniedError, requireRole } from "@/lib/auth/server";
import { getCheckoutSummary } from "@/lib/checkout/service";

export async function GET() {
  try {
    const user = await requireRole("CUSTOMER");
    return NextResponse.json(await getCheckoutSummary(user.id));
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Only customer accounts can checkout." }, { status: 403 });
    return NextResponse.json({ message: "Checkout summary is unavailable right now." }, { status: 500 });
  }
}

