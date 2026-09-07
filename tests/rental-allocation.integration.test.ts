import { PrismaClient, InventoryStatus, RentalStatus } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { acquireProductAllocationLock, allocateRentalInventory, allocateRentalInventoryForRollbackTest } from "../lib/rental/allocation";

const integrationEnabled = process.env.RUN_DATABASE_INTEGRATION === "1" && Boolean(process.env.DATABASE_URL);
const integration = integrationEnabled ? describe : describe.skip;
const prisma = new PrismaClient();

let productId = "";
let categoryId = "";
let customerId = "";
let inventoryIds: string[] = [];

async function resetFixture() {
  await prisma.rentalAllocation.deleteMany({ where: { inventoryUnitId: { in: inventoryIds } } });
  await prisma.rental.deleteMany({ where: { customerId } });
  await prisma.inventoryUnit.updateMany({ where: { id: { in: inventoryIds } }, data: { status: InventoryStatus.AVAILABLE } });
}

async function createExistingRental(options: { startAt: string; endAt: string; unitCount: number; status?: RentalStatus }) {
  const rental = await prisma.rental.create({
    data: {
      customerId,
      startAt: new Date(`${options.startAt}T00:00:00.000Z`),
      endAt: new Date(`${options.endAt}T23:59:59.999Z`),
      status: options.status ?? RentalStatus.RESERVED,
    },
  });
  await prisma.rentalAllocation.createMany({
    data: inventoryIds.slice(0, options.unitCount).map((inventoryUnitId) => ({ rentalId: rental.id, inventoryUnitId })),
  });
  return rental;
}

