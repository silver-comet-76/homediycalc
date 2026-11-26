import { describe, expect, it } from "vitest";
import { tileConfig } from "./tile-calculator/config";
import { tileAdhesiveConfig } from "./tile-adhesive-calculator/config";
import { gravelConfig } from "./gravel-calculator/config";
import { calculateTile } from "../lib/formulas/tile";
import { calculateTileAdhesive } from "../lib/formulas/tile-adhesive";
import { calculateGravel } from "../lib/formulas/gravel";

/**
 * Worked-example prose pinned to its formula (Phase 17B-1, D-1/D-2/D-3).
 *
 * Nothing tested the prose before: lookup-table.test.ts recomputes table
 * cells from compute() but never reads workedExample, and the formula
 * tests assert formula outputs, not the strings shown to users. That is
 * how all three defects shipped with a green suite. Each test below
 * recomputes the figure from the formula with the example's stated
 * inputs AND asserts the prose string contains that figure, so a future
 * prose edit that reintroduces a wrong number fails the gate.
 */
describe("worked examples agree with their formulas", () => {
  it("D-1 tile: 100 ft², 12×12 in, ⅛ in joint, 10% waste → 108 tiles, 11 boxes", () => {
    const r = calculateTile({
      areaFt2: 100,
      tileLengthIn: 12,
      tileWidthIn: 12,
      jointIn: 0.125,
      wastePct: 10,
      tilesPerBox: 10,
    });
    expect(r.tilesNeeded).toBe(108);
    expect(r.boxesNeeded).toBe(11);
    expect(tileConfig.workedExample).toContain("108 tiles");
    expect(tileConfig.workedExample).toContain("11 boxes");
    expect(tileConfig.workedExample).not.toContain("110 tiles");
  });

  it("D-2 tile adhesive: 100 ft², ½×½ in notch (42 ft²/bag), 10% waste → 3 bags", () => {
    const r = calculateTileAdhesive({
      areaFt2: 100,
      coveragePer50LbBagFt2: 42,
      bagWeightLb: 50,
      backButter: false,
      wastePct: 10,
    });
    expect(r.bags).toBe(3);
    expect(r.adhesiveLb).toBeCloseTo(130.95, 2);
    expect(tileAdhesiveConfig.workedExample).toContain("3 bags");
    expect(tileAdhesiveConfig.workedExample).not.toContain("needs 6 bags");
  });

  it("D-3 gravel: 10×10 ft, 3 in deep, 5% allowance, 2,800 lb/yd³ → 2,722 lb / 1.36 US short tons", () => {
    const r = calculateGravel({
      lengthFt: 10,
      widthFt: 10,
      depthFt: 3 / 12,
      wastePct: 5,
      densityLbPerYd3: 2800,
    });
    expect(r.weightLb).toBeCloseTo(2722.22, 1);
    expect(r.weightTons).toBeCloseTo(1.36, 2);
    expect(gravelConfig.workedExample).toContain("2,722 lb");
    expect(gravelConfig.workedExample).toContain("1.36 US short tons");
    // The no-allowance figure is kept, but only as a labelled figure:
    expect(gravelConfig.workedExample).toContain("before the allowance");
  });
});
