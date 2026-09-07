import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/db/prisma";
import { addCartItem } from "../lib/cart/service";
import { getOrderForUser, placeOrder, placeOrderForRollbackTest } from "../lib/checkout/service";

const integrationEnabled = process.env.RUN_DATABASE_INTEGRATION === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!integrationEnabled)("checkout PostgreSQL integration", () => {
  let customerId = "";
  let otherCustomerId = "";
  let purchaseProductId = "";
  let rentalProductId = "";
  let addressId = "";
  let categoryId = "";

  beforeAll(async () => {
    const category = await prisma.category.create({ data: { name: "Checkout integration", slug: `checkout-integration-${Date.now()}` } });
    categoryId = category.id;
    const [customer, otherCustomer] = await Promise.all([
      prisma.user.create({ data: { email: `checkout-${Date.now()}@example.test`, role: "CUSTOMER" } }),
      prisma.user.create({ data: { email: `checkout-other-${Date.now()}@example.test`, role: "CUSTOMER" } }),
    ]);
    customerId = customer.id;
    otherCustomerId = otherCustomer.id;
    const [purchase, rental] = await Promise.all([
      prisma.product.create({ data: { name: "Checkout purchase", slug: `checkout-purchase-${Date.now()}`, description: "Integration fixture", categoryId, purchasable: true, purchasePrice: "5000.00", status: "ACTIVE" } }),
      prisma.product.create({ data: { name: "Checkout rental", slug: `checkout-rental-${Date.now()}`, description: "Integration fixture", categoryId, rentable: true, rentalPricingConfig: { strategy: "PER_DAY", rate: "2500.00", currency: "INR" }, status: "ACTIVE" } }),
    ]);
    purchaseProductId = purchase.id;
    rentalProductId = rental.id;
    await prisma.inventoryUnit.createMany({ data: [{ productId: rental.id, inventoryCode: `CHECKOUT-${Date.now()}-1` }, { productId: rental.id, inventoryCode: `CHECKOUT-${Date.now()}-2` }] });
    const address = await prisma.address.create({ data: { userId: customer.id, recipientName: "Demo Customer", line1: "1 Textile Lane", city: "Jaipur", state: "Rajasthan", postalCode: "302001" } });
    addressId = address.id;
  });

  beforeEach(async () => {
    await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: [customerId, otherCustomerId] } } } });
    await prisma.rentalAllocation.deleteMany({ where: { rental: { customerId: { in: [customerId, otherCustomerId] } } } });
    await prisma.rental.deleteMany({ where: { customerId: { in: [customerId, otherCustomerId] } } });
    await prisma.orderItem.deleteMany({ where: { order: { customerId: { in: [customerId, otherCustomerId] } } } });
    await prisma.order.deleteMany({ where: { customerId: { in: [customerId, otherCustomerId] } } });
    await prisma.inventoryUnit.updateMany({ where: { productId: rentalProductId }, data: { status: "AVAILABLE" } });
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { order: { customerId: { in: [customerId, otherCustomerId] } } } });
    await prisma.rentalAllocation.deleteMany({ where: { rental: { customerId: { in: [customerId, otherCustomerId] } } } });
    await prisma.rental.deleteMany({ where: { customerId: { in: [customerId, otherCustomerId] } } });
    await prisma.order.deleteMany({ where: { customerId: { in: [customerId, otherCustomerId] } } });
    await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: [customerId, otherCustomerId] } } } });
    await prisma.inventoryUnit.deleteMany({ where: { productId: rentalProductId } });
    await prisma.address.deleteMany({ where: { id: addressId } });
    await prisma.product.deleteMany({ where: { id: { in: [purchaseProductId, rentalProductId] } } });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: { in: [customerId, otherCustomerId] } } });
    await prisma.$disconnect();
  });

  it("creates a purchase order with historical values and clears the cart", async () => {
    await addCartItem(customerId, { productId: purchaseProductId, itemType: "PURCHASE", quantity: 1 });
    const result = await placeOrder(customerId, { addressId });
    const order = await getOrderForUser(customerId, result.orderId);
    expect(order?.items[0]?.unitPrice.toString()).toBe("5000");
    expect(await prisma.cartItem.count({ where: { cart: { userId: customerId } } })).toBe(0);
  });

  it("creates a rental order and allocations", async () => {
    await addCartItem(customerId, { productId: rentalProductId, itemType: "RENTAL", quantity: 2, startDate: "2032-10-12", endDate: "2032-10-15" });
    const result = await placeOrder(customerId, { addressId });
    expect(await prisma.rental.count({ where: { orderId: result.orderId } })).toBe(1);
    expect(await prisma.rentalAllocation.count({ where: { rental: { orderId: result.orderId } } })).toBe(2);
  });

  it("keeps the cart when inventory becomes unavailable", async () => {
    await addCartItem(customerId, { productId: rentalProductId, itemType: "RENTAL", quantity: 2, startDate: "2033-10-12", endDate: "2033-10-15" });
    await prisma.inventoryUnit.updateMany({ where: { productId: rentalProductId }, data: { status: "MAINTENANCE" } });
    await expect(placeOrder(customerId, { addressId })).rejects.toThrow("no longer available");
    expect(await prisma.cartItem.count({ where: { cart: { userId: customerId } } })).toBe(1);
    await prisma.inventoryUnit.updateMany({ where: { productId: rentalProductId }, data: { status: "AVAILABLE" } });
  });

  it("rolls back the order when a post-order failure occurs", async () => {
    await addCartItem(customerId, { productId: purchaseProductId, itemType: "PURCHASE", quantity: 1 });
    await expect(placeOrderForRollbackTest(customerId, { addressId })).rejects.toThrow("rollback");
    expect(await prisma.order.count({ where: { customerId } })).toBe(0);
    expect(await prisma.orderItem.count({ where: { order: { customerId } } })).toBe(0);
    expect(await prisma.cartItem.count({ where: { cart: { userId: customerId } } })).toBe(1);
  });

  it("protects order access by customer ownership", async () => {
    await addCartItem(customerId, { productId: purchaseProductId, itemType: "PURCHASE", quantity: 1 });
    const result = await placeOrder(customerId, { addressId });
    expect(await getOrderForUser(otherCustomerId, result.orderId)).toBeNull();
  });

  it("serializes competing checkout attempts for the same units", async () => {
    await addCartItem(customerId, { productId: rentalProductId, itemType: "RENTAL", quantity: 2, startDate: "2034-10-12", endDate: "2034-10-15" });
    const otherAddress = await prisma.address.create({ data: { userId: otherCustomerId, recipientName: "Other Customer", line1: "2 Textile Lane", city: "Jaipur", state: "Rajasthan", postalCode: "302002" } });
    await addCartItem(otherCustomerId, { productId: rentalProductId, itemType: "RENTAL", quantity: 2, startDate: "2034-10-12", endDate: "2034-10-15" });
    const results = await Promise.allSettled([placeOrder(customerId, { addressId }), placeOrder(otherCustomerId, { addressId: otherAddress.id })]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    await prisma.address.delete({ where: { id: otherAddress.id } });
  });
});
