import { ceilUp, squareFeetToSquareMeters } from "../units";

/**
 * Sod / Turf Calculator — rolls and pallets of sod (turf) for a lawn,
 * with exclusions and a partial-pallet flag.
 *
 * Pure functions only. Canonical unit: square feet for area.
 *
 * Reference values (see docs/FORMULAS.md): a US sod roll covers
 * 10 ft² (2 × 5 ft); Southern slabs are 16 × 24 in; a US pallet covers
 * 400–500 ft² (450 ft² is the small end, used as the default); a UK
 * turf roll covers about 1 m². Waste is 5% for a simple rectangle and
 * 10% for curves and cuts (homebuildlab). Roll and pallet coverage are
 * editable because piece sizes vary by supplier and region.
 */

export interface SodInput {
  /** Lawn area before exclusions, in square feet. */
  grossAreaFt2: number;
  /** Area to subtract (house, driveway, beds), in square feet. */
  exclusionsFt2: number;
  /** Cutting waste in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Coverage per roll or piece, in square feet (10 for a US roll). */
  rollCoverageFt2: number;
  /** Coverage per pallet, in square feet (450 for a US pallet). */
  palletCoverageFt2: number;
  /** Optional price per roll, in USD. */
  pricePerRoll?: number;
  /** Optional price per pallet, in USD. */
  pricePerPallet?: number;
}

export interface SodResult {
  /** Lawn area before exclusions, in square feet. */
  grossAreaFt2: number;
  /** Lawn area after exclusions, in square feet. */
  netAreaFt2: number;
  /** Lawn area after exclusions, in square meters. */
  netAreaM2: number;
  /** Area with waste, in square feet. */
  adjustedAreaFt2: number;
  /** Area with waste, in square meters. */
  adjustedAreaM2: number;
  /** Rolls to buy (rounded up). */
  rolls: number;
  /** Pallets to buy (rounded up). */
  pallets: number;
  /** Square feet needed of the last pallet (equals pallet coverage when full). */
  lastPalletFt2: number;
  /** True when the last pallet is only partly needed. */
  lastPalletPartial: boolean;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateSod(input: SodInput): SodResult {
  const netAreaFt2 = Math.max(input.grossAreaFt2 - input.exclusionsFt2, 0);
  const netAreaM2 = squareFeetToSquareMeters(netAreaFt2);
  const adjustedAreaFt2 = netAreaFt2 * (1 + input.wastePct / 100);
  const adjustedAreaM2 = squareFeetToSquareMeters(adjustedAreaFt2);
  const rolls = ceilUp(adjustedAreaFt2 / input.rollCoverageFt2);
  const pallets = ceilUp(adjustedAreaFt2 / input.palletCoverageFt2);
  const lastPalletFt2 = pallets > 0 ? adjustedAreaFt2 - (pallets - 1) * input.palletCoverageFt2 : 0;
  // A 0.01 ft² tolerance keeps floating-point noise from flagging a
  // full pallet as partial (e.g. 449.9999 ft² of a 450 ft² pallet).
  const lastPalletPartial = pallets > 0 && lastPalletFt2 < input.palletCoverageFt2 - 0.01;
  // A buyer buys rolls OR pallets, never both: the pallet price wins
  // when both prices are entered (pallets are the bulk form), and the
  // pallet cost uses the rounded pallet count.
  const costUsd =
    input.pricePerPallet !== undefined
      ? pallets * input.pricePerPallet
      : input.pricePerRoll !== undefined
        ? rolls * input.pricePerRoll
        : undefined;
  return {
    grossAreaFt2: input.grossAreaFt2,
    netAreaFt2,
    netAreaM2,
    adjustedAreaFt2,
    adjustedAreaM2,
    rolls,
    pallets,
    lastPalletFt2,
    lastPalletPartial,
    costUsd,
  };
}
