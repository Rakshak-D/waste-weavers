# Pricing

Phase 6 introduces the centralized pricing engine in `lib/pricing/engine.ts`. UI components may display its results, but they do not own pricing rules. This remains the single authoritative pricing implementation for the product picker, cart, checkout, and historical snapshots.

## Purchase pricing

Purchase lines use the current authoritative `Product.purchasePrice` and a validated quantity between 1 and 100. Client-provided prices and totals are ignored by the cart APIs.

## Rental pricing

Rental pricing requires a valid `Product.rentalPricingConfig` object. The parser accepts only explicit configurations:

```json
{ "strategy": "PER_DAY", "rate": "2500.00", "currency": "INR" }
```

The supported strategies are `PER_DAY` and `PER_24_HOURS`. The current technical prototype uses the existing inclusive date duration: 12 Oct through 15 Oct is four billing days. This is an implementation strategy, not a finalized commercial policy. `TO_BE_CONFIRMED`, missing, zero, malformed, or unknown configurations produce a controlled pricing-unavailable result.

The SIH reference to approximately ₹2,500 for a 24-hour décor subscription remains unresolved against the date-range rental requirement. Seeded demo products now use an explicit, clearly labelled `PER_DAY` configuration at ₹2,500 per inclusive calendar day so the SIH walkthrough is runnable. This is not the final commercial decision. Exact billing units, timezone, deposits, taxes, delivery, late fees, discounts, and cancellation rules remain **TO BE CONFIRMED**; see `docs/FINAL_BUSINESS_RULES.md`.

## Totals and historical prices

Phase 6 calculates subtotal and total from current authoritative product/configuration data. Delivery, tax, discount, and deposit are represented as unconfigured rather than displayed as fake zero-cost business decisions. Final order creation must snapshot the calculated values into the existing `Order` and `OrderItem` historical fields.

Cart prices are not locked. They are recalculated when the cart is read or changed, so later product price changes affect the pending cart but cannot alter a future order after its historical snapshot is created.

At checkout, the pricing engine runs again against current Product/configuration data. The resulting values are copied into `Order.subtotal`, `Order.grandTotal`, `OrderItem.unitPrice`, `OrderItem.lineTotal`, and rental pricing snapshots. Browser totals are presentation-only.
