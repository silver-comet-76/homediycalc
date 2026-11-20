import { describe, expect, it } from "vitest";
import { calculateConcreteBags } from "./concrete-bags";

describe("calculateConcreteBags", () => {
  it("matches the FORMULAS.md worked example: 1 yd³ with 10% waste", () => {
    // 1 yd³ = 27 ft³; with 10% waste: 29.7 ft³.
    // 80 lb bags (0.60 ft³): 29.7 / 0.60 = 49.5 -> 50.
    // 60 lb bags (0.45 ft³): 29.7 / 0.45 = 66 exactly.
    // 40 lb bags (0.30 ft³): 29.7 / 0.30 = 99 exactly.
    const r = calculateConcreteBags({ volumeFt3: 27, wastePct: 10 });
    expect(r.volumeYd3).toBe(1);
    expect(r.adjustedFt3).toBeCloseTo(29.7, 2);
    expect(r.adjustedYd3).toBeCloseTo(1.1, 2);
    expect(r.bags80).toBe(50);
    expect(r.bags60).toBe(66);
    expect(r.bags40).toBe(99);
  });

  it("rounds every bag size up, never down", () => {
    const r = calculateConcreteBags({ volumeFt3: 1, wastePct: 0 });
    expect(r.bags80).toBe(2); // 1 / 0.60 = 1.67
    expect(r.bags60).toBe(3); // 1 / 0.45 = 2.22
    expect(r.bags40).toBe(4); // 1 / 0.30 = 3.33
  });

  it("does not round up a mathematically exact count", () => {
    const r = calculateConcreteBags({ volumeFt3: 0.6, wastePct: 0 });
    expect(r.bags80).toBe(1);
    expect(r.bags60).toBe(2); // 0.6 / 0.45 = 1.33
  });

  it("reports the cheapest priced bag-size option", () => {
    const r = calculateConcreteBags({
      volumeFt3: 27,
      wastePct: 10,
      pricePerBag40: 4,
      pricePerBag60: 5,
      pricePerBag80: 6,
    });
    // 40 lb: 99 × $4 = $396; 60 lb: 66 × $5 = $330; 80 lb: 50 × $6 = $300.
    expect(r.cheapestSize).toBe("80 lb");
    expect(r.costUsd).toBe(300);
    const unpriced = calculateConcreteBags({ volumeFt3: 27, wastePct: 10 });
    expect(unpriced.costUsd).toBeUndefined();
    expect(unpriced.cheapestSize).toBeUndefined();
  });

  it("handles zero volume", () => {
    const r = calculateConcreteBags({ volumeFt3: 0, wastePct: 10 });
    expect(r.bags40).toBe(0);
    expect(r.bags60).toBe(0);
    expect(r.bags80).toBe(0);
  });
});
