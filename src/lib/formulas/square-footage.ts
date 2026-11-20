/**
 * Square Footage Calculator — area of a room or space.
 *
 * Pure functions only. Canonical unit: square feet. Shapes: rectangle,
 * circle, triangle, and L-shaped (two rectangles added together).
 */

import { convertArea, squareFeetToAcres } from "../units";

export type SquareFootageShape = "rectangle" | "circle" | "triangle" | "l-shape";

export interface SquareFootageInput {
  shape: SquareFootageShape;
  /** Rectangle length, triangle base, or L-shape first rectangle length (ft). */
  lengthFt: number;
  /** Rectangle width, triangle height, or L-shape first rectangle width (ft). */
  widthFt: number;
  /** Circle radius (ft). Only used for the circle shape. */
  radiusFt?: number;
  /** L-shape second rectangle length (ft). */
  length2Ft?: number;
  /** L-shape second rectangle width (ft). */
  width2Ft?: number;
}

export interface SquareFootageResult {
  areaFt2: number;
  areaM2: number;
  areaYd2: number;
  acres: number;
}

export function calculateSquareFootage(input: SquareFootageInput): SquareFootageResult {
  let areaFt2: number;
  switch (input.shape) {
    case "rectangle":
      areaFt2 = input.lengthFt * input.widthFt;
      break;
    case "circle":
      areaFt2 = Math.PI * (input.radiusFt ?? 0) ** 2;
      break;
    case "triangle":
      areaFt2 = 0.5 * input.lengthFt * input.widthFt;
      break;
    case "l-shape":
      areaFt2 =
        input.lengthFt * input.widthFt +
        (input.length2Ft ?? 0) * (input.width2Ft ?? 0);
      break;
  }
  return {
    areaFt2,
    areaM2: convertArea(areaFt2, "ft2", "m2"),
    areaYd2: convertArea(areaFt2, "ft2", "yd2"),
    acres: squareFeetToAcres(areaFt2),
  };
}
