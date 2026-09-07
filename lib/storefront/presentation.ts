import type { Prisma } from "@prisma/client";
import { formatMoney, parseRentalPricingConfig } from "@/lib/pricing/engine";

export function formatProductPrice(price: string | null, currency = "INR"): string | null {
  if (!price) return null;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(price));
}

export function getRentalLabel(config: Prisma.JsonValue | null): string {
  if (config && typeof config === "object" && !Array.isArray(config)) {
    const displayPrice = config.displayPrice;
    const displayUnit = config.displayUnit;
    if ((typeof displayPrice === "string" || typeof displayPrice === "number") && typeof displayUnit === "string") return `${displayPrice} / ${displayUnit}`;
  }
  const parsed = parseRentalPricingConfig(config);
  if (parsed) return `${formatMoney(parsed.rate, parsed.currency)} / ${parsed.strategy === "PER_24_HOURS" ? "24 hours" : "day"}`;
  return "Rental available";
}

export function formatMetricType(metricType: string): string {
  return metricType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
