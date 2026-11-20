import { describe, expect, it } from "vitest";
import { calculatePrimer } from "./primer";

const BASE = {
  coats: 1,
  coverageFt2PerGal: 300,
  conditionFactor: 1.2,
  wastePct: 10,
};

describe("calculatePrimer", () => {
  it("matches the FORMULAS.md worked example: 400 ft² new drywall, 1 coat", () => {
    // 400 × 1 × 1.20 ÷ 300 = 1.60 gal; with 10% waste 1.76 gal -> buy 2 gal.
    const r = calculatePrimer({ ...BASE, netAreaFt2: 400 });
    expect(r.adjustedGallons).toBeCloseTo(1.76, 2);
    expect(r.gallonsToBuy).toBe(2);
    expect(r.litersToBuy).toBeCloseTo(7.57, 2);
  });

  it("needs less primer on a previously painted wall", () => {
    // 400 ft², factor 1.00: 400 ÷ 300 = 1.33 gal; with 10% waste 1.47 -> 2 gal.
    const r = calculatePrimer({ ...BASE, netAreaFt2: 400, conditionFactor: 1.0 });
    expect(r.adjustedGallons).toBeCloseTo(1.47, 2);
    expect(r.gallonsToBuy).toBe(2);
  });

  it("scales with coats", () => {
    // 350 ft², 2 coats, 400 ft²/gal, sealed surface, no waste: 1.75 gal -> 2 gal.
    const r = calculatePrimer({
      netAreaFt2: 350,
      coats: 2,
      coverageFt2PerGal: 400,
      conditionFactor: 1.0,
      wastePct: 0,
    });
    expect(r.adjustedGallons).toBeCloseTo(1.75, 2);
    expect(r.gallonsToBuy).toBe(2);
  });

  it("prices gallons only when a price is entered", () => {
    const r = calculatePrimer({ ...BASE, netAreaFt2: 400, pricePerGal: 30 });
    expect(r.costUsd).toBe(60);
    const unpriced = calculatePrimer({ ...BASE, netAreaFt2: 400 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculatePrimer({ ...BASE, netAreaFt2: 0 });
    expect(r.adjustedGallons).toBe(0);
    expect(r.gallonsToBuy).toBe(0);
  });
});
