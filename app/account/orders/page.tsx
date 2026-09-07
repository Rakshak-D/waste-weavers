import Link from "next/link";

import { AccountFrame, StatusBadge, formatTimelineDate } from "@/components/account/account-ui";
import { getCustomerOrders } from "@/lib/account/service";
import { formatMoney } from "@/lib/pricing/engine";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requirePageUser("/account/orders");
  let orders: Awaited<ReturnType<typeof getCustomerOrders>> = [];
  try { orders = await getCustomerOrders(user.id); } catch { orders = []; }
  return <AccountFrame title="Your orders" intro="A record of the pieces you have chosen to own or bring into an event.">{orders.length ? <div className="mt-10 border-t border-[#cdbb9f]">{orders.map((order) => <Link key={order.id} href={`/account/orders/${order.id}`} className="block border-b border-[#dfd2be] py-6 transition hover:bg-[#fffdf8]"><div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-serif text-2xl">{order.orderNumber}</p><p className="mt-2 text-sm text-[#665548]">{formatTimelineDate(order.createdAt)} · {order._count.items} {order._count.items === 1 ? "item" : "items"} · {order.type}</p>{order.rentals[0] && <p className="mt-2 text-sm text-[#68584a]">Rental period: {formatTimelineDate(order.rentals[0].startAt)} → {formatTimelineDate(order.rentals[0].endAt)}</p>}</div><StatusBadge status={order.status} kind="order" /><div className="text-left sm:text-right"><p className="font-medium">{formatMoney(Number(order.grandTotal ?? 0), order.currency)}</p><p className="mt-1 text-xs text-[#665548]">{order.paymentStatus}</p></div></div></Link>)}</div> : <div className="mt-10 border-y border-[#dfd2be] py-16 text-center"><p className="font-serif text-3xl">You haven&apos;t placed any orders yet.</p><p className="mt-3 text-sm text-[#665548]">Your confirmed purchases and rentals will appear here.</p><Link href="/shop" className="mt-7 inline-flex bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8]">Shop collection</Link></div>}</AccountFrame>;
}
