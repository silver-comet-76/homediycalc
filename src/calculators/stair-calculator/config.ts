/**
 * Stair Calculator config — risers, treads, run, stringer, and angle for a
 * straight staircase. See src/lib/formulas/stair.ts and docs/FORMULAS.md.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateStair } from "../../lib/formulas/stair";
import { convertLength } from "../../lib/units";
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
    "This calculator gives preliminary planning estimates under the 2021 IRC assumptions stated here. It does not guarantee compliance with your local building code, which may adopt a different code edition or amend these limits — check with your local authority having jurisdiction before building.",
    "Straight stairs only. It does not cover winders, landings, or stairs that turn.",
    "Riser heights must stay within ⅜ in of each other under the IRC — this calculator makes them all equal, so that rule is met by construction.",
    "Local building codes vary and may amend the IRC limits, and the 2024 IRC renumbers the stair section to R318.7. Check your local code before building.",
    "This is a quantity and layout estimate, not a structural design. Stringer sizing, lumber species and grade, and support details need a qualified professional or your local code's span tables.",
    "Headroom, stair width, handrails, and guards are not checked. The IRC requires at least 6 ft 8 in of headroom, a minimum stair width of 36 in, and a handrail on at least one side for stairs with 4 or more risers — verify all of these separately.",
    "One flight of stairs may not exceed 12 ft 7 in (151 in) of vertical rise between floors or landings (IRC R311.7.3). This calculator does not reject a taller rise — it shows a warning and returns the straight-flight numbers as a planning estimate only. A taller rise needs an intermediate landing, which this calculator does not design.",
    "Landings must be at least 36 in deep in the direction of travel (IRC R311.7.6). This calculator does not cover landings.",
    "This calculator gives a preliminary planning estimate for a straight staircase. It does not certify a stair as code-compliant, does not produce cut-ready stringer designs (cut angles and connection details are not calculated), and does not guarantee compliance with any code — the 2021 IRC is a model code that local jurisdictions adopt with amendments, and the local building department governs. The 2024 IRC renumbers the stair section to R318.7 with the dimensions unchanged (as reported by secondary sources; the ICC text was not read for this page).",
  ],
  depthSections: [
    {
      id: "how-riser-count-is-decided",
      heading: "How the riser count is decided (and why it always rounds up)",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The calculator starts from the one number you cannot change — the total rise, floor to floor — and the one number the code caps — the maximum riser height, 7.75 in under the 2021 IRC (R311.7.5.1). It divides the rise by the maximum and rounds ",
            },
            { text: "up", strong: true },
            {
              text: ": a 105 in rise divided by 7.75 in is 13.55, so the stair has 14 risers, each 105 ÷ 14 = 7.5 in high. Rounding up is what keeps every riser under the maximum. Rounding to the nearest whole number would give 14 here too, but for a 96 in rise it would give 12 risers at exactly 8 in each — over the limit. Once the count is fixed, every riser is made the same height (total rise ÷ riser count), which also satisfies the IRC rule that risers in a flight stay within ⅜ in of each other — the calculator meets it by construction, because all its risers are identical. The tread count is then one less than the riser count, because the upper floor is the last tread: 14 risers need 13 treads. If you lower the maximum riser below 7.75 in — because your local code requires it, or because you want a gentler stair — the riser count goes up, each riser gets shorter, and the total run gets longer. There is no free lunch in stair geometry: a shorter riser always costs floor space.",
            },
          ],
        },
      ],
    },
    {
      id: "the-151-inch-rule",
      heading: "The 151-inch rule: warning, not rejection",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "One flight of stairs may not rise more than 12 ft 7 in (151 in) between floor levels or landings (2021 IRC R311.7.3). This calculator does ",
            },
            { text: "not", strong: true },
            {
              text: " enforce that limit the way it enforces the riser and tread limits. A total rise of exactly 151 in returns numbers with no warning — 151 in is the limit itself, and it is allowed. A rise of 152 in returns the same kind of numbers, but with a warning: the rise exceeds the single-flight limit, a landing is required between floors, and the numbers are a straight-flight planning estimate only, not a compliant single-flight design. In metric, the same boundary is 383.54 cm — exactly 151 in, so it shows no warning — and 383.5401 cm is just over the limit, so it warns. The distinction matters: the riser and tread limits are about the shape of each step, and a step that breaks them is wrong in itself, so the calculator refuses it. The flight limit is about the shape of the whole stair, and a rise over 151 in is not wrong as a measurement — it is a stair that needs a landing, which this calculator does not design. Do not strip the warning out when quoting the numbers, and do not treat a warned result as a design you can build as a single flight.",
            },
          ],
        },
      ],
    },
    {
      id: "metric-display",
      heading: "Metric display — the same staircase in centimeters",
      blocks: [
        {
          type: "paragraph",
          text: [
            {
              text: "The calculator works in canonical inches internally and converts only for display, so the metric results describe the same physical staircase as the imperial ones. The metric defaults are 266.7 cm total rise (105 in), 26.67 cm tread depth (10.5 in), and 19.685 cm maximum riser (7.75 in). Note which figure is which: ",
            },
            { text: "19.685 cm is the maximum riser height", strong: true },
            {
              text: "; the tread depth is 26.67 cm. Swapping them would describe a staircase with 19.685 cm treads — under the 10 in (25.4 cm) minimum — and the calculator would reject it. For the 105 in example in metric: 266.7 cm rise, 14 risers at 19.05 cm each, 13 treads at 26.67 cm, total run 346.71 cm, stringer length about 437.4 cm, angle 37.57°. Switching between imperial and metric and back restores the same values and the same warning state: the calculation stays in canonical inches and only the display converts, so repeated switching does not drift the input or change whether the 151 in warning shows. The lookup table on the page stays in inches as a static reference; the calculator itself converts every result when you switch systems.",
            },
          ],
        },
      ],
    },
    {
      id: "worked-examples-9-ft-boundary-refusals",
      heading: "Worked examples — the 9 ft rise, the boundary, and what the calculator refuses",
      blocks: [
        {
          type: "paragraph",
          text: [
            { text: "9 ft floor-to-floor rise, 108 in (the most-asked example).", strong: true },
            {
              text: " Risers: 108 ÷ 7.75 = 13.94 → 14 risers. Riser height: 108 ÷ 14 = 7.71 in. Treads: 13. Total run: 13 × 10.5 = 136.5 in (11 ft 4.5 in). Stringer: √(108² + 136.5²) = 174.06 in (14 ft 6 in). Angle: 38.35°. In metric: rise 274.32 cm, risers 14 at 19.59 cm, run 346.71 cm, stringer 442.11 cm. The 108 in and 105 in rises share the same 136.5 in run, but the 108 in stair is steeper (38.35° vs 37.57°).",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            { text: "The boundary: 151 in vs 152 in.", strong: true },
            {
              text: " At 151 in: 20 risers at 7.55 in, 19 treads, run 199.5 in, stringer 250.20 in, 37.12° — ",
            },
            { text: "no warning", strong: true },
            {
              text: " (151 in is the limit itself). At 152 in: 20 risers at 7.6 in, 19 treads, run 199.5 in, stringer 250.81 in, 37.30° — ",
            },
            { text: "warning shown, numbers still returned", strong: true },
            {
              text: " as a straight-flight planning estimate. At 160 in: 21 risers at 7.62 in, 20 treads, run 210 in, stringer 264.01 in, 37.30° — warning shown. The numbers barely change across the boundary; what changes is what you are allowed to build as a single flight.",
            },
          ],
        },
        {
          type: "paragraph",
          text: [
            { text: "What the calculator refuses.", strong: true },
            {
              text: " A maximum riser of 8 in is rejected: the formula throws and the input field caps at 7.75. A tread depth under 10 in is rejected the same way. These are not warnings you can dismiss; no result is produced from invalid input.",
            },
          ],
        },
      ],
    },
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
        "7.75 in (7-¾ in) under the 2021 International Residential Code, section R311.7.5.1. Local codes may amend the limit, so check yours before building. Risers must also stay within ⅜ in of each other — the tallest riser cannot exceed the shortest by more than ⅜ in.",
    },
    {
      question: "How do I calculate stringer length?",
      answer:
        "By Pythagoras: stringer length = √(total rise² + total run²). For a 105 in rise with a 136.5 in run, that is √(105² + 136.5²) = 172.2 in. Cut the stringer a little long and trim it to fit on site — the calculator gives the straight-line length, not a cutting list.",
    },
    {
      question: "How deep should stair treads be?",
      answer:
        "At least 10 in under the 2021 IRC (R311.7.5.2); 10.5–11 in is comfortable for most feet. Tread depth is measured horizontally between the vertical planes of the foremost projection of adjacent treads — the nosing tip is the foremost projection, so the nosing is included in the 10 in, not added on top of it. On stairs with solid risers and treads under 11 in deep, the IRC requires a nosing projecting ¾ in to 1-¼ in past the riser below (R311.7.5.3); no nosing is required once the tread is 11 in or deeper.",
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
          // Exactly 10.5 in (10.5 × 2.54 = 26.67 cm) so the metric
          // defaults are the same physical staircase as the imperial
          // ones — Reset in either system gives identical results.
          defaultMet: "26.67",
          min: 10,
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
          defaultMet: "19.685",
          max: 7.75,
          hint: "7.75 in is the IRC maximum (R311.7.5.1) and the highest value this calculator accepts. Lower it if your local code requires it.",
        },
      ],
      compute: (v, _present, system) => {
        const r = calculateStair({
          totalRiseIn: req(v, "totalRise"),
          treadDepthIn: req(v, "treadDepth"),
          maxRiserIn: req(v, "maxRiser"),
        });
        // Phase 16A: results respect the selected unit system. The
        // calculation stays canonical inches; only the presentation
        // converts, once, through the unit engine — never from an
        // already-converted display value. Imperial output is
        // unchanged from before. In metric, lengths show in cm with
        // the larger measure in m as the detail. The lookup table
        // stays in inches (a static reference table, out of scope).
        const metric = system === "metric";
        /** A canonical-inch length as displayed in the active system. */
        const len = (inches: number) =>
          metric ? `${fmt(convertLength(inches, "in", "cm"))} cm` : `${fmt(inches)} in`;
        /** The larger-scale detail for a length (ft in imperial, m in metric). */
        const lenDetail = (inches: number) =>
          metric ? `${fmt(convertLength(inches, "in", "m"))} m` : `${fmt(inches / 12)} ft`;
        // The max-riser cap is exactly 19.685 cm; fmt to 2 decimals
        // would show 19.68 (binary floating point), misstating the
        // cap, so the worked line shows it to 3 decimals.
        const cap = metric
          ? `${fmt(convertLength(req(v, "maxRiser"), "in", "cm"), 3)} cm`
          : `${fmt(req(v, "maxRiser"))} in`;
        return {
          ...(r.exceedsSingleFlightLimit
            ? {
                warnings: [
                  "This rise exceeds the 2021 IRC single-flight limit of 12 ft 7 in (151 in) — a landing is required between floors (R311.7.3). The numbers below are a straight-flight planning estimate only, not a compliant single-flight design.",
                ],
              }
            : {}),
          rows: [
            {
              label: "Risers",
              value: `${r.riserCount} risers`,
              detail: `${len(r.riserHeightIn)} each`,
            },
            {
              label: "Treads",
              value: `${r.treadCount} treads`,
              detail: `${len(req(v, "treadDepth"))} deep`,
            },
            {
              label: "Total run",
              value: len(r.totalRunIn),
              detail: lenDetail(r.totalRunIn),
            },
            {
              label: "Stringer length",
              value: len(r.stringerLengthIn),
              detail: lenDetail(r.stringerLengthIn),
            },
            {
              label: "Stair angle",
              value: `${fmt(r.stairAngleDeg, 1)}°`,
              detail: "From horizontal",
            },
          ],
          lines: [
            `Risers: ${r.riserCount} at ${len(r.riserHeightIn)} each`,
            `Treads: ${r.treadCount} at ${len(req(v, "treadDepth"))} deep`,
            `Total run: ${len(r.totalRunIn)} (${lenDetail(r.totalRunIn)})`,
            `Stringer length: ${len(r.stringerLengthIn)} (${lenDetail(r.stringerLengthIn)})`,
          ],
          workedLine: `${len(req(v, "totalRise"))} ÷ ${cap} max riser = ${r.riserCount} risers at ${len(r.riserHeightIn)}; ${r.treadCount} treads × ${len(req(v, "treadDepth"))} = ${len(r.totalRunIn)} run.`,
        };
      },
    },
  ],
};
