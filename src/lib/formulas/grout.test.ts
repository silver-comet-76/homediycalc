import { describe, expect, it } from "vitest";
import { calculateGrout } from "./grout";

const BASE = {
  tileLengthIn: 12,
  tileWidthIn: 12,
  jointWidthIn: 0.125,
  jointDepthIn: 0.375,
  groutDensityLbFt3: 98.5,
  bagWeightLb: 10,
  wastePct: 10,
};

describe("calculateGrout", () => {
  it("matches the FORMULAS.md worked example: 100 ft² of 12 × 12 tile, ⅛ in joints", () => {
    // Joint volume per ft²: (12+12)/(12×12) × 0.125 × 0.375 × 144 = 1.125 in³.
    // At 98.5 lb/ft³: 1.125 × 98.5 / 1,728 = 0.0641 lb/ft².
    // 100 ft² × 0.0641 × 1.10 = 7.05 lb -> 1 bag of 10 lb.
    const r = calculateGrout({ ...BASE, areaFt2: 100 });
    expect(r.groutLbPerFt2).toBeCloseTo(0.0641, 4);
    expect(r.groutLb).toBeCloseTo(7.05, 2);
    expect(r.bags).toBe(1);
  });

  it("needs far more grout for small mosaic tile", () => {
    const mosaic = calculateGrout({
      ...BASE,
      areaFt2: 100,
      tileLengthIn: 2,
      tileWidthIn: 2,
      jointDepthIn: 0.25,
    });
    // 2 × 2 mosaic: joint length per ft² is 6× the 12 × 12 case (144 in
    // vs 24 in), adjusted for the thinner tile (0.25 vs 0.375 in).
    expect(mosaic.groutLbPerFt2).toBeCloseTo(0.2565, 4);
    expect(mosaic.groutLb).toBeCloseTo(28.22, 1);
    expect(mosaic.bags).toBe(3);
  });

  it("scales directly with joint width", () => {
    const wide = calculateGrout({ ...BASE, areaFt2: 100, jointWidthIn: 0.25 });
    expect(wide.groutLb).toBeCloseTo(14.11, 2);
    expect(wide.bags).toBe(2);
  });

  it("prices bags only when a price is entered", () => {
    const r = calculateGrout({ ...BASE, areaFt2: 100, pricePerBag: 12 });
    expect(r.costUsd).toBe(12);
    const unpriced = calculateGrout({ ...BASE, areaFt2: 100 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculateGrout({ ...BASE, areaFt2: 0 });
    expect(r.groutLb).toBe(0);
    expect(r.bags).toBe(0);
  });
});
