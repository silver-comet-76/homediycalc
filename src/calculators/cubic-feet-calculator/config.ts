/**
 * Cubic Feet Calculator config — volume from dimensions, in cubic feet.
 * See src/lib/formulas/cubic-feet.ts and docs/FORMULAS.md §8.
 *
 * Distinct intent from the Cubic Yard Calculator: this one starts from
 * dimensions and lets each dimension carry its own unit (feet, inches,
 * yards, meters, centimeters, or millimeters), so mixed-unit measurements
 * work without manual conversion. Output is centered on cubic feet.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateCubicFeet } from "../../lib/formulas/cubic-feet";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

const DIMENSION_UNITS = ["ft", "in", "yd", "m", "cm", "mm"];

export const cubicFeetConfig: CalculatorConfig = {
  slug: "cubic-feet-calculator",
  designCplus: true,
  heroResultLabel: "Cubic feet",
  lookupTable: {
    note: "Rectangular boxes only — volume is length × width × height.",
    headers: [
      "Box (L × W × H)",
      "Cubic feet",
      "Cubic yards",
      "Cubic meters",
      "Cubic inches",
      "Liters",
      "US gallons",
    ],
    rows: [
      ["2 × 2 × 2 ft box", "8 ft³", "0.3 yd³", "0.23 m³", "13,824 in³", "227 L", "59.84 gal"],
      ["5 × 4 × 2 ft box", "40 ft³", "1.48 yd³", "1.13 m³", "69,120 in³", "1,133 L", "299.22 gal"],
      [
        "10 × 10 × 1 ft box",
        "100 ft³",
        "3.7 yd³",
        "2.83 m³",
        "172,800 in³",
        "2,832 L",
        "748.05 gal",
      ],
      [
        "10 × 10 × 2 ft box",
        "200 ft³",
        "7.41 yd³",
        "5.66 m³",
        "345,600 in³",
        "5,663 L",
        "1,496.1 gal",
      ],
      [
        "20 × 10 × 2 ft box",
        "400 ft³",
        "14.81 yd³",
        "11.33 m³",
        "691,200 in³",
        "11,327 L",
        "2,992.21 gal",
      ],
    ],
  },
  diagram: "volume",
  defaultMode: "dimensions",
  formula:
    "Volume (ft³) = length × width × height, with every dimension converted to feet first " +
    "(inches ÷ 12, yards × 3, centimeters ÷ 30.48). Then: cubic yards = ft³ ÷ 27, " +
    "cubic meters = ft³ × 0.0283, cubic inches = ft³ × 1,728.",
  howTo: [
    "Measure the length, width, and height of the space or container.",
    "Each dimension can use its own unit — pick feet, inches, yards, meters, centimeters, or millimeters per measurement. A box 5 ft long, 24 in wide, and 60 cm high works as entered.",
    "Measure inside dimensions for a container (what it holds), outside dimensions for the space it occupies.",
    "For a room, volume in cubic feet is what matters for heating, cooling, and ventilation — multiply floor area by ceiling height.",
  ],
  workedExample: "A box 5 ft × 4 ft × 2 ft is 40 ft³ = 1.48 yd³ (1.13 m³), or 69,120 in³.",
  limitations: [
    "Pure volume math for a rectangular space. Irregular shapes need to be split into boxes and added.",
    "It does not convert volume to weight — that depends on the material. Use the Gravel or Mulch Calculator for material weights.",
  ],
  faqs: [
    {
      question: "How do I calculate cubic feet?",
      answer:
        "Multiply length × width × height, with all three in feet. A 5 ft × 4 ft × 2 ft box is 40 ft³. If a dimension is in inches, divide it by 12 first — or enter it in inches here and the calculator converts it.",
    },
    {
      question: "How many cubic feet are in a cubic yard?",
      answer: "27 ft³. Divide cubic feet by 27 to get cubic yards.",
    },
    {
      question: "What is the difference between this and the Cubic Yard Calculator?",
      answer: [
        {
          text: "This calculator is for working out a volume from dimensions, with each dimension in its own unit, and its main answer is cubic feet. The ",
        },
        { text: "Cubic Yard Calculator", calc: "cubic-yard-calculator" },
        {
          text: " is for converting a volume you already know between units, and its main answer is cubic yards.",
        },
      ],
    },
  ],
  modes: [
    {
      id: "dimensions",
      label: "Dimensions",
      fields: [
        {
          id: "length",
          label: "Length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "5",
          defaultMet: "1.52",
          allowUnitSelect: true,
          unitOptions: DIMENSION_UNITS,
        },
        {
          id: "width",
          label: "Width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "4",
          defaultMet: "1.22",
          allowUnitSelect: true,
          unitOptions: DIMENSION_UNITS,
        },
        {
          id: "height",
          label: "Height",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "2",
          defaultMet: "0.61",
          allowUnitSelect: true,
          unitOptions: DIMENSION_UNITS,
        },
      ],
      compute: (v) => {
        const r = calculateCubicFeet({
          lengthFt: req(v, "length"),
          widthFt: req(v, "width"),
          heightFt: req(v, "height"),
        });
        return {
          rows: [
            { label: "Cubic feet", value: `${fmt(r.volumeFt3)} ft³` },
            { label: "Cubic yards", value: `${fmt(r.volumeYd3)} yd³` },
            { label: "Cubic meters", value: `${fmt(r.volumeM3)} m³` },
            { label: "Cubic inches", value: `${fmt(r.volumeIn3, 0)} in³` },
            { label: "Liters", value: `${fmt(r.volumeLiters, 0)} L` },
            { label: "US gallons", value: `${fmt(r.volumeGallons)} gal` },
          ],
          lines: [
            `Volume: ${fmt(r.volumeFt3)} ft³ (${fmt(r.volumeYd3)} yd³, ${fmt(r.volumeM3)} m³)`,
          ],
          workedLine: `${fmt(req(v, "length"))} × ${fmt(req(v, "width"))} × ${fmt(req(v, "height"))} ft = ${fmt(r.volumeFt3)} ft³.`,
        };
      },
    },
  ],
};
