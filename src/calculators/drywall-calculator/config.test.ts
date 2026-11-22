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
