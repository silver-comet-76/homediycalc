import { expect, test, type Page } from "@playwright/test";

/**
 * Workstream H (Phase 17B2 corrective round): keyboard operability
 * of the two selects the corrective round introduced or relied on —
 * the "Buy as" purchase-method select (Workstream D) and the Fence
 * "Gate layout" select (Workstream A). Both are native <select>
 * elements, so they must be reachable by Tab/Shift+Tab from the
 * neighbouring field and changeable with arrow keys alone, with the
 * results updating on the keyboard-driven change.
 *
 * Hand-derived expectations (defaults):
 * - Lawn seed 50 x 100 ft, 7 lb per 1,000 ft2, 10% buffer: 38.5 lb
 *   need; bags 3 x 10 lb + 3 x 3 lb (39 lb) at $2/lb = $78.00,
 *   bulk by the pound 38.5 lb at $2/lb = $77.00.
 * - Fence picket mode, 100 ft run, 8 ft spacing: 13 sections,
 *   14 posts with no gate. With a 4 ft gate entered and the layout
 *   still "one continuous run": net 96 ft, 12 sections, 13 posts.
 *   With the layout changed to "one gate in the middle": the same
 *   96 ft in two 48 ft runs, 6 sections per run, 14 posts (2 of
 *   them gate posts).
 */

function results(page: Page) {
  return page.locator('section[aria-label="Results"]');
}

function consoleErrorCollector(page: Page) {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  return consoleErrors;
}

test("lawn seed: Buy as select is reachable by Shift+Tab and changes by arrow key", async ({
  page,
}) => {
  const consoleErrors = consoleErrorCollector(page);
  await page.goto("/calculators/lawn-seed-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();

  // Default purchase is bags: $2/lb prices the 39 lb purchased.
  await page.getByLabel("Price per pound (optional)").fill("2");
  await expect(results(page).getByText("$78.00")).toBeVisible();
  await expect(results(page).getByText("3 × 10 lb + 3 × 3 lb")).toBeVisible();

  // "Buy as" is the field immediately before the price field, so
  // Shift+Tab from the price input must land on the select.
  const buyAs = page.getByLabel("Buy as");
  await page.getByLabel("Price per pound (optional)").focus();
  await page.keyboard.press("Shift+Tab");
  await expect(buyAs).toBeFocused();

  // One ArrowDown moves a native select from the first option
  // (bags) to the second (bulk by the pound); the result reprices
  // on the buffered 38.5 lb instead of the 39 lb bag purchase. The
  // "Bags to buy" row stays visible as the labelled alternative —
  // only the shopping list (and the price) switch to bulk.
  await page.keyboard.press("ArrowDown");
  await expect(buyAs).toHaveValue("1");
  await expect(results(page).getByText("$77.00")).toBeVisible();
  await expect(
    results(page).getByText("Alternative: buy bags or bulk by the pound, not both"),
  ).toBeVisible();

  // ArrowUp returns to bags, and the $78.00 bag price comes back.
  await page.keyboard.press("ArrowUp");
  await expect(buyAs).toHaveValue("0");
  await expect(results(page).getByText("$78.00")).toBeVisible();
  await expect(results(page).getByText("3 × 10 lb + 3 × 3 lb")).toBeVisible();
  await expect(
    results(page).getByText("Alternative: buy bags or bulk by the pound, not both"),
  ).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("fence: Gate layout select is reachable by Tab and changes by arrow key", async ({ page }) => {
  const consoleErrors = consoleErrorCollector(page);
  await page.goto("/calculators/fence-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();

  // Default picket job: 100 ft run, no gate — 14 posts.
  await expect(results(page).getByText("14 posts")).toBeVisible();

  // Enter a 4 ft gate: still one continuous run, so the net 96 ft
  // gives 12 sections and 13 fence posts — plus 1 support post,
  // because the end gate is freestanding by default (R01): 14 posts.
  await page.getByLabel("Gates and openings (optional)").fill("4");
  await expect(results(page).getByText("14 posts")).toBeVisible();

  // "Gate layout" is the field immediately after the gate-width
  // field, so Tab from the gate-width input must land on the select.
  const gateLayout = page.getByLabel("Gate layout");
  await page.getByLabel("Gates and openings (optional)").focus();
  await page.keyboard.press("Tab");
  await expect(gateLayout).toBeFocused();

  // One ArrowDown moves from "one continuous run" to "one gate in
  // the middle": two 48 ft runs, 14 posts, 2 of them gate posts.
  await page.keyboard.press("ArrowDown");
  await expect(gateLayout).toHaveValue("2");
  await expect(results(page).getByText("14 posts")).toBeVisible();
  await expect(results(page).getByText("2 gate posts")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
