/**
 * Waterproofing Calculator config — liquid membrane by the gallon
 * or sheet membrane by the roll.
 * See src/lib/formulas/waterproofing.ts and docs/FORMULAS.md §24.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import {
  calculateLiquidWaterproofing,
  calculateSheetWaterproofing,
} from "../../lib/formulas/waterproofing";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

const LIQUID_FIELDS: FieldSpec[] = [
  { id: "coats", label: "Coats", kind: "count", defaultImp: "2", defaultMet: "2", min: 1, max: 5, hint: "Two coats is the minimum for a liquid membrane — the second goes on at right angles to the first. A shower pan liner may need the heavier IAPMO rate instead." },
  {
    id: "coverage",
    label: "Coverage per coat",
    kind: "number",
    unitKind: "area",
    impUnit: "ft2",
    metUnit: "m2",
    defaultImp: "110",
    defaultMet: "10.22",
    hint: "ft² per gallon for one coat. RedGard (TDS-104): 110 ft²/gal general waterproofing, 80 ft²/gal for an IAPMO shower-pan liner, 100 ft²/gal for crack prevention. Check your product.",
  },
  { id: "containerGal", label: "Container size (gal)", kind: "number", defaultImp: "1", defaultMet: "1", min: 0.25, hint: "RedGard comes in 1 gal and 3.5 gal pails. Enter the size you are buying." },
  { id: "waste", label: "Waste allowance", kind: "percent", defaultImp: "10", defaultMet: "10", hint: "Covers corners, seams, and what stays in the roller and tray." },
  { id: "pricePerContainer", label: "Price per container (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
];

function liquidOutput(
  areaFt2: number,
  v: Record<string, number>,
  present: Set<string>,
) {
  const r = calculateLiquidWaterproofing({
    areaFt2,
    coats: req(v, "coats"),
    coveragePerCoatFt2PerGal: req(v, "coverage"),
    containerGal: req(v, "containerGal"),
    wastePct: req(v, "waste"),
    pricePerContainer: present.has("pricePerContainer")
      ? req(v, "pricePerContainer")
      : undefined,
  });
  return {
    rows: [
      {
        label: "Membrane needed",
        value: `${fmt(r.gallons)} gal`,
        detail: `${fmt(areaFt2)} ft² × ${fmt(req(v, "coats"), 0)} coats at ${fmt(req(v, "coverage"), 0)} ft²/gal per coat`,
      },
      {
        label: "Containers to buy",
        value: `${r.containers} containers`,
        detail: `${fmt(req(v, "containerGal"), 2)} gal containers — rounded up`,
      },
      {
        label: "Liters to buy",
        value: `${fmt(r.litersToBuy)} L`,
        detail: "Containers × container size, converted",
      },
    ],
    lines: [
      `Liquid waterproofing membrane: ${r.containers} × ${fmt(req(v, "containerGal"), 2)} gal containers (${fmt(r.gallons)} gal)`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(req(v, "coats"), 0)} coats ÷ ${fmt(req(v, "coverage"), 0)} ft²/gal × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.gallons)} gal → ${r.containers} containers.`,
    note: "Two coats is the minimum — a single coat leaves pinholes. Let the first coat dry fully (it changes color) before the second, at right angles to the first.",
  };
}

export const waterproofingConfig: CalculatorConfig = {
  slug: "waterproofing-calculator",
  diagram: "area",
  defaultMode: "liquid-dimensions",
  formula:
    "Liquid membrane: gallons = area × coats ÷ coverage per coat, plus the waste allowance, then containers = gallons ÷ container size, rounded up. " +
    "Sheet membrane: rolls = area × (1 + waste%) ÷ coverage per roll, rounded up. " +
    "RedGard (TDS-104) covers 110 ft²/gal per coat for general waterproofing and 80 ft²/gal per coat for an IAPMO shower-pan liner; " +
    "a Schluter-KERDI 200/10M roll is 3 ft 3 in × 33 ft (108 ft²).",
  howTo: [
    "Measure the area to waterproof in square feet — shower walls and floor, or the whole wet room. Measure each wall (length × height) and add the floor.",
    "Pick the product type. Liquid membrane (RedGard, AquaDefense) is rolled on in coats; sheet membrane (KERDI) is bonded on in rolls with sealed seams.",
    "For liquid membrane, use two coats minimum, the second at right angles to the first. Use the 80 ft²/gal IAPMO rate for a shower pan liner, not the 110 ft²/gal general rate.",
    "For sheet membrane, add 10% for seams and cuts, and remember the seams need KERDI-BAND and corners need pre-formed corners — the roll count alone is not the whole order.",
    "Check the coverage on the product you buy. AquaDefense covers about 210 ft² per 3.5 gal pail over two coats, which is a different rate from RedGard.",
  ],
  workedExample:
    "A 100 ft² shower (walls and floor) with liquid membrane at the RedGard general rate of 110 ft²/gal per coat, 2 coats, 10% waste: " +
    "100 × 2 ÷ 110 × 1.10 = 2.00 gal — buy 2 one-gallon containers. As sheet membrane the same shower is 100 × 1.10 ÷ 108 = 1.02, so 2 rolls of KERDI 200/10M.",
  limitations: [
    "Coverage rates are product-specific. The 110 ft²/gal default is RedGard's general-waterproofing rate; AquaDefense, Hydro Ban, and other liquids print different rates, and the coverage on your product is the final word.",
    "The coat count is a requirement, not a choice: a liquid membrane needs at least two coats to reach its rated dry-film thickness (30–35 mils for RedGard). One coat, however thick, does not waterproof.",
    "Does not include KERDI-BAND, pre-formed corners, pipe seals, or drain seals for sheet membrane, or the thinset used to bond the membrane.",
    "Waterproofing is not a substitute for a sloped shower floor or a working drain. If water cannot drain, no membrane saves the shower.",
  ],
  faqs: [
    {
      question: "How much RedGard do I need for a shower?",
      answer:
        "For a 100 ft² shower (walls plus floor) at the general rate of 110 ft²/gal per coat, 2 coats with 10% waste is 2.00 gallons — two 1-gallon pails, or one 3.5-gallon pail with spare. For a shower pan liner at the IAPMO rate of 80 ft²/gal per coat, the same shower needs 2.75 gallons, so buy 3 gallons.",
    },
    {
      question: "How many coats of waterproofing membrane do I need?",
      answer:
        "Two coats minimum for any liquid membrane — the first coat always leaves pinholes, and the second, applied at right angles after the first has dried, is what makes the barrier continuous. Some products and some details (pan liners, corners) need a heavier application rate rather than a third coat.",
    },
    {
      question: "Liquid membrane or sheet membrane — which should I use?",
      answer:
        "Liquid (RedGard, AquaDefense) is easier on irregular surfaces and corners — you roll it on. Sheet (KERDI) gives a uniform thickness with no drying wait and no pinhole risk, but every seam must be sealed with KERDI-BAND. Both work when installed to the maker's instructions; the choice is usually about the installer's experience and the shape of the shower.",
    },
    {
      question: "How much does a roll of KERDI cover?",
      answer:
        "KERDI 200/10M is 3 ft 3 in wide by 33 ft long — 108 ft² per roll. Other rolls in the line run 54 ft² (5 m), 75 ft² (7 m), 215 ft² (20 m), and 323 ft² (30 m), plus a 6 ft 7 in wide roll at 646 ft². Add 10% for seams and cuts.",
    },
  ],
  modes: [
    {
      id: "liquid-dimensions",
      label: "Liquid membrane — room dimensions",
      fields: [
        { id: "length", label: "Length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "10", defaultMet: "3.05" },
        { id: "width", label: "Width", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "10", defaultMet: "3.05" },
        ...LIQUID_FIELDS,
      ],
      compute: (v, present) =>
        liquidOutput(req(v, "length") * req(v, "width"), v, present),
    },
    {
      id: "liquid-area",
      label: "Liquid membrane — known area",
      fields: [
        { id: "area", label: "Area to waterproof", kind: "area", unitKind: "area", impUnit: "ft2", metUnit: "m2", defaultImp: "100", defaultMet: "9.29", hint: "Walls plus floor, in square feet." },
        ...LIQUID_FIELDS,
      ],
      compute: (v, present) => liquidOutput(req(v, "area"), v, present),
    },
    {
      id: "sheet",
      label: "Sheet membrane — rolls",
      fields: [
        { id: "area", label: "Area to waterproof", kind: "area", unitKind: "area", impUnit: "ft2", metUnit: "m2", defaultImp: "100", defaultMet: "9.29", hint: "Walls plus floor, in square feet." },
        { id: "rollCoverage", label: "Coverage per roll", kind: "number", unitKind: "area", impUnit: "ft2", metUnit: "m2", defaultImp: "108", defaultMet: "10.03", hint: "ft² per roll. KERDI 200/10M is 108 ft² (3 ft 3 in × 33 ft); other KERDI rolls run 54–323 ft²." },
        { id: "waste", label: "Waste allowance", kind: "percent", defaultImp: "10", defaultMet: "10", hint: "Covers seams, overlaps, and cuts. Seams need KERDI-BAND — not included here." },
        { id: "pricePerRoll", label: "Price per roll (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
      ],
      compute: (v, present) => {
        const r = calculateSheetWaterproofing({
          areaFt2: req(v, "area"),
          rollCoverageFt2: req(v, "rollCoverage"),
          wastePct: req(v, "waste"),
          pricePerRoll: present.has("pricePerRoll") ? req(v, "pricePerRoll") : undefined,
        });
        return {
          rows: [
            {
              label: "Area with waste",
              value: `${fmt(req(v, "area") * (1 + req(v, "waste") / 100))} ft²`,
              detail: `${fmt(req(v, "area"))} ft² with ${fmt(req(v, "waste"), 0)}% for seams and cuts`,
            },
            {
              label: "Rolls to buy",
              value: `${r.rolls} rolls`,
              detail: `${fmt(req(v, "rollCoverage"), 0)} ft² per roll — rounded up`,
            },
          ],
          lines: [
            `Sheet waterproofing membrane: ${r.rolls} rolls (${fmt(req(v, "rollCoverage"), 0)} ft² per roll)`,
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(req(v, "area"))} ft² × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${fmt(req(v, "rollCoverage"), 0)} ft²/roll = ${r.rolls} rolls.`,
          note: "Seams need KERDI-BAND, corners need pre-formed corners, and pipes need pipe seals — the roll count alone is not the whole order.",
        };
      },
    },
  ],
};
