import { describe, expect, it } from "vitest";
import { calculateSquareFootage } from "./square-footage";

describe("calculateSquareFootage", () => {
  it("matches the FORMULAS.md worked example: 12 × 15 ft room", () => {
    const r = calculateSquareFootage({ shape: "rectangle", lengthFt: 12, widthFt: 15 });
    expect(r.areaFt2).toBe(180);
    expect(r.areaM2).toBeCloseTo(16.72, 2);
    expect(r.areaYd2).toBe(20);
    expect(r.acres).toBeCloseTo(0.0041, 4);
  });

  it("calculates circle area from the radius", () => {
    const r = calculateSquareFootage({ shape: "circle", lengthFt: 0, widthFt: 0, radiusFt: 5 });
    expect(r.areaFt2).toBeCloseTo(78.54, 2);
  });

  it("calculates triangle area as half base times height", () => {
    const r = calculateSquareFootage({ shape: "triangle", lengthFt: 10, widthFt: 6 });
    expect(r.areaFt2).toBe(30);
  });

  it("adds the two rectangles for an L-shaped room", () => {
    const r = calculateSquareFootage({
      shape: "l-shape", lengthFt: 12, widthFt: 10, length2Ft: 6, width2Ft: 8,
    });
    expect(r.areaFt2).toBe(168);
  });

  it("handles zero dimensions", () => {
    const r = calculateSquareFootage({ shape: "rectangle", lengthFt: 0, widthFt: 15 });
    expect(r.areaFt2).toBe(0);
    expect(r.acres).toBe(0);
  });
});
