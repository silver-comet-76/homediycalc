import { expect, test, type Page } from "@playwright/test";

/**
 * Stair Calculator IRC enforcement (ChatGPT second-review remediation):
 * the 7.75 in maximum riser (2021 IRC R311.7.5.1) is enforced in both
 * imperial and metric units, the 10 in minimum tread depth (R311.7.5.2)
 * is enforced, and a rise over the 151 in single-flight limit
 * (R311.7.3) shows a prominent noncompliance warning while still
 * showing the numbers as a planning estimate.
 * Runs on Chromium desktop and Pixel 5 mobile (see playwright.config.ts).
 */

async function gotoStair(page: Page) {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto("/calculators/stair-calculator/");
  await expect(page.getByRole("heading", { name: "Stair Calculator", exact: true })).toBeVisible();
  // Wait for the island to hydrate before interacting: the server-rendered
  // inputs accept typing before hydration, and React would then discard it.
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  return consoleErrors;
}

test("max riser 8 in is rejected (imperial)", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Maximum riser height").fill("8");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // The IRC maximum itself is accepted again.
  await page.getByLabel("Maximum riser height").fill("7.75");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("max riser 10 in is rejected (imperial)", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Maximum riser height").fill("10");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Maximum riser height").fill("7.75");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("max riser is rejected in metric units", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  // The metric default (19.685 cm = 7.75 in exactly) loads valid — this
  // guards the defaultMet fix; a 19.7 cm default would be rejected here.
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  // 20.32 cm = 8 in: above the 19.685 cm cap.
  await page.getByLabel("Maximum riser height").fill("20.32");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // 25.4 cm = 10 in: above the cap.
  await page.getByLabel("Maximum riser height").fill("25.4");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // 19.685 cm = 7.75 in: the cap itself is accepted.
  await page.getByLabel("Maximum riser height").fill("19.685");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("rise over 151 in shows a noncompliance warning", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Total rise").fill("160");
  // The warning names the limit; the numbers are still shown below it as
  // a planning estimate, with Add to Project still available.
  await expect(page.getByRole("alert").first()).toContainText("151 in");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Project" })).toBeVisible();

  // 151 in is the limit itself — no warning.
  await page.getByLabel("Total rise").fill("151");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("tread below 10 in is rejected", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Tread depth").fill("9.5");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Tread depth").fill("10");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
