/**
 * Grout Calculator config — grout weight and bags for a tiled area.
 * Companion to the Tile Calculator (which counts tiles): grout fills
 * the joints, so it depends on tile size, joint width, and joint depth.
 * See src/lib/formulas/grout.ts and docs/FORMULAS.md §16.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateGrout } from "../../lib/formulas/grout";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function groutOutput(areaFt2: number, v: Record<string, number>, present: Set<string>) {
  const r = calculateGrout({
    areaFt2,
    tileLengthIn: req(v, "tileLength"),
    tileWidthIn: req(v, "tileWidth"),
    jointWidthIn: req(v, "jointWidth"),
    jointDepthIn: req(v, "jointDepth"),
    groutDensityLbFt3: req(v, "density"),
    bagWeightLb: req(v, "bagWeight"),
    wastePct: req(v, "waste"),
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
  });
  return {
    rows: [
      {
        label: "Grout per square foot",
        value: `${fmt(r.groutLbPerFt2, 3)} lb/ft²`,
        detail: `${fmt(req(v, "tileLength"), 2)} × ${fmt(req(v, "tileWidth"), 2)} in tile, ${fmt(req(v, "jointWidth"), 3)} in joints`,
      },
      {
        label: "Grout needed",
        value: `${fmt(r.groutLb, 1)} lb`,
        detail: `${fmt(areaFt2)} ft² with ${fmt(req(v, "waste"), 0)}% extra for waste and sponge loss`,
      },
      {
        label: "Bags needed",
        value: `${r.bags} bags`,
        detail: `${fmt(req(v, "bagWeight"), 0)} lb bags — rounded up`,
      },
    ],
    lines: [
      `Grout (${fmt(req(v, "bagWeight"), 0)} lb bags): ${r.bags} bags (${fmt(r.groutLb, 1)} lb)`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(r.groutLbPerFt2, 4)} lb/ft² × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.groutLb, 1)} lb → ${r.bags} × ${fmt(req(v, "bagWeight"), 0)} lb bags.`,
  };
}

const COMMON_FIELDS: FieldSpec[] = [
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
    id: "jointWidth",
    label: "Joint width",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    min: 0,
    defaultImp: "0.125",
    defaultMet: "0.32",
    hint: "1/8 in (0.125 in) is common for floors. Under 1/8 in usually calls for unsanded grout.",
  },
  {
    id: "jointDepth",
    label: "Joint depth",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    defaultImp: "0.375",
    defaultMet: "0.95",
    hint: "Usually the tile thickness — 3/8 in for standard floor tile, 1/4 in for mosaic.",
  },
  {
    id: "density",
    label: "Grout density (lb per ft³)",
    kind: "number",
    defaultImp: "98.5",
    defaultMet: "98.5",
    min: 1,
    hint: "98.5 lb/ft³ reproduces the MAPEI Ultracolor Plus FA chart to within 2%. CUSTOM Polyblend Plus sanded implies about 110 lb/ft³. Premixed, urethane, and epoxy grouts cover differently — use their own charts.",
  },
  {
    id: "bagWeight",
    label: "Bag weight (lb)",
    kind: "number",
    defaultImp: "10",
    defaultMet: "10",
    min: 1,
    hint: "Grout is commonly sold in 10 lb and 25 lb bags. Enter the size on your bag.",
  },
  {
    id: "waste",
    label: "Extra allowance",
    kind: "percent",
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% covers what stays on the float, in the bucket, and in the sponge. Use 15% for mosaic or very small tile.",
  },
  {
    id: "pricePerBag",
    label: "Price per bag (optional)",
    kind: "price",
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const groutConfig: CalculatorConfig = {
  slug: "grout-calculator",
  lookupTable: {
    note: "Assumes 12 × 12 in tiles, a ⅛ in wide by ⅜ in deep joint, grout at 98.5 lb/ft³, 10 lb bags, and 10% waste.",
    headers: ["Room size", "Grout per square foot", "Grout needed", "Bags needed"],
    rows: [
      ["5 × 8 ft room", "0.064 lb/ft²", "2.8 lb", "1 bags"],
      ["10 × 10 ft room", "0.064 lb/ft²", "7.1 lb", "1 bags"],
      ["10 × 12 ft room", "0.064 lb/ft²", "8.5 lb", "1 bags"],
      ["12 × 15 ft room", "0.064 lb/ft²", "12.7 lb", "2 bags"],
      ["15 × 20 ft room", "0.064 lb/ft²", "21.2 lb", "3 bags"],
    ],
  },
  diagram: "area",
  defaultMode: "dimensions",
  formula:
    "Grout fills the joints to the tile's depth, so the weight per square " +
    "foot is: (tile length + tile width) ÷ (tile length × tile width) × " +
    "joint width × joint depth × 144 × density ÷ 1,728. Total grout = area " +
    "× lb/ft² × (1 + extra%), then bags = grout ÷ bag weight, rounded up. " +
    "Density defaults to 98.5 lb/ft³ (MAPEI Ultracolor Plus FA); a 10 lb " +
    "bag covers 156 ft² of 12 × 12 in tile with ⅛ in joints.",
  howTo: [
    "Measure the tiled area in feet — the same area you used for the Tile Calculator.",
    "Measure one tile in inches — length and width — and note its thickness, which is usually the joint depth.",
    "Choose the joint width: 1/8 in is common for floors, 3/16 in for walls and non-rectified tile. Joints under 1/8 in usually call for unsanded grout.",
    "Pick the bag size on the grout you are buying — 10 lb and 25 lb bags are common. Small tile and wide joints need much more grout per square foot than large tile.",
  ],
  workedExample:
    "100 ft² of 12 × 12 in tile, ⅜ in thick, with ⅛ in joints: " +
    "the joint volume is 1.125 in³ per ft², or 0.064 lb/ft² at 98.5 lb/ft³. " +
    "That is 6.4 lb, or 7.1 lb with 10% extra — one 10 lb bag covers the whole floor.",
  limitations: [
    "The density default matches MAPEI Ultracolor Plus FA sanded grout. Other grouts — premixed, urethane, epoxy, and unsanded — have different densities and coverage; the coverage chart on your bag is the final word.",
    "Assumes the joints are filled to the full tile thickness. In practice the grout sits slightly below the tile surface, so the estimate is a little conservative.",
    "Does not include grout sealer, spacers, or the tile adhesive (thinset) underneath — thinset is sized by trowel notch, not tile size.",
    "Small tile is grout-hungry: a 2 × 2 in mosaic needs about six times as much grout per square foot as 12 × 12 in tile at the same joint width.",
  ],
  faqs: [
    {
      question: "How much grout do I need for 100 square feet of tile?",
      answer:
        "It depends on the tile size. For 12 × 12 in tile with ⅛ in joints, about 7 lb — one 10 lb bag. For 2 × 2 in mosaic at the same joint width, about 28 lb — three 10 lb bags. Smaller tiles mean more joints per square foot, and the grout follows the joints.",
    },
    {
      question: "Sanded or unsanded grout?",
      answer:
        "Use sanded grout for joints ⅛ inch and wider — the sand keeps it from shrinking and cracking. Use unsanded grout for joints under ⅛ inch, where sand grains would not fit and would scratch polished tile. Always check the grout maker's stated joint-width range.",
    },
    {
      question: "How much grout does a 25 lb bag cover?",
      answer:
        "For 12 × 12 in tile with ⅛ in joints, about 388 sq ft. For 24 × 24 in tile, about 776 sq ft; for 2 × 2 in mosaic, only about 97.5 sq ft (MAPEI Ultracolor Plus FA coverage chart, 25 lb bag, ⅛ in joints). The bag's own coverage chart, for your tile size and joint width, is the final word.",
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
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => groutOutput(req(v, "length") * req(v, "width"), v, present),
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        {
          id: "area",
          label: "Tiled area",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "100",
          defaultMet: "9.29",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => groutOutput(req(v, "area"), v, present),
    },
  ],
};
