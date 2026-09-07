# Contributing to Waste Weavers

Waste Weavers is a student/SIH prototype. Keep changes focused, explain business assumptions, and preserve honest limitations.

Routes/API handlers are in `app/`; UI is in `components/`; server domain services are in `lib/`; schema/migrations/seed are in `prisma/`; unit/integration tests are in `tests/`; browser tests are in `e2e/`; decisions are in `docs/`.

Use TypeScript and the existing visual language. Keep Prisma and secrets server-side. Pricing, date, availability, allocation, authorization, and lifecycle rules belong in their existing authoritative services. Never trust browser-supplied price, role, user ID, inventory ID, or totals.

Use a short branch from `main`, keep commits focused, and avoid broad dependency upgrades or major new modules in cleanup work. Add a Prisma migration for schema changes; never delete migration history or reset a shared database.

Before review:

```powershell
npm run typecheck
npm run lint
$env:RUN_DATABASE_INTEGRATION = "1"
npm test
npm run e2e
npm run build
```

Never commit `.env`, credentials, tokens, database dumps, or real service secrets. PRs should include tests for business rules, authorization, database changes, and historical snapshots, and should state deferred behavior without claiming production readiness.
