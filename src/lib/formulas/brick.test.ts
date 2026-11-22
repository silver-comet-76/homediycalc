import { describe, expect, it } from "vitest";
import { calculateBrick } from "./brick";
import { calculateMortar } from "./mortar";

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

  it("estimates mortar volume near the BIA figure and bags from the manufacturer rating", () => {
    const r = calculateBrick(MODULAR);
    // Geometric joint volume from the pre-waste count: 549 bricks × 0.00806 ft³ × 1.15 ≈ 5.09 ft³.
    // BIA TN10 Table 4 lists 8.1 ft³ per 1,000 bricks (8.06 geometric here).
    expect(r.mortarVolumeFt3).toBeCloseTo(5.09, 2);
    // Rating floor — the bricks you buy at the QUIKRETE maximum (up to 37
    // per 80 lb bag): 576 ÷ 37 = 15.57 -> 16 bags. The recommendation
    // never goes below this (PR #2 review, P0).
    expect(r.mortarBagsByRating).toBe(16);
    // Governing figure — the rating derated by the 15% mortar waste
    // allowance: 549 installed × 1.15 ÷ 37 = 17.06 -> 18 bags. The larger
    // of the two governs, so the volume (5.09 ft³) is covered at the
    // rating's implied yield (37 × 0.00806 ≈ 0.30 ft³ per bag):
    // 18 × 37 = 666 ≥ 549 × 1.15 = 631.35.
    expect(r.mortarBags).toBe(18);
    expect(r.mortarBags * 37).toBeGreaterThanOrEqual(549 * 1.15);
  });

  it("never recommends fewer mortar bags than the manufacturer maximum allows for the bricks bought", () => {
    const r = calculateBrick(MODULAR);
    expect(r.mortarBags).toBeGreaterThanOrEqual(r.mortarBagsByRating);
    // With no mortar waste allowance, the derated figure falls back to
    // the installed count and the bought-bricks floor governs: 16 bags.
    const noWaste = calculateBrick({ ...MODULAR, mortarWastePct: 0 });
    expect(noWaste.mortarBags).toBe(16);
    expect(noWaste.mortarBagsByRating).toBe(16);
  });

  it("agrees with the Mortar Calculator on mortar volume and bags for the same wall", () => {
    const brick = calculateBrick(MODULAR);
    const mortar = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "N",
    });
    expect(brick.mortarVolumeFt3).toBeCloseTo(mortar.mortarVolumeFt3, 2);
    expect(brick.mortarBags).toBe(18);
    expect(mortar.bags).toBe(18);
    expect(brick.mortarBags).toBe(mortar.bags);
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
