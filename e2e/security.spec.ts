import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();
const fixturePrefix = `phase15-${Date.now()}`;
let fixture: { userAId: string; userBId: string; orderId: string; rentalId: string; addressId: string; customOrderId: string; cartId: string; productId: string };

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test.beforeAll(async () => {
  const product = await prisma.product.findUniqueOrThrow({ where: { slug: "mitti-patchwork-backdrop" } });
  const passwordHash = await hashPassword("Phase15Customer2026!");
  const [userA, userB] = await Promise.all([
    prisma.user.create({ data: { email: `${fixturePrefix}-a@example.test`, name: "Phase 15 A", passwordHash } }),
    prisma.user.create({ data: { email: `${fixturePrefix}-b@example.test`, name: "Phase 15 B", passwordHash } }),
  ]);
  const address = await prisma.address.create({ data: { userId: userA.id, label: "A address", recipientName: "Phase 15 A", line1: "1 Fixture Lane", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "IN" } });
  const cart = await prisma.cart.create({ data: { userId: userA.id, items: { create: { productId: product.id, itemType: "PURCHASE", quantity: 1 } } } });
  const customOrder = await prisma.customOrder.create({ data: { customerId: userA.id, eventType: "Phase 15 fixture", requirements: "A private ownership fixture request." } });
  const order = await prisma.order.create({ data: { orderNumber: `${fixturePrefix}-ORDER`, customerId: userA.id, type: "PURCHASE", status: "CONFIRMED", paymentStatus: "PAID", currency: "INR", subtotal: "18500.00", grandTotal: "18500.00", shippingAddressSnapshot: { recipientName: "Phase 15 A", line1: "1 Fixture Lane", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "IN" }, items: { create: { productId: product.id, itemType: "PURCHASE", quantity: 1, currency: "INR", unitPrice: "18500.00", lineTotal: "18500.00" } } } });
  const rental = await prisma.rental.create({ data: { customerId: userA.id, orderId: order.id, startAt: new Date("2099-10-20T00:00:00.000Z"), endAt: new Date("2099-10-21T00:00:00.000Z"), status: "RESERVED", pricingSnapshot: { strategy: "PER_DAY", rate: 2500, durationDays: 2 } } });
  fixture = { userAId: userA.id, userBId: userB.id, orderId: order.id, rentalId: rental.id, addressId: address.id, customOrderId: customOrder.id, cartId: cart.id, productId: product.id };
});

test.afterAll(async () => {
  if (!fixture) return;
  await prisma.rental.deleteMany({ where: { id: fixture.rentalId } });
  await prisma.order.deleteMany({ where: { id: fixture.orderId } });
  await prisma.customOrder.deleteMany({ where: { id: fixture.customOrderId } });
  await prisma.user.deleteMany({ where: { id: { in: [fixture.userAId, fixture.userBId] } } });
  await prisma.$disconnect();
});

test("customer ownership and admin authorization are enforced at API boundaries", async ({ page }) => {
  await signIn(page, `${fixturePrefix}-b@example.test`, "Phase15Customer2026!");

  await expect((await page.request.get(`/api/orders/${fixture.orderId}`)).status()).toBe(404);
  await expect((await page.request.get(`/api/custom-orders/${fixture.customOrderId}`)).status()).toBe(404);
  await expect((await page.request.patch(`/api/account/addresses/${fixture.addressId}`, { data: { recipientName: "Should not update", line1: "No access", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "IN" } })).status()).toBe(404);
  const ownCart = await page.request.get("/api/cart");
  expect(ownCart.ok()).toBeTruthy();
  expect((await ownCart.json()).items).toEqual([]);

  await expect((await page.request.get("/api/admin/products")).status()).toBe(403);
  await expect((await page.request.patch(`/api/admin/products/${fixture.productId}`, { data: { name: "blocked", slug: "blocked", description: "blocked", categoryId: "blocked", purchasable: true, rentable: true, status: "ACTIVE" } })).status()).toBe(403);
  await expect((await page.request.post("/api/admin/inventory", { data: { productId: fixture.productId, condition: "GOOD" } })).status()).toBe(403);
  await expect((await page.request.patch(`/api/admin/orders/${fixture.orderId}`, { data: { status: "FULFILLING" } })).status()).toBe(403);
  await expect((await page.request.post("/api/admin/returns", { data: { rentalId: fixture.rentalId } })).status()).toBe(403);
  await expect((await page.request.patch(`/api/admin/custom-orders/${fixture.customOrderId}`, { data: { status: "UNDER_REVIEW", adminNotes: "blocked" } })).status()).toBe(403);

  await page.goto(`/account/orders/${fixture.orderId}`);
  await expect(page).toHaveTitle(/404|Waste Weavers/i);
});
