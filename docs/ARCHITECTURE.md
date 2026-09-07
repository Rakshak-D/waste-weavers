# Waste Weavers architecture

## Purpose

Waste Weavers is a single Next.js full-stack application for a circular e-commerce platform for sustainable event décor made from upcycled post-consumer textiles. Phase 0 establishes boundaries and conventions; it does not implement the commerce or lifecycle domains.

## Application architecture

- **Next.js App Router** owns pages, layouts, route handlers, and server/client component boundaries.
- **Server-first by default:** pages and business workflows should run on the server unless interactivity requires a client component.
- **Route handlers** under `app/api` will expose narrowly scoped HTTP endpoints when a browser or external integration needs one.
- **PostgreSQL + Prisma** will be the source of truth for domain state. Prisma access is centralized in `lib/db`.
- **Business logic** belongs in focused server-side modules under `lib`, not in UI components or route handlers.

Phase 6 adds a persistent customer `Cart`/`CartItem` layer and a pure pricing module under `lib/pricing`. Cart route handlers authenticate the customer, load authoritative product data through Prisma, and recalculate totals. The cart remains separate from `Order`, `Rental`, and physical allocation until checkout.

Phase 7 adds a server-side checkout boundary. Checkout revalidates the cart, snapshots historical prices, creates Orders/OrderItems, invokes the Phase 5 allocation primitive inside the same serializable transaction, and clears converted cart items only after commit. A development-only payment adapter sits before final order confirmation.

Phase 8 adds ownership-scoped customer account queries and pages. Order/rental/address reads and mutations derive the customer from the server session; historical order totals, rental pricing snapshots, and shipping snapshots are read-only records.

Phase 9 adds the protected admin operational surface. `lib/admin/service.ts` is the server-side boundary for bounded product, category, inventory, order, rental, and dashboard queries. `lib/admin/transitions.ts` owns lifecycle transition rules. Admin route handlers and server pages still require `requireAdmin()` independently of navigation link visibility.

Phase 10 adds `lib/admin/lifecycle.ts` for return receiving, per-allocation inspection, maintenance, and circular re-entry. These operations use Prisma transactions and centralized transition helpers; customer rental reads expose only aggregate return status/condition, while admin lifecycle reads may expose physical inventory codes.

Phase 11 adds `lib/impact/engine.ts` for supported metric validation, snapshots, unit-preserving aggregation, and formatting, plus `lib/impact/service.ts` for authenticated customer impact queries. Impact calculations stay outside React components; checkout snapshots authoritative product metrics on each order item.

Phase 12 adds `lib/custom-orders/service.ts` for authenticated customer request validation/ownership and `lib/admin/custom-orders.ts` for admin search, detail, internal notes, and guarded status transitions. Custom requests remain separate from `Order` and do not trigger payment or production actions.

Phase 13 verified the PostgreSQL datasource, migrations, seed, serializable allocation, advisory-lock concurrency, and rollback behavior. Phase 14 keeps PostgreSQL as the only datasource, centralizes demo/date/fee state in `config/business-rules.ts`, uses `npm run db:health` for connectivity/seed checks, and uses Playwright against a dedicated E2E database/schema for browser smoke coverage.

## Folder responsibilities

```text
app/
  (storefront)/       Customer-facing catalogue and product routes
  (auth)/             Sign-in and account-access routes
  account/            Customer account area
  admin/              Protected operational admin pages and server-rendered tables
  api/                Route handlers for server APIs and integrations
components/
  ui/                 Reusable shadcn/ui primitives
  storefront/         Storefront-specific presentation
  admin/              Admin-specific presentation
  shared/             Presentation shared by customer and admin surfaces
lib/
  db/                 Prisma client and database helpers
  auth/                Auth.js configuration, password helpers, and authorization guards
  pricing/             Centralized purchase/rental pricing policies and calculations
  cart/                Customer cart persistence, ownership, and authoritative cart views
  account/             Customer account queries, status presentation, and address/profile services
  rental/              Date semantics and server-side inventory availability logic
  validation/          Shared server-side schemas and input validation
  utils/               Small cross-cutting utilities
prisma/               Prisma schema and seed entry point
types/                Shared domain and transport types (future)
config/               Centralized demo and technical business-rule configuration
public/                Static assets
docs/                 Architecture, delivery plan, and business rules
```

