/**
 * Lookup-table tests — lives at src/calculators/lookup-table.test.ts in the repo.
 *
 * Each calculator config carries a `lookupTable` ({ headers, rows }) of
 * common sizes. The first column of every row is a descriptive input label
 * (e.g. "10 × 10 ft room") and is NOT recomputed; every other cell is a
 * value the calculator itself displays, so this test recomputes each one by
 * calling that config's compute() with the same standard inputs and asserts
 * the table cell equals the recomputed display string. No expected output
 * value is hard-coded anywhere in this file: the inputs below are the only
 * source data, and the expected values come from running the code.
 *
 * Inputs are display (imperial) values, as a user would type them — feet,
 * inches for depths/thicknesses, ft², ft³, yd³ where the field shows that
 * unit, ft²/gal coverage, or raw numbers for count/percent/select fields.
 * They are converted to the canonical units each formula expects with the
 * same toCanonical logic the GenericCalculator island uses.
 */
import { describe, expect, it } from "vitest";
import { CALCULATOR_CONFIGS } from "./index";
import { linkedTextToPlain } from "../lib/linked-text";
import {
  convertArea,
  convertCoverage,
  convertLength,
  convertVolume,
  type AreaUnit,
  type CoverageUnit,
  type LengthUnit,
  type VolumeUnit,
} from "../lib/units";
import type { FieldSpec } from "../components/react/CalculatorConfig";

/** Convert a displayed value to the canonical unit its formula expects. */
function toCanonical(value: number, unit: string, field: FieldSpec): number {
  if (!field.unitKind) return value;
  if (field.unitKind === "length") {
    return convertLength(value, unit as LengthUnit, (field.canonicalUnit ?? "ft") as LengthUnit);
  }
  if (field.unitKind === "area") {
    return convertArea(value, unit as AreaUnit, (field.canonicalUnit ?? "ft2") as AreaUnit);
  }
  if (field.unitKind === "coverage") {
    return convertCoverage(
      value,
      unit as CoverageUnit,
      (field.canonicalUnit ?? "ft2/gal") as CoverageUnit,
    );
  }
  return convertVolume(value, unit as VolumeUnit, (field.canonicalUnit ?? "ft3") as VolumeUnit);
}

interface LookupRowInput {
  /** Descriptive first-column label; not a computed value. */
  label: string;
  /** Display (imperial) input values keyed by field id. */
  display: Record<string, number>;
}

interface LookupInputs {
  mode: string;
  rows: LookupRowInput[];
}

/**
 * Standard inputs per calculator, as display values. The matching lookup
 * table file (<slug>.ts) states the same inputs in its top comment.
 */
