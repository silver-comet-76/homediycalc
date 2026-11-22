import { ceilUp, CUBIC_INCHES_PER_CUBIC_FOOT, SQUARE_INCHES_PER_SQUARE_FOOT } from "../units";

/**
 * Mortar Calculator — mortar volume and bags for brick or block walls,
 * with a site-mix breakdown.
 *
 * Mortar-first, unlike the Brick Calculator (which counts bricks and
 * reports mortar as a secondary output): the user enters a wall area
 * and gets the mortar volume, bag count, and — for site mixing — the
 * cement, lime, and sand parts. Pure functions only. Canonical units:
 * square feet for area, inches for unit size and joint.
 *
 * Reference values (see docs/FORMULAS.md, Phase 3 table):
 * - Mortar volume is the geometric joint volume around each unit. For
 *   a modular brick (7⅝ × 2¼ × 3⅝ in, ⅜ in joint) this gives 8.06 ft³
 *   per 1,000 bricks — the Brick Industry Association Technical Note
 *   10 Table 4 lists 8.1 ft³. BIA recommends adding 15–25% for mortar
 *   waste (default 15% here).
 * - Bag count: the manufacturer count rating governs (ADR-11, PR #2
 *   review response) — but only for the geometry the rating applies
 *   to (ADR-12, second re-review). QUIKRETE Mortar Mix No. 1102 is
 *   rated at up to 37 standard bricks or 13 standard 8 × 8 × 16
 *   blocks per 80 lb bag, and its data sheet states NO cubic-foot
 *   yield per bag and NO waste allowance — so this calculator claims
 *   no volumetric bag yield for the product (the 0.6 ft³/bag figure
 *   used before this fix is not on the data sheet; it is removed).
 *   The rating is a maximum ("up to"), so the waste allowance
 *   derates it: bags = installed units × (1 + waste%) ÷ units per
 *   bag — when the joint is the standard ⅜ in or narrower. A wider
 *   joint needs more mortar per unit while fitting fewer units per
 *   ft², so the count-based figure falls exactly as the mortar
 *   volume rises (80 ft² modular wall, 15% waste: ⅜ in joint →
 *   5.09 ft³ and 18 bags; ¾ in joint → 8.82 ft³ but only 15 bags).
 *   The rating therefore does not apply to wider joints, and no bag
 *   count, bag cost, or shopping-list bag line is shown for them
 *   unless the user enters a verified bag yield (ft³ per bag), from
 *   which bags = waste-adjusted volume ÷ yield. The mortar volume
 *   (geometric joint volume, BIA-corroborated) still feeds the
 *   site-mix parts in every case.
 * - Mix ratios are the ASTM C270 proportion specification, by volume:
 *   Type N 1:1:6, Type S 1:½:4½, Type M 1:¼:3¾, Type O 1:2:9
 *   (cement : lime : sand). C270 specifies sand at 2¼–3× the
 *   cementitious volume, and the ratios above use the 3× end.
 *   The site-mix parts are NOT shares of the mortar volume: dry volumes
 *   do not add up to the mixed volume, because the cement and lime fill
 *   the voids between sand grains. They use the ASTM C270 batch yields
 *   (ft³ of each ingredient per ft³ of mortar): Type N 0.17 / 0.17 / 1.0,
 *   Type S 0.22 / 0.11 / 1.0, Type M 0.33 / 0.08 / 1.0, Type O 0.11 /
 *   0.22 / 1.0 (cement / lime / sand) — see MORTAR_MIX_YIELDS_FT3_PER_FT3.
 *   A 94 lb sack of portland cement is about 1 ft³.
 */

export type MasonryUnit = "brick" | "block";

export type MortarType = "N" | "S" | "M" | "O";

/** Dimensions of one masonry unit, in inches. */
export interface UnitDimensions {
  lengthIn: number;
  heightIn: number;
  depthIn: number;
}

/** Actual dimensions of the two supported units. */
export const UNIT_PRESETS: Record<MasonryUnit, UnitDimensions> = {
  // US modular brick, Brick Industry Association Technical Note 10.
  brick: { lengthIn: 7.625, heightIn: 2.25, depthIn: 3.625 },
  // Standard 8 × 8 × 16 in concrete block (actual size 7⅝ × 7⅝ × 15⅝ in).
  block: { lengthIn: 15.625, heightIn: 7.625, depthIn: 7.625 },
};

