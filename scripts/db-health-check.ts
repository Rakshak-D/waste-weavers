import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function main() {
  await prisma.$queryRaw`SELECT 1`;

  const [migrationTable, users, categories, products, inventoryUnits] = await Promise.all([
    prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
      ) AS exists
    `,
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.inventoryUnit.count(),
  ]);

  console.log(JSON.stringify({
    connected: true,
    migrationsTablePresent: migrationTable[0]?.exists ?? false,
    counts: { users, categories, products, inventoryUnits },
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown database health-check failure";
    console.error(`Database health check failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });