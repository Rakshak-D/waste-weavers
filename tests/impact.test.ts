import { describe, expect, it } from "vitest";
import { aggregateImpactMetrics, metricsFromSnapshot, snapshotImpactMetrics, validateImpactMetric } from "@/lib/impact/engine";

describe("impact metrics", () => {
  it("validates supported metrics and rejects unsupported or malformed values", () => {
    expect(validateImpactMetric({ metricType: "TEXTILE_WASTE_DIVERTED", value: "2", unit: "kg" }).value).toBe("2");
    expect(() => validateImpactMetric({ metricType: "CO2_REDUCED", value: "2", unit: "kg" })).toThrow();
    expect(() => validateImpactMetric({ metricType: "TEXTILE_WASTE_DIVERTED", value: "nope", unit: "kg" })).toThrow();
  });

  it("multiplies explicit textile representation by quantity and preserves units", () => {
    const result = aggregateImpactMetrics([{ quantity: 3, metrics: [{ metricType: "TEXTILE_WASTE_DIVERTED", value: "2", unit: "kg" }] }, { quantity: 1, metrics: [{ metricType: "TEXTILE_WASTE_DIVERTED", value: "1.5", unit: "kg" }] }]);
    expect(result).toEqual([{ metricType: "TEXTILE_WASTE_DIVERTED", value: "7.5", unit: "kg", sourceCount: 2 }]);
  });

  it("keeps incompatible units separate and does not claim target cycles as achieved impact", () => {
    const result = aggregateImpactMetrics([{ quantity: 1, metrics: [{ metricType: "TEXTILE_WASTE_DIVERTED", value: "2", unit: "kg" }, { metricType: "TEXTILE_WASTE_DIVERTED", value: "500", unit: "g" }, { metricType: "REUSE_CYCLES_TARGET", value: "40", unit: "cycles" }] }]);
    expect(result).toHaveLength(2);
    expect(result.map((item) => item.unit)).toEqual(["kg", "g"]);
  });

  it("reads only structured snapshots", () => {
    expect(metricsFromSnapshot({ metrics: snapshotImpactMetrics([{ metricType: "TEXTILE_WASTE_DIVERTED", value: "2.5", unit: "kg" }]) })).toHaveLength(1);
    expect(metricsFromSnapshot({ nope: true })).toEqual([]);
  });
});
