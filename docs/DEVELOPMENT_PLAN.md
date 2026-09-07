# Development plan

## Phase 0 - Foundation

Establish the Next.js/TypeScript application shell, styling conventions, Prisma boundary, environment template, directory ownership, architecture documentation, and validation scripts. Keep domain behavior out of scope.

## Phase 1 - Database schema and seed data

Agree and implement the initial PostgreSQL/Prisma model for catalogue products, physical inventory, lifecycle state, and the minimum order/rental references needed by later phases. Add safe development seed data and constraints.

## Phase 2 - Authentication and authorization — Implemented

Auth.js Credentials authentication, bcrypt password hashing, registration/login/logout flows, managed JWT sessions, customer/admin route protection, reusable server-side authorization helpers, demo credentials, and focused authorization/password tests are implemented. OAuth, email verification, password reset, MFA, and production email infrastructure remain deferred.

## Phase 3 - Storefront/product catalogue — Implemented

Implemented the responsive Waste Weavers storefront, server-side product catalogue queries, search/filter/sort controls, product cards, product detail route foundation, circular lifecycle storytelling, SHG/about/how-it-works/impact pages, image fallback behavior, metadata, and focused catalogue helper tests. Rental availability, final rental pricing, cart, checkout, and payments remain deferred.

## Phase 4 - Rental availability and date-range selection — Implemented

Implemented centralized date validation/interval semantics, physical-inventory availability queries, quantity-aware aggregate results, the public availability API, and the customer rental date-range picker. No reservation, allocation mutation, or rental pricing was implemented. Final date inclusivity/timezone rules remain unresolved.

## Phase 5 - Real database integration and transactional rental allocation — Implemented

Implemented the PostgreSQL migration artifact, nullable pre-checkout rental relation, server-side authenticated allocation API, product-scoped advisory-lock/serializable transaction strategy, retry and rollback behavior, and PostgreSQL integration/concurrency test suite. Integration tests remain skipped until a real PostgreSQL `DATABASE_URL` is configured.

## Phase 6 — Pricing/cart — Implemented

The centralized purchase/rental pricing engine and authenticated persistent customer cart are implemented. Rental pricing remains configuration-driven and unresolved commercial rules remain open. Checkout uses the Phase 5 allocator; production payment integration remains future work.

Implement server-side rental pricing, purchase pricing, cart state, and a transparent price breakdown after the pricing convention is confirmed.

## Phase 7 - Checkout/payments/orders

Phase 7 is implemented as a prototype checkout: server-side cart revalidation, address snapshots, historical Order/OrderItem creation, mixed purchase/rental handling, development payment abstraction, and transactional invocation of the Phase 5 rental allocator. Production payment gateway, refunds, cancellations, delivery integration, notifications, and admin order management remain deferred.

Production payment provider integration, webhook handling, refunds, cancellations, and provider-specific failure/retry behavior remain future work.

## Phase 8 - Customer dashboard — Implemented

Phase 8 adds the customer dashboard, ownership-scoped order history/detail pages, rental grouping and timelines, read-only historical order presentation, profile basics, and customer-owned address management. Admin operations, returns/refurbishment, cancellations, refunds, and notifications remain future work.

Show customer orders, rentals, dates, delivery/collection status, and relevant impact information.

## Phase 9 - Admin dashboard — Implemented

Phase 9 adds the protected admin shell, database-backed overview metrics, product/category management, physical inventory operations, order operations, rental operations, server-side filters/pagination, and centralized safe status-transition helpers. Returns, refurbishment, cancellation, refunds, notifications, and delivery integration remain future work. PostgreSQL integration is verified locally and must use an isolated database in development.

## Phase 10 - Inventory and rental lifecycle — Implemented

Track physical units, assignment, delivery, collection, inspection, maintenance, and guarded circular re-entry. Advanced logistics, notifications, charges, and analytics remain future work. The new Prisma migration must be applied after PostgreSQL is configured.

## Phase 11 - Sustainability/impact — Implemented

Phase 11 adds supported product impact validation/editing, transaction-time order snapshots, unit-preserving customer aggregation, catalogue/product/order presentation, customer impact dashboard, and admin visibility. Scientific conversion methodologies, external data, and advanced BI remain future work.

## Phase 12 - Custom event orders — Implemented

Phase 12 adds authenticated custom request submission, ownership-scoped customer history/detail, admin search/filter/detail, internal notes, and controlled status transitions. Quotation, invoicing, payment, production, delivery, notifications, and CRM remain future work.

## Phase 13 - PostgreSQL integration, end-to-end validation, and system hardening — Implemented

PostgreSQL 16.13, migrations, seed, integration tests, advisory-lock concurrency, and rollback behavior were verified. See `docs/INTEGRATION_TESTING.md`.

## Phase 14 - Business-rule finalization and SIH demo readiness — Implemented for prototype scope

Centralize explicit demo rules, document unresolved commercial decisions, add Playwright smoke coverage, and harden the seeded customer/admin walkthrough without adding major business functionality. Production billing, payment, logistics, refunds, and other deferred commercial modules remain out of scope.

## Phase 14 - Testing/security/edge cases

Cover pricing, date overlaps, concurrency, authorization, webhook idempotency, validation, accessibility, and operational failure cases.

## Phase 15 - Final E2E matrix, accessibility, security, and SIH demo readiness — Implemented for prototype scope

Added deterministic unavailable-inventory browser coverage, cross-account/admin authorization checks, axe audits, keyboard-focus smoke coverage, accessibility fixes, final matrix documentation, and a canonical demo runbook. Desktop and mobile smoke flows remain passing. Circular lifecycle, historical mutation, archival, mixed-cart, stale-checkout, and custom-order confidentiality are explicitly not claimed as complete browser scenarios; their existing PostgreSQL/integration evidence remains documented. No production payment, delivery-provider, refund, cancellation, messaging, or external impact modules were added.

