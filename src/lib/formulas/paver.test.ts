import { describe, expect, it } from "vitest";
import { baseExtensionIn, calculatePaver, extendedFootprintFt2 } from "./paver";

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
    const r = calculatePaver({ ...BASE, areaFt2: 192, lengthFt: 16, widthFt: 12 });
    // Effective paver area with a ⅛ in joint: 12.125 × 12.125 / 144 = 1.0209 ft².
    expect(r.paverAreaFt2).toBeCloseTo(1.0209, 4);
    // 192 × 1.10 / 1.0209 = 206.86 -> 207 pavers.
    expect(r.pavers).toBe(207);
    // The base extends 6 in past the paver edge on every side:
    // 17 × 13 = 221 ft² of base footprint.
    expect(r.baseAreaFt2).toBe(221);
    // Base compacted: 221 × 4/12 / 27 = 2.73 yd³; loose × 1.25 = 3.41 yd³.
    expect(r.baseCompactedYd3).toBeCloseTo(2.73, 2);
    expect(r.baseLooseYd3).toBeCloseTo(3.41, 2);
    // Tons come from the LOOSE volume (mass is conserved through
    // compaction): 3.41 yd³ × 2,800 lb/yd³ / 2,000 = 4.77 t.
    expect(r.baseTons).toBeCloseTo(4.77, 2);
    expect(r.baseTons).toBeCloseTo((r.baseLooseYd3 * 2800) / 2000, 6);
    // Bedding sand over the same extended footprint:
    // 221 × 1/12 = 18.42 ft³ = 0.68 yd³; 0.68 × 2,750 / 2,000 = 0.94 t.
    expect(r.beddingSandFt3).toBeCloseTo(18.42, 2);
    expect(r.beddingSandYd3).toBeCloseTo(0.68, 2);
    expect(r.beddingSandTons).toBeCloseTo(0.94, 2);
    // Joint sand: about 7.02 in³/ft², 77.9 lb total -> 2 bags of 50 lb.
    expect(r.jointSandIn3PerFt2).toBeCloseTo(7.02, 2);
    expect(r.jointSandLb).toBeCloseTo(77.95, 1);
    expect(r.jointSandBags).toBe(2);
  });

  it("computes base tons from the loose volume, not the compacted volume (PVR-1)", () => {
    const r = calculatePaver({ ...BASE, areaFt2: 192, lengthFt: 16, widthFt: 12 });
    // Compacted-based tons would be 2.73 × 1.4 = 3.82 t; the loose
    // volume ordered is what is actually delivered and weighed.
    expect(r.baseTons).toBeCloseTo(4.77, 2);
    expect(r.baseTons).toBeGreaterThan(3.82);
    expect(r.baseTons / r.baseLooseYd3).toBeCloseTo(2800 / 2000, 6);
  });

  it("extends the base by the base thickness when it exceeds 6 in (PVR-2)", () => {
    expect(baseExtensionIn(4)).toBe(6);
    expect(baseExtensionIn(6)).toBe(6);
    expect(baseExtensionIn(8)).toBe(8);
    // 16 × 12 ft patio with an 8 in base: (16 + 16/12) × (12 + 16/12)
    // = 231.11 ft² of base footprint.
    expect(extendedFootprintFt2(192, 8, 16, 12)).toBeCloseTo(231.11, 2);
    const r = calculatePaver({ ...BASE, areaFt2: 192, lengthFt: 16, widthFt: 12, baseDepthIn: 8 });
    expect(r.baseAreaFt2).toBeCloseTo(231.11, 2);
    expect(r.baseCompactedYd3).toBeCloseTo(5.71, 2);
    expect(r.baseLooseYd3).toBeCloseTo(7.13, 2);
  });

  it("estimates the extended footprint as a square when only the area is known", () => {
    // 192 ft² with a 4 in base: (√192 + 1)² = 220.71 ft² — within
    // 0.3 ft² of the exact 16 × 12 ft figure of 221 ft².
    const r = calculatePaver({ ...BASE, areaFt2: 192 });
    expect(r.baseAreaFt2).toBeCloseTo(220.71, 2);
    expect(r.baseCompactedYd3).toBeCloseTo(2.72, 2);
    expect(r.baseLooseYd3).toBeCloseTo(3.41, 2);
    expect(r.baseTons).toBeCloseTo(4.77, 2);
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

  it("uses a 6 in base for a residential driveway (ICPI Tech Spec 2, PVR-3)", () => {
    // 16 × 12 ft driveway, 6 in base: base footprint is still 221 ft²
    // (extension 6 in, the base thickness is no deeper than 6 in).
    const r = calculatePaver({ ...BASE, areaFt2: 192, lengthFt: 16, widthFt: 12, baseDepthIn: 6 });
    expect(r.baseAreaFt2).toBe(221);
    expect(r.baseCompactedYd3).toBeCloseTo(4.09, 2);
    expect(r.baseLooseYd3).toBeCloseTo(5.12, 2);
  });

  it("recomputes joint-sand coverage per 50 lb bag from the joint volume (PVR-4)", () => {
    // Coverage per bag = 50 lb ÷ (joint-sand lb per ft²).
    // 12 × 12 in pavers, ⅛ in joints: ~123 ft² per bag.
    const big = calculatePaver({ ...BASE, areaFt2: 100 });
    expect(50 / (big.jointSandLb / 100)).toBeCloseTo(123, 0);
    // 4 × 8 in pavers, same joints: ~56 ft² per bag.
    const small = calculatePaver({ ...BASE, areaFt2: 100, paverLengthIn: 4, paverWidthIn: 8 });
    expect(50 / (small.jointSandLb / 100)).toBeCloseTo(56, 0);
  });

  it("prices pavers, base, and joint sand only when prices are entered", () => {
    const r = calculatePaver({
      ...BASE,
      areaFt2: 192,
      pricePerPaver: 2,
      pricePerYd3Base: 40,
      pricePerJointSandBag: 25,
    });
    // Area-only mode estimates the extended footprint as a square:
    // loose base 3.41 yd³, so 207 × 2 + 3.41 × 40 + 2 × 25 = 600.24.
    expect(r.baseLooseYd3).toBeCloseTo(3.41, 2);
    expect(r.costUsd).toBeCloseTo(600.24, 1);
    const unpriced = calculatePaver({ ...BASE, areaFt2: 192 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculatePaver({ ...BASE, areaFt2: 0 });
    expect(r.pavers).toBe(0);
    expect(r.baseAreaFt2).toBe(0);
    expect(r.baseLooseYd3).toBe(0);
    expect(r.jointSandBags).toBe(0);
  });
});
