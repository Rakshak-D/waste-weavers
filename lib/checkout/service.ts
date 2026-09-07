import { OrderItemType, OrderStatus, OrderType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { loadCartForUser, asPricingProduct, type CartWithProducts } from "@/lib/cart/service";
import { calculateCartTotals, calculatePurchaseLine, calculateRentalLine, type CartLine, type CartTotals, type PricingProduct } from "@/lib/pricing/engine";
import { allocateRentalWithinTransaction, type AllocationFailure } from "@/lib/rental/allocation";
import { formatDateOnly, type DateRangeInput } from "@/lib/rental/date";
import { getAvailableInventoryUnits } from "@/lib/rental/availability";
import { getPaymentService, type PaymentResult } from "@/lib/payment/service";
import { snapshotImpactMetrics, type ImpactMetricRecord } from "@/lib/impact/engine";

export type AddressInput = {
  addressId?: string;
  newAddress?: {
    label?: string;
    recipientName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    phone?: string;
  };
};

export type CheckoutSummaryItem = {
  cartItemId: string;
  productId: string;
  name: string;
  itemType: OrderItemType;
  quantity: number;
  startDate: string | null;
  endDate: string | null;
  line: CartLine | null;
  issue: string | null;
  availability: "available" | "unavailable" | "not-applicable";
};

export type CheckoutSummary = {
  items: CheckoutSummaryItem[];
  totals: CartTotals;
  addresses: { id: string; label: string | null; recipientName: string | null; line1: string; city: string; state: string; postalCode: string; country: string; phone: string | null }[];
  canPlaceOrder: boolean;
  issues: string[];
};

export type CheckoutErrorCode =
  | "EMPTY_CART"
  | "INVALID_CHECKOUT"
  | "PRODUCT_CHANGED"
  | "INVALID_ADDRESS"
  | "INVENTORY_UNAVAILABLE"
  | "PAYMENT_FAILED"
  | "CHECKOUT_CONFLICT";

export class CheckoutError extends Error {
  constructor(public readonly code: CheckoutErrorCode, message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

type PreparedLine = {
  cartItemId: string;
  productId: string;
  itemType: OrderItemType;
  quantity: number;
  dates: DateRangeInput | null;
  line: CartLine;
  impactMetrics: ImpactMetricRecord[];
};

function productForPricing(product: CartWithProducts["items"][number]["product"]): PricingProduct {
  return asPricingProduct(product);
}

function datesForItem(startAt: Date | null, endAt: Date | null): DateRangeInput | null {
  if (!startAt || !endAt) return null;
  return { startDate: formatDateOnly(startAt), endDate: formatDateOnly(endAt) };
}

function prepareLines(cart: CartWithProducts): { lines: PreparedLine[]; issues: string[] } {
  const lines: PreparedLine[] = [];
  const issues: string[] = [];
  for (const item of cart.items) {
    const product = productForPricing(item.product);
    try {
      if (item.product.status !== "ACTIVE") throw new CheckoutError("PRODUCT_CHANGED", `${item.product.name} is no longer available.`);
      if (item.itemType === OrderItemType.PURCHASE) {
        lines.push({ cartItemId: item.id, productId: product.id, itemType: item.itemType, quantity: item.quantity, dates: null, line: calculatePurchaseLine(product, item.quantity), impactMetrics: item.product.impactMetrics.map((metric) => ({ metricType: metric.metricType, value: metric.value.toString(), unit: metric.unit, description: metric.description })) });
      } else {
        const dates = datesForItem(item.startAt, item.endAt);
        if (!dates) throw new CheckoutError("INVALID_CHECKOUT", `${item.product.name} is missing rental dates.`);
        lines.push({ cartItemId: item.id, productId: product.id, itemType: item.itemType, quantity: item.quantity, dates, line: calculateRentalLine(product, dates, item.quantity), impactMetrics: item.product.impactMetrics.map((metric) => ({ metricType: metric.metricType, value: metric.value.toString(), unit: metric.unit, description: metric.description })) });
      }
    } catch (error) {
      issues.push(error instanceof Error ? error.message : `Could not validate ${item.product.name}.`);
    }
  }
  return { lines, issues };
}

function orderType(lines: PreparedLine[]): OrderType {
  const hasPurchase = lines.some((line) => line.itemType === OrderItemType.PURCHASE);
  const hasRental = lines.some((line) => line.itemType === OrderItemType.RENTAL);
  return hasPurchase && hasRental ? OrderType.MIXED : hasRental ? OrderType.RENTAL : OrderType.PURCHASE;
}

function addressSnapshot(address: { label?: string | null; recipientName: string | null; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country: string; phone?: string | null }) {
  return { label: address.label ?? null, recipientName: address.recipientName, line1: address.line1, line2: address.line2 ?? null, city: address.city, state: address.state, postalCode: address.postalCode, country: address.country, phone: address.phone ?? null } satisfies Prisma.InputJsonValue;
}

function validateNewAddress(address: NonNullable<AddressInput["newAddress"]>) {
  const values = [address.recipientName, address.line1, address.city, address.state, address.postalCode, address.country ?? "IN"];
  if (values.some((value) => !value.trim()) || address.postalCode.trim().length < 3) throw new CheckoutError("INVALID_ADDRESS", "Please provide a complete delivery address.");
  return { ...address, country: address.country ?? "IN" };
}

async function selectAddress(client: typeof prisma | Prisma.TransactionClient, userId: string, input: AddressInput) {
  if (input.addressId && input.newAddress) throw new CheckoutError("INVALID_ADDRESS", "Choose an existing address or provide a new one, not both.");
  if (input.addressId) {
    const address = await client.address.findFirst({ where: { id: input.addressId, userId } });
    if (!address) throw new CheckoutError("INVALID_ADDRESS", "That delivery address could not be found.");
    return addressSnapshot(address);
  }
  if (!input.newAddress) throw new CheckoutError("INVALID_ADDRESS", "A delivery address is required.");
  const address = validateNewAddress(input.newAddress);
  return addressSnapshot(address);
}

export async function getCheckoutSummary(userId: string): Promise<CheckoutSummary> {
  const [cart, addresses] = await Promise.all([
    loadCartForUser(prisma, userId),
    prisma.address.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, select: { id: true, label: true, recipientName: true, line1: true, city: true, state: true, postalCode: true, country: true, phone: true } }),
  ]);
  const prepared = prepareLines(cart);
  const items: CheckoutSummaryItem[] = [];
  const availableLines: CartLine[] = [];
  const issues = [...prepared.issues];

  for (const item of cart.items) {
    const preparedLine = prepared.lines.find((line) => line.cartItemId === item.id);
    let availability: CheckoutSummaryItem["availability"] = "not-applicable";
    let issue: string | null = preparedLine ? null : "This cart item could not be revalidated.";
    if (preparedLine) {
      availableLines.push(preparedLine.line);
      if (preparedLine.itemType === OrderItemType.RENTAL && preparedLine.dates) {
        const result = await getAvailableInventoryUnits(preparedLine.productId, preparedLine.dates, preparedLine.quantity);
        availability = result.canRent ? "available" : "unavailable";
        if (!result.canRent) issue = "Rental availability has changed. Please adjust the dates or quantity.";
      }
    }
    if (issue) issues.push(issue);
    items.push({ cartItemId: item.id, productId: item.productId, name: item.product.name, itemType: item.itemType, quantity: item.quantity, startDate: item.startAt ? formatDateOnly(item.startAt) : null, endDate: item.endAt ? formatDateOnly(item.endAt) : null, line: preparedLine?.line ?? null, issue, availability });
  }
  const totals = calculateCartTotals(availableLines, availableLines[0]?.currency ?? "INR");
  return { items, totals, addresses, canPlaceOrder: items.length > 0 && issues.length === 0, issues: Array.from(new Set(issues)) };
}

function allocationMessage(result: AllocationFailure): never {
  throw new CheckoutError(result.code === "INVENTORY_UNAVAILABLE" ? "INVENTORY_UNAVAILABLE" : "INVALID_CHECKOUT", result.message);
}

async function createOrderAttempt(userId: string, address: AddressInput, options: { testFailureAfterOrder?: boolean } = {}) {
  return prisma.$transaction(async (tx) => {
    const cart = await loadCartForUser(tx, userId);
    if (cart.items.length === 0) throw new CheckoutError("EMPTY_CART", "Your cart is empty.");
    const prepared = prepareLines(cart);
    if (prepared.issues.length > 0 || prepared.lines.length !== cart.items.length) throw new CheckoutError("INVALID_CHECKOUT", prepared.issues[0] ?? "Your cart changed and needs to be reviewed.");
    const totals = calculateCartTotals(prepared.lines.map((line) => line.line), prepared.lines[0]?.line.currency ?? "INR");
    const shippingAddressSnapshot = await selectAddress(tx, userId, address);
    const payment: PaymentResult = await getPaymentService().charge({ amount: totals.total, currency: totals.currency });
    if (!payment.success) throw new CheckoutError("PAYMENT_FAILED", payment.message);

    const order = await tx.order.create({
      data: {
        orderNumber: `WW-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
        customerId: userId,
        type: orderType(prepared.lines),
        status: OrderStatus.CONFIRMED,
        paymentStatus: payment.status,
        currency: totals.currency,
        subtotal: totals.subtotal,
        discountTotal: totals.discount,
        taxTotal: totals.tax,
        deliveryTotal: totals.deliveryFee,
        grandTotal: totals.total,
        shippingAddressSnapshot,
      },
    });

    if (options.testFailureAfterOrder) throw new Error("Intentional checkout rollback test failure.");

    for (const line of prepared.lines) {
      const historicalUnitPrice = line.line.itemType === "PURCHASE" ? line.line.unitPrice : line.line.rate;
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: line.productId,
          itemType: line.itemType,
          quantity: line.quantity,
          currency: line.line.currency,
          unitPrice: historicalUnitPrice,
          lineTotal: line.line.lineTotal,
          rentalPricingSnapshot: line.itemType === OrderItemType.RENTAL ? line.line : undefined,
          impactSnapshot: line.impactMetrics.length ? { metrics: snapshotImpactMetrics(line.impactMetrics) } : undefined,
        },
      });
    }

    for (const line of prepared.lines.filter((candidate) => candidate.itemType === OrderItemType.RENTAL)) {
      if (!line.dates) throw new CheckoutError("INVALID_CHECKOUT", "Rental dates are missing.");
      const result = await allocateRentalWithinTransaction(tx, { userId, orderId: order.id, productId: line.productId, startDate: line.dates.startDate, endDate: line.dates.endDate, quantity: line.quantity });
      if (!result.success) allocationMessage(result);
      await tx.rental.update({ where: { id: result.rentalId }, data: { currency: line.line.currency, pricingSnapshot: line.line } });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id, id: { in: prepared.lines.map((line) => line.cartItemId) } } });
    return { orderId: order.id, orderNumber: order.orderNumber, paymentStatus: payment.status };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5_000, timeout: 20_000 });
}

export async function placeOrder(userId: string, address: AddressInput, options: { testFailureAfterOrder?: boolean } = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await createOrderAttempt(userId, address, options);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new CheckoutError("CHECKOUT_CONFLICT", "The order changed while it was being confirmed. Please try again.");
      throw error;
    }
  }
  throw new CheckoutError("CHECKOUT_CONFLICT", "The order could not be confirmed. Please try again.");
}

/** @internal Used only by PostgreSQL rollback integration tests. */
export async function placeOrderForRollbackTest(userId: string, address: AddressInput): Promise<never> {
  await placeOrder(userId, address, { testFailureAfterOrder: true });
  throw new Error("Rollback test unexpectedly completed.");
}

export async function getOrderForUser(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      items: { include: { product: { select: { name: true, slug: true } } } },
      rentals: { select: { id: true, startAt: true, endAt: true, status: true, pricingSnapshot: true, deliveredAt: true, collectedAt: true } },
    },
  });
}
