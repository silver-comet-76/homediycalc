import {
  ceilUp,
  CUBIC_INCHES_PER_CUBIC_FOOT,
  SQUARE_INCHES_PER_SQUARE_FOOT,
} from "../units";

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
 * - Bag yield: one 80 lb bag of pre-mixed mortar yields about 0.6 ft³
 *   (QUIKRETE Mortar Mix No. 1102 is rated at up to 37 standard bricks
 *   or 13 standard 8 × 8 × 16 blocks per 80 lb bag). The yield field is
 *   editable.
 * - Mix ratios are the ASTM C270 proportion specification, by volume:
 *   Type N 1:1:6, Type S 1:½:4½, Type M 1:¼:3¾, Type O 1:2:9
 *   (cement : lime : sand). A 94 lb sack of portland cement is about
 *   1 ft³. The site-mix parts are shares of the mortar volume — an
 *   ordering guide, not an exact dry-volume recipe.
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
export const MORTAR_MIX_RATIOS: Record<
  MortarType,
  { cement: number; lime: number; sand: number }
> = {
  N: { cement: 1, lime: 1, sand: 6 },
  S: { cement: 1, lime: 0.5, sand: 4.5 },
  M: { cement: 1, lime: 0.25, sand: 3.75 },
  O: { cement: 1, lime: 2, sand: 9 },
};

/** Cubic feet in one 94 lb sack of portland cement (about 1 ft³). */
export const CEMENT_SACK_FT3 = 1;

export interface MortarInput {
  areaFt2: number;
  unit: MasonryUnit;
  /** Mortar joint width in inches (0.375 is standard). */
  jointIn: number;
  /** Waste allowance for mortar in percent (BIA suggests 15–25%). */
  wastePct: number;
  /** Mortar yielded by one 80 lb bag, in cubic feet (0.6). */
  bagYieldFt3: number;
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
  /** Cement for site mixing, in cubic feet (share of the mortar volume). */
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
  const faceAreaPerUnitIn2 =
    (dims.lengthIn + input.jointIn) * (dims.heightIn + input.jointIn);
  const unitsPerFt2 = SQUARE_INCHES_PER_SQUARE_FOOT / faceAreaPerUnitIn2;
  const unitsNeeded = ceilUp(input.areaFt2 * unitsPerFt2);
  const jointAreaIn2 =
    faceAreaPerUnitIn2 - dims.lengthIn * dims.heightIn;
  const mortarPerUnitIn3 = jointAreaIn2 * dims.depthIn;
  const mortarVolumeFt3 =
    ((unitsNeeded * mortarPerUnitIn3) / CUBIC_INCHES_PER_CUBIC_FOOT) *
    (1 + input.wastePct / 100);
  const bags = ceilUp(mortarVolumeFt3 / input.bagYieldFt3);
  const ratio = MORTAR_MIX_RATIOS[input.mortarType];
  const totalParts = ratio.cement + ratio.lime + ratio.sand;
  const cementFt3 = (mortarVolumeFt3 * ratio.cement) / totalParts;
  const limeFt3 = (mortarVolumeFt3 * ratio.lime) / totalParts;
  const sandFt3 = (mortarVolumeFt3 * ratio.sand) / totalParts;
  const cementSacks = ceilUp(cementFt3 / CEMENT_SACK_FT3);
  const costUsd =
    input.pricePerBag !== undefined ? bags * input.pricePerBag : undefined;
  return {
    unitsPerFt2,
    unitsNeeded,
    mortarVolumeFt3,
    bags,
    cementFt3,
    cementSacks,
    limeFt3,
    sandFt3,
    costUsd,
  };
}
