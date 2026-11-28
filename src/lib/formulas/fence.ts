import { ceilUp } from "../units";

/**
 * Fence Calculator — material quantities for a fence run: posts, rails,
 * pickets (US picket mode) or panels, gravel boards, and Postcrete
 * (UK panel mode), with gate deductions and waste.
 *
 * Pure functions only. Canonical unit: feet for length, inches for
 * picket dimensions.
 *
 * Segments (QA corrective round, Workstream A): a gate or opening in
 * the middle of a run splits the fence into separate runs, and each
 * run needs a post at both ends — so posts are counted per segment,
 * not on the net run as one continuous length. The caller passes
 * `segments`, the number of separate runs the net fence length is
 * divided into; the runs are assumed equal in length, and each
 * boundary between two runs is a gate opening flanked by two posts
 * (one at the end of each run). No post is shared across a gate
 * opening. A gate at the end of the run does not split it
 * (`segments = 1`). An end gate (QA-17B2-R01): a freestanding gate at
 * the end of the run needs an additional opposing support post — the
 * fence-end post alone cannot hold a gate — so one extra post is
 * counted unless the gate hangs from an existing support (house,
 * wall, or existing post). The extra post is counted as a gate post.
 * A gate in the middle of the run (`segments > 1`) already counts
 * two flanking posts per gate opening, so the end-gate option does
 * not apply there. Gate hardware (hinges, latch) is not counted
 * anywhere here. A gate post is counted as an ordinary fence post;
 * this calculator does not say whether that post suits the gate.
 *
 * Reference values (see docs/FORMULAS.md): rails by height — 2 up to
 * 4 ft, 3 up to 6 ft, 4 above 6 ft — is common practice for wood
 * picket fences, not a manufacturer rule; post spacing 6–8 ft is
 * typical for a wood picket fence. Concrete: Quikrete's setting-posts
 * guide sizes the hole about 3 times the post width and 1/3 to 1/2
 * of the above-ground post length deep, plus 6 in of gravel, and its
 * Fast-Setting data sheet works 2 × 50 lb bags for a 3 in post in a
 * 9 in hole 30 in deep; Sakrete's Fast Setting data sheet tables
 * 2 bags at 18 in, 2.5 at 24 in, and 3 at 30 in for a 10 in hole
 * (50 lb bags). An 80 lb bag of standard mix yields about 0.60 ft³,
 * so a 4×4 post in a 10 in hole about 24 in deep needs about
 * 2 × 80 lb bags — the default is a starting figure for that hole
 * size only, not a sufficient quantity for every hole. UK panels
 * 1.83 m (6 ft) standard (Jacksons Fencing); Postcrete 2 × 20 kg
 * bags per post for a 100 × 100 mm post in a 300 × 600 mm hole
 * (Blue Circle Postcrete data sheet). Cutting a panel is not
 * assumed suitable: Grange Fencing's guarantee conditions say
 * cutting treated wood renders its guarantee null and void unless
 * a cut-end treatment is applied, and Jacksons Fencing publishes
 * panel-specific cut-down instructions and kits — check the panel
 * maker's instructions before cutting.
 *
 * This calculator counts materials only. It does not check structural
 * adequacy, wind load, or foundation design; it does not tell you how
 * deep to set posts, what footing a post needs, or whether a fence
 * complies with local rules; and it does not settle boundary placement.
 */

/**
 * Normalize a caller-supplied segment count: at least 1, a whole
 * number, and 1 for anything missing, invalid, or non-finite.
 */
export function normalizeSegments(segments: number | undefined): number {
  if (segments === undefined || !Number.isFinite(segments)) return 1;
  return Math.max(1, Math.floor(segments));
}

