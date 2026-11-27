import {
  ceilUp,
  cubicFeetToCubicMeters,
  cubicFeetToCubicYards,
  cubicYardsToCubicFeet,
  poundsToKilograms,
  poundsToShortTons,
  squareFeetToSquareMeters,
} from "../units";

/**
 * Sand Calculator — volume and weight of sand for a sandbox, pool base,
 * patio base, or fill, plus bag counts. Same core as the Topsoil
 * Calculator, with sand-type densities instead of a single soil density.
 *
 * Pure functions only. Canonical unit: cubic feet for volume.
 *
 * Reference values (see docs/FORMULAS.md): sand-type densities from
 * getcalcworks.com — play sand 1.35, mason sand 1.40, concrete sand
 * 1.50, fill sand 1.30 tons/yd³ (2,700 / 2,800 / 3,000 / 2,600
 * lb/yd³); dry sand is about 100 lb/ft³ (1,600 kg/m³). Wet sand runs
 * about 10–15% heavier. A 50 lb bag is about 0.5 ft³, so 54 × 50 lb
 * bags fill a cubic yard. The density field defaults to 2,700 lb/yd³
 * (play sand) and is editable; the page states the range.
 */

export interface SandInput {
  volumeFt3: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Bulk density in lb per cubic yard (2,700 for play sand). */
  densityLbYd3: number;
  /** Bag size in cubic feet (0.5 is a 50 lb bag). */
  bagSizeFt3: number;
  /** Optional price per cubic yard (bulk), in USD. */
  pricePerYd3?: number;
  /** Optional price per bag, in USD. */
  pricePerBag?: number;
}

export interface SandResult {
  /** Volume after the allowance, in cubic feet. */
  adjustedFt3: number;
  /** Volume after the allowance, in cubic yards. */
  adjustedYd3: number;
  /** Volume after the allowance, in cubic meters. */
  adjustedM3: number;
  /** Bulk cubic yards to order (rounded up to whole yards). */
  orderYd3: number;
  /** Weight in pounds. */
  weightLb: number;
  /** Weight in US short tons. */
  weightTons: number;
  /** Weight in kilograms. */
  weightKg: number;
  /** Bags to buy (rounded up). */
  bags: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateSand(input: SandInput): SandResult {
  const adjustedFt3 = input.volumeFt3 * (1 + input.wastePct / 100);
  const adjustedYd3 = cubicFeetToCubicYards(adjustedFt3);
  const adjustedM3 = cubicFeetToCubicMeters(adjustedFt3);
  const orderYd3 = ceilUp(adjustedYd3);
  const weightLb = adjustedYd3 * input.densityLbYd3;
  const weightTons = poundsToShortTons(weightLb);
  const weightKg = poundsToKilograms(weightLb);
  const bags = ceilUp(adjustedFt3 / input.bagSizeFt3);
  // A buyer buys bulk OR bags, never both: the bulk price wins when
  // both prices are entered (as in the Topsoil Calculator), and the bulk
  // cost uses the rounded order quantity, not the unrounded volume.
  const costUsd =
    input.pricePerYd3 !== undefined
      ? orderYd3 * input.pricePerYd3
      : input.pricePerBag !== undefined
        ? bags * input.pricePerBag
        : undefined;
  return {
    adjustedFt3,
    adjustedYd3,
    adjustedM3,
    orderYd3,
    weightLb,
    weightTons,
    weightKg,
    bags,
    costUsd,
  };
}

export interface SandCoverageInput {
  /** Sand on hand, in cubic yards. */
  amountYd3: number;
  /** Depth the sand will be spread at, in feet. */
  depthFt: number;
  /** Bulk density in lb per cubic yard (2,700 for play sand). */
  densityLbYd3: number;
}

export interface SandCoverageResult {
  /** Volume on hand, in cubic feet. */
  volumeFt3: number;
  /** Area the amount covers at the given depth, in square feet. */
  areaFt2: number;
  /** Area the amount covers at the given depth, in square meters. */
  areaM2: number;
  /** Weight in pounds. */
  weightLb: number;
  /** Weight in US short tons. */
  weightTons: number;
  /** Weight in kilograms. */
  weightKg: number;
}

/** Reverse mode: how much area does the sand you already have cover? */
export function calculateSandCoverage(input: SandCoverageInput): SandCoverageResult {
  const volumeFt3 = cubicYardsToCubicFeet(input.amountYd3);
  const areaFt2 = volumeFt3 / input.depthFt;
  const areaM2 = squareFeetToSquareMeters(areaFt2);
  const weightLb = input.amountYd3 * input.densityLbYd3;
  const weightTons = poundsToShortTons(weightLb);
  const weightKg = poundsToKilograms(weightLb);
  return {
    volumeFt3,
    areaFt2,
    areaM2,
    weightLb,
    weightTons,
    weightKg,
  };
}
