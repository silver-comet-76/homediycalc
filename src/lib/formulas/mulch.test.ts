import { describe, expect, it } from "vitest";
import { calculateMulch } from "./mulch";

describe("calculateMulch", () => {
  it("matches the FORMULAS.md worked example: 10 × 10 ft, 3 in deep, 2 ft³ bags", () => {
    const r = calculateMulch({
      lengthFt: 10, widthFt: 10, depthFt: 3 / 12, wastePct: 0, bagSizeFt3: 2,
    });
    expect(r.volumeFt3).toBe(25);
    expect(r.volumeYd3).toBeCloseTo(0.93, 2);
    expect(r.bags).toBe(13); // ceil(25 / 2)
    expect(r.weightLb).toBeUndefined(); // no density assumed
  });

  it("rounds bags up after the waste allowance", () => {
    const r = calculateMulch({
      lengthFt: 10, widthFt: 10, depthFt: 3 / 12, wastePct: 5, bagSizeFt3: 2,
    });
    expect(r.adjustedFt3).toBeCloseTo(26.25, 2);
    expect(r.bags).toBe(14);
    expect(r.orderYd3).toBe(1);
  });

  it("shows weight only when a density is entered", () => {
    const r = calculateMulch({
      lengthFt: 10, widthFt: 10, depthFt: 3 / 12, wastePct: 5,
      bagSizeFt3: 2, densityLbPerYd3: 600,
    });
    expect(r.weightLb).toBeCloseTo(583.33, 1);
    expect(r.weightTons).toBeCloseTo(0.29, 2);
  });

  it("supports 3 ft³ bags and per-bag pricing", () => {
    const r = calculateMulch({
      lengthFt: 10, widthFt: 10, depthFt: 3 / 12, wastePct: 0,
      bagSizeFt3: 3, pricePerBag: 5,
    });
    expect(r.bags).toBe(9); // ceil(25 / 3)
    expect(r.costUsd).toBe(45);
    const bulk = calculateMulch({
      lengthFt: 10, widthFt: 10, depthFt: 3 / 12, wastePct: 0,
      bagSizeFt3: 2, pricePerYd3: 40,
    });
    expect(bulk.costUsd).toBe(40); // 1 yd³ × $40
  });

  it("handles zero depth", () => {
    const r = calculateMulch({
      lengthFt: 10, widthFt: 10, depthFt: 0, wastePct: 0, bagSizeFt3: 2,
    });
    expect(r.bags).toBe(0);
  });
});