export interface FencePicketInput {
  /** Run length minus gates and openings, in feet. */
  netRunFt: number;
  /**
   * Number of separate runs the net length is divided into by gates
   * or openings. The runs are assumed equal in length. 1 = one
   * continuous run (no gate, or a gate at the end). Defaults to 1.
   */
  segments?: number;
  /**
   * True when a gate sits at the end of the run (gate width > 0 and
   * segments === 1). A freestanding end gate needs an additional
   * opposing support post; ignored when segments > 1.
   */
  endGate?: boolean;
  /**
   * True when the end gate hangs from an existing support (house,
   * wall, or existing post) — no extra support post is counted.
   * Only applies when `endGate` is true.
   */
  endGateExistingSupport?: boolean;
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
  /**
   * 80 lb concrete bags per post. 2 is a starting figure only, suited
   * to a 4×4 post in a 10 in hole about 24 in deep; 0 if not concreting.
   */
  concreteBagsPerPost: number;
  /** Optional price per post, in USD. */
  pricePerPost?: number;
  /** Optional price per picket, in USD. */
  pricePerPicket?: number;
  /** Optional price per rail, in USD. */
  pricePerRail?: number;
}

export interface FencePicketResult {
  /** Number of separate runs the net length was divided into. */
  segments: number;
  /** Length of one run in feet (net run ÷ segments). */
  segmentLengthFt: number;
  /** Sections per run (run length ÷ spacing, rounded up). */
  sectionsPerRun: number;
  /** Fence sections in total (sections per run × segments). */
  sections: number;
  /** Posts in total: sum over runs of (sections per run + 1), plus any end-gate support post. */
  posts: number;
  /**
   * Posts flanking gate openings: 2 per boundary between runs, plus
   * 1 for a freestanding end gate.
   */
  gatePosts: number;
  /** Posts that are not gate posts. */
  linePosts: number;
  /**
   * Extra support posts for a freestanding end gate: 1 when the end
   * gate is freestanding, 0 otherwise. Counted in `posts` and in
   * `gatePosts`; never in `linePosts`.
   */
  endGateSupportPosts: number;
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
  /**
   * True when a cost is shown but at least one priced part has no
   * price entered, so the cost is a priced-materials subtotal, not
   * a complete project cost. False when no cost is shown or every
   * priced part has a price.
   */
  costPartial: boolean;
}

export function calculateFencePicket(input: FencePicketInput): FencePicketResult {
  const segments = normalizeSegments(input.segments);
  const railsPerSection = input.fenceHeightFt <= 4.02 ? 2 : input.fenceHeightFt <= 6.02 ? 3 : 4;
  if (input.netRunFt <= 0) {
    return {
      segments,
      segmentLengthFt: 0,
      sectionsPerRun: 0,
      sections: 0,
      posts: 0,
      gatePosts: 0,
      linePosts: 0,
      endGateSupportPosts: 0,
      railsPerSection,
      rails: 0,
      pickets: 0,
      concreteBags: 0,
      costUsd: undefined,
      costPartial: false,
    };
  }
  const segmentLengthFt = input.netRunFt / segments;
  const sectionsPerRun = ceilUp(segmentLengthFt / input.postSpacingFt);
  const sections = sectionsPerRun * segments;
  // A freestanding end gate needs an additional opposing support post:
  // the fence-end post alone cannot hold a gate. The conservative
  // default counts it unless the gate hangs from an existing support.
  // Middle gates (segments > 1) already count two flanking posts per
  // boundary, so the end-gate option is ignored there.
  const endGateSupportPosts =
    segments === 1 && input.endGate && !input.endGateExistingSupport ? 1 : 0;
  const posts = (sectionsPerRun + 1) * segments + endGateSupportPosts;
  // Each boundary between two runs is a gate opening flanked by one
  // post at the end of each run. No post is shared across a gate.
  // The end-gate support post, when counted, is a gate post too.
  const gatePosts = 2 * (segments - 1) + endGateSupportPosts;
  const linePosts = posts - gatePosts;
  // A 0.02 ft (about 1/4 in) tolerance at the band boundaries: the
  // metric default of 1.83 m converts to 6.0039 ft, and a 6 ft fence
  // must still take 3 rails, not 4.
  const rails = ceilUp(sections * railsPerSection * (1 + input.wastePct / 100));
  const picketPitchFt = (input.picketWidthIn + input.picketGapIn) / 12;
  const pickets = ceilUp((input.netRunFt / picketPitchFt) * (1 + input.wastePct / 100));
  const concreteBags = posts * input.concreteBagsPerPost;
  // Cost is the sum of the priced parts; unpriced parts contribute 0.
  // No price entered at all means no cost is shown. A cost with any
  // priced part unpriced is a priced-materials subtotal only.
  const anyPrice =
    input.pricePerPost !== undefined ||
    input.pricePerPicket !== undefined ||
    input.pricePerRail !== undefined;
  const allPrices =
    input.pricePerPost !== undefined &&
    input.pricePerPicket !== undefined &&
    input.pricePerRail !== undefined;
  const costUsd = anyPrice
    ? (input.pricePerPost !== undefined ? posts * input.pricePerPost : 0) +
      (input.pricePerPicket !== undefined ? pickets * input.pricePerPicket : 0) +
      (input.pricePerRail !== undefined ? rails * input.pricePerRail : 0)
    : undefined;
  return {
    segments,
    segmentLengthFt,
    sectionsPerRun,
    sections,
    posts,
    gatePosts,
    linePosts,
    endGateSupportPosts,
    railsPerSection,
    rails,
    pickets,
    concreteBags,
    costUsd,
    costPartial: costUsd !== undefined && !allPrices,
  };
}

