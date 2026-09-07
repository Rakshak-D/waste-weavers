# Final E2E matrix

Phase 15 records browser evidence separately from existing PostgreSQL integration and concurrency evidence. The app remains a prototype and the matrix does not imply production readiness.

| Scenario | Expected behavior | Actual result | Browser / viewport | Database verification |
|---|---|---|---|---|
| 1. Unavailable inventory | Date selection reports insufficient inventory; cart and checkout are blocked | PASS: deterministic fixture covers all units; API returns 409; cart and unit statuses remain unchanged | Chromium desktop; mobile project covered by full run | Before/after inventory status and cart queried with Prisma |
| 2. Circular lifecycle | Rental can be returned, inspected, maintained, and made available again | Not claimed as browser E2E; lifecycle is covered by existing PostgreSQL/integration coverage | Existing browser smoke only | Existing lifecycle tests verify guarded transitions |
| 3. Cross-account ownership | Customer B cannot read or mutate customer A resources | PASS for order, custom order, address, cart isolation; rental direct-resource coverage remains limited by current customer API surface | Chromium desktop security test | Fixture resources queried and deleted; ownership predicates asserted |
| 4. Admin authorization | Customer admin routes are denied; admin routes work for admin | PASS: product, inventory, order, return, and custom-order API calls return 403 for customer; admin page smoke is database-backed | Chromium desktop | No unauthorized mutation observed |
| 5. Product archival | Archived product leaves active catalogue while history remains readable | Not claimed as browser E2E; covered by existing admin/catalogue implementation and integration evidence | Existing smoke only | Historical references are relational, not deleted |
| 6. Historical snapshots | Price, rental pricing, impact, and address snapshots do not change | Not claimed as browser E2E; PostgreSQL snapshot tests remain the authoritative evidence | Existing smoke only | Existing integration tests cover stored snapshots |
| 7. Custom-order confidentiality | Customer sees customer-facing data, never internal admin notes | Not claimed as browser E2E; server projection and ownership tests remain evidence | Existing smoke only | Admin notes are excluded from customer projection |
| 8. Mixed cart | Purchase and rental lines retain their own quantities, dates, totals, and allocation behavior | Not claimed as browser E2E; checkout integration coverage exists | Existing smoke only | Transactional checkout tests cover mixed lines |
| 9. Stale availability | Checkout revalidates inventory and rolls back without deleting the cart | Not claimed as browser E2E; concurrency/rollback integration coverage exists | Existing smoke only | Existing tests verify no partial order/rental/allocation |
| Accessibility | Audited customer/admin surfaces have no remaining axe violations | PASS: 3 grouped audits; keyboard smoke PASS | Chromium desktop; 390×844 mobile smoke retained | N/A |

The four original desktop smoke flows and four mobile-sized smoke flows remain passing. Scenarios explicitly marked “not claimed” are accepted scope limitations for this prototype, not silently converted into passes.

Final Playwright run: 20 passed, 0 failed, across desktop Chromium and the 390 × 844 mobile-sized Chromium project. This includes six grouped accessibility audits, two keyboard-focus runs, two authorization runs, two unavailable-inventory runs, and eight established smoke tests.
