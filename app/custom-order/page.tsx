import { CustomOrderForm } from "@/components/custom-orders/custom-order-form";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export default async function CustomOrderPage() { await requirePageUser("/custom-order"); return <StorefrontShell><main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24"><div className="max-w-3xl"><p className="eyebrow">Custom event décor</p><h1 className="mt-4 font-serif text-6xl leading-[0.95] tracking-[-0.04em]">Tell us what your event needs.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#68584a]">Share the shape of the celebration, the atmosphere you are after, and what you already know. Our team can review the request and respond with the next step.</p></div><div className="mt-12"><CustomOrderForm /></div></main></StorefrontShell>; }
