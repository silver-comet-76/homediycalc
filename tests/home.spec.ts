import { expect, test } from "@playwright/test";

test("home page loads, nav works, no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/HomeDIYCalc/);
  await expect(
    page.getByRole("heading", {
      name: "Calculate Materials. Estimate Costs. Build Your Shopping List.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browse by category" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Most popular calculators" })).toBeVisible();

  // Header nav: All Calculators.
  await page.getByRole("link", { name: "All Calculators", exact: true }).first().click();
  await expect(page).toHaveURL(/\/calculators\/?$/);
  await expect(page.getByRole("heading", { name: "All Calculators", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Concrete Calculator" })).toBeVisible();

  // Category page via the nav.
  await page.getByRole("link", { name: "Painting", exact: true }).first().click();
  await expect(page).toHaveURL(/\/categories\/painting\/?$/);
  await expect(page.getByRole("heading", { name: "Painting Calculators" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Paint Calculator" })).toBeVisible();
  // Breadcrumb trail is present.
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();

  // My Project page (saved items live in LocalStorage; empty to start).
  await page.getByRole("link", { name: "My Project", exact: true }).first().click();
  await expect(page).toHaveURL(/\/my-project\/?$/);
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("sitemap and robots are served", async ({ request }) => {
  // The build under test decides the expected URLs (ADR-15): a
  // production/preview-with-origin build uses absolute URLs with
  // exactly that origin; a local build stays relative.
  const origin = process.env.PUBLIC_SITE_URL ?? "";
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain(`<loc>${origin}/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/categories/painting/</loc>`);
  // Shipped calculator pages are in the sitemap — all 25 from Phase 4.
  expect(sitemapText).toContain(`<loc>${origin}/calculators/concrete-calculator/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/drywall-calculator/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/ceiling-tile-calculator/</loc>`);
  expect(sitemapText).toContain(`<loc>${origin}/calculators/baseboard-calculator/</loc>`);

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
});

test("noindex and canonical follow the build mode (Phase 8, ADR-15)", async ({ page }) => {
  // Production (origin set, no preview flag): indexable — no noindex
  // tag, absolute canonical with exactly the origin. Preview
  // (PUBLIC_PREVIEW=true) and local (no origin): fail-closed noindex
  // on every page, canonical relative (local) or absolute with the
  // origin (preview). The gate audit checks all 40 pages per mode;
  // this test checks the rendered home page.
  const origin = process.env.PUBLIC_SITE_URL ?? "";
  const isPreview = process.env.PUBLIC_PREVIEW === "true";
  await page.goto("/");
  const noindex = page.locator('meta[name="robots"][content*="noindex"]');
  const canonical = page.locator('link[rel="canonical"]');
  if (origin !== "" && !isPreview) {
    await expect(noindex).toHaveCount(0);
    await expect(canonical).toHaveAttribute("href", `${origin}/`);
  } else {
    await expect(noindex).toHaveCount(1);
    await expect(canonical).toHaveAttribute("href", `${origin}/`);
  }
});
