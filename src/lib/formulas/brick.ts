import { ceilUp, CUBIC_INCHES_PER_CUBIC_FOOT, SQUARE_INCHES_PER_SQUARE_FOOT } from "../units";

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
 * 1,000 bricks — BIA TN10 Table 4 lists 8.1 ft³. Mortar bags use the
 * QUIKRETE Mason Mix No. 1136 / Mortar Mix No. 1102 data sheet figure:
 * one 80 lb bag lays up to 37 standard bricks; BIA recommends adding
 * 15–25% to mortar for waste (default 15% here).
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
  /** Standard bricks laid by one 80 lb bag of mortar mix (QUIKRETE: 37). */
  bricksPerMortarBag: number;
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
  /** 80 lb bags of mortar mix to buy (rounded up, waste included). */
  mortarBags: number;
  /** Pallets to buy, only when a pallet size was entered. */
  pallets?: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
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
    (faceAreaPerBrickIn2 - input.brickLengthIn * input.brickHeightIn) *
    input.brickDepthIn;
  const mortarVolumeFt3 =
    (bricksNeeded * mortarPerBrickIn3) / CUBIC_INCHES_PER_CUBIC_FOOT * (1 + input.mortarWastePct / 100);
  const mortarBags = ceilUp(
    (bricksNeeded / input.bricksPerMortarBag) * (1 + input.mortarWastePct / 100),
  );
  const costUsd =
    input.pricePerBrick !== undefined || input.pricePerMortarBag !== undefined
      ? (input.pricePerBrick !== undefined
          ? bricksNeeded * input.pricePerBrick
          : 0) +
        (input.pricePerMortarBag !== undefined
          ? mortarBags * input.pricePerMortarBag
          : 0)
      : undefined;
  return {
    grossAreaFt2,
    netAreaFt2,
    faceAreaPerBrickIn2,
    bricksPerFt2,
    bricksNeeded,
    mortarVolumeFt3,
    mortarBags,
    pallets:
      input.palletSize !== undefined
        ? ceilUp(bricksNeeded / input.palletSize)
        : undefined,
    costUsd,
  };
}
