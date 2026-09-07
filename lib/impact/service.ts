import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { aggregateImpactMetrics, metricsFromSnapshot, type ImpactAggregate, type ImpactMetricRecord } from "@/lib/impact/engine";

const eligiblePaymentStatuses: PaymentStatus[] = [PaymentStatus.NOT_REQUIRED, PaymentStatus.AUTHORIZED, PaymentStatus.PAID];
const eligibleOrderStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.FULFILLING, OrderStatus.COMPLETED];

export type CustomerImpact = { metrics: ImpactAggregate[]; qualifyingOrderCount: number; representedUnits: number };

export async function getCustomerImpact(userId: string): Promise<CustomerImpact> {
  const orders = await prisma.order.findMany({
    where: { customerId: userId, status: { in: eligibleOrderStatuses }, paymentStatus: { in: eligiblePaymentStatuses } },
    select: { id: true, items: { select: { quantity: true, impactSnapshot: true } } },
  });
  const lines: { metrics: ImpactMetricRecord[]; quantity: number }[] = [];
  let representedUnits = 0;
  for (const order of orders) for (const item of order.items) {
    representedUnits += item.quantity;
    if (!item.impactSnapshot || typeof item.impactSnapshot !== "object" || Array.isArray(item.impactSnapshot)) continue;
    lines.push({ metrics: metricsFromSnapshot(item.impactSnapshot), quantity: item.quantity });
  }
  return { metrics: aggregateImpactMetrics(lines), qualifyingOrderCount: orders.length, representedUnits };
}
