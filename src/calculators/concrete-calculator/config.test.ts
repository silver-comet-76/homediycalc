import { describe, expect, it } from "vitest";
import { concreteConfig } from "./config";
import { validateField } from "../../lib/validation";

/**
 * The Concrete Calculator's length, width, and depth fields carry no
 * explicit `min`, so the shared validation in GenericCalculator applies
 * its default minimum of 0 exclusively — a zero dimension is rejected
 * with "must be greater than 0" instead of producing a zero result.
 * This test pins that behavior at the config level, mirroring the rule
 * GenericCalculator builds for each field.
 */
describe("concreteConfig zero-input rejection", () => {
  it("rejects zero length, width, and depth", () => {
    const mode = concreteConfig.modes.find((m) => m.id === "pour");
    expect(mode).toBeDefined();
    for (const id of ["length", "width", "depth"]) {
      const field = mode?.fields.find((f) => f.id === id);
      expect(field).toBeDefined();
      expect(field?.min).toBeUndefined();
      const result = validateField("0", {
        label: field?.label ?? id,
        min: field?.min ?? 0,
        exclusiveMin:
          field?.min === undefined &&
          !(field?.kind === "percent" || field?.kind === "price" || field?.kind === "select"),
      });
      expect(result.error).toBe(`${field?.label} must be greater than 0.`);
    }
  });

  it("still accepts positive dimensions", () => {
    const mode = concreteConfig.modes.find((m) => m.id === "pour");
    const field = mode?.fields.find((f) => f.id === "length");
    const result = validateField("10", {
      label: field?.label ?? "Length",
      min: field?.min ?? 0,
      exclusiveMin: field?.min === undefined,
    });
    expect(result.error).toBeUndefined();
    expect(result.value).toBe(10);
  });
});

/**
 * Config-level tests for the singular/plural sweep follow-up (Phase
 * 17B2 QA corrective round): a count of 1 reads "1 bag", a count of
 * 2 reads "2 bags", in the 80/60/40 lb bag rows.
 *
 * Counts are hand-derived from the formula (bag yields 0.6 / 0.45 /
 * 0.3 ft³ per 80 / 60 / 40 lb bag; bags = adjusted volume ÷ yield,
 * rounded up; adjusted volume = length × width × depth × 110%):
 * a 1 × 1 ft pour 2 in deep is 0.18 ft³ adjusted, so 1 bag of each
 * size; a 2 × 2 ft pour 2 in deep is 0.73 ft³ adjusted, so 2 × 80 lb,
 * 2 × 60 lb, and 3 × 40 lb bags.
 */
describe("concreteConfig singular/plural bags", () => {
  const pourMode = concreteConfig.modes.find((m) => m.id === "pour");
  if (!pourMode) throw new Error("concrete pour mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      length: 1,
      width: 1,
      depth: 2 / 12,
      waste: 10,
      quarterYard: 0,
      ...overrides,
    };
    return pourMode!.compute(values, new Set(Object.keys(values)));
  }

  function bagRow(out: ReturnType<typeof compute>, label: string) {
    return out.rows.find((r) => r.label === label);
  }

  it("says '1 bag' for a 1 × 1 ft pour 2 in deep", () => {
    const out = compute();
    expect(bagRow(out, "80 lb bags")?.value).toBe("1 bag");
    expect(bagRow(out, "60 lb bags")?.value).toBe("1 bag");
    expect(bagRow(out, "40 lb bags")?.value).toBe("1 bag");
  });

  it("says '2 bags' (80/60 lb) and '3 bags' (40 lb) for a 2 × 2 ft pour 2 in deep", () => {
    const out = compute({ length: 2, width: 2 });
    expect(bagRow(out, "80 lb bags")?.value).toBe("2 bags");
    expect(bagRow(out, "60 lb bags")?.value).toBe("2 bags");
    expect(bagRow(out, "40 lb bags")?.value).toBe("3 bags");
  });
});
