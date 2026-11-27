import { ceilUp } from "../units";

/**
 * Fence Calculator — material quantities for a fence run: posts, rails,
 * pickets (US picket mode) or panels, gravel boards, and Postcrete
 * (UK panel mode), with gate deductions and waste.
 *
 * Pure functions only. Canonical unit: feet for length, inches for
 * picket dimensions.
 *
 * Reference values (see docs/FORMULAS.md): rails by height — 2 up to
 * 4 ft, 3 up to 6 ft, 4 above 6 ft (calcfence.com); post spacing 6–8 ft
 * (US); concrete 2 × 80 lb bags per 10-in hole (calcfence.com); UK
 * panels 1.83 m standard, posts = panels + 1, gravel boards 1 per
 * panel, Postcrete 2 × 20 kg bags per post (buildcalcu.com,
 * calctools.uk, tradecalculator.co.uk).
 *
 * This calculator counts materials only. It does not check structural
 * adequacy, wind load, or foundation design; it does not tell you how
 * deep to set posts, what footing a post needs, or whether a fence
 * complies with local rules; and it does not settle boundary placement.
 */

export interface FencePicketInput {
  /** Run length minus gates and openings, in feet. */
  netRunFt: number;
  /** Post spacing in feet (6–8 ft is typical for wood picket fences). */
  postSpacingFt: number;
  /** Fence height in feet (sets the rails per section). */
  fenceHeightFt: number;
  /** Picket width in inches (6 in is the common size). */
  picketWidthIn: number;
  /** Gap between pickets in inches (0 for a privacy fence). */
  picketGapIn: number;
  /** Waste allowance in percent — applied to pickets and rails only, not posts. */
  wastePct: number;
  /** 80 lb concrete bags per post (2 is common; 0 if not concreting). */
  concreteBagsPerPost: number;
  /** Optional price per post, in USD. */
  pricePerPost?: number;
  /** Optional price per picket, in USD. */
  pricePerPicket?: number;
  /** Optional price per rail, in USD. */
  pricePerRail?: number;
}

export interface FencePicketResult {
  /** Fence sections (run ÷ spacing, rounded up). */
  sections: number;
  /** Posts (sections + 1). */
  posts: number;
  /** Rails per section (2 up to 4 ft, 3 up to 6 ft, 4 above 6 ft). */
  railsPerSection: number;
  /** Rails to buy (rounded up, waste included). */
  rails: number;
  /** Pickets to buy (rounded up, waste included). */
  pickets: number;
  /** 80 lb concrete bags to buy. */
  concreteBags: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateFencePicket(input: FencePicketInput): FencePicketResult {
  if (input.netRunFt <= 0) {
    return {
      sections: 0,
      posts: 0,
      railsPerSection: input.fenceHeightFt <= 4.02 ? 2 : input.fenceHeightFt <= 6.02 ? 3 : 4,
      rails: 0,
      pickets: 0,
      concreteBags: 0,
      costUsd: undefined,
    };
  }
  const sections = ceilUp(input.netRunFt / input.postSpacingFt);
  const posts = sections + 1;
  // A 0.02 ft (about 1/4 in) tolerance at the band boundaries: the
  // metric default of 1.83 m converts to 6.0039 ft, and a 6 ft fence
  // must still take 3 rails, not 4.
  const railsPerSection = input.fenceHeightFt <= 4.02 ? 2 : input.fenceHeightFt <= 6.02 ? 3 : 4;
  const rails = ceilUp(sections * railsPerSection * (1 + input.wastePct / 100));
  const picketPitchFt = (input.picketWidthIn + input.picketGapIn) / 12;
  const pickets = ceilUp((input.netRunFt / picketPitchFt) * (1 + input.wastePct / 100));
  const concreteBags = posts * input.concreteBagsPerPost;
  // Cost is the sum of the priced parts; unpriced parts contribute 0.
  // No price entered at all means no cost is shown.
  const costUsd =
    input.pricePerPost !== undefined ||
    input.pricePerPicket !== undefined ||
    input.pricePerRail !== undefined
      ? (input.pricePerPost !== undefined ? posts * input.pricePerPost : 0) +
        (input.pricePerPicket !== undefined ? pickets * input.pricePerPicket : 0) +
        (input.pricePerRail !== undefined ? rails * input.pricePerRail : 0)
      : undefined;
  return { sections, posts, railsPerSection, rails, pickets, concreteBags, costUsd };
}

export interface FencePanelInput {
  /** Run length minus gates and openings, in feet. */
  netRunFt: number;
  /** Panel length in feet (1.83 m / 6 ft is the UK standard). */
  panelLengthFt: number;
  /** 1 with gravel boards (1 per panel), 0 without. */
  gravelBoards: number;
  /** 20 kg Postcrete bags per post (2 is common). */
  postcreteBagsPerPost: number;
  /** Optional price per panel, in USD. */
  pricePerPanel?: number;
  /** Optional price per post, in USD. */
  pricePerPost?: number;
  /** Optional price per Postcrete bag, in USD. */
  pricePerPostcreteBag?: number;
}

export interface FencePanelResult {
  /** Panels to buy (rounded up). */
  panels: number;
  /** Posts (panels + 1). */
  posts: number;
  /** Gravel boards to buy (1 per panel, when selected). */
  gravelBoardsCount: number;
  /** 20 kg Postcrete bags to buy. */
  postcreteBags: number;
  /** Length of the last (cut) panel in feet; equals the panel length when exact. */
  cutLengthFt: number;
  /** True when the last panel must be cut to fit. */
  lastPanelCut: boolean;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
}

export function calculateFencePanel(input: FencePanelInput): FencePanelResult {
  if (input.netRunFt <= 0) {
    return {
      panels: 0,
      posts: 0,
      gravelBoardsCount: 0,
      postcreteBags: 0,
      cutLengthFt: 0,
      lastPanelCut: false,
      costUsd: undefined,
    };
  }
  const panels = ceilUp(input.netRunFt / input.panelLengthFt);
  const posts = panels + 1;
  const gravelBoardsCount = panels * input.gravelBoards;
  const postcreteBags = posts * input.postcreteBagsPerPost;
  const cutLengthFt = input.netRunFt - (panels - 1) * input.panelLengthFt;
  // A 0.01 ft tolerance keeps floating-point noise from flagging an
  // exact-fit last panel as cut.
  const lastPanelCut = cutLengthFt < input.panelLengthFt - 0.01;
  const costUsd =
    input.pricePerPanel !== undefined ||
    input.pricePerPost !== undefined ||
    input.pricePerPostcreteBag !== undefined
      ? (input.pricePerPanel !== undefined ? panels * input.pricePerPanel : 0) +
        (input.pricePerPost !== undefined ? posts * input.pricePerPost : 0) +
        (input.pricePerPostcreteBag !== undefined ? postcreteBags * input.pricePerPostcreteBag : 0)
      : undefined;
  return {
    panels,
    posts,
    gravelBoardsCount,
    postcreteBags,
    cutLengthFt,
    lastPanelCut,
    costUsd,
  };
}
