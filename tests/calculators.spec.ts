import { expect, test } from "@playwright/test";

/**
 * One test per P0/P1 calculator: the page loads, the default calculation
 * renders, an invalid input shows an inline error (and suppresses the
 * result), Reset restores the default result, and Add to Project saves.
 * Runs on Chromium desktop and Pixel 5 mobile (see playwright.config.ts).
 */

const CALCULATORS = [
  { slug: "concrete-calculator", name: "Concrete Calculator" },
  { slug: "square-footage-calculator", name: "Square Footage Calculator" },
  { slug: "paint-calculator", name: "Paint Calculator" },
  { slug: "gravel-calculator", name: "Gravel Calculator" },
  { slug: "mulch-calculator", name: "Mulch Calculator" },
  { slug: "concrete-slab-calculator", name: "Concrete Slab Calculator" },
  { slug: "cubic-yard-calculator", name: "Cubic Yard Calculator" },
  { slug: "cubic-feet-calculator", name: "Cubic Feet Calculator" },
  { slug: "tile-calculator", name: "Tile Calculator" },
  { slug: "brick-calculator", name: "Brick Calculator" },
  { slug: "drywall-calculator", name: "Drywall Calculator" },
  { slug: "concrete-bags-calculator", name: "Concrete Bags Calculator" },
  { slug: "flooring-calculator", name: "Flooring Calculator" },
  { slug: "paver-calculator", name: "Paver Calculator" },
  { slug: "topsoil-calculator", name: "Topsoil Calculator" },
  { slug: "grout-calculator", name: "Grout Calculator" },
  { slug: "board-foot-calculator", name: "Board Foot Calculator" },
  { slug: "mortar-calculator", name: "Mortar Calculator" },
  { slug: "ceiling-tile-calculator", name: "Ceiling Tile Calculator" },
  { slug: "tile-adhesive-calculator", name: "Tile Adhesive Calculator" },
  { slug: "primer-calculator", name: "Primer Calculator" },
  { slug: "wallpaper-calculator", name: "Wallpaper Calculator" },
  { slug: "sealant-calculator", name: "Sealant Calculator" },
  { slug: "waterproofing-calculator", name: "Waterproofing Calculator" },
  { slug: "baseboard-calculator", name: "Baseboard Calculator" },
  { slug: "stair-calculator", name: "Stair Calculator" },
] as const;

for (const { slug, name } of CALCULATORS) {
  test(`${name}: loads, default result renders, invalid input errors, reset works`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto(`/calculators/${slug}/`);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    // Wait for the island to hydrate before interacting: the server-rendered
    // inputs accept typing before hydration, and React would then discard it.
    await expect(page.locator("[data-hydrated='true']")).toBeVisible();
    // Default calculation renders (the island ships with filled defaults).
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy shopping list" })).toBeVisible();

    // Invalid input: a negative number shows an inline error and hides results.
    const firstInput = page.locator("input[type='number']").first();
    await firstInput.fill("-1");
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

    // Reset restores the defaults and the result.
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);

    // Add to Project saves the result to LocalStorage.
    await page.getByRole("button", { name: "Add to Project" }).click();
    await expect(page.getByText("Saved to")).toBeVisible();
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem("homediycalc:project:v1");
      return raw ? (JSON.parse(raw) as { items: { calculatorSlug: string }[] }).items : [];
    });
    expect(saved.some((item) => item.calculatorSlug === slug)).toBe(true);

    expect(consoleErrors).toEqual([]);
  });
}

test("calculator pages appear in the sitemap; all 26 calculators are shipped", async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const text = await sitemap.text();
  // Origin-aware (ADR-15): a production/preview-with-origin build
  // lists absolute <loc> URLs; a local build lists relative ones.
  const origin = process.env.PUBLIC_SITE_URL ?? "";
  for (const { slug } of CALCULATORS) {
    expect(text).toContain(`<loc>${origin}/calculators/${slug}/</loc>`);
  }
  expect(CALCULATORS).toHaveLength(26);
});
