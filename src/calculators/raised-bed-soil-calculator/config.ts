/**
 * Raised Garden Bed Soil Calculator config — soil volume for contained
 * raised beds, with a mix split, a settling allowance, and bag counts.
 * Differs from the Topsoil Calculator on purpose: bed-shaped inputs
 * (inside dimensions, multiple beds, bottom filler), a mix, settling,
 * and depth-by-crop — for ground-level lawns and beds, use Topsoil.
 * See src/lib/formulas/raised-bed-soil.ts and docs/FORMULAS.md §28.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { opt, req } from "../../components/react/CalculatorConfig";
import { calculateRaisedBedSoil } from "../../lib/formulas/raised-bed-soil";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

/**
 * Select values for purchaseMethod. The island stores select values
 * as numbers; 0 is premixed bags, the default. A missing value (e.g.
 * the lookup-table recompute, which passes no purchase method) also
 * means bags.
 */
const PURCHASE_BULK = 1;
const PURCHASE_COMPONENTS = 2;

const PURCHASE_NOTE =
  "Package quantities are always rounded up — you are never told to buy less than you need.";

function raisedBedOutput(
  soilFt3: number,
  v: Record<string, number>,
  present: Set<string>,
  workedLine: string,
  warnings?: string[],
) {
  // opt, not req: the lookup-table recompute passes no purchase
  // method, and a missing value means the default (bags).
  const method = opt(v, "purchaseMethod");
  const isBulk = method === PURCHASE_BULK;
  const isComponents = method === PURCHASE_COMPONENTS;
  const r = calculateRaisedBedSoil({
    soilFt3,
    settlingPct: req(v, "settling"),
    topsoilPct: req(v, "topsoilPct"),
    compostPct: req(v, "compostPct"),
    aerationPct: req(v, "aerationPct"),
    bagSizeFt3: req(v, "bagSize"),
    pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
    purchaseMethod: isBulk ? "bulk" : isComponents ? "components" : "bags",
  });
  // The other premixed form's cost, for the comparison in the row
  // detail only: the headline cost follows the chosen form, never the
  // other one.
  const bulkCost = present.has("pricePerYd3") ? r.orderYd3 * req(v, "pricePerYd3") : undefined;
  const bagCost = present.has("pricePerBag") ? r.bags * req(v, "pricePerBag") : undefined;
  const bulkDetail = isBulk
    ? "Rounded up to whole yards — your purchase method"
    : bulkCost !== undefined
      ? `Rounded up to whole yards. Alternative: ${r.orderYd3} yd³ of premixed soil would cost $${bulkCost.toFixed(2)} at the bulk price you entered — buy one form, not all three.`
      : "Rounded up to whole yards. Alternative — buy one form, not all three.";
  const bagsDetail =
    !isBulk && !isComponents
      ? `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up — your purchase method`
      : bagCost !== undefined
        ? `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up. Alternative: ${r.bags} ${r.bags === 1 ? "bag" : "bags"} of premixed soil would cost $${bagCost.toFixed(2)} at the bag price you entered — buy one form, not all three.`
        : `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up. Alternative — buy one form, not all three.`;
  const mixDetail = isComponents
    ? "Topsoil / compost / perlite, normalized to 100% — buy the three parts separately and mix them"
    : "Topsoil / compost / perlite, normalized to 100% — this is what is in the premixed soil, not a separate purchase";
  // The shopping list carries only the chosen form. For premixed soil
  // the mix is composition, not a purchase, so it stays on the page
  // as a result row and out of the shopping list; for the components
  // choice the three parts ARE the shopping list.
  const lines = isComponents
    ? [
        `Topsoil: ${fmt(r.topsoilFt3)} ft³`,
        `Compost: ${fmt(r.compostFt3)} ft³`,
        `Perlite: ${fmt(r.aerationFt3)} ft³`,
      ]
    : isBulk
      ? [`Raised bed soil (bulk): ${r.orderYd3} yd³`]
      : [`Raised bed soil bags (${fmt(req(v, "bagSize"), 2)} ft³ each): ${r.bags}`];
  const note = isComponents
    ? `Buy one form, not all three — the shopping list contains only the three mix components. The parts have no prices, so no cost is shown for this choice. ${PURCHASE_NOTE}`
    : isBulk
      ? `Buy one form, not all three — the shopping list contains only the bulk order. ${PURCHASE_NOTE}`
      : `Buy one form, not all three — the shopping list contains only the bags. ${PURCHASE_NOTE}`;
  return {
    ...(warnings && warnings.length > 0 ? { warnings } : {}),
    rows: [
      {
        label: "Soil volume",
        value: `${fmt(r.orderedFt3)} ft³`,
        detail: `${fmt(r.orderedYd3)} yd³ (${fmt(r.orderedM3)} m³) with ${fmt(req(v, "settling"), 0)}% settling`,
      },
      {
        label: "Bulk to order",
        value: `${r.orderYd3} yd³`,
        detail: bulkDetail,
      },
      {
        label: "Bags to buy",
        value: `${r.bags} ${r.bags === 1 ? "bag" : "bags"}`,
        detail: bagsDetail,
      },
      {
        label: `Mix (${fmt(req(v, "topsoilPct"), 0)}/${fmt(req(v, "compostPct"), 0)}/${fmt(req(v, "aerationPct"), 0)})`,
        value: `${fmt(r.topsoilFt3)} / ${fmt(r.compostFt3)} / ${fmt(r.aerationFt3)} ft³`,
        detail: mixDetail,
      },
    ],
    lines,
    costUsd: r.costUsd,
    note,
    workedLine,
  };
}

