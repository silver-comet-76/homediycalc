/**
 * Wallpaper Calculator config — rolls needed, counted in whole
 * strips with pattern-repeat waste. Distinct from the Paint
 * Calculator: wallpaper hangs in strips, so the roll count is
 * decided by strips, not by area.
 * See src/lib/formulas/wallpaper.ts and docs/FORMULAS.md §22.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import {
  calculateWallpaper,
  getWallpaperRoll,
} from "../../lib/formulas/wallpaper";
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
      value: `${r.strips} strips`,
      detail: `${fmt(wallLengthFt)} ft of wall ÷ ${fmt(roll.widthIn, 1)} in roll width`,
    },
    {
      label: "Strip length",
      value: `${fmt(r.stripLengthFt)} ft`,
      detail: `${fmt(wallHeightFt)} ft wall + ${fmt(req(v, "repeat"), 1)} in repeat + 4 in trim`,
    },
    {
      label: "Strips per roll",
      value: r.stripsPerRoll > 0 ? `${r.stripsPerRoll} strips` : "None fits",
      detail: `${fmt(roll.lengthFt, 1)} ft roll ÷ ${fmt(r.stripLengthFt)} ft per strip, rounded down`,
    },
    {
      label: "Rolls to buy",
      value: `${r.rolls} rolls`,
      detail: `${roll.label} — rounded up`,
    },
  ];
  return {
    rows,
    lines: [
      `Wallpaper (${roll.label}): ${r.rolls} rolls`,
      `${r.strips} strips of ${fmt(r.stripLengthFt)} ft, ${r.stripsPerRoll} strips per roll`,
    ],
    costUsd: r.costUsd,
    workedLine: `${r.strips} strips × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${r.stripsPerRoll} strips per roll = ${r.rolls} rolls.`,
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
  { id: "repeat", label: "Pattern repeat", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", min: 0, defaultImp: "18", defaultMet: "45.7", hint: "Printed on the roll label, in inches. 0 for a plain or random-match paper. A large repeat is what eats rolls." },
  { id: "waste", label: "Waste allowance", kind: "percent", defaultImp: "10", defaultMet: "10", hint: "Covers cutting mistakes and damaged strips. The pattern repeat waste is already in the strip count — this is extra." },
  { id: "pricePerRoll", label: "Price per roll (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
];

export const wallpaperConfig: CalculatorConfig = {
  slug: "wallpaper-calculator",
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
  faqs: [
    {
      question: "How many rolls of wallpaper do I need for a 12 × 12 room?",
      answer:
        "It depends on the wall height and the pattern repeat. With 9 ft walls and a 27 in repeat, a 12 × 12 ft room (48 ft of wall) needs 29 strips of 11.58 ft, and a 33 ft double roll yields only 2 — 16 double rolls with 10% waste. With a plain paper the same room needs 29 strips of 9.33 ft, 3 per roll, or 11 rolls. The repeat is what moves the answer.",
    },
    {
      question: "Why does dividing wall area by roll area give the wrong answer?",
      answer:
        "Because you cannot use every square foot on a roll — only whole strips. On a 9 ft wall with an 18 in repeat, three 10.5 ft strips come off a 33 ft roll and a 1.5 ft tail is left over. That tail is perfectly good paper and it is scrap, because no strip on the wall is that short. Area division assumes the tail is usable; strip counting does not.",
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
        { id: "length", label: "Room length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "12", defaultMet: "3.66" },
        { id: "width", label: "Room width", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "15", defaultMet: "4.57" },
        { id: "height", label: "Wall height", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "8", defaultMet: "2.44" },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        wallpaperOutput(2 * (req(v, "length") + req(v, "width")), req(v, "height"), v, present),
    },
    {
      id: "length",
      label: "Known wall length",
      fields: [
        { id: "wallLength", label: "Total wall length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "54", defaultMet: "16.46", hint: "Add up every wall you are papering. For a whole rectangular room this is 2 × (length + width)." },
        { id: "height", label: "Wall height", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "8", defaultMet: "2.44" },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        wallpaperOutput(req(v, "wallLength"), req(v, "height"), v, present),
    },
  ],
};
