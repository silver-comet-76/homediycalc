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

test("planner: add from two calculators, edit, export CSV, clear", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await addCalculatorToProject(page, "paint-calculator");
  await addCalculatorToProject(page, "primer-calculator");

  await page.goto("/my-project/");
  await expect(
    page.getByRole("heading", { name: "My Project", exact: true }),
  ).toBeVisible();
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
  expect(csv).toContain("Room,Calculator,Item,Details,Quantity,Unit cost (USD),Line total (USD)");
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
  const stored = await page.evaluate(() =>
    localStorage.getItem("homediycalc:project:v1"),
  );
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored as string).items).toEqual([]);

  expect(consoleErrors).toEqual([]);
});

test("planner: print button calls window.print", async ({ page }) => {
  await addCalculatorToProject(page, "paint-calculator");

  await page.goto("/my-project/");
  await expect(
    page.getByRole("heading", { name: "My Project", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("input[aria-label='Item name']").nth(0),
  ).toHaveValue("Paint Calculator — Room dimensions");

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

test("planner: corrupt stored data shows the empty state, not a crash", async ({
  page,
}) => {
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
