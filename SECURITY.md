# Security notes

Auth.js Credentials authentication uses bcrypt password hashes and a managed JWT containing only the identity and role needed for server authorization. Registration always creates `CUSTOMER`; it cannot self-select `ADMIN`.

Navigation guards are not the security boundary. Services and route handlers enforce customer ownership and admin role checks server-side. Prisma is server-only. `DATABASE_URL`, `AUTH_SECRET`, password hashes, internal notes, and physical operational details are not serialized into customer responses. Checkout recalculates totals, validates address ownership, rechecks availability, and allocates inventory transactionally.

Copy `.env.example` to a local ignored `.env` and replace placeholders with local values. Never commit database URLs, auth secrets, payment keys, tokens, or dumps. Demo credentials are seeded development credentials and grant no external service access.

The payment adapter is development-only. There is no live Porter integration, refund service, production cancellation policy, notification infrastructure, or external sustainability provider. If a real secret is exposed, rotate it with the owning service and notify the team; do not paste it into chat or test output.

`npm audit --omit=dev` currently reports a high-severity advisory through the Prisma CLI's `@prisma/config`/`deepmerge-ts` dependency chain. Prisma 6 is the verified project toolchain; resolving this advisory requires a major Prisma upgrade and was not performed during publication cleanup. Reassess it before production use.
