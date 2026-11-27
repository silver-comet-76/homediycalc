import { describe, expect, it } from "vitest";
import { gramsPerSquareMeterToLbPer1000Ft2, lbPer1000Ft2ToGramsPerSquareMeter } from "../units";
import {
  BAG_OPTIMIZATION_LIMIT_LB,
  breakdownBagSizes,
  calculateLawnSeed,
  formatBagBreakdown,
} from "./lawn-seed";

const BASE = {
  rateLbPer1000Ft2: 7,
  bufferPct: 10,
};

describe("breakdownBagSizes", () => {
  it("finds the least overbuy, not the greedy mix (38.5 lb)", () => {
    // Hand-derived: totals >= 38.5 lb are 39 (3 x 10 + 3 x 3, 6 bags;
    // 13 x 3 is also 39 lb but 13 bags), 40, 41 (greedy). Least
    // weight wins, then fewest bags: 3 x 10 + 3 x 3 = 39 lb.
    expect(breakdownBagSizes(38.5)).toEqual([
      { sizeLb: 10, count: 3 },
      { sizeLb: 3, count: 3 },
    ]);
    expect(formatBagBreakdown(breakdownBagSizes(38.5))).toBe("3 × 10 lb + 3 × 3 lb");
  });

  it("finds the least overbuy for the other QA examples", () => {
    // 19.25 lb: 2 x 10 = 20 lb (2 bags) beats greedy 1 x 10 + 4 x 3 = 22 lb.
    expect(breakdownBagSizes(19.25)).toEqual([{ sizeLb: 10, count: 2 }]);
    // 77 lb is an exact fit: 25 + 40 + 12 = 77 (9 bags) beats greedy
    // 3 x 25 + 1 x 3 = 78 lb.
    expect(breakdownBagSizes(77)).toEqual([
      { sizeLb: 25, count: 1 },
      { sizeLb: 10, count: 4 },
      { sizeLb: 3, count: 4 },
    ]);
    // 7.7 lb: 3 x 3 = 9 lb beats 1 x 10 = 10 lb (least weight wins
    // before fewest bags).
    expect(breakdownBagSizes(7.7)).toEqual([{ sizeLb: 3, count: 3 }]);
    // 13.75 lb: 5 x 3 = 15 lb beats greedy 1 x 10 + 2 x 3 = 16 lb.
    expect(breakdownBagSizes(13.75)).toEqual([{ sizeLb: 3, count: 5 }]);
  });

  it("returns no bags for zero, negative, or NaN", () => {
    expect(breakdownBagSizes(0)).toEqual([]);
    expect(breakdownBagSizes(-5)).toEqual([]);
    expect(breakdownBagSizes(NaN)).toEqual([]);
    expect(formatBagBreakdown([])).toBe("");
  });

  it("does not add a bag for floating-point noise", () => {
    // 41 lb exactly: 25 + 10 + 3 + 3, no extra bag.
    expect(breakdownBagSizes(41)).toEqual([
      { sizeLb: 25, count: 1 },
      { sizeLb: 10, count: 1 },
      { sizeLb: 3, count: 2 },
    ]);
  });

  it("handles exact fits and just-over-a-bag-size inputs", () => {
    // Exact fit: one 25 lb bag, nothing more.
    expect(breakdownBagSizes(25)).toEqual([{ sizeLb: 25, count: 1 }]);
    // 25.01 lb: 2 x 10 + 2 x 3 = 26 lb is the least total >= 25.01
    // (25 + 3 = 28 and 9 x 3 = 27 are both heavier).
    expect(breakdownBagSizes(25.01)).toEqual([
      { sizeLb: 10, count: 2 },
      { sizeLb: 3, count: 2 },
    ]);
    // 28 lb exact: 25 + 3.
    expect(breakdownBagSizes(28)).toEqual([
      { sizeLb: 25, count: 1 },
      { sizeLb: 3, count: 1 },
    ]);
    // Any positive need, however small, buys at least one smallest bag.
    expect(breakdownBagSizes(0.5)).toEqual([{ sizeLb: 3, count: 1 }]);
  });

  it("tie-breaks by fewest bags, then prefers larger bags", () => {
    // 30 lb: 3 x 10 (3 bags) beats 10 x 3 (10 bags) at the same weight.
    expect(breakdownBagSizes(30)).toEqual([{ sizeLb: 10, count: 3 }]);
    // 50 lb: 2 x 25 (2 bags) beats 5 x 10 (5 bags) at the same weight.
    expect(breakdownBagSizes(50)).toEqual([{ sizeLb: 25, count: 2 }]);
    // Same weight AND same bag count with non-standard sizes: 8 lb is
    // 5 + 3 or 4 + 4 (2 bags each) — the larger-bag mix wins.
    expect(breakdownBagSizes(8, [5, 4, 3])).toEqual([
      { sizeLb: 5, count: 1 },
      { sizeLb: 3, count: 1 },
    ]);
  });

  it("optimizes exactly at the bound and falls back to greedy above it", () => {
    expect(BAG_OPTIMIZATION_LIMIT_LB).toBe(10000);
    // Exactly 10,000 lb: 400 x 25 lb, exact fit, least overbuy.
    expect(breakdownBagSizes(10000)).toEqual([{ sizeLb: 25, count: 400 }]);
    // 10,000.01 lb is above the bound: greedy gives 400 x 25 + 1 x 3
    // (10,003 lb). The exact search would find 399 x 25 + 2 x 10 +
    // 2 x 3 = 10,001 lb, so the fallback costs 2 lb of extra overbuy
    // here — that is the documented price of the bound.
    expect(breakdownBagSizes(10000.01)).toEqual([
      { sizeLb: 25, count: 400 },
      { sizeLb: 3, count: 1 },
    ]);
  });
});

