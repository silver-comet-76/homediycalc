/**
 * Gravel Calculator — volume and weight of gravel for an area at a depth.
 *
 * Pure functions only. Canonical units: feet / cubic feet / cubic yards.
 * Reference density default 2,800 lb/yd³ (1.4 US tons/yd³) is the usual
 * loose, dry figure quoted for general gravel / #57 crushed stone; the
 * published range is roughly 2,400–3,000 lb/yd³ depending on stone type
 * and moisture — see docs/FORMULAS.md. The density field is editable;
 * use your supplier's figure when tonnage has to be exact.
 */

import { cubicFeetToCubicYards, poundsToKilograms, poundsToShortTons, ceilUp } from "../units";

export interface GravelInput {
  lengthFt: number;
  widthFt: number;
  depthFt: number;
  /** Compaction/settling allowance in percent, e.g. 5 for 5%. */
  wastePct: number;
  /** Bulk density in pounds per cubic yard. */
  densityLbPerYd3: number;
  /** Optional bag weight in pounds, for a bag count. */
  bagWeightLb?: number;
  /** Optional price per cubic yard, in USD. */
  pricePerYd3?: number;
}

export interface GravelResult {
  volumeFt3: number;
  volumeYd3: number;
  adjustedYd3: number;
  /** Cubic yards to order (rounded up to whole yards). */
  orderYd3: number;
  weightLb: number;
  weightTons: number;
  weightKg: number;
  /** Bags to buy, only when a bag weight was entered. */
  bags?: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateGravel(input: GravelInput): GravelResult {
  const volumeFt3 = input.lengthFt * input.widthFt * input.depthFt;
  const volumeYd3 = cubicFeetToCubicYards(volumeFt3);
  const factor = 1 + input.wastePct / 100;
  const adjustedYd3 = volumeYd3 * factor;
  const orderYd3 = ceilUp(adjustedYd3);
  const weightLb = adjustedYd3 * input.densityLbPerYd3;
  return {
    volumeFt3,
    volumeYd3,
    adjustedYd3,
    orderYd3,
    weightLb,
    weightTons: poundsToShortTons(weightLb),
    weightKg: poundsToKilograms(weightLb),
    bags: input.bagWeightLb !== undefined ? ceilUp(weightLb / input.bagWeightLb) : undefined,
    costUsd: input.pricePerYd3 !== undefined ? orderYd3 * input.pricePerYd3 : undefined,
  };
}
