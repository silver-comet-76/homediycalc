import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { CALCULATOR_CONFIGS } from "../src/calculators/index";
import type { CalculatorConfig, FieldSpec } from "../src/components/react/CalculatorConfig";

/**
 * QA-17B1-UI-07: data-driven baseline-vs-candidate functional regression.
 *
 * This spec does NOT assert against hardcoded values. It drives each of
 * the 31 calculators through the same scenarios (default, non-default
 * Imperial, non-default Metric, unit round-trip, alternate modes, invalid
 * input, reset, optional cost) and records the rendered results to a JSON
 * file (REGRESSION_OUT). The same spec is run once against the baseline
 * build (9acf474e) and once against the candidate build; a separate
 * compare script diffs the two JSONs. Any difference is a regression.
 *
 * Run with --workers=1 (a single process writes the JSON in afterAll).
 */

const ALL = [
  { slug: "concrete-calculator", path: "/calculators/concrete-calculator/" },
  { slug: "square-footage-calculator", path: "/calculators/square-footage-calculator/" },
  { slug: "paint-calculator", path: "/calculators/paint-calculator/" },
  { slug: "gravel-calculator", path: "/calculators/gravel-calculator/" },
  { slug: "mulch-calculator", path: "/calculators/mulch-calculator/" },
  { slug: "concrete-slab-calculator", path: "/calculators/concrete-slab-calculator/" },
  { slug: "cubic-yard-calculator", path: "/calculators/cubic-yard-calculator/" },
  { slug: "cubic-feet-calculator", path: "/calculators/cubic-feet-calculator/" },
  { slug: "tile-calculator", path: "/calculators/tile-calculator/" },
  { slug: "brick-calculator", path: "/calculators/brick-calculator/" },
  { slug: "drywall-calculator", path: "/calculators/drywall-calculator/" },
  { slug: "concrete-bags-calculator", path: "/calculators/concrete-bags-calculator/" },
  { slug: "flooring-calculator", path: "/calculators/flooring-calculator/" },
  { slug: "paver-calculator", path: "/calculators/paver-calculator/" },
  { slug: "topsoil-calculator", path: "/calculators/topsoil-calculator/" },
  { slug: "grout-calculator", path: "/calculators/grout-calculator/" },
  { slug: "board-foot-calculator", path: "/calculators/board-foot-calculator/" },
  { slug: "mortar-calculator", path: "/calculators/mortar-calculator/" },
  { slug: "ceiling-tile-calculator", path: "/calculators/ceiling-tile-calculator/" },
  { slug: "tile-adhesive-calculator", path: "/calculators/tile-adhesive-calculator/" },
  { slug: "primer-calculator", path: "/calculators/primer-calculator/" },
  { slug: "wallpaper-calculator", path: "/calculators/wallpaper-calculator/" },
  { slug: "sealant-calculator", path: "/calculators/sealant-calculator/" },
  { slug: "waterproofing-calculator", path: "/calculators/waterproofing-calculator/" },
  { slug: "baseboard-calculator", path: "/calculators/baseboard-calculator/" },
  { slug: "stair-calculator", path: "/calculators/stair-calculator/" },
  { slug: "sand-calculator", path: "/calculators/sand-calculator/" },
  { slug: "raised-bed-soil-calculator", path: "/calculators/raised-bed-soil-calculator/" },
  { slug: "sod-calculator", path: "/calculators/sod-calculator/" },
  { slug: "lawn-seed-calculator", path: "/calculators/lawn-seed-calculator/" },
  { slug: "fence-calculator", path: "/calculators/fence-calculator/" },
] as const;

type AllSlug = (typeof ALL)[number]["slug"];

function mustGetConfig(slug: AllSlug): CalculatorConfig {
  const config = CALCULATOR_CONFIGS[slug];
  if (!config) throw new Error(`missing config for ${slug}`);
  return config;
}

