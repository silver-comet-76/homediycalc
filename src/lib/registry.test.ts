import { describe, expect, it } from "vitest";
import {
  CALCULATORS,
  CATEGORIES,
  getCalculator,
  getCalculatorsByCategory,
  getCalculatorsByPriority,
  getCategory,
  getRelatedCalculators,
} from "./registry";

describe("registry completeness", () => {
  it("registers exactly 31 calculators", () => {
    expect(CALCULATORS).toHaveLength(31);
  });
  it("has 11 P0, 13 P1, and 7 P2 calculators", () => {
    expect(getCalculatorsByPriority("P0")).toHaveLength(11);
    expect(getCalculatorsByPriority("P1")).toHaveLength(13);
    expect(getCalculatorsByPriority("P2")).toHaveLength(7);
  });
  it("has exactly 6 categories", () => {
    expect(CATEGORIES).toHaveLength(6);
  });
  it("has unique slugs and unique URLs", () => {
    const slugs = CALCULATORS.map((calc) => calc.slug);
    const urls = CALCULATORS.map((calc) => calc.url);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(urls).size).toBe(urls.length);
  });
  it("gives every calculator a /calculators/<slug>/ URL matching its slug", () => {
    for (const calc of CALCULATORS) {
      expect(calc.url).toBe(`/calculators/${calc.slug}/`);
    }
  });
  it("assigns every calculator to a known category", () => {
    for (const calc of CALCULATORS) {
      expect(getCategory(calc.category)).toBeDefined();
    }
  });
  it("gives every calculator a non-empty SEO title and description", () => {
    for (const calc of CALCULATORS) {
      expect(calc.seoTitle.length).toBeGreaterThan(0);
      expect(calc.seoDescription.length).toBeGreaterThan(0);
      expect(calc.seoDescription.length).toBeLessThanOrEqual(160);
      expect(calc.summary.length).toBeGreaterThan(0);
    }
  });
  it("matches the PRD priority lists", () => {
    const p0 = getCalculatorsByPriority("P0").map((calc) => calc.slug);
    expect(p0).toContain("concrete-calculator");
    expect(p0).toContain("square-footage-calculator");
    expect(p0).toContain("paint-calculator");
    expect(p0).toContain("gravel-calculator");
    expect(p0).toContain("mulch-calculator");
    expect(p0).toContain("concrete-slab-calculator");
    expect(p0).toContain("cubic-yard-calculator");
    expect(p0).toContain("cubic-feet-calculator");
    expect(p0).toContain("tile-calculator");
    expect(p0).toContain("brick-calculator");
    const p2 = getCalculatorsByPriority("P2").map((calc) => calc.slug);
    expect(p2).toContain("baseboard-calculator");
    expect(p2).toContain("waterproofing-calculator");
  });
  it("places P0 calculators in Phase 2, P1 in Phase 3, and P2 in Phase 4 — except the Phase 15 Stair Calculator, a P0 added later, and the five Phase 17 landscaping calculators, P1 added later", () => {
    const phase17 = new Set([
      "sand-calculator",
      "raised-bed-soil-calculator",
      "sod-calculator",
      "lawn-seed-calculator",
      "fence-calculator",
    ]);
    for (const calc of CALCULATORS) {
      const expected =
        calc.slug === "stair-calculator"
          ? 15
          : phase17.has(calc.slug)
            ? 17
            : calc.priority === "P0"
              ? 2
              : calc.priority === "P1"
                ? 3
                : 4;
      expect(calc.phase).toBe(expected);
    }
  });
  it("resolves every related slug to a registered calculator", () => {
    for (const calc of CALCULATORS) {
      expect(calc.related.length).toBeGreaterThan(0);
      for (const slug of calc.related) {
        expect(getCalculator(slug)).toBeDefined();
      }
      expect(getRelatedCalculators(calc)).toHaveLength(calc.related.length);
    }
  });
  it("covers every category with at least one calculator", () => {
    for (const category of CATEGORIES) {
      expect(getCalculatorsByCategory(category.slug).length).toBeGreaterThan(0);
    }
  });
  it("returns undefined for unknown slugs", () => {
    expect(getCalculator("not-a-calculator")).toBeUndefined();
    expect(getCategory("not-a-category")).toBeUndefined();
  });
});

