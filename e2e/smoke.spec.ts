import { expect, test, type Page } from "@playwright/test";

function uniqueCustomer() {
  return {
    name: "E2E Customer",
    email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
    password: "E2ECustomer2026!",
  };
}

async function register(page: Page) {
  const customer = uniqueCustomer();
  await page.goto("/register");
  await page.getByLabel("Name").fill(customer.name);
  await page.getByLabel("Email").fill(customer.email);
  await page.getByLabel("Password", { exact: true }).fill(customer.password);
  await page.getByLabel("Confirm password").fill(customer.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  return customer;
}

async function completeCheckout(page: Page) {
  await page.goto("/cart");
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole("button", { name: "New address" }).click();
  await page.getByLabel("Recipient name").fill("E2E Customer");
  await page.getByLabel("Address line 1").fill("1 Test Lane");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("Postal code").fill("560001");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/order\//);
  await expect(page.getByText("Order confirmed", { exact: false })).toBeVisible();
}

test.describe("Waste Weavers customer smoke flows", () => {
  test("purchase flow reaches an order and account history", async ({ page }) => {
    await register(page);
    await page.goto("/shop/mitti-patchwork-backdrop");
    await page.getByRole("button", { name: "Add purchase to cart" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Added to cart" })).toBeVisible();
    await completeCheckout(page);
    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: "Your orders" })).toBeVisible();
    await expect(page.getByText(/WW-/)).toBeVisible();
  });

  test("rental product exposes configured pricing and calendar controls", async ({ page }) => {
    await register(page);
    await page.goto("/shop/mitti-patchwork-backdrop");
    await expect(page.getByText("₹2,500 / day", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choose your dates." })).toBeVisible();
    await expect(page.getByLabel("Rental quantity")).toBeVisible();
  });

  test("mobile storefront remains usable", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /Décor with/ })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "auto");
  });
});

test("admin operational pages load from the database", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo.admin@wasteweavers.example");
  await page.getByLabel("Password").fill("DemoAdmin2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/admin/products");
  await expect(page.getByText("Mitti Patchwork Backdrop")).toBeVisible();
  await page.goto("/admin/inventory");
  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
  await page.goto("/admin/custom-orders");
  await expect(page.getByRole("heading", { name: "Custom requests" })).toBeVisible();
});