const LOOKUP_INPUTS: Record<string, LookupInputs> = {
  "paint-calculator": {
    mode: "room",
    rows: [
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 2,
          coverage: 350,
          waste: 10,
        },
      },
      {
        label: "12 × 12 ft room",
        display: {
          length: 12,
          width: 12,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 2,
          coverage: 350,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 2,
          coverage: 350,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 2,
          coverage: 350,
          waste: 10,
        },
      },
      {
        label: "20 × 20 ft room",
        display: {
          length: 20,
          width: 20,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 2,
          coverage: 350,
          waste: 10,
        },
      },
    ],
  },
  "concrete-calculator": {
    mode: "pour",
    rows: [
      {
        label: "10 × 10 × 4 in pour",
        display: {
          length: 10,
          width: 10,
          depth: 4,
          waste: 10,
          quarterYard: 1,
        },
      },
      {
        label: "10 × 20 × 4 in pour",
        display: {
          length: 10,
          width: 20,
          depth: 4,
          waste: 10,
          quarterYard: 1,
        },
      },
      {
        label: "12 × 12 × 4 in pour",
        display: {
          length: 12,
          width: 12,
          depth: 4,
          waste: 10,
          quarterYard: 1,
        },
      },
      {
        label: "20 × 20 × 4 in pour",
        display: {
          length: 20,
          width: 20,
          depth: 4,
          waste: 10,
          quarterYard: 1,
        },
      },
      {
        label: "10 × 10 × 6 in pour",
        display: {
          length: 10,
          width: 10,
          depth: 6,
          waste: 10,
          quarterYard: 1,
        },
      },
    ],
  },
  "concrete-slab-calculator": {
    mode: "slab",
    rows: [
      {
        label: "10 × 10 × 4 in slab",
        display: {
          length: 10,
          width: 10,
          thickness: 4,
          waste: 10,
          quarterYard: 1,
          meshArea: 160,
        },
      },
      {
        label: "12 × 12 × 4 in slab",
        display: {
          length: 12,
          width: 12,
          thickness: 4,
          waste: 10,
          quarterYard: 1,
          meshArea: 160,
        },
      },
      {
        label: "20 × 12 × 4 in slab",
        display: {
          length: 20,
          width: 12,
          thickness: 4,
          waste: 10,
          quarterYard: 1,
          meshArea: 160,
        },
      },
      {
        label: "20 × 20 × 4 in slab",
        display: {
          length: 20,
          width: 20,
          thickness: 4,
          waste: 10,
          quarterYard: 1,
          meshArea: 160,
        },
      },
      {
        label: "10 × 20 × 6 in slab",
        display: {
          length: 10,
          width: 20,
          thickness: 6,
          waste: 10,
          quarterYard: 1,
          meshArea: 160,
        },
      },
    ],
  },
  "square-footage-calculator": {
    mode: "rectangle",
    rows: [
      {
        label: "10 × 10 ft",
        display: {
          length: 10,
          width: 10,
        },
      },
      {
        label: "12 × 12 ft",
        display: {
          length: 12,
          width: 12,
        },
      },
      {
        label: "12 × 15 ft",
        display: {
          length: 12,
          width: 15,
        },
      },
      {
        label: "15 × 20 ft",
        display: {
          length: 15,
          width: 20,
        },
      },
      {
        label: "20 × 30 ft",
        display: {
          length: 20,
          width: 30,
        },
      },
    ],
  },
  "gravel-calculator": {
    mode: "area",
    rows: [
      {
        label: "10 × 10 × 2 in bed",
        display: {
          length: 10,
          width: 10,
          depth: 2,
          waste: 5,
          density: 2800,
        },
      },
      {
        label: "10 × 10 × 3 in bed",
        display: {
          length: 10,
          width: 10,
          depth: 3,
          waste: 5,
          density: 2800,
        },
      },
      {
        label: "10 × 20 × 3 in bed",
        display: {
          length: 10,
          width: 20,
          depth: 3,
          waste: 5,
          density: 2800,
        },
      },
      {
        label: "20 × 20 × 3 in bed",
        display: {
          length: 20,
          width: 20,
          depth: 3,
          waste: 5,
          density: 2800,
        },
      },
      {
        label: "12 × 12 × 4 in bed",
        display: {
          length: 12,
          width: 12,
          depth: 4,
          waste: 5,
          density: 2800,
        },
      },
    ],
  },
  "mulch-calculator": {
    mode: "bed",
    rows: [
      {
        label: "10 × 10 × 2 in bed",
        display: {
          length: 10,
          width: 10,
          depth: 2,
          waste: 5,
          bagSize: 2,
        },
      },
      {
        label: "10 × 10 × 3 in bed",
        display: {
          length: 10,
          width: 10,
          depth: 3,
          waste: 5,
          bagSize: 2,
        },
      },
      {
        label: "12 × 12 × 3 in bed",
        display: {
          length: 12,
          width: 12,
          depth: 3,
          waste: 5,
          bagSize: 2,
        },
      },
      {
        label: "10 × 20 × 3 in bed",
        display: {
          length: 10,
          width: 20,
          depth: 3,
          waste: 5,
          bagSize: 2,
        },
      },
      {
        label: "20 × 20 × 3 in bed",
        display: {
          length: 20,
          width: 20,
          depth: 3,
          waste: 5,
          bagSize: 2,
        },
      },
    ],
  },
  "topsoil-calculator": {
    mode: "area",
    rows: [
      {
        label: "10 × 10 × 3 in bed",
        display: {
          length: 10,
          width: 10,
          depth: 3,
          waste: 10,
          density: 2000,
          bagSize: 0.75,
        },
      },
      {
        label: "10 × 10 × 6 in bed",
        display: {
          length: 10,
          width: 10,
          depth: 6,
          waste: 10,
          density: 2000,
          bagSize: 0.75,
        },
      },
      {
        label: "12 × 12 × 6 in bed",
        display: {
          length: 12,
          width: 12,
          depth: 6,
          waste: 10,
          density: 2000,
          bagSize: 0.75,
        },
      },
      {
        label: "10 × 20 × 6 in bed",
        display: {
          length: 10,
          width: 20,
          depth: 6,
          waste: 10,
          density: 2000,
          bagSize: 0.75,
        },
      },
      {
        label: "20 × 20 × 6 in bed",
        display: {
          length: 20,
          width: 20,
          depth: 6,
          waste: 10,
          density: 2000,
          bagSize: 0.75,
        },
      },
    ],
  },
  "cubic-yard-calculator": {
    mode: "convert",
    rows: [
      {
        label: "1 yd³ (27 ft³)",
        display: {
          value: 27,
        },
      },
      {
        label: "2 yd³ (54 ft³)",
        display: {
          value: 54,
        },
      },
      {
        label: "3 yd³ (81 ft³)",
        display: {
          value: 81,
        },
      },
      {
        label: "5 yd³ (135 ft³)",
        display: {
          value: 135,
        },
      },
      {
        label: "10 yd³ (270 ft³)",
        display: {
          value: 270,
        },
      },
    ],
  },
  "cubic-feet-calculator": {
    mode: "dimensions",
    rows: [
      {
        label: "2 × 2 × 2 ft box",
        display: {
          length: 2,
          width: 2,
          height: 2,
        },
      },
      {
        label: "5 × 4 × 2 ft box",
        display: {
          length: 5,
          width: 4,
          height: 2,
        },
      },
      {
        label: "10 × 10 × 1 ft box",
        display: {
          length: 10,
          width: 10,
          height: 1,
        },
      },
      {
        label: "10 × 10 × 2 ft box",
        display: {
          length: 10,
          width: 10,
          height: 2,
        },
      },
      {
        label: "20 × 10 × 2 ft box",
        display: {
          length: 20,
          width: 10,
          height: 2,
        },
      },
    ],
  },
  "tile-calculator": {
    mode: "dimensions",
    rows: [
      {
        label: "5 × 8 ft room",
        display: {
          length: 5,
          width: 8,
          tileLength: 12,
          tileWidth: 12,
          joint: 0.125,
          waste: 10,
          tilesPerBox: 10,
        },
      },
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          tileLength: 12,
          tileWidth: 12,
          joint: 0.125,
          waste: 10,
          tilesPerBox: 10,
        },
      },
      {
        label: "12 × 12 ft room",
        display: {
          length: 12,
          width: 12,
          tileLength: 12,
          tileWidth: 12,
          joint: 0.125,
          waste: 10,
          tilesPerBox: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          tileLength: 12,
          tileWidth: 12,
          joint: 0.125,
          waste: 10,
          tilesPerBox: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          tileLength: 12,
          tileWidth: 12,
          joint: 0.125,
          waste: 10,
          tilesPerBox: 10,
        },
      },
    ],
  },
  "brick-calculator": {
    mode: "wall",
    rows: [
      {
        label: "10 × 8 ft wall",
        display: {
          length: 10,
          height: 8,
          openings: 0,
          brickLength: 7.625,
          brickHeight: 2.25,
          brickDepth: 3.625,
          joint: 0.375,
          waste: 5,
          mortarWaste: 15,
          bricksPerBag: 37,
        },
      },
      {
        label: "12 × 8 ft wall",
        display: {
          length: 12,
          height: 8,
          openings: 0,
          brickLength: 7.625,
          brickHeight: 2.25,
          brickDepth: 3.625,
          joint: 0.375,
          waste: 5,
          mortarWaste: 15,
          bricksPerBag: 37,
        },
      },
      {
        label: "20 × 8 ft wall",
        display: {
          length: 20,
          height: 8,
          openings: 0,
          brickLength: 7.625,
          brickHeight: 2.25,
          brickDepth: 3.625,
          joint: 0.375,
          waste: 5,
          mortarWaste: 15,
          bricksPerBag: 37,
        },
      },
      {
        label: "20 × 10 ft wall",
        display: {
          length: 20,
          height: 10,
          openings: 0,
          brickLength: 7.625,
          brickHeight: 2.25,
          brickDepth: 3.625,
          joint: 0.375,
          waste: 5,
          mortarWaste: 15,
          bricksPerBag: 37,
        },
      },
      {
        label: "30 × 8 ft wall",
        display: {
          length: 30,
          height: 8,
          openings: 0,
          brickLength: 7.625,
          brickHeight: 2.25,
          brickDepth: 3.625,
          joint: 0.375,
          waste: 5,
          mortarWaste: 15,
          bricksPerBag: 37,
        },
      },
    ],
  },
  "drywall-calculator": {
    mode: "room",
    rows: [
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          height: 8,
          doors: 1,
          windows: 2,
          ceiling: 1,
          sheetSize: 32,
          waste: 10,
          compoundCoverage: 100,
          pailSize: 4.5,
        },
      },
      {
        label: "12 × 12 ft room",
        display: {
          length: 12,
          width: 12,
          height: 8,
          doors: 1,
          windows: 2,
          ceiling: 1,
          sheetSize: 32,
          waste: 10,
          compoundCoverage: 100,
          pailSize: 4.5,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          height: 8,
          doors: 1,
          windows: 2,
          ceiling: 1,
          sheetSize: 32,
          waste: 10,
          compoundCoverage: 100,
          pailSize: 4.5,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          height: 8,
          doors: 1,
          windows: 2,
          ceiling: 1,
          sheetSize: 32,
          waste: 10,
          compoundCoverage: 100,
          pailSize: 4.5,
        },
      },
      {
        label: "20 × 20 ft room",
        display: {
          length: 20,
          width: 20,
          height: 8,
          doors: 1,
          windows: 2,
          ceiling: 1,
          sheetSize: 32,
          waste: 10,
          compoundCoverage: 100,
          pailSize: 4.5,
        },
      },
    ],
  },
  "concrete-bags-calculator": {
    mode: "volume",
    rows: [
      {
        label: "0.5 yd³ (13.5 ft³)",
        display: {
          volume: 0.5,
          waste: 10,
        },
      },
      {
        label: "1 yd³ (27 ft³)",
        display: {
          volume: 1,
          waste: 10,
        },
      },
      {
        label: "2 yd³ (54 ft³)",
        display: {
          volume: 2,
          waste: 10,
        },
      },
      {
        label: "3 yd³ (81 ft³)",
        display: {
          volume: 3,
          waste: 10,
        },
      },
      {
        label: "5 yd³ (135 ft³)",
        display: {
          volume: 5,
          waste: 10,
        },
      },
    ],
  },
  "flooring-calculator": {
    mode: "dimensions",
    rows: [
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          boxCoverage: 20,
          underlayment: 1,
          rollCoverage: 100,
          waste: 10,
        },
      },
      {
        label: "12 × 12 ft room",
        display: {
          length: 12,
          width: 12,
          boxCoverage: 20,
          underlayment: 1,
          rollCoverage: 100,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          boxCoverage: 20,
          underlayment: 1,
          rollCoverage: 100,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          boxCoverage: 20,
          underlayment: 1,
          rollCoverage: 100,
          waste: 10,
        },
      },
      {
        label: "20 × 20 ft room",
        display: {
          length: 20,
          width: 20,
          boxCoverage: 20,
          underlayment: 1,
          rollCoverage: 100,
          waste: 10,
        },
      },
    ],
  },
  "paver-calculator": {
    mode: "dimensions",
    rows: [
      {
        label: "10 × 10 ft patio",
        display: {
          length: 10,
          width: 10,
          paverLength: 12,
          paverWidth: 12,
          joint: 0.125,
          paverThickness: 2.375,
          waste: 10,
          baseDepth: 4,
          baseDensity: 2800,
          beddingSandDepth: 1,
          jointSandDensity: 100,
          jointSandBag: 50,
        },
      },
      {
        label: "12 × 12 ft patio",
        display: {
          length: 12,
          width: 12,
          paverLength: 12,
          paverWidth: 12,
          joint: 0.125,
          paverThickness: 2.375,
          waste: 10,
          baseDepth: 4,
          baseDensity: 2800,
          beddingSandDepth: 1,
          jointSandDensity: 100,
          jointSandBag: 50,
        },
      },
      {
        label: "16 × 12 ft patio",
        display: {
          length: 16,
          width: 12,
          paverLength: 12,
          paverWidth: 12,
          joint: 0.125,
          paverThickness: 2.375,
          waste: 10,
          baseDepth: 4,
          baseDensity: 2800,
          beddingSandDepth: 1,
          jointSandDensity: 100,
          jointSandBag: 50,
        },
      },
      {
        label: "10 × 20 ft patio",
        display: {
          length: 10,
          width: 20,
          paverLength: 12,
          paverWidth: 12,
          joint: 0.125,
          paverThickness: 2.375,
          waste: 10,
          baseDepth: 4,
          baseDensity: 2800,
          beddingSandDepth: 1,
          jointSandDensity: 100,
          jointSandBag: 50,
        },
      },
      {
        label: "20 × 20 ft patio",
        display: {
          length: 20,
          width: 20,
          paverLength: 12,
          paverWidth: 12,
          joint: 0.125,
          paverThickness: 2.375,
          waste: 10,
          baseDepth: 4,
          baseDensity: 2800,
          beddingSandDepth: 1,
          jointSandDensity: 100,
          jointSandBag: 50,
        },
      },
    ],
  },
  "grout-calculator": {
    mode: "dimensions",
    rows: [
      {
        label: "5 × 8 ft room",
        display: {
          length: 5,
          width: 8,
          tileLength: 12,
          tileWidth: 12,
          jointWidth: 0.125,
          jointDepth: 0.375,
          density: 98.5,
          bagWeight: 10,
          waste: 10,
        },
      },
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          tileLength: 12,
          tileWidth: 12,
          jointWidth: 0.125,
          jointDepth: 0.375,
          density: 98.5,
          bagWeight: 10,
          waste: 10,
        },
      },
      {
        label: "10 × 12 ft room",
        display: {
          length: 10,
          width: 12,
          tileLength: 12,
          tileWidth: 12,
          jointWidth: 0.125,
          jointDepth: 0.375,
          density: 98.5,
          bagWeight: 10,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          tileLength: 12,
          tileWidth: 12,
          jointWidth: 0.125,
          jointDepth: 0.375,
          density: 98.5,
          bagWeight: 10,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          tileLength: 12,
          tileWidth: 12,
          jointWidth: 0.125,
          jointDepth: 0.375,
          density: 98.5,
          bagWeight: 10,
          waste: 10,
        },
      },
    ],
  },
  "board-foot-calculator": {
    mode: "single",
    rows: [
      {
        label: "1 × 6 in × 8 ft × 10 pieces",
        display: {
          thickness: 1,
          width: 6,
          length: 8,
          pieces: 10,
          waste: 5,
        },
      },
      {
        label: "2 × 4 in × 8 ft × 10 pieces",
        display: {
          thickness: 2,
          width: 4,
          length: 8,
          pieces: 10,
          waste: 5,
        },
      },
      {
        label: "2 × 6 in × 8 ft × 10 pieces",
        display: {
          thickness: 2,
          width: 6,
          length: 8,
          pieces: 10,
          waste: 5,
        },
      },
      {
        label: "2 × 8 in × 12 ft × 10 pieces",
        display: {
          thickness: 2,
          width: 8,
          length: 12,
          pieces: 10,
          waste: 5,
        },
      },
      {
        label: "4 × 4 in × 8 ft × 10 pieces",
        display: {
          thickness: 4,
          width: 4,
          length: 8,
          pieces: 10,
          waste: 5,
        },
      },
    ],
  },
  "mortar-calculator": {
    mode: "dimensions",
    rows: [
      {
        label: "10 × 8 ft wall",
        display: {
          length: 10,
          height: 8,
          unit: 1,
          joint: 0.375,
          waste: 15,
          mortarType: 1,
        },
      },
      {
        label: "12 × 8 ft wall",
        display: {
          length: 12,
          height: 8,
          unit: 1,
          joint: 0.375,
          waste: 15,
          mortarType: 1,
        },
      },
      {
        label: "20 × 8 ft wall",
        display: {
          length: 20,
          height: 8,
          unit: 1,
          joint: 0.375,
          waste: 15,
          mortarType: 1,
        },
      },
      {
        label: "20 × 10 ft wall",
        display: {
          length: 20,
          height: 10,
          unit: 1,
          joint: 0.375,
          waste: 15,
          mortarType: 1,
        },
      },
      {
        label: "30 × 8 ft wall",
        display: {
          length: 30,
          height: 8,
          unit: 1,
          joint: 0.375,
          waste: 15,
          mortarType: 1,
        },
      },
    ],
  },
  "ceiling-tile-calculator": {
    mode: "room",
    rows: [
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          tileSize: 4,
          waste: 10,
        },
      },
      {
        label: "12 × 12 ft room",
        display: {
          length: 12,
          width: 12,
          tileSize: 4,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          tileSize: 4,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          tileSize: 4,
          waste: 10,
        },
      },
      {
        label: "20 × 20 ft room",
        display: {
          length: 20,
          width: 20,
          tileSize: 4,
          waste: 10,
        },
      },
    ],
  },
  "tile-adhesive-calculator": {
    mode: "dimensions",
    rows: [
      {
        label: "5 × 8 ft room",
        display: {
          length: 5,
          width: 8,
          trowel: 90,
          bagWeight: 50,
          backButter: 0,
          waste: 10,
        },
      },
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          trowel: 90,
          bagWeight: 50,
          backButter: 0,
          waste: 10,
        },
      },
      {
        label: "10 × 12 ft room",
        display: {
          length: 10,
          width: 12,
          trowel: 90,
          bagWeight: 50,
          backButter: 0,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          trowel: 90,
          bagWeight: 50,
          backButter: 0,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          trowel: 90,
          bagWeight: 50,
          backButter: 0,
          waste: 10,
        },
      },
    ],
  },
  "primer-calculator": {
    mode: "room",
    rows: [
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 1,
          coverage: 300,
          condition: 1.2,
          waste: 10,
        },
      },
      {
        label: "12 × 12 ft room",
        display: {
          length: 12,
          width: 12,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 1,
          coverage: 300,
          condition: 1.2,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 1,
          coverage: 300,
          condition: 1.2,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 1,
          coverage: 300,
          condition: 1.2,
          waste: 10,
        },
      },
      {
        label: "20 × 20 ft room",
        display: {
          length: 20,
          width: 20,
          height: 8,
          doors: 1,
          windows: 2,
          doorArea: 21,
          windowArea: 15,
          coats: 1,
          coverage: 300,
          condition: 1.2,
          waste: 10,
        },
      },
    ],
  },
  "wallpaper-calculator": {
    mode: "room",
    rows: [
      {
        label: "10 × 10 ft room (40 ft of wall)",
        display: {
          length: 10,
          width: 10,
          height: 8,
          rollType: 0,
          repeat: 18,
          waste: 10,
        },
      },
      {
        label: "12 × 12 ft room (48 ft of wall)",
        display: {
          length: 12,
          width: 12,
          height: 8,
          rollType: 0,
          repeat: 18,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room (54 ft of wall)",
        display: {
          length: 12,
          width: 15,
          height: 8,
          rollType: 0,
          repeat: 18,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room (70 ft of wall)",
        display: {
          length: 15,
          width: 20,
          height: 8,
          rollType: 0,
          repeat: 18,
          waste: 10,
        },
      },
      {
        label: "20 × 20 ft room (80 ft of wall)",
        display: {
          length: 20,
          width: 20,
          height: 8,
          rollType: 0,
          repeat: 18,
          waste: 10,
        },
      },
    ],
  },
  "sealant-calculator": {
    mode: "joints",
    rows: [
      {
        label: "50 ft of joint",
        display: {
          jointLength: 50,
          beadWidth: 0.25,
          beadDepth: 0.25,
          tubeVolume: 10.1,
          waste: 10,
        },
      },
      {
        label: "100 ft of joint",
        display: {
          jointLength: 100,
          beadWidth: 0.25,
          beadDepth: 0.25,
          tubeVolume: 10.1,
          waste: 10,
        },
      },
      {
        label: "150 ft of joint",
        display: {
          jointLength: 150,
          beadWidth: 0.25,
          beadDepth: 0.25,
          tubeVolume: 10.1,
          waste: 10,
        },
      },
      {
        label: "200 ft of joint",
        display: {
          jointLength: 200,
          beadWidth: 0.25,
          beadDepth: 0.25,
          tubeVolume: 10.1,
          waste: 10,
        },
      },
      {
        label: "300 ft of joint",
        display: {
          jointLength: 300,
          beadWidth: 0.25,
          beadDepth: 0.25,
          tubeVolume: 10.1,
          waste: 10,
        },
      },
    ],
  },
  "waterproofing-calculator": {
    mode: "liquid-dimensions",
    rows: [
      {
        label: "5 × 8 ft room",
        display: {
          length: 5,
          width: 8,
          coats: 2,
          coverage: 110,
          containerGal: 1,
          waste: 10,
        },
      },
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          coats: 2,
          coverage: 110,
          containerGal: 1,
          waste: 10,
        },
      },
      {
        label: "10 × 12 ft room",
        display: {
          length: 10,
          width: 12,
          coats: 2,
          coverage: 110,
          containerGal: 1,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          coats: 2,
          coverage: 110,
          containerGal: 1,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          coats: 2,
          coverage: 110,
          containerGal: 1,
          waste: 10,
        },
      },
    ],
  },
  "baseboard-calculator": {
    mode: "room",
    rows: [
      {
        label: "10 × 10 ft room",
        display: {
          length: 10,
          width: 10,
          doors: 1,
          doorWidth: 3,
          pieceLength: 8,
          waste: 10,
        },
      },
      {
        label: "12 × 12 ft room",
        display: {
          length: 12,
          width: 12,
          doors: 1,
          doorWidth: 3,
          pieceLength: 8,
          waste: 10,
        },
      },
      {
        label: "12 × 15 ft room",
        display: {
          length: 12,
          width: 15,
          doors: 1,
          doorWidth: 3,
          pieceLength: 8,
          waste: 10,
        },
      },
      {
        label: "15 × 20 ft room",
        display: {
          length: 15,
          width: 20,
          doors: 1,
          doorWidth: 3,
          pieceLength: 8,
          waste: 10,
        },
      },
      {
        label: "20 × 20 ft room",
        display: {
          length: 20,
          width: 20,
          doors: 1,
          doorWidth: 3,
          pieceLength: 8,
          waste: 10,
        },
      },
    ],
  },
  "stair-calculator": {
    mode: "straight",
    rows: [
      {
        label: "72 in (6 ft)",
        display: { totalRise: 72, treadDepth: 10.5, maxRiser: 7.75 },
      },
      {
        label: "84 in (7 ft)",
        display: { totalRise: 84, treadDepth: 10.5, maxRiser: 7.75 },
      },
      {
        label: "96 in (8 ft)",
        display: { totalRise: 96, treadDepth: 10.5, maxRiser: 7.75 },
      },
      {
        label: "105 in (8.75 ft)",
        display: { totalRise: 105, treadDepth: 10.5, maxRiser: 7.75 },
      },
      {
        label: "120 in (10 ft)",
        display: { totalRise: 120, treadDepth: 10.5, maxRiser: 7.75 },
      },
    ],
  },
  "sand-calculator": {
    mode: "area",
    rows: [
      {
        label: "10 × 10 × 4 in sandbox",
        display: { length: 10, width: 10, depth: 4, waste: 10, density: 2700, bagSize: 0.5 },
      },
      {
        label: "10 × 10 × 6 in sandbox",
        display: { length: 10, width: 10, depth: 6, waste: 10, density: 2700, bagSize: 0.5 },
      },
      {
        label: "10 × 20 × 4 in patio base",
        display: { length: 10, width: 20, depth: 4, waste: 10, density: 2700, bagSize: 0.5 },
      },
      {
        label: "12 × 12 × 4 in pool base",
        display: { length: 12, width: 12, depth: 4, waste: 10, density: 2700, bagSize: 0.5 },
      },
      {
        label: "20 × 10 × 6 in fill",
        display: { length: 20, width: 10, depth: 6, waste: 10, density: 2700, bagSize: 0.5 },
      },
    ],
  },
  "raised-bed-soil-calculator": {
    mode: "bed",
    rows: [
      {
        label: "4 × 4 × 10 in bed",
        display: {
          length: 4,
          width: 4,
          fillDepth: 10,
          beds: 1,
          settling: 10,
          topsoilPct: 60,
          compostPct: 30,
          aerationPct: 10,
          bagSize: 2,
        },
      },
      {
        label: "4 × 8 × 10 in bed",
        display: {
          length: 8,
          width: 4,
          fillDepth: 10,
          beds: 1,
          settling: 10,
          topsoilPct: 60,
          compostPct: 30,
          aerationPct: 10,
          bagSize: 2,
        },
      },
      {
        label: "4 × 8 × 12 in bed",
        display: {
          length: 8,
          width: 4,
          fillDepth: 12,
          beds: 1,
          settling: 10,
          topsoilPct: 60,
          compostPct: 30,
          aerationPct: 10,
          bagSize: 2,
        },
      },
      {
        label: "8 × 8 × 10 in bed",
        display: {
          length: 8,
          width: 8,
          fillDepth: 10,
          beds: 1,
          settling: 10,
          topsoilPct: 60,
          compostPct: 30,
          aerationPct: 10,
          bagSize: 2,
        },
      },
      {
        label: "2 beds of 4 × 4 × 10 in",
        display: {
          length: 4,
          width: 4,
          fillDepth: 10,
          beds: 2,
          settling: 10,
          topsoilPct: 60,
          compostPct: 30,
          aerationPct: 10,
          bagSize: 2,
        },
      },
    ],
  },
  "sod-calculator": {
    mode: "rectangle",
    rows: [
      {
        label: "10 × 10 ft lawn",
        display: { length: 10, width: 10, waste: 10, rollCoverage: 10, palletCoverage: 450 },
      },
      {
        label: "20 × 20 ft lawn",
        display: { length: 20, width: 20, waste: 10, rollCoverage: 10, palletCoverage: 450 },
      },
      {
        label: "20 × 30 ft lawn",
        display: { length: 20, width: 30, waste: 10, rollCoverage: 10, palletCoverage: 450 },
      },
      {
        label: "30 × 40 ft lawn",
        display: { length: 30, width: 40, waste: 10, rollCoverage: 10, palletCoverage: 450 },
      },
      {
        label: "50 × 100 ft lawn",
        display: { length: 50, width: 100, waste: 10, rollCoverage: 10, palletCoverage: 450 },
      },
    ],
  },
  "lawn-seed-calculator": {
    mode: "area",
    rows: [
      {
        label: "1,000 ft² lawn",
        display: { length: 50, width: 20, jobType: 1, rate: 7, buffer: 10 },
      },
      {
        label: "2,500 ft² lawn",
        display: { length: 50, width: 50, jobType: 1, rate: 7, buffer: 10 },
      },
      {
        label: "5,000 ft² lawn",
        display: { length: 50, width: 100, jobType: 1, rate: 7, buffer: 10 },
      },
      {
        label: "10,000 ft² lawn",
        display: { length: 100, width: 100, jobType: 1, rate: 7, buffer: 10 },
      },
      {
        label: "5,000 ft² bluegrass lawn",
        display: { length: 50, width: 100, jobType: 1, rate: 2.5, buffer: 10 },
      },
    ],
  },
  "fence-calculator": {
    mode: "picket",
    rows: [
      {
        label: "50 ft run",
        display: {
          runLength: 50,
          postSpacing: 8,
          fenceHeight: 6,
          picketWidth: 6,
          picketGap: 0,
          waste: 10,
          concreteBagsPerPost: 2,
        },
      },
      {
        label: "100 ft run",
        display: {
          runLength: 100,
          postSpacing: 8,
          fenceHeight: 6,
          picketWidth: 6,
          picketGap: 0,
          waste: 10,
          concreteBagsPerPost: 2,
        },
      },
      {
        label: "150 ft run",
        display: {
          runLength: 150,
          postSpacing: 8,
          fenceHeight: 6,
          picketWidth: 6,
          picketGap: 0,
          waste: 10,
          concreteBagsPerPost: 2,
        },
      },
      {
        label: "200 ft run",
        display: {
          runLength: 200,
          postSpacing: 8,
          fenceHeight: 6,
          picketWidth: 6,
          picketGap: 0,
          waste: 10,
          concreteBagsPerPost: 2,
        },
      },
      {
        label: "100 ft run, 4 ft high",
        display: {
          runLength: 100,
          postSpacing: 8,
          fenceHeight: 4,
          picketWidth: 6,
          picketGap: 0,
          waste: 10,
          concreteBagsPerPost: 2,
        },
      },
    ],
  },
};

