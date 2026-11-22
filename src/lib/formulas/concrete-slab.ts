/**
 * Concrete Slab Calculator — slab-specific concrete, distinct from the
 * general Concrete Calculator.
 *
 * Differences from the general calculator: thickness presets for slabs
 * (4 in / 6 in), an optional thickened-edge allowance (a deeper edge
 * footing around the slab perimeter), and a wire-mesh sheet count as
 * information only. Reinforcement is guidance, not structural design:
 * a slab's structural requirements need a qualified professional, and
 * the page says so. Volume core and bag yields are the same as the
 * general calculator (QUIKRETE Concrete Mix No. 1101).
 */

import { cubicFeetToCubicYards, ceilUp } from "../units";
import { CONCRETE_BAG_YIELDS_FT3, roundUpToQuarterYard } from "./concrete";

/** Typical wire-mesh sheet, 8 ft × 20 ft = 160 ft². Editable on the page. */
export const STANDARD_MESH_SHEET_AREA_FT2 = 160;

export interface SlabInput {
  lengthFt: number;
  widthFt: number;
  thicknessFt: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Round the ready-mix order up to the next quarter yard (default) or whole yard. */
  quarterYardRounding: boolean;
  /** Depth of the thickened edge, in feet (0 or omitted = no thickened edge). */
  edgeDepthFt?: number;
  /** Width of the thickened edge band, in feet. */
  edgeWidthFt?: number;
  /** Area of one wire-mesh sheet, in square feet. */
  meshSheetAreaFt2: number;
  /** Optional price per cubic yard of ready-mix, in USD. */
  pricePerYd3?: number;
  /** Optional price per 80 lb bag, in USD. */
  pricePerBag80?: number;
}

export interface SlabResult {
  baseVolumeFt3: number;
  /** Extra volume from the thickened edge, in cubic feet (0 without one). */
  edgeExtraFt3: number;
  volumeFt3: number;
  volumeYd3: number;
  adjustedFt3: number;
  adjustedYd3: number;
  /** Ready-mix order quantity, rounded up to the supplier increment. */
  orderYd3: number;
  bags80: number;
  bags60: number;
  bags40: number;
  /** Wire-mesh sheets (information only, not a structural specification). */
  meshSheets: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateSlab(input: SlabInput): SlabResult {
  const baseVolumeFt3 = input.lengthFt * input.widthFt * input.thicknessFt;
  const edgeDepthFt = input.edgeDepthFt ?? 0;
  const edgeWidthFt = input.edgeWidthFt ?? 0;
  const extraDepthFt = Math.max(0, edgeDepthFt - input.thicknessFt);
  // Thickened-edge band: the band runs around the slab perimeter, but
  // a plain perimeter band counts each corner twice (once for each side
  // meeting there). Shortening the band by one edge width at each end —
  // 2 × (L + W − 2w) — counts every corner once, so no waste allowance
  // is needed to absorb an overcount.
  const bandLengthFt = 2 * (input.lengthFt + input.widthFt - 2 * edgeWidthFt);
  const edgeExtraFt3 = Math.max(0, bandLengthFt) * edgeWidthFt * extraDepthFt;
  const volumeFt3 = baseVolumeFt3 + edgeExtraFt3;
  const volumeYd3 = cubicFeetToCubicYards(volumeFt3);
  const factor = 1 + input.wastePct / 100;
  const adjustedFt3 = volumeFt3 * factor;
  const adjustedYd3 = volumeYd3 * factor;
  const orderYd3 = input.quarterYardRounding
    ? roundUpToQuarterYard(adjustedYd3)
    : ceilUp(adjustedYd3);
  const bags80 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[80]);
  const bags60 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[60]);
  const bags40 = ceilUp(adjustedFt3 / CONCRETE_BAG_YIELDS_FT3[40]);
  const areaFt2 = input.lengthFt * input.widthFt;
  const meshSheets = ceilUp(areaFt2 / input.meshSheetAreaFt2);
  const costUsd =
    input.pricePerYd3 !== undefined
      ? orderYd3 * input.pricePerYd3
      : input.pricePerBag80 !== undefined
        ? bags80 * input.pricePerBag80
        : undefined;
  return {
    baseVolumeFt3,
    edgeExtraFt3,
    volumeFt3,
    volumeYd3,
    adjustedFt3,
    adjustedYd3,
    orderYd3,
    bags80,
    bags60,
    bags40,
    meshSheets,
    costUsd,
  };
}
