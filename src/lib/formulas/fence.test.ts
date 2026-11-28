import { describe, expect, it } from "vitest";
import { calculateFencePanel, calculateFencePicket, normalizeSegments } from "./fence";
import { convertLength } from "../units";

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

describe("normalizeSegments", () => {
  it("clamps missing, zero, negative, fractional, and non-finite counts to a whole run count", () => {
    expect(normalizeSegments(undefined)).toBe(1);
    expect(normalizeSegments(0)).toBe(1);
    expect(normalizeSegments(-2)).toBe(1);
    expect(normalizeSegments(2.7)).toBe(2);
    expect(normalizeSegments(NaN)).toBe(1);
    expect(normalizeSegments(Infinity)).toBe(1);
    expect(normalizeSegments(3)).toBe(3);
  });
});

describe("calculateFencePicket", () => {
  it("matches the worked example: 100 ft run, 8 ft spacing, 6 ft high, 6 in pickets, no gap", () => {
    // Sections 100 / 8 = 12.5 -> 13; posts 14; rails 13 x 3 = 39, +10% -> 42.9 -> 43;
    // pickets 100 / 0.5 = 200, +10% -> 220; concrete 14 x 2 = 28. One run, so no gate posts.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 100 });
    expect(r.segments).toBe(1);
    expect(r.segmentLengthFt).toBe(100);
    expect(r.sectionsPerRun).toBe(13);
    expect(r.sections).toBe(13);
    expect(r.posts).toBe(14);
    expect(r.gatePosts).toBe(0);
    expect(r.linePosts).toBe(14);
    expect(r.railsPerSection).toBe(3);
    expect(r.rails).toBe(43);
    expect(r.pickets).toBe(220);
    expect(r.concreteBags).toBe(28);
    expect(r.costPartial).toBe(false);
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

  it("gate at the end of the run: 100 ft run minus a 10 ft gate, one continuous run", () => {
    // CHANGED (QA corrective round, Workstream A): the old assertion
    // treated a 10 ft gate deduction as one continuous 90 ft run
    // without saying where the gate was. The numbers are unchanged,
    // but the case is now explicitly the end-gate case (segments = 1):
    // net 90 ft: sections 90 / 8 = 11.25 -> 12; posts 13; rails
    // 12 x 3 = 36 +10% -> 39.6 -> 40; pickets 90 / 0.5 = 180 +10% -> 198;
    // concrete 13 x 2 = 26.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 90, segments: 1 });
    expect([
      r.segments,
      r.sections,
      r.posts,
      r.gatePosts,
      r.rails,
      r.pickets,
      r.concreteBags,
    ]).toEqual([1, 12, 13, 0, 40, 198, 26]);
  });

  it("QA example — central gate: 20 ft run, 4 ft gate in the middle, 8 ft spacing", () => {
    // Net 16 ft in two equal 8 ft runs. Per run: 8 / 8 = 1 section,
    // 2 posts. Total: 2 sections, 4 posts (2 gate posts flanking the
    // gate, 2 line posts). One continuous 16 ft run would count only
    // 3 posts — the old defect. Rails 2 x 3 = 6, +10% -> 6.6 -> 7;
    // pickets 16 / 0.5 = 32, +10% -> 35.2 -> 36; concrete 4 x 2 = 8.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 16, segments: 2 });
    expect(r.segmentLengthFt).toBe(8);
    expect(r.sectionsPerRun).toBe(1);
    expect([r.sections, r.posts, r.gatePosts, r.linePosts]).toEqual([2, 4, 2, 2]);
    expect([r.rails, r.pickets, r.concreteBags]).toEqual([7, 36, 8]);
    const continuous = calculateFencePicket({ ...PICKET_BASE, netRunFt: 16, segments: 1 });
    expect(continuous.posts).toBe(3);
  });

  it("end gate with existing support needs no extra posts: same 20 ft run, 4 ft gate at the end", () => {
    // CHANGED (QA-17B2-R01): the old test asserted that an end gate
    // needs no extra posts at all. That is only true when the gate
    // hangs from an existing support. Net 16 ft, one run: sections
    // 16 / 8 = 2, posts 3, no gate posts, concrete 3 x 2 = 6.
    const r = calculateFencePicket({
      ...PICKET_BASE,
      netRunFt: 16,
      segments: 1,
      endGate: true,
      endGateExistingSupport: true,
    });
    expect([r.sections, r.posts, r.gatePosts, r.linePosts]).toEqual([2, 3, 0, 3]);
    expect(r.endGateSupportPosts).toBe(0);
    expect(r.concreteBags).toBe(6);
  });

  it("QA-17B2-R01 — freestanding end gate: 20 ft run, 4 ft gate at the end, 8 ft spacing", () => {
    // Net 16 ft, one run: sections 16 / 8 = 2, fence posts 3. A
    // freestanding end gate needs one extra opposing support post,
    // so posts 4, gate posts 1, line posts 3. Rails 2 x 3 = 6, +10%
    // -> 6.6 -> 7; pickets 16 / 0.5 = 32, +10% -> 35.2 -> 36;
    // concrete 4 x 2 = 8.
    const r = calculateFencePicket({
      ...PICKET_BASE,
      netRunFt: 16,
      segments: 1,
      endGate: true,
    });
    expect([r.sections, r.posts, r.gatePosts, r.linePosts]).toEqual([2, 4, 1, 3]);
    expect(r.endGateSupportPosts).toBe(1);
    expect([r.rails, r.pickets, r.concreteBags]).toEqual([7, 36, 8]);
    // The support post is priced like any other post: $10 per post
    // gives 4 x 10 = $40, a priced-materials subtotal (pickets and
    // rails unpriced).
    const priced = calculateFencePicket({
      ...PICKET_BASE,
      netRunFt: 16,
      segments: 1,
      endGate: true,
      pricePerPost: 10,
    });
    expect(priced.costUsd).toBe(40);
    expect(priced.costPartial).toBe(true);
  });

  it("middle gate ignores the end-gate option: segments 2 with endGate true is the centered-gate result", () => {
    // Net 16 ft in two 8 ft runs: 2 sections, 4 posts (2 gate, 2
    // line) — the same as the centered-gate case above. The end-gate
    // support post is not added on top: middle gates already count
    // two flanking posts per gate opening.
    const r = calculateFencePicket({
      ...PICKET_BASE,
      netRunFt: 16,
      segments: 2,
      endGate: true,
    });
    expect([r.sections, r.posts, r.gatePosts, r.linePosts]).toEqual([2, 4, 2, 2]);
    expect(r.endGateSupportPosts).toBe(0);
  });

  it("off-center gate: calculate each actual segment separately instead of relying on the equal-length estimate", () => {
    // A 16 ft net run split 5 ft + 11 ft by an off-center gate, at
    // 8 ft spacing. Run 1 (5 ft): ceil(5 / 8) = 1 section, 2 posts.
    // Run 2 (11 ft): ceil(11 / 8) = 2 sections, 3 posts. Total
    // 5 posts — one more than the equal-length estimate (two 8 ft
    // runs, 4 posts), which undercounts here. This two-call pattern
    // is how users should calculate unequal segments.
    const run1 = calculateFencePicket({ ...PICKET_BASE, netRunFt: 5, segments: 1 });
    const run2 = calculateFencePicket({ ...PICKET_BASE, netRunFt: 11, segments: 1 });
    expect([run1.sectionsPerRun, run1.posts]).toEqual([1, 2]);
    expect([run2.sectionsPerRun, run2.posts]).toEqual([2, 3]);
    expect(run1.posts + run2.posts).toBe(5);
    const equalLength = calculateFencePicket({ ...PICKET_BASE, netRunFt: 16, segments: 2 });
    expect(equalLength.posts).toBe(4);
  });

  it("multiple gates: 30 ft run, two 3 ft gates, three runs", () => {
    // Net 24 ft in three equal 8 ft runs. Per run: 8 / 8 = 1 section,
    // 2 posts. Total: 3 sections, 6 posts (4 gate posts at the two
    // gate openings, 2 line posts). Rails 3 x 3 = 9, +10% -> 9.9 -> 10;
    // pickets 24 / 0.5 = 48, +10% -> 52.8 -> 53; concrete 6 x 2 = 12.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 24, segments: 3 });
    expect(r.segmentLengthFt).toBe(8);
    expect([r.sections, r.posts, r.gatePosts, r.linePosts]).toEqual([3, 6, 4, 2]);
    expect([r.rails, r.pickets, r.concreteBags]).toEqual([10, 53, 12]);
  });

  it("three separate runs: 40 ft of fence in four runs", () => {
    // Net 40 ft in four equal 10 ft runs. Per run: 10 / 8 = 1.25 -> 2
    // sections, 3 posts. Total: 8 sections, 12 posts (6 gate posts,
    // 6 line posts). Rails 8 x 3 = 24, +10% -> 26.4 -> 27; pickets
    // 40 / 0.5 = 80, +10% -> 88; concrete 12 x 2 = 24.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 40, segments: 4 });
    expect(r.segmentLengthFt).toBe(10);
    expect(r.sectionsPerRun).toBe(2);
    expect([r.sections, r.posts, r.gatePosts, r.linePosts]).toEqual([8, 12, 6, 6]);
    expect([r.rails, r.pickets, r.concreteBags]).toEqual([27, 88, 24]);
  });

  it("segment boundary: 17 ft net in two runs is 2 sections per run, not 1", () => {
    // Each run is 8.5 ft: 8.5 / 8 = 1.0625 -> 2 sections, 3 posts per
    // run. Total: 4 sections, 6 posts (2 gate, 4 line). Rails
    // 4 x 3 = 12, +10% -> 13.2 -> 14; pickets 17 / 0.5 = 34, +10% ->
    // 37.4 -> 38; concrete 6 x 2 = 12.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 17, segments: 2 });
    expect(r.segmentLengthFt).toBe(8.5);
    expect(r.sectionsPerRun).toBe(2);
    expect([r.sections, r.posts, r.gatePosts, r.linePosts]).toEqual([4, 6, 2, 4]);
    expect([r.rails, r.pickets, r.concreteBags]).toEqual([14, 38, 12]);
  });

  it("fractional dimensions: 16.5 ft net in two runs", () => {
    // Each run 8.25 ft: 8.25 / 8 = 1.03125 -> 2 sections, 3 posts per
    // run. Total: 4 sections, 6 posts. Rails 4 x 3 = 12, +10% -> 14;
    // pickets 16.5 / 0.5 = 33, +10% -> 36.3 -> 37; concrete 12.
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 16.5, segments: 2 });
    expect(r.segmentLengthFt).toBeCloseTo(8.25, 10);
    expect([r.sections, r.posts, r.rails, r.pickets, r.concreteBags]).toEqual([4, 6, 14, 37, 12]);
  });

  it("metric/imperial equivalence: 6.096 m run with a 1.2192 m gate matches the 20 ft / 4 ft case", () => {
    // 6.096 m = 20 ft, 1.2192 m = 4 ft (via the unit engine), so the
    // net run is 16 ft in two 8 ft runs: 4 posts, 2 of them gate posts.
    const netRunFt = convertLength(6.096, "m", "ft") - convertLength(1.2192, "m", "ft");
    expect(netRunFt).toBeCloseTo(16, 9);
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt, segments: 2 });
    expect([r.posts, r.gatePosts, r.linePosts, r.rails, r.pickets]).toEqual([4, 2, 2, 7, 36]);
  });

  it("large input: 1,000 ft run, one run and ten runs", () => {
    // One run: sections 1000 / 8 = 125, posts 126; rails 125 x 3 = 375,
    // +10% -> 412.5 -> 413; pickets 1000 / 0.5 = 2000, +10% -> 2200;
    // concrete 126 x 2 = 252.
    const one = calculateFencePicket({ ...PICKET_BASE, netRunFt: 1000, segments: 1 });
    expect([one.sections, one.posts, one.rails, one.pickets, one.concreteBags]).toEqual([
      125, 126, 413, 2200, 252,
    ]);
    // Ten 100 ft runs: per run 100 / 8 = 12.5 -> 13 sections, 14 posts.
    // Total: 130 sections, 140 posts (18 gate, 122 line); rails
    // 130 x 3 = 390, +10% -> 429; pickets 2200; concrete 140 x 2 = 280.
    const ten = calculateFencePicket({ ...PICKET_BASE, netRunFt: 1000, segments: 10 });
    expect([ten.sections, ten.posts, ten.gatePosts, ten.linePosts]).toEqual([130, 140, 18, 122]);
    expect([ten.rails, ten.pickets, ten.concreteBags]).toEqual([429, 2200, 280]);
  });

  it("returns zeros for a zero or negative run, and clamps an invalid segment count to 1", () => {
    const r = calculateFencePicket({ ...PICKET_BASE, netRunFt: 0 });
    expect([r.sections, r.posts, r.rails, r.pickets, r.concreteBags]).toEqual([0, 0, 0, 0, 0]);
    expect(r.gatePosts).toBe(0);
    expect(r.costPartial).toBe(false);
    const gatedZero = calculateFencePicket({ ...PICKET_BASE, netRunFt: 0, segments: 2 });
    expect([gatedZero.posts, gatedZero.gatePosts]).toEqual([0, 0]);
    expect(gatedZero.segments).toBe(2);
    // A freestanding end gate on a zero run still counts no support post.
    const endGateZero = calculateFencePicket({
      ...PICKET_BASE,
      netRunFt: 0,
      segments: 1,
      endGate: true,
    });
    expect(endGateZero.endGateSupportPosts).toBe(0);
    const negative = calculateFencePicket({ ...PICKET_BASE, netRunFt: -5, segments: 2 });
    expect([negative.sections, negative.posts, negative.rails, negative.pickets]).toEqual([
      0, 0, 0, 0,
    ]);
    // segments 0 clamps to 1: 16 ft in one run is 2 sections, 3 posts.
    const clamped = calculateFencePicket({ ...PICKET_BASE, netRunFt: 16, segments: 0 });
    expect([clamped.segments, clamped.posts]).toEqual([1, 3]);
    // segments 2.7 floors to 2: 16 ft in two 8 ft runs is 4 posts.
    const floored = calculateFencePicket({ ...PICKET_BASE, netRunFt: 16, segments: 2.7 });
    expect([floored.segments, floored.posts]).toEqual([2, 4]);
  });

  it("prices the priced parts only, and flags a partial cost when a price is missing", () => {
    const r = calculateFencePicket({
      ...PICKET_BASE,
      netRunFt: 100,
      pricePerPost: 10,
      pricePerPicket: 2,
      pricePerRail: 5,
    });
    // 14 x 10 + 220 x 2 + 43 x 5 = 140 + 440 + 215 = 795. Every priced
    // part has a price, so this is not flagged partial.
    expect(r.costUsd).toBe(795);
    expect(r.costPartial).toBe(false);
    // Only the post price entered: 14 x 10 = 140, and the pickets and
    // rails are unpriced, so the cost is a priced-materials subtotal.
    const partial = calculateFencePicket({ ...PICKET_BASE, netRunFt: 100, pricePerPost: 10 });
    expect(partial.costUsd).toBe(140);
    expect(partial.costPartial).toBe(true);
    const unpriced = calculateFencePicket({ ...PICKET_BASE, netRunFt: 100 });
    expect(unpriced.costUsd).toBeUndefined();
    expect(unpriced.costPartial).toBe(false);
  });
});

