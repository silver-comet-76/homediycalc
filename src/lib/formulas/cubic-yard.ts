/**
 * Cubic Yard Calculator — a volume conversion tool.
 *
 * Distinct intent from the material calculators: this converts volumes
 * and measures a space in cubic yards; it estimates no material, weight,
 * or bags. Two modes: convert a known volume between units, or measure
 * a volume from length × width × depth.
 *
 * Pure functions only. All conversion goes through src/lib/units.ts.
 */

import { convertVolume, cubicFeetToCubicYards, type VolumeUnit } from "../units";

export interface CubicYardDimensionsInput {
  lengthFt: number;
  widthFt: number;
  depthFt: number;
}

export interface CubicYardResult {
  volumeFt3: number;
  volumeYd3: number;
  volumeM3: number;
  volumeLiters: number;
  volumeGallons: number;
}

export function calculateCubicYardFromDimensions(input: CubicYardDimensionsInput): CubicYardResult {
  const volumeFt3 = input.lengthFt * input.widthFt * input.depthFt;
  return {
    volumeFt3,
    volumeYd3: cubicFeetToCubicYards(volumeFt3),
    volumeM3: convertVolume(volumeFt3, "ft3", "m3"),
    volumeLiters: convertVolume(volumeFt3, "ft3", "L"),
    volumeGallons: convertVolume(volumeFt3, "ft3", "gal"),
  };
}

/** Convert a volume given in any supported unit into all the others. */
export function convertCubicYardValue(value: number, from: VolumeUnit): CubicYardResult {
  const volumeFt3 = convertVolume(value, from, "ft3");
  return {
    volumeFt3,
    volumeYd3: cubicFeetToCubicYards(volumeFt3),
    volumeM3: convertVolume(volumeFt3, "ft3", "m3"),
    volumeLiters: convertVolume(volumeFt3, "ft3", "L"),
    volumeGallons: convertVolume(volumeFt3, "ft3", "gal"),
  };
}