/** ASTM C270 mix proportions by volume (cement : lime : sand). */
export const MORTAR_MIX_RATIOS: Record<MortarType, { cement: number; lime: number; sand: number }> =
  {
    N: { cement: 1, lime: 1, sand: 6 },
    S: { cement: 1, lime: 0.5, sand: 4.5 },
    M: { cement: 1, lime: 0.25, sand: 3.75 },
    O: { cement: 1, lime: 2, sand: 9 },
  };

/**
 * ASTM C270 batch yields: cubic feet of each ingredient per cubic foot
 * of mixed mortar. Sand is 1.0 ft³ per ft³ of mortar for every type —
 * one cubic foot of damp, loose sand makes about one cubic foot of
 * mortar (BIA Technical Note 10) — and the cement and lime follow from
 * the mix ratio against that sand volume (e.g. Type N 1:1:6 gives
 * 1/6 ≈ 0.17 ft³ of cement and of lime per ft³ of mortar). Using shares
 * of the mortar volume instead (1/8 each for Type N) understates the
 * batch by 24–39%.
 */
export const MORTAR_MIX_YIELDS_FT3_PER_FT3: Record<
  MortarType,
  { cement: number; lime: number; sand: number }
> = {
  N: { cement: 0.17, lime: 0.17, sand: 1.0 },
  S: { cement: 0.22, lime: 0.11, sand: 1.0 },
  M: { cement: 0.33, lime: 0.08, sand: 1.0 },
  O: { cement: 0.11, lime: 0.22, sand: 1.0 },
};

/** Cubic feet in one 94 lb sack of portland cement (about 1 ft³). */
export const CEMENT_SACK_FT3 = 1;

/**
 * Masonry units laid by one 80 lb bag of pre-mixed mortar, at the
 * manufacturer maximum. QUIKRETE Mortar Mix No. 1102 data sheet,
 * YIELD section: "Each 80 lb (36.2 kg) bag of QUIKRETE® Mortar Mix
 * will lay up to 37 standard bricks or 13 standard (8 in by 8 in by
 * 16 in) blocks." A maximum, not an average — waste, joint width and
 * technique all reduce it, which is why the bag count derates it by
 * the waste allowance instead of dividing the bare unit count.
 */
export const UNITS_PER_MORTAR_BAG: Record<MasonryUnit, number> = {
  brick: 37,
  block: 13,
};

/** Standard mortar joint, in inches (BIA standard practice, ⅜ in). */
export const STANDARD_JOINT_IN = 0.375;

/**
 * Relative tolerance for the standard-geometry check. It absorbs
 * metric rounding only — 9.5 mm vs the exact 9.525 mm (0.26%),
 * 194 mm vs 7.625 in (0.17%) — not a genuinely different size:
 * a 10 mm joint (5% over) or a 200 mm brick (4% over) is outside it.
 */
export const RATING_GEOMETRY_TOLERANCE = 0.01;

/**
 * True when the unit dimensions match the standard preset within the
 * rounding tolerance above.
 */
export function isStandardDimensions(dims: UnitDimensions, preset: UnitDimensions): boolean {
  return (["lengthIn", "heightIn", "depthIn"] as const).every(
    (k) => Math.abs(dims[k] - preset[k]) <= preset[k] * RATING_GEOMETRY_TOLERANCE,
  );
}

/**
 * True when the joint is the standard ⅜ in or narrower (within the
 * rounding tolerance). The direction matters: a narrower joint uses
 * no more mortar per unit than the standard case, so the rating stays
 * a safe (conservative) basis — the bag count still covers the
 * waste-adjusted volume. A wider joint needs more mortar per unit
 * while fitting fewer units per ft², so the rating-based count falls
 * as the volume rises and under-buys; the rating does not apply.
 */
export function isStandardJoint(jointIn: number): boolean {
  return jointIn <= STANDARD_JOINT_IN * (1 + RATING_GEOMETRY_TOLERANCE);
}

/** Where a bag count came from: the manufacturer rating, a user-entered yield, or neither (unknown). */
export type MortarBagBasis = "rating" | "user-yield" | null;

export interface MortarInput {
  areaFt2: number;
  unit: MasonryUnit;
  /** Mortar joint width in inches (0.375 is standard). */
  jointIn: number;
  /** Waste allowance for mortar in percent (BIA suggests 15–25%). */
  wastePct: number;
  mortarType: MortarType;
  /**
   * Verified bag yield in ft³ per 80 lb bag, from the bag's own data
   * sheet. Only used when the manufacturer count rating does not
   * apply (joint wider than the standard ⅜ in). No default — no
   * volumetric yield is claimed for the product.
   */
  bagYieldFt3?: number;
  /** Optional price per 80 lb bag, in USD. */
  pricePerBag?: number;
}

