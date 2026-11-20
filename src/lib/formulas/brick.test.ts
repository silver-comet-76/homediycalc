import { describe, expect, it } from "vitest";
import { calculateBrick } from "./brick";

const MODULAR = {
  wallLengthFt: 10,
  wallHeightFt: 8,
  openingsFt2: 0,
  brickLengthIn: 7.625,
  brickHeightIn: 2.25,
  brickDepthIn: 3.625,
  jointIn: 0.375,
  wastePct: 5,
  mortarWastePct: 15,
  bricksPerMortarBag: 37,
};

describe("calculateBrick", () => {
  it("matches the FORMULAS.md worked example: 10 × 8 ft modular wall, 5% waste", () => {
    const r = calculateBrick(MODULAR);
    expect(r.grossAreaFt2).toBe(80);
    expect(r.netAreaFt2).toBe(80);
    expect(r.faceAreaPerBrickIn2).toBe(21);
    expect(r.bricksPerFt2).toBeCloseTo(6.86, 2);
    expect(r.bricksNeeded).toBe(576);
  });

  it("deducts openings from the wall area", () => {
    const r = calculateBrick({ ...MODULAR, openingsFt2: 21 });
    // Net 59 ft² × 6.857/ft² × 1.05 = 424.93 -> 425 bricks.
    expect(r.netAreaFt2).toBe(59);
    expect(r.bricksNeeded).toBe(425);
  });

  it("estimates mortar volume near the BIA figure and bags from the QUIKRETE yield", () => {
    const r = calculateBrick(MODULAR);
    // Geometric joint volume: 576 bricks × 0.00806 ft³ × 1.15 ≈ 5.34 ft³.
    // BIA TN10 Table 4 lists 8.1 ft³ per 1,000 bricks (8.06 geometric here).
    expect(r.mortarVolumeFt3).toBeCloseTo(5.34, 2);
    // 576 ÷ 37 × 1.15 = 17.9 -> 18 bags of 80 lb mortar mix.
    expect(r.mortarBags).toBe(18);
  });

  it("counts pallets only when a pallet size is entered", () => {
    const r = calculateBrick({ ...MODULAR, palletSize: 500 });
    expect(r.pallets).toBe(2); // ceil(576 / 500)
    expect(calculateBrick(MODULAR).pallets).toBeUndefined();
  });

  it("adds brick and mortar costs only when prices are entered", () => {
    const both = calculateBrick({ ...MODULAR, pricePerBrick: 0.5, pricePerMortarBag: 8 });
    expect(both.costUsd).toBe(576 * 0.5 + 18 * 8);
    const bricksOnly = calculateBrick({ ...MODULAR, pricePerBrick: 0.5 });
    expect(bricksOnly.costUsd).toBe(288);
    expect(calculateBrick(MODULAR).costUsd).toBeUndefined();
  });

  it("handles a wall fully covered by openings", () => {
    const r = calculateBrick({ ...MODULAR, openingsFt2: 80 });
    expect(r.netAreaFt2).toBe(0);
    expect(r.bricksNeeded).toBe(0);
    expect(r.mortarBags).toBe(0);
  });
});
