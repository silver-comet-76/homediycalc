/**
 * Wallpaper Calculator config — rolls needed, counted in whole
 * strips with pattern-repeat waste. Distinct from the Paint
 * Calculator: wallpaper hangs in strips, so the roll count is
 * decided by strips, not by area.
 * See src/lib/formulas/wallpaper.ts and docs/FORMULAS.md §22.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateWallpaper, getWallpaperRoll } from "../../lib/formulas/wallpaper";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function wallpaperOutput(
  wallLengthFt: number,
  wallHeightFt: number,
  v: Record<string, number>,
  present: Set<string>,
) {
  const roll = getWallpaperRoll(req(v, "rollType"));
  const r = calculateWallpaper({
    wallLengthFt,
    wallHeightFt,
    rollWidthIn: roll.widthIn,
    rollLengthFt: roll.lengthFt,
    patternRepeatIn: req(v, "repeat"),
    wastePct: req(v, "waste"),
    pricePerRoll: present.has("pricePerRoll") ? req(v, "pricePerRoll") : undefined,
  });
  const rows: { label: string; value: string; detail?: string }[] = [
    {
      label: "Strips needed",
      value: `${r.strips} ${r.strips === 1 ? "strip" : "strips"}`,
      detail: `${fmt(wallLengthFt)} ft of wall ÷ ${fmt(roll.widthIn, 1)} in roll width`,
    },
    {
      label: "Strip length",
      value: `${fmt(r.stripLengthFt)} ft`,
      detail: `${fmt(wallHeightFt)} ft wall + ${fmt(req(v, "repeat"), 1)} in repeat + 4 in trim`,
    },
    {
      label: "Strips per roll",
      value:
        r.stripsPerRoll > 0
          ? `${r.stripsPerRoll} ${r.stripsPerRoll === 1 ? "strip" : "strips"}`
          : "None fits",
      detail: `${fmt(roll.lengthFt, 1)} ft roll ÷ ${fmt(r.stripLengthFt)} ft per strip, rounded down`,
    },
    {
      label: "Rolls to buy",
      value: `${r.rolls} ${r.rolls === 1 ? "roll" : "rolls"}`,
      detail: `${roll.label} — rounded up`,
    },
  ];
  return {
    rows,
    lines: [
      `Wallpaper (${roll.label}): ${r.rolls} ${r.rolls === 1 ? "roll" : "rolls"}`,
      `${r.strips} ${r.strips === 1 ? "strip" : "strips"} of ${fmt(r.stripLengthFt)} ft, ${r.stripsPerRoll} ${r.stripsPerRoll === 1 ? "strip" : "strips"} per roll`,
    ],
    costUsd: r.costUsd,
    workedLine: `${r.strips} ${r.strips === 1 ? "strip" : "strips"} × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${r.stripsPerRoll} ${r.stripsPerRoll === 1 ? "strip" : "strips"} per roll = ${r.rolls} ${r.rolls === 1 ? "roll" : "rolls"}.`,
    note:
      r.stripsPerRoll === 0
        ? "No full strip fits on this roll — the wall plus the pattern repeat is longer than the roll. Choose a longer roll or a paper with a smaller repeat."
        : "Doors and windows are not deducted: a strip crossing an opening is still cut full length. Area-based estimates (wall area ÷ roll area) under-order on patterned papers — this counts whole strips instead.",
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "rollType",
    label: "Roll size",
    kind: "select",
    defaultImp: "0",
    defaultMet: "0",
    options: [
      { value: "0", label: "US double roll — 20.5 in × 33 ft (56.4 ft²)" },
      { value: "1", label: "US single roll — 20.5 in × 16.5 ft (28.2 ft²)" },
      { value: "2", label: "Metric roll — 0.53 m × 10 m (57.1 ft²)" },
    ],
    hint: "Wallpaper is priced per single roll but sold per double roll. Always confirm against the label on the roll you buy.",
  },
  {
    id: "repeat",
    label: "Pattern repeat",
    kind: "length",
    unitKind: "length",
    canonicalUnit: "in",
    impUnit: "in",
    metUnit: "cm",
    min: 0,
    defaultImp: "18",
    defaultMet: "45.7",
    hint: "Printed on the roll label, in inches. 0 for a plain or random-match paper. A large repeat is what eats rolls.",
  },
  {
    id: "waste",
    label: "Waste allowance",
    kind: "percent",
    defaultImp: "10",
    defaultMet: "10",
    hint: "Covers cutting mistakes and damaged strips. The pattern repeat waste is already in the strip count — this is extra.",
  },
  {
    id: "pricePerRoll",
    label: "Price per roll (optional)",
    kind: "price",
    defaultImp: "",
    defaultMet: "",
    optional: true,
  },
];

export const wallpaperConfig: CalculatorConfig = {
  slug: "wallpaper-calculator",
  designCplus: true,
  heroResultLabel: "Rolls to buy",
  lookupTable: {
    note: "Assumes 8 ft walls, US double rolls (20.5 in × 33 ft), an 18 in pattern repeat, and 10% waste.",
    headers: ["Room size", "Strips needed", "Strip length", "Strips per roll", "Rolls to buy"],
    rows: [
      ["10 × 10 ft room (40 ft of wall)", "24 strips", "9.83 ft", "3 strips", "9 rolls"],
      ["12 × 12 ft room (48 ft of wall)", "29 strips", "9.83 ft", "3 strips", "11 rolls"],
      ["12 × 15 ft room (54 ft of wall)", "32 strips", "9.83 ft", "3 strips", "12 rolls"],
      ["15 × 20 ft room (70 ft of wall)", "41 strips", "9.83 ft", "3 strips", "16 rolls"],
      ["20 × 20 ft room (80 ft of wall)", "47 strips", "9.83 ft", "3 strips", "18 rolls"],
    ],
  },
  diagram: "wall",
  defaultMode: "room",
  formula:
    "Wallpaper hangs in whole strips: strips = wall length ÷ roll width, rounded up; each strip is wall height + pattern repeat + 4 in trim; " +
    "strips per roll = roll length ÷ strip length, rounded down; rolls = strips × (1 + waste%) ÷ strips per roll, rounded up. " +
    "A US double roll is 20.5 in × 33 ft (56.4 ft²); a single roll is half that, and a metric roll is 0.53 m × 10 m (57.1 ft²).",
  howTo: [
    "Measure the total length of the walls you are papering — the room perimeter for a whole room — and the wall height from floor to ceiling.",
    "Read the pattern repeat off the roll label, in inches. It is the single input that changes the answer most: a 27 in repeat can drop a roll from three strips to two.",
    "Pick the roll size you are buying. US wallpaper is priced per single roll but sold per double roll — make sure the price and the roll count use the same unit.",
    "Do not deduct doors and windows. A strip that crosses a window is still cut full length, and the offcut over the glass is rarely usable elsewhere.",
    "Order all rolls from the same batch (dye lot). Two rolls from different batches can be visibly different shades on the wall.",
  ],
  workedExample:
    "A 12 × 15 ft room with 8 ft walls: the perimeter is 54 ft, so 54 × 12 ÷ 20.5 = 31.6, or 32 strips. " +
    "With an 18 in pattern repeat each strip is 8 + 1.5 + 0.33 = 9.83 ft, so a 33 ft double roll yields 3 strips. " +
    "With 10% waste that is 36 strips — 12 double rolls. Dividing wall area by roll area would have said 9, and you would have run out.",
  limitations: [
    "Assumes straight-match paper, where each strip is cut one full repeat longer than the wall. Half-drop (drop-match) papers can waste more — check the match type on the label.",
    "Assumes all walls are the same height and the room is rectangular. Sloped ceilings, stairwells, and feature walls need to be measured strip by strip.",
    "The 4 in trim allowance (2 in top, 2 in bottom) is a standard estimating figure. Very uneven ceilings or deep coving may need more.",
    "Roll sizes are nominal — check the label on the pattern you are buying, because the width is what the strip count divides by.",
  ],
  depthSections: [
    {
      id: "count-strips-not-square-feet",
      heading: "Count strips, not square feet — why area math under-orders",
      takeaway:
        "Wallpaper hangs in whole strips, so the roll count is decided by strips, not by area — area division under-orders on every patterned paper. Strips = wall length ÷ roll width, rounded up; each strip is wall height + pattern repeat + 4 in trim; strips per roll = roll length ÷ strip length, rounded down; rolls = strips (plus waste) ÷ strips per roll, rounded up. For the 12×15 ft room with 8 ft walls and an 18 in repeat: 54 ft of wall needs 32 strips of 9.83 ft; a 33 ft double roll yields 3 strips; with 10% waste that is 36 strips — 12 double rolls. Dividing wall area by roll area would have said 9 rolls — 3 rolls short, discovered halfway up the last wall, when the shop may not have your dye lot any more.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "Wallpaper hangs in whole strips, so the roll count is decided by strips, not by area — and area division under-orders on every patterned paper. Strips = wall length ÷ roll width, rounded ",
            },
            { text: "up", strong: true },
            {
              text: "; each strip is wall height + pattern repeat + 4 in trim; strips per roll = roll length ÷ strip length, rounded ",
            },
            { text: "down", strong: true },
            {
              text: "; rolls = strips (plus waste) ÷ strips per roll, rounded ",
            },
            { text: "up", strong: true },
            {
              text: ". The rounding directions are the whole story. Strips round up because a wall 31.6 strips wide needs 32 strips — you cannot hang 0.6 of a strip. Strips per roll round down because a roll that yields 3.36 strips yields 3 strips and a tail — the tail is perfectly good paper and it is scrap, because no strip on the wall is that short. Area division assumes the tail is usable; strip counting does not. For the 12×15 ft room with 8 ft walls and an 18 in repeat: 54 ft of wall needs 32 strips of 9.83 ft; a 33 ft double roll yields 3 strips; with 10% waste that is 36 strips — ",
            },
            { text: "12 double rolls", strong: true },
            {
              text: ". Dividing wall area by roll area would have said 9 rolls. The area answer is 3 rolls short, and the shortfall is discovered halfway up the last wall, when the shop may not have your dye lot any more.",
            },
          ],
        },
      ],
    },
    {
      id: "how-pattern-repeat-eats-rolls",
      heading: "How the pattern repeat eats rolls (the mechanism, without invented percentages)",
      takeaway:
        "The pattern repeat is the vertical distance after which the pattern starts over, printed on the roll label in inches. Each strip is cut one full repeat longer than the wall is high: strip length = wall height + pattern repeat + 4 in trim. A longer repeat makes every strip longer, fewer strips per roll, and more rolls — a 27 in repeat on a 9 ft wall can drop a roll from three strips to two, a third of its output. A plain or random-match paper has a repeat of 0 and wastes the least. No percentage allowance is given on this page, deliberately: the 10% / 15–20% / 20–25% figures on third-party pages are rules of thumb, not manufacturer guidance — no manufacturer publishes a numeric allowance, and Graham & Brown’s support page confirms only that the repeat must be allowed for, without a number. This calculator assumes straight-match paper; half-drop (drop-match) papers can waste more — check the label, and if yours is a drop match, treat the answer as a minimum and buy an extra roll. The 10% waste allowance is separate from the repeat and covers cutting mistakes and damaged strips — do not add a second allowance for the repeat.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The pattern repeat is the vertical distance after which the pattern starts over, printed on the roll label in inches. To line the pattern up across strips, each strip is cut ",
            },
            { text: "one full repeat longer", strong: true },
            {
              text: " than the wall is high: strip length = wall height + pattern repeat + 4 in trim. That is the entire mechanism, and it is why the repeat is the single input that changes the answer most. A longer repeat makes every strip longer; longer strips mean fewer strips per roll; fewer strips per roll mean more rolls. A 27 in repeat on a 9 ft wall can drop a roll from three strips to two — a third of the roll's output, gone in one step. A plain or random-match paper has a repeat of 0 and wastes the least, because its strips are wall height plus trim only.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "No percentage allowance is given on this page, deliberately. The common figures quoted on third-party calculator and blog pages — about 10% for a plain paper, 15–20% for a straight match, 20–25% for a drop match — are rules of thumb from those pages, not manufacturer guidance: no manufacturer publishes a numeric pattern-repeat allowance, and Graham & Brown's support page (the manufacturer source checked for this page) confirms only that the repeat must be allowed for, without a number. This calculator does not need a percentage, because it counts the repeat exactly — the full repeat length is added to every strip, and the strips-per-roll division does the rest. Note the match type on your label: this calculator assumes straight-match paper, where each strip is cut one full repeat longer than the wall. Half-drop (drop-match) papers can waste more, because the pattern is offset by half a repeat on alternate strips — check the match type on the label, and if yours is a drop match, treat the calculator's answer as a minimum and buy an extra roll.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            {
              text: "The 10% waste allowance on this calculator is ",
            },
            { text: "separate", strong: true },
            {
              text: " from the repeat. It covers cutting mistakes and damaged strips. The pattern-repeat waste is already in the strip count — do not add a second allowance for it on top.",
            },
          ],
        },
      ],
    },
    {
      id: "when-no-strip-fits",
      heading: "When no strip fits on the roll",
      takeaway:
        "If the wall plus the pattern repeat is longer than the roll, no full strip fits — the calculator returns zero rolls and says so, rather than inventing a number. A 10 ft wall with a 27 in repeat needs 12.58 ft strips, which still fits a 33 ft double roll (2 strips), but a 12 ft stairwell wall with a 36 in repeat needs 15.33 ft strips, and a 16.5 ft single roll yields exactly one strip with almost nothing left over. Fixes, in order: choose a longer roll; choose a paper with a smaller repeat; or measure the tall wall strip by strip — a stairwell or sloped ceiling is not a rectangle and the room perimeter is the wrong length for it. Sloped ceilings, stairwells, and feature walls all need to be measured strip by strip.",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "If the wall plus the pattern repeat is longer than the roll, no full strip fits — the calculator returns zero rolls and says so, rather than inventing a number. It happens on tall walls with a large repeat: a 10 ft wall with a 27 in repeat needs strips 12.58 ft long, which still fits a 33 ft double roll (2 strips), but a 12 ft stairwell wall with a 36 in repeat needs 15.33 ft strips, and a 16.5 ft single roll yields exactly one strip with almost nothing left over. The fixes, in order: choose a longer roll (a double roll instead of a single); choose a paper with a smaller repeat; or measure the tall wall strip by strip instead of as part of the room total, because a stairwell or a sloped ceiling is not a rectangle and the room perimeter is the wrong length for it. Sloped ceilings, stairwells, and feature walls all need to be measured strip by strip — the calculator assumes all walls are the same height and the room is rectangular, and its limitations already say so.",
            },
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How many rolls of wallpaper do I need for a 12 × 12 room?",
      answer:
        "It depends on the wall height and the pattern repeat. With 9 ft walls and a 27 in repeat, a 12 × 12 ft room (48 ft of wall) needs 29 strips of 11.58 ft, and a 33 ft double roll yields only 2 — 16 double rolls with 10% waste. With a plain paper the same room needs 29 strips of 9.33 ft, 3 per roll, or 11 rolls. The repeat is what moves the answer.",
    },
    {
      question: "Why does dividing wall area by roll area give the wrong answer?",
      answer:
        "Because you cannot use every square foot on a roll — only whole strips. On a 9 ft wall with an 18 in repeat, three 10.83 ft strips come off a 33 ft roll and a 0.5 ft tail is left over. That tail is perfectly good paper and it is scrap, because no strip on the wall is that short. Area division assumes the tail is usable; strip counting does not.",
    },
    {
      question: "What is a pattern repeat?",
      answer:
        "The vertical distance after which the pattern starts over — printed on the roll label in inches. To line the pattern up across strips, each strip is cut one full repeat longer than the wall is high. A plain or random-match paper has a repeat of 0 and wastes the least; a 27 in repeat on a 9 ft wall can waste a third of every roll.",
    },
    {
      question: "Should I subtract doors and windows from the wall area?",
      answer:
        "No — not for wallpaper. A strip that crosses a door or window is still cut to full wall height, and the piece over the opening is waste. Deducting the openings is what area-based calculators do, and it is one of the reasons they under-order.",
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
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        wallpaperOutput(2 * (req(v, "length") + req(v, "width")), req(v, "height"), v, present),
    },
    {
      id: "length",
      label: "Known wall length",
      fields: [
        {
          id: "wallLength",
          label: "Total wall length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "54",
          defaultMet: "16.46",
          hint: "Add up every wall you are papering. For a whole rectangular room this is 2 × (length + width).",
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
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => wallpaperOutput(req(v, "wallLength"), req(v, "height"), v, present),
    },
  ],
};
