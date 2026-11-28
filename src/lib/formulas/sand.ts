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
 * Reference values (see docs/FORMULAS.md): dry sand is about
 * 100 lb/ft³ (2,700 lb/yd³, 1,600 kg/m³) — the figure implied by
 * QUIKRETE's 50 lb bag yielding about 0.5 ft³ (QUIKRETE Premium Play
 * Sand, bag label and product listing) — and loose sand generally runs
 * 2,630–2,960 lb/yd³ (Missouri DOT, Engineering Policy Guide,
 * Highway Maintenance Tables and Conversion Factors). Damp sand runs
 * about 10–15% heavier than dry sand and wet sand up to about 20%
 * heavier (Engineering ToolBox, Ditch Filling Materials — Densities:
 * dry 100, ordinary damp 115, wet 120 lb/ft³). A 50 lb bag is about
 * 0.5 ft³, so 54 × 50 lb bags fill a cubic yard. The density field
 * defaults to 2,700 lb/yd³ (dry play sand) and is editable; the page
 * states the range. Sand types differ mainly in grain size and use,
 * not in a fixed weight — no per-type density is assumed.
 *
 * Three weights are returned and must never be confused: the weight of
 * the material required (unrounded volume after waste), the weight of
 * the rounded bulk purchase quantity (whole yards ordered), and the
 * estimated weight of the bagged purchase quantity (bags ordered). The
 * bulk order weight is always >= the requirement weight; the bagged
 * weight equals the bulk order weight only when the requirement is
 * already a whole number of yards, and is otherwise less, because the
 * bags cover the requirement (rounded up to whole bags) while the bulk
 * order rounds up to whole yards. The bagged weight is a density-based
 * estimate: bags × bag size ÷ 27 × density. The actual bagged weight
 * depends on the bag's stated weight — a 50 lb bag is about 0.5 ft³,
 * so 74 × 50 lb = 3,700 lb, consistent with the estimate for the QA
 * example below.
 */

/** How the buyer buys the sand: whole cubic yards in bulk, or bags. */
export type SandPurchaseMethod = "bulk" | "bags";

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
  /**
   * Which form the buyer buys. The cost follows the chosen form and
   * only that form's price: bulk is priced per cubic yard, bags per
   * bag. When absent (older callers), the legacy rule applies — the
   * bulk price wins when both are entered, otherwise whichever price
   * is present — so existing callers keep their cost.
   */
  purchaseMethod?: SandPurchaseMethod;
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
  /** Weight of the material required, in pounds (unrounded volume). */
  weightLb: number;
  /** Weight of the material required, in US short tons. */
  weightTons: number;
  /** Weight of the material required, in kilograms. */
  weightKg: number;
  /** Weight of the rounded order, in pounds (orderYd3 × density). */
  orderWeightLb: number;
  /** Weight of the rounded order, in US short tons. */
  orderWeightTons: number;
  /** Weight of the rounded order, in kilograms. */
  orderWeightKg: number;
  /** Bags to buy (rounded up). */
  bags: number;
  /**
   * Estimated weight of the bagged order, in pounds
   * (bags × bag size ÷ 27 × density). A density-based estimate: the
   * actual weight depends on the bag's stated weight (a 50 lb bag is
   * about 0.5 ft³). Equals the bulk order weight only at exact
   * whole-yard boundaries.
   */
  baggedWeightLb: number;
  /** Estimated weight of the bagged order, in US short tons. */
  baggedWeightTons: number;
  /** Estimated weight of the bagged order, in kilograms. */
  baggedWeightKg: number;
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
  // Weight of the rounded purchase quantity, not of the requirement:
  // the buyer hauls and pays for whole yards, so the order weight is
  // what the truck carries. It equals the requirement weight only when
  // the requirement is already a whole number of yards.
  const orderWeightLb = orderYd3 * input.densityLbYd3;
  const orderWeightTons = poundsToShortTons(orderWeightLb);
  const orderWeightKg = poundsToKilograms(orderWeightLb);
  const bags = ceilUp(adjustedFt3 / input.bagSizeFt3);
  // Estimated weight of the bagged order: the bags cover the
  // requirement (rounded up to whole bags), so this is the volume the
  // bags actually hold — bags × bag size, converted to cubic yards —
  // times the density. It is a density-based estimate, not the weight
  // printed on the bags; the bag's stated weight governs. Because it
  // is derived from the bag count, it is 0 when no bags are bought
  // (zero or negative volume), just like the bag count itself.
  const baggedWeightLb = cubicFeetToCubicYards(bags * input.bagSizeFt3) * input.densityLbYd3;
  const baggedWeightTons = poundsToShortTons(baggedWeightLb);
  const baggedWeightKg = poundsToKilograms(baggedWeightLb);
  // A buyer buys bulk OR bags, never both. When the purchase method
  // is chosen, only that form's price applies: the bulk cost uses the
  // rounded order quantity, the bag cost uses the bag count, and no
  // cost is shown when the chosen form has no price — the other
  // form's price never silently prices this one. When no method is
  // given (older callers), the legacy rule applies: the bulk price
  // wins when both prices are entered, otherwise whichever price is
  // present.
  const bulkCost = input.pricePerYd3 !== undefined ? orderYd3 * input.pricePerYd3 : undefined;
  const bagCost = input.pricePerBag !== undefined ? bags * input.pricePerBag : undefined;
  const costUsd =
    input.purchaseMethod === "bags"
      ? bagCost
      : input.purchaseMethod === "bulk"
        ? bulkCost
        : (bulkCost ?? bagCost);
  return {
    adjustedFt3,
    adjustedYd3,
    adjustedM3,
    orderYd3,
    weightLb,
    weightTons,
    weightKg,
    orderWeightLb,
    orderWeightTons,
    orderWeightKg,
    bags,
    baggedWeightLb,
    baggedWeightTons,
    baggedWeightKg,
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
  /** Weight of the sand on hand, in pounds (amount × density). */
  weightLb: number;
  /** Weight of the sand on hand, in US short tons. */
  weightTons: number;
  /** Weight of the sand on hand, in kilograms. */
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
