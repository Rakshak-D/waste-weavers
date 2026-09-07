# Transactional rental allocation

The authoritative server-side operation creates a rental and allocates physical inventory units atomically. Cart, checkout, pricing, and return workflows call or build on this server-side allocation boundary. Reservation expiration and production payment behavior remain deferred.

## Allocation lifecycle

`allocateRentalInventory` accepts only:

- authenticated server-derived `userId`
- `productId`
- date-only `startDate` and `endDate`
- requested `quantity`
- optional `orderId`

The service validates dates and quantity, verifies that the product is rentable, selects eligible `AVAILABLE` units, excludes overlapping allocations, creates a `Rental` with `RESERVED` status, and creates `RentalAllocation` rows in one transaction. The service chooses units; clients cannot submit inventory IDs.

`Rental.orderId` is nullable because Phase 5 must establish rental allocation before the later checkout/order workflow exists. When an order exists, it can be linked through `orderId`.

## Transaction and concurrency strategy

The operation runs inside a PostgreSQL `Serializable` Prisma transaction. Before reading availability, it obtains a transaction-scoped PostgreSQL advisory lock keyed by the product ID:

```sql
SELECT pg_advisory_xact_lock(hashtextextended(product_id, 0));
```

All allocation writes through this service for the same product therefore serialize their availability decision and unit selection. The lock is released automatically on commit or rollback. Serializable conflicts (`P2034`) are retried up to two times; persistent conflicts return the stable `INVENTORY_UNAVAILABLE` result.

This is an application-level writer protocol: future rental-writing operations must use the same product lock/service. A transaction alone is not treated as sufficient concurrency protection.

## Allocation conflict behavior

The service re-checks inventory inside the write transaction. If another allocation wins first, the later operation returns:

```text
INVENTORY_UNAVAILABLE
Those dates are no longer available. Please select another date range.
```

No dates or quantity are changed automatically. Physical unit IDs and rental/customer details are not returned to the customer.

## Rollback behavior

Rental creation and allocation creation share the same transaction. If allocation creation fails after the rental row is inserted, the transaction rolls back both the rental and all allocations. A dedicated PostgreSQL integration test hook verifies this behavior when integration tests are enabled.

## Relationship to Phase 4 availability

Phase 4 availability is read-only and informational. It uses the same date validation, overlap filter, and eligible inventory policy. Phase 5 allocation is authoritative: it repeats the checks inside a locked write transaction and mutates the database only when the full requested quantity is available.

## PostgreSQL-specific behavior

The migration remains PostgreSQL-only. The service depends on `pg_advisory_xact_lock`, `hashtextextended`, serializable transactions, and Prisma PostgreSQL behavior. SQLite is not used as a substitute.

The current schema has no PostgreSQL exclusion constraint over a timestamp range because `RentalAllocation` stores the rental interval indirectly through `Rental`, and the final date/time semantics remain unresolved. The product-scoped advisory-lock protocol is the chosen Phase 5 strategy. A future direct range constraint can be evaluated if the model is changed to store an allocation range directly.

## Reservation semantics

`RentalStatus.RESERVED` represents an allocated rental booking for this phase. It is not an expiring temporary hold. Reservation expiration, cancellation, payment confirmation, and checkout state remain unresolved future business rules.

## Checkout integration

Phase 7 checkout uses the exported `allocateRentalWithinTransaction` primitive inside the larger Order transaction. This preserves the same PostgreSQL advisory lock, serializable isolation, physical-unit selection, conflict result, and rollback behavior without opening a nested Prisma transaction or duplicating allocation logic.

## Local PostgreSQL setup

This repository does not include a database server or credentials. To run the migration, seed, and integration tests locally:

1. Install and start PostgreSQL.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the local PostgreSQL database.
3. Run `npm run db:migrate`.
4. Run `npm run db:generate` and `npm run db:seed`.
5. Enable database tests with PowerShell: `$env:RUN_DATABASE_INTEGRATION="1"; npm test`.

The integration suite creates and removes its own deterministic fixtures. It should only be enabled against a dedicated development/test database.
## PostgreSQL lock invocation

Allocation uses `pg_advisory_xact_lock(hashtextextended(productId, 0))` inside the caller's transaction. PostgreSQL returns `void` from this function, so the implementation invokes it with Prisma `$executeRaw`, not `$queryRaw`; `$queryRaw` would attempt to deserialize a nonexistent result column. The lock is transaction-scoped and releases automatically on commit or rollback. Direct allocation and checkout both call the same `allocateRentalWithinTransaction` primitive, so they use the same product-scoped lock and serializable isolation strategy.

The integration suite includes a focused lock test that proves a second transaction cannot acquire the same product key while the first transaction is open, and can acquire it after the first commits.
