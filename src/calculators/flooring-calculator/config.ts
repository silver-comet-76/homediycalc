/**
 * Flooring Calculator config — boxes of plank flooring and underlayment
 * rolls for a room. Plank/tile flooring sold by the box; for individual
 * tiles and grout, see the Tile Calculator and Grout Calculator.
 * See src/lib/formulas/flooring.ts and docs/FORMULAS.md §13.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateFlooring } from "../../lib/formulas/flooring";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function flooringOutput(areaFt2: number, v: Record<string, number>, present: Set<string>) {
  const r = calculateFlooring({
    areaFt2,
    wastePct: req(v, "waste"),
    boxCoverageFt2: req(v, "boxCoverage"),
    planksPerBox: present.has("planksPerBox") ? req(v, "planksPerBox") : undefined,
    includeUnderlayment: req(v, "underlayment") === 1,
    underlaymentRollCoverageFt2: req(v, "rollCoverage"),
    pricePerBox: present.has("pricePerBox") ? req(v, "pricePerBox") : undefined,
    pricePerRoll: present.has("pricePerRoll") ? req(v, "pricePerRoll") : undefined,
  });
  return {
    rows: [
      {
        label: "Floor area",
        value: `${fmt(areaFt2)} ft²`,
        detail: `${fmt(r.adjustedAreaFt2)} ft² with ${fmt(req(v, "waste"), 0)}% waste`,
      },
      {
        label: "Boxes needed",
        value: `${r.boxes} boxes`,
        detail: `${fmt(req(v, "boxCoverage"), 2)} ft² per box — rounded up`,
      },
      ...(r.planks !== undefined
        ? [
            {
              label: "Planks needed",
              value: `${r.planks} planks`,
              detail: `${fmt(req(v, "planksPerBox"), 0)} planks per box`,
            },
          ]
        : []),
      ...(r.underlaymentRolls !== undefined
        ? [
            {
              label: "Underlayment rolls",
              value: `${r.underlaymentRolls} rolls`,
              detail: `${fmt(req(v, "rollCoverage"), 0)} ft² per roll — rounded up`,
            },
          ]
        : []),
    ],
    lines: [
      `Flooring (${fmt(req(v, "boxCoverage"), 2)} ft² per box): ${r.boxes} boxes`,
      ...(r.planks !== undefined ? [`Planks: ${r.planks}`] : []),
      ...(r.underlaymentRolls !== undefined
        ? [
            `Underlayment (${fmt(req(v, "rollCoverage"), 0)} ft² per roll): ${r.underlaymentRolls} rolls`,
          ]
        : []),
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedAreaFt2)} ft² ÷ ${fmt(req(v, "boxCoverage"), 2)} ft² per box = ${r.boxes} boxes.`,
  };
}

const COMMON_FIELDS = [
  {
    id: "boxCoverage",
    label: "Coverage per box (ft²)",
    kind: "number" as const,
    defaultImp: "20",
    defaultMet: "20",
    min: 0.1,
    hint: "Printed on the box. Typical: laminate 18–24 ft², vinyl plank 18–30 ft², hardwood 20–25 ft². Always use your box's figure.",
  },
  {
    id: "planksPerBox",
    label: "Planks per box (optional)",
    kind: "count" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    min: 1,
    hint: "Printed on the box. Enter it to see the plank count as well as boxes.",
  },
  {
    id: "underlayment",
    label: "Underlayment",
    kind: "select" as const,
    defaultImp: "1",
    defaultMet: "1",
    options: [
      { value: "1", label: "Include underlayment rolls" },
      { value: "0", label: "No underlayment (glue-down or built-in pad)" },
    ],
  },
  {
    id: "rollCoverage",
    label: "Underlayment coverage per roll (ft²)",
    kind: "number" as const,
    defaultImp: "100",
    defaultMet: "100",
    min: 1,
    hint: "About 100 ft² per roll is typical. Skip this if you chose no underlayment.",
  },
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent" as const,
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% for a straight lay; 15% for diagonal layouts, 15–20% for herringbone or chevron.",
  },
  {
    id: "pricePerBox",
    label: "Price per box (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
  {
    id: "pricePerRoll",
    label: "Price per underlayment roll (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const flooringConfig: CalculatorConfig = {
  slug: "flooring-calculator",
  diagram: "area",
  defaultMode: "dimensions",
  formula:
    "Boxes = floor area × (1 + waste%) ÷ coverage per box, rounded up. " +
    "Box coverage varies by brand — laminate about 18–24 ft² per box, " +
    "vinyl plank about 18–30 ft², hardwood about 20–25 ft² — so the " +
    "coverage field is editable and defaults to 20 ft². Waste default " +
    "10% for a straight lay; 15% for diagonal, 15–20% for herringbone. " +
    "Underlayment rolls cover about 100 ft² each and are counted on the " +
    "floor area without waste — offcuts are reusable.",
  howTo: [
    "Measure the room wall to wall, in feet — go to the bottom of the baseboard and round up to the next inch. For an L-shaped room, split it into rectangles and add them (or use the Square Footage Calculator first).",
    "Add closets and nooks as extra square feet, or measure them as separate rectangles.",
    "Read the coverage per box off the carton — it varies by brand even for the same flooring type. Enter the exact figure rather than guessing.",
    "Choose the waste allowance: 10% for a straight lay in a normal room, 15% for a diagonal layout, 15–20% for herringbone or chevron, and more for rooms with many angles.",
  ],
  workedExample:
    "A 12 × 15 ft room is 180 ft². With 10% waste that is 198 ft². " +
    "At 20 ft² per box, buy 10 boxes. At 8 planks per box that is 80 planks, " +
    "and at 100 ft² per roll, 2 rolls of underlayment.",
  limitations: [
    "Assumes plank flooring sold by the box (laminate, vinyl plank, engineered hardwood). Carpet, sheet vinyl, and individual tiles are measured differently — see the Tile Calculator for tile.",
    "Does not include transition strips, stair nosings, or quarter-round trim — count those separately.",
    "The waste allowance covers cuts at walls and mistakes, not a pattern change mid-job. Very irregular rooms need a higher allowance.",
    "Buy all the flooring from the same batch (same dye lot) — shades vary between batches, and a later box may not match.",
  ],
  faqs: [
    {
      question: "How many boxes of flooring do I need?",
      answer:
        "Multiply the floor area by your waste factor, divide by the coverage printed on the box, and round up. A 180 sq ft room with 10% waste is 198 sq ft; at 20 sq ft per box that is 10 boxes. Always use the coverage on your own box — it varies from about 18 to 30 sq ft by brand.",
    },
    {
      question: "How much extra flooring should I buy for waste?",
      answer:
        "10% is the standard allowance for a straight lay. Use 5–7% only for a simple rectangular room with few cuts, 15% for a diagonal layout or a room with many angles, and 15–20% for herringbone or chevron patterns. Keep a spare box after the job for future repairs.",
    },
    {
      question: "Do I need underlayment for vinyl plank flooring?",
      answer:
        "Many vinyl plank products have a built-in pad and need no separate underlayment — check the manufacturer's instructions. Laminate and engineered hardwood usually need underlayment for sound and moisture protection. The calculator includes underlayment rolls by default; switch it off for glue-down floors or products with a built-in pad.",
    },
  ],
  modes: [
    {
      id: "dimensions",
      label: "Room dimensions",
      fields: [
        {
          id: "length",
          label: "Room length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "12",
          defaultMet: "3.66",
        },
        {
          id: "width",
          label: "Room width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "15",
          defaultMet: "4.57",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => flooringOutput(req(v, "length") * req(v, "width"), v, present),
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        {
          id: "area",
          label: "Floor area",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "180",
          defaultMet: "16.72",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => flooringOutput(req(v, "area"), v, present),
    },
  ],
};
