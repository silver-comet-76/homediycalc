/**
 * Unified unit conversion engine — the single source of truth for every
 * unit conversion on HomeDIYCalc.
 *
 * Canonical internal units:
 *   - length: feet (ft)
 *   - area: square feet (ft²)
 *   - volume: cubic feet (ft³)
 *   - liquid volume: US gallons (gal)
 *   - coverage: square feet per US gallon (ft²/gal)
 *
 * Rule (AGENTS.md): never convert inline in a component or formula module.
 * Always call the functions in this file. Conversion constants are named and
 * documented here; sources are listed in docs/FORMULAS.md.
 *
 * Exact constants (international yard and pound agreement, 1959):
 *   - 1 ft = 0.3048 m exactly
 *   - 1 in = 25.4 mm exactly
 *   - 1 US gal = 231 in³ exactly, i.e. 3.785411784 L exactly
 * Derived exact constants:
 *   - 1 yd³ = 27 ft³ exactly
 *   - 1 ft² = 0.09290304 m² exactly (0.3048²)
 *   - 1 ft³ = 0.028316846592 m³ exactly (0.3048³)
 */

/** Length units accepted anywhere on the site. */
export type LengthUnit = "ft" | "in" | "yd" | "m" | "cm" | "mm";

/** Area units accepted anywhere on the site. */
export type AreaUnit = "ft2" | "in2" | "yd2" | "m2" | "cm2";

/** Volume units accepted anywhere on the site. */
export type VolumeUnit = "ft3" | "yd3" | "in3" | "m3" | "L" | "gal";

/**
 * Coverage units: area covered per unit of liquid volume. Cans print
 * ft² per US gallon in imperial and m² per liter in metric — never
 * m² per gallon — so coverage is its own unit family, not a pure area.
 */
export type CoverageUnit = "ft2/gal" | "m2/L";

/** Meters in one foot — exact by the 1959 international yard agreement. */
export const METERS_PER_FOOT = 0.3048;

/** Millimeters in one inch — exact. */
export const MILLIMETERS_PER_INCH = 25.4;

/** Inches in one foot — exact. */
export const INCHES_PER_FOOT = 12;

/** Feet in one yard — exact. */
export const FEET_PER_YARD = 3;

/** Cubic feet in one cubic yard — exact (3³). */
export const CUBIC_FEET_PER_CUBIC_YARD = 27;

/** Liters in one US gallon — exact (231 in³ = 3.785411784 L). */
export const LITERS_PER_US_GALLON = 3.785411784;

/**
 * Square meters per liter in one square foot per US gallon — exact,
 * derived from the two exact constants above: 1 ft² = 0.09290304 m²
 * and 1 US gal = 3.785411784 L. A coverage rate is an area-per-volume
 * quantity, not a pure area: converting it as a pure area overstates
 * the metric figure by the gallon-to-liter ratio (3.785×).
 */
export const SQM_PER_LITER_PER_SQFT_PER_GALLON =
  (METERS_PER_FOOT * METERS_PER_FOOT) / LITERS_PER_US_GALLON;

/** Cubic inches in one US gallon — exact. */
export const CUBIC_INCHES_PER_US_GALLON = 231;

/** Cubic inches in one US fluid ounce — exact (231 in³ ÷ 128 fl oz). */
export const CUBIC_INCHES_PER_FLUID_OUNCE = CUBIC_INCHES_PER_US_GALLON / 128;

/** Square inches in one square foot — exact (12²). */
export const SQUARE_INCHES_PER_SQUARE_FOOT = 144;

/** Cubic inches in one cubic foot — exact (12³). */
export const CUBIC_INCHES_PER_CUBIC_FOOT = 1728;

/** Square feet in one square yard — exact (3²). */
export const SQUARE_FEET_PER_SQUARE_YARD = 9;

/** Square feet in one acre — exact by definition. */
export const SQUARE_FEET_PER_ACRE = 43560;

/** Pounds in one US short ton — exact by definition. */
export const POUNDS_PER_US_TON = 2000;

/** Kilograms in one pound (avoirdupois) — exact by definition. */
export const KILOGRAMS_PER_POUND = 0.45359237;

