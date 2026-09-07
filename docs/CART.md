# Cart

Phase 6 adds a persistent customer cart. A cart is not an `Order`, does not create rentals, and does not reserve inventory.

## Storage

`Cart` has one row per customer and `CartItem` stores the product, commercial mode, quantity, and optional rental dates. A second migration adds these tables without changing the existing order/rental model.

Only authenticated `CUSTOMER` users can access cart APIs. The server derives ownership from the Auth.js session; no client-provided user ID is accepted. Admins do not receive special cart behavior.

## Item types and mixed carts

Purchase and rental items are independently represented by `CartItem.itemType`, so mixed carts are supported in this prototype. Purchase items require no dates. Rental items require normalized start and end dates.

The same product/mode is merged for purchases. Rental items are merged only when their product, mode, and exact date range match; different rental periods remain separate lines.

## Pricing and availability

Cart responses rebuild line pricing from current product data through `lib/pricing/engine.ts`. Rental pricing is recalculated when dates or quantity change. Rental availability is checked when a rental is added, updated, or displayed, but the result is informational and may change before checkout.

Adding to cart never creates an inventory allocation. The Phase 5 transactional allocation service remains the authoritative write operation and must be called by the future checkout flow after payment/order decisions are implemented.

## Current limitations

Checkout creates orders transactionally through the development payment adapter, revalidates the cart and rental availability, snapshots prices and the shipping address, and clears only successfully ordered cart lines. Reservation expiration, taxes, delivery fees, deposits, cancellations, refunds, and production payment behavior remain deferred. Database integration tests require a configured PostgreSQL environment.
