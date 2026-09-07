import { describe, expect, it } from "vitest";

import { normalizeAddress, AddressValidationError } from "../lib/account/address";
import { presentOrderStatus, presentPaymentStatus, presentRentalStatus, rentalGroup } from "../lib/account/presentation";

describe("account presentation and validation", () => {
  it("maps rental statuses into dashboard groups", () => {
    expect(rentalGroup("RESERVED")).toBe("upcoming");
    expect(rentalGroup("ACTIVE")).toBe("active");
    expect(rentalGroup("COMPLETED")).toBe("completed");
    expect(rentalGroup("CANCELLED")).toBe("cancelled");
  });

  it("provides centralized human-readable status labels", () => {
    expect(presentOrderStatus("CONFIRMED").label).toBe("Confirmed");
    expect(presentPaymentStatus("PAID").tone).toBe("positive");
    expect(presentRentalStatus("RETURN_PENDING").label).toBe("Return pending");
  });

  it("normalizes a customer address without touching historical snapshots", () => {
    expect(normalizeAddress({ recipientName: " Demo ", line1: " 1 Lane ", city: "Jaipur", state: "Rajasthan", postalCode: "302001" })).toMatchObject({ recipientName: "Demo", line1: "1 Lane", country: "IN" });
  });

  it("rejects incomplete addresses", () => {
    expect(() => normalizeAddress({ recipientName: "", line1: "1 Lane", city: "Jaipur", state: "Rajasthan", postalCode: "302001" })).toThrow(AddressValidationError);
  });
});

