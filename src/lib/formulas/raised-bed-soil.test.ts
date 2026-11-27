import { describe, expect, it } from "vitest";
import { calculateRaisedBedSoil } from "./raised-bed-soil";

const BASE = {
  settlingPct: 10,
  topsoilPct: 60,
  compostPct: 30,
  aerationPct: 10,
  bagSizeFt3: 2,
};

describe("calculateRaisedBedSoil", () => {
  it("matches the worked example: 4 × 8 ft bed, 10 in of soil, 60/30/10", () => {
    // 8 × 4 × 10/12 = 26.67 ft³ = 0.99 yd³; with 10% settling: 29.33 ft³ = 1.09 yd³.
    const r = calculateRaisedBedSoil({ ...BASE, soilFt3: 8 * 4 * (10 / 12) });
    expect(r.soilFt3).toBeCloseTo(26.67, 2);
    expect(r.orderedFt3).toBeCloseTo(29.33, 2);
    expect(r.orderedYd3).toBeCloseTo(1.09, 2);
    expect(r.orderedM3).toBeCloseTo(0.83, 2);
    // Bulk to order: ceil(1.086) = 2 yd³.
    expect(r.orderYd3).toBe(2);
    // Bags: 29.33 / 2 = 14.67 -> 15.
    expect(r.bags).toBe(15);
    // Mix on the ordered volume: 60% of 29.33 = 17.6, 30% = 8.8, 10% = 2.93.
    expect(r.topsoilFt3).toBeCloseTo(17.6, 2);
    expect(r.compostFt3).toBeCloseTo(8.8, 2);
    expect(r.aerationFt3).toBeCloseTo(2.93, 2);
  });

  it("matches the lookup-table rows (10% settling, 60/30/10, 2 ft³ bags)", () => {
    const row = (lengthFt: number, widthFt: number, depthIn: number, beds = 1) =>
      calculateRaisedBedSoil({
        ...BASE,
        soilFt3: ((lengthFt * widthFt * depthIn) / 12) * beds,
      });
    const r1 = row(4, 4, 10);
    expect(r1.orderedFt3).toBeCloseTo(14.67, 2);
    expect(r1.orderYd3).toBe(1);
    expect(r1.bags).toBe(8);
    expect(r1.topsoilFt3).toBeCloseTo(8.8, 2);
    expect(r1.compostFt3).toBeCloseTo(4.4, 2);
    expect(r1.aerationFt3).toBeCloseTo(1.47, 2);
    const r3 = row(4, 8, 12);
    expect(r3.orderedFt3).toBeCloseTo(35.2, 2);
    expect(r3.orderYd3).toBe(2);
    expect(r3.bags).toBe(18);
    expect(r3.topsoilFt3).toBeCloseTo(21.12, 2);
    expect(r3.compostFt3).toBeCloseTo(10.56, 2);
    expect(r3.aerationFt3).toBeCloseTo(3.52, 2);
    const r4 = row(8, 8, 10);
    expect(r4.orderedFt3).toBeCloseTo(58.67, 2);
    expect(r4.orderYd3).toBe(3);
    expect(r4.bags).toBe(30);
    expect(r4.topsoilFt3).toBeCloseTo(35.2, 2);
    expect(r4.compostFt3).toBeCloseTo(17.6, 2);
    expect(r4.aerationFt3).toBeCloseTo(5.87, 2);
    // Two beds of 4 × 4 × 10 in hold the same soil as one 4 × 8 × 10 in bed.
    const r5 = row(4, 4, 10, 2);
    expect(r5.orderedFt3).toBeCloseTo(29.33, 2);
    expect(r5.orderYd3).toBe(2);
    expect(r5.bags).toBe(15);
  });

  it("normalizes mix proportions that do not add to 100", () => {
    // 50/30/10 sums to 90 — the split is 50/90, 30/90, 10/90 of the ordered volume.
    const r = calculateRaisedBedSoil({
      ...BASE,
      soilFt3: 27,
      settlingPct: 0,
      topsoilPct: 50,
      compostPct: 30,
      aerationPct: 10,
    });
    expect(r.orderedFt3).toBe(27);
    expect(r.topsoilFt3).toBeCloseTo(15, 2);
    expect(r.compostFt3).toBeCloseTo(9, 2);
    expect(r.aerationFt3).toBeCloseTo(3, 2);
    expect(r.topsoilFt3 + r.compostFt3 + r.aerationFt3).toBeCloseTo(27, 2);
  });

  it("handles all-zero mix proportions without NaN", () => {
    const r = calculateRaisedBedSoil({
      ...BASE,
      soilFt3: 27,
      settlingPct: 0,
      topsoilPct: 0,
      compostPct: 0,
      aerationPct: 0,
    });
    expect(r.topsoilFt3).toBe(0);
    expect(r.compostFt3).toBe(0);
    expect(r.aerationFt3).toBe(0);
    expect(r.bags).toBe(14); // 27 / 2 = 13.5 -> 14
  });

  it("rounds bags and bulk up, never down", () => {
    const r = calculateRaisedBedSoil({ ...BASE, soilFt3: 1, settlingPct: 0 });
    expect(r.bags).toBe(1); // 1 / 2 = 0.5 -> 1 (ceilUp never returns 0 for a positive need)
    expect(r.orderYd3).toBe(1); // 1/27 yd³ -> 1 yd³
  });

  it("prices bulk or bags, never both — bulk wins when both prices are entered", () => {
    // Worked example: 2 yd³ to order at $45/yd³, 15 bags at $8/bag.
    const both = calculateRaisedBedSoil({
      ...BASE,
      soilFt3: 8 * 4 * (10 / 12),
      pricePerYd3: 45,
      pricePerBag: 8,
    });
    expect(both.costUsd).toBe(2 * 45);
    const bagsOnly = calculateRaisedBedSoil({
      ...BASE,
      soilFt3: 8 * 4 * (10 / 12),
      pricePerBag: 8,
    });
    expect(bagsOnly.costUsd).toBe(15 * 8);
    const unpriced = calculateRaisedBedSoil({ ...BASE, soilFt3: 8 * 4 * (10 / 12) });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero soil volume", () => {
    const r = calculateRaisedBedSoil({ ...BASE, soilFt3: 0 });
    expect(r.orderedYd3).toBe(0);
    expect(r.orderYd3).toBe(0);
    expect(r.bags).toBe(0);
  });
});
