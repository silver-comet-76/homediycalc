import { describe, expect, it } from "vitest";
import { calculateConcrete, roundUpToQuarterYard } from "./concrete";

describe("calculateConcrete", () => {
  it("matches the FORMULAS.md worked example: 10 × 10 ft, 4 in deep, 10% waste", () => {
    const r = calculateConcrete({
      lengthFt: 10, widthFt: 10, depthFt: 4 / 12, wastePct: 10, quarterYardRounding: true,
    });
    expect(r.volumeFt3).toBeCloseTo(33.33, 2);
    expect(r.volumeYd3).toBeCloseTo(1.23, 2);
    expect(r.adjustedYd3).toBeCloseTo(1.36, 2);
    expect(r.orderYd3).toBe(1.5);
    expect(r.bags80).toBe(62);
    expect(r.bags60).toBe(82);
    expect(r.bags40).toBe(123);
  });

  it("rounds the ready-mix order up to whole yards when quarter-yard rounding is off", () => {
    const r = calculateConcrete({
      lengthFt: 10, widthFt: 10, depthFt: 4 / 12, wastePct: 10, quarterYardRounding: false,
    });
    expect(r.orderYd3).toBe(2);
  });

  it("rounds bag counts up, never down", () => {
    // 1 ft³ with no waste needs 2 bags of 80 lb (1 / 0.6 = 1.67).
    const r = calculateConcrete({
      lengthFt: 1, widthFt: 1, depthFt: 1, wastePct: 0, quarterYardRounding: true,
    });
    expect(r.bags80).toBe(2);
    expect(r.bags60).toBe(3);
    expect(r.bags40).toBe(4);
  });

  it("charges cost from the rounded order quantity, and shows no cost without a price", () => {
    const priced = calculateConcrete({
      lengthFt: 10, widthFt: 10, depthFt: 4 / 12, wastePct: 10,
      quarterYardRounding: true, pricePerYd3: 100,
    });
    expect(priced.costUsd).toBe(150); // 1.5 yd³ × $100
    const unpriced = calculateConcrete({
      lengthFt: 10, widthFt: 10, depthFt: 4 / 12, wastePct: 10, quarterYardRounding: true,
    });
    expect(unpriced.costUsd).toBeUndefined();
    const bagPriced = calculateConcrete({
      lengthFt: 1, widthFt: 1, depthFt: 1, wastePct: 0,
      quarterYardRounding: true, pricePerBag80: 5,
    });
    expect(bagPriced.costUsd).toBe(10); // 2 bags × $5
  });

  it("handles zero volume and large pours", () => {
    const zero = calculateConcrete({
      lengthFt: 10, widthFt: 10, depthFt: 0, wastePct: 10, quarterYardRounding: true,
    });
    expect(zero.volumeFt3).toBe(0);
    expect(zero.bags80).toBe(0);
    const large = calculateConcrete({
      lengthFt: 100, widthFt: 100, depthFt: 1, wastePct: 0, quarterYardRounding: true,
    });
    expect(large.volumeYd3).toBeCloseTo(370.37, 2);
    expect(large.orderYd3).toBe(370.5);
  });
});

describe("roundUpToQuarterYard", () => {
  it("rounds 1.36 up to 1.5 and leaves exact quarters alone", () => {
    expect(roundUpToQuarterYard(1.36)).toBe(1.5);
    expect(roundUpToQuarterYard(1.5)).toBe(1.5);
    expect(roundUpToQuarterYard(1.26)).toBe(1.5);
    expect(roundUpToQuarterYard(0.01)).toBe(0.25);
  });
});
