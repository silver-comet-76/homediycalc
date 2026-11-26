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
  designCplus: true,
  heroResultLabel: "Ready-mix to order",
  lookupTable: {
    note: "Assumes 10% waste and ready-mix rounded up to the next quarter cubic yard (0.25 yd³).",
    headers: [
      "Pour (L × W × depth)",
      "Volume",
      "With 10% waste",
      "Ready-mix to order",
      "80 lb bags",
      "60 lb bags",
      "40 lb bags",
    ],
    rows: [
      ["10 × 10 × 4 in pour", "1.23 yd³", "1.36 yd³", "1.5 yd³", "62 bags", "82 bags", "123 bags"],
      [
        "10 × 20 × 4 in pour",
        "2.47 yd³",
        "2.72 yd³",
        "2.75 yd³",
        "123 bags",
        "163 bags",
        "245 bags",
      ],
      ["12 × 12 × 4 in pour", "1.78 yd³", "1.96 yd³", "2 yd³", "88 bags", "118 bags", "176 bags"],
      [
        "20 × 20 × 4 in pour",
        "4.94 yd³",
        "5.43 yd³",
        "5.5 yd³",
        "245 bags",
        "326 bags",
        "489 bags",
      ],
      [
        "10 × 10 × 6 in pour",
        "1.85 yd³",
        "2.04 yd³",
        "2.25 yd³",
        "92 bags",
        "123 bags",
        "184 bags",
      ],
    ],
  },
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
    "This calculator does not do structural design. It works out how much concrete a pour of given dimensions needs; it does not say whether those dimensions are right for the load the slab will carry, what reinforcement it needs, or whether a slab needs footings. Those are engineering and local-code questions, not volume questions.",
  ],
  depthSections: [
    {
      id: "cubic-yards-vs-cubic-feet",
      heading: "Cubic yards vs cubic feet — which number do you order by?",
      takeaway:
        "Ready-mix is sold by the cubic yard and bags by the bag: 1 yd³ = 27 ft³, and both figures on this page come from the same volume — order by “Ready-mix to order” for ready-mix, or by the bag counts for bags. Thickness, not floor area, drives the volume: a 10×10 ft pad is 1.23 yd³ at 4 in but 1.85 yd³ at 6 in. Confirm your supplier’s minimum load and short-load fee before ordering.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: 'Ready-mix concrete is sold by the cubic yard; bagged concrete is sold by the bag, and each bag\'s yield is printed in cubic feet. That is why this calculator shows both. A cubic yard is 27 cubic feet — a cube 3 ft long, 3 ft wide, and 3 ft deep. If your supplier quotes a price per cubic yard, use the "Ready-mix to order" figure. If you are buying bags, use the bag counts; they come from the same volume, so the two answers always agree. Thickness, not floor area, is what drives the volume: a 10 ft × 10 ft pad at 4 in thick is only 1.23 cubic yards before waste — barely more than a single yard — while the same pad at 6 in thick is 1.85 cubic yards, half as much again.',
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "One more check before you order ready-mix: confirm the smallest load your supplier will deliver and the short-load fee. A 1.5 yd³ order can cost nearly as much in fees as in concrete if the supplier's minimum is higher.",
            },
          ],
        },
      ],
    },
    {
      id: "waste-allowance",
      heading: "What the waste allowance is actually paying for",
      takeaway:
        "The waste allowance pays for real concrete lost to spillage, over-excavation, forms spreading, and 1–2% shrinkage as it hardens — not for bad arithmetic. NRMCA CIP 31 advises ordering about 4% to 10% more than the plan volume; this calculator defaults to 10%, the top of that range. Use 5% for a large, simple slab on checked level ground and 15% for irregular excavation. Note which volume you are reading: “Volume” is the theoretical hole, “With waste” is what to buy — for a 10×10 slab, 1.23 yd³ vs 1.36 yd³, and 45 vs 50 bags of 80 lb mix per yard.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The waste allowance is not a safety margin for bad arithmetic. It pays for real concrete that leaves the pour without becoming part of the finished slab: spillage, over-excavation, forms that spread slightly under the weight, and the fact that hardened concrete ends up 1–2% smaller in volume than the fresh concrete placed. The National Ready Mixed Concrete Association's Concrete in Practice sheet CIP 31 advises ordering about 4% to 10% more concrete than the volume calculated from the plan dimensions, for exactly those reasons (NRMCA CIP 31). This calculator defaults to 10%, the top of that range. Use 5% for a large, simple slab on ground you have checked level, and 15% for irregular excavation or a subgrade with dips you cannot fully level.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: 'Note which of the two volume numbers you are looking at: the "Volume" row is the theoretical volume of the hole you measured; the "With waste" row is what you should actually buy. A page that says "1.23 yd³" for a 10×10 slab and a page that says "1.36 yd³" for the same slab are not disagreeing — one is before waste and the other is after it. The same split applies to bags: 45 bags of 80 lb mix is the theoretical count for one cubic yard (27 ÷ 0.60), while 50 bags is what you buy at 10% waste.',
            },
          ],
        },
      ],
    },
    {
      id: "measuring-non-rectangular-pour",
      heading: "Measuring a pour that is not a perfect rectangle",
      takeaway:
        "The calculator assumes a level, rectangular pour of uniform depth — measure the depth in several spots and use the average, not the shallowest: a slab 4 in at the edges and 5 in in the middle is a 4½ in slab, and the extra half inch over 100 ft² is another 0.15 yd³. For an L-shape, split it into two rectangles and add them; for a round pad, use π × radius² × depth; for fence-post holes, work out one hole as a cylinder and multiply. If the ground is too uneven to trust one depth, raise the waste allowance to 15%.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The calculator assumes a level, rectangular pour of uniform depth, and that assumption is where most under-orders come from. Measure the depth in several spots and use the average, not the shallowest — a slab that is 4 in at the edges and 5 in in the middle because the subgrade dips is a 4½ in slab on average, and the extra half inch over 100 ft² is another 0.15 yd³. For an L-shaped pad, split it into two rectangles, calculate each separately, and add them. For a round pad, use the area of the circle (π × radius²) times the depth. For fence-post holes, work out one hole as a cylinder and multiply by the number of identical holes — the ",
            },
            { text: "Concrete Bags Calculator", calc: "concrete-bags-calculator" },
            {
              text: " works that example through in full. If the ground is uneven enough that you cannot trust a single depth measurement, raise the waste allowance to 15% rather than guessing a deeper average.",
            },
          ],
        },
      ],
    },
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
