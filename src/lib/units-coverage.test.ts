/**
 * Coverage conversion tests (Phase 7 remediation, GitHub Issue #1).
 *
 * Coverage is an area-per-volume rate, not a pure area: cans print
 * ft² per US gallon in imperial and m² per liter in metric. Before
 * this fix the Coverage field converted as a pure area (m²→ft²), so
 * the metric defaults were 32.52 / 27.87 / 10.22 — the pure-area
 * figures — and a metric user entering their can's m²/L figure
 * over-ordered by ~3.8×. The true equivalents are 350 ft²/gal =
 * 8.59 m²/L, 300 ft²/gal = 7.36 m²/L, 110 ft²/gal = 2.70 m²/L.
 */
import { describe, expect, it } from "vitest";
import {
  SQM_PER_LITER_PER_SQFT_PER_GALLON,
  convertCoverage,
  fromSquareFeetPerGallon,
  toSquareFeetPerGallon,
} from "./units";
import { calculatePaint } from "./formulas/paint";
import { calculatePrimer } from "./formulas/primer";
import { calculateLiquidWaterproofing } from "./formulas/waterproofing";

describe("coverage conversion constant", () => {
  it("1 ft²/gal = 0.09290304 / 3.785411784 m²/L, derived from exact constants", () => {
    expect(SQM_PER_LITER_PER_SQFT_PER_GALLON).toBeCloseTo(0.0245423867, 10);
    expect(SQM_PER_LITER_PER_SQFT_PER_GALLON).toBe(0.09290304 / 3.785411784);
  });

  it("converts the three reference rates to their m²/L equivalents", () => {
    expect(convertCoverage(350, "ft2/gal", "m2/L")).toBeCloseTo(8.59, 2);
    expect(convertCoverage(300, "ft2/gal", "m2/L")).toBeCloseTo(7.36, 2);
    expect(convertCoverage(110, "ft2/gal", "m2/L")).toBeCloseTo(2.7, 2);
  });

  it("is not the pure-area conversion (the old defect)", () => {
    // Pure-area conversion would give 32.52 for 350 ft²/gal.
    expect(convertCoverage(350, "ft2/gal", "m2/L")).not.toBeCloseTo(32.52, 1);
    expect(convertCoverage(350, "ft2/gal", "m2/L")).toBeLessThan(10);
  });

  it("round-trips ft²/gal → m²/L → ft²/gal", () => {
    for (const rate of [80, 110, 250, 300, 350, 400]) {
      const roundTripped = convertCoverage(
        convertCoverage(rate, "ft2/gal", "m2/L"),
        "m2/L",
        "ft2/gal",
      );
      expect(roundTripped).toBeCloseTo(rate, 10);
    }
  });

  it("returns the value unchanged for identical units", () => {
    expect(convertCoverage(350, "ft2/gal", "ft2/gal")).toBe(350);
    expect(convertCoverage(8.59, "m2/L", "m2/L")).toBe(8.59);
  });

  it("toSquareFeetPerGallon / fromSquareFeetPerGallon agree with convertCoverage", () => {
    expect(toSquareFeetPerGallon(8.59, "m2/L")).toBeCloseTo(350, 0);
    expect(fromSquareFeetPerGallon(350, "m2/L")).toBeCloseTo(8.59, 2);
  });
});

describe("metric coverage gives the same purchase as imperial coverage", () => {
  it("paint: 8.59 m²/L buys the same gallons as 350 ft²/gal", () => {
    const imperial = calculatePaint({
      netAreaFt2: 400,
      coats: 2,
      coverageFt2PerGal: 350,
      wastePct: 10,
    });
    const metric = calculatePaint({
      netAreaFt2: 400,
      coats: 2,
      coverageFt2PerGal: toSquareFeetPerGallon(8.59, "m2/L"),
      wastePct: 10,
    });
    expect(metric.gallonsToBuy).toBe(imperial.gallonsToBuy);
    expect(metric.gallonsToBuy).toBe(3);
    expect(metric.adjustedGallons).toBeCloseTo(imperial.adjustedGallons, 2);
  });

  it("primer: 7.36 m²/L buys the same gallons as 300 ft²/gal", () => {
    const imperial = calculatePrimer({
      netAreaFt2: 400,
      coats: 1,
      coverageFt2PerGal: 300,
      conditionFactor: 1.2,
      wastePct: 10,
    });
    const metric = calculatePrimer({
      netAreaFt2: 400,
      coats: 1,
      coverageFt2PerGal: toSquareFeetPerGallon(7.36, "m2/L"),
      conditionFactor: 1.2,
      wastePct: 10,
    });
    expect(metric.gallonsToBuy).toBe(imperial.gallonsToBuy);
    expect(metric.gallonsToBuy).toBe(2);
    expect(metric.adjustedGallons).toBeCloseTo(imperial.adjustedGallons, 2);
  });

  it("waterproofing: 2.70 m²/L buys the same containers as 110 ft²/gal", () => {
    const imperial = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: 110,
      containerGal: 1,
      wastePct: 10,
    });
    const metric = calculateLiquidWaterproofing({
      areaFt2: 100,
      coats: 2,
      coveragePerCoatFt2PerGal: toSquareFeetPerGallon(2.7, "m2/L"),
      containerGal: 1,
      wastePct: 10,
    });
    expect(metric.containers).toBe(imperial.containers);
    expect(metric.containers).toBe(2);
    expect(metric.gallons).toBeCloseTo(imperial.gallons, 2);
  });
});
