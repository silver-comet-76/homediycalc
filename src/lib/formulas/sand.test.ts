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
    // Weight of the order, not of the requirement: 3 × 2,700 = 8,100 lb
    // = 4.05 US short tons = 8,100 × 0.45359237 = 3,674.10 kg.
    expect(r.orderWeightLb).toBeCloseTo(8100, 0);
    expect(r.orderWeightTons).toBeCloseTo(4.05, 2);
    expect(r.orderWeightKg).toBeCloseTo(3674.1, 1);
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
    // An exact whole yard: the order weight equals the requirement weight.
    expect(concrete.orderYd3).toBe(1);
    expect(concrete.orderWeightLb).toBe(3000);
    expect(concrete.orderWeightTons).toBe(1.5);
    expect(concrete.orderWeightKg).toBeCloseTo(1360.78, 2); // 3,000 × 0.45359237
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
    // Order weight: 2 yd³ × 2,700 = 5,400 lb = 2.70 tons (not 1.83).
    expect(r1.orderWeightLb).toBeCloseTo(5400, 0);
    expect(r1.orderWeightTons).toBeCloseTo(2.7, 2);
    expect(r1.bags).toBe(74);
    const r2 = row(10, 10, 6);
    expect(r2.adjustedYd3).toBeCloseTo(2.04, 2);
    expect(r2.orderYd3).toBe(3);
    expect(r2.weightTons).toBeCloseTo(2.75, 2);
    // Order weight: 3 yd³ × 2,700 = 8,100 lb = 4.05 tons (not 2.75).
    expect(r2.orderWeightLb).toBeCloseTo(8100, 0);
    expect(r2.orderWeightTons).toBeCloseTo(4.05, 2);
    expect(r2.bags).toBe(110);
    const r3 = row(10, 20, 4);
    expect(r3.adjustedYd3).toBeCloseTo(2.72, 2);
    expect(r3.orderYd3).toBe(3);
    expect(r3.weightTons).toBeCloseTo(3.67, 2);
    // Order weight: 3 yd³ × 2,700 = 8,100 lb = 4.05 tons (not 3.67).
    expect(r3.orderWeightLb).toBeCloseTo(8100, 0);
    expect(r3.orderWeightTons).toBeCloseTo(4.05, 2);
    expect(r3.bags).toBe(147);
    const r4 = row(12, 12, 4);
    expect(r4.adjustedYd3).toBeCloseTo(1.96, 2);
    expect(r4.orderYd3).toBe(2);
    expect(r4.weightTons).toBeCloseTo(2.64, 2);
    // Order weight: 2 yd³ × 2,700 = 5,400 lb = 2.70 tons (not 2.64).
    expect(r4.orderWeightLb).toBeCloseTo(5400, 0);
    expect(r4.orderWeightTons).toBeCloseTo(2.7, 2);
    expect(r4.bags).toBe(106);
    const r5 = row(20, 10, 6);
    expect(r5.adjustedYd3).toBeCloseTo(4.07, 2);
    expect(r5.orderYd3).toBe(5);
    expect(r5.weightTons).toBeCloseTo(5.5, 2);
    // Order weight: 5 yd³ × 2,700 = 13,500 lb = 6.75 tons (not 5.5).
    expect(r5.orderWeightLb).toBeCloseTo(13500, 0);
    expect(r5.orderWeightTons).toBeCloseTo(6.75, 2);
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
    expect(r.orderYd3).toBe(0);
    expect(r.orderWeightLb).toBe(0);
    expect(r.orderWeightTons).toBe(0);
    expect(r.orderWeightKg).toBe(0);
    expect(r.bags).toBe(0);
  });

  it("keeps the QA example's two weights separate (C1: 1.36 yd³ required, 2 yd³ ordered)", () => {
    // 10 × 10 ft at 4 in: 100 × 4/12 = 33.333 ft³; × 1.10 = 36.667 ft³
    // = 1.358 yd³. Requirement weight: 1.358 × 2,700 = 3,666.67 lb
    // = 1.833 tons; order weight: 2 × 2,700 = 5,400 lb = 2.70 tons.
    const r = calculateSand({ ...BASE, volumeFt3: (10 * 10 * 4) / 12 });
    expect(r.adjustedYd3).toBeCloseTo(1.36, 2);
    expect(r.orderYd3).toBe(2);
    expect(r.weightLb).toBeCloseTo(3666.67, 1);
    expect(r.weightTons).toBeCloseTo(1.83, 2);
    expect(r.weightKg).toBeCloseTo(1663.17, 1); // 3,666.67 × 0.45359237
    expect(r.orderWeightLb).toBe(5400);
    expect(r.orderWeightTons).toBeCloseTo(2.7, 2);
    expect(r.orderWeightKg).toBeCloseTo(2449.4, 1); // 5,400 × 0.45359237
    // The two weights must differ whenever the order rounds up.
    expect(r.orderWeightTons).toBeGreaterThan(r.weightTons);
  });

  it("order weight equals requirement weight at exact whole-yard boundaries", () => {
    const one = calculateSand({ ...BASE, volumeFt3: 27, wastePct: 0 });
    expect(one.adjustedYd3).toBe(1);
    expect(one.orderYd3).toBe(1);
    expect(one.weightLb).toBe(2700);
    expect(one.orderWeightLb).toBe(2700);
    expect(one.weightTons).toBe(1.35);
    expect(one.orderWeightTons).toBe(1.35);
    expect(one.orderWeightKg).toBeCloseTo(1224.7, 1); // 2,700 × 0.45359237
    const two = calculateSand({ ...BASE, volumeFt3: 54, wastePct: 0 });
    expect(two.adjustedYd3).toBe(2);
    expect(two.orderYd3).toBe(2);
    expect(two.weightLb).toBe(5400);
    expect(two.orderWeightLb).toBe(5400);
    expect(two.weightTons).toBe(2.7);
    expect(two.orderWeightTons).toBe(2.7);
  });

  it("never orders a negative quantity for a negative volume", () => {
    // The pure function does no input validation — the island rejects
    // invalid input before calling compute. What must hold here is that
    // no purchase quantity goes negative: the order and the bag count
    // stay zero, and the order weight (which is order × density) is 0.
    // The unrounded requirement weight follows the arithmetic
    // (negative in, negative out) and is never displayed on its own.
    const r = calculateSand({ ...BASE, volumeFt3: -10 });
    expect(r.adjustedFt3).toBeCloseTo(-11, 2);
    expect(r.orderYd3).toBe(0);
    expect(r.orderWeightLb).toBe(0);
    expect(r.orderWeightTons).toBe(0);
    expect(r.bags).toBe(0);
    expect(r.weightLb).toBeCloseTo(-1100, 0); // -11/27 × 2,700
  });

  it("handles fractional dimensions", () => {
    // 10.5 × 8.25 ft at 4.5 in: 10.5 × 8.25 × 0.375 = 32.484375 ft³;
    // × 1.10 = 35.7328125 ft³ = 1.3234375 yd³. Requirement weight:
    // 1.3234375 × 2,700 = 3,573.28 lb = 1.7866 tons; order weight:
    // 2 × 2,700 = 5,400 lb = 2.70 tons. Bags: ceil(35.7328125 / 0.5) = 72.
    const r = calculateSand({ ...BASE, volumeFt3: 10.5 * 8.25 * (4.5 / 12) });
    expect(r.adjustedFt3).toBeCloseTo(35.73, 2);
    expect(r.adjustedYd3).toBeCloseTo(1.32, 2);
    expect(r.orderYd3).toBe(2);
    expect(r.weightLb).toBeCloseTo(3573.28, 1);
    expect(r.weightTons).toBeCloseTo(1.79, 2);
    expect(r.weightKg).toBeCloseTo(1620.81, 1); // 3,573.28 × 0.45359237
    expect(r.orderWeightLb).toBe(5400);
    expect(r.orderWeightTons).toBeCloseTo(2.7, 2);
    expect(r.orderWeightKg).toBeCloseTo(2449.4, 1);
    expect(r.bags).toBe(72);
  });

  it("handles large but supported inputs", () => {
    // 27,000 ft³ = 1,000 yd³; × 1.10 = 29,700 ft³ = 1,100 yd³ exactly.
    // Both weights: 1,100 × 2,700 = 2,970,000 lb = 1,485 tons.
    // (27,000 × 1.1 is 29,700.000000000004 in binary floating point,
    // so the yd³ and lb figures are asserted with toBeCloseTo.)
    const exact = calculateSand({ ...BASE, volumeFt3: 27000 });
    expect(exact.adjustedYd3).toBeCloseTo(1100, 9);
    expect(exact.orderYd3).toBe(1100);
    expect(exact.weightLb).toBeCloseTo(2970000, 0);
    expect(exact.orderWeightLb).toBeCloseTo(2970000, 0);
    expect(exact.weightTons).toBeCloseTo(1485, 9);
    expect(exact.orderWeightTons).toBeCloseTo(1485, 9);
    expect(exact.orderWeightKg).toBeCloseTo(1347169.34, 1); // 2,970,000 × 0.45359237
    expect(exact.bags).toBe(59400);
    // 27,001 ft³: adjusted 29,701.1 ft³ = 1,100.0407 yd³; order 1,101 yd³.
    // Requirement weight: 29,701.1 / 27 × 2,700 = 2,970,110 lb
    // = 1,485.055 tons; order weight: 1,101 × 2,700 = 2,972,700 lb
    // = 1,486.35 tons.
    const rounded = calculateSand({ ...BASE, volumeFt3: 27001 });
    expect(rounded.adjustedYd3).toBeCloseTo(1100.04, 2);
    expect(rounded.orderYd3).toBe(1101);
    expect(rounded.weightLb).toBeCloseTo(2970110, 0);
    expect(rounded.weightTons).toBeCloseTo(1485.055, 3);
    expect(rounded.orderWeightLb).toBe(2972700);
    expect(rounded.orderWeightTons).toBeCloseTo(1486.35, 2);
  });

  it("keeps metric and imperial weights consistent (kg and tonnes vs lb and short tons)", () => {
    // Worked example: requirement 5,500 lb = 2.75 short tons;
    // order 8,100 lb = 4.05 short tons. 1 lb = 0.45359237 kg exactly,
    // 1 short ton = 0.90718474 tonnes exactly.
    const r = calculateSand({ ...BASE, volumeFt3: 50 });
    expect(r.weightKg).toBeCloseTo(5500 * 0.45359237, 1);
    expect(r.orderWeightKg).toBeCloseTo(8100 * 0.45359237, 1);
    expect(r.weightKg / 1000).toBeCloseTo(r.weightTons * 0.90718474, 4);
    expect(r.orderWeightKg / 1000).toBeCloseTo(r.orderWeightTons * 0.90718474, 4);
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

  it("reverse-mode weight is the weight of the stated amount on hand", () => {
    // Reverse mode never rounds the amount up, so there is no separate
    // order weight: the weight is the weight of the amount you have.
    // 2.5 yd³ at 6 in: area = 2.5 × 27 ÷ 0.5 = 135 ft²; weight =
    // 2.5 × 2,700 = 6,750 lb = 3.375 tons = 6,750 × 0.45359237 kg.
    const r = calculateSandCoverage({ amountYd3: 2.5, depthFt: 6 / 12, densityLbYd3: 2700 });
    expect(r.areaFt2).toBe(135);
    expect(r.weightLb).toBe(6750);
    expect(r.weightTons).toBeCloseTo(3.375, 3);
    expect(r.weightKg).toBeCloseTo(3061.75, 1);
    // Fractional amount: 0.5 yd³ weighs 1,350 lb = 0.675 tons.
    const half = calculateSandCoverage({ amountYd3: 0.5, depthFt: 4 / 12, densityLbYd3: 2700 });
    expect(half.areaFt2).toBeCloseTo(40.5, 9); // 13.5 ÷ (1/3)
    expect(half.weightLb).toBe(1350);
    expect(half.weightTons).toBeCloseTo(0.675, 3);
    // Zero on hand weighs zero.
    const none = calculateSandCoverage({ amountYd3: 0, depthFt: 4 / 12, densityLbYd3: 2700 });
    expect(none.areaFt2).toBe(0);
    expect(none.weightLb).toBe(0);
    expect(none.weightTons).toBe(0);
  });
});
