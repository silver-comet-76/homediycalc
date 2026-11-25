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
  lookupTable: {
    note: "Assumes a solid wall with no openings, standard modular brick (7⅝ × 2¼ × 3⅝ in), a ⅜ in mortar joint, 5% brick waste, 15% mortar waste, and 37 bricks per 80 lb mortar bag.",
    headers: [
      "Wall (L × H)",
      "Net wall area",
      "Bricks needed",
      "Mortar volume",
      "Mortar bags (80 lb)",
    ],
    rows: [
      ["10 × 8 ft wall", "80 ft²", "576 bricks", "5.09 ft³", "18 bags"],
      ["12 × 8 ft wall", "96 ft²", "692 bricks", "6.11 ft³", "21 bags"],
      ["20 × 8 ft wall", "160 ft²", "1152 bricks", "10.18 ft³", "35 bags"],
      ["20 × 10 ft wall", "200 ft²", "1440 bricks", "12.72 ft³", "43 bags"],
      ["30 × 8 ft wall", "240 ft²", "1728 bricks", "15.26 ft³", "52 bags"],
    ],
  },
  diagram: "wall",
  defaultMode: "wall",
  formula:
    "Net wall area = length × height − openings. Bricks per ft² = 144 ÷ ((brick length + joint) × " +
    "(brick height + joint)), in inches. Bricks = net area × bricks per ft² × (1 + waste%), rounded up. " +
    "For US modular brick (7⅝ × 2¼ × 3⅝ in) with a ⅜ in joint that is 6.86 bricks/ft²; the Brick Industry " +
    "Association's Technical Note 10 lists 675 bricks per 100 ft² (6.75/ft²) for the same brick, because three " +
    "courses rise exactly 8 in — the two figures differ by 1.6%. Mortar volume is the geometric joint volume " +
    "(8.06 ft³ per 1,000 modular bricks; BIA TN10 lists 8.1 ft³), computed from the pre-waste brick count with " +
    "only the mortar waste allowance applied. Mortar bags come from the QUIKRETE maximum of up to 37 standard " +
    "bricks per 80 lb bag (Mortar Mix No. 1102 data sheet): the larger of the bricks you buy ÷ 37 and the " +
    "installed bricks × (1 + mortar waste%) ÷ 37 governs, so the recommendation never undercuts the manufacturer " +
    "maximum. The data sheet states no cubic-foot yield per bag, so no volumetric bag figure is claimed. " +
    "The rating applies only to standard geometry — modular brick at the standard ⅜ in joint or narrower. " +
    "For other brick sizes or wider joints, enter your bag's verified yield (ft³ per bag) in the field below " +
    "and the count comes from the mortar volume ÷ that yield; with no yield entered, no bag count, bag cost, " +
    "or shopping-list bag line is shown.",
  howTo: [
    "Measure the wall length and height in feet, and subtract the area of any doors, windows, or other openings.",
    "Use the modular brick defaults unless you know your brick size — measure one brick (length, height, depth) and the joint you plan to use. The standard US mortar joint is ⅜ in.",
    "Single-wythe means one brick thick (a veneer or garden wall). A double-wythe structural wall needs twice the bricks — double the wall count or add a second wall.",
    "Order from one batch where you can: fired clay varies in color between kiln runs.",
  ],
  workedExample:
    "A 10 ft × 8 ft wall is 80 ft². Modular brick with a ⅜ in joint takes 6.86 bricks/ft², so 80 × 6.86 = 549 bricks; " +
    "with 5% waste, buy 576 bricks and 18 bags of 80 lb mortar mix (5.09 ft³ of mortar; 549 installed × 1.15 ÷ 37 = 18 bags at the QUIKRETE maximum of 37 bricks per bag). " +
    "With a wider joint or a different brick size the rating does not apply: a ¾ in joint on the same wall needs 8.82 ft³ of mortar, and no bag count is shown unless you enter your bag's verified yield.",
  limitations: [
    "Single-wythe wall assumption: one brick thick. Double the count for a double-wythe wall.",
    "Does not check structural requirements — load-bearing brickwork, lintels, and footings need a qualified professional and local code approval.",
    "The face-area brick count (6.86/ft²) and the BIA coursing figure (6.75/ft²) differ by 1.6%; either is a reasonable estimate, and the waste allowance covers the gap.",
    "Mortar bags come from the QUIKRETE maximum of up to 37 standard bricks per 80 lb bag (Mortar Mix No. 1102 data sheet), derated by the mortar waste allowance — the larger of the bricks you buy ÷ 37 and the installed bricks × (1 + mortar waste%) ÷ 37 governs. The data sheet states no cubic-foot yield per bag, so the calculator claims none. The rating applies only to modular brick at the standard ⅜ in joint or narrower: for other brick sizes or wider joints, no bag count, bag cost, or shopping-list bag line is shown unless you enter your bag's verified yield (ft³ per bag).",
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
        "About 8.1 ft³ of mortar (BIA Technical Note 10, Table 4) — about 32 bags of 80 lb premixed mortar at the QUIKRETE maximum of up to 37 bricks per bag with the usual 15% mortar waste (1,000 × 1.15 ÷ 37). That rating is a maximum, not an average, so the calculator plans from it and never recommends fewer bags. Those figures are for standard modular brick at a ⅜ in joint; with a wider joint or a different brick size, enter your bag's verified yield instead.",
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
          hint: "QUIKRETE Mortar Mix 1102: one 80 lb bag lays up to 37 standard bricks. That is a maximum — the calculator plans from it, derated by your mortar waste allowance. Check your bag. Applies only at standard geometry (modular brick, ⅜ in joint or narrower); for other sizes or wider joints it is ignored — enter your bag's verified yield below instead.",
        },
        {
          id: "bagYieldFt3",
          label: "Verified bag yield, ft³ per 80 lb bag (optional)",
          kind: "number",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          min: 0.01,
          max: 10,
          hint: "Only used when your brick size or joint differs from the standard (modular brick, ⅜ in joint or narrower). Enter the yield from your bag's data sheet — the volume of mortar one bag makes, in ft³ (1 ft³ ≈ 28.3 L). Leave blank and no bag count is shown for non-standard geometry.",
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
          bagYieldFt3: present.has("bagYieldFt3") ? req(v, "bagYieldFt3") : undefined,
          palletSize: present.has("palletSize") ? req(v, "palletSize") : undefined,
          pricePerBrick: present.has("pricePerBrick") ? req(v, "pricePerBrick") : undefined,
          pricePerMortarBag: present.has("pricePerMortarBag")
            ? req(v, "pricePerMortarBag")
            : undefined,
        });
        const bagRow =
          r.mortarBags !== null
            ? [
                {
                  label: "Mortar bags (80 lb)",
                  value: `${r.mortarBags} bags`,
                  detail:
                    r.mortarBagsBasis === "rating"
                      ? `QUIKRETE ${fmt(req(v, "bricksPerBag"), 0)}-brick maximum, derated by ${fmt(req(v, "mortarWaste"), 0)}% waste — covers ${r.bricksNeeded} bricks (${r.mortarBagsByRating} bags) and the waste-adjusted volume`
                      : `From your entered yield of ${fmt(req(v, "bagYieldFt3"))} ft³ per bag — covers ${fmt(r.mortarVolumeFt3)} ft³ of mortar (${fmt(req(v, "mortarWaste"), 0)}% waste included)`,
                },
              ]
            : [];
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
            ...bagRow,
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
            ...(r.mortarBags !== null ? [`Mortar mix, 80 lb bags: ${r.mortarBags}`] : []),
            ...(r.pallets !== undefined ? [`Pallets of brick: ${r.pallets}`] : []),
          ],
          costUsd: r.costUsd,
          costPartial: r.costPartial ? true : undefined,
          costLabel: r.costPartial ? "Partial cost (bricks only)" : undefined,
          costDetail: r.costPartial
            ? "Excludes mortar — no bag count for this brick size or joint"
            : undefined,
          note:
            r.mortarBags === null
              ? "No bag count shown: the QUIKRETE rating (up to 37 standard bricks per 80 lb bag) applies only to modular brick at a ⅜ in joint or narrower. Your brick size or joint differs, so enter your bag's verified yield (ft³ per bag) above to get a bag count — or check your bag's data sheet."
              : undefined,
          workedLine:
            r.mortarBags !== null
              ? `${fmt(r.netAreaFt2)} ft² × ${fmt(r.bricksPerFt2)} bricks/ft² × ${fmt(100 + req(v, "waste"), 0)}% = ${r.bricksNeeded} bricks; mortar ${fmt(r.mortarVolumeFt3)} ft³ → ${r.mortarBags} bags.`
              : `${fmt(r.netAreaFt2)} ft² × ${fmt(r.bricksPerFt2)} bricks/ft² × ${fmt(100 + req(v, "waste"), 0)}% = ${r.bricksNeeded} bricks; mortar ${fmt(r.mortarVolumeFt3)} ft³ (no bag count — non-standard brick size or joint; enter a verified bag yield for a count).`,
        };
      },
    },
  ],
};
