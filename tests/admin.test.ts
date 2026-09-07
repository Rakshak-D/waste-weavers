import { describe, expect, it } from "vitest";
import { canTransitionInventoryStatus, canTransitionMaintenanceStatus, canTransitionOrderStatus, canTransitionRentalStatus, canTransitionReturnStatus } from "@/lib/admin/transitions";

describe("admin lifecycle transition policies", () => {
  it("protects retired inventory from re-entry", () => {
    expect(canTransitionInventoryStatus("RETIRED", "AVAILABLE")).toBe(false);
    expect(canTransitionInventoryStatus("MAINTENANCE", "AVAILABLE")).toBe(true);
  });

  it("keeps rented units from being manually made available", () => {
    expect(canTransitionInventoryStatus("RENTED", "AVAILABLE")).toBe(false);
    expect(canTransitionInventoryStatus("DAMAGED", "MAINTENANCE")).toBe(true);
  });

  it("only permits forward operational order transitions", () => {
    expect(canTransitionOrderStatus("CONFIRMED", "FULFILLING")).toBe(true);
    expect(canTransitionOrderStatus("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransitionOrderStatus("COMPLETED", "FULFILLING")).toBe(false);
  });

  it("models the return and maintenance workflow without allowing arbitrary jumps", () => {
    expect(canTransitionRentalStatus("ACTIVE", "RETURN_PENDING")).toBe(true);
    expect(canTransitionRentalStatus("COMPLETED", "RETURN_PENDING")).toBe(false);
    expect(canTransitionReturnStatus("RECEIVED", "INSPECTION_REQUIRED")).toBe(true);
    expect(canTransitionReturnStatus("PROCESSED", "RECEIVED")).toBe(false);
    expect(canTransitionMaintenanceStatus("PENDING", "IN_PROGRESS")).toBe(true);
    expect(canTransitionMaintenanceStatus("PENDING", "COMPLETED")).toBe(false);
  });
});
