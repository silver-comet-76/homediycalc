import { ceilUp, CUBIC_INCHES_PER_FLUID_OUNCE } from "../units";

/**
 * Sealant Calculator — tubes of caulk or sealant for a joint.
 *
 * Pure functions only. Canonical units: feet for joint length,
 * inches for bead width and depth, US fluid ounces for tube volume.
 *
 * A bead is a volume, not a line. The joint is modeled as a
 * rectangular cross-section (width × depth — the standard
 * estimator's shape for a tooled joint):
 *   `volume (in³) = joint length (ft) × 12 × width (in) × depth (in)`
 *   `× (1 + waste%)`
 *   `tubes = ceil(volume (fl oz) ÷ tube volume (fl oz))`
 *   `coverage per tube (ft) = tube volume (in³) ÷ (width × depth) ÷ 12`
 * One US fluid ounce is 231 ÷ 128 = 1.8047 in³, so a standard
 * 10.1 fl oz cartridge holds 18.2 in³.
 *
 * Reference values (see docs/FORMULAS.md, Phase 4 table): the
 * volume method is exact arithmetic, not a quoted rate — at a
 * 1/4 × 1/4 in bead one 10.1 fl oz tube covers 24.3 linear ft,
 * matching the ~25 ft trade rule of thumb; at 3/8 × 3/8 in it
 * covers 10.8 ft, and at 1/2 × 1/2 in only 6.1 ft, because the
 * bead's cross-section is squared. For moving joints the cured
 * depth should be about half the width (a 1/2 in wide joint wants
 * 1/4 in of sealant), with a practical minimum around 1/4 in.
 */

export interface SealantInput {
  /** Total joint length, in feet (all joints added together). */
  jointLengthFt: number;
  /** Bead width, in inches. */
  beadWidthIn: number;
  /** Bead depth, in inches. */
  beadDepthIn: number;
  /** Volume of one tube, in US fluid ounces (10.1 is standard). */
  tubeVolumeFlOz: number;
  /** Waste allowance in percent, e.g. 10 for 10%. */
  wastePct: number;
  /** Optional price per tube, in USD. */
  pricePerTube?: number;
}

export interface SealantResult {
  /** Sealant volume needed, in cubic inches (waste included). */
  volumeIn3: number;
  /** Sealant volume needed, in US fluid ounces (waste included). */
  volumeFlOz: number;
  /** Linear feet one tube covers at this bead size. */
  coverageFtPerTube: number;
  /** Tubes to buy (rounded up). */
  tubes: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateSealant(input: SealantInput): SealantResult {
  const crossSectionIn2 = input.beadWidthIn * input.beadDepthIn;
  const volumeIn3 = input.jointLengthFt * 12 * crossSectionIn2 * (1 + input.wastePct / 100);
  const volumeFlOz = volumeIn3 / CUBIC_INCHES_PER_FLUID_OUNCE;
  const tubeVolumeIn3 = input.tubeVolumeFlOz * CUBIC_INCHES_PER_FLUID_OUNCE;
  const coverageFtPerTube = tubeVolumeIn3 / crossSectionIn2 / 12;
  const tubes = ceilUp(volumeFlOz / input.tubeVolumeFlOz);
  const costUsd = input.pricePerTube !== undefined ? tubes * input.pricePerTube : undefined;
  return { volumeIn3, volumeFlOz, coverageFtPerTube, tubes, costUsd };
}
