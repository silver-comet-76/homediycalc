import { describe, expect, it } from "vitest";
import { concreteSlabConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep follow-up (Phase
 * 17B2 QA corrective round): a count of 1 reads "1 bag", a count of
 * 2 reads "2 bags", in the 80/60/40 lb bag rows.
 *
 * Counts are hand-derived from the formula (bag yields 0.6 / 0.45 /
 * 0.3 ft³ per 80 / 60 / 40 lb bag; bags = adjusted volume ÷ yield,
 * rounded up; adjusted volume = length × width × thickness × 110%,
 * no thickened edge): a 1 × 1 ft slab 2 in thick is 0.18 ft³
 * adjusted, so 1 bag of each size; a 2 × 2 ft slab 2 in thick is
 * 0.73 ft³ adjusted, so 2 × 80 lb, 2 × 60 lb, and 3 × 40 lb bags.
 */
describe("concreteSlabConfig singular/plural bags", () => {
  const slabMode = concreteSlabConfig.modes.find((m) => m.id === "slab");
  if (!slabMode) throw new Error("concrete-slab mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      length: 1,
      width: 1,
      thickness: 2 / 12,
      waste: 10,
      quarterYard: 0,
      meshArea: 160,
      ...overrides,
    };
    return slabMode!.compute(values, new Set(Object.keys(values)));
  }

  function bagRow(out: ReturnType<typeof compute>, label: string) {
    return out.rows.find((r) => r.label === label);
  }

  it("says '1 bag' for a 1 × 1 ft slab 2 in thick", () => {
    const out = compute();
    expect(bagRow(out, "80 lb bags")?.value).toBe("1 bag");
    expect(bagRow(out, "60 lb bags")?.value).toBe("1 bag");
    expect(bagRow(out, "40 lb bags")?.value).toBe("1 bag");
  });

  it("says '2 bags' (80/60 lb) and '3 bags' (40 lb) for a 2 × 2 ft slab 2 in thick", () => {
    const out = compute({ length: 2, width: 2 });
    expect(bagRow(out, "80 lb bags")?.value).toBe("2 bags");
    expect(bagRow(out, "60 lb bags")?.value).toBe("2 bags");
    expect(bagRow(out, "40 lb bags")?.value).toBe("3 bags");
  });
});
