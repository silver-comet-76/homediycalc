/**
 * Gravel Calculator config — volume and weight of gravel.
 * See src/lib/formulas/gravel.ts and docs/FORMULAS.md §4.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateGravel } from "../../lib/formulas/gravel";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const gravelConfig: CalculatorConfig = {
  slug: "gravel-calculator",
  designCplus: true,
  heroResultLabel: "Cubic yards to order",
  lookupTable: {
    note: "Assumes a 5% compaction allowance and gravel at 2,800 lb per cubic yard.",
    headers: ["Area (L × W × depth)", "Volume", "Cubic yards to order", "Weight"],
    rows: [
      ["10 × 10 × 2 in bed", "0.62 yd³", "1 yd³", "0.91 tons"],
      ["10 × 10 × 3 in bed", "0.93 yd³", "1 yd³", "1.36 tons"],
      ["10 × 20 × 3 in bed", "1.85 yd³", "2 yd³", "2.72 tons"],
      ["20 × 20 × 3 in bed", "3.7 yd³", "4 yd³", "5.44 tons"],
      ["12 × 12 × 4 in bed", "1.78 yd³", "2 yd³", "2.61 tons"],
    ],
  },
  diagram: "volume",
  defaultMode: "area",
  formula:
    "Volume (ft³) = length × width × depth, all in feet. Volume (yd³) = volume (ft³) ÷ 27. " +
    "Weight = volume × density. Default density 2,800 lb/yd³ (1.4 US tons/yd³) is the usual loose, dry figure " +
    "for general gravel and #57 crushed stone; published figures run roughly 2,400–3,000 lb/yd³ by stone type " +
    "and moisture. The density field is editable — use your supplier's figure when tonnage has to be exact.",
  howTo: [
    "Measure the length and width of the area in feet, and the depth in inches (divide by 12 for feet). A walkway is usually 2–3 in deep; a driveway base 4–6 in.",
    "For a driveway, measure the full area including where cars turn — gravel spreads thinner at the edges.",
    "Order by the cubic yard for large jobs and by the bag for small ones. A cubic yard covers about 108 ft² at 3 in deep.",
    "If your supplier sells by the ton, use the weight output to compare quotes — but confirm their density first, because the same yard can weigh 2,400 or 3,000 lb.",
  ],
  workedExample:
    "A 10 ft × 10 ft area, 3 in deep: 10 × 10 × 0.25 ft = 25 ft³ = 0.93 yd³. " +
    "At 2,800 lb/yd³, with the 5% compaction allowance the calculator applies by default, the adjusted 0.97 yd³ weighs about 2,722 lb, about 1.36 US short tons (2,593 lb, about 1.30 US short tons, before the allowance).",
  limitations: [
    "Density varies by stone type, size, and moisture — wet gravel can weigh 10–15% more than dry. Treat the weight as an estimate for ordering and hauling.",
    "The waste allowance only approximates compaction and settling. Crushed stone compacts to roughly 85% of its loose volume once driven on.",
    "Check your vehicle's payload before hauling: a cubic yard of gravel is about 1.4 tons, and most half-ton pickups are rated near 1,500 lb.",
  ],
  faqs: [
    {
      question: "How much does a cubic yard of gravel weigh?",
      answer:
        "About 2,800 lb (1.4 US tons) for general gravel and #57 crushed stone, dry and loose. Pea gravel is a little lighter at about 2,700 lb, crusher run heavier at about 3,000 lb, and wet material heavier still. The calculator defaults to 2,800 lb/yd³ and lets you change it.",
    },
    {
      question: "How many cubic yards of gravel do I need for a driveway?",
      answer:
        "Measure length × width × depth. A 20 ft × 10 ft driveway at 4 in deep is 66.67 ft³, or 2.47 yd³ — order 3 yd³ with the usual 5% compaction allowance. At 6 in deep the same driveway needs 3.70 yd³.",
    },
    {
      question: "Is gravel sold by the yard or by the ton?",
      answer:
        "Both, depending on the supplier — which is why this calculator shows both. A yard and a ton are not the same: at 2,800 lb/yd³, one ton is about 0.71 yd³. Always convert before comparing two quotes.",
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
        {
          id: "depth",
          label: "Depth",
          kind: "length",
          unitKind: "length",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "3",
          defaultMet: "7.6",
          hint: "Depth after spreading and compacting, not the height of the loose pile.",
        },
        {
          id: "waste",
          label: "Compaction allowance",
          kind: "percent",
          defaultImp: "5",
          defaultMet: "5",
          hint: "Covers settling and compaction. Use 5% for a path, 10% for a driveway base.",
        },
        {
          id: "density",
          label: "Density (lb per yd³)",
          kind: "number",
          defaultImp: "2800",
          defaultMet: "2800",
          min: 500,
          max: 5000,
          hint: "Typical: general gravel 2,800; pea gravel 2,700; crusher run 3,000 lb/yd³. Ask your supplier for their figure.",
        },
        {
          id: "bagWeight",
          label: "Bag weight in lb (optional)",
          kind: "number",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Enter a bag weight (e.g. 50 lb) to also see a bag count.",
        },
        {
          id: "pricePerYd3",
          label: "Price per cubic yard (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
      ],
      compute: (v, present) => {
        const r = calculateGravel({
          lengthFt: req(v, "length"),
          widthFt: req(v, "width"),
          depthFt: req(v, "depth"),
          wastePct: req(v, "waste"),
          densityLbPerYd3: req(v, "density"),
          bagWeightLb: present.has("bagWeight") ? req(v, "bagWeight") : undefined,
          pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
        });
        return {
          rows: [
            {
              label: "Volume",
              value: `${fmt(r.volumeYd3)} yd³`,
              detail: `${fmt(r.volumeFt3)} ft³`,
            },
            {
              label: "Cubic yards to order",
              value: `${r.orderYd3} yd³`,
              detail: `${fmt(r.adjustedYd3)} yd³ with ${fmt(req(v, "waste"), 0)}% compaction allowance — rounded up`,
            },
            {
              label: "Weight",
              value: `${fmt(r.weightTons)} tons`,
              detail: `${fmt(r.weightLb)} lb (${fmt(r.weightKg)} kg) at ${fmt(req(v, "density"), 0)} lb/yd³`,
            },
            ...(r.bags !== undefined
              ? [
                  {
                    label: "Bags",
                    value: `${r.bags} bags`,
                    detail: `At ${fmt(req(v, "bagWeight"), 0)} lb per bag`,
                  },
                ]
              : []),
          ],
          lines: [
            `Gravel: ${r.orderYd3} yd³ (${fmt(r.weightTons)} tons)`,
            ...(r.bags !== undefined
              ? [`Gravel bags (${fmt(req(v, "bagWeight"), 0)} lb): ${r.bags}`]
              : []),
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(req(v, "length"))} × ${fmt(req(v, "width"))} × ${fmt(req(v, "depth"), 3)} ft = ${fmt(r.volumeFt3)} ft³ = ${fmt(r.volumeYd3)} yd³; at ${fmt(req(v, "density"), 0)} lb/yd³ = ${fmt(r.weightLb)} lb.`,
        };
      },
    },
  ],
};
