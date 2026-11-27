/**
 * Sod / Turf Calculator config — rolls and pallets of sod (turf) for a
 * lawn, with exclusions and a partial-pallet flag. Rectangle, round, and
 * L-shaped lawns — not rectangle-only. US/UK/CA/AU terminology (sod AND
 * turf). See src/lib/formulas/sod.ts and docs/FORMULAS.md §29.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { opt, req } from "../../components/react/CalculatorConfig";
import { calculateSod } from "../../lib/formulas/sod";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

/**
 * Select value for purchaseMethod = rolls. The island stores select
 * values as numbers; 0 is pallets, the default. A missing value (e.g.
 * the lookup-table recompute, which passes no purchase method) also
 * means pallets.
 */
const PURCHASE_ROLLS = 1;

const PURCHASE_NOTE =
  "Package quantities are always rounded up — you are never told to buy less than you need.";

function sodOutput(
  grossAreaFt2: number,
  v: Record<string, number>,
  present: Set<string>,
  areaWorkedLine: string,
) {
  // opt, not req: the lookup-table recompute passes no purchase
  // method, and a missing value means the default (pallets).
  const isRolls = opt(v, "purchaseMethod") === PURCHASE_ROLLS;
  const r = calculateSod({
    grossAreaFt2,
    exclusionsFt2: opt(v, "exclusions"),
    wastePct: req(v, "waste"),
    rollCoverageFt2: req(v, "rollCoverage"),
    palletCoverageFt2: req(v, "palletCoverage"),
    pricePerRoll: present.has("pricePerRoll") ? req(v, "pricePerRoll") : undefined,
    pricePerPallet: present.has("pricePerPallet") ? req(v, "pricePerPallet") : undefined,
    purchaseMethod: isRolls ? "rolls" : "pallets",
  });
  // The other form's cost, for the comparison in the row detail only:
  // the headline cost follows the chosen form, never the other one.
  const palletCost = present.has("pricePerPallet")
    ? r.pallets * req(v, "pricePerPallet")
    : undefined;
  const rollCost = present.has("pricePerRoll") ? r.rolls * req(v, "pricePerRoll") : undefined;
  const rollsDetail = isRolls
    ? `${fmt(req(v, "rollCoverage"), 0)} ft² per roll — rounded up — your purchase method`
    : rollCost !== undefined
      ? `${fmt(req(v, "rollCoverage"), 0)} ft² per roll — rounded up. Alternative: ${r.rolls} ${r.rolls === 1 ? "roll" : "rolls"} would cost $${rollCost.toFixed(2)} at the roll price you entered — buy rolls or pallets, not both.`
      : `${fmt(req(v, "rollCoverage"), 0)} ft² per roll — rounded up. Alternative — buy rolls or pallets, not both.`;
  const palletBaseDetail = r.lastPalletPartial
    ? `${fmt(req(v, "palletCoverage"), 0)} ft² per pallet — last pallet is partial, you need only ${fmt(r.lastPalletFt2, 0)} ft² of it`
    : `${fmt(req(v, "palletCoverage"), 0)} ft² per pallet — whole pallets only`;
  const palletsDetail = isRolls
    ? palletCost !== undefined
      ? `${palletBaseDetail}. Alternative: ${r.pallets} ${r.pallets === 1 ? "pallet" : "pallets"} would cost $${palletCost.toFixed(2)} at the pallet price you entered — buy rolls or pallets, not both.`
      : `${palletBaseDetail}. Alternative — buy rolls or pallets, not both.`
    : `${palletBaseDetail} — your purchase method`;
  return {
    ...(r.netAreaFt2 <= 0
      ? { warnings: ["The exclusions cover the whole lawn, so no sod is needed."] }
      : {}),
    rows: [
      {
        label: "Lawn area",
        value: `${fmt(r.netAreaFt2, 0)} ft²`,
        detail: `${fmt(r.netAreaM2)} m² after exclusions`,
      },
      {
        label: "Area with waste",
        value: `${fmt(r.adjustedAreaFt2, 0)} ft²`,
        detail: `${fmt(r.adjustedAreaM2)} m² with ${fmt(req(v, "waste"), 0)}% waste`,
      },
      {
        label: "Rolls to buy",
        value: `${r.rolls} ${r.rolls === 1 ? "roll" : "rolls"}`,
        detail: rollsDetail,
      },
      {
        label: "Pallets to buy",
        value: `${r.pallets} ${r.pallets === 1 ? "pallet" : "pallets"}`,
        detail: palletsDetail,
      },
    ],
    // The shopping list carries only the chosen form — rolls or
    // pallets, never both. The partial-pallet flag travels with the
    // pallet line, because the result rows do not travel to My Project.
    lines: isRolls
      ? [
          `Sod (rolls): ${r.rolls} ${r.rolls === 1 ? "roll" : "rolls"} (${fmt(req(v, "rollCoverage"), 0)} ft² each)`,
        ]
      : [
          `Sod (pallets): ${r.pallets} ${r.pallets === 1 ? "pallet" : "pallets"} (${fmt(req(v, "palletCoverage"), 0)} ft² each)${r.lastPalletPartial ? ` — last pallet is partial, you need only ${fmt(r.lastPalletFt2, 0)} ft² of it` : ""}`,
        ],
    costUsd: r.costUsd,
    note: isRolls
      ? `Buy rolls or pallets, not both — the shopping list contains only the rolls. ${PURCHASE_NOTE}`
      : `Buy rolls or pallets, not both — the shopping list contains only the pallets. ${PURCHASE_NOTE}`,
    workedLine:
      `${areaWorkedLine} × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedAreaFt2, 0)} ft²; ` +
      `rolls ${fmt(r.adjustedAreaFt2, 0)} ÷ ${fmt(req(v, "rollCoverage"), 0)} = ${r.rolls}; ` +
      `pallets ${fmt(r.adjustedAreaFt2, 0)} ÷ ${fmt(req(v, "palletCoverage"), 0)} = ${r.pallets}.`,
  };
}

