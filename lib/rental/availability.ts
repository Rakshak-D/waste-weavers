import { InventoryStatus, Prisma, RentalStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { validateDateRange, type DateRangeInput, DEFAULT_DATE_INTERVAL_SEMANTICS } from "@/lib/rental/date";

export const ELIGIBLE_RENTAL_INVENTORY_STATUSES: InventoryStatus[] = [InventoryStatus.AVAILABLE];

export function isInventoryStatusEligible(status: InventoryStatus): boolean {
  return ELIGIBLE_RENTAL_INVENTORY_STATUSES.includes(status);
}

export type AvailabilityReason =
  | "AVAILABLE"
  | "PRODUCT_NOT_RENTABLE"
  | "NO_AVAILABLE_UNITS"
  | "INSUFFICIENT_INVENTORY";

export type AvailabilityResult = {
  productId: string;
  requestedStart: string;
  requestedEnd: string;
  durationDays: number;
  requestedQuantity: number;
  totalInventory: number;
  availableQuantity: number;
  unavailableQuantity: number;
  canRent: boolean;
  reason: AvailabilityReason;
};

export function evaluateAvailability(input: {
  productId: string;
  requestedStart: string;
  requestedEnd: string;
  durationDays: number;
  requestedQuantity: number;
  totalInventory: number;
  availableQuantity: number;
  rentable: boolean;
}): AvailabilityResult {
  if (!input.rentable) {
    return {
      productId: input.productId,
      requestedStart: input.requestedStart,
      requestedEnd: input.requestedEnd,
      durationDays: input.durationDays,
      requestedQuantity: input.requestedQuantity,
      totalInventory: input.totalInventory,
      availableQuantity: 0,
      unavailableQuantity: input.totalInventory,
      canRent: false,
      reason: "PRODUCT_NOT_RENTABLE",
    };
  }

  const unavailableQuantity = Math.max(0, input.totalInventory - input.availableQuantity);
  const canRent = input.availableQuantity >= input.requestedQuantity;
  return {
    productId: input.productId,
    requestedStart: input.requestedStart,
    requestedEnd: input.requestedEnd,
    durationDays: input.durationDays,
    requestedQuantity: input.requestedQuantity,
    totalInventory: input.totalInventory,
    availableQuantity: input.availableQuantity,
    unavailableQuantity,
    canRent,
    reason: canRent ? "AVAILABLE" : input.availableQuantity === 0 ? "NO_AVAILABLE_UNITS" : "INSUFFICIENT_INVENTORY",
  };
}

export function buildOverlappingAllocationFilter(startAt: Date, endAt: Date): Prisma.RentalAllocationWhereInput {
  return {
    rental: {
      status: { not: RentalStatus.CANCELLED },
      startAt: { lte: endAt },
      endAt: { gte: startAt },
    },
  };
}

export async function getAvailableInventoryUnits(
  productId: string,
  dateRange: DateRangeInput,
  quantity = 1,
): Promise<AvailabilityResult> {
  const normalized = validateDateRange(dateRange);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error("Quantity must be a whole number between 1 and 100.");
  }

  const startAt = new Date(`${normalized.startDate}T00:00:00.000Z`);
  const endAt = new Date(`${normalized.endDate}T23:59:59.999Z`);
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      rentable: true,
      inventoryUnits: {
        where: {
          status: { in: ELIGIBLE_RENTAL_INVENTORY_STATUSES },
          rentalAllocations: { none: buildOverlappingAllocationFilter(startAt, endAt) },
        },
        select: { id: true },
      },
    },
  });

  const totalInventory = await countTotalUnits(productId);
  return evaluateAvailability({
    productId,
    requestedStart: normalized.startDate,
    requestedEnd: normalized.endDate,
    durationDays: normalized.durationDays,
    requestedQuantity: quantity,
    totalInventory,
    availableQuantity: product?.inventoryUnits.length ?? 0,
    rentable: product?.rentable ?? false,
  });
}

async function countTotalUnits(productId: string): Promise<number> {
  return prisma.inventoryUnit.count({ where: { productId } });
}

export const rentalAvailabilityPolicy = {
  eligibleStatuses: ELIGIBLE_RENTAL_INVENTORY_STATUSES,
  dateSemantics: DEFAULT_DATE_INTERVAL_SEMANTICS,
};
