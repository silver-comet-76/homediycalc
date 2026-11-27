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

function raisedBedOutput(
  soilFt3: number,
  v: Record<string, number>,
  present: Set<string>,
  workedLine: string,
  warnings?: string[],
) {
  const r = calculateRaisedBedSoil({
    soilFt3,
    settlingPct: req(v, "settling"),
    topsoilPct: req(v, "topsoilPct"),
    compostPct: req(v, "compostPct"),
    aerationPct: req(v, "aerationPct"),
    bagSizeFt3: req(v, "bagSize"),
    pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
  });
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
        detail: "Rounded up to whole yards",
      },
      {
        label: "Bags to buy",
        value: `${r.bags} ${r.bags === 1 ? "bag" : "bags"}`,
        detail: `${fmt(req(v, "bagSize"), 2)} ft³ per bag — rounded up`,
      },
      {
        label: `Mix (${fmt(req(v, "topsoilPct"), 0)}/${fmt(req(v, "compostPct"), 0)}/${fmt(req(v, "aerationPct"), 0)})`,
        value: `${fmt(r.topsoilFt3)} / ${fmt(r.compostFt3)} / ${fmt(r.aerationFt3)} ft³`,
        detail: "Topsoil / compost / perlite, normalized to 100%",
      },
    ],
    lines: [
      `Raised bed soil (bulk): ${r.orderYd3} yd³`,
      `Raised bed soil bags (${fmt(req(v, "bagSize"), 2)} ft³ each): ${r.bags}`,
      `Mix: ${fmt(r.topsoilFt3)} ft³ topsoil, ${fmt(r.compostFt3)} ft³ compost, ${fmt(r.aerationFt3)} ft³ perlite`,
    ],
    costUsd: r.costUsd,
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
    hint: "10% covers first-season settling. Beds can lose 10–20% of their height in the first season — top up in fall.",
  },
  {
    id: "topsoilPct",
    label: "Topsoil (%)",
    kind: "percent" as const,
    defaultImp: "60",
    defaultMet: "60",
    hint: "Mix proportions are adjustable — 60/30/10 topsoil/compost/perlite is a commonly published starting point, not a universal recipe. The calculator normalizes the three figures so they always add to 100%.",
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
    id: "pricePerYd3",
    label: "Price per cubic yard (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
  {
    id: "pricePerBag",
    label: "Price per bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
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
    "normalized so they always add to 100%. Cost uses the bulk price when entered (bulk " +
    "wins when both a bulk and a bag price are entered — a buyer buys bulk or bags, never " +
    "both); otherwise the bag price.",
  howTo: [
    "Measure the INSIDE dimensions of the bed in feet — the wood thickness does not hold soil.",
    "Decide the fill depth: the soil depth, not the bed height. Leave about 2 in of freeboard at the top so water and mulch stay in. Most vegetables need 8–12 in of soil; tomatoes and carrots need 12–18 in.",
    "Subtract bottom filler if you use any — logs, branches, or straw under the soil displace it. Leave the filler field empty when there is none.",
    "Count the beds: identical beds multiply the volume, so enter how many you are filling.",
    "Check the mix: 60/30/10 topsoil/compost/perlite is a common starting point, but adjust it to your soil and plants — the calculator normalizes the three figures to 100%.",
  ],
  workedExample:
    "A 4 × 8 ft bed, 10 in of soil: 8 × 4 × 10/12 = 26.67 ft³ = 0.99 yd³. " +
    "With a 10% settling allowance that is 29.33 ft³ = 1.09 yd³. " +
    "At a 60/30/10 mix that is 17.6 ft³ of topsoil, 8.8 ft³ of compost, and 2.93 ft³ of perlite — or 15 bags of 2 ft³. Bulk to order: 2 yd³.",
  limitations: [
    "The 60/30/10 mix is a starting point, not a prescription — soil, compost, and perlite vary by supplier, and some growers use no perlite at all. Adjust the proportions to your soil and plants.",
    "Settling is an assumption, not a measurement: beds commonly lose 10–20% of their height in the first season. Top the beds up in fall rather than over-ordering in spring.",
    "Does not account for soil removed by digging or for a drainage layer — the volume here is the soil in the bed only.",
    "Bottom filler (logs, branches, straw — hugelkultur-style) is only suitable in beds at least 18 in deep. It ties up nitrogen as it breaks down and settles further, so expect to top up more in the first year.",
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
        "8–12 in of soil suits most vegetables; tomatoes and carrots need 12–18 in. Fill depth is the soil depth, not the bed height — leave about 2 in of freeboard at the top so water and mulch stay in the bed.",
    },
    {
      question: "What mix should I use for a raised bed?",
      answer:
        "A commonly published starting point is 60% topsoil, 30% compost, and 10% perlite (or coarse sand) — but it is not the only reputable formula, and the proportions are adjustable here. Some growers skip the perlite; others raise the compost share. The calculator normalizes whatever you enter to 100%.",
    },
    {
      question: "How much does raised bed soil settle?",
      answer:
        "Beds commonly lose 10–20% of their height in the first season as the mix settles and decomposes. The calculator defaults to a 10% settling allowance — top the beds up in fall rather than over-ordering in spring.",
    },
    {
      question: "Raised bed calculator or topsoil calculator — which one?",
      answer:
        "Use this calculator for contained beds: it takes inside dimensions, counts multiple beds, subtracts bottom filler, splits a mix, and adds a settling allowance. Use the Topsoil Calculator for ground-level lawns and beds, where the area is flat and there is no mix or filler to account for.",
    },
    {
      question: "Can I fill the bottom of a raised bed with logs and branches?",
      answer:
        "Yes, in beds at least 18 in deep — logs, branches, and straw under the soil (hugelkultur-style) displace soil and slowly break down. It is not free: the wood ties up nitrogen as it decomposes, and the bed settles further, so expect to top up more in the first year. Enter the filler depth and the calculator subtracts it from the soil volume.",
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
          hint: "Soil depth, not bed height: 8–12 in for most vegetables, 12–18 in for tomatoes and carrots. Leave 2 in of freeboard at the top.",
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
          hint: "Logs, branches, or straw under the soil that displaces it. Leave empty for none. Only for beds at least 18 in deep.",
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
