/**
 * Cubic Yard Calculator config — a volume conversion tool.
 * See src/lib/formulas/cubic-yard.ts and docs/FORMULAS.md §7.
 *
 * Distinct intent: conversion, not a material estimate. No waste, no
 * weight, no bags — those belong to the material calculators.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import {
  calculateCubicYardFromDimensions,
  convertCubicYardValue,
} from "../../lib/formulas/cubic-yard";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function resultRows(r: ReturnType<typeof calculateCubicYardFromDimensions>) {
  return {
    rows: [
      { label: "Cubic yards", value: `${fmt(r.volumeYd3)} yd³` },
      { label: "Cubic feet", value: `${fmt(r.volumeFt3)} ft³` },
      { label: "Cubic meters", value: `${fmt(r.volumeM3)} m³` },
      { label: "Liters", value: `${fmt(r.volumeLiters, 0)} L` },
      { label: "US gallons", value: `${fmt(r.volumeGallons)} gal` },
    ],
    lines: [`Volume: ${fmt(r.volumeYd3)} yd³ (${fmt(r.volumeFt3)} ft³, ${fmt(r.volumeM3)} m³)`],
  };
}

export const cubicYardConfig: CalculatorConfig = {
  slug: "cubic-yard-calculator",
  designCplus: true,
  heroResultLabel: "Cubic yards",
  lookupTable: {
    note: "Volumes are entered in cubic feet and converted, with 1 yd³ equal to 27 ft³.",
    headers: ["Volume", "Cubic yards", "Cubic feet", "Cubic meters", "Liters", "US gallons"],
    rows: [
      ["1 yd³ (27 ft³)", "1 yd³", "27 ft³", "0.76 m³", "765 L", "201.97 gal"],
      ["2 yd³ (54 ft³)", "2 yd³", "54 ft³", "1.53 m³", "1,529 L", "403.95 gal"],
      ["3 yd³ (81 ft³)", "3 yd³", "81 ft³", "2.29 m³", "2,294 L", "605.92 gal"],
      ["5 yd³ (135 ft³)", "5 yd³", "135 ft³", "3.82 m³", "3,823 L", "1,009.87 gal"],
      ["10 yd³ (270 ft³)", "10 yd³", "270 ft³", "7.65 m³", "7,646 L", "2,019.74 gal"],
    ],
  },
  diagram: "volume",
  defaultMode: "convert",
  formula:
    "1 cubic yard = 27 cubic feet = 0.7646 cubic meters. " +
    "From dimensions: volume (ft³) = length × width × depth, then ÷ 27 for cubic yards. " +
    "From a volume: multiply or divide by 27 to move between cubic feet and cubic yards.",
  howTo: [
    "To convert a known volume, enter it and pick its unit — the calculator shows the same volume in cubic yards, cubic feet, cubic meters, liters, and gallons.",
    "To measure a space, enter its length, width, and depth in the Dimensions mode.",
    "Remember the yard is a cube 3 ft on every side: 3 × 3 × 3 = 27 ft³. A common mistake is dividing by 3 instead of 27.",
  ],
  workedExample:
    "A 3 ft × 3 ft × 3 ft box is 27 ft³ = 1 yd³ (0.76 m³). A 10 ft × 10 ft area at 3 in deep is 25 ft³ = 0.93 yd³.",
  limitations: [
    "Pure volume math. It does not convert volume to weight or bags — those depend on the material, so use the Gravel, Mulch, or Concrete Calculator for those.",
    "Liters and gallons are liquid-volume equivalents of the same space; they are shown for convenience, not because the material is a liquid.",
  ],
  faqs: [
    {
      question: "How many cubic feet are in a cubic yard?",
      answer:
        "27. A cubic yard is a cube 3 feet long, 3 feet wide, and 3 feet high: 3 × 3 × 3 = 27 ft³.",
    },
    {
      question: "How many cubic yards are in a cubic meter?",
      answer: "About 1.31 yd³. A cubic meter is 35.31 ft³, and 35.31 ÷ 27 = 1.31.",
    },
    {
      question: "How do I work out cubic yards from feet and inches?",
      answer:
        "Convert every dimension to feet first (inches ÷ 12), multiply length × width × depth for cubic feet, then divide by 27. The Dimensions mode does all of this for you.",
    },
  ],
  modes: [
    {
      id: "convert",
      label: "Convert a volume",
      fields: [
        {
          id: "value",
          label: "Volume",
          kind: "volume",
          unitKind: "volume",
          impUnit: "ft3",
          metUnit: "m3",
          defaultImp: "27",
          defaultMet: "1",
          allowUnitSelect: true,
          unitOptions: ["ft3", "yd3", "m3", "L", "gal"],
          hint: "Pick the unit of the volume you already know.",
        },
      ],
      compute: (v) => {
        const r = convertCubicYardValue(req(v, "value"), "ft3");
        return {
          ...resultRows(r),
          workedLine: `${fmt(req(v, "value"))} ft³ ÷ 27 = ${fmt(r.volumeYd3)} yd³.`,
        };
      },
    },
    {
      id: "dimensions",
      label: "From dimensions",
      fields: [
        {
          id: "length",
          label: "Length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "3",
          defaultMet: "0.91",
        },
        {
          id: "width",
          label: "Width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "3",
          defaultMet: "0.91",
        },
        {
          id: "depth",
          label: "Depth",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "3",
          defaultMet: "0.91",
        },
      ],
      compute: (v) => {
        const r = calculateCubicYardFromDimensions({
          lengthFt: req(v, "length"),
          widthFt: req(v, "width"),
          depthFt: req(v, "depth"),
        });
        return {
          ...resultRows(r),
          workedLine: `${fmt(req(v, "length"))} × ${fmt(req(v, "width"))} × ${fmt(req(v, "depth"))} ft = ${fmt(r.volumeFt3)} ft³ = ${fmt(r.volumeYd3)} yd³.`,
        };
      },
    },
  ],
};
