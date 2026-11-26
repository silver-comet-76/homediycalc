import { describe, expect, it } from "vitest";
import { CALCULATOR_CONFIGS } from "./index";
import { linkedTextToPlain } from "../lib/linked-text";
import type {
  CalculatorConfig,
  DepthSection,
} from "../components/react/CalculatorConfig";

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
