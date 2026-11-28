import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

/**
 * Workstream D (Phase 17B2 corrective round): purchase alternatives
 * are mutually exclusive end to end — result panel, shopping list,
 * My Project (save + reload), CSV export, pricing, reset, and metric.
 *
 * Sand (bulk vs bags), Raised Bed Soil (premixed bags vs premixed
 * bulk vs mix components), Sod (rolls vs pallets), Lawn Seed (bags
 * vs bulk by the pound). Fence has no purchase alternatives, so it
 * is verified to have no "Buy as" select and to save all four of its
 * distinct materials.
 *
 * Hand-derived expectations (defaults):
 * - Sand 10 × 10 ft, 4 in, 10% waste: bulk 2 yd³, 74 bags; $40/yd³
 *   and $5/bag give $80.00 bulk, $370.00 bags.
 * - Raised bed 8 × 4 ft, 10 in, 10% settling, 60/30/10: bulk 2 yd³,
 *   15 bags of 2 ft³, mix 17.6 / 8.8 / 2.93 ft³; $45/yd³ and $8/bag
 *   give $90.00 bulk, $120.00 bags.
 * - Sod 20 × 30 ft, 10% waste: 66 rolls, 2 pallets (last partial,
 *   210 ft² of it); $200/pallet and $8/roll give $400.00 pallets,
 *   $528.00 rolls.
 * - Lawn seed 50 × 100 ft, 7 lb per 1,000 ft², 10% buffer: 38.5 lb,
 *   bags 3 × 10 lb + 3 × 3 lb (39 lb); $2/lb gives $78.00 bags,
 *   $77.00 bulk.
 */

