import { describe, expect, it } from "vitest";
import { CALCULATOR_CONFIGS } from "./index";
import { linkedTextToPlain } from "../lib/linked-text";
import {
  convertArea,
  convertCoverage,
  convertLength,
  convertVolume,
  type AreaUnit,
  type CoverageUnit,
  type LengthUnit,
  type VolumeUnit,
} from "../lib/units";
import type {
  CalculatorConfig,
  DepthSection,
  FieldSpec,
} from "../components/react/CalculatorConfig";

/**
 * Phase 17B1-UI Stage 2 (Direction C+ full rollout): the flag gates all
 * 31 calculators, and every collapsed chapter's takeaway is a verified
 * condensation of its own chapter — no new claims, no invented numbers.
 * Rendered-HTML preservation is covered by
 * tests/ui-stage1-preservation.spec.ts.
 *
 * Stage 1 (Paint, Tile Adhesive, Stair) is the reference implementation;
 * the other 23 were added in Stage 2 and the five Phase 17 calculators
 * under the same rules.
 */

/** All 31 calculators, in registry order. */
const ALL = [
  "concrete-calculator",
  "square-footage-calculator",
  "paint-calculator",
  "gravel-calculator",
  "mulch-calculator",
  "concrete-slab-calculator",
  "cubic-yard-calculator",
  "cubic-feet-calculator",
  "tile-calculator",
  "brick-calculator",
  "drywall-calculator",
  "concrete-bags-calculator",
  "flooring-calculator",
  "paver-calculator",
  "topsoil-calculator",
  "grout-calculator",
  "board-foot-calculator",
  "mortar-calculator",
  "ceiling-tile-calculator",
  "tile-adhesive-calculator",
  "primer-calculator",
  "wallpaper-calculator",
  "sealant-calculator",
  "waterproofing-calculator",
  "baseboard-calculator",
  "stair-calculator",
  "sand-calculator",
  "raised-bed-soil-calculator",
  "sod-calculator",
  "lawn-seed-calculator",
  "fence-calculator",
] as const;

type Slug = (typeof ALL)[number];

/** Indexed access is possibly-undefined under strict TS; the slugs are known to exist. */
function mustGetConfig(slug: Slug): CalculatorConfig {
  const config = CALCULATOR_CONFIGS[slug];
  if (!config) throw new Error(`missing config for ${slug}`);
  return config;
}

function chapterPlainText(section: DepthSection): string {
  return section.blocks
    .map((block) =>
      block.type === "table"
        ? [block.headers, ...block.rows].flat().join(" ")
        : linkedTextToPlain(block.text),
    )
    .join(" ");
}

/** Number tokens (including Unicode fractions) in a string. */
function numberTokens(text: string): string[] {
  const decimals = text.match(/\d+(?:[.,]\d+)?%?/g) ?? [];
  const fractions = text.match(/[⅜½¾¼]/g) ?? [];
  return [...decimals, ...fractions];
}

