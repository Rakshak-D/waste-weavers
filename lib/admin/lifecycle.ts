import { InventoryCondition, InventoryStatus, MaintenanceStatus, MaintenanceType, RentalStatus, ReturnCondition, ReturnStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { canTransitionInventoryStatus, canTransitionMaintenanceStatus, canTransitionRentalStatus, canTransitionReturnStatus, maintenanceTransitionMessage, rentalTransitionMessage, returnTransitionMessage } from "@/lib/admin/transitions";
import { AdminServiceError } from "@/lib/admin/service";

export type InspectionInput = {
  allocationId: string;
  condition: ReturnCondition;
  maintenanceType?: MaintenanceType | null;
  notes?: string | null;
};

function inspectionSummary(values: ReturnCondition[]): ReturnCondition {
  if (values.includes(ReturnCondition.RETIRED)) return ReturnCondition.RETIRED;
  if (values.includes(ReturnCondition.DAMAGED)) return ReturnCondition.DAMAGED;
  if (values.includes(ReturnCondition.NEEDS_MAINTENANCE)) return ReturnCondition.NEEDS_MAINTENANCE;
  if (values.includes(ReturnCondition.GOOD)) return ReturnCondition.GOOD;
  return ReturnCondition.NOT_ASSESSED;
}

function statusForCondition(condition: ReturnCondition): { status: InventoryStatus; inventoryCondition: InventoryCondition } {
  if (condition === ReturnCondition.GOOD) return { status: InventoryStatus.AVAILABLE, inventoryCondition: InventoryCondition.GOOD };
  if (condition === ReturnCondition.NEEDS_MAINTENANCE) return { status: InventoryStatus.MAINTENANCE, inventoryCondition: InventoryCondition.FAIR };
  if (condition === ReturnCondition.DAMAGED) return { status: InventoryStatus.DAMAGED, inventoryCondition: InventoryCondition.DAMAGED };
  if (condition === ReturnCondition.RETIRED) return { status: InventoryStatus.RETIRED, inventoryCondition: InventoryCondition.DAMAGED };
  throw new AdminServiceError("VALIDATION", "A return condition must be selected before inspection is saved.");
}

export async function getAdminReturns(status?: ReturnStatus) {
  await requireAdmin();
  return prisma.rentalReturn.findMany({
    where: status ? { status } : undefined,
    include: {
      rental: { include: { customer: { select: { name: true, email: true } }, order: { select: { orderNumber: true } }, allocations: { include: { inventoryUnit: { select: { inventoryCode: true, product: { select: { name: true } } } } } } } },
      inspections: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminReturnsAwaitingAction() {
  await requireAdmin();
  return prisma.rental.findMany({
    where: { status: { in: [RentalStatus.ACTIVE, RentalStatus.RETURN_PENDING] } },
    include: { customer: { select: { name: true, email: true } }, order: { select: { orderNumber: true } }, return: { select: { id: true, status: true, receivedAt: true } }, allocations: { include: { inventoryUnit: { select: { inventoryCode: true, product: { select: { name: true } } } } } } },
    orderBy: { endAt: "asc" },
  });
}

export async function getAdminReturn(id: string) {
  await requireAdmin();
  const result = await prisma.rentalReturn.findUnique({
    where: { id },
    include: {
      rental: { include: { customer: { select: { name: true, email: true, phone: true } }, order: { select: { id: true, orderNumber: true } }, allocations: { include: { inventoryUnit: { select: { id: true, inventoryCode: true, condition: true, status: true, product: { select: { name: true } } } } } } } },
      inspections: { include: { rentalAllocation: { include: { inventoryUnit: { select: { id: true, inventoryCode: true, product: { select: { name: true } } } } } } }, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!result) throw new AdminServiceError("NOT_FOUND", "Return record not found.");
  return result;
}

export async function receiveRentalReturn(rentalId: string, notes?: string | null) {
  await requireAdmin();
  return prisma.$transaction(async (tx) => {
    const rental = await tx.rental.findUnique({ where: { id: rentalId }, include: { return: true, allocations: true } });
    if (!rental) throw new AdminServiceError("NOT_FOUND", "Rental not found.");
    const receivableRentalStatuses: RentalStatus[] = [RentalStatus.ACTIVE, RentalStatus.RETURN_PENDING];
    if (!receivableRentalStatuses.includes(rental.status)) throw new AdminServiceError("INVALID_STATE", `Rental cannot be received from ${rental.status}.`);
    if (rental.return && !canTransitionReturnStatus(rental.return.status, ReturnStatus.RECEIVED)) throw new AdminServiceError("INVALID_STATE", returnTransitionMessage(rental.return.status, ReturnStatus.RECEIVED));
    if (!canTransitionRentalStatus(rental.status, RentalStatus.RETURN_PENDING)) throw new AdminServiceError("INVALID_STATE", rentalTransitionMessage(rental.status, RentalStatus.RETURN_PENDING));
    const now = new Date();
    await tx.inventoryUnit.updateMany({ where: { id: { in: rental.allocations.map((allocation) => allocation.inventoryUnitId) }, status: { in: [InventoryStatus.RENTED, InventoryStatus.AVAILABLE] } }, data: { status: InventoryStatus.INSPECTION } });
    const result = await tx.rentalReturn.upsert({ where: { rentalId }, create: { rentalId, returnedAt: now, receivedAt: now, status: ReturnStatus.RECEIVED, notes: notes?.trim() || null }, update: { returnedAt: now, receivedAt: now, status: ReturnStatus.RECEIVED, notes: notes?.trim() || rental.return?.notes || null } });
    await tx.rental.update({ where: { id: rentalId }, data: { status: RentalStatus.RETURN_PENDING, collectedAt: rental.collectedAt ?? now } });
    return result;
  });
}

export async function saveReturnInspection(returnId: string, inputs: InspectionInput[]) {
  await requireAdmin();
  if (!inputs.length) throw new AdminServiceError("VALIDATION", "At least one unit inspection is required.");
  return prisma.$transaction(async (tx) => {
    const returnRecord = await tx.rentalReturn.findUnique({ where: { id: returnId }, include: { rental: { include: { allocations: true } }, inspections: true } });
    if (!returnRecord) throw new AdminServiceError("NOT_FOUND", "Return record not found.");
    const inspectableReturnStatuses: ReturnStatus[] = [ReturnStatus.RECEIVED, ReturnStatus.INSPECTION_REQUIRED];
    if (!inspectableReturnStatuses.includes(returnRecord.status)) throw new AdminServiceError("INVALID_STATE", `Return cannot be inspected from ${returnRecord.status}.`);
    const allocationIds = new Set(returnRecord.rental.allocations.map((allocation) => allocation.id));
    if (inputs.some((input) => !allocationIds.has(input.allocationId))) throw new AdminServiceError("VALIDATION", "One or more inspected units do not belong to this rental.");
    const now = new Date();
    for (const input of inputs) {
      if (input.condition === ReturnCondition.NEEDS_MAINTENANCE && (!input.maintenanceType || input.maintenanceType === MaintenanceType.INSPECTION)) throw new AdminServiceError("VALIDATION", "Maintenance type is required for a unit needing maintenance.");
      const allocation = returnRecord.rental.allocations.find((item) => item.id === input.allocationId);
      if (!allocation) throw new AdminServiceError("VALIDATION", "Allocation not found.");
      const target = statusForCondition(input.condition);
      const unit = await tx.inventoryUnit.findUnique({ where: { id: allocation.inventoryUnitId }, select: { status: true } });
      if (!unit || !canTransitionInventoryStatus(unit.status, target.status)) throw new AdminServiceError("INVALID_STATE", `Inventory unit cannot change from ${unit?.status ?? "UNKNOWN"} to ${target.status}.`);
      if (unit.status === InventoryStatus.MAINTENANCE && target.status === InventoryStatus.AVAILABLE) throw new AdminServiceError("INVALID_STATE", "Complete the maintenance record before returning this unit to availability.");
      await tx.returnInspection.upsert({ where: { rentalAllocationId: input.allocationId }, create: { rentalReturnId: returnId, rentalAllocationId: input.allocationId, condition: input.condition, maintenanceType: input.maintenanceType ?? null, notes: input.notes?.trim() || null, inspectedAt: now }, update: { condition: input.condition, maintenanceType: input.maintenanceType ?? null, notes: input.notes?.trim() || null, inspectedAt: now } });
      await tx.inventoryUnit.update({ where: { id: allocation.inventoryUnitId }, data: { status: target.status, condition: target.inventoryCondition } });
      if (input.condition === ReturnCondition.NEEDS_MAINTENANCE) {
        const existing = await tx.maintenanceRecord.findFirst({ where: { inventoryUnitId: allocation.inventoryUnitId, type: input.maintenanceType!, status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS] } } });
        if (!existing) await tx.maintenanceRecord.create({ data: { inventoryUnitId: allocation.inventoryUnitId, type: input.maintenanceType!, status: MaintenanceStatus.PENDING, description: "Created from post-rental inspection.", notes: input.notes?.trim() || null } });
      }
    }
    const inspections = await tx.returnInspection.findMany({ where: { rentalReturnId: returnId } });
    const complete = returnRecord.rental.allocations.every((allocation) => inspections.some((inspection) => inspection.rentalAllocationId === allocation.id));
    await tx.rentalReturn.update({ where: { id: returnId }, data: { status: complete ? ReturnStatus.PROCESSED : ReturnStatus.INSPECTION_REQUIRED, condition: inspectionSummary(inspections.map((inspection) => inspection.condition)) } });
    if (complete) {
      await tx.rental.update({ where: { id: returnRecord.rentalId }, data: { status: RentalStatus.COMPLETED } });
      await tx.rentalAllocation.updateMany({ where: { rentalId: returnRecord.rentalId }, data: { releasedAt: now } });
    }
    return tx.rentalReturn.findUniqueOrThrow({ where: { id: returnId }, include: { inspections: true } });
  });
}

export async function getAdminMaintenance(status?: MaintenanceStatus) {
  await requireAdmin();
  return prisma.maintenanceRecord.findMany({ where: status ? { status } : undefined, include: { inventoryUnit: { include: { product: { select: { name: true } } } } }, orderBy: { updatedAt: "desc" } });
}

export async function createMaintenanceRecord(input: { inventoryUnitId: string; type: MaintenanceType; description?: string | null; notes?: string | null }) {
  await requireAdmin();
  return prisma.$transaction(async (tx) => {
    const unit = await tx.inventoryUnit.findUnique({ where: { id: input.inventoryUnitId } });
    if (!unit) throw new AdminServiceError("NOT_FOUND", "Inventory unit not found.");
    const blockedMaintenanceStatuses: InventoryStatus[] = [InventoryStatus.RETIRED, InventoryStatus.RENTED, InventoryStatus.RESERVED];
    if (blockedMaintenanceStatuses.includes(unit.status)) throw new AdminServiceError("INVALID_STATE", "This unit cannot enter maintenance in its current state.");
    if (unit.status !== InventoryStatus.MAINTENANCE && !canTransitionInventoryStatus(unit.status, InventoryStatus.MAINTENANCE)) throw new AdminServiceError("INVALID_STATE", "This unit cannot enter maintenance.");
    await tx.inventoryUnit.update({ where: { id: unit.id }, data: { status: InventoryStatus.MAINTENANCE } });
    return tx.maintenanceRecord.create({ data: { inventoryUnitId: unit.id, type: input.type, description: input.description?.trim() || null, notes: input.notes?.trim() || null } });
  });
}

export async function updateMaintenanceRecord(id: string, input: { status: MaintenanceStatus; condition?: InventoryCondition; notes?: string | null }) {
  await requireAdmin();
  return prisma.$transaction(async (tx) => {
    const record = await tx.maintenanceRecord.findUnique({ where: { id }, include: { inventoryUnit: true } });
    if (!record) throw new AdminServiceError("NOT_FOUND", "Maintenance record not found.");
    if (!canTransitionMaintenanceStatus(record.status, input.status)) throw new AdminServiceError("INVALID_STATE", maintenanceTransitionMessage(record.status, input.status));
    const now = new Date();
    const completed = input.status === MaintenanceStatus.COMPLETED;
    if (completed && record.inventoryUnit.status === InventoryStatus.RETIRED) throw new AdminServiceError("INVALID_STATE", "Retired units cannot re-enter circulation.");
    const nextCondition = input.condition ?? record.inventoryUnit.condition;
    const nextStatus = completed ? (nextCondition === InventoryCondition.DAMAGED ? InventoryStatus.DAMAGED : InventoryStatus.AVAILABLE) : record.inventoryUnit.status;
    if (completed && !canTransitionInventoryStatus(record.inventoryUnit.status, nextStatus)) throw new AdminServiceError("INVALID_STATE", `Inventory unit cannot change from ${record.inventoryUnit.status} to ${nextStatus}.`);
    await tx.maintenanceRecord.update({ where: { id }, data: { status: input.status, notes: input.notes?.trim() ?? record.notes, startedAt: input.status === MaintenanceStatus.IN_PROGRESS ? record.startedAt ?? now : record.startedAt, completedAt: completed ? now : record.completedAt } });
    await tx.inventoryUnit.update({ where: { id: record.inventoryUnitId }, data: { status: nextStatus, condition: nextCondition } });
    return tx.maintenanceRecord.findUniqueOrThrow({ where: { id } });
  });
}

export async function getAdminInventoryLifecycle(id: string) {
  await requireAdmin();
  const unit = await prisma.inventoryUnit.findUnique({ where: { id }, include: { product: { select: { name: true, slug: true } }, maintenanceRecords: { orderBy: { createdAt: "desc" } }, rentalAllocations: { orderBy: { allocatedAt: "desc" }, include: { rental: { select: { id: true, startAt: true, endAt: true, status: true, order: { select: { orderNumber: true } } } } } } } });
  if (!unit) throw new AdminServiceError("NOT_FOUND", "Inventory unit not found.");
  return unit;
}
