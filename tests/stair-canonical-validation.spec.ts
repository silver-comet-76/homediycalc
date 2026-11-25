import { expect, test, type Page } from "@playwright/test";

/**
 * QA-16A-05 (second corrective round, blocking): canonical validation
 * mismatch. GenericCalculator validated the rounded DISPLAY value
 * against display bounds but computed from the RETAINED canonical
 * value. After a unit switch the rounded display can pass validation
 * while the retained canonical violates the formula's hard bounds —
 * then calculateStair() throws during render (uncaught exception /
 * island crash) instead of showing a validation error.
 *
 * The four cases use the repo's actual conversion constants
 * (1 in = 2.54 cm). In each case the invalid value is entered in one
 * system (where it is correctly rejected), then the system is switched:
 * the display rounds to the bound and would pass, but the retained
 * canonical still violates it — so the field must stay invalid, with
 * an error that states the precise physical value.
 *
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
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  return consoleErrors;
}

async function expectCanonicalError(page: Page, preciseValue: string) {
  // Exactly one validation error: the offending field. It must state
  // the precise physical value (enough decimals to show the excess
  // over the bound), not just the rounded display value.
  await expect(page.getByRole("alert")).toHaveCount(1);
  await expect(page.getByRole("alert").first()).toContainText(preciseValue);
  // No result, nothing copyable, nothing saveable.
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy shopping list" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add to Project" })).toHaveCount(0);
}

test("max riser 7.75001 in stays invalid after switching to metric", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  // In imperial the value itself is above the 7.75 in cap: rejected.
  await page.getByLabel("Maximum riser height").fill("7.75001");
  await expect(page.getByRole("alert").first()).toContainText("7.75 or less");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // Switch to metric: the display rounds to 19.685 cm (the cap), but
  // the retained canonical is still 7.75001 in — over the cap.
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expect(page.getByLabel("Maximum riser height")).toHaveValue("19.685");
  // 7.75001 in = 19.6850254 cm — the error must show the excess.
  await expectCanonicalError(page, "19.6850254");

  expect(consoleErrors).toEqual([]);
});

test("tread depth 9.99999 in stays invalid after switching to metric", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  // In imperial the value itself is below the 10 in minimum: rejected.
  await page.getByLabel("Tread depth").fill("9.99999");
  await expect(page.getByRole("alert").first()).toContainText("at least 10");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // Switch to metric: the display rounds to 25.4 cm (the minimum),
  // but the retained canonical is still 9.99999 in — under it.
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expect(page.getByLabel("Tread depth")).toHaveValue("25.4");
  // 9.99999 in = 25.3999746 cm — the error must show the shortfall.
  await expectCanonicalError(page, "25.3999746");

  expect(consoleErrors).toEqual([]);
});

test("max riser 19.68501 cm stays invalid after switching to imperial", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  // In metric the value itself is above the 19.685 cm cap: rejected.
  await page.getByLabel("Maximum riser height").fill("19.68501");
  await expect(page.getByRole("alert").first()).toContainText("19.685 or less");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // Switch to imperial: the display rounds to 7.75 in (the cap), but
  // the retained canonical is still 7.750003937 in — over the cap.
  await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
  await expect(page.getByLabel("Maximum riser height")).toHaveValue("7.75");
  // 19.68501 cm = 7.750003937 in — the error must show the excess.
  await expectCanonicalError(page, "7.750003937");

  expect(consoleErrors).toEqual([]);
});

test("tread depth 25.39999 cm stays invalid after switching to imperial", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  // In metric the value itself is below the 25.4 cm minimum: rejected.
  await page.getByLabel("Tread depth").fill("25.39999");
  await expect(page.getByRole("alert").first()).toContainText("at least 25.4");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  // Switch to imperial: the display rounds to 10 in (the minimum),
  // but the retained canonical is still 9.999996063 in — under it.
  await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
  await expect(page.getByLabel("Tread depth")).toHaveValue("10");
  // 25.39999 cm = 9.999996063 in — the error must show the shortfall.
  await expectCanonicalError(page, "9.999996063");

  expect(consoleErrors).toEqual([]);
});

test("canonical error survives repeated unit switches", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Maximum riser height").fill("7.75001");
  await expect(page.getByRole("alert").first()).toBeVisible();

  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
    await expect(page.getByLabel("Maximum riser height")).toHaveValue("19.685");
    await expectCanonicalError(page, "19.6850254");
    await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
    // The imperial display rounds the retained 7.75001 in to "7.75",
    // but the canonical check still flags it — the error must state
    // the precise physical value, not the rounded display.
    await expect(page.getByLabel("Maximum riser height")).toHaveValue("7.75");
    await expect(page.getByRole("alert").first()).toContainText("7.75001");
    await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);
  }

  expect(consoleErrors).toEqual([]);
});

test("editing a canonically invalid field to a valid value recovers", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Maximum riser height").fill("7.75001");
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expectCanonicalError(page, "19.6850254");

  // A deliberate edit in metric becomes authoritative: 19.5 cm is
  // within the cap, so the error clears and results return.
  await page.getByLabel("Maximum riser height").fill("19.5");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Editing back to an invalid value in metric is rejected again.
  await page.getByLabel("Maximum riser height").fill("19.68501");
  await expect(page.getByRole("alert").first()).toContainText("19.685 or less");
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("reset clears a canonical error and restores valid defaults", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Tread depth").fill("9.99999");
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expectCanonicalError(page, "25.3999746");

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Tread depth")).toHaveValue("26.67");
  await expect(page.getByLabel("Maximum riser height")).toHaveValue("19.685");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("exact bound values stay valid across switches (no false positive)", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  // The caps themselves are valid in both systems and must not be
  // flagged by the canonical check (conversion noise must not flip
  // an exact-boundary value to invalid).
  await page.getByLabel("Maximum riser height").fill("7.75");
  await page.getByLabel("Tread depth").fill("10");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expect(page.getByLabel("Maximum riser height")).toHaveValue("19.685");
  await expect(page.getByLabel("Tread depth")).toHaveValue("25.4");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
  await expect(page.getByLabel("Maximum riser height")).toHaveValue("7.75");
  await expect(page.getByLabel("Tread depth")).toHaveValue("10");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