function norm(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** A valid non-default value for a field: default × 1.5, clamped to max. */
function nonDefaultValue(field: FieldSpec, system: "imp" | "met"): string {
  const def = parseFloat(system === "imp" ? (field.defaultImp ?? "") : (field.defaultMet ?? ""));
  if (Number.isNaN(def)) return system === "imp" ? "15" : "5";
  let v = Math.round(def * 1.5 * 100) / 100;
  if (v === def) v = def + 1;
  if (field.max !== undefined && v > field.max) v = field.max;
  return String(v);
}

function defaultMode(config: CalculatorConfig) {
  const mode = config.modes.find((m) => m.id === config.defaultMode) ?? config.modes[0];
  if (!mode) throw new Error(`no mode for ${config.slug}`);
  return mode;
}

function firstRequiredNumberField(config: CalculatorConfig): FieldSpec {
  const mode = defaultMode(config);
  const field = mode.fields.find((f) => f.kind !== "select" && !f.optional);
  if (!field) throw new Error(`no required number field for ${config.slug}`);
  return field;
}

interface ScenarioResult {
  rows: { label: string; value: string }[];
  hero: string | null;
  fullText: string;
}

const results: Record<string, Record<string, unknown>> = {};

async function readResults(page: import("@playwright/test").Page): Promise<ScenarioResult> {
  const section = page.locator('section[aria-label="Results"]');
  await expect(section).toBeVisible();
  const rows: { label: string; value: string }[] = [];
  const divs = section.locator("dl > div");
  const count = await divs.count();
  let hero: string | null = null;
  for (let i = 0; i < count; i++) {
    const row = divs.nth(i);
    const label = norm(await row.locator("dt").innerText());
    const value = norm(await row.locator("dd").innerText());
    rows.push({ label, value });
    const fontSize = parseFloat(
      await row.locator("dd").evaluate((el) => getComputedStyle(el).fontSize),
    );
    if (fontSize >= 24) hero = label;
  }
  const fullText = norm(await section.innerText());
  return { rows, hero, fullText };
}

for (const { slug, path } of ALL) {
  test.describe(slug, () => {
    const config = mustGetConfig(slug);
    const mode = defaultMode(config);
    const field = firstRequiredNumberField(config);
    const inputId = `${slug}-${mode.id}-${field.id}`;
    const rec: Record<string, unknown> = {};
    results[slug] = rec;

    test("record default", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      rec.default = await readResults(page);
      rec.defaultFieldValue = await page.locator(`#${inputId}`).inputValue();
    });

    test("record non-default Imperial", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const value = nonDefaultValue(field, "imp");
      await page.locator(`#${inputId}`).fill(value);
      await page.waitForTimeout(400);
      rec.imperial = { field: field.id, value, ...(await readResults(page)) };
    });

    test("record non-default Metric", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      await page.locator("button", { hasText: "Metric" }).first().click();
      await page.waitForTimeout(400);
      const value = nonDefaultValue(field, "met");
      await page.locator(`#${inputId}`).fill(value);
      await page.waitForTimeout(400);
      rec.metric = { field: field.id, value, ...(await readResults(page)) };
    });

    test("record unit round-trip", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const value = nonDefaultValue(field, "imp");
      await page.locator(`#${inputId}`).fill(value);
      await page.waitForTimeout(400);
      const imperialRows = (await readResults(page)).fullText;
      await page.locator("button", { hasText: "Metric" }).first().click();
      await page.waitForTimeout(400);
      const metricValue = await page.locator(`#${inputId}`).inputValue();
      await page.locator("button", { hasText: "Imperial" }).first().click();
      await page.waitForTimeout(400);
      const backValue = await page.locator(`#${inputId}`).inputValue();
      const backRows = (await readResults(page)).fullText;
      rec.roundtrip = {
        field: field.id,
        setImperial: value,
        metricDisplay: metricValue,
        backImperial: backValue,
        preserved: backValue === value,
        rowsMatchImperial: backRows === imperialRows,
      };
    });

    test("record alternate modes", async ({ page }) => {
      const modes: Record<string, ScenarioResult | { na: string }> = {};
      const alternates = config.modes.filter((m) => m.id !== config.defaultMode);
      if (alternates.length === 0) {
        modes.na = { na: "single-mode calculator" };
      } else {
        await page.goto(path);
        await page.waitForSelector("[data-hydrated='true']");
        for (const m of alternates) {
          await page.locator("button", { hasText: m.label }).first().click();
          await page.waitForTimeout(400);
          modes[m.id] = await readResults(page);
        }
      }
      rec.modes = modes;
    });

    test("record invalid input", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      await page.locator(`#${inputId}`).fill("-1");
      await page.waitForTimeout(400);
      const error = page.locator(`#${inputId}-error`);
      const errorText = (await error.count()) > 0 ? norm((await error.textContent()) ?? "") : "";
      const noResults = (await page.locator('section[aria-label="Results"]').count()) === 0;
      rec.invalid = { field: field.id, value: "-1", error: errorText, noResults };
      expect(errorText.length).toBeGreaterThan(0);
      expect(noResults).toBe(true);
    });

    test("record reset", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const defaultRows = (await readResults(page)).fullText;
      // The default field value is read here, not taken from the
      // "record default" test: the suite runs with fullyParallel, so
      // that test may run in another worker where this test's shared
      // `rec` object was never populated (gate round 1: grout's reset
      // compared against `undefined` and failed on both projects).
      const defaultFieldValue = await page.locator(`#${inputId}`).inputValue();
      rec.defaultFieldValue = defaultFieldValue;
      const value = nonDefaultValue(field, "imp");
      await page.locator(`#${inputId}`).fill(value);
      await page.waitForTimeout(400);
      await page.locator("button", { hasText: "Reset" }).first().click();
      await page.waitForTimeout(400);
      const restoredValue = await page.locator(`#${inputId}`).inputValue();
      const resetRows = (await readResults(page)).fullText;
      rec.reset = {
        field: field.id,
        changedTo: value,
        restoredValue,
        restoredToDefault: restoredValue === defaultFieldValue,
        rowsMatchDefault: resetRows === defaultRows,
      };
      expect(restoredValue).toBe(defaultFieldValue);
      expect(resetRows).toBe(defaultRows);
    });

    test("record optional cost", async ({ page }) => {
      const priceField = mode.fields.find((f) => f.kind === "price");
      if (!priceField) {
        rec.cost = { na: "no price field on this calculator" };
        return;
      }
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const priceId = `${slug}-${mode.id}-${priceField.id}`;
      await page.locator(`#${priceId}`).fill("10");
      await page.waitForTimeout(400);
      rec.cost = { field: priceField.id, value: "10", ...(await readResults(page)) };
    });
  });
}

test.afterAll(async () => {
  const out = process.env.REGRESSION_OUT ?? "/tmp/regression.json";
  const payload = {
    label: process.env.REGRESSION_LABEL ?? "unknown",
    head: process.env.REGRESSION_HEAD ?? "unknown",
    generatedAt: new Date().toISOString(),
    calculators: results,
  };
  writeFileSync(out, JSON.stringify(payload, null, 2));
  // eslint-disable-next-line no-console
  console.log(`regression matrix written to ${out}`);
});
