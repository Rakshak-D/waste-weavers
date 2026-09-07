import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();
const prefix = `phase15-unavailable-${Date.now()}`;
let fixture: { userId: string; rentalId: string; productId: string; unitIds: string[] };
const password = "Phase15Unavailable2026!";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(`${prefix}@example.test`);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test.beforeAll(async () => {
  const product = await prisma.product.findUniqueOrThrow({ where: { slug: "mitti-patchwork-backdrop" }, include: { inventoryUnits: true } });
  const user = await prisma.user.create({ data: { email: `${prefix}@example.test`, name: "Phase 15 unavailable", passwordHash: await hashPassword(password) } });
  const rental = await prisma.rental.create({ data: { customerId: user.id, startAt: new Date("2026-10-20T00:00:00.000Z"), endAt: new Date("2026-10-21T00:00:00.000Z"), status: "ACTIVE" } });
  await prisma.rentalAllocation.createMany({ data: product.inventoryUnits.map((unit) => ({ rentalId: rental.id, inventoryUnitId: unit.id })) });
  fixture = { userId: user.id, rentalId: rental.id, productId: product.id, unitIds: product.inventoryUnits.map((unit) => unit.id) };
});

test.afterAll(async () => {
  if (!fixture) return;
  await prisma.rental.deleteMany({ where: { id: fixture.rentalId } });
  await prisma.user.delete({ where: { id: fixture.userId } });
  await prisma.$disconnect();
});

test("unavailable inventory is reported without cart or inventory mutation", async ({ page }) => {
  await signIn(page);
  const before = await prisma.inventoryUnit.findMany({ where: { id: { in: fixture.unitIds } }, select: { id: true, status: true } });
  await page.goto("/shop/mitti-patchwork-backdrop");
  await expect(page.getByRole("heading", { name: "Choose your dates." })).toBeVisible();
  await page.locator("button.rdp-button_next").click();
  await page.locator('button.rdp-day_button[aria-label*="October 20th"]').click();
  await page.locator('button.rdp-day_button[aria-label*="October 21st"]').click();
  await expect(page.getByText(/Not available|Only 0 units are available/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Add rental to cart" })).toHaveCount(0);

  const blocked = await page.request.post("/api/cart", { data: { productId: fixture.productId, itemType: "RENTAL", quantity: 1, startDate: "2026-10-20", endDate: "2026-10-21" } });
  expect(blocked.status()).toBe(409);
  expect((await page.request.get("/api/cart")).status()).toBe(200);
  expect((await (await page.request.get("/api/cart")).json()).items).toEqual([]);
  const after = await prisma.inventoryUnit.findMany({ where: { id: { in: fixture.unitIds } }, select: { id: true, status: true } });
  expect(after).toEqual(before);
});
