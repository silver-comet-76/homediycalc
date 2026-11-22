import { ceilUp } from "../units";

/**
 * Baseboard Calculator — linear feet and stock pieces for baseboard
 * (trim) around a room.
 *
 * Pure functions only. Canonical units: feet for lengths.
 *
 * Formula:
 *   `net length = max(0, perimeter − doors × door width)`
 *   (or the total wall length entered directly)
 *   `adjusted length = net length × (1 + waste%)`
 *   `pieces = ceil(adjusted length ÷ piece length)`
 *   `purchased length = pieces × piece length`
 *
 * Reference values (see docs/FORMULAS.md, Phase 4 table): trim is
 * stocked in 8, 12, and 16 ft lengths at most home centers (some
 * suppliers also carry 10 and 14 ft, so the piece length is a
 * choice, not a fixed assumption). A 10% allowance for miter cuts
 * is the trade convention for a simple square room; rooms with
 * alcoves, bay windows, or many outside corners realistically need
 * 15–20%. The allowance covers miter and scarf cuts, not a cut
 * plan: whether a wall fits a stick decides the real waste, and a
 * 14 ft wall cut from a 16 ft stick leaves a 2 ft offcut no other
 * wall can use — the page says so and shows the purchased length
 * next to the net length so the difference is visible.
 */

/** Standard door opening deducted from the perimeter, in feet. */
export const STANDARD_DOOR_WIDTH_FT = 3;

export interface BaseboardInput {
  /** Net wall length to cover, in feet (perimeter minus openings). */
  netLengthFt: number;
  /** Length of one stock piece, in feet (8, 12, or 16 are standard). */
  pieceLengthFt: number;
  /** Waste allowance in percent for miter cuts, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per linear foot, in USD. */
  pricePerFt?: number;
}

export interface BaseboardResult {
  /** Linear feet to cover after the waste allowance. */
  adjustedFt: number;
  /** Stock pieces to buy (rounded up). */
  pieces: number;
  /** Linear feet actually purchased (pieces × piece length). */
  purchasedFt: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateBaseboard(input: BaseboardInput): BaseboardResult {
  const adjustedFt = input.netLengthFt * (1 + input.wastePct / 100);
  const pieces = ceilUp(adjustedFt / input.pieceLengthFt);
  const purchasedFt = pieces * input.pieceLengthFt;
  const costUsd = input.pricePerFt !== undefined ? purchasedFt * input.pricePerFt : undefined;
  return { adjustedFt, pieces, purchasedFt, costUsd };
}

/** Net wall length for a rectangular room, in feet. Never below zero:
 * more door width than perimeter means no baseboard, not a negative
 * length (a 12 × 12 ft room with fifty 3 ft doors has 0 ft, not −102 ft). */
export function roomNetLengthFt(
  lengthFt: number,
  widthFt: number,
  doors: number,
  doorWidthFt: number,
): number {
  return Math.max(0, 2 * (lengthFt + widthFt) - doors * doorWidthFt);
}
