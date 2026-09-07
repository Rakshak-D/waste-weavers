# Business rules

This document records only rules currently stated in the SIH/product brief. It is not a substitute for the later approved domain specification.

## Confirmed direction

- Products can be rented or purchased.
- A rental requires a start date and an end date.
- Rental price will be calculated automatically from rental duration.
- Product availability depends on existing rentals and available physical inventory.
- Purchased products do not require rental dates.
- Rental inventory must eventually support return and re-entry into circulation.
- Product lifecycle includes refurbishment/maintenance before re-rental where required.
- Custom orders are supported.
- Sustainability/impact is part of the product concept.

## Phase 1 structural clarifications

- Catalogue products and physical inventory units are separate concepts. Availability will be derived from individual `InventoryUnit` records and their future `RentalAllocation` records, not from a single product stock number.
- A rental stores start/end timestamps and explicit physical-unit allocations, but the interval inclusivity and timezone conventions remain unresolved.
- Historical order monetary values are stored on orders and order items rather than recalculated from current product prices.
- Customer addresses are mutable records; an order stores a shipping-address snapshot so order history remains stable.
- Return, inspection, maintenance, and refurbishment are represented as separate lifecycle records/states. A returned unit is not assumed to be immediately available.
- Impact metrics store explicit values and units at product level. No scientific conversion or impact formula is assumed.

## Phase 4/5 technical clarification

- Availability checks use actual `InventoryUnit` rows and `RentalAllocation` overlap queries; they do not subtract order counts from a product stock number.
- The current technical date-only default is inclusive: same-day selection is one day, and boundary-touching intervals overlap. The final commercial date inclusivity and timezone policy remain **TO BE CONFIRMED**.
- Availability checks do not reserve or mutate inventory. Phase 5 adds a separate authenticated transactional allocation operation that re-checks availability and creates a `Rental` plus its `RentalAllocation` rows atomically.
- Phase 5 uses `RentalStatus.RESERVED` for an allocated rental booking. This is not an expiring temporary hold; reservation expiration, payment confirmation, and checkout semantics remain unresolved.
- The final allocation operation is server-authoritative and selects physical units itself. Customers cannot submit inventory-unit identifiers or another user's ID.

## Pricing decision explicitly open

Current SIH material mentions approximately **₹2,500 for a 24-hour décor subscription**, while the intended website requirement calls for **date-range rental selection**. These may describe different commercial concepts. The exact final rental pricing convention is **TO BE CONFIRMED**.

Do not hard-code the final rental pricing model in Phase 0. Still to be decided: whether pricing is per 24-hour period, calendar day, event, or another unit; minimum/maximum duration; deposits; taxes; delivery/collection charges; late fees; discounts; cancellation/refund rules; and whether any subscription concept remains in scope.

Phase 6 supports explicit `PER_DAY` and `PER_24_HOURS` configuration values in the pricing engine, but these are technical options rather than finalized commercial rules. Demo products may remain `TO_BE_CONFIRMED`, in which case rental pricing is intentionally unavailable until configured.

The Phase 6 cart is a pending customer intent. It does not reserve inventory, lock price, create an order, or create a rental allocation.

Phase 7 checkout recalculates current authoritative prices and snapshots them into the Order/OrderItem records. A successful development payment is required before the order is confirmed. Rental allocation is authoritative only inside the checkout transaction; failed availability leaves the cart unchanged.

Phase 9 uses archival product status rather than deleting products with historical relationships. Admin inventory transitions are conservative technical safeguards, not a finalized return/refurbishment policy; units remain subject to the Phase 5 allocation model until those workflows are implemented.

Phase 10 records return outcomes per allocated physical unit through `ReturnInspection`. A return is not considered fully processed until every allocated unit has an inspection outcome. Units needing cleaning, repair, or refurbishment enter maintenance; good units may re-enter availability; damaged and retired units do not.

Phase 11 clarifies that supported impact metrics remain explicit product records. `TEXTILE_WASTE_DIVERTED` may be multiplied by ordered quantity as represented material; `REUSE_CYCLES_TARGET` is not treated as achieved customer reuse. New orders snapshot product impact metrics, and no unsupported environmental conversion is inferred.

Phase 12 clarifies that custom event submissions are requests associated with a customer, not confirmed Orders. They require review and do not imply quotation, payment, inventory reservation, production, delivery, or notification. Internal admin notes are not customer-visible.

## Not yet specified

The following are intentionally left open rather than inferred: inventory buffers, maintenance duration, inspection outcomes, damage/loss charges, delivery geography and lead times, rental date inclusivity, time zone, payment terms, cancellation policy, tax treatment, custom-order quotation rules, and impact measurement methodology.

## Phase 14 demo clarification

The seeded SIH walkthrough uses a validated `PER_DAY` rental configuration at ₹2,500 per inclusive calendar day. This is an explicitly labelled demo setting only; it does not resolve the commercial conflict with the approximately ₹2,500/24-hour SIH reference. Technical date normalization remains UTC-based, with past dates rejected and a 366-day maximum. The customer UI, cart, checkout, and order snapshots all call the same pricing/date utilities. Open commercial rules are classified in `docs/FINAL_BUSINESS_RULES.md`; no deferred tax, deposit, delivery, late, or cancellation charge is displayed.
