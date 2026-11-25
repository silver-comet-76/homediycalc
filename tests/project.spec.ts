import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

/**
 * My Project planner end-to-end (Phase 4): add results from two
 * calculators into one project, organize by room, edit a quantity
 * and a price, export the list as CSV, and clear all saved data
 * (with confirmation). Runs on Chromium desktop and Pixel 5 mobile
 * (see playwright.config.ts).
 */

async function addCalculatorToProject(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/calculators/${slug}/`);
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await page.getByRole("button", { name: "Add to Project" }).click();
  await expect(page.getByText("Saved to")).toBeVisible();
}

test("planner: add from two calculators, edit, export CSV, clear", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await addCalculatorToProject(page, "paint-calculator");
  await addCalculatorToProject(page, "primer-calculator");

  await page.goto("/my-project/");
  await expect(page.getByRole("heading", { name: "My Project", exact: true })).toBeVisible();
  // Item names render in editable inputs, not as plain text.
  const itemNames = page.locator("input[aria-label='Item name']");
  await expect(itemNames.nth(0)).toHaveValue("Paint Calculator — Room dimensions");
  await expect(itemNames.nth(1)).toHaveValue("Primer Calculator — Room dimensions");
  await expect(page.getByRole("heading", { name: "Room: General" })).toBeVisible();
  await expect(page.getByText("No prices entered yet")).toBeVisible();

  // Organize by room: move the paint item to the Kitchen.
  const roomInput = page.getByLabel("Room for Paint Calculator — Room dimensions");
  await roomInput.fill("Kitchen");
  await page.locator("#project-name").click();
  await expect(page.getByRole("heading", { name: "Room: Kitchen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Room: General" })).toBeVisible();

  // Edit a price: the total appears from the prices entered only.
  const priceInput = page.getByLabel("Unit price for Paint Calculator — Room dimensions");
  await priceInput.fill("30");
  await page.locator("#project-name").click();
  await expect(page.getByText("Estimated total: $30.00")).toBeVisible();

  // Edit a quantity: the total follows quantity × unit price.
  const qtyInput = page.getByLabel("Quantity for Paint Calculator — Room dimensions");
  await qtyInput.fill("2");
  await page.locator("#project-name").click();
  await expect(page.getByText("Estimated total: $60.00")).toBeVisible();
  await expect(page.getByText("Line total: $60.00 ($30.00 × 2)")).toBeVisible();

  // Export the list as CSV.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("homediycalc-project.csv");
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path as string, "utf-8");
  expect(csv).toContain(
    "Room,Calculator,Item,Details,Quantity,Unit cost (USD),Line total (USD),Cost note",
  );
  expect(csv).toContain("paint-calculator");
  expect(csv).toContain("primer-calculator");
  expect(csv).toContain("Kitchen");
  expect(csv).toContain("60.00");
  await expect(page.getByText("CSV downloaded.")).toBeVisible();

  // Print button is present (window.print itself is not exercised here).
  await expect(page.getByRole("button", { name: "Print list" })).toBeVisible();

  // Clear all saved data — the confirmation dialog must be accepted.
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear project" }).click();
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem("homediycalc:project:v1"));
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored as string).items).toEqual([]);

  expect(consoleErrors).toEqual([]);
});

test("planner: partial brick cost stays partial through save, reload, quantity, and CSV", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  // Drive the Brick Calculator to a partial cost: a ¾ in joint has no
  // bag count, so a brick price of $0.50 gives a bricks-only figure —
  // 482 bricks × $0.50 = $241.00, labeled partial (ADR-13).
  await page.goto("/calculators/brick-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await page.getByLabel("Mortar joint width").fill("0.75");
  await page.getByLabel("Price per brick (optional)").fill("0.5");
  await expect(page.getByText("Partial cost (bricks only)")).toBeVisible();
  await expect(page.getByText("$241.00")).toBeVisible();
  await page.getByRole("button", { name: "Add to Project" }).click();
  await expect(page.getByText("Saved to")).toBeVisible();

  await page.goto("/my-project/");
  await expect(page.locator("input[aria-label='Item name']").nth(0)).toHaveValue(
    "Brick Calculator — Wall",
  );
  // The saved item keeps its partial label and detail, and the project
  // total is a partial total — never an "Estimated total".
  await expect(
    page.getByText("Line total: $241.00 ($241.00 × 1) — Partial cost (bricks only)"),
  ).toBeVisible();
  await expect(
    page.getByText("Excludes mortar — no bag count for this brick size or joint"),
  ).toBeVisible();
  await expect(page.getByText("Subtotal for General: $241.00 (partial total")).toBeVisible();
  await expect(page.getByText("Partial total (incomplete estimate): $241.00")).toBeVisible();

  // Reload: the partial flag survives LocalStorage persistence.
  await page.reload();
  await expect(
    page.getByText("Line total: $241.00 ($241.00 × 1) — Partial cost (bricks only)"),
  ).toBeVisible();
  await expect(page.getByText("Partial total (incomplete estimate): $241.00")).toBeVisible();

  // Quantity multiplies the partial line total and stays partial.
  const qtyInput = page.getByLabel("Quantity for Brick Calculator — Wall");
  await qtyInput.fill("2");
  await page.locator("#project-name").click();
  await expect(
    page.getByText("Line total: $482.00 ($241.00 × 2) — Partial cost (bricks only)"),
  ).toBeVisible();
  await expect(page.getByText("Partial total (incomplete estimate): $482.00")).toBeVisible();

  // The CSV export carries the partial note and the partial total row.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path as string, "utf-8");
  expect(csv).toContain("Partial cost (bricks only); Excludes mortar");
  expect(csv).toContain("Partial total (incomplete estimate)");
  expect(csv).toContain("482.00");
  await expect(page.getByText("CSV downloaded.")).toBeVisible();

  // Editing the unit price clears the partial flag: the edited price is
  // the user's own figure, so the total becomes a plain estimate.
  const priceInput = page.getByLabel("Unit price for Brick Calculator — Wall");
  await priceInput.fill("300");
  await page.locator("#project-name").click();
  await expect(page.getByText("Partial cost (bricks only)")).toHaveCount(0);
  await expect(page.getByText("Estimated total: $600.00")).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear project" }).click();
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("planner: print button calls window.print", async ({ page }) => {
  await addCalculatorToProject(page, "paint-calculator");

  await page.goto("/my-project/");
  await expect(page.getByRole("heading", { name: "My Project", exact: true })).toBeVisible();
  await expect(page.locator("input[aria-label='Item name']").nth(0)).toHaveValue(
    "Paint Calculator — Room dimensions",
  );

  // Stub window.print before clicking so the test can observe the call
  // without opening a real print dialog.
  await page.evaluate(() => {
    (window as unknown as { __printed?: boolean }).__printed = false;
    window.print = () => {
      (window as unknown as { __printed?: boolean }).__printed = true;
    };
  });
  await page.getByRole("button", { name: "Print list" }).click();
  const printed = await page.evaluate(
    () => (window as unknown as { __printed?: boolean }).__printed,
  );
  expect(printed).toBe(true);
});

test("planner: legacy Stair item shows a recheck note, current Stair item does not", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  const recheckNote =
    "Saved before the current Stair Calculator safety warnings were added — re-check this estimate with the current calculator if the rise may exceed 12 ft 7 in (151 in).";

  await page.goto("/my-project/");
  await page.evaluate(() => {
    // QA-16A-04: the legacy item predates the Phase 16A warnings and
    // carries none; the current item was saved after, also with none.
    // NOTE on the legacy savedAt: PHASE_16A_RELEASED_AT_MS is still
    // the unset placeholder (0) until the Phase 16A release timestamp
    // is set, so the only savedAt below it is a negative one. -1 is
    // used here solely to exercise the render path; once the release
    // timestamp is set, replace it with a realistic pre-release
    // timestamp (and the current item's with a post-release one).
    const project = {
      version: 2,
      name: "My Project",
      items: [
        {
          id: "item-stair-legacy",
          calculatorSlug: "stair-calculator",
          label: "Stair Calculator — Old straight staircase",
          lines: ["Risers: 21 at 7.62 in each", "Total run: 210 in (17.5 ft)"],
          quantity: 1,
          room: "General",
          savedAt: -1,
        },
        {
          id: "item-stair-current",
          calculatorSlug: "stair-calculator",
          label: "Stair Calculator — New straight staircase",
          lines: ["Risers: 14 at 7.75 in each", "Total run: 136.5 in (11.375 ft)"],
          quantity: 1,
          room: "General",
          savedAt: Date.now(),
        },
      ],
    };
    localStorage.setItem("homediycalc:project:v1", JSON.stringify(project));
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "My Project", exact: true })).toBeVisible();
  await expect(page.locator("input[aria-label='Item name']").nth(0)).toHaveValue(
    "Stair Calculator — Old straight staircase",
  );
  await expect(page.locator("input[aria-label='Item name']").nth(1)).toHaveValue(
    "Stair Calculator — New straight staircase",
  );
  // Exactly one recheck note: on the legacy item only, in neutral
  // wording — no amber warning box, no over-limit claim.
  await expect(page.getByText(recheckNote)).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(0);
  // Neither item's record was modified by rendering the note.
  const stored = await page.evaluate(() => localStorage.getItem("homediycalc:project:v1"));
  const parsed = JSON.parse(stored as string) as {
    items: { id: string; warnings?: string[]; savedAt: number }[];
  };
  expect(parsed.items).toHaveLength(2);
  expect(parsed.items[0]?.warnings).toBeUndefined();
  expect(parsed.items[0]?.savedAt).toBe(-1);
  expect(parsed.items[1]?.warnings).toBeUndefined();

  expect(consoleErrors).toEqual([]);
});

test("planner: corrupt stored data shows the empty state, not a crash", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto("/my-project/");
  await page.evaluate(() => {
    localStorage.setItem("homediycalc:project:v1", "{not json");
  });
  await page.reload();
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
