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
  diagram: "area",
  defaultMode: "dimensions",
  formula:
    "Tiles = area × (1 + waste%) ÷ area per tile, rounded up. " +
    "Area per tile includes the grout joint: (tile length + joint) × (tile width + joint). " +
    "Boxes = tiles ÷ tiles per box, rounded up. Waste default 10% for a straight lay; " +
    "diagonal or patterned layouts typically need 15% or more.",
  howTo: [
    "Measure the floor or wall area in feet. For a rectangle, length × width; for an L-shape, split it into rectangles and add them (or use the Square Footage Calculator first).",
    "Measure one tile in inches — length and width. Read the tiles per box off the box, and the grout joint you plan to use (1/8 in and 3/16 in are common).",
    "Choose the waste allowance: 10% for a straight lay in a simple room, more for diagonal layouts, patterns, or rooms with many cuts around fixtures.",
    "Buy all the tile from the same batch (same dye lot) — shades vary between batches, and a later box may not match.",
  ],
  workedExample:
    "A 100 ft² floor with 12 in × 12 in tiles and 10% waste: 100 × 1.10 ÷ 1 ft² per tile = 110 tiles. " +
    "At 10 tiles per box, buy 11 boxes.",
  limitations: [
    "Assumes rectangular tiles and a rectangular area. Borders, medallions, and mosaic sheets need their own counts.",
    "The waste allowance covers cuts at edges and breakage, not a pattern change mid-job. Very irregular rooms need a higher allowance.",
    "Grout and adhesive are not included — they have their own calculators in Phase 3.",
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