const COMMON_FIELDS = [
  {
    id: "settling",
    label: "Settling allowance",
    kind: "percent" as const,
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% covers first-season settling. A freshly filled bed settles — UF/IFAS Extension says the level may drop by about 2 in — and keeps shrinking, so top up after each planting season.",
  },
  {
    id: "topsoilPct",
    label: "Topsoil (%)",
    kind: "percent" as const,
    defaultImp: "60",
    defaultMet: "60",
    hint: "Mix proportions are adjustable — 60/30/10 topsoil/compost/perlite is one extension-published starting point (Univ. of Illinois Extension), not a universal recipe. The calculator normalizes the three figures so they always add to 100%.",
  },
  {
    id: "compostPct",
    label: "Compost (%)",
    kind: "percent" as const,
    defaultImp: "30",
    defaultMet: "30",
    hint: "Compost adds nutrients and water retention. The three mix figures are normalized to 100%.",
  },
  {
    id: "aerationPct",
    label: "Perlite or coarse sand (%)",
    kind: "percent" as const,
    defaultImp: "10",
    defaultMet: "10",
    hint: "Perlite, pumice, or coarse sand keeps the mix from compacting. The three mix figures are normalized to 100%.",
  },
  {
    id: "bagSize",
    label: "Bag size (ft³)",
    kind: "number" as const,
    defaultImp: "2",
    defaultMet: "2",
    min: 0.1,
    hint: "1.5 or 2 ft³ bags are common. Read your bag.",
  },
  {
    id: "purchaseMethod",
    label: "Buy as",
    kind: "select" as const,
    defaultImp: "0",
    defaultMet: "0",
    options: [
      { value: "0", label: "Premixed soil — bags" },
      { value: "1", label: "Premixed soil — bulk" },
      { value: "2", label: "Mix components separately" },
    ],
    hint: "Choose how you will buy it: premixed soil in bags or in bulk, or the topsoil, compost, and perlite separately to mix yourself. The shopping list and the cost follow this choice.",
  },
  {
    id: "pricePerYd3",
    label: "Price per cubic yard (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    hint: "Used only when “Buy as” is premixed soil in bulk.",
  },
  {
    id: "pricePerBag",
    label: "Price per bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    hint: "Used only when “Buy as” is premixed soil in bags.",
  },
];