const COMMON_FIELDS = [
  {
    id: "exclusions",
    label: "Area to subtract (optional)",
    kind: "area" as const,
    unitKind: "area" as const,
    canonicalUnit: "ft2",
    impUnit: "ft2",
    metUnit: "m2",
    defaultImp: "",
    defaultMet: "",
    optional: true,
    min: 0,
    hint: "House, driveway, beds, and paths — anything the lawn does not cover. Leave empty for none.",
  },
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent" as const,
    defaultImp: "10",
    defaultMet: "10",
    hint: "5% for a simple rectangle, 10% for curves and cuts.",
  },
  {
    id: "rollCoverage",
    label: "Coverage per roll (ft²)",
    kind: "area" as const,
    unitKind: "area" as const,
    canonicalUnit: "ft2",
    impUnit: "ft2",
    metUnit: "m2",
    defaultImp: "10",
    defaultMet: "0.93",
    min: 0.1,
    hint: "A US sod roll covers 10 ft² (2 × 5 ft); a UK turf roll covers about 1 m². Enter your supplier's figure.",
  },
  {
    id: "palletCoverage",
    label: "Coverage per pallet (ft²)",
    kind: "area" as const,
    unitKind: "area" as const,
    canonicalUnit: "ft2",
    impUnit: "ft2",
    metUnit: "m2",
    defaultImp: "450",
    defaultMet: "41.81",
    min: 1,
    hint: "A US pallet covers 400–500 ft². Enter your supplier's figure.",
  },
  {
    id: "purchaseMethod",
    label: "Buy as",
    kind: "select" as const,
    defaultImp: "0",
    defaultMet: "0",
    options: [
      { value: "0", label: "Pallets" },
      { value: "1", label: "Rolls" },
    ],
    hint: "Choose how you will buy it. The shopping list and the cost follow this choice — rolls or pallets, never both.",
  },
  {
    id: "pricePerRoll",
    label: "Price per roll (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    hint: "Used only when “Buy as” is Rolls.",
  },
  {
    id: "pricePerPallet",
    label: "Price per pallet (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    hint: "Used only when “Buy as” is Pallets.",
  },
];

