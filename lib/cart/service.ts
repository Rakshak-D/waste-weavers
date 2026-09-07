import { OrderItemType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAvailableInventoryUnits } from "@/lib/rental/availability";
import { formatDateOnly, type DateRangeInput, validateDateRange } from "@/lib/rental/date";
import {
  calculateCartTotals,
  calculatePurchaseLine,
  calculateRentalLine,
  type CartLine,
  type CartTotals,
  type PricingProduct,
} from "@/lib/pricing/engine";

export type CartServiceErrorCode =
  | "INVALID_ITEM"
  | "PRODUCT_NOT_FOUND"
  | "CART_ITEM_NOT_FOUND"
  | "RENTAL_UNAVAILABLE"
  | "PRICING_UNAVAILABLE";

export class CartServiceError extends Error {
  constructor(public readonly code: CartServiceErrorCode, message: string) {
    super(message);
    this.name = "CartServiceError";
  }
}

export type CartItemInput = {
  productId: string;
  itemType: "PURCHASE" | "RENTAL";
  quantity: number;
  startDate?: string;
  endDate?: string;
};

export type CartViewItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  itemType: "PURCHASE" | "RENTAL";
  quantity: number;
  startDate: string | null;
  endDate: string | null;
  line: CartLine | null;
  pricingError: string | null;
  availability: "available" | "unavailable" | "not-checked";
};

export type CartView = {
  items: CartViewItem[];
  totals: CartTotals;
};

const productSelect = {
  id: true,
  name: true,
  slug: true,
  currency: true,
  purchasePrice: true,
  rentalPricingConfig: true,
  purchasable: true,
  rentable: true,
  status: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
  impactMetrics: { select: { metricType: true, value: true, unit: true, description: true } },
} satisfies Prisma.ProductSelect;

export type CartWithProducts = Prisma.CartGetPayload<{ include: { items: { include: { product: { select: typeof productSelect } } } } }>;

export function asPricingProduct(product: CartWithProducts["items"][number]["product"]): PricingProduct {
  return { ...product, purchasePrice: product.purchasePrice?.toString() ?? null };
}

function toDateRange(startAt: Date | null, endAt: Date | null): DateRangeInput | null {
  if (!startAt || !endAt) return null;
  return { startDate: formatDateOnly(startAt), endDate: formatDateOnly(endAt) };
}

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
}

export async function loadCartForUser(client: typeof prisma | Prisma.TransactionClient, userId: string): Promise<CartWithProducts> {
  return client.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { include: { product: { select: productSelect } }, orderBy: { createdAt: "asc" } } },
  });
}

export async function clearCartItemsForUser(client: typeof prisma | Prisma.TransactionClient, userId: string, itemIds: string[]): Promise<void> {
  const cart = await client.cart.findUnique({ where: { userId }, select: { id: true } });
  if (!cart || itemIds.length === 0) return;
  await client.cartItem.deleteMany({ where: { cartId: cart.id, id: { in: itemIds } } });
}

function validateItemInput(input: CartItemInput): void {
  if (!input.productId || !["PURCHASE", "RENTAL"].includes(input.itemType)) throw new CartServiceError("INVALID_ITEM", "Cart item details are invalid.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) throw new CartServiceError("INVALID_ITEM", "Quantity must be an integer between 1 and 100.");
  if (input.itemType === "RENTAL" && (!input.startDate || !input.endDate)) throw new CartServiceError("INVALID_ITEM", "Rental dates are required.");
  if (input.itemType === "PURCHASE" && (input.startDate || input.endDate)) throw new CartServiceError("INVALID_ITEM", "Purchase items cannot include rental dates.");
}

async function findProduct(productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: productSelect });
  if (!product) throw new CartServiceError("PRODUCT_NOT_FOUND", "That product is no longer available.");
  return product;
}

async function validateRentalAvailability(productId: string, dates: DateRangeInput, quantity: number): Promise<void> {
  const availability = await getAvailableInventoryUnits(productId, dates, quantity);
  if (!availability.canRent) throw new CartServiceError("RENTAL_UNAVAILABLE", "Those dates are no longer available for the requested quantity.");
}

