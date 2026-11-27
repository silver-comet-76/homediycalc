import { describe, expect, it } from "vitest";
import { validateField } from "../../lib/validation";
import { waterproofingConfig } from "./config";

/**
 * Config-level tests for WTP-1: two coats is a requirement, not a
 * choice — a 1-coat entry must be rejected with an inline error and
 * no result. The shared island validates each field against its
 * min, so the rejection is enforced by the coats field's minimum.
 */
describe("waterproofingConfig coats minimum (WTP-1)", () => {
  it("sets the coats field minimum to 2 in every liquid mode", () => {
    const liquidModes = waterproofingConfig.modes.filter((m) => m.id.startsWith("liquid"));
    expect(liquidModes.length).toBeGreaterThan(0);
    for (const mode of liquidModes) {
      const coats = mode.fields.find((f) => f.id === "coats");
      expect(coats).toBeDefined();
      expect(coats?.min).toBe(2);
      expect(coats?.defaultImp).toBe("2");
    }
  });

  it("rejects a 1-coat entry under the field's validation rule", () => {
    const rejected = validateField("1", {
      label: "Coats",
      min: 2,
      integer: true,
    });
    expect(rejected.error).toBe("Coats must be at least 2.");
    const accepted = validateField("2", {
      label: "Coats",
      min: 2,
      integer: true,
    });
    expect(accepted.error).toBeUndefined();
    expect(accepted.value).toBe(2);
  });
});

/**
 * Config-level tests for the singular/plural sweep follow-up (Phase
 * 17B2 QA corrective round): a count of 1 reads "1 container" /
 * "1 roll", a count of 2 reads "2 containers" / "2 rolls", in the
 * result row, the shopping-list line, and the worked line.
 *
 * Counts are hand-derived: liquid 5 × 8 ft room at 2 coats,
 * 110 ft²/gal, 10% waste, 1 gal containers → 40 × 2 ÷ 110 × 110% =
 * 0.8 gal → 1 container; 10 × 10 ft → 2.0 gal → 2 containers.
 * Sheet 90 ft² at 108 ft²/roll, 10% waste → 99 ÷ 108 → 1 roll;
 * 100 ft² → 110 ÷ 108 → 2 rolls.
 */
describe("waterproofingConfig singular/plural containers and rolls", () => {
  const liquidMode = waterproofingConfig.modes.find((m) => m.id === "liquid-dimensions");
  const sheetMode = waterproofingConfig.modes.find((m) => m.id === "sheet");
  if (!liquidMode) throw new Error("liquid-dimensions mode missing");
  if (!sheetMode) throw new Error("sheet mode missing");

  function liquid(overrides: Record<string, number> = {}) {
    const values = {
      length: 5,
      width: 8,
      coats: 2,
      coverage: 110,
      containerGal: 1,
      waste: 10,
      ...overrides,
    };
    return liquidMode!.compute(values, new Set(Object.keys(values)));
  }

  function sheet(overrides: Record<string, number> = {}) {
    const values = { area: 90, rollCoverage: 108, waste: 10, ...overrides };
    return sheetMode!.compute(values, new Set(Object.keys(values)));
  }

  it("says '1 container' for a 5 × 8 ft room", () => {
    const out = liquid();
    expect(out.rows.find((r) => r.label === "Containers to buy")?.value).toBe("1 container");
    expect(out.workedLine).toBe("40 ft² × 2 coats ÷ 110 ft²/gal × 110% = 0.8 gal → 1 container.");
  });

  it("says '2 containers' for a 10 × 10 ft room", () => {
    const out = liquid({ length: 10, width: 10 });
    expect(out.rows.find((r) => r.label === "Containers to buy")?.value).toBe("2 containers");
    expect(out.workedLine).toBe("100 ft² × 2 coats ÷ 110 ft²/gal × 110% = 2 gal → 2 containers.");
  });

  it("says '1 roll' for a 90 ft² sheet job", () => {
    const out = sheet();
    expect(out.rows.find((r) => r.label === "Rolls to buy")?.value).toBe("1 roll");
    expect(out.lines).toContain("Sheet waterproofing membrane: 1 roll (108 ft² per roll)");
    expect(out.workedLine).toBe("90 ft² × 110% ÷ 108 ft²/roll = 1 roll.");
  });

  it("says '2 rolls' for a 100 ft² sheet job", () => {
    const out = sheet({ area: 100 });
    expect(out.rows.find((r) => r.label === "Rolls to buy")?.value).toBe("2 rolls");
    expect(out.lines).toContain("Sheet waterproofing membrane: 2 rolls (108 ft² per roll)");
    expect(out.workedLine).toBe("100 ft² × 110% ÷ 108 ft²/roll = 2 rolls.");
  });
});
