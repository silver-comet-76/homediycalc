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

const GATE_HARDWARE_NOTE =
  "The posts flanking each gate are counted as gate posts. Gate hinges and a latch are not counted here or in the cost — buy them separately.";

const COST_EXCLUSIONS =
  "Covers the priced materials only. Excludes gate hardware, fasteners, labor, delivery, and any materials without a price.";

export const fenceConfig: CalculatorConfig = {
  slug: "fence-calculator",
  designCplus: true,
  heroResultLabel: "Posts",
  lookupTable: {
    note: "Assumes one continuous run with no gates, 8 ft post spacing, 6 ft fence (3 rails per section; 2 rails at 4 ft), 6 in pickets with no gap, 10% waste on rails and pickets, and a starting figure of 2 × 80 lb concrete bags per post.",
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
    "Posts: the net run is the run length minus gates and openings. A gate in the middle of the run splits the fence into separate runs — each run is counted on its own, with a post at both ends — so posts = sum over runs of (sections per run + 1), where sections per run = run length ÷ post spacing, rounded up. The runs are assumed equal in length; a gate at the end of the run does not split it. The two posts flanking a gate are counted as gate posts, one at the end of each run — no post is shared across a gate opening — and gate hinges and a latch are not counted. " +
    "Rails: rails per section — 2 up to 4 ft high, 3 up to 6 ft, 4 above 6 ft, common practice for wood picket fences — times the total sections, plus waste. Pickets: net run length ÷ (picket width + gap), plus waste; waste is 10% by default and applies to pickets and rails only, never to posts. " +
    "Concrete: posts × bags per post. The 2 × 80 lb bags per post figure is a starting figure only, suited to a 4×4 post in a 10 in hole about 24 in deep — the real count depends on hole width and depth, post size, and the yield printed on the bag (Quikrete, Sakrete). Panel mode: panels per run = run length ÷ panel length, rounded up; posts = sum over runs of (panels per run + 1); gravel boards = 1 per panel when selected; Postcrete = posts × bags per post (2 × 20 kg per post is a starting figure only, suited to a 100 × 100 mm post in a 300 × 600 mm hole — Blue Circle Postcrete data sheet). A run that is not an exact multiple of the panel length leaves a partial panel: do not assume the panel can be cut — check the panel maker's instructions first. Cost is the sum of the priced parts only, and it is labelled a priced-materials subtotal whenever any priced part has no price entered; gate hardware, fasteners, labor, and delivery are never included.",
  howTo: [
    "Measure the total run in feet along the fence line, including the width of any gates and openings — enter the gate widths separately below, not by shortening the run.",
    "Pick the mode: Picket (US) for individual pickets on rails, or Panel (UK) for standard 1.83 m panels with gravel boards.",
    "Enter the post spacing (6–8 ft is typical) and the fence height — the height sets the rails per section.",
    "If a gate sits in the middle of the run, set Gate layout to match: a middle gate splits the fence into two runs, and each run needs a post at both ends. A gate at the end of the run does not split it.",
    [
      {
        text: "Enter a price per post, picket, or rail if you have one, and the calculator totals the cost of the priced materials. For the concrete, the ",
      },
      { text: "Concrete Bags Calculator", calc: "concrete-bags-calculator" },
      { text: " covers bag counts for other jobs." },
    ],
  ],
  workedExample:
    "A 100 ft privacy fence, 6 ft high, 8 ft post spacing, 6 in pickets with no gap: " +
    "100 ÷ 8 = 12.5, so 13 sections and 14 posts; 13 sections × 3 rails = 39, +10% waste = 43 rails; " +
    "100 ft ÷ 0.5 ft per picket = 200, +10% waste = 220 pickets; " +
    "14 posts × 2 bags = 28 × 80 lb concrete bags. " +
    "With a 4 ft gate in the middle of a 20 ft run instead: 16 ft of fence in two 8 ft runs, " +
    "8 ft spacing gives 1 section per run and 4 posts — 2 line posts and 2 gate posts — " +
    "where one continuous 16 ft run would count only 3 posts.",
  limitations: [
    "This calculator counts materials only. It does not check structural adequacy, wind load, or foundation design; it does not tell you how deep to set posts, what footing a post needs, or whether a fence complies with local rules; and it does not settle boundary placement — confirm the line and any permit with your local authority, and call 811 (US) before you dig.",
    "Post depth is deliberately not an output: the “one-third of the height” rule of thumb does not hold for all soils and wind loads, and a wrong depth is a structural failure, not a rounding error. A fence contractor or structural engineer sets the depth.",
    "Gates split the fence into separate runs, and the runs are assumed equal in length — the calculator cannot know the real segment lengths from the total gate width alone. Measure each run separately if the gate is not centered, and add the runs up. Each run has its own end posts; no post is shared across a gate opening. Gate posts are counted as ordinary fence posts, so a heavy gate may need a larger post or a deeper footing — check the gate maker's instructions. Gate hinges and a latch are not counted anywhere on this page.",
    "Concrete and Postcrete figures are starting figures, not sufficient quantities: the count depends on hole width and depth, post size, soil, wind exposure, frost depth, local requirements, and the yield printed on the bag. Quikrete's setting-posts guide sizes the hole about 3 times the post width and 1/3 to 1/2 of the above-ground post length deep, plus 6 in of gravel, and Sakrete's data sheet tables more bags for deeper holes. Follow the post and product maker's instructions for the holes you actually dig.",
    "The rails-per-section rule (2 up to 4 ft, 3 up to 6 ft, 4 above 6 ft) is common practice for wood picket fences, not a manufacturer rule. Taller fences, heavier pickets, and exposed sites may need more rails — check the rail maker's instructions.",
    [
      {
        text: "Concrete quantities are for post holes only. For a slab, footing, or driveway under a gate, see the ",
      },
      { text: "Concrete Bags Calculator", calc: "concrete-bags-calculator" },
      { text: " and the " },
      { text: "Concrete Calculator", calc: "concrete-calculator" },
      { text: "." },
    ],
    "A run that is not an exact multiple of the panel length leaves a partial panel in each run. Do not assume the panel can be cut: some panels cannot be cut at all, and cutting treated timber exposes untreated wood and can void the maker's guarantee — Grange Fencing's guarantee conditions say cutting treated wood renders its guarantee null and void unless a cut-end treatment is applied. Check the panel maker's instructions first, and adjust the run length, use a different panel size, or order a made-to-measure panel instead. The calculator flags partial panels but does not add a spare panel.",
    "Any cost shown covers the priced materials only. Gate hardware, fasteners, labor, delivery, and tools are never included, and any material without a price entered is left out of the total.",
  ],
  faqs: [
    {
      question: "How many fence posts do I need for 100 feet?",
      answer:
        "At 8 ft spacing, 100 ft is 13 sections (100 ÷ 8 = 12.5, rounded up) and 14 posts — posts are always sections + 1, because a section needs a post at each end. At 6 ft spacing it is 17 sections and 18 posts. Spacing of 6–8 ft is typical for a wood picket fence.",
    },
    {
      question: "How many posts do I need if there is a gate in the middle?",
      answer:
        "More than a continuous run of the same net length. A 20 ft run with a 4 ft gate in the middle is 16 ft of fence in two 8 ft runs, and at 8 ft spacing each run needs 1 section and 2 posts — 4 posts in total, 2 of them gate posts flanking the gate. The same 16 ft as one continuous run would count only 3 posts. Set Gate layout to match where the gate sits: a gate at the end of the run does not split it, so it needs no extra posts.",
    },
    {
      question: "How many pickets do I need for a 100 ft fence?",
      answer:
        "With 6 in pickets and no gap, 100 ft needs 200 pickets (100 ÷ 0.5 ft per picket), plus 10% waste — 220 in total. A gap between pickets uses fewer: a 1 in gap with 6 in pickets needs about 171 pickets before waste (189 with the 10% waste allowance).",
    },
    {
      question: "How many rails does a 6 ft fence need per section?",
      answer:
        "Three, by the common rule for wood picket fences: 2 rails per section up to 4 ft high, 3 rails up to 6 ft, and 4 rails above 6 ft. It is common practice, not a manufacturer rule — taller fences, heavier pickets, and exposed sites may need more rails. A 100 ft fence at 8 ft spacing has 13 sections, so 39 rails before waste.",
    },
    {
      question: "How many bags of concrete per fence post?",
      answer:
        "There is no one figure: it depends on hole width and depth, post size, and the yield printed on the bag. As a starting figure, 2 × 80 lb bags suits a 4×4 post in a 10 in hole about 24 in deep. Quikrete's setting-posts guide sizes the hole about 3 times the post width and 1/3 to 1/2 of the above-ground post length deep, plus 6 in of gravel, and Sakrete's data sheet tables more bags for deeper holes — a 10 in hole needs 2 bags at 18 in deep and 3 at 30 in (50 lb fast-setting bags). In the UK, 2 × 20 kg bags of Postcrete suits a 100 × 100 mm post in a 300 × 600 mm hole (Blue Circle Postcrete data sheet). Enter 0 bags per post if you are not concreting the posts.",
    },
    {
      question: "Can I cut a fence panel to fit a short run?",
      answer:
        "Not always — check the panel maker's instructions first. Some panels cannot be cut at all, and cutting treated timber exposes untreated wood and can void the maker's guarantee: Grange Fencing's guarantee conditions say cutting treated wood renders its guarantee null and void unless a cut-end treatment is applied. Jacksons Fencing publishes panel-specific cut-down instructions and kits for the panels that can be shortened. If the panel cannot be cut, adjust the run length, use a different panel size, or order a made-to-measure panel.",
    },
    {
      question: "How much does a fence cost per foot?",
      answer:
        "It varies widely by material, height, and region — wood, vinyl, and metal differ by several times, and gates and terrain add more. This calculator does not invent a price: enter the price per post, picket, or rail from your supplier and it totals the cost of the priced materials. The figure is labelled a priced-materials subtotal whenever any priced part has no price entered, and it never includes gate hardware, fasteners, labor, or delivery.",
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
          hint: "6–8 ft is typical for a wood picket fence. Wider spacing needs stiffer rails and posts — check the rail and post maker's instructions.",
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
          hint: "Sets the rails per section: 2 up to 4 ft, 3 up to 6 ft, 4 above 6 ft — common practice for wood picket fences, not a manufacturer rule.",
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
          hint: "Total width of gates and other openings — the fence stops there, so no posts or pickets are counted for it. Gate hinges and a latch are not counted. If the gate sits in the middle of the run, set Gate layout below.",
        },
        {
          id: "gateLayout",
          label: "Gate layout",
          kind: "select",
          defaultImp: "1",
          defaultMet: "1",
          options: [
            { value: "1", label: "Gate at the end, or no gate — one continuous run" },
            { value: "2", label: "One gate in the middle — two separate runs" },
            { value: "3", label: "Two gates, spread out — three separate runs" },
            { value: "4", label: "Three gates, spread out — four separate runs" },
          ],
          hint: "A gate in the middle splits the fence into separate runs, and each run needs a post at both ends. The runs are assumed equal in length. For more than three gates, split the job into separate runs and add the results.",
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
          hint: "Starting figure only: about right for a 4×4 post in a 10 in hole roughly 24 in deep; deeper or wider holes need more. The count depends on hole size, post size, and the yield printed on the bag — check the post maker's instructions. Enter 0 if you are not concreting the posts.",
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
        const gateWidthFt = opt(v, "gateWidth");
        const netRunFt = Math.max(req(v, "runLength") - gateWidthFt, 0);
        // Gate layout is a select whose value is the run count; absent
        // (e.g. a lookup-table recompute) means one continuous run.
        // With no gate width entered, the layout cannot split anything.
        const layoutSegments = Math.max(1, Math.floor(opt(v, "gateLayout") || 1));
        const segments = gateWidthFt > 0 ? layoutSegments : 1;
        const r = calculateFencePicket({
          netRunFt,
          segments,
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
        const warnings: string[] = [];
        if (netRunFt <= 0) warnings.push(NO_MATERIALS_WARNING);
        return {
          ...(warnings.length > 0 ? { warnings } : {}),
          ...(gateWidthFt > 0 ? { note: GATE_HARDWARE_NOTE } : {}),
          rows: [
            {
              label: "Posts",
              value: `${r.posts} ${r.posts === 1 ? "post" : "posts"}`,
              detail:
                r.segments > 1
                  ? `${r.sections} ${r.sections === 1 ? "section" : "sections"} across ${r.segments} runs of ${fmt(r.segmentLengthFt, 1)} ft — includes ${r.gatePosts} gate ${r.gatePosts === 1 ? "post" : "posts"}`
                  : `${r.sections} ${r.sections === 1 ? "section" : "sections"} at ${fmt(req(v, "postSpacing"), 0)} ft spacing`,
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
              detail: `${fmt(req(v, "concreteBagsPerPost"), 0)} per post — starting figure only, see the limits below`,
            },
          ],
          lines: [
            `Fence posts: ${r.posts}${r.gatePosts > 0 ? ` (including ${r.gatePosts} gate posts)` : ""}`,
            `Fence rails: ${r.rails}`,
            `Fence pickets: ${r.pickets}`,
            `Concrete bags (80 lb): ${r.concreteBags}`,
          ],
          costUsd: r.costUsd,
          ...(r.costUsd !== undefined
            ? {
                costPartial: r.costPartial,
                ...(r.costPartial ? { costLabel: "Estimated cost — priced materials only" } : {}),
                costDetail: COST_EXCLUSIONS,
              }
            : {}),
          workedLine:
            `${fmt(netRunFt, 0)} ft net` +
            (r.segments > 1
              ? ` ÷ ${r.segments} runs = ${fmt(r.segmentLengthFt, 1)} ft per run; ${fmt(r.segmentLengthFt, 1)} ft ÷ ${fmt(req(v, "postSpacing"), 0)} ft spacing = ${r.sectionsPerRun} ${r.sectionsPerRun === 1 ? "section" : "sections"} per run (${r.sections} sections, ${r.posts} posts including ${r.gatePosts} gate posts); `
              : ` ÷ ${fmt(req(v, "postSpacing"), 0)} ft spacing = ${r.sections} sections (${r.posts} posts); `) +
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
          hint: "1.83 m (6 ft) is the standard UK panel length (Jacksons Fencing).",
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
          hint: "Starting figure only: 2 bags suits a 100 × 100 mm post in a 300 × 600 mm hole (Blue Circle Postcrete data sheet); deeper or wider holes, concrete posts, and gate posts need more. Enter 0 if you are not concreting the posts.",
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
          hint: "Total width of gates and other openings — the fence stops there, so no panels or posts are counted for it. Gate hinges and a latch are not counted. If the gate sits in the middle of the run, set Gate layout below.",
        },
        {
          id: "gateLayout",
          label: "Gate layout",
          kind: "select",
          defaultImp: "1",
          defaultMet: "1",
          options: [
            { value: "1", label: "Gate at the end, or no gate — one continuous run" },
            { value: "2", label: "One gate in the middle — two separate runs" },
            { value: "3", label: "Two gates, spread out — three separate runs" },
            { value: "4", label: "Three gates, spread out — four separate runs" },
          ],
          hint: "A gate in the middle splits the fence into separate runs, and each run needs a post at both ends. The runs are assumed equal in length. For more than three gates, split the job into separate runs and add the results.",
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
        const gateWidthFt = opt(v, "gateWidth");
        const netRunFt = Math.max(req(v, "runLength") - gateWidthFt, 0);
        const layoutSegments = Math.max(1, Math.floor(opt(v, "gateLayout") || 1));
        const segments = gateWidthFt > 0 ? layoutSegments : 1;
        const r = calculateFencePanel({
          netRunFt,
          segments,
          panelLengthFt: req(v, "panelLength"),
          gravelBoards: req(v, "gravelBoards"),
          postcreteBagsPerPost: req(v, "postcreteBagsPerPost"),
          pricePerPanel: present.has("pricePerPanel") ? req(v, "pricePerPanel") : undefined,
          pricePerPost: present.has("pricePerPost") ? req(v, "pricePerPost") : undefined,
          pricePerPostcreteBag: present.has("pricePerPostcreteBag")
            ? req(v, "pricePerPostcreteBag")
            : undefined,
        });
        const warnings: string[] = [];
        if (netRunFt <= 0) warnings.push(NO_MATERIALS_WARNING);
        if (r.lastPanelCut) {
          warnings.push(
            `This run needs ${r.partialPanels} partial ${r.partialPanels === 1 ? "panel" : "panels"} of ${fmt(r.cutLengthFt, 1)} ft. Do not assume the panel can be cut — check the panel maker's instructions first, or adjust the run or panel size.`,
          );
        }
        return {
          ...(warnings.length > 0 ? { warnings } : {}),
          ...(gateWidthFt > 0 ? { note: GATE_HARDWARE_NOTE } : {}),
          rows: [
            {
              label: "Panels",
              value: `${r.panels} ${r.panels === 1 ? "panel" : "panels"}`,
              detail: r.lastPanelCut
                ? `${fmt(req(v, "panelLength"), 0)} ft each — ${r.partialPanels} partial ${r.partialPanels === 1 ? "panel" : "panels"} of ${fmt(r.cutLengthFt, 1)} ft; check the panel maker's instructions before cutting`
                : `${fmt(req(v, "panelLength"), 0)} ft each`,
            },
            {
              label: "Posts",
              value: `${r.posts} ${r.posts === 1 ? "post" : "posts"}`,
              detail:
                r.segments > 1
                  ? `${r.panels} panels across ${r.segments} runs of ${fmt(r.segmentLengthFt, 1)} ft — includes ${r.gatePosts} gate ${r.gatePosts === 1 ? "post" : "posts"}`
                  : "Panels + 1",
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
              detail: `${fmt(req(v, "postcreteBagsPerPost"), 0)} per post — starting figure only, see the limits below`,
            },
          ],
          lines: [
            `Fence panels: ${r.panels}`,
            `Fence posts: ${r.posts}${r.gatePosts > 0 ? ` (including ${r.gatePosts} gate posts)` : ""}`,
            `Gravel boards: ${r.gravelBoardsCount}`,
            `Postcrete bags (20 kg): ${r.postcreteBags}`,
          ],
          costUsd: r.costUsd,
          ...(r.costUsd !== undefined
            ? {
                costPartial: r.costPartial,
                ...(r.costPartial ? { costLabel: "Estimated cost — priced materials only" } : {}),
                costDetail: COST_EXCLUSIONS,
              }
            : {}),
          workedLine:
            `${fmt(netRunFt, 0)} ft net` +
            (r.segments > 1
              ? ` ÷ ${r.segments} runs = ${fmt(r.segmentLengthFt, 1)} ft per run; ${fmt(r.segmentLengthFt, 1)} ft ÷ ${fmt(req(v, "panelLength"), 0)} ft panels = ${r.panelsPerRun} panels per run (${r.panels} panels, ${r.posts} posts including ${r.gatePosts} gate posts); `
              : ` ÷ ${fmt(req(v, "panelLength"), 0)} ft panels = ${r.panels} panels (${r.posts} posts); `) +
            `${r.posts} posts × ${fmt(req(v, "postcreteBagsPerPost"), 0)} Postcrete bags = ${r.postcreteBags}.`,
        };
      },
    },
  ],
};
