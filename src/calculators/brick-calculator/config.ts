/**
 * Brick Calculator config — brick and mortar counts for a wall.
 * See src/lib/formulas/brick.ts and docs/FORMULAS.md §10.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateBrick } from "../../lib/formulas/brick";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const brickConfig: CalculatorConfig = {
  slug: "brick-calculator",
  diagram: "wall",
  defaultMode: "wall",
  formula:
    "Net wall area = length × height − openings. Bricks per ft² = 144 ÷ ((brick length + joint) × " +
    "(brick height + joint)), in inches. Bricks = net area × bricks per ft² × (1 + waste%), rounded up. " +
    "For US modular brick (7⅝ × 2¼ × 3⅝ in) with a ⅜ in joint that is 6.86 bricks/ft²; the Brick Industry " +
    "Association's Technical Note 10 lists 675 bricks per 100 ft² (6.75/ft²) for the same brick, because three " +
    "courses rise exactly 8 in — the two figures differ by 1.6%. Mortar volume is the geometric joint volume " +
    "(8.06 ft³ per 1,000 modular bricks; BIA TN10 lists 8.1 ft³), computed from the pre-waste brick count with " +
    "only the mortar waste allowance applied. Mortar bags = mortar volume ÷ 0.6 ft³ per 80 lb bag, rounded up — " +
    "the same volume method the Mortar Calculator uses, so both calculators return the same bag count for the " +
    "same wall. The QUIKRETE figure of up to 37 standard bricks per bag is shown only as a cross-check: that " +
    "rating already bakes in heavy field waste, so it runs higher than the volume figure.",
  howTo: [
    "Measure the wall length and height in feet, and subtract the area of any doors, windows, or other openings.",
    "Use the modular brick defaults unless you know your brick size — measure one brick (length, height, depth) and the joint you plan to use. The standard US mortar joint is ⅜ in.",
    "Single-wythe means one brick thick (a veneer or garden wall). A double-wythe structural wall needs twice the bricks — double the wall count or add a second wall.",
    "Order from one batch where you can: fired clay varies in color between kiln runs.",
  ],
  workedExample:
    "A 10 ft × 8 ft wall is 80 ft². Modular brick with a ⅜ in joint takes 6.86 bricks/ft², so 80 × 6.86 = 549 bricks; " +
    "with 5% waste, buy 576 bricks and 9 bags of 80 lb mortar mix (5.09 ft³ of mortar at 0.6 ft³ per bag).",
  limitations: [
    "Single-wythe wall assumption: one brick thick. Double the count for a double-wythe wall.",
    "Does not check structural requirements — load-bearing brickwork, lintels, and footings need a qualified professional and local code approval.",
    "The face-area brick count (6.86/ft²) and the BIA coursing figure (6.75/ft²) differ by 1.6%; either is a reasonable estimate, and the waste allowance covers the gap.",
    "Mortar bags come from the mortar volume (0.6 ft³ per 80 lb bag). The QUIKRETE 'up to 37 bricks per bag' rating is shown only as a cross-check — it already bakes in heavy field waste, so it runs higher than the volume figure.",
  ],
  faqs: [
    {
      question: "How many bricks do I need for a wall?",
      answer:
        "Multiply the net wall area (length × height minus openings) by the bricks per square foot for your brick size. For US modular brick with a ⅜ in joint that is 6.86 per ft² — an 80 ft² wall needs 549 bricks, or 576 with 5% waste.",
    },
    {
      question: "What size is a standard modular brick?",
      answer:
        "7⅝ in long × 2¼ in high × 3⅝ in deep, with a ⅜ in mortar joint. With the joint, each brick occupies 8 in × 2⅝ in of wall face, and three courses rise exactly 8 in. That is the size the Brick Industry Association's Technical Note 10 uses for its estimating tables.",
    },
    {
      question: "How much mortar do I need for 1,000 bricks?",
      answer:
        "About 8.1 ft³ of mortar (BIA Technical Note 10, Table 4) — about 14 bags of 80 lb premixed mortar at 0.6 ft³ per bag (16 with the usual 15% waste). QUIKRETE's rate of up to 37 bricks per bag would suggest 28 bags, or 32 with 15% waste — that rating already bakes in heavy field waste, so the volume figure governs and the calculator shows both.",
    },
    {
      question: "How much waste should I allow for bricks?",
      answer:
        "5% is the usual minimum the Brick Industry Association suggests for breakage and cuts; use 10% for walls with many openings, arches, or intricate patterns. Bricks from the same batch also cover you if a few arrive chipped.",
    },
  ],
  modes: [
    {
      id: "wall",
      label: "Wall",
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
          label: "Openings area",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "0",
          defaultMet: "0",
          min: 0,
          hint: "Total area of doors, windows, and other openings in the wall. Enter 0 for a solid wall.",
        },
        {
          id: "brickLength",
          label: "Brick length",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "mm",
          defaultImp: "7.625",
          defaultMet: "194",
          allowUnitSelect: true,
          unitOptions: ["in", "mm", "cm"],
        },
        {
          id: "brickHeight",
          label: "Brick height",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "mm",
          defaultImp: "2.25",
          defaultMet: "57",
          allowUnitSelect: true,
          unitOptions: ["in", "mm", "cm"],
        },
        {
          id: "brickDepth",
          label: "Brick depth",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "mm",
          defaultImp: "3.625",
          defaultMet: "92",
          allowUnitSelect: true,
          unitOptions: ["in", "mm", "cm"],
        },
        {
          id: "joint",
          label: "Mortar joint width",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "mm",
          min: 0,
          defaultImp: "0.375",
          defaultMet: "9.5",
          hint: "Standard US joint is ⅜ in (9.5 mm).",
        },
        {
          id: "waste",
          label: "Brick waste allowance",
          kind: "percent",
          defaultImp: "5",
          defaultMet: "5",
          hint: "BIA suggests at least 5% for breakage and cuts.",
        },
        {
          id: "mortarWaste",
          label: "Mortar waste allowance",
          kind: "percent",
          defaultImp: "15",
          defaultMet: "15",
          hint: "BIA suggests 15–25% for mortar.",
        },
        {
          id: "bricksPerBag",
          label: "Bricks per 80 lb mortar bag",
          kind: "number",
          defaultImp: "37",
          defaultMet: "37",
          min: 1,
          max: 200,
          hint: "QUIKRETE Mason Mix / Mortar Mix: one 80 lb bag lays up to 37 standard bricks. Check your bag.",
        },
        {
          id: "palletSize",
          label: "Bricks per pallet (optional)",
          kind: "number",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          min: 1,
          max: 5000,
          hint: "Enter your supplier's pallet size to also see a pallet count.",
        },
        {
          id: "pricePerBrick",
          label: "Price per brick (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerMortarBag",
          label: "Price per 80 lb mortar bag (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
      ],
      compute: (v, present) => {
        const r = calculateBrick({
          wallLengthFt: req(v, "length"),
          wallHeightFt: req(v, "height"),
          openingsFt2: req(v, "openings"),
          brickLengthIn: req(v, "brickLength"),
          brickHeightIn: req(v, "brickHeight"),
          brickDepthIn: req(v, "brickDepth"),
          jointIn: req(v, "joint"),
          wastePct: req(v, "waste"),
          mortarWastePct: req(v, "mortarWaste"),
          bricksPerMortarBag: req(v, "bricksPerBag"),
          palletSize: present.has("palletSize") ? req(v, "palletSize") : undefined,
          pricePerBrick: present.has("pricePerBrick") ? req(v, "pricePerBrick") : undefined,
          pricePerMortarBag: present.has("pricePerMortarBag")
            ? req(v, "pricePerMortarBag")
            : undefined,
        });
        return {
          rows: [
            {
              label: "Net wall area",
              value: `${fmt(r.netAreaFt2)} ft²`,
              detail: `${fmt(r.grossAreaFt2)} ft² gross minus ${fmt(req(v, "openings"))} ft² openings`,
            },
            {
              label: "Bricks needed",
              value: `${r.bricksNeeded} bricks`,
              detail: `${fmt(r.bricksPerFt2)} bricks/ft² with ${fmt(req(v, "waste"), 0)}% waste`,
            },
            {
              label: "Mortar volume",
              value: `${fmt(r.mortarVolumeFt3)} ft³`,
              detail: `Joint volume with ${fmt(req(v, "mortarWaste"), 0)}% waste`,
            },
            {
              label: "Mortar bags (80 lb)",
              value: `${r.mortarBags} bags`,
              detail: `0.60 ft³ per bag — volume method; QUIKRETE ${fmt(req(v, "bricksPerBag"), 0)}-brick rating cross-check: ${r.mortarBagsByRating} bags`,
            },
            ...(r.pallets !== undefined
              ? [
                  {
                    label: "Pallets",
                    value: `${r.pallets} pallets`,
                    detail: `${fmt(req(v, "palletSize"), 0)} bricks per pallet`,
                  },
                ]
              : []),
          ],
          lines: [
            `Bricks: ${r.bricksNeeded}`,
            `Mortar mix, 80 lb bags: ${r.mortarBags}`,
            ...(r.pallets !== undefined ? [`Pallets of brick: ${r.pallets}`] : []),
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(r.netAreaFt2)} ft² × ${fmt(r.bricksPerFt2)} bricks/ft² × ${fmt(100 + req(v, "waste"), 0)}% = ${r.bricksNeeded} bricks; mortar ${fmt(r.mortarVolumeFt3)} ft³ → ${r.mortarBags} bags.`,
        };
      },
    },
  ],
};
