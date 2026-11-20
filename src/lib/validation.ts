/**
 * Shared input validation helpers for calculator islands.
 *
 * Every calculator validates the same way: a required field must be filled,
 * numeric fields must be positive where a positive value is required, and
 * implausibly large values are rejected with a specific message. Empty
 * input produces no result — never a zero result.
 */

export interface ValidationRule {
  /** Human-readable field label, used in error messages. */
  label: string;
  /** True when the field may be left empty (e.g. an optional price). */
  optional?: boolean;
  /** Minimum allowed value (exclusive when `exclusiveMin` is true). */
  min?: number;
  /** True when `min` is exclusive (value must be greater than min). */
  exclusiveMin?: boolean;
  /** Maximum allowed value (inclusive). */
  max?: number;
  /** True when the value must be a whole number (e.g. a count of doors). */
  integer?: boolean;
}

/** Parse a raw input string. Returns undefined for empty/non-numeric input. */
export function parseNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Validate one field value against a rule. Returns an error message, or
 * undefined when the value is valid. `present` reports whether a value was
 * entered at all (used by callers to tell "empty" from "invalid").
 */
export function validateField(
  raw: string,
  rule: ValidationRule,
): { error?: string; value?: number; present: boolean } {
  const value = parseNumber(raw);
  if (value === undefined) {
    if (raw.trim() === "") {
      return rule.optional
        ? { present: false }
        : { error: `${rule.label} is required.`, present: false };
    }
    return { error: `${rule.label} must be a number.`, present: true };
  }
  if (rule.integer && !Number.isInteger(value)) {
    return { error: `${rule.label} must be a whole number.`, value, present: true };
  }
  if (rule.min !== undefined) {
    if (rule.exclusiveMin ? value <= rule.min : value < rule.min) {
      return {
        error:
          rule.min === 0 && rule.exclusiveMin
            ? `${rule.label} must be greater than 0.`
            : `${rule.label} must be at least ${rule.min}.`,
        value,
        present: true,
      };
    }
  }
  if (rule.max !== undefined && value > rule.max) {
    return {
      error: `${rule.label} must be ${rule.max} or less.`,
      value,
      present: true,
    };
  }
  return { value, present: true };
}

/** Format a number for display, trimming trailing zeros. */
export function formatNumber(value: number, decimals = 2): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

/** Format a US dollar amount, e.g. 123.45 -> "$123.45". */
export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
