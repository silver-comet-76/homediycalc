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
 *   or walkway, 8 in for a residential driveway (add 2 in in frost or
 *   on clay). Bedding sand is 1 in (ASTM C33 concrete sand).
 * - Crushed base loses about 20% of its volume to compaction, so the
 *   loose volume to order is the compacted volume × 1.25.
 * - Base gravel density 2,800 lb/yd³ (the confirmed gravel figure from
 *   Phase 2); bedding sand about 2,750 lb/yd³ dry.
 * - Polymeric joint sand density about 100 lb/ft³; a 50 lb bag is
 *   about 0.5 ft³. Joint sand is computed from the actual joint
 *   volume (paver size, joint width, paver thickness), not a flat
 *   coverage rule — coverage per bag changes sharply with paver size.
 */

export interface PaverInput {
  areaFt2: number;
  paverLengthIn: number;
  paverWidthIn: number;
  /** Joint width in inches (0.125 is typical; 0 for spacer-bar pavers). */
  jointIn: number;
  /** Paver thickness in inches (2⅜ in is the standard patio paver). */
  paverThicknessIn: number;
  /** Waste allowance for pavers in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Compacted base depth in inches (4 for a patio, 8 for a driveway). */
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
  /** Base gravel to order (loose, compaction allowed for), in cubic yards. */
  baseLooseYd3: number;
  /** Base gravel weight in US tons (compacted volume × density). */
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

export function calculatePaver(input: PaverInput): PaverResult {
  const paverAreaFt2 =
    ((input.paverLengthIn + input.jointIn) * (input.paverWidthIn + input.jointIn)) /
    SQUARE_INCHES_PER_SQUARE_FOOT;
  const pavers = ceilUp(
    (input.areaFt2 * (1 + input.wastePct / 100)) / paverAreaFt2,
  );
  const baseCompactedYd3 =
    (input.areaFt2 * (input.baseDepthIn / 12)) / CUBIC_FEET_PER_CUBIC_YARD;
  const baseLooseYd3 = baseCompactedYd3 * BASE_COMPACTION_FACTOR;
  const baseTons = (baseCompactedYd3 * input.baseDensityLbYd3) / POUNDS_PER_US_TON;
  const beddingSandFt3 = input.areaFt2 * (input.beddingSandDepthIn / 12);
  const beddingSandYd3 = beddingSandFt3 / CUBIC_FEET_PER_CUBIC_YARD;
  const beddingSandTons =
    (beddingSandYd3 * input.beddingSandDensityLbYd3) / POUNDS_PER_US_TON;
  // Joint volume per ft²: the joint area around one paver, as a share of
  // its cell, times the paver thickness.
  const cellAreaIn2 =
    (input.paverLengthIn + input.jointIn) * (input.paverWidthIn + input.jointIn);
  const jointAreaIn2 =
    input.paverLengthIn * input.jointIn +
    input.paverWidthIn * input.jointIn +
    input.jointIn * input.jointIn;
  const jointSandIn3PerFt2 =
    (SQUARE_INCHES_PER_SQUARE_FOOT * jointAreaIn2 * input.paverThicknessIn) /
    cellAreaIn2;
  const jointSandLb =
    ((jointSandIn3PerFt2 * input.areaFt2) / CUBIC_INCHES_PER_CUBIC_FOOT) *
    input.jointSandDensityLbFt3;
  const jointSandBags = ceilUp(jointSandLb / input.jointSandBagLb);
  const costUsd =
    input.pricePerPaver !== undefined ||
    input.pricePerYd3Base !== undefined ||
    input.pricePerJointSandBag !== undefined
      ? (input.pricePerPaver !== undefined ? pavers * input.pricePerPaver : 0) +
        (input.pricePerYd3Base !== undefined
          ? baseLooseYd3 * input.pricePerYd3Base
          : 0) +
        (input.pricePerJointSandBag !== undefined
          ? jointSandBags * input.pricePerJointSandBag
          : 0)
      : undefined;
  return {
    paverAreaFt2,
    pavers,
    baseCompactedYd3,
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
