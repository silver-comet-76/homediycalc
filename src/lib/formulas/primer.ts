import { ceilUp, gallonsToLiters } from "../units";

/**
 * Primer Calculator — gallons of primer for walls, distinct from the
 * Paint Calculator: primer is the sealing first coat, and how much
 * the surface drinks decides the coverage.
 *
 * Pure functions only. Canonical units: square feet for area,
 * US gallons for liquid volume.
 *
 * Formula: `primer = net area × coats × surface factor ÷ coverage
 * × (1 + waste%)`; `gallons to buy = ceil(primer)`.
 *
 * Reference values (see docs/FORMULAS.md, Phase 4 table):
 * Sherwin-Williams ProBlock primers print 400 ft²/gal at 4 mils
 * wet (ProBlock Quick Dry and ProBlock Premium data sheets, 2026),
 * while PVA drywall primer runs 250–300 ft²/gal on new drywall.
 * The calculator defaults to 300 ft²/gal — between the two — and
 * the coverage field is editable. The surface-condition factor is
 * estimating guidance derived from those published ranges, not a
 * manufacturer figure: at the 300 ft²/gal default, new drywall
 * (factor 1.20) works out to 250 ft²/gal, the low end of the PVA
 * range; previously painted surfaces take the full 300 ft²/gal.
 *
 * When primer is needed: always on new drywall, joint compound,
 * bare wood, masonry, and metal; over water, smoke, and tannin
 * stains; and for a dark-to-light color change. A sound, previously
 * painted wall in a similar color usually needs no primer at all.
 */

export interface PrimerCondition {
  /** Multiplier on the primer needed (1.00 for a sealed surface). */
  factor: number;
  label: string;
}

/** Surface-condition factors (estimating guidance — see the header). */
export const PRIMER_CONDITIONS: Record<string, PrimerCondition> = {
  painted: { factor: 1.0, label: "Previously painted, sound" },
  drywall: { factor: 1.2, label: "New drywall / bare plaster" },
  wood: { factor: 1.3, label: "Bare wood" },
  stained: { factor: 1.15, label: "Stained / patched" },
};

export interface PrimerInput {
  netAreaFt2: number;
  /** Number of primer coats (usually 1). */
  coats: number;
  /** Coverage in ft² per gallon (300 is the default). */
  coverageFt2PerGal: number;
  /** Surface-condition factor (see PRIMER_CONDITIONS). */
  conditionFactor: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per gallon, in USD. */
  pricePerGal?: number;
}

export interface PrimerResult {
  /** Gallons of primer needed before rounding (waste included). */
  adjustedGallons: number;
  /** Gallons to buy (rounded up to whole gallons). */
  gallonsToBuy: number;
  /** Liters to buy. */
  litersToBuy: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculatePrimer(input: PrimerInput): PrimerResult {
  const rawGallons =
    (input.netAreaFt2 * input.coats * input.conditionFactor) / input.coverageFt2PerGal;
  const adjustedGallons = rawGallons * (1 + input.wastePct / 100);
  const gallonsToBuy = ceilUp(adjustedGallons);
  const litersToBuy = gallonsToLiters(gallonsToBuy);
  const costUsd = input.pricePerGal !== undefined ? gallonsToBuy * input.pricePerGal : undefined;
  return { adjustedGallons, gallonsToBuy, litersToBuy, costUsd };
}
