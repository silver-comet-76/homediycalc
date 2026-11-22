import { ceilUp, CUBIC_INCHES_PER_CUBIC_FOOT, SQUARE_INCHES_PER_SQUARE_FOOT } from "../units";
import { isStandardDimensions, isStandardJoint, UNIT_PRESETS, type MortarBagBasis } from "./mortar";

/**
 * Brick Calculator — brick and mortar counts for a wall.
 *
 * Pure functions only. Canonical units: feet for wall dimensions, inches
 * for brick size and mortar joint.
 *
 * Reference values (Brick Industry Association, Technical Note 10,
 * "Dimensioning and Estimating Brick Masonry", February 2009 — see
 * docs/FORMULAS.md): US modular brick 7⅝ in × 2¼ in × 3⅝ in with a
 * ⅜ in mortar joint. Face-area method: bricks per ft² =
 * 144 ÷ ((length + joint) × (height + joint)) = 6.86/ft² for modular.
 * BIA's own coursing table lists 675 bricks per 100 ft² (6.75/ft²) for
 * the same brick, because three courses rise exactly 8 in; the two
 * figures differ by 1.6% and the page notes both. Mortar volume uses the
 * geometric joint volume, which for modular brick gives 8.06 ft³ per
 * 1,000 bricks — BIA TN10 Table 4 lists 8.1 ft³. Mortar volume is
 * computed from the pre-waste brick count (brick waste is breakage, not
 * extra joints) with only the mortar waste allowance applied, so it
 * agrees with the Mortar Calculator for the same wall.
 *
 * Mortar bags — manufacturer count rating governs (ADR-11, PR #2
 * review response), but only for the geometry the rating applies to
 * (ADR-12, second re-review). The QUIKRETE Mortar Mix No. 1102 data
 * sheet states only a count rating — "each 80 lb bag will lay up to
 * 37 standard bricks" — and states NO cubic-foot yield per bag and NO
 * waste allowance, so this calculator claims no volumetric bag yield
 * for the product. (The 0.6 ft³/bag figure used before this fix is not
 * on the data sheet; it is removed.) The rating is a maximum ("up
 * to"), so the bag count must satisfy both constraints and the larger
 * governs:
 *   1. the bricks you buy: bricksNeeded ÷ bricks per bag (576 ÷ 37 = 16
 *      for the worked example — the reviewer's stated minimum); and
 *   2. the waste-adjusted mortar need: installed bricks × (1 + mortar
 *      waste) ÷ bricks per bag (549 × 1.15 ÷ 37 = 18).
 * Waste is counted exactly once per material: brick breakage (5%) is in
 * the brick count only — broken bricks are never laid, so they take no
 * mortar — and the mortar waste allowance (15%) derates the rating
 * only. At the rating's implied yield (37 bricks × 0.00806 ft³ per
 * brick ≈ 0.30 ft³ per bag), 18 bags provide ≈ 5.37 ft³, covering the
 * 5.09 ft³ waste-adjusted volume; the old volume figure of 9 bags
 * (5.09 ÷ 0.6) undercut the manufacturer maximum and is gone.
 *
 * The rating applies only to standard geometry: modular brick
 * (7⅝ × 2¼ × 3⅝ in) at the standard ⅜ in joint or narrower, within
 * a 1% tolerance that absorbs metric rounding (9.5 mm, 194 × 57 ×
 * 92 mm). A wider joint needs more mortar per brick while fitting
 * fewer bricks per ft², so the count-based figure falls exactly as
 * the mortar volume rises (80 ft² wall, 15% mortar waste: ⅜ in
 * joint → 5.09 ft³ and 18 bags; ¾ in joint → 8.82 ft³ but only 15
 * bags) — the rating does not apply there, and neither does it for
 * non-modular brick sizes. For such geometry the bag count comes
 * from a verified user-entered yield (ft³ per bag, from the bag's
 * own data sheet): bags = waste-adjusted mortar volume ÷ yield.
 * With no yield entered, no bag count, bag cost, or shopping-list
 * bag line is shown. A narrower joint is safe, not a problem: it
 * uses no more mortar per brick than the standard case, so the
 * rating stays a conservative basis (¼ in joint → 3.58 ft³, 19
 * bags, still covering the volume at the rating's implied yield).
 *
 * Partial cost (Phase 8, Issue #3): when the bag count is unknown,
 * the cost is built per component. A mortar price alone buys no
 * countable quantity, so the total is suppressed — never $0. A brick
 * price still buys a known brick count, so that figure is shown but
 * flagged partial: it covers bricks only and excludes mortar.
 */

