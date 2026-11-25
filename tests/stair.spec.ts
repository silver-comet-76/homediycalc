import { expect, test, type Page } from "@playwright/test";
import * as fs from "node:fs";

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

/**
 * Phase 16A Task A: results respect the selected unit system. The
 * calculation stays canonical inches; only the presentation converts.
 * Default case: 105 in rise / 10.5 in tread / 7.75 in max riser →
 * 14 risers, 13 treads, 136.5 in run, 172.21 in stringer in imperial;
 * 19.05 cm risers, 26.67 cm treads, 346.71 cm run (3.47 m), 437.42 cm
 * stringer (4.37 m) in metric.
 */
test("metric results show centimetres and metres, not inches", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  const results = page.locator('section[aria-label="Results"]');

  // Imperial defaults first (the control case).
  await expect(results).toContainText("136.5 in");
  await expect(results).toContainText("172.21 in");
  await expect(results).toContainText("7.5 in each");

  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expect(results).toContainText("346.71 cm");
  await expect(results).toContainText("3.47 m");
  await expect(results).toContainText("437.42 cm");
  await expect(results).toContainText("4.37 m");
  await expect(results).toContainText("19.05 cm each");
  await expect(results).toContainText("26.67 cm deep");
  // No inch values remain in the results.
  await expect(results).not.toContainText("136.5 in");
  await expect(results).not.toContainText("172.21 in");
  await expect(results).not.toContainText("7.5 in");
  // Riser/tread counts and the angle are unit-independent.
  await expect(results).toContainText("14 risers");
  await expect(results).toContainText("13 treads");
  await expect(results).toContainText("37.6°");

  expect(consoleErrors).toEqual([]);
});

test("switching back to imperial restores identical values (no drift)", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  const results = page.locator('section[aria-label="Results"]');

  await expect(results).toContainText("136.5 in");
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expect(results).toContainText("346.71 cm");
  await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
  // Identical to the values before the round trip — switching units
  // converts the display only and never changes the physical result.
  await expect(results).toContainText("136.5 in");
  await expect(results).toContainText("172.21 in");
  await expect(results).toContainText("7.5 in each");
  await expect(results).toContainText("14 risers");
  await expect(results).toContainText("13 treads");

  expect(consoleErrors).toEqual([]);
});

test("reset after unit switching restores the active system's defaults", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  const results = page.locator('section[aria-label="Results"]');

  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expect(page.getByLabel("Total rise")).toHaveValue("266.7");
  // 400 cm rise → 21 risers, 20 treads, 533.4 cm of run: visibly
  // different from the 346.71 cm default, so Reset is observable.
  await page.getByLabel("Total rise").fill("400");
  await expect(results).toContainText("533.4 cm");

  await page.getByRole("button", { name: "Reset" }).click();
  // Reset restores the metric defaults, not the imperial ones.
  await expect(page.getByLabel("Total rise")).toHaveValue("266.7");
  await expect(page.getByLabel("Maximum riser height")).toHaveValue("19.685");
  await expect(results).toContainText("346.71 cm");

  await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Total rise")).toHaveValue("105");
  await expect(page.getByLabel("Maximum riser height")).toHaveValue("7.75");
  await expect(results).toContainText("136.5 in");

  expect(consoleErrors).toEqual([]);
});

/**
 * Phase 16A Task B: the 151 in safety warning follows the result
 * through copy, My Project save/reload, and text + CSV export.
 */
test("151 in warning survives copy, save, reload, and export", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.getByLabel("Total rise").fill("160");
  await expect(page.getByRole("alert").first()).toContainText("151 in");

  // Copied shopping list carries the warning.
  await page.getByRole("button", { name: "Copy shopping list" }).click();
  await expect(page.getByText("Shopping list copied.")).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Warning: This rise exceeds the 2021 IRC single-flight limit");
  expect(copied).toContain("Risers: 21 at 7.62 in each");

  // Add to Project, then check My Project renders the warning.
  await page.getByRole("button", { name: "Add to Project" }).click();
  await expect(page.getByText("Saved to")).toBeVisible();
  await page.goto("/my-project/");
  await expect(page.getByRole("heading", { name: "My Project", exact: true })).toBeVisible();
  await expect(page.getByRole("alert").first()).toContainText("151 in");

  // Reload: the warning persists.
  await page.reload();
  await expect(page.getByRole("alert").first()).toContainText("151 in");

  // Text export carries the warning.
  await page.getByRole("button", { name: "Copy combined shopping list" }).click();
  await expect(page.getByText("Shopping list copied.")).toBeVisible();
  const exportedText = await page.evaluate(() => navigator.clipboard.readText());
  expect(exportedText).toContain("Warning: This rise exceeds the 2021 IRC single-flight limit");

  // CSV export carries the warning in the Warning column.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const csv = await fs.promises.readFile(downloadPath!, "utf-8");
  expect(csv).toContain("Cost note,Warning");
  expect(csv).toContain("Warning: This rise exceeds the 2021 IRC single-flight limit");

  expect(consoleErrors).toEqual([]);
});

