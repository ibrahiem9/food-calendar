import { expect, test } from "@playwright/test";

test.describe("Phase 1 food library", () => {
  test("renders the full catalog and filters by category", async ({ page }) => {
    const allergenBadges = page
      .locator("li span")
      .filter({ hasText: /^Allergen$/ });

    await page.goto("http://127.0.0.1:5173");

    await expect(page.getByRole("heading", { name: "BabyBite Calendar" })).toBeVisible();
    await expect(page.getByText("94 foods", { exact: true })).toBeVisible();

    await expect(page.getByText("Apple", { exact: true })).toBeVisible();
    await expect(page.getByText("Tahini", { exact: true })).toBeVisible();
    await expect(page.getByText("Lemon/Lime", { exact: true })).toBeVisible();
    await expect(allergenBadges).toHaveCount(16);

    await page.getByRole("button", { name: "Vegetables" }).click();
    await expect(page.getByRole("heading", { name: "20 items" })).toBeVisible();
    await expect(page.getByText("Broccoli", { exact: true })).toBeVisible();
    await expect(page.getByText("Apple", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Allergens" }).click();
    await expect(page.getByText("Spacing rules apply")).toBeVisible();
    await expect(page.getByText("Peanut", { exact: true })).toBeVisible();
    await expect(page.getByText("Tahini", { exact: true })).toBeVisible();
    await expect(allergenBadges).toHaveCount(16);

    await page.getByRole("button", { name: "Starches" }).click();
    await expect(page.getByRole("heading", { name: "17 items" })).toBeVisible();
    await expect(page.getByText("Quinoa", { exact: true })).toBeVisible();
    await expect(page.getByText("Peanut", { exact: true })).toHaveCount(0);
  });
});
