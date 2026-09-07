# Waste Weavers database model

The Prisma/PostgreSQL model supports the circular commerce workflow while leaving deferred commercial rules explicit.

The versioned migrations are stored under `prisma/migrations/`: the initial domain migration, cart, return-inspection, and order-impact-snapshot migrations. They are applied in the verified local PostgreSQL environment. Use `docs/POSTGRESQL_SETUP.md` for safe local setup and `npm run db:health` for a non-secret connection/seed health check.

## Entity purpose

- `User` supports customers and administrators. Phase 2 adds a nullable server-only `passwordHash`; authentication/session behavior is documented in `docs/AUTHENTICATION.md`.
- `Category` groups catalogue products by a unique slug.
- `Product` is the sellable/catalogue concept. It can independently be `rentable` and/or `purchasable`.
- `ProductImage` stores ordered product media and cascades when its product is deleted.
- `InventoryUnit` represents one physical item with a unique operational code, status, and condition.
- `Order` records a customer transaction and historical monetary totals.
- `OrderItem` stores product and price snapshots at the time of the order.
- `Rental` records the time-bounded use associated with a rental order.
- `RentalAllocation` explicitly links a rental to each physical inventory unit assigned to it.
- `Address` stores mutable customer address records. Orders retain a JSON shipping snapshot so later profile edits do not rewrite history.
- `RentalReturn` represents the return workflow without assuming that returned inventory is immediately available.
- `MaintenanceRecord` records inspection, cleaning, repair, or refurbishment history for a physical unit.
- `CustomOrder` stores an initial custom-order request without quotation or invoicing logic.
- `ImpactMetric` stores explicit product-level sustainability values and units without inventing a calculation methodology.

## Important relationships

```text
User ──< Order ──< OrderItem >── Product ──< InventoryUnit
  │       │                          │              │
  │       └──< Rental ──< RentalAllocation >───────┘
  │                    │
  │                    └── RentalReturn
  ├── Address
  └── CustomOrder

Product ──< ProductImage
Product ──< ImpactMetric
InventoryUnit ──< MaintenanceRecord
Category ──< Product
```

`RentalAllocation` is the physical allocation record. This allows future availability queries to count units for a product whose rental allocations overlap a requested interval. The schema itself does not express the indirect rental-range exclusion as a Prisma constraint; Phase 5 enforces allocation through the PostgreSQL transactional allocation service.

Phase 5 uses the `RentalAllocation(rentalId, inventoryUnitId)` uniqueness constraint and `RentalAllocation(inventoryUnitId, rentalId)` index, plus the `Rental` date/status indexes, for allocation lookup. Product-scoped PostgreSQL advisory locking is used by the allocation service; no exclusion constraint was added because the interval is stored on `Rental`, not directly on `RentalAllocation`, and final interval semantics remain open.

## Important enums

- `UserRole`: `CUSTOMER`, `ADMIN`
- `OrderType`: `PURCHASE`, `RENTAL`, `MIXED`
- `OrderStatus` and `PaymentStatus`: supported prototype order/payment lifecycle states
- `InventoryStatus`: available, reserved, rented, return-pending, inspection, maintenance, damaged, retired
- `InventoryCondition`: new, good, fair, damaged
- `RentalStatus`: pending, reserved, active, return-pending, completed, cancelled
- `ReturnStatus` and `ReturnCondition`: separate process state from assessed result
- `MaintenanceType` and `MaintenanceStatus`: maintenance history and work state
- `CustomOrderStatus`: request-to-completion workflow state

## Inventory-unit design

Stock is not stored as one product quantity. Each physical rental-capable item has an `InventoryUnit` row such as `WW-MPB-001`. Its status describes where it is in the circular operational lifecycle; its condition describes physical quality. This lets later phases retain rental history, maintenance history, damage outcomes, and retirement decisions.

The aggregate quantity shown to a customer should be derived from units that are eligible and not allocated to overlapping active rentals. The `status` field alone is not sufficient to answer date-based availability.

## Rental representation

`Rental.startAt` and `Rental.endAt` are stored as timestamps so later timezone and date-only decisions remain possible. Each allocated physical unit is represented by a separate `RentalAllocation` row. `RentalAllocation` has a uniqueness constraint per rental/unit pair and retains allocation/release timestamps.

The technical interval convention is inclusive date-only input normalized to UTC, with same-day rentals counting as one day and a configured maximum duration. Cleaning buffers, geography, lead times, and reservation expiration remain deferred commercial/operational rules.

## Historical pricing principle

`Product.purchasePrice` is current catalogue data only. Historical values are copied to `OrderItem.unitPrice` and `OrderItem.lineTotal`; order-level subtotal, tax, delivery, discount, and grand total fields are also stored independently. Rental pricing information is preserved in `OrderItem.rentalPricingSnapshot` and `Rental.pricingSnapshot` as JSON until the final pricing convention is decided.

No taxes, deposits, delivery charges, late fees, discounts, or final rental billing unit are assumed by the schema.

## Verification status

Prisma validation/client generation, migration application, seed verification, database health, PostgreSQL integration tests, concurrency tests, rollback tests, and persisted browser smoke tests have been verified locally. No SQLite fallback is used.

## Phase 9 operational access

Phase 9 does not change the Prisma schema and therefore does not add a migration. Admin operations reuse existing indexes and relations for products/categories, physical inventory, orders, rentals, and rental allocations. Admin list queries apply bounded server-side filters and pagination. Inventory status changes additionally inspect relevant allocations before making a unit available.

Phase 10 adds `ReturnInspection`, which links one `RentalAllocation` to one `RentalReturn` and stores a per-unit condition, optional maintenance type, notes, and inspection timestamp. Its unique allocation relation prevents duplicate inspection rows for the same physical allocation. The migration remains unapplied until PostgreSQL is configured.

Phase 11 adds nullable `OrderItem.impactSnapshot`. Checkout copies validated product impact metrics into this JSON snapshot, allowing historical customer/order impact to remain stable when current product metrics are edited. No scientific conversion fields were added.

## Seed data

`prisma/seed.ts` creates clearly marked demo data: three categories, five products, multiple product images, physical inventory units, explicit demo impact metrics, a demo customer, a demo admin, and one demo address. It intentionally creates no orders or rentals so availability remains unambiguous for later testing.

## Unresolved business rules

`docs/BUSINESS_RULES.md` remains the source of truth for open decisions, including the conflict between the approximately ₹2,500/24-hour SIH reference and the intended date-range rental experience. The schema stores flexible configuration/snapshot fields but does not finalize that rule.

