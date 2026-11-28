import { expect, test } from "@playwright/test";
import { CALCULATOR_CONFIGS } from "../src/calculators/index";
import { linkedTextToPlain, type LinkedText } from "../src/lib/linked-text";
import { getCalculator, getRelatedCalculators } from "../src/lib/registry";
import type { CalculatorConfig } from "../src/components/react/CalculatorConfig";

/**
 * Phase 17B1-UI Stage 2 (Direction C+ full rollout): original substantive
 * content is preserved verbatim on all 31 redesigned pages. The check is
 * two-measure (see STAGE1_PLAN.md §2.3): (a) every original config string
 * appears in the built page's text content, including text inside
 * collapsed <details> (server-rendered, so it is in the DOM); (b) new UI
 * words — TOC labels, takeaways, chapter numbers — are asserted
 * separately and never claimed as original content.
 *
 * Also covers: default calculation outputs, the Tile Adhesive 5%-waste
 * scenario (owner-corrected 2.38 / 2.50 / 3 bags), the Stair riser-height
 * detail surviving hero promotion, TOC anchors, no horizontal overflow,
 * and keyboard operation of the accordions. Runs on Chromium desktop and
 * Pixel 5 mobile (see playwright.config.ts).
 *
 * Stage 1 (Paint, Tile Adhesive, Stair) is the reference implementation;
 * the other 23 were added in Stage 2 under the same rules. There is no
 * non-C+ control page left — every calculator is C+.
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

/** Indexed access is possibly-undefined under strict TS; the slugs are known to exist. */
function mustGetConfig(slug: AllSlug): CalculatorConfig {
  const config = CALCULATOR_CONFIGS[slug];
  if (!config) throw new Error(`missing config for ${slug}`);
  return config;
}

