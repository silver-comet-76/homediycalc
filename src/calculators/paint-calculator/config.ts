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
    note: [
      {
        text: "Primer is not included. New drywall, bare wood, and big color changes need a coat of primer first — see the ",
      },
      { text: "Primer Calculator", calc: "primer-calculator" },
      { text: "." },
    ],
  };
}

export const paintConfig: CalculatorConfig = {
  slug: "paint-calculator",
  lookupTable: {
    note: "Assumes 8 ft ceilings, 2 coats, 350 ft²/gal coverage, 10% waste, 1 door (21 ft²) and 2 windows (15 ft² each).",
    headers: ["Room size", "Paintable area", "Paint needed", "Gallons to buy"],
    rows: [
      ["10 × 10 ft room", "269 ft²", "1.54 gal", "2 gal"],
      ["12 × 12 ft room", "333 ft²", "1.9 gal", "3 gal"],
      ["12 × 15 ft room", "381 ft²", "2.18 gal", "3 gal"],
      ["15 × 20 ft room", "509 ft²", "2.91 gal", "4 gal"],
      ["20 × 20 ft room", "589 ft²", "3.37 gal", "4 gal"],
    ],
  },
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
  depthSections: [
    {
      id: "three-gallon-numbers",
      heading: "Raw paint, paint with waste, and gallons to buy — three different numbers",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The calculator shows three gallon figures, and they answer three different questions. ",
            },
            { text: "Paint needed", strong: true },
            {
              text: " is the raw requirement: net wall area × coats ÷ coverage — the paint that has to end up on the wall. ",
            },
            { text: "Paint with waste", strong: true },
            {
              text: " adds the waste allowance (10% by default) for what stays in the roller and tray, spills, and touch-ups. ",
            },
            { text: "Gallons to buy", strong: true },
            {
              text: ' rounds that figure up to whole gallons. For a 12×12 ft room with 8 ft ceilings, 2 coats, 350 ft²/gal, and 10% waste, the three numbers are 1.90 gal, 2.09 gal, and 3 gal — on a net wall area of 333 ft² (384 ft² gross, minus one 21 ft² door and two 15 ft² windows). The jump from 2.09 to 3 looks like over-buying; it is not — the calculator rounds to whole gallons, and the extra is the paint you will use for touch-ups later. Check the packaging sizes your supplier actually sells: quarts are available for many paints and can cover part of the gap between 2.09 gal and 3 gal. If another calculator or a paint-store chart gives you a single number, check which of the three it is: the "2 gallons for a 12×12 room" answer several paint calculators publish is the raw figure rounded up without waste (1.90 → 2), and it leaves no paint for the roller, the tray, or a single touch-up.',
            },
          ],
        },
      ],
    },
    {
      id: "wall-area-not-floor-area",
      heading: "Why two rooms with the same floor area need different amounts of paint",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "Paint is bought by wall area, not floor area, and two rooms with the same floor area can have very different wall areas. A 10×10 ft room and a 5×20 ft room both have 100 ft² of floor, but with 8 ft ceilings the first has 320 ft² of wall (2 × (10 + 10) × 8) and the second has 400 ft² of wall (2 × (5 + 20) × 8). The long thin room needs a quarter more paint for the same floor. Ceiling height moves the answer just as much: raising the walls of a 12×12 ft room from 8 ft to 9 ft — with the same one-door and two-window deductions, two coats, 350 ft²/gal, and 10% waste — takes the gross wall area from 384 ft² to 432 ft² and the adjusted paint from 2.09 gal to 2.39 gal — still 3 gallons to buy, because both figures round up to 3. The gallon count only changes when the adjusted figure crosses a whole-gallon boundary, which is why two rooms that look similar can buy different amounts, and two rooms that look different can buy the same. Do not use floor area as a shortcut for paint; measure the walls.",
            },
          ],
        },
      ],
    },
    {
      id: "coats-and-coverage",
      heading: "One coat or two? And what coverage per gallon really means",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "Two coats is the standard for walls, and the calculator defaults to 2 for that reason. One coat rarely gives even color or full durability, even with paint labelled self-priming — the second coat is what evens out the color and builds the film thickness the coverage figure assumes. A third coat is sometimes needed over very dark colors, or on new drywall that was not primed. The coverage figure itself — 350 ft² per gallon — is a spread rate at a stated wet film thickness: Sherwin-Williams' SuperPaint Interior Latex product data sheet lists 350–400 sq ft per gallon at 4 mils wet, 1.4 mils dry (SuperPaint PDS, A86 Series, 08/2026). That is the rate on a smooth, sealed surface, applied at the stated thickness. It is not a promise for every wall: a rough or porous surface drinks more paint per square foot, so the same gallon covers less; a dark color over a light wall, or a light color over a dark wall, needs more paint to hide the old color. The calculator defaults to 350, the conservative end of the 350–400 range, for exactly that reason.",
            },
          ],
        },
      ],
    },
    {
      id: "primer-two-figures",
      heading: "Primer: two figures from the same manufacturer, and why they disagree",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "Primer coverage looks contradictory until you see where each figure comes from, so this page gives you both. Sherwin-Williams' product data sheet for its Multi-Purpose Interior-Exterior Latex Primer-Sealer lists ",
            },
            { text: "400 sq ft per gallon at 4 mils wet", strong: true },
            {
              text: " (Primer-Sealer PDS, B51-450 Series, 7/2023). Sherwin-Williams' own paint-calculator FAQ page says ",
            },
            { text: "a gallon of primer covers about 200–300 square feet", strong: true },
            {
              text: ", and that this is enough primer for a 10×10 ft or 12×12 ft room. Both figures are from Sherwin-Williams, and both are correct — they measure different things. The data-sheet figure is a theoretical spread rate on a smooth surface at a stated film thickness. The FAQ figure is a planning figure for the surfaces primer actually goes onto, notably bare drywall, which is porous and absorbs the first coat. On new drywall, plan on the 200–300 sq ft/gal range; on a previously painted wall in good condition, the data-sheet rate is closer to what you will get. The label on the can you buy wins over either figure. Worked through for the 12×12 ft room (333 ft² net): at the FAQ's planning range, one coat of primer on bare drywall needs 333 ÷ 200 to 333 ÷ 300 = 1.11 to 1.67 gal before waste — buy 2 gallons either way. The ",
            },
            { text: "Primer Calculator", calc: "primer-calculator" },
            {
              text: " does this calculation with a surface-condition adjustment and, for the same 12×12 room on new drywall, gives 1.47 gal with waste — buy 2 gallons. Primer is a separate coat from paint, and one coat is usually enough.",
            },
          ],
        },
      ],
    },
    {
      id: "worked-examples-one-wall-ceiling",
      heading: "Worked example — one wall, and a ceiling",
      blocks: [
        {
          type: "paragraph",
          text: [
            { text: "One wall, 12 ft × 8 ft (accent wall).", strong: true },
            {
              text: " Area 96 ft², measured directly — use Area mode, with no door or window deduction. Raw: 96 × 2 ÷ 350 = 0.55 gal. With 10% waste: 0.60 gal. Buy 1 gallon — or 3 quarts (0.60 gal = 2.4 quarts, rounded up to 3). Quarts here are derived arithmetic (gallons × 4), not a calculator output: the calculator reports gallons and liters only.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            { text: "Ceiling only, 12 × 12 ft.", strong: true },
            {
              text: " Area 144 ft², 2 coats, 350 ft²/gal. Raw: 144 × 2 ÷ 350 = 0.82 gal. With waste: 0.91 gal. Buy 1 gallon of ceiling paint (flat finish), not wall paint — it is formulated to hide roller marks overhead. Ceilings, trim, and doors are not in the wall-area number; measure them separately.",
            },
          ],
        },
      ],
    },
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
