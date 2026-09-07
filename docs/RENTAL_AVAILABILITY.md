# Rental availability and date selection

Rental availability uses server-side checks and customer date-range selection. It does not create reservations or mutate inventory. Rental pricing is calculated by the shared pricing engine; checkout remains the authoritative allocation operation.

## Architecture

```text
Product detail client picker
          │ POST productId/date range/quantity
          ▼
POST /api/rentals/availability
          │ validate input
          ▼
lib/rental/availability.ts
          │ Prisma filters by product, eligible units, and overlapping allocations
          ▼
aggregate availability result
```

The browser only requests a check and displays the result. It never decides whether a product is rentable or available, and it never receives physical inventory identifiers.

This read-only check is distinct from Phase 5 authoritative allocation. Allocation repeats the availability query inside a serialized PostgreSQL write transaction; see `docs/RENTAL_ALLOCATION.md`.

## Date validation and semantics

`lib/rental/date.ts` is the single date utility layer. It validates `YYYY-MM-DD` date-only values, rejects invalid dates, rejects starts in the past, rejects start-after-end ranges, and limits a range to 366 days.

The active SIH demo policy is `inclusive`: a same-day range is one day and a 12 Oct → 15 Oct range is four days. The overlap boundary is implemented centrally and supports both `inclusive` and `half-open` semantics. Date-only values are normalized to UTC for persistence. The commercial timezone and final billing convention remain deferred; changing the approved policy requires changing `config/business-rules.ts` and the shared utility layer together.

Date-only values are normalized to UTC midnight for server queries. This is an implementation convention, not a finalized customer timezone policy.

## Overlap logic

`intervalsOverlap` and `overlapsDateRange` own the interval rule. The Prisma query helper uses the inclusive equivalent:

```text
existing.startAt <= requested.endAt
AND
existing.endAt >= requested.startAt
```

Cancelled rentals do not block availability. All other rental statuses with an overlapping allocation are treated as blocking, including pending/reserved/active/return-pending/completed records. A later reservation workflow may refine status semantics.

## Inventory eligibility

The centralized policy currently considers only `InventoryStatus.AVAILABLE` units eligible. `RENTED`, `RESERVED`, `RETURN_PENDING`, `INSPECTION`, `MAINTENANCE`, `DAMAGED`, and `RETIRED` are excluded. The product must also have `rentable = true`.

The service counts all physical units for `totalInventory`, then queries eligible units and excludes any unit having a non-cancelled allocation whose rental overlaps the requested range. It returns aggregate counts only, so lifecycle-unavailable units remain represented in `unavailableQuantity`.

## Quantity handling

The requested quantity must be an integer from 1 to 100. If fewer units are available, the result is `canRent: false` with `INSUFFICIENT_INVENTORY`; the request is never silently reduced. A zero-availability result uses `NO_AVAILABLE_UNITS`.

## API boundary

`POST /api/rentals/availability` accepts:

```json
{
  "productId": "...",
  "startDate": "2026-10-12",
  "endDate": "2026-10-15",
  "quantity": 2
}
```

It validates all fields server-side and returns dates, duration, requested quantity, total eligible inventory, available/unavailable counts, `canRent`, and a safe reason code. It does not return customer data, rental records, or inventory unit IDs.

## Calendar behavior

`RentalAvailabilityPicker` uses `react-day-picker` in range mode. Past dates are disabled in the UI, but the API validates dates again. The component checks only after both dates exist and when quantity changes, with a small debounce. It shows idle, checking, available, insufficient, unavailable, and error states. Selecting dates does not reserve anything.

The product page uses the same pricing engine as cart and checkout. Seeded demo products show their explicit `PER_DAY` rate; products without a valid configuration show a controlled pricing-unavailable state rather than an invented rate.

## Concurrency limitation

An availability check is informational and does not prevent races. Two customers can both observe the same unit as available. Phase 5 adds the authoritative allocation service, which re-checks availability inside a PostgreSQL advisory-locked serializable transaction. Checkout/order integration still must call that service; the calendar itself never reserves inventory.

## Testing and database status

Pure unit tests cover validation, same-day and multi-day semantics, non-overlap, overlap boundaries, eligible lifecycle statuses, partial/complete availability, requested quantity handling, and non-rentable products. PostgreSQL integration tests and Phase 13 concurrency/rollback checks are verified with `RUN_DATABASE_INTEGRATION=1` against the configured PostgreSQL environment.
