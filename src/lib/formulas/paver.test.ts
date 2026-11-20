import { describe, expect, it } from "vitest";
import { calculatePaver } from "./paver";

const BASE = {
  paverLengthIn: 12,
  paverWidthIn: 12,
  jointIn: 0.125,
  paverThicknessIn: 2.375,
  wastePct: 10,
  baseDepthIn: 4,
  baseDensityLbYd3: 2800,
  beddingSandDepthIn: 1,
  beddingSandDensityLbYd3: 2750,
  jointSandDensityLbFt3: 100,
  jointSandBagLb: 50,
};

describe("calculatePaver", () => {
  it("matches the FORMULAS.md worked example: 16 × 12 ft patio, 12 × 12 pavers, 4 in base", () => {
    const r = calculatePaver({ ...BASE, areaFt2: 192 });
    // Effective paver area with a ⅛ in joint: 12.125 × 12.125 / 144 = 1.0209 ft².
    expect(r.paverAreaFt2).toBeCloseTo(1.0209, 4);
    // 192 × 1.10 / 1.0209 = 206.86 -> 207 pavers.
    expect(r.pavers).toBe(207);
    // Base compacted: 192 × 4/12 / 27 = 2.37 yd³; loose × 1.25 = 2.96 yd³.
    expect(r.baseCompactedYd3).toBeCloseTo(2.37, 2);
    expect(r.baseLooseYd3).toBeCloseTo(2.96, 2);
    // Tons: 2.37 yd³ × 2,800 lb/yd³ / 2,000 = 3.32 t.
    expect(r.baseTons).toBeCloseTo(3.32, 2);
    // Bedding sand: 192 × 1/12 = 16 ft³ = 0.59 yd³; 0.59 × 2,750 / 2,000 = 0.81 t.
    expect(r.beddingSandFt3).toBe(16);
    expect(r.beddingSandYd3).toBeCloseTo(0.59, 2);
    expect(r.beddingSandTons).toBeCloseTo(0.81, 2);
    // Joint sand: about 7.02 in³/ft², 77.9 lb total -> 2 bags of 50 lb.
    expect(r.jointSandIn3PerFt2).toBeCloseTo(7.02, 2);
    expect(r.jointSandLb).toBeCloseTo(77.95, 1);
    expect(r.jointSandBags).toBe(2);
  });

  it("rounds pavers up and scales joint sand with paver size", () => {
    const small = calculatePaver({ ...BASE, areaFt2: 100, paverLengthIn: 4, paverWidthIn: 8 });
    // 4 × 8 pavers: about 4.5 per ft² before waste; small pavers need far
    // more joint sand per square foot than 12 × 12 pavers.
    expect(small.pavers).toBeGreaterThan(400);
    expect(small.jointSandIn3PerFt2).toBeGreaterThan(15);
    const big = calculatePaver({ ...BASE, areaFt2: 100 });
    expect(big.jointSandIn3PerFt2).toBeCloseTo(7.02, 2);
  });

  it("uses an 8 in base for a driveway", () => {
    const r = calculatePaver({ ...BASE, areaFt2: 192, baseDepthIn: 8 });
    expect(r.baseCompactedYd3).toBeCloseTo(4.74, 2);
    expect(r.baseLooseYd3).toBeCloseTo(5.93, 2);
  });

  it("prices pavers, base, and joint sand only when prices are entered", () => {
    const r = calculatePaver({
      ...BASE,
      areaFt2: 192,
      pricePerPaver: 2,
      pricePerYd3Base: 40,
      pricePerJointSandBag: 25,
    });
    expect(r.costUsd).toBeCloseTo(207 * 2 + 2.96296 * 40 + 2 * 25, 1);
    const unpriced = calculatePaver({ ...BASE, areaFt2: 192 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculatePaver({ ...BASE, areaFt2: 0 });
    expect(r.pavers).toBe(0);
    expect(r.baseLooseYd3).toBe(0);
    expect(r.jointSandBags).toBe(0);
  });
});
