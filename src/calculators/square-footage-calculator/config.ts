/**
 * Square Footage Calculator config — area of a room or space.
 * See src/lib/formulas/square-footage.ts and docs/FORMULAS.md §2.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { opt } from "../../components/react/CalculatorConfig";
import { calculateSquareFootage, type SquareFootageShape } from "../../lib/formulas/square-footage";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function areaOutput(shape: SquareFootageShape, v: Record<string, number>) {
  const r = calculateSquareFootage({
    shape,
    lengthFt: opt(v, "length"),
    widthFt: opt(v, "width"),
    radiusFt: opt(v, "radius"),
    length2Ft: opt(v, "length2"),
    width2Ft: opt(v, "width2"),
  });
  return {
    rows: [
      { label: "Area", value: `${fmt(r.areaFt2)} ft²`, detail: `${fmt(r.areaM2)} m²` },
      { label: "Square yards", value: `${fmt(r.areaYd2)} yd²` },
      { label: "Acres", value: `${fmt(r.acres, 4)} acres` },
    ],
    lines: [`Area: ${fmt(r.areaFt2)} ft² (${fmt(r.areaM2)} m²)`],
    workedLine: `Area = ${fmt(r.areaFt2)} ft² = ${fmt(r.areaM2)} m².`,
  };
}

export const squareFootageConfig: CalculatorConfig = {
  slug: "square-footage-calculator",
  lookupTable: {
    note: "Rectangular rooms only — area is length × width.",
    headers: ["Rectangle (L × W)", "Area", "Square yards", "Acres"],
    rows: [
      ["10 × 10 ft", "100 ft²", "11.11 yd²", "0.0023 acres"],
      ["12 × 12 ft", "144 ft²", "16 yd²", "0.0033 acres"],
      ["12 × 15 ft", "180 ft²", "20 yd²", "0.0041 acres"],
      ["15 × 20 ft", "300 ft²", "33.33 yd²", "0.0069 acres"],
      ["20 × 30 ft", "600 ft²", "66.67 yd²", "0.0138 acres"],
    ],
  },
  diagram: "area",
  defaultMode: "rectangle",
  formula:
    "Rectangle: area = length × width. Circle: area = π × radius². Triangle: area = ½ × base × height. " +
    "L-shape: add the two rectangles together. Results are shown in square feet, square meters, square yards, and acres.",
  howTo: [
    "Measure length and width in feet, wall to wall, at the longest points. For feet and inches, convert inches to feet by dividing by 12 (6 in = 0.5 ft).",
    "For an L-shaped room, split it into two rectangles, measure each, and add the areas — the calculator does the adding. Split so the two rectangles do not overlap: any shared area would be counted twice.",
    "For a circle, measure the diameter across the middle and halve it for the radius; or measure the radius directly from the center to the edge.",
    "Measure twice. A 6-inch error on a 15 ft wall changes the area by about 7 ft².",
  ],
  workedExample:
    "A 12 ft × 15 ft room: 12 × 15 = 180 ft² (16.72 m²). An L-shaped room of 12 × 10 ft plus 6 × 8 ft is 120 + 48 = 168 ft².",
  limitations: [
    [
      {
        text: "Measures flat area only. It does not deduct doors, windows, or fixtures — use the ",
      },
      { text: "Paint Calculator", calc: "paint-calculator" },
      { text: " for net paintable area." },
    ],
    "An L-shape is two rectangles. Rooms with curves, angles, or more than two rectangles need to be split into more pieces and added by hand.",
    "Area is not volume: flooring, paint, and tile use square footage; concrete, gravel, and mulch need a depth too.",
  ],
  faqs: [
    {
      question: "How do I calculate the square footage of a room?",
      answer:
        "Multiply the length by the width, both in feet. A 12 ft × 15 ft room is 180 ft². For an L-shaped room, split it into two rectangles, work out each area, and add them.",
    },
    {
      question: "How many square feet are in an acre?",
      answer:
        "43,560 ft². The calculator shows acres alongside square feet and square meters, which is handy for lots and larger plots.",
    },
    {
      question: "What is the square footage of a 10 × 10 room?",
      answer: "100 ft² (9.29 m²). A 10 × 12 room is 120 ft², and a 12 × 12 room is 144 ft².",
    },
  ],
  modes: [
    {
      id: "rectangle",
      label: "Rectangle",
      fields: [
        {
          id: "length",
          label: "Length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "12",
          defaultMet: "3.66",
        },
        {
          id: "width",
          label: "Width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "15",
          defaultMet: "4.57",
        },
      ],
      compute: (v) => areaOutput("rectangle", v),
    },
    {
      id: "circle",
      label: "Circle",
      fields: [
        {
          id: "radius",
          label: "Radius",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "5",
          defaultMet: "1.52",
          hint: "Half the diameter, measured from the center to the edge.",
        },
      ],
      compute: (v) => areaOutput("circle", v),
    },
    {
      id: "triangle",
      label: "Triangle",
      fields: [
        {
          id: "length",
          label: "Base",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3.05",
        },
        {
          id: "width",
          label: "Height",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "6",
          defaultMet: "1.83",
          hint: "The perpendicular height from the base to the opposite corner.",
        },
      ],
      compute: (v) => areaOutput("triangle", v),
    },
    {
      id: "l-shape",
      label: "L-shape",
      fields: [
        {
          id: "length",
          label: "First rectangle — length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "12",
          defaultMet: "3.66",
        },
        {
          id: "width",
          label: "First rectangle — width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3.05",
        },
        {
          id: "length2",
          label: "Second rectangle — length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "6",
          defaultMet: "1.83",
        },
        {
          id: "width2",
          label: "Second rectangle — width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "8",
          defaultMet: "2.44",
        },
      ],
      compute: (v) => areaOutput("l-shape", v),
    },
  ],
};
