/**
 * Fence Calculator config — material quantities for a fence run: posts,
 * rails, pickets (US picket mode) or panels, gravel boards, and
 * Postcrete (UK panel mode). Materials only — never structural advice.
 * See src/lib/formulas/fence.ts and docs/FORMULAS.md §31.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { opt, req } from "../../components/react/CalculatorConfig";
import { calculateFencePanel, calculateFencePicket } from "../../lib/formulas/fence";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

const NO_MATERIALS_WARNING =
  "The gates and openings cover the whole run, so no fence materials are needed.";

export const fenceConfig: CalculatorConfig = {
  slug: "fence-calculator",
  designCplus: true,
  heroResultLabel: "Posts",
  lookupTable: {
    note: "Assumes 8 ft post spacing, 6 ft fence (3 rails per section; 2 rails at 4 ft), 6 in pickets with no gap, 10% waste on rails and pickets, and 2 × 80 lb concrete bags per post.",
    headers: ["Run length", "Posts", "Rails", "Pickets", "Concrete bags"],
    rows: [
      ["50 ft run", "8 posts", "24 rails", "110 pickets", "16 bags"],
      ["100 ft run", "14 posts", "43 rails", "220 pickets", "28 bags"],
      ["150 ft run", "20 posts", "63 rails", "330 pickets", "40 bags"],
      ["200 ft run", "26 posts", "83 rails", "440 pickets", "52 bags"],
      ["100 ft run, 4 ft high", "14 posts", "29 rails", "220 pickets", "28 bags"],
    ],
  },
  diagram: "fence",
  defaultMode: "picket",
  formula:
    "Posts: sections = run length ÷ post spacing, rounded up; posts = sections + 1. " +
    "Rails: rails per section — 2 up to 4 ft high, 3 up to 6 ft, 4 above 6 ft (calcfence.com) — " +
    "times the sections, plus waste. Pickets: run length ÷ (picket width + gap), plus waste; " +
    "waste is 10% by default and applies to pickets and rails only, never to posts. " +
    "Concrete: posts × bags per post (2 × 80 lb bags per post is common for a 10 in hole, " +
    "calcfence.com). Panel mode: panels = run ÷ panel length, rounded up; posts = panels + 1; " +
    "gravel boards = 1 per panel when selected; Postcrete = posts × bags per post " +
    "(2 × 20 kg is common). A run that is not an exact multiple of the panel length needs " +
    "the last panel cut — the calculator flags it. Cost is the sum of the priced parts only.",
  howTo: [
    "Measure the run in feet along the fence line — the full perimeter minus any gates and openings.",
    "Pick the mode: Picket (US) for individual pickets on rails, or Panel (UK) for standard 1.83 m panels with gravel boards.",
    "Enter the post spacing (6–8 ft is typical) and the fence height — the height sets the rails per section.",
    [
      {
        text: "Enter a price per post, picket, or rail if you have one, and the calculator totals the cost. For the concrete, the ",
      },
      { text: "Concrete Bags Calculator", calc: "concrete-bags-calculator" },
      { text: " covers bag counts for other jobs." },
    ],
  ],
  workedExample:
    "A 100 ft privacy fence, 6 ft high, 8 ft post spacing, 6 in pickets with no gap: " +
    "100 ÷ 8 = 12.5, so 13 sections and 14 posts; 13 sections × 3 rails = 39, +10% waste = 43 rails; " +
    "100 ft ÷ 0.5 ft per picket = 200, +10% waste = 220 pickets; " +
    "14 posts × 2 bags = 28 × 80 lb concrete bags.",
  limitations: [
    "This calculator counts materials only. It does not check structural adequacy, wind load, or foundation design; it does not tell you how deep to set posts, what footing a post needs, or whether a fence complies with local rules; and it does not settle boundary placement — confirm the line and any permit with your local authority, and call 811 (US) before you dig.",
    "Post depth is deliberately not an output: the “one-third of the height” rule of thumb does not hold for all soils and wind loads, and a wrong depth is a structural failure, not a rounding error. A fence contractor or structural engineer sets the depth.",
    [
      {
        text: "Concrete quantities are for post holes only. For a slab, footing, or driveway under a gate, see the ",
      },
      { text: "Concrete Bags Calculator", calc: "concrete-bags-calculator" },
      { text: " and the " },
      { text: "Concrete Calculator", calc: "concrete-calculator" },
      { text: "." },
    ],
    "Panel lengths are exact multiples: a run that is not a multiple of the panel length needs the last panel cut, and the cut piece is waste — the calculator flags it but does not add a spare panel.",
  ],
  faqs: [
    {
      question: "How many fence posts do I need for 100 feet?",
      answer:
        "At 8 ft spacing, 100 ft is 13 sections (100 ÷ 8 = 12.5, rounded up) and 14 posts — posts are always sections + 1, because a section needs a post at each end. At 6 ft spacing it is 17 sections and 18 posts. Spacing of 6–8 ft is typical for a wood picket fence.",
    },
    {
      question: "How many pickets do I need for a 100 ft fence?",
      answer:
        "With 6 in pickets and no gap, 100 ft needs 200 pickets (100 ÷ 0.5 ft per picket), plus 10% waste — 220 in total. A gap between pickets uses fewer: a 1 in gap with 6 in pickets needs about 171 pickets before waste (189 with the 10% waste allowance).",
    },
    {
      question: "How many rails does a 6 ft fence need per section?",
      answer:
        "Three. The usual rule (calcfence.com) is 2 rails per section up to 4 ft high, 3 rails up to 6 ft, and 4 rails above 6 ft. A 100 ft fence at 8 ft spacing has 13 sections, so 39 rails before waste.",
    },
    {
      question: "How many bags of concrete per fence post?",
      answer:
        "Two 80 lb bags per post is common for a typical 10 in hole (calcfence.com) — a 100 ft fence with 14 posts needs 28 bags. In the UK, 2 × 20 kg bags of Postcrete per post is the usual figure. Enter 0 bags per post if you are not concreting the posts.",
    },
    {
      question: "How much does a fence cost per foot?",
      answer:
        "It varies widely by material, height, and region — wood, vinyl, and metal differ by several times, and gates and terrain add more. This calculator does not invent a price: enter the price per post, picket, or rail from your supplier and it totals the cost from the quantities.",
    },
    {
      question: "Do I need a permit to build a fence?",
      answer:
        "Often yes, and the rules are local: height limits, setback from the property line, and materials all vary by city or county, and some areas require a permit even for a replacement fence. Check with your local authority before you buy, confirm the boundary line, and call 811 (US) before you dig.",
    },
  ],
  modes: [
    {
      id: "picket",
      label: "Picket (US)",
      fields: [
        {
          id: "runLength",
          label: "Run length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "100",
          defaultMet: "30.48",
        },
        {
          id: "postSpacing",
          label: "Post spacing",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "8",
          defaultMet: "2.44",
          hint: "6–8 ft is typical for a wood picket fence (calcfence.com).",
        },
        {
          id: "fenceHeight",
          label: "Fence height",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "6",
          defaultMet: "1.83",
          hint: "Sets the rails per section: 2 up to 4 ft, 3 up to 6 ft, 4 above 6 ft (calcfence.com).",
        },
        {
          id: "picketWidth",
          label: "Picket width",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "6",
          defaultMet: "15.24",
          hint: "6 in is the common picket width.",
        },
        {
          id: "picketGap",
          label: "Gap between pickets",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "0",
          defaultMet: "0",
          min: 0,
          hint: "0 for a privacy fence; a gap lets the wind through and uses fewer pickets.",
        },
        {
          id: "gateWidth",
          label: "Gates and openings (optional)",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          min: 0,
          hint: "Total width of gates and other openings — the fence stops there, so no posts or pickets are counted for it.",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
          hint: "10% waste for cutting and defects — applied to pickets and rails only, not posts.",
        },
        {
          id: "concreteBagsPerPost",
          label: "Concrete bags per post (80 lb)",
          kind: "number",
          defaultImp: "2",
          defaultMet: "2",
          min: 0,
          hint: "2 × 80 lb bags per post is common (calcfence.com). Enter 0 if you are not concreting the posts.",
        },
        {
          id: "pricePerPost",
          label: "Price per post (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerPicket",
          label: "Price per picket (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerRail",
          label: "Price per rail (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
      ],
      compute: (v, present) => {
        const netRunFt = Math.max(req(v, "runLength") - opt(v, "gateWidth"), 0);
        const r = calculateFencePicket({
          netRunFt,
          postSpacingFt: req(v, "postSpacing"),
          fenceHeightFt: req(v, "fenceHeight"),
          picketWidthIn: req(v, "picketWidth"),
          picketGapIn: req(v, "picketGap"),
          wastePct: req(v, "waste"),
          concreteBagsPerPost: req(v, "concreteBagsPerPost"),
          pricePerPost: present.has("pricePerPost") ? req(v, "pricePerPost") : undefined,
          pricePerPicket: present.has("pricePerPicket") ? req(v, "pricePerPicket") : undefined,
          pricePerRail: present.has("pricePerRail") ? req(v, "pricePerRail") : undefined,
        });
        const pitchFt = (req(v, "picketWidth") + req(v, "picketGap")) / 12;
        return {
          ...(netRunFt <= 0 ? { warnings: [NO_MATERIALS_WARNING] } : {}),
          rows: [
            {
              label: "Posts",
              value: `${r.posts} ${r.posts === 1 ? "post" : "posts"}`,
              detail: `${r.sections} ${r.sections === 1 ? "section" : "sections"} at ${fmt(req(v, "postSpacing"), 0)} ft spacing`,
            },
            {
              label: "Rails",
              value: `${r.rails} ${r.rails === 1 ? "rail" : "rails"}`,
              detail: `${r.railsPerSection} per section × ${r.sections} ${r.sections === 1 ? "section" : "sections"}, ${fmt(req(v, "waste"), 0)}% waste`,
            },
            {
              label: "Pickets",
              value: `${r.pickets} ${r.pickets === 1 ? "picket" : "pickets"}`,
              detail: `${fmt(req(v, "picketWidth"), 1)} in wide, ${fmt(req(v, "picketGap"), 1)} in gap, ${fmt(req(v, "waste"), 0)}% waste`,
            },
            {
              label: "Concrete bags (80 lb)",
              value: `${r.concreteBags} ${r.concreteBags === 1 ? "bag" : "bags"}`,
              detail: `${fmt(req(v, "concreteBagsPerPost"), 0)} per post`,
            },
          ],
          lines: [
            `Fence posts: ${r.posts}`,
            `Fence rails: ${r.rails}`,
            `Fence pickets: ${r.pickets}`,
            `Concrete bags (80 lb): ${r.concreteBags}`,
          ],
          costUsd: r.costUsd,
          workedLine:
            `${fmt(netRunFt, 0)} ft ÷ ${fmt(req(v, "postSpacing"), 0)} ft spacing = ${r.sections} sections (${r.posts} posts); ` +
            `${r.sections} sections × ${r.railsPerSection} rails = ${fmt(r.sections * r.railsPerSection, 0)} × ${fmt(100 + req(v, "waste"), 0)}% = ${r.rails} rails; ` +
            `${fmt(netRunFt, 0)} ft ÷ ${fmt(pitchFt, 2)} ft per picket = ${fmt(netRunFt / pitchFt, 0)} × ${fmt(100 + req(v, "waste"), 0)}% = ${r.pickets} pickets.`,
        };
      },
    },
    {
      id: "panel",
      label: "Panel (UK)",
      fields: [
        {
          id: "runLength",
          label: "Run length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "100",
          defaultMet: "30.48",
        },
        {
          id: "panelLength",
          label: "Panel length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "6",
          defaultMet: "1.83",
          hint: "1.83 m (6 ft) is the UK standard panel length.",
        },
        {
          id: "gravelBoards",
          label: "Gravel boards",
          kind: "select",
          defaultImp: "1",
          defaultMet: "1",
          options: [
            { value: "1", label: "With gravel boards" },
            { value: "0", label: "Without gravel boards" },
          ],
          hint: "A gravel board at the base of each panel keeps the panel off the ground.",
        },
        {
          id: "postcreteBagsPerPost",
          label: "Postcrete bags per post (20 kg)",
          kind: "number",
          defaultImp: "2",
          defaultMet: "2",
          min: 0,
          hint: "2 × 20 kg bags per post is common. Enter 0 if you are not concreting the posts.",
        },
        {
          id: "gateWidth",
          label: "Gates and openings (optional)",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "",
          defaultMet: "",
          optional: true,
          min: 0,
          hint: "Total width of gates and other openings — the fence stops there, so no panels or posts are counted for it.",
        },
        {
          id: "pricePerPanel",
          label: "Price per panel (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerPost",
          label: "Price per post (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
        {
          id: "pricePerPostcreteBag",
          label: "Price per Postcrete bag (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
      ],
      compute: (v, present) => {
        const netRunFt = Math.max(req(v, "runLength") - opt(v, "gateWidth"), 0);
        const r = calculateFencePanel({
          netRunFt,
          panelLengthFt: req(v, "panelLength"),
          gravelBoards: req(v, "gravelBoards"),
          postcreteBagsPerPost: req(v, "postcreteBagsPerPost"),
          pricePerPanel: present.has("pricePerPanel") ? req(v, "pricePerPanel") : undefined,
          pricePerPost: present.has("pricePerPost") ? req(v, "pricePerPost") : undefined,
          pricePerPostcreteBag: present.has("pricePerPostcreteBag")
            ? req(v, "pricePerPostcreteBag")
            : undefined,
        });
        return {
          ...(netRunFt <= 0 ? { warnings: [NO_MATERIALS_WARNING] } : {}),
          rows: [
            {
              label: "Panels",
              value: `${r.panels} ${r.panels === 1 ? "panel" : "panels"}`,
              detail: r.lastPanelCut
                ? `${fmt(req(v, "panelLength"), 0)} ft each — last panel cut to ${fmt(r.cutLengthFt, 1)} ft`
                : `${fmt(req(v, "panelLength"), 0)} ft each`,
            },
            {
              label: "Posts",
              value: `${r.posts} ${r.posts === 1 ? "post" : "posts"}`,
              detail: "Panels + 1",
            },
            {
              label: "Gravel boards",
              value: `${r.gravelBoardsCount} ${r.gravelBoardsCount === 1 ? "board" : "boards"}`,
              detail:
                req(v, "gravelBoards") === 1 ? "1 per panel" : "None — no gravel boards selected",
            },
            {
              label: "Postcrete bags (20 kg)",
              value: `${r.postcreteBags} ${r.postcreteBags === 1 ? "bag" : "bags"}`,
              detail: `${fmt(req(v, "postcreteBagsPerPost"), 0)} per post`,
            },
          ],
          lines: [
            `Fence panels: ${r.panels}`,
            `Fence posts: ${r.posts}`,
            `Gravel boards: ${r.gravelBoardsCount}`,
            `Postcrete bags (20 kg): ${r.postcreteBags}`,
          ],
          costUsd: r.costUsd,
          workedLine:
            `${fmt(netRunFt, 0)} ft ÷ ${fmt(req(v, "panelLength"), 0)} ft panels = ${r.panels} panels (${r.posts} posts); ` +
            `${r.posts} posts × ${fmt(req(v, "postcreteBagsPerPost"), 0)} Postcrete bags = ${r.postcreteBags}.`,
        };
      },
    },
  ],
};
