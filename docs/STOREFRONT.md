# Storefront and catalogue

The customer-facing catalogue is integrated with rental availability, centralized pricing, cart, prototype checkout, and transactional inventory allocation. The storefront remains a prototype surface and uses the documented development payment adapter.

## Routes

- `/` — editorial homepage with featured catalogue products, rent/buy explanation, circular lifecycle, SHG context, and explicit impact summary.
- `/shop` — server-rendered catalogue with search, category, capability, and sort filters.
- `/shop/[slug]` — active product detail page with images, specifications, purchase/rental presentation, impact records, and lifecycle context.
- `/how-it-works` — customer explanation of the circular material and rental/reuse journey.
- `/about` — Waste Weavers concept, post-consumer textiles, upcycling, SHG craftsmanship, and reusable décor.
- `/impact` — deterministic catalogue-level aggregation of stored `ImpactMetric` values grouped by metric type and unit.

## Data-fetching strategy

Catalogue reads are centralized in `lib/storefront/catalogue.ts`. Server components call `getProducts`, `getProductBySlug`, `getFeaturedProducts`, `getCategories`, and `getImpactSummary`. Prisma is never imported by client components. Product values are mapped to serializable primitives before being passed to presentation components.

All catalogue reads select active products. An inactive or missing slug reaches the product not-found experience. Database errors are caught at the page boundary and presented as a clear catalogue-unavailable state; raw errors are not shown.

## Search and filters

`/shop` uses predictable server-side Prisma filters:

- Search across product name, short description, description, material, and category name.
- Category slug filtering.
- Purchase capability filtering.
- Rental capability filtering.
- Recommended, price ascending, price descending, and newest ordering.

The query helpers are separately unit tested. No fuzzy, AI, client-only, or fake search engine is used.

## Product cards and detail pages

Cards show the primary image, category, description, purchase price where available, and rent/buy capability badges. Rental pricing is shown only when the flexible JSON configuration contains both an explicit display price and display unit; otherwise the UI says `Rental available` rather than inventing a rate.

Product details use the stored images, material/specification fields, purchase price, rental capability, and supported product-level impact metrics. Cards may show one concise textile-waste representation when present. Rental-capable products include the date-range availability checker; pricing and checkout use later-phase server services.

## Image handling

Seed image paths under `/demo` are used as-is. `ImageWithFallback` swaps a missing image for the local `public/brand-textile.svg` asset and preserves meaningful alt text. No external image service is required.

## Metadata

Static pages define route-specific title and description metadata. Product pages generate title and description from the active product record when the database is available, with a safe fallback when it is not.

## Responsive/accessibility approach

The storefront uses semantic sections, heading hierarchy, keyboard-visible focus states, native links/forms, responsive grids, mobile navigation, responsive image sizing, and reduced-motion CSS preferences. The product grid, filters, lifecycle ribbon, and detail layout adapt across mobile, tablet, and desktop widths.

## Known limitations

- A live PostgreSQL database is still required for the actual catalogue to render.
- Seeded products use the local textile asset so the demo does not depend on external image hosting.
- Availability checks are advisory until checkout; checkout revalidates and allocates inside the PostgreSQL transaction.
- The impact page sums only explicitly stored values with the same metric type and unit; it does not calculate CO2 or other unsupported conversions.
- Customer/order impact uses transaction-time metric snapshots; changing current product metrics does not rewrite historical order impact.
