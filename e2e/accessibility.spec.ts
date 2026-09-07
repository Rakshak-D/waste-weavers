import { expect, test, type Page } from "@playwright/test";

// axe-core exposes its browser bundle as a CommonJS source string.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const axeSource = (require("axe-core/axe.min.js") as { source: string }).source;

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

async function audit(page: Page) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as Window & { axe: { run: (root: Document) => Promise<{ violations: Array<{ id: string; impact: string | null; nodes: unknown[] }> }> } }).axe;
    return axe.run(document);
  });
  expect(result.violations, result.violations.map((violation) => `${violation.id} (${violation.impact})`).join("\n")).toEqual([]);
}

test.describe("WCAG smoke audit", () => {
  test("public customer surfaces have no axe violations", async ({ page }) => {
    for (const path of ["/", "/shop", "/shop/mitti-patchwork-backdrop", "/cart", "/checkout", "/custom-order"]) {
      await page.goto(path);
      await audit(page);
    }
  });

  test("customer account surface has no axe violations", async ({ page }) => {
    await signIn(page, "demo.customer@wasteweavers.example", "DemoCustomer2026!");
    for (const path of ["/account", "/account/orders", "/account/rentals", "/account/addresses"]) {
      await page.goto(path);
      await audit(page);
    }
  });

  test("admin operational surfaces have no axe violations", async ({ page }) => {
    await signIn(page, "demo.admin@wasteweavers.example", "DemoAdmin2026!");
    for (const path of ["/admin", "/admin/products", "/admin/products/new", "/admin/returns", "/admin/maintenance", "/admin/custom-orders"]) {
      await page.goto(path);
      await audit(page);
    }
  });
});
