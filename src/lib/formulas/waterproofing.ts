import { ceilUp, gallonsToLiters } from "../units";

/**
 * Waterproofing Calculator — liquid membrane by the gallon, or
 * sheet membrane by the roll. Distinct from the Paint and Primer
 * calculators: waterproofing is applied to a specified film
 * thickness, so the coverage per gallon is set by the product's
 * rated application rate and the coat count is a requirement, not
 * a choice — a liquid membrane needs at least two coats.
 *
 * Pure functions only. Canonical units: square feet for area,
 * US gallons for liquid volume.
 *
 * Liquid: `gallons = area × coats ÷ coverage per coat × (1 + waste%)`;
 * `containers = ceil(gallons ÷ container size)`.
 * Sheet: `rolls = ceil(area × (1 + waste%) ÷ coverage per roll)`.
 *
 * Reference values (see docs/FORMULAS.md, Phase 4 table): CUSTOM
 * Building Products RedGard technical data sheet (TDS-104) —
 * general waterproofing 110 ft²/gal per coat, IAPMO shower-pan
 * liner 80 ft²/gal per coat, crack prevention 100 ft²/gal in one
 * coat (50 ft²/gal per coat for the two-coat ANSI A118.12
 * application). MAPEI AquaDefense covers about 210 ft² per 3.5 gal
 * pail over two coats. Sheet membrane: Schluter-KERDI 200/10M is
 * 3 ft 3 in × 33 ft = 108 ft² per roll (other KERDI rolls run
 * 54–323 ft²). The calculator defaults to the RedGard general
 * rate (110 ft²/gal per coat) for liquid and the KERDI 200/10M
 * roll (108 ft²) for sheet; both are editable, and the coverage
 * printed on the product is the final word.
 */

export interface LiquidWaterproofingInput {
  areaFt2: number;
  /** Number of coats (2 is the minimum for a liquid membrane). */
  coats: number;
  /** Coverage in ft² per gallon for one coat (110 is the RedGard general rate). */
  coveragePerCoatFt2PerGal: number;
  /** Size of one container in gallons (1 or 3.5 gal pails are common). */
  containerGal: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per container, in USD. */
  pricePerContainer?: number;
}

export interface LiquidWaterproofingResult {
  /** Gallons needed (waste included, before rounding). */
  gallons: number;
  /** Containers to buy (rounded up). */
  containers: number;
  /** Liters to buy. */
  litersToBuy: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateLiquidWaterproofing(
  input: LiquidWaterproofingInput,
): LiquidWaterproofingResult {
  const gallons =
    (input.areaFt2 * input.coats * (1 + input.wastePct / 100)) / input.coveragePerCoatFt2PerGal;
  const containers = ceilUp(gallons / input.containerGal);
  const litersToBuy = gallonsToLiters(containers * input.containerGal);
  const costUsd =
    input.pricePerContainer !== undefined ? containers * input.pricePerContainer : undefined;
  return { gallons, containers, litersToBuy, costUsd };
}

export interface SheetWaterproofingInput {
  areaFt2: number;
  /** Coverage in ft² for one roll (108 for KERDI 200/10M). */
  rollCoverageFt2: number;
  /** Waste allowance in percent for seams and cuts, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per roll, in USD. */
  pricePerRoll?: number;
}

export interface SheetWaterproofingResult {
  /** Rolls to buy (rounded up). */
  rolls: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateSheetWaterproofing(
  input: SheetWaterproofingInput,
): SheetWaterproofingResult {
  const rolls = ceilUp((input.areaFt2 * (1 + input.wastePct / 100)) / input.rollCoverageFt2);
  const costUsd = input.pricePerRoll !== undefined ? rolls * input.pricePerRoll : undefined;
  return { rolls, costUsd };
}
