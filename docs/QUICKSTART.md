# Windows PowerShell quickstart

Prerequisites: Node.js, Docker Desktop with its engine running, and Git.

```powershell
git clone <repository-url>
Set-Location .\waste-weavers
npm install
Copy-Item .env.example .env
```

Start disposable PostgreSQL:

```powershell
docker run --name waste-weavers-postgres -e POSTGRES_USER=wasteweavers -e POSTGRES_PASSWORD=replace-this-locally -e POSTGRES_DB=waste_weavers -p 5432:5432 -d postgres:16
```

Set local `.env` values (never commit this file):

```text
DATABASE_URL="postgresql://wasteweavers:replace-this-locally@localhost:5432/waste_weavers?schema=public"
AUTH_SECRET="generate-a-local-random-secret"
PAYMENT_MODE="development"
DEV_PAYMENT_OUTCOME="success"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

```powershell
npm run db:deploy
npm run db:generate
npm run db:seed
npm run db:health
npm run dev
```

Validation in another terminal:

```powershell
npm run typecheck
npm run lint
$env:RUN_DATABASE_INTEGRATION = "1"
npm test
npm run e2e
npm run build
```

Use a separate database/schema for mutating E2E tests. Stop the disposable container with `docker stop waste-weavers-postgres` when finished.
