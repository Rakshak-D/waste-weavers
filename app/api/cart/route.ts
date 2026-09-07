import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole, AuthenticationRequiredError, AuthorizationDeniedError } from "@/lib/auth/server";
import { addCartItem, CartServiceError, clearCart, getCartView } from "@/lib/cart/service";

const addItemSchema = z.object({
  productId: z.string().min(1),
  itemType: z.enum(["PURCHASE", "RENTAL"]),
  quantity: z.number().int().min(1).max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function errorResponse(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in to use your cart." }, { status: 401 });
  if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Only customer accounts can use a shopping cart." }, { status: 403 });
  if (error instanceof CartServiceError) {
    const status = error.code === "PRODUCT_NOT_FOUND" ? 404 : error.code === "CART_ITEM_NOT_FOUND" ? 404 : error.code === "RENTAL_UNAVAILABLE" ? 409 : 422;
    return NextResponse.json({ code: error.code, message: error.message }, { status });
  }
  return NextResponse.json({ message: "The cart could not be updated right now." }, { status: 500 });
}

export async function GET() {
  try {
    const user = await requireRole("CUSTOMER");
    return NextResponse.json(await getCartView(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("CUSTOMER");
    const parsed = addItemSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Cart item details are invalid." }, { status: 400 });
    return NextResponse.json(await addCartItem(user.id, parsed.data), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireRole("CUSTOMER");
    return NextResponse.json(await clearCart(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

