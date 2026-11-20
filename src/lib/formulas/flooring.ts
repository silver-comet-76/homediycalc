import { ceilUp } from "../units";

/**
 * Flooring Calculator — boxes of plank/tile flooring and underlayment
 * rolls for a room.
 *
 * Pure functions only. Canonical unit: square feet for area.
 *
 * Reference values (see docs/FORMULAS.md, Phase 3 table): box coverage
 * varies by brand and product — laminate about 18–24 ft² per box,
 * vinyl plank about 18–30 ft², hardwood about 20–25 ft² — so the
 * coverage field is editable and defaults to 20 ft². Waste default
 * 10% for a straight lay; 15–20% for diagonal or herringbone layouts.
 * Underlayment rolls typically cover about 100 ft² per roll.
 */

export interface FlooringInput {
  areaFt2: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Coverage of one box, in square feet (printed on the box). */
  boxCoverageFt2: number;
  /** Planks per box, when known (for a plank count). */
  planksPerBox?: number;
  /** True when underlayment rolls should be estimated. */
  includeUnderlayment: boolean;
  /** Coverage of one underlayment roll, in square feet (100). */
  underlaymentRollCoverageFt2: number;
  /** Optional price per box, in USD. */
  pricePerBox?: number;
  /** Optional price per underlayment roll, in USD. */
  pricePerRoll?: number;
}

export interface FlooringResult {
  /** Area after the waste allowance, in square feet. */
  adjustedAreaFt2: number;
  /** Boxes to buy (rounded up). */
  boxes: number;
  /** Planks to buy, only when planks per box was entered. */
  planks?: number;
  /** Underlayment rolls to buy (rounded up), only when included. */
  underlaymentRolls?: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateFlooring(input: FlooringInput): FlooringResult {
  const adjustedAreaFt2 = input.areaFt2 * (1 + input.wastePct / 100);
  const boxes = ceilUp(adjustedAreaFt2 / input.boxCoverageFt2);
  const planks =
    input.planksPerBox !== undefined ? boxes * input.planksPerBox : undefined;
  const underlaymentRolls = input.includeUnderlayment
    ? ceilUp(adjustedAreaFt2 / input.underlaymentRollCoverageFt2)
    : undefined;
  const costUsd =
    input.pricePerBox !== undefined || input.pricePerRoll !== undefined
      ? (input.pricePerBox !== undefined ? boxes * input.pricePerBox : 0) +
        (input.pricePerRoll !== undefined && underlaymentRolls !== undefined
          ? underlaymentRolls * input.pricePerRoll
          : 0)
      : undefined;
  return { adjustedAreaFt2, boxes, planks, underlaymentRolls, costUsd };
}
