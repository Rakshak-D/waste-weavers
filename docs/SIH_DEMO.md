# SIH demo runbook

## Start the local environment

1. Start PostgreSQL 16 and create an isolated development database.
2. Set `DATABASE_URL` in a local `.env` file; never commit it.
3. Run:

```powershell
npm run db:deploy
npm run db:generate
npm run db:seed
npm run db:health
npm run dev
```

For browser testing, use a separate database or schema and set `E2E_DATABASE_URL`; never point Playwright at the demo database. If the global npm shim is unavailable on a workstation, run the equivalent local binaries from `node_modules/.bin`.

## Development credentials

- Customer: `demo.customer@wasteweavers.example` / `DemoCustomer2026!`
- Admin: `demo.admin@wasteweavers.example` / `DemoAdmin2026!`

These are seed-only credentials and are not production credentials.

## Canonical 5–7 minute prototype walkthrough

1. Introduce Waste Weavers and its circular décor catalogue.
2. Open `/shop` and choose **Mitti Patchwork Backdrop**.
3. Select two future rental dates, show availability and the active demo rate: `PER_DAY`, ₹2,500 per inclusive calendar day.
4. Add the rental, review the cart, select the seeded address, and complete development checkout.
5. Show the order and `/account/rentals`.
6. Switch to admin, show database-backed metrics and the rental allocation.
7. If time permits, use the implemented returns/inspection/maintenance screens and show the healthy unit re-entering availability; otherwise show the custom-order and impact records.

Recommended rental dates are any two future calendar dates at least one day apart, for example tomorrow through the following day. Same-day selection is valid and counts as one inclusive demo day.

## Admin walkthrough

The browser matrix is deliberately broader than this short script. It is documented in `docs/FINAL_E2E_MATRIX.md`; scenarios not marked PASS there should not be presented as completed demo claims.

## Admin walkthrough

Sign in as the demo admin, open `/admin`, and show live product, inventory, order, rental, custom-order, and return data. Use `/admin/returns` and `/admin/maintenance` only with a known walkthrough rental. A custom request is not an Order or quotation.

Production payment, tax, delivery-provider, refund, cancellation, notification, and scientific impact functionality are not active.
