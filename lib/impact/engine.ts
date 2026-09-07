export const SUPPORTED_IMPACT_TYPES = ["TEXTILE_WASTE_DIVERTED", "REUSE_CYCLES_TARGET"] as const;
export type SupportedImpactType = (typeof SUPPORTED_IMPACT_TYPES)[number];

export type ImpactMetricRecord = { metricType: string; value: string | number; unit: string; description?: string | null };
export type ImpactMetricSnapshot = { metricType: SupportedImpactType; value: string; unit: string; description: string | null };
export type ImpactAggregate = { metricType: SupportedImpactType; value: string; unit: string; sourceCount: number };

const supported = new Set<string>(SUPPORTED_IMPACT_TYPES);

export function isSupportedImpactType(metricType: string): metricType is SupportedImpactType { return supported.has(metricType); }

export function validateImpactMetric(input: ImpactMetricRecord): ImpactMetricSnapshot {
  if (!isSupportedImpactType(input.metricType)) throw new Error("This impact metric type is not supported.");
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) throw new Error("Impact value must be a non-negative number.");
  const unit = input.unit.trim();
  if (!unit || unit.length > 32) throw new Error("Impact unit is required and must be concise.");
  return { metricType: input.metricType, value: String(value), unit, description: input.description?.trim() || null };
}

export function snapshotImpactMetrics(metrics: ImpactMetricRecord[]): ImpactMetricSnapshot[] {
  return metrics.filter((metric) => isSupportedImpactType(metric.metricType)).map(validateImpactMetric);
}

export function metricsFromSnapshot(snapshot: unknown): ImpactMetricRecord[] {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return [];
  const metrics = (snapshot as { metrics?: unknown }).metrics;
  if (!Array.isArray(metrics)) return [];
  return metrics.filter((metric): metric is Record<string, unknown> => typeof metric === "object" && metric !== null && !Array.isArray(metric)).map((metric) => ({ metricType: String(metric.metricType ?? ""), value: String(metric.value ?? ""), unit: String(metric.unit ?? ""), description: typeof metric.description === "string" ? metric.description : null }));
}

export function aggregateImpactMetrics(lines: { metrics: ImpactMetricRecord[]; quantity: number }[]): ImpactAggregate[] {
  const groups = new Map<string, { metricType: SupportedImpactType; unit: string; value: number; sourceCount: number }>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) continue;
    for (const metric of snapshotImpactMetrics(line.metrics)) {
      // Waste diverted is explicitly represented per catalogue unit. Reuse-cycle targets are not customer-achieved results.
      if (metric.metricType !== "TEXTILE_WASTE_DIVERTED") continue;
      const key = `${metric.metricType}::${metric.unit}`;
      const group = groups.get(key) ?? { metricType: metric.metricType, unit: metric.unit, value: 0, sourceCount: 0 };
      group.value += Number(metric.value) * line.quantity;
      group.sourceCount += 1;
      groups.set(key, group);
    }
  }
  return Array.from(groups.values()).map((group) => ({ ...group, value: String(Number(group.value.toFixed(3))) }));
}

export function formatImpactType(metricType: string): string {
  return metricType.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