/** Collapse whitespace so server-rendered text matches the config strings. */
function norm(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function plain(value: string | LinkedText): string {
  return linkedTextToPlain(value);
}

/** Every original substantive string for a config, in page order. */
function originalStrings(config: CalculatorConfig): string[] {
  const out: string[] = [];
  for (const step of config.howTo) out.push(plain(step));
  out.push(config.workedExample);
  if (config.lookupTable) {
    out.push("Typical values worked out with this calculator — find the size closest to yours.");
    out.push(...config.lookupTable.headers);
    for (const row of config.lookupTable.rows) out.push(...row);
    if (config.lookupTable.note) out.push(plain(config.lookupTable.note));
  }
  for (const section of config.depthSections ?? []) {
    out.push(section.heading);
    for (const block of section.blocks) {
      if (block.type === "table") {
        out.push(...block.headers, ...block.rows.flat());
      } else {
        out.push(plain(block.text));
      }
    }
  }
  for (const item of config.limitations) out.push(plain(item));
  for (const faq of config.faqs) {
    out.push(faq.question);
    out.push(plain(faq.answer));
  }
  out.push(config.formula);
  return out.filter((s) => s.trim().length > 0);
}

/**
 * Default result rows (live calculator outputs at the default inputs),
 * verified against the calculator's own compute function at its default
 * imperial inputs. A value here that does not match the rendered page
 * means the calculator's defaults or formula changed — investigate,
 * do not edit the expectation to force green.
 */
const DEFAULT_RESULTS: Record<string, string[]> = {
  "concrete-calculator": [
    "Volume",
    "1.23 yd³",
    "With 10% waste",
    "1.36 yd³",
    "Ready-mix to order",
    "1.5 yd³",
    "80 lb bags",
    "62 bags",
    "60 lb bags",
    "82 bags",
    "40 lb bags",
    "123 bags",
  ],
  "square-footage-calculator": [
    "Area",
    "180 ft²",
    "Square yards",
    "20 yd²",
    "Acres",
    "0.0041 acres",
  ],
  "paint-calculator": [
    "Paintable area",
    "381 ft²",
    "Paint needed",
    "2.18 gal",
    "Gallons to buy",
    "3 gal",
  ],
  "gravel-calculator": [
    "Volume",
    "0.93 yd³",
    "Cubic yards to order",
    "1 yd³",
    "Weight",
    "1.36 tons",
  ],
  "mulch-calculator": [
    "Volume",
    "0.93 yd³",
    "Bulk yards to order",
    "1 yd³",
    "Bags to buy",
    "14 bags",
  ],
  "concrete-slab-calculator": [
    "Slab volume",
    "2.96 yd³",
    "With 10% waste",
    "3.26 yd³",
    "Ready-mix to order",
    "3.5 yd³",
    "80 lb bags",
    "147 bags",
    "60 lb bags",
    "196 bags",
    "40 lb bags",
    "294 bags",
    "Wire-mesh sheets",
    "2 sheets",
  ],
  "cubic-yard-calculator": [
    "Cubic yards",
    "1 yd³",
    "Cubic feet",
    "27 ft³",
    "Cubic meters",
    "0.76 m³",
    "Liters",
    "765 L",
    "US gallons",
    "201.97 gal",
  ],
  "cubic-feet-calculator": [
    "Cubic feet",
    "40 ft³",
    "Cubic yards",
    "1.48 yd³",
    "Cubic meters",
    "1.13 m³",
    "Cubic inches",
    "69,120 in³",
    "Liters",
    "1,133 L",
    "US gallons",
    "299.22 gal",
  ],
  "tile-calculator": [
    "Area to tile",
    "100 ft²",
    "Tiles needed",
    "108 tiles",
    "Boxes needed",
    "11 boxes",
  ],
  "brick-calculator": [
    "Net wall area",
    "80 ft²",
    "Bricks needed",
    "576 bricks",
    "Mortar volume",
    "5.09 ft³",
    "Mortar bags (80 lb)",
    "18 bags",
  ],
  "drywall-calculator": [
    "Area to cover",
    "478 ft²",
    "Drywall sheets",
    "17 sheets",
    "Joint compound",
    "4.78 gal",
    "Paper tape",
    "176.86 ft",
    "Drywall screws",
    "483 screws",
  ],
  "concrete-bags-calculator": [
    "Volume needed",
    "1.1 yd³",
    "40 lb bags",
    "99 bags",
    "60 lb bags",
    "66 bags",
    "80 lb bags",
    "50 bags",
  ],
  "flooring-calculator": [
    "Floor area",
    "180 ft²",
    "Boxes needed",
    "10 boxes",
    "Underlayment rolls",
    "2 rolls",
  ],
  "paver-calculator": [
    "Pavers needed",
    "207 pavers",
    "Base gravel to order",
    "3.41 yd³",
    "Bedding sand",
    "0.68 yd³",
    "Joint sand",
    "2 bags",
  ],
  "topsoil-calculator": [
    "Topsoil volume",
    "2.04 yd³",
    "Bulk to order",
    "3 yd³",
    "Weight",
    "2.04 tons",
    "Bags",
    "74 bags",
  ],
  "grout-calculator": [
    "Grout per square foot",
    "0.064 lb/ft²",
    "Grout needed",
    "7.1 lb",
    "Bags needed",
    "1 bag",
  ],
  "board-foot-calculator": [
    "Board feet per piece",
    "8 bf",
    "Total board feet",
    "84 bf",
    "Volume",
    "7 ft³",
  ],
  "mortar-calculator": [
    "Wall area (bricks)",
    "80 ft²",
    "Mortar volume",
    "5.09 ft³",
    "Pre-mixed mortar",
    "18 bags",
    "Site mix — Type N (1:1:6)",
    "0.87 ft³ cement",
  ],
  "ceiling-tile-calculator": [
    "Tiles needed",
    "40 tiles",
    "Cartons to buy",
    "3 cartons",
    "Main tees (12 ft)",
    "2 tees",
    "Cross tees (4 ft)",
    "15 tees",
    "Cross tees (2 ft)",
    "18 tees",
    "Wall angle (10 ft)",
    "5 pieces",
    "Hanger wires",
    "6 wires",
  ],
  "tile-adhesive-calculator": [
    "Adhesive needed",
    "61.1 lb",
    "Coverage per bag",
    "90 ft²/bag",
    "Bags to buy",
    "2 bags",
  ],
  "primer-calculator": [
    "Wall area to prime",
    "381 ft²",
    "Primer needed",
    "1.68 gal",
    "Gallons to buy",
    "2 gal",
  ],
  "wallpaper-calculator": [
    "Strips needed",
    "32 strips",
    "Strip length",
    "9.83 ft",
    "Strips per roll",
    "3 strips",
    "Rolls to buy",
    "12 rolls",
  ],
  "sealant-calculator": [
    "Sealant needed",
    "45.7 fl oz",
    "Coverage per tube",
    "24.3 ft/tube",
    "Tubes to buy",
    "5 tubes",
  ],
  "waterproofing-calculator": [
    "Membrane needed",
    "2 gal",
    "Containers to buy",
    "2 containers",
    "Liters to buy",
    "7.57 L",
  ],
  "baseboard-calculator": [
    "Net wall length",
    "45 ft",
    "Length with waste",
    "49.5 ft",
    "Pieces to buy",
    "7 pieces",
    "Length purchased",
    "56 ft",
  ],
  "stair-calculator": [
    "Risers",
    "14 risers",
    "7.5 in each",
    "Treads",
    "13 treads",
    "Total run",
    "136.5 in",
    "Stringer length",
    "172.21 in",
    "Stair angle",
    "37.6°",
  ],
  "sand-calculator": [
    "Sand volume",
    "1.36 yd³",
    "Bulk to order",
    "2 yd³",
    "Weight needed",
    "1.83 tons (US short tons)",
    "Weight of bulk order",
    "2.7 tons (US short tons)",
    "Bags",
    "74 bags",
  ],
  "raised-bed-soil-calculator": [
    "Soil volume",
    "29.33 ft³",
    "Bulk to order",
    "2 yd³",
    "Bags to buy",
    "15 bags",
    "Mix (60/30/10)",
    "17.6 / 8.8 / 2.93 ft³",
  ],
  "sod-calculator": [
    "Lawn area",
    "600 ft²",
    "Area with waste",
    "660 ft²",
    "Rolls to buy",
    "66 rolls",
    "Pallets to buy",
    "2 pallets",
  ],
  "lawn-seed-calculator": [
    "Seed needed",
    "35 lb",
    "Seed with buffer",
    "38.5 lb",
    "Bags to buy",
    // 17B2 corrective Workstream B replaced greedy largest-first bagging
    // (1 x 25 + 1 x 10 + 2 x 3 = 41 lb) with least-overbuy search:
    // 5,000 ft2 x 7 lb/1,000 ft2 = 35 lb, +10% buffer = 38.5 lb, and
    // 3 x 10 + 3 x 3 = 39 lb is the lightest mix >= 38.5 lb (6 bags;
    // the only other 39 lb mix is 13 x 3 lb). See
    // src/lib/formulas/lawn-seed.test.ts ("finds the least overbuy").
    "3 × 10 lb + 3 × 3 lb",
  ],
  "fence-calculator": [
    "Posts",
    "14 posts",
    "Rails",
    "43 rails",
    "Pickets",
    "220 pickets",
    "Concrete bags (80 lb)",
    "28 bags",
  ],
};

for (const { slug, path } of ALL) {
  const config = mustGetConfig(slug);

  test(`${slug}: every original content string is in the page (including collapsed text)`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.locator("[data-hydrated='true']")).toBeVisible();
    const text = await page.evaluate(() =>
      (document.querySelector("main")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    );
    for (const expected of originalStrings(config)) {
      expect(text, `missing original content on ${slug}: ${expected.slice(0, 80)}…`).toContain(
        norm(expected),
      );
    }
  });

  test(`${slug}: default calculation outputs are unchanged`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("[data-hydrated='true']")).toBeVisible();
    const results = await page.locator('section[aria-label="Results"]').innerText();
    const expectedRows = DEFAULT_RESULTS[slug];
    if (!expectedRows) throw new Error(`missing default results for ${slug}`);
    for (const expected of expectedRows) {
      expect(results).toContain(expected);
    }
  });

  test(`${slug}: TOC links point to real anchors and the methodology link is present`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
    const hrefs = await page
      .getByRole("navigation", { name: "On this page" })
      .locator("a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      expect(href.startsWith("#"), `TOC href ${href} is not an anchor`).toBe(true);
      const target = await page.evaluate((id) => !!document.querySelector(id), href);
      expect(target, `TOC target ${href} missing on ${slug}`).toBe(true);
    }
    await expect(page.getByRole("link", { name: "How we calculate" }).first()).toHaveAttribute(
      "href",
      "/how-we-calculate/",
    );
  });

  test(`${slug}: no horizontal overflow at mobile width`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator("[data-hydrated='true']")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test(`${slug}: related calculators keep their full summaries and hrefs`, async ({ page }) => {
    await page.goto(path);
    const meta = getCalculator(slug);
    if (!meta) throw new Error(`missing registry meta for ${slug}`);
    const related = getRelatedCalculators(meta);
    expect(related.length).toBeGreaterThan(0);
    const text = await page.evaluate(() =>
      (document.querySelector("main")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    );
    for (const rel of related) {
      expect(text).toContain(norm(rel.summary));
      await expect(page.getByRole("link", { name: rel.name }).first()).toHaveAttribute(
        "href",
        rel.url,
      );
    }
  });

  test(`${slug}: new UI words are present and counted separately from original content`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.locator("[data-hydrated='true']")).toBeVisible();
    // Takeaways are new UI text: they appear, and the full chapter text
    // they summarise is also in the DOM (asserted by the preservation test).
    for (const section of config.depthSections ?? []) {
      if (!section.takeaway) continue;
      await expect(page.getByText(section.takeaway, { exact: false })).toBeVisible();
    }
    // The hero row (by config heroResultLabel, not row order) is prominent
    // (text-2xl) and keeps its detail; no other row is hero-sized.
    const heroLabel = config.heroResultLabel ?? "";
    const rows = page.locator('section[aria-label="Results"] dl > div');
    const count = await rows.count();
    let heroFound = false;
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const label = (await row.locator("dt").innerText()).trim();
      const fontSize = parseFloat(
        await row.locator("dd").evaluate((el) => getComputedStyle(el).fontSize),
      );
      if (label === heroLabel) {
        heroFound = true;
        expect(fontSize, `hero row "${label}" should be text-2xl`).toBeGreaterThanOrEqual(24);
      } else {
        expect(fontSize, `non-hero row "${label}" should not be hero-sized`).toBeLessThan(24);
      }
    }
    expect(heroFound, `hero row "${heroLabel}" not found in results`).toBe(true);
  });
}

