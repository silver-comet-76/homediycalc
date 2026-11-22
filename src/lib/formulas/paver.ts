import {
  ceilUp,
  CUBIC_FEET_PER_CUBIC_YARD,
  CUBIC_INCHES_PER_CUBIC_FOOT,
  POUNDS_PER_US_TON,
  SQUARE_INCHES_PER_SQUARE_FOOT,
} from "../units";

/**
 * Paver Calculator — paver counts plus base gravel, bedding sand, and
 * joint sand for a patio, walkway, or driveway.
 *
 * Pure functions only. Canonical units: square feet for area, inches
 * for paver size and depths.
 *
 * Reference values (see docs/FORMULAS.md, Phase 3 table):
 * - Base depth follows ICPI Tech Spec 2/4: 4 in compacted for a patio
 *   or walkway, 6 in for a residential driveway (add 2–4 in in frost,
 *   wet, or weak soil, for 8–10 in total). Bedding sand is 1 in
 *   (ASTM C33 concrete sand).
 * - The base (and the bedding sand under it) extends past the paver
 *   edge on every side — at least 6 in, or the base thickness when
 *   the base is deeper than 6 in — so base and bedding volumes are
 *   computed on the extended footprint, while the paver count and
 *   joint sand stay on the paver area.
 * - Crushed base loses about 20% of its volume to compaction, so the
 *   loose volume to order is the compacted volume × 1.25.
 * - Base gravel density 2,800 lb/yd³ (the confirmed gravel figure from
 *   Phase 2); bedding sand about 2,750 lb/yd³ dry. Mass is conserved
 *   through compaction, so the base weight comes from the loose
 *   volume ordered, not the compacted volume: tons = loose yd³ ×
 *   density ÷ 2,000.
 * - Polymeric joint sand density about 100 lb/ft³; a 50 lb bag is
 *   about 0.5 ft³. Joint sand is computed from the actual joint
 *   volume (paver size, joint width, paver thickness), not a flat
 *   coverage rule — coverage per bag changes sharply with paver size.
 */

export interface PaverInput {
  areaFt2: number;
  /** Paved length in feet, when known. With widthFt, the base and
   * bedding-sand footprint is extended exactly; without dimensions the
   * extension is estimated as if the paved area were square. */
  lengthFt?: number;
  /** Paved width in feet, when known (see lengthFt). */
  widthFt?: number;
  paverLengthIn: number;
  paverWidthIn: number;
  /** Joint width in inches (0.125 is typical; 0 for spacer-bar pavers). */
  jointIn: number;
  /** Paver thickness in inches (2⅜ in is the standard patio paver). */
  paverThicknessIn: number;
  /** Waste allowance for pavers in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Compacted base depth in inches (4 for a patio, 6 for a driveway). */
  baseDepthIn: number;
  /** Base gravel density in lb per cubic yard (2,800). */
  baseDensityLbYd3: number;
  /** Bedding sand depth in inches (1 per ICPI). */
  beddingSandDepthIn: number;
  /** Bedding sand density in lb per cubic yard (2,750 dry). */
  beddingSandDensityLbYd3: number;
  /** Joint sand density in lb per cubic foot (100). */
  jointSandDensityLbFt3: number;
  /** Joint sand bag weight in lb (50). */
  jointSandBagLb: number;
  /** Optional price per paver, in USD. */
  pricePerPaver?: number;
  /** Optional price per cubic yard of base gravel (loose), in USD. */
  pricePerYd3Base?: number;
  /** Optional price per bag of joint sand, in USD. */
  pricePerJointSandBag?: number;
}

