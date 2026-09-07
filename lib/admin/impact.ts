import { ProductStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { snapshotImpactMetrics, type ImpactAggregate } from "@/lib/impact/engine";
import { AdminServiceError } from "@/lib/admin/service";

export async function getAdminImpactSummary(): Promise<ImpactAggregate[]> {
  await requireAdmin();
  const metrics = await prisma.impactMetric.findMany({ where: { product: { status: ProductStatus.ACTIVE } }, select: { metricType: true, value: true, unit: true, description: true } });
  const groups = new Map<string, ImpactAggregate>();
  for (const metric of metrics) {
    const parsed = snapshotImpactMetrics([{ metricType: metric.metricType, value: metric.value.toString(), unit: metric.unit, description: metric.description }])[0];
    if (!parsed) continue;
    const key = `${parsed.metricType}::${parsed.unit}`;
    const previous = groups.get(key);
    groups.set(key, { metricType: parsed.metricType, unit: parsed.unit, value: String(Number(previous?.value ?? 0) + Number(parsed.value)), sourceCount: (previous?.sourceCount ?? 0) + 1 });
  }
  return Array.from(groups.values());
}

export type AdminImpactMetricInput = { metricType: string; value: string; unit: string; description?: string | null };

export async function replaceAdminProductImpactMetrics(productId: string, inputs: AdminImpactMetricInput[]) {
  await requireAdmin();
  let metrics;
  try { metrics = inputs.map((input) => snapshotImpactMetrics([input])[0]).filter(Boolean); } catch (error) { throw new AdminServiceError("VALIDATION", error instanceof Error ? error.message : "Impact metric is invalid."); }
  if (metrics.length !== inputs.length) throw new AdminServiceError("VALIDATION", "All impact metrics must use a supported type.");
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new AdminServiceError("NOT_FOUND", "Product not found.");
    await tx.impactMetric.deleteMany({ where: { productId } });
    if (metrics.length) await tx.impactMetric.createMany({ data: metrics.map((metric) => ({ productId, metricType: metric.metricType, value: metric.value, unit: metric.unit, description: metric.description })) });
    return tx.impactMetric.findMany({ where: { productId }, orderBy: { createdAt: "asc" } });
  });
}
