import { describe, expect, it } from "vitest";
import { calculateTileAdhesive } from "./tile-adhesive";

const BASE = {
  coveragePer50LbBagFt2: 90,
  bagWeightLb: 50,
  backButter: false,
  wastePct: 10,
};

describe("calculateTileAdhesive", () => {
  it("matches the FORMULAS.md worked example: 100 ft², 1/4 in square notch", () => {
    // 100 ft² × 1.10 ÷ 90 ft²/bag = 1.22 bags -> 2 bags (100 lb bought,
    // 61.1 lb actually needed).
    const r = calculateTileAdhesive({ ...BASE, areaFt2: 100 });
    expect(r.bags).toBe(2);
    expect(r.adhesiveLb).toBeCloseTo(61.11, 2);
    expect(r.effectiveCoverageFt2PerBag).toBe(90);
  });

  it("uses less coverage per bag with a larger notch", () => {
    // 200 ft², 1/2 in square notch (42 ft²/bag): 220 ÷ 42 = 5.24 -> 6 bags.
    const r = calculateTileAdhesive({
      ...BASE,
      areaFt2: 200,
      coveragePer50LbBagFt2: 42,
    });
    expect(r.bags).toBe(6);
    expect(r.adhesiveLb).toBeCloseTo(261.9, 1);
  });

  it("D-2 regression: 100 ft² with a 1/2 in notch needs 3 bags, not 6", () => {
    // 100 ft² × 1.10 ÷ 42 ft²/bag = 2.62 -> 3 bags (150 lb bought,
    // 130.95 lb actually needed). 6 bags is the 200 ft² answer.
    const r = calculateTileAdhesive({
      ...BASE,
      areaFt2: 100,
      coveragePer50LbBagFt2: 42,
    });
    expect(r.bags).toBe(3);
    expect(r.adhesiveLb).toBeCloseTo(130.95, 2);
    expect(r.effectiveCoverageFt2PerBag).toBe(42);
  });

  it("needs about 35% more when back-buttering", () => {
    // 200 ft², 1/2 in notch, back-buttered: 220 ÷ (42 ÷ 1.35) = 7.07 -> 8 bags.
    const r = calculateTileAdhesive({
      ...BASE,
      areaFt2: 200,
      coveragePer50LbBagFt2: 42,
      backButter: true,
    });
    expect(r.bags).toBe(8);
    expect(r.effectiveCoverageFt2PerBag).toBeCloseTo(31.11, 2);
  });

  it("halves the coverage for a 25 lb bag", () => {
    // 100 ft², 25 lb bags: effective coverage 45 ft² -> 110 ÷ 45 = 2.44 -> 3 bags.
    const r = calculateTileAdhesive({ ...BASE, areaFt2: 100, bagWeightLb: 25 });
    expect(r.bags).toBe(3);
    expect(r.effectiveCoverageFt2PerBag).toBe(45);
  });

  it("prices bags only when a price is entered", () => {
    const r = calculateTileAdhesive({ ...BASE, areaFt2: 100, pricePerBag: 18 });
    expect(r.costUsd).toBe(36);
    const unpriced = calculateTileAdhesive({ ...BASE, areaFt2: 100 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculateTileAdhesive({ ...BASE, areaFt2: 0 });
    expect(r.bags).toBe(0);
    expect(r.adhesiveLb).toBe(0);
  });
});
