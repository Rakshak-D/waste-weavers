import { describe, expect, it } from "vitest";

import {
  calculateCartTotals,
  calculatePurchaseLine,
  calculateRentalLine,
  formatMoney,
  parseRentalPricingConfig,
} from "../lib/pricing/engine";

const product = {
  id: "product-1",
  currency: "INR",
  purchasePrice: "18500.00",
  rentalPricingConfig: { strategy: "PER_DAY", rate: "2500.00", currency: "INR" },
  purchasable: true,
  rentable: true,
};

describe("pricing engine", () => {
  it("calculates a purchase line and quantity", () => {
    expect(calculatePurchaseLine(product, 2).lineTotal).toBe(37000);
  });

  it("rejects invalid and non-purchasable purchase lines", () => {
    expect(() => calculatePurchaseLine(product, 0)).toThrow("Quantity");
    expect(() => calculatePurchaseLine({ ...product, purchasable: false }, 1)).toThrow("not available for purchase");
  });

  it("calculates inclusive multi-day rental pricing", () => {
    const line = calculateRentalLine(product, { startDate: "2030-10-12", endDate: "2030-10-15" }, 2);
    expect(line.durationDays).toBe(4);
    expect(line.lineTotal).toBe(20000);
  });

  it("supports same-day rental pricing and rejects invalid dates", () => {
    expect(calculateRentalLine(product, { startDate: "2030-10-12", endDate: "2030-10-12" }, 1).durationDays).toBe(1);
    expect(() => calculateRentalLine(product, { startDate: "2030-10-15", endDate: "2030-10-12" }, 1)).toThrow("Start date");
    expect(() => calculateRentalLine({ ...product, rentable: false }, { startDate: "2030-10-12", endDate: "2030-10-12" }, 1)).toThrow("not available for rental");
  });

  it("does not invent or accept malformed rental pricing", () => {
    expect(parseRentalPricingConfig({ model: "TO_BE_CONFIRMED" })).toBeNull();
    expect(parseRentalPricingConfig({ strategy: "UNKNOWN", rate: 10 })).toBeNull();
    expect(() => calculateRentalLine({ ...product, rentalPricingConfig: null }, { startDate: "2030-10-12", endDate: "2030-10-12" }, 1)).toThrow("not configured");
  });

  it("aggregates cart subtotal without pretending fees are configured", () => {
    const totals = calculateCartTotals([
      calculatePurchaseLine(product, 1),
      calculateRentalLine(product, { startDate: "2030-10-12", endDate: "2030-10-12" }, 1),
    ]);
    expect(totals.subtotal).toBe(21000);
    expect(totals.total).toBe(21000);
    expect(totals.tax).toBeNull();
  });

  it("formats INR prices", () => {
    expect(formatMoney(18500, "INR")).toContain("18,500");
  });
});

