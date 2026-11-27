/**
 * Lawn Seed Calculator config — grass seed weight and bag counts from
 * lawn area and seeding rate, for new lawns and overseeding. The rate
 * is a user-supplied input FOR THE JOB PICKED (the bag-label
 * new-lawn rate for a new lawn, the bag-label overseeding rate when
 * overseeding) — the calculator applies no further reduction, and the
 * job-type choice is a label only. Rates are extension-sourced — see
 * src/lib/formulas/lawn-seed.ts and docs/FORMULAS.md §30.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { opt, req } from "../../components/react/CalculatorConfig";
import {
  BAG_OPTIMIZATION_LIMIT_LB,
  RATE_UNIT_G_PER_M2,
  calculateLawnSeed,
  formatBagBreakdown,
} from "../../lib/formulas/lawn-seed";
import { gramsPerSquareMeterToLbPer1000Ft2 } from "../../lib/units";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

/**
 * Select value for jobType = overseeding. Label-only: the island
 * stores select values as numbers, and compute() never uses this
 * number as a multiplier — it only picks the guidance note. 0 is a
 * new lawn.
 */
const JOB_OVERSEEDING = 1;

/**
 * Select value for purchaseMethod = bulk by the pound. The island
 * stores select values as numbers; 0 is bags, the default. A missing
 * value (e.g. the lookup-table recompute, which passes no purchase
 * method) also means bags.
 */
const PURCHASE_BULK = 1;

/** New-lawn rate guidance (Penn State Extension, Table 1; NC State Table 9–4). */
const NEW_LAWN_RATES =
  "New-lawn rates (Penn State Extension): tall fescue 6–8, Kentucky bluegrass 2–3, " +
  "perennial ryegrass 4–5, fine fescues 4–5 lb per 1,000 ft²; NC State Extension lists " +
  "tall fescue at 6 and Kentucky bluegrass at 1.5–2. Enter the rate from your bag label — it governs.";

/** Overseeding rate guidance (K-State MF736; Penn State Extension, Table 1). */
const OVERSEEDING_RATES =
  "Enter the overseeding rate from your bag label — this calculator does not halve it. " +
  "K-State lists tall fescue at 3–5 lb per 1,000 ft² to thicken a thin lawn (the full 6–8 lb " +
  "for large dead areas); Penn State lists perennial ryegrass at 4–6 lb for renovation. " +
  "If your bag prints only a new-lawn rate, about half is the usual overseeding rule of thumb.";

