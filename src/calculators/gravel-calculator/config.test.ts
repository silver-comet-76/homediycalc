import { describe, expect, it } from "vitest";
import { gravelConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 bag", a count of 2 reads
 * "2 bags", in the Bags result row. The shopping-list line is
 * number-only after its label and stays that way.
 *
 * Counts are hand-derived from the formula (bags = weight ÷ bag
 * weight, rounded up; weight = adjusted volume × 2,800 lb/yd³):
 * 1 × 1 ft at 3 in deep with 5% waste weighs 27.22 lb, so 1 bag at
 * 50 lb per bag; at 6 in deep it weighs 54.44 lb, so 2 bags. Depth
 * is passed in canonical feet (3 in = 0.25 ft).
 */
describe("gravelConfig singular/plural bags", () => {
  const areaMode = gravelConfig.modes.find((m) => m.id === "area");
  if (!areaMode) throw new Error("gravel area mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      length: 1,
      width: 1,
      depth: 0.25,
      waste: 5,
      density: 2800,
      bagWeight: 50,
      ...overrides,
    };
    const present = new Set(Object.keys(values));
    return areaMode!.compute(values, present);
  }

  function bagRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Bags");
  }

  it("says '1 bag' for a 1 × 1 ft bed, 3 in deep, at 50 lb per bag", () => {
    const out = compute();
    expect(bagRow(out)?.value).toBe("1 bag");
    expect(out.lines).toContain("Gravel bags (50 lb): 1");
  });

  it("says '2 bags' for the same bed at 6 in deep", () => {
    const out = compute({ depth: 0.5 });
    expect(bagRow(out)?.value).toBe("2 bags");
    expect(out.lines).toContain("Gravel bags (50 lb): 2");
  });

  it("shows no bag row when no bag weight is entered", () => {
    const values = { length: 1, width: 1, depth: 0.25, waste: 5, density: 2800 };
    const out = areaMode!.compute(values, new Set(Object.keys(values)));
    expect(bagRow(out)).toBeUndefined();
  });
});
