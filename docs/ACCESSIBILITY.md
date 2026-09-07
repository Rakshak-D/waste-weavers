# Accessibility audit

## Method

Phase 15 uses Playwright with the injected `axe-core` 4.x browser bundle. The audit fails on serious and moderate violations; violations were reviewed rather than globally suppressed. A separate Playwright keyboard smoke test checks visible focus progression on the home page, product page, and sign-in form.

## Pages audited

- Public: home, shop, product detail, cart, checkout, and custom-order entry.
- Customer: account overview, orders, rentals, and addresses.
- Admin: dashboard, product list, product form, returns, maintenance, and custom orders.

Desktop audit result: 3/3 grouped page audits passed with zero remaining axe violations. The same 3 grouped audits also passed at the 390 × 844 mobile-sized Chromium viewport after making horizontally scrollable regions keyboard-focusable.

## Fixes made

- Increased contrast for muted brown/accent text and calendar weekday labels.
- Corrected product-card heading hierarchy.
- Added the missing actions table header in admin products.
- Added accessible labels and stable IDs for admin filter selects.
- Added browser-level visible-focus keyboard coverage.

## Accepted limitations

The audit is automated and does not prove complete WCAG conformance. Screen-reader announcements, touch-target measurement, and a full manual keyboard traversal of every admin workflow remain manual follow-up items. No axe violation was deliberately suppressed.
