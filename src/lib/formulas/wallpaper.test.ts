import { describe, expect, it } from "vitest";
import { calculateWallpaper, WALLPAPER_ROLLS } from "./wallpaper";

const DOUBLE = WALLPAPER_ROLLS["double"] ?? {
  widthIn: 20.5,
  lengthFt: 33,
  label: "",
};
const SINGLE = WALLPAPER_ROLLS["single"] ?? {
  widthIn: 20.5,
  lengthFt: 16.5,
  label: "",
};
const METRIC = WALLPAPER_ROLLS["metric"] ?? {
  widthIn: 20.87,
  lengthFt: 32.81,
  label: "",
};

describe("calculateWallpaper", () => {
  it("matches the FORMULAS.md worked example: 12 × 15 ft room, 18 in repeat", () => {
    // Perimeter 54 ft = 648 in; strips = ceil(648 ÷ 20.5) = 32.
    // Strip length = 8 + 1.5 + 1/3 = 9.83 ft; strips per roll = floor(33 ÷ 9.83) = 3.
    // With 10% waste: 36 strips -> 12 double rolls.
    const r = calculateWallpaper({
      wallLengthFt: 54,
      wallHeightFt: 8,
      rollWidthIn: DOUBLE.widthIn,
      rollLengthFt: DOUBLE.lengthFt,
      patternRepeatIn: 18,
      wastePct: 10,
    });
    expect(r.strips).toBe(32);
    expect(r.stripLengthFt).toBeCloseTo(9.83, 2);
    expect(r.stripsPerRoll).toBe(3);
    expect(r.rolls).toBe(12);
  });

  it("needs far more rolls from a single roll", () => {
    // Same room, plain paper, single roll: strips 32, strip length 8.33 ft,
    // strips per roll = floor(16.5 ÷ 8.33) = 1 -> 36 strips with waste -> 36 rolls.
    const r = calculateWallpaper({
      wallLengthFt: 54,
      wallHeightFt: 8,
      rollWidthIn: SINGLE.widthIn,
      rollLengthFt: SINGLE.lengthFt,
      patternRepeatIn: 0,
      wastePct: 10,
    });
    expect(r.stripsPerRoll).toBe(1);
    expect(r.rolls).toBe(36);
  });

  it("counts a metric roll the same way", () => {
    // 54 ft wall, 8 ft high, plain paper: strips = ceil(648 ÷ 20.87) = 32;
    // strips per roll = floor(32.81 ÷ 8.33) = 3 -> 12 rolls with 10% waste.
    const r = calculateWallpaper({
      wallLengthFt: 54,
      wallHeightFt: 8,
      rollWidthIn: METRIC.widthIn,
      rollLengthFt: METRIC.lengthFt,
      patternRepeatIn: 0,
      wastePct: 10,
    });
    expect(r.strips).toBe(32);
    expect(r.stripsPerRoll).toBe(3);
    expect(r.rolls).toBe(12);
  });

  it("reports zero rolls when no full strip fits the roll", () => {
    const r = calculateWallpaper({
      wallLengthFt: 54,
      wallHeightFt: 34,
      rollWidthIn: DOUBLE.widthIn,
      rollLengthFt: DOUBLE.lengthFt,
      patternRepeatIn: 0,
      wastePct: 10,
    });
    expect(r.stripsPerRoll).toBe(0);
    expect(r.rolls).toBe(0);
  });

  it("prices rolls only when a price is entered", () => {
    const r = calculateWallpaper({
      wallLengthFt: 54,
      wallHeightFt: 8,
      rollWidthIn: DOUBLE.widthIn,
      rollLengthFt: DOUBLE.lengthFt,
      patternRepeatIn: 18,
      wastePct: 10,
      pricePerRoll: 40,
    });
    expect(r.costUsd).toBe(480);
    const unpriced = calculateWallpaper({
      wallLengthFt: 54,
      wallHeightFt: 8,
      rollWidthIn: DOUBLE.widthIn,
      rollLengthFt: DOUBLE.lengthFt,
      patternRepeatIn: 18,
      wastePct: 10,
    });
    expect(unpriced.costUsd).toBeUndefined();
  });
});
