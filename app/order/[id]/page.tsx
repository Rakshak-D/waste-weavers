import Link from "next/link";
import { notFound } from "next/navigation";

import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getOrderForUser } from "@/lib/checkout/service";
import { requirePageUser } from "@/lib/auth/server";
import { formatMoney } from "@/lib/pricing/engine";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser(`/order/${(await params).id}`);
  const order = await getOrderForUser(user.id, (await params).id);
  if (!order) notFound();
  const snapshot = order.shippingAddressSnapshot && typeof order.shippingAddressSnapshot === "object" && !Array.isArray(order.shippingAddressSnapshot) ? order.shippingAddressSnapshot as Record<string, unknown> : null;
  return <StorefrontShell><main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16"><p className="eyebrow">Order confirmed</p><h1 className="mt-3 font-serif text-5xl">Thank you.</h1><p className="mt-4 text-[#68584a]">Order {order.orderNumber} · {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)}</p><div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]"><section className="border-t border-[#cdbb9f]"><div className="grid gap-4 border-b border-[#dfd2be] py-5 text-sm sm:grid-cols-3"><div><p className="eyebrow">Order status</p><p className="mt-2 font-medium">{order.status}</p></div><div><p className="eyebrow">Payment</p><p className="mt-2 font-medium">{order.paymentStatus}</p></div><div><p className="eyebrow">Type</p><p className="mt-2 font-medium">{order.type}</p></div></div><div className="divide-y divide-[#dfd2be]">{order.items.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-4 py-5"><div><p className="font-serif text-2xl">{item.product.name}</p><p className="mt-1 text-sm text-[#665548]">{item.itemType === "RENTAL" ? "Rental" : "Purchase"} · quantity {item.quantity}</p>{item.itemType === "RENTAL" && item.rentalPricingSnapshot && typeof item.rentalPricingSnapshot === "object" && !Array.isArray(item.rentalPricingSnapshot) && "startDate" in item.rentalPricingSnapshot && "endDate" in item.rentalPricingSnapshot && <p className="mt-2 text-sm text-[#68584a]">Rental period: {String(item.rentalPricingSnapshot.startDate)} → {String(item.rentalPricingSnapshot.endDate)}</p>}</div><p className="font-medium">{formatMoney(Number(item.lineTotal), item.currency)}</p></div>)}</div></section><aside className="h-fit border border-[#cdbb9f] bg-[#fffdf8] p-6"><p className="eyebrow">Delivery snapshot</p>{snapshot && <p className="mt-4 text-sm leading-6 text-[#68584a]">{String(snapshot.recipientName ?? "")}<br />{String(snapshot.line1 ?? "")}{snapshot.line2 ? <><br />{String(snapshot.line2)}</> : null}<br />{String(snapshot.city ?? "")}, {String(snapshot.state ?? "")} {String(snapshot.postalCode ?? "")}</p>}<div className="mt-6 border-t border-[#dfd2be] pt-5"><div className="flex justify-between font-serif text-2xl"><span>Total</span><span>{formatMoney(Number(order.grandTotal ?? 0), order.currency)}</span></div></div></aside></div><Link href="/shop" className="nav-link mt-10 inline-block text-sm font-medium text-[#5f4630]">Continue browsing →</Link></main></StorefrontShell>;
}

