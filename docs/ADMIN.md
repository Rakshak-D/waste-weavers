# Admin operations

Phase 9 adds the protected operational surface under `/admin`. It is intended for authenticated users with `UserRole.ADMIN`; customer accounts cannot use these pages or their API mutations.

## Routes

- `/admin` — database-backed operational overview
- `/admin/products`, `/admin/products/new`, `/admin/products/[id]` — catalogue products, structured rental configuration, images, and archive status
- `/admin/categories` — category creation and editing
- `/admin/inventory` — physical-unit listing, creation, filtering, and status/condition updates
- `/admin/orders`, `/admin/orders/[id]` — order search, filtering, detail, and safe status transitions
- `/admin/rentals`, `/admin/rentals/[id]` — rental operations and allocated physical-unit visibility

The shell exposes the implemented return, inspection, maintenance, and custom-request operations. Cancellation, refunds, notifications, and delivery-provider integration remain deferred.

## Authorization and services

`proxy.ts` protects navigation, but it is not the security boundary. Every admin service in `lib/admin/service.ts` calls `requireAdmin()` before reading or mutating data. Route handlers validate input with Zod and return safe errors; they never trust a role, user id, price, inventory code, or status sent by the browser.

The service layer owns bounded server-side queries and mutations. UI components only render results and submit form data. Product archival uses `ProductStatus.ARCHIVED` rather than deleting records, preserving historical order references.

## Lifecycle safety

`lib/admin/transitions.ts` centralizes valid inventory and order status transitions. Inventory status and physical condition remain separate. Inventory codes are generated server-side from the product name with a uniqueness check; client-provided codes are ignored.

An admin cannot manually make a unit available when non-cancelled, non-completed rental allocations still cover the current/future period. This preserves the Phase 5 allocation model. The complete return and refurbishment workflow is intentionally deferred to Phase 10/11.

## Phase 10 lifecycle operations

Return receiving and per-unit inspection are available under `/admin/returns`. Cleaning, repair, refurbishment, and inspection records are managed under `/admin/maintenance`. Advanced refurbishment planning, damage assessment, charges, notifications, and logistics remain future work.

## Custom request operations

Custom requests are available under `/admin/custom-orders` and remain separate from normal Orders. Admin notes are internal and are not exposed through customer account queries.

## Database status

The admin surface uses the applied Prisma migrations and is covered by PostgreSQL-backed integration and browser authorization checks. It requires a configured `DATABASE_URL` in a local environment.
