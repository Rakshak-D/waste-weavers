import { InventoryCondition, InventoryStatus, OrderStatus, Prisma, ProductStatus, RentalStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { canTransitionInventoryStatus, canTransitionOrderStatus, inventoryTransitionMessage, orderTransitionMessage } from "@/lib/admin/transitions";

export class AdminServiceError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_STATE" | "VALIDATION" | "UNSAFE_AVAILABILITY", message: string) {
    super(message);
    this.name = "AdminServiceError";
  }
}

export type AdminProductInput = {
  name: string; slug: string; shortDescription?: string; description: string; categoryId: string; purchasePrice?: string | null; purchasable: boolean; rentable: boolean; rentalPricingConfig?: { strategy?: "PER_DAY" | "PER_24_HOURS"; rate?: string; currency?: string } | null; material?: string; dimensions?: string; weight?: string | null; color?: string; status: ProductStatus; images?: { url: string; altText: string; sortOrder: number }[];
};

export type AdminFilters = { search?: string; categoryId?: string; status?: ProductStatus; page?: number; pageSize?: number };

function pageValues(filters: { page?: number; pageSize?: number }) { return { page: Math.max(1, filters.page ?? 1), pageSize: Math.min(100, Math.max(1, filters.pageSize ?? 25)) }; }

function validateSlug(slug: string): string { const normalized = slug.trim().toLowerCase(); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) throw new AdminServiceError("VALIDATION", "Slug must use lowercase letters, numbers, and hyphens."); return normalized; }

function validateProductInput(input: AdminProductInput) {
  if (!input.name.trim() || !input.description.trim() || !input.categoryId) throw new AdminServiceError("VALIDATION", "Name, description, and category are required.");
  const slug = validateSlug(input.slug);
  if (input.purchasable && (!input.purchasePrice || Number(input.purchasePrice) < 0 || !Number.isFinite(Number(input.purchasePrice)))) throw new AdminServiceError("VALIDATION", "A valid purchase price is required for purchasable products.");
  if (input.rentable && input.rentalPricingConfig && input.rentalPricingConfig.strategy && input.rentalPricingConfig.rate !== undefined && Number(input.rentalPricingConfig.rate) < 0) throw new AdminServiceError("VALIDATION", "Rental rate cannot be negative.");
  return { ...input, slug, name: input.name.trim(), description: input.description.trim() };
}

function productData(input: AdminProductInput) {
  const validated = validateProductInput(input);
  return { name: validated.name, slug: validated.slug, shortDescription: validated.shortDescription?.trim() || null, description: validated.description, categoryId: validated.categoryId, purchasePrice: validated.purchasePrice || null, purchasable: validated.purchasable, rentable: validated.rentable, rentalPricingConfig: validated.rentalPricingConfig ?? Prisma.JsonNull, material: validated.material?.trim() || null, dimensions: validated.dimensions?.trim() || null, weight: validated.weight || null, color: validated.color?.trim() || null, status: validated.status };
}

export async function getAdminOverview() {
  await requireAdmin();
  const [products, activeProducts, totalInventory, availableInventory, maintenanceInventory, activeRentals, upcomingRentals, orders, pendingOrders] = await Promise.all([
    prisma.product.count(), prisma.product.count({ where: { status: ProductStatus.ACTIVE } }), prisma.inventoryUnit.count(), prisma.inventoryUnit.count({ where: { status: InventoryStatus.AVAILABLE } }), prisma.inventoryUnit.count({ where: { status: InventoryStatus.MAINTENANCE } }), prisma.rental.count({ where: { status: { in: [RentalStatus.ACTIVE, RentalStatus.RETURN_PENDING] } } }), prisma.rental.count({ where: { status: { in: [RentalStatus.PENDING, RentalStatus.RESERVED] } } }), prisma.order.count(), prisma.order.count({ where: { status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] } } }),
  ]);
  return { products, activeProducts, totalInventory, availableInventory, maintenanceInventory, activeRentals, upcomingRentals, orders, pendingOrders };
}

export async function getAdminProducts(filters: AdminFilters = {}) {
  await requireAdmin();
  const { page, pageSize } = pageValues(filters); const search = filters.search?.trim();
  const where: Prisma.ProductWhereInput = { ...(filters.categoryId ? { categoryId: filters.categoryId } : {}), ...(filters.status ? { status: filters.status } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }] } : {}) };
  const [items, total] = await Promise.all([prisma.product.findMany({ where, include: { category: { select: { name: true } }, _count: { select: { inventoryUnits: true, orderItems: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.product.count({ where })]);
  return { items, total, page, pageSize, pages: Math.ceil(total / pageSize) };
}

export async function getAdminProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true, images: { orderBy: { sortOrder: "asc" } }, impactMetrics: true, _count: { select: { inventoryUnits: true, orderItems: true } } } });
  if (!product) throw new AdminServiceError("NOT_FOUND", "Product not found.");
  return product;
}

