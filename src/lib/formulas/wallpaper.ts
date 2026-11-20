import { ceilUp, convertLength } from "../units";

/**
 * Wallpaper Calculator — rolls needed, counted in whole strips, not
 * by area. Distinct from the Paint Calculator: wallpaper hangs in
 * strips cut to the wall height, so the roll count is decided by
 * how many strips the walls need and how many whole strips come off
 * one roll — dividing wall area by roll area routinely under-orders
 * on patterned papers.
 *
 * Pure functions only. Canonical units: feet for lengths, inches
 * for roll width and pattern repeat.
 *
 * Formula:
 *   `strips = ceil(wall length (in) ÷ roll width (in))`
 *   `strip length = wall height + pattern repeat + 4 in trim`
 *   `strips per roll = floor(roll length ÷ strip length)`
 *   `rolls = ceil(strips × (1 + waste%) ÷ strips per roll)`
 * When no full strip fits on a roll (a very tall wall or a very
 * large repeat), `stripsPerRoll` is 0 and `rolls` is 0 — the page
 * explains the roll is too short rather than inventing a number.
 *
 * Doors and windows are NOT deducted: a strip that crosses an
 * opening is still cut full length, and the section over the glass
 * is waste whether it is counted or not.
 *
 * Reference values (see docs/FORMULAS.md, Phase 4 table): US
 * double roll 20.5 in × 33 ft = 56.4 ft² (the standard purchase
 * unit; wallpaper is priced per single roll but sold per double
 * roll); US single roll 20.5 in × 16.5 ft = 28.2 ft²; metric roll
 * 0.53 m × 10 m = 57.1 ft². The pattern repeat is printed on the
 * roll label; 0 means a plain or random-match paper.
 */

/** Roll sizes, in inches of width and feet of length. */
export const WALLPAPER_ROLLS: Record<
  string,
  { widthIn: number; lengthFt: number; label: string }
> = {
  double: {
    widthIn: 20.5,
    lengthFt: 33,
    label: "US double roll (20.5 in × 33 ft)",
  },
  single: {
    widthIn: 20.5,
    lengthFt: 16.5,
    label: "US single roll (20.5 in × 16.5 ft)",
  },
  metric: {
    widthIn: convertLength(0.53, "m", "in"),
    lengthFt: convertLength(10, "m", "ft"),
    label: "Metric roll (0.53 m × 10 m)",
  },
};

/** Roll-type codes in select order: 0 = double, 1 = single, 2 = metric. */
export const WALLPAPER_ROLL_TYPE_CODES = ["double", "single", "metric"] as const;

/** Look up a roll size by its numeric select code. */
export function getWallpaperRoll(code: number): {
  widthIn: number;
  lengthFt: number;
  label: string;
} {
  const key =
    WALLPAPER_ROLL_TYPE_CODES[code] ?? WALLPAPER_ROLL_TYPE_CODES[0];
  return WALLPAPER_ROLLS[key ?? "double"] ?? WALLPAPER_ROLLS["double"] ?? {
    widthIn: 20.5,
    lengthFt: 33,
    label: "US double roll (20.5 in × 33 ft)",
  };
}

/** Trim allowance at the top and bottom of each strip, in inches. */
export const WALLPAPER_TRIM_IN = 4;

export interface WallpaperInput {
  /** Total wall length to paper, in feet (perimeter for a whole room). */
  wallLengthFt: number;
  /** Wall height, in feet. */
  wallHeightFt: number;
  /** Roll width, in inches. */
  rollWidthIn: number;
  /** Roll length, in feet. */
  rollLengthFt: number;
  /** Pattern repeat, in inches (0 for a plain paper). */
  patternRepeatIn: number;
  /** Waste allowance in percent for cutting mistakes, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per roll, in USD. */
  pricePerRoll?: number;
}

export interface WallpaperResult {
  /** Full-height strips the walls need (before waste). */
  strips: number;
  /** Length of one strip, in feet (height + repeat + trim). */
  stripLengthFt: number;
  /** Whole strips that come off one roll (0 when none fits). */
  stripsPerRoll: number;
  /** Rolls to buy (rounded up; 0 when no strip fits). */
  rolls: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateWallpaper(input: WallpaperInput): WallpaperResult {
  const strips = ceilUp((input.wallLengthFt * 12) / input.rollWidthIn);
  const stripLengthFt =
    input.wallHeightFt +
    input.patternRepeatIn / 12 +
    WALLPAPER_TRIM_IN / 12;
  const stripsPerRoll = Math.floor(input.rollLengthFt / stripLengthFt);
  const adjustedStrips = ceilUp(strips * (1 + input.wastePct / 100));
  const rolls =
    stripsPerRoll > 0 ? ceilUp(adjustedStrips / stripsPerRoll) : 0;
  const costUsd =
    input.pricePerRoll !== undefined ? rolls * input.pricePerRoll : undefined;
  return { strips, stripLengthFt, stripsPerRoll, rolls, costUsd };
}