export interface MortarResult {
  /** Units per square foot of wall. */
  unitsPerFt2: number;
  /** Units in the wall (rounded up, no waste — see the Brick Calculator for unit waste). */
  unitsNeeded: number;
  /** Mortar volume in cubic feet (waste included). */
  mortarVolumeFt3: number;
  /**
   * 80 lb bags of pre-mixed mortar to buy (rounded up), or null when
   * the bag count is unknown: the rating does not apply to this
   * geometry and no verified yield was entered.
   */
  bags: number | null;
  /**
   * Units one 80 lb bag lays at the manufacturer maximum (37 brick,
   * 13 block), or null when the rating does not apply.
   */
  unitsPerBag: number | null;
  /** Where the bag count came from (null = no bag count shown). */
  bagsBasis: MortarBagBasis;
  /** Cement for site mixing, in cubic feet (ASTM C270 batch yield per ft³ of mortar). */
  cementFt3: number;
  /** 94 lb sacks of portland cement to buy (rounded up). */
  cementSacks: number;
  /** Hydrated lime for site mixing, in cubic feet. */
  limeFt3: number;
  /** Masonry sand for site mixing, in cubic feet. */
  sandFt3: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateMortar(input: MortarInput): MortarResult {
  const dims = UNIT_PRESETS[input.unit];
  const faceAreaPerUnitIn2 = (dims.lengthIn + input.jointIn) * (dims.heightIn + input.jointIn);
  const unitsPerFt2 = SQUARE_INCHES_PER_SQUARE_FOOT / faceAreaPerUnitIn2;
  const unitsNeeded = ceilUp(input.areaFt2 * unitsPerFt2);
  const jointAreaIn2 = faceAreaPerUnitIn2 - dims.lengthIn * dims.heightIn;
  const mortarPerUnitIn3 = jointAreaIn2 * dims.depthIn;
  const mortarVolumeFt3 =
    ((unitsNeeded * mortarPerUnitIn3) / CUBIC_INCHES_PER_CUBIC_FOOT) * (1 + input.wastePct / 100);
  // Bags come from the manufacturer count rating, derated by the waste
  // allowance — but only where the rating applies: standard units at
  // the standard ⅜ in joint or narrower (ADR-12). The unit presets
  // are standard by construction, so only the joint decides here. For
  // a wider joint the rating-based count falls as the mortar volume
  // rises (80 ft², 15% waste: ⅜ in → 5.09 ft³ / 18 bags; ¾ in →
  // 8.82 ft³ / 15 bags), so the rating must not be used: with a
  // verified user-entered yield, bags = waste-adjusted volume ÷
  // yield; without one, no bag count is given at all. The site-mix
  // parts below use the volume either way.
  let bags: number | null;
  let unitsPerBag: number | null;
  let bagsBasis: MortarBagBasis;
  if (isStandardJoint(input.jointIn)) {
    unitsPerBag = UNITS_PER_MORTAR_BAG[input.unit];
    bags = ceilUp((unitsNeeded * (1 + input.wastePct / 100)) / unitsPerBag);
    bagsBasis = "rating";
  } else if (input.bagYieldFt3 !== undefined && input.bagYieldFt3 > 0) {
    unitsPerBag = null;
    bags = ceilUp(mortarVolumeFt3 / input.bagYieldFt3);
    bagsBasis = "user-yield";
  } else {
    unitsPerBag = null;
    bags = null;
    bagsBasis = null;
  }
  const yields = MORTAR_MIX_YIELDS_FT3_PER_FT3[input.mortarType];
  const cementFt3 = mortarVolumeFt3 * yields.cement;
  const limeFt3 = mortarVolumeFt3 * yields.lime;
  const sandFt3 = mortarVolumeFt3 * yields.sand;
  const cementSacks = ceilUp(cementFt3 / CEMENT_SACK_FT3);
  const costUsd =
    input.pricePerBag !== undefined && bags !== null ? bags * input.pricePerBag : undefined;
  return {
    unitsPerFt2,
    unitsNeeded,
    mortarVolumeFt3,
    bags,
    unitsPerBag,
    bagsBasis,
    cementFt3,
    cementSacks,
    limeFt3,
    sandFt3,
    costUsd,
  };
}
