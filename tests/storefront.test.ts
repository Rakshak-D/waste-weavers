import { describe, expect, it } from "vitest";

import { buildProductOrderBy, buildProductWhere } from "../lib/storefront/catalogue";
import { formatProductPrice, getRentalLabel } from "../lib/storefront/presentation";

describe("storefront catalogue query helpers", () => {
  it("builds active category, capability, and search filters", () => {
    const where = buildProductWhere({ category: "table-decor", search: "cotton", purchaseOnly: true });
    expect(where.status).toBe("ACTIVE");
    expect(where.category).toEqual({ slug: "table-decor" });
    expect(where.purchasable).toBe(true);
    expect(where.OR).toHaveLength(5);
  });

  it("keeps an empty filter focused on active products", () => {
    expect(buildProductWhere()).toEqual({ status: "ACTIVE" });
  });

  it("maps supported sorting choices to deterministic orderings", () => {
    expect(buildProductOrderBy("price-asc")[0]).toEqual({ purchasePrice: "asc" });
    expect(buildProductOrderBy("price-desc")[0]).toEqual({ purchasePrice: "desc" });
    expect(buildProductOrderBy("newest")[0]).toEqual({ createdAt: "desc" });
  });
});

describe("storefront presentation helpers", () => {
  it("formats purchase prices and avoids inventing rental rates", () => {
    expect(formatProductPrice("18500", "INR")).toContain("18,500");
    expect(getRentalLabel({ model: "TO_BE_CONFIRMED" })).toBe("Rental available");
    expect(getRentalLabel({ displayPrice: "₹2,500", displayUnit: "24 hours" })).toBe("₹2,500 / 24 hours");
  });
});
