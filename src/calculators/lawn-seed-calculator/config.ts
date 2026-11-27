/**
 * Lawn Seed Calculator config — grass seed weight and bag counts from
 * lawn area and seeding rate, for new lawns and overseeding. The rate
 * is a user-supplied input (bag label governs) with extension-sourced
 * species ranges — never a single invented rate. See
 * src/lib/formulas/lawn-seed.ts and docs/FORMULAS.md §30.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { opt, req } from "../../components/react/CalculatorConfig";
import { calculateLawnSeed, formatBagBreakdown } from "../../lib/formulas/lawn-seed";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const lawnSeedConfig: CalculatorConfig = {
  slug: "lawn-seed-calculator",
  designCplus: true,
  heroResultLabel: "Seed needed",
  lookupTable: {
    note: "Assumes tall fescue at 7 lb per 1,000 ft² (bluegrass row 2.5 lb), new lawn, 10% buffer; bags are standard 25/10/3 lb sizes, mixed to fit.",
    headers: ["Lawn", "Seed needed", "Seed with buffer", "Bags to buy"],
    rows: [
      ["1,000 ft² lawn", "7 lb", "7.7 lb", "3 × 3 lb"],
      ["2,500 ft² lawn", "17.5 lb", "19.3 lb", "1 × 10 lb + 4 × 3 lb"],
      ["5,000 ft² lawn", "35 lb", "38.5 lb", "1 × 25 lb + 1 × 10 lb + 2 × 3 lb"],
      ["10,000 ft² lawn", "70 lb", "77 lb", "3 × 25 lb + 1 × 3 lb"],
      ["5,000 ft² bluegrass lawn", "12.5 lb", "13.8 lb", "1 × 10 lb + 2 × 3 lb"],
    ],
  },
  diagram: "area",
  defaultMode: "area",
  formula:
    "Seed needed = lawn area ÷ 1,000 × seeding rate × job factor (1 for a new lawn, " +
    "0.5 for overseeding). Seed with buffer = seed needed × (1 + buffer allowance). " +
    "The rate is in lb per 1,000 ft² — tall fescue 6–8, Kentucky bluegrass 2–3, perennial " +
    "ryegrass 4–5 (Penn State Extension); Bermuda 1–2 for warm-season lawns. In g/m² that " +
    "is about 29–39, 10–15, 20–24, and 5–10 (1 lb per 1,000 ft² = 4.882 g/m²). Rates differ " +
    "between universities for the same grass, so the rate is yours to enter and the bag " +
    "label governs. Bags are the standard US sizes 25 / 10 / 3 lb, mixed greedily to fit " +
    "the amount needed (largest first, the remainder rounded up to one more smallest bag). " +
    "Cost uses the purchased weight — what you buy, not the exact need.",
  howTo: [
    "Measure the lawn in feet — length × width for a rectangle, or split an irregular lawn into rectangles and add them.",
    "Subtract the house, driveway, beds, and paths: anything the lawn does not cover.",
    "Pick the job: a new lawn uses the full rate; overseeding uses about half the new-lawn rate.",
    "Enter the seeding rate from your bag label, in lb per 1,000 ft². Tall fescue runs 6–8, Kentucky bluegrass 2–3, perennial ryegrass 4–5, Bermuda 1–2 — the bag you buy is the final word.",
  ],
  workedExample:
    "A 5,000 ft² new lawn at 7 lb per 1,000 ft² (tall fescue): 5 × 7 = 35 lb. " +
    "With a 10% buffer that is 38.5 lb — buy it as 1 × 25 lb + 1 × 10 lb + 2 × 3 lb bags (4 bags, 41 lb total).",
  limitations: [
    "Rates differ by species AND by university (Penn State vs NC State give different figures for the same grass) — the ranges here are guidance, and the bag label governs. Seed weight also varies by species and coating.",
    "Does not account for spreader calibration, overlap, or watering — a poorly calibrated spreader can use far more seed than the calculation, and seed that dries out does not germinate.",
    [
      { text: "For an instant lawn, compare the " },
      { text: "Sod Calculator", calc: "sod-calculator" },
      {
        text: ": sod costs more per square foot but gives you a lawn in 2–3 weeks, while seed takes 3–4 months to fill in.",
      },
    ],
    [
      {
        text: "Seedbed preparation is a separate job — the seed goes on prepared soil. For the soil underneath, see the ",
      },
      { text: "Topsoil Calculator", calc: "topsoil-calculator" },
      { text: "." },
    ],
  ],
  faqs: [
    {
      question: "How much grass seed do I need per 1,000 square feet?",
      answer:
        "It depends on the grass: tall fescue 6–8 lb, Kentucky bluegrass 2–3 lb, perennial ryegrass 4–5 lb per 1,000 ft² (Penn State Extension); Bermuda 1–2 lb for warm-season lawns. In g/m² that is about 29–39, 10–15, 20–24, and 5–10. Always check your bag label — it governs, and rates differ between universities for the same grass.",
    },
    {
      question: "How much seed do I need for overseeding?",
      answer:
        "About half the new-lawn rate. Overseeding a thin lawn at the tall fescue new-lawn rate of 7 lb per 1,000 ft² uses about 3.5 lb per 1,000 ft² — this calculator applies the half rate when you pick Overseeding. Seed-to-soil contact matters more than the exact rate: mow short, rake, and water daily until it germinates.",
    },
    {
      question: "How many square feet does a pound of grass seed cover?",
      answer:
        "At the Penn State rates, a pound of tall fescue covers about 125–167 ft², a pound of Kentucky bluegrass about 333–500 ft², and a pound of perennial ryegrass about 200–250 ft². Bluegrass seed is tiny, so a little goes a long way — and it is also the slowest to germinate.",
    },
    {
      question: "When is the best time to plant grass seed?",
      answer:
        "For cool-season grasses, early fall (mid-August to mid-October) beats spring: the soil is warm, the weeds are fading, and the seedlings have all fall to root before winter. For warm-season grasses, late spring to early summer, once the soil is warm.",
    },
    {
      question: "New lawn or overseed — how do I choose?",
      answer:
        "Overseed when the lawn is thin but mostly alive: the existing grass fills in around the new seedlings. Start from seed (a new lawn) when more than half the area is bare, weedy, or the wrong grass — or when you are changing grass types. A new lawn needs the full rate; overseeding needs about half.",
    },
    {
      question: "Why does the calculator mix different bag sizes?",
      answer:
        "Seed is sold in standard 25, 10, and 3 lb bags, and buying one size only wastes seed — 38.5 lb as 25 lb bags alone is 2 bags (50 lb). Mixed greedily, it is 1 × 25 lb + 1 × 10 lb + 2 × 3 lb (41 lb total), the least overbuy from standard bags.",
    },
  ],
  modes: [
    {
      id: "area",
      label: "Area and rate",
      fields: [
        {
          id: "length",
          label: "Length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "50",
          defaultMet: "15.24",
        },
        {
          id: "width",
          label: "Width",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "100",
          defaultMet: "30.48",
        },
        {
          id: "exclusions",
          label: "Area to subtract (optional)",
          kind: "area",
          unitKind: "area",
          canonicalUnit: "ft2",
          impUnit: "ft2",
          metUnit: "m2",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          min: 0,
          hint: "House, driveway, beds, and paths — anything the lawn does not cover. Leave empty for none.",
        },
        {
          id: "jobType",
          label: "Job type",
          kind: "select",
          defaultImp: "1",
          defaultMet: "1",
          options: [
            { value: "1", label: "New lawn" },
            { value: "0.5", label: "Overseeding (half rate)" },
          ],
          hint: "Overseeding uses about half the new-lawn rate.",
        },
        {
          id: "rate",
          label: "Seeding rate (lb per 1,000 ft²)",
          kind: "number",
          defaultImp: "7",
          defaultMet: "7",
          min: 0.1,
          hint: "Your seeding rate in lb per 1,000 ft² — tall fescue 6–8, Kentucky bluegrass 2–3, perennial ryegrass 4–5 (Penn State Extension); Bermuda 1–2 for warm-season lawns. In g/m² that is about 29–39, 10–15, 20–24, and 5–10. Always check your bag label — it governs.",
        },
        {
          id: "buffer",
          label: "Buffer",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
          hint: "10% buffer for spills and thin spots.",
        },
        {
          id: "pricePerLb",
          label: "Price per pound (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Price per pound of seed, if you buy in bulk.",
        },
      ],
      compute: (v, present) => {
        const netAreaFt2 = Math.max(req(v, "length") * req(v, "width") - opt(v, "exclusions"), 0);
        const r = calculateLawnSeed({
          netAreaFt2,
          rateLbPer1000Ft2: req(v, "rate"),
          jobFactor: req(v, "jobType"),
          bufferPct: req(v, "buffer"),
          pricePerLb: present.has("pricePerLb") ? req(v, "pricePerLb") : undefined,
        });
        const breakdown = formatBagBreakdown(r.bags);
        const factorPart = req(v, "jobType") !== 1 ? ` × ${fmt(req(v, "jobType"), 1)}` : "";
        return {
          ...(r.netAreaFt2 <= 0
            ? { warnings: ["The exclusions cover the whole lawn, so no seed is needed."] }
            : {}),
          rows: [
            {
              label: "Seed needed",
              value: `${fmt(r.seedLb, 1)} lb`,
              detail: `${fmt(r.seedKg, 1)} kg`,
            },
            {
              label: "Seed with buffer",
              value: `${fmt(r.bufferedLb, 1)} lb`,
              detail: `${fmt(r.bufferedKg, 1)} kg — ${fmt(req(v, "buffer"), 0)}% buffer`,
            },
            {
              label: "Bags to buy",
              value: r.bagCount === 0 ? "0 bags" : breakdown,
              detail:
                r.bagCount === 0
                  ? "No seed needed"
                  : `${r.bagCount} ${r.bagCount === 1 ? "bag" : "bags"}, ${fmt(r.purchaseLb, 0)} lb total`,
            },
          ],
          lines: [
            `Grass seed: ${fmt(r.bufferedLb, 1)} lb (${fmt(r.bufferedKg, 1)} kg)`,
            r.bagCount === 0
              ? "Seed bags: none needed"
              : `Seed bags: ${breakdown} (${r.bagCount} bags, ${fmt(r.purchaseLb, 0)} lb total)`,
          ],
          costUsd: r.costUsd,
          workedLine:
            `${fmt(r.netAreaFt2, 0)} ft² ÷ 1,000 × ${fmt(req(v, "rate"), 1)} lb${factorPart} = ${fmt(r.seedLb, 1)} lb` +
            ` × ${fmt(100 + req(v, "buffer"), 0)}% = ${fmt(r.bufferedLb, 1)} lb.`,
        };
      },
    },
  ],
};
