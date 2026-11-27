import { describe, expect, it } from "vitest";
import { mulchConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 bag", a count of 2 reads
 * "2 bags", in the result row and the worked line. The shopping-list
 * line is number-only after its label and stays that way.
 *
 * Counts are hand-derived from the formula (bags = adjusted volume
 * ÷ bag size, rounded up): 1 × 1 ft at 3 in deep with 5% waste is
 * 0.2625 ft³ ÷ 2 ft³ = 1 bag; 2 × 2 ft at 6 in deep is 2.1 ft³ ÷
 * 2 ft³ = 2 bags. Depth is passed in canonical feet (3 in = 0.25 ft).
 */
describe("mulchConfig singular/plural bags", () => {
  const bedMode = mulchConfig.modes.find((m) => m.id === "bed");
  if (!bedMode) throw new Error("mulch bed mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      length: 1,
      width: 1,
      depth: 0.25,
      waste: 5,
      bagSize: 2,
      ...overrides,
    };
    const present = new Set(Object.keys(values));
    return bedMode!.compute(values, present);
  }

  function bagRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Bags to buy");
  }

  it("says '1 bag' for a 1 × 1 ft bed, 3 in deep", () => {
    const out = compute();
    expect(bagRow(out)?.value).toBe("1 bag");
    expect(out.workedLine).toBe(
      "1 × 1 × 0.25 ft = 0.25 ft³ = 0.01 yd³; 0.26 ft³ with waste ÷ 2 ft³ per bag = 1 bag.",
    );
    expect(out.lines).toContain("Mulch bags (2 ft³): 1");
  });

  it("says '2 bags' for a 2 × 2 ft bed, 6 in deep", () => {
    const out = compute({ length: 2, width: 2, depth: 0.5 });
    expect(bagRow(out)?.value).toBe("2 bags");
    expect(out.workedLine).toBe(
      "2 × 2 × 0.5 ft = 2 ft³ = 0.07 yd³; 2.1 ft³ with waste ÷ 2 ft³ per bag = 2 bags.",
    );
    expect(out.lines).toContain("Mulch bags (2 ft³): 2");
  });
});