/** Length of one unit expressed in feet (the canonical length unit). */
const FEET_PER_LENGTH_UNIT: Record<LengthUnit, number> = {
  ft: 1,
  in: 1 / INCHES_PER_FOOT,
  yd: FEET_PER_YARD,
  m: 1 / METERS_PER_FOOT,
  cm: 1 / (METERS_PER_FOOT * 100),
  mm: 1 / (METERS_PER_FOOT * 1000),
};

/** Area of one unit expressed in square feet (the canonical area unit). */
const SQFT_PER_AREA_UNIT: Record<AreaUnit, number> = {
  ft2: 1,
  in2: 1 / (INCHES_PER_FOOT * INCHES_PER_FOOT),
  yd2: SQUARE_FEET_PER_SQUARE_YARD,
  m2: 1 / (METERS_PER_FOOT * METERS_PER_FOOT),
  cm2: 1 / (METERS_PER_FOOT * METERS_PER_FOOT * 100 * 100),
};

/** Volume of one unit expressed in cubic feet (the canonical volume unit). */
const CUFT_PER_VOLUME_UNIT: Record<VolumeUnit, number> = {
  ft3: 1,
  yd3: CUBIC_FEET_PER_CUBIC_YARD,
  in3: 1 / (INCHES_PER_FOOT * INCHES_PER_FOOT * INCHES_PER_FOOT),
  m3: 1 / (METERS_PER_FOOT * METERS_PER_FOOT * METERS_PER_FOOT),
  // 1 L = 0.001 m³; 1 ft³ = 0.028316846592 m³.
  L: 0.001 / (METERS_PER_FOOT * METERS_PER_FOOT * METERS_PER_FOOT),
  gal: (LITERS_PER_US_GALLON * 0.001) / (METERS_PER_FOOT * METERS_PER_FOOT * METERS_PER_FOOT),
};

/**
 * Convert a length between any two supported units. The measured quantity
 * is preserved: converting a value and converting it back returns the
 * original value (up to floating-point rounding).
 */
export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  if (from === to) return value;
  const inFeet = value * FEET_PER_LENGTH_UNIT[from];
  return inFeet / FEET_PER_LENGTH_UNIT[to];
}

/**
 * Convert an area between any two supported units. The measured quantity
 * is preserved on round-trip.
 */
export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  if (from === to) return value;
  const inSqFt = value * SQFT_PER_AREA_UNIT[from];
  return inSqFt / SQFT_PER_AREA_UNIT[to];
}

/**
 * Convert a volume between any two supported units (including liquid
 * volume: US gallons and liters). The measured quantity is preserved on
 * round-trip.
 */
export function convertVolume(value: number, from: VolumeUnit, to: VolumeUnit): number {
  if (from === to) return value;
  const inCuFt = value * CUFT_PER_VOLUME_UNIT[from];
  return inCuFt / CUFT_PER_VOLUME_UNIT[to];
}

/**
 * Convert a coverage rate between ft² per US gallon and m² per liter.
 * The covered area per unit of liquid is preserved: converting a value
 * and converting it back returns the original value (up to
 * floating-point rounding).
 */
export function convertCoverage(value: number, from: CoverageUnit, to: CoverageUnit): number {
  if (from === to) return value;
  if (from === "ft2/gal") return value * SQM_PER_LITER_PER_SQFT_PER_GALLON;
  return value / SQM_PER_LITER_PER_SQFT_PER_GALLON;
}

/** Convert any coverage rate to the canonical unit, ft² per US gallon. */
export function toSquareFeetPerGallon(value: number, from: CoverageUnit): number {
  return convertCoverage(value, from, "ft2/gal");
}

/** Convert a coverage rate in ft² per US gallon to the requested display unit. */
export function fromSquareFeetPerGallon(valueInFt2PerGal: number, to: CoverageUnit): number {
  return convertCoverage(valueInFt2PerGal, "ft2/gal", to);
}

/** Convert any length to the canonical unit, feet. */
export function toFeet(value: number, from: LengthUnit): number {
  return convertLength(value, from, "ft");
}

/** Convert a length in feet to the requested display unit. */
export function fromFeet(valueInFeet: number, to: LengthUnit): number {
  return convertLength(valueInFeet, "ft", to);
}

