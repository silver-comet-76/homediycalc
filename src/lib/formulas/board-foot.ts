/**
 * Board Foot Calculator — board feet for lumber, with piece count
 * and optional cost.
 *
 * Pure functions only. A board foot is the volume of a board 1 ft ×
 * 1 ft × 1 in (144 in³, or 1/12 ft³). The formula is:
 *   board feet = thickness (in) × width (in) × length (ft) ÷ 12
 * (see docs/FORMULAS.md, Phase 3 table; NIST PS 20-25 for softwood
 * nominal dimensions, NHLA rules for hardwood).
 *
 * For planed softwood lumber, board footage is calculated from the
 * nominal dimensions (a "2×4" counts as 2 in × 4 in), not the smaller
 * actual dressed size. For rough hardwood, use the actual (rough)
 * thickness. The page states this; the calculator does not guess
 * which the user means.
 */

/** Board feet in one cubic foot (12). */
export const BOARD_FEET_PER_CUBIC_FOOT = 12;

export interface BoardFootInput {
  thicknessIn: number;
  widthIn: number;
  lengthFt: number;
  /** Number of identical pieces. */
  pieces: number;
  /** Cutting-waste allowance in percent, e.g. 5 for 5%. */
  wastePct: number;
  /** Optional price per board foot, in USD. */
  pricePerBoardFoot?: number;
}

export interface BoardFootResult {
  /** Board feet in one piece. */
  boardFeetPerPiece: number;
  /** Total board feet (waste included). */
  boardFeetTotal: number;
  /** Total volume in cubic feet. */
  volumeFt3: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateBoardFoot(input: BoardFootInput): BoardFootResult {
  const boardFeetPerPiece =
    (input.thicknessIn * input.widthIn * input.lengthFt) / BOARD_FEET_PER_CUBIC_FOOT;
  const boardFeetTotal = boardFeetPerPiece * input.pieces * (1 + input.wastePct / 100);
  const volumeFt3 = boardFeetTotal / BOARD_FEET_PER_CUBIC_FOOT;
  const costUsd =
    input.pricePerBoardFoot !== undefined ? boardFeetTotal * input.pricePerBoardFoot : undefined;
  return { boardFeetPerPiece, boardFeetTotal, volumeFt3, costUsd };
}
