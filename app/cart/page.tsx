import { CartPageClient } from "@/components/storefront/cart-page-client";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getCartView } from "@/lib/cart/service";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cart — Waste Weavers",
  description: "Review your Waste Weavers purchase and rental selections.",
};

export default async function CartPage() {
  const user = await requirePageUser("/cart");
  let cart;
  try {
    cart = await getCartView(user.id);
  } catch {
    return <StorefrontShell><main className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><p className="eyebrow">Cart</p><h1 className="mt-3 font-serif text-4xl">Cart unavailable</h1><p className="mt-4 text-[#68584a]">Your cart could not be loaded right now. Please try again shortly.</p></main></StorefrontShell>;
  }
  return <StorefrontShell><CartPageClient initialCart={cart} /></StorefrontShell>;
}

