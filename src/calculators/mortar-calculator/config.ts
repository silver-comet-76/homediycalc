/**
 * Mortar Calculator config — mortar volume and bags for brick or block
 * walls, with a site-mix breakdown. Mortar-first: the Brick Calculator
 * counts bricks and reports mortar as a secondary output; this one
 * starts from the wall area and gives the mortar volume, bag count,
 * and the cement/lime/sand parts for site mixing.
 * See src/lib/formulas/mortar.ts and docs/FORMULAS.md §18.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateMortar, type MasonryUnit, type MortarType } from "../../lib/formulas/mortar";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

const UNIT_LABELS: Record<MasonryUnit, string> = {
  brick: "bricks",
  block: "blocks",
};

const TYPE_LABELS: Record<MortarType, string> = {
  N: "Type N (1:1:6)",
  S: "Type S (1:½:4½)",
  M: "Type M (1:¼:3¾)",
  O: "Type O (1:2:9)",
};

function mortarOutput(areaFt2: number, v: Record<string, number>, present: Set<string>) {
  const unit: MasonryUnit = req(v, "unit") === 2 ? "block" : "brick";
  const typeCode = req(v, "mortarType");
  const mortarType: MortarType =
    typeCode === 2 ? "S" : typeCode === 3 ? "M" : typeCode === 4 ? "O" : "N";
  const r = calculateMortar({
    areaFt2,
    unit,
    jointIn: req(v, "joint"),
    wastePct: req(v, "waste"),
    mortarType,
    bagYieldFt3: present.has("bagYieldFt3") ? req(v, "bagYieldFt3") : undefined,
    pricePerBag: present.has("pricePerBag") ? req(v, "pricePerBag") : undefined,
  });
  const siteMixNote =
    "Site-mix parts are the ASTM C270 batch yields per cubic foot of mortar — an ordering guide, not an exact dry-volume recipe: dry volumes do not add up to the mixed volume. Mix by volume, not by weight: one 94 lb sack of cement is about 1 ft³.";
  const bagRow =
    r.bags !== null
      ? [
          {
            label: "Pre-mixed mortar",
            value: `${r.bags} bags`,
            detail:
              r.bagsBasis === "rating"
                ? `80 lb bags at up to ${r.unitsPerBag} ${UNIT_LABELS[unit]} per bag (QUIKRETE 1102 maximum), derated by ${fmt(req(v, "waste"), 0)}% waste — rounded up`
                : `80 lb bags from your entered yield of ${fmt(req(v, "bagYieldFt3"))} ft³ per bag — covers ${fmt(r.mortarVolumeFt3)} ft³ of mortar (${fmt(req(v, "waste"), 0)}% waste included)`,
          },
        ]
      : [];
  return {
    rows: [
      {
        label: `Wall area (${UNIT_LABELS[unit]})`,
        value: `${fmt(areaFt2)} ft²`,
        detail: `${r.unitsNeeded} ${UNIT_LABELS[unit]} at ${fmt(r.unitsPerFt2, 2)} per ft²`,
      },
      {
        label: "Mortar volume",
        value: `${fmt(r.mortarVolumeFt3)} ft³`,
        detail: `${fmt(req(v, "waste"), 0)}% waste included (BIA suggests 15–25%)`,
      },
      ...bagRow,
      {
        label: `Site mix — ${TYPE_LABELS[mortarType]}`,
        value: `${fmt(r.cementFt3)} ft³ cement`,
        detail: `${r.cementSacks} × 94 lb sacks; ${fmt(r.limeFt3)} ft³ lime; ${fmt(r.sandFt3)} ft³ sand`,
      },
    ],
    lines: [
      ...(r.bags !== null ? [`Mortar mix, 80 lb bags: ${r.bags}`] : []),
      `Site mix ${TYPE_LABELS[mortarType]} — cement: ${r.cementSacks} × 94 lb sacks (${fmt(r.cementFt3)} ft³), lime: ${fmt(r.limeFt3)} ft³, sand: ${fmt(r.sandFt3)} ft³`,
      `Masonry units in the wall: ${r.unitsNeeded} ${UNIT_LABELS[unit]}`,
    ],
    costUsd: r.costUsd,
    note:
      r.bags === null
        ? `No bag count shown: the QUIKRETE rating (up to ${unit === "brick" ? "37 standard bricks" : "13 standard blocks"} per 80 lb bag) applies only to standard units at a ⅜ in joint or narrower. Your joint is wider, so enter your bag's verified yield (ft³ per bag) above to get a bag count. ${siteMixNote}`
        : siteMixNote,
    workedLine:
      r.bags === null
        ? `${fmt(areaFt2)} ft² × ${fmt(r.unitsPerFt2, 2)} ${UNIT_LABELS[unit]}/ft² = ${r.unitsNeeded} ${UNIT_LABELS[unit]}; mortar ${fmt(r.mortarVolumeFt3)} ft³ (no bag count — joint wider than the standard ⅜ in; enter a verified bag yield for a count).`
        : r.bagsBasis === "rating"
          ? `${fmt(areaFt2)} ft² × ${fmt(r.unitsPerFt2, 2)} ${UNIT_LABELS[unit]}/ft² = ${r.unitsNeeded} ${UNIT_LABELS[unit]}; mortar ${fmt(r.mortarVolumeFt3)} ft³; ${r.unitsNeeded} × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${r.unitsPerBag} per bag = ${r.bags} bags.`
          : `${fmt(areaFt2)} ft² × ${fmt(r.unitsPerFt2, 2)} ${UNIT_LABELS[unit]}/ft² = ${r.unitsNeeded} ${UNIT_LABELS[unit]}; mortar ${fmt(r.mortarVolumeFt3)} ft³ ÷ ${fmt(req(v, "bagYieldFt3"))} ft³ per bag = ${r.bags} bags.`,
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "unit",
    label: "Masonry unit",
    kind: "select" as const,
    defaultImp: "1",
    defaultMet: "1",
    options: [
      { value: "1", label: "Modular brick (7⅝ × 2¼ × 3⅝ in)" },
      { value: "2", label: "Standard block (8 × 8 × 16 in)" },
    ],
  },
  {
    id: "joint",
    label: "Mortar joint width",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    min: 0,
    defaultImp: "0.375",
    defaultMet: "0.95",
    hint: "⅜ in (0.375 in) is the standard joint.",
  },
  {
    id: "waste",
    label: "Mortar waste allowance",
    kind: "percent" as const,
    defaultImp: "15",
    defaultMet: "15",
    hint: "BIA suggests 15–25% for mortar waste. Use 25% for repointing or irregular units.",
  },
  {
    id: "bagYieldFt3",
    label: "Verified bag yield, ft³ per 80 lb bag (optional)",
    kind: "number" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
    min: 0.01,
    max: 10,
    hint: "Only used when your joint is wider than the standard ⅜ in. Enter the yield from your bag's data sheet — the volume of mortar one bag makes, in ft³ (1 ft³ ≈ 28.3 L). Leave blank and no bag count is shown for wider joints.",
  },
  {
    id: "mortarType",
    label: "Mortar type (for site mixing)",
    kind: "select" as const,
    defaultImp: "1",
    defaultMet: "1",
    options: [
      { value: "1", label: "Type N (1:1:6) — general above-grade" },
      { value: "2", label: "Type S (1:½:4½) — below grade, structural" },
      { value: "3", label: "Type M (1:¼:3¾) — heavy loads, foundations" },
      { value: "4", label: "Type O (1:2:9) — soft brick, interior" },
    ],
    hint: "ASTM C270 proportions by volume (cement : lime : sand). C270 specifies sand at 2¼–3× the cementitious volume; the calculator uses the 3× end (Type M 3¾). Type N is the default for ordinary above-grade residential brickwork.",
  },
  {
    id: "pricePerBag",
    label: "Price per 80 lb bag (optional)",
    kind: "price" as const,
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const mortarConfig: CalculatorConfig = {
  slug: "mortar-calculator",
  designCplus: true,
  heroResultLabel: "Pre-mixed mortar",
  lookupTable: {
    note: "Assumes modular brick (7⅝ × 2¼ × 3⅝ in), a ⅜ in joint, 15% mortar waste, and Type N site mix (1:1:6).",
    headers: [
      "Wall (L × H)",
      "Wall area (bricks)",
      "Mortar volume",
      "Pre-mixed mortar",
      "Site mix — Type N (1:1:6)",
    ],
    rows: [
      ["10 × 8 ft wall", "80 ft²", "5.09 ft³", "18 bags", "0.87 ft³ cement"],
      ["12 × 8 ft wall", "96 ft²", "6.11 ft³", "21 bags", "1.04 ft³ cement"],
      ["20 × 8 ft wall", "160 ft²", "10.18 ft³", "35 bags", "1.73 ft³ cement"],
      ["20 × 10 ft wall", "200 ft²", "12.72 ft³", "43 bags", "2.16 ft³ cement"],
      ["30 × 8 ft wall", "240 ft²", "15.26 ft³", "52 bags", "2.59 ft³ cement"],
    ],
  },
  diagram: "wall",
  defaultMode: "dimensions",
  formula:
    "Mortar volume is the geometric joint volume around each unit: " +
    "((length + joint) × (height + joint) − length × height) × depth, " +
    "summed over the units in the wall, then × (1 + waste%). " +
    "For a modular brick with a ⅜ in joint this gives 8.06 ft³ per 1,000 " +
    "bricks — the Brick Industry Association lists 8.1 ft³. " +
    "Bags come from the QUIKRETE maximum of up to 37 standard bricks or 13 standard " +
    "8 × 8 × 16 blocks per 80 lb bag (Mortar Mix No. 1102 data sheet), derated by " +
    "the waste allowance: installed units × (1 + waste%) ÷ units per bag, rounded up — " +
    "but only for standard units at the standard ⅜ in joint or narrower. For wider joints " +
    "the rating does not apply: enter your bag's verified yield (ft³ per bag) and bags = " +
    "mortar volume ÷ that yield; with no yield entered, no bag count, bag cost, or " +
    "shopping-list bag line is shown. " +
    "The data sheet states no cubic-foot yield per bag, so no volumetric bag figure is claimed. " +
    "Site-mix parts use the ASTM C270 batch yields per cubic foot of mortar: " +
    "Type N 0.17 ft³ cement, 0.17 ft³ lime, 1.0 ft³ sand; Type S 0.22 / 0.11 / 1.0; " +
    "Type M 0.33 / 0.08 / 1.0; Type O 0.11 / 0.22 / 1.0. " +
    "(Mix ratios by volume: Type N 1:1:6, Type S 1:½:4½, Type M 1:¼:3¾, Type O 1:2:9 — cement : lime : sand.)",
  howTo: [
    [
      {
        text: "Measure the wall: length × height in feet. Subtract large openings (doors, windows) — enter them as an area, or use the ",
      },
      { text: "Brick Calculator", calc: "brick-calculator" },
      { text: "'s opening inputs and bring the net area here." },
    ],
    "Pick the masonry unit: modular brick (7⅝ × 2¼ × 3⅝ in) or standard 8 × 8 × 16 in concrete block. The joint volume — and therefore the mortar — is different for each.",
    "Choose the mortar type for the site-mix breakdown: Type N is the default for ordinary above-grade residential brickwork; Type S for below-grade and structural work; Type M for foundations and heavy loads; Type O for soft or historic brick.",
    "Choose the waste allowance: 15% is the BIA's low end; use 25% for repointing, irregular units, or inexperienced hands.",
  ],
  workedExample:
    "A 10 × 8 ft modular brick wall (80 ft²) with ⅜ in joints and 15% waste: " +
    "549 bricks need 5.09 ft³ of mortar — 18 bags of 80 lb pre-mixed mortar " +
    "(549 × 1.15 ÷ 37 at the QUIKRETE maximum of 37 bricks per bag). " +
    "With a ¾ in joint the same wall needs 8.82 ft³ of mortar and the rating no longer applies, " +
    "so no bag count is shown unless you enter your bag's verified yield. " +
    "Mixed on site as Type N (1:1:6), that is 0.87 ft³ of cement (1 sack), " +
    "0.87 ft³ of lime, and 5.09 ft³ of sand.",
  limitations: [
    "Mortar volume is the geometric joint volume. In practice, mortar also fills the cores of hollow block and the gaps behind irregular stone — block and stone walls can need more than this estimate.",
    "Why this page says 549 bricks while the Brick Calculator says 576 for the same 10 × 8 ft wall: 549 is the number of bricks installed in the wall, and 576 is the number to buy — 549 plus the 5% brick-waste allowance for breakage and cuts. The Brick Calculator adds that allowance; this calculator reports the installed count only and has no brick-waste input, because broken bricks take no mortar. The mortar figures agree exactly on both pages for the same wall: 5.09 ft³ and 18 bags.",
    "Bag counts come from the QUIKRETE maximum (up to 37 bricks or 13 blocks per 80 lb bag), derated by your waste allowance — but only for standard units at the standard ⅜ in joint or narrower. For wider joints the rating does not apply: enter your bag's verified yield (ft³ per bag) and bags = mortar volume ÷ that yield; with no yield entered, no bag count, bag cost, or shopping-list bag line is shown. A bag that states a different count on its label wins over the default for standard geometry — and the data sheet states no cubic-foot yield per bag, so this calculator claims none of its own.",
    "Site-mix parts are the ASTM C270 batch yields per cubic foot of mortar. They are an ordering guide; dry volumes do not add up exactly to the mixed volume, and sand must be measured damp and loose.",
    "This calculator estimates materials only. Mortar type and strength are structural decisions — for load-bearing walls, foundations, or historic brick, follow the specification from a qualified professional.",
  ],
  faqs: [
    {
      question: "How much mortar do I need for a brick wall?",
      answer:
        "About 5.5 cubic feet per 100 square feet of modular brick wall with ⅜ inch joints, before waste — or about 8.1 cubic feet per 1,000 bricks (Brick Industry Association Technical Note 10). With 15% waste, an 80 sq ft wall needs about 5.1 ft³, or 18 bags of 80 lb pre-mixed mortar at the QUIKRETE maximum of up to 37 bricks per bag.",
    },
    {
      question: "What is the mix ratio for Type N mortar?",
      answer:
        "1 part portland cement, 1 part hydrated lime, and 6 parts masonry sand, by volume — not by weight. Type S is 1 : ½ : 4½, Type M is 1 : ¼ : 3¾, and Type O is 1 : 2 : 9. Type N is the default for ordinary above-grade residential brickwork.",
    },
    {
      question: "How many bricks does one bag of mortar lay?",
      answer:
        "QUIKRETE rates an 80 lb bag of Mortar Mix at up to 37 standard bricks or 13 standard 8 × 8 × 16 blocks. That is a maximum — waste, joint width, and technique all reduce it, which is why this calculator derates that maximum by your waste allowance instead of dividing the bare unit count. The rating applies only to standard units at the standard ⅜ in joint or narrower; with a wider joint, enter your bag's verified yield (ft³ per bag) instead.",
    },
    {
      question: "How is this different from the Brick Calculator?",
      answer:
        "The Brick Calculator counts bricks and reports mortar as a secondary output. This calculator is mortar-first: it gives the mortar volume, the bag count, and the site-mix breakdown (cement, lime, and sand) for the mortar type you choose — for brick or for block.",
    },
  ],
  modes: [
    {
      id: "dimensions",
      label: "Wall dimensions",
      fields: [
        {
          id: "length",
          label: "Wall length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "10",
          defaultMet: "3.05",
        },
        {
          id: "height",
          label: "Wall height",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "8",
          defaultMet: "2.44",
        },
        {
          id: "openings",
          label: "Openings area (optional)",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Total area of doors and windows to subtract.",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const gross = req(v, "length") * req(v, "height");
        const openings = present.has("openings") ? req(v, "openings") : 0;
        return mortarOutput(Math.max(0, gross - openings), v, present);
      },
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        {
          id: "area",
          label: "Wall area",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "80",
          defaultMet: "7.43",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => mortarOutput(req(v, "area"), v, present),
    },
  ],
};