export interface FencePanelInput {
  /** Run length minus gates and openings, in feet. */
  netRunFt: number;
  /**
   * Number of separate runs the net length is divided into by gates
   * or openings. The runs are assumed equal in length. 1 = one
   * continuous run (no gate, or a gate at the end). Defaults to 1.
   */
  segments?: number;
  /**
   * True when a gate sits at the end of the run (gate width > 0 and
   * segments === 1). A freestanding end gate needs an additional
   * opposing support post; ignored when segments > 1.
   */
  endGate?: boolean;
  /**
   * True when the end gate hangs from an existing support (house,
   * wall, or existing post) — no extra support post is counted.
   * Only applies when `endGate` is true.
   */
  endGateExistingSupport?: boolean;
  /** Panel length in feet (1.83 m / 6 ft is the UK standard). */
  panelLengthFt: number;
  /** 1 with gravel boards (1 per panel), 0 without. */
  gravelBoards: number;
  /**
   * 20 kg Postcrete bags per post. 2 is a starting figure only,
   * suited to a 100 × 100 mm post in a 300 × 600 mm hole.
   */
  postcreteBagsPerPost: number;
  /** Optional price per panel, in USD. */
  pricePerPanel?: number;
  /** Optional price per post, in USD. */
  pricePerPost?: number;
  /** Optional price per Postcrete bag, in USD. */
  pricePerPostcreteBag?: number;
}

export interface FencePanelResult {
  /** Number of separate runs the net length was divided into. */
  segments: number;
  /** Length of one run in feet (net run ÷ segments). */
  segmentLengthFt: number;
  /** Panels per run (run length ÷ panel length, rounded up). */
  panelsPerRun: number;
  /** Panels to buy (rounded up). */
  panels: number;
  /** Posts in total: sum over runs of (panels per run + 1), plus any end-gate support post. */
  posts: number;
  /**
   * Posts flanking gate openings: 2 per boundary between runs, plus
   * 1 for a freestanding end gate.
   */
  gatePosts: number;
  /** Posts that are not gate posts. */
  linePosts: number;
  /**
   * Extra support posts for a freestanding end gate: 1 when the end
   * gate is freestanding, 0 otherwise. Counted in `posts` and in
   * `gatePosts`; never in `linePosts`.
   */
  endGateSupportPosts: number;
  /** Gravel boards to buy (1 per panel, when selected). */
  gravelBoardsCount: number;
  /** 20 kg Postcrete bags to buy. */
  postcreteBags: number;
  /**
   * Length of a partial (short) panel in feet; equals the panel
   * length when every run fits exactly. Every run has the same
   * length, so every partial panel is the same length.
   */
  cutLengthFt: number;
  /**
   * True when any run needs a partial panel. A partial panel is a
   * fit problem to check with the panel maker — do not assume the
   * panel can be cut.
   */
  lastPanelCut: boolean;
  /** Number of runs that need a partial panel (0 or segments). */
  partialPanels: number;
  /** Cost in USD, only when a price was entered. */
  costUsd?: number;
  /**
   * True when a cost is shown but at least one priced part has no
   * price entered, so the cost is a priced-materials subtotal, not
   * a complete project cost. False when no cost is shown or every
   * priced part has a price.
   */
  costPartial: boolean;
}

