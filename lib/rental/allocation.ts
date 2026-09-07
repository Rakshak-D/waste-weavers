import { InventoryStatus, Prisma, RentalStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { buildOverlappingAllocationFilter, ELIGIBLE_RENTAL_INVENTORY_STATUSES } from "@/lib/rental/availability";
import { validateDateRange } from "@/lib/rental/date";

export type AllocateRentalInput = {
  userId: string;
  productId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  orderId?: string;
};

export type AllocationFailureCode =
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_NOT_RENTABLE"
  | "INVENTORY_UNAVAILABLE"
  | "ALLOCATION_CONFLICT";

export type AllocationFailure = {
  success: false;
  code: AllocationFailureCode;
  message: string;
};

export type AllocationSuccess = {
  success: true;
  rentalId: string;
  productId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  allocationCount: number;
  status: RentalStatus;
};

export type AllocationResult = AllocationSuccess | AllocationFailure;

const allocationUnavailable: AllocationFailure = {
  success: false,
  code: "INVENTORY_UNAVAILABLE",
  message: "Those dates are no longer available. Please select another date range.",
};

/**
 * Serialize allocation decisions for one product inside the caller's
 * transaction. PostgreSQL returns void from pg_advisory_xact_lock, so this
 * must use executeRaw rather than queryRaw (which tries to deserialize rows).
 */
export async function acquireProductAllocationLock(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 0))`;
}

function validateQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error("Quantity must be a whole number between 1 and 100.");
  }
}

export async function allocateRentalWithinTransaction(
  tx: Prisma.TransactionClient,
  input: AllocateRentalInput,
  options: { testFailureAfterRental?: boolean } = {},
): Promise<AllocationResult> {
  const normalized = validateDateRange({ startDate: input.startDate, endDate: input.endDate });
  validateQuantity(input.quantity);
  // Every writer using this service serializes allocation decisions per product.
  // The lock is transaction-scoped and released automatically on commit/rollback.
  await acquireProductAllocationLock(tx, input.productId);

  const product = await tx.product.findUnique({
    where: { id: input.productId },
    select: { id: true, rentable: true },
  });
  if (!product) return { success: false, code: "PRODUCT_NOT_FOUND", message: "Product was not found." };
  if (!product.rentable) return { success: false, code: "PRODUCT_NOT_RENTABLE", message: "This product is not available for rental." };

  const startAt = new Date(`${normalized.startDate}T00:00:00.000Z`);
  const endAt = new Date(`${normalized.endDate}T23:59:59.999Z`);
  const availableUnits = await tx.inventoryUnit.findMany({
    where: {
      productId: input.productId,
      status: { in: ELIGIBLE_RENTAL_INVENTORY_STATUSES },
      rentalAllocations: { none: buildOverlappingAllocationFilter(startAt, endAt) },
    },
    select: { id: true },
    orderBy: { inventoryCode: "asc" },
    take: input.quantity,
  });

  if (availableUnits.length < input.quantity) return allocationUnavailable;

  const rental = await tx.rental.create({
    data: {
      orderId: input.orderId ?? null,
      customerId: input.userId,
      startAt,
      endAt,
      status: RentalStatus.RESERVED,
    },
  });

  if (options.testFailureAfterRental) throw new Error("Intentional allocation rollback test failure.");

  await tx.rentalAllocation.createMany({
    data: availableUnits.map((unit) => ({ rentalId: rental.id, inventoryUnitId: unit.id })),
  });

  return {
    success: true,
    rentalId: rental.id,
    productId: input.productId,
    startDate: normalized.startDate,
    endDate: normalized.endDate,
    quantity: input.quantity,
    allocationCount: availableUnits.length,
    status: rental.status,
  };
}

async function allocateOnce(input: AllocateRentalInput, testFailureAfterRental = false): Promise<AllocationResult> {
  return prisma.$transaction(
    (tx) => allocateRentalWithinTransaction(tx, input, { testFailureAfterRental }),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
}

export async function allocateRentalInventory(input: AllocateRentalInput): Promise<AllocationResult> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await allocateOnce(input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return allocationUnavailable;
      throw error;
    }
  }
  return allocationUnavailable;
}

/** @internal Used only by PostgreSQL rollback integration tests. */
export async function allocateRentalInventoryForRollbackTest(input: AllocateRentalInput): Promise<void> {
  await allocateOnce(input, true);
}

export const allocationPolicy = {
  eligibleStatuses: [InventoryStatus.AVAILABLE],
  confirmedRentalStatus: RentalStatus.RESERVED,
};
