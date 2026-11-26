import { describe, expect, it } from "vitest";
import { CALCULATOR_CONFIGS } from "./index";
import { linkedTextToPlain } from "../lib/linked-text";
import type { CalculatorConfig, DepthSection } from "../components/react/CalculatorConfig";

/**
 * Phase 17B1-UI Stage 1 (Direction C+): the flag gates exactly the three
 * representative calculators, and every collapsed chapter's takeaway is a
 * verified condensation of its own chapter — no new claims, no invented
 * numbers. Rendered-HTML preservation is covered by
 * tests/ui-stage1-preservation.spec.ts.
 */

const STAGE1 = ["paint-calculator", "tile-adhesive-calculator", "stair-calculator"] as const;

/** Indexed access is possibly-undefined under strict TS; the slugs are known to exist. */
function mustGetConfig(slug: (typeof STAGE1)[number]): CalculatorConfig {
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

describe("Direction C+ Stage 1 flags", () => {
  it("flags exactly the three Stage 1 calculators", () => {
    const flagged = Object.values(CALCULATOR_CONFIGS)
      .filter((c) => c.designCplus === true)
      .map((c) => c.slug)
      .sort();
    expect(flagged).toEqual([...STAGE1].sort());
  });

  it("stair uses the new rise/run diagram", () => {
    expect(mustGetConfig("stair-calculator").diagram).toBe("stair");
  });

  it("collapses the long chapters and keeps the safety / worked-example chapters expanded", () => {
    const paint = mustGetConfig("paint-calculator").depthSections ?? [];
    expect(paint.filter((s) => s.takeaway).map((s) => s.id)).toEqual([
      "three-gallon-numbers",
      "wall-area-not-floor-area",
      "coats-and-coverage",
      "primer-two-figures",
    ]);
    expect(
      paint.find((s) => s.id === "worked-examples-one-wall-ceiling")?.takeaway,
    ).toBeUndefined();

    const stair = mustGetConfig("stair-calculator").depthSections ?? [];
    expect(stair.filter((s) => s.takeaway).map((s) => s.id)).toEqual([
      "how-riser-count-is-decided",
      "metric-display",
    ]);
    expect(stair.find((s) => s.id === "the-151-inch-rule")?.takeaway).toBeUndefined();
    expect(
      stair.find((s) => s.id === "worked-examples-9-ft-boundary-refusals")?.takeaway,
    ).toBeUndefined();

    expect(mustGetConfig("tile-adhesive-calculator").depthSections ?? []).toEqual([]);
  });
});

describe("Direction C+ takeaways are verified condensations", () => {
  for (const slug of STAGE1) {
    const config = mustGetConfig(slug);
    for (const section of config.depthSections ?? []) {
      if (!section.takeaway) continue;
      it(`${slug} / ${section.id}: takeaway is shorter than the chapter and uses only its numbers`, () => {
        const chapter = chapterPlainText(section);
        const takeaway = section.takeaway as string;
        expect(takeaway.length).toBeGreaterThan(0);
        expect(takeaway.split(/\s+/).length).toBeLessThan(chapter.split(/\s+/).length);
        for (const token of numberTokens(takeaway)) {
          expect(
            chapter.includes(token),
            `takeaway number "${token}" does not appear in chapter "${section.id}"`,
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
};

describe("QA-17B1-UI-02: takeaways carry their example assumptions and qualifications", () => {
  for (const slug of STAGE1) {
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

/** Default canonical values for a mode in imperial. defaultImp is
 * already canonical for the three Stage 1 calculators in imperial
 * (ft/ft² for Paint and Tile Adhesive, in for Stair). */
function defaultImperialValues(config: CalculatorConfig) {
  const mode = config.modes.find((m) => m.id === config.defaultMode) ?? config.modes[0];
  if (!mode) throw new Error(`no mode for ${config.slug}`);
  const values: Record<string, number> = {};
  const present = new Set<string>();
  for (const field of mode.fields) {
    if (field.defaultImp === "") continue;
    const n = Number(field.defaultImp);
    if (Number.isNaN(n)) {
      throw new Error(`non-numeric default for ${config.slug}.${field.id}`);
    }
    values[field.id] = n;
    present.add(field.id);
  }
  return { mode, values, present };
}

describe("Result Hero: heroResultLabel matches a real result row", () => {
  for (const slug of STAGE1) {
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
  it("only the Stair nosing FAQ is flagged openByDefault", () => {
    const flagged: string[] = [];
    for (const config of Object.values(CALCULATOR_CONFIGS)) {
      for (const faq of config.faqs) {
        if (faq.openByDefault) flagged.push(`${config.slug}: ${faq.question}`);
      }
    }
    expect(flagged).toEqual(["stair-calculator: How deep should stair treads be?"]);
  });
});
