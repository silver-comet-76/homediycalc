import { describe, expect, it } from "vitest";
import { calculateLiquidWaterproofing, calculateSheetWaterproofing } from "./waterproofing";

describe("calculateLiquidWaterproofing", () => {
  it("matches the FORMULAS.md worked example: 100 ft² shower, 2 coats at 110 ft²/gal", () => {
    // 100 × 2 ÷ 110 × 1.10 = 2.00 gal -> 2 one-gallon containers.
    const r = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: 110,
      containerGal: 1,
      wastePct: 10,
    });
    expect(r.gallons).toBeCloseTo(2.0, 2);
    expect(r.containers).toBe(2);
    expect(r.litersToBuy).toBeCloseTo(7.57, 2);
  });

  it("uses the IAPMO pan-liner rate of 80 ft²/gal per coat", () => {
    // 100 ft², 2 coats at 80 ft²/gal, 10% waste: 2.75 gal -> 3 gal,
    // or 1 container of 3.5 gal.
    const r = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: 80,
      containerGal: 1,
      wastePct: 10,
    });
    expect(r.gallons).toBeCloseTo(2.75, 2);
    expect(r.containers).toBe(3);
    const pail = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: 80,
      containerGal: 3.5,
      wastePct: 10,
    });
    expect(pail.containers).toBe(1);
  });

  it("uses the crack-prevention two-coat rate of 50 ft²/gal per coat", () => {
    // RedGard TDS-104: crack prevention is 100 ft²/gal in one coat,
    // i.e. 50 ft²/gal per coat for the two-coat ANSI A118.12
    // application. 100 ft² × 2 coats ÷ 50 ft²/gal × 1.10 = 4.40 gal.
    const r = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: 50,
      containerGal: 1,
      wastePct: 10,
    });
    expect(r.gallons).toBeCloseTo(4.4, 2);
    expect(r.containers).toBe(5);
  });

  it("prices containers only when a price is entered", () => {
    const r = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: 110,
      containerGal: 1,
      wastePct: 10,
      pricePerContainer: 55,
    });
    expect(r.costUsd).toBe(110);
    const unpriced = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: 110,
      containerGal: 1,
      wastePct: 10,
    });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculateLiquidWaterproofing({
      areaFt2: 0,
      coats: 2,
      coveragePerCoatFt2PerGal: 110,
      containerGal: 1,
      wastePct: 10,
    });
    expect(r.gallons).toBe(0);
    expect(r.containers).toBe(0);
  });
});

describe("calculateSheetWaterproofing", () => {
  it("matches the FORMULAS.md worked example: 80 ft², KERDI 200/10M roll", () => {
    // 80 × 1.10 ÷ 108 = 0.81 -> 1 roll.
    const r = calculateSheetWaterproofing({
      areaFt2: 80,
      rollCoverageFt2: 108,
      wastePct: 10,
    });
    expect(r.rolls).toBe(1);
  });

  it("rounds up when the area just exceeds one roll", () => {
    // 100 × 1.10 ÷ 108 = 1.02 -> 2 rolls.
    const r = calculateSheetWaterproofing({
      areaFt2: 100,
      rollCoverageFt2: 108,
      wastePct: 10,
    });
    expect(r.rolls).toBe(2);
  });
});