async function openCalculator(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/calculators/${slug}/`);
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
}

/**
 * The Results section only. Row values also appear in the lookup
 * table and the worked example/FAQ text below the calculator, so a
 * page-wide getByText would match several elements (strict-mode
 * violation) — scope result assertions here.
 */
function results(page: import("@playwright/test").Page) {
  return page.locator('section[aria-label="Results"]');
}

async function clearProject(page: import("@playwright/test").Page) {
  await page.goto("/my-project/");
  await page.evaluate(() => localStorage.removeItem("homediycalc:project:v1"));
  await page.reload();
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();
}

async function addToProject(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Add to Project" }).click();
  await expect(page.getByText("Saved to")).toBeVisible();
}

async function openMyProject(page: import("@playwright/test").Page) {
  await page.goto("/my-project/");
  await expect(page.getByRole("heading", { name: "My Project", exact: true })).toBeVisible();
}

function consoleErrorCollector(page: import("@playwright/test").Page) {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  return consoleErrors;
}

test("sand: default bulk — both rows visible, only the bulk line is saved, CSV, reload", async ({
  page,
}) => {
  const consoleErrors = consoleErrorCollector(page);
  await clearProject(page);

  await openCalculator(page, "sand-calculator");
  // Both forms stay visible as results, the other labelled alternative.
  await expect(results(page).getByText("2 yd³").first()).toBeVisible();
  // Scope to the Bags row: the bulk-order weight detail now also
  // mentions "74 bags" (R02 bagged-order alternative), so a bare
  // getByText("74 bags") is ambiguous.
  await expect(results(page).locator('dl > div:has(> dt:text-is("Bags")) > dd')).toContainText(
    "74 bags",
  );
  await expect(
    results(page).getByText(
      "Buy bulk or bags, not both — the shopping list contains only the bulk order.",
    ),
  ).toBeVisible();
  await page.getByLabel("Price per cubic yard (optional)").fill("40");
  await page.getByLabel("Price per bag (optional)").fill("5");
  await expect(results(page).getByText("$80.00")).toBeVisible();
  await addToProject(page);

  await openMyProject(page);
  await expect(page.getByText("Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))")).toBeVisible();
  await expect(page.getByText("Sand bags")).toHaveCount(0);
  await expect(page.getByText("Line total: $80.00 ($80.00 × 1)")).toBeVisible();

  // Reload: the saved single line survives LocalStorage persistence.
  await page.reload();
  await expect(page.getByText("Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))")).toBeVisible();
  await expect(page.getByText("Sand bags")).toHaveCount(0);

  // CSV export carries the chosen form only.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path as string, "utf-8");
  expect(csv).toContain("Sand (bulk): 2 yd³");
  expect(csv).not.toContain("Sand bags");
  expect(csv).toContain("80.00");

  expect(consoleErrors).toEqual([]);
});

test("sand: bags selected — only the bag line is saved, priced at $370.00; Reset restores bulk", async ({
  page,
}) => {
  const consoleErrors = consoleErrorCollector(page);
  await clearProject(page);

  await openCalculator(page, "sand-calculator");
  await page.getByLabel("Buy as").selectOption({ label: "Bags" });
  await expect(
    results(page).getByText(
      "Buy bulk or bags, not both — the shopping list contains only the bags.",
    ),
  ).toBeVisible();
  await page.getByLabel("Price per cubic yard (optional)").fill("40");
  await page.getByLabel("Price per bag (optional)").fill("5");
  await expect(results(page).getByText("$370.00")).toBeVisible();
  await addToProject(page);

  await openMyProject(page);
  await expect(page.getByText("Sand bags (0.5 ft³ each): 74")).toBeVisible();
  await expect(page.getByText("Sand (bulk)")).toHaveCount(0);
  await expect(page.getByText("Line total: $370.00 ($370.00 × 1)")).toBeVisible();

  // Reset returns to the default purchase method (bulk), with prices cleared.
  await openCalculator(page, "sand-calculator");
  await page.getByLabel("Buy as").selectOption({ label: "Bags" });
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Buy as")).toHaveValue("0");
  await expect(
    results(page).getByText(
      "Buy bulk or bags, not both — the shopping list contains only the bulk order.",
    ),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("sand: metric gives the same saved bulk line as imperial", async ({ page }) => {
  const consoleErrors = consoleErrorCollector(page);
  await clearProject(page);

  await openCalculator(page, "sand-calculator");
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  await expect(results(page).getByText("2 yd³").first()).toBeVisible();
  await addToProject(page);

  await openMyProject(page);
  await expect(page.getByText("Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))")).toBeVisible();
  await expect(page.getByText("Sand bags")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("raised bed: default bags, then components, then bulk — each saves only its own form", async ({
  page,
}) => {
  const consoleErrors = consoleErrorCollector(page);
  await clearProject(page);

  // Default: premixed bags. The mix row stays on the page as
  // composition, but no component line is saved.
  await openCalculator(page, "raised-bed-soil-calculator");
  await expect(results(page).getByText("15 bags")).toBeVisible();
  await expect(results(page).getByText("17.6 / 8.8 / 2.93 ft³")).toBeVisible();
  await addToProject(page);
  await openMyProject(page);
  await expect(page.getByText("Raised bed soil bags (2 ft³ each): 15")).toBeVisible();
  await expect(page.getByText("Raised bed soil (bulk)")).toHaveCount(0);
  await expect(page.getByText("Topsoil:")).toHaveCount(0);

  // Components separately: the three parts are the whole list, no cost.
  await openCalculator(page, "raised-bed-soil-calculator");
  await page.getByLabel("Buy as").selectOption({ label: "Mix components separately" });
  await expect(results(page).getByText("no cost is shown for this choice")).toBeVisible();
  await addToProject(page);
  await openMyProject(page);
  await expect(page.getByText("Topsoil: 17.6 ft³")).toBeVisible();
  await expect(page.getByText("Compost: 8.8 ft³")).toBeVisible();
  await expect(page.getByText("Perlite: 2.93 ft³")).toBeVisible();
  await expect(page.getByText("Raised bed soil bags")).toHaveCount(1);

  // Bulk with both prices: $90.00, and only the bulk line is saved.
  await clearProject(page);
  await openCalculator(page, "raised-bed-soil-calculator");
  await page.getByLabel("Buy as").selectOption({ label: "Premixed soil — bulk" });
  await page.getByLabel("Price per cubic yard (optional)").fill("45");
  await page.getByLabel("Price per bag (optional)").fill("8");
  await expect(results(page).getByText("$90.00")).toBeVisible();
  await addToProject(page);
  await openMyProject(page);
  await expect(page.getByText("Raised bed soil (bulk): 2 yd³")).toBeVisible();
  await expect(page.getByText("Raised bed soil bags")).toHaveCount(0);
  await expect(page.getByText("Line total: $90.00 ($90.00 × 1)")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("sod: default pallets keep the partial-pallet flag; rolls save only rolls at $528.00", async ({
  page,
}) => {
  const consoleErrors = consoleErrorCollector(page);
  await clearProject(page);

  await openCalculator(page, "sod-calculator");
  await expect(results(page).getByText("66 rolls")).toBeVisible();
  await expect(results(page).getByText("2 pallets")).toBeVisible();
  await addToProject(page);
  await openMyProject(page);
  await expect(
    page.getByText(
      "Sod (pallets): 2 pallets (450 ft² each) — last pallet is partial, you need only 210 ft² of it",
    ),
  ).toBeVisible();
  await expect(page.getByText("Sod (rolls)")).toHaveCount(0);

  // Rolls with both prices: $528.00, and only the roll line is saved.
  await clearProject(page);
  await openCalculator(page, "sod-calculator");
  await page.getByLabel("Buy as").selectOption({ label: "Rolls" });
  await page.getByLabel("Price per roll (optional)").fill("8");
  await page.getByLabel("Price per pallet (optional)").fill("200");
  await expect(results(page).getByText("$528.00")).toBeVisible();
  await addToProject(page);
  await openMyProject(page);
  await expect(page.getByText("Sod (rolls): 66 rolls (10 ft² each)")).toBeVisible();
  await expect(page.getByText("Sod (pallets)")).toHaveCount(0);
  await expect(page.getByText("Line total: $528.00 ($528.00 × 1)")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("lawn seed: default bags at $78.00; bulk by the pound at $77.00 with one line", async ({
  page,
}) => {
  const consoleErrors = consoleErrorCollector(page);
  await clearProject(page);

  await openCalculator(page, "lawn-seed-calculator");
  await expect(results(page).getByText("3 × 10 lb + 3 × 3 lb")).toBeVisible();
  await page.getByLabel("Price per pound (optional)").fill("2");
  await expect(results(page).getByText("$78.00")).toBeVisible();
  await addToProject(page);
  await openMyProject(page);
  await expect(
    page.getByText("Grass seed needed: 38.5 lb (17.5 kg) at 7 lb per 1,000 ft², new lawn"),
  ).toBeVisible();
  await expect(
    page.getByText("Buy as bags: 3 × 10 lb + 3 × 3 lb (6 bags, 39 lb total)"),
  ).toBeVisible();

  // Bulk by the pound: one line, priced on the 38.5 lb buffered weight.
  await clearProject(page);
  await openCalculator(page, "lawn-seed-calculator");
  await page.getByLabel("Buy as").selectOption({ label: "Bulk by the pound" });
  await page.getByLabel("Price per pound (optional)").fill("2");
  await expect(results(page).getByText("$77.00")).toBeVisible();
  await addToProject(page);
  await openMyProject(page);
  await expect(
    page.getByText(
      "Grass seed (bulk, by the pound): 38.5 lb (17.5 kg) at 7 lb per 1,000 ft², new lawn",
    ),
  ).toBeVisible();
  await expect(page.getByText("Buy as bags")).toHaveCount(0);
  await expect(page.getByText("Line total: $77.00 ($77.00 × 1)")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("fence: no Buy as select — all four distinct materials are saved", async ({ page }) => {
  const consoleErrors = consoleErrorCollector(page);
  await clearProject(page);

  await openCalculator(page, "fence-calculator");
  await expect(page.getByLabel("Buy as")).toHaveCount(0);
  await addToProject(page);
  await openMyProject(page);
  await expect(page.getByText("Fence posts: 14")).toBeVisible();
  await expect(page.getByText("Fence rails: 43")).toBeVisible();
  await expect(page.getByText("Fence pickets: 220")).toBeVisible();
  await expect(page.getByText("Concrete bags (80 lb): 28")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
