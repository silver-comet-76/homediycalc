import { describe, expect, it } from "vitest";
import { tileAdhesiveConfig } from "./config";

/**
 * Config-level tests for F-3: the "Bags to buy" result row was
 * singularized in Stage E, but the shopping-list line and the
 * workedLine still rendered the unconditional plural ("1 bags").
 * A 5 × 8 ft room needs exactly 1 bag, so all three places must
 * read "1 bag".
 */
describe("tileAdhesiveConfig singular bag wording (F-3)", () => {
  const dimensionsMode = tileAdhesiveConfig.modes.find((m) => m.id === "dimensions");
  if (!dimensionsMode) throw new Error("tile adhesive dimensions mode missing");

  it("reads '1 bag' in the result row, shopping-list line, and workedLine for a 5 × 8 ft room", () => {
    // Hand-derived: 5 × 8 ft = 40 ft², ¼ × ¼ in notch at 90 ft² per
    // 50 lb bag, 10% waste, no back-buttering.
    // Adhesive = 40 × 1.10 ÷ 90 × 50 = 24.4 lb → ceil(24.4 ÷ 50) = 1 bag.
    const values = {
      length: 5,
      width: 8,
      trowel: 90,
      bagWeight: 50,
      backButter: 0,
      waste: 10,
    };
    const present = new Set(Object.keys(values));
    const out = dimensionsMode?.compute(values, present);
    const bagsRow = out?.rows.find((r) => r.label === "Bags to buy");
    expect(bagsRow?.value).toBe("1 bag");
    expect(out?.lines).toEqual(["Tile adhesive (thinset, 50 lb bags): 1 bag (24.4 lb)"]);
    expect(out?.workedLine).toContain("buy 1 bag");
    expect(out?.workedLine).not.toContain("1 bags");
    expect(out?.lines.join(" ")).not.toContain("1 bags");

    // Plural case is unchanged: a 10 × 10 ft room needs 61.1 lb → 2 bags.
    const plural = dimensionsMode?.compute({ ...values, length: 10, width: 10 }, present);
    expect(plural?.rows.find((r) => r.label === "Bags to buy")?.value).toBe("2 bags");
    expect(plural?.lines).toEqual(["Tile adhesive (thinset, 50 lb bags): 2 bags (61.1 lb)"]);
    expect(plural?.workedLine).toContain("buy 2 bags");
  });
});