Customer and admin route groups remain separate in the URL tree and in authorization checks. A shared component is not automatically a shared permission boundary.

## Customer/admin boundaries

Customer features may read and mutate only data authorized for the current customer and their orders/rentals. Admin features will use explicit role/permission checks at the server boundary. UI visibility is not a security control; every mutation and sensitive read must be authorized server-side.

## Database access strategy

Use the singleton Prisma client exported from `lib/db/prisma.ts` to avoid excessive connections during development hot reloads. Database queries should be made from server components, route handlers, or server-side service modules. Do not import Prisma into client components. Transactions will be used for operations that reserve inventory, create orders, or change lifecycle state together.

Prisma remains the source of truth for users and business data. Authentication uses Auth.js with a Credentials provider and an Auth.js-managed JWT session because Credentials cannot use the database-session strategy. The JWT contains only the authenticated user id and role needed by server authorization callbacks; password hashes remain server-only in PostgreSQL.

## Business logic and validation

Route handlers coordinate transport concerns: authentication context, parsing, validation, calling a domain service, and returning a response. Domain modules under `lib` own calculations and state transitions. Zod or another deliberately selected validation library may be added in the validation phase; until then, do not duplicate ad-hoc checks across UI and API code.

Rental availability is owned by `lib/rental/date.ts` and `lib/rental/availability.ts`, with `POST /api/rentals/availability` as the server boundary. The calendar is a client input surface only; the API and future checkout operation remain authoritative.

The server recalculates all prices and availability from trusted database state. Client-supplied totals, inventory flags, and availability claims are hints at most and never authoritative.

## Rental availability and date semantics

Availability is computed from physical inventory units and their reservations/rental intervals, excluding units that are sold, unavailable, under inspection, or in refurbishment. The central technical policy is inclusive calendar dates interpreted in UTC, with same-day rentals counting as one day and a configured maximum duration. Advisory availability and checkout allocation share the same domain rules; checkout remains authoritative.

## Future pricing

Pricing lives in `lib/pricing/engine.ts` and accepts normalized product, quantity, and rental date inputs. The same result shape is used by product UI, cart, checkout, and historical snapshots. Seeded demo configuration is `PER_DAY` at ₹2,500/day; production billing, fees, deposits, and discounts remain governed by `docs/FINAL_BUSINESS_RULES.md`.

## Circular product lifecycle

The eventual lifecycle will represent a product from textile recovery through artisan production, finished inventory, delivery, customer use, collection, inspection, refurbishment/maintenance, and re-entry into rental or resale circulation. Physical inventory units and their lifecycle events should remain distinguishable from the product catalogue definition. Each transition should be auditable, authorized, and tied to the relevant order/rental where applicable.

## Authentication boundaries

The `/account/*` and `/admin/*` surfaces are protected by `proxy.ts` for navigation and by `lib/auth/server.ts` for actual server-side operations. `requireAuthenticatedUser`, `requireRole`, and `requireAdmin` are reusable from server components, route handlers, and future server actions. Client-side route hiding is not treated as authorization.

Registration always writes `UserRole.CUSTOMER`; no request field can select `ADMIN`. Passwords are bcrypt hashes and are never returned to the client. Auth.js configuration and secrets remain server-only.

## Phase 15 hardening boundary

Playwright smoke, deterministic unavailable-inventory, server authorization, axe, and keyboard-focus tests are separate from PostgreSQL integration and must use an isolated E2E database/schema. The final matrix records browser-tested scenarios separately from integration-only evidence. The prototype intentionally has no production payment gateway, live Porter delivery integration, refunds, sophisticated cancellation policy, SMS/email infrastructure, CRM, AI recommendations, advanced analytics, or external sustainability APIs.

## Phase 0 non-goals

The prototype includes customer storefront, authentication, cart, checkout, account, admin operations, return/maintenance, impact, and custom-request workflows. Production payment, delivery, notifications, OAuth, email verification, password reset, MFA, refunds, and cancellation remain future work.
