import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getCheckoutSummary } from "@/lib/checkout/service";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout — Waste Weavers", description: "Review and confirm your Waste Weavers order." };

export default async function CheckoutPage() {
  const user = await requirePageUser("/checkout");
  let summary;
  try {
    summary = await getCheckoutSummary(user.id);
  } catch {
    return <StorefrontShell><main className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><p className="eyebrow">Checkout</p><h1 className="mt-3 font-serif text-4xl">Checkout unavailable</h1><p className="mt-4 text-[#68584a]">We could not load your checkout summary. Please try again shortly.</p></main></StorefrontShell>;
  }
  return <StorefrontShell><CheckoutPageClient initialSummary={summary} customerName={user.name ?? null} customerEmail={user.email} /></StorefrontShell>;
}
