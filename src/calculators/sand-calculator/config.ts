/**
 * Sand Calculator config — volume and weight of sand for a sandbox, pool
 * base, patio base, or fill, plus bag counts and a reverse mode (area
 * covered by sand you already have). Like the Topsoil Calculator in
 * shape, but with sand-type densities instead of a single soil density.
 * See src/lib/formulas/sand.ts and docs/FORMULAS.md §27.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { opt, req } from "../../components/react/CalculatorConfig";
import { calculateSand, calculateSandCoverage } from "../../lib/formulas/sand";
import { cubicFeetToCubicYards, kilogramsToTonnes } from "../../lib/units";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

/**
 * Select value for purchaseMethod = bags. The island stores select
 * values as numbers; 0 is bulk, the default. A missing value (e.g.
 * the lookup-table recompute, which passes no purchase method) also
 * means bulk.
 */
const PURCHASE_BAGS = 1;

const PURCHASE_NOTE =
  "Package quantities are always rounded up — you are never told to buy less than you need.";

function sandOutput(volumeFt3: number, v: Record<string, number>, present: Set<string>) {
  // opt, not req: the lookup-table recompute passes no purchase
  // method, and a missing value means the default (bulk).
  const isBags = opt(v, "purchaseMethod") === PURCHASE_BAGS;
  const r = calculateSand({
    volumeFt3,
    wastePct: req(v, "waste"),
    densityLbYd3: req(v, "density"),
    bagSizeFt3: req(v, "bagSize"),
    pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
    purchaseMethod: isBags ? "bags" : "bulk",
  });
  // The other form's cost, for the comparison in the row detail only:
  // the headline cost follows the chosen form, never the other one.
  const bulkCost = present.has("pricePerYd3") ? r.orderYd3 * req(v, "pricePerYd3") : undefined;
  const bagCost = present.has("pricePerBag") ? r.bags * req(v, "pricePerBag") : undefined;
  const bulkDetail = isBags
    ? bulkCost !== undefined
      ? `Rounded up to whole yards. Alternative: ${r.orderYd3} yd³ would cost $${bulkCost.toFixed(2)} at the bulk price you entered — buy bulk or bags, not both.`
      : "Rounded up to whole yards. Alternative — buy bulk or bags, not both."
    : "Rounded up to whole yards — your purchase method";
  const bagsDetail = isBags
    ? `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up — your purchase method`
    : bagCost !== undefined
      ? `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up. Alternative: ${r.bags} ${r.bags === 1 ? "bag" : "bags"} would cost $${bagCost.toFixed(2)} at the bag price you entered — buy bulk or bags, not both.`
      : `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up. Alternative — buy bulk or bags, not both.`;
  // The order weight follows the purchase method, so the selected form
  // is never shown carrying the other form's weight: bulk shows the
  // weight of the whole yards ordered, bags shows the estimated weight
  // of the bags ordered, and each names the other as the alternative.
  const orderWeightRow = isBags
    ? {
        label: "Weight of bagged order",
        value: `${fmt(r.baggedWeightTons)} tons (US short tons)`,
        detail: `${r.bags} ${r.bags === 1 ? "bag" : "bags"} × ${fmt(req(v, "bagSize"), 2)} ft³ = ${fmt(r.bags * req(v, "bagSize"))} ft³ ≈ ${fmt(r.baggedWeightLb, 0)} lb (${fmt(r.baggedWeightKg, 0)} kg, ${fmt(kilogramsToTonnes(r.baggedWeightKg))} tonnes) at ${fmt(req(v, "density"), 0)} lb/yd³ — a density-based estimate; check the bag's stated weight (a 50 lb bag is about 0.5 ft³). Bulk alternative: the ${r.orderYd3} yd³ bulk order would weigh ${fmt(r.orderWeightLb, 0)} lb (${fmt(r.orderWeightTons)} tons (US short tons)).`,
      }
    : {
        label: "Weight of bulk order",
        value: `${fmt(r.orderWeightTons)} tons (US short tons)`,
        detail: `${fmt(r.orderWeightLb, 0)} lb (${fmt(r.orderWeightKg, 0)} kg, ${fmt(kilogramsToTonnes(r.orderWeightKg))} tonnes) for the ${r.orderYd3} yd³ you order. Bagged alternative: ${r.bags} ${r.bags === 1 ? "bag" : "bags"} would weigh about ${fmt(r.baggedWeightLb, 0)} lb (${fmt(r.baggedWeightTons)} tons (US short tons)) at this density.`,
      };
  const workedLine = isBags
    ? `${fmt(volumeFt3)} ft³ × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedFt3)} ft³ = ${fmt(r.adjustedYd3)} yd³; weight needed ${fmt(r.adjustedYd3)} × ${fmt(req(v, "density"), 0)} lb/yd³ = ${fmt(r.weightLb, 0)} lb (${fmt(r.weightTons)} tons (US short tons)); the ${r.bags} ${r.bags === 1 ? "bag" : "bags"} weigh about ${fmt(r.baggedWeightLb, 0)} lb (${fmt(r.baggedWeightTons)} tons (US short tons)) at ${fmt(req(v, "density"), 0)} lb/yd³ (density estimate); the ${r.orderYd3} yd³ bulk order would weigh ${fmt(r.orderWeightLb, 0)} lb.`
    : `${fmt(volumeFt3)} ft³ × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedFt3)} ft³ = ${fmt(r.adjustedYd3)} yd³; weight needed ${fmt(r.adjustedYd3)} × ${fmt(req(v, "density"), 0)} lb/yd³ = ${fmt(r.weightLb, 0)} lb (${fmt(r.weightTons)} tons (US short tons)); the ${r.orderYd3} yd³ order weighs ${fmt(r.orderWeightLb, 0)} lb (${fmt(r.orderWeightTons)} tons (US short tons)).`;
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
        detail: bulkDetail,
      },
      {
        label: "Weight needed",
        value: `${fmt(r.weightTons)} tons (US short tons)`,
        detail: `${fmt(r.weightLb, 0)} lb (${fmt(r.weightKg, 0)} kg, ${fmt(kilogramsToTonnes(r.weightKg))} tonnes) for the ${fmt(r.adjustedYd3)} yd³ required`,
      },
      orderWeightRow,
      {
        label: "Bags",
        value: `${r.bags} ${r.bags === 1 ? "bag" : "bags"}`,
        detail: bagsDetail,
      },
    ],
    // The shopping list carries only the chosen form — bulk or bags,
    // never both. The weight rows stay on the page as reference; they
    // are not purchase lines.
    lines: isBags
      ? [
          `Sand bags (${fmt(req(v, "bagSize"), 2)} ft³ each): ${r.bags} (about ${fmt(r.baggedWeightTons)} tons (US short tons) — density estimate)`,
        ]
      : [`Sand (bulk): ${r.orderYd3} yd³ (about ${fmt(r.orderWeightTons)} tons (US short tons))`],
    costUsd: r.costUsd,
    note: isBags
      ? `Buy bulk or bags, not both — the shopping list contains only the bags. ${PURCHASE_NOTE}`
      : `Buy bulk or bags, not both — the shopping list contains only the bulk order. ${PURCHASE_NOTE}`,
    workedLine,
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
        label: "Weight of sand on hand",
        value: `${fmt(r.weightTons)} tons (US short tons)`,
        detail: `${fmt(r.weightLb, 0)} lb (${fmt(r.weightKg, 0)} kg, ${fmt(kilogramsToTonnes(r.weightKg))} tonnes) at ${fmt(req(v, "density"), 0)} lb/yd³ — the weight of the ${fmt(amountYd3)} yd³ you have`,
      },
    ],
    lines: [`Sand on hand: ${fmt(amountYd3)} yd³ covers ${fmt(r.areaFt2, 0)} ft²`],
    workedLine: `${fmt(amountYd3)} yd³ = ${fmt(r.volumeFt3)} ft³ ÷ ${fmt(req(v, "depth"))} ft = ${fmt(r.areaFt2, 0)} ft². It weighs ${fmt(r.weightLb, 0)} lb (${fmt(r.weightTons)} tons (US short tons)).`,
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
    hint: "Dry sand is about 2,700 lb/yd³; loose sand generally runs 2,630–2,960 lb/yd³ (Missouri DOT). Damp sand runs about 10–15% heavier, wet sand up to about 20% heavier. Ask your supplier for the load-ticket figure.",
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
    id: "purchaseMethod",
    label: "Buy as",
    kind: "select" as const,
    defaultImp: "0",
    defaultMet: "0",
    options: [
      { value: "0", label: "Bulk — by the cubic yard" },
      { value: "1", label: "Bags" },
    ],
    hint: "Choose how you will buy it. The shopping list and the cost follow this choice — bulk or bags, never both.",
  },
  {
    id: "pricePerYd3",
    label: "Price per cubic yard (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    hint: "Used only when “Buy as” is Bulk.",
  },
  {
    id: "pricePerBag",
    label: "Price per bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    hint: "Used only when “Buy as” is Bags.",
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
    note: "Assumes 10% waste, dry sand at 2,700 lb per cubic yard, and 0.5 ft³ bags. Tons are US short tons. “Weight needed” is the weight of the sand volume required; “Weight of order” is the bulk order weight — the weight of the whole yards you order. When “Buy as” is Bags, the page instead shows the estimated bagged-order weight (bags × bag size ÷ 27 × density) — a density-based estimate; check the bag's stated weight.",
    headers: [
      "Area (L × W × depth)",
      "Sand volume",
      "Bulk to order",
      "Weight needed",
      "Weight of order",
      "Bags",
    ],
    rows: [
      [
        "10 × 10 × 4 in sandbox",
        "1.36 yd³",
        "2 yd³",
        "1.83 tons (US short tons)",
        "2.7 tons (US short tons)",
        "74 bags",
      ],
      [
        "10 × 10 × 6 in sandbox",
        "2.04 yd³",
        "3 yd³",
        "2.75 tons (US short tons)",
        "4.05 tons (US short tons)",
        "110 bags",
      ],
      [
        "10 × 20 × 4 in patio base",
        "2.72 yd³",
        "3 yd³",
        "3.67 tons (US short tons)",
        "4.05 tons (US short tons)",
        "147 bags",
      ],
      [
        "12 × 12 × 4 in pool base",
        "1.96 yd³",
        "2 yd³",
        "2.64 tons (US short tons)",
        "2.7 tons (US short tons)",
        "106 bags",
      ],
      [
        "20 × 10 × 6 in fill",
        "4.07 yd³",
        "5 yd³",
        "5.5 tons (US short tons)",
        "6.75 tons (US short tons)",
        "220 bags",
      ],
    ],
  },
  diagram: "volume",
  defaultMode: "area",
  formula:
    "Volume = length × width × depth; cubic yards = cubic feet ÷ 27. " +
    "Weight needed = required volume × bulk density; weight of order = " +
    "rounded order volume × bulk density — the two differ whenever the " +
    "order rounds up. The page shows three weights: “Weight needed” is " +
    "the weight of the sand required; “Weight of bulk order” is the " +
    "weight of the whole yards ordered (bulk); “Weight of bagged order” " +
    "is the estimated weight of the bags ordered — bags × bag size ÷ 27 " +
    "× density — shown when “Buy as” is Bags. For example, a 10 × 10 ft " +
    "sandbox 4 in deep with 10% waste needs 1.36 yd³ (3,667 lb) and " +
    "orders 2 yd³ in bulk (5,400 lb), but the 74 bags of 0.5 ft³ weigh " +
    "about 3,700 lb (1.85 tons (US short tons)) at 2,700 lb/yd³ — a " +
    "density-based estimate; the bag's stated weight governs (a 50 lb " +
    "bag is about 0.5 ft³, so 74 × 50 lb = 3,700 lb). Dry sand weighs " +
    "about 2,700 lb/yd³ (1.35 tons " +
    "(US short tons) per yd³, about 1.60 tonnes/m³) — the figure implied " +
    "by QUIKRETE's 50 lb bag yielding about 0.5 ft³ — and loose sand " +
    "generally runs 2,630–2,960 lb/yd³ (Missouri DOT). Damp sand runs " +
    "about 10–15% heavier than dry sand, wet sand up to about 20% " +
    "heavier (Engineering ToolBox: dry 100, damp 115, wet 120 lb/ft³). " +
    "Sand types differ mainly in grain size and use, not in a fixed " +
    "weight — enter your supplier's load-ticket density when you have " +
    "it. Bags = volume ÷ bag size, rounded up (a 50 lb bag is about " +
    "0.5 ft³; 54 × 50 lb bags fill a cubic yard). Bulk is ordered by " +
    "the whole cubic yard, rounded up. Cost follows the “Buy as” " +
    "choice: bulk is priced at the bulk price per cubic yard, bags at " +
    "the bag price — a buyer buys bulk or bags, never both. No cost is " +
    "shown when the price for the chosen form is not entered. " +
    "From sand you have: area covered = volume ÷ depth; its weight is " +
    "the weight of the amount you have.",
  howTo: [
    "Measure the area in feet — length × width for a rectangle, or split an irregular area into rectangles and add them.",
    "Choose the depth for the job: 6 in for a sandbox, 4 in for an above-ground pool base, 2 in for levelling or fill. Paver bedding sand is exactly 1 in.",
    "Check the density: dry sand is about 2,700 lb per cubic yard (1.35 tons (US short tons)); loose sand generally runs 2,630–2,960 lb/yd³ (Missouri DOT). Damp sand runs about 10–15% heavier than dry sand, wet sand up to about 20% heavier. If your supplier gives a load-ticket figure, enter it.",
    "Choose “Buy as”: bulk by the cubic yard or bags. The shopping list and the cost follow that choice, so the two forms are never added together — the other form stays visible as a labelled alternative with its own cost when you entered its price.",
    "For small jobs, compare the bulk price per yard with the bag price — bags are usually far more expensive per cubic yard. Under about a cubic yard, bags can beat bulk once the delivery fee is counted.",
  ],
  workedExample:
    "A 10 × 10 ft sandbox, 6 in deep: 10 × 10 × 0.5 = 50 ft³ = 1.85 yd³. " +
    "With a 10% waste allowance that is 55 ft³ = 2.04 yd³. " +
    "At 2,700 lb/yd³ (play sand) the 2.037 yd³ required weighs 5,500 lb (2.75 tons (US short tons)), or 110 bags of 0.5 ft³ — bulk to order: 3 yd³, which weighs 8,100 lb (4.05 tons (US short tons)).",
  limitations: [
    "Both the volume and the weight are estimates: loose sand settles and compacts after spreading, moisture changes its volume and its weight, and sand varies by source and gradation. Damp sand runs about 10–15% heavier than dry sand, wet sand up to about 20% heavier. Enter your supplier's load-ticket density when you have it.",
    "Weights here are estimates for ordering only. They do not show whether a vehicle can carry the load — check the vehicle's rated payload (on the driver's door placard) and local transport rules before hauling sand yourself.",
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
        "About 2,700 lb (1.35 tons (US short tons)) for dry sand — the figure implied by QUIKRETE's 50 lb bag yielding about 0.5 ft³. Loose sand generally runs 2,630–2,960 lb/yd³ (Missouri DOT). Damp sand runs about 10–15% heavier than dry sand, wet sand up to about 20% heavier, so the same yard can weigh much more after rain. There is no single official figure — the calculator defaults to 2,700 lb/yd³ (dry sand) and lets you enter your supplier's figure.",
    },
    {
      question: "How many 50 lb bags of sand are in a cubic yard?",
      answer:
        "54 bags. A 50 lb bag is about 0.5 ft³, and a cubic yard is 27 ft³, so 27 ÷ 0.5 = 54 bags — before any waste allowance. With the default 10% allowance, a cubic yard of sand on the ground takes about 60 bags.",
    },
    {
      question: "How much do the bags weigh?",
      answer:
        "Less than the rounded bulk order whenever the bulk order rounds up. For example, a 10 × 10 ft sandbox 4 in deep with 10% waste needs 1.36 yd³ (3,667 lb) and orders 2 yd³ in bulk, which weighs 5,400 lb — but the 74 bags of 0.5 ft³ weigh only about 3,700 lb (1.85 tons (US short tons)) at 2,700 lb/yd³, because the bags cover the 1.36 yd³ required (rounded up to whole bags) while the bulk order rounds up to whole yards. The bagged weight is a density-based estimate (bags × bag size ÷ 27 × density); the bag's stated weight governs — a 50 lb bag is about 0.5 ft³, so 74 × 50 lb = 3,700 lb, consistent with the estimate. At an exact whole-yard requirement the two weights are equal.",
    },
    {
      question: "How deep should play sand be in a sandbox?",
      answer:
        "6 in is the usual depth for a sandbox. Under play equipment, the US Consumer Product Safety Commission's Handbook for Public Playground Safety (Pub. No. 325, Nov 2010, Table 2) lists 9 in of compressed sand as protecting to a 4 ft fall height, and says never to use less than 9 in of loose-fill material (except 6 in for shredded/recycled rubber). Those depths are compressed depths that must be maintained — fresh fill settles, so install deeper and top up. This calculator estimates material only; it does not design playground surfacing — check the CPSC handbook and your equipment manufacturer's guidance.",
    },
    {
      question: "What is the difference between play sand, mason sand, and concrete sand?",
      answer:
        "Play sand is washed and screened for sandboxes; mason sand is fine and uniform for mortar and paver joints; concrete sand is coarser and angular for concrete mixes. The types differ mainly in grain size and use — there is no fixed weight per type. Loose sand generally weighs 2,630–2,960 lb/yd³ (Missouri DOT), and moisture moves the figure more than the type does, so enter your supplier's density.",
    },
    {
      question: "Is it cheaper to buy sand in bulk or in bags?",
      answer:
        "Bulk is almost always cheaper per cubic yard. For example, a 0.5 ft³ bag at $5 works out to about $270 per cubic yard. Bulk prices vary widely by supplier, grade, and delivery distance, so ask your supplier for a delivered quote and compare it with the bag price. Bags make sense only for small jobs where delivery fees would dominate — under about a cubic yard, bags can beat bulk once the delivery fee is counted.",
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
          hint: "Dry sand is about 2,700 lb/yd³; loose sand generally 2,630–2,960 lb/yd³ (Missouri DOT). Damp sand runs about 10–15% heavier.",
        },
      ],
      compute: (v) => sandReverseOutput(v),
    },
  ],
};
