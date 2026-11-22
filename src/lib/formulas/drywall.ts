import { ceilUp } from "../units";

/**
 * Drywall Calculator — sheets, joint compound, tape, and screws for
 * walls and ceilings.
 *
 * Pure functions only. Canonical units: square feet for area, gallons
 * for compound.
 *
 * Reference values (see docs/FORMULAS.md, Phase 3 table):
 * - Standard sheet 4 × 8 ft = 32 ft² (4 × 10 ft = 40 ft², 4 × 12 ft = 48 ft²).
 * - Joint compound: about 100 ft² per gallon for a Level 4 three-coat
 *   finish (USG guidance: about two 4.5 gal pails per 1,000 ft²).
 * - Paper tape: about 370 linear ft per 1,000 ft².
 * - Screws: about 28 per 4 × 8 sheet on walls, about 35 on ceilings
 *   (16 in framing; ASTM C840 / GA-216 spacing). About 250 screws
 *   per pound for 1¼ in coarse-thread screws. Screw counts scale with
 *   sheet size — 4 × 10 ft takes 32 wall / 40 ceiling, 4 × 12 ft takes
 *   40 wall / 50 ceiling (Material Guides, "Drywall Screws, Mud and
 *   Tape: Quantities per Sheet").
 * - Door deduction 20 ft², window deduction 15 ft² (estimating convention).
 *
 * Compound, tape, and screws are estimated from the area actually hung
 * (no waste); only the sheet count to buy includes the waste allowance.
 */

/** Square feet deducted for one standard door (estimating convention). */
export const DOOR_AREA_FT2 = 20;

/** Square feet deducted for one standard window (estimating convention). */
export const WINDOW_AREA_FT2 = 15;

export interface DrywallInput {
  wallAreaFt2: number;
  ceilingAreaFt2: number;
  /** Area of one sheet, in square feet (32 for a 4 × 8 ft sheet). */
  sheetAreaFt2: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Finished area covered by one gallon of compound (100 for Level 4). */
  compoundCoverageFt2PerGal: number;
  /** Pail size in gallons (4.5 is the common pail). */
  pailSizeGal: number;
  /** Linear feet of tape per 1,000 ft² of board (370). */
  tapeFtPer1000Ft2: number;
  /** Feet of tape on one roll (250 is common). */
  tapeRollFt: number;
  /** Screws per sheet on walls. When omitted, derived from the sheet
   * size (see drywallScrewsPerSheet): 28 for 4 × 8 ft, 32 for 4 × 10 ft,
   * 40 for 4 × 12 ft. */
  screwsPerSheetWall?: number;
  /** Screws per sheet on ceilings. When omitted, derived from the sheet
   * size: 35 for 4 × 8 ft, 40 for 4 × 10 ft, 50 for 4 × 12 ft. */
  screwsPerSheetCeiling?: number;
  /** Screws per pound, for the weight estimate (250 for 1¼ in coarse). */
  screwsPerLb: number;
  /** Optional price per sheet, in USD. */
  pricePerSheet?: number;
  /** Optional price per pail of compound, in USD. */
  pricePerPail?: number;
}

export interface DrywallResult {
  totalAreaFt2: number;
  /** Sheets hung on walls (rounded up, no waste). */
  wallSheets: number;
  /** Sheets hung on ceilings (rounded up, no waste). */
  ceilingSheets: number;
  /** Sheets actually hung, walls + ceilings. */
  sheetsHung: number;
  /** Sheets to buy (rounded up, waste included). */
  sheetsToBuy: number;
  /** Gallons of joint compound (finished area ÷ coverage). */
  compoundGal: number;
  /** Pails of compound to buy (rounded up). */
  pails: number;
  /** Linear feet of paper tape. */
  tapeFt: number;
  /** Rolls of tape to buy (rounded up). */
  tapeRolls: number;
  /** Screws needed. */
  screws: number;
  /** Screw weight in pounds. */
  screwLb: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

/**
 * Screws per sheet for a sheet size, from Material Guides ("Drywall
 * Screws, Mud and Tape: Quantities per Sheet"): a 4 × 8 ft sheet takes
 * 28 screws on walls and 35 on ceilings; 4 × 10 ft takes 32 / 40;
 * 4 × 12 ft takes 40 / 50. Longer sheets cross the same studs but need
 * more screws along each one, so the count grows with sheet length.
 * Any other sheet area falls back to the 4 × 8 ft counts.
 */
export function drywallScrewsPerSheet(sheetAreaFt2: number): {
  wall: number;
  ceiling: number;
} {
  if (sheetAreaFt2 === 40) return { wall: 32, ceiling: 40 };
  if (sheetAreaFt2 === 48) return { wall: 40, ceiling: 50 };
  return { wall: 28, ceiling: 35 };
}

export function calculateDrywall(input: DrywallInput): DrywallResult {
  const totalAreaFt2 = input.wallAreaFt2 + input.ceilingAreaFt2;
  const wallSheets = ceilUp(input.wallAreaFt2 / input.sheetAreaFt2);
  const ceilingSheets = ceilUp(input.ceilingAreaFt2 / input.sheetAreaFt2);
  const sheetsHung = wallSheets + ceilingSheets;
  const sheetsToBuy = ceilUp((totalAreaFt2 * (1 + input.wastePct / 100)) / input.sheetAreaFt2);
  const compoundGal = totalAreaFt2 / input.compoundCoverageFt2PerGal;
  const pails = ceilUp(compoundGal / input.pailSizeGal);
  const tapeFt = (totalAreaFt2 * input.tapeFtPer1000Ft2) / 1000;
  const tapeRolls = ceilUp(tapeFt / input.tapeRollFt);
  const derivedScrews = drywallScrewsPerSheet(input.sheetAreaFt2);
  const screws =
    wallSheets * (input.screwsPerSheetWall ?? derivedScrews.wall) +
    ceilingSheets * (input.screwsPerSheetCeiling ?? derivedScrews.ceiling);
  const screwLb = screws / input.screwsPerLb;
  const costUsd =
    input.pricePerSheet !== undefined || input.pricePerPail !== undefined
      ? (input.pricePerSheet !== undefined ? sheetsToBuy * input.pricePerSheet : 0) +
        (input.pricePerPail !== undefined ? pails * input.pricePerPail : 0)
      : undefined;
  return {
    totalAreaFt2,
    wallSheets,
    ceilingSheets,
    sheetsHung,
    sheetsToBuy,
    compoundGal,
    pails,
    tapeFt,
    tapeRolls,
    screws,
    screwLb,
    costUsd,
  };
}
