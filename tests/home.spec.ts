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
  await expect(
    page.getByRole("heading", { name: "All Calculators", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Concrete Calculator")).toBeVisible();

  // Category page via the nav.
  await page.getByRole("link", { name: "Painting", exact: true }).first().click();
  await expect(page).toHaveURL(/\/categories\/painting\/?$/);
  await expect(
    page.getByRole("heading", { name: "Painting Calculators" }),
  ).toBeVisible();
  await expect(page.getByText("Paint Calculator")).toBeVisible();
  // Breadcrumb trail is present.
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();

  // My Project page (saved items live in LocalStorage; empty to start).
  await page.getByRole("link", { name: "My Project", exact: true }).first().click();
  await expect(page).toHaveURL(/\/my-project\/?$/);
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("sitemap and robots are served", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("<loc>/</loc>");
  expect(sitemapText).toContain("<loc>/calculators/</loc>");
  expect(sitemapText).toContain("<loc>/categories/painting/</loc>");
  // Shipped calculator pages are in the sitemap — all 25 from Phase 4.
  expect(sitemapText).toContain("<loc>/calculators/concrete-calculator/</loc>");
  expect(sitemapText).toContain("<loc>/calculators/drywall-calculator/</loc>");
  expect(sitemapText).toContain("<loc>/calculators/ceiling-tile-calculator/</loc>");
  expect(sitemapText).toContain("<loc>/calculators/baseboard-calculator/</loc>");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap: /sitemap.xml");
});