export const raisedBedSoilConfig: CalculatorConfig = {
  slug: "raised-bed-soil-calculator",
  designCplus: true,
  heroResultLabel: "Bags to buy",
  lookupTable: {
    note: "Assumes 10% settling, a 60/30/10 topsoil/compost/perlite mix, and 2 ft³ bags.",
    headers: [
      "Bed (L × W × fill depth)",
      "Soil volume",
      "Bulk to order",
      "Bags to buy",
      "Mix (60/30/10)",
    ],
    rows: [
      ["4 × 4 × 10 in bed", "14.67 ft³", "1 yd³", "8 bags", "8.8 / 4.4 / 1.47 ft³"],
      ["4 × 8 × 10 in bed", "29.33 ft³", "2 yd³", "15 bags", "17.6 / 8.8 / 2.93 ft³"],
      ["4 × 8 × 12 in bed", "35.2 ft³", "2 yd³", "18 bags", "21.12 / 10.56 / 3.52 ft³"],
      ["8 × 8 × 10 in bed", "58.67 ft³", "3 yd³", "30 bags", "35.2 / 17.6 / 5.87 ft³"],
      ["2 beds of 4 × 4 × 10 in", "29.33 ft³", "2 yd³", "15 bags", "17.6 / 8.8 / 2.93 ft³"],
    ],
  },
  diagram: "volume",
  defaultMode: "bed",
  formula:
    "Soil volume = inside length × inside width × fill depth × number of beds, " +
    "minus any bottom filler. Ordered volume = soil volume × (1 + settling allowance). " +
    "Cubic yards = cubic feet ÷ 27; bulk is ordered by the whole cubic yard, rounded up. " +
    "Bags = ordered volume ÷ bag size, rounded up. The mix splits the ordered volume: " +
    "60% topsoil / 30% compost / 10% perlite (or coarse sand) by default — a commonly " +
    "published starting point, not a universal recipe — and the three proportions are " +
    "normalized so they always add to 100%. Cost follows the “Buy as” " +
    "choice: premixed soil in bulk is priced at the bulk price per " +
    "cubic yard, premixed soil in bags at the bag price — a buyer buys " +
    "one form, not all three. Buying the mix components separately has " +
    "no cost here, because the parts carry no prices. No cost is shown " +
    "when the price for the chosen form is not entered.",
  howTo: [
    "Measure the INSIDE dimensions of the bed in feet — the wood thickness does not hold soil.",
    "Decide the fill depth: the soil depth, not the bed height. Fill to near the top — UF/IFAS Extension advises filling to the very top, since the level drops about 2 in as it settles — and leave room for mulch on top. Most vegetables need 8–12 in of soil; tomatoes, peppers, and squash need 12–24 in (Univ. of Maryland Extension).",
    "Subtract bottom filler if you use any — logs, branches, or straw under the soil displace it. Leave the filler field empty when there is none.",
    "Count the beds: identical beds multiply the volume, so enter how many you are filling.",
    "Check the mix: 60/30/10 topsoil/compost/perlite is a common starting point, but adjust it to your soil and plants — the calculator normalizes the three figures to 100%.",
    "Choose “Buy as”: premixed soil in bags, premixed soil in bulk, or the three mix components separately to mix yourself. The shopping list and the cost follow that choice, so the forms are never added together — the other forms stay visible as labelled alternatives.",
  ],
  workedExample:
    "A 4 × 8 ft bed, 10 in of soil: 8 × 4 × 10/12 = 26.67 ft³ = 0.99 yd³. " +
    "With a 10% settling allowance that is 29.33 ft³ = 1.09 yd³. " +
    "At a 60/30/10 mix that is 17.6 ft³ of topsoil, 8.8 ft³ of compost, and 2.93 ft³ of perlite — or 15 bags of 2 ft³. Bulk to order: 2 yd³.",
  limitations: [
    "The 60/30/10 mix is a starting point, not a prescription — soil, compost, and perlite vary by supplier, extension services publish different starting points for the same job, and some growers use no perlite at all. Adjust the proportions to your soil and plants.",
    "Settling is an assumption, not a measurement: a freshly filled bed settles (UF/IFAS Extension: the level may drop by about 2 in) and keeps shrinking as the organic matter breaks down. Top the beds up after each planting season rather than over-ordering in spring.",
    "Does not account for soil removed by digging or for a drainage layer — the volume here is the soil in the bed only.",
    "Bottom filler (logs, branches, straw — hugelkultur-style) is only suitable in deep beds (at least 18 in, as a general gardening rule — no extension source gives the depth). Buried wood ties up nitrogen as it breaks down, because woody material mixed into the root zone draws on soil nitrogen while it decomposes, and the bed settles further, so expect to top up more in the first year.",
    [
      { text: "For ground-level lawns and beds, use the " },
      { text: "Topsoil Calculator", calc: "topsoil-calculator" },
      { text: " — this calculator is for contained beds with a mix, settling, and filler." },
    ],
  ],
  faqs: [
    {
      question: "How much soil do I need for a 4×8 raised bed?",
      answer:
        "At 10 in of soil, a 4 × 8 ft bed holds 26.67 ft³ (0.99 yd³). With the default 10% settling allowance that is 29.33 ft³ (1.09 yd³) — 15 bags of 2 ft³, or 2 cubic yards in bulk. At 12 in deep it is 32 ft³ before settling, 35.2 ft³ after, or 18 bags.",
    },
    {
      question: "How deep should I fill a raised bed?",
      answer:
        "8–12 in of soil suits most vegetables; tomatoes, peppers, and squash need 12–24 in (Univ. of Maryland Extension). Fill depth is the soil depth, not the bed height — fill to near the top (UF/IFAS Extension: the level drops about 2 in as it settles) and leave room for mulch.",
    },
    {
      question: "What mix should I use for a raised bed?",
      answer:
        "Univ. of Illinois Extension's raised-bed checklist gives 60% topsoil, 30% compost, and 10% soilless mix as one example — but it is not the only extension formula: Univ. of Maryland Extension gives compost and topsoil at 1:2 or 1:1 for a bed on lawn, and Iowa State gives equal parts topsoil, organic matter, and coarse sand, or about 70% topsoil and 30% compost. The proportions are adjustable here. Some growers skip the perlite; others raise the compost share. The calculator normalizes whatever you enter to 100%.",
    },
    {
      question: "How much does raised bed soil settle?",
      answer:
        "A freshly filled bed settles — UF/IFAS Extension says the level may drop by about 2 in — and keeps shrinking over time as the organic matter breaks down. The calculator defaults to a 10% settling allowance — top the beds up after each planting season rather than over-ordering in spring.",
    },
    {
      question: "Raised bed calculator or topsoil calculator — which one?",
      answer:
        "Use this calculator for contained beds: it takes inside dimensions, counts multiple beds, subtracts bottom filler, splits a mix, and adds a settling allowance. Use the Topsoil Calculator for ground-level lawns and beds, where the area is flat and there is no mix or filler to account for.",
    },
    {
      question: "Can I fill the bottom of a raised bed with logs and branches?",
      answer:
        "Yes, in deep beds — at least 18 in, as a general gardening rule — logs, branches, and straw under the soil (hugelkultur-style) displace soil and slowly break down. It is not free: buried wood ties up nitrogen as it decomposes, and the bed settles further, so expect to top up more in the first year. Enter the filler depth and the calculator subtracts it from the soil volume.",
    },
  ],
  modes: [
    {
      id: "bed",
      label: "One or more beds",
      fields: [
        {
          id: "length",
          label: "Inside length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "8",
          defaultMet: "2.44",
        },
        {
          id: "width",
          label: "Inside width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "4",
          defaultMet: "1.22",
        },
        {
          id: "fillDepth",
          label: "Fill depth (soil depth)",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "ft",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "10",
          defaultMet: "25",
          hint: "Soil depth, not bed height: 8–12 in for most vegetables, 12–24 in for tomatoes, peppers, and squash (Univ. of Maryland Extension). Fill to near the top; the level drops about 2 in as it settles (UF/IFAS Extension).",
        },
        {
          id: "fillerDepth",
          label: "Bottom filler depth (optional)",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "ft",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          min: 0,
          hint: "Logs, branches, or straw under the soil that displaces it. Leave empty for none. Only for deep beds (at least 18 in).",
        },
        {
          id: "beds",
          label: "Number of beds",
          kind: "count",
          defaultImp: "1",
          defaultMet: "1",
          hint: "Identical beds — enter how many you are filling.",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const netDepthFt = req(v, "fillDepth") - opt(v, "fillerDepth");
        const beds = req(v, "beds");
        const soilFt3 = req(v, "length") * req(v, "width") * Math.max(netDepthFt, 0) * beds;
        const workedLine =
          `${fmt(req(v, "length"))} × ${fmt(req(v, "width"))} × ${fmt(netDepthFt, 3)} ft × ${fmt(beds, 0)} bed${beds === 1 ? "" : "s"} = ${fmt(soilFt3)} ft³` +
          ` × ${fmt(100 + req(v, "settling"), 0)}% = ${fmt(soilFt3 * (1 + req(v, "settling") / 100))} ft³.`;
        return raisedBedOutput(
          soilFt3,
          v,
          present,
          workedLine,
          netDepthFt <= 0
            ? ["The filler depth is equal to or greater than the fill depth, so no soil is needed."]
            : undefined,
        );
      },
    },
    {
      id: "volume",
      label: "Known volume",
      fields: [
        {
          id: "volume",
          label: "Soil volume (before settling)",
          kind: "volume",
          unitKind: "volume",
          canonicalUnit: "ft3",
          impUnit: "yd3",
          metUnit: "m3",
          defaultImp: "1",
          defaultMet: "0.76",
          hint: "Enter the soil volume from your plan, or switch to beds to measure it.",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const workedLine =
          `${fmt(req(v, "volume"))} ft³ × ${fmt(100 + req(v, "settling"), 0)}% = ` +
          `${fmt(req(v, "volume") * (1 + req(v, "settling") / 100))} ft³.`;
        return raisedBedOutput(req(v, "volume"), v, present, workedLine);
      },
    },
  ],
};
