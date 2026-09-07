# Browser E2E testing

Playwright is configured in `playwright.config.ts` with a desktop project and a mobile-sized Chromium project. `e2e/smoke.spec.ts` covers seeded storefront access, customer registration, purchase checkout, rental pricing/calendar visibility, mobile shop rendering, and database-backed admin pages. Selectors use product slugs and visible labels rather than database IDs.

## Isolated database

Run mutating E2E tests against a dedicated PostgreSQL database or schema, never shared or production data. Configure `E2E_DATABASE_URL` for the app launched by Playwright and seed it first:

```powershell
$env:E2E_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/wasteweavers_e2e?schema=public"
$env:E2E_BASE_URL = "http://127.0.0.1:3000"
npm run db:deploy
npm run db:seed
npx playwright test
```

The tests use generated customer accounts and seeded slugs, not hard-coded database IDs. They run with one worker. Set `PLAYWRIGHT_EXECUTABLE_PATH` when using an installed Chrome/Edge executable instead of bundled browser binaries.

The smoke suite is intentionally lightweight and does not replace the PostgreSQL integration/concurrency suite. Phase 15 adds deterministic unavailable-inventory, ownership/admin-authorization, axe accessibility, and keyboard-focus coverage. The final evidence and explicit gaps are recorded in `docs/FINAL_E2E_MATRIX.md`; browser scenarios marked “not claimed” are not reported as passing.

## Current run

- Desktop Chromium: 4 passed (purchase checkout/account history, rental pricing/calendar, storefront smoke, admin database-backed pages).
- Mobile-sized Chromium (390 × 844): 4 passed (same smoke matrix).
- Additional Phase 15 focused suites: unavailable inventory PASS, customer/admin authorization PASS, grouped axe audit PASS, keyboard focus PASS.
- Circular lifecycle, archival, historical mutation, custom-order confidentiality, mixed-cart, and stale-checkout browser flows remain explicitly unclaimed; their PostgreSQL/integration evidence remains authoritative. See `docs/FINAL_E2E_MATRIX.md`.
