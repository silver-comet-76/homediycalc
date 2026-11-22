import { describe, expect, it } from "vitest";
import {
  CUBIC_FEET_PER_CUBIC_YARD,
  LITERS_PER_US_GALLON,
  METERS_PER_FOOT,
  MILLIMETERS_PER_INCH,
  ceilUp,
  convertArea,
  convertLength,
  convertVolume,
  cubicFeetToCubicMeters,
  cubicFeetToCubicYards,
  cubicMetersToCubicFeet,
  cubicYardsToCubicFeet,
  fromCubicFeet,
  fromFeet,
  fromSquareFeet,
  gallonsToLiters,
  litersToGallons,
  roundForDisplay,
  squareFeetToSquareMeters,
  squareMetersToSquareFeet,
  toCubicFeet,
  toFeet,
  toSquareFeet,
} from "./units";

describe("exact constants", () => {
  it("1 ft = 0.3048 m exactly", () => {
    expect(METERS_PER_FOOT).toBe(0.3048);
  });
  it("1 in = 25.4 mm exactly", () => {
    expect(MILLIMETERS_PER_INCH).toBe(25.4);
  });
  it("1 yd³ = 27 ft³ exactly", () => {
    expect(CUBIC_FEET_PER_CUBIC_YARD).toBe(27);
  });
  it("1 US gal = 3.785411784 L exactly", () => {
    expect(LITERS_PER_US_GALLON).toBe(3.785411784);
  });
});

describe("length conversions", () => {
  it("converts feet to inches and back", () => {
    expect(convertLength(1, "ft", "in")).toBe(12);
    expect(convertLength(12, "in", "ft")).toBe(1);
  });
  it("converts feet to meters using the exact constant", () => {
    expect(convertLength(1, "ft", "m")).toBe(0.3048);
    expect(convertLength(0.3048, "m", "ft")).toBeCloseTo(1, 12);
  });
  it("converts feet to yards", () => {
    expect(convertLength(3, "ft", "yd")).toBe(1);
    expect(convertLength(1, "yd", "ft")).toBe(3);
  });
  it("converts meters to centimeters and millimeters", () => {
    expect(convertLength(1, "m", "cm")).toBeCloseTo(100, 9);
    expect(convertLength(1, "m", "mm")).toBeCloseTo(1000, 9);
    expect(convertLength(25.4, "mm", "in")).toBeCloseTo(1, 12);
  });
  it("returns the same value for identical units", () => {
    expect(convertLength(7.5, "m", "m")).toBe(7.5);
  });
  it("round-trips every length unit through feet (quantity preserved)", () => {
    const units = ["ft", "in", "yd", "m", "cm", "mm"] as const;
    for (const from of units) {
      for (const to of units) {
        const original = 12.345;
        expect(convertLength(convertLength(original, from, to), to, from)).toBeCloseTo(original, 9);
      }
    }
  });
  it("handles zero and very large values", () => {
    expect(convertLength(0, "ft", "m")).toBe(0);
    expect(convertLength(1_000_000, "ft", "m")).toBeCloseTo(304_800, 6);
  });
  it("toFeet / fromFeet are consistent", () => {
    expect(toFeet(2, "m")).toBeCloseTo(6.561679790026247, 9);
    expect(fromFeet(6.561679790026247, "m")).toBeCloseTo(2, 9);
  });
});

describe("area conversions", () => {
  it("converts square feet to square meters using the exact constant", () => {
    // 1 ft² = 0.3048² m² = 0.09290304 m² exactly.
    expect(convertArea(1, "ft2", "m2")).toBeCloseTo(0.09290304, 12);
    expect(squareFeetToSquareMeters(100)).toBeCloseTo(9.290304, 6);
  });
  it("converts square yards to square feet", () => {
    expect(convertArea(1, "yd2", "ft2")).toBe(9);
    expect(convertArea(9, "ft2", "yd2")).toBe(1);
  });
  it("converts square inches to square feet", () => {
    expect(convertArea(144, "in2", "ft2")).toBe(1);
  });
  it("round-trips every area unit (quantity preserved)", () => {
    const units = ["ft2", "in2", "yd2", "m2", "cm2"] as const;
    for (const from of units) {
      for (const to of units) {
        const original = 54.321;
        expect(convertArea(convertArea(original, from, to), to, from)).toBeCloseTo(original, 9);
      }
    }
  });
  it("handles zero", () => {
    expect(convertArea(0, "ft2", "m2")).toBe(0);
    expect(squareMetersToSquareFeet(0)).toBe(0);
  });
  it("toSquareFeet / fromSquareFeet are consistent", () => {
    expect(toSquareFeet(10, "m2")).toBeCloseTo(107.63910416709722, 9);
    expect(fromSquareFeet(107.63910416709722, "m2")).toBeCloseTo(10, 9);
  });
});