export async function createAdminProduct(input: AdminProductInput) {
  await requireAdmin();
  const data = productData(input);
  try { return await prisma.$transaction(async (tx) => { const product = await tx.product.create({ data }); if (input.images?.length) await tx.productImage.createMany({ data: input.images.map((image) => ({ ...image, productId: product.id })) }); return tx.product.findUniqueOrThrow({ where: { id: product.id }, include: { images: true } }); }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AdminServiceError("VALIDATION", "Product slug must be unique."); throw error; }
}

export async function updateAdminProduct(id: string, input: AdminProductInput) {
  await requireAdmin();
  const data = productData(input);
  try { return await prisma.$transaction(async (tx) => { const product = await tx.product.update({ where: { id }, data }); if (input.images) { await tx.productImage.deleteMany({ where: { productId: id } }); if (input.images.length) await tx.productImage.createMany({ data: input.images.map((image) => ({ ...image, productId: id })) }); } return product; }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AdminServiceError("VALIDATION", "Product slug must be unique."); if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AdminServiceError("NOT_FOUND", "Product not found."); throw error; }
}

export async function archiveAdminProduct(id: string) { await requireAdmin(); try { return await prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } }); } catch { throw new AdminServiceError("NOT_FOUND", "Product not found."); } }

export async function getAdminCategories() { await requireAdmin(); return prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } }); }