test("stair: riser height stays visible when the first row is promoted", async ({ page }) => {
  await page.goto("/calculators/stair-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const results = page.locator('section[aria-label="Results"]');
  await expect(results.getByText("14 risers")).toBeVisible();
  await expect(results.getByText("7.5 in each")).toBeVisible();
  // The worked line sits in the result block, outside the Results section.
  await expect(page.getByText("105 in ÷ 7.75 in max riser = 14 risers at 7.5 in")).toBeVisible();
});

test("tile-adhesive: 5% waste scenario gives 2.38 before waste, 2.50 after, 3 to buy", async ({
  page,
}) => {
  await page.goto("/calculators/tile-adhesive-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await page.getByLabel(/Trowel notch/).selectOption("42");
  await page.getByLabel(/Waste allowance/).fill("5");
  await page.waitForTimeout(400);
  const results = page.locator('section[aria-label="Results"]');
  await expect(results.getByText("125 lb")).toBeVisible();
  await expect(results.getByText("42 ft²/bag")).toBeVisible();
  await expect(results.getByText("3 bags")).toBeVisible();
  await expect(
    page.getByText("100 ft² × 105% ÷ 42 ft²/bag = 2.5 bags → buy 3 bags."),
  ).toBeVisible();
});

test("paint: keyboard opens a collapsed depth chapter and a FAQ", async ({ page }) => {
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const chapter = page.locator("details.depth-details").first();
  await expect(chapter).not.toHaveAttribute("open", "");
  await chapter.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => chapter.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(true);
  const faq = page.locator("details.faq-item").nth(1);
  await expect(faq).not.toHaveAttribute("open", "");
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => faq.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(true);
});

test("stair: rise/run diagram renders with all labels and the schematic caption", async ({
  page,
}) => {
  await page.goto("/calculators/stair-calculator/");
  const figure = page.locator("figure", { hasText: "Measurement schematic" });
  await expect(figure).toBeVisible();
  await expect(figure).toContainText("not a cut-ready or structural construction drawing");
  // SVG <text> is checked via textContent (locator text engines are HTML-oriented).
  const figureText = await figure.evaluate((el) => el.textContent ?? "");
  for (const label of [
    "Total rise",
    "Total run",
    "Tread depth",
    "Riser height",
    "Stringer = ",
    "Lower floor",
    "Upper floor",
  ]) {
    expect(figureText, `diagram label "${label}" missing`).toContain(label);
  }
});

test("fence: run diagram renders with all labels and the fence caption", async ({ page }) => {
  await page.goto("/calculators/fence-calculator/");
  const figure = page.locator("figure", { hasText: "Measure the run along the fence line" });
  await expect(figure).toBeVisible();
  await expect(figure).toContainText(
    "Measure the run along the fence line, minus gates and openings.",
  );
  // SVG <text> is checked via textContent (locator text engines are HTML-oriented).
  const figureText = await figure.evaluate((el) => el.textContent ?? "");
  for (const label of ["Run length", "Post spacing", "Gate / opening", "Post"]) {
    expect(figureText, `diagram label "${label}" missing`).toContain(label);
  }
  // The baseboard room diagram must not appear on the fence page.
  expect(figureText).not.toContain("no baseboard");
  expect(figureText).not.toContain("Measure at floor level");
});

test("all 31 calculators use the C+ layout (no original-layout page remains)", async ({ page }) => {
  for (const { path } of ALL) {
    await page.goto(path);
    await expect(page.locator("[data-hydrated='true']")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "On this page" })).toHaveCount(1);
    await expect(page.locator(".faq-item").first()).toBeVisible();
    await expect(page.locator(".guide")).toHaveCount(1);
  }
});
