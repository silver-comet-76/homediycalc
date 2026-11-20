import { ceilUp, SQUARE_INCHES_PER_SQUARE_FOOT } from "../units";

/**
 * Tile Calculator — tile and box counts for a floor or wall.
 *
 * Pure functions only. Canonical units: square feet for area, inches for
 * tile size and grout joint. The grout-line allowance widens each tile's
 * effective footprint: effective tile area = (tile length + joint) ×
 * (tile width + joint). Waste default 10% (straight lay); diagonal or
 * patterned layouts typically need more — the page states this as
 * guidance, not a rule.
 */

export interface TileInput {
  areaFt2: number;
  tileLengthIn: number;
  tileWidthIn: number;
  /** Grout joint width in inches (0 = tiles butted together). */
  jointIn: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Tiles per box. */
  tilesPerBox: number;
  /** Optional price per box, in USD. */
  pricePerBox?: number;
  /** Optional price per tile, in USD. */
  pricePerTile?: number;
}

export interface TileResult {
  /** Face area of one tile, in square feet. */
  tileAreaFt2: number;
  /** Area one tile occupies including its grout joint, in square feet. */
  effectiveTileAreaFt2: number;
  /** Individual tiles to buy (rounded up). */
  tilesNeeded: number;
  /** Boxes to buy (rounded up). */
  boxesNeeded: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateTile(input: TileInput): TileResult {
  const tileAreaFt2 = (input.tileLengthIn * input.tileWidthIn) / SQUARE_INCHES_PER_SQUARE_FOOT;
  const effectiveTileAreaFt2 =
    ((input.tileLengthIn + input.jointIn) * (input.tileWidthIn + input.jointIn)) / SQUARE_INCHES_PER_SQUARE_FOOT;
  const adjustedAreaFt2 = input.areaFt2 * (1 + input.wastePct / 100);
  const tilesNeeded = ceilUp(adjustedAreaFt2 / effectiveTileAreaFt2);
  const boxesNeeded = ceilUp(tilesNeeded / input.tilesPerBox);
  const costUsd =
    input.pricePerBox !== undefined
      ? boxesNeeded * input.pricePerBox
      : input.pricePerTile !== undefined
        ? tilesNeeded * input.pricePerTile
        : undefined;
  return { tileAreaFt2, effectiveTileAreaFt2, tilesNeeded, boxesNeeded, costUsd };
}
