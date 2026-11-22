/**
 * Concrete Bags Calculator config — bag counts for a target volume.
 * Bag-first: the user enters a volume (or dimensions) and gets the
 * shopping list of bags for 40, 60, and 80 lb bags. The Concrete
 * Calculator is volume-first and ready-mix focused; this one answers
 * "how many bags do I buy?" See src/lib/formulas/concrete-bags.ts
 * and docs/FORMULAS.md §12.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateConcreteBags } from "../../lib/formulas/concrete-bags";
import { CONCRETE_BAG_YIELDS_FT3 } from "../../lib/formulas/concrete";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function bagsOutput(volumeFt3: number, v: Record<string, number>, present: Set<string>) {
  const r = calculateConcreteBags({
    volumeFt3,
    wastePct: req(v, "waste"),
    pricePerBag40: present.has("pricePerBag40") ? req(v, "pricePerBag40") : undefined,
    pricePerBag60: present.has("pricePerBag60") ? req(v, "pricePerBag60") : undefined,
    pricePerBag80: present.has("pricePerBag80") ? req(v, "pricePerBag80") : undefined,
  });
  const priceDetail = (priceId: string, bags: number) =>
    present.has(priceId)
      ? ` — $${fmt(req(v, priceId) * bags)} at $${fmt(req(v, priceId))} per bag`
      : "";
  return {
    rows: [
      {
        label: "Volume needed",
        value: `${fmt(r.adjustedYd3)} yd³`,
        detail: `${fmt(r.adjustedFt3)} ft³ with ${fmt(req(v, "waste"), 0)}% waste`,
      },
      {
        label: "40 lb bags",
        value: `${r.bags40} bags`,
        detail: `${CONCRETE_BAG_YIELDS_FT3[40]} ft³ per bag (QUIKRETE No. 1101)${priceDetail("pricePerBag40", r.bags40)}`,
      },
      {
        label: "60 lb bags",
        value: `${r.bags60} bags`,
        detail: `${CONCRETE_BAG_YIELDS_FT3[60]} ft³ per bag (QUIKRETE No. 1101)${priceDetail("pricePerBag60", r.bags60)}`,
      },
      {
        label: "80 lb bags",
        value: `${r.bags80} bags`,
        detail: `${CONCRETE_BAG_YIELDS_FT3[80]} ft³ per bag (QUIKRETE No. 1101)${priceDetail("pricePerBag80", r.bags80)}`,
      },
      ...(r.cheapestSize
        ? [
            {
              label: "Cheapest priced option",
              value: `${r.cheapestSize} bags`,
              detail: "From the bag prices you entered.",
            },
          ]
        : []),
    ],
    lines: [
      `Concrete mix, 40 lb bags: ${r.bags40}`,
      `Concrete mix, 60 lb bags: ${r.bags60}`,
      `Concrete mix, 80 lb bags: ${r.bags80}`,
      "Buy ONE size — the counts are alternatives, not a combined list.",
    ],
    costUsd: r.costUsd,
    note: "Pick one bag size and buy that count — the three counts are alternatives for the same volume, not a combined list.",
    workedLine: `${fmt(r.volumeYd3)} yd³ × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedFt3)} ft³ → ${r.bags80} × 80 lb bags (0.60 ft³ each), or ${r.bags60} × 60 lb, or ${r.bags40} × 40 lb.`,
  };
}

const COMMON_FIELDS = [
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent" as const,
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% is the usual default for a rectangular pour; 5% for a large simple slab, 15% for irregular excavation.",
  },
  {
    id: "pricePerBag40",
    label: "Price per 40 lb bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
  {
    id: "pricePerBag60",
    label: "Price per 60 lb bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
  {
    id: "pricePerBag80",
    label: "Price per 80 lb bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    hint: "Enter prices for the sizes you are comparing to see the cheapest option.",
  },
];

export const concreteBagsConfig: CalculatorConfig = {
  slug: "concrete-bags-calculator",
  diagram: "volume",
  defaultMode: "volume",
  formula:
    "Bags = volume × (1 + waste%) ÷ yield per bag, rounded up. " +
    "QUIKRETE Concrete Mix No. 1101 yields 0.30 ft³ per 40 lb bag, " +
    "0.45 ft³ per 60 lb bag, and 0.60 ft³ per 80 lb bag " +
    "(45 bags of 80 lb per cubic yard). Enter a price per bag size to " +
    "compare the three options — the cheapest priced size is highlighted.",
  howTo: [
    "Work out the volume you need. If you know it already (for example, 1 cubic yard from a plan), enter it directly. Otherwise use the dimensions mode: length × width × depth.",
    "Measure depth in inches — 4 in is typical for a patio or walkway, 6 in for a garage or driveway.",
    "Choose the waste allowance: 10% is the usual default; use 5% for a large, simple slab and 15% for irregular excavation.",
    "Pick one bag size and buy that count. The three counts are alternatives for the same volume — do not add them together.",
  ],
  workedExample:
    "1 cubic yard (27 ft³) with 10% waste is 29.7 ft³. That is 50 bags of 80 lb " +
    "concrete mix (0.60 ft³ each), or 66 bags of 60 lb, or 99 bags of 40 lb. " +
    "At $6, $5, and $4 per bag respectively, the 80 lb bags are cheapest at $300.",
  limitations: [
    "Bag yields are for QUIKRETE Concrete Mix No. 1101. Other brands and mixes (fast-setting, high-strength, fiber-reinforced) have different yields — check the bag.",
    "Bagged concrete is practical up to about 1–2 cubic yards. Above that, ready-mix delivered by truck is usually cheaper and much less work — see the Concrete Calculator.",
    "Does not include reinforcement (rebar or wire mesh), formwork, or finishing tools.",
  ],
  faqs: [
    {
      question: "How many 80 lb bags of concrete are in a cubic yard?",
      answer:
        "45 bags. One 80 lb bag of QUIKRETE Concrete Mix yields 0.60 cubic feet, and a cubic yard is 27 cubic feet, so 27 ÷ 0.60 = 45 bags. With the usual 10% waste allowance, plan on 50 bags per yard.",
    },
    {
      question: "Should I buy 40, 60, or 80 lb bags?",
      answer:
        "The 80 lb bag is usually the cheapest per cubic foot and means the fewest bags to carry, but each bag weighs 80 lb. The 40 lb bag costs more per cubic foot but is much easier to lift and mix one at a time. Enter the prices for each size and the calculator shows the cheapest option.",
    },
    {
      question: "How is this different from the Concrete Calculator?",
      answer:
        "The Concrete Calculator is volume-first: it works out the volume and the ready-mix order amount. This calculator is bag-first: you enter a volume (or dimensions) and it gives you the shopping list of bags for each bag size, with a price comparison.",
    },
  ],
  modes: [
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
          defaultImp: "1",
          defaultMet: "0.76",
          hint: "Enter the volume from your plan, or switch to dimensions mode to measure it.",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => bagsOutput(req(v, "volume"), v, present),
    },
    {
      id: "dimensions",
      label: "Dimensions",
      fields: [
        {
          id: "length",
          label: "Length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3",
        },
        {
          id: "width",
          label: "Width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3",
        },
        {
          id: "depth",
          label: "Depth",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "ft",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "4",
          defaultMet: "10",
          hint: "4 in is typical for a patio or walkway; 6 in for a garage or driveway.",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        bagsOutput(req(v, "length") * req(v, "width") * req(v, "depth"), v, present),
    },
  ],
};