describe("registry related graph (Phase 17B-1, A1–A4)", () => {
  /** Indegree: how many calculators list this slug in their `related` array. */
  function indegree(slug: string): number {
    return CALCULATORS.filter((calc) => calc.related.includes(slug)).length;
  }

  it("keeps exactly 93 related edges with exactly 3 outbound per calculator", () => {
    for (const calc of CALCULATORS) {
      expect(calc.related).toHaveLength(3);
      expect(new Set(calc.related).size).toBe(3);
      expect(calc.related).not.toContain(calc.slug);
    }
    expect(CALCULATORS.reduce((n, calc) => n + calc.related.length, 0)).toBe(93);
  });

  it("gives Paver and Stair at least one related inbound link (A1, A2)", () => {
    expect(indegree("paver-calculator")).toBeGreaterThanOrEqual(1);
    expect(indegree("stair-calculator")).toBeGreaterThanOrEqual(1);
  });

  it("leaves no calculator at related indegree 0", () => {
    for (const calc of CALCULATORS) {
      expect(indegree(calc.slug)).toBeGreaterThan(0);
    }
  });

  it("has the exact indegrees the A1–A4 swaps and the Phase 17B2 graph produce", () => {
    // A1: Gravel -> Paver (Mulch 2 -> 1). A2: Board Foot -> Stair (Flooring 6 -> 5).
    // A3: Drywall -> Primer (Square Footage 11 -> 10). A4: Wallpaper -> Drywall (Square Footage 10 -> 9).
    // Phase 17B2: Gravel -> Sand, Paver -> Sand, Topsoil -> Raised Bed/Sod/Lawn Seed,
    // Concrete Bags -> Fence, plus the five new calculators' own edges
    // (Square Footage 9 -> 11, Topsoil 3 -> 7, Paver 1 -> 2, Cubic Yard 4 -> 2,
    // Tile 8 -> 7, Mortar 2 -> 1, Concrete Bags 3 -> 4, Gravel 5 -> 6, Concrete 6 -> 7).
    expect(indegree("paver-calculator")).toBe(2);
    expect(indegree("stair-calculator")).toBe(1);
    expect(indegree("mulch-calculator")).toBe(1);
    expect(indegree("flooring-calculator")).toBe(5);
    expect(indegree("primer-calculator")).toBe(3);
    expect(indegree("drywall-calculator")).toBe(4);
    expect(indegree("square-footage-calculator")).toBe(11);
    expect(indegree("topsoil-calculator")).toBe(7);
    expect(indegree("cubic-yard-calculator")).toBe(2);
    expect(indegree("tile-calculator")).toBe(7);
    expect(indegree("mortar-calculator")).toBe(1);
    expect(indegree("concrete-bags-calculator")).toBe(4);
    expect(indegree("gravel-calculator")).toBe(6);
    expect(indegree("concrete-calculator")).toBe(7);
  });

  it("has the exact A1–A4 related arrays (Gravel rewired by Phase 17B2)", () => {
    expect(getCalculator("gravel-calculator")?.related).toEqual([
      "topsoil-calculator",
      "sand-calculator",
      "paver-calculator",
    ]);
    expect(getCalculator("board-foot-calculator")?.related).toEqual([
      "cubic-feet-calculator",
      "square-footage-calculator",
      "stair-calculator",
    ]);
    expect(getCalculator("drywall-calculator")?.related).toEqual([
      "primer-calculator",
      "ceiling-tile-calculator",
      "paint-calculator",
    ]);
    expect(getCalculator("wallpaper-calculator")?.related).toEqual([
      "paint-calculator",
      "drywall-calculator",
      "primer-calculator",
    ]);
    // Phase 17B2 rewiring and the five new calculators' arrays.
    expect(getCalculator("paver-calculator")?.related).toEqual([
      "sand-calculator",
      "gravel-calculator",
      "topsoil-calculator",
    ]);
    expect(getCalculator("topsoil-calculator")?.related).toEqual([
      "raised-bed-soil-calculator",
      "sod-calculator",
      "lawn-seed-calculator",
    ]);
    expect(getCalculator("concrete-bags-calculator")?.related).toEqual([
      "concrete-calculator",
      "concrete-slab-calculator",
      "fence-calculator",
    ]);
    expect(getCalculator("sand-calculator")?.related).toEqual([
      "gravel-calculator",
      "paver-calculator",
      "topsoil-calculator",
    ]);
    expect(getCalculator("raised-bed-soil-calculator")?.related).toEqual([
      "topsoil-calculator",
      "mulch-calculator",
      "sod-calculator",
    ]);
    expect(getCalculator("sod-calculator")?.related).toEqual([
      "topsoil-calculator",
      "lawn-seed-calculator",
      "square-footage-calculator",
    ]);
    expect(getCalculator("lawn-seed-calculator")?.related).toEqual([
      "sod-calculator",
      "topsoil-calculator",
      "square-footage-calculator",
    ]);
    expect(getCalculator("fence-calculator")?.related).toEqual([
      "concrete-bags-calculator",
      "concrete-calculator",
      "gravel-calculator",
    ]);
  });
});

