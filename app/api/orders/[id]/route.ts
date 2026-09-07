import { NextResponse } from "next/server";

import { AuthenticationRequiredError, AuthorizationDeniedError, requireRole } from "@/lib/auth/server";
import { getOrderForUser } from "@/lib/checkout/service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("CUSTOMER");
    const order = await getOrderForUser(user.id, (await params).id);
    if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Only customer accounts can view customer orders." }, { status: 403 });
    return NextResponse.json({ message: "Order could not be loaded." }, { status: 500 });
  }
}

