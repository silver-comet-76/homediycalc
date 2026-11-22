/**
 * Concrete Calculator — general concrete volume for any pour.
 *
 * Pure functions only. Canonical units: feet / cubic feet / cubic yards.
 * Bag yields are the QUIKRETE Concrete Mix No. 1101 data sheet figures
 * (see docs/FORMULAS.md): 40 lb = 0.30 ft³, 60 lb = 0.45 ft³,
 * 80 lb = 0.60 ft³ per bag. Ready-mix ordering rounds up to the next
 * quarter cubic yard by default (the usual supplier increment); the user
 * can switch to whole yards.
 */

import { cubicFeetToCubicYards, ceilUp } from "../units";

/** Mixed-concrete yield per bag, in cubic feet (QUIKRETE No. 1101). */
export const CONCRETE_BAG_YIELDS_FT3 = { 40: 0.3, 60: 0.45, 80: 0.6 } as const;

export interface ConcreteInput {
  lengthFt: number;
  widthFt: number;
  depthFt: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Round the ready-mix order up to the next quarter yard (default) or whole yard. */
  quarterYardRounding: boolean;
  /** Optional price per cubic yard of ready-mix, in USD. */
  pricePerYd3?: number;
  /** Optional price per 80 lb bag, in USD. */
  pricePerBag80?: number;
}

export interface ConcreteResult {
  volumeFt3: number;
  volumeYd3: number;
  adjustedFt3: number;
  adjustedYd3: number;
  /** Ready-mix order quantity, rounded up to the supplier increment. */
  orderYd3: number;
  bags80: number;
  bags60: number;
  bags40: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

/** Round a cubic-yard quantity up to the next quarter yard. */
export function roundUpToQuarterYard(cubicYards: number): number {
  return ceilUp(cubicYards * 4) / 4;
}

export function calculateConcrete(input: ConcreteInput): ConcreteResult {
  const volumeFt3 = input.lengthFt * input.widthFt * input.depthFt;
  const volumeYd3 = cubicFeetToCubicYards(volumeFt3);
  const factor = 1 + input.wastePct / 100;
  const adjustedFt3 = volumeFt3 * factor;
  const adjustedYd3 = volumeYd3 * factor;
  const orderYd3 = input.quarterYardRounding
    ? roundUpToQuarterYard(adjustedYd3)
    : ceilUp(adjustedYd3);
  const bags80 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[80]);
  const bags60 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[60]);
  const bags40 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[40]);
  const costUsd =
    input.pricePerYd3 !== undefined
      ? orderYd3 * input.pricePerYd3
      : input.pricePerBag80 !== undefined
        ? bags80 * input.pricePerBag80
        : undefined;
  return {
    volumeFt3,
    volumeYd3,
    adjustedFt3,
    adjustedYd3,
    orderYd3,
    bags80,
    bags60,
    bags40,
    costUsd,
  };
}
