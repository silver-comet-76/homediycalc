/**
 * Primer Calculator config — gallons of primer for walls.
 * Distinct from the Paint Calculator: primer is the sealing first
 * coat, and the surface condition decides how much it drinks.
 * See src/lib/formulas/primer.ts and docs/FORMULAS.md §21.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculatePrimer } from "../../lib/formulas/primer";
import {
  roomWallArea,
  STANDARD_DOOR_AREA_FT2,
  STANDARD_WINDOW_AREA_FT2,
} from "../../lib/formulas/paint";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function primerOutput(netAreaFt2: number, v: Record<string, number>, present: Set<string>) {
  const r = calculatePrimer({
    netAreaFt2,
    coats: req(v, "coats"),
    coverageFt2PerGal: req(v, "coverage"),
    conditionFactor: req(v, "condition"),
    wastePct: req(v, "waste"),
    pricePerGal: present.has("pricePerGal") ? req(v, "pricePerGal") : undefined,
  });
  return {
    rows: [
      {
        label: "Wall area to prime",
        value: `${fmt(netAreaFt2)} ft²`,
        detail: `${fmt(req(v, "coats"), 0)} coat${req(v, "coats") === 1 ? "" : "s"} at ${fmt(req(v, "coverage"), 0)} ft²/gal`,
      },
      {
        label: "Primer needed",
        value: `${fmt(r.adjustedGallons)} gal`,
        detail: `Surface factor ${fmt(req(v, "condition"), 2)}×, ${fmt(req(v, "waste"), 0)}% waste included`,
      },
      {
        label: "Gallons to buy",
        value: `${r.gallonsToBuy} gal`,
        detail: `${fmt(r.litersToBuy)} L — rounded up to whole gallons`,
      },
    ],
    lines: [
      `Primer: ${r.gallonsToBuy} gal (${fmt(r.litersToBuy)} L)`,
      `Covers ${fmt(netAreaFt2)} ft² with ${fmt(req(v, "coats"), 0)} coat${req(v, "coats") === 1 ? "" : "s"} at ${fmt(req(v, "coverage"), 0)} ft²/gal`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(netAreaFt2)} ft² × ${fmt(req(v, "coats"), 0)} coat${req(v, "coats") === 1 ? "" : "s"} × ${fmt(req(v, "condition"), 2)} (surface) ÷ ${fmt(req(v, "coverage"), 0)} ft²/gal = ${fmt(r.adjustedGallons)} gal → buy ${r.gallonsToBuy} gal.`,
    note: [
      { text: "Primer is a separate coat from paint — the " },
      { text: "Paint Calculator", calc: "paint-calculator" },
      { text: " does not include it. One coat is usually enough; stained surfaces may need two." },
    ],
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "coats",
    label: "Coats",
    kind: "count",
    defaultImp: "1",
    defaultMet: "1",
    min: 1,
    max: 5,
    hint: "One coat is standard. Stained or patched surfaces sometimes need a second coat.",
  },
  {
    id: "coverage",
    label: "Coverage",
    kind: "number",
    unitKind: "coverage",
    impUnit: "ft2/gal",
    metUnit: "m2/L",
    defaultImp: "300",
    defaultMet: "7.36",
    hint: "ft² per gallon per coat (7.36 m² per litre in metric). Sherwin-Williams ProBlock primers print 400 ft²/gal; PVA drywall primer runs 250–300 ft²/gal on new drywall. Check your can.",
  },
  {
    id: "condition",
    label: "Surface condition",
    kind: "select",
    defaultImp: "1.2",
    defaultMet: "1.2",
    options: [
      { value: "1", label: "Previously painted, sound — ×1.00" },
      { value: "1.2", label: "New drywall / bare plaster — ×1.20" },
      { value: "1.3", label: "Bare wood — ×1.30" },
      { value: "1.15", label: "Stained / patched — ×1.15" },
    ],
    hint: "Porous surfaces drink primer: at the 300 ft²/gal default, new drywall works out to 250 ft²/gal — the low end of the PVA range. Factors are estimating guidance, not a manufacturer figure.",
  },
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent",
    defaultImp: "10",
    defaultMet: "10",
    hint: "Covers what stays in the roller, tray, and brush, plus touch-ups.",
  },
  {
    id: "pricePerGal",
    label: "Price per gallon (optional)",
    kind: "price",
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const primerConfig: CalculatorConfig = {
  slug: "primer-calculator",
  designCplus: true,
  heroResultLabel: "Gallons to buy",
  lookupTable: {
    note: "Assumes 8 ft ceilings, 1 coat, 300 ft²/gal coverage, new drywall or bare plaster (×1.20), 10% waste, 1 door (21 ft²) and 2 windows (15 ft² each).",
    headers: ["Room size", "Wall area to prime", "Primer needed", "Gallons to buy"],
    rows: [
      ["10 × 10 ft room", "269 ft²", "1.18 gal", "2 gal"],
      ["12 × 12 ft room", "333 ft²", "1.47 gal", "2 gal"],
      ["12 × 15 ft room", "381 ft²", "1.68 gal", "2 gal"],
      ["15 × 20 ft room", "509 ft²", "2.24 gal", "3 gal"],
      ["20 × 20 ft room", "589 ft²", "2.59 gal", "3 gal"],
    ],
  },
  diagram: "wall",
  defaultMode: "room",
  formula:
    "Primer = net wall area × coats × surface factor ÷ coverage, plus the waste allowance, rounded up to whole gallons. " +
    "Default coverage is 300 ft²/gal — between Sherwin-Williams ProBlock primers at 400 ft²/gal and PVA drywall primer at 250–300 ft²/gal on new drywall. " +
    "The surface factor adjusts for how porous the wall is: ×1.00 for a sound painted wall, ×1.20 for new drywall, ×1.30 for bare wood, ×1.15 for stained or patched surfaces.",
  howTo: [
    "Measure the walls the same way as for paint: room length × width × height, minus doors and windows. A standard door is about 21 ft² and a standard window about 15 ft².",
    "Decide whether you need primer at all. Always prime new drywall, joint compound, bare wood, masonry, and metal — and over water, smoke, and tannin stains, and for a dark-to-light color change. A sound painted wall in a similar color usually needs none.",
    "Pick the surface condition. New drywall and bare wood are thirsty and take about 20–30% more primer than a sealed, previously painted wall.",
    "Read the coverage off the can. ProBlock-type all-purpose primers print 400 ft²/gal; PVA drywall primer prints 250–300 ft²/gal on new drywall.",
  ],
  workedExample:
    "Net wall area 400 ft² of new drywall, 1 coat, coverage 300 ft²/gal: 400 × 1.20 ÷ 300 = 1.60 gal. " +
    "With 10% waste that is 1.76 gal, so buy 2 gallons. The same 400 ft² on a previously painted wall needs 1.47 gal with waste — still 2 gallons, but with more left over.",
  limitations: [
    "Coverage varies by product and surface. The 300 ft²/gal default sits between the ProBlock 400 ft²/gal figure and the PVA 250–300 ft²/gal range — it is a reference value, not a guarantee for the primer you buy.",
    "The surface-condition factors are estimating guidance derived from those published coverage ranges, not manufacturer figures. Rough, textured, or damaged surfaces can drink more.",
    "Stain-blocking and shellac-based primers cover less and cost more per gallon than the latex primers this default assumes — check the can.",
    "Ceilings, trim, and doors are not included — measure them separately and add their area.",
  ],
  faqs: [
    {
      question: "Do I need primer before painting?",
      answer:
        "Yes on new drywall, joint compound, bare wood, masonry, and metal; over water, smoke, and tannin stains; and for a dark-to-light color change. You can usually skip it on a sound, previously painted wall in a similar color — the old paint is already a sealed surface.",
    },
    {
      question: "How much primer do I need for a 12 × 12 room?",
      answer:
        "With 8 ft ceilings the four walls are 384 ft²; minus one door (21 ft²) and two windows (30 ft²) that is 333 ft² net. As new drywall at 300 ft²/gal with 10% waste you need 1.47 gal — buy 2 gallons. On a previously painted wall it is 1.22 gal with waste, still 2 gallons.",
    },
    {
      question: "Is primer the same as paint?",
      answer:
        "No. Primer is a sealing first coat that bonds to bare surfaces and evens out how the topcoat absorbs — it is not meant to be the finish. Paint is the durable, colored topcoat. Some paints are labeled self-priming, but over new drywall or a big color change a dedicated primer coat still gives a more even finish.",
    },
    {
      question: "How many coats of primer do I need?",
      answer:
        "One coat is standard for new drywall and bare wood. Stained surfaces sometimes need a second coat — prime, let it dry, and check whether the stain still shows through. If it does, prime again before the topcoat rather than hoping the paint will hide it.",
    },
  ],
  modes: [
    {
      id: "room",
      label: "Room dimensions",
      fields: [
        {
          id: "length",
          label: "Room length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "12",
          defaultMet: "3.66",
        },
        {
          id: "width",
          label: "Room width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "15",
          defaultMet: "4.57",
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
          id: "doors",
          label: "Doors",
          kind: "count",
          defaultImp: "1",
          defaultMet: "1",
          min: 0,
          max: 50,
          hint: `Each door deducts ${STANDARD_DOOR_AREA_FT2} ft² (3 × 7 ft) unless you change the door area below.`,
        },
        {
          id: "windows",
          label: "Windows",
          kind: "count",
          defaultImp: "2",
          defaultMet: "2",
          min: 0,
          max: 50,
          hint: `Each window deducts ${STANDARD_WINDOW_AREA_FT2} ft² (3 × 5 ft) unless you change the window area below.`,
        },
        {
          id: "doorArea",
          label: "Area per door",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "21",
          defaultMet: "1.95",
        },
        {
          id: "windowArea",
          label: "Area per window",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "15",
          defaultMet: "1.39",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const net = roomWallArea(
          req(v, "length"),
          req(v, "width"),
          req(v, "height"),
          req(v, "doors"),
          req(v, "windows"),
          req(v, "doorArea"),
          req(v, "windowArea"),
        );
        return primerOutput(net, v, present);
      },
    },
    {
      id: "area",
      label: "Known wall area",
      fields: [
        {
          id: "netArea",
          label: "Net wall area",
          kind: "area",
          unitKind: "area",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "400",
          defaultMet: "37.16",
          hint: "Wall area after subtracting doors and windows.",
        },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => primerOutput(req(v, "netArea"), v, present),
    },
  ],
};
