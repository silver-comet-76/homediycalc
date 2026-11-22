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
 *   review response). QUIKRETE Mortar Mix No. 1102 is rated at up to 37
 *   standard bricks or 13 standard 8 × 8 × 16 blocks per 80 lb bag, and
 *   its data sheet states NO cubic-foot yield per bag and NO waste
 *   allowance — so this calculator claims no volumetric bag yield for
 *   the product (the 0.6 ft³/bag figure used before this fix is not on
 *   the data sheet; it is removed). The rating is a maximum ("up to"),
 *   so the waste allowance derates it: bags = installed units ×
 *   (1 + waste%) ÷ units per bag. The mortar volume (geometric joint
 *   volume, BIA-corroborated) still feeds the site-mix parts.
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

export interface MortarInput {
  areaFt2: number;
  unit: MasonryUnit;
  /** Mortar joint width in inches (0.375 is standard). */
  jointIn: number;
  /** Waste allowance for mortar in percent (BIA suggests 15–25%). */
  wastePct: number;
  mortarType: MortarType;
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
  /** 80 lb bags of pre-mixed mortar to buy (rounded up). */
  bags: number;
  /** Units one 80 lb bag lays at the manufacturer maximum (37 brick, 13 block). */
  unitsPerBag: number;
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
  // allowance: the rating is a maximum with no waste allowance stated,
  // so installed units × (1 + waste%) ÷ units per bag. This is the same
  // rule the Brick Calculator uses, so the two agree for the same wall
  // and waste (the Brick Calculator additionally floors at the bags for
  // the spare bricks you buy, so it can read one bag higher when the
  // brick waste allowance is large — see its tests).
  const unitsPerBag = UNITS_PER_MORTAR_BAG[input.unit];
  const bags = ceilUp((unitsNeeded * (1 + input.wastePct / 100)) / unitsPerBag);
  const yields = MORTAR_MIX_YIELDS_FT3_PER_FT3[input.mortarType];
  const cementFt3 = mortarVolumeFt3 * yields.cement;
  const limeFt3 = mortarVolumeFt3 * yields.lime;
  const sandFt3 = mortarVolumeFt3 * yields.sand;
  const cementSacks = ceilUp(cementFt3 / CEMENT_SACK_FT3);
  const costUsd = input.pricePerBag !== undefined ? bags * input.pricePerBag : undefined;
  return {
    unitsPerFt2,
    unitsNeeded,
    mortarVolumeFt3,
    bags,
    unitsPerBag,
    cementFt3,
    cementSacks,
    limeFt3,
    sandFt3,
    costUsd,
  };
}
