import { expect, test } from "@playwright/test";

/**
 * Phase 11 regression tests: header-search query propagation (?q=) and
 * removal of internal P0/P1/P2 labels from public listing pages.
 *
 * Runs on Chromium desktop and Pixel 5 mobile (see playwright.config.ts),
 * so the header-search flow is covered on both viewports, including the
 * mobile header search.
 */

// The 31 calculator slugs (must match src/lib/registry.ts).
const CALCULATOR_SLUGS = [
  "concrete-calculator",
  "square-footage-calculator",
  "paint-calculator",
  "gravel-calculator",
  "mulch-calculator",
  "concrete-slab-calculator",
  "cubic-yard-calculator",
  "cubic-feet-calculator",
  "tile-calculator",
  "brick-calculator",
  "drywall-calculator",
  "concrete-bags-calculator",
  "flooring-calculator",
  "paver-calculator",
  "topsoil-calculator",
  "grout-calculator",
  "board-foot-calculator",
  "mortar-calculator",
  "ceiling-tile-calculator",
  "tile-adhesive-calculator",
  "primer-calculator",
  "wallpaper-calculator",
  "sealant-calculator",
  "waterproofing-calculator",
  "baseboard-calculator",
  "stair-calculator",
  "sand-calculator",
  "raised-bed-soil-calculator",
  "sod-calculator",
  "lawn-seed-calculator",
  "fence-calculator",
] as const;

const CATEGORY_SLUGS = [
  "concrete-and-masonry",
  "painting",
  "flooring-and-tiles",
  "landscaping",
  "measurement",
  "interior-and-maintenance",
] as const;

/** Visible calculator cards on the directory page. */
function visibleEntries(page: import("@playwright/test").Page) {
  return page.locator(".calculator-entry:visible");
}

test("header search 'tile' filters the calculator directory", async ({ page }) => {
  await page.goto("/");
  // Type in the header search and submit (navigates to /calculators/?q=tile).
  await page.getByLabel("Search calculators").fill("tile");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/\/calculators\/\?q=tile/);
  // The filter input is populated with the query value.
  await expect(page.locator("#calculator-filter")).toHaveValue("tile");
  // Matching calculators are shown (4): Tile, Grout, Tile Adhesive, Ceiling Tile.
  await expect(visibleEntries(page)).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Tile Calculator", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Grout Calculator", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Tile Adhesive Calculator", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ceiling Tile Calculator", exact: true }),
  ).toBeVisible();
  // Non-matching calculators are hidden.
  await expect(page.getByRole("link", { name: "Paint Calculator", exact: true })).toBeHidden();
  await expect(page.getByRole("link", { name: "Concrete Calculator", exact: true })).toBeHidden();
  // Category sections with no matches are hidden (only Flooring and
  // Tiles + Interior and Maintenance have a tile match).
  await expect(page.locator("[data-category-section]:visible")).toHaveCount(2);
  // The no-results message stays hidden (there are matches).
  await expect(page.locator("#no-results")).toBeHidden();
});

test("direct /calculators/?q= applies the filter on load", async ({ page }) => {
  // Mixed case + URL-encoded space: "TILE" and "tile%20adhesive".
  await page.goto("/calculators/?q=TILE");
  await expect(page.locator("#calculator-filter")).toHaveValue("TILE");
  await expect(visibleEntries(page)).toHaveCount(4);

  await page.goto("/calculators/?q=tile%20adhesive");
  await expect(page.locator("#calculator-filter")).toHaveValue("tile adhesive");
  await expect(visibleEntries(page)).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Tile Adhesive Calculator", exact: true }),
  ).toBeVisible();

  // Leading/trailing spaces are trimmed.
  await page.goto("/calculators/?q=%20tile%20");
  await expect(page.locator("#calculator-filter")).toHaveValue("tile");
  await expect(visibleEntries(page)).toHaveCount(4);
});

test("unmatched search shows the no-results message", async ({ page }) => {
  await page.goto("/calculators/?q=zzzzqqqq");
  await expect(page.locator("#calculator-filter")).toHaveValue("zzzzqqqq");
  await expect(visibleEntries(page)).toHaveCount(0);
  await expect(page.locator("[data-category-section]:visible")).toHaveCount(0);
  await expect(page.locator("#no-results")).toBeVisible();
  await expect(page.locator("#no-results")).toContainText("No calculators match that search");
});

test("empty and cleared queries show all 31 calculators", async ({ page }) => {
  // No query: all 31 shown.
  await page.goto("/calculators/");
  await expect(visibleEntries(page)).toHaveCount(31);
  await expect(page.locator("#no-results")).toBeHidden();

  // Empty query param: all 31 shown.
  await page.goto("/calculators/?q=");
  await expect(visibleEntries(page)).toHaveCount(31);

  // Filtered, then cleared via the input: all 31 restored.
  await page.goto("/calculators/?q=tile");
  await expect(visibleEntries(page)).toHaveCount(4);
  await page.locator("#calculator-filter").fill("");
  await expect(visibleEntries(page)).toHaveCount(31);
  await expect(page.locator("#no-results")).toBeHidden();
});

test("no P0/P1/P2 or 'Arrives in Phase' labels on listing/category pages", async ({ page }) => {
  // Calculators directory.
  await page.goto("/calculators/");
  const dirText = await page.locator("main").innerText();
  expect(dirText).not.toMatch(/\bP[012]\b/);
  expect(dirText).not.toContain("Arrives in Phase");
  expect(dirText).not.toContain("Available now");
  // Every category page.
  for (const slug of CATEGORY_SLUGS) {
    await page.goto(`/categories/${slug}/`);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\bP[012]\b/);
    expect(text).not.toContain("Arrives in Phase");
    expect(text).not.toContain("Available now");
  }
});

test("all 31 calculator URLs still work", async ({ request }) => {
  for (const slug of CALCULATOR_SLUGS) {
    const res = await request.get(`/calculators/${slug}/`);
    expect(res.ok()).toBeTruthy();
  }
  expect(CALCULATOR_SLUGS).toHaveLength(31);
});