describe("Direction C+ Stage 2 flags", () => {
  it("flags all 31 calculators", () => {
    const flagged = Object.values(CALCULATOR_CONFIGS)
      .filter((c) => c.designCplus === true)
      .map((c) => c.slug)
      .sort();
    expect(flagged).toEqual([...ALL].sort());
  });

  it("stair uses the new rise/run diagram", () => {
    expect(mustGetConfig("stair-calculator").diagram).toBe("stair");
  });

  it("fence uses the fence run diagram, not the baseboard room diagram", () => {
    // The "linear" kind is the baseboard room outline (perimeter minus
    // doors); a fence run needs its own posts/spacing/gate drawing.
    expect(mustGetConfig("fence-calculator").diagram).toBe("fence");
  });

  it("collapses the long chapters and keeps the safety / worked-example chapters expanded", () => {
    const collapsed: Record<Slug, string[]> = {
      "concrete-calculator": [
        "cubic-yards-vs-cubic-feet",
        "waste-allowance",
        "measuring-non-rectangular-pour",
      ],
      "square-footage-calculator": [],
      "paint-calculator": [
        "three-gallon-numbers",
        "wall-area-not-floor-area",
        "coats-and-coverage",
        "primer-two-figures",
      ],
      "gravel-calculator": [],
      "mulch-calculator": [],
      "concrete-slab-calculator": [],
      "cubic-yard-calculator": [],
      "cubic-feet-calculator": [],
      "tile-calculator": ["grout-joint-changes-count", "tiles-per-100-square-feet", "box-count"],
      "brick-calculator": [],
      "drywall-calculator": [
        "sheets-to-buy-vs-sheets-hung",
        "sheet-sizes-thicknesses",
        "screws-per-sheet-spacing",
        "joint-compound-tape-finish-level",
      ],
      "concrete-bags-calculator": [
        "how-many-80-lb-bags",
        "bags-per-cubic-yard-all-sizes",
        "coverage-per-bag-by-thickness",
        "small-jobs-fence-posts-repairs",
      ],
      "flooring-calculator": [],
      "paver-calculator": [],
      "topsoil-calculator": [],
      "grout-calculator": [
        "how-grout-is-calculated",
        "grout-per-100-square-feet",
        "manufacturer-coverage-charts",
        "why-actual-use-differs",
      ],
      "board-foot-calculator": [],
      "mortar-calculator": [],
      "ceiling-tile-calculator": [],
      "tile-adhesive-calculator": [],
      "primer-calculator": [],
      "wallpaper-calculator": [
        "count-strips-not-square-feet",
        "how-pattern-repeat-eats-rolls",
        "when-no-strip-fits",
      ],
      "sealant-calculator": [],
      "waterproofing-calculator": [],
      "baseboard-calculator": [],
      "stair-calculator": ["how-riser-count-is-decided", "metric-display"],
      "sand-calculator": [],
      "raised-bed-soil-calculator": [],
      "sod-calculator": [],
      "lawn-seed-calculator": [],
      "fence-calculator": [],
    };
    for (const slug of ALL) {
      const sections = mustGetConfig(slug).depthSections ?? [];
      expect(
        sections.filter((s) => s.takeaway).map((s) => s.id),
        `${slug} collapsed chapters`,
      ).toEqual(collapsed[slug]);
    }

    // Worked-example chapters and the Stair 151-inch safety rule stay expanded.
    const expanded: Partial<Record<Slug, string[]>> = {
      "paint-calculator": ["worked-examples-one-wall-ceiling"],
      "tile-calculator": ["worked-examples-large-format-bathroom"],
      "drywall-calculator": ["worked-examples-ceiling-4x12"],
      "stair-calculator": ["the-151-inch-rule", "worked-examples-9-ft-boundary-refusals"],
    };
    for (const [slug, ids] of Object.entries(expanded)) {
      const sections = mustGetConfig(slug as Slug).depthSections ?? [];
      for (const id of ids) {
        expect(sections.find((s) => s.id === id)?.takeaway).toBeUndefined();
      }
    }
  });
});

describe("Direction C+ takeaways are verified condensations", () => {
  for (const slug of ALL) {
    const config = mustGetConfig(slug);
    for (const section of config.depthSections ?? []) {
      if (!section.takeaway) continue;
      it(`${slug} / ${section.id}: takeaway is shorter than the chapter and uses only its numbers`, () => {
        const chapter = chapterPlainText(section);
        const takeaway = section.takeaway as string;
        expect(takeaway.length).toBeGreaterThan(0);
        expect(takeaway.split(/\s+/).length).toBeLessThan(chapter.split(/\s+/).length);
        // QA-17B1-UI-05: a takeaway may also restate figures from the
        // page's worked example — same page, verified content — e.g. the
        // Concrete waste takeaway states the 1.5 yd³ order from the worked
        // example, and the Tile takeaways state the 10% waste from theirs.
        // Numbers must still come from the chapter or the worked example,
        // never invented.
        const source = chapter + " " + (config.workedExample ? String(config.workedExample) : "");
        for (const token of numberTokens(takeaway)) {
          expect(
            source.includes(token),
            `takeaway number "${token}" does not appear in chapter "${section.id}" or its worked example`,
          ).toBe(true);
        }
      });
    }
  }
});

/**
 * QA-17B1-UI-02: a number-token check cannot establish meaning. Each
 * takeaway must carry the qualifications its figures depend on — the
 * worked example they belong to, the conditions of a comparison, and
 * the scope of a conclusion. These phrases are the minimum; the
 * takeaway may say more.
 */
