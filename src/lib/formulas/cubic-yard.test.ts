import { describe, expect, it } from "vitest";
import { calculateCubicYardFromDimensions, convertCubicYardValue } from "./cubic-yard";

describe("calculateCubicYardFromDimensions", () => {
  it("matches the FORMULAS.md worked example: 3 × 3 × 3 ft = 1 yd³", () => {
    const r = calculateCubicYardFromDimensions({ lengthFt: 3, widthFt: 3, depthFt: 3 });
    expect(r.volumeFt3).toBe(27);
    expect(r.volumeYd3).toBe(1);
    expect(r.volumeM3).toBeCloseTo(0.76, 2);
    expect(r.volumeLiters).toBeCloseTo(764.55, 1);
    expect(r.volumeGallons).toBeCloseTo(201.97, 1);
  });

  it("handles a rectangular volume", () => {
    const r = calculateCubicYardFromDimensions({ lengthFt: 10, widthFt: 10, depthFt: 0.25 });
    expect(r.volumeFt3).toBe(25);
    expect(r.volumeYd3).toBeCloseTo(0.93, 2);
  });
});

describe("convertCubicYardValue", () => {
  it("converts 54 ft³ to 2 yd³", () => {
    const r = convertCubicYardValue(54, "ft3");
    expect(r.volumeYd3).toBe(2);
    expect(r.volumeFt3).toBe(54);
  });

  it("converts 1 m³ to about 1.31 yd³", () => {
    const r = convertCubicYardValue(1, "m3");
    expect(r.volumeYd3).toBeCloseTo(1.31, 2);
    expect(r.volumeFt3).toBeCloseTo(35.31, 2);
  });

  it("converts 100 gallons to about 0.50 yd³", () => {
    const r = convertCubicYardValue(100, "gal");
    expect(r.volumeYd3).toBeCloseTo(0.5, 2);
  });

  it("round-trips through cubic yards", () => {
    const r = convertCubicYardValue(2.5, "yd3");
    expect(r.volumeFt3).toBe(67.5);
    expect(r.volumeYd3).toBe(2.5);
  });
});
