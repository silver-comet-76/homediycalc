import { describe, expect, it } from "vitest";
import { calculateDrywall, DOOR_AREA_FT2, WINDOW_AREA_FT2 } from "./drywall";

const BASE = {
  sheetAreaFt2: 32,
  wastePct: 10,
  compoundCoverageFt2PerGal: 100,
  pailSizeGal: 4.5,
  tapeFtPer1000Ft2: 370,
  tapeRollFt: 250,
  screwsPerSheetWall: 28,
  screwsPerSheetCeiling: 35,
  screwsPerLb: 250,
};

describe("calculateDrywall", () => {
  it("matches the FORMULAS.md worked example: 12 × 12 ft room, 8 ft walls, 1 door, 2 windows, ceiling included", () => {
    // Wall area: perimeter 48 ft × 8 ft = 384 ft², less 1 door (20 ft²)
    // and 2 windows (15 ft² each) = 334 ft². Ceiling: 12 × 12 = 144 ft².
    expect(DOOR_AREA_FT2).toBe(20);
    expect(WINDOW_AREA_FT2).toBe(15);
    const r = calculateDrywall({ ...BASE, wallAreaFt2: 334, ceilingAreaFt2: 144 });
    expect(r.totalAreaFt2).toBe(478);
    expect(r.wallSheets).toBe(11);
    expect(r.ceilingSheets).toBe(5);
    expect(r.sheetsHung).toBe(16);
    expect(r.sheetsToBuy).toBe(17);
    expect(r.compoundGal).toBeCloseTo(4.78, 2);
    expect(r.pails).toBe(2);
    expect(r.tapeFt).toBeCloseTo(176.86, 2);
    expect(r.tapeRolls).toBe(1);
    expect(r.screws).toBe(483);
    expect(r.screwLb).toBeCloseTo(1.93, 2);
  });

  it("rounds sheets up, never down", () => {
    const r = calculateDrywall({ ...BASE, wallAreaFt2: 33, ceilingAreaFt2: 0 });
    // 33 ft² is just over one 4 × 8 sheet; 10% waste makes it 36.3 ft².
    expect(r.wallSheets).toBe(2);
    expect(r.sheetsToBuy).toBe(2);
    expect(r.screws).toBe(56);
  });

  it("sizes 4 × 10 and 4 × 12 sheets from the sheet area", () => {
    const r = calculateDrywall({
      ...BASE,
      wallAreaFt2: 480,
      ceilingAreaFt2: 0,
      sheetAreaFt2: 48,
      wastePct: 0,
    });
    expect(r.sheetsToBuy).toBe(10);
    expect(r.wallSheets).toBe(10);
  });

  it("prices sheets and pails only when prices are entered", () => {
    const r = calculateDrywall({
      ...BASE,
      wallAreaFt2: 334,
      ceilingAreaFt2: 144,
      pricePerSheet: 15,
      pricePerPail: 20,
    });
    expect(r.costUsd).toBe(17 * 15 + 2 * 20);
    const unpriced = calculateDrywall({ ...BASE, wallAreaFt2: 334, ceilingAreaFt2: 144 });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculateDrywall({ ...BASE, wallAreaFt2: 0, ceilingAreaFt2: 0 });
    expect(r.sheetsToBuy).toBe(0);
    expect(r.pails).toBe(0);
    expect(r.tapeRolls).toBe(0);
    expect(r.screws).toBe(0);
  });
});
