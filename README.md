# Waste Weavers

Waste Weavers is an SIH 2026 prototype for circular event décor commerce using upcycled textiles, purchase, rental, reuse, and physical inventory lifecycle management.

## Implemented scope

- Responsive catalogue with purchase and rental products.
- Customer authentication, accounts, addresses, carts, checkout, orders, and rental history.
- Inclusive date-range availability with transactional physical-unit allocation.
- Admin product, inventory, order, rental, return, inspection, maintenance, impact, and custom-order operations.
- Historical price, address, rental, and impact snapshots.
- PostgreSQL integration, concurrency, rollback, Playwright E2E, axe accessibility, and ownership tests.

## Technology and architecture

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Prisma, PostgreSQL 16, Auth.js Credentials, Zod, Vitest, and Playwright. Server components and route handlers call domain services in `lib/`; Prisma is server-only; authentication, ownership, pricing, availability, allocation, checkout, and lifecycle transitions are server-authoritative.

## Quick start

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for the shortest Windows PowerShell path and [docs/POSTGRESQL_SETUP.md](docs/POSTGRESQL_SETUP.md) for database detail.

```powershell
Copy-Item .env.example .env
# Edit .env with local PostgreSQL DATABASE_URL and AUTH_SECRET values.
npm install
npm run db:deploy
npm run db:generate
npm run db:seed
npm run dev
```

## Demo configuration and limitations

Seeded rental pricing is `PER_DAY` at ₹2,500 per inclusive calendar day. This is a demonstration configuration, not a finalized commercial pricing policy. Payments use a development adapter with no real financial side effect. There is no live Porter integration; delivery/collection fields are prototype operational data.

Development-only seed credentials are in [docs/SIH_DEMO.md](docs/SIH_DEMO.md) and [docs/USER_GUIDE.md](docs/USER_GUIDE.md). Never reuse them in production.

Production payments, refunds, sophisticated cancellation, live logistics, SMS/email, CRM, external sustainability APIs, and audited carbon/water calculations are deferred. This repository must not be described as production-ready.

The verified Prisma 6 toolchain has a currently reported npm audit advisory in a CLI-only transitive dependency; resolving it requires a major upgrade and is deferred from this prototype publication.

## Validation

```powershell
npm run typecheck
npm run lint
$env:RUN_DATABASE_INTEGRATION = "1"
npm test
npm run e2e
npm run build
```

Use a dedicated PostgreSQL database or schema for mutating E2E tests.

GitHub Actions validates install, typecheck, lint, the default test suite, and production build. PostgreSQL integration and browser E2E require the documented local isolated environment.

## Project map

`app/` routes and API handlers · `components/` UI · `lib/` domain services · `config/` rules · `prisma/` schema, migrations, and seed · `tests/` unit/integration tests · `e2e/` browser tests · `docs/` documentation.

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Quickstart](docs/QUICKSTART.md)
- [SIH demo runbook](docs/SIH_DEMO.md)
- [Final business rules](docs/FINAL_BUSINESS_RULES.md)
- [Final E2E matrix](docs/FINAL_E2E_MATRIX.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## License

Released under the MIT License. See [LICENSE](LICENSE).
