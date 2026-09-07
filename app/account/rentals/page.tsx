import Link from "next/link";

import { AccountFrame, StatusBadge, formatTimelineDate } from "@/components/account/account-ui";
import { getCustomerRentals } from "@/lib/account/service";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const groups = [
  { key: "upcoming" as const, label: "Upcoming", description: "Confirmed rentals ahead." },
  { key: "active" as const, label: "Active", description: "Rentals currently in their event window or return process." },
  { key: "completed" as const, label: "Completed", description: "Finished rental journeys." },
];

export default async function RentalsPage() {
  const user = await requirePageUser("/account/rentals");
  let rentals: Awaited<ReturnType<typeof getCustomerRentals>> = [];
  try { rentals = await getCustomerRentals(user.id); } catch { rentals = []; }
  return <AccountFrame title="Your rentals" intro="Keep an eye on upcoming event décor, active rentals, and completed journeys."><div className="mt-10 space-y-12">{groups.map((group) => { const rows = rentals.filter((rental) => rental.group === group.key); return <section key={group.key}><div className="border-b border-[#cdbb9f] pb-4"><p className="eyebrow">{group.label}</p><p className="mt-2 text-sm text-[#68584a]">{group.description}</p></div>{rows.length ? <div className="divide-y divide-[#dfd2be]">{rows.map((rental) => <Link key={rental.id} href={`/account/rentals/${rental.id}`} className="block py-5 transition hover:bg-[#fffdf8]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-serif text-2xl">{rental.products[0]?.name ?? "Rental décor"}</p><p className="mt-2 text-sm text-[#68584a]">{formatTimelineDate(rental.startAt)} → {formatTimelineDate(rental.endAt)}</p><p className="mt-1 text-xs text-[#665548]">{rental.order?.orderNumber ? `Order ${rental.order.orderNumber}` : "Order details unavailable"}</p></div><StatusBadge status={rental.status} kind="rental" /></div></Link>)}</div> : <p className="py-7 text-sm text-[#665548]">No {group.label.toLowerCase()} rentals.</p>}</section>; })}</div>{rentals.length === 0 && <div className="mt-10 border-y border-[#dfd2be] py-12 text-center"><p className="font-serif text-3xl">You don&apos;t have any rentals yet.</p><Link href="/shop" className="mt-5 inline-flex bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8]">Explore rentals</Link></div>}</AccountFrame>;
}
