import { validateDateRange, type DateRangeInput } from "@/lib/rental/date";

export type PricingProduct = {
  id: string;
  currency: string;
  purchasePrice: string | null;
  rentalPricingConfig: unknown;
  purchasable: boolean;
  rentable: boolean;
};

export type RentalBillingStrategy = "PER_DAY" | "PER_24_HOURS";

export type RentalPricingConfiguration = {
  strategy: RentalBillingStrategy;
  rate: number;
  currency: string;
};

export type PricingErrorCode =
  | "INVALID_QUANTITY"
  | "PRODUCT_NOT_PURCHASABLE"
  | "PRODUCT_NOT_RENTABLE"
  | "PURCHASE_PRICE_UNAVAILABLE"
  | "RENTAL_PRICING_UNAVAILABLE"
  | "INVALID_RENTAL_PRICING";

export class PricingError extends Error {
  constructor(public readonly code: PricingErrorCode, message: string) {
    super(message);
    this.name = "PricingError";
  }
}

export type PurchaseLine = {
  productId: string;
  itemType: "PURCHASE";
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
};

export type RentalLine = {
  productId: string;
  itemType: "RENTAL";
  startDate: string;
  endDate: string;
  durationDays: number;
  quantity: number;
  strategy: RentalBillingStrategy;
  rate: number;
  lineTotal: number;
  currency: string;
};

export type CartLine = PurchaseLine | RentalLine;

export type CartTotals = {
  subtotal: number;
  deliveryFee: null;
  tax: null;
  discount: null;
  total: number;
  currency: string;
};

const MAX_QUANTITY = 100;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseNonNegativeMoney(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? roundMoney(parsed) : null;
}

export function validateQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new PricingError("INVALID_QUANTITY", `Quantity must be an integer between 1 and ${MAX_QUANTITY}.`);
  }
}

export function parseRentalPricingConfig(config: unknown): RentalPricingConfiguration | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const record = config as Record<string, unknown>;
  const rawStrategy = record.strategy ?? record.model;
  if (rawStrategy === "TO_BE_CONFIRMED" || rawStrategy === undefined) return null;
  if (rawStrategy !== "PER_DAY" && rawStrategy !== "PER_24_HOURS") return null;
  const rate = parseNonNegativeMoney(record.rate);
  if (rate === null || rate === 0) return null;
  const currency = typeof record.currency === "string" && /^[A-Z]{3}$/.test(record.currency) ? record.currency : "INR";
  return { strategy: rawStrategy, rate, currency };
}

export function calculatePurchaseLine(product: PricingProduct, quantity: number): PurchaseLine {
  validateQuantity(quantity);
  if (!product.purchasable) throw new PricingError("PRODUCT_NOT_PURCHASABLE", "This product is not available for purchase.");
  const unitPrice = parseNonNegativeMoney(product.purchasePrice);
  if (unitPrice === null) throw new PricingError("PURCHASE_PRICE_UNAVAILABLE", "Purchase pricing is unavailable for this product.");
  return { productId: product.id, itemType: "PURCHASE", quantity, unitPrice, lineTotal: roundMoney(unitPrice * quantity), currency: product.currency };
}

export function calculateRentalLine(
  product: PricingProduct,
  dates: DateRangeInput,
  quantity: number,
): RentalLine {
  validateQuantity(quantity);
  if (!product.rentable) throw new PricingError("PRODUCT_NOT_RENTABLE", "This product is not available for rental.");
  const { startDate, endDate, durationDays } = validateDateRange(dates);
  const configuration = parseRentalPricingConfig(product.rentalPricingConfig);
  if (!configuration) throw new PricingError("RENTAL_PRICING_UNAVAILABLE", "Rental pricing is not configured for this product yet.");
  return {
    productId: product.id,
    itemType: "RENTAL",
    startDate,
    endDate,
    durationDays,
    quantity,
    strategy: configuration.strategy,
    rate: configuration.rate,
    lineTotal: roundMoney(configuration.rate * durationDays * quantity),
    currency: configuration.currency,
  };
}

export function calculateCartTotals(lines: CartLine[], currency = "INR"): CartTotals {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  return { subtotal, deliveryFee: null, tax: null, discount: null, total: subtotal, currency };
}

export function formatMoney(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

