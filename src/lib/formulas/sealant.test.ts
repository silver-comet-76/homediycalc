import { describe, expect, it } from "vitest";
import { calculateSealant } from "./sealant";

const BASE = {
  beadWidthIn: 0.25,
  beadDepthIn: 0.25,
  tubeVolumeFlOz: 10.1,
  wastePct: 10,
};

describe("calculateSealant", () => {
  it("matches the FORMULAS.md worked example: 100 ft of 1/4 in bead", () => {
    // Volume = 100 × 12 × 0.0625 × 1.10 = 82.5 in³ = 45.7 fl oz.
    // Tubes = ceil(45.7 ÷ 10.1) = 5. Coverage = 18.2 ÷ 0.0625 ÷ 12 = 24.3 ft/tube.
    const r = calculateSealant({ ...BASE, jointLengthFt: 100 });
    expect(r.volumeIn3).toBeCloseTo(82.5, 1);
    expect(r.volumeFlOz).toBeCloseTo(45.71, 2);
    expect(r.coverageFtPerTube).toBeCloseTo(24.3, 2);
    expect(r.tubes).toBe(5);
  });

  it("covers far fewer feet with a wider bead", () => {
    // 3/8 × 3/8 in bead, 100 ft, no waste: 168.75 in³ = 93.5 fl oz -> 10 tubes;
    // coverage 10.8 ft per tube.
    const r = calculateSealant({
      ...BASE,
      jointLengthFt: 100,
      beadWidthIn: 0.375,
      beadDepthIn: 0.375,
      wastePct: 0,
    });
    expect(r.volumeIn3).toBeCloseTo(168.75, 1);
    expect(r.tubes).toBe(10);
    expect(r.coverageFtPerTube).toBeCloseTo(10.8, 2);
  });

  it("uses fewer large sausage tubes", () => {
    // 100 ft of 1/4 in bead, 10% waste, 20 fl oz sausages: 45.7 ÷ 20 = 2.29 -> 3.
    const r = calculateSealant({
      ...BASE,
      jointLengthFt: 100,
      tubeVolumeFlOz: 20,
    });
    expect(r.tubes).toBe(3);
  });

  it("prices tubes only when a price is entered", () => {
    const r = calculateSealant({ ...BASE, jointLengthFt: 100, pricePerTube: 6 });
    expect(r.costUsd).toBe(30);
    const unpriced = calculateSealant({ ...BASE, jointLengthFt: 100 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero joint length", () => {
    const r = calculateSealant({ ...BASE, jointLengthFt: 0 });
    expect(r.volumeIn3).toBe(0);
    expect(r.tubes).toBe(0);
  });
});
