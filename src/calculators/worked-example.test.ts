import { describe, expect, it } from "vitest";
import { tileConfig } from "./tile-calculator/config";
import { tileAdhesiveConfig } from "./tile-adhesive-calculator/config";
import { gravelConfig } from "./gravel-calculator/config";
import { calculateTile } from "../lib/formulas/tile";
import { calculateTileAdhesive } from "../lib/formulas/tile-adhesive";
import { calculateGravel } from "../lib/formulas/gravel";
import { linkedTextToPlain } from "../lib/linked-text";

/**
 * Worked-example prose pinned to its formula (Phase 17B-1, D-1/D-2/D-3).
 *
 * Nothing tested the prose before: lookup-table.test.ts recomputes table
 * cells from compute() but never reads workedExample, and the formula
 * tests assert formula outputs, not the strings shown to users. That is
 * how all three defects shipped with a green suite. Each test below
 * recomputes the figure from the formula with the example's stated
 * inputs AND asserts the prose string contains that figure, so a future
 * prose edit that reintroduces a wrong number fails the gate.
 */
describe("worked examples agree with their formulas", () => {
  it("D-1 tile: 100 ft², 12×12 in, ⅛ in joint, 10% waste → 108 tiles, 11 boxes", () => {
    const r = calculateTile({
      areaFt2: 100,
      tileLengthIn: 12,
      tileWidthIn: 12,
      jointIn: 0.125,
      wastePct: 10,
      tilesPerBox: 10,
    });
    expect(r.tilesNeeded).toBe(108);
    expect(r.boxesNeeded).toBe(11);
    expect(tileConfig.workedExample).toContain("108 tiles");
    expect(tileConfig.workedExample).toContain("11 boxes");
    expect(tileConfig.workedExample).not.toContain("110 tiles");
  });

  it("D-2 tile adhesive: 100 ft², ½×½ in notch (42 ft²/bag), 10% waste → 3 bags", () => {
    const r = calculateTileAdhesive({
      areaFt2: 100,
      coveragePer50LbBagFt2: 42,
      bagWeightLb: 50,
      backButter: false,
      wastePct: 10,
    });
    expect(r.bags).toBe(3);
    expect(r.adhesiveLb).toBeCloseTo(130.95, 2);
    expect(tileAdhesiveConfig.workedExample).toContain("3 bags");
    expect(tileAdhesiveConfig.workedExample).not.toContain("needs 6 bags");
  });

  it("QA-17B1-02 tile adhesive: the 3-bag result stays, but the ½×½ in notch is a conditional estimate and not recommended", () => {
    // The 42 ft²/bag figure is CUSTOM's chart estimating figure, and the
    // example excludes back-troweling material (the calculator adds ~35%
    // only when back-buttering is selected).
    expect(tileAdhesiveConfig.workedExample).toContain("3 bags");
    expect(tileAdhesiveConfig.workedExample).toContain("chart estimating figure");
    expect(tileAdhesiveConfig.workedExample).toContain("excludes any back-troweling material");
    expect(tileAdhesiveConfig.workedExample).toContain("does not recommend");
    expect(tileAdhesiveConfig.workedExample).toContain("U-notch at 30°");
    // The prescriptive guidance must not present the ½×½ in square-notch
    // as the recommended large-format choice:
    const howTo = tileAdhesiveConfig.howTo.map((step) => linkedTextToPlain(step));
    const notchStep = howTo.find((step) => step.startsWith("Pick the trowel notch"));
    expect(notchStep).toBeDefined();
    expect(notchStep).toContain("does not recommend");
    expect(notchStep).toContain("U-notch at 30°");
    expect(notchStep).not.toContain("1/2 × 1/2 in for large format over 15 in");
    const trowelFaq = tileAdhesiveConfig.faqs.find((faq) =>
      faq.question.includes("What size trowel"),
    );
    expect(trowelFaq).toBeDefined();
    const trowelAnswer = linkedTextToPlain(trowelFaq?.answer ?? "");
    expect(trowelAnswer).toContain("does not recommend");
    expect(trowelAnswer).toContain("U-notch at 30°");
    expect(trowelAnswer).not.toContain("step up to a 1/2 × 1/2 in notch");
  });

  it("D-3 gravel: 10×10 ft, 3 in deep, 5% allowance, 2,800 lb/yd³ → 2,722 lb / 1.36 US short tons", () => {
    const r = calculateGravel({
      lengthFt: 10,
      widthFt: 10,
      depthFt: 3 / 12,
      wastePct: 5,
      densityLbPerYd3: 2800,
    });
    expect(r.weightLb).toBeCloseTo(2722.22, 1);
    expect(r.weightTons).toBeCloseTo(1.36, 2);
    expect(gravelConfig.workedExample).toContain("2,722 lb");
    expect(gravelConfig.workedExample).toContain("1.36 US short tons");
    // The no-allowance figure is kept, but only as a labelled figure:
    expect(gravelConfig.workedExample).toContain("before the allowance");
  });
});
