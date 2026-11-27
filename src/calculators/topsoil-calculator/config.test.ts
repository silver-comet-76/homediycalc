import { describe, expect, it } from "vitest";
import { topsoilConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 bag", a count of 2 reads
 * "2 bags", in the Bags result row. The shopping-list line is
 * number-only after its label and stays that way.
 *
 * Counts are hand-derived from the formula (bags = adjusted volume
 * ÷ bag size, rounded up; 0.75 ft³ bags, 10% waste): 0.5 ft³ is
 * 0.55 ft³ adjusted, so 1 bag; 1 ft³ is 1.1 ft³ adjusted, so 2 bags.
 * Volume is passed in canonical cubic feet.
 */
describe("topsoilConfig singular/plural bags", () => {
  const volumeMode = topsoilConfig.modes.find((m) => m.id === "volume");
  if (!volumeMode) throw new Error("topsoil volume mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      volume: 0.5,
      waste: 10,
      density: 2000,
      bagSize: 0.75,
      ...overrides,
    };
    const present = new Set(Object.keys(values));
    return volumeMode!.compute(values, present);
  }

  function bagRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Bags");
  }

  it("says '1 bag' for 0.5 ft³ of topsoil", () => {
    const out = compute();
    expect(bagRow(out)?.value).toBe("1 bag");
    expect(out.lines).toContain("Topsoil bags (0.75 ft³ each): 1");
  });

  it("says '2 bags' for 1 ft³ of topsoil", () => {
    const out = compute({ volume: 1 });
    expect(bagRow(out)?.value).toBe("2 bags");
    expect(out.lines).toContain("Topsoil bags (0.75 ft³ each): 2");
  });
});