describe("calculateFencePanel", () => {
  it("matches the worked example: 100 ft run, 6 ft panels, gravel boards", () => {
    // Panels 100 / 6 = 16.67 -> 17; posts 18; boards 17; Postcrete 18 x 2 = 36;
    // last panel cut to 100 - 16 x 6 = 4 ft. One run, so no gate posts.
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 100 });
    expect(r.segments).toBe(1);
    expect(r.panelsPerRun).toBe(17);
    expect(r.panels).toBe(17);
    expect(r.posts).toBe(18);
    expect(r.gatePosts).toBe(0);
    expect(r.linePosts).toBe(18);
    expect(r.gravelBoardsCount).toBe(17);
    expect(r.postcreteBags).toBe(36);
    expect(r.cutLengthFt).toBeCloseTo(4, 2);
    expect(r.lastPanelCut).toBe(true);
    expect(r.partialPanels).toBe(1);
    expect(r.costPartial).toBe(false);
  });

  it("does not flag an exact fit as cut, and drops boards when not selected", () => {
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 96 });
    expect(r.panels).toBe(16);
    expect(r.posts).toBe(17);
    expect(r.cutLengthFt).toBeCloseTo(6, 2);
    expect(r.lastPanelCut).toBe(false);
    expect(r.partialPanels).toBe(0);
    const noBoards = calculateFencePanel({ ...PANEL_BASE, netRunFt: 100, gravelBoards: 0 });
    expect(noBoards.gravelBoardsCount).toBe(0);
    expect(noBoards.panels).toBe(17);
  });

  it("QA example — central gate, panel mode: 20 ft run, 4 ft gate in the middle, 6 ft panels", () => {
    // Net 16 ft in two equal 8 ft runs. Per run: 8 / 6 = 1.33 -> 2
    // panels, 3 posts. Total: 4 panels, 6 posts (2 gate, 4 line),
    // 4 gravel boards, 12 Postcrete bags. Each run ends in a partial
    // panel of 8 - 6 = 2 ft, so 2 partial panels. One continuous
    // 16 ft run would count only 3 panels and 4 posts.
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 16, segments: 2 });
    expect(r.segmentLengthFt).toBe(8);
    expect(r.panelsPerRun).toBe(2);
    expect([r.panels, r.posts, r.gatePosts, r.linePosts]).toEqual([4, 6, 2, 4]);
    expect([r.gravelBoardsCount, r.postcreteBags]).toEqual([4, 12]);
    expect(r.cutLengthFt).toBeCloseTo(2, 2);
    expect(r.lastPanelCut).toBe(true);
    expect(r.partialPanels).toBe(2);
    const continuous = calculateFencePanel({ ...PANEL_BASE, netRunFt: 16, segments: 1 });
    expect([continuous.panels, continuous.posts]).toEqual([3, 4]);
  });

  it("end gate with existing support needs no extra posts, panel mode: same 20 ft run, 4 ft gate at the end", () => {
    // CHANGED (QA-17B2-R01): the old test asserted that an end gate
    // needs no extra posts at all. That is only true when the gate
    // hangs from an existing support. Net 16 ft, one run: panels
    // 16 / 6 = 2.67 -> 3, posts 4, last panel 16 - 12 = 4 ft,
    // 1 partial panel, Postcrete 4 x 2 = 8.
    const r = calculateFencePanel({
      ...PANEL_BASE,
      netRunFt: 16,
      segments: 1,
      endGate: true,
      endGateExistingSupport: true,
    });
    expect([r.panels, r.posts, r.gatePosts]).toEqual([3, 4, 0]);
    expect(r.endGateSupportPosts).toBe(0);
    expect(r.postcreteBags).toBe(8);
    expect(r.cutLengthFt).toBeCloseTo(4, 2);
    expect(r.partialPanels).toBe(1);
  });

  it("QA-17B2-R01 — freestanding end gate, panel mode: 20 ft run, 4 ft gate at the end, 6 ft panels", () => {
    // Net 16 ft, one run: panels 16 / 6 = 2.67 -> 3, fence posts 4.
    // A freestanding end gate needs one extra opposing support post,
    // so posts 5, gate posts 1, line posts 4. Gravel boards 3,
    // Postcrete 5 x 2 = 10, last panel 16 - 12 = 4 ft, 1 partial panel.
    const r = calculateFencePanel({
      ...PANEL_BASE,
      netRunFt: 16,
      segments: 1,
      endGate: true,
    });
    expect([r.panels, r.posts, r.gatePosts, r.linePosts]).toEqual([3, 5, 1, 4]);
    expect(r.endGateSupportPosts).toBe(1);
    expect([r.gravelBoardsCount, r.postcreteBags]).toEqual([3, 10]);
    expect(r.cutLengthFt).toBeCloseTo(4, 2);
    expect(r.partialPanels).toBe(1);
    // The support post is priced like any other post: $20 per post
    // gives 5 x 20 = $100, a priced-materials subtotal (panels and
    // Postcrete unpriced).
    const priced = calculateFencePanel({
      ...PANEL_BASE,
      netRunFt: 16,
      segments: 1,
      endGate: true,
      pricePerPost: 20,
    });
    expect(priced.costUsd).toBe(100);
    expect(priced.costPartial).toBe(true);
  });

  it("middle gate ignores the end-gate option, panel mode: segments 2 with endGate true is the centered-gate result", () => {
    // Net 16 ft in two 8 ft runs: 4 panels, 6 posts (2 gate, 4 line)
    // — the same as the centered-gate case above. The end-gate
    // support post is not added on top: middle gates already count
    // two flanking posts per gate opening.
    const r = calculateFencePanel({
      ...PANEL_BASE,
      netRunFt: 16,
      segments: 2,
      endGate: true,
    });
    expect([r.panels, r.posts, r.gatePosts, r.linePosts]).toEqual([4, 6, 2, 4]);
    expect(r.endGateSupportPosts).toBe(0);
  });

  it("multiple gates, panel mode: 30 ft run, two 3 ft gates, three runs", () => {
    // Net 24 ft in three equal 8 ft runs. Per run: 8 / 6 = 1.33 -> 2
    // panels, 3 posts. Total: 6 panels, 9 posts (4 gate, 5 line),
    // 6 boards, 18 Postcrete bags, 3 partial panels of 2 ft each.
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 24, segments: 3 });
    expect([r.panels, r.posts, r.gatePosts, r.linePosts]).toEqual([6, 9, 4, 5]);
    expect([r.gravelBoardsCount, r.postcreteBags, r.partialPanels]).toEqual([6, 18, 3]);
    expect(r.cutLengthFt).toBeCloseTo(2, 2);
  });

  it("exact panel-length boundaries per run: 12 ft and 18 ft net in two runs", () => {
    // 12 ft net in two 6 ft runs: 1 panel per run, 2 panels, 4 posts,
    // exact fit — no partial panel.
    const exact = calculateFencePanel({ ...PANEL_BASE, netRunFt: 12, segments: 2 });
    expect([exact.panelsPerRun, exact.panels, exact.posts]).toEqual([1, 2, 4]);
    expect(exact.cutLengthFt).toBeCloseTo(6, 2);
    expect(exact.lastPanelCut).toBe(false);
    expect(exact.partialPanels).toBe(0);
    // 18 ft net in two 9 ft runs: 9 / 6 = 1.5 -> 2 panels per run,
    // 4 panels, 6 posts, partial panels of 9 - 6 = 3 ft.
    const half = calculateFencePanel({ ...PANEL_BASE, netRunFt: 18, segments: 2 });
    expect([half.panelsPerRun, half.panels, half.posts]).toEqual([2, 4, 6]);
    expect(half.cutLengthFt).toBeCloseTo(3, 2);
    expect(half.partialPanels).toBe(2);
  });

  it("fractional dimensions, panel mode: 16.5 ft net in two runs", () => {
    // Each run 8.25 ft: 8.25 / 6 = 1.375 -> 2 panels, 3 posts per run.
    // Total: 4 panels, 6 posts, 4 boards, 12 Postcrete bags, partial
    // panels of 8.25 - 6 = 2.25 ft.
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 16.5, segments: 2 });
    expect(r.segmentLengthFt).toBeCloseTo(8.25, 10);
    expect([r.panels, r.posts, r.gravelBoardsCount, r.postcreteBags]).toEqual([4, 6, 4, 12]);
    expect(r.cutLengthFt).toBeCloseTo(2.25, 2);
    expect(r.partialPanels).toBe(2);
  });

  it("metric/imperial equivalence, panel mode: 6.096 m run with a 1.2192 m gate", () => {
    // 6.096 m = 20 ft, 1.2192 m = 4 ft (via the unit engine), so the
    // net run is 16 ft in two 8 ft runs: 4 panels, 6 posts.
    const netRunFt = convertLength(6.096, "m", "ft") - convertLength(1.2192, "m", "ft");
    expect(netRunFt).toBeCloseTo(16, 9);
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt, segments: 2 });
    expect([r.panels, r.posts, r.gatePosts, r.partialPanels]).toEqual([4, 6, 2, 2]);
  });

  it("large input, panel mode: 600 ft run, one run and five runs", () => {
    // One run: panels 600 / 6 = 100, posts 101, boards 100,
    // Postcrete 101 x 2 = 202, exact fit.
    const one = calculateFencePanel({ ...PANEL_BASE, netRunFt: 600, segments: 1 });
    expect([one.panels, one.posts, one.gravelBoardsCount, one.postcreteBags]).toEqual([
      100, 101, 100, 202,
    ]);
    expect(one.lastPanelCut).toBe(false);
    // Five 120 ft runs: per run 120 / 6 = 20 panels, 21 posts. Total:
    // 100 panels, 105 posts (8 gate, 97 line), 100 boards,
    // Postcrete 105 x 2 = 210, exact fit.
    const five = calculateFencePanel({ ...PANEL_BASE, netRunFt: 600, segments: 5 });
    expect([five.panels, five.posts, five.gatePosts, five.linePosts]).toEqual([100, 105, 8, 97]);
    expect([five.gravelBoardsCount, five.postcreteBags]).toEqual([100, 210]);
    expect(five.lastPanelCut).toBe(false);
  });

  it("returns zeros for a zero or negative run, and clamps an invalid segment count to 1", () => {
    const r = calculateFencePanel({ ...PANEL_BASE, netRunFt: 0 });
    expect([r.panels, r.posts, r.gravelBoardsCount, r.postcreteBags]).toEqual([0, 0, 0, 0]);
    expect(r.lastPanelCut).toBe(false);
    expect(r.partialPanels).toBe(0);
    expect(r.costPartial).toBe(false);
    const gatedZero = calculateFencePanel({ ...PANEL_BASE, netRunFt: 0, segments: 2 });
    expect([gatedZero.posts, gatedZero.gatePosts]).toEqual([0, 0]);
    // A freestanding end gate on a zero run still counts no support post.
    const endGateZero = calculateFencePanel({
      ...PANEL_BASE,
      netRunFt: 0,
      segments: 1,
      endGate: true,
    });
    expect(endGateZero.endGateSupportPosts).toBe(0);
    const negative = calculateFencePanel({ ...PANEL_BASE, netRunFt: -5, segments: 2 });
    expect([negative.panels, negative.posts]).toEqual([0, 0]);
    // segments 0 clamps to 1: 16 ft in one run is 3 panels, 4 posts.
    const clamped = calculateFencePanel({ ...PANEL_BASE, netRunFt: 16, segments: 0 });
    expect([clamped.segments, clamped.panels, clamped.posts]).toEqual([1, 3, 4]);
  });

  it("prices the priced parts only, and flags a partial cost when a price is missing", () => {
    const r = calculateFencePanel({
      ...PANEL_BASE,
      netRunFt: 100,
      pricePerPanel: 50,
      pricePerPost: 20,
      pricePerPostcreteBag: 6,
    });
    // 17 x 50 + 18 x 20 + 36 x 6 = 850 + 360 + 216 = 1426. Every priced
    // part has a price, so this is not flagged partial.
    expect(r.costUsd).toBe(1426);
    expect(r.costPartial).toBe(false);
    // Only the panel price entered: 17 x 50 = 850, and the posts and
    // Postcrete are unpriced, so the cost is a priced-materials subtotal.
    const partial = calculateFencePanel({ ...PANEL_BASE, netRunFt: 100, pricePerPanel: 50 });
    expect(partial.costUsd).toBe(850);
    expect(partial.costPartial).toBe(true);
    const unpriced = calculateFencePanel({ ...PANEL_BASE, netRunFt: 100 });
    expect(unpriced.costUsd).toBeUndefined();
    expect(unpriced.costPartial).toBe(false);
  });
});