const TAKEAWAY_QUALIFICATIONS: Record<string, Record<string, string[]>> = {
  "paint-calculator": {
    "three-gallon-numbers": ["12×12", "333 ft²", "1.90 gal", "2.09 gal"],
    "wall-area-not-floor-area": [
      "12×12",
      "8 ft",
      "9 ft",
      "2.09 gal",
      "2.39 gal",
      "350 ft²/gal",
      "10% waste",
    ],
    "coats-and-coverage": ["350 ft²/gal", "350–400", "smooth, sealed"],
    "primer-two-figures": [
      "200–300",
      "bare drywall",
      "333 ft² net",
      "1.11–1.67 gal",
      "within that range",
    ],
  },
  "stair-calculator": {
    "how-riser-count-is-decided": ["7.75 in", "⅜ in"],
    "metric-display": ["19.685 cm", "maximum riser height", "tread depth"],
  },
  "concrete-calculator": {
    "cubic-yards-vs-cubic-feet": [
      "1 yd³ = 27 ft³",
      "Ready-mix to order",
      "1.23 yd³",
      "1.85 yd³",
      "4 in",
      "6 in",
    ],
    "waste-allowance": [
      "NRMCA CIP 31",
      "4% to 10%",
      "10%",
      "5%",
      "15%",
      "1.23 yd³",
      "1.36 yd³",
      "45 vs 50",
      "4 in",
      "1.5 yd³",
      "rounded up",
    ],
    "measuring-non-rectangular-pour": ["4½ in", "0.15 yd³", "15%", "average"],
  },
  "concrete-bags-calculator": {
    "how-many-80-lb-bags": [
      "45 bags",
      "27 ft³",
      "0.60 ft³",
      "QUIKRETE",
      "10% waste",
      "50 bags",
      "49.5",
    ],
    "bags-per-cubic-yard-all-sizes": [
      "45 vs 50",
      "0.60 ft³",
      "alternatives, not a combined list",
      "4,000 lb",
    ],
    "coverage-per-bag-by-thickness": ["1.8 ft²", "4 in", "10%", "4×4 ft", "10 bags"],
    "small-jobs-fence-posts-repairs": [
      "1.57 ft³",
      "1.73 ft³",
      "2.88",
      "3 bags",
      "24 bags",
      "1 cubic yard",
      "2 cubic yards",
    ],
  },
  "tile-calculator": {
    "grout-joint-changes-count": [
      "1.02 ft²",
      "108 tiles",
      "110",
      "⅛ in",
      "3/16 in",
      "1/16 in",
      "CUSTOM bulletin TB87",
      "10% waste",
      "no joint",
    ],
    "tiles-per-100-square-feet": ["828 tiles", "108", "55", "10% waste", "15%", "herringbone"],
    "box-count": [
      "55 tiles",
      "6 boxes",
      "108 tiles",
      "11 boxes",
      "109 tiles",
      "12×12",
      "⅛ in",
      "10% waste",
    ],
  },
  "grout-calculator": {
    "how-grout-is-calculated": ["0.064 lb", "98.5 lb/ft³", "⅛ in", "⅜ in", "six times"],
    "grout-per-100-square-feet": [
      "28.2 lb",
      "7.1 lb",
      "98.5 lb/ft³",
      "42.3 lb",
      "0.096 lb/ft²",
      "0.128 lb/ft²",
    ],
    "manufacturer-coverage-charts": ["98.5 lb/ft³", "MAPEI", "110 lb/ft³", "12%", "TDS-360"],
    "why-actual-use-differs": [
      "10%",
      "15%",
      "98.5 lb/ft³",
      "2.62",
      "3 bags",
      "42",
      "does not recommend",
      "Tile Adhesive Calculator",
    ],
  },
  "drywall-calculator": {
    "sheets-to-buy-vs-sheets-hung": ["16", "17", "478 ft²", "32 ft²", "× 1.10"],
    "sheet-sizes-thicknesses": [
      "32 ft²",
      "40 ft²",
      "48 ft²",
      "54 in",
      "20 ft²",
      "21 ft²",
      "R702.3.5",
    ],
    "screws-per-sheet-spacing": [
      "28 screws",
      "35",
      "16 in",
      "R702.3.5",
      "12 in",
      "6 in",
      "⅝ in",
      "250 per pound",
    ],
    "joint-compound-tape-finish-level": [
      "100 ft² per gallon",
      "Level 4",
      "4.5 gal",
      "450 ft²",
      "10 gal",
      "9.4 gal",
    ],
  },
  "wallpaper-calculator": {
    "count-strips-not-square-feet": [
      "32 strips",
      "9.83 ft",
      "3 strips",
      "12 double rolls",
      "9 rolls",
      "3 rolls short",
    ],
    "how-pattern-repeat-eats-rolls": [
      "27 in",
      "9 ft",
      "three strips to two",
      "repeat of 0",
      "straight-match",
      "drop match",
      "extra roll",
    ],
    "when-no-strip-fits": ["zero rolls", "12.58 ft", "15.33 ft", "16.5 ft", "longer roll"],
  },
};