describe("volume conversions", () => {
  it("converts cubic feet to cubic yards (divide by 27)", () => {
    expect(cubicFeetToCubicYards(27)).toBe(1);
    expect(cubicFeetToCubicYards(54)).toBe(2);
    expect(cubicYardsToCubicFeet(1)).toBe(27);
    expect(cubicYardsToCubicFeet(2.5)).toBe(67.5);
  });
  it("converts cubic feet to cubic meters using the exact constant", () => {
    // 1 ft³ = 0.3048³ m³ = 0.028316846592 m³ exactly.
    expect(cubicFeetToCubicMeters(1)).toBeCloseTo(0.028316846592, 12);
    expect(cubicMetersToCubicFeet(1)).toBeCloseTo(35.31466672148859, 9);
  });
  it("converts US gallons to liters and back", () => {
    expect(gallonsToLiters(1)).toBe(3.785411784);
    expect(litersToGallons(3.785411784)).toBeCloseTo(1, 12);
    expect(convertVolume(1, "gal", "L")).toBeCloseTo(3.785411784, 9);
    expect(convertVolume(10, "L", "gal")).toBeCloseTo(2.6417205235814842, 9);
  });
  it("converts cubic inches to cubic feet", () => {
    expect(convertVolume(1728, "in3", "ft3")).toBe(1);
  });
  it("a US gallon is 231 cubic inches", () => {
    expect(convertVolume(1, "gal", "in3")).toBeCloseTo(231, 9);
  });
  it("round-trips every volume unit (quantity preserved)", () => {
    const units = ["ft3", "yd3", "in3", "m3", "L", "gal"] as const;
    for (const from of units) {
      for (const to of units) {
        const original = 8.765;
        expect(convertVolume(convertVolume(original, from, to), to, from)).toBeCloseTo(original, 9);
      }
    }
  });
  it("handles zero and negative values (conversion is linear)", () => {
    expect(convertVolume(0, "ft3", "yd3")).toBe(0);
    expect(convertLength(-5, "ft", "m")).toBeCloseTo(-1.524, 12);
  });
  it("toCubicFeet / fromCubicFeet are consistent", () => {
    expect(toCubicFeet(1, "yd3")).toBe(27);
    expect(fromCubicFeet(27, "yd3")).toBe(1);
    expect(toCubicFeet(5, "gal")).toBeCloseTo(0.6684027777777778, 9);
  });
});

describe("roundForDisplay", () => {
  it("rounds to 2 decimals by default", () => {
    expect(roundForDisplay(1.2345)).toBe(1.23);
    expect(roundForDisplay(1.2355)).toBe(1.24);
  });
  it("supports a custom decimal count", () => {
    expect(roundForDisplay(1.2345, 3)).toBe(1.235);
    expect(roundForDisplay(1.2345, 0)).toBe(1);
  });
});

describe("ceilUp", () => {
  it("does not round up a whole number produced by floating-point error", () => {
    // 100 × 1.1 is 110.00000000000001 in binary floating point; a plain
    // Math.ceil would order 111. ceilUp tolerates that epsilon.
    expect(ceilUp(100 * 1.1)).toBe(110);
    expect(ceilUp(66.00000000000001)).toBe(66);
  });

  it("still rounds a genuinely fractional value just above a whole number up", () => {
    expect(ceilUp(66.0001)).toBe(67);
    expect(ceilUp(66.5)).toBe(67);
    expect(ceilUp(66)).toBe(66);
    // Genuinely above an integer, but by more than the 1e-12 relative
    // tolerance: 5.0000000005 is 5e-10 above 5, so it rounds up to 6 —
    // the tolerance corrects floating-point noise, not real quantities.
    expect(ceilUp(5.0000000005)).toBe(6);
  });

  it("never recommends zero packages for a strictly positive requirement", () => {
    // The old fixed 1e-9 epsilon rounded any requirement below 1e-9
    // down to zero packages. A positive requirement always orders at
    // least one package; zero stays zero.
    expect(ceilUp(1e-12)).toBe(1);
    expect(ceilUp(5e-10)).toBe(1);
    expect(ceilUp(0.000001)).toBe(1);
    expect(ceilUp(0)).toBe(0);
    expect(ceilUp(-3)).toBe(0);
  });
});
