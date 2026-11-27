/**
 * Sand Calculator config — volume and weight of sand for a sandbox, pool
 * base, patio base, or fill, plus bag counts and a reverse mode (area
 * covered by sand you already have). Like the Topsoil Calculator in
 * shape, but with sand-type densities instead of a single soil density.
 * See src/lib/formulas/sand.ts and docs/FORMULAS.md §27.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateSand, calculateSandCoverage } from "../../lib/formulas/sand";
import { cubicFeetToCubicYards } from "../../lib/units";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function sandOutput(volumeFt3: number, v: Record<string, number>, present: Set<string>) {
  const r = calculateSand({
    volumeFt3,
    wastePct: req(v, "waste"),
    densityLbYd3: req(v, "density"),
    bagSizeFt3: req(v, "bagSize"),
    pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
  });
  return {
    rows: [
      {
        label: "Sand volume",
        value: `${fmt(r.adjustedYd3)} yd³`,
        detail: `${fmt(r.adjustedFt3)} ft³ (${fmt(r.adjustedM3)} m³) with ${fmt(req(v, "waste"), 0)}% waste`,
      },
      {
        label: "Bulk to order",
        value: `${r.orderYd3} yd³`,
        detail: "Rounded up to whole yards",
      },
      {
        label: "Weight",
        value: `${fmt(r.weightTons)} tons`,
        detail: `${fmt(r.weightLb, 0)} lb (${fmt(r.weightKg, 0)} kg) at ${fmt(req(v, "density"), 0)} lb/yd³`,
      },
      {
        label: "Bags",
        value: `${r.bags} ${r.bags === 1 ? "bag" : "bags"}`,
        detail: `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up`,
      },
    ],
    lines: [
      `Sand (bulk): ${r.orderYd3} yd³ (about ${fmt(r.weightTons)} tons)`,
      `Sand bags (${fmt(req(v, "bagSize"), 2)} ft³ each): ${r.bags}`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(volumeFt3)} ft³ × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedFt3)} ft³ = ${fmt(r.adjustedYd3)} yd³; weight ${fmt(r.adjustedYd3)} × ${fmt(req(v, "density"), 0)} lb/yd³ = ${fmt(r.weightLb, 0)} lb.`,
  };
}

function sandReverseOutput(v: Record<string, number>) {
  const amountYd3 = cubicFeetToCubicYards(req(v, "amount"));
  const r = calculateSandCoverage({
    amountYd3,
    depthFt: req(v, "depth"),
    densityLbYd3: req(v, "density"),
  });
  return {
    rows: [
      {
        label: "Area covered",
        value: `${fmt(r.areaFt2, 0)} ft²`,
        detail: `${fmt(r.areaM2)} m²`,
      },
      {
        label: "Sand volume",
        value: `${fmt(amountYd3)} yd³`,
        detail: `${fmt(r.volumeFt3)} ft³`,
      },
      {
        label: "Weight",
        value: `${fmt(r.weightTons)} tons`,
        detail: `${fmt(r.weightLb, 0)} lb (${fmt(r.weightKg, 0)} kg) at ${fmt(req(v, "density"), 0)} lb/yd³`,
      },
    ],
    lines: [`Sand on hand: ${fmt(amountYd3)} yd³ covers ${fmt(r.areaFt2, 0)} ft²`],
    workedLine: `${fmt(amountYd3)} yd³ = ${fmt(r.volumeFt3)} ft³ ÷ ${fmt(req(v, "depth"))} ft = ${fmt(r.areaFt2, 0)} ft².`,
  };
}

const COMMON_FIELDS = [
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent" as const,
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% covers spillage, uneven ground, and compaction. Use 5% for a level, well-prepared area.",
  },
  {
    id: "density",
    label: "Sand density (lb per yd³)",
    kind: "number" as const,
    defaultImp: "2700",
    defaultMet: "2700",
    min: 1,
    hint: "Play sand 2,700; mason sand 2,800; concrete sand 3,000; fill sand 2,600 lb/yd³. Wet sand runs about 10–15% heavier. Ask your supplier for the load-ticket figure.",
  },
  {
    id: "bagSize",
    label: "Bag size (ft³)",
    kind: "number" as const,
    defaultImp: "0.5",
    defaultMet: "0.5",
    min: 0.1,
    hint: "A 50 lb bag is about 0.5 ft³. Read your bag — bag sizes vary.",
  },
  {
    id: "pricePerYd3",
    label: "Price per cubic yard (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
  {
    id: "pricePerBag",
    label: "Price per bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

const DEPTH_FIELD = {
  id: "depth",
  label: "Depth",
  kind: "length" as const,
  unitKind: "length" as const,
  canonicalUnit: "ft",
  impUnit: "in",
  metUnit: "cm",
  defaultImp: "4",
  defaultMet: "10",
  hint: "4 in for a pool base, 6 in for a sandbox, 2 in for levelling or fill. Paver bedding sand is exactly 1 in — see the Paver Calculator.",
};

export const sandConfig: CalculatorConfig = {
  slug: "sand-calculator",
  designCplus: true,
  heroResultLabel: "Bulk to order",
  lookupTable: {
    note: "Assumes 10% waste, play sand at 2,700 lb per cubic yard, and 0.5 ft³ bags.",
    headers: ["Area (L × W × depth)", "Sand volume", "Bulk to order", "Weight", "Bags"],
    rows: [
      ["10 × 10 × 4 in sandbox", "1.36 yd³", "2 yd³", "1.83 tons", "74 bags"],
      ["10 × 10 × 6 in sandbox", "2.04 yd³", "3 yd³", "2.75 tons", "110 bags"],
      ["10 × 20 × 4 in patio base", "2.72 yd³", "3 yd³", "3.67 tons", "147 bags"],
      ["12 × 12 × 4 in pool base", "1.96 yd³", "2 yd³", "2.64 tons", "106 bags"],
      ["20 × 10 × 6 in fill", "4.07 yd³", "5 yd³", "5.5 tons", "220 bags"],
    ],
  },
  diagram: "volume",
  defaultMode: "area",
  formula:
    "Volume = length × width × depth; cubic yards = cubic feet ÷ 27. " +
    "Weight = volume × bulk density — play sand about 2,700 lb/yd³ (1.35 tons/yd³), " +
    "mason sand 2,800, concrete sand 3,000, fill sand 2,600 lb/yd³. Dry sand is " +
    "about 100 lb/ft³ (1,600 kg/m³), and wet sand runs about 10–15% heavier. " +
    "Bags = volume ÷ bag size, rounded up (a 50 lb bag is about 0.5 ft³; " +
    "54 × 50 lb bags fill a cubic yard). Bulk is ordered by the whole cubic " +
    "yard, rounded up. Cost uses the bulk price when entered (bulk wins when " +
    "both a bulk and a bag price are entered — a buyer buys bulk or bags, never " +
    "both); otherwise the bag price. From sand you have: area covered = volume ÷ depth.",
  howTo: [
    "Measure the area in feet — length × width for a rectangle, or split an irregular area into rectangles and add them.",
    "Choose the depth for the job: 6 in for a sandbox, 4 in for an above-ground pool base, 2 in for levelling or fill. Paver bedding sand is exactly 1 in.",
    "Check the density: play sand is about 2,700 lb per cubic yard, mason sand 2,800, concrete sand 3,000, fill sand 2,600. If your supplier gives a load-ticket figure, enter it.",
    "For small jobs, compare the bulk price per yard with the bag price — bags are usually far more expensive per cubic yard. Under about a cubic yard, bags can beat bulk once the delivery fee is counted.",
  ],
  workedExample:
    "A 10 × 10 ft sandbox, 6 in deep: 10 × 10 × 0.5 = 50 ft³ = 1.85 yd³. " +
    "With a 10% waste allowance that is 55 ft³ = 2.04 yd³. " +
    "At 2,700 lb/yd³ (play sand) the unrounded 2.037 yd³ weighs 5,500 lb (2.75 tons), or 110 bags of 0.5 ft³ — bulk to order: 3 yd³.",
  limitations: [
    "Weight is an estimate: the same cubic yard can weigh about 10–15% more when wet, and sand varies by source and gradation. The volume is exact; the weight is only as good as the density you enter.",
    "Does not account for compaction after spreading beyond the waste allowance — compacted sand settles, so a freshly spread layer measures deeper than it will after use.",
    "This calculator counts material only. It does not design structural fill, drainage, or a concrete mix — sand for those jobs follows an engineer's specification, not a volume estimate.",
    [
      { text: "For a patio, the bedding sand is exactly 1 in deep — the " },
      { text: "Paver Calculator", calc: "paver-calculator" },
      {
        text: " already works it out for your patio, including the gravel base and joint sand. This calculator is for sandboxes, pool bases, and fill, where the depth varies.",
      },
    ],
  ],
  faqs: [
    {
      question: "How much does a cubic yard of sand weigh?",
      answer:
        "About 2,700 lb (1.35 tons) for play sand. Mason sand is about 2,800 lb/yd³, concrete sand about 3,000, fill sand about 2,600. Wet sand runs about 10–15% heavier, so the same yard can weigh much more after rain. There is no single official figure — the calculator defaults to 2,700 lb/yd³ (play sand) and lets you enter your supplier's figure.",
    },
    {
      question: "How many 50 lb bags of sand are in a cubic yard?",
      answer:
        "54 bags. A 50 lb bag is about 0.5 ft³, and a cubic yard is 27 ft³, so 27 ÷ 0.5 = 54 bags — before any waste allowance. With the default 10% allowance, a cubic yard of sand on the ground takes about 60 bags.",
    },
    {
      question: "How deep should play sand be in a sandbox?",
      answer:
        "6 in is the usual depth for a sandbox. Under play equipment the US Consumer Product Safety Commission recommends 9–12 in of loose fill. This calculator does not design play-surface safety — check the CPSC guidance for your equipment and surface.",
    },
    {
      question: "What is the difference between play sand, mason sand, and concrete sand?",
      answer:
        "Play sand is washed and screened for sandboxes; mason sand is fine and uniform for mortar and paver joints; concrete sand is coarser and angular for concrete mixes. They weigh differently per cubic yard — play 1.35, mason 1.40, concrete 1.50 tons/yd³ — so pick the type and the calculator uses its density.",
    },
    {
      question: "Is it cheaper to buy sand in bulk or in bags?",
      answer:
        "Bulk is almost always cheaper per cubic yard. For example, a 0.5 ft³ bag at $5 works out to about $270 per cubic yard, while bulk sand is often $30–60 per yard delivered. Bags make sense only for small jobs where delivery fees would dominate — under about a cubic yard, bags can beat bulk once the delivery fee is counted.",
    },
    {
      question: "How much sand goes under pavers?",
      answer:
        "Bedding sand under pavers is exactly 1 in deep. The Paver Calculator already computes it for your patio, together with the gravel base and joint sand — this calculator is for sandboxes, pool bases, and fill, where the depth varies.",
    },
  ],
  modes: [
    {
      id: "area",
      label: "Area and depth",
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
        DEPTH_FIELD,
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        sandOutput(req(v, "length") * req(v, "width") * req(v, "depth"), v, present),
    },
    {
      id: "volume",
      label: "Known volume",
      fields: [
        {
          id: "volume",
          label: "Volume",
          kind: "volume",
          unitKind: "volume",
          canonicalUnit: "ft3",
          impUnit: "yd3",
          metUnit: "m3",
          defaultImp: "2",
          defaultMet: "1.53",
          hint: "Enter the volume from your plan, or switch to area and depth to measure it.",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => sandOutput(req(v, "volume"), v, present),
    },
    {
      id: "reverse",
      label: "From sand you have",
      fields: [
        {
          id: "amount",
          label: "Sand you have",
          kind: "volume",
          unitKind: "volume",
          canonicalUnit: "ft3",
          impUnit: "yd3",
          metUnit: "m3",
          defaultImp: "1",
          defaultMet: "0.76",
          hint: "How much sand you already have — a pile, a delivery, or leftover bags added up.",
        },
        DEPTH_FIELD,
        {
          id: "density",
          label: "Sand density (lb per yd³)",
          kind: "number",
          defaultImp: "2700",
          defaultMet: "2700",
          min: 1,
          hint: "Play sand 2,700; mason sand 2,800; concrete sand 3,000; fill sand 2,600 lb/yd³.",
        },
      ],
      compute: (v) => sandReverseOutput(v),
    },
  ],
};
