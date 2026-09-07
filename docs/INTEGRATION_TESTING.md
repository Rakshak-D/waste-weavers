# Integration testing

## Test categories

- **Unit tests** run without PostgreSQL and cover pure pricing, date, authorization, impact, storefront, lifecycle, and custom-order rules.
- **Database integration tests** exercise Prisma against PostgreSQL. Cart, checkout, and rental-allocation suites run when `RUN_DATABASE_INTEGRATION=1` and `DATABASE_URL` are set.
- **Concurrency tests** run inside the rental-allocation and checkout PostgreSQL suites. They compete for the same physical units and must produce exactly one winner.
- **Rollback tests** verify that forced failures leave no partial rental/order/allocation and preserve the cart.

## Running the suites

```powershell
npm test
```

After configuring an isolated PostgreSQL database:

```powershell
$env:RUN_DATABASE_INTEGRATION = "1"
npx prisma migrate dev
npm run db:seed
npm test
```

`npm run db:health` verifies a live Prisma connection, migration table presence, and basic seeded row counts without printing credentials.

## Isolation

Integration fixtures create uniquely named categories, products, users, addresses, rentals, and inventory units. The cart and checkout suites clear only rows owned by their generated fixture users/products between tests; the rental-allocation suite resets only its generated inventory and rentals. Tests do not assume the database is empty, do not depend on execution order, and do not run destructive database resets. Use a disposable database or dedicated schema for the full run; do not run reset commands against shared or real data.

## Phase 13 status

The current environment has no reachable PostgreSQL server and Docker Desktop's daemon is not running. Unit/static validation can run locally, but database integration, concurrency, rollback, migration application, seed verification, and end-to-end persisted workflows are blocked rather than treated as passing.

