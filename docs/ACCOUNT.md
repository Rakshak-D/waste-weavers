# Customer account

Phase 8 provides the authenticated customer post-purchase experience. It does not implement admin operations, return/refurbishment administration, cancellation, refunds, or notifications.

## Routes

- `/account` — overview with recent orders and upcoming rentals
- `/account/orders` — newest-first customer order history
- `/account/orders/[id]` — ownership-scoped order details and historical totals/address
- `/account/rentals` — upcoming, active, completed, and cancelled rental groups
- `/account/rentals/[id]` — rental dates, status, products, historical pricing snapshot, and timeline
- `/account/profile` — name and phone editing; email is read-only
- `/account/addresses` — customer-owned address CRUD
- `/account/impact` — historical customer impact from qualifying order snapshots
- `/account/custom-orders` and `/account/custom-orders/[id]` — ownership-scoped custom event request history and details

All account pages use the authenticated server session. Account APIs use `requireRole("CUSTOMER")` and address queries include the authenticated `userId` in every read/write predicate.

## Data access and ownership

`lib/account/service.ts` contains bounded customer queries for orders, rentals, profile, and addresses. `getOrderForUser` remains the shared ownership-scoped order detail function. An unknown or another customer's order/rental/address is returned as not found; no existence information is disclosed.

Rental queries return product names/slugs and aggregate product information, not inventory-unit IDs or inventory codes. Rental grouping is centralized in `lib/account/presentation.ts`:

- `PENDING`, `RESERVED` → upcoming
- `ACTIVE`, `RETURN_PENDING` → active
- `COMPLETED` → completed
- `CANCELLED` → cancelled

## Historical data

Order detail uses stored `OrderItem.unitPrice`, `OrderItem.lineTotal`, order totals, `Rental.pricingSnapshot`, and `Order.shippingAddressSnapshot`. It does not recalculate historical charges from current Product pricing. Editing or deleting a saved `Address` does not touch an order's JSON shipping snapshot.

The rental timeline only shows milestones supported by current RentalStatus values and stored timestamps. It does not invent delivery, return, or completion events.

Customer impact is calculated server-side from `OrderItem.impactSnapshot` records. It preserves metric types and units, multiplies only the supported textile-waste representation by quantity, and does not claim achieved reuse cycles or unsupported environmental conversions.

Custom request pages expose only the authenticated customer's records and never expose internal admin notes. A custom request is not an order and does not imply a quote, payment, inventory reservation, or production commitment.