export interface BrickInput {
  wallLengthFt: number;
  wallHeightFt: number;
  /** Total area of doors/windows/openings, in square feet. */
  openingsFt2: number;
  brickLengthIn: number;
  brickHeightIn: number;
  brickDepthIn: number;
  /** Mortar joint width in inches. */
  jointIn: number;
  /** Waste allowance for bricks in percent, e.g. 5 for 5%. */
  wastePct: number;
  /** Waste allowance for mortar in percent (BIA suggests 15–25%). */
  mortarWastePct: number;
  /** Standard bricks laid by one 80 lb bag of mortar mix (QUIKRETE: 37). Applies only at standard geometry (see below). */
  bricksPerMortarBag: number;
  /**
   * Verified bag yield in ft³ per 80 lb bag, from the bag's own data
   * sheet. Only used when the manufacturer count rating does not
   * apply (non-modular brick size or a joint wider than the standard
   * ⅜ in). No default — no volumetric yield is claimed for the product.
   */
  bagYieldFt3?: number;
  /** Optional bricks per pallet, for a pallet count. */
  palletSize?: number;
  /** Optional price per brick, in USD. */
  pricePerBrick?: number;
  /** Optional price per 80 lb bag of mortar mix, in USD. */
  pricePerMortarBag?: number;
}

export interface BrickResult {
  grossAreaFt2: number;
  netAreaFt2: number;
  /** Face area of one brick including its mortar joint, in square inches. */
  faceAreaPerBrickIn2: number;
  bricksPerFt2: number;
  /** Bricks to buy (rounded up, waste included). */
  bricksNeeded: number;
  /** Mortar volume in cubic feet (waste included). */
  mortarVolumeFt3: number;
  /**
   * 80 lb bags of mortar mix to buy (rounded up, waste included), or
   * null when the bag count is unknown: the rating does not apply to
   * this geometry and no verified yield was entered.
   */
  mortarBags: number | null;
  /**
   * Bags for the bricks you buy at the manufacturer maximum
   * (bricksNeeded ÷ bricks per bag, no extra waste) — the floor the
   * recommendation never goes below — or null when the rating does
   * not apply.
   */
  mortarBagsByRating: number | null;
  /** Where the bag count came from (null = no bag count shown). */
  mortarBagsBasis: MortarBagBasis;
  /** Pallets to buy, only when a pallet size was entered. */
  pallets?: number;
  /**
   * Cost in USD, only when a price was entered. When the mortar
   * quantity is unknown (rating does not apply, no verified yield)
   * and only a mortar price was entered, there is no cost to show —
   * this is undefined, never 0.
   */
  costUsd?: number;
  /**
   * True when costUsd covers bricks only because the mortar quantity
   * is unknown: a brick price was entered but no bag count exists, so
   * no mortar cost could be added. The UI must label it a partial
   * cost and say it excludes mortar — never present it as a total.
   */
  costPartial: boolean;
}

