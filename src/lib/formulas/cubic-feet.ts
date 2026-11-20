/**
 * Cubic Feet Calculator — volume from dimensions, in cubic feet.
 *
 * Distinct intent from the Cubic Yard Calculator: this one starts from
 * dimensions and lets each dimension carry its own unit (feet, inches,
 * yards, meters, centimeters, or millimeters), so a mixed-unit measurement
 * — e.g. a box 5 ft long, 24 in wide, 60 cm high — works without manual
 * conversion. Output is centered on cubic feet, with cubic yards, cubic
 * meters, cubic inches, liters, and gallons alongside.
 *
 * Pure functions only. All conversion goes through src/lib/units.ts.
 * Inputs arrive already converted to feet by the island.
 */

import { convertVolume, cubicFeetToCubicYards } from "../units";

export interface CubicFeetInput {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
}

export interface CubicFeetResult {
  volumeFt3: number;
  volumeYd3: number;
  volumeM3: number;
  volumeIn3: number;
  volumeLiters: number;
  volumeGallons: number;
}

export function calculateCubicFeet(input: CubicFeetInput): CubicFeetResult {
  const volumeFt3 = input.lengthFt * input.widthFt * input.heightFt;
  return {
    volumeFt3,
    volumeYd3: cubicFeetToCubicYards(volumeFt3),
    volumeM3: convertVolume(volumeFt3, "ft3", "m3"),
    volumeIn3: convertVolume(volumeFt3, "ft3", "in3"),
    volumeLiters: convertVolume(volumeFt3, "ft3", "L"),
    volumeGallons: convertVolume(volumeFt3, "ft3", "gal"),
  };
}