export async function createAdminCategory(input: { name: string; slug: string; description?: string }) { await requireAdmin(); if (!input.name.trim()) throw new AdminServiceError("VALIDATION", "Category name is required."); try { return await prisma.category.create({ data: { name: input.name.trim(), slug: validateSlug(input.slug), description: input.description?.trim() || null } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AdminServiceError("VALIDATION", "Category slug must be unique."); throw error; } }

export async function updateAdminCategory(id: string, input: { name: string; slug: string; description?: string }) { await requireAdmin(); try { return await prisma.category.update({ where: { id }, data: { name: input.name.trim(), slug: validateSlug(input.slug), description: input.description?.trim() || null } }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AdminServiceError("VALIDATION", "Category slug must be unique."); throw new AdminServiceError("NOT_FOUND", "Category not found."); } }

function inventoryPrefix(productName: string) { const initials = productName.split(/\s+/).map((part) => part[0]).join("").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 4).padEnd(3, "X"); return `WW-${initials}`; }

export async function getAdminInventory(filters: { productId?: string; status?: InventoryStatus; condition?: InventoryCondition; page?: number; pageSize?: number } = {}) { await requireAdmin(); const { page, pageSize } = pageValues(filters); const where: Prisma.InventoryUnitWhereInput = { ...(filters.productId ? { productId: filters.productId } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.condition ? { condition: filters.condition } : {}) }; const [items, total] = await Promise.all([prisma.inventoryUnit.findMany({ where, include: { product: { select: { name: true, slug: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.inventoryUnit.count({ where })]); return { items, total, page, pageSize, pages: Math.ceil(total / pageSize) }; }

export async function createAdminInventoryUnit(input: { productId: string; condition: InventoryCondition }) { await requireAdmin(); return prisma.$transaction(async (tx) => { const product = await tx.product.findUnique({ where: { id: input.productId }, select: { name: true } }); if (!product) throw new AdminServiceError("NOT_FOUND", "Product not found."); const prefix = inventoryPrefix(product.name); const count = await tx.inventoryUnit.count({ where: { inventoryCode: { startsWith: prefix } } }); let suffix = count + 1; let inventoryCode = `${prefix}-${String(suffix).padStart(3, "0")}`; while (await tx.inventoryUnit.findUnique({ where: { inventoryCode } })) { suffix += 1; inventoryCode = `${prefix}-${String(suffix).padStart(3, "0")}`; } return tx.inventoryUnit.create({ data: { productId: input.productId, inventoryCode, condition: input.condition, status: InventoryStatus.AVAILABLE } }); }); }

export async function updateAdminInventoryUnit(id: string, input: { status: InventoryStatus; condition: InventoryCondition }) { await requireAdmin(); const unit = await prisma.inventoryUnit.findUnique({ where: { id }, select: { status: true, rentalAllocations: { where: { rental: { status: { notIn: [RentalStatus.CANCELLED, RentalStatus.COMPLETED], }, endAt: { gte: new Date() } } }, select: { id: true } } } }); if (!unit) throw new AdminServiceError("NOT_FOUND", "Inventory unit not found."); if (unit.status === InventoryStatus.MAINTENANCE && input.status === InventoryStatus.AVAILABLE) throw new AdminServiceError("INVALID_STATE", "Complete the maintenance record before returning this unit to availability."); if (!canTransitionInventoryStatus(unit.status, input.status)) throw new AdminServiceError("INVALID_STATE", inventoryTransitionMessage(unit.status, input.status)); if (input.status === InventoryStatus.AVAILABLE && unit.rentalAllocations.length > 0) throw new AdminServiceError("UNSAFE_AVAILABILITY", "This unit has an active or upcoming rental allocation and cannot be marked available."); return prisma.inventoryUnit.update({ where: { id }, data: { status: input.status, condition: input.condition } }); }

export async function getAdminOrders(filters: { search?: string; type?: string; status?: OrderStatus; paymentStatus?: string; page?: number; pageSize?: number } = {}) { await requireAdmin(); const { page, pageSize } = pageValues(filters); const where: Prisma.OrderWhereInput = { ...(filters.type ? { type: filters.type as "PURCHASE" | "RENTAL" | "MIXED" } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus as "PENDING" | "PAID" | "FAILED" } : {}), ...(filters.search ? { OR: [{ orderNumber: { contains: filters.search.trim(), mode: "insensitive" } }, { customer: { email: { contains: filters.search.trim(), mode: "insensitive" } } }] } : {}) }; const [items, total] = await Promise.all([prisma.order.findMany({ where, include: { customer: { select: { name: true, email: true } }, _count: { select: { items: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.order.count({ where })]); return { items, total, page, pageSize, pages: Math.ceil(total / pageSize) }; }

export async function getAdminOrder(id: string) { await requireAdmin(); const order = await prisma.order.findUnique({ where: { id }, include: { customer: { select: { id: true, name: true, email: true, phone: true } }, items: { include: { product: { select: { name: true, slug: true } } } }, rentals: { include: { allocations: { select: { inventoryUnit: { select: { inventoryCode: true, product: { select: { name: true } } } } } } } } } }); if (!order) throw new AdminServiceError("NOT_FOUND", "Order not found."); return order; }

export async function updateAdminOrderStatus(id: string, status: OrderStatus) { await requireAdmin(); const order = await prisma.order.findUnique({ where: { id }, select: { status: true } }); if (!order) throw new AdminServiceError("NOT_FOUND", "Order not found."); if (!canTransitionOrderStatus(order.status, status)) throw new AdminServiceError("INVALID_STATE", orderTransitionMessage(order.status, status)); return prisma.order.update({ where: { id }, data: { status } }); }

export async function getAdminRentals(filters: { status?: RentalStatus; group?: "upcoming" | "active" | "completed" | "cancelled"; page?: number; pageSize?: number } = {}) { await requireAdmin(); const { page, pageSize } = pageValues(filters); const statuses = filters.group === "upcoming" ? [RentalStatus.PENDING, RentalStatus.RESERVED] : filters.group === "active" ? [RentalStatus.ACTIVE, RentalStatus.RETURN_PENDING] : filters.group === "completed" ? [RentalStatus.COMPLETED] : filters.group === "cancelled" ? [RentalStatus.CANCELLED] : undefined; const where: Prisma.RentalWhereInput = { ...(filters.status ? { status: filters.status } : statuses ? { status: { in: statuses } } : {}) }; const [items, total] = await Promise.all([prisma.rental.findMany({ where, include: { customer: { select: { name: true, email: true } }, order: { select: { orderNumber: true } }, allocations: { select: { inventoryUnit: { select: { product: { select: { name: true } } } } } } }, orderBy: { startAt: "asc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.rental.count({ where })]); return { items, total, page, pageSize, pages: Math.ceil(total / pageSize) }; }

export async function getAdminRental(id: string) { await requireAdmin(); const rental = await prisma.rental.findUnique({ where: { id }, include: { customer: { select: { name: true, email: true, phone: true } }, order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true } }, allocations: { select: { inventoryUnit: { select: { inventoryCode: true, product: { select: { name: true } } } } } }, return: { select: { status: true, condition: true, returnedAt: true, receivedAt: true } } } }); if (!rental) throw new AdminServiceError("NOT_FOUND", "Rental not found."); return rental; }
