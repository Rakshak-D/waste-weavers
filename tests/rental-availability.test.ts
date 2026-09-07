import { describe, expect, it } from "vitest";

import {
  evaluateAvailability,
  isInventoryStatusEligible,
  buildOverlappingAllocationFilter,
} from "../lib/rental/availability";
import {
  dateOnlyDifferenceInDays,
  intervalsOverlap,
  overlapsDateRange,
  validateDateRange,
} from "../lib/rental/date";

describe("rental date validation", () => {
  it("rejects a start date after the end date", () => {
    expect(() => validateDateRange({ startDate: "2026-10-15", endDate: "2026-10-12" }, { today: "2026-09-07" })).toThrow("Start date");
  });

  it("rejects a date in the past", () => {
    expect(() => validateDateRange({ startDate: "2026-09-06", endDate: "2026-09-08" }, { today: "2026-09-07" })).toThrow("past");
  });

  it("accepts a same-day inclusive range as one day", () => {
    const result = validateDateRange({ startDate: "2026-10-12", endDate: "2026-10-12" }, { today: "2026-09-07" });
    expect(result.durationDays).toBe(1);
    expect(dateOnlyDifferenceInDays("2026-10-12", "2026-10-15", "inclusive")).toBe(4);
  });

  it("rejects invalid calendar dates and overlarge ranges", () => {
    expect(() => validateDateRange({ startDate: "2026-02-30", endDate: "2026-03-01" }, { today: "2026-01-01" })).toThrow("valid calendar");
    expect(() => validateDateRange({ startDate: "2026-01-01", endDate: "2027-02-01" }, { today: "2026-01-01" })).toThrow("exceed");
  });
});

describe("rental interval overlap", () => {
  it("allows non-overlapping ranges", () => {
    expect(overlapsDateRange({ startDate: "2026-10-12", endDate: "2026-10-15" }, { startDate: "2026-10-16", endDate: "2026-10-18" })).toBe(false);
  });

  it("detects overlapping ranges and exact inclusive boundaries", () => {
    expect(overlapsDateRange({ startDate: "2026-10-12", endDate: "2026-10-15" }, { startDate: "2026-10-15", endDate: "2026-10-18" })).toBe(true);
    expect(overlapsDateRange({ startDate: "2026-10-12", endDate: "2026-10-15" }, { startDate: "2026-10-16", endDate: "2026-10-18" }, "half-open")).toBe(false);
    expect(intervalsOverlap(new Date("2026-10-12Z"), new Date("2026-10-15Z"), new Date("2026-10-15Z"), new Date("2026-10-18Z"), "inclusive")).toBe(true);
  });

  it("builds the server-side overlap filter without exposing rental data", () => {
    expect(buildOverlappingAllocationFilter(new Date("2026-10-12Z"), new Date("2026-10-15T23:59:59Z"))).toEqual({
      rental: { status: { not: "CANCELLED" }, startAt: { lte: new Date("2026-10-15T23:59:59Z") }, endAt: { gte: new Date("2026-10-12Z") } },
    });
  });
});

describe("inventory eligibility and quantities", () => {
  it("only treats AVAILABLE units as rental eligible", () => {
    expect(isInventoryStatusEligible("AVAILABLE")).toBe(true);
    expect(isInventoryStatusEligible("MAINTENANCE")).toBe(false);
    expect(isInventoryStatusEligible("DAMAGED")).toBe(false);
    expect(isInventoryStatusEligible("RETIRED")).toBe(false);
    expect(isInventoryStatusEligible("RENTED")).toBe(false);
  });

  it("reports partial availability without reducing the requested quantity", () => {
    const result = evaluateAvailability({ productId: "product-1", requestedStart: "2026-10-12", requestedEnd: "2026-10-15", durationDays: 4, requestedQuantity: 4, totalInventory: 5, availableQuantity: 2, rentable: true });
    expect(result.availableQuantity).toBe(2);
    expect(result.unavailableQuantity).toBe(3);
    expect(result.canRent).toBe(false);
    expect(result.reason).toBe("INSUFFICIENT_INVENTORY");
  });

  it("handles multiple allocated units and complete unavailability", () => {
    const result = evaluateAvailability({ productId: "product-1", requestedStart: "2026-10-12", requestedEnd: "2026-10-15", durationDays: 4, requestedQuantity: 1, totalInventory: 3, availableQuantity: 0, rentable: true });
    expect(result.reason).toBe("NO_AVAILABLE_UNITS");
    expect(result.unavailableQuantity).toBe(3);
  });

  it("rejects a product that is not rentable", () => {
    const result = evaluateAvailability({ productId: "product-2", requestedStart: "2026-10-12", requestedEnd: "2026-10-15", durationDays: 4, requestedQuantity: 1, totalInventory: 4, availableQuantity: 4, rentable: false });
    expect(result.canRent).toBe(false);
    expect(result.reason).toBe("PRODUCT_NOT_RENTABLE");
  });
});
