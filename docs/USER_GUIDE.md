# Waste Weavers user guide

Waste Weavers is a circular event-décor prototype. Customers browse upcycled textile décor, purchase or rent items, check availability, place a development checkout order, track rentals, view recorded impact, and submit custom event requests. Admins operate catalogue, inventory, orders, returns, inspections, maintenance, and requests.

## Start and demo accounts

Follow [QUICKSTART.md](QUICKSTART.md), then open `http://localhost:3000`. The complete presentation script is in [SIH_DEMO.md](SIH_DEMO.md).

Development/demo credentials only:

- Customer: `demo.customer@wasteweavers.example` / `DemoCustomer2026!`
- Admin: `demo.admin@wasteweavers.example` / `DemoAdmin2026!`

## Customer journey

1. Open **Shop**, search/filter, and open a product.
2. Add a purchase, or select rental dates and quantity before checking availability.
3. Review quantities, dates, and totals in **Cart**.
4. Sign in at **Checkout**, choose an address, review the server-authoritative totals, and complete the development payment flow.
5. Open **Account → Orders** or **Account → Rentals** to review the result.

Rental dates are date-only, inclusive calendar dates normalized technically in UTC. Same-day rental is one day; past dates and ranges over 366 days are rejected. The active demo rate is ₹2,500 per inclusive calendar day. It is not a final commercial policy.

## Account, impact, and custom requests

Customers can manage profile basics and addresses, view historical orders/rentals, and view explicit product impact records. Historical snapshots do not change when current product or address data changes. **Custom order** submits a request for review, not an automatic quotation, booking, or invoice.

## Admin operations

The admin dashboard shows database-backed metrics. Product management supports editing and archival; inventory manages physical units and guarded statuses; order/rental pages show operations; returns receive and inspect units; maintenance tracks cleaning, repair, refurbishment, and completion; custom-order pages manage status and internal notes. Healthy returned units can re-enter availability after the implemented lifecycle completes.

## Limitations and troubleshooting

Payment is a development adapter with no real charge. There is no live Porter/logistics integration. Impact records are not audited carbon, water, or CO₂ calculations. If the database is unavailable, check `DATABASE_URL` and run `npm run db:health`; if tables are missing, run `npm run db:deploy` and `npm run db:generate`; if products are missing, run `npm run db:seed` against the intended disposable database.
