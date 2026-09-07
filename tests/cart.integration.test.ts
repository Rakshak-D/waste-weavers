import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/db/prisma";
import { addCartItem, clearCart, getCartView, removeCartItem, updateCartItem } from "../lib/cart/service";

const integrationEnabled = process.env.RUN_DATABASE_INTEGRATION === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!integrationEnabled)("cart PostgreSQL integration", () => {
  let customerId = "";
  let otherCustomerId = "";
  let purchaseProductId = "";
  let rentalProductId = "";

  beforeAll(async () => {
    const category = await prisma.category.create({ data: { name: "Cart integration", slug: `cart-integration-${Date.now()}` } });
    const [customer, otherCustomer] = await Promise.all([
      prisma.user.create({ data: { email: `cart-${Date.now()}@example.test`, role: "CUSTOMER" } }),
      prisma.user.create({ data: { email: `cart-other-${Date.now()}@example.test`, role: "CUSTOMER" } }),
    ]);
    customerId = customer.id;
    otherCustomerId = otherCustomer.id;
    const [purchase, rental] = await Promise.all([
      prisma.product.create({ data: { name: "Cart purchase", slug: `cart-purchase-${Date.now()}`, description: "Integration fixture", categoryId: category.id, purchasable: true, purchasePrice: "100.00", status: "ACTIVE" } }),
      prisma.product.create({ data: { name: "Cart rental", slug: `cart-rental-${Date.now()}`, description: "Integration fixture", categoryId: category.id, rentable: true, rentalPricingConfig: { strategy: "PER_DAY", rate: "25.00", currency: "INR" }, status: "ACTIVE" } }),
    ]);
    purchaseProductId = purchase.id;
    rentalProductId = rental.id;
    await prisma.inventoryUnit.createMany({ data: [{ productId: rental.id, inventoryCode: `CART-${Date.now()}-1` }, { productId: rental.id, inventoryCode: `CART-${Date.now()}-2` }] });
  });

  beforeEach(async () => {
    await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: [customerId, otherCustomerId] } } } });
  });

  afterAll(async () => {
    await prisma.inventoryUnit.deleteMany({ where: { productId: rentalProductId } });
    await prisma.product.deleteMany({ where: { id: { in: [purchaseProductId, rentalProductId] } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: "cart-integration-" } } });
    await prisma.user.deleteMany({ where: { id: { in: [customerId, otherCustomerId] } } });
    await prisma.$disconnect();
  });

  it("adds, updates, and removes a purchase item", async () => {
    let cart = await addCartItem(customerId, { productId: purchaseProductId, itemType: "PURCHASE", quantity: 2 });
    expect(cart.items[0]?.line?.lineTotal).toBe(200);
    const itemId = cart.items[0]!.id;
    cart = await updateCartItem(customerId, itemId, { quantity: 3 });
    expect(cart.items[0]?.quantity).toBe(3);
    cart = await removeCartItem(customerId, itemId);
    expect(cart.items).toHaveLength(0);
  });

  it("supports rental dates without creating allocations", async () => {
    const cart = await addCartItem(customerId, { productId: rentalProductId, itemType: "RENTAL", quantity: 1, startDate: "2031-10-12", endDate: "2031-10-15" });
    expect(cart.items[0]?.line?.lineTotal).toBe(100);
    expect(await prisma.rental.count({ where: { customerId } })).toBe(0);
    expect(await prisma.rentalAllocation.count()).toBe(0);
  });

  it("keeps cart ownership scoped to the authenticated customer", async () => {
    const cart = await addCartItem(customerId, { productId: purchaseProductId, itemType: "PURCHASE", quantity: 1 });
    await expect(updateCartItem(otherCustomerId, cart.items[0]!.id, { quantity: 2 })).rejects.toThrow("could not be found");
    expect((await getCartView(otherCustomerId)).items).toHaveLength(0);
    await clearCart(customerId);
  });
});

