import { ceilUp } from "../units";

/**
 * Tile Adhesive Calculator — thinset bags for a tiled area.
 *
 * Pure functions only. Canonical units: square feet for area.
 *
 * Formula: `bags = ceil(area × (1 + waste%) ÷ effective coverage)`,
 * where the effective coverage is the coverage printed for a 50 lb
 * bag, scaled by the bag weight actually bought and reduced when the
 * tile is back-buttered:
 *   `effective coverage = coverage per 50 lb bag × (bag weight ÷ 50)`
 *   `÷ 1.35 when back-buttering`.
 *
 * Reference values (see docs/FORMULAS.md, Phase 4 table): CUSTOM
 * Building Products VersaBond coverage chart (TDS-119) per 50 lb
 * bag — 1/4 × 1/4 × 1/4 in square-notch 90–100 ft², 1/4 × 3/8 × 1/4 in
 * 60–67 ft², 1/2 × 1/2 × 1/2 in 42–47 ft², 3/4 in U-notch at 45°
 * 34–38 ft² (42–47 ft² at 30°). The calculator defaults to the low
 * end of each range (90 / 60 / 42 / 34 ft²) so the estimate never
 * under-orders, and the coverage field is editable — other brands,
 * lightweight mortars, and uneven substrates change it, and the
 * coverage printed on the bag is the final word. Back-buttering
 * large tile (over 15 in) cuts effective coverage by about 35%
 * (tilematerials.com's reading of the same CUSTOM chart), so the
 * factor 1.35 is labeled as estimating guidance, not a manufacturer
 * figure. TCNA requires at least 80% mortar contact in dry areas
 * and 95% in wet areas and exteriors.
 */

/** Low ends of the CUSTOM VersaBond coverage chart, ft² per 50 lb bag. */
export const ADHESIVE_COVERAGE_PER_50LB_BAG: Record<string, number> = {
  "v-notch": 95,
  "quarter-square": 90,
  "quarter-three-eighth": 60,
  "half-square": 42,
  "three-quarter-u": 34,
};

/** Extra mortar needed when back-buttering (estimating guidance). */
export const BACK_BUTTER_FACTOR = 1.35;

export interface TileAdhesiveInput {
  areaFt2: number;
  /** Coverage in ft² for a 50 lb bag at the chosen trowel notch. */
  coveragePer50LbBagFt2: number;
  /** Weight of one bag in lb (50 is standard in the US). */
  bagWeightLb: number;
  /** True when the tile is back-buttered (large tile, wet areas). */
  backButter: boolean;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per bag, in USD. */
  pricePerBag?: number;
}

export interface TileAdhesiveResult {
  /** Dry adhesive weight needed, in lb (waste included). */
  adhesiveLb: number;
  /** Bags to buy (rounded up). */
  bags: number;
  /** Effective coverage in ft² for one bag as bought. */
  effectiveCoverageFt2PerBag: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateTileAdhesive(input: TileAdhesiveInput): TileAdhesiveResult {
  const effectiveCoverageFt2PerBag =
    (input.coveragePer50LbBagFt2 * (input.bagWeightLb / 50)) /
    (input.backButter ? BACK_BUTTER_FACTOR : 1);
  const adjustedAreaFt2 = input.areaFt2 * (1 + input.wastePct / 100);
  const exactBags = adjustedAreaFt2 / effectiveCoverageFt2PerBag;
  const bags = ceilUp(exactBags);
  const adhesiveLb = exactBags * input.bagWeightLb;
  const costUsd =
    input.pricePerBag !== undefined ? bags * input.pricePerBag : undefined;
  return { adhesiveLb, bags, effectiveCoverageFt2PerBag, costUsd };
}
