import { describe, expect, it } from "vitest";
import { calculateMortar, MORTAR_MIX_RATIOS } from "./mortar";

describe("calculateMortar", () => {
  it("matches the FORMULAS.md worked example: 10 × 8 ft modular brick wall, ⅜ in joint, 15% waste", () => {
    // Face area per brick with joint: 8 × 2.625 = 21 in²; 144 / 21 = 6.857 bricks/ft².
    // 80 ft² -> 549 bricks. Mortar per brick: (21 − 17.15625) × 3.625 = 13.93 in³.
    // Volume: 549 × 13.93 / 1,728 × 1.15 = 5.09 ft³ -> 9 bags at 0.6 ft³ per bag.
    const r = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      bagYieldFt3: 0.6,
      mortarType: "N",
    });
    expect(r.unitsPerFt2).toBeCloseTo(6.857, 3);
    expect(r.unitsNeeded).toBe(549);
    expect(r.mortarVolumeFt3).toBeCloseTo(5.09, 2);
    expect(r.bags).toBe(9);
    // Type N is 1:1:6 by volume (8 parts): cement and lime 5.09/8 each.
    expect(r.cementFt3).toBeCloseTo(0.64, 2);
    expect(r.cementSacks).toBe(1);
    expect(r.limeFt3).toBeCloseTo(0.64, 2);
    expect(r.sandFt3).toBeCloseTo(3.82, 2);
  });

  it("reproduces the BIA figure of 8.1 ft³ of mortar per 1,000 modular bricks", () => {
    // Geometric joint volume: 1,000 × 13.93 in³ / 1,728 = 8.06 ft³.
    const r = calculateMortar({
      areaFt2: 1000 / (144 / 21),
      unit: "brick",
      jointIn: 0.375,
      wastePct: 0,
      bagYieldFt3: 0.6,
      mortarType: "N",
    });
    expect(r.unitsNeeded).toBe(1000);
    expect(r.mortarVolumeFt3).toBeCloseTo(8.06, 2);
  });

  it("calculates block walls with the standard 8 × 8 × 16 in block", () => {
    const r = calculateMortar({
      areaFt2: 100,
      unit: "block",
      jointIn: 0.375,
      wastePct: 15,
      bagYieldFt3: 0.6,
      mortarType: "S",
    });
    // Face area per block with joint: 16 × 8 = 128 in²; 1.125 blocks/ft².
    expect(r.unitsPerFt2).toBe(1.125);
    expect(r.unitsNeeded).toBe(113);
    expect(r.mortarVolumeFt3).toBeCloseTo(5.08, 2);
    expect(r.bags).toBe(9);
    // Type S is 1:½:4½ (6 parts): cement 5.08/6, lime 5.08/12, sand 5.08 × 4.5/6.
    expect(r.cementFt3).toBeCloseTo(0.85, 2);
    expect(r.limeFt3).toBeCloseTo(0.42, 2);
    expect(r.sandFt3).toBeCloseTo(3.81, 2);
  });

  it("uses the ASTM C270 ratios for every mortar type", () => {
    expect(MORTAR_MIX_RATIOS.N).toEqual({ cement: 1, lime: 1, sand: 6 });
    expect(MORTAR_MIX_RATIOS.S).toEqual({ cement: 1, lime: 0.5, sand: 4.5 });
    expect(MORTAR_MIX_RATIOS.M).toEqual({ cement: 1, lime: 0.25, sand: 3.75 });
    expect(MORTAR_MIX_RATIOS.O).toEqual({ cement: 1, lime: 2, sand: 9 });
  });

  it("prices bags only when a price is entered", () => {
    const r = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      bagYieldFt3: 0.6,
      mortarType: "N",
      pricePerBag: 8,
    });
    expect(r.costUsd).toBe(72);
    const unpriced = calculateMortar({
      areaFt2: 80,
      unit: "brick",
      jointIn: 0.375,
      wastePct: 15,
      bagYieldFt3: 0.6,
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
      bagYieldFt3: 0.6,
      mortarType: "N",
    });
    expect(r.unitsNeeded).toBe(0);
    expect(r.mortarVolumeFt3).toBe(0);
    expect(r.bags).toBe(0);
  });
});
