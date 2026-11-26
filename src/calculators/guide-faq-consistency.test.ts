import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tileConfig } from "./tile-calculator/config";
import { gravelConfig } from "./gravel-calculator/config";

/**
 * Category-guide FAQs agree with the calculator worked examples
 * (Phase 17B-1 corrective commit, D-1b/D-3b).
 *
 * The guide FAQs restate the Tile and Gravel worked examples in prose.
 * D-1 and D-3 corrected the calculator pages, but the same wrong figures
 * (110 tiles; 2,593 lb as the unqualified answer) also sat in the
 * Flooring and Tiles and Landscaping guide FAQs. These tests pin the
 * corrected figures in both places, so a future edit that reintroduces
 * either wrong figure — on the calculator page or in the guide — fails
 * the gate.
 */
const guideSource = readFileSync(
  new URL("../pages/categories/[slug].astro", import.meta.url),
  "utf8",
);

describe("category-guide FAQs agree with the calculator examples", () => {
  it("D-1b tile guide FAQ: 100 ft², 12×12 in, ⅛ in joint, 10% waste → 108 tiles, 11 boxes", () => {
    expect(tileConfig.workedExample).toContain("108 tiles");
    expect(guideSource).toContain("108 tiles");
    expect(guideSource).toContain("1.02 square feet");
    expect(guideSource).toContain("11 boxes");
    expect(guideSource).not.toContain("100 × 1.10 = 110 tiles");
  });

  it("D-3b gravel guide FAQ: 10×10 ft, 3 in deep, 5% allowance, 2,800 lb/yd³ → 2,722 lb / 1.36 US short tons", () => {
    expect(gravelConfig.workedExample).toContain("2,722 lb");
    expect(guideSource).toContain("2,722 lb");
    expect(guideSource).toContain("1.36 US short tons");
    expect(guideSource).toContain("before the allowance");
    expect(guideSource).not.toContain("that is 2,593 lb, about 1.30 US tons");
  });
});
