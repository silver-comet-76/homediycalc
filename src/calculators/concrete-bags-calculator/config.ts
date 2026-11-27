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
        value: `${r.bags40} ${r.bags40 === 1 ? "bag" : "bags"}`,
        detail: `${CONCRETE_BAG_YIELDS_FT3[40]} ft³ per bag (QUIKRETE No. 1101)${priceDetail("pricePerBag40", r.bags40)}`,
      },
      {
        label: "60 lb bags",
        value: `${r.bags60} ${r.bags60 === 1 ? "bag" : "bags"}`,
        detail: `${CONCRETE_BAG_YIELDS_FT3[60]} ft³ per bag (QUIKRETE No. 1101)${priceDetail("pricePerBag60", r.bags60)}`,
      },
      {
        label: "80 lb bags",
        value: `${r.bags80} ${r.bags80 === 1 ? "bag" : "bags"}`,
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
    workedLine: `${fmt(r.volumeYd3)} yd³ × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedFt3)} ft³ → ${r.bags80} × 80 lb ${r.bags80 === 1 ? "bag" : "bags"} (0.60 ft³ each), or ${r.bags60} × 60 lb, or ${r.bags40} × 40 lb.`,
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
  designCplus: true,
  heroResultLabel: "80 lb bags",
  lookupTable: {
    note: "Assumes 10% waste.",
    headers: ["Volume", "Volume needed", "40 lb bags", "60 lb bags", "80 lb bags"],
    rows: [
      ["0.5 yd³ (13.5 ft³)", "0.55 yd³", "50 bags", "33 bags", "25 bags"],
      ["1 yd³ (27 ft³)", "1.1 yd³", "99 bags", "66 bags", "50 bags"],
      ["2 yd³ (54 ft³)", "2.2 yd³", "198 bags", "132 bags", "99 bags"],
      ["3 yd³ (81 ft³)", "3.3 yd³", "297 bags", "198 bags", "149 bags"],
      ["5 yd³ (135 ft³)", "5.5 yd³", "495 bags", "330 bags", "248 bags"],
    ],
  },
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
    [
      {
        text: "Bagged concrete is practical up to about 1–2 cubic yards. Above that, ready-mix delivered by truck is usually cheaper and much less work — see the ",
      },
      { text: "Concrete Calculator", calc: "concrete-calculator" },
      { text: "." },
    ],
    "Does not include reinforcement (rebar or wire mesh), formwork, or finishing tools.",
  ],
  depthSections: [
    {
      id: "how-many-80-lb-bags",
      heading: "How many 80 lb bags make one cubic yard? 45 — and what that number leaves out",
      takeaway:
        "45 bags of 80 lb mix is the theoretical count for one cubic yard (27 ft³ ÷ 0.60 ft³ per bag, QUIKRETE Concrete Mix No. 1101, Oct 2022 data sheet) — with no waste, no spillage, and no over-excavation. It is the right answer to the question as asked and the wrong number to buy: with the usual 10% waste, the volume is 29.7 ft³ and 29.7 ÷ 0.60 = 49.5, rounded up to 50 bags. Quoting 45 as a purchase quantity understates the job by 5 bags. The yield is “approximately” on the data sheet — it depends on water added and placement — so check the bag you buy.",
      blocks: [
        {
          type: "paragraph",
          text: [
            { text: "45 bags.", strong: true },
            {
              text: " One cubic yard is 27 cubic feet, and one 80 lb bag of QUIKRETE Concrete Mix No. 1101 yields approximately 0.60 cubic feet, so 27 ÷ 0.60 = 45 bags. That is the theoretical count: the number of bags whose combined yield exactly fills one cubic yard, with no waste, no spillage, and no over-excavation. It is the right answer to the question as asked, and it is the wrong number to buy. With the calculator's usual 10% waste allowance, the volume to fill is 27 × 1.10 = 29.7 ft³, and 29.7 ÷ 0.60 = 49.5, rounded up to ",
            },
            { text: "50 bags", strong: true },
            {
              text: '. Quoting 45 bags as a purchase quantity understates the job by 5 bags. The distinction is the single most common error in bagged-concrete estimating, and it is why this page shows both numbers: the theoretical count tells you the yield; the purchase count tells you what to buy. The yield figure itself comes from the manufacturer\'s data sheet — QUIKRETE Concrete Mix No. 1101, revised October 2022 — and the word on the sheet is "approximately", because the yield of a bag depends on how much water is added and how the mix is placed. Check the bag you buy; if its yield differs, the count changes with it.',
            },
          ],
        },
      ],
    },
    {
      id: "bags-per-cubic-yard-all-sizes",
      heading: "Bags per cubic yard, all sizes — theoretical vs to buy",
      takeaway:
        "Theoretical vs to-buy per cubic yard at 10% waste (QUIKRETE No. 1101 yields): 40 lb (0.30 ft³) 90 vs 99; 50 lb (0.375 ft³) 72 vs 80; 60 lb (0.45 ft³) 60 vs 66; 80 lb (0.60 ft³) 45 vs 50; 90 lb (0.675 ft³) 40 vs 44. Do not generalize the 45 figure: it is true only of an 80 lb bag yielding 0.60 ft³ — a fast-setting, high-strength, or different-brand bag follows its own yield. Pick one size and buy that count; the three counts are alternatives, not a combined list. Enter prices to see the cheapest option — cheapest per yard is not cheapest per bag, and at 50 bags the 80 lb option is 4,000 lb to move.",
      blocks: [
        {
          type: "table",
          headers: [
            "Bag size",
            "Yield per bag (QUIKRETE No. 1101)",
            "Theoretical bags per yd³ (no waste)",
            "Bags to buy per yd³ (10% waste)",
          ],
          rows: [
            ["40 lb", "approx. 0.30 ft³", "90 (27 ÷ 0.30)", "99 (29.7 ÷ 0.30)"],
            [
              "50 lb",
              "approx. 0.375 ft³",
              "72 (27 ÷ 0.375)",
              "80 (29.7 ÷ 0.375 = 79.2, rounded up)",
            ],
            ["60 lb", "approx. 0.45 ft³", "60 (27 ÷ 0.45)", "66 (29.7 ÷ 0.45)"],
            ["80 lb", "approx. 0.60 ft³", "45 (27 ÷ 0.60)", "50 (29.7 ÷ 0.60 = 49.5, rounded up)"],
            ["90 lb", "approx. 0.675 ft³", "40 (27 ÷ 0.675)", "44 (29.7 ÷ 0.675)"],
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "The calculator itself offers 40, 60, and 80 lb bags, which are the sizes most stores stock; the 50 lb and 90 lb rows are included here because QUIKRETE's data sheet lists them (the 90 lb bag is regional availability) and because a reader whose store stocks them should not have to guess. Do ",
            },
            { text: "not", strong: true },
            {
              text: " generalize the 45 figure to other products: 45 bags per yard is true of an 80 lb bag that yields 0.60 ft³. A fast-setting mix, a high-strength mix, or a different brand's 80 lb bag can yield something else entirely, and its bags-per-yard figure follows its own yield, not this one. The data sheet's yields are for QUIKRETE Concrete Mix No. 1101 only. Other QUIKRETE products (such as its 5000 mix and its fast-setting mix) have their own data sheets, which were not verified for this page — check the bag.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            { text: "Pick one size and buy that count.", strong: true },
            {
              text: " The three counts the calculator returns are alternatives for the same volume, not a combined shopping list. Which size is actually cheapest depends on the prices at your store, not on the bag size: enter the prices for each size and the calculator highlights the cheapest option from the prices you entered. The cheapest per yard is not the cheapest per bag, and the cheapest option is not the easiest to carry — at 50 bags, the 80 lb option is 4,000 lb of material to move.",
            },
          ],
        },
      ],
    },
    {
      id: "coverage-per-bag-by-thickness",
      heading: "Coverage per bag, by thickness",
      takeaway:
        "At 4 in thick (⅓ ft), one 80 lb bag (about 0.60 ft³) covers about 1.8 ft²; a 60 lb bag about 1.35 ft²; a 40 lb bag about 0.9 ft². At 2 in thick, the same bags cover about 3.6, 2.7, and 1.8 ft². These are theoretical coverages from the manufacturer’s yield, before waste — add the same 10% when you buy. Quick check: a 4×4 ft pad at 4 in is 16 ft², or 8.9 bags in theory at 1.8 ft² per 80 lb bag, 9.8 with waste — buy 10 bags. If the calculator gives a very different number for the same pad, one of the two has the wrong thickness in it.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "A bag's yield in cubic feet is hard to picture on a slab; coverage in square feet at your thickness is easier. At 4 in thick (⅓ ft), one 80 lb bag (approximately 0.60 ft³) covers about 1.8 ft²; a 60 lb bag about 1.35 ft²; a 40 lb bag about 0.9 ft². At 2 in thick, the same bags cover about 3.6, 2.7, and 1.8 ft². These are theoretical coverages from the manufacturer's yield, before waste — add the same 10% when you buy. The practical use is a quick check on a small job: a 4 ft × 4 ft pad at 4 in is 16 ft², which at 1.8 ft² per 80 lb bag is 8.9 bags in theory, 9.8 with waste — buy 10 bags. If the calculator gives a very different number for the same pad, one of the two has the wrong thickness in it.",
            },
          ],
        },
      ],
    },
    {
      id: "small-jobs-fence-posts-repairs",
      heading: "Small jobs: fence posts and repairs",
      takeaway:
        "Bagged concrete earns its keep on jobs too small for a truck. A fence-post hole 12 in in diameter and 24 in deep is about 1.57 ft³; with 10% waste that is 1.73 ft³, and 1.73 ÷ 0.60 = 2.88 — buy 3 bags of 80 lb mix per hole. Eight identical holes need 24 bags. Above about 1 cubic yard, compare with ready-mix; above about 2 cubic yards, do not plan on bags at all. This is a volume calculation only — it says nothing about the post size, the hole depth your frost line or local code requires, or whether the post should sit on gravel or concrete.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "Bagged concrete earns its keep on jobs too small for a truck. A fence-post hole 12 in in diameter and 24 in deep is a cylinder: π × (0.5 ft)² × 2 ft = about 1.57 ft³. With 10% waste that is 1.73 ft³, and 1.73 ÷ 0.60 = 2.88 — buy ",
            },
            { text: "3 bags of 80 lb mix per hole", strong: true },
            {
              text: ". Eight identical holes need 24 bags (8 × 1.57 = 12.57 ft³, with waste 13.82 ft³, 13.82 ÷ 0.60 = 23.04 → 24). The volume-first ",
            },
            { text: "Concrete Calculator", calc: "concrete-calculator" },
            {
              text: " does the same calculation from dimensions and adds the ready-mix order amount, which is the comparison to make once the job passes about 1 cubic yard: at 45 bags in theory (50 to buy), mixing by hand is a full day's work, and ready-mix delivered by truck is usually cheaper and far faster. Above about 2 cubic yards, do not plan on bags at all. This is a volume calculation only — it says nothing about the post size, the hole depth your frost line or local code requires, or whether the post should sit on gravel or concrete.",
            },
          ],
        },
      ],
    },
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