describe("calculateLawnSeed", () => {
  it("matches the worked example: 5,000 ft² new lawn, tall fescue 7 lb/1,000 ft²", () => {
    // 5 × 7 = 35 lb; with 10% buffer: 38.5 lb; least-overbuy bags
    // 3 × 10 + 3 × 3 = 39 lb (6 bags), not the old greedy 41 lb.
    const r = calculateLawnSeed({ ...BASE, netAreaFt2: 5000 });
    expect(r.netAreaFt2).toBe(5000);
    expect(r.netAreaM2).toBeCloseTo(464.52, 2);
    expect(r.rateLbPer1000Ft2).toBe(7);
    expect(r.seedLb).toBe(35);
    expect(r.seedKg).toBeCloseTo(15.88, 2);
    expect(r.bufferedLb).toBeCloseTo(38.5, 2);
    expect(r.bufferedKg).toBeCloseTo(17.46, 2);
    expect(r.bags).toEqual([
      { sizeLb: 10, count: 3 },
      { sizeLb: 3, count: 3 },
    ]);
    expect(r.bagCount).toBe(6);
    expect(r.purchaseLb).toBe(39);
    expect(r.bagsOptimized).toBe(true);
  });

  it("matches the lookup-table rows (10% buffer, new lawn)", () => {
    const row = (lengthFt: number, widthFt: number, rate = 7) =>
      calculateLawnSeed({
        ...BASE,
        netAreaFt2: lengthFt * widthFt,
        rateLbPer1000Ft2: rate,
      });
    const r1 = row(50, 20);
    expect(r1.seedLb).toBe(7);
    expect(r1.bufferedLb).toBeCloseTo(7.7, 2);
    expect(formatBagBreakdown(r1.bags)).toBe("3 × 3 lb");
    const r2 = row(50, 50);
    expect(r2.seedLb).toBe(17.5);
    expect(r2.bufferedLb).toBeCloseTo(19.25, 2);
    expect(formatBagBreakdown(r2.bags)).toBe("2 × 10 lb");
    const r4 = row(100, 100);
    expect(r4.seedLb).toBe(70);
    expect(r4.bufferedLb).toBe(77);
    expect(formatBagBreakdown(r4.bags)).toBe("1 × 25 lb + 4 × 10 lb + 4 × 3 lb");
    const r5 = row(50, 100, 2.5);
    expect(r5.seedLb).toBe(12.5);
    expect(r5.bufferedLb).toBeCloseTo(13.75, 2);
    expect(formatBagBreakdown(r5.bags)).toBe("5 × 3 lb");
  });

  it("does NOT halve an overseeding rate (B1 regression)", () => {
    // QA example: 1,000 ft², manufacturer overseeding rate 4 lb per
    // 1,000 ft², 0% buffer → exactly 4 lb, NOT 2 lb. The entered rate
    // is already the overseeding rate; no further reduction applies.
    const r = calculateLawnSeed({
      netAreaFt2: 1000,
      rateLbPer1000Ft2: 4,
      bufferPct: 0,
    });
    expect(r.seedLb).toBe(4);
    expect(r.seedKg).toBeCloseTo(1.81, 2);
    expect(r.bufferedLb).toBe(4);
    expect(r.bags).toEqual([{ sizeLb: 3, count: 2 }]);
    expect(r.purchaseLb).toBe(6);
  });

  it("uses the entered rate as-is for both job types", () => {
    // 5,000 ft² at the K-State overseeding rate for tall fescue (4 lb)
    // needs 20 lb — the same arithmetic as a new lawn at 4 lb. The
    // job type changes guidance, never the math: there is no job
    // factor left in the formula.
    const overseed = calculateLawnSeed({
      netAreaFt2: 5000,
      rateLbPer1000Ft2: 4,
      bufferPct: 10,
    });
    expect(overseed.seedLb).toBe(20);
    expect(overseed.bufferedLb).toBe(22);
    expect(formatBagBreakdown(overseed.bags)).toBe("1 × 10 lb + 4 × 3 lb");
    const newLawn = calculateLawnSeed({
      netAreaFt2: 5000,
      rateLbPer1000Ft2: 7,
      bufferPct: 10,
    });
    expect(newLawn.seedLb).toBe(35);
    expect(newLawn.bufferedLb).toBeCloseTo(38.5, 2);
  });

  it("handles zero and negative area", () => {
    const zero = calculateLawnSeed({ ...BASE, netAreaFt2: 0 });
    expect(zero.seedLb).toBe(0);
    expect(zero.bufferedLb).toBe(0);
    expect(zero.bags).toEqual([]);
    expect(zero.bagCount).toBe(0);
    expect(zero.purchaseLb).toBe(0);
    expect(zero.bagsOptimized).toBe(true);
    const negative = calculateLawnSeed({ ...BASE, netAreaFt2: -100 });
    expect(negative.netAreaFt2).toBe(0);
    expect(negative.seedLb).toBe(0);
  });

  it("prices the purchased weight, not the exact need", () => {
    // Worked example: 39 lb purchased at $2/lb = $78 (the exact need is 38.5 lb).
    const priced = calculateLawnSeed({ ...BASE, netAreaFt2: 5000, pricePerLb: 2 });
    expect(priced.costUsd).toBe(78);
    const unpriced = calculateLawnSeed({ ...BASE, netAreaFt2: 5000 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("flags the greedy fallback for very large orders", () => {
    // Exactly at the bound: 1,000,000 ft² at 10 lb, 0% buffer is
    // 10,000 lb — still exactly optimized (400 x 25 lb).
    const atBound = calculateLawnSeed({
      netAreaFt2: 1000000,
      rateLbPer1000Ft2: 10,
      bufferPct: 0,
    });
    expect(atBound.seedLb).toBe(10000);
    expect(atBound.bagsOptimized).toBe(true);
    expect(atBound.bags).toEqual([{ sizeLb: 25, count: 400 }]);
    // Just above the bound: 10,000.01 lb uses the greedy fallback.
    const overBound = calculateLawnSeed({
      netAreaFt2: 1000001,
      rateLbPer1000Ft2: 10,
      bufferPct: 0,
    });
    expect(overBound.bagsOptimized).toBe(false);
    expect(overBound.purchaseLb).toBe(10003);
  });
});

describe("seeding-rate unit conversion (g/m² vs lb per 1,000 ft²)", () => {
  it("converts 1 lb per 1,000 ft² to 4.882 g/m²", () => {
    // 453.59237 g per 92.90304 m² = 4.88243 g/m².
    expect(lbPer1000Ft2ToGramsPerSquareMeter(1)).toBeCloseTo(4.882, 3);
    expect(lbPer1000Ft2ToGramsPerSquareMeter(7)).toBeCloseTo(34.18, 2);
    expect(lbPer1000Ft2ToGramsPerSquareMeter(0)).toBe(0);
  });

  it("round-trips between the two rate units", () => {
    expect(gramsPerSquareMeterToLbPer1000Ft2(lbPer1000Ft2ToGramsPerSquareMeter(7))).toBeCloseTo(
      7,
      9,
    );
    expect(gramsPerSquareMeterToLbPer1000Ft2(4.882)).toBeCloseTo(1, 3);
  });

  it("a g/m² rate and its lb equivalent give the same seed weight", () => {
    // 7 lb per 1,000 ft² = 34.18 g/m² (rounded to 2 decimals); on
    // 5,000 ft² both give 35 lb (34.18 g/m² converts back to 7.0006
    // lb per 1,000 ft², so the weights agree to 0.01 lb). A 10%
    // buffer is used here on purpose: with no buffer the imperial
    // 35.0 lb is an exact bag fit (25 + 10) while the metric 35.003
    // lb is not, so the bag mixes would differ by one bag despite
    // the weights agreeing — bag rounding is discontinuous at exact
    // fits. With the buffer both need 38.5 lb and buy the same bags.
    const imperial = calculateLawnSeed({ netAreaFt2: 5000, rateLbPer1000Ft2: 7, bufferPct: 10 });
    const metric = calculateLawnSeed({
      netAreaFt2: 5000,
      rateLbPer1000Ft2: gramsPerSquareMeterToLbPer1000Ft2(34.18),
      bufferPct: 10,
    });
    expect(metric.seedLb).toBeCloseTo(imperial.seedLb, 1);
    expect(metric.seedKg).toBeCloseTo(imperial.seedKg, 1);
    expect(metric.bufferedLb).toBeCloseTo(imperial.bufferedLb, 1);
    expect(metric.bags).toEqual(imperial.bags);
    expect(metric.purchaseLb).toBe(imperial.purchaseLb);
  });
});
