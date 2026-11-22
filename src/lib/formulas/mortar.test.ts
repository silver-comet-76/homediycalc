import { describe, expect, it } from "vitest";
import { calculateMortar, MORTAR_MIX_RATIOS, MORTAR_MIX_YIELDS_FT3_PER_FT3 } from "./mortar";

describe("calculateMortar", () => {
  it("matches the FORMULAS.md worked example: 10 × 8 ft modular brick wall, ⅜ in joint, 15% waste", () => {
    // Face area per brick with joint: 8 × 2.625 = 21 in²; 144 / 21 = 6.857 bricks/ft².
    // 80 ft² -> 549 bricks. Mortar per brick: (21 − 17.15625) × 3.625 = 13.93 in³.
    // Volume: 549 × 13.93 / 1,728 × 1.15 = 5.09 ft³.
    // Bags from the QUIKRETE maximum (up to 37 bricks per 80 lb bag),
    // derated by the 15% waste allowance: 549 × 1.15 ÷ 37 = 17.06 -> 18.
    const r = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "N",
    });
    expect(r.unitsPerFt2).toBeCloseTo(6.857, 3);
    expect(r.unitsNeeded).toBe(549);
    expect(r.mortarVolumeFt3).toBeCloseTo(5.09, 2);
    expect(r.unitsPerBag).toBe(37);
    expect(r.bags).toBe(18);
    // Type N batch yields per ft³ of mortar: 0.17 cement, 0.17 lime, 1.0 sand.
    expect(r.cementFt3).toBeCloseTo(0.87, 2);
    expect(r.cementSacks).toBe(1);
    expect(r.limeFt3).toBeCloseTo(0.87, 2);
    expect(r.sandFt3).toBeCloseTo(5.09, 2);
  });

  it("reproduces the BIA figure of 8.1 ft³ of mortar per 1,000 modular bricks", () => {
    // Geometric joint volume: 1,000 × 13.93 in³ / 1,728 = 8.06 ft³.
    const r = calculateMortar({
      areaFt2: 1000 / (144 / 21),
      unit: "brick",
      jointIn: 0.375,
      wastePct: 0,
      mortarType: "N",
    });
    expect(r.unitsNeeded).toBe(1000);
    expect(r.mortarVolumeFt3).toBeCloseTo(8.06, 2);
    // With no waste allowance the rating applies to the bare count:
    // 1,000 ÷ 37 = 27.03 -> 28 bags.
    expect(r.bags).toBe(28);
  });

  it("calculates block walls with the standard 8 × 8 × 16 in block", () => {
    const r = calculateMortar({
      areaFt2: 100,
      unit: "block",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "S",
    });
    // Face area per block with joint: 16 × 8 = 128 in²; 1.125 blocks/ft².
    expect(r.unitsPerFt2).toBe(1.125);
    expect(r.unitsNeeded).toBe(113);
    expect(r.mortarVolumeFt3).toBeCloseTo(5.08, 2);
    // Bags from the QUIKRETE maximum (up to 13 standard blocks per
    // 80 lb bag), derated by the 15% waste allowance:
    // 113 × 1.15 ÷ 13 = 9.996 -> 10 bags.
    expect(r.unitsPerBag).toBe(13);
    expect(r.bags).toBe(10);
    // Type S batch yields per ft³ of mortar: 0.22 cement, 0.11 lime, 1.0 sand.
    expect(r.cementFt3).toBeCloseTo(1.12, 2);
    expect(r.cementSacks).toBe(2);
    expect(r.limeFt3).toBeCloseTo(0.56, 2);
    expect(r.sandFt3).toBeCloseTo(5.08, 2);
  });

  it("calculates site-mix parts for Type M from the ASTM C270 batch yields", () => {
    const r = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "M",
    });
    expect(r.mortarVolumeFt3).toBeCloseTo(5.09, 2);
    // Type M batch yields per ft³ of mortar: 0.33 cement, 0.08 lime, 1.0 sand.
    expect(r.cementFt3).toBeCloseTo(1.68, 2);
    expect(r.cementSacks).toBe(2);
    expect(r.limeFt3).toBeCloseTo(0.41, 2);
    expect(r.sandFt3).toBeCloseTo(5.09, 2);
  });

  it("calculates site-mix parts for Type O from the ASTM C270 batch yields", () => {
    const r = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "O",
    });
    expect(r.mortarVolumeFt3).toBeCloseTo(5.09, 2);
    // Type O batch yields per ft³ of mortar: 0.11 cement, 0.22 lime, 1.0 sand.
    expect(r.cementFt3).toBeCloseTo(0.56, 2);
    expect(r.cementSacks).toBe(1);
    expect(r.limeFt3).toBeCloseTo(1.12, 2);
    expect(r.sandFt3).toBeCloseTo(5.09, 2);
  });

  it("uses the ASTM C270 ratios for every mortar type", () => {
    expect(MORTAR_MIX_RATIOS.N).toEqual({ cement: 1, lime: 1, sand: 6 });
    expect(MORTAR_MIX_RATIOS.S).toEqual({ cement: 1, lime: 0.5, sand: 4.5 });
    expect(MORTAR_MIX_RATIOS.M).toEqual({ cement: 1, lime: 0.25, sand: 3.75 });
    expect(MORTAR_MIX_RATIOS.O).toEqual({ cement: 1, lime: 2, sand: 9 });
  });

  it("uses the ASTM C270 batch yields for every mortar type", () => {
    expect(MORTAR_MIX_YIELDS_FT3_PER_FT3.N).toEqual({ cement: 0.17, lime: 0.17, sand: 1.0 });
    expect(MORTAR_MIX_YIELDS_FT3_PER_FT3.S).toEqual({ cement: 0.22, lime: 0.11, sand: 1.0 });
    expect(MORTAR_MIX_YIELDS_FT3_PER_FT3.M).toEqual({ cement: 0.33, lime: 0.08, sand: 1.0 });
    expect(MORTAR_MIX_YIELDS_FT3_PER_FT3.O).toEqual({ cement: 0.11, lime: 0.22, sand: 1.0 });
  });

  it("calculates a block wall of the same 80 ft² as the brick worked example", () => {
    const r = calculateMortar({
      areaFt2: 80,
      unit: "block",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "N",
    });
    // 80 × 1.125 = 90 blocks. Mortar per block:
    // (128 − 15.625 × 7.625) × 7.625 = 67.55 in³.
    // Volume: 90 × 67.55 / 1,728 × 1.15 = 4.05 ft³.
    // Bags: 90 × 1.15 ÷ 13 = 7.96 -> 8 bags.
    expect(r.unitsNeeded).toBe(90);
    expect(r.mortarVolumeFt3).toBeCloseTo(4.05, 2);
    expect(r.unitsPerBag).toBe(13);
    expect(r.bags).toBe(8);
  });

  it("never recommends fewer bags than the manufacturer maximum allows", () => {
    // The derated bag count must cover the waste-adjusted unit count at
    // the rated maximum: bags × units-per-bag ≥ units × (1 + waste%).
    for (const unit of ["brick", "block"] as const) {
      for (const areaFt2 of [10, 80, 100, 250]) {
        const r = calculateMortar({
          areaFt2,
          unit,
          jointIn: 0.375,
          wastePct: 15,
          mortarType: "N",
        });
        expect(r.bags * r.unitsPerBag).toBeGreaterThanOrEqual(r.unitsNeeded * 1.15);
      }
    }
  });

  it("prices bags only when a price is entered", () => {
    const r = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "N",
      pricePerBag: 8,
    });
    expect(r.costUsd).toBe(144); // 18 bags × $8
    const unpriced = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "N",
    });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculateMortar({
      areaFt2: 0,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      mortarType: "N",
    });
    expect(r.unitsNeeded).toBe(0);
    expect(r.mortarVolumeFt3).toBe(0);
    expect(r.bags).toBe(0);
  });
});
