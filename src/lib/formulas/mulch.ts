/**
 * Mulch Calculator — volume of mulch for a bed, in cubic yards and bags.
 *
 * Pure functions only. Canonical units: feet / cubic feet / cubic yards.
 * Mulch is sold by volume, not weight: the standard bag is 2 ft³, and
 * 1 yd³ = 13.5 such bags. No density is assumed — published weights for
 * dry wood mulch range roughly 400–800 lb/yd³ depending on type and
 * moisture (see docs/FORMULAS.md) — so a weight output is shown only
 * when the user enters a density.
 */

import { cubicFeetToCubicYards, poundsToShortTons, ceilUp } from "../units";

export interface MulchInput {
  lengthFt: number;
  widthFt: number;
  depthFt: number;
  /** Settling allowance in percent, e.g. 5 for 5%. */
  wastePct: number;
  /** Volume of one bag, in cubic feet (standard bag = 2 ft³). */
  bagSizeFt3: number;
  /** Optional bulk density in pounds per cubic yard, for a weight output. */
  densityLbPerYd3?: number;
  /** Optional price per cubic yard (bulk), in USD. */
  pricePerYd3?: number;
  /** Optional price per bag, in USD. */
  pricePerBag?: number;
}

export interface MulchResult {
  volumeFt3: number;
  volumeYd3: number;
  adjustedFt3: number;
  adjustedYd3: number;
  /** Bulk cubic yards to order (rounded up to whole yards). */
  orderYd3: number;
  /** Bags to buy (rounded up). */
  bags: number;
  /** Weight in pounds, only when a density was entered. */
  weightLb?: number;
  /** Weight in US short tons, only when a density was entered. */
  weightTons?: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateMulch(input: MulchInput): MulchResult {
  const volumeFt3 = input.lengthFt * input.widthFt * input.depthFt;
  const volumeYd3 = cubicFeetToCubicYards(volumeFt3);
  const factor = 1 + input.wastePct / 100;
  const adjustedFt3 = volumeFt3 * factor;
  const adjustedYd3 = volumeYd3 * factor;
  const orderYd3 = ceilUp(adjustedYd3);
  const bags = ceilUp(adjustedFt3 / input.bagSizeFt3);
  const weightLb =
    input.densityLbPerYd3 !== undefined ? adjustedYd3 * input.densityLbPerYd3 : undefined;
  const costUsd =
    input.pricePerYd3 !== undefined
      ? orderYd3 * input.pricePerYd3
      : input.pricePerBag !== undefined
        ? bags * input.pricePerBag
        : undefined;
  return {
    volumeFt3,
    volumeYd3,
    adjustedFt3,
    adjustedYd3,
    orderYd3,
    bags,
    weightLb,
    weightTons: weightLb !== undefined ? poundsToShortTons(weightLb) : undefined,
    costUsd,
  };
}
