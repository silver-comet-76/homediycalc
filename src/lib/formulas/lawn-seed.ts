import { poundsToKilograms, squareFeetToSquareMeters } from "../units";

/**
 * Lawn Seed Calculator — grass seed weight and bag counts from lawn
 * area and seeding rate, for new lawns and overseeding.
 *
 * Pure functions only. Canonical unit: square feet for area, pounds
 * for seed weight.
 *
 * Reference values (see docs/FORMULAS.md): Penn State Extension rates
 * via yardcalculator.org — tall fescue 6–8, Kentucky bluegrass 2–3,
 * perennial ryegrass 4–5 lb per 1,000 ft²; Bermuda 1–2 lb for
 * warm-season lawns. Overseeding uses about half the new-lawn rate
 * (50–75% per yardcalculator.org; this calculator uses 50%). 1 lb per
 * 1,000 ft² = 4.882 g/m². Rates differ between universities for the
 * same grass, so the rate is a user-supplied input and the bag label
 * governs — never a single invented rate. Bags are the standard US
 * sizes 25 / 10 / 3 lb, mixed greedily to fit the amount needed.
 */

/** Standard US grass-seed bag sizes, largest first. */
export const SEED_BAG_SIZES_LB = [25, 10, 3];

export interface SeedBagBreakdown {
  /** Bag size in pounds. */
  sizeLb: number;
  /** How many bags of this size. */
  count: number;
}

/**
 * Mix standard bag sizes greedily to cover the amount needed:
 * largest size first, as many as fit, then round the remainder up to
 * one more smallest bag. E.g. 38.5 lb → 1 × 25 + 1 × 10 + 2 × 3
 * (41 lb total). Never returns a fractional bag.
 */
export function breakdownBagSizes(
  inputLb: number,
  sizes: number[] = SEED_BAG_SIZES_LB,
): SeedBagBreakdown[] {
  let remaining = inputLb;
  const result: SeedBagBreakdown[] = [];
  for (const size of sizes) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / size);
    if (count > 0) {
      result.push({ sizeLb: size, count });
      remaining -= count * size;
    }
  }
  // Whatever is left (less than the smallest size) rounds up to one
  // more smallest bag. A 1e-9 tolerance keeps floating-point noise
  // from adding a bag when the remainder is really zero.
  if (remaining > 1e-9) {
    const smallest = sizes.at(-1);
    if (smallest === undefined) return result;
    const last = result[result.length - 1];
    if (last && last.sizeLb === smallest) {
      last.count += 1;
    } else {
      result.push({ sizeLb: smallest, count: 1 });
    }
  }
  return result;
}

/** Render a breakdown as "1 × 25 lb + 1 × 10 lb + 2 × 3 lb". */
export function formatBagBreakdown(bags: SeedBagBreakdown[]): string {
  return bags.map((b) => `${b.count} × ${b.sizeLb} lb`).join(" + ");
}

export interface LawnSeedInput {
  /** Lawn area after exclusions, in square feet. */
  netAreaFt2: number;
  /** Seeding rate in lb per 1,000 ft² (user-supplied; bag label governs). */
  rateLbPer1000Ft2: number;
  /** 1 for a new lawn, 0.5 for overseeding. */
  jobFactor: number;
  /** Buffer in percent, e.g. 10 for 10%. */
  bufferPct: number;
  /** Optional price per pound of seed, in USD. */
  pricePerLb?: number;
}

export interface LawnSeedResult {
  /** Lawn area after exclusions, in square feet. */
  netAreaFt2: number;
  /** Lawn area after exclusions, in square meters. */
  netAreaM2: number;
  /** Seed needed, in pounds. */
  seedLb: number;
  /** Seed needed, in kilograms. */
  seedKg: number;
  /** Seed with buffer, in pounds. */
  bufferedLb: number;
  /** Seed with buffer, in kilograms. */
  bufferedKg: number;
  /** Mixed-bag breakdown of the buffered amount. */
  bags: SeedBagBreakdown[];
  /** Total number of bags in the breakdown. */
  bagCount: number;
  /** Total weight of the breakdown, in pounds (what you buy). */
  purchaseLb: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateLawnSeed(input: LawnSeedInput): LawnSeedResult {
  const netAreaFt2 = Math.max(input.netAreaFt2, 0);
  const netAreaM2 = squareFeetToSquareMeters(netAreaFt2);
  const seedLb = (netAreaFt2 / 1000) * input.rateLbPer1000Ft2 * input.jobFactor;
  const seedKg = poundsToKilograms(seedLb);
  const bufferedLb = seedLb * (1 + input.bufferPct / 100);
  const bufferedKg = poundsToKilograms(bufferedLb);
  const bags = breakdownBagSizes(bufferedLb);
  const bagCount = bags.reduce((sum, b) => sum + b.count, 0);
  const purchaseLb = bags.reduce((sum, b) => sum + b.count * b.sizeLb, 0);
  // Cost uses the purchased weight (what you buy), not the exact need.
  const costUsd = input.pricePerLb !== undefined ? purchaseLb * input.pricePerLb : undefined;
  return {
    netAreaFt2,
    netAreaM2,
    seedLb,
    seedKg,
    bufferedLb,
    bufferedKg,
    bags,
    bagCount,
    purchaseLb,
    costUsd,
  };
}
