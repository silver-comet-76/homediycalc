import { describe, expect, it } from "vitest";
import { CALCULATOR_CONFIGS } from "./index";
import { calculateTile } from "../lib/formulas/tile";
import { calculateGrout } from "../lib/formulas/grout";
import { calculateConcreteBags } from "../lib/formulas/concrete-bags";
import { calculatePrimer } from "../lib/formulas/primer";
import { linkedTextToPlain } from "../lib/linked-text";

/**
 * Depth-content tests (Phase 17B-1, Tranche B).
 *
 * The depth sections are static copy, so these tests pin the structure
 * (expected sections, unique ids, non-empty blocks) and — more
 * importantly — recompute the figures printed in the depth tables from
 * the actual formulas, so a future copy edit that reintroduces a wrong
 * number fails the gate. Table cells are parsed, not compared to
 * duplicated hard-coded expected strings: the expected values come from
 * running the formulas with the table's stated inputs.
 */

/** Plain text of every depth paragraph on a calculator page. */
function depthText(slug: string): string {
  const config = CALCULATOR_CONFIGS[slug];
  const parts: string[] = [];
  for (const section of config?.depthSections ?? []) {
    parts.push(section.heading);
    for (const block of section.blocks) {
      if (block.type === "paragraph") parts.push(linkedTextToPlain(block.text));
    }
  }
  return parts.join("\n");
}

/** A table cell that must exist (strict indexing makes row[i] possibly undefined). */
function cell(row: string[], i: number): string {
  const value = row[i];
  if (value === undefined) throw new Error(`missing table cell ${i} in row ${JSON.stringify(row)}`);
  return value;
}

/** The single table block in a named depth section. */
function depthTable(slug: string, sectionId: string): string[][] {
  const config = CALCULATOR_CONFIGS[slug];
  const section = config?.depthSections?.find((s) => s.id === sectionId);
  expect(section, `${slug} is missing depth section ${sectionId}`).toBeDefined();
  const table = section?.blocks.find((b) => b.type === "table");
  expect(table, `${slug}/${sectionId} has no table block`).toBeDefined();
  if (table?.type !== "table") throw new Error("not a table");
  return table.rows;
}

