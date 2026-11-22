/**
 * Paint Calculator config — gallons of paint for walls.
 * See src/lib/formulas/paint.ts and docs/FORMULAS.md §3.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import {
  calculatePaint,
  roomWallArea,
  STANDARD_DOOR_AREA_FT2,
  STANDARD_WINDOW_AREA_FT2,
} from "../../lib/formulas/paint";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function paintOutput(netAreaFt2: number, v: Record<string, number>, present: Set<string>) {
  const r = calculatePaint({
    netAreaFt2,
    coats: req(v, "coats"),
    coverageFt2PerGal: req(v, "coverage"),
    wastePct: req(v, "waste"),
    pricePerGal: present.has("pricePerGal") ? req(v, "pricePerGal") : undefined,
  });
  return {
    rows: [
      {
        label: "Paintable area",
        value: `${fmt(netAreaFt2)} ft²`,
        detail: `${fmt(req(v, "coats"), 0)} coat${req(v, "coats") === 1 ? "" : "s"} at ${fmt(req(v, "coverage"), 0)} ft²/gal`,
      },
      {
        label: "Paint needed",
        value: `${fmt(r.rawGallons)} gal`,
        detail: `${fmt(r.adjustedGallons)} gal with ${fmt(req(v, "waste"), 0)}% waste`,
      },
      {
        label: "Gallons to buy",
        value: `${r.gallonsToBuy} gal`,
        detail: `${fmt(r.litersToBuy)} L — rounded up to whole gallons`,
      },
    ],
    lines: [
      `Interior paint: ${r.gallonsToBuy} gal (${fmt(r.litersToBuy)} L)`,
      `Covers ${fmt(netAreaFt2)} ft² with ${fmt(req(v, "coats"), 0)} coat${req(v, "coats") === 1 ? "" : "s"} at ${fmt(req(v, "coverage"), 0)} ft²/gal`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(netAreaFt2)} ft² × ${fmt(req(v, "coats"), 0)} coats ÷ ${fmt(req(v, "coverage"), 0)} ft²/gal = ${fmt(r.rawGallons)} gal; with ${fmt(req(v, "waste"), 0)}% waste = ${fmt(r.adjustedGallons)} gal → buy ${r.gallonsToBuy} gal.`,
    note: "Primer is not included. New drywall, bare wood, and big color changes need a coat of primer first — see the Primer Calculator.",
  };
}

export const paintConfig: CalculatorConfig = {
  slug: "paint-calculator",
  diagram: "wall",
  defaultMode: "room",
  formula:
    "Net area = wall area − doors and windows. Paint = net area × coats ÷ coverage. " +
    "Add the waste allowance, then round up to whole gallons. Default coverage 350 ft²/gal is the low end " +
    "of the 350–400 ft²/gal range on Sherwin-Williams interior latex data sheets (SuperPaint / Duration Home, " +
    "at 4 mils wet) — always use the figure printed on the can you buy.",
  howTo: [
    "Measure each wall's length and height in feet. Wall area is 2 × (room length + room width) × wall height — the calculator does this for you in Room mode.",
    "Subtract doors and windows. A standard interior door is about 21 ft² (3 × 7 ft) and a standard window about 15 ft² (3 × 5 ft); edit the sizes if yours differ.",
    "Count your coats: two coats is standard over a similar color; a big color change or new drywall usually needs primer plus two coats.",
    "Read the coverage off the can. Most interior latex paints list 350–400 ft² per gallon per coat on a smooth, sealed surface; rough or porous surfaces cover less.",
  ],
  workedExample:
    "Net wall area 400 ft², 2 coats, coverage 350 ft²/gal: 400 × 2 ÷ 350 = 2.29 gal. " +
    "With 10% waste that is 2.51 gal, so buy 3 gallons.",
  limitations: [
    "Coverage varies by surface, color change, and application method. The 350 ft²/gal default is a reference value from one manufacturer's data sheets, not a guarantee for your paint.",
    "Ceilings, trim, and doors are not included — measure them separately and add their area.",
    "The calculator does not include primer. New drywall, patched walls, and dark-to-light changes need primer first.",
  ],
  faqs: [
    {
      question: "How much paint do I need for a 12 × 12 room?",
      answer:
        "With 8 ft ceilings, the four walls are 384 ft². Minus one door (21 ft²) and two windows (30 ft²) that is 333 ft² net. At 350 ft²/gal and 2 coats you need 1.90 gal, or 2.09 gal with 10% waste — buy 3 gallons.",
    },
    {
      question: "How many square feet does a gallon of paint cover?",
      answer:
        "Most interior latex paints list 350–400 ft² per gallon per coat — Sherwin-Williams SuperPaint and Duration Home both print that range. The calculator defaults to 350, the conservative end. Check your can: some paints list as little as 250 ft²/gal.",
    },
    {
      question: "Do I need primer before painting?",
      answer:
        "Yes for new drywall, bare wood, patched areas, stains, and big color changes. Primer seals the surface so the topcoat covers evenly; without it you often need a third coat of paint, which costs more than the primer.",
    },
    {
      question: "How many coats of paint should I apply?",
      answer:
        "Two coats is the standard for walls. One coat rarely gives even color or full durability, even with self-priming paint. A third coat is sometimes needed over very dark colors or on new drywall without primer.",
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
        {
          id: "coats",
          label: "Coats",
          kind: "count",
          defaultImp: "2",
          defaultMet: "2",
          min: 1,
          max: 5,
        },
        {
          id: "coverage",
          label: "Coverage",
          kind: "number",
          unitKind: "coverage",
          impUnit: "ft2/gal",
          metUnit: "m2/L",
          defaultImp: "350",
          defaultMet: "8.59",
          hint: "ft² per gallon per coat (8.59 m² per litre in metric). Sherwin-Williams interior latex lists 350–400 ft²/gal; check your can.",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
          hint: "Covers touch-ups, spills, and paint left in the roller and tray.",
        },
        {
          id: "pricePerGal",
          label: "Price per gallon (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
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
        return paintOutput(net, v, present);
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
        {
          id: "coats",
          label: "Coats",
          kind: "count",
          defaultImp: "2",
          defaultMet: "2",
          min: 1,
          max: 5,
        },
        {
          id: "coverage",
          label: "Coverage",
          kind: "number",
          unitKind: "coverage",
          impUnit: "ft2/gal",
          metUnit: "m2/L",
          defaultImp: "350",
          defaultMet: "8.59",
          hint: "ft² per gallon per coat (8.59 m² per litre in metric). Sherwin-Williams interior latex lists 350–400 ft²/gal; check your can.",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
        },
        {
          id: "pricePerGal",
          label: "Price per gallon (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
      ],
      compute: (v, present) => paintOutput(req(v, "netArea"), v, present),
    },
  ],
};
