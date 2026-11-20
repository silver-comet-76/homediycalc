import { ceilUp, cubicFeetToCubicYards } from "../units";
import { CONCRETE_BAG_YIELDS_FT3 } from "./concrete";

/**
 * Concrete Bags Calculator — bag counts for a target volume.
 *
 * Bag-first, unlike the Concrete Calculator (volume-first, ready-mix
 * focused): the user enters a volume, or dimensions, and gets the
 * shopping list of bags for each bag size. Pure functions only.
 * Canonical unit: cubic feet for volume.
 *
 * Bag yields are the confirmed QUIKRETE Concrete Mix No. 1101 figures
 * (see docs/FORMULAS.md, Phase 2 table): 40 lb = 0.30 ft³,
 * 60 lb = 0.45 ft³, 80 lb = 0.60 ft³.
 */

export interface ConcreteBagsInput {
  volumeFt3: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per 40 lb bag, in USD. */
  pricePerBag40?: number;
  /** Optional price per 60 lb bag, in USD. */
  pricePerBag60?: number;
  /** Optional price per 80 lb bag, in USD. */
  pricePerBag80?: number;
}

export interface ConcreteBagsResult {
  volumeYd3: number;
  /** Volume after the waste allowance, in cubic feet. */
  adjustedFt3: number;
  /** Volume after the waste allowance, in cubic yards. */
  adjustedYd3: number;
  /** 40 lb bags to buy (rounded up). */
  bags40: number;
  /** 60 lb bags to buy (rounded up). */
  bags60: number;
  /** 80 lb bags to buy (rounded up). */
  bags80: number;
  /** Cost of the cheapest priced bag-size option, in USD (undefined when no price entered). */
  costUsd?: number;
  /** Bag size of the cheapest priced option, e.g. "80 lb". */
  cheapestSize?: string;
}

export function calculateConcreteBags(input: ConcreteBagsInput): ConcreteBagsResult {
  const volumeYd3 = cubicFeetToCubicYards(input.volumeFt3);
  const adjustedFt3 = input.volumeFt3 * (1 + input.wastePct / 100);
  const adjustedYd3 = cubicFeetToCubicYards(adjustedFt3);
  const bags40 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[40]);
  const bags60 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[60]);
  const bags80 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[80]);
  const options: { size: string; cost: number }[] = [];
  if (input.pricePerBag40 !== undefined) {
    options.push({ size: "40 lb", cost: bags40 * input.pricePerBag40 });
  }
  if (input.pricePerBag60 !== undefined) {
    options.push({ size: "60 lb", cost: bags60 * input.pricePerBag60 });
  }
  if (input.pricePerBag80 !== undefined) {
    options.push({ size: "80 lb", cost: bags80 * input.pricePerBag80 });
  }
  const cheapest =
    options.length > 0
      ? options.reduce((best, option) => (option.cost < best.cost ? option : best))
      : undefined;
  return {
    volumeYd3,
    adjustedFt3,
    adjustedYd3,
    bags40,
    bags60,
    bags80,
    costUsd: cheapest?.cost,
    cheapestSize: cheapest?.size,
  };
}