describe("depth sections exist with the expected structure", () => {
  const expected: Record<string, string[]> = {
    "concrete-calculator": [
      "cubic-yards-vs-cubic-feet",
      "waste-allowance",
      "measuring-non-rectangular-pour",
    ],
    "paint-calculator": [
      "three-gallon-numbers",
      "wall-area-not-floor-area",
      "coats-and-coverage",
      "primer-two-figures",
      "worked-examples-one-wall-ceiling",
    ],
    "tile-calculator": [
      "grout-joint-changes-count",
      "tiles-per-100-square-feet",
      "box-count",
      "worked-examples-large-format-bathroom",
    ],
    "stair-calculator": [
      "how-riser-count-is-decided",
      "the-151-inch-rule",
      "metric-display",
      "worked-examples-9-ft-boundary-refusals",
    ],
    "concrete-bags-calculator": [
      "how-many-80-lb-bags",
      "bags-per-cubic-yard-all-sizes",
      "coverage-per-bag-by-thickness",
      "small-jobs-fence-posts-repairs",
    ],
    "grout-calculator": [
      "how-grout-is-calculated",
      "grout-per-100-square-feet",
      "manufacturer-coverage-charts",
      "why-actual-use-differs",
    ],
    "wallpaper-calculator": [
      "count-strips-not-square-feet",
      "how-pattern-repeat-eats-rolls",
      "when-no-strip-fits",
    ],
    "drywall-calculator": [
      "sheets-to-buy-vs-sheets-hung",
      "sheet-sizes-thicknesses",
      "screws-per-sheet-spacing",
      "joint-compound-tape-finish-level",
      "worked-examples-ceiling-4x12",
    ],
  };

  it("has the expected depth sections on all 8 calculators", () => {
    for (const [slug, ids] of Object.entries(expected)) {
      const config = CALCULATOR_CONFIGS[slug];
      expect(config?.depthSections?.map((s) => s.id)).toEqual(ids);
    }
  });

  it("gives every depth section a non-empty heading and at least one non-empty block", () => {
    for (const config of Object.values(CALCULATOR_CONFIGS)) {
      const ids = new Set<string>();
      for (const section of config.depthSections ?? []) {
        expect(section.heading.trim().length).toBeGreaterThan(0);
        expect(ids.has(section.id), `duplicate depth id ${section.id}`).toBe(false);
        ids.add(section.id);
        expect(section.blocks.length).toBeGreaterThan(0);
        for (const block of section.blocks) {
          if (block.type === "paragraph") {
            expect(linkedTextToPlain(block.text).trim().length).toBeGreaterThan(0);
          } else {
            expect(block.headers.length).toBeGreaterThan(1);
            expect(block.rows.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("adds depth sections to exactly the 8 calculators in scope", () => {
    const withDepth = Object.entries(CALCULATOR_CONFIGS)
      .filter(([, config]) => (config.depthSections ?? []).length > 0)
      .map(([slug]) => slug)
      .sort();
    expect(withDepth).toEqual(Object.keys(expected).sort());
  });
});

describe("depth table figures recompute from the formulas", () => {
  it("Tile table: every row matches calculateTile for 100 ft², ⅛ in joint, 10% waste", () => {
    const rows = depthTable("tile-calculator", "tiles-per-100-square-feet");
    const sizes: [number, number][] = [
      [3, 6],
      [12, 12],
      [12, 24],
    ];
    expect(rows).toHaveLength(3);
    rows.forEach((row, i) => {
      const size = sizes[i];
      expect(size).toBeDefined();
      const [lengthIn, widthIn] = size as [number, number];
      const r = calculateTile({
        areaFt2: 100,
        tileLengthIn: lengthIn,
        tileWidthIn: widthIn,
        jointIn: 0.125,
        wastePct: 10,
        tilesPerBox: 10,
      });
      // Effective-area cell: the formula value rounded to the displayed precision.
      expect(Number(cell(row, 1).replace(" ft²", ""))).toBeCloseTo(r.effectiveTileAreaFt2, 2);
      expect(Number(cell(row, 2))).toBe(r.tilesNeeded);
      expect(Number(cell(row, 3))).toBe(r.boxesNeeded);
    });
  });

  it("Grout table: every row matches calculateGrout for 100 ft², ⅛ in joint, 10% extra", () => {
    const rows = depthTable("grout-calculator", "grout-per-100-square-feet");
    const sizes: [number, number, number][] = [
      [2, 2, 0.25],
      [4.25, 4.25, 0.375],
      [6, 24, 0.375],
      [12, 12, 0.375],
      [12, 24, 0.375],
      [18, 18, 0.375],
      [24, 24, 0.375],
    ];
    expect(rows).toHaveLength(7);
    rows.forEach((row, i) => {
      const size = sizes[i];
      expect(size).toBeDefined();
      const [lengthIn, widthIn, depthIn] = size as [number, number, number];
      const r = calculateGrout({
        areaFt2: 100,
        tileLengthIn: lengthIn,
        tileWidthIn: widthIn,
        jointWidthIn: 0.125,
        jointDepthIn: depthIn,
        groutDensityLbFt3: 98.5,
        bagWeightLb: 10,
        wastePct: 10,
      });
      expect(Number(cell(row, 1).replace(" lb/ft²", ""))).toBeCloseTo(r.groutLbPerFt2, 2);
      expect(Number(cell(row, 2).replace(" lb", ""))).toBeCloseTo(r.groutLb, 1);
      expect(Number(cell(row, 3))).toBe(r.bags);
    });
  });

  it("Concrete Bags table: theoretical and to-buy counts follow 27 ÷ yield and 29.7 ÷ yield", () => {
    const rows = depthTable("concrete-bags-calculator", "bags-per-cubic-yard-all-sizes");
    const yields = [0.3, 0.375, 0.45, 0.6, 0.675];
    expect(rows).toHaveLength(5);
    rows.forEach((row, i) => {
      const y = yields[i];
      expect(y).toBeDefined();
      const theory = Number(cell(row, 2).split(" ")[0]);
      const toBuy = Number(cell(row, 3).split(" ")[0]);
      expect(theory).toBe(27 / (y as number));
      expect(toBuy).toBe(Math.ceil(29.7 / (y as number)));
    });
    // Cross-check against the formula itself: 1 yd³ (27 ft³) at 10% waste, 80 lb bags.
    const r = calculateConcreteBags({ volumeFt3: 27, wastePct: 10 });
    expect(r.bags80).toBe(50);
    expect(r.bags40).toBe(99);
    expect(r.bags60).toBe(66);
  });

  it("Paint primer figure: the 12×12 room on new drywall recomputes to 1.47 gal with waste", () => {
    const r = calculatePrimer({
      netAreaFt2: 333,
      coats: 1,
      coverageFt2PerGal: 300,
      conditionFactor: 1.2,
      wastePct: 10,
    });
    expect(r.adjustedGallons).toBeCloseTo(1.47, 2);
    expect(r.gallonsToBuy).toBe(2);
    expect(depthText("paint-calculator")).toContain("1.47 gal with waste");
  });
});

/** Plain text of the paragraphs in one named depth section. */
function depthSectionText(slug: string, sectionId: string): string {
  const config = CALCULATOR_CONFIGS[slug];
  const section = config?.depthSections?.find((s) => s.id === sectionId);
  expect(section, `${slug} is missing depth section ${sectionId}`).toBeDefined();
  const parts: string[] = [section?.heading ?? ""];
  for (const block of section?.blocks ?? []) {
    if (block.type === "paragraph") parts.push(linkedTextToPlain(block.text));
  }
  return parts.join("\n");
}

describe("corrective round QA-17B1 (2026-11-26)", () => {
  it("QA-17B1-01 drywall: 54 in panels need two horizontal courses with one seam — never a single sheet with no joint", () => {
    const text = depthSectionText("drywall-calculator", "sheet-sizes-thicknesses");
    expect(text).toContain("two horizontal courses");
    expect(text).toContain("108 in wall height");
    expect(text).toContain("one horizontal seam");
    expect(text).toContain("filler strip");
    // The false claim must not come back in any form:
    expect(text).not.toContain("single sheet spans floor to ceiling");
    expect(text).not.toContain("no horizontal joint");
    expect(text).not.toContain("one person can carry it");
    // The same carry claim also lived in the sheet-size input hint:
    const hints = (CALCULATOR_CONFIGS["drywall-calculator"]?.modes ?? []).flatMap(
      (mode) => mode.fields,
    );
    expect(hints.length).toBeGreaterThan(0);
    for (const field of hints) {
      expect(field.hint ?? "").not.toContain("one person can carry it");
    }
    expect(hints.find((field) => field.id === "sheetSize")?.hint ?? "").toContain(
      "common DIY size",
    );
  });

  it("QA-17B1-02 tile adhesive: the 3-bag figure is a conditional estimate, and the ½×½ in square-notch is not recommended", () => {
    const tileText = depthText("tile-calculator");
    expect(tileText).toContain("conditional estimate at CUSTOM's chart coverage");
    expect(tileText).toContain("excludes back-troweling material");
    const groutText = depthText("grout-calculator");
    expect(groutText).toContain("conditional estimate at CUSTOM's chart coverage");
    expect(groutText).toContain("excluding back-troweling material");
  });

  it("QA-17B1-03 paint: the 12×12 example states its opening deductions, and the 9 ft comparison reuses them", () => {
    const threeGallons = depthSectionText("paint-calculator", "three-gallon-numbers");
    expect(threeGallons).toContain("333 ft²");
    expect(threeGallons).toContain("one 21 ft² door and two 15 ft² windows");
    expect(threeGallons).toContain("1.90 gal");
    expect(threeGallons).toContain("2.09 gal");
    expect(threeGallons).toContain("quarts are available for many paints");
    const wallArea = depthSectionText("paint-calculator", "wall-area-not-floor-area");
    expect(wallArea).toContain("same one-door and two-window deductions");
    expect(wallArea).toContain("2.39 gal");
  });
});

describe("Stair depth content preserves the Phase 16A safety wording", () => {
  it("states the 151 in boundary and the metric boundary in the same terms as the calculator", () => {
    const text = depthText("stair-calculator");
    expect(text).toContain("151 in");
    expect(text).toContain("383.54 cm");
    expect(text).toContain("19.685 cm is the maximum riser height");
    // 151 in itself: no warning. 152 in: warning shown, numbers still returned.
    expect(text).toContain("no warning");
    expect(text).toContain("warning shown, numbers still returned");
    // The replaced limitation keeps the warning semantics: no rejection, warning + planning estimate.
    const limitations = CALCULATOR_CONFIGS["stair-calculator"]?.limitations ?? [];
    const flat = limitations.map((item) => linkedTextToPlain(item)).join("\n");
    expect(flat).toContain("does not reject a taller rise");
    expect(flat).toContain(
      "shows a warning and returns the straight-flight numbers as a planning estimate only",
    );
  });
});
