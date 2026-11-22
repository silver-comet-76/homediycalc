/**
 * Ceiling Tile Calculator config — tiles and suspension-grid
 * components for a drop ceiling.
 * See src/lib/formulas/ceiling-tile.ts and docs/FORMULAS.md §19.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import {
  calculateCeilingGrid,
  calculateCeilingTiles,
  tilesPerCartonForTileArea,
} from "../../lib/formulas/ceiling-tile";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function ceilingOutput(
  areaFt2: number,
  lengthFt: number | undefined,
  widthFt: number | undefined,
  v: Record<string, number>,
  present: Set<string>,
) {
  const tileArea = req(v, "tileSize");
  // The carton count follows the tile size unless the user entered
  // their own: 16 per carton for 2 × 2 ft, 8 for 2 × 4 ft.
  const tilesPerCarton = present.has("tilesPerCarton")
    ? req(v, "tilesPerCarton")
    : tilesPerCartonForTileArea(tileArea);
  const r = calculateCeilingTiles({
    areaFt2,
    tileAreaFt2: tileArea,
    tilesPerCarton,
    wastePct: req(v, "waste"),
    pricePerCarton: present.has("pricePerCarton") ? req(v, "pricePerCarton") : undefined,
  });
  const tileLabel = tileArea === 4 ? "2 × 2 ft" : "2 × 4 ft";
  const rows: { label: string; value: string; detail?: string }[] = [
    {
      label: "Tiles needed",
      value: `${r.tiles} tiles`,
      detail: `${fmt(areaFt2)} ft² with ${fmt(req(v, "waste"), 0)}% waste — ${fmt(tileArea, 0)} ft² per ${tileLabel} tile`,
    },
    {
      label: "Cartons to buy",
      value: `${r.cartons} cartons`,
      detail: `${fmt(tilesPerCarton, 0)} tiles per carton — rounded up`,
    },
  ];
  const lines = [
    `Ceiling tiles (${tileLabel}): ${r.tiles} tiles (${r.cartons} cartons of ${fmt(tilesPerCarton, 0)})`,
  ];
  let workedLine = `${fmt(areaFt2)} ft² × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${fmt(tileArea, 0)} ft² = ${r.tiles} tiles → ${r.cartons} cartons.`;
  if (lengthFt !== undefined && widthFt !== undefined) {
    const g = calculateCeilingGrid({ lengthFt, widthFt, tileAreaFt2: tileArea });
    rows.push(
      {
        label: "Main tees (12 ft)",
        value: `${g.mainTees} tees`,
        detail: `${g.mainLines} main lines, 4 ft apart — Armstrong guide`,
      },
      {
        label: "Cross tees (4 ft)",
        value: `${g.crossTees4Ft} tees`,
        detail: "One in every bay, every 2 ft along the length",
      },
    );
    if (g.crossTees2Ft > 0) {
      rows.push({
        label: "Cross tees (2 ft)",
        value: `${g.crossTees2Ft} tees`,
        detail: "Only for 2 × 2 ft tiles — they split each 4 ft module",
      });
    }
    rows.push(
      {
        label: "Wall angle (10 ft)",
        value: `${g.wallAnglePieces} pieces`,
        detail: `${fmt(2 * (lengthFt + widthFt))} ft of perimeter`,
      },
      {
        label: "Hanger wires",
        value: `${g.hangers} wires`,
        detail: "One every 4 ft along each main beam",
      },
    );
    lines.push(`Main tees (12 ft): ${g.mainTees}`, `Cross tees (4 ft): ${g.crossTees4Ft}`);
    if (g.crossTees2Ft > 0) lines.push(`Cross tees (2 ft): ${g.crossTees2Ft}`);
    lines.push(`Wall angle (10 ft): ${g.wallAnglePieces}`, `Hanger wires: ${g.hangers}`);
    workedLine += ` Grid: ${g.mainLines} main lines × ${fmt(lengthFt)} ft → ${g.mainTees} main tees; ${g.crossTees4Ft} four-foot tees${g.crossTees2Ft > 0 ? `, ${g.crossTees2Ft} two-foot tees` : ""}.`;
  }
  return {
    rows,
    lines,
    costUsd: r.costUsd,
    workedLine,
    note: "Grid counts are a planning estimate from the room dimensions — border cuts, light fixtures, and joist direction change the real layout. Draw the grid on paper before ordering.",
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "tileSize",
    label: "Tile size",
    kind: "select",
    defaultImp: "4",
    defaultMet: "4",
    options: [
      { value: "4", label: "2 × 2 ft (4 ft² per tile)" },
      { value: "8", label: "2 × 4 ft (8 ft² per tile)" },
    ],
    hint: "2 × 2 ft and 2 × 4 ft are the standard drop-ceiling sizes. 2 × 4 ft tiles need no 2 ft cross tees.",
  },
  {
    id: "tilesPerCarton",
    label: "Tiles per carton",
    kind: "number",
    defaultImp: "",
    defaultMet: "",
    optional: true,
    min: 1,
    hint: "Leave blank for the standard count for your tile size: 16 per carton for 2 × 2 ft, 8 for 2 × 4 ft. Check your carton — counts vary by product.",
  },
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent",
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% covers border cuts and the odd cracked tile. Use 15% for a room with many borders or fixtures.",
  },
  {
    id: "pricePerCarton",
    label: "Price per carton (optional)",
    kind: "price",
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const ceilingTileConfig: CalculatorConfig = {
  slug: "ceiling-tile-calculator",
  diagram: "ceiling",
  defaultMode: "room",
  formula:
    "Tiles = ceiling area × (1 + waste%) ÷ tile area, rounded up; cartons = tiles ÷ tiles per carton, rounded up. " +
    "Tiles per carton follows the tile size unless you enter your own count: 16 per carton for 2 × 2 ft tiles, 8 for 2 × 4 ft tiles. " +
    "The grid follows Armstrong's installation guide: main beams on 4 ft centers (12 ft tees), 4 ft cross tees every 2 ft along each bay, " +
    "2 ft cross tees only for 2 × 2 ft tiles, wall angle in 10 ft pieces around the perimeter, and a hanger wire every 4 ft of main beam.",
  howTo: [
    "Measure the room's length and width at the height the new ceiling will sit — the ceiling area is length × width.",
    "Pick the tile size: 2 × 2 ft tiles need a full grid with 2 ft cross tees; 2 × 4 ft tiles span main beam to main beam and need no 2 ft tees.",
    "Check the carton count on the tile you are buying — 2 × 2 ft tiles commonly come 16 per carton and 2 × 4 ft commonly 8, but it varies by product. Leave the tiles-per-carton field blank to use the standard count for your tile size, or enter the count printed on your carton.",
    "Find the joist direction above: main beams run across the joists. If they must run the other way, swap length and width in the calculator.",
    "Allow at least 3 in of clearance above the grid for the tiles to tilt into place — 4 in if you are fitting recessed lights.",
  ],
  workedExample:
    "A 12 × 12 ft room (144 ft²) with 2 × 2 ft tiles and 10% waste: 144 × 1.10 ÷ 4 = 39.6, so 40 tiles — 3 cartons of 16. " +
    "The grid is 2 main tees (12 ft), 15 four-foot cross tees, 18 two-foot cross tees, 5 pieces of 10 ft wall angle, and 6 hanger wires.",
  limitations: [
    "Grid counts are a planning estimate from the room dimensions. Border tiles are cut to fit, so a room that is not a multiple of 2 ft needs more cutting and the tee counts shift — draw the layout before ordering.",
    "Assumes a rectangular room with a level ceiling. Sloped ceilings, soffits, and rooms with many light fixtures or vents need a drawn layout, not this estimate.",
    "Tiles per carton varies by brand and product line — the 16/8 defaults are common counts, not a promise. Always check the carton.",
    "This calculator sizes the grid; it does not check that the existing ceiling can carry it. Heavy tiles (mineral fiber over about 1 lb/ft²) may need closer hanger spacing — follow the tile maker's instructions.",
  ],
  faqs: [
    {
      question: "How many ceiling tiles do I need for a 12 × 12 room?",
      answer:
        "40 tiles of 2 × 2 ft (144 ft² with 10% waste is 158.4 ft², divided by 4 ft² per tile), which is 3 cartons of 16. In 2 × 4 ft tiles it is 20 tiles, or 3 cartons of 8. The grid adds 2 main tees, 15 four-foot cross tees, and — for 2 × 2 ft tiles — 18 two-foot cross tees.",
    },
    {
      question: "Do 2 × 4 ft ceiling tiles need 2 ft cross tees?",
      answer:
        "No. A 2 × 4 ft tile spans from one main beam to the next, 4 ft apart, so the 4 ft cross tees every 2 ft are enough. Only 2 × 2 ft tiles need the extra 2 ft tees to split each 4 ft module in half.",
    },
    {
      question: "How far apart are the main beams in a drop ceiling?",
      answer:
        "4 feet on center, per Armstrong's installation guide — and the hanger wires go every 4 feet along each main beam. The first main beam sits one border-panel distance from the wall, not hard against it, so the border tiles come out even on both sides.",
    },
    {
      question: "Can I replace ceiling tiles without replacing the grid?",
      answer:
        "Yes, if the grid is sound and the new tiles are the same size. Use the Known area mode — it counts tiles and cartons only, with no grid components. Check that the old grid is level and the tees are not bent or rusted first.",
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
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        ceilingOutput(
          req(v, "length") * req(v, "width"),
          req(v, "length"),
          req(v, "width"),
          v,
          present,
        ),
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        {
          id: "area",
          label: "Ceiling area",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "144",
          defaultMet: "13.38",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => ceilingOutput(req(v, "area"), undefined, undefined, v, present),
    },
  ],
};
