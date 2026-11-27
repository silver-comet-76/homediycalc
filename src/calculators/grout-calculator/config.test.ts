import { describe, expect, it } from "vitest";
import { groutConfig } from "./config";

/**
 * Config-level tests for F-6: the "Bags needed" result row was
 * singularized in Stage E, but the shopping-list line still rendered
 * the unconditional plural ("1 bags"). A 5 × 8 ft room needs exactly
 * 1 bag, so the line must read "1 bag".
 */
describe("groutConfig singular bag wording (F-6)", () => {
  const dimensionsMode = groutConfig.modes.find((m) => m.id === "dimensions");
  if (!dimensionsMode) throw new Error("grout dimensions mode missing");

  it("reads '1 bag' in the result row and the shopping-list line for a 5 × 8 ft room", () => {
    // Hand-derived: 5 × 8 ft = 40 ft², 12 × 12 in tile, ⅛ in joints
    // ⅜ in deep, density 98.5 lb/ft³, 10 lb bags, 10% extra.
    // lb/ft² = (12 + 12) ÷ (12 × 12) × 0.125 × 0.375 × 144 × 98.5 ÷ 1,728
    //        = 0.064128; grout = 40 × 0.064128 × 1.10 = 2.8 lb
    //        → ceil(2.8 ÷ 10) = 1 bag.
    const values = {
      length: 5,
      width: 8,
      tileLength: 12,
      tileWidth: 12,
      jointWidth: 0.125,
      jointDepth: 0.375,
      density: 98.5,
      bagWeight: 10,
      waste: 10,
    };
    const present = new Set(Object.keys(values));
    const out = dimensionsMode?.compute(values, present);
    const bagsRow = out?.rows.find((r) => r.label === "Bags needed");
    expect(bagsRow?.value).toBe("1 bag");
    expect(out?.lines).toEqual(["Grout (10 lb bags): 1 bag (2.8 lb)"]);
    expect(out?.lines.join(" ")).not.toContain("1 bags");

    // Plural case is unchanged: a 12 × 15 ft room needs 12.7 lb → 2 bags.
    const plural = dimensionsMode?.compute({ ...values, length: 12, width: 15 }, present);
    expect(plural?.rows.find((r) => r.label === "Bags needed")?.value).toBe("2 bags");
    expect(plural?.lines).toEqual(["Grout (10 lb bags): 2 bags (12.7 lb)"]);
  });
});
