import { poundsToKilograms, squareFeetToSquareMeters } from "../units";

/**
 * Lawn Seed Calculator — grass seed weight and bag counts from lawn
 * area and seeding rate, for new lawns and overseeding.
 *
 * Pure functions only. Canonical unit: square feet for area, pounds
 * for seed weight.
 *
 * Rate semantics (B1): the user enters the rate FOR THE JOB THEY
 * PICKED — the bag-label new-lawn rate for a new lawn, the bag-label
 * overseeding rate when overseeding. The calculator applies NO further
 * reduction: a manufacturer overseeding rate is already an overseeding
 * rate, and halving it again would under-seed the lawn. There is no
 * job factor in this module. The job-type choice on the page is a
 * label only; it changes the guidance text, never the arithmetic.
 *
 * Reference values (verified against primary sources 2026-11-27; see
 * docs/FORMULAS.md §30): Penn State Extension, "Lawn Establishment",
 * Table 1 — new lawn: turf-type tall fescue 6–8, Kentucky bluegrass
 * 2–3, perennial ryegrass 4–5, fine fescues 4–5 lb per 1,000 ft²;
 * overseeding/renovation: perennial ryegrass 4–6 (NOT half the
 * new-lawn rate). NC State Extension, "Extension Gardener Handbook",
 * ch. 9, Table 9–4 — tall fescue 6, Kentucky bluegrass 1.5–2,
 * bermudagrass 1–2, zoysiagrass 1–2 lb per 1,000 ft². K-State Research
 * and Extension MF736, "Tall Fescue Lawns" — overseeding tall fescue:
 * 6–8 lb to repair large dead areas, half-rate 3–5 lb to thicken a
 * thin lawn. Scotts Turf Builder Grass Seed Shady Areas Mix label:
 * 3–4 lb per 1,000 ft². 1 lb per 1,000 ft² = 4.882 g/m². Rates differ
 * between universities for the same grass, so the rate is a
 * user-supplied input and the bag label governs — never a single
 * invented rate. Bags are the standard US sizes 25 / 10 / 3 lb.
 */

/** Standard US grass-seed bag sizes, largest first. */
export const SEED_BAG_SIZES_LB = [25, 10, 3];

/**
 * Upper required weight (lb) for the exact least-overbuy bag search.
 * Above this weight `breakdownBagSizes` falls back to the greedy
 * largest-first mix, and `calculateLawnSeed` reports that with
 * `bagsOptimized: false` so the page can label it. 10,000 lb covers
 * about 14 acres at the heaviest listed rate (8 lb per 1,000 ft²) —
 * far above any residential lawn — while keeping the exhaustive
 * search to roughly 200,000 combinations for the standard sizes.
 */
export const BAG_OPTIMIZATION_LIMIT_LB = 10000;

/**
 * Safety net for the exhaustive search: if a non-standard bag-size
 * list ever made the search exceed this many steps, the greedy mix
 * is used instead. The standard 25/10/3 lb sizes never approach it
 * (about 200,000 steps at the 10,000 lb bound).
 */
const MAX_OPTIMIZATION_STEPS = 2000000;

/**
 * Numeric codes for the rate-unit select on the page. Select values
 * must parse as numbers (the shared island stores them that way), so
 * the unit is a code, not a string. 0 is the default when the field
 * is absent (e.g. the lookup-table test, which passes no rate unit).
 */
export const RATE_UNIT_LB_PER_1000_FT2 = 0;
export const RATE_UNIT_G_PER_M2 = 1;

export interface SeedBagBreakdown {
  /** Bag size in pounds. */
  sizeLb: number;
  /** How many bags of this size. */
  count: number;
}

/**
 * Greedy largest-first mix: as many of each size as fit, then the
 * remainder rounded up to one more smallest bag. Used only as the
 * fallback for required weights above BAG_OPTIMIZATION_LIMIT_LB (and
 * if the exhaustive search ever hit its step cap). It does NOT
 * minimize overbuy — e.g. 38.5 lb comes out as 1 × 25 + 1 × 10 +
 * 2 × 3 (41 lb) where the exact search finds 39 lb.
 */
