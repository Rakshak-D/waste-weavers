# Authentication and authorization

Phase 2 establishes the authentication foundation for Waste Weavers. It is suitable for the SIH prototype but is not a claim of production readiness.

## Selected approach

The project uses Auth.js (`next-auth@beta`) with the Credentials provider. Auth.js manages the login flow, encrypted/signed session cookie, and session callbacks. Credentials authentication is paired with Auth.js's JWT session strategy because Credentials is not compatible with the database-session strategy.

No OAuth providers, email verification, password reset, MFA, or production email service are configured.

## User model changes

The existing `User` model was preserved. Phase 2 adds only nullable `passwordHash`. The existing `CUSTOMER` and `ADMIN` roles remain unchanged. A nullable hash allows future non-credentials providers without making the business user model provider-specific.

## Password handling

Passwords are validated with Zod and hashed with bcryptjs using 12 rounds before persistence. Plaintext passwords are never stored, logged, returned, or included in the Auth.js session. Login compares the submitted password with the stored hash and returns the same generic invalid-credentials response for unknown users and wrong passwords.

## Registration

`POST /api/auth/register` validates name, normalized email, password strength, and confirmation. Email is trimmed and lowercased before lookup/storage. Registration always uses `UserRole.CUSTOMER`; the request cannot select an admin role. Database/uniqueness details are not exposed in the public error response.

## Session strategy

`auth.ts` exports Auth.js `auth`, `handlers`, `signIn`, and `signOut`. The JWT callback stores the authenticated user id and role; the session callback exposes only id, email, name, and role to server/client session consumers. The server derives the initial role from the database during login. Authorization-sensitive server helpers re-read the current user and role from Prisma using the session subject, so a stale role claim is not authoritative after a database-side role change.

## Route protection

- `/account/*`: unauthenticated users are redirected to `/login`.
- `/admin/*`: unauthenticated users are redirected to `/login`; authenticated non-admin users are redirected to `/account`.
- `proxy.ts` provides navigation protection.
- `lib/auth/server.ts` provides server-side enforcement for actual page/API/server-action work.

Pages use `requirePageUser` and `requirePageAdmin`. Future sensitive route handlers should use `requireAuthenticatedUser`, `requireRole`, or `requireAdmin` directly and translate authorization errors to an appropriate HTTP response.

## Local/demo login

After configuring PostgreSQL and running the Phase 1 seed:

```text
Customer: demo.customer@wasteweavers.example / DemoCustomer2026!
Admin:    demo.admin@wasteweavers.example    / DemoAdmin2026!
```

These are development/demo credentials only and must be changed or removed before any real deployment. The seed stores only their bcrypt hashes.

## Environment variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET`: long random Auth.js secret. Generate locally with `npx auth secret`.
- `AUTH_URL`: local application URL used by the prototype.

Never commit `.env` or real secrets.

## Known limitations

- The database-backed session strategy is not used because the selected Credentials provider is paired with Auth.js JWT sessions.
- There is no account linking, OAuth, email verification, password reset, MFA, rate limiting, lockout policy, or production email delivery yet.
- The registration and authentication routes require a live database at runtime.
- Integration tests requiring PostgreSQL were not run when no database was configured; the current tests are deterministic unit tests for policy, validation, and password hashing.
