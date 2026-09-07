import { expect, test } from "@playwright/test";

async function expectKeyboardProgress(page: import("@playwright/test").Page, path: string, tabs: number) {
  await page.goto(path);
  await page.locator("a, button, input, select, textarea").first().focus();
  for (let index = 0; index < tabs; index += 1) {
    await page.keyboard.press("Tab");
    await expect.poll(() => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return Boolean(active && active !== document.body && active.checkVisibility() && active.getBoundingClientRect().width > 0);
    })).toBe(true);
  }
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
}

test("customer navigation and forms expose visible keyboard focus", async ({ page }) => {
  await expectKeyboardProgress(page, "/", 6);
  await expectKeyboardProgress(page, "/shop/mitti-patchwork-backdrop", 12);
  await expectKeyboardProgress(page, "/login", 3);
});
