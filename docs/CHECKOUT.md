# Checkout

Phase 7 converts a customer's current cart into an authoritative `Order`. It is a prototype checkout with a development payment adapter; it is not production payment infrastructure. Deferred commercial fees are omitted, not represented as fake zero-cost charges.

## Server-side summary

`getCheckoutSummary` reloads the authenticated customer's cart, active Product records, current prices, rental dates, and current availability. The browser never supplies an authoritative total. Stale or changed products produce a checkout issue instead of being silently charged from old cart data.

## Transaction boundary

`placeOrder` runs the database write sequence in a PostgreSQL serializable transaction:

1. Reload the customer's cart.
2. Recalculate all purchase/rental lines.
3. Validate the selected address.
4. Run the development payment adapter.
5. Create the Order and historical OrderItem snapshots.
6. Invoke `allocateRentalWithinTransaction` for each rental line.
7. Clear only the converted cart items.

Any validation, payment, allocation, or database failure rolls back the Order, OrderItems, Rental, RentalAllocation rows, and cart clearing together. Serializable conflicts are retried, then returned as a safe checkout conflict.

## Rental allocation

Checkout does not implement a second availability or allocation algorithm. It calls the Phase 5 transaction primitive, which takes the same product-scoped PostgreSQL advisory lock and performs the authoritative physical-unit selection. Availability shown in the summary is advisory; checkout allocation is authoritative.

## Order types and historical values

Purchase-only, rental-only, and mixed carts become `PURCHASE`, `RENTAL`, and `MIXED` orders. Rental items with different date ranges create separate Rental records linked to the same Order. `OrderItem.unitPrice`, `lineTotal`, `rentalPricingSnapshot`, and order-level totals are persisted at creation time.

Purchase inventory is not decremented because the existing domain model has no separate sellable-stock representation and does not establish that rental units are sale stock. This remains a future inventory decision.

## Address and payment

Customers may select an address belonging to their account or submit a new address. The final values are copied into `Order.shippingAddressSnapshot`; later profile edits do not change order history.

The current `DevelopmentPaymentService` returns `PAID` by default and can be forced to fail with `DEV_PAYMENT_OUTCOME=failed`. No real gateway, refund, cancellation, webhook, or external payment side effect exists.

## Cart and failure behavior

The cart is cleared only after the entire transaction succeeds. Inventory conflicts leave the cart unchanged and return a customer-safe message. Checkout never accepts customer-supplied user IDs, prices, totals, or inventory IDs.

Post-checkout account pages use the stored Order/OrderItem/Rental snapshots. They do not recalculate historical prices or replace the order shipping snapshot from the mutable Address table.
## Transaction and fixture verification

Checkout wraps cart revalidation, order/order-item creation, rental allocation, rental snapshot updates, and cart-item deletion in one serializable Prisma transaction. The checkout path calls `allocateRentalWithinTransaction(tx, ...)`, which uses the supplied transaction client for every database operation; it does not open a nested transaction or use the global Prisma client. A failure after order creation therefore rolls back the order, items, rentals, allocations, and cart deletion together.

The PostgreSQL integration suite resets only rows belonging to its generated fixture users/products between tests. It does not reset the development database or depend on execution order. The competing-checkout test adds both rental cart items before either checkout transaction starts, because adding to a cart is advisory and does not allocate inventory.
