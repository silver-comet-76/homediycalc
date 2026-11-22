/**
 * Tile Adhesive Calculator config — thinset bags for a tiled area.
 * See src/lib/formulas/tile-adhesive.ts and docs/FORMULAS.md §20.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateTileAdhesive } from "../../lib/formulas/tile-adhesive";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function adhesiveOutput(areaFt2: number, v: Record<string, number>, present: Set<string>) {
  const r = calculateTileAdhesive({
    areaFt2,
    coveragePer50LbBagFt2: req(v, "trowel"),
    bagWeightLb: req(v, "bagWeight"),
    backButter: req(v, "backButter") === 1,
    wastePct: req(v, "waste"),
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
  });
  return {
    rows: [
      {
        label: "Adhesive needed",
        value: `${fmt(r.adhesiveLb, 1)} lb`,
        detail: `${fmt(areaFt2)} ft² with ${fmt(req(v, "waste"), 0)}% waste${req(v, "backButter") === 1 ? ", back-buttered" : ""}`,
      },
      {
        label: "Coverage per bag",
        value: `${fmt(r.effectiveCoverageFt2PerBag, 1)} ft²/bag`,
        detail: `${fmt(req(v, "bagWeight"), 0)} lb bags at the trowel notch you picked`,
      },
      {
        label: "Bags to buy",
        value: `${r.bags} bags`,
        detail: `${fmt(req(v, "bagWeight"), 0)} lb bags — rounded up`,
      },
    ],
    lines: [
      `Tile adhesive (thinset, ${fmt(req(v, "bagWeight"), 0)} lb bags): ${r.bags} bags (${fmt(r.adhesiveLb, 1)} lb)`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${fmt(r.effectiveCoverageFt2PerBag, 1)} ft²/bag = ${fmt(r.adhesiveLb / req(v, "bagWeight"), 2)} bags → buy ${r.bags} bags.`,
    note: "Coverage is the low end of the CUSTOM VersaBond chart for your trowel notch. Check the bag you buy — lightweight mortars cover more, and an uneven substrate covers less.",
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "trowel",
    label: "Trowel notch",
    kind: "select",
    defaultImp: "90",
    defaultMet: "90",
    options: [
      { value: "95", label: "3/16 in V-notch — mosaic, small wall tile (95 ft²/bag)" },
      { value: "90", label: "1/4 × 1/4 in square — tile up to 8 in (90 ft²/bag)" },
      { value: "60", label: "1/4 × 3/8 in square — 8 to 15 in tile (60 ft²/bag)" },
      { value: "42", label: "1/2 × 1/2 in square — large format, over 15 in (42 ft²/bag)" },
      { value: "34", label: "3/4 in U-notch at 45° — slabs, stone (34 ft²/bag)" },
    ],
    hint: "Coverage per 50 lb bag, low end of the CUSTOM VersaBond chart (TDS-119). Bigger tile needs a deeper notch — and a deeper notch covers far fewer square feet per bag.",
  },
  {
    id: "bagWeight",
    label: "Bag weight (lb)",
    kind: "number",
    defaultImp: "50",
    defaultMet: "50",
    min: 1,
    hint: "Thinset is usually sold in 50 lb bags; some lightweight mortars come in 25–30 lb bags. Coverage scales with the bag weight.",
  },
  {
    id: "backButter",
    label: "Back-buttering",
    kind: "select",
    defaultImp: "0",
    defaultMet: "0",
    options: [
      { value: "0", label: "No — standard application" },
      { value: "1", label: "Yes — back-butter the tile (+35% adhesive)" },
    ],
    hint: "Back-butter tile over 15 in and all wet or exterior installs. It adds about 35% to the adhesive used (estimating guidance).",
  },
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent",
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% covers what stays in the bucket, on the trowel, and in the joints. Use 15% on an uneven substrate.",
  },
  {
    id: "pricePerBag",
    label: "Price per bag (optional)",
    kind: "price",
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const tileAdhesiveConfig: CalculatorConfig = {
  slug: "tile-adhesive-calculator",
  diagram: "area",
  defaultMode: "dimensions",
  formula:
    "Bags = tiled area × (1 + waste%) ÷ coverage per bag, rounded up. " +
    "Coverage is set by the trowel notch, not the tile: a 50 lb bag of CUSTOM VersaBond covers 90–100 ft² with a 1/4 × 1/4 in square notch, " +
    "60–67 ft² with a 1/4 × 3/8 in notch, and 42–47 ft² with a 1/2 × 1/2 in notch (TDS-119). The calculator uses the low end of each range, " +
    "scales it by the bag weight you buy, and adds about 35% when you back-butter.",
  howTo: [
    "Measure the tiled area in square feet — the same area you used for the Tile Calculator.",
    "Pick the trowel notch for your tile size: 3/16 in V-notch for mosaic, 1/4 × 1/4 in square for tile up to 8 in, 1/4 × 3/8 in for 8 to 15 in, 1/2 × 1/2 in for large format over 15 in.",
    "Back-butter tile over 15 inches and all wet or exterior installs — spread a skim coat on the tile back as well as the floor. It uses about 35% more adhesive.",
    "Check the coverage printed on the bag you buy. Lightweight mortars cover more per pound, and an uneven substrate eats coverage fast.",
    "Lift a tile after setting the first few: the mortar should cover at least 80% of the tile back in dry areas and 95% in wet areas (TCNA).",
  ],
  workedExample:
    "100 ft² of floor tile with a 1/4 × 1/4 in square-notch trowel: at 90 ft² per 50 lb bag and 10% waste, " +
    "100 × 1.10 ÷ 90 = 1.22 bags, so buy 2 bags (100 lb). With a 1/2 × 1/2 in notch the same floor needs 6 bags.",
  limitations: [
    "Coverage figures are the low ends of CUSTOM's VersaBond chart for one product. Other brands, modified vs. unmodified mortars, and lightweight mixes cover differently — the coverage on your bag is the final word.",
    "An uneven substrate, a heavily ridged tile back, or 95% coverage in a wet area can pull coverage 10–20% below the chart. The waste allowance only partly covers this.",
    "Does not include grout (see the Grout Calculator), backer board, or the thinset used to set the backer board itself.",
    "Mixed thinset cannot be stored — buy whole bags and mix only what you can set before it skins over.",
  ],
  faqs: [
    {
      question: "How many square feet does a 50 lb bag of thinset cover?",
      answer:
        "It depends on the trowel notch: about 90–100 ft² with a 1/4 × 1/4 in square notch, 60–67 ft² with a 1/4 × 3/8 in notch, and 42–47 ft² with a 1/2 × 1/2 in notch (CUSTOM VersaBond chart). A 3/16 in V-notch for mosaic covers about 95 ft². Back-buttering cuts each figure by about a third.",
    },
    {
      question: "What size trowel do I need for 12 × 12 inch tile?",
      answer:
        "A 1/4 × 1/4 in square-notch trowel is the standard choice for 12 × 12 in floor tile, giving about 90 ft² per 50 lb bag. Once tile passes 15 inches, step up to a 1/2 × 1/2 in notch and back-butter the tile.",
    },
    {
      question: "Do I need to back-butter my tile?",
      answer:
        "Yes for tile over 15 inches on any side, and for all wet areas (showers, exteriors) where TCNA wants 95% mortar contact. Back-buttering adds about 35% to the adhesive used, which this calculator applies when you select it.",
    },
  ],
  modes: [
    {
      id: "dimensions",
      label: "Room dimensions",
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
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => adhesiveOutput(req(v, "length") * req(v, "width"), v, present),
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        {
          id: "area",
          label: "Tiled area",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "100",
          defaultMet: "9.29",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => adhesiveOutput(req(v, "area"), v, present),
    },
  ],
};
