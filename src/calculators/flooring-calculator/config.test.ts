import { describe, expect, it } from "vitest";
import { flooringConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 box" / "1 roll", a count
 * of 2 reads "2 boxes" / "2 rolls", in the result rows, the
 * shopping-list lines, and the worked line. The underlayment result
 * row already singularized (pre-existing ternary) and is pinned here
 * so it stays that way.
 *
 * Counts are hand-derived from the formula (boxes = area × (1 +
 * waste%) ÷ coverage per box, rounded up; rolls = area ÷ coverage
 * per roll, rounded up, with no waste on rolls): 18 ft² at 20 ft²
 * per box and 10% waste is 1 box and 1 roll at 100 ft² per roll;
 * 36 ft² is 2 boxes; 150 ft² is 2 rolls.
 */
describe("flooringConfig singular/plural boxes and rolls", () => {
  const areaMode = flooringConfig.modes.find((m) => m.id === "area");
  if (!areaMode) throw new Error("flooring area mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      area: 18,
      boxCoverage: 20,
      underlayment: 1,
      rollCoverage: 100,
      waste: 10,
      ...overrides,
    };
    const present = new Set(Object.keys(values));
    return areaMode!.compute(values, present);
  }

  function row(out: ReturnType<typeof compute>, label: string) {
    return out.rows.find((r) => r.label === label);
  }

  it("says '1 box' and '1 roll' for an 18 ft² floor", () => {
    const out = compute();
    expect(row(out, "Boxes needed")?.value).toBe("1 box");
    expect(row(out, "Underlayment rolls")?.value).toBe("1 roll");
    expect(out.lines).toContain("Flooring (20 ft² per box): 1 box");
    expect(out.lines).toContain("Underlayment (100 ft² per roll): 1 roll");
    expect(out.workedLine).toBe("18 ft² × 110% = 19.8 ft² ÷ 20 ft² per box = 1 box.");
  });

  it("says '2 boxes' for a 36 ft² floor", () => {
    const out = compute({ area: 36 });
    expect(row(out, "Boxes needed")?.value).toBe("2 boxes");
    expect(out.lines).toContain("Flooring (20 ft² per box): 2 boxes");
    expect(out.workedLine).toBe("36 ft² × 110% = 39.6 ft² ÷ 20 ft² per box = 2 boxes.");
    // Still 1 roll at 36 ft².
    expect(row(out, "Underlayment rolls")?.value).toBe("1 roll");
  });

  it("says '2 rolls' for a 150 ft² floor", () => {
    const out = compute({ area: 150 });
    expect(row(out, "Underlayment rolls")?.value).toBe("2 rolls");
    expect(out.lines).toContain("Underlayment (100 ft² per roll): 2 rolls");
  });
});
