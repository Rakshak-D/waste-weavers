import { Prisma, ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type CatalogueSort = "featured" | "price-asc" | "price-desc" | "newest";

export type CatalogueFilters = {
  category?: string;
  search?: string;
  purchaseOnly?: boolean;
  rentalOnly?: boolean;
  sort?: CatalogueSort;
};

export type CatalogueProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  purchasePrice: string | null;
  currency: string;
  rentalPricingConfig: Prisma.JsonValue | null;
  rentable: boolean;
  purchasable: boolean;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  color: string | null;
  category: { name: string; slug: string };
  images: { id: string; url: string; altText: string; sortOrder: number }[];
  impactMetrics: { id: string; metricType: string; value: string; unit: string; description: string | null }[];
};

const productInclude = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  impactMetrics: true,
} satisfies Prisma.ProductInclude;

export function buildProductWhere(filters: CatalogueFilters = {}): Prisma.ProductWhereInput {
  const search = filters.search?.trim();
  const where: Prisma.ProductWhereInput = { status: ProductStatus.ACTIVE };

  if (filters.category) where.category = { slug: filters.category };
  if (filters.purchaseOnly) where.purchasable = true;
  if (filters.rentalOnly) where.rentable = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { material: { contains: search, mode: "insensitive" } },
      { category: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export function buildProductOrderBy(sort: CatalogueSort = "featured"): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ purchasePrice: "asc" }, { createdAt: "desc" }];
    case "price-desc":
      return [{ purchasePrice: "desc" }, { createdAt: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "featured":
    default:
      return [{ status: "asc" }, { createdAt: "desc" }];
  }
}

function mapProduct(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>): CatalogueProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    purchasePrice: product.purchasePrice?.toString() ?? null,
    currency: product.currency,
    rentalPricingConfig: product.rentalPricingConfig,
    rentable: product.rentable,
    purchasable: product.purchasable,
    material: product.material,
    dimensions: product.dimensions,
    weight: product.weight?.toString() ?? null,
    color: product.color,
    category: product.category,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
    })),
    impactMetrics: product.impactMetrics.map((metric) => ({
      id: metric.id,
      metricType: metric.metricType,
      value: metric.value.toString(),
      unit: metric.unit,
      description: metric.description,
    })),
  };
}

export async function getProducts(filters: CatalogueFilters = {}): Promise<CatalogueProduct[]> {
  const products = await prisma.product.findMany({
    where: buildProductWhere(filters),
    include: productInclude,
    orderBy: buildProductOrderBy(filters.sort),
  });
  return products.map(mapProduct);
}

export async function getFeaturedProducts(limit = 4): Promise<CatalogueProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    include: productInclude,
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
  return products.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<CatalogueProduct | null> {
  const product = await prisma.product.findFirst({
    where: { slug, status: ProductStatus.ACTIVE },
    include: productInclude,
  });
  return product ? mapProduct(product) : null;
}

export async function getCategories(): Promise<{ name: string; slug: string }[]> {
  return prisma.category.findMany({
    where: { products: { some: { status: ProductStatus.ACTIVE } } },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export type ImpactSummary = {
  metricType: string;
  unit: string;
  total: string;
  productCount: number;
};

export async function getImpactSummary(): Promise<ImpactSummary[]> {
  const metrics = await prisma.impactMetric.findMany({
    where: { product: { status: ProductStatus.ACTIVE } },
    select: { metricType: true, value: true, unit: true, productId: true },
  });
  const groups = new Map<string, { total: number; products: Set<string> }>();

  for (const metric of metrics) {
    const key = `${metric.metricType}::${metric.unit}`;
    const group = groups.get(key) ?? { total: 0, products: new Set<string>() };
    group.total += Number(metric.value);
    group.products.add(metric.productId);
    groups.set(key, group);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const [metricType, unit] = key.split("::");
    return { metricType, unit, total: String(group.total), productCount: group.products.size };
  });
}
