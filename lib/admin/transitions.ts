import type { CustomOrderStatus, InventoryStatus, MaintenanceStatus, OrderStatus, RentalStatus, ReturnStatus } from "@prisma/client";

const inventoryTransitions: Record<InventoryStatus, InventoryStatus[]> = {
  AVAILABLE: ["AVAILABLE", "MAINTENANCE", "DAMAGED", "RETIRED"],
  RESERVED: ["RESERVED"],
  RENTED: ["RENTED"],
  RETURN_PENDING: ["RETURN_PENDING"],
  INSPECTION: ["INSPECTION", "MAINTENANCE", "AVAILABLE"],
  MAINTENANCE: ["MAINTENANCE", "AVAILABLE", "DAMAGED", "RETIRED"],
  DAMAGED: ["DAMAGED", "MAINTENANCE", "RETIRED"],
  RETIRED: ["RETIRED"],
};

const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["DRAFT", "PENDING"],
  PENDING: ["PENDING", "CONFIRMED"],
  CONFIRMED: ["CONFIRMED", "FULFILLING"],
  FULFILLING: ["FULFILLING", "COMPLETED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

const returnTransitions: Record<ReturnStatus, ReturnStatus[]> = {
  EXPECTED: ["EXPECTED", "RECEIVED", "CANCELLED"],
  RECEIVED: ["RECEIVED", "INSPECTION_REQUIRED", "CANCELLED"],
  INSPECTION_REQUIRED: ["INSPECTION_REQUIRED", "PROCESSED"],
  PROCESSED: ["PROCESSED"],
  CANCELLED: ["CANCELLED"],
};

const maintenanceTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  PENDING: ["PENDING", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

const rentalTransitions: Record<RentalStatus, RentalStatus[]> = {
  PENDING: ["PENDING", "RESERVED", "ACTIVE", "CANCELLED"],
  RESERVED: ["RESERVED", "ACTIVE", "RETURN_PENDING", "CANCELLED"],
  ACTIVE: ["ACTIVE", "RETURN_PENDING"],
  RETURN_PENDING: ["RETURN_PENDING", "COMPLETED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

const customOrderTransitions: Record<CustomOrderStatus, CustomOrderStatus[]> = {
  REQUESTED: ["REQUESTED", "UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["UNDER_REVIEW", "QUOTED", "APPROVED", "CANCELLED"],
  QUOTED: ["QUOTED", "APPROVED", "CANCELLED"],
  APPROVED: ["APPROVED", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

export function canTransitionInventoryStatus(from: InventoryStatus, to: InventoryStatus): boolean {
  return inventoryTransitions[from].includes(to);
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return orderTransitions[from].includes(to);
}

export function canTransitionReturnStatus(from: ReturnStatus, to: ReturnStatus): boolean {
  return returnTransitions[from].includes(to);
}

export function canTransitionMaintenanceStatus(from: MaintenanceStatus, to: MaintenanceStatus): boolean {
  return maintenanceTransitions[from].includes(to);
}

export function canTransitionRentalStatus(from: RentalStatus, to: RentalStatus): boolean {
  return rentalTransitions[from].includes(to);
}

export function canTransitionCustomOrderStatus(from: CustomOrderStatus, to: CustomOrderStatus): boolean {
  return customOrderTransitions[from].includes(to);
}

export function inventoryTransitionMessage(from: InventoryStatus, to: InventoryStatus): string {
  return `Inventory status cannot change from ${from} to ${to}.`;
}

export function orderTransitionMessage(from: OrderStatus, to: OrderStatus): string {
  return `Order status cannot change from ${from} to ${to}.`;
}

export function returnTransitionMessage(from: ReturnStatus, to: ReturnStatus): string {
  return `Return status cannot change from ${from} to ${to}.`;
}

export function maintenanceTransitionMessage(from: MaintenanceStatus, to: MaintenanceStatus): string {
  return `Maintenance status cannot change from ${from} to ${to}.`;
}

export function rentalTransitionMessage(from: RentalStatus, to: RentalStatus): string {
  return `Rental status cannot change from ${from} to ${to}.`;
}

export function customOrderTransitionMessage(from: CustomOrderStatus, to: CustomOrderStatus): string {
  return `Custom request status cannot change from ${from} to ${to}.`;
}
