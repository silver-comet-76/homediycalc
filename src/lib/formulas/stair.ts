/**
 * Stair Calculator — riser count and height, tread count, total run,
 * stringer length, and stair angle for a straight staircase.
 *
 * Pure functions only. Canonical units: inches for every length.
 * Code limits are from the 2021 International Residential Code (IRC):
 * maximum riser height 7-3/4 in (R311.7.5.1) and minimum tread depth
 * 10 in (R311.7.5.2). The 2024 IRC keeps the same numbers but renumbers
 * the stair section to R318.7. Local jurisdictions may amend these
 * limits — the page says so, and the maximum riser height is editable.
 */

import { ceilUp } from "../units";

/** Maximum riser height, in inches — 2021 IRC R311.7.5.1. */
export const MAX_RISER_IN = 7.75;
/** Minimum tread depth, in inches — 2021 IRC R311.7.5.2. */
export const MIN_TREAD_IN = 10;

export interface StairInput {
  /** Total floor-to-floor height, in inches. */
  totalRiseIn: number;
  /** Desired tread depth, in inches (default 10.5). */
  treadDepthIn?: number;
  /** Maximum riser height, in inches (default 7.75, the IRC maximum). */
  maxRiserIn?: number;
}

export interface StairResult {
  /** Number of risers (steps up), rounded up so no riser exceeds the maximum. */
  riserCount: number;
  /** Height of each riser, in inches — equal for every riser. */
  riserHeightIn: number;
  /** Number of treads — one fewer than the risers (the top floor is the last tread). */
  treadCount: number;
  /** Total horizontal run of the staircase, in inches. */
  totalRunIn: number;
  /** Length of the stringer (the sloped board the treads sit on), in inches. */
  stringerLengthIn: number;
  /** Stair angle from horizontal, in degrees. */
  stairAngleDeg: number;
}

export function calculateStair(input: StairInput): StairResult {
  const totalRiseIn = input.totalRiseIn;
  const treadDepthIn = input.treadDepthIn ?? 10.5;
  const maxRiserIn = input.maxRiserIn ?? MAX_RISER_IN;
  if (!(totalRiseIn > 0)) {
    throw new Error("Total rise must be greater than 0.");
  }
  if (treadDepthIn < MIN_TREAD_IN) {
    throw new Error(`Tread depth must be at least ${MIN_TREAD_IN} in (IRC R311.7.5.2).`);
  }
  if (!(maxRiserIn > 0)) {
    throw new Error("Maximum riser height must be greater than 0.");
  }
  const riserCount = ceilUp(totalRiseIn / maxRiserIn);
  const riserHeightIn = totalRiseIn / riserCount;
  const treadCount = riserCount - 1;
  const totalRunIn = treadCount * treadDepthIn;
  const stringerLengthIn = Math.sqrt(totalRiseIn ** 2 + totalRunIn ** 2);
  const stairAngleDeg = (Math.atan2(totalRiseIn, totalRunIn) * 180) / Math.PI;
  return {
    riserCount,
    riserHeightIn,
    treadCount,
    totalRunIn,
    stringerLengthIn,
    stairAngleDeg,
  };
}
