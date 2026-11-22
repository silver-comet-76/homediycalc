import { describe, expect, it } from "vitest";
import { calculateBrick } from "./brick";
import { calculateMortar } from "./mortar";
import { convertLength } from "../units";

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
    expect(r.mortarBags! * 37).toBeGreaterThanOrEqual(549 * 1.15);
  });

  it("never recommends fewer mortar bags than the manufacturer maximum allows for the bricks bought", () => {
    const r = calculateBrick(MODULAR);
    expect(r.mortarBags!).toBeGreaterThanOrEqual(r.mortarBagsByRating!);
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

describe("calculateBrick — rating applicability (ADR-12, PR #2 second re-review)", () => {
  it("does not apply the rating to a wider joint: ¾ in joint, volume up, bags suppressed", () => {
    const r = calculateBrick({ ...MODULAR, jointIn: 0.75 });
    // The reviewer's example: 80 ft² modular wall, 15% mortar waste.
    // Volume rises 5.09 → 8.82 ft³ while the old count rule would have
    // fallen 18 → 15 bags — so no rating-based count is given at all.
    expect(r.mortarVolumeFt3).toBeCloseTo(8.82, 2);
    expect(r.bricksNeeded).toBe(482);
    expect(r.mortarBags).toBeNull();
    expect(r.mortarBagsByRating).toBeNull();
    expect(r.mortarBagsBasis).toBeNull();
  });

  it("uses a verified user-entered yield for a wider joint", () => {
    const r = calculateBrick({ ...MODULAR, jointIn: 0.75, bagYieldFt3: 0.3 });
    // 8.82 ft³ ÷ 0.3 ft³ per bag = 29.4 → 30 bags.
    expect(r.mortarBags).toBe(30);
    expect(r.mortarBagsBasis).toBe("user-yield");
    expect(r.mortarBagsByRating).toBeNull();
    const priced = calculateBrick({
      ...MODULAR,
      jointIn: 0.75,
      bagYieldFt3: 0.3,
      pricePerBrick: 0.5,
      pricePerMortarBag: 8,
    });
    expect(priced.costUsd).toBe(482 * 0.5 + 30 * 8);
  });

  it("excludes bag cost when the bag count is unknown", () => {
    const r = calculateBrick({
      ...MODULAR,
      jointIn: 0.75,
      pricePerBrick: 0.5,
      pricePerMortarBag: 8,
    });
    expect(r.mortarBags).toBeNull();
    expect(r.costUsd).toBe(482 * 0.5); // bricks only — no invented bag cost
  });

  it("keeps the rating for a narrower joint: ¼ in joint, volume down, count covers it", () => {
    const r = calculateBrick({ ...MODULAR, jointIn: 0.25 });
    expect(r.mortarVolumeFt3).toBeCloseTo(3.58, 2);
    expect(r.mortarBags).toBe(19);
    expect(r.mortarBagsBasis).toBe("rating");
    // Coverage at the rating's implied yield (37 × 0.00806 ≈ 0.30 ft³
    // per bag): 19 bags provide ≈ 5.67 ft³ ≥ 3.58 ft³.
    expect(r.mortarBags! * 37 * 0.00806).toBeGreaterThanOrEqual(r.mortarVolumeFt3);
  });

  it("does not apply the rating to non-modular brick sizes", () => {
    const deep = calculateBrick({ ...MODULAR, brickDepthIn: 4.5 });
    expect(deep.mortarVolumeFt3).toBeCloseTo(6.32, 2);
    expect(deep.mortarBags).toBeNull();
    expect(calculateBrick({ ...MODULAR, brickLengthIn: 8 }).mortarBags).toBeNull();
    expect(calculateBrick({ ...MODULAR, brickHeightIn: 3 }).mortarBags).toBeNull();
  });

  it("accepts metric inputs that match the standard geometry", () => {
    // Metric defaults from the config: 194 × 57 × 92 mm brick, 9.5 mm joint.
    const metric = calculateBrick({
      ...MODULAR,
      brickLengthIn: convertLength(194, "mm", "in"),
      brickHeightIn: convertLength(57, "mm", "in"),
      brickDepthIn: convertLength(92, "mm", "in"),
      jointIn: convertLength(9.5, "mm", "in"),
    });
    expect(metric.mortarBags).toBe(18);
    expect(metric.mortarBagsBasis).toBe("rating");
    expect(metric.mortarVolumeFt3).toBeCloseTo(5.09, 2);
    // Metric wide joint (19.05 mm = ¾ in): same suppression as imperial.
    const wideMetric = calculateBrick({ ...MODULAR, jointIn: convertLength(19.05, "mm", "in") });
    expect(wideMetric.mortarVolumeFt3).toBeCloseTo(8.82, 2);
    expect(wideMetric.mortarBags).toBeNull();
  });
});
