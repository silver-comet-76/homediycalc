/**
 * Calculator configuration types — the data that drives the shared
 * `GenericCalculator` island.
 *
 * Each P0 calculator is one config object: one or more input modes (e.g.
 * rectangle vs. L-shape), a pure `compute` function per mode that receives
 * canonical values (feet / square feet / cubic feet / US gallons /
 * square feet per gallon) and
 * returns display rows plus a shopping list, and the static page content
 * (how to measure, worked example, limitations, FAQ). The island owns all
 * UI behavior — unit toggle, validation, reset, copy, Add to Project —
 * so the ten calculators behave identically and no calculator re-implements
 * conversion or validation.
 */

import type { ResultRow } from "./CalculatorInputs";

export type FieldKind =
  "length" | "area" | "volume" | "number" | "count" | "percent" | "price" | "select";

/** Kinds of SVG measurement diagram the shared component can draw. */
export type DiagramKind = "area" | "volume" | "wall" | "ceiling" | "joint" | "linear" | "board";

export type UnitKind = "length" | "area" | "volume" | "coverage";

export interface FieldSpec {
  id: string;
  label: string;
  kind: FieldKind;
  /** Which unit family the field converts in (length/area/volume/coverage). */
  unitKind?: UnitKind;
  /**
   * Canonical unit the formula expects, when it is not the family
   * default (feet / square feet / cubic feet / square feet per gallon).
   * E.g. tile and brick dimensions are entered in inches and the
   * formulas take inches, so those fields set canonicalUnit "in".
   */
  canonicalUnit?: string;
  /** Unit used in the imperial system, e.g. "ft", "in", "ft2", "yd3", "ft2/gal". */
  impUnit?: string;
  /** Unit used in the metric system, e.g. "m", "cm", "m2", "m3", "m2/L". */
  metUnit?: string;
  /** Default value shown in the imperial system. */
  defaultImp: string;
  /** Default value shown in the metric system. */
  defaultMet: string;
  min?: number;
  max?: number;
  /** Hint shown under the field, e.g. a cited reference value. */
  hint?: string;
  /** True when the field may be left empty (optional price / density). */
  optional?: boolean;
  /** True when the user may pick the unit per field (e.g. mixed dimensions). */
  allowUnitSelect?: boolean;
  /** Units offered in the per-field unit picker. */
  unitOptions?: string[];
  /** Options for a "select" field (value is stored as a number). */
  options?: { value: string; label: string }[];
}

/** What a mode's compute function returns for display. */
export interface CalcOutput {
  rows: ResultRow[];
  /** Plain-text shopping list lines (without the header). */
  lines: string[];
  /** Total estimated cost in USD, only when prices were entered. */
  costUsd?: number;
  /**
   * True when costUsd covers only part of the job — e.g. the Brick
   * Calculator's bricks-only figure when the mortar bag count is
   * unknown (ADR-13). A partial cost must never be presented as a
   * total: the UI labels it with costLabel/costDetail, and My Project
   * preserves the flag through save/reload and exports (ADR-16).
   */
  costPartial?: boolean;
  /**
   * Label for the cost row and shopping-list cost line when costUsd
   * covers only part of the job — e.g. "Partial cost (bricks only)".
   * When absent, the cost is shown as the estimated total.
   */
  costLabel?: string;
  /**
   * Detail shown with a partial cost — what it excludes and why,
   * e.g. "Excludes mortar — no bag count for this brick size or joint".
   */
  costDetail?: string;
  /** One-line substitution showing the actual numbers, e.g. "10 × 10 × 0.33 ft = 33.33 ft³". */
  workedLine?: string;
  /** Extra note shown under the results. */
  note?: string;
  /**
   * Prominent noncompliance warnings shown above the results, e.g. the
   * Stair Calculator's 151 in single-flight limit (2021 IRC R311.7.3).
   * The results still render below the warning: the numbers are a
   * planning estimate, and the warning makes clear they are not a
   * compliant design.
   */
  warnings?: string[];
}

/**
 * The shopping-list cost line for a compute result, or undefined when
 * no cost is shown. A partial cost keeps its own label and says what
 * it excludes, so a copied list never presents a bricks-only figure
 * as a total.
 */
export function costShoppingListLine(output: CalcOutput): string | undefined {
  if (output.costUsd === undefined) return undefined;
  if (output.costLabel !== undefined) {
    const detail = output.costDetail !== undefined ? ` (${output.costDetail})` : "";
    return `${output.costLabel}: $${output.costUsd.toFixed(2)}${detail}`;
  }
  return `Estimated total: $${output.costUsd.toFixed(2)} (only if the prices you entered hold)`;
}

export interface ModeSpec {
  id: string;
  label: string;
  fields: FieldSpec[];
  /**
   * Pure calculation for this mode. `values` holds canonical numbers
   * (feet / square feet / cubic feet / US gallons / square feet per
   * gallon, or raw numbers for number/count/percent/price fields);
   * `present` lists the field ids the user actually filled in, so
   * optional fields can be told apart from fields left empty.
   */
  compute: (values: Record<string, number>, present: Set<string>) => CalcOutput;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Read a required canonical value. The island only calls `compute` when
 * every required field validated, so a missing value here is a bug, not
 * user input — throw rather than silently computing with zero.
 */
export function req(values: Record<string, number>, id: string): number {
  const value = values[id];
  if (value === undefined) {
    throw new Error(`Missing required calculator value: ${id}`);
  }
  return value;
}

/** Read an optional canonical value, defaulting to 0 when absent. */
export function opt(values: Record<string, number>, id: string): number {
  return values[id] ?? 0;
}

export interface CalculatorConfig {
  slug: string;
  modes: ModeSpec[];
  defaultMode: string;
  /** SVG measurement diagram kind, rendered by the shared component. */
  diagram?: DiagramKind;
  /**
   * "Common sizes" lookup table, rendered on the calculator page from
   * the calculator's own formula outputs (Phase 14). Rows are display
   * strings generated by running the formula — never hand-calculated.
   * The first column of each row names the standard input; the rest
   * are the computed outputs for that input.
   */
  lookupTable?: {
    headers: string[];
    rows: string[][];
    /** One-sentence note stating the assumptions the table used. */
    note?: string;
  };
  /** Plain-language formula, shown under "How this is calculated". */
  formula: string;
  /** How-to-measure steps, shown on the page. */
  howTo: string[];
  /** Worked example text, shown on the page. */
  workedExample: string;
  /** Limitations, shown on the page. */
  limitations: string[];
  faqs: FaqItem[];
}
