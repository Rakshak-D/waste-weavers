# Final business-rule register

This is the decision register for the SIH prototype. “Demo configuration” means the value is needed for a runnable walkthrough; it is not a production commercial approval.

## A — Must be explicit before the SIH demo

- Seeded demo products use `PER_DAY`, INR 2,500 per inclusive calendar day.
- The demo uses date-only `YYYY-MM-DD` values, inclusive ranges, same-day duration of one day, UTC-normalized persistence, past-date rejection, and a 366-day maximum. These conventions are centralized in `lib/rental/date.ts`.
- Cart and browser totals are advisory. Checkout recalculates from current Product/configuration data and snapshots the result.
- Availability uses physical inventory and non-overlapping allocations; checkout re-checks and allocates inside the PostgreSQL transaction.
- Development payment succeeds by default and has no real financial side effect.
- Impact values are explicit product records and must be described as represented material, not audited environmental savings.

## B — Can remain configurable

- Product rental strategy/rate: validated `PER_DAY` or `PER_24_HOURS` configuration.
- Product, inventory, rental, return, and maintenance states remain data-driven through existing enums and guarded transitions.
- Delivery timestamps may be populated by authorized operations later; no external carrier is required for the demo.

## C — Explicitly deferred

- Final choice between 24-hour, calendar-day, event, or subscription billing.
- Customer timezone policy beyond technical UTC normalization.
- Taxes, delivery/collection fees, security deposits, discounts, late fees, cancellation charges, refunds, and payment-provider terms.
- Inventory buffers, cleaning duration, geography/lead times, damage/loss charges, and reservation expiration.
- Production payment gateway, delivery/Porter integration, notifications, quotation/invoicing, and custom production scheduling.
- Scientific impact methodology, CO₂/water/carbon conversion, certification, and verified lifecycle claims.

The application must not show a deferred fee as a charge, automatically bill late returns, fabricate carrier statuses, or expose internal admin notes to customers.

The UI must not show deferred fees as charged, cancellation/refund controls that do not exist, or delivery/cleaning/reuse events without persisted data.