integration("PostgreSQL rental allocation integration", () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const category = await prisma.category.create({ data: { name: "Integration Category", slug: `integration-${Date.now()}` } });
    categoryId = category.id;
    const customer = await prisma.user.create({ data: { email: `integration-${Date.now()}@example.com`, role: "CUSTOMER" } });
    customerId = customer.id;
    const product = await prisma.product.create({
      data: {
        name: "Integration Backdrop",
        slug: `integration-backdrop-${Date.now()}`,
        description: "Dedicated integration fixture.",
        rentable: true,
        categoryId,
        status: "ACTIVE",
      },
    });
    productId = product.id;
    const units = await prisma.inventoryUnit.createManyAndReturn({
      data: Array.from({ length: 5 }, (_, index) => ({ productId, inventoryCode: `IT-${Date.now()}-${index}`, status: InventoryStatus.AVAILABLE })),
      select: { id: true },
    });
    inventoryIds = units.map((unit) => unit.id);
  });

  beforeEach(resetFixture);

  afterEach(resetFixture);

  afterAll(async () => {
    await prisma.rentalAllocation.deleteMany({ where: { inventoryUnitId: { in: inventoryIds } } });
    await prisma.rental.deleteMany({ where: { customerId } });
    await prisma.inventoryUnit.deleteMany({ where: { id: { in: inventoryIds } } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.user.delete({ where: { id: customerId } });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it("allocates two of five units", async () => {
    const result = await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-12", endDate: "2030-10-15", quantity: 2 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.allocationCount).toBe(2);
  });

  it("allocates the remaining three units when two overlap", async () => {
    await createExistingRental({ startAt: "2030-10-12", endAt: "2030-10-15", unitCount: 2 });
    const result = await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-12", endDate: "2030-10-15", quantity: 3 });
    expect(result.success).toBe(true);
  });

  it("fails without creating a rental when quantity exceeds availability", async () => {
    await createExistingRental({ startAt: "2030-10-12", endAt: "2030-10-15", unitCount: 3 });
    const result = await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-12", endDate: "2030-10-15", quantity: 3 });
    expect(result).toMatchObject({ success: false, code: "INVENTORY_UNAVAILABLE" });
    expect(await prisma.rental.count({ where: { customerId } })).toBe(1);
  });

  it("allows ranges before or after an existing allocation", async () => {
    await createExistingRental({ startAt: "2030-10-10", endAt: "2030-10-15", unitCount: 1 });
    expect((await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-01", endDate: "2030-10-09", quantity: 1 })).success).toBe(true);
    expect((await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-16", endDate: "2030-10-18", quantity: 1 })).success).toBe(true);
  });

  it("blocks overlap at either boundary", async () => {
    await createExistingRental({ startAt: "2030-10-10", endAt: "2030-10-15", unitCount: 5 });
    expect((await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-09", endDate: "2030-10-10", quantity: 1 })).success).toBe(false);
  });

  it("does not let a cancelled rental block inventory", async () => {
    await createExistingRental({ startAt: "2030-10-12", endAt: "2030-10-15", unitCount: 5, status: RentalStatus.CANCELLED });
    expect((await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-12", endDate: "2030-10-15", quantity: 5 })).success).toBe(true);
  });

  it("excludes maintenance, damaged, and retired units", async () => {
    await prisma.inventoryUnit.update({ where: { id: inventoryIds[0] }, data: { status: InventoryStatus.MAINTENANCE } });
    await prisma.inventoryUnit.update({ where: { id: inventoryIds[1] }, data: { status: InventoryStatus.DAMAGED } });
    await prisma.inventoryUnit.update({ where: { id: inventoryIds[2] }, data: { status: InventoryStatus.RETIRED } });
    const result = await allocateRentalInventory({ userId: customerId, productId, startDate: "2030-10-12", endDate: "2030-10-15", quantity: 3 });
    expect(result).toMatchObject({ success: false, code: "INVENTORY_UNAVAILABLE" });
  });

  it("allows only one winner when two transactions compete for two units", async () => {
    const competingUnits = inventoryIds.slice(0, 2);
    await prisma.inventoryUnit.updateMany({ where: { id: { in: inventoryIds.slice(2) } }, data: { status: InventoryStatus.MAINTENANCE } });
    const results = await Promise.all([
      allocateRentalInventory({ userId: customerId, productId, startDate: "2030-11-01", endDate: "2030-11-03", quantity: 2 }),
      allocateRentalInventory({ userId: customerId, productId, startDate: "2030-11-01", endDate: "2030-11-03", quantity: 2 }),
    ]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(results.filter((result) => !result.success)).toHaveLength(1);
    expect(competingUnits).toHaveLength(2);
  });

  it("rolls back a rental created before a forced allocation failure", async () => {
    await expect(allocateRentalInventoryForRollbackTest({ userId: customerId, productId, startDate: "2030-12-01", endDate: "2030-12-03", quantity: 1 })).rejects.toThrow("rollback");
    expect(await prisma.rental.count({ where: { customerId } })).toBe(0);
    expect(await prisma.rentalAllocation.count({ where: { inventoryUnitId: { in: inventoryIds } } })).toBe(0);
  });

  it("uses a transaction-scoped PostgreSQL advisory lock", async () => {
    const lockKey = `lock-test-${Date.now()}-${Math.random()}`;
    const clientA = new PrismaClient();
    const clientB = new PrismaClient();
    let signalAReady!: () => void;
    let signalRelease!: () => void;
    let signalBChecked!: () => void;
    const aReady = new Promise<void>((resolve) => { signalAReady = resolve; });
    const releaseA = new Promise<void>((resolve) => { signalRelease = resolve; });
    const bChecked = new Promise<void>((resolve) => { signalBChecked = resolve; });

    try {
      const transactionA = clientA.$transaction(async (tx) => {
        await acquireProductAllocationLock(tx, lockKey);
        signalAReady();
        await releaseA;
      });
      await aReady;

      let lockAvailableWhileAOpen = true;
      const transactionBCheck = clientB.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<Array<{ locked: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${lockKey}, 0)) AS locked`;
        lockAvailableWhileAOpen = rows[0]?.locked ?? false;
        signalBChecked();
      });
      await bChecked;
      expect(lockAvailableWhileAOpen).toBe(false);
      await transactionBCheck;

      signalRelease();
      await transactionA;
      await expect(clientB.$transaction((tx) => acquireProductAllocationLock(tx, lockKey))).resolves.toBeUndefined();
    } finally {
      signalRelease();
      await Promise.allSettled([clientA.$disconnect(), clientB.$disconnect()]);
    }
  });
});
