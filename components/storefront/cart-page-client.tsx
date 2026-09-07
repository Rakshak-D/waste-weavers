"use client";

import Link from "next/link";
import { useState } from "react";

import { formatMoney } from "@/lib/pricing/engine";
import type { CartView } from "@/lib/cart/service";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";

export function CartPageClient({ initialCart }: { initialCart: CartView }) {
  const [cart, setCart] = useState(initialCart);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function request(url: string, options?: RequestInit) {
    setBusy(url);
    setMessage(null);
    try {
      const response = await fetch(url, options);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Cart update failed.");
      setCart(payload as CartView);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cart update failed.");
    } finally {
      setBusy(null);
    }
  }

  return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Your selection</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.035em]">Cart</h1><p className="mt-4 max-w-xl leading-7 text-[#68584a]">A working basket for pieces you are considering. Adding a rental does not reserve inventory.</p></div><Link href="/shop" className="nav-link text-sm font-medium text-[#5f4630]">Continue browsing →</Link></div>{message && <p className="status-panel status-danger mt-8" role="alert">{message}</p>}{cart.items.length === 0 ? <div className="mt-12 border-y border-[#dfd2be] py-16 text-center"><p className="font-serif text-3xl">Nothing here yet.</p><p className="mt-3 text-sm text-[#665548]">Choose a piece from the collection to begin.</p><Link href="/shop" className="mt-7 inline-flex bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8]">Shop the collection</Link></div> : <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start"><div className="border-t border-[#cdbb9f]">{cart.items.map((item) => <article key={item.id} className="grid gap-5 border-b border-[#dfd2be] py-6 sm:grid-cols-[130px_1fr_auto] sm:items-start"><div className="relative aspect-[4/3] overflow-hidden bg-[#eadfce]">{item.imageUrl ? <ImageWithFallback src={item.imageUrl} alt={item.name} fill sizes="130px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[#665548]">No image</div>}</div><div><div className="flex flex-wrap items-center gap-2"><p className="eyebrow">{item.itemType === "RENTAL" ? "Rent" : "Buy"}</p>{item.itemType === "RENTAL" && <span className={`badge !border-[#cdbb9f] !bg-transparent !text-[#6c4b30]`}>{item.availability === "available" ? "Currently available" : "Availability may have changed"}</span>}</div><h2 className="mt-2 font-serif text-2xl"><Link href={`/shop/${item.slug}`} className="nav-link">{item.name}</Link></h2>{item.itemType === "RENTAL" && <div className="mt-3 grid gap-2 text-sm text-[#68584a] sm:grid-cols-2"><label>Start<input type="date" value={item.startDate ?? ""} onChange={(event) => request(`/api/cart/items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: item.quantity, startDate: event.target.value, endDate: item.endDate }) })} className="mt-1 block w-full border-b border-[#cdbb9f] bg-transparent px-1 py-2 text-[#332a22]" /></label><label>End<input type="date" value={item.endDate ?? ""} onChange={(event) => request(`/api/cart/items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: item.quantity, startDate: item.startDate, endDate: event.target.value }) })} className="mt-1 block w-full border-b border-[#cdbb9f] bg-transparent px-1 py-2 text-[#332a22]" /></label></div>}{item.pricingError && <p className="mt-3 text-sm text-[#76521f]">{item.pricingError}</p>}<div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><label>Quantity<select value={item.quantity} onChange={(event) => request(`/api/cart/items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: Number(event.target.value), startDate: item.startDate ?? undefined, endDate: item.endDate ?? undefined }) })} className="ml-2 border-b border-[#cdbb9f] bg-transparent px-2 py-1">{Array.from({ length: 100 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><button type="button" onClick={() => request(`/api/cart/items/${item.id}`, { method: "DELETE" })} className="text-[#7c332a] underline underline-offset-4">Remove</button><Link href="/checkout" className="text-[#5f4630] underline underline-offset-4">Checkout</Link></div></div><div className="text-left sm:text-right">{item.line ? <><p className="font-serif text-2xl text-[#5f4630]">{formatMoney(item.line.lineTotal, item.line.currency)}</p><p className="mt-1 text-xs text-[#665548]">{item.itemType === "RENTAL" && "Current calculated total"}</p></> : <p className="text-sm text-[#76521f]">Price unavailable</p>}</div></article>)}</div><aside className="border border-[#cdbb9f] bg-[#fffdf8] p-6"><p className="eyebrow">Summary</p><div className="mt-5 flex items-center justify-between border-b border-[#dfd2be] pb-4 text-sm"><span>Subtotal</span><span className="font-medium">{formatMoney(cart.totals.subtotal, cart.totals.currency)}</span></div><p className="mt-4 text-xs leading-5 text-[#665548]">Taxes, delivery, deposits, and discounts are not configured yet.</p><div className="mt-6 flex items-center justify-between font-serif text-xl"><span>Total</span><span>{formatMoney(cart.totals.total, cart.totals.currency)}</span></div><Link href="/checkout" className="mt-6 block w-full bg-[#5f4630] px-5 py-3 text-center text-sm font-medium text-[#fffdf8]">Proceed to checkout</Link><button type="button" onClick={() => request("/api/cart", { method: "DELETE" })} disabled={busy === "/api/cart"} className="mt-4 w-full text-sm text-[#7c332a] underline underline-offset-4">Clear cart</button></aside></div>}</main>;
}
