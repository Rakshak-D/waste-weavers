import { describe, expect, it } from "vitest";
import { canTransitionCustomOrderStatus } from "@/lib/admin/transitions";
import { validateCustomOrderInput } from "@/lib/custom-orders/service";

describe("custom order workflow", () => {
  it("validates a future request without creating an order", () => {
    const result = validateCustomOrderInput({ eventType: "Wedding", eventDate: "2099-10-12", guestCount: 120, requirements: "A warm textile backdrop and coordinated table décor.", budget: "50000", referenceFileUrl: "/references/moodboard.pdf" });
    expect(result.eventType).toBe("Wedding");
    expect(result.guestCount).toBe(120);
    expect(result.budget).toBe("50000");
  });

  it("rejects invalid dates, budget, guests, and unsafe references", () => {
    expect(() => validateCustomOrderInput({ eventType: "Wedding", eventDate: "2020-01-01", requirements: "A sufficiently detailed request for décor.", budget: "20" })).toThrow();
    expect(() => validateCustomOrderInput({ eventType: "Wedding", requirements: "A sufficiently detailed request for décor.", budget: "-1" })).toThrow();
    expect(() => validateCustomOrderInput({ eventType: "Wedding", requirements: "A sufficiently detailed request for décor.", guestCount: 0 })).toThrow();
    expect(() => validateCustomOrderInput({ eventType: "Wedding", requirements: "A sufficiently detailed request for décor.", referenceFileUrl: "javascript:alert(1)" })).toThrow();
  });

  it("keeps status transitions controlled", () => {
    expect(canTransitionCustomOrderStatus("REQUESTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionCustomOrderStatus("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionCustomOrderStatus("COMPLETED", "REQUESTED")).toBe(false);
    expect(canTransitionCustomOrderStatus("CANCELLED", "IN_PROGRESS")).toBe(false);
  });
});
