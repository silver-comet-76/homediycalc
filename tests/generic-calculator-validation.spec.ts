import { expect, test, type Page } from "@playwright/test";

/**
 * Shared-component regression coverage for GenericCalculator
 * (QA-16A-05 second corrective round): the island drives all 31
 * calculators, so the canonical-validation fix must not change
 * validation behaviour anywhere else. Targeted tests across the
 * validation categories — explicit canonical min/max bounds, positive
 * and exclusive-minimum inputs, empty and optional inputs, invalid
 * numeric inputs, default upper-bound validation, global unit
 * switching and per-field unit switching, editing after switching,
 * Reset and mode changes — on Paint, Brick, and Tile, not just
 * default-value smoke tests.
 *
 * Runs on Chromium desktop and Pixel 5 mobile (see playwright.config.ts).
 */

async function gotoCalculator(page: Page, slug: string, heading: string) {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto(`/calculators/${slug}/`);
  await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  return consoleErrors;
}

test("paint: explicit count bounds are enforced (coats 1–5, doors 0–50)", async ({ page }) => {
  const consoleErrors = await gotoCalculator(page, "paint-calculator", "Paint Calculator");

  await page.getByLabel("Coats").fill("0");
  await expect(page.getByRole("alert").first()).toContainText("Coats must be at least 1.");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Coats").fill("6");
  await expect(page.getByRole("alert").first()).toContainText("Coats must be 5 or less.");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Coats").fill("5");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  await page.getByLabel("Doors").fill("51");
  await expect(page.getByRole("alert").first()).toContainText("Doors must be 50 or less.");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Doors").fill("50");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // A count must be a whole number.
  await page.getByLabel("Doors").fill("1.5");
  await expect(page.getByRole("alert").first()).toContainText("must be a whole number");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("paint: positive, empty, and default upper-bound inputs", async ({ page }) => {
  const consoleErrors = await gotoCalculator(page, "paint-calculator", "Paint Calculator");

  // Exclusive minimum: a length must be greater than 0.
  await page.getByLabel("Room length").fill("0");
  await expect(page.getByRole("alert").first()).toContainText("must be greater than 0");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Room length").fill("-5");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // Empty required input: no result, not a zero result.
  await page.getByLabel("Room length").fill("");
  await expect(page.getByRole("alert").first()).toContainText("Room length is required.");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // Non-numeric input cannot be typed into a type=number input in a
  // real browser (the browser sanitizes it to empty, which reports
  // "required" instead) — the "must be a number" branch is covered
  // at the unit level in src/lib/validation.test.ts.

  // Default upper bound (no explicit max on the field): 10,000 ft.
  await page.getByLabel("Room length").fill("20000");
  await expect(page.getByRole("alert").first()).toContainText("10000 or less");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Room length").fill("12");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("paint: optional price may stay empty, and drives the cost when entered", async ({ page }) => {
  const consoleErrors = await gotoCalculator(page, "paint-calculator", "Paint Calculator");

  // No price entered: results show, no cost is invented.
  await expect(page.getByLabel("Price per gallon (optional)")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByText("Estimated cost")).toHaveCount(0);

  await page.getByLabel("Price per gallon (optional)").fill("50");
  await expect(page.getByText("Estimated cost")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Clearing the optional price again removes the cost, not the result.
  await page.getByLabel("Price per gallon (optional)").fill("");
  await expect(page.getByText("Estimated cost")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("paint: unit switching, editing after switching, reset, and mode change", async ({ page }) => {
  const consoleErrors = await gotoCalculator(page, "paint-calculator", "Paint Calculator");

  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  // 12 ft converts from the retained canonical, not the default string.
  await expect(page.getByLabel("Room length")).toHaveValue("3.6576");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Editing in metric governs: 5 m back in imperial is 16.4042 ft.
  await page.getByLabel("Room length").fill("5");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
  await expect(page.getByLabel("Room length")).toHaveValue("16.4042");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Reset restores the active system's defaults.
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Room length")).toHaveValue("12");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Mode change swaps the field set; switching back restores it.
  await page.getByRole("button", { name: "Known wall area" }).click();
  await expect(page.getByLabel("Net wall area")).toBeVisible();
  await expect(page.getByLabel("Room length")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await page.getByRole("button", { name: "Room dimensions" }).click();
  await expect(page.getByLabel("Room length")).toHaveValue("12");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("brick: explicit bounds and optional numeric fields", async ({ page }) => {
  const consoleErrors = await gotoCalculator(page, "brick-calculator", "Brick Calculator");

  await page.getByLabel("Bricks per 80 lb mortar bag").fill("0");
  await expect(page.getByRole("alert").first()).toContainText("must be at least 1");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Bricks per 80 lb mortar bag").fill("201");
  await expect(page.getByRole("alert").first()).toContainText("must be 200 or less");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Bricks per 80 lb mortar bag").fill("200");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Optional verified bag yield: empty is fine, below its 0.01 minimum is not.
  await expect(page.getByLabel("Verified bag yield, ft³ per 80 lb bag (optional)")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await page.getByLabel("Verified bag yield, ft³ per 80 lb bag (optional)").fill("0");
  await expect(page.getByRole("alert").first()).toContainText("at least 0.01");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);
  await page.getByLabel("Verified bag yield, ft³ per 80 lb bag (optional)").fill("0.005");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);
  await page.getByLabel("Verified bag yield, ft³ per 80 lb bag (optional)").fill("");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("brick: per-field unit switching preserves the physical value and results", async ({
  page,
}) => {
  const consoleErrors = await gotoCalculator(page, "brick-calculator", "Brick Calculator");

  // 7.625 in = 19.3675 cm = 193.675 mm; results stay live throughout.
  // (The number input is addressed as a spinbutton: getByLabel("Brick
  // length") also matches the per-field unit picker.)
  const brickLength = page.getByRole("spinbutton", { name: /Brick length/ });
  await page.getByLabel("Brick length unit").selectOption("cm");
  await expect(brickLength).toHaveValue("19.3675");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await page.getByLabel("Brick length unit").selectOption("mm");
  await expect(brickLength).toHaveValue("193.675");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Editing in the switched unit governs: 20 cm back in inches is 7.874 in.
  await page.getByLabel("Brick length unit").selectOption("cm");
  await brickLength.fill("20");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await page.getByLabel("Brick length unit").selectOption("in");
  await expect(brickLength).toHaveValue("7.874");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Reset restores the defaults, including the per-field unit.
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(brickLength).toHaveValue("7.625");
  await expect(page.getByLabel("Brick length unit")).toHaveValue("in");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("tile: per-field unit switching and editing after switching", async ({ page }) => {
  const consoleErrors = await gotoCalculator(page, "tile-calculator", "Tile Calculator");

  // 12 in = 30.48 cm; results stay live.
  // (The number input is addressed as a spinbutton: getByLabel("Tile
  // length") also matches the per-field unit picker.)
  const tileLength = page.getByRole("spinbutton", { name: /Tile length/ });
  await page.getByLabel("Tile length unit").selectOption("cm");
  await expect(tileLength).toHaveValue("30.48");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Editing in centimetres governs: 30 cm back in inches is 11.811 in.
  await tileLength.fill("30");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await page.getByLabel("Tile length unit").selectOption("in");
  await expect(tileLength).toHaveValue("11.811");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
