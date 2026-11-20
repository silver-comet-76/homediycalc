import { ceilUp, CUBIC_INCHES_PER_CUBIC_FOOT } from "../units";

/**
 * Grout Calculator — grout weight and bags for a tiled area.
 *
 * Pure functions only. Canonical units: square feet for area, inches
 * for tile size and joint dimensions.
 *
 * Formula: grout fills the joints to the tile's depth, so the weight
 * per square foot is the joint volume per square foot times the grout
 * density:
 *   lb/ft² = (L + W) ÷ (L × W) × joint width × joint depth × 144 × density ÷ 1,728
 * with L, W, joint width, and joint depth in inches and density in
 * lb/ft³.
 *
 * Reference values (see docs/FORMULAS.md, Phase 3 table): a density of
 * 98.5 lb/ft³ reproduces the MAPEI Ultracolor Plus FA coverage chart
 * (10 lb bag covers 156 ft² of 12 × 12 in tile with ⅛ in joints) to
 * within 2%; CUSTOM Polyblend Plus sanded grout implies about
 * 110 lb/ft³. The density field defaults to 98.5 and is editable.
 * Grout is commonly sold in 10 lb and 25 lb bags; the bag weight is
 * editable.
 */

export interface GroutInput {
  areaFt2: number;
  tileLengthIn: number;
  tileWidthIn: number;
  /** Joint width in inches (0.125 is common). */
  jointWidthIn: number;
  /** Joint depth in inches — usually the tile thickness (0.375). */
  jointDepthIn: number;
  /** Grout density in lb per cubic foot (98.5 for MAPEI Ultracolor Plus FA). */
  groutDensityLbFt3: number;
  /** Bag weight in lb (10 or 25 are common). */
  bagWeightLb: number;
  /** Extra allowance in percent for waste and sponge loss, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per bag, in USD. */
  pricePerBag?: number;
}

export interface GroutResult {
  /** Pounds of grout per square foot (before waste). */
  groutLbPerFt2: number;
  /** Pounds of grout to buy (waste included). */
  groutLb: number;
  /** Bags to buy (rounded up). */
  bags: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateGrout(input: GroutInput): GroutResult {
  const jointVolumeIn3PerFt2 =
    ((input.tileLengthIn + input.tileWidthIn) /
      (input.tileLengthIn * input.tileWidthIn)) *
    input.jointWidthIn *
    input.jointDepthIn *
    144;
  const groutLbPerFt2 =
    (jointVolumeIn3PerFt2 * input.groutDensityLbFt3) / CUBIC_INCHES_PER_CUBIC_FOOT;
  const groutLb =
    input.areaFt2 * groutLbPerFt2 * (1 + input.wastePct / 100);
  const bags = ceilUp(groutLb / input.bagWeightLb);
  const costUsd =
    input.pricePerBag !== undefined ? bags * input.pricePerBag : undefined;
  return { groutLbPerFt2, groutLb, bags, costUsd };
}