export async function addCartItem(userId: string, input: CartItemInput): Promise<CartView> {
  validateItemInput(input);
  const product = await findProduct(input.productId);
  const pricingProduct = asPricingProduct(product);

  try {
    if (input.itemType === "PURCHASE") calculatePurchaseLine(pricingProduct, input.quantity);
    else {
      const dates = validateDateRange({ startDate: input.startDate!, endDate: input.endDate! });
      calculateRentalLine(pricingProduct, dates, input.quantity);
      await validateRentalAvailability(product.id, dates, input.quantity);
    }
  } catch (error) {
    if (error instanceof CartServiceError) throw error;
    if (error instanceof Error && "code" in error && typeof error.code === "string") throw new CartServiceError("PRICING_UNAVAILABLE", error.message);
    throw new CartServiceError("PRICING_UNAVAILABLE", "This item cannot be priced right now.");
  }

  const cart = await getOrCreateCart(userId);
  const existingItems = await prisma.cartItem.findMany({ where: { cartId: cart.id, productId: product.id, itemType: input.itemType } });
  const existing = existingItems.find((item) => input.itemType === "PURCHASE" || (item.startAt && item.endAt && formatDateOnly(item.startAt) === input.startDate && formatDateOnly(item.endAt) === input.endDate));
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(100, existing.quantity + input.quantity) } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, itemType: input.itemType === "PURCHASE" ? OrderItemType.PURCHASE : OrderItemType.RENTAL, quantity: input.quantity, startAt: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null, endAt: input.endDate ? new Date(`${input.endDate}T23:59:59.999Z`) : null } });
  }
  return getCartView(userId);
}

export async function getCartView(userId: string): Promise<CartView> {
  const cart = await loadCartForUser(prisma, userId);
  const items: CartViewItem[] = [];
  const lines: CartLine[] = [];

  for (const item of cart.items) {
    const product = asPricingProduct(item.product);
    const dates = toDateRange(item.startAt, item.endAt);
    let line: CartLine | null = null;
    let pricingError: string | null = null;
    let availability: CartViewItem["availability"] = "not-checked";
    try {
      if (item.itemType === OrderItemType.PURCHASE) line = calculatePurchaseLine(product, item.quantity);
      else if (dates) {
        line = calculateRentalLine(product, dates, item.quantity);
        const result = await getAvailableInventoryUnits(product.id, dates, item.quantity);
        availability = result.canRent ? "available" : "unavailable";
      }
      if (line) lines.push(line);
    } catch (error) {
      pricingError = error instanceof Error ? error.message : "Pricing is currently unavailable.";
    }
    items.push({ id: item.id, productId: product.id, name: item.product.name, slug: item.product.slug, imageUrl: item.product.images[0]?.url ?? null, itemType: item.itemType, quantity: item.quantity, startDate: dates?.startDate ?? null, endDate: dates?.endDate ?? null, line, pricingError, availability });
  }
  return { items, totals: calculateCartTotals(lines, items.find((item) => item.line)?.line?.currency ?? "INR") };
}

export async function updateCartItem(userId: string, itemId: string, input: Omit<CartItemInput, "productId" | "itemType">): Promise<CartView> {
  const cart = await loadCartForUser(prisma, userId);
  const item = cart.items.find((candidate) => candidate.id === itemId);
  if (!item) throw new CartServiceError("CART_ITEM_NOT_FOUND", "That cart item could not be found.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) throw new CartServiceError("INVALID_ITEM", "Quantity must be an integer between 1 and 100.");
  const product = await findProduct(item.productId);
  if (item.itemType === OrderItemType.PURCHASE) {
    try {
      calculatePurchaseLine(asPricingProduct(product), input.quantity);
    } catch {
      throw new CartServiceError("PRICING_UNAVAILABLE", "This item cannot be priced right now.");
    }
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } });
    return getCartView(userId);
  }

  const dates = input.startDate && input.endDate
    ? validateDateRange({ startDate: input.startDate, endDate: input.endDate })
    : toDateRange(item.startAt, item.endAt);
  if (!dates) throw new CartServiceError("INVALID_ITEM", "Rental dates are required.");
  try {
    calculateRentalLine(asPricingProduct(product), dates, input.quantity);
    await validateRentalAvailability(product.id, dates, input.quantity);
  } catch (error) {
    if (error instanceof CartServiceError) throw error;
    throw new CartServiceError(error instanceof Error && error.message.includes("available") ? "RENTAL_UNAVAILABLE" : "PRICING_UNAVAILABLE", error instanceof Error ? error.message : "This rental cannot be updated right now.");
  }
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity, startAt: new Date(`${dates.startDate}T00:00:00.000Z`), endAt: new Date(`${dates.endDate}T23:59:59.999Z`) } });
  return getCartView(userId);
}

export async function removeCartItem(userId: string, itemId: string): Promise<CartView> {
  const cart = await getOrCreateCart(userId);
  const deleted = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  if (deleted.count === 0) throw new CartServiceError("CART_ITEM_NOT_FOUND", "That cart item could not be found.");
  return getCartView(userId);
}

export async function clearCart(userId: string): Promise<CartView> {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCartView(userId);
}
