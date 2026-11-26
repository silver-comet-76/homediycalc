import { expect, test } from "@playwright/test";

/**
 * Phase 17B-1 spot checks: depth sections render, internal links resolve
 * to real anchors with the right hrefs, the React result notes link at
 * runtime, and the homepage / hub / guide pages carry the new links.
 * Runs on Chromium desktop and Pixel 5 mobile (see playwright.config.ts).
 *
 * These are spot checks, not an exhaustive crawl of all 53 links — the
 * full link inventory is verified in the production build by script
 * (see the implementation report) and every `calc` slug is pinned by
 * src/lib/linked-text.test.ts.
 */

const DEPTH_PAGES: [string, string][] = [
  ["/calculators/concrete-calculator/", "Cubic yards vs cubic feet"],
  ["/calculators/paint-calculator/", "Raw paint, paint with waste, and gallons to buy"],
  ["/calculators/tile-calculator/", "Why the grout joint changes the tile count"],
  ["/calculators/stair-calculator/", "Metric display — the same staircase in centimeters"],
  ["/calculators/concrete-bags-calculator/", "How many 80 lb bags make one cubic yard?"],
  ["/calculators/grout-calculator/", "How grout is actually calculated"],
  ["/calculators/wallpaper-calculator/", "Count strips, not square feet"],
  ["/calculators/drywall-calculator/", "Sheets to buy vs sheets hung"],
];

test("all 8 depth pages render their depth headings and return 200", async ({ page }) => {
  for (const [url, heading] of DEPTH_PAGES) {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("depth sections sit below the lookup table and above Limitations", async ({ page }) => {
  await page.goto("/calculators/concrete-calculator/");
  const order = await page.evaluate(() => {
    const headings = [...document.querySelectorAll("h2")].map((h) => h.textContent?.trim());
    return headings;
  });
  const lookup = order.indexOf("Common sizes");
  const depth = order.indexOf("Cubic yards vs cubic feet — which number do you order by?");
  const limits = order.indexOf("Limitations");
  expect(lookup).toBeGreaterThan(-1);
  expect(depth).toBeGreaterThan(lookup);
  expect(limits).toBeGreaterThan(depth);
});

test("in-body links resolve to real anchors (B2, B3a/b, B4, B14)", async ({ page }) => {
  await page.goto("/calculators/tile-calculator/");
  const sqft = page.getByRole("link", { name: "Square Footage Calculator" });
  await expect(sqft).toHaveAttribute("href", "/calculators/square-footage-calculator/");
  const grout = page.getByRole("link", { name: "Grout Calculator" });
  await expect(grout.first()).toHaveAttribute("href", "/calculators/grout-calculator/");
  const adhesive = page.getByRole("link", { name: "Tile Adhesive Calculator" });
  await expect(adhesive.first()).toHaveAttribute("href", "/calculators/tile-adhesive-calculator/");

  await page.goto("/calculators/grout-calculator/");
  await expect(page.getByRole("link", { name: "Tile Calculator" }).first()).toHaveAttribute(
    "href",
    "/calculators/tile-calculator/",
  );

  await page.goto("/calculators/concrete-bags-calculator/");
  await expect(page.getByRole("link", { name: "Concrete Calculator" }).first()).toHaveAttribute(
    "href",
    "/calculators/concrete-calculator/",
  );
});

test("Paint and Primer result notes link at runtime (B1, B5)", async ({ page }) => {
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  const primerLink = page
    .getByRole("region", { name: "Results" })
    .getByRole("link", { name: "Primer Calculator" });
  await expect(primerLink).toHaveAttribute("href", "/calculators/primer-calculator/");

  await page.goto("/calculators/primer-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  const paintLink = page
    .getByRole("region", { name: "Results" })
    .getByRole("link", { name: "Paint Calculator" });
  await expect(paintLink).toHaveAttribute("href", "/calculators/paint-calculator/");
});

test("category guides link each calculator once (C1a, C4d, C6g)", async ({ page }) => {
  await page.goto("/categories/painting/");
  await expect(page.getByRole("link", { name: "Paint Calculator" }).first()).toHaveAttribute(
    "href",
    "/calculators/paint-calculator/",
  );
  await expect(page.getByRole("link", { name: "Primer Calculator" }).first()).toHaveAttribute(
    "href",
    "/calculators/primer-calculator/",
  );

  await page.goto("/categories/landscaping/");
  await expect(page.getByRole("link", { name: "Paver Calculator" }).first()).toHaveAttribute(
    "href",
    "/calculators/paver-calculator/",
  );

  await page.goto("/categories/interior-and-maintenance/");
  await expect(page.getByRole("link", { name: "Paint Calculator" }).first()).toHaveAttribute(
    "href",
    "/calculators/paint-calculator/",
  );
});

test("homepage Stair line and hub headings link (D1, E1–E6)", async ({ page }) => {
  await page.goto("/");
  const stair = page.getByRole("link", { name: "Stair Calculator" });
  await expect(stair).toHaveAttribute("href", "/calculators/stair-calculator/");
  await expect(page.getByText("New:")).toBeVisible();

  await page.goto("/calculators/");
  for (const [name, href, id] of [
    ["Painting", "/categories/painting/", "cat-painting"],
    ["Concrete and Masonry", "/categories/concrete-and-masonry/", "cat-concrete-and-masonry"],
    ["Flooring and Tiles", "/categories/flooring-and-tiles/", "cat-flooring-and-tiles"],
    ["Landscaping", "/categories/landscaping/", "cat-landscaping"],
    ["Measurement", "/categories/measurement/", "cat-measurement"],
    [
      "Interior and Maintenance",
      "/categories/interior-and-maintenance/",
      "cat-interior-and-maintenance",
    ],
  ] as const) {
    await expect(page.locator(`#${id}`).getByRole("link", { name })).toHaveAttribute("href", href);
  }
});

test("How We Calculate links the Stair Calculator (F1)", async ({ page }) => {
  await page.goto("/how-we-calculate/");
  await expect(page.getByRole("link", { name: "Stair Calculator" })).toHaveAttribute(
    "href",
    "/calculators/stair-calculator/",
  );
});

test("Related cards show the A1–A4 swaps", async ({ page }) => {
  await page.goto("/calculators/gravel-calculator/");
  await expect(
    page.getByRole("heading", { name: "Related calculators" }).locator("..").getByRole("link", {
      name: "Paver Calculator",
    }),
  ).toHaveAttribute("href", "/calculators/paver-calculator/");

  await page.goto("/calculators/board-foot-calculator/");
  await expect(
    page.getByRole("heading", { name: "Related calculators" }).locator("..").getByRole("link", {
      name: "Stair Calculator",
    }),
  ).toHaveAttribute("href", "/calculators/stair-calculator/");
});
