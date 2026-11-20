import { describe, expect, it } from "vitest";
import { calculateSlab } from "./concrete-slab";

describe("calculateSlab", () => {
  it("matches the FORMULAS.md worked example: 20 × 12 ft, 4 in thick, 10% waste", () => {
    const r = calculateSlab({
      lengthFt: 20, widthFt: 12, thicknessFt: 4 / 12, wastePct: 10,
      quarterYardRounding: true, meshSheetAreaFt2: 160,
    });
    expect(r.baseVolumeFt3).toBe(80);
    expect(r.volumeYd3).toBeCloseTo(2.96, 2);
    expect(r.adjustedYd3).toBeCloseTo(3.26, 2);
    expect(r.orderYd3).toBe(3.5);
    expect(r.bags80).toBe(147); // ceil(88 / 0.6)
    expect(r.meshSheets).toBe(2); // ceil(240 / 160)
  });

  it("adds thickened-edge volume only below the extra depth", () => {
    const withEdge = calculateSlab({
      lengthFt: 20, widthFt: 12, thicknessFt: 4 / 12, wastePct: 0,
      quarterYardRounding: true, edgeDepthFt: 1, edgeWidthFt: 1, meshSheetAreaFt2: 160,
    });
    // Perimeter 64 ft × 1 ft band × (1 − 1/3) ft extra depth = 42.67 ft³.
    expect(withEdge.edgeExtraFt3).toBeCloseTo(42.67, 2);
    expect(withEdge.volumeFt3).toBeCloseTo(122.67, 2);
    const noEdge = calculateSlab({
      lengthFt: 20, widthFt: 12, thicknessFt: 4 / 12, wastePct: 0,
      quarterYardRounding: true, edgeDepthFt: 4 / 12, edgeWidthFt: 1, meshSheetAreaFt2: 160,
    });
    expect(noEdge.edgeExtraFt3).toBe(0);
  });

  it("rounds mesh sheets up and charges cost from the rounded order", () => {
    const r = calculateSlab({
      lengthFt: 10, widthFt: 10, thicknessFt: 4 / 12, wastePct: 0,
      quarterYardRounding: true, meshSheetAreaFt2: 160, pricePerYd3: 120,
    });
    expect(r.meshSheets).toBe(1);
    expect(r.orderYd3).toBe(1.25);
    expect(r.costUsd).toBe(150);
  });

  it("handles a 6 in garage slab", () => {
    const r = calculateSlab({
      lengthFt: 20, widthFt: 20, thicknessFt: 6 / 12, wastePct: 10,
      quarterYardRounding: true, meshSheetAreaFt2: 160,
    });
    expect(r.volumeFt3).toBe(200);
    expect(r.volumeYd3).toBeCloseTo(7.41, 2);
    expect(r.orderYd3).toBe(8.25);
  });
});
