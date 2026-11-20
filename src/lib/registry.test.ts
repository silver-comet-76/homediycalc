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
  it("registers exactly 25 calculators", () => {
    expect(CALCULATORS).toHaveLength(25);
  });
  it("has 10 P0, 8 P1, and 7 P2 calculators", () => {
    expect(getCalculatorsByPriority("P0")).toHaveLength(10);
    expect(getCalculatorsByPriority("P1")).toHaveLength(8);
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
  it("places P0 calculators in Phase 2, P1 in Phase 3, and P2 in Phase 4", () => {
    for (const calc of CALCULATORS) {
      expect(calc.phase).toBe(
        calc.priority === "P0" ? 2 : calc.priority === "P1" ? 3 : 4,
      );
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