/** Run a config mode's compute() with display values and return the display rows. */
function recompute(slug: string, inputs: LookupInputs): { labels: string[]; values: string[] }[] {
  const config = CALCULATOR_CONFIGS[slug];
  if (config === undefined) throw new Error(`No config for ${slug}`);
  const mode = config.modes.find((m) => m.id === inputs.mode);
  if (!mode) throw new Error(`No mode "${inputs.mode}" for ${slug}`);
  const fieldById = new Map(mode.fields.map((f) => [f.id, f]));
  return inputs.rows.map((row) => {
    const values: Record<string, number> = {};
    const present = new Set<string>();
    for (const [id, displayValue] of Object.entries(row.display)) {
      const field = fieldById.get(id);
      if (!field) throw new Error(`${slug}: unknown field ${id}`);
      values[id] = toCanonical(displayValue, field.impUnit ?? "", field);
      present.add(id);
    }
    const out = mode.compute(values, present);
    return { labels: out.rows.map((r) => r.label), values: out.rows.map((r) => r.value) };
  });
}

describe("lookup tables", () => {
  it("every calculator in LOOKUP_INPUTS has a lookup table", () => {
    for (const slug of Object.keys(LOOKUP_INPUTS)) {
      const config = CALCULATOR_CONFIGS[slug];
      if (config === undefined) throw new Error(`No config for ${slug}`);
      expect(config.lookupTable).toBeDefined();
    }
  });

  it("every config with a lookup table is covered by LOOKUP_INPUTS", () => {
    for (const [slug, config] of Object.entries(CALCULATOR_CONFIGS)) {
      if (config.lookupTable !== undefined) {
        expect(LOOKUP_INPUTS[slug]).toBeDefined();
      }
    }
  });

  it("every table has 4–6 rows and every row has one cell per header", () => {
    for (const config of Object.values(CALCULATOR_CONFIGS)) {
      const table = config.lookupTable;
      if (table === undefined) continue;
      expect(table.rows.length).toBeGreaterThanOrEqual(4);
      expect(table.rows.length).toBeLessThanOrEqual(6);
      for (const row of table.rows) {
        expect(row).toHaveLength(table.headers.length);
      }
    }
  });

  it("every lookup table carries a non-empty assumptions note", () => {
    for (const [slug, config] of Object.entries(CALCULATOR_CONFIGS)) {
      const table = config.lookupTable;
      if (table === undefined) continue;
      expect(table.note, `${slug} lookup table is missing its assumptions note`).toBeDefined();
      expect(linkedTextToPlain(table.note ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("every computed cell equals the value recomputed from the standard inputs", () => {
    for (const [slug, inputs] of Object.entries(LOOKUP_INPUTS)) {
      const config = CALCULATOR_CONFIGS[slug];
      if (config === undefined) throw new Error(`No config for ${slug}`);
      const table = config.lookupTable;
      expect(table).toBeDefined();
      if (table === undefined) continue;
      const recomputed = recompute(slug, inputs);
      expect(recomputed).toHaveLength(table.rows.length);
      const firstRecomputed = recomputed[0];
      if (firstRecomputed === undefined) throw new Error(`No recomputed rows for ${slug}`);
      // One header per output row, plus the descriptive first column.
      expect(table.headers).toHaveLength(firstRecomputed.values.length + 1);
      table.rows.forEach((row, i) => {
        const inputRow = inputs.rows[i];
        const recomputedRow = recomputed[i];
        if (inputRow === undefined || recomputedRow === undefined) {
          throw new Error(`Missing row ${i} for ${slug}`);
        }
        // Column 0 is the descriptive input label — checked, not recomputed.
        expect(row[0]).toBe(inputRow.label);
        // Columns 1.. are computed values: they must equal compute()'s output.
        row.slice(1).forEach((cell, j) => {
          expect(cell).toBe(recomputedRow.values[j]);
        });
      });
    }
  });

  it("stair table 105 in row matches the hand-verified values exactly", () => {
    // Hand-verified (not recomputed): 105 in / 7.75 in = 13.55, so 14 risers
    // at 7.5 in each; 13 treads x 10.5 in = 136.5 in of run; stringer
    // sqrt(105^2 + 136.5^2) = 172.21 in; angle atan(105 / 136.5) = 37.6 deg.
    const table = CALCULATOR_CONFIGS["stair-calculator"]?.lookupTable;
    expect(table).toBeDefined();
    const row = table?.rows.find((r) => r[0] === "105 in (8.75 ft)");
    expect(row).toEqual([
      "105 in (8.75 ft)",
      "14 risers",
      "13 treads",
      "136.5 in",
      "172.21 in",
      "37.6°",
    ]);
  });
});
