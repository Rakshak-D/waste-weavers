/**
 * Demo-only commercial defaults. These values make the seeded SIH walkthrough
 * runnable without presenting them as the approved production price policy.
 */
export const DEMO_RENTAL_PRICING = {
  strategy: "PER_DAY" as const,
  rate: "2500.00",
  currency: "INR",
  displayPrice: "₹2,500",
  displayUnit: "day",
};

export const TECHNICAL_DATE_POLICY = {
  intervalSemantics: "inclusive" as const,
  sameDayRentalDays: 1,
  maxRentalDays: 366,
  normalizedTimezone: "UTC",
  pastDatesAllowed: false,
};

/** Explicit demo state for commercial items that have no approved policy yet. */
export const DEMO_FEE_POLICY = {
  delivery: { status: "DISABLED" as const, amount: null },
  tax: { status: "DISABLED" as const, amount: null },
  securityDeposit: { status: "NOT_IMPLEMENTED" as const, amount: null },
  lateFee: { status: "DEFERRED" as const, amount: null },
  cancellationFee: { status: "DEFERRED" as const, amount: null },
  discount: { status: "DISABLED" as const, amount: null },
};

export const DEMO_DELIVERY_WORKFLOW = {
  externalProvider: "DEFERRED",
  persistedStatuses: [] as const,
};