test("151 in rise shows no warning in copy or save", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.getByLabel("Total rise").fill("151");
  await expect(page.getByRole("alert")).toHaveCount(0);

  await page.getByRole("button", { name: "Copy shopping list" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).not.toContain("Warning:");

  await page.getByRole("button", { name: "Add to Project" }).click();
  await page.goto("/my-project/");
  await expect(page.getByRole("alert")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

/**
 * Phase 16A corrective round (QA-16A-02): the physical input — not the
 * 4-decimal rounded display string — is the source of truth across unit
 * switches. 151.00001 in converts to 383.54 cm, which converts back to
 * 151 in on the display, but the rise is still over the 151 in
 * single-flight limit and the warning must survive; 383.54 cm is
 * exactly 151 in, so it must never warn. The warning is the
 * role="alert" whose text names the 151 in limit; validation errors
 * are role="alert" too, so the helpers below match on that text.
 */
async function expectRiseWarning(page: Page) {
  // NOTE: do not filter by role name here — the alert role's
  // accessible name is not computed from its text, so
  // getByRole("alert", { name: "151 in" }) never matches. Match the
  // first alert's text instead, as the older tests in this file do.
  await expect(page.getByRole("alert").first()).toContainText("151 in");
}

async function expectNoRiseWarning(page: Page) {
  // No validation error is expected at any of these points either, so
  // zero alerts means no warning.
  await expect(page.getByRole("alert")).toHaveCount(0);
}

async function switchToMetric(page: Page) {
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
}

async function switchToImperial(page: Page) {
  await page.getByRole("button", { name: "Imperial (ft, in, gal)" }).click();
}

test("safety boundary is exact in imperial", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  // Genuine below-limit value: no warning.
  await page.getByLabel("Total rise").fill("150");
  await expectNoRiseWarning(page);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // The limit itself: no warning.
  await page.getByLabel("Total rise").fill("151");
  await expectNoRiseWarning(page);

  // Just over the limit: warning.
  await page.getByLabel("Total rise").fill("151.0001");
  await expectRiseWarning(page);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Genuine above-limit value: warning.
  await page.getByLabel("Total rise").fill("160");
  await expectRiseWarning(page);

  // Back to the limit: warning clears.
  await page.getByLabel("Total rise").fill("151");
  await expectNoRiseWarning(page);

  expect(consoleErrors).toEqual([]);
});

test("safety boundary is exact in metric", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  await switchToMetric(page);

  // Genuine below-limit value (380 cm = 149.61 in): no warning.
  await page.getByLabel("Total rise").fill("380");
  await expectNoRiseWarning(page);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // 383.54 cm is exactly 151 in (151 × 2.54): no warning. Binary
  // floating point converts it to 151.00000000000003 in, which must
  // not flip the classification.
  await page.getByLabel("Total rise").fill("383.54");
  await expectNoRiseWarning(page);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // 0.00001 cm over the exact metric limit: warning.
  await page.getByLabel("Total rise").fill("383.54001");
  await expectRiseWarning(page);

  // 0.0001 cm over: warning.
  await page.getByLabel("Total rise").fill("383.5401");
  await expectRiseWarning(page);

  // Genuine above-limit value (390 cm = 153.54 in): warning.
  await page.getByLabel("Total rise").fill("390");
  await expectRiseWarning(page);

  // Back to the exact metric limit: warning clears.
  await page.getByLabel("Total rise").fill("383.54");
  await expectNoRiseWarning(page);

  expect(consoleErrors).toEqual([]);
});

test("over-limit decimal rise keeps its warning across unit switches", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Total rise").fill("151.00001");
  await expectRiseWarning(page);
  await expect(page.locator('section[aria-label="Results"]')).toContainText("20 risers");

  await switchToMetric(page);
  // The display rounds to 4 decimals (383.54 cm), but the warning
  // must survive: the physical rise is still 151.00001 in.
  await expect(page.getByLabel("Total rise")).toHaveValue("383.54");
  await expectRiseWarning(page);

  await switchToImperial(page);
  await expectRiseWarning(page);

  await switchToMetric(page);
  await expect(page.getByLabel("Total rise")).toHaveValue("383.54");
  await expectRiseWarning(page);

  expect(consoleErrors).toEqual([]);
});

test("ten round trips preserve the warning for an over-limit rise", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Total rise").fill("151.00001");
  await expectRiseWarning(page);

  for (let i = 0; i < 10; i++) {
    await switchToMetric(page);
    await expect(page.getByLabel("Total rise")).toHaveValue("383.54");
    await expectRiseWarning(page);
    await switchToImperial(page);
    // The imperial display rounds to 4 decimals, so it reads "151"
    // after a round trip — the classification, not the display
    // string, is what must not change.
    await expectRiseWarning(page);
  }

  expect(consoleErrors).toEqual([]);
});