export const lawnSeedConfig: CalculatorConfig = {
  slug: "lawn-seed-calculator",
  designCplus: true,
  heroResultLabel: "Seed needed",
  lookupTable: {
    note: "Assumes tall fescue at 7 lb per 1,000 ft² (bluegrass row 2.5 lb), new lawn, 10% buffer; bags are standard 25/10/3 lb sizes, mixed for the least overbuy up to 10,000 lb.",
    headers: ["Lawn", "Seed needed", "Seed with buffer", "Bags to buy"],
    rows: [
      ["1,000 ft² lawn", "7 lb", "7.7 lb", "3 × 3 lb"],
      ["2,500 ft² lawn", "17.5 lb", "19.3 lb", "2 × 10 lb"],
      ["5,000 ft² lawn", "35 lb", "38.5 lb", "3 × 10 lb + 3 × 3 lb"],
      ["10,000 ft² lawn", "70 lb", "77 lb", "1 × 25 lb + 4 × 10 lb + 4 × 3 lb"],
      ["5,000 ft² bluegrass lawn", "12.5 lb", "13.8 lb", "5 × 3 lb"],
    ],
  },
  diagram: "area",
  defaultMode: "area",
  formula:
    "Seed needed = lawn area ÷ 1,000 × seeding rate. Seed with buffer = seed needed × " +
    "(1 + buffer allowance). The rate is in lb per 1,000 ft², or in g/m² if you pick that unit " +
    "(1 lb per 1,000 ft² = 4.882 g/m²) — enter the rate FOR THE JOB YOU PICKED: the bag-label " +
    "new-lawn rate for a new lawn, the bag-label overseeding rate when overseeding. The " +
    "calculator does not halve your rate. New-lawn rates: tall fescue 6–8, Kentucky bluegrass " +
    "1.5–3 (Penn State 2–3; NC State 1.5–2), perennial ryegrass 4–5, fine fescues 4–5, Bermuda " +
    "1–2 lb per 1,000 ft² — in g/m² about 29–39, 7–15, 20–24, 20–24, and 5–10. Overseeding: " +
    "tall fescue 3–5 lb to thicken a thin lawn (K-State; the full 6–8 lb for large dead areas), " +
    "perennial ryegrass 4–6 lb for renovation (Penn State) — not half the new-lawn rate. Rates " +
    "differ between universities for the same grass, so the rate is yours to enter and the bag " +
    "label governs. Bags are the standard US sizes 25 / 10 / 3 lb, mixed for the least overbuy: " +
    "for amounts up to 10,000 lb every combination is searched (least purchased weight, then " +
    "fewest bags, then larger bags); above 10,000 lb the mix falls back to largest-first greedy, " +
    "which still covers the need but is not guaranteed to be the least overbuy. Cost follows " +
    "the “Buy as” choice: bags are priced on the purchased bag weight, bulk by the pound on " +
    "the buffered weight — a buyer buys bags or bulk, never both.",
  howTo: [
    "Measure the lawn in feet — length × width for a rectangle, or split an irregular lawn into rectangles and add them.",
    "Subtract the house, driveway, beds, and paths: anything the lawn does not cover.",
    "Pick the job: a new lawn or overseeding. Then enter the rate FOR THAT JOB, from your bag label — the new-lawn rate for a new lawn, the overseeding rate when overseeding. The calculator will not halve your rate.",
    "Pick the rate unit your bag uses — lb per 1,000 ft² on US bags, g/m² elsewhere — and enter the rate. New lawn: tall fescue 6–8, Kentucky bluegrass 1.5–3, perennial ryegrass 4–5, fine fescues 4–5, Bermuda 1–2 lb per 1,000 ft² (29–39, 7–15, 20–24, 20–24, 5–10 g/m²). Overseeding: tall fescue 3–5 to thicken a thin lawn, perennial ryegrass 4–6 for renovation. The bag you buy is the final word.",
    "Choose “Buy as”: standard bags, or loose seed by the pound. The shopping list and the cost follow that choice, so the two forms are never added together.",
  ],
  workedExample:
    "A 5,000 ft² new lawn at 7 lb per 1,000 ft² (tall fescue): 5 × 7 = 35 lb. " +
    "With a 10% buffer that is 38.5 lb — buy it as 3 × 10 lb + 3 × 3 lb bags (6 bags, 39 lb total), " +
    "the least overbuy from standard 25/10/3 lb bags.",
  limitations: [
    "Rates differ by species AND by university (NC State lists Kentucky bluegrass at 1.5–2 lb per 1,000 ft², Penn State at 2–3 lb) — the ranges here are guidance, and the bag label governs. Overseeding rates are job-specific, not simply half: Penn State lists perennial ryegrass at 4–6 lb for renovation, about the same as its 4–5 lb new-lawn rate. Seed weight also varies by species and coating.",
    "Does not account for spreader calibration, overlap, or watering — a poorly calibrated spreader can use far more seed than the calculation, and seed that dries out does not germinate.",
    [
      { text: "For an instant lawn, compare the " },
      { text: "Sod Calculator", calc: "sod-calculator" },
      {
        text: ": sod costs more per square foot but typically establishes in 3–4 weeks, while seed takes around 4–6 weeks to establish and longer to fill in fully (Univ. of Maryland Extension).",
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
        "It depends on the grass and the job. For a new lawn: tall fescue 6–8 lb, Kentucky bluegrass 1.5–3 lb (Penn State 2–3; NC State 1.5–2), perennial ryegrass 4–5 lb, fine fescues 4–5 lb, Bermuda 1–2 lb per 1,000 ft². In g/m² that is about 29–39, 7–15, 20–24, 20–24, and 5–10. Always check your bag label — it governs, and rates differ between universities for the same grass.",
    },
    {
      question: "How much seed do I need for overseeding?",
      answer:
        "Enter the overseeding rate from your bag label — this calculator does not halve it for you, because a bag-label overseeding rate is already an overseeding rate. As a guide, K-State lists tall fescue at 3–5 lb per 1,000 ft² to thicken a thin lawn (the full 6–8 lb for large dead areas), and Penn State lists perennial ryegrass at 4–6 lb for renovation. If your bag prints only a new-lawn rate, about half is the usual rule of thumb. Seed-to-soil contact matters more than the exact rate: mow short, rake, and water daily until it germinates.",
    },
    {
      question: "How many square feet does a pound of grass seed cover?",
      answer:
        "At the Penn State and NC State rates, a pound of tall fescue covers about 125–167 ft², a pound of Kentucky bluegrass about 333–667 ft², and a pound of perennial ryegrass about 200–250 ft². Bluegrass seed is tiny, so a little goes a long way — and it is also the slowest to germinate.",
    },
    {
      question: "When is the best time to plant grass seed?",
      answer:
        "For cool-season grasses, late summer to early fall: Penn State Extension calls late summer the optimum time to seed in most of Pennsylvania, and K-State calls September the best time to plant tall fescue, with spring (March–April) second best. For warm-season grasses, late spring to early summer, once the soil is warm (NC State lists April–July planting dates for bermudagrass).",
    },
    {
      question: "New lawn or overseed — how do I choose?",
      answer:
        "Overseed when the lawn is thin but mostly alive: the existing grass fills in around the new seedlings. Start from seed (a new lawn) when more than half the area is bare, weedy, or the wrong grass — or when you are changing grass types. Either way, enter the rate for the job you picked: the new-lawn rate for a new lawn, the overseeding rate when overseeding — the calculator applies no reduction of its own.",
    },
    {
      question: "Why does the calculator mix different bag sizes?",
      answer:
        "Seed is sold in standard 25, 10, and 3 lb bags, and buying one size only wastes seed — 38.5 lb as 25 lb bags alone is 2 bags (50 lb). Mixed for the least overbuy, it is 3 × 10 lb + 3 × 3 lb (39 lb total). For amounts up to 10,000 lb the calculator searches every combination and guarantees the least purchased weight (then the fewest bags); above 10,000 lb it falls back to largest-first greedy, which still covers the need but may overbuy a little more.",
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
          defaultImp: "0",
          defaultMet: "0",
          options: [
            { value: "0", label: "New lawn" },
            { value: "1", label: "Overseeding" },
          ],
          hint: "Pick the job you are pricing. The rate you enter must match the job: a new lawn takes the full bag-label rate, overseeding takes the bag-label overseeding rate. The calculator does not halve your rate.",
        },
        {
          id: "rateUnit",
          label: "Rate unit",
          kind: "select",
          defaultImp: "0",
          defaultMet: "1",
          options: [
            { value: "0", label: "lb per 1,000 ft²" },
            { value: "1", label: "g/m²" },
          ],
          hint: "US bag labels print lb per 1,000 ft²; labels elsewhere print g/m². Pick the unit your bag uses — the rate is converted to lb per 1,000 ft² (1 lb per 1,000 ft² = 4.882 g/m²).",
        },
        {
          id: "rate",
          label: "Seeding rate",
          kind: "number",
          defaultImp: "7",
          defaultMet: "34.2",
          min: 0.1,
          hint: "Your seeding rate for the job you picked, from your bag label. New lawn: tall fescue 6–8, Kentucky bluegrass 1.5–3, perennial ryegrass 4–5, fine fescues 4–5, Bermuda 1–2 lb per 1,000 ft² (29–39, 7–15, 20–24, 20–24, 5–10 g/m²). Overseeding: tall fescue 3–5 to thicken a thin lawn, perennial ryegrass 4–6 for renovation. The bag label governs.",
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
          id: "purchaseMethod",
          label: "Buy as",
          kind: "select",
          defaultImp: "0",
          defaultMet: "0",
          options: [
            { value: "0", label: "Bags (standard 25 / 10 / 3 lb)" },
            { value: "1", label: "Bulk by the pound" },
          ],
          hint: "Choose how you will buy it: standard bags, or loose seed by the pound. The shopping list and the cost follow this choice — bags or bulk, not both.",
        },
        {
          id: "pricePerLb",
          label: "Price per pound (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          hint: "Price per pound of seed. The cost follows the “Buy as” choice: bags are priced on the purchased bag weight, bulk on the buffered weight.",
        },
      ],
      compute: (v, present) => {
        const netAreaFt2 = Math.max(req(v, "length") * req(v, "width") - opt(v, "exclusions"), 0);
        // Job type is a label only — it picks the guidance note, never
        // a multiplier. Default (when absent) is a new lawn.
        const jobType = opt(v, "jobType");
        // Rate unit defaults to lb per 1,000 ft² when absent (the
        // lookup-table test passes no rate unit).
        const rateUnit = opt(v, "rateUnit");
        const enteredRate = req(v, "rate");
        const rateLbPer1000Ft2 =
          rateUnit === RATE_UNIT_G_PER_M2
            ? gramsPerSquareMeterToLbPer1000Ft2(enteredRate)
            : enteredRate;
        const r = calculateLawnSeed({
          netAreaFt2,
          rateLbPer1000Ft2,
          bufferPct: req(v, "buffer"),
          pricePerLb: present.has("pricePerLb") ? req(v, "pricePerLb") : undefined,
          // opt, not req: the lookup-table recompute passes no purchase
          // method, and a missing value means the default (bags).
          purchaseMethod: opt(v, "purchaseMethod") === PURCHASE_BULK ? "bulk" : "bags",
        });
        const isBulk = opt(v, "purchaseMethod") === PURCHASE_BULK;
        const breakdown = formatBagBreakdown(r.bags);
        const isOverseeding = jobType === JOB_OVERSEEDING;
        const jobLabel = isOverseeding ? "Overseeding" : "New lawn";
        const rateText =
          rateUnit === RATE_UNIT_G_PER_M2
            ? `${fmt(enteredRate, 1)} g/m² (= ${fmt(r.rateLbPer1000Ft2, 1)} lb per 1,000 ft²)`
            : `${fmt(enteredRate, 1)} lb per 1,000 ft²`;
        const notes = [isOverseeding ? OVERSEEDING_RATES : NEW_LAWN_RATES];
        notes.push(
          isBulk
            ? "Buy bags or bulk by the pound, not both — the shopping list contains only the bulk seed."
            : "Buy bags or bulk by the pound, not both — the shopping list contains only the bags.",
        );
        if (!r.bagsOptimized) {
          notes.push(
            `Over ${fmt(BAG_OPTIMIZATION_LIMIT_LB, 0)} lb the bag mix uses the greedy ` +
              "largest-first method, not the exact least-overbuy search, so it may overbuy a little more.",
          );
        }
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
              detail: isBulk
                ? r.bagCount === 0
                  ? "No seed needed"
                  : `${r.bagCount} ${r.bagCount === 1 ? "bag" : "bags"}, ${fmt(r.purchaseLb, 0)} lb total. Alternative: buy bags or bulk by the pound, not both — the shopping list contains only the bulk seed.`
                : r.bagCount === 0
                  ? "No seed needed"
                  : `${r.bagCount} ${r.bagCount === 1 ? "bag" : "bags"}, ${fmt(r.purchaseLb, 0)} lb total — your purchase method`,
            },
          ],
          // The shopping list carries only the chosen form. The weight
          // line states the requirement ("needed"); the bag line states
          // the purchase ("Buy as bags"). For bulk there is a single
          // purchase line — the buffered weight, bought by the pound.
          lines: isBulk
            ? [
                `Grass seed (bulk, by the pound): ${fmt(r.bufferedLb, 1)} lb (${fmt(r.bufferedKg, 1)} kg) at ${rateText}, ${jobLabel.toLowerCase()}`,
              ]
            : [
                `Grass seed needed: ${fmt(r.bufferedLb, 1)} lb (${fmt(r.bufferedKg, 1)} kg) at ${rateText}, ${jobLabel.toLowerCase()}`,
                r.bagCount === 0
                  ? "Seed bags: none needed"
                  : `Buy as bags: ${breakdown} (${r.bagCount} ${r.bagCount === 1 ? "bag" : "bags"}, ${fmt(r.purchaseLb, 0)} lb total)`,
              ],
          costUsd: r.costUsd,
          note: notes.join(" "),
          workedLine:
            `${fmt(r.netAreaFt2, 0)} ft² ÷ 1,000 × ${rateText} = ${fmt(r.seedLb, 1)} lb` +
            ` × ${fmt(100 + req(v, "buffer"), 0)}% = ${fmt(r.bufferedLb, 1)} lb.`,
        };
      },
    },
  ],
};
