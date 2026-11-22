/**
 * Drywall Calculator config — sheets, joint compound, tape, and screws.
 * See src/lib/formulas/drywall.ts and docs/FORMULAS.md §11.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateDrywall, DOOR_AREA_FT2, WINDOW_AREA_FT2 } from "../../lib/formulas/drywall";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function drywallOutput(
  wallAreaFt2: number,
  ceilingAreaFt2: number,
  v: Record<string, number>,
  present: Set<string>,
) {
  const r = calculateDrywall({
    wallAreaFt2,
    ceilingAreaFt2,
    sheetAreaFt2: req(v, "sheetSize"),
    wastePct: req(v, "waste"),
    compoundCoverageFt2PerGal: req(v, "compoundCoverage"),
    pailSizeGal: req(v, "pailSize"),
    tapeFtPer1000Ft2: 370,
    tapeRollFt: 250,
    screwsPerSheetWall: present.has("screwsWall") ? req(v, "screwsWall") : undefined,
    screwsPerSheetCeiling: present.has("screwsCeiling") ? req(v, "screwsCeiling") : undefined,
    screwsPerLb: 250,
    pricePerSheet: present.has("pricePerSheet") ? req(v, "pricePerSheet") : undefined,
    pricePerPail: present.has("pricePerPail") ? req(v, "pricePerPail") : undefined,
  });
  return {
    rows: [
      {
        label: "Area to cover",
        value: `${fmt(r.totalAreaFt2)} ft²`,
        detail: `${fmt(wallAreaFt2)} ft² walls + ${fmt(ceilingAreaFt2)} ft² ceiling`,
      },
      {
        label: "Drywall sheets",
        value: `${r.sheetsToBuy} sheets`,
        detail: `${r.sheetsHung} sheets hung + ${fmt(req(v, "waste"), 0)}% waste — ${fmt(req(v, "sheetSize"), 0)} ft² per sheet`,
      },
      {
        label: "Joint compound",
        value: `${fmt(r.compoundGal)} gal`,
        detail: `${r.pails} × ${fmt(req(v, "pailSize"), 1)} gal pails — about ${fmt(req(v, "compoundCoverage"), 0)} ft² per gallon`,
      },
      {
        label: "Paper tape",
        value: `${fmt(r.tapeFt)} ft`,
        detail: `${r.tapeRolls} × 250 ft rolls — about 370 ft per 1,000 ft²`,
      },
      {
        label: "Drywall screws",
        value: `${r.screws} screws`,
        detail: `about ${fmt(r.screwLb, 1)} lb`,
      },
    ],
    lines: [
      `Drywall sheets (${fmt(req(v, "sheetSize"), 0)} ft² each): ${r.sheetsToBuy}`,
      `Joint compound (${fmt(req(v, "pailSize"), 1)} gal pails): ${r.pails}`,
      `Paper tape (250 ft rolls): ${r.tapeRolls}`,
      `Drywall screws: ${r.screws} (about ${fmt(r.screwLb, 1)} lb)`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(r.totalAreaFt2)} ft² × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${fmt(req(v, "sheetSize"), 0)} ft² per sheet = ${r.sheetsToBuy} sheets; compound ${fmt(r.totalAreaFt2)} ÷ ${fmt(req(v, "compoundCoverage"), 0)} = ${fmt(r.compoundGal)} gal → ${r.pails} pails.`,
  };
}

const COMMON_FIELDS = [
  {
    id: "sheetSize",
    label: "Sheet size",
    kind: "select" as const,
    defaultImp: "32",
    defaultMet: "32",
    options: [
      { value: "32", label: "4 × 8 ft (32 ft²) — standard" },
      { value: "40", label: "4 × 10 ft (40 ft²)" },
      { value: "48", label: "4 × 12 ft (48 ft²)" },
    ],
    hint: "4 × 8 ft is the DIY standard — one person can carry it. Longer sheets mean fewer seams to tape.",
  },
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent" as const,
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% for a simple room; 15% for rooms with many openings or angled walls.",
  },
  {
    id: "compoundCoverage",
    label: "Joint compound coverage",
    kind: "number" as const,
    unitKind: "coverage" as const,
    impUnit: "ft2/gal" as const,
    metUnit: "m2/L" as const,
    defaultImp: "100",
    defaultMet: "2.45",
    min: 1,
    hint: "About 100 ft² per gallon for a Level 4 three-coat finish (2.45 m² per litre in metric). USG: about two 4.5 gal pails per 1,000 ft². A Level 5 skim coat needs more.",
  },
  {
    id: "pailSize",
    label: "Compound pail size (gal)",
    kind: "number" as const,
    defaultImp: "4.5",
    defaultMet: "4.5",
    min: 0.5,
    hint: "4.5 gal is the common pail; 1 gal and 3.5 gal pails are also sold.",
  },
  {
    id: "screwsWall",
    label: "Screws per sheet (walls)",
    kind: "count" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    min: 1,
    hint: "Leave blank for the standard count for your sheet size: 28 for 4 × 8 ft, 32 for 4 × 10 ft, 40 for 4 × 12 ft (walls framed 16 in on center, ASTM C840 spacing). Enter a figure to override it.",
  },
  {
    id: "screwsCeiling",
    label: "Screws per sheet (ceilings)",
    kind: "count" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    min: 1,
    hint: "Leave blank for the standard count for your sheet size: 35 for 4 × 8 ft, 40 for 4 × 10 ft, 50 for 4 × 12 ft — screws go closer together overhead. Enter a figure to override it.",
  },
  {
    id: "pricePerSheet",
    label: "Price per sheet (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
  {
    id: "pricePerPail",
    label: "Price per pail of compound (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const drywallConfig: CalculatorConfig = {
  slug: "drywall-calculator",
  diagram: "wall",
  defaultMode: "room",
  formula:
    "Sheets to buy = total area × (1 + waste%) ÷ sheet area, rounded up. " +
    "A 4 × 8 ft sheet covers 32 ft². Joint compound = area ÷ coverage " +
    "(about 100 ft² per gallon for a Level 4 three-coat finish), sold in " +
    "4.5 gal pails. Paper tape runs about 370 ft per 1,000 ft²; screws " +
    "scale with sheet size — about 28 per sheet on walls and 35 on " +
    "ceilings for 4 × 8 ft sheets, 32 / 40 for 4 × 10 ft, and 40 / 50 " +
    "for 4 × 12 ft. Compound, tape, and " +
    "screws are estimated from the area actually hung — only the sheet " +
    "count includes the waste allowance.",
  howTo: [
    "Measure each wall: length × height. Add the walls together, then subtract 20 ft² per door and 15 ft² per window (or enter the counts and let the calculator deduct them).",
    "Measure the ceiling the same way (length × width) if you are boarding it — ceilings take more screws per sheet than walls, so the calculator counts them separately.",
    "Pick your sheet size. 4 × 8 ft sheets are the DIY standard; 4 × 12 ft sheets cover more area with fewer seams but need two people to handle.",
    "Choose the waste allowance: 10% for a simple rectangular room, 15% for rooms with many openings or angled walls.",
  ],
  workedExample:
    "A 12 × 12 ft room with 8 ft walls, one door, two windows, and a ceiling to board: " +
    "wall area is 48 × 8 − 20 − 30 = 334 ft², ceiling 144 ft², total 478 ft². " +
    "At 10% waste that is 17 sheets of 4 × 8 drywall, 4.78 gal of compound (2 pails), " +
    "177 ft of tape (1 roll), and 483 screws (about 2 lb).",
  limitations: [
    "Assumes rectangular walls and ceilings of uniform height. Vaulted ceilings, dormers, and angled walls need a higher waste allowance and their own measurements.",
    "Compound, tape, and screw figures are estimating rules of thumb for a Level 4 finish — your technique and finish level change them. A Level 5 skim coat takes much more compound.",
    "Corner bead for outside corners is not included — count each outside corner's height and buy bead in 8 or 10 ft lengths.",
    "This calculator estimates materials only. It does not check whether a wall is load-bearing or whether fire-rated board is required — check local code.",
  ],
  faqs: [
    {
      question: "How many drywall sheets do I need for a room?",
      answer:
        "Add up the wall area (perimeter × height, less doors and windows) and the ceiling area if you are boarding it, add 10% for cuts and waste, and divide by the sheet area — 32 ft² for a standard 4 × 8 ft sheet. A 12 × 12 ft room with 8 ft walls and a ceiling needs about 17 sheets.",
    },
    {
      question: "How much joint compound do I need per sheet?",
      answer:
        "About 0.3 gallons per 4 × 8 sheet for a Level 4 finish — roughly 1 gallon per 100 ft² of board. A 4.5 gallon pail covers about 450 ft², or about 14 sheets. Beginners use more; a Level 5 skim coat uses much more.",
    },
    {
      question: "How many screws does a sheet of drywall take?",
      answer:
        "It depends on the sheet size. On walls framed 16 inches on center, a 4 × 8 ft sheet takes about 28 screws and a ceiling sheet about 35, where the spacing is tighter to resist sag. Longer sheets need more: 4 × 10 ft takes about 32 on walls and 40 on ceilings, and 4 × 12 ft takes about 40 and 50. Drywall screws are sold by the pound — about 250 screws per pound for 1¼ inch coarse-thread screws.",
    },
    {
      question: "Should I use 4 × 8 or 4 × 12 sheets?",
      answer:
        "4 × 12 ft sheets mean fewer butt joints to tape and mud, which saves finishing time, but they are heavy and awkward — you need two people and a clear path to get them in. For most DIY rooms, 4 × 8 ft sheets are the practical choice.",
    },
  ],
  modes: [
    {
      id: "room",
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
          defaultImp: "12",
          defaultMet: "3.66",
        },
        {
          id: "height",
          label: "Wall height",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "8",
          defaultMet: "2.44",
        },
        {
          id: "doors",
          label: "Doors",
          kind: "count",
          defaultImp: "1",
          defaultMet: "1",
          min: 0,
          hint: `Each door deducts ${DOOR_AREA_FT2} ft².`,
        },
        {
          id: "windows",
          label: "Windows",
          kind: "count",
          defaultImp: "2",
          defaultMet: "2",
          min: 0,
          hint: `Each window deducts ${WINDOW_AREA_FT2} ft².`,
        },
        {
          id: "ceiling",
          label: "Ceiling",
          kind: "select",
          defaultImp: "1",
          defaultMet: "1",
          options: [
            { value: "1", label: "Include the ceiling" },
            { value: "0", label: "Walls only" },
          ],
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const wallAreaFt2 = Math.max(
          0,
          2 * (req(v, "length") + req(v, "width")) * req(v, "height") -
            req(v, "doors") * DOOR_AREA_FT2 -
            req(v, "windows") * WINDOW_AREA_FT2,
        );
        const ceilingAreaFt2 = req(v, "ceiling") === 1 ? req(v, "length") * req(v, "width") : 0;
        return drywallOutput(wallAreaFt2, ceilingAreaFt2, v, present);
      },
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        {
          id: "area",
          label: "Area to cover",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "478",
          defaultMet: "44.41",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => drywallOutput(req(v, "area"), 0, v, present),
    },
  ],
};
