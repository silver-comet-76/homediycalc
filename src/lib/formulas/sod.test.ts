import { describe, expect, it } from "vitest";
import { calculateSod } from "./sod";

const BASE = {
  wastePct: 10,
  rollCoverageFt2: 10,
  palletCoverageFt2: 450,
};

describe("calculateSod", () => {
  it("matches the worked example: 20 × 30 ft lawn, 100 ft² driveway, 10% waste", () => {
    // Gross 600 ft² − 100 ft² exclusions = 500 ft²; with 10% waste: 550 ft².
    const r = calculateSod({ ...BASE, grossAreaFt2: 600, exclusionsFt2: 100 });
    expect(r.grossAreaFt2).toBe(600);
    expect(r.netAreaFt2).toBe(500);
    expect(r.netAreaM2).toBeCloseTo(46.45, 2);
    expect(r.adjustedAreaFt2).toBeCloseTo(550, 2);
    expect(r.adjustedAreaM2).toBeCloseTo(51.1, 2);
    // Rolls: 550 / 10 = 55. Pallets: ceil(550 / 450) = 2.
    expect(r.rolls).toBe(55);
    expect(r.pallets).toBe(2);
    // Second pallet is partial: 550 − 450 = 100 ft² of it.
    expect(r.lastPalletFt2).toBeCloseTo(100, 2);
    expect(r.lastPalletPartial).toBe(true);
  });

  it("matches the lookup-table rows (10% waste, 10 ft² rolls, 450 ft² pallets)", () => {
    const row = (lengthFt: number, widthFt: number) =>
      calculateSod({ ...BASE, grossAreaFt2: lengthFt * widthFt, exclusionsFt2: 0 });
    const r1 = row(10, 10);
    expect(r1.adjustedAreaFt2).toBeCloseTo(110, 2);
    expect(r1.rolls).toBe(11);
    expect(r1.pallets).toBe(1);
    expect(r1.lastPalletPartial).toBe(true);
    expect(r1.lastPalletFt2).toBeCloseTo(110, 2);
    const r2 = row(20, 20);
    expect(r2.adjustedAreaFt2).toBeCloseTo(440, 2);
    expect(r2.rolls).toBe(44);
    expect(r2.pallets).toBe(1);
    expect(r2.lastPalletFt2).toBeCloseTo(440, 2);
    const r3 = row(20, 30);
    expect(r3.adjustedAreaFt2).toBeCloseTo(660, 2);
    expect(r3.rolls).toBe(66);
    expect(r3.pallets).toBe(2);
    expect(r3.lastPalletFt2).toBeCloseTo(210, 2);
    const r4 = row(30, 40);
    expect(r4.adjustedAreaFt2).toBeCloseTo(1320, 2);
    expect(r4.rolls).toBe(132);
    expect(r4.pallets).toBe(3);
    expect(r4.lastPalletFt2).toBeCloseTo(420, 2);
    const r5 = row(50, 100);
    expect(r5.adjustedAreaFt2).toBeCloseTo(5500, 2);
    expect(r5.rolls).toBe(550);
    expect(r5.pallets).toBe(13);
    expect(r5.lastPalletFt2).toBeCloseTo(100, 2);
  });

  it("marks a whole-pallet order as not partial", () => {
    // 900 ft² + 0% waste = 900 ft² = exactly 2 pallets of 450 ft².
    const r = calculateSod({
      ...BASE,
      grossAreaFt2: 900,
      exclusionsFt2: 0,
      wastePct: 0,
    });
    expect(r.pallets).toBe(2);
    expect(r.lastPalletFt2).toBe(450);
    expect(r.lastPalletPartial).toBe(false);
  });

  it("rounds rolls and pallets up, never down", () => {
    const r = calculateSod({ ...BASE, grossAreaFt2: 105, exclusionsFt2: 0, wastePct: 0 });
    expect(r.rolls).toBe(11); // 105 / 10 = 10.5
    expect(r.pallets).toBe(1); // 105 / 450
  });

  it("handles exclusions that cover the whole lawn", () => {
    const r = calculateSod({ ...BASE, grossAreaFt2: 500, exclusionsFt2: 600 });
    expect(r.netAreaFt2).toBe(0);
    expect(r.adjustedAreaFt2).toBe(0);
    expect(r.rolls).toBe(0);
    expect(r.pallets).toBe(0);
    expect(r.lastPalletPartial).toBe(false);
  });

  it("prices pallets or rolls, never both — pallet wins when both prices are entered", () => {
    // Worked example: 2 pallets at $200/pallet, 55 rolls at $8/roll.
    const both = calculateSod({
      ...BASE,
      grossAreaFt2: 600,
      exclusionsFt2: 100,
      pricePerPallet: 200,
      pricePerRoll: 8,
    });
    expect(both.costUsd).toBe(2 * 200);
    const rollsOnly = calculateSod({
      ...BASE,
      grossAreaFt2: 600,
      exclusionsFt2: 100,
      pricePerRoll: 8,
    });
    expect(rollsOnly.costUsd).toBe(55 * 8);
    const unpriced = calculateSod({ ...BASE, grossAreaFt2: 600, exclusionsFt2: 100 });
    expect(unpriced.costUsd).toBeUndefined();
  });
});
