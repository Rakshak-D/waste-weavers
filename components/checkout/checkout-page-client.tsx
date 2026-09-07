"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { formatMoney } from "@/lib/pricing/engine";
import type { CheckoutSummary } from "@/lib/checkout/service";

type AddressForm = { label: string; recipientName: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string; phone: string };
const emptyAddress: AddressForm = { label: "", recipientName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN", phone: "" };

export function CheckoutPageClient({ initialSummary, customerName, customerEmail }: { initialSummary: CheckoutSummary; customerName: string | null; customerEmail: string }) {
  const router = useRouter();
  const [summary] = useState(initialSummary);
  const [mode, setMode] = useState(initialSummary.addresses.length ? "existing" : "new");
  const [addressId, setAddressId] = useState(initialSummary.addresses[0]?.id ?? "");
  const [address, setAddress] = useState(emptyAddress);
  const [state, setState] = useState<"ready" | "placing" | "error">("ready");
  const [message, setMessage] = useState<string | null>(null);

  async function placeOrder() {
    setState("placing");
    setMessage(null);
    const payload = mode === "existing" ? { addressId } : { newAddress: address };
    try {
      const response = await fetch("/api/checkout/place-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(result && typeof result === "object" && "message" in result && typeof result.message === "string" ? result.message : "The order could not be placed.");
      if (!result || typeof result !== "object" || !("orderId" in result) || typeof result.orderId !== "string") throw new Error("The order confirmation was incomplete.");
      router.push(`/order/${result.orderId}`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The order could not be placed.");
    }
  }

  function updateAddress(field: keyof AddressForm, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"><div><p className="eyebrow">Final review</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.035em]">Checkout</h1><p className="mt-4 max-w-2xl leading-7 text-[#68584a]">Review the current price and delivery details before confirming. Rental dates are checked again as the order is placed.</p></div>{message && <p className="status-panel status-danger mt-8" role="alert">{message}</p>}{summary.issues.length > 0 && <div className="status-panel status-warning mt-8"><div><p className="font-medium">Your cart needs attention</p><ul className="mt-2 list-disc pl-5 text-sm">{summary.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div></div>}{summary.items.length === 0 ? <div className="mt-12 border-y border-[#dfd2be] py-16 text-center"><p className="font-serif text-3xl">Your cart is empty.</p><button type="button" onClick={() => router.push("/shop")} className="mt-7 bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8]">Return to shop</button></div> : <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start"><div className="space-y-10"><section className="border-t border-[#cdbb9f] pt-5"><p className="eyebrow">Customer</p><p className="mt-3 font-serif text-2xl">{customerName || "Waste Weavers customer"}</p><p className="mt-1 text-sm text-[#68584a]">{customerEmail}</p></section><section className="border-t border-[#cdbb9f] pt-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Delivery address</p><h2 className="mt-2 font-serif text-3xl">Where should we send it?</h2></div><div className="flex gap-2 text-sm"><button type="button" onClick={() => setMode("existing")} className={`border-b px-2 py-1 ${mode === "existing" ? "border-[#5f4630] text-[#5f4630]" : "border-transparent text-[#665548]"}`} disabled={!summary.addresses.length}>Saved address</button><button type="button" onClick={() => setMode("new")} className={`border-b px-2 py-1 ${mode === "new" ? "border-[#5f4630] text-[#5f4630]" : "border-transparent text-[#665548]"}`}>New address</button></div></div>{mode === "existing" && summary.addresses.length > 0 && <div className="mt-5 grid gap-3">{summary.addresses.map((saved) => <label key={saved.id} className={`border p-4 ${addressId === saved.id ? "border-[#5f4630] bg-[#fffdf8]" : "border-[#dfd2be]"}`}><input type="radio" name="address" value={saved.id} checked={addressId === saved.id} onChange={() => setAddressId(saved.id)} className="mr-3 accent-[#5f4630]" /><span className="font-medium">{saved.label || "Saved address"}</span><span className="mt-2 block pl-6 text-sm leading-6 text-[#68584a]">{saved.recipientName}<br />{saved.line1}, {saved.city}, {saved.state} {saved.postalCode}</span></label>)}</div>}{mode === "new" && <div className="mt-5 grid gap-4 sm:grid-cols-2">{(["recipientName", "line1", "line2", "city", "state", "postalCode", "phone"] as const).map((field) => <label key={field} className={`${field === "line1" || field === "line2" ? "sm:col-span-2" : ""} text-sm font-medium`}>{field === "recipientName" ? "Recipient name" : field === "postalCode" ? "Postal code" : field === "line1" ? "Address line 1" : field === "line2" ? "Address line 2" : field === "phone" ? "Phone (optional)" : field.charAt(0).toUpperCase() + field.slice(1)}<input required={field !== "line2" && field !== "phone"} value={address[field]} onChange={(event) => updateAddress(field, event.target.value)} className="mt-2 w-full border-b border-[#cdbb9f] bg-transparent px-1 py-2 outline-none focus:border-[#5f4630]" /></label>)}<label className="text-sm font-medium">Country<input value={address.country} maxLength={2} onChange={(event) => updateAddress("country", event.target.value.toUpperCase())} className="mt-2 w-full border-b border-[#cdbb9f] bg-transparent px-1 py-2 uppercase outline-none focus:border-[#5f4630]" /></label></div>}</section><section className="border-t border-[#cdbb9f] pt-5"><p className="eyebrow">Your items</p><div className="mt-4 divide-y divide-[#dfd2be]">{summary.items.map((item) => <div key={item.cartItemId} className="flex flex-wrap justify-between gap-4 py-4 text-sm"><div><p className="font-medium">{item.name}</p><p className="mt-1 text-[#665548]">{item.itemType === "RENTAL" ? `Rent · ${item.quantity} · ${item.startDate} → ${item.endDate}` : `Buy · ${item.quantity}`}</p></div><span className="font-medium">{item.line ? formatMoney(item.line.lineTotal, item.line.currency) : "Unavailable"}</span></div>)}</div></section></div><aside className="border border-[#cdbb9f] bg-[#fffdf8] p-6"><p className="eyebrow">Authoritative total</p><div className="mt-5 flex justify-between border-b border-[#dfd2be] pb-4 text-sm"><span>Subtotal</span><span>{formatMoney(summary.totals.subtotal, summary.totals.currency)}</span></div><p className="mt-4 text-xs leading-5 text-[#665548]">Taxes, delivery, deposits, and discounts are not configured. Rental availability is checked again during confirmation.</p><div className="mt-6 flex justify-between font-serif text-2xl"><span>Total</span><span>{formatMoney(summary.totals.total, summary.totals.currency)}</span></div><button type="button" onClick={placeOrder} disabled={!summary.canPlaceOrder || state === "placing" || (mode === "existing" && !addressId)} className="mt-7 w-full bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8] transition hover:bg-[#332a22] disabled:cursor-not-allowed disabled:bg-[#cdbb9f] disabled:text-[#68584a]">{state === "placing" ? "Confirming order…" : "Place order"}</button><p className="mt-4 text-center text-xs text-[#665548]">Development payment mode · no real charge</p></aside></div>}</main>;
}
