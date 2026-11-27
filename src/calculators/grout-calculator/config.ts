/**
 * Grout Calculator config — grout weight and bags for a tiled area.
 * Companion to the Tile Calculator (which counts tiles): grout fills
 * the joints, so it depends on tile size, joint width, and joint depth.
 * See src/lib/formulas/grout.ts and docs/FORMULAS.md §16.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateGrout } from "../../lib/formulas/grout";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function groutOutput(areaFt2: number, v: Record<string, number>, present: Set<string>) {
  const r = calculateGrout({
    areaFt2,
    tileLengthIn: req(v, "tileLength"),
    tileWidthIn: req(v, "tileWidth"),
    jointWidthIn: req(v, "jointWidth"),
    jointDepthIn: req(v, "jointDepth"),
    groutDensityLbFt3: req(v, "density"),
    bagWeightLb: req(v, "bagWeight"),
    wastePct: req(v, "waste"),
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
  });
  return {
    rows: [
      {
        label: "Grout per square foot",
        value: `${fmt(r.groutLbPerFt2, 3)} lb/ft²`,
        detail: `${fmt(req(v, "tileLength"), 2)} × ${fmt(req(v, "tileWidth"), 2)} in tile, ${fmt(req(v, "jointWidth"), 3)} in joints`,
      },
      {
        label: "Grout needed",
        value: `${fmt(r.groutLb, 1)} lb`,
        detail: `${fmt(areaFt2)} ft² with ${fmt(req(v, "waste"), 0)}% extra for waste and sponge loss`,
      },
      {
        label: "Bags needed",
        value: `${r.bags} bags`,
        detail: `${fmt(req(v, "bagWeight"), 0)} lb bags — rounded up`,
      },
    ],
    lines: [
      `Grout (${fmt(req(v, "bagWeight"), 0)} lb bags): ${r.bags} bags (${fmt(r.groutLb, 1)} lb)`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(r.groutLbPerFt2, 4)} lb/ft² × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.groutLb, 1)} lb → ${r.bags} × ${fmt(req(v, "bagWeight"), 0)} lb bags.`,
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "tileLength",
    label: "Tile length",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    defaultImp: "12",
    defaultMet: "30.5",
    allowUnitSelect: true,
    unitOptions: ["in", "cm", "mm"],
  },
  {
    id: "tileWidth",
    label: "Tile width",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    defaultImp: "12",
    defaultMet: "30.5",
    allowUnitSelect: true,
    unitOptions: ["in", "cm", "mm"],
  },
  {
    id: "jointWidth",
    label: "Joint width",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    min: 0,
    defaultImp: "0.125",
    defaultMet: "0.32",
    hint: "1/8 in (0.125 in) is common for floors. Under 1/8 in usually calls for unsanded grout.",
  },
  {
    id: "jointDepth",
    label: "Joint depth",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    defaultImp: "0.375",
    defaultMet: "0.95",
    hint: "Usually the tile thickness — 3/8 in for standard floor tile, 1/4 in for mosaic.",
  },
  {
    id: "density",
    label: "Grout density (lb per ft³)",
    kind: "number",
    defaultImp: "98.5",
    defaultMet: "98.5",
    min: 1,
    hint: "98.5 lb/ft³ reproduces the MAPEI Ultracolor Plus FA chart to within 2%. CUSTOM Polyblend Plus sanded implies about 110 lb/ft³. Premixed, urethane, and epoxy grouts cover differently — use their own charts.",
  },
  {
    id: "bagWeight",
    label: "Bag weight (lb)",
    kind: "number",
    defaultImp: "10",
    defaultMet: "10",
    min: 1,
    hint: "Grout is commonly sold in 10 lb and 25 lb bags. Enter the size on your bag.",
  },
  {
    id: "waste",
    label: "Extra allowance",
    kind: "percent",
    defaultImp: "10",
    defaultMet: "10",
    hint: "10% covers what stays on the float, in the bucket, and in the sponge. Use 15% for mosaic or very small tile.",
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

export const groutConfig: CalculatorConfig = {
  slug: "grout-calculator",
  designCplus: true,
  heroResultLabel: "Bags needed",
  lookupTable: {
    note: "Assumes 12 × 12 in tiles, a ⅛ in wide by ⅜ in deep joint, grout at 98.5 lb/ft³, 10 lb bags, and 10% waste.",
    headers: ["Room size", "Grout per square foot", "Grout needed", "Bags needed"],
    rows: [
      ["5 × 8 ft room", "0.064 lb/ft²", "2.8 lb", "1 bags"],
      ["10 × 10 ft room", "0.064 lb/ft²", "7.1 lb", "1 bags"],
      ["10 × 12 ft room", "0.064 lb/ft²", "8.5 lb", "1 bags"],
      ["12 × 15 ft room", "0.064 lb/ft²", "12.7 lb", "2 bags"],
      ["15 × 20 ft room", "0.064 lb/ft²", "21.2 lb", "3 bags"],
    ],
  },
  diagram: "area",
  defaultMode: "dimensions",
  formula:
    "Grout fills the joints to the tile's depth, so the weight per square " +
    "foot is: (tile length + tile width) ÷ (tile length × tile width) × " +
    "joint width × joint depth × 144 × density ÷ 1,728. Total grout = area " +
    "× lb/ft² × (1 + extra%), then bags = grout ÷ bag weight, rounded up. " +
    "Density defaults to 98.5 lb/ft³ (MAPEI Ultracolor Plus FA); a 10 lb " +
    "bag covers 156 ft² of 12 × 12 in tile with ⅛ in joints.",
  howTo: [
    [
      { text: "Measure the tiled area in feet — the same area you used for the " },
      { text: "Tile Calculator", calc: "tile-calculator" },
      { text: "." },
    ],
    "Measure one tile in inches — length and width — and note its thickness, which is usually the joint depth.",
    "Choose the joint width: 1/8 in is common for floors, 3/16 in for walls and non-rectified tile. Joints under 1/8 in usually call for unsanded grout.",
    "Pick the bag size on the grout you are buying — 10 lb and 25 lb bags are common. Small tile and wide joints need much more grout per square foot than large tile.",
  ],
  workedExample:
    "100 ft² of 12 × 12 in tile, ⅜ in thick, with ⅛ in joints: " +
    "the joint volume is 1.125 in³ per ft², or 0.064 lb/ft² at 98.5 lb/ft³. " +
    "That is 6.4 lb, or 7.1 lb with 10% extra — one 10 lb bag covers the whole floor.",
  limitations: [
    "The density default matches MAPEI Ultracolor Plus FA sanded grout. Other grouts — premixed, urethane, epoxy, and unsanded — have different densities and coverage; the coverage chart on your bag is the final word.",
    "Assumes the joints are filled to the full tile thickness. In practice the grout sits slightly below the tile surface, so the estimate is a little conservative.",
    "Does not include grout sealer, spacers, or the tile adhesive (thinset) underneath — thinset is sized by trowel notch, not tile size.",
    "Small tile is grout-hungry: a 2 × 2 in mosaic needs about six times as much grout per square foot as 12 × 12 in tile at the same joint width.",
  ],
  depthSections: [
    {
      id: "how-grout-is-calculated",
      heading: "How grout is actually calculated (and why tile size matters more than area)",
      takeaway:
        "Grout fills the joints, so the amount depends on how much joint there is per square foot — tile size matters more than area. A 12×12 in tile with ⅛ in joints ⅜ in deep needs 0.064 lb of grout per square foot (at the default density of 98.5 lb/ft³); a 2×2 in mosaic at the same joint width needs about six times as much per square foot. “How much grout for 100 square feet” has no single answer — measure the tile, the joint width, and the joint depth (usually the tile thickness) first, and use the same tiled area as the Tile Calculator.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: 'Grout fills the joints, so the amount depends on how much joint there is per square foot — and that depends on the tile size, not just the area: smaller tiles have more joints per square foot, wider joints hold more grout, and thicker tiles have deeper joints to fill. A 12×12 in tile with ⅛ in joints ⅜ in deep needs 0.064 lb of grout per square foot (at the calculator\'s default density of 98.5 lb/ft³). A 2×2 in mosaic at the same joint width needs about six times as much per square foot, because it has roughly six times as much joint. That is why "how much grout for 100 square feet" has no single answer: the area is only one of four inputs, and the tile size is the one that moves the answer most. Measure the tile, the joint width, and the joint depth (usually the tile thickness) before trusting any grout number, and use the same tiled area you used for the ',
            },
            { text: "Tile Calculator", calc: "tile-calculator" },
            { text: "." },
          ],
        },
      ],
    },
    {
      id: "grout-per-100-square-feet",
      heading: "Grout per 100 square feet, by tile size (MAPEI Ultracolor Plus FA basis)",
      takeaway:
        "Grout per 100 ft² at the calculator’s defaults (⅛ in joints, ⅜ in depth — ¼ in for the 2×2 mosaic — density 98.5 lb/ft³, 10% extra), in 10 lb bags: 2×2 in mosaic 28.2 lb (3 bags); 4¼×4¼ in 19.9 lb (2); 6×24 in 8.8 lb (1); 12×12 in 7.1 lb (1); 12×24 in 5.3 lb (1); 18×18 in 4.7 lb (1); 24×24 in 3.5 lb (1). The 12×12 row is the worked example on this page. The 2×2 row assumes ¼ in depth — at ⅜ in it would need 42.3 lb, so state the tile thickness when comparing figures. Wider joints scale in proportion: at 3/16 in joints, 12×12 needs 0.096 lb/ft² (10.6 lb per 100 ft² with waste); at ¼ in, 0.128 lb/ft² (14.1 lb).",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: 'The table below uses the calculator\'s own formula at its defaults — ⅛ in joints, ⅜ in joint depth (¼ in for the 2×2 mosaic, which is the mosaic thickness), density 98.5 lb/ft³, 10% extra — so every row is what the calculator itself would return for 100 ft². The "bags" column is 10 lb bags, rounded up.',
            },
          ],
        },
        {
          type: "table",
          headers: [
            "Tile size",
            "Grout per ft²",
            "Grout for 100 ft² (with 10% extra)",
            "10 lb bags",
          ],
          rows: [
            ["2 × 2 in mosaic (¼ in deep)", "0.257 lb/ft²", "28.2 lb", "3"],
            ["4¼ × 4¼ in", "0.181 lb/ft²", "19.9 lb", "2"],
            ["6 × 24 in", "0.080 lb/ft²", "8.8 lb", "1"],
            ["12 × 12 in", "0.064 lb/ft²", "7.1 lb", "1"],
            ["12 × 24 in", "0.048 lb/ft²", "5.3 lb", "1"],
            ["18 × 18 in", "0.043 lb/ft²", "4.7 lb", "1"],
            ["24 × 24 in", "0.032 lb/ft²", "3.5 lb", "1"],
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "The 12×12 row is the worked example already on this page (7.1 lb, one bag). The 2×2 row is the existing FAQ's mosaic answer (about 28 lb, three bags) — the depth matters: the same mosaic at ⅜ in depth would need 42.3 lb, not 28 lb, so state the tile thickness when you compare grout figures. If your joint is wider, scale up in proportion to the width: at 3/16 in joints, 12×12 tile needs 0.096 lb/ft² (10.6 lb per 100 ft² with waste); at ¼ in joints, 0.128 lb/ft² (14.1 lb per 100 ft² with waste).",
            },
          ],
        },
      ],
    },
    {
      id: "manufacturer-coverage-charts",
      heading: "Manufacturer coverage charts: the same floor, two different answers",
      takeaway:
        "Grout is sold by weight and different grouts weigh different amounts per cubic foot, so two manufacturers’ charts can differ for the same floor and both be right for their own product. The default density 98.5 lb/ft³ reproduces the MAPEI Ultracolor Plus FA chart to within 2% (a 10 lb bag covers about 156 ft² of 12×12 in tile with ⅛ in joints). CUSTOM’s Polyblend Plus implies about 110 lb/ft³ — roughly 12% heavier — so the same floor needs about 12% more pounds. CUSTOM’s own chart (TDS-360, 3/22/2023) states coverage per 25 lb bag directly and is the better source for that product. Read the chart for the product you buy and set the calculator’s density to match; do not mix the two products’ figures.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "Grout is sold by weight, and different grouts weigh different amounts per cubic foot, so two manufacturers' charts can give different answers for the same floor and both can be right for their own product. The calculator's default density, 98.5 lb/ft³, reproduces the MAPEI Ultracolor Plus FA chart to within 2% (a 10 lb bag covers about 156 ft² of 12×12 in tile with ⅛ in joints). CUSTOM's Polyblend Plus sanded grout implies about 110 lb/ft³ — roughly 12% heavier — so the same floor needs about 12% more pounds of Polyblend Plus. CUSTOM's own chart (TDS-360, published 3/22/2023) states coverage per 25 lb bag directly and is the better source for that product:",
            },
          ],
        },
        {
          type: "table",
          headers: [
            "Tile size",
            "⅛ in joint",
            "3/16 in joint",
            "¼ in joint",
            "⅜ in joint",
            "½ in joint",
          ],
          rows: [
            ["12 × 12 × ⅜ in", "348 ft²", "234 ft²", "177 ft²", "121 ft²", "92 ft²"],
            ["18 × 18 × ⅜ in", "518 ft²", "348 ft²", "262 ft²", "177 ft²", "135 ft²"],
            ["24 × 24 × ⅜ in", "688 ft²", "461 ft²", "348 ft²", "234 ft²", "177 ft²"],
            ["12 × 24 × ⅜ in", "461 ft²", "310 ft²", "234 ft²", "158 ft²", "121 ft²"],
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "(Coverage per 25 lb bag, from the TDS-360 chart: \"Charts for estimating purposes.\") Read the chart for the product you are buying and set the calculator's density to match it. Do not mix the two products' figures — they differ because the products differ, not because one is wrong.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            { text: "Check — 100 ft², 12×12 in tile, Polyblend Plus.", strong: true },
            {
              text: " At the implied density of about 110 lb/ft³ the figure becomes 7.9 lb with waste — still 1 bag. Better: use CUSTOM's own chart — a 25 lb bag covers 348 ft², so 100 ft² needs 7.2 lb. The chart and the density conversion agree to within a pound; use the chart.",
            },
          ],
        },
      ],
    },
    {
      id: "why-actual-use-differs",
      heading: "Why the grout you actually use differs from the geometric calculation",
      takeaway:
        "The formula calculates the joint volume as if the joints were rectangular boxes filled exactly to the tile surface, so it is a lower bound with a loss allowance on top, not an exact prediction. Grout is lost on the float, in the bucket, and in the sponge — the 10% extra is for exactly that, and mosaic or very small tile deserves 15%. Tile sizes vary slightly from nominal, so a fractionally smaller tile leaves a fractionally wider joint. One factor works the other way: finished grout sits slightly below the tile surface, so the joints hold a little less than full depth. Premixed, urethane, and epoxy grouts have their own densities and charts — the 98.5 lb/ft³ default does not apply to them. Thinset is a separate material sized by trowel notch: for a 100 ft² floor with a ½×½ in notch, thinset needs 3 bags (100 × 1.10 ÷ 42 = 2.62 → 3), not 6 — a conditional estimate at CUSTOM’s chart coverage, excluding back-troweling material. CUSTOM does not recommend the ½×½ in square-notch for large format — the right notch depends on your tile size, so check the Tile Adhesive Calculator before choosing.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The formula calculates the volume of the joints as if they were rectangular boxes filled exactly to the tile surface. Reality differs, and the net effect is that the geometric figure is a lower bound with a loss allowance on top, not a prediction of the exact weight you will use. Grout is lost on the float, in the bucket, and in the sponge — the 10% extra allowance on this calculator is there for exactly that, and mosaic or very small tile deserves 15%, because there is more joint to wash and more grout to lose. Tile sizes also vary slightly from the nominal size printed on the box, and a tile that is a fraction smaller than nominal leaves a fraction wider joint over the whole floor. One factor works the other way: in practice the finished grout sits slightly below the tile surface, so the joints hold a little less than their full depth — which is why the calculator's estimate is a little conservative on this point, as its limitations already say. Premixed, urethane, and epoxy grouts have their own densities and charts — the 98.5 lb/ft³ default does not apply to them. Thinset, the adhesive underneath the tile, is a separate material sized by trowel notch, not by tile size — see the ",
            },
            { text: "Tile Adhesive Calculator", calc: "tile-adhesive-calculator" },
            {
              text: ". For a 100 ft² floor with a ½×½ in notch, thinset needs ",
            },
            { text: "3 bags", strong: true },
            {
              text: " (100 × 1.10 ÷ 42 = 2.62 → 3), not 6 — a conditional estimate at CUSTOM's chart coverage, excluding back-troweling material.",
            },
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How much grout do I need for 100 square feet of tile?",
      answer:
        "It depends on the tile size. For 12 × 12 in tile with ⅛ in joints, about 7 lb — one 10 lb bag. For 2 × 2 in mosaic at the same joint width, about 28 lb — three 10 lb bags. Smaller tiles mean more joints per square foot, and the grout follows the joints.",
    },
    {
      question: "Sanded or unsanded grout?",
      answer:
        "Use sanded grout for joints ⅛ inch and wider — the sand keeps it from shrinking and cracking. Use unsanded grout for joints under ⅛ inch, where sand grains would not fit and would scratch polished tile. Always check the grout maker's stated joint-width range.",
    },
    {
      question: "How much grout does a 25 lb bag cover?",
      answer:
        "For 12 × 12 in tile with ⅛ in joints, about 388 sq ft. For 24 × 24 in tile, about 776 sq ft; for 2 × 2 in mosaic, only about 97.5 sq ft (MAPEI Ultracolor Plus FA coverage chart, 25 lb bag, ⅛ in joints). The bag's own coverage chart, for your tile size and joint width, is the final word.",
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
      compute: (v, present) => groutOutput(req(v, "length") * req(v, "width"), v, present),
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
      compute: (v, present) => groutOutput(req(v, "area"), v, present),
    },
  ],
};