export function calculateFencePanel(input: FencePanelInput): FencePanelResult {
  const segments = normalizeSegments(input.segments);
  if (input.netRunFt <= 0) {
    return {
      segments,
      segmentLengthFt: 0,
      panelsPerRun: 0,
      panels: 0,
      posts: 0,
      gatePosts: 0,
      linePosts: 0,
      endGateSupportPosts: 0,
      gravelBoardsCount: 0,
      postcreteBags: 0,
      cutLengthFt: 0,
      lastPanelCut: false,
      partialPanels: 0,
      costUsd: undefined,
      costPartial: false,
    };
  }
  const segmentLengthFt = input.netRunFt / segments;
  const panelsPerRun = ceilUp(segmentLengthFt / input.panelLengthFt);
  const panels = panelsPerRun * segments;
  // A freestanding end gate needs an additional opposing support post:
  // the fence-end post alone cannot hold a gate. The conservative
  // default counts it unless the gate hangs from an existing support.
  // Middle gates (segments > 1) already count two flanking posts per
  // boundary, so the end-gate option is ignored there.
  const endGateSupportPosts =
    segments === 1 && input.endGate && !input.endGateExistingSupport ? 1 : 0;
  const posts = (panelsPerRun + 1) * segments + endGateSupportPosts;
  // Each boundary between two runs is a gate opening flanked by one
  // post at the end of each run. No post is shared across a gate.
  // The end-gate support post, when counted, is a gate post too.
  const gatePosts = 2 * (segments - 1) + endGateSupportPosts;
  const linePosts = posts - gatePosts;
  const gravelBoardsCount = panels * input.gravelBoards;
  const postcreteBags = posts * input.postcreteBagsPerPost;
  const cutLengthFt = segmentLengthFt - (panelsPerRun - 1) * input.panelLengthFt;
  // A 0.01 ft tolerance keeps floating-point noise from flagging an
  // exact-fit last panel as cut.
  const lastPanelCut = cutLengthFt < input.panelLengthFt - 0.01;
  const partialPanels = lastPanelCut ? segments : 0;
  const anyPrice =
    input.pricePerPanel !== undefined ||
    input.pricePerPost !== undefined ||
    input.pricePerPostcreteBag !== undefined;
  const allPrices =
    input.pricePerPanel !== undefined &&
    input.pricePerPost !== undefined &&
    input.pricePerPostcreteBag !== undefined;
  const costUsd = anyPrice
    ? (input.pricePerPanel !== undefined ? panels * input.pricePerPanel : 0) +
      (input.pricePerPost !== undefined ? posts * input.pricePerPost : 0) +
      (input.pricePerPostcreteBag !== undefined ? postcreteBags * input.pricePerPostcreteBag : 0)
    : undefined;
  return {
    segments,
    segmentLengthFt,
    panelsPerRun,
    panels,
    posts,
    gatePosts,
    linePosts,
    endGateSupportPosts,
    gravelBoardsCount,
    postcreteBags,
    cutLengthFt,
    lastPanelCut,
    partialPanels,
    costUsd,
    costPartial: costUsd !== undefined && !allPrices,
  };
}
