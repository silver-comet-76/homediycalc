import { describe, expect, it } from "vitest";
import { calculateGravel } from "./gravel";

describe("calculateGravel", () => {
  it("matches the FORMULAS.md worked example: 10 × 10 ft, 3 in deep, 2,800 lb/yd³", () => {
    const r = calculateGravel({
      lengthFt: 10,
      widthFt: 10,
      depthFt: 3 / 12,
      wastePct: 0,
      densityLbPerYd3: 2800,
    });
    expect(r.volumeFt3).toBe(25);
    expect(r.volumeYd3).toBeCloseTo(0.93, 2);
    expect(r.weightLb).toBeCloseTo(2592.59, 1);
    expect(r.weightTons).toBeCloseTo(1.3, 2);
    expect(r.weightKg).toBeCloseTo(1175.97, 1);
  });

  it("applies the waste allowance before ordering and weighing", () => {
    const r = calculateGravel({
      lengthFt: 10,
      widthFt: 10,
      depthFt: 3 / 12,
      wastePct: 5,
      densityLbPerYd3: 2800,
    });
    expect(r.adjustedYd3).toBeCloseTo(0.97, 2);
    expect(r.orderYd3).toBe(1);
    expect(r.weightLb).toBeCloseTo(2722.22, 1);
  });

  it("rounds the order up to whole cubic yards", () => {
    const r = calculateGravel({
      lengthFt: 20,
      widthFt: 10,
      depthFt: 4 / 12,
      wastePct: 0,
      densityLbPerYd3: 2800,
    });
    // 66.67 ft³ = 2.47 yd³ -> order 3 yd³.
    expect(r.orderYd3).toBe(3);
  });

  it("counts bags only when a bag weight is entered, and costs only with a price", () => {
    const r = calculateGravel({
      lengthFt: 10,
      widthFt: 10,
      depthFt: 3 / 12,
      wastePct: 0,
      densityLbPerYd3: 2800,
      bagWeightLb: 50,
      pricePerYd3: 60,
    });
    expect(r.bags).toBe(52); // ceil(2592.59 / 50)
    expect(r.costUsd).toBe(60); // 1 yd³ × $60
    const noBag = calculateGravel({
      lengthFt: 10,
      widthFt: 10,
      depthFt: 3 / 12,
      wastePct: 0,
      densityLbPerYd3: 2800,
    });
    expect(noBag.bags).toBeUndefined();
    expect(noBag.costUsd).toBeUndefined();
  });

  it("handles zero depth", () => {
    const r = calculateGravel({
      lengthFt: 10,
      widthFt: 10,
      depthFt: 0,
      wastePct: 0,
      densityLbPerYd3: 2800,
    });
    expect(r.volumeFt3).toBe(0);
    expect(r.weightLb).toBe(0);
  });
});