/** Convert any area to the canonical unit, square feet. */
export function toSquareFeet(value: number, from: AreaUnit): number {
  return convertArea(value, from, "ft2");
}

/** Convert an area in square feet to the requested display unit. */
export function fromSquareFeet(valueInSqFt: number, to: AreaUnit): number {
  return convertArea(valueInSqFt, "ft2", to);
}

/** Convert any volume to the canonical unit, cubic feet. */
export function toCubicFeet(value: number, from: VolumeUnit): number {
  return convertVolume(value, from, "ft3");
}

/** Convert a volume in cubic feet to the requested display unit. */
export function fromCubicFeet(valueInCuFt: number, to: VolumeUnit): number {
  return convertVolume(valueInCuFt, "ft3", to);
}

/** Convert cubic feet to cubic yards (divide by 27). */
export function cubicFeetToCubicYards(cubicFeet: number): number {
  return cubicFeet / CUBIC_FEET_PER_CUBIC_YARD;
}

/** Convert cubic yards to cubic feet (multiply by 27). */
export function cubicYardsToCubicFeet(cubicYards: number): number {
  return cubicYards * CUBIC_FEET_PER_CUBIC_YARD;
}

/** Convert US gallons to liters. */
export function gallonsToLiters(gallons: number): number {
  return gallons * LITERS_PER_US_GALLON;
}

/** Convert liters to US gallons. */
export function litersToGallons(liters: number): number {
  return liters / LITERS_PER_US_GALLON;
}

/** Convert square feet to square meters. */
export function squareFeetToSquareMeters(squareFeet: number): number {
  return convertArea(squareFeet, "ft2", "m2");
}

/** Convert square meters to square feet. */
export function squareMetersToSquareFeet(squareMeters: number): number {
  return convertArea(squareMeters, "m2", "ft2");
}

/** Convert cubic feet to cubic meters. */
export function cubicFeetToCubicMeters(cubicFeet: number): number {
  return convertVolume(cubicFeet, "ft3", "m3");
}

/** Convert cubic meters to cubic feet. */
export function cubicMetersToCubicFeet(cubicMeters: number): number {
  return convertVolume(cubicMeters, "m3", "ft3");
}

/** Convert square feet to acres. */
export function squareFeetToAcres(squareFeet: number): number {
  return squareFeet / SQUARE_FEET_PER_ACRE;
}

/** Convert pounds to kilograms. */
export function poundsToKilograms(pounds: number): number {
  return pounds * KILOGRAMS_PER_POUND;
}

/** Convert pounds to US short tons. */
export function poundsToShortTons(pounds: number): number {
  return pounds / POUNDS_PER_US_TON;
}

/**
 * Round a value for display only. Full precision is kept internally until
 * the final display step; never round an intermediate result that feeds
 * another calculation.
 */
export function roundForDisplay(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Round a purchase quantity up, tolerating floating-point noise: a value
 * that is mathematically whole (e.g. 100 × 1.10 = 110) must not round up
 * to the next whole number because binary floating point stored it as
 * 110.00000000000001.
 *
 * Tolerance (ADR-11): a *relative* epsilon of 1e-12 — the larger of
 * 1e-12 absolute and 1e-12 × |value|. Binary floating-point noise after
 * the short calculation chains in this codebase is at most ~1e-13
 * relative, so anything within 1e-12 relative of a whole number is
 * noise, not a real extra unit. A genuinely above-integer requirement
 * (e.g. 5.0000000005, 5e-10 above 5 — far outside the tolerance) still
 * rounds up. Inputs are user-entered quantities with at most a few
 * decimal places, so a real requirement can never land within 1e-12
 * relative of an integer except by floating-point error.
 *
 * Guarantee: any strictly positive requirement orders at least one
 * package — a positive valid material requirement never recommends
 * zero packages. Zero or negative (including NaN) returns 0; callers
 * validate inputs upstream, so a zero requirement (e.g. a wall fully
 * covered by openings) stays zero.
 */
export function ceilUp(value: number): number {
  if (!(value > 0)) return 0;
  const epsilon = Math.max(1e-12, Math.abs(value) * 1e-12);
  return Math.max(1, Math.ceil(value - epsilon));
}
