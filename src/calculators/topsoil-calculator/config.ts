/**
 * Topsoil Calculator config — volume and weight of topsoil for a lawn
 * or bed, plus bag counts. Like the Gravel Calculator in shape, but
 * topsoil has no single confirmed density, so the density field is
 * prominent and the range is stated on the page.
 * See src/lib/formulas/topsoil.ts and docs/FORMULAS.md §15.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateTopsoil } from "../../lib/formulas/topsoil";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function topsoilOutput(
  volumeFt3: number,
  v: Record<string, number>,
  present: Set<string>,
) {
  const r = calculateTopsoil({
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
        label: "Topsoil volume",
        value: `${fmt(r.adjustedYd3)} yd³`,
        detail: `${fmt(r.adjustedFt3)} ft³ (${fmt(r.adjustedM3)} m³) with ${fmt(req(v, "waste"), 0)}% settling allowance`,
      },
      {
        label: "Weight",
        value: `${fmt(r.weightTons)} tons`,
        detail: `${fmt(r.weightLb, 0)} lb (${fmt(r.weightKg, 0)} kg) at ${fmt(req(v, "density"), 0)} lb/yd³`,
      },
      {
        label: "Bags",
        value: `${r.bags} bags`,
        detail: `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up`,
      },
    ],
    lines: [
      `Topsoil (bulk): ${fmt(r.adjustedYd3)} yd³ (about ${fmt(r.weightTons)} tons)`,
      `Topsoil bags (${fmt(req(v, "bagSize"), 2)} ft³ each): ${r.bags}`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(volumeFt3)} ft³ × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedFt3)} ft³ = ${fmt(r.adjustedYd3)} yd³; weight ${fmt(r.adjustedYd3)} × ${fmt(req(v, "density"), 0)} lb/yd³ = ${fmt(r.weightLb, 0)} lb.`,
  };
}

const COMMON_FIELDS = [
  { id: "waste", label: "Settling allowance", kind: "percent" as const, defaultImp: "10", defaultMet: "10", hint: "10% covers settling and uneven ground. Use 5% for a level, well-prepared bed." },
  {
    id: "density",
    label: "Topsoil density (lb per yd³)",
    kind: "number" as const,
    defaultImp: "2000",
    defaultMet: "2000",
    min: 1,
    hint: "No single figure is confirmed: loose, dry screened topsoil is about 2,000 lb/yd³; wet or compacted soil runs 2,400–3,400 lb/yd³. Ask your supplier for the load-ticket figure.",
  },
  { id: "bagSize", label: "Bag size (ft³)", kind: "number" as const, defaultImp: "0.75", defaultMet: "0.75", min: 0.1, hint: "0.75 ft³ is common (Scotts Premium Topsoil); bag sizes vary from about 0.5 to 2 ft³. Read your bag." },
  { id: "pricePerYd3", label: "Price per cubic yard (optional)", kind: "price" as const, defaultImp: "", defaultMet: "", optional: true },
  { id: "pricePerBag", label: "Price per bag (optional)", kind: "price" as const, defaultImp: "", defaultMet: "", optional: true },
];

export const topsoilConfig: CalculatorConfig = {
  slug: "topsoil-calculator",
  diagram: "volume",
  defaultMode: "area",
  formula:
    "Volume = length × width × depth; cubic yards = cubic feet ÷ 27. " +
    "Weight = volume × bulk density. There is no single confirmed weight " +
    "for a cubic yard of topsoil — about 2,000 lb/yd³ for loose, dry " +
    "screened topsoil, 2,400–3,400 lb/yd³ when wet or compacted — so the " +
    "density defaults to 2,000 lb/yd³ and is editable. Bags = volume ÷ " +
    "bag size, rounded up (0.75 ft³ is the common bag).",
  howTo: [
    "Measure the lawn or bed area in feet — length × width for a rectangle, or split an irregular bed into rectangles and add them.",
    "Decide the depth: 2–3 in to top-dress an existing lawn, 4–6 in for a new lawn or garden bed, 8–12 in for a raised bed. Measure depth in inches.",
    "Check the density: loose, dry screened topsoil is about 2,000 lb per cubic yard, but wet soil from a rainy stockpile can weigh 2,400 lb or more. If your supplier gives a load-ticket figure, enter it.",
    "For small jobs, compare the bulk price per yard with the bag price — bags are usually far more expensive per cubic yard.",
  ],
  workedExample:
    "A 10 × 10 ft bed, 6 in deep: 10 × 10 × 0.5 = 50 ft³ = 1.85 yd³. " +
    "With a 10% settling allowance that is 55 ft³ = 2.04 yd³. " +
    "At 2,000 lb/yd³ that weighs 4,074 lb (2.04 tons), or 74 bags of 0.75 ft³.",
  limitations: [
    "Weight is an estimate: the same cubic yard can weigh anywhere from about 2,000 to 3,400 lb depending on texture, organic content, and moisture. The volume is exact; the weight is only as good as the density you enter.",
    "Does not account for compaction after spreading or for soil removed by grading — the settling allowance only approximates it.",
    "Topsoil quality varies by supplier. Screened topsoil, garden soil (topsoil mixed with compost), and fill dirt are different products with different densities and prices.",
  ],
  faqs: [
    {
      question: "How much does a cubic yard of topsoil weigh?",
      answer:
        "About 2,000 lb (1 ton) for loose, dry screened topsoil. Wet or compacted topsoil runs 2,400–3,400 lb per cubic yard, so the same order can weigh much more after rain. There is no single official figure — the calculator defaults to 2,000 lb/yd³ and lets you enter your supplier's figure.",
    },
    {
      question: "How many cubic yards of topsoil do I need for a lawn?",
      answer:
        "Multiply the lawn area by the depth. A 1,000 sq ft lawn top-dressed 2 inches deep needs 1,000 × 2/12 ÷ 27 = 6.2 cubic yards; at 6 inches deep for a new lawn it is 18.5 cubic yards. Add 10% for settling.",
    },
    {
      question: "Is it cheaper to buy topsoil in bulk or in bags?",
      answer:
        "Bulk is almost always cheaper per cubic yard — a 0.75 ft³ bag at $4 is about $144 per cubic yard, while bulk screened topsoil is often $30–60 per yard delivered. Bags make sense only for small jobs where delivery fees would dominate.",
    },
  ],
  modes: [
    {
      id: "area",
      label: "Area and depth",
      fields: [
        { id: "length", label: "Length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "10", defaultMet: "3.05" },
        { id: "width", label: "Width", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "10", defaultMet: "3.05" },
        { id: "depth", label: "Depth", kind: "length", unitKind: "length", canonicalUnit: "ft", impUnit: "in", metUnit: "cm", defaultImp: "6", defaultMet: "15", hint: "2–3 in to top-dress a lawn, 4–6 in for a new lawn or bed, 8–12 in for a raised bed." },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        topsoilOutput(req(v, "length") * req(v, "width") * req(v, "depth"), v, present),
    },
    {
      id: "volume",
      label: "Known volume",
      fields: [
        { id: "volume", label: "Volume", kind: "volume", unitKind: "volume", canonicalUnit: "ft3", impUnit: "yd3", metUnit: "m3", defaultImp: "2", defaultMet: "1.53", hint: "Enter the volume from your plan, or switch to area and depth to measure it." },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => topsoilOutput(req(v, "volume"), v, present),
    },
  ],
};
