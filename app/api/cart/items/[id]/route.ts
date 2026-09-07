import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole, AuthenticationRequiredError, AuthorizationDeniedError } from "@/lib/auth/server";
import { CartServiceError, removeCartItem, updateCartItem } from "@/lib/cart/service";

const updateSchema = z.object({
  quantity: z.number().int().min(1).max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function failure(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in to use your cart." }, { status: 401 });
  if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Only customer accounts can use a shopping cart." }, { status: 403 });
  if (error instanceof CartServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.code === "CART_ITEM_NOT_FOUND" ? 404 : error.code === "RENTAL_UNAVAILABLE" ? 409 : 422 });
  return NextResponse.json({ message: "The cart could not be updated right now." }, { status: 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("CUSTOMER");
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Cart item details are invalid." }, { status: 400 });
    return NextResponse.json(await updateCartItem(user.id, (await params).id, parsed.data));
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("CUSTOMER");
    return NextResponse.json(await removeCartItem(user.id, (await params).id));
  } catch (error) {
    return failure(error);
  }
}

