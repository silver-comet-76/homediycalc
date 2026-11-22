import { describe, expect, it } from "vitest";
import { calculateTopsoil } from "./topsoil";

const BASE = {
  wastePct: 10,
  densityLbYd3: 2000,
  bagSizeFt3: 0.75,
};

describe("calculateTopsoil", () => {
  it("matches the FORMULAS.md worked example: 10 × 10 ft bed, 6 in deep", () => {
    // 10 × 10 × 0.5 ft = 50 ft³ = 1.85 yd³; with 10% allowance: 55 ft³ = 2.04 yd³.
    const r = calculateTopsoil({ ...BASE, volumeFt3: 50 });
    expect(r.adjustedFt3).toBeCloseTo(55, 2);
    expect(r.adjustedYd3).toBeCloseTo(2.04, 2);
    expect(r.adjustedM3).toBeCloseTo(1.56, 2);
    // Weight at 2,000 lb/yd³: 2.037 × 2,000 = 4,074 lb ≈ 2.04 tons
    // (2.037 yd³ is the unrounded volume; 2.04 is the displayed rounding).
    expect(r.weightLb).toBeCloseTo(4074.07, 1);
    expect(r.weightTons).toBeCloseTo(2.04, 2);
    expect(r.weightKg).toBeCloseTo(1847.96, 0);
    // Bulk to order: ceil(2.037) = 3 yd³.
    expect(r.orderYd3).toBe(3);
    // Bags: 55 / 0.75 = 73.33 -> 74.
    expect(r.bags).toBe(74);
  });

  it("scales weight with the density the user enters", () => {
    const wet = calculateTopsoil({ ...BASE, volumeFt3: 27, wastePct: 0, densityLbYd3: 2400 });
    expect(wet.adjustedYd3).toBe(1);
    expect(wet.weightLb).toBe(2400);
    expect(wet.weightTons).toBe(1.2);
  });

  it("rounds bags up, never down", () => {
    const r = calculateTopsoil({ ...BASE, volumeFt3: 1, wastePct: 0 });
    expect(r.bags).toBe(2); // 1 / 0.75 = 1.33
  });

  it("rounds the bulk order up to whole yards", () => {
    // 50 ft³ with 10% allowance is 2.037 yd³ -> order 3 yd³.
    const r = calculateTopsoil({ ...BASE, volumeFt3: 50 });
    expect(r.orderYd3).toBe(3);
    // An exact whole yard stays whole — no extra yard is added.
    const exact = calculateTopsoil({ ...BASE, volumeFt3: 27, wastePct: 0 });
    expect(exact.adjustedYd3).toBe(1);
    expect(exact.orderYd3).toBe(1);
  });

  it("prices bulk or bags, never both — bulk wins when both prices are entered", () => {
    // Worked example: 3 yd³ to order at $35/yd³, 74 bags at $4/bag.
    // A buyer buys bulk OR bags, so the cost is one or the other.
    const both = calculateTopsoil({
      ...BASE,
      volumeFt3: 50,
      pricePerYd3: 35,
      pricePerBag: 4,
    });
    expect(both.costUsd).toBe(3 * 35);
    const bulkOnly = calculateTopsoil({ ...BASE, volumeFt3: 50, pricePerYd3: 35 });
    expect(bulkOnly.costUsd).toBe(3 * 35);
    const bagsOnly = calculateTopsoil({ ...BASE, volumeFt3: 50, pricePerBag: 4 });
    expect(bagsOnly.costUsd).toBe(74 * 4);
    const unpriced = calculateTopsoil({ ...BASE, volumeFt3: 50 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero volume", () => {
    const r = calculateTopsoil({ ...BASE, volumeFt3: 0 });
    expect(r.adjustedYd3).toBe(0);
    expect(r.weightLb).toBe(0);
    expect(r.bags).toBe(0);
  });
});
