"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { DayPicker, type DateRange } from "react-day-picker";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { calculateRentalLine, formatMoney, type PricingProduct } from "@/lib/pricing/engine";

type AvailabilityResponse = {
  productId: string;
  requestedStart: string;
  requestedEnd: string;
  durationDays: number;
  requestedQuantity: number;
  totalInventory: number;
  availableQuantity: number;
  unavailableQuantity: number;
  canRent: boolean;
  reason: "AVAILABLE" | "PRODUCT_NOT_RENTABLE" | "NO_AVAILABLE_UNITS" | "INSUFFICIENT_INVENTORY";
};

type AvailabilityStatus = "idle" | "checking" | "available" | "insufficient" | "unavailable" | "error";

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorMessage(payload: unknown): string {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") return payload.message;
  return "Availability could not be checked right now.";
}

export function RentalAvailabilityPicker({ productId, currency, rentalPricingConfig }: { productId: string; currency: string; rentalPricingConfig: unknown }) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const [result, setResult] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  function handleRangeChange(nextRange: DateRange | undefined) {
    setRange(nextRange);
    if (!nextRange?.from || !nextRange.to) {
      setStatus("idle");
      setResult(null);
      setError(null);
    }
  }

  useEffect(() => {
    const startDate = range?.from;
    const endDate = range?.to;
    if (!startDate || !endDate) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("checking");
      setResult(null);
      setError(null);
      try {
        const response = await fetch("/api/rentals/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, startDate: toDateOnly(startDate), endDate: toDateOnly(endDate), quantity }),
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          setStatus("error");
          setError(getErrorMessage(payload));
          return;
        }
        const availability = payload as AvailabilityResponse;
        setResult(availability);
        setStatus(availability.canRent ? "available" : availability.reason === "INSUFFICIENT_INVENTORY" ? "insufficient" : "unavailable");
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setStatus("error");
        setError("Availability could not be checked right now.");
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [productId, quantity, range]);

  const selectedSummary = range?.from && range.to ? `${format(range.from, "dd MMM yyyy")} → ${format(range.to, "dd MMM yyyy")}` : "Select a start and end date";
  const pricing = range?.from && range.to ? (() => {
    try {
      return calculateRentalLine({ id: productId, currency, purchasePrice: null, rentalPricingConfig, purchasable: false, rentable: true } satisfies PricingProduct, { startDate: toDateOnly(range.from), endDate: toDateOnly(range.to) }, quantity);
    } catch {
      return null;
    }
  })() : null;

  return (
    <section className="mt-8 border-t border-[#dfd2be] pt-7" aria-labelledby="rental-availability-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Rental period</p><h2 id="rental-availability-heading" className="mt-2 font-serif text-3xl">Choose your dates.</h2></div>
        <span className="text-sm text-[#665548]">Availability checked live</span>
      </div>
      <div className="rental-calendar mt-6 overflow-x-auto border border-[#cdbb9f] bg-[#fffdf8] p-3 sm:p-5" tabIndex={0} aria-label="Rental calendar; scroll horizontally if needed">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleRangeChange}
          disabled={{ before: today }}
          defaultMonth={today}
          numberOfMonths={1}
          showOutsideDays
          pagedNavigation
          footer={<span className="text-xs text-[#665548]">Demo policy: inclusive calendar dates; same-day rentals count as one day. Past dates are unavailable.</span>}
        />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div><p className="eyebrow">Selected period</p><p className="mt-2 text-sm font-medium text-[#5e4b3a]">{selectedSummary}</p>{range?.from && range.to && <p className="mt-1 text-xs text-[#665548]">{status === "checking" ? "Checking availability…" : result ? `${result.durationDays} ${result.durationDays === 1 ? "day" : "days"}` : "Waiting for availability check"}</p>}</div>
        <label className="text-sm font-medium text-[#5e4b3a]">Quantity<input aria-label="Rental quantity" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} className="ml-3 w-20 border-b border-[#b8a78f] bg-transparent px-1 py-2 text-center outline-none focus:border-[#5f4630]" /></label>
      </div>
      <div className="mt-5 min-h-14" aria-live="polite">
        {status === "available" && result && <div className="status-panel status-success"><span aria-hidden="true">✓</span><div><p className="font-medium">Available</p><p className="text-sm">{result.availableQuantity} {result.availableQuantity === 1 ? "unit" : "units"} available for your requested quantity.</p></div></div>}
        {status === "insufficient" && result && <div className="status-panel status-warning"><span aria-hidden="true">!</span><div><p className="font-medium">Only {result.availableQuantity} {result.availableQuantity === 1 ? "unit is" : "units are"} available</p><p className="text-sm">Your request is for {result.requestedQuantity}. The quantity will not be reduced automatically.</p></div></div>}
        {status === "unavailable" && <div className="status-panel status-danger"><span aria-hidden="true">×</span><div><p className="font-medium">Not available for these dates</p><p className="text-sm">Try another date range or a different quantity.</p></div></div>}
        {status === "error" && <div className="status-panel status-danger"><span aria-hidden="true">×</span><div><p className="font-medium">Could not check availability</p><p className="text-sm">{error}</p></div></div>}
      </div>
      {pricing && result?.canRent && status === "available" && <div className="mt-4 border-t border-[#dfd2be] pt-4"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Rental subtotal</p><p className="mt-2 font-serif text-3xl text-[#5f4630]">{formatMoney(pricing.lineTotal, pricing.currency)}</p></div><p className="text-right text-xs leading-5 text-[#665548]">{pricing.durationDays} {pricing.durationDays === 1 ? "day" : "days"}<br />Pricing is recalculated in the cart</p></div><div className="mt-4"><AddToCartButton productId={productId} itemType="RENTAL" quantity={quantity} startDate={pricing.startDate} endDate={pricing.endDate} label="Add rental to cart" /></div></div>}
      {range?.from && range.to && !pricing && <p className="mt-4 text-sm text-[#76521f]">Rental pricing is not configured for this product yet.</p>}
      {range?.from && range.to && <button type="button" className="mt-3 text-sm font-medium text-[#5f4630] underline underline-offset-4" onClick={() => handleRangeChange(undefined)}>Clear dates</button>}
      <p className="mt-5 text-xs leading-5 text-[#665548]">Adding to cart does not reserve inventory. Availability and pricing may change before checkout.</p>
    </section>
  );
}
