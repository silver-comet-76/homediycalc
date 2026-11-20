/**
 * Paint Calculator — gallons of paint for walls, minus doors and windows.
 *
 * Pure functions only. Canonical units: square feet for area, US gallons
 * for paint. Reference coverage default 350 ft²/gal is the low end of the
 * 350–400 ft²/gal range on Sherwin-Williams interior latex data sheets
 * (SuperPaint / Duration Home, at 4 mils wet) — see docs/FORMULAS.md.
 * The coverage field is user-editable; always use the figure on the can
 * you actually buy.
 */

import { gallonsToLiters, ceilUp } from "../units";

/** Typical US interior door, 3 ft × 7 ft = 21 ft². */
export const STANDARD_DOOR_AREA_FT2 = 21;
/** Typical US window, 3 ft × 5 ft = 15 ft². */
export const STANDARD_WINDOW_AREA_FT2 = 15;

export interface PaintInput {
  /** Paintable wall area after doors/windows are deducted (ft²). */
  netAreaFt2: number;
  coats: number;
  /** Coverage per coat (ft² per US gallon). */
  coverageFt2PerGal: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per gallon, in USD. */
  pricePerGal?: number;
}

export interface PaintResult {
  rawGallons: number;
  adjustedGallons: number;
  /** Whole gallons to buy (rounded up). */
  gallonsToBuy: number;
  litersToBuy: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

/**
 * Wall area of a rectangular room (four walls), minus doors and windows.
 * Door/window areas are the typical sizes above unless the caller passes
 * its own per-unit areas.
 */
export function roomWallArea(
  lengthFt: number,
  widthFt: number,
  heightFt: number,
  doorCount: number,
  windowCount: number,
  doorAreaFt2: number = STANDARD_DOOR_AREA_FT2,
  windowAreaFt2: number = STANDARD_WINDOW_AREA_FT2,
): number {
  const gross = 2 * (lengthFt + widthFt) * heightFt;
  return Math.max(0, gross - doorCount * doorAreaFt2 - windowCount * windowAreaFt2);
}

export function calculatePaint(input: PaintInput): PaintResult {
  const rawGallons = (input.netAreaFt2 * input.coats) / input.coverageFt2PerGal;
  const adjustedGallons = rawGallons * (1 + input.wastePct / 100);
  const gallonsToBuy = ceilUp(adjustedGallons);
  return {
    rawGallons,
    adjustedGallons,
    gallonsToBuy,
    litersToBuy: gallonsToLiters(gallonsToBuy),
    costUsd:
      input.pricePerGal !== undefined ? gallonsToBuy * input.pricePerGal : undefined,
  };
}
