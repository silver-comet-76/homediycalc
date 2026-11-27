import { describe, expect, it } from "vitest";
import { drywallConfig } from "./config";

/**
 * Config-level tests for DRY-1: the screw defaults must follow the
 * sheet size. The room-mode defaults are a 12 × 12 ft room, 8 ft
 * walls, 1 door, 2 windows, ceiling included (334 ft² walls +
 * 144 ft² ceiling), with the screws-per-sheet fields left blank so
 * the size-derived rates apply.
 */
describe("drywallConfig screw defaults (DRY-1)", () => {
  const roomMode = drywallConfig.modes.find((m) => m.id === "room");
  if (!roomMode) throw new Error("drywall room mode missing");

  function computeWithSheetSize(sheetSize: number) {
    const values = {
      length: 12,
      width: 12,
      height: 8,
      doors: 1,
      windows: 2,
      ceiling: 1,
      sheetSize,
      waste: 10,
      compoundCoverage: 100,
      pailSize: 4.5,
    };
    const present = new Set(Object.keys(values));
    const out = roomMode?.compute(values, present);
    const row = out?.rows.find((r) => r.label === "Drywall screws");
    return row?.value;
  }

  it("shows 430 screws for the worked-example room in 4 × 12 sheets", () => {
    // 7 wall sheets × 40 + 3 ceiling sheets × 50 = 430.
    expect(computeWithSheetSize(48)).toBe("430 screws");
  });

  it("shows 448 screws for the worked-example room in 4 × 10 sheets", () => {
    // 9 wall sheets × 32 + 4 ceiling sheets × 40 = 448.
    expect(computeWithSheetSize(40)).toBe("448 screws");
  });

  it("shows 483 screws for the worked-example room in 4 × 8 sheets", () => {
    // 11 wall sheets × 28 + 5 ceiling sheets × 35 = 483.
    expect(computeWithSheetSize(32)).toBe("483 screws");
  });

  it("leaves the screw fields blank by default so the size-derived rates apply", () => {
    for (const mode of drywallConfig.modes) {
      for (const id of ["screwsWall", "screwsCeiling"]) {
        const field = mode.fields.find((f) => f.id === id);
        expect(field?.optional).toBe(true);
        expect(field?.defaultImp).toBe("");
      }
    }
  });
});

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 sheet" / "1 pail" /
 * "1 roll", a count of 2 reads "2 sheets" / "2 pails" / "2 rolls",
 * in the result rows, their details, and the worked line.
 *
 * Counts are hand-derived from the formula (4 × 8 ft sheets =
 * 32 ft²; sheets to buy = area × 1.10 ÷ 32, rounded up; sheets hung
 * = area ÷ 32, rounded up; pails = (area ÷ 100) ÷ 4.5, rounded up;
 * tape rolls = (area × 0.37) ÷ 250, rounded up): 29 ft² is 1 sheet
 * (hung and to buy), 1 pail, and 1 roll; 58 ft² is 2 sheets;
 * 500 ft² is 2 pails; 700 ft² is 2 tape rolls.
 */
describe("drywallConfig singular/plural sheets, pails, and rolls", () => {
  const areaMode = drywallConfig.modes.find((m) => m.id === "area");
  if (!areaMode) throw new Error("drywall area mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      area: 29,
      sheetSize: 32,
      waste: 10,
      compoundCoverage: 100,
      pailSize: 4.5,
      ...overrides,
    };
    const present = new Set(Object.keys(values));
    return areaMode!.compute(values, present);
  }

  function row(out: ReturnType<typeof compute>, label: string) {
    return out.rows.find((r) => r.label === label);
  }

  it("says '1 sheet', '1 pail', and '1 roll' for 29 ft²", () => {
    const out = compute();
    expect(row(out, "Drywall sheets")?.value).toBe("1 sheet");
    expect(row(out, "Drywall sheets")?.detail).toBe("1 sheet hung + 10% waste — 32 ft² per sheet");
    expect(row(out, "Joint compound")?.detail).toBe("1 × 4.5 gal pail — about 100 ft² per gallon");
    expect(row(out, "Paper tape")?.detail).toBe("1 × 250 ft roll — about 370 ft per 1,000 ft²");
    expect(out.workedLine).toBe(
      "29 ft² × 110% ÷ 32 ft² per sheet = 1 sheet; compound 29 ÷ 100 = 0.29 gal → 1 pail.",
    );
    expect(out.lines).toContain("Drywall sheets (32 ft² each): 1");
  });

  it("says '2 sheets' for 58 ft², with the pail still singular in the same line", () => {
    const out = compute({ area: 58 });
    expect(row(out, "Drywall sheets")?.value).toBe("2 sheets");
    expect(row(out, "Drywall sheets")?.detail).toBe("2 sheets hung + 10% waste — 32 ft² per sheet");
    expect(out.workedLine).toBe(
      "58 ft² × 110% ÷ 32 ft² per sheet = 2 sheets; compound 58 ÷ 100 = 0.58 gal → 1 pail.",
    );
  });

  it("says '2 pails' for 500 ft²", () => {
    const out = compute({ area: 500 });
    expect(row(out, "Joint compound")?.detail).toBe("2 × 4.5 gal pails — about 100 ft² per gallon");
    expect(out.workedLine).toBe(
      "500 ft² × 110% ÷ 32 ft² per sheet = 18 sheets; compound 500 ÷ 100 = 5 gal → 2 pails.",
    );
  });

  it("says '2 rolls' of tape for 700 ft²", () => {
    const out = compute({ area: 700 });
    expect(row(out, "Paper tape")?.detail).toBe("2 × 250 ft rolls — about 370 ft per 1,000 ft²");
  });
});