export interface PaverResult {
  /** Area of one paver including its joint, in square feet. */
  paverAreaFt2: number;
  /** Pavers to buy (rounded up, waste included). */
  pavers: number;
  /** Base gravel, compacted volume, in cubic yards. */
  baseCompactedYd3: number;
  /** Extended footprint the base and bedding sand cover, in square
   * feet — the paver area plus the base extension on every side. */
  baseAreaFt2: number;
  /** Base gravel to order (loose, compaction allowed for), in cubic yards. */
  baseLooseYd3: number;
  /** Base gravel weight in US tons (loose volume × density — mass is
   * conserved through compaction). */
  baseTons: number;
  /** Bedding sand volume, in cubic feet. */
  beddingSandFt3: number;
  /** Bedding sand volume, in cubic yards. */
  beddingSandYd3: number;
  /** Bedding sand weight in US tons. */
  beddingSandTons: number;
  /** Joint sand volume, in cubic inches per square foot. */
  jointSandIn3PerFt2: number;
  /** Joint sand weight in pounds. */
  jointSandLb: number;
  /** Bags of joint sand to buy (rounded up). */
  jointSandBags: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

/** Loose volume to order per unit of compacted volume (20% compaction loss). */
export const BASE_COMPACTION_FACTOR = 1.25;

/**
 * How far the base extends past the paver edge on every side, in
 * inches: at least 6 in, or the base thickness when the base is
 * deeper than 6 in (ICPI Tech Spec 2).
 */
export function baseExtensionIn(baseDepthIn: number): number {
  return Math.max(6, baseDepthIn);
}

/**
 * Footprint the base and bedding sand cover, in square feet: the paver
 * area extended by `baseExtensionIn(baseDepthIn)` on every side. With
 * length and width known the extension is exact; with only the area
 * known it is estimated as if the paved area were square — enter
 * length and width for the exact figure.
 */
export function extendedFootprintFt2(
  areaFt2: number,
  baseDepthIn: number,
  lengthFt?: number,
  widthFt?: number,
): number {
  const extensionFt = baseExtensionIn(baseDepthIn) / 12;
  if (areaFt2 <= 0) return 0;
  if (lengthFt !== undefined && widthFt !== undefined) {
    return (lengthFt + 2 * extensionFt) * (widthFt + 2 * extensionFt);
  }
  const sideFt = Math.sqrt(areaFt2);
  return (sideFt + 2 * extensionFt) ** 2;
}

export function calculatePaver(input: PaverInput): PaverResult {
  const paverAreaFt2 =
    ((input.paverLengthIn + input.jointIn) * (input.paverWidthIn + input.jointIn)) /
    SQUARE_INCHES_PER_SQUARE_FOOT;
  const pavers = ceilUp((input.areaFt2 * (1 + input.wastePct / 100)) / paverAreaFt2);
  // Base and bedding sand cover the extended footprint, not the paver
  // area; the paver count and joint sand stay on the paver area.
  const baseAreaFt2 = extendedFootprintFt2(
    input.areaFt2,
    input.baseDepthIn,
    input.lengthFt,
    input.widthFt,
  );
  const baseCompactedYd3 = (baseAreaFt2 * (input.baseDepthIn / 12)) / CUBIC_FEET_PER_CUBIC_YARD;
  const baseLooseYd3 = baseCompactedYd3 * BASE_COMPACTION_FACTOR;
  const baseTons = (baseLooseYd3 * input.baseDensityLbYd3) / POUNDS_PER_US_TON;
  const beddingSandFt3 = baseAreaFt2 * (input.beddingSandDepthIn / 12);
  const beddingSandYd3 = beddingSandFt3 / CUBIC_FEET_PER_CUBIC_YARD;
  const beddingSandTons = (beddingSandYd3 * input.beddingSandDensityLbYd3) / POUNDS_PER_US_TON;
  // Joint volume per ft²: the joint area around one paver, as a share of
  // its cell, times the paver thickness.
  const cellAreaIn2 = (input.paverLengthIn + input.jointIn) * (input.paverWidthIn + input.jointIn);
  const jointAreaIn2 =
    input.paverLengthIn * input.jointIn +
    input.paverWidthIn * input.jointIn +
    input.jointIn * input.jointIn;
  const jointSandIn3PerFt2 =
    (SQUARE_INCHES_PER_SQUARE_FOOT * jointAreaIn2 * input.paverThicknessIn) / cellAreaIn2;
  const jointSandLb =
    ((jointSandIn3PerFt2 * input.areaFt2) / CUBIC_INCHES_PER_CUBIC_FOOT) *
    input.jointSandDensityLbFt3;
  const jointSandBags = ceilUp(jointSandLb / input.jointSandBagLb);
  const costUsd =
    input.pricePerPaver !== undefined ||
    input.pricePerYd3Base !== undefined ||
    input.pricePerJointSandBag !== undefined
      ? (input.pricePerPaver !== undefined ? pavers * input.pricePerPaver : 0) +
        (input.pricePerYd3Base !== undefined ? baseLooseYd3 * input.pricePerYd3Base : 0) +
        (input.pricePerJointSandBag !== undefined ? jointSandBags * input.pricePerJointSandBag : 0)
      : undefined;
  return {
    paverAreaFt2,
    pavers,
    baseCompactedYd3,
    baseAreaFt2,
    baseLooseYd3,
    baseTons,
    beddingSandFt3,
    beddingSandYd3,
    beddingSandTons,
    jointSandIn3PerFt2,
    jointSandLb,
    jointSandBags,
    costUsd,
  };
}
