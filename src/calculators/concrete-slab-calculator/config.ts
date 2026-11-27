/**
 * Concrete Slab Calculator config — slab-specific concrete.
 * See src/lib/formulas/concrete-slab.ts and docs/FORMULAS.md §6.
 *
 * Distinct from the general Concrete Calculator: thickness presets for
 * slabs, an optional thickened-edge allowance, and a wire-mesh sheet
 * count as information only. Reinforcement is guidance, not structural
 * design — a slab's structural requirements need a qualified professional.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateSlab, STANDARD_MESH_SHEET_AREA_FT2 } from "../../lib/formulas/concrete-slab";
import { CONCRETE_BAG_YIELDS_FT3 } from "../../lib/formulas/concrete";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const concreteSlabConfig: CalculatorConfig = {
  slug: "concrete-slab-calculator",
  designCplus: true,
  heroResultLabel: "Ready-mix to order",
  lookupTable: {
    note: "Assumes 10% waste, ready-mix rounded up to the next quarter cubic yard (0.25 yd³), and wire-mesh sheets of 160 ft² each.",
    headers: [
      "Slab (L × W × thickness)",
      "Slab volume",
      "With 10% waste",
      "Ready-mix to order",
      "80 lb bags",
      "60 lb bags",
      "40 lb bags",
      "Wire-mesh sheets",
    ],
    rows: [
      [
        "10 × 10 × 4 in slab",
        "1.23 yd³",
        "1.36 yd³",
        "1.5 yd³",
        "62 bags",
        "82 bags",
        "123 bags",
        "1 sheet",
      ],
      [
        "12 × 12 × 4 in slab",
        "1.78 yd³",
        "1.96 yd³",
        "2 yd³",
        "88 bags",
        "118 bags",
        "176 bags",
        "1 sheet",
      ],
      [
        "20 × 12 × 4 in slab",
        "2.96 yd³",
        "3.26 yd³",
        "3.5 yd³",
        "147 bags",
        "196 bags",
        "294 bags",
        "2 sheets",
      ],
      [
        "20 × 20 × 4 in slab",
        "4.94 yd³",
        "5.43 yd³",
        "5.5 yd³",
        "245 bags",
        "326 bags",
        "489 bags",
        "3 sheets",
      ],
      [
        "10 × 20 × 6 in slab",
        "3.7 yd³",
        "4.07 yd³",
        "4.25 yd³",
        "184 bags",
        "245 bags",
        "367 bags",
        "2 sheets",
      ],
    ],
  },
  diagram: "volume",
  defaultMode: "slab",
  formula:
    "Volume (ft³) = length × width × thickness, all in feet, plus the thickened edge if you enter one: " +
    "2 × (length + width − 2 × edge width) × edge width × (edge depth − thickness), so each corner is counted once. Volume (yd³) = volume (ft³) ÷ 27. " +
    "Add your waste allowance (default 10%), then round the ready-mix order up to the next quarter cubic yard. " +
    "Wire-mesh sheets = slab area ÷ sheet area (a standard 8 × 20 ft sheet is 160 ft²). " +
    "Bag yields are the QUIKRETE Concrete Mix No. 1101 figures: 80 lb = 0.60 ft³, 60 lb = 0.45 ft³, 40 lb = 0.30 ft³.",
  howTo: [
    "Measure the slab length and width in feet, inside the forms.",
    "Pick the thickness: 4 in is typical for a patio or walkway, 5–6 in for a garage or driveway. Measure thickness at the form, not the finished surface.",
    "If the slab has a thickened edge (a deeper footing around the perimeter), enter its depth and width — the calculator adds that volume.",
    "Order ready-mix by the cubic yard, rounded up to a quarter yard, and confirm the mix strength (psi) with your supplier. A slab that runs short mid-pour is a costly problem.",
    "Plan control joints: saw-cut or tooled joints about every 8–12 ft, so the slab cracks where you choose, not where it wants to.",
  ],
  workedExample:
    "A 20 ft × 12 ft slab, 4 in thick: 20 × 12 × ⅓ ft = 80 ft³ = 2.96 yd³. " +
    "With 10% waste that is 3.26 yd³, so order 3.5 yd³ — or 147 bags of 80 lb mix.",
  limitations: [
    "Assumes uniform thickness unless a thickened edge is entered. It does not design reinforcement or check structural requirements — a slab's structural design needs a qualified professional, and local code may require a permit and inspection.",
    "The thickened-edge volume is a perimeter band with the corner overlap removed, so each corner is counted once.",
    "The wire-mesh count is a quantity guide only. Mesh size, bar spacing, and whether mesh or rebar is right for your slab are engineering decisions, not calculator outputs.",
    "Bag yields are the QUIKRETE figures for its Concrete Mix; other brands print their own yield on the bag.",
  ],
  faqs: [
    {
      question: "How thick should a concrete slab be?",
      answer:
        "4 inches is typical for patios, walkways, and light residential slabs. Use 5–6 inches for garages and driveways that carry vehicles, and thicker with a thickened edge for heavy loads. Local code and soil conditions can change the answer — check before you pour.",
    },
    {
      question: "How much concrete do I need for a 20 × 12 slab?",
      answer:
        "At 4 inches thick it is 80 ft³, or 2.96 yd³. With 10% waste that is 3.26 yd³, so order 3.5 yd³ of ready-mix, or 147 bags of 80 lb mix.",
    },
    {
      question: "Do I need rebar or wire mesh in a slab?",
      answer:
        "Most residential slabs use either welded wire mesh or rebar to control cracking — but which one, what size, and what spacing is a structural decision, not something a calculator can specify. The mesh sheet count here is a quantity guide only; ask a qualified professional or your local building department what your slab requires.",
    },
    {
      question: "What is a thickened edge?",
      answer:
        "A deeper band of concrete around the slab perimeter, often 12 inches deep, that acts as a footing and stiffens the edge. It is common for slabs that will carry walls or heavy edge loads. Enter its depth and width and the calculator adds the extra concrete.",
    },
  ],
  modes: [
    {
      id: "slab",
      label: "Slab",
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
          defaultImp: "12",
          defaultMet: "3.66",
        },
        {
          id: "thickness",
          label: "Thickness",
          kind: "length",
          unitKind: "length",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "4",
          defaultMet: "10",
          hint: "4 in for a patio or walkway; 5–6 in for a garage or driveway.",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
          hint: "10% is the usual default for a slab pour on reasonably level ground.",
        },
        {
          id: "quarterYard",
          label: "Ready-mix order increment",
          kind: "select",
          defaultImp: "1",
          defaultMet: "1",
          options: [
            { value: "1", label: "Quarter yard (0.25 yd³) — most suppliers" },
            { value: "0", label: "Whole yard (1 yd³)" },
          ],
        },
        {
          id: "edgeDepth",
          label: "Thickened edge depth (optional)",
          kind: "length",
          unitKind: "length",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Depth of the deeper edge footing, e.g. 12 in. Leave empty for a flat slab.",
        },
        {
          id: "edgeWidth",
          label: "Thickened edge width (optional)",
          kind: "length",
          unitKind: "length",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Width of the edge band, e.g. 12 in. Only used when an edge depth is entered.",
        },
        {
          id: "meshArea",
          label: "Wire-mesh sheet area (ft²)",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "160",
          defaultMet: "14.86",
          hint: `A standard 8 × 20 ft sheet is ${STANDARD_MESH_SHEET_AREA_FT2} ft². Change it to match the sheets you buy.`,
        },
        {
          id: "pricePerYd3",
          label: "Price per cubic yard (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerBag80",
          label: "Price per 80 lb bag (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Used only when no per-yard price is entered.",
        },
      ],
      compute: (v, present) => {
        const r = calculateSlab({
          lengthFt: req(v, "length"),
          widthFt: req(v, "width"),
          thicknessFt: req(v, "thickness"),
          wastePct: req(v, "waste"),
          quarterYardRounding: req(v, "quarterYard") === 1,
          edgeDepthFt: present.has("edgeDepth") ? req(v, "edgeDepth") : undefined,
          edgeWidthFt: present.has("edgeWidth") ? req(v, "edgeWidth") : undefined,
          meshSheetAreaFt2: req(v, "meshArea"),
          pricePerYd3: present.has("pricePerYd3") ? req(v, "pricePerYd3") : undefined,
          pricePerBag80: present.has("pricePerBag80") ? req(v, "pricePerBag80") : undefined,
        });
        const quarter = req(v, "quarterYard") === 1;
        return {
          rows: [
            {
              label: "Slab volume",
              value: `${fmt(r.volumeYd3)} yd³`,
              detail: `${fmt(r.volumeFt3)} ft³${r.edgeExtraFt3 > 0 ? ` (includes ${fmt(r.edgeExtraFt3)} ft³ thickened edge)` : ""}`,
            },
            {
              label: `With ${fmt(req(v, "waste"), 0)}% waste`,
              value: `${fmt(r.adjustedYd3)} yd³`,
              detail: `${fmt(r.adjustedFt3)} ft³`,
            },
            {
              label: "Ready-mix to order",
              value: `${fmt(r.orderYd3)} yd³`,
              detail: quarter ? "Rounded up to the next 0.25 yd³" : "Rounded up to whole yards",
            },
            {
              label: "80 lb bags",
              value: `${r.bags80} bags`,
              detail: `${CONCRETE_BAG_YIELDS_FT3[80]} ft³ per bag (QUIKRETE No. 1101)`,
            },
            {
              label: "60 lb bags",
              value: `${r.bags60} bags`,
              detail: `${CONCRETE_BAG_YIELDS_FT3[60]} ft³ per bag`,
            },
            {
              label: "40 lb bags",
              value: `${r.bags40} bags`,
              detail: `${CONCRETE_BAG_YIELDS_FT3[40]} ft³ per bag`,
            },
            {
              label: "Wire-mesh sheets",
              value: `${r.meshSheets} ${r.meshSheets === 1 ? "sheet" : "sheets"}`,
              detail: "Information only — not a structural specification",
            },
          ],
          lines: [
            `Ready-mix concrete: ${fmt(r.orderYd3)} yd³`,
            `80 lb bags of concrete mix: ${r.bags80} (or ${r.bags60} × 60 lb, or ${r.bags40} × 40 lb)`,
            `Wire-mesh sheets: ${r.meshSheets}`,
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(req(v, "length"))} × ${fmt(req(v, "width"))} × ${fmt(req(v, "thickness"), 3)} ft = ${fmt(r.baseVolumeFt3)} ft³${r.edgeExtraFt3 > 0 ? ` + ${fmt(r.edgeExtraFt3)} ft³ edge` : ""} = ${fmt(r.volumeYd3)} yd³; with ${fmt(req(v, "waste"), 0)}% waste = ${fmt(r.adjustedYd3)} yd³ → order ${fmt(r.orderYd3)} yd³.`,
          note: "Reinforcement shown here is a quantity guide only. A slab's structural design needs a qualified professional.",
        };
      },
    },
  ],
};
