import { describe, expect, it } from "vitest";
import { calculateFencePanel, calculateFencePicket } from "./fence";

const PICKET_BASE = {
  postSpacingFt: 8,
  fenceHeightFt: 6,
  picketWidthIn: 6,
  picketGapIn: 0,
  wastePct: 10,
  concreteBagsPerPost: 2,
};

const PANEL_BASE = {
  panelLengthFt: 6,
  gravelBoards: 1,
  postcreteBagsPerPost: 2,
};

describe("calculateFencePicket", () => {
  it("matches the worked example: 100 ft run, 8 ft spacing, 6 ft high, 6 in pickets, no gap", () => {
    // Sections 100 / 8 = 12.5 -> 13; posts 14; rails 13 x 3 = 39, +10% -> 42.9 -> 43;
    // pickets 100 / 0.5 = 200, +10% -> 220; concrete 14 x 2 = 28.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 100 });
    expect(r.sections).toBe(13);
    expect(r.posts).toBe(14);
    expect(r.railsPerSection).toBe(3);
    expect(r.rails).toBe(43);
    expect(r.pickets).toBe(220);
    expect(r.concreteBags).toBe(28);
  });

  it("matches the lookup-table rows (8 ft spacing, 6 ft high, 6 in pickets, no gap, 10% waste)", () => {
    const r50 = calculateFencePicket({ ...PICKET_BASE, netRunFt: 50 });
    expect([r50.posts, r50.rails, r50.pickets, r50.concreteBags]).toEqual([8, 24, 110, 16]);
    const r150 = calculateFencePicket({ ...PICKET_BASE, netRunFt: 150 });
    expect([r150.posts, r150.rails, r150.pickets, r150.concreteBags]).toEqual([20, 63, 330, 40]);
    const r200 = calculateFencePicket({ ...PICKET_BASE, netRunFt: 200 });
    expect([r200.posts, r200.rails, r200.pickets, r200.concreteBags]).toEqual([26, 83, 440, 52]);
    const r100_4ft = calculateFencePicket({ ...PICKET_BASE, netRunFt: 100, fenceHeightFt: 4 });
    expect([r100_4ft.posts, r100_4ft.rails, r100_4ft.pickets, r100_4ft.concreteBags]).toEqual([
      14, 29, 220, 28,
    ]);
  });

  it("sets rails per section by height: 2 up to 4 ft, 3 up to 6 ft, 4 above 6 ft", () => {
    const r = (h: number) =>
      calculateFencePicket({ ...PICKET_BASE, netRunFt: 100, fenceHeightFt: h });
    expect(r(3).railsPerSection).toBe(2);
    expect(r(4).railsPerSection).toBe(2);
    expect(r(4.5).railsPerSection).toBe(3);
    expect(r(6).railsPerSection).toBe(3);
    expect(r(6.5).railsPerSection).toBe(4);
    // The metric default of 1.83 m converts to 6.0039 ft — still a 6 ft fence (3 rails).
    expect(r(6.0039).railsPerSection).toBe(3);
  });

  it("deducts gates: 100 ft run minus a 10 ft gate", () => {
    // Net 90 ft: sections 90 / 8 = 11.25 -> 12; posts 13; rails 12 x 3 = 36 +10% -> 39.6 -> 40;
    // pickets 90 / 0.5 = 180 +10% -> 198; concrete 13 x 2 = 26.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 90 });
    expect([r.sections, r.posts, r.rails, r.pickets, r.concreteBags]).toEqual([
      12, 13, 40, 198, 26,
    ]);
  });

  it("returns zeros for a zero run", () => {
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 0 });
    expect([r.sections, r.posts, r.rails, r.pickets, r.concreteBags]).toEqual([0, 0, 0, 0, 0]);
  });

  it("prices the priced parts only", () => {
    const r = calculateFencePicket({
      ...PICKET_BASE,
      netRunFt: 100,
      pricePerPost: 10,
      pricePerPicket: 2,
      pricePerRail: 5,
    });
    // 14 x 10 + 220 x 2 + 43 x 5 = 140 + 440 + 215 = 795.
    expect(r.costUsd).toBe(795);
    const unpriced = calculateFencePicket({ ...PICKET_BASE, netRunFt: 100 });
    expect(unpriced.costUsd).toBeUndefined();
  });
});

describe("calculateFencePanel", () => {
  it("matches the worked example: 100 ft run, 6 ft panels, gravel boards", () => {
    // Panels 100 / 6 = 16.67 -> 17; posts 18; boards 17; Postcrete 18 x 2 = 36;
    // last panel cut to 100 - 16 x 6 = 4 ft.
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 100 });
    expect(r.panels).toBe(17);
    expect(r.posts).toBe(18);
    expect(r.gravelBoardsCount).toBe(17);
    expect(r.postcreteBags).toBe(36);
    expect(r.cutLengthFt).toBeCloseTo(4, 2);
    expect(r.lastPanelCut).toBe(true);
  });

  it("does not flag an exact fit as cut, and drops boards when not selected", () => {
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 96 });
    expect(r.panels).toBe(16);
    expect(r.posts).toBe(17);
    expect(r.cutLengthFt).toBeCloseTo(6, 2);
    expect(r.lastPanelCut).toBe(false);
    const noBoards = calculateFencePanel({ ...PANEL_BASE, netRunFt: 100, gravelBoards: 0 });
    expect(noBoards.gravelBoardsCount).toBe(0);
    expect(noBoards.panels).toBe(17);
  });

  it("returns zeros for a zero run", () => {
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 0 });
    expect([r.panels, r.posts, r.gravelBoardsCount, r.postcreteBags]).toEqual([0, 0, 0, 0]);
    expect(r.lastPanelCut).toBe(false);
  });

  it("prices the priced parts only", () => {
    const r = calculateFencePanel({
      ...PANEL_BASE,
      netRunFt: 100,
      pricePerPanel: 50,
      pricePerPost: 20,
      pricePerPostcreteBag: 6,
    });
    // 17 x 50 + 18 x 20 + 36 x 6 = 850 + 360 + 216 = 1426.
    expect(r.costUsd).toBe(1426);
    const unpriced = calculateFencePanel({ ...PANEL_BASE, netRunFt: 100 });
    expect(unpriced.costUsd).toBeUndefined();
  });
});
