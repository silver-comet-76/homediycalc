import {
  ceilUp,
  cubicFeetToCubicMeters,
  cubicFeetToCubicYards,
  poundsToKilograms,
  poundsToShortTons,
} from "../units";

/**
 * Topsoil Calculator — volume and weight of topsoil for a lawn or bed.
 *
 * Pure functions only. Canonical unit: cubic feet for volume.
 *
 * Reference values (see docs/FORMULAS.md, Phase 3 table): there is no
 * single confirmed weight for a cubic yard of topsoil — it runs about
 * 2,000–3,400 lb/yd³ depending on texture and moisture, with about
 * 2,000 lb/yd³ for loose, dry screened topsoil and about 2,400 lb/yd³
 * as a common planning figure. The density field defaults to
 * 2,000 lb/yd³ and is editable; the page states the range. Bagged
 * topsoil is commonly sold in 0.75 ft³ bags (Scotts Premium Topsoil),
 * but bag sizes vary from about 0.5 to 2 ft³, so the bag size is
 * editable too.
 */

export interface TopsoilInput {
  volumeFt3: number;
  /** Settling/uneven-ground allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Bulk density in lb per cubic yard (2,000 loose and dry). */
  densityLbYd3: number;
  /** Bag size in cubic feet (0.75 is common). */
  bagSizeFt3: number;
  /** Optional price per cubic yard (bulk), in USD. */
  pricePerYd3?: number;
  /** Optional price per bag, in USD. */
  pricePerBag?: number;
}

export interface TopsoilResult {
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

export function calculateTopsoil(input: TopsoilInput): TopsoilResult {
  const adjustedFt3 = input.volumeFt3 * (1 + input.wastePct / 100);
  const adjustedYd3 = cubicFeetToCubicYards(adjustedFt3);
  const adjustedM3 = cubicFeetToCubicMeters(adjustedFt3);
  const orderYd3 = ceilUp(adjustedYd3);
  const weightLb = adjustedYd3 * input.densityLbYd3;
  const weightTons = poundsToShortTons(weightLb);
  const weightKg = poundsToKilograms(weightLb);
  const bags = ceilUp(adjustedFt3 / input.bagSizeFt3);
  // A buyer buys bulk OR bags, never both: the bulk price wins when
  // both prices are entered (as in the Mulch Calculator), and the bulk
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
