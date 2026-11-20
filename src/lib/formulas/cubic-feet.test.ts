import { describe, expect, it } from "vitest";
import { calculateCubicFeet } from "./cubic-feet";

describe("calculateCubicFeet", () => {
  it("matches the FORMULAS.md worked example: 5 × 4 × 2 ft", () => {
    const r = calculateCubicFeet({ lengthFt: 5, widthFt: 4, heightFt: 2 });
    expect(r.volumeFt3).toBe(40);
    expect(r.volumeYd3).toBeCloseTo(1.48, 2);
    expect(r.volumeM3).toBeCloseTo(1.13, 2);
    expect(r.volumeIn3).toBe(69120);
    expect(r.volumeLiters).toBeCloseTo(1132.67, 1);
    expect(r.volumeGallons).toBeCloseTo(299.22, 1);
  });

  it("handles a 1 ft cube exactly", () => {
    const r = calculateCubicFeet({ lengthFt: 1, widthFt: 1, heightFt: 1 });
    expect(r.volumeFt3).toBe(1);
    expect(r.volumeIn3).toBe(1728);
    expect(r.volumeYd3).toBeCloseTo(0.037, 3);
  });

  it("handles fractional dimensions", () => {
    // 2.5 ft × 1.5 ft × 0.5 ft = 1.875 ft³.
    const r = calculateCubicFeet({ lengthFt: 2.5, widthFt: 1.5, heightFt: 0.5 });
    expect(r.volumeFt3).toBeCloseTo(1.88, 2);
  });

  it("handles zero height", () => {
    const r = calculateCubicFeet({ lengthFt: 5, widthFt: 4, heightFt: 0 });
    expect(r.volumeFt3).toBe(0);
    expect(r.volumeGallons).toBe(0);
  });
});
