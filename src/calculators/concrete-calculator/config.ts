/**
 * Concrete Calculator config — general concrete volume for any pour.
 * See src/lib/formulas/concrete.ts and docs/FORMULAS.md §1.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateConcrete, CONCRETE_BAG_YIELDS_FT3 } from "../../lib/formulas/concrete";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const concreteConfig: CalculatorConfig = {
  slug: "concrete-calculator",
  diagram: "volume",
  defaultMode: "pour",
  formula:
    "Volume (ft³) = length × width × depth, all in feet. Volume (yd³) = volume (ft³) ÷ 27. " +
    "Add your waste allowance, then round the ready-mix order up to the next quarter cubic yard " +
    "(or whole yard). Bags = adjusted volume ÷ yield per bag, rounded up: an 80 lb bag yields " +
    "0.60 ft³, a 60 lb bag 0.45 ft³, a 40 lb bag 0.30 ft³ (QUIKRETE Concrete Mix No. 1101).",
  howTo: [
    "Measure the length and width of the pour in feet, inside the forms.",
    "Measure the depth in inches and convert to feet by dividing by 12 (4 in = ⅓ ft, 6 in = 0.5 ft). Measure in several spots — the shallowest spot is not the average.",
    "Check the subgrade is level and compacted; dips and over-excavation are what the waste allowance covers.",
    "Order ready-mix by the cubic yard, rounded up to your supplier's increment (usually a quarter yard). For small jobs, compare the bag count — bags are mixed by hand and cost more per yard.",
  ],
  workedExample:
    "A 10 ft × 10 ft pad, 4 in deep: 10 × 10 × ⅓ ft = 33.33 ft³ = 1.23 yd³. " +
    "With 10% waste that is 1.36 yd³, so order 1.5 yd³ of ready-mix — or 62 bags of 80 lb mix (36.67 ft³ ÷ 0.60 ft³ per bag).",
  limitations: [
    "Assumes a level, rectangular pour of uniform depth. It does not account for slope, uneven subgrade, or spillage beyond the waste allowance.",
    "Bag yields are the QUIKRETE figures for its Concrete Mix; other brands print their own yield on the bag — check it and edit the yield if yours differs.",
    "This is a quantity estimate, not a mix design. Strength, slump, and air entrainment are choices for your supplier and your local code.",
  ],
  faqs: [
    {
      question: "How much concrete do I need for a 10 × 10 slab?",
      answer:
        "At 4 inches thick, a 10 ft × 10 ft slab is 33.33 ft³, or 1.23 yd³. With the usual 10% waste allowance that is 1.36 yd³, so order 1.5 yd³ of ready-mix (quarter-yard rounding) or 62 bags of 80 lb mix.",
    },
    {
      question: "How many 80 lb bags of concrete are in a cubic yard?",
      answer:
        "45 bags. One cubic yard is 27 ft³ and an 80 lb bag of QUIKRETE Concrete Mix yields 0.60 ft³, so 27 ÷ 0.60 = 45. With 10% waste, allow 50 bags per yard.",
    },
    {
      question: "Should I order ready-mix or bags?",
      answer:
        "Ready-mix is usually cheaper and far faster once the job is over about 1 cubic yard (45 bags of 80 lb mix). Bags suit small pads, repairs, and places a truck cannot reach — but mixing 45 bags by hand is a full day's work.",
    },
    {
      question: "Why round up to a quarter yard?",
      answer:
        "Most ready-mix suppliers price and deliver in quarter-yard increments, and running short mid-pour means a second truck, a cold joint, and a short-load fee. Rounding up a quarter yard is cheap insurance; ask your supplier what increment they sell in.",
    },
  ],
  modes: [
    {
      id: "pour",
      label: "Rectangular pour",
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
          max: 10000,
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
          max: 10000,
        },
        {
          id: "depth",
          label: "Depth",
          kind: "length",
          unitKind: "length",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "4",
          defaultMet: "10",
          max: 120,
          hint: "Thickness of the pour. 4 in is typical for a patio or walkway; 6 in for a garage or driveway.",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
          hint: "10% is the usual default for a rectangular pour on reasonably level ground. Use 5% for a large, simple slab and 15% for irregular excavation.",
        },
        {
          id: "quarterYard",
          label: "Ready-mix order increment",
          kind: "select",
          defaultImp: "1",
          defaultMet: "1",
          options: [
            { value: "1", label: "Quarter yard (0.25 yd³) — most suppliers" },
            { value: "0", label: "Whole yard (1 yd³)" },
          ],
          hint: "Most ready-mix suppliers sell in quarter-yard increments. Confirm yours before ordering.",
        },
        {
          id: "pricePerYd3",
          label: "Price per cubic yard (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Enter your supplier's price per yd³ to see an estimated cost. No price entered means no cost is shown.",
        },
        {
          id: "pricePerBag80",
          label: "Price per 80 lb bag (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Used only when no per-yard price is entered.",
        },
      ],
      compute: (v, present) => {
        const r = calculateConcrete({
          lengthFt: req(v, "length"),
          widthFt: req(v, "width"),
          depthFt: req(v, "depth"),
          wastePct: req(v, "waste"),
          quarterYardRounding: req(v, "quarterYard") === 1,
          pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
          pricePerBag80: present.has("pricePerBag80") ? req(v, "pricePerBag80") : undefined,
        });
        const quarter = req(v, "quarterYard") === 1;
        return {
          rows: [
            {
              label: "Volume",
              value: `${fmt(r.volumeYd3)} yd³`,
              detail: `${fmt(r.volumeFt3)} ft³`,
            },
            {
              label: `With ${fmt(req(v, "waste"), 0)}% waste`,
              value: `${fmt(r.adjustedYd3)} yd³`,
              detail: `${fmt(r.adjustedFt3)} ft³`,
            },
            {
              label: "Ready-mix to order",
              value: `${fmt(r.orderYd3)} yd³`,
              detail: quarter ? "Rounded up to the next 0.25 yd³" : "Rounded up to whole yards",
            },
            {
              label: "80 lb bags",
              value: `${r.bags80} bags`,
              detail: `${CONCRETE_BAG_YIELDS_FT3[80]} ft³ per bag (QUIKRETE No. 1101)`,
            },
            {
              label: "60 lb bags",
              value: `${r.bags60} bags`,
              detail: `${CONCRETE_BAG_YIELDS_FT3[60]} ft³ per bag`,
            },
            {
              label: "40 lb bags",
              value: `${r.bags40} bags`,
              detail: `${CONCRETE_BAG_YIELDS_FT3[40]} ft³ per bag`,
            },
          ],
          lines: [
            `Ready-mix concrete: ${fmt(r.orderYd3)} yd³`,
            `80 lb bags of concrete mix: ${r.bags80} (or ${r.bags60} × 60 lb, or ${r.bags40} × 40 lb)`,
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(req(v, "length"))} × ${fmt(req(v, "width"))} × ${fmt(req(v, "depth"), 3)} ft = ${fmt(r.volumeFt3)} ft³ = ${fmt(r.volumeYd3)} yd³; with ${fmt(req(v, "waste"), 0)}% waste = ${fmt(r.adjustedYd3)} yd³ → order ${fmt(r.orderYd3)} yd³.`,
        };
      },
    },
  ],
};
