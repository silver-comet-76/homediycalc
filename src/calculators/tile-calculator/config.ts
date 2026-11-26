/**
 * Tile Calculator config — tile and box counts for a floor or wall.
 * See src/lib/formulas/tile.ts and docs/FORMULAS.md §9.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateTile } from "../../lib/formulas/tile";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function tileOutput(areaFt2: number, v: Record<string, number>, present: Set<string>) {
  const r = calculateTile({
    areaFt2,
    tileLengthIn: req(v, "tileLength"),
    tileWidthIn: req(v, "tileWidth"),
    jointIn: req(v, "joint"),
    wastePct: req(v, "waste"),
    tilesPerBox: req(v, "tilesPerBox"),
    pricePerBox: present.has("pricePerBox") ? req(v, "pricePerBox") : undefined,
    pricePerTile: present.has("pricePerTile") ? req(v, "pricePerTile") : undefined,
  });
  return {
    rows: [
      {
        label: "Area to tile",
        value: `${fmt(areaFt2)} ft²`,
        detail: `${fmt(r.effectiveTileAreaFt2, 4)} ft² per tile including a ${fmt(req(v, "joint"), 3)} in grout joint`,
      },
      {
        label: "Tiles needed",
        value: `${r.tilesNeeded} tiles`,
        detail: `${fmt(req(v, "waste"), 0)}% waste included`,
      },
      {
        label: "Boxes needed",
        value: `${r.boxesNeeded} boxes`,
        detail: `${fmt(req(v, "tilesPerBox"), 0)} tiles per box — rounded up`,
      },
    ],
    lines: [
      `Tiles (${fmt(req(v, "tileLength"), 2)} × ${fmt(req(v, "tileWidth"), 2)} in): ${r.tilesNeeded}`,
      `Boxes of tile (${fmt(req(v, "tilesPerBox"), 0)} per box): ${r.boxesNeeded}`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${fmt(r.effectiveTileAreaFt2, 4)} ft² per tile = ${r.tilesNeeded} tiles → ${r.boxesNeeded} boxes.`,
  };
}

export const tileConfig: CalculatorConfig = {
  slug: "tile-calculator",
  designCplus: true,
  heroResultLabel: "Boxes needed",
  lookupTable: {
    note: "Assumes 12 × 12 in tiles, a ⅛ in grout joint, 10% waste, and 10 tiles per box.",
    headers: ["Room size", "Area to tile", "Tiles needed", "Boxes needed"],
    rows: [
      ["5 × 8 ft room", "40 ft²", "44 tiles", "5 boxes"],
      ["10 × 10 ft room", "100 ft²", "108 tiles", "11 boxes"],
      ["12 × 12 ft room", "144 ft²", "156 tiles", "16 boxes"],
      ["12 × 15 ft room", "180 ft²", "194 tiles", "20 boxes"],
      ["15 × 20 ft room", "300 ft²", "324 tiles", "33 boxes"],
    ],
  },
  diagram: "area",
  defaultMode: "dimensions",
  formula:
    "Tiles = area × (1 + waste%) ÷ area per tile, rounded up. " +
    "Area per tile includes the grout joint: (tile length + joint) × (tile width + joint). " +
    "Boxes = tiles ÷ tiles per box, rounded up. Waste default 10% for a straight lay; " +
    "diagonal or patterned layouts typically need 15% or more.",
  howTo: [
    [
      {
        text: "Measure the floor or wall area in feet. For a rectangle, length × width; for an L-shape, split it into rectangles and add them (or use the ",
      },
      { text: "Square Footage Calculator", calc: "square-footage-calculator" },
      { text: " first)." },
    ],
    "Measure one tile in inches — length and width. Read the tiles per box off the box, and the grout joint you plan to use (1/8 in and 3/16 in are common).",
    "Choose the waste allowance: 10% for a straight lay in a simple room, more for diagonal layouts, patterns, or rooms with many cuts around fixtures.",
    "Buy all the tile from the same batch (same dye lot) — shades vary between batches, and a later box may not match.",
  ],
  workedExample:
    "A 100 ft² floor with 12 in × 12 in tiles, ⅛ in joints, and 10% waste: 100 × 1.10 ÷ 1.02 ft² per tile = 108 tiles. " +
    "At 10 tiles per box, buy 11 boxes.",
  limitations: [
    "Assumes rectangular tiles and a rectangular area. Borders, medallions, and mosaic sheets need their own counts.",
    "The waste allowance covers cuts at edges and breakage, not a pattern change mid-job. Very irregular rooms need a higher allowance.",
    [
      { text: "Grout and adhesive are not included — use the " },
      { text: "Grout Calculator", calc: "grout-calculator" },
      { text: " and the " },
      { text: "Tile Adhesive Calculator", calc: "tile-adhesive-calculator" },
      { text: ". This page counts tiles and boxes only." },
    ],
  ],
  depthSections: [
    {
      id: "grout-joint-changes-count",
      heading: "Why the grout joint changes the tile count",
      takeaway:
        "Each tile’s footprint includes half a grout joint on each side, so the calculator divides by (tile length + joint) × (tile width + joint), not the tile’s face area: a 12×12 in tile with a ⅛ in joint covers 1.02 ft², not 1.00 ft² — for a 100 ft² floor, 108 tiles with the joint counted and 110 with no joint at all, with 10% waste included in both figures. A wider joint means fewer tiles but more grout. Joint minimums (TCNA guidance as quoted in CUSTOM bulletin TB87): ⅛ in for rectified tile, 3/16 in for calibrated tile, and never under 1/16 in per ANSI A108.02 §4.3.8 — quoted guidance, not a direct TCNA citation.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "A tile's footprint on the floor is bigger than the tile itself, because every tile carries half a grout joint on each side. The calculator divides by the ",
            },
            { text: "effective", strong: true },
            {
              text: " area — (tile length + joint) × (tile width + joint) — not by the tile's face area. For a 12×12 in tile with a ⅛ in joint, the effective area is (12.125 × 12.125) ÷ 144 = 1.02 ft², not 1.00 ft². That small difference is worth 2 tiles on a 100 ft² floor: 108 tiles with the joint counted, 110 without it. The 110 figure is what you get if the tiles are butted together with no joint at all — which is not how floors are laid. The wider the joint, the fewer tiles you need and the more grout you need; the joint width is therefore an input to both this calculator and the ",
            },
            { text: "Grout Calculator", calc: "grout-calculator" },
            {
              text: ", and the two answers move in opposite directions when you change it. Joint width itself has a floor under it: TCNA guidance as quoted in CUSTOM's technical bulletin TB87 recommends a minimum ⅛ in grout joint for rectified tile and 3/16 in for calibrated tile, and ANSI A108.02 §4.3.8 (as quoted in the same bulletin) says a grout joint should under no circumstances be less than 1/16 in. The bulletin is a secondary source — the TCNA Handbook itself is a paid publication and was not read for this page — so treat these as the manufacturer's quoted guidance, not as a direct TCNA citation.",
            },
          ],
        },
      ],
    },
    {
      id: "tiles-per-100-square-feet",
      heading: "Tiles per 100 square feet, by tile size",
      takeaway:
        "Sanity-check any tile estimate in tiles per 100 ft² (⅛ in joints, 10% waste, 10 tiles per box): 3×6 in subway needs 828 tiles (83 boxes), 12×12 in needs 108 (11 boxes), 12×24 in needs 55 (6 boxes). The 12×12 row is 108, not 110 — the joint counts. Small tiles need far more pieces. Always read tiles-per-box off the box you buy: if it holds 5 large-format tiles, a 12×24 floor needs 11 boxes, not 6. Raise the 10% waste default to 15% or more for diagonal layouts or patterns such as herringbone.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The fastest way to sanity-check any tile estimate is tiles per 100 ft². The table below uses the calculator's own formula — ⅛ in joints, 10% waste, 10 tiles per box — so every row is what the calculator itself would return for a 100 ft² area. Scale it to your area by multiplying.",
            },
          ],
        },
        {
          type: "table",
          headers: [
            "Tile size",
            "Effective area per tile",
            "Tiles per 100 ft²",
            "Boxes per 100 ft²",
          ],
          rows: [
            ["3 × 6 in subway", "0.133 ft²", "828", "83"],
            ["12 × 12 in", "1.02 ft²", "108", "11"],
            ["12 × 24 in", "2.03 ft²", "55", "6"],
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: 'Two things in this table surprise first-time tilers. First, the 12×12 row is 108, not 110 — the joint counts, as explained above, and the "100 tiles per 100 ft², 110 with waste" figure published on several tile-calculator pages is the joint-free count. Second, the subway row is 828 tiles: small tiles need far more pieces because the count is driven by area per tile, and a 3×6 in tile covers about one-eighth of a square foot. Always read the tiles-per-box figure off the box you are buying — it varies by size and brand, and the box count in this table assumes 10 per box. If your box holds 5 large-format tiles, a 12×24 floor needs 11 boxes, not 6. On waste: raise the 10% default to 15% or more for diagonal layouts or patterns such as herringbone — not because diagonal tiles are bigger, but because every cut at 45° wastes the triangular offcut, and a pattern that must line up across the room leaves fewer reusable pieces.',
            },
          ],
        },
      ],
    },
    {
      id: "box-count",
      heading: "What the box count does — and does not — tell you",
      takeaway:
        "Boxes are always rounded up: 55 tiles at 10 per box means 6 boxes and 5 spares, and 51 tiles still needs 6 boxes. That rounding is why a small area change sometimes changes nothing — for a 100 ft² floor (12×12 in tile, ⅛ in joint, 10% waste) it is 108 tiles (11 boxes), and a 101 ft² floor needs 109 tiles, still 11 boxes. Do not shave the waste allowance to fit under a box boundary: the waste pays for real cuts, and running one tile short at the last row costs more in a second trip than the box saved.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: 'Boxes are rounded up, always. If the tile count is 55 and the box holds 10, you buy 6 boxes and own 5 spare tiles; if the count is 51, you still buy 6 boxes, because 5 boxes hold only 50. The calculator never tells you to buy a fraction of a box. That rounding is also why small changes in area sometimes change nothing: a 100 ft² floor needs 108 tiles (11 boxes), and a 101 ft² floor needs 109 tiles — still 11 boxes. Do not "save" a box by shaving the waste allowance to fit the count under a box boundary — the waste allowance is paying for real cuts, and a job that runs one tile short at the last row costs more in a second trip than the box saved.',
            },
          ],
        },
      ],
    },
    {
      id: "worked-examples-large-format-bathroom",
      heading: "Worked examples — large-format tile, and a bathroom floor",
      blocks: [
        {
          type: "paragraph",
          text: [
            { text: "10 × 10 ft floor, 12 × 24 in tiles.", strong: true },
            {
              text: " Area 100 ft². Effective area: (12.125 × 24.125) ÷ 144 = 2.03 ft². Tiles: 100 × 1.10 ÷ 2.03 = 54.15 → ",
            },
            { text: "55 tiles", strong: true },
            { text: ". Boxes: 55 ÷ 10 = 5.5 → " },
            { text: "6 boxes", strong: true },
            {
              text: ". (With joint = 0 this example would also give 55 tiles — do not generalize that; for 12×12 tiles the joint changes the answer by 2.)",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            { text: "Bathroom floor, 5 × 8 ft, 12 × 24 in tiles.", strong: true },
            {
              text: " Area 40 ft². Tiles: 40 × 1.10 ÷ 2.03 = 21.66 → ",
            },
            { text: "22 tiles", strong: true },
            { text: ". Boxes: 22 ÷ 10 = 2.2 → " },
            { text: "3 boxes", strong: true },
            {
              text: ". The third box is mostly spare tile — keep it; bathroom floors are where a future cracked tile is hardest to match. The tile count is only the first of three material counts for the job: grout fills the joints (see the ",
            },
            { text: "Grout Calculator", calc: "grout-calculator" },
            { text: "), and thinset sticks the tiles down (see the " },
            { text: "Tile Adhesive Calculator", calc: "tile-adhesive-calculator" },
            {
              text: "). Neither is included in the tile count. Thinset for a 100 ft² floor with a ½×½ in notch needs ",
            },
            { text: "3 bags", strong: true },
            {
              text: " (100 × 1.10 ÷ 42 = 2.62 → 3) — not 6, which is the answer for a 200 ft² floor. That 3-bag figure is a conditional estimate at CUSTOM's chart coverage and excludes back-troweling material.",
            },
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How much extra tile should I buy for waste?",
      answer:
        "10% is the usual allowance for a straight lay in a simple rectangular room. Use 15% for diagonal layouts or patterns, and more again for rooms with many cuts around fixtures, niches, or curved edges. Keep a few spare tiles after the job for future repairs.",
    },
    {
      question: "How do I calculate tiles for a wall?",
      answer:
        "The same way as a floor: measure the wall area in square feet, enter your tile size and grout joint, and the calculator gives tiles and boxes. Remember to subtract large openings such as a window, and add extra waste for cuts around outlets and fixtures.",
    },
    {
      question: "What grout joint width should I use?",
      answer:
        "1/8 inch (3 mm) is common for rectified tiles on floors; 3/16 inch (5 mm) is typical for walls and non-rectified tile. The joint slightly increases each tile's footprint, so the calculator includes it — a wider joint means slightly fewer tiles but more grout.",
    },
  ],
  modes: [
    {
      id: "dimensions",
      label: "Room dimensions",
      fields: [
        {
          id: "length",
          label: "Length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3.05",
        },
        {
          id: "width",
          label: "Width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3.05",
        },
        {
          id: "tileLength",
          label: "Tile length",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "12",
          defaultMet: "30.5",
          allowUnitSelect: true,
          unitOptions: ["in", "cm", "mm"],
        },
        {
          id: "tileWidth",
          label: "Tile width",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "12",
          defaultMet: "30.5",
          allowUnitSelect: true,
          unitOptions: ["in", "cm", "mm"],
        },
        {
          id: "joint",
          label: "Grout joint width",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          min: 0,
          defaultImp: "0.125",
          defaultMet: "0.32",
          hint: "Width of the grout line between tiles. 1/8 in (0.125 in) is common.",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
          hint: "10% for a straight lay; 15% or more for diagonal or patterned layouts.",
        },
        {
          id: "tilesPerBox",
          label: "Tiles per box",
          kind: "count",
          defaultImp: "10",
          defaultMet: "10",
          min: 1,
          max: 100,
          hint: "Printed on the box.",
        },
        {
          id: "pricePerBox",
          label: "Price per box (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerTile",
          label: "Price per tile (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Used only when no per-box price is entered.",
        },
      ],
      compute: (v, present) => tileOutput(req(v, "length") * req(v, "width"), v, present),
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        {
          id: "area",
          label: "Area to tile",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "100",
          defaultMet: "9.29",
        },
        {
          id: "tileLength",
          label: "Tile length",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "12",
          defaultMet: "30.5",
          allowUnitSelect: true,
          unitOptions: ["in", "cm", "mm"],
        },
        {
          id: "tileWidth",
          label: "Tile width",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "12",
          defaultMet: "30.5",
          allowUnitSelect: true,
          unitOptions: ["in", "cm", "mm"],
        },
        {
          id: "joint",
          label: "Grout joint width",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          min: 0,
          defaultImp: "0.125",
          defaultMet: "0.32",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
        },
        {
          id: "tilesPerBox",
          label: "Tiles per box",
          kind: "count",
          defaultImp: "10",
          defaultMet: "10",
          min: 1,
          max: 100,
        },
        {
          id: "pricePerBox",
          label: "Price per box (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerTile",
          label: "Price per tile (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
      ],
      compute: (v, present) => tileOutput(req(v, "area"), v, present),
    },
  ],
};
