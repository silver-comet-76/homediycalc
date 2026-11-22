import { ceilUp } from "../units";

/**
 * Ceiling Tile Calculator — tiles and suspension-grid components for a
 * drop ceiling.
 *
 * Pure functions only. Canonical units: feet for room dimensions,
 * square feet for area.
 *
 * Tiles: `tiles = ceil(area × (1 + waste%) ÷ tile area)`;
 * `cartons = ceil(tiles ÷ tiles per carton)`.
 *
 * Grid (room mode only — a known area has no dimensions to lay a grid
 * out on). Armstrong's installation guide ("How to Install Your
 * Armstrong Suspended Ceiling", LA294998) puts main beams on 4 ft
 * centers, cross tees 2 ft apart, and hanger wires 4 ft apart along
 * each main beam. Main beams run along the room length; interior main
 * lines sit 4 ft apart across the width, so:
 *   `main lines = max(0, ceil(width ÷ 4) − 1)`
 *   `main tees (12 ft) = ceil(main lines × length ÷ 12)`
 *   `4 ft cross tees = (main lines + 1) × max(0, ceil(length ÷ 2) − 1)`
 *   — one 4 ft tee in every bay, every 2 ft along the length.
 *   `2 ft cross tees` (2 × 2 ft tiles only) run parallel to the mains
 *   at the 2 ft offsets that are not main lines:
 *   `2 ft tees = ceil((width − 2) ÷ 4) × ceil(length ÷ 2)`.
 *   `wall angle (10 ft) = ceil(perimeter ÷ 10)`;
 *   `hangers = ceil(main lines × length ÷ 4)` (one wire every 4 ft).
 * These geometric counts reproduce the published room tables in the
 * references (e.g. a 12 × 12 ft room with 2 × 2 ft tiles: 2 mains,
 * 15 four-foot tees, 18 two-foot tees, 5 wall-angle pieces, 6 hangers).
 * They are a planning estimate: a real layout also depends on border
 * cuts, light fixtures, and joist direction, so the page says so.
 *
 * Reference values (see docs/FORMULAS.md, Phase 4 table): standard
 * tile sizes 2 × 2 ft (4 ft²) and 2 × 4 ft (8 ft²); main beams 12 ft;
 * wall angle in 10 ft pieces; 2 × 2 ft tiles commonly 16 per carton,
 * 2 × 4 ft commonly 8 — carton counts vary by product, so the field
 * is editable. When no carton count is given, the common count for
 * the tile size is used — a 2 × 4 ft tile must never be divided by
 * the 2 × 2 ft carton count, or the cartons under-buy.
 */

export interface CeilingTileInput {
  areaFt2: number;
  /** Area of one tile in ft²: 4 for 2 × 2 ft, 8 for 2 × 4 ft. */
  tileAreaFt2: number;
  /** Tiles per carton. When omitted, the common count for the tile
   * size is used (see tilesPerCartonForTileArea): 16 for 2 × 2 ft,
   * 8 for 2 × 4 ft. */
  tilesPerCarton?: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per carton, in USD. */
  pricePerCarton?: number;
}

export interface CeilingTileResult {
  /** Tiles to buy (waste included, rounded up). */
  tiles: number;
  /** Cartons to buy (rounded up). */
  cartons: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

/**
 * Common tiles per carton for a tile size: 16 for 2 × 2 ft tiles
 * (4 ft²), 8 for 2 × 4 ft tiles (8 ft²). Any other tile area falls
 * back to 16.
 */
export function tilesPerCartonForTileArea(tileAreaFt2: number): number {
  return tileAreaFt2 === 8 ? 8 : 16;
}

export function calculateCeilingTiles(input: CeilingTileInput): CeilingTileResult {
  const tiles = ceilUp((input.areaFt2 * (1 + input.wastePct / 100)) / input.tileAreaFt2);
  const tilesPerCarton = input.tilesPerCarton ?? tilesPerCartonForTileArea(input.tileAreaFt2);
  const cartons = ceilUp(tiles / tilesPerCarton);
  const costUsd = input.pricePerCarton !== undefined ? cartons * input.pricePerCarton : undefined;
  return { tiles, cartons, costUsd };
}

export interface CeilingGridInput {
  lengthFt: number;
  widthFt: number;
  /** Area of one tile in ft²: 4 for 2 × 2 ft, 8 for 2 × 4 ft. */
  tileAreaFt2: number;
}

export interface CeilingGridResult {
  /** Interior main-beam lines across the width. */
  mainLines: number;
  /** 12 ft main tees (beams) to buy. */
  mainTees: number;
  /** 4 ft cross tees to buy. */
  crossTees4Ft: number;
  /** 2 ft cross tees to buy (0 for 2 × 4 ft tiles). */
  crossTees2Ft: number;
  /** 10 ft wall-angle pieces to buy. */
  wallAnglePieces: number;
  /** Hanger wires (one every 4 ft of main beam). */
  hangers: number;
}

export function calculateCeilingGrid(input: CeilingGridInput): CeilingGridResult {
  const { lengthFt, widthFt, tileAreaFt2 } = input;
  const mainLines = Math.max(0, Math.ceil(widthFt / 4) - 1);
  const mainTees = ceilUp((mainLines * lengthFt) / 12);
  const crossTees4Ft = (mainLines + 1) * Math.max(0, Math.ceil(lengthFt / 2) - 1);
  const crossTees2Ft =
    tileAreaFt2 === 4 ? Math.max(0, Math.ceil((widthFt - 2) / 4)) * Math.ceil(lengthFt / 2) : 0;
  const wallAnglePieces = ceilUp((2 * (lengthFt + widthFt)) / 10);
  const hangers = ceilUp((mainLines * lengthFt) / 4);
  return {
    mainLines,
    mainTees,
    crossTees4Ft,
    crossTees2Ft,
    wallAnglePieces,
    hangers,
  };
}