describe("QA-17B1-UI-02: takeaways carry their example assumptions and qualifications", () => {
  for (const slug of ALL) {
    const config = mustGetConfig(slug);
    for (const section of config.depthSections ?? []) {
      if (!section.takeaway) continue;
      const required = TAKEAWAY_QUALIFICATIONS[slug]?.[section.id];
      if (!required) continue;
      it(`${slug} / ${section.id}: takeaway states its qualifications`, () => {
        const takeaway = section.takeaway as string;
        for (const phrase of required) {
          expect(
            takeaway.includes(phrase),
            `takeaway for "${section.id}" is missing qualification "${phrase}"`,
          ).toBe(true);
        }
      });
    }
  }
});

/**
 * Convert a default imperial value to the canonical unit its formula
 * expects, exactly as GenericCalculator.toCanonical does: the display
 * unit is the field's imperial unit; the target is the field's
 * canonicalUnit or the family default (ft / ft² / ft³ / ft²/gal).
 * Fields without a numeric default (selects, optional blanks) are
 * skipped, matching the island's behaviour for unset inputs.
 */
function toCanonical(value: number, field: FieldSpec): number {
  const unit = field.impUnit ?? "";
  switch (field.unitKind) {
    case "length":
      return convertLength(value, unit as LengthUnit, (field.canonicalUnit ?? "ft") as LengthUnit);
    case "area":
      return convertArea(value, unit as AreaUnit, (field.canonicalUnit ?? "ft2") as AreaUnit);
    case "volume":
      return convertVolume(value, unit as VolumeUnit, (field.canonicalUnit ?? "ft3") as VolumeUnit);
    case "coverage":
      return convertCoverage(
        value,
        unit as CoverageUnit,
        (field.canonicalUnit ?? "ft2/gal") as CoverageUnit,
      );
    default:
      return value;
  }
}

function defaultImperialValues(config: CalculatorConfig) {
  const mode = config.modes.find((m) => m.id === config.defaultMode) ?? config.modes[0];
  if (!mode) throw new Error(`no mode for ${config.slug}`);
  const values: Record<string, number> = {};
  const present = new Set<string>();
  for (const field of mode.fields) {
    if (field.defaultImp === "") continue;
    const n = Number(field.defaultImp);
    if (Number.isNaN(n)) continue;
    values[field.id] = toCanonical(n, field);
    present.add(field.id);
  }
  return { mode, values, present };
}

describe("Result Hero: heroResultLabel matches a real result row", () => {
  for (const slug of ALL) {
    it(`${slug}: hero label matches a default result row`, () => {
      const config = mustGetConfig(slug);
      const label = config.heroResultLabel;
      expect(label, `${slug} must set heroResultLabel`).toBeDefined();
      const { mode, values, present } = defaultImperialValues(config);
      const output = mode.compute(values, present, "imperial");
      const labels = output.rows.map((r) => r.label);
      expect(
        labels,
        `${slug} hero label "${label}" matches no result row (${labels.join(", ")})`,
      ).toContain(label);
    });
  }
});

describe("QA-17B1-UI-01: safety-critical FAQ answers are open by default", () => {
  it("exactly the four safety-critical FAQs are flagged openByDefault", () => {
    const flagged: string[] = [];
    for (const config of Object.values(CALCULATOR_CONFIGS)) {
      for (const faq of config.faqs) {
        if (faq.openByDefault) flagged.push(`${config.slug}: ${faq.question}`);
      }
    }
    expect(flagged.sort()).toEqual(
      [
        "stair-calculator: How deep should stair treads be?",
        "mulch-calculator: How deep should mulch be?",
        "paver-calculator: How thick is the sand under pavers?",
        "ceiling-tile-calculator: Can I replace ceiling tiles without replacing the grid?",
      ].sort(),
    );
  });
});
