import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { rentalGroup } from "@/lib/account/presentation";

const orderListSelect = {
  id: true,
  orderNumber: true,
  type: true,
  status: true,
  paymentStatus: true,
  currency: true,
  grandTotal: true,
  createdAt: true,
  _count: { select: { items: true } },
  rentals: { select: { startAt: true, endAt: true, status: true } },
} satisfies Prisma.OrderSelect;

export type CustomerOrderListItem = Prisma.OrderGetPayload<{ select: typeof orderListSelect }>;

export async function getCustomerOrders(userId: string, limit = 50): Promise<CustomerOrderListItem[]> {
  return prisma.order.findMany({ where: { customerId: userId }, select: orderListSelect, orderBy: { createdAt: "desc" }, take: limit });
}

export async function getCustomerRentals(userId: string, limit = 50) {
  const rentals = await prisma.rental.findMany({
    where: { customerId: userId },
    orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true, orderId: true, startAt: true, endAt: true, status: true, currency: true, pricingSnapshot: true, deliveredAt: true, collectedAt: true, createdAt: true,
      order: { select: { orderNumber: true } },
      allocations: { select: { inventoryUnit: { select: { product: { select: { name: true, slug: true } } } } } },
    },
  });
  return rentals.map((rental) => ({ ...rental, group: rentalGroup(rental.status), products: Array.from(new Map(rental.allocations.map((allocation) => [allocation.inventoryUnit.product.slug, allocation.inventoryUnit.product])).values()) }));
}

export async function getCustomerRental(userId: string, rentalId: string) {
  const rental = await prisma.rental.findFirst({
    where: { id: rentalId, customerId: userId },
    select: {
      id: true, orderId: true, startAt: true, endAt: true, status: true, currency: true, pricingSnapshot: true, deliveryScheduledAt: true, deliveredAt: true, collectionScheduledAt: true, collectedAt: true, createdAt: true, updatedAt: true,
      order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true, createdAt: true } },
      allocations: { select: { inventoryUnit: { select: { product: { select: { name: true, slug: true } } } } } },
      return: { select: { status: true, condition: true, returnedAt: true, receivedAt: true, notes: true, inspections: { select: { condition: true, inspectedAt: true, maintenanceType: true } } } },
    },
  });
  if (!rental) return null;
  return { ...rental, products: Array.from(new Map(rental.allocations.map((allocation) => [allocation.inventoryUnit.product.slug, allocation.inventoryUnit.product])).values()) };
}

export async function getCustomerAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
}

export async function getCustomerProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, phone: true, role: true } });
}

export async function updateCustomerProfile(userId: string, input: { name: string; phone?: string }) {
  return prisma.user.update({ where: { id: userId }, data: { name: input.name.trim(), phone: input.phone?.trim() || null }, select: { id: true, name: true, email: true, phone: true, role: true } });
}

export const accountQueryPolicy = { defaultLimit: 50, rentalGroups: ["upcoming", "active", "completed", "cancelled"] as const };
