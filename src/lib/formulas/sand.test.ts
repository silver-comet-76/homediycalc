import { describe, expect, it } from "vitest";
import { calculateSand, calculateSandCoverage } from "./sand";

const BASE = {
  wastePct: 10,
  densityLbYd3: 2700,
  bagSizeFt3: 0.5,
};

describe("calculateSand", () => {
  it("matches the worked example: 10 × 10 ft sandbox, 6 in deep, play sand", () => {
    // 10 × 10 × 0.5 ft = 50 ft³ = 1.85 yd³; with 10% waste: 55 ft³ = 2.04 yd³.
    const r = calculateSand({ ...BASE, volumeFt3: 50 });
    expect(r.adjustedFt3).toBeCloseTo(55, 2);
    expect(r.adjustedYd3).toBeCloseTo(2.04, 2);
    expect(r.adjustedM3).toBeCloseTo(1.56, 2);
    // Weight at 2,700 lb/yd³ (play sand): 2.037 × 2,700 = 5,500 lb = 2.75 tons.
    expect(r.weightLb).toBeCloseTo(5500, 0);
    expect(r.weightTons).toBeCloseTo(2.75, 2);
    expect(r.weightKg).toBeCloseTo(2494.76, 1);
    // Bulk to order: ceil(2.037) = 3 yd³.
    expect(r.orderYd3).toBe(3);
    // Bags: 55 / 0.5 = 110.
    expect(r.bags).toBe(110);
  });

  it("scales weight with the density the user enters", () => {
    const concrete = calculateSand({
      ...BASE,
      volumeFt3: 27,
      wastePct: 0,
      densityLbYd3: 3000,
    });
    expect(concrete.adjustedYd3).toBe(1);
    expect(concrete.weightLb).toBe(3000);
    expect(concrete.weightTons).toBe(1.5);
  });

  it("rounds bags up, never down", () => {
    const r = calculateSand({ ...BASE, volumeFt3: 1, wastePct: 0 });
    expect(r.bags).toBe(2); // 1 / 0.5 = 2
    const odd = calculateSand({ ...BASE, volumeFt3: 1.1, wastePct: 0 });
    expect(odd.bags).toBe(3); // 1.1 / 0.5 = 2.2
  });

  it("rounds the bulk order up to whole yards", () => {
    const r = calculateSand({ ...BASE, volumeFt3: 50 });
    expect(r.orderYd3).toBe(3);
    // An exact whole yard stays whole — no extra yard is added.
    const exact = calculateSand({ ...BASE, volumeFt3: 27, wastePct: 0 });
    expect(exact.adjustedYd3).toBe(1);
    expect(exact.orderYd3).toBe(1);
  });

  it("matches the lookup-table rows (area mode, 10% waste, play sand, 0.5 ft³ bags)", () => {
    const row = (lengthFt: number, widthFt: number, depthIn: number) =>
      calculateSand({ ...BASE, volumeFt3: (lengthFt * widthFt * depthIn) / 12 });
    const r1 = row(10, 10, 4);
    expect(r1.adjustedYd3).toBeCloseTo(1.36, 2);
    expect(r1.orderYd3).toBe(2);
    expect(r1.weightTons).toBeCloseTo(1.83, 2);
    expect(r1.bags).toBe(74);
    const r3 = row(10, 20, 4);
    expect(r3.adjustedYd3).toBeCloseTo(2.72, 2);
    expect(r3.orderYd3).toBe(3);
    expect(r3.weightTons).toBeCloseTo(3.67, 2);
    expect(r3.bags).toBe(147);
    const r4 = row(12, 12, 4);
    expect(r4.adjustedYd3).toBeCloseTo(1.96, 2);
    expect(r4.orderYd3).toBe(2);
    expect(r4.weightTons).toBeCloseTo(2.64, 2);
    expect(r4.bags).toBe(106);
    const r5 = row(20, 10, 6);
    expect(r5.adjustedYd3).toBeCloseTo(4.07, 2);
    expect(r5.orderYd3).toBe(5);
    expect(r5.weightTons).toBeCloseTo(5.5, 2);
    expect(r5.bags).toBe(220);
  });

  it("prices bulk or bags, never both — bulk wins when both prices are entered", () => {
    // Worked example: 3 yd³ to order at $40/yd³, 110 bags at $5/bag.
    const both = calculateSand({
      ...BASE,
      volumeFt3: 50,
      pricePerYd3: 40,
      pricePerBag: 5,
    });
    expect(both.costUsd).toBe(3 * 40);
    const bulkOnly = calculateSand({ ...BASE, volumeFt3: 50, pricePerYd3: 40 });
    expect(bulkOnly.costUsd).toBe(3 * 40);
    const bagsOnly = calculateSand({ ...BASE, volumeFt3: 50, pricePerBag: 5 });
    expect(bagsOnly.costUsd).toBe(110 * 5);
    const unpriced = calculateSand({ ...BASE, volumeFt3: 50 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero volume", () => {
    const r = calculateSand({ ...BASE, volumeFt3: 0 });
    expect(r.adjustedYd3).toBe(0);
    expect(r.weightLb).toBe(0);
    expect(r.bags).toBe(0);
  });
});

describe("calculateSandCoverage", () => {
  it("covers 81 ft² from 1 yd³ at 4 in deep", () => {
    // 1 yd³ = 27 ft³; 27 ÷ (4/12) = 81 ft².
    const r = calculateSandCoverage({ amountYd3: 1, depthFt: 4 / 12, densityLbYd3: 2700 });
    expect(r.volumeFt3).toBe(27);
    expect(r.areaFt2).toBe(81);
    expect(r.areaM2).toBeCloseTo(7.53, 2);
    expect(r.weightLb).toBe(2700);
    expect(r.weightTons).toBeCloseTo(1.35, 2);
    expect(r.weightKg).toBeCloseTo(1224.7, 1);
  });

  it("covers less area at a deeper spread", () => {
    const shallow = calculateSandCoverage({
      amountYd3: 2,
      depthFt: 2 / 12,
      densityLbYd3: 2700,
    });
    const deep = calculateSandCoverage({
      amountYd3: 2,
      depthFt: 6 / 12,
      densityLbYd3: 2700,
    });
    expect(shallow.areaFt2).toBe(324); // 54 ÷ (1/6)
    expect(deep.areaFt2).toBe(108); // 54 ÷ 0.5
  });
});
