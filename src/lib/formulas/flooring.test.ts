import { describe, expect, it } from "vitest";
import { calculateFlooring } from "./flooring";

const BASE = {
  wastePct: 10,
  boxCoverageFt2: 20,
  includeUnderlayment: true,
  underlaymentRollCoverageFt2: 100,
};

describe("calculateFlooring", () => {
  it("matches the FORMULAS.md worked example: 12 × 15 ft room, 10% waste, 20 ft² per box", () => {
    const r = calculateFlooring({ ...BASE, areaFt2: 180, planksPerBox: 8 });
    expect(r.adjustedAreaFt2).toBeCloseTo(198, 2);
    expect(r.boxes).toBe(10);
    expect(r.planks).toBe(80);
    expect(r.underlaymentRolls).toBe(2);
  });

  it("rounds boxes up, never down", () => {
    const r = calculateFlooring({ ...BASE, areaFt2: 181 });
    // 181 × 1.10 = 199.1 ft²; 199.1 / 20 = 9.96 -> 10 boxes.
    expect(r.boxes).toBe(10);
    const exact = calculateFlooring({ ...BASE, areaFt2: 200, wastePct: 0 });
    expect(exact.boxes).toBe(10);
  });

  it("skips underlayment and planks when not requested", () => {
    const r = calculateFlooring({
      areaFt2: 180,
      wastePct: 10,
      boxCoverageFt2: 20,
      includeUnderlayment: false,
      underlaymentRollCoverageFt2: 100,
    });
    expect(r.underlaymentRolls).toBeUndefined();
    expect(r.planks).toBeUndefined();
  });

  it("prices boxes and rolls only when prices are entered", () => {
    const r = calculateFlooring({
      ...BASE,
      areaFt2: 180,
      pricePerBox: 25,
      pricePerRoll: 30,
    });
    expect(r.costUsd).toBe(10 * 25 + 2 * 30);
    const unpriced = calculateFlooring({ ...BASE, areaFt2: 180 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculateFlooring({ ...BASE, areaFt2: 0 });
    expect(r.boxes).toBe(0);
    expect(r.underlaymentRolls).toBe(0);
  });
});