test("ten round trips preserve no-warning for an at-limit rise", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Total rise").fill("151");
  await expectNoRiseWarning(page);

  for (let i = 0; i < 10; i++) {
    await switchToMetric(page);
    await expect(page.getByLabel("Total rise")).toHaveValue("383.54");
    await expectNoRiseWarning(page);
    await switchToImperial(page);
    await expect(page.getByLabel("Total rise")).toHaveValue("151");
    await expectNoRiseWarning(page);
  }

  expect(consoleErrors).toEqual([]);
});

test("editing the rise in metric after switching governs the warning", async ({ page }) => {
  const consoleErrors = await gotoStair(page);

  await page.getByLabel("Total rise").fill("151");
  await expectNoRiseWarning(page);

  await switchToMetric(page);
  await expect(page.getByLabel("Total rise")).toHaveValue("383.54");
  await expectNoRiseWarning(page);

  // Edit in metric to an over-limit value: the edited value governs.
  await page.getByLabel("Total rise").fill("400");
  await expectRiseWarning(page);

  await switchToImperial(page);
  await expect(page.getByLabel("Total rise")).toHaveValue("157.4803");
  await expectRiseWarning(page);

  await switchToMetric(page);
  await expect(page.getByLabel("Total rise")).toHaveValue("400");
  await expectRiseWarning(page);

  // Edit in metric back below the limit: the warning clears and stays
  // cleared on the way back.
  await page.getByLabel("Total rise").fill("300");
  await expectNoRiseWarning(page);

  await switchToImperial(page);
  await expect(page.getByLabel("Total rise")).toHaveValue("118.1102");
  await expectNoRiseWarning(page);

  await switchToMetric(page);
  await expect(page.getByLabel("Total rise")).toHaveValue("300");
  await expectNoRiseWarning(page);

  expect(consoleErrors).toEqual([]);
});

test("reset after switching and editing restores defaults and warning state", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  const results = page.locator('section[aria-label="Results"]');

  // Over-limit in imperial, then switch and Reset in metric.
  await page.getByLabel("Total rise").fill("160");
  await expectRiseWarning(page);
  await switchToMetric(page);
  await expect(page.getByLabel("Total rise")).toHaveValue("406.4");
  await expectRiseWarning(page);

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Total rise")).toHaveValue("266.7");
  await expectNoRiseWarning(page);
  await expect(results).toContainText("346.71 cm");

  // Over-limit again in imperial, then Reset in imperial.
  await switchToImperial(page);
  await page.getByLabel("Total rise").fill("160");
  await expectRiseWarning(page);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Total rise")).toHaveValue("105");
  await expectNoRiseWarning(page);
  await expect(results).toContainText("136.5 in");

  expect(consoleErrors).toEqual([]);
});

test("metric-entered over-limit warning survives copy, save, reload, and export", async ({
  page,
}) => {
  const consoleErrors = await gotoStair(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  await switchToMetric(page);
  await page.getByLabel("Total rise").fill("400");
  await expectRiseWarning(page);

  // Copied shopping list carries the warning.
  await page.getByRole("button", { name: "Copy shopping list" }).click();
  await expect(page.getByText("Shopping list copied.")).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Warning: This rise exceeds the 2021 IRC single-flight limit");
  expect(copied).toContain("Risers: 21 at 19.05 cm each");

  // Add to Project, then check My Project renders the warning.
  await page.getByRole("button", { name: "Add to Project" }).click();
  await expect(page.getByText("Saved to")).toBeVisible();
  await page.goto("/my-project/");
  await expect(page.getByRole("heading", { name: "My Project", exact: true })).toBeVisible();
  await expect(page.getByRole("alert").first()).toContainText("151 in");

  // Reload: the warning persists.
  await page.reload();
  await expect(page.getByRole("alert").first()).toContainText("151 in");

  // Text export carries the warning.
  await page.getByRole("button", { name: "Copy combined shopping list" }).click();
  await expect(page.getByText("Shopping list copied.")).toBeVisible();
  const exportedText = await page.evaluate(() => navigator.clipboard.readText());
  expect(exportedText).toContain("Warning: This rise exceeds the 2021 IRC single-flight limit");

  // CSV export carries the warning in the Warning column.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const csv = await fs.promises.readFile(downloadPath!, "utf-8");
  expect(csv).toContain("Cost note,Warning");
  expect(csv).toContain("Warning: This rise exceeds the 2021 IRC single-flight limit");

  expect(consoleErrors).toEqual([]);
});

test("minimum tread and maximum riser are enforced in metric", async ({ page }) => {
  const consoleErrors = await gotoStair(page);
  await switchToMetric(page);

  // Minimum tread: 25.4 cm (= 10 in) is accepted, anything below is rejected.
  await page.getByLabel("Tread depth").fill("25.4");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  await page.getByLabel("Tread depth").fill("25.39");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Tread depth").fill("25");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Tread depth").fill("25.4");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  // Maximum riser: 19.685 cm (= 7.75 in) is accepted, anything above is rejected.
  await page.getByLabel("Maximum riser height").fill("19.685");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  await page.getByLabel("Maximum riser height").fill("19.686");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Maximum riser height").fill("20.32");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0);

  await page.getByLabel("Maximum riser height").fill("19.685");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