describe("registry metadata (Phase 17B-1, Tranche C)", () => {
  it("uses the 8 updated titles and descriptions, with no description over 160 chars", () => {
    const expected: Record<string, { seoTitle?: string; seoDescription?: string }> = {
      "concrete-calculator": {
        seoDescription:
          "Calculate how much concrete you need in cubic yards, cubic feet, and bags. Enter length, width, and depth — get an estimated order amount.",
      },
      "mulch-calculator": {
        seoDescription:
          "Calculate how much mulch you need in cubic yards and bags. Enter bed area and depth — get an estimated amount for your garden.",
      },
      "cubic-yard-calculator": {
        seoDescription:
          "Convert cubic feet to cubic yards and back, or calculate volume from dimensions. Free and instant.",
      },
      "cubic-feet-calculator": {
        seoTitle: "Cubic Feet Calculator — Volume from Dimensions | HomeDIYCalc",
      },
      "flooring-calculator": {
        seoTitle: "Flooring Calculator — Square Feet, Boxes & Waste | HomeDIYCalc",
      },
      "primer-calculator": {
        seoTitle: "Primer Calculator — Gallons for Drywall & Repaints | HomeDIYCalc",
      },
      "waterproofing-calculator": {
        seoDescription:
          "Calculate how much waterproofing membrane you need for a shower or bathroom. Enter area and coats — get gallons or liters with coverage you can adjust.",
      },
      "stair-calculator": {
        seoDescription:
          "Calculate riser height, tread count, total run, and stringer length for a straight staircase — a preliminary planning estimate under 2021 IRC limits.",
      },
    };
    for (const [slug, fields] of Object.entries(expected)) {
      const calc = getCalculator(slug);
      expect(calc).toBeDefined();
      if (fields.seoTitle !== undefined) expect(calc?.seoTitle).toBe(fields.seoTitle);
      if (fields.seoDescription !== undefined) {
        expect(calc?.seoDescription).toBe(fields.seoDescription);
      }
    }
    for (const calc of CALCULATORS) {
      expect(calc.seoDescription.length).toBeLessThanOrEqual(160);
    }
  });

  it("makes no 'exact' accuracy claim in any description", () => {
    for (const calc of CALCULATORS) {
      expect(calc.seoDescription).not.toMatch(/\bexact\b/i);
    }
  });
});
