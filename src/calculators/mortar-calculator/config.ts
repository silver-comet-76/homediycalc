/**
 * Mortar Calculator config — mortar volume and bags for brick or block
 * walls, with a site-mix breakdown. Mortar-first: the Brick Calculator
 * counts bricks and reports mortar as a secondary output; this one
 * starts from the wall area and gives the mortar volume, bag count,
 * and the cement/lime/sand parts for site mixing.
 * See src/lib/formulas/mortar.ts and docs/FORMULAS.md §18.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import {
  calculateMortar,
  type MasonryUnit,
  type MortarType,
} from "../../lib/formulas/mortar";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

const UNIT_LABELS: Record<MasonryUnit, string> = {
  brick: "bricks",
  block: "blocks",
};

const TYPE_LABELS: Record<MortarType, string> = {
  N: "Type N (1:1:6)",
  S: "Type S (1:½:4½)",
  M: "Type M (1:¼:3¾)",
  O: "Type O (1:2:9)",
};

function mortarOutput(
  areaFt2: number,
  v: Record<string, number>,
  present: Set<string>,
) {
  const unit: MasonryUnit = req(v, "unit") === 2 ? "block" : "brick";
  const typeCode = req(v, "mortarType");
  const mortarType: MortarType =
    typeCode === 2 ? "S" : typeCode === 3 ? "M" : typeCode === 4 ? "O" : "N";
  const r = calculateMortar({
    areaFt2,
    unit,
    jointIn: req(v, "joint"),
    wastePct: req(v, "waste"),
    bagYieldFt3: req(v, "bagYield"),
    mortarType,
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
  });
  return {
    rows: [
      {
        label: `Wall area (${UNIT_LABELS[unit]})`,
        value: `${fmt(areaFt2)} ft²`,
        detail: `${r.unitsNeeded} ${UNIT_LABELS[unit]} at ${fmt(r.unitsPerFt2, 2)} per ft²`,
      },
      {
        label: "Mortar volume",
        value: `${fmt(r.mortarVolumeFt3)} ft³`,
        detail: `${fmt(req(v, "waste"), 0)}% waste included (BIA suggests 15–25%)`,
      },
      {
        label: "Pre-mixed mortar",
        value: `${r.bags} bags`,
        detail: `80 lb bags at ${fmt(req(v, "bagYield"), 2)} ft³ per bag — rounded up`,
      },
      {
        label: `Site mix — ${TYPE_LABELS[mortarType]}`,
        value: `${fmt(r.cementFt3)} ft³ cement`,
        detail: `${r.cementSacks} × 94 lb sacks; ${fmt(r.limeFt3)} ft³ lime; ${fmt(r.sandFt3)} ft³ sand`,
      },
    ],
    lines: [
      `Mortar mix, 80 lb bags: ${r.bags}`,
      `Site mix ${TYPE_LABELS[mortarType]} — cement: ${r.cementSacks} × 94 lb sacks (${fmt(r.cementFt3)} ft³), lime: ${fmt(r.limeFt3)} ft³, sand: ${fmt(r.sandFt3)} ft³`,
      `Masonry units in the wall: ${r.unitsNeeded} ${UNIT_LABELS[unit]}`,
    ],
    costUsd: r.costUsd,
    note: "Site-mix parts are shares of the mortar volume by the ASTM C270 ratio — an ordering guide, not an exact dry-volume recipe. Mix by volume, not by weight: one 94 lb sack of cement is about 1 ft³.",
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(r.unitsPerFt2, 2)} ${UNIT_LABELS[unit]}/ft² = ${r.unitsNeeded} ${UNIT_LABELS[unit]}; mortar ${fmt(r.mortarVolumeFt3)} ft³ ÷ ${fmt(req(v, "bagYield"), 2)} ft³ per bag = ${r.bags} bags.`,
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "unit",
    label: "Masonry unit",
    kind: "select" as const,
    defaultImp: "1",
    defaultMet: "1",
    options: [
      { value: "1", label: "Modular brick (7⅝ × 2¼ × 3⅝ in)" },
      { value: "2", label: "Standard block (8 × 8 × 16 in)" },
    ],
  },
  { id: "joint", label: "Mortar joint width", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", min: 0, defaultImp: "0.375", defaultMet: "0.95", hint: "⅜ in (0.375 in) is the standard joint." },
  { id: "waste", label: "Mortar waste allowance", kind: "percent" as const, defaultImp: "15", defaultMet: "15", hint: "BIA suggests 15–25% for mortar waste. Use 25% for repointing or irregular units." },
  {
    id: "bagYield",
    label: "Mortar per 80 lb bag (ft³)",
    kind: "number" as const,
    defaultImp: "0.6",
    defaultMet: "0.6",
    min: 0.1,
    hint: "About 0.6 ft³ per 80 lb bag (QUIKRETE rates one bag at up to 37 standard bricks or 13 standard blocks). Check your bag.",
  },
  {
    id: "mortarType",
    label: "Mortar type (for site mixing)",
    kind: "select" as const,
    defaultImp: "1",
    defaultMet: "1",
    options: [
      { value: "1", label: "Type N (1:1:6) — general above-grade" },
      { value: "2", label: "Type S (1:½:4½) — below grade, structural" },
      { value: "3", label: "Type M (1:¼:3¾) — heavy loads, foundations" },
      { value: "4", label: "Type O (1:2:9) — soft brick, interior" },
    ],
    hint: "ASTM C270 proportions by volume (cement : lime : sand). Type N is the default for ordinary above-grade residential brickwork.",
  },
  { id: "pricePerBag", label: "Price per 80 lb bag (optional)", kind: "price" as const, defaultImp: "", defaultMet: "", optional: true },
];

export const mortarConfig: CalculatorConfig = {
  slug: "mortar-calculator",
  diagram: "wall",
  defaultMode: "dimensions",
  formula:
    "Mortar volume is the geometric joint volume around each unit: " +
    "((length + joint) × (height + joint) − length × height) × depth, " +
    "summed over the units in the wall, then × (1 + waste%). " +
    "For a modular brick with a ⅜ in joint this gives 8.06 ft³ per 1,000 " +
    "bricks — the Brick Industry Association lists 8.1 ft³. " +
    "Bags = volume ÷ yield per bag (about 0.6 ft³ per 80 lb bag), rounded up. " +
    "Site-mix parts follow the ASTM C270 ratio by volume: Type N 1:1:6, " +
    "Type S 1:½:4½, Type M 1:¼:3¾, Type O 1:2:9 (cement : lime : sand).",
  howTo: [
    "Measure the wall: length × height in feet. Subtract large openings (doors, windows) — enter them as an area, or use the Brick Calculator's opening inputs and bring the net area here.",
    "Pick the masonry unit: modular brick (7⅝ × 2¼ × 3⅝ in) or standard 8 × 8 × 16 in concrete block. The joint volume — and therefore the mortar — is different for each.",
    "Choose the mortar type for the site-mix breakdown: Type N is the default for ordinary above-grade residential brickwork; Type S for below-grade and structural work; Type M for foundations and heavy loads; Type O for soft or historic brick.",
    "Choose the waste allowance: 15% is the BIA's low end; use 25% for repointing, irregular units, or inexperienced hands.",
  ],
  workedExample:
    "A 10 × 8 ft modular brick wall (80 ft²) with ⅜ in joints and 15% waste: " +
    "549 bricks need 5.09 ft³ of mortar — 9 bags of 80 lb pre-mixed mortar. " +
    "Mixed on site as Type N (1:1:6), that is 0.64 ft³ of cement (1 sack), " +
    "0.64 ft³ of lime, and 3.82 ft³ of sand.",
  limitations: [
    "Mortar volume is the geometric joint volume. In practice, mortar also fills the cores of hollow block and the gaps behind irregular stone — block and stone walls can need more than this estimate.",
    "Bag yields vary between manufacturers by 20% or more — the yield printed on your bag wins over the 0.6 ft³ default.",
    "Site-mix parts are shares of the mortar volume by the ASTM C270 ratio. They are an ordering guide; dry volumes do not add up exactly to the mixed volume, and sand must be measured damp and loose.",
    "This calculator estimates materials only. Mortar type and strength are structural decisions — for load-bearing walls, foundations, or historic brick, follow the specification from a qualified professional.",
  ],
  faqs: [
    {
      question: "How much mortar do I need for a brick wall?",
      answer:
        "About 5.5 cubic feet per 100 square feet of modular brick wall with ⅜ inch joints, before waste — or about 8.1 cubic feet per 1,000 bricks (Brick Industry Association Technical Note 10). With 15% waste, an 80 sq ft wall needs about 5.1 ft³, or 9 bags of 80 lb pre-mixed mortar.",
    },
    {
      question: "What is the mix ratio for Type N mortar?",
      answer:
        "1 part portland cement, 1 part hydrated lime, and 6 parts masonry sand, by volume — not by weight. Type S is 1 : ½ : 4½, Type M is 1 : ¼ : 3¾, and Type O is 1 : 2 : 9. Type N is the default for ordinary above-grade residential brickwork.",
    },
    {
      question: "How many bricks does one bag of mortar lay?",
      answer:
        "QUIKRETE rates an 80 lb bag of Mortar Mix at up to 37 standard bricks or 13 standard 8 × 8 × 16 blocks. That is a maximum — waste, joint width, and technique all reduce it, which is why this calculator works from the joint volume and a waste allowance instead.",
    },
    {
      question: "How is this different from the Brick Calculator?",
      answer:
        "The Brick Calculator counts bricks and reports mortar as a secondary output. This calculator is mortar-first: it gives the mortar volume, the bag count, and the site-mix breakdown (cement, lime, and sand) for the mortar type you choose — for brick or for block.",
    },
  ],
  modes: [
    {
      id: "dimensions",
      label: "Wall dimensions",
      fields: [
        { id: "length", label: "Wall length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "10", defaultMet: "3.05" },
        { id: "height", label: "Wall height", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "8", defaultMet: "2.44" },
        { id: "openings", label: "Openings area (optional)", kind: "area", unitKind: "area", impUnit: "ft2", metUnit: "m2", defaultImp: "", defaultMet: "", optional: true, hint: "Total area of doors and windows to subtract." },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const gross = req(v, "length") * req(v, "height");
        const openings = present.has("openings") ? req(v, "openings") : 0;
        return mortarOutput(Math.max(0, gross - openings), v, present);
      },
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        { id: "area", label: "Wall area", kind: "area", unitKind: "area", impUnit: "ft2", metUnit: "m2", defaultImp: "80", defaultMet: "7.43" },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => mortarOutput(req(v, "area"), v, present),
    },
  ],
};