export const sodConfig: CalculatorConfig = {
  slug: "sod-calculator",
  designCplus: true,
  heroResultLabel: "Rolls to buy",
  lookupTable: {
    note: "Assumes 10% waste, 10 ft² rolls, and 450 ft² pallets.",
    headers: ["Lawn (L × W)", "Lawn area", "Area with waste", "Rolls to buy", "Pallets to buy"],
    rows: [
      ["10 × 10 ft lawn", "100 ft²", "110 ft²", "11 rolls", "1 pallet"],
      ["20 × 20 ft lawn", "400 ft²", "440 ft²", "44 rolls", "1 pallet"],
      ["20 × 30 ft lawn", "600 ft²", "660 ft²", "66 rolls", "2 pallets"],
      ["30 × 40 ft lawn", "1,200 ft²", "1,320 ft²", "132 rolls", "3 pallets"],
      ["50 × 100 ft lawn", "5,000 ft²", "5,500 ft²", "550 rolls", "13 pallets"],
    ],
  },
  diagram: "area",
  defaultMode: "rectangle",
  formula:
    "Lawn area = length × width (rectangle), π × (diameter ÷ 2)² (round lawn), " +
    "or the two rectangles added (L-shaped lawn) — minus the area to subtract for the " +
    "house, driveway, and beds. Area with waste = lawn area × (1 + waste allowance). " +
    "Rolls = area with waste ÷ coverage per roll, rounded up; pallets = area with waste " +
    "÷ coverage per pallet, rounded up. A US roll covers 10 ft² (2 × 5 ft) and a US " +
    "pallet 400–500 ft² (450 ft² is the small end, used as the default); a UK turf roll " +
    "covers about 1 m². Waste is 5% for a simple rectangle and 10% for curves and cuts. " +
    "Cost follows the “Buy as” choice: pallets are priced at the pallet price, rolls at " +
    "the roll price — a buyer buys rolls or pallets, never both. No cost is shown when " +
    "the price for the chosen form is not entered.",
  howTo: [
    "Measure the lawn in feet — length × width for a rectangle, or split an irregular lawn into rectangles and add them. Use the round or L-shaped mode when it fits better.",
    "Subtract the house, driveway, beds, and paths: anything the lawn does not cover. Measure each one and add them up.",
    "Check the coverage: a US sod roll is 10 ft² (2 × 5 ft) and a US pallet is 400–500 ft², but sizes vary by supplier and region — a UK turf roll is about 1 m². Enter your supplier's figures.",
    "Choose “Buy as”: pallets or rolls. The shopping list and the cost follow that choice, so the two forms are never added together — the other form stays visible as a labelled alternative with its own cost when you entered its price.",
    "Set the waste: 5% for a simple rectangle, 10% for curves and cuts. The last pallet is flagged when it is only partly needed, so you can ask your supplier about a partial pallet.",
  ],
  workedExample:
    "A 20 × 30 ft lawn with a 100 ft² driveway to subtract: 600 − 100 = 500 ft². " +
    "With 10% waste that is 550 ft². At 10 ft² per roll that is 55 rolls; at 450 ft² per pallet that is 2 pallets — the second pallet is partial, you need only 100 ft² of it.",
  limitations: [
    "Roll and pallet sizes vary by supplier and region (US rolls 2 × 5 ft, Southern slabs 16 × 24 in, UK rolls about 1 m²) — the coverage fields are editable for exactly this reason. Enter your supplier's figures rather than trusting the defaults.",
    [
      {
        text: "Does not account for soil preparation, grading, or watering — the sod goes on prepared soil, and the under-sod layer is a separate job (see the ",
      },
      { text: "Topsoil Calculator", calc: "topsoil-calculator" },
      { text: " for the soil underneath)." },
    ],
    [
      {
        text: "Sod and seed are different methods for the same lawn: sod typically establishes in 3–4 weeks but costs more per square foot, seed is cheaper but takes around 4–6 weeks to establish and longer to fill in fully (Univ. of Maryland Extension). For the seed quantities, see the ",
      },
      { text: "Lawn Seed Calculator", calc: "lawn-seed-calculator" },
      { text: "." },
    ],
  ],
  faqs: [
    {
      question: "How many square feet are in a pallet of sod?",
      answer:
        "400–500 ft² for a US pallet; this calculator defaults to 450 ft², the small end of the range. A pallet weighs roughly 1,750–2,000 lb — about a ton (Purdue Extension: sod weighs about 35–40 lb per square yard; Mississippi State Extension: a 450 ft² pallet may weigh as much as a ton) — so check that your vehicle or delivery can handle it.",
    },
    {
      question: "How big is a roll of sod?",
      answer:
        "A US sod roll is 10 ft² (2 × 5 ft). Southern slabs are 16 × 24 in (about 3 ft² each). A UK turf roll is about 1 m². Piece sizes vary by supplier, so the coverage fields here are editable.",
    },
    {
      question: "How much sod do I need for a 10×10 area?",
      answer:
        "A 10 × 10 ft lawn is 100 ft²; with 10% waste that is 110 ft² — 11 rolls of 10 ft², or 1 pallet (partial: you need only 110 ft² of a 450 ft² pallet).",
    },
    {
      question: "When is the best time to lay sod?",
      answer:
        "For cool-season grasses, late summer to early fall (mid-August to mid-October) — spring planting (March into early April) is more challenging than fall planting. For warm-season grasses, late spring to early summer (mid-May into June), once the soil is warm (Univ. of Maryland Extension). Sod laid in the heat of summer needs far more watering to take.",
    },
    {
      question: "Sod or seed — which is better?",
      answer:
        "Sod typically establishes in 3–4 weeks after laying (roots in 2–3 weeks) and costs more per square foot; seed is much cheaper but takes around 4–6 weeks to establish and longer to fill in fully (Univ. of Maryland Extension). Choose sod when you need the lawn now and can water it daily for the first two weeks; choose seed when budget matters more than speed.",
    },
    {
      question: "How long can sod sit on the pallet before laying it?",
      answer:
        "Lay it the day it arrives if you can — actively growing sod should be installed within 24–48 hours of harvest (Univ. of Tennessee Extension), and sod is highly perishable, so install it promptly after delivery, especially in hot, dry weather (Univ. of Maryland Extension). Sod on a pallet heats up and dries out fast; if you must wait, keep the pallet in the shade and water it lightly (Mississippi State Extension), or unstack the rolls and lay them flat in the shade (Univ. of Maryland Extension) — never leave it stacked for more than a day or two.",
    },
  ],
  modes: [
    {
      id: "rectangle",
      label: "Rectangle lawn",
      fields: [
        {
          id: "length",
          label: "Length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "20",
          defaultMet: "6.1",
        },
        {
          id: "width",
          label: "Width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "30",
          defaultMet: "9.14",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const gross = req(v, "length") * req(v, "width");
        const areaLine =
          `${fmt(req(v, "length"), 0)} × ${fmt(req(v, "width"), 0)} ft` +
          (opt(v, "exclusions") > 0
            ? ` − ${fmt(opt(v, "exclusions"), 0)} ft² = ${fmt(gross - opt(v, "exclusions"), 0)} ft²`
            : ` = ${fmt(gross, 0)} ft²`);
        return sodOutput(gross, v, present, areaLine);
      },
    },
    {
      id: "circle",
      label: "Round lawn",
      fields: [
        {
          id: "diameter",
          label: "Diameter",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "20",
          defaultMet: "6.1",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const gross = Math.PI * (req(v, "diameter") / 2) ** 2;
        const areaLine =
          `π × ${fmt(req(v, "diameter") / 2, 1)}² ft` +
          (opt(v, "exclusions") > 0
            ? ` − ${fmt(opt(v, "exclusions"), 0)} ft² = ${fmt(gross - opt(v, "exclusions"), 0)} ft²`
            : ` = ${fmt(gross, 0)} ft²`);
        return sodOutput(gross, v, present, areaLine);
      },
    },
    {
      id: "l-shape",
      label: "L-shaped lawn",
      fields: [
        {
          id: "length1",
          label: "Length (first rectangle)",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "20",
          defaultMet: "6.1",
        },
        {
          id: "width1",
          label: "Width (first rectangle)",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "20",
          defaultMet: "6.1",
        },
        {
          id: "length2",
          label: "Length (second rectangle)",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3.05",
        },
        {
          id: "width2",
          label: "Width (second rectangle)",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3.05",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const gross = req(v, "length1") * req(v, "width1") + req(v, "length2") * req(v, "width2");
        const areaLine =
          `${fmt(req(v, "length1"), 0)} × ${fmt(req(v, "width1"), 0)} + ${fmt(req(v, "length2"), 0)} × ${fmt(req(v, "width2"), 0)} ft` +
          (opt(v, "exclusions") > 0
            ? ` − ${fmt(opt(v, "exclusions"), 0)} ft² = ${fmt(gross - opt(v, "exclusions"), 0)} ft²`
            : ` = ${fmt(gross, 0)} ft²`);
        return sodOutput(gross, v, present, areaLine);
      },
    },
  ],
};
