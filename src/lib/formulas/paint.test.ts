import { describe, expect, it } from "vitest";
import { calculatePaint, roomWallArea } from "./paint";

describe("calculatePaint", () => {
  it("matches the FORMULAS.md worked example: 400 ft², 2 coats, 350 ft²/gal", () => {
    const r = calculatePaint({
      netAreaFt2: 400, coats: 2, coverageFt2PerGal: 350, wastePct: 0,
    });
    expect(r.rawGallons).toBeCloseTo(2.29, 2);
    expect(r.gallonsToBuy).toBe(3);
    const withWaste = calculatePaint({
      netAreaFt2: 400, coats: 2, coverageFt2PerGal: 350, wastePct: 10,
    });
    expect(withWaste.adjustedGallons).toBeCloseTo(2.51, 2);
    expect(withWaste.gallonsToBuy).toBe(3);
  });

  it("rounds gallons up and converts the bought amount to liters", () => {
    const r = calculatePaint({
      netAreaFt2: 350, coats: 1, coverageFt2PerGal: 350, wastePct: 0,
    });
    expect(r.gallonsToBuy).toBe(1);
    expect(r.litersToBuy).toBeCloseTo(3.79, 2);
    const justOver = calculatePaint({
      netAreaFt2: 351, coats: 1, coverageFt2PerGal: 350, wastePct: 0,
    });
    expect(justOver.gallonsToBuy).toBe(2);
  });

  it("charges cost from rounded gallons only when a price is entered", () => {
    const priced = calculatePaint({
      netAreaFt2: 400, coats: 2, coverageFt2PerGal: 350, wastePct: 0, pricePerGal: 30,
    });
    expect(priced.costUsd).toBe(90);
    const unpriced = calculatePaint({
      netAreaFt2: 400, coats: 2, coverageFt2PerGal: 350, wastePct: 0,
    });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculatePaint({
      netAreaFt2: 0, coats: 2, coverageFt2PerGal: 350, wastePct: 10,
    });
    expect(r.gallonsToBuy).toBe(0);
  });
});

describe("roomWallArea", () => {
  it("computes four walls minus a standard door and windows", () => {
    // 12 × 15 ft room, 8 ft walls: 2 × (12 + 15) × 8 = 432 ft² gross.
    // Minus 1 door (21 ft²) and 2 windows (15 ft² each) = 381 ft².
    expect(roomWallArea(12, 15, 8, 1, 2)).toBe(381);
  });

  it("never goes below zero when openings exceed wall area", () => {
    expect(roomWallArea(5, 5, 8, 10, 10)).toBe(0);
  });
});