export function calculateBrick(input: BrickInput): BrickResult {
  const grossAreaFt2 = input.wallLengthFt * input.wallHeightFt;
  const netAreaFt2 = Math.max(0, grossAreaFt2 - input.openingsFt2);
  const faceAreaPerBrickIn2 =
    (input.brickLengthIn + input.jointIn) * (input.brickHeightIn + input.jointIn);
  const bricksPerFt2 = SQUARE_INCHES_PER_SQUARE_FOOT / faceAreaPerBrickIn2;
  const bricksNeeded = ceilUp(netAreaFt2 * bricksPerFt2 * (1 + input.wastePct / 100));
  // Mortar per brick: the joint volume around one brick (bed + head joint).
  const mortarPerBrickIn3 =
    (faceAreaPerBrickIn2 - input.brickLengthIn * input.brickHeightIn) * input.brickDepthIn;
  // Mortar volume comes from the pre-waste brick count: brick waste is
  // breakage, not extra joints, so inflating the brick count first and
  // then applying mortar waste would count the waste twice. The mortar
  // waste allowance is applied once, here — the same calculation the
  // Mortar Calculator performs, so the two agree for the same wall.
  const bricksBeforeWaste = ceilUp(netAreaFt2 * bricksPerFt2);
  const mortarVolumeFt3 =
    ((bricksBeforeWaste * mortarPerBrickIn3) / CUBIC_INCHES_PER_CUBIC_FOOT) *
    (1 + input.mortarWastePct / 100);
  // Primary method: the manufacturer count rating, which must satisfy
  // both constraints — the bricks you buy, and the waste-adjusted
  // mortar need — with the larger governing. The rating is a maximum
  // ("up to 37") with no waste allowance stated on the data sheet, so
  // the mortar waste allowance derates it; brick breakage is not
  // counted again (broken bricks take no mortar). But the rating
  // applies only to standard geometry (ADR-12): modular brick at the
  // standard ⅜ in joint or narrower. A wider joint or a non-modular
  // brick makes the count-based figure fall as the mortar volume
  // rises, so the rating must not be used there: with a verified
  // user-entered yield, bags = waste-adjusted volume ÷ yield;
  // without one, no bag count is given at all.
  const ratingApplies =
    isStandardDimensions(
      {
        lengthIn: input.brickLengthIn,
        heightIn: input.brickHeightIn,
        depthIn: input.brickDepthIn,
      },
      UNIT_PRESETS.brick,
    ) && isStandardJoint(input.jointIn);
  let mortarBags: number | null;
  let mortarBagsByRating: number | null;
  let mortarBagsBasis: MortarBagBasis;
  if (ratingApplies) {
    mortarBagsByRating = ceilUp(bricksNeeded / input.bricksPerMortarBag);
    mortarBags = Math.max(
      mortarBagsByRating,
      ceilUp((bricksBeforeWaste * (1 + input.mortarWastePct / 100)) / input.bricksPerMortarBag),
    );
    mortarBagsBasis = "rating";
  } else if (input.bagYieldFt3 !== undefined && input.bagYieldFt3 > 0) {
    mortarBagsByRating = null;
    mortarBags = ceilUp(mortarVolumeFt3 / input.bagYieldFt3);
    mortarBagsBasis = "user-yield";
  } else {
    mortarBagsByRating = null;
    mortarBags = null;
    mortarBagsBasis = null;
  }
  // Cost is built per component so an unknown quantity never becomes
  // a $0 total: with no bag count, a mortar price alone buys nothing
  // countable, so the total is suppressed (undefined); a brick price
  // still buys a known brick count, so that figure is shown but
  // flagged partial — it excludes mortar.
  const brickCost =
    input.pricePerBrick !== undefined ? bricksNeeded * input.pricePerBrick : undefined;
  const mortarCost =
    input.pricePerMortarBag !== undefined && mortarBags !== null
      ? mortarBags * input.pricePerMortarBag
      : undefined;
  const costUsd =
    brickCost !== undefined || mortarCost !== undefined
      ? (brickCost ?? 0) + (mortarCost ?? 0)
      : undefined;
  const costPartial = mortarBags === null && brickCost !== undefined;
  return {
    grossAreaFt2,
    netAreaFt2,
    faceAreaPerBrickIn2,
    bricksPerFt2,
    bricksNeeded,
    mortarVolumeFt3,
    mortarBags,
    mortarBagsByRating,
    mortarBagsBasis,
    pallets: input.palletSize !== undefined ? ceilUp(bricksNeeded / input.palletSize) : undefined,
    costUsd,
    costPartial,
  };
}
