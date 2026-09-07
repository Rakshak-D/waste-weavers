import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountFrame, RentalTimeline, StatusBadge, formatTimelineDate } from "@/components/account/account-ui";
import { getCustomerRental } from "@/lib/account/service";
import { formatMoney } from "@/lib/pricing/engine";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const user = await requirePageUser(`/account/rentals/${id}`);
  const rental = await getCustomerRental(user.id, id);
  if (!rental) notFound();
  return <AccountFrame title={rental.products[0]?.name ?? "Rental details"} intro="Your rental journey, dates, and current status.">
    <div className="mt-8 flex flex-wrap items-center gap-3"><StatusBadge status={rental.status} kind="rental" />{rental.return && <StatusBadge status={rental.return.status} kind="return" />}{rental.order && <Link href={`/account/orders/${rental.order.id}`} className="nav-link text-sm">Order {rental.order.orderNumber} →</Link>}</div>
    <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]"><section className="border-t border-[#cdbb9f] pt-6"><p className="eyebrow">Rental period</p><p className="mt-3 font-serif text-3xl">{formatTimelineDate(rental.startAt)} → {formatTimelineDate(rental.endAt)}</p><dl className="mt-8 space-y-4 text-sm"><div><dt className="text-[#665548]">Rental ID</dt><dd className="mt-1 font-medium">{rental.id}</dd></div><div><dt className="text-[#665548]">Current status</dt><dd className="mt-2"><StatusBadge status={rental.status} kind="rental" /></dd></div>{rental.return && <div><dt className="text-[#665548]">Return status</dt><dd className="mt-2"><StatusBadge status={rental.return.status} kind="return" /><p className="mt-2 text-xs text-[#665548]">Condition: {rental.return.condition}</p></dd></div>}{rental.pricingSnapshot && typeof rental.pricingSnapshot === "object" && !Array.isArray(rental.pricingSnapshot) && "lineTotal" in rental.pricingSnapshot && <div><dt className="text-[#665548]">Historical rental total</dt><dd className="mt-1 font-medium">{formatMoney(Number(rental.pricingSnapshot.lineTotal), rental.currency)}</dd></div>}</dl><div className="mt-8 border-t border-[#dfd2be] pt-5"><p className="eyebrow">Product</p>{rental.products.length ? rental.products.map((product) => <Link key={product.slug} href={`/shop/${product.slug}`} className="nav-link mt-2 block text-sm">{product.name} →</Link>) : <p className="mt-2 text-sm text-[#665548]">Product details unavailable.</p>}</div></section><section className="border-t border-[#cdbb9f] pt-6"><p className="eyebrow">Journey</p><RentalTimeline rental={rental} /></section></div>
  </AccountFrame>;
}
