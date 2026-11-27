import { expect, test } from "@playwright/test";

test("home page loads, nav works, no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/HomeDIYCalc/);
  // Homepage visual prototype (Direction A: Modern DIY) — approved V1 copy.
  await expect(
    page.getByRole("heading", {
      name: "Less Guesswork. Better DIY Projects.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "What Are You Working On?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Next Project Starts Here" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "From Measurements to Materials in 3 Easy Steps" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Practical Tools. No Extra Hassle." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Painting a Room?" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ready to Get Your Project Started?" }),
  ).toBeVisible();
  // Hero CTAs and the featured Paint demo (verified calculator defaults).
  await expect(page.getByRole("link", { name: "Explore Calculators" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Try Paint Calculator" }).first()).toBeVisible();
  await expect(page.getByText("381 ft²").first()).toBeVisible();
  await expect(page.getByText("2.18 gal").first()).toBeVisible();

  // Header nav: All Calculators.
  await page.getByRole("link", { name: "All Calculators", exact: true }).first().click();
  await expect(page).toHaveURL(/\/calculators\/?$/);
  await expect(page.getByRole("heading", { name: "All Calculators", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Concrete Calculator" })).toBeVisible();

  // Category page via the nav.
  await page.getByRole("link", { name: "Painting", exact: true }).first().click();
  await expect(page).toHaveURL(/\/categories\/painting\/?$/);
  await expect(page.getByRole("heading", { name: "Painting Calculators" })).toBeVisible();
  // The category guide (Phase 17B-1 Tranche D, C1a) also links the Paint
  // Calculator in its first paragraph, so the name matches two links on
  // this page; .first() is the calculator card, the link this test has
  // always checked.
  await expect(page.getByRole("link", { name: "Paint Calculator" }).first()).toBeVisible();
  // Breadcrumb trail is present.
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();

  // My Project page (saved items live in LocalStorage; empty to start).
  await page.getByRole("link", { name: "My Project", exact: true }).first().click();
  await expect(page).toHaveURL(/\/my-project\/?$/);
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("homepage CTAs navigate to the right pages", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Less Guesswork. Better DIY Projects." }),
  ).toBeVisible();

  // Hero primary CTA.
  await page.getByRole("link", { name: "Explore Calculators", exact: true }).click();
  await expect(page).toHaveURL(/\/calculators\/?$/);
  await expect(page.getByRole("heading", { name: "All Calculators", exact: true })).toBeVisible();

  // Hero secondary CTA.
  await page.goto("/");
  await page.getByRole("link", { name: "Try Paint Calculator", exact: true }).click();
  await expect(page).toHaveURL(/\/calculators\/paint-calculator\/?$/);
  await expect(page.getByRole("heading", { name: "Paint Calculator" })).toBeVisible();

  // Project-type tile (Painting) — scoped to the categories section so
  // the header nav link to the same URL is not the one clicked.
  await page.goto("/");
  await page
    .locator("section[aria-labelledby='categories-heading'] a[href='/categories/painting/']")
    .click();
  await expect(page).toHaveURL(/\/categories\/painting\/?$/);
  await expect(page.getByRole("heading", { name: "Painting Calculators" })).toBeVisible();

  // Featured calculator card (Paint) — scoped to the featured section.
  await page.goto("/");
  await page
    .locator("section[aria-labelledby='featured-heading'] a[href='/calculators/paint-calculator/']")
    .click();
  await expect(page).toHaveURL(/\/calculators\/paint-calculator\/?$/);
  await expect(page.getByRole("heading", { name: "Paint Calculator" })).toBeVisible();

  // Demo CTA.
  await page.goto("/");
  await page
    .locator("section[aria-labelledby='demo-heading'] a[href='/calculators/paint-calculator/']")
    .first()
    .click();
  await expect(page).toHaveURL(/\/calculators\/paint-calculator\/?$/);
  await expect(page.getByRole("heading", { name: "Paint Calculator" })).toBeVisible();

  // Closing CTA.
  await page.goto("/");
  await page.getByRole("link", { name: "Explore Free Calculators", exact: true }).click();
  await expect(page).toHaveURL(/\/calculators\/?$/);
  await expect(page.getByRole("heading", { name: "All Calculators", exact: true })).toBeVisible();
});

test("sitemap and robots are served", async ({ request }) => {
  // The build under test decides the expected URLs (ADR-17): a
  // production or preview build with an origin uses absolute URLs
  // with exactly that origin; a local build stays relative — even
  // when an origin variable is set, because a local build ignores
  // the origin for URL generation (origin alone never implies
  // production).
  const mode = process.env.PUBLIC_BUILD_MODE ?? "";
  const origin =
    mode === "production" || mode === "preview" ? (process.env.PUBLIC_SITE_URL ?? "") : "";
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain(`<loc>${origin}/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/categories/painting/</loc>`);
  // Shipped calculator pages are in the sitemap — all 26 from Phase 15.
  expect(sitemapText).toContain(`<loc>${origin}/calculators/concrete-calculator/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/drywall-calculator/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/ceiling-tile-calculator/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/baseboard-calculator/</loc>`);

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
});

test("noindex and canonical follow the build mode (Phase 8, ADR-17)", async ({ page }) => {
  // Production (PUBLIC_BUILD_MODE=production + a valid origin):
  // indexable — no noindex tag, absolute canonical with exactly the
  // origin. Preview (mode=preview, or the legacy PUBLIC_PREVIEW=true)
  // and local (anything else, including an origin with no mode):
  // fail-closed noindex on every page, canonical absolute with the
  // origin (preview with an origin) or relative (local, which ignores
  // the origin). The gate audit checks all 40 pages per mode; this
  // test checks the rendered home page.
  const mode =
    process.env.PUBLIC_BUILD_MODE ?? (process.env.PUBLIC_PREVIEW === "true" ? "preview" : "local");
  const origin =
    mode === "production" || mode === "preview" ? (process.env.PUBLIC_SITE_URL ?? "") : "";
  await page.goto("/");
  const noindex = page.locator('meta[name="robots"][content*="noindex"]');
  const canonical = page.locator('link[rel="canonical"]');
  if (mode === "production") {
    await expect(noindex).toHaveCount(0);
    await expect(canonical).toHaveAttribute("href", `${origin}/`);
  } else {
    await expect(noindex).toHaveCount(1);
    await expect(canonical).toHaveAttribute("href", `${origin}/`);
  }
});