function breakdownBagSizesGreedy(inputLb: number, sizes: number[]): SeedBagBreakdown[] {
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

/**
 * Exhaustive least-overbuy search over the bag sizes, in integer
 * hundredths of a pound (so 38.5 lb is 3850, never a float). Among
 * combinations whose total weight covers the requirement, the winner
 * minimizes (1) total purchased weight, then (2) number of bags,
 * then (3) prefers larger bags (more of the largest size, then more
 * of the next). The search is deterministic: iteration order is
 * fixed and every comparison is explicit, so the same input always
 * returns the same mix. For the standard 25/10/3 lb sizes the
 * (weight, bag count) pair already determines the mix — no two
 * different mixes share both — so tie-break (3) only matters for
 * non-standard size lists. Returns null if the step cap is hit.
 */
function searchOptimalBagMix(sizesHundredths: number[], needHundredths: number): number[] | null {
  const n = sizesHundredths.length;
  const best = { total: Infinity, count: Infinity, counts: [] as number[] };
  const counts = new Array<number>(n).fill(0);
  let steps = 0;

  function isBetter(total: number, count: number, candidate: number[]): boolean {
    if (total < best.total) return true;
    if (total > best.total) return false;
    if (count < best.count) return true;
    if (count > best.count) return false;
    for (let i = 0; i < n; i++) {
      if (candidate[i]! > best.counts[i]!) return true;
      if (candidate[i]! < best.counts[i]!) return false;
    }
    return false;
  }

  function rec(index: number, remaining: number, total: number, count: number): boolean {
    if (++steps > MAX_OPTIMIZATION_STEPS) return false;
    if (index === n - 1) {
      const size = sizesHundredths[index]!;
      const c = remaining > 0 ? Math.ceil(remaining / size) : 0;
      const candidate = [...counts.slice(0, index), c];
      if (isBetter(total + c * size, count + c, candidate)) {
        best.total = total + c * size;
        best.count = count + c;
        best.counts = candidate;
      }
      return true;
    }
    const size = sizesHundredths[index]!;
    const maxCount = Math.ceil(Math.max(remaining, 0) / size);
    for (let c = 0; c <= maxCount; c++) {
      counts[index] = c;
      if (!rec(index + 1, remaining - c * size, total + c * size, count + c)) return false;
    }
    counts[index] = 0;
    return true;
  }

  if (!rec(0, needHundredths, 0, 0)) return null;
  return best.counts;
}

/**
 * Mix standard bag sizes to cover the amount needed, with the least
 * overbuy: for required weights up to BAG_OPTIMIZATION_LIMIT_LB
 * (10,000 lb) every combination is searched (in integer hundredths
 * of a pound) and the winner minimizes total purchased weight, then
 * bag count, then prefers larger bags. E.g. 38.5 lb → 3 × 10 lb +
 * 3 × 3 lb (39 lb total, 6 bags); 19.25 lb → 2 × 10 lb (20 lb).
 * Above 10,000 lb the greedy largest-first mix is used instead (see
 * `breakdownBagSizesGreedy`) — the result is still never less than
 * the amount needed, but it is not guaranteed to be the least
 * overbuy. Never returns a fractional bag; zero or negative input
 * returns no bags.
 */
export function breakdownBagSizes(
  inputLb: number,
  sizes: number[] = SEED_BAG_SIZES_LB,
): SeedBagBreakdown[] {
  if (!(inputLb > 0)) return [];
  const sorted = [...sizes].sort((a, b) => b - a);
  if (inputLb > BAG_OPTIMIZATION_LIMIT_LB) {
    return breakdownBagSizesGreedy(inputLb, sorted);
  }
  // Ceil with a 1e-6 tolerance: binary floating point stores e.g.
  // 7.7 × 100 as 770.0000000000001, which must not buy an extra
  // hundredth of a pound; a genuine requirement can never sit within
  // 1e-6 lb of a hundredth boundary at these magnitudes.
  const needHundredths = Math.ceil(inputLb * 100 - 1e-6);
  const sizesHundredths = sorted.map((s) => Math.round(s * 100));
  const optimal = searchOptimalBagMix(sizesHundredths, needHundredths);
  if (optimal === null) return breakdownBagSizesGreedy(inputLb, sorted);
  return optimal.map((count, i) => ({ sizeLb: sorted[i]!, count })).filter((b) => b.count > 0);
}

/** Render a breakdown as "3 × 10 lb + 3 × 3 lb". */
export function formatBagBreakdown(bags: SeedBagBreakdown[]): string {
  return bags.map((b) => `${b.count} × ${b.sizeLb} lb`).join(" + ");
}

/** How the buyer buys the seed: standard bags, or loose seed by the pound. */
export type LawnSeedPurchaseMethod = "bags" | "bulk";

export interface LawnSeedInput {
  /** Lawn area after exclusions, in square feet. */
  netAreaFt2: number;
  /**
   * Seeding rate in lb per 1,000 ft² FOR THE JOB SELECTED — the
   * bag-label new-lawn rate for a new lawn, the bag-label overseeding
   * rate when overseeding. Used exactly as entered; the calculator
   * applies no job-factor reduction.
   */
  rateLbPer1000Ft2: number;
  /** Buffer in percent, e.g. 10 for 10%. */
  bufferPct: number;
  /** Optional price per pound of seed, in USD. */
  pricePerLb?: number;
  /**
   * Which form the buyer buys. Bags are priced on the purchased bag
   * weight (what you buy); bulk by the pound is priced on the
   * buffered weight (what you buy, with no bag rounding). When
   * absent (older callers), bags are priced — the previous behavior.
   */
  purchaseMethod?: LawnSeedPurchaseMethod;
}

export interface LawnSeedResult {
  /** Lawn area after exclusions, in square feet. */
  netAreaFt2: number;
  /** Lawn area after exclusions, in square meters. */
  netAreaM2: number;
  /** Seeding rate actually used, in lb per 1,000 ft². */
  rateLbPer1000Ft2: number;
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
  /**
   * True when the bag mix came from the exact least-overbuy search
   * (required weight within BAG_OPTIMIZATION_LIMIT_LB); false when
   * the greedy fallback was used.
   */
  bagsOptimized: boolean;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateLawnSeed(input: LawnSeedInput): LawnSeedResult {
  const netAreaFt2 = Math.max(input.netAreaFt2, 0);
  const netAreaM2 = squareFeetToSquareMeters(netAreaFt2);
  const seedLb = (netAreaFt2 / 1000) * input.rateLbPer1000Ft2;
  const seedKg = poundsToKilograms(seedLb);
  const bufferedLb = seedLb * (1 + input.bufferPct / 100);
  const bufferedKg = poundsToKilograms(bufferedLb);
  const bags = breakdownBagSizes(bufferedLb);
  const bagCount = bags.reduce((sum, b) => sum + b.count, 0);
  const purchaseLb = bags.reduce((sum, b) => sum + b.count * b.sizeLb, 0);
  const bagsOptimized = bufferedLb <= BAG_OPTIMIZATION_LIMIT_LB;
  // Cost follows the purchase method: bags are priced on the purchased
  // bag weight (what you buy), bulk by the pound on the buffered weight
  // (what you buy, with no bag rounding). A buyer buys bags OR bulk,
  // never both.
  const costUsd =
    input.pricePerLb === undefined
      ? undefined
      : input.purchaseMethod === "bulk"
        ? bufferedLb * input.pricePerLb
        : purchaseLb * input.pricePerLb;
  return {
    netAreaFt2,
    netAreaM2,
    rateLbPer1000Ft2: input.rateLbPer1000Ft2,
    seedLb,
    seedKg,
    bufferedLb,
    bufferedKg,
    bags,
    bagCount,
    purchaseLb,
    bagsOptimized,
    costUsd,
  };
}
