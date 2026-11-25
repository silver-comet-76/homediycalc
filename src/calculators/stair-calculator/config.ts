/**
 * Stair Calculator config — risers, treads, run, stringer, and angle for a
 * straight staircase. See src/lib/formulas/stair.ts and docs/FORMULAS.md.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateStair } from "../../lib/formulas/stair";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const stairConfig: CalculatorConfig = {
  slug: "stair-calculator",
  lookupTable: {
    note: "Assumes a 10.5 in tread depth and a 7.75 in maximum riser height (IRC R311.7.5.1/R311.7.5.2).",
    headers: ["Total rise", "Risers", "Treads", "Total run", "Stringer length", "Stair angle"],
    rows: [
      ["72 in (6 ft)", "10 risers", "9 treads", "94.5 in", "118.8 in", "37.3°"],
      ["84 in (7 ft)", "11 risers", "10 treads", "105 in", "134.47 in", "38.7°"],
      ["96 in (8 ft)", "13 risers", "12 treads", "126 in", "158.4 in", "37.3°"],
      ["105 in (8.75 ft)", "14 risers", "13 treads", "136.5 in", "172.21 in", "37.6°"],
      ["120 in (10 ft)", "16 risers", "15 treads", "157.5 in", "198.01 in", "37.3°"],
    ],
  },
  defaultMode: "straight",
  formula:
    "Risers = total rise ÷ maximum riser height, rounded up, so no riser exceeds the " +
    "maximum — 7.75 in under the 2021 IRC (R311.7.5.1). Each riser is then total rise ÷ " +
    "riser count, so every riser is the same height. Treads = risers − 1 (the upper floor " +
    "is the last tread). Total run = treads × tread depth; tread depth must be at least " +
    "10 in under the IRC (R311.7.5.2). Stringer length is the hypotenuse: " +
    "√(rise² + run²). Stair angle = atan(rise ÷ run).",
  howTo: [
    "Measure the total rise floor to floor, in inches: from the finished floor below to the finished floor above. Do not measure to the ceiling — the rise is the height the stairs actually climb.",
    "Pick a tread depth. 10 in is the IRC minimum (R311.7.5.2); 10.5–11 in is comfortable for most feet.",
    "Check the maximum riser height. 7.75 in is the IRC maximum (R311.7.5.1); your local code may amend the IRC limits, so check it before you build.",
    "Check you have room for the total run. A straight stair for a 105 in rise needs about 11 ft 5 in of horizontal run — measure the space and make sure nothing blocks it.",
    "Check headroom above the stairs: at least 6 ft 8 in clear above the tread nosings (IRC R311.7.2). If the run does not fit or the headroom is short, the stair needs a landing or a turn, which this calculator does not cover.",
  ],
  workedExample:
    "A total rise of 105 in (8 ft 9 in) with a 10.5 in tread: 105 ÷ 7.75 = 13.5, so " +
    "14 risers at 7.5 in each; 13 treads × 10.5 in = 136.5 in of run (11 ft 4.5 in); " +
    "the stringer is √(105² + 136.5²) = 172.2 in (about 14 ft 4 in), at a 37.6° angle.",
  limitations: [
    "Straight stairs only. It does not cover winders, landings, or stairs that turn.",
    "Riser heights must stay within ⅜ in of each other under the IRC — this calculator makes them all equal, so that rule is met by construction.",
    "Local building codes vary and may amend the IRC limits, and the 2024 IRC renumbers the stair section to R318.7. Check your local code before building.",
    "This is a quantity and layout estimate, not a structural design. Stringer sizing, lumber species and grade, and support details need a qualified professional or your local code's span tables.",
    "Headroom, stair width, handrails, and guards are not checked. The IRC requires at least 6 ft 8 in of headroom, a minimum stair width of 36 in, and a handrail on at least one side for stairs with 4 or more risers — verify all of these separately.",
    "One flight of stairs may not exceed 12 ft 7 in (151 in) of vertical rise between floors or landings (IRC R311.7.3). This calculator does not enforce that limit — a taller rise needs an intermediate landing.",
    "Landings must be at least 36 in deep in the direction of travel (IRC R311.7.6). This calculator does not cover landings.",
  ],
  faqs: [
    {
      question: "How many steps do I need for an 8-foot ceiling?",
      answer:
        "An 8 ft ceiling is 96 in, so 96 ÷ 7.75 = 12.39, which rounds up to 13 risers at 7.38 in each, with 12 treads. At a 10.5 in tread depth the run is 12 × 10.5 = 126 in (10.5 ft). Measure floor to floor — the rise is usually a few inches more than the ceiling height because of the floor structure above, so measure the actual floors before you cut anything.",
    },
    {
      question: "What is the maximum riser height?",
      answer:
        "7.75 in (7-¾ in) under the 2021 International Residential Code, section R311.7.5.1. Local codes may set a lower limit, so check yours before building. Risers must also stay within ⅜ in of each other — the tallest riser cannot exceed the shortest by more than ⅜ in.",
    },
    {
      question: "How do I calculate stringer length?",
      answer:
        "By Pythagoras: stringer length = √(total rise² + total run²). For a 105 in rise with a 136.5 in run, that is √(105² + 136.5²) = 172.2 in. Cut the stringer a little long and trim it to fit on site — the calculator gives the straight-line length, not a cutting list.",
    },
    {
      question: "How deep should stair treads be?",
      answer:
        "At least 10 in under the 2021 IRC (R311.7.5.2); 10.5–11 in is comfortable for most feet. Treads under 11 in deep also need a nosing — a projection of ¾ in to 1-¼ in past the riser below — so the usable tread depth is the tread plus the nosing.",
    },
  ],
  modes: [
    {
      id: "straight",
      label: "Straight staircase",
      fields: [
        {
          id: "totalRise",
          label: "Total rise (floor to floor)",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "105",
          defaultMet: "266.7",
          hint: "Measure from the finished floor below to the finished floor above, in inches.",
        },
        {
          id: "treadDepth",
          label: "Tread depth",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "10.5",
          defaultMet: "26.7",
          hint: "10 in is the IRC minimum (R311.7.5.2); 10.5–11 in is comfortable.",
        },
        {
          id: "maxRiser",
          label: "Maximum riser height",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "7.75",
          defaultMet: "19.7",
          hint: "7.75 in is the IRC maximum (R311.7.5.1). Lower it if your local code requires it.",
        },
      ],
      compute: (v) => {
        const r = calculateStair({
          totalRiseIn: req(v, "totalRise"),
          treadDepthIn: req(v, "treadDepth"),
          maxRiserIn: req(v, "maxRiser"),
        });
        return {
          rows: [
            {
              label: "Risers",
              value: `${r.riserCount} risers`,
              detail: `${fmt(r.riserHeightIn)} in each`,
            },
            {
              label: "Treads",
              value: `${r.treadCount} treads`,
              detail: `${fmt(req(v, "treadDepth"))} in deep`,
            },
            {
              label: "Total run",
              value: `${fmt(r.totalRunIn)} in`,
              detail: `${fmt(r.totalRunIn / 12)} ft`,
            },
            {
              label: "Stringer length",
              value: `${fmt(r.stringerLengthIn)} in`,
              detail: `${fmt(r.stringerLengthIn / 12)} ft`,
            },
            {
              label: "Stair angle",
              value: `${fmt(r.stairAngleDeg, 1)}°`,
              detail: "From horizontal",
            },
          ],
          lines: [
            `Risers: ${r.riserCount} at ${fmt(r.riserHeightIn)} in each`,
            `Treads: ${r.treadCount} at ${fmt(req(v, "treadDepth"))} in deep`,
            `Total run: ${fmt(r.totalRunIn)} in (${fmt(r.totalRunIn / 12)} ft)`,
            `Stringer length: ${fmt(r.stringerLengthIn)} in (${fmt(r.stringerLengthIn / 12)} ft)`,
          ],
          workedLine: `${fmt(req(v, "totalRise"))} in ÷ ${fmt(req(v, "maxRiser"))} in max riser = ${r.riserCount} risers at ${fmt(r.riserHeightIn)} in; ${r.treadCount} treads × ${fmt(req(v, "treadDepth"))} in = ${fmt(r.totalRunIn)} in run.`,
        };
      },
    },
  ],
};
