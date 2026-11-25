/**
 * Mulch Calculator config — volume of mulch in cubic yards and bags.
 * See src/lib/formulas/mulch.ts and docs/FORMULAS.md §5.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateMulch } from "../../lib/formulas/mulch";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const mulchConfig: CalculatorConfig = {
  slug: "mulch-calculator",
  lookupTable: {
    note: "Assumes a 5% settling allowance and 2 ft³ bags.",
    headers: ["Bed (L × W × depth)", "Volume", "Bulk yards to order", "Bags to buy"],
    rows: [
      ["10 × 10 × 2 in bed", "0.62 yd³", "1 yd³", "9 bags"],
      ["10 × 10 × 3 in bed", "0.93 yd³", "1 yd³", "14 bags"],
      ["12 × 12 × 3 in bed", "1.33 yd³", "2 yd³", "19 bags"],
      ["10 × 20 × 3 in bed", "1.85 yd³", "2 yd³", "27 bags"],
      ["20 × 20 × 3 in bed", "3.7 yd³", "4 yd³", "53 bags"],
    ],
  },
  diagram: "volume",
  defaultMode: "bed",
  formula:
    "Volume (ft³) = length × width × depth, all in feet. Volume (yd³) = volume (ft³) ÷ 27. " +
    "Bags = adjusted volume ÷ bag size, rounded up. The standard bag is 2 ft³, so one cubic yard is 13.5 bags. " +
    "Mulch is sold by volume, not weight: dry wood mulch weighs roughly 400–800 lb/yd³ depending on type and " +
    "moisture, so no density is assumed — a weight is shown only if you enter one.",
  howTo: [
    "Measure the bed's length and width in feet. For an irregular bed, break it into rectangles and add the areas.",
    "Measure the depth you want after spreading: 2–3 in is typical for weed suppression; 3–4 in for a fresh bed. Do not measure the depth of the pile.",
    "Keep mulch 2–3 in away from stems and trunks — piled against bark it holds moisture and invites rot.",
    "One cubic yard covers 108 ft² at 3 in deep, or 162 ft² at 2 in deep. A standard 2 ft³ bag covers about 8 ft² at 3 in.",
  ],
  workedExample:
    "A 10 ft × 10 ft bed, 3 in deep: 10 × 10 × 0.25 ft = 25 ft³ = 0.93 yd³. " +
    "In 2 ft³ bags that is 13 bags (25 ÷ 2, rounded up).",
  limitations: [
    "Does not account for settling beyond the waste allowance — mulch settles noticeably in the first weeks, especially shredded bark.",
    "No density is assumed, so there is no weight output unless you enter one. Bagged mulch weights vary widely with moisture: the same bag can weigh 50% more after rain.",
    "Coverage figures assume an even spread. Edges, slopes, and mounding around plants use more than the flat calculation.",
  ],
  faqs: [
    {
      question: "How many bags of mulch are in a cubic yard?",
      answer:
        "13.5 bags of 2 ft³ mulch, so 14 bags to be safe — or 9 bags of 3 ft³ mulch. One cubic yard is 27 ft³, and 27 ÷ 2 = 13.5.",
    },
    {
      question: "How deep should mulch be?",
      answer:
        "2–3 inches is the usual recommendation for weed suppression and moisture retention. Less than 2 in does little; more than 4 in can suffocate roots and hold too much water. Fresh beds start at 3 in because mulch settles.",
    },
    {
      question: "How much does a cubic yard of mulch weigh?",
      answer:
        "There is no single figure: dry wood mulch runs roughly 400–800 lb per cubic yard depending on type — pine bark near the light end, shredded hardwood near the heavy end — and wet mulch can weigh over 1,000 lb. That is why the calculator sells mulch by volume and only shows a weight if you enter a density.",
    },
  ],
  modes: [
    {
      id: "bed",
      label: "Bed area and depth",
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
          hint: "Depth after spreading, not in the pile. 2–3 in is typical.",
        },
        {
          id: "waste",
          label: "Settling allowance",
          kind: "percent",
          defaultImp: "5",
          defaultMet: "5",
          hint: "Mulch settles after spreading; 5% is a reasonable allowance.",
        },
        {
          id: "bagSize",
          label: "Bag size (ft³)",
          kind: "volume",
          unitKind: "volume",
          impUnit: "ft3",
          metUnit: "m3",
          defaultImp: "2",
          defaultMet: "0.057",
          hint: "Most bags are 2 ft³. Some are 1.5 or 3 ft³ — read the bag.",
        },
        {
          id: "density",
          label: "Density in lb/yd³ (optional)",
          kind: "number",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          min: 100,
          max: 3000,
          hint: "Only if you need a weight: dry wood mulch is roughly 400–800 lb/yd³. Leave empty for no weight output.",
        },
        {
          id: "pricePerYd3",
          label: "Price per cubic yard (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerBag",
          label: "Price per bag (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Used only when no per-yard price is entered.",
        },
      ],
      compute: (v, present) => {
        const r = calculateMulch({
          lengthFt: req(v, "length"),
          widthFt: req(v, "width"),
          depthFt: req(v, "depth"),
          wastePct: req(v, "waste"),
          bagSizeFt3: req(v, "bagSize"),
          densityLbPerYd3: present.has("density") ? req(v, "density") : undefined,
          pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
          pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
        });
        return {
          rows: [
            {
              label: "Volume",
              value: `${fmt(r.volumeYd3)} yd³`,
              detail: `${fmt(r.volumeFt3)} ft³`,
            },
            {
              label: "Bulk yards to order",
              value: `${r.orderYd3} yd³`,
              detail: `${fmt(r.adjustedYd3)} yd³ with ${fmt(req(v, "waste"), 0)}% settling allowance — rounded up`,
            },
            {
              label: "Bags to buy",
              value: `${r.bags} bags`,
              detail: `${fmt(req(v, "bagSize"))} ft³ per bag`,
            },
            ...(r.weightLb !== undefined
              ? [
                  {
                    label: "Weight",
                    value: `${fmt(r.weightTons ?? 0)} tons`,
                    detail: `${fmt(r.weightLb)} lb at ${fmt(req(v, "density"), 0)} lb/yd³`,
                  },
                ]
              : []),
          ],
          lines: [
            `Mulch (bulk): ${r.orderYd3} yd³`,
            `Mulch bags (${fmt(req(v, "bagSize"))} ft³): ${r.bags}`,
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(req(v, "length"))} × ${fmt(req(v, "width"))} × ${fmt(req(v, "depth"), 3)} ft = ${fmt(r.volumeFt3)} ft³ = ${fmt(r.volumeYd3)} yd³; ${fmt(r.adjustedFt3)} ft³ with waste ÷ ${fmt(req(v, "bagSize"))} ft³ per bag = ${r.bags} bags.`,
        };
      },
    },
  ],
};
