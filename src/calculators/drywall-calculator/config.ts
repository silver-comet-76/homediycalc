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
        value: `${r.sheetsToBuy} ${r.sheetsToBuy === 1 ? "sheet" : "sheets"}`,
        detail: `${r.sheetsHung} ${r.sheetsHung === 1 ? "sheet" : "sheets"} hung + ${fmt(req(v, "waste"), 0)}% waste — ${fmt(req(v, "sheetSize"), 0)} ft² per sheet`,
      },
      {
        label: "Joint compound",
        value: `${fmt(r.compoundGal)} gal`,
        detail: `${r.pails} × ${fmt(req(v, "pailSize"), 1)} gal ${r.pails === 1 ? "pail" : "pails"} — about ${fmt(req(v, "compoundCoverage"), 0)} ft² per gallon`,
      },
      {
        label: "Paper tape",
        value: `${fmt(r.tapeFt)} ft`,
        detail: `${r.tapeRolls} × 250 ft ${r.tapeRolls === 1 ? "roll" : "rolls"} — about 370 ft per 1,000 ft²`,
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
    workedLine: `${fmt(r.totalAreaFt2)} ft² × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${fmt(req(v, "sheetSize"), 0)} ft² per sheet = ${r.sheetsToBuy} ${r.sheetsToBuy === 1 ? "sheet" : "sheets"}; compound ${fmt(r.totalAreaFt2)} ÷ ${fmt(req(v, "compoundCoverage"), 0)} = ${fmt(r.compoundGal)} gal → ${r.pails} ${r.pails === 1 ? "pail" : "pails"}.`,
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
    hint: "4 × 8 ft is the common DIY size. Longer sheets mean fewer seams to tape.",
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
  designCplus: true,
  heroResultLabel: "Drywall sheets",
  lookupTable: {
    note: "Assumes 8 ft walls, 1 door and 2 windows, ceiling included, 4 × 8 ft sheets, 10% waste, joint compound at 100 ft²/gal in 4.5 gal pails, and standard screw counts for 4 × 8 ft sheets (28 per wall sheet, 35 per ceiling sheet).",
    headers: [
      "Room size",
      "Area to cover",
      "Drywall sheets",
      "Joint compound",
      "Paper tape",
      "Drywall screws",
    ],
    rows: [
      ["10 × 10 ft room", "370 ft²", "13 sheets", "3.7 gal", "136.9 ft", "392 screws"],
      ["12 × 12 ft room", "478 ft²", "17 sheets", "4.78 gal", "176.86 ft", "483 screws"],
      ["12 × 15 ft room", "562 ft²", "20 sheets", "5.62 gal", "207.94 ft", "546 screws"],
      ["15 × 20 ft room", "810 ft²", "28 sheets", "8.1 gal", "299.7 ft", "798 screws"],
      ["20 × 20 ft room", "990 ft²", "35 sheets", "9.9 gal", "366.3 ft", "987 screws"],
    ],
  },
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
  depthSections: [
    {
      id: "sheets-to-buy-vs-sheets-hung",
      heading: "Sheets to buy vs sheets hung — why waste applies to one number and not the other",
      takeaway:
        "Sheets hung (16 in the worked example) is the count that covers the area — wall and ceiling sheets each rounded up separately. Sheets to buy (17) adds the waste allowance (× 1.10) on top of the total area, then divides once: ceil(478 ft² × 1.10 ÷ 32 ft²) = 17. Waste applies to sheets only: compound, tape, and screws are estimated from the 478 ft² actually hung, not the waste-inflated area — you do not tape the sheet you threw away.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The calculator returns two sheet numbers that look redundant and are not: ",
            },
            { text: "sheets hung", strong: true },
            { text: " (16 in the worked example below) and " },
            { text: "sheets to buy", strong: true },
            {
              text: " (17). Sheets hung is the count that covers the area: wall sheets plus ceiling sheets, each rounded up separately, because a wall that needs 10.44 sheets needs 11 sheets, not 10.44 — and a ceiling that needs 4.5 sheets needs 5. Sheets to buy adds the waste allowance on top of the ",
            },
            { text: "total area", strong: true },
            {
              text: ", then divides once: ceil(478 ft² × 1.10 ÷ 32 ft²) = 17. The waste allowance pays for the sheets you cut wrong, the offcuts too small to reuse, and the sheet that arrives cracked. It is applied to sheets only. Joint compound, tape, and screws are estimated from the area actually hung — the 478 ft² that ends up on the walls and ceiling — not from the waste-inflated area, because you do not tape or mud the sheet you threw away. That is why the compound figure (4.78 gal) is smaller than a waste-inflated calculation would give, and why it is right: the compound goes on the joints of the sheets that are hung, and there are 16 of those, not 17.",
            },
          ],
        },
      ],
    },
    {
      id: "sheet-sizes-thicknesses",
      heading: "Sheet sizes, thicknesses, and what to order",
      takeaway:
        "A standard sheet is 4 ft × 8 ft (32 ft²); longer sheets mean fewer seams: 4×10 ft is 40 ft² and 4×12 ft is 48 ft², and USG UltraLight panels run 8–16 ft long in 48 in and 54 in widths. For a 9 ft wall, 54 in panels cover the 108 in height in two horizontal courses with one seam. Thicknesses are ¼, ⅜, ½, and ⅝ in: ½ in is standard, ⅝ in Type X is the fire-rated board (typically garage ceilings beneath habitable rooms), and ¼ in is an overlay, not a single-layer board. Thickness does not change the sheet count, but it decides fire rating, sound, and spanning — and the fastener spacings quoted are the 2021 IRC Table R702.3.5 values as corroborated from the reproduced table. Note: this calculator deducts 20 ft² per door; the Paint Calculator deducts 21 ft² — both deliberate conventions, not errors.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "A standard sheet is 4 ft × 8 ft (32 ft²) — the common DIY size. Longer sheets cover more area with fewer seams to tape: 4×10 ft is 40 ft², 4×12 ft is 48 ft², and USG's data sheet for its UltraLight panels lists lengths from 8 ft to 16 ft, in 48 in and 54 in widths. For a 9 ft wall, 54 in wide panels can be installed in two horizontal courses, covering the 108 in wall height with one horizontal seam and avoiding the additional narrow filler strip required with standard 48 in wide panels (USG Sheetrock Brand MH UltraLight Tuf-Base Gypsum Panels Data Sheet MH1314, rev. 8-13; a ½ in UltraLight panel weighs 1.25 lb per sq ft).",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "Thicknesses run ¼, ⅜, ½, and ⅝ in (USG Sheetrock Installation and Finishing Guide J371). Half-inch is the standard for walls and ceilings in most rooms; ⅝ in Type X is the fire-rated board used where the code requires it — typically garage ceilings beneath habitable rooms — and ¼ in is an overlay board, not a single-layer board. This calculator does not ask for thickness, because the sheet count does not depend on it: a 4×8 ft sheet covers 32 ft² whatever its thickness. But thickness decides things the calculator does not — fire rating, sound performance, spanning — so check the thickness your job needs before you order. The fastener spacings quoted in the screws section below are the 2021 IRC Table R702.3.5 values as corroborated from the reproduced table; your local code may amend them. One more number not to mix up: this calculator deducts ",
            },
            { text: "20 ft² per door", strong: true },
            {
              text: " (an estimating convention) and 15 ft² per window. The Paint Calculator deducts 21 ft² per door (3×7 ft). Both are deliberate per-calculator conventions, not errors — but do not carry one page's door figure into the other calculator.",
            },
          ],
        },
      ],
    },
    {
      id: "screws-per-sheet-spacing",
      heading: "Screws: how many per sheet, and the spacing they come from",
      takeaway:
        "Estimating counts for framing 16 in on center (Material Guides, at ASTM C840 / GA-216 spacing): a 4×8 ft sheet takes 28 screws on walls and 35 on ceilings; 4×10 ft takes 32 and 40; 4×12 ft takes 40 and 50. Ceilings take more because the screws go closer together overhead. The code maximum spacings are 2021 IRC Table R702.3.5 (corroborated from the reproduced table): ceilings 12 in; walls 16 in on 16 in framing, 12 in on 24 in framing; ⅝ in Type X garage ceiling beneath habitable rooms 6 in. There is no separate edge-vs-field screw spacing in that table — the “8 in” figure quoted in earlier research is the nail spacing, not a screw spacing. Screws must be Type W or S (ASTM C1002), penetrating the wood at least ⅝ in. Screws are sold by the pound — about 250 per pound for 1¼ in coarse-thread screws.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "This calculator's counts are: for a 4×8 ft sheet, ",
            },
            { text: "28 screws on walls and 35 on ceilings", strong: true },
            {
              text: "; for 4×10 ft, 32 and 40; for 4×12 ft, 40 and 50. Ceilings take more screws per sheet than walls because the screws go closer together overhead, to resist sag. The counts are the calculator's estimating counts for framing 16 in on center (the formula's source is Material Guides' per-sheet quantities, at ASTM C840 / GA-216 spacing). Separately, the code maximum spacings are in the 2021 IRC, Table R702.3.5 — which is where a correction to earlier research on this site belongs, stated plainly:",
            },
          ],
        },
        {
          type: "table",
          headers: ["Application", "Screws, max. spacing (IRC Table R702.3.5)"],
          rows: [
            ["Ceilings (⅜, ½, ⅝ in board)", "12 in"],
            ["Walls, framing 16 in on center (½, ⅝ in board)", "16 in"],
            ["Walls, framing 24 in on center (½, ⅝ in board)", "12 in"],
            ["⅝ in Type X garage ceiling beneath habitable rooms", "6 in"],
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "The table gives ",
            },
            { text: "one maximum spacing per row", strong: true },
            {
              text: ' — there is no separate "edge vs field" screw spacing in it. The "8 in" figure that Phase 17A research on this site quoted as a screw edge spacing is the ',
            },
            { text: "nail", strong: true },
            {
              text: " spacing on walls (7 in on ceilings), not a screw spacing, and it must not be repeated as a screw figure. Screws must be Type W or S (ASTM C1002), penetrating the wood at least ⅝ in (IRC R702.3.5.1). The spacing figures are corroborated from the reproduced Table R702.3.5 and a Maine municipal inspection checklist — the ICC's own digital-codes text was not readable for this page, so they are labelled corroborated, not claimed as read from ICC.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: 'Two consequences. First, the "~32 screws per 4×8 sheet" rule of thumb on other pages is an estimating figure, not a code figure — if your framing is 24 in on center, the IRC maximum tightens to 12 in and the count goes up; use the override fields to enter your own figure. Second, screws are sold by the pound — about 250 per pound for 1¼ in coarse-thread screws — so the worked example\'s 483 screws is about 2 lb. Buy by the pound, and buy a little over: a stripped screw is not reusable.',
            },
          ],
        },
      ],
    },
    {
      id: "joint-compound-tape-finish-level",
      heading: "Joint compound, tape, and finish level — what the per-gallon figure assumes",
      takeaway:
        "Joint compound is estimated at 100 ft² per gallon for a Level 4 three-coat finish — about 0.3 gal per 4×8 ft sheet, or one 4.5 gal pail per 450 ft² (about 14 sheets). USG’s figures support that rate: All Purpose compound about 10 gal per 1,000 ft² and Plus 3 about 9.4 gal per 1,000 ft², both for a standard three-coat job; its guide gives 10.0 gal All Purpose, 9.0 gal Plus 3, and 370 ft of paper tape per 1,000 ft². The 100 ft²/gal figure is for a Level 4 finish only — a Level 5 skim coat takes much more, and no published per-level quantities exist. Corner bead for outside corners is not included.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "Joint compound is estimated at ",
            },
            { text: "100 ft² per gallon for a Level 4 three-coat finish", strong: true },
            {
              text: " — about 0.3 gallons per 4×8 ft sheet, or about one 4.5 gallon pail per 450 ft² (about 14 sheets). USG's own figures support that rate from two directions: its All Purpose Joint Compound submittal (J1969, rev. 6-22) lists coverage of approximately 10 gallons per 1,000 sq ft of gypsum panels, and its Plus 3 Lightweight All Purpose submittal (J498A) lists approximately 9.4 gallons per 1,000 sq ft — both for a standard three-coat job — and its Installation and Finishing Guide (J371) gives the same quantity table per 1,000 sq ft of board: 10.0 gal All Purpose compound, 9.0 gal Plus 3, and 370 ft of paper tape. The calculator's defaults are those figures. A 4.5 gal pail therefore covers about 450 ft², and the worked example's 478 ft² needs 4.78 gal — 2 pails.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "The qualification matters: the 100 ft²/gal figure is for a Level 4 finish — three coats, the standard for a painted wall. A Level 5 skim coat, where the whole surface is coated thin, takes much more compound, and the calculator's limitations already say so. No USG or Gypsum Association document publishes compound quantities per finish level, so this page gives none and attributes none to USG. Corner bead for outside corners is not included — count each outside corner's height and buy bead in 8 or 10 ft lengths.",
            },
          ],
        },
      ],
    },
    {
      id: "worked-examples-ceiling-4x12",
      heading: "Worked examples — ceiling only, and 4 × 12 ft sheets",
      blocks: [
        {
          type: "paragraph",
          text: [
            { text: "Ceiling only, 12 × 12 ft.", strong: true },
            {
              text: " Area 144 ft², walls not boarded. Sheets hung: ceil(144 ÷ 32) = 5. Sheets to buy: ceil(144 × 1.10 ÷ 32) = ceil(4.95) = ",
            },
            { text: "5 sheets", strong: true },
            { text: ". Compound: 144 ÷ 100 = " },
            { text: "1.44 gal", strong: true },
            { text: " → " },
            { text: "1 pail", strong: true },
            { text: ". Tape: 144 × 370 ÷ 1,000 = " },
            { text: "53.28 ft", strong: true },
            { text: " → " },
            { text: "1 roll", strong: true },
            { text: ". Screws: 5 × 35 = " },
            { text: "175 screws", strong: true },
            { text: " (0.7 lb)." },
          ],
        },
        {
          type: "paragraph",
          text: [
            { text: "The same 12 × 12 ft room with 4 × 12 ft sheets.", strong: true },
            {
              text: " Sheet area 48 ft². Sheets to buy: ceil(478 × 1.10 ÷ 48) = ceil(10.96) = ",
            },
            { text: "11 sheets", strong: true },
            {
              text: " (vs 17 sheets of 4×8). Screws: wall sheets ceil(334 ÷ 48) = 7 × 40 = 280; ceiling sheets ceil(144 ÷ 48) = 3 × 50 = 150; total ",
            },
            { text: "430 screws", strong: true },
            {
              text: ". Compound, tape, and pails are unchanged (4.78 gal, 2 pails, 177 ft, 1 roll) — they depend on area, not sheet size. Fewer sheets means fewer butt joints to tape and mud.",
            },
          ],
        },
      ],
    },
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
    {
      question: "Is this the same as a sheetrock or plasterboard calculator?",
      answer:
        "Yes — drywall is called sheetrock in the US and plasterboard in the UK and Australia. This calculator works out how many sheets you need for a wall or ceiling.",
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
