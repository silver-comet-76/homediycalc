import { ceilUp, cubicFeetToCubicMeters, cubicFeetToCubicYards } from "../units";

/**
 * Raised Garden Bed Soil Calculator — soil volume for contained raised
 * beds, with a mix split, a settling allowance, and bag counts.
 *
 * Pure functions only. Canonical unit: cubic feet for volume.
 *
 * Reference values (see docs/FORMULAS.md): the 60/30/10 mix (topsoil /
 * compost / perlite or coarse sand) is one example from Univ. of
 * Illinois Extension's raised-bed checklist — not a universal
 * prescription (Univ. of Maryland Extension and Iowa State publish
 * different starting points) — so the three proportions are
 * user-editable and are normalized so they always add to 100%. A
 * freshly filled bed settles — UF/IFAS Extension says the level may
 * drop by about 2 in — and keeps shrinking, so it is topped up after
 * each planting season. Fill depth is the soil depth, not the bed
 * height: 8–12 in for most vegetables, 12–24 in for tomatoes, peppers,
 * and squash (Univ. of Maryland Extension). Bag sizes of 1.5 and
 * 2 ft³ are common.
 */

/** How the buyer buys the soil: premixed in bulk or in bags, or the mix components separately to mix at home. */
export type RaisedBedSoilPurchaseMethod = "bulk" | "bags" | "components";

export interface RaisedBedSoilInput {
  /** Net soil volume before the settling allowance, in cubic feet. */
  soilFt3: number;
  /** First-season settling allowance in percent, e.g. 10 for 10%. */
  settlingPct: number;
  /** Mix proportions — normalized so they always add to 100%. */
  topsoilPct: number;
  compostPct: number;
  aerationPct: number;
  /** Bag size in cubic feet (2 is common). */
  bagSizeFt3: number;
  /** Optional price per cubic yard (bulk premixed soil), in USD. */
  pricePerYd3?: number;
  /** Optional price per bag (premixed soil), in USD. */
  pricePerBag?: number;
  /**
   * Which form the buyer buys. The cost follows the chosen form and
   * only that form's price. Buying the components separately has no
   * cost here — the parts carry no prices. When absent (older
   * callers), the legacy rule applies: the bulk price wins when both
   * are entered, otherwise whichever price is present.
   */
  purchaseMethod?: RaisedBedSoilPurchaseMethod;
}

export interface RaisedBedSoilResult {
  /** Net soil volume before the settling allowance, in cubic feet. */
  soilFt3: number;
  /** Volume to order after the settling allowance, in cubic feet. */
  orderedFt3: number;
  /** Volume to order after the settling allowance, in cubic yards. */
  orderedYd3: number;
  /** Volume to order after the settling allowance, in cubic meters. */
  orderedM3: number;
  /** Bulk cubic yards to order (rounded up to whole yards). */
  orderYd3: number;
  /** Bags to buy (rounded up). */
  bags: number;
  /** Mix parts of the ordered volume, in cubic feet. */
  topsoilFt3: number;
  compostFt3: number;
  aerationFt3: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateRaisedBedSoil(input: RaisedBedSoilInput): RaisedBedSoilResult {
  const orderedFt3 = input.soilFt3 * (1 + input.settlingPct / 100);
  const orderedYd3 = cubicFeetToCubicYards(orderedFt3);
  const orderedM3 = cubicFeetToCubicMeters(orderedFt3);
  const orderYd3 = ceilUp(orderedYd3);
  const bags = ceilUp(orderedFt3 / input.bagSizeFt3);
  // The mix proportions are normalized so they always add to 100% —
  // a user who enters 50/30/10 gets the 50/90, 30/90, 10/90 split.
  // All three at zero means no mix at all, not a division by zero.
  const total = input.topsoilPct + input.compostPct + input.aerationPct;
  const topsoilFt3 = total > 0 ? (orderedFt3 * input.topsoilPct) / total : 0;
  const compostFt3 = total > 0 ? (orderedFt3 * input.compostPct) / total : 0;
  const aerationFt3 = total > 0 ? (orderedFt3 * input.aerationPct) / total : 0;
  // A buyer buys bulk OR bags, never both — or the mix components
  // separately instead of premixed soil. When the purchase method is
  // chosen, only that form's price applies: the bulk cost uses the
  // rounded order quantity, the bag cost uses the bag count, and the
  // components have no prices, so no cost is shown for them. When no
  // method is given (older callers), the legacy rule applies: the bulk
  // price wins when both prices are entered, otherwise whichever
  // price is present.
  const bulkCost = input.pricePerYd3 !== undefined ? orderYd3 * input.pricePerYd3 : undefined;
  const bagCost = input.pricePerBag !== undefined ? bags * input.pricePerBag : undefined;
  const costUsd =
    input.purchaseMethod === "bags"
      ? bagCost
      : input.purchaseMethod === "components"
        ? undefined
        : input.purchaseMethod === "bulk"
          ? bulkCost
          : (bulkCost ?? bagCost);
  return {
    soilFt3: input.soilFt3,
    orderedFt3,
    orderedYd3,
    orderedM3,
    orderYd3,
    bags,
    topsoilFt3,
    compostFt3,
    aerationFt3,
    costUsd,
  };
}
