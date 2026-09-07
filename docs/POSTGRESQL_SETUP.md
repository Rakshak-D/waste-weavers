# PostgreSQL setup

Waste Weavers uses PostgreSQL through Prisma. SQLite is not a supported substitute.

## Local development

Install PostgreSQL locally or start a dedicated local PostgreSQL container. Create an empty development database, for example `waste_weavers`, and keep the username/password outside the repository.

Copy `.env.example` to `.env.local` and set only local values:

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/waste_weavers?schema=public"
```

On PowerShell, a session-only alternative is:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/waste_weavers?schema=public"
```

Do not commit `.env.local`, real credentials, or database dumps.

## Migrations and seed

For a dedicated development database, apply the versioned migrations and generate the client:

```powershell
npx prisma migrate dev
npx prisma generate
npm run db:seed
npm run db:health
```

For a deployment-like environment where migrations already exist, use `npm run db:deploy` instead of `migrate dev`. Never use `prisma migrate reset` against a database that may contain real data. A reset is only appropriate for an explicitly disposable local test database after verifying its target.

## Integration tests

The database integration suites are opt-in:

```powershell
$env:RUN_DATABASE_INTEGRATION = "1"
npm test
```

They require both `RUN_DATABASE_INTEGRATION=1` and a reachable `DATABASE_URL`. Use a dedicated test database or isolated PostgreSQL schema; do not point tests at production data.

## Current verification status`r`n`r`nThe project has been verified against PostgreSQL 16.13 with four migrations applied, seeded data available, database health passing, and the PostgreSQL integration/concurrency/rollback suites passing. A fresh developer machine still needs its own PostgreSQL instance and local environment values.`r`n
