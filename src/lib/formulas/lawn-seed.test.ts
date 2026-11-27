import { describe, expect, it } from "vitest";
import { breakdownBagSizes, calculateLawnSeed, formatBagBreakdown } from "./lawn-seed";

const BASE = {
  rateLbPer1000Ft2: 7,
  jobFactor: 1,
  bufferPct: 10,
};

describe("breakdownBagSizes", () => {
  it("mixes 25/10/3 lb bags greedily, largest first", () => {
    expect(breakdownBagSizes(38.5)).toEqual([
      { sizeLb: 25, count: 1 },
      { sizeLb: 10, count: 1 },
      { sizeLb: 3, count: 2 },
    ]);
    expect(formatBagBreakdown(breakdownBagSizes(38.5))).toBe("1 × 25 lb + 1 × 10 lb + 2 × 3 lb");
    expect(breakdownBagSizes(77)).toEqual([
      { sizeLb: 25, count: 3 },
      { sizeLb: 3, count: 1 },
    ]);
    expect(breakdownBagSizes(7.7)).toEqual([{ sizeLb: 3, count: 3 }]);
    expect(breakdownBagSizes(19.25)).toEqual([
      { sizeLb: 10, count: 1 },
      { sizeLb: 3, count: 4 },
    ]);
    expect(breakdownBagSizes(13.75)).toEqual([
      { sizeLb: 10, count: 1 },
      { sizeLb: 3, count: 2 },
    ]);
  });

  it("returns no bags for zero", () => {
    expect(breakdownBagSizes(0)).toEqual([]);
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
});

describe("calculateLawnSeed", () => {
  it("matches the worked example: 5,000 ft² new lawn, tall fescue 7 lb/1,000 ft²", () => {
    // 5 × 7 = 35 lb; with 10% buffer: 38.5 lb.
    const r = calculateLawnSeed({ ...BASE, netAreaFt2: 5000 });
    expect(r.netAreaFt2).toBe(5000);
    expect(r.netAreaM2).toBeCloseTo(464.52, 2);
    expect(r.seedLb).toBe(35);
    expect(r.seedKg).toBeCloseTo(15.88, 2);
    expect(r.bufferedLb).toBeCloseTo(38.5, 2);
    expect(r.bufferedKg).toBeCloseTo(17.46, 2);
    expect(r.bags).toEqual([
      { sizeLb: 25, count: 1 },
      { sizeLb: 10, count: 1 },
      { sizeLb: 3, count: 2 },
    ]);
    expect(r.bagCount).toBe(4);
    expect(r.purchaseLb).toBe(41);
  });

  it("matches the lookup-table rows (10% buffer, new lawn unless stated)", () => {
    const row = (lengthFt: number, widthFt: number, rate = 7, jobFactor = 1) =>
      calculateLawnSeed({
        ...BASE,
        netAreaFt2: lengthFt * widthFt,
        rateLbPer1000Ft2: rate,
        jobFactor,
      });
    const r1 = row(50, 20);
    expect(r1.seedLb).toBe(7);
    expect(r1.bufferedLb).toBeCloseTo(7.7, 2);
    expect(formatBagBreakdown(r1.bags)).toBe("3 × 3 lb");
    const r2 = row(50, 50);
    expect(r2.seedLb).toBe(17.5);
    expect(r2.bufferedLb).toBeCloseTo(19.25, 2);
    expect(formatBagBreakdown(r2.bags)).toBe("1 × 10 lb + 4 × 3 lb");
    const r4 = row(100, 100);
    expect(r4.seedLb).toBe(70);
    expect(r4.bufferedLb).toBe(77);
    expect(formatBagBreakdown(r4.bags)).toBe("3 × 25 lb + 1 × 3 lb");
    const r5 = row(50, 100, 2.5);
    expect(r5.seedLb).toBe(12.5);
    expect(r5.bufferedLb).toBeCloseTo(13.75, 2);
    expect(formatBagBreakdown(r5.bags)).toBe("1 × 10 lb + 2 × 3 lb");
  });

  it("halves the rate for overseeding", () => {
    // 5,000 ft² overseeded at the new-lawn rate of 7: 5 × 7 × 0.5 = 17.5 lb.
    const r = calculateLawnSeed({ ...BASE, netAreaFt2: 5000, jobFactor: 0.5 });
    expect(r.seedLb).toBe(17.5);
    expect(r.bufferedLb).toBeCloseTo(19.25, 2);
    expect(r.bagCount).toBe(5);
    expect(r.purchaseLb).toBe(22);
  });

  it("handles zero area", () => {
    const r = calculateLawnSeed({ ...BASE, netAreaFt2: 0 });
    expect(r.seedLb).toBe(0);
    expect(r.bufferedLb).toBe(0);
    expect(r.bags).toEqual([]);
    expect(r.bagCount).toBe(0);
    expect(r.purchaseLb).toBe(0);
  });

  it("prices the purchased weight, not the exact need", () => {
    // Worked example: 41 lb purchased at $2/lb = $82 (the exact need is 38.5 lb).
    const priced = calculateLawnSeed({ ...BASE, netAreaFt2: 5000, pricePerLb: 2 });
    expect(priced.costUsd).toBe(82);
    const unpriced = calculateLawnSeed({ ...BASE, netAreaFt2: 5000 });
    expect(unpriced.costUsd).toBeUndefined();
  });
});
