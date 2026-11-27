import { getCalculator } from "./registry";

/**
 * Linked text — typed inline links inside calculator copy (Phase 17B-1).
 *
 * Content strings that name another calculator become segments instead of
 * plain strings: a segment is plain text, a link to a calculator by its
 * registry slug, or bold text. The slug is resolved to a URL through
 * getCalculator() at render time, so the registry stays the single source
 * of truth and a URL can never rot in one place while living in another.
 * Slugs are never hard-coded URLs, and no Markdown parser or innerHTML
 * is involved anywhere.
 */
export interface LinkedTextSegment {
  text: string;
  /** Registry slug of the destination calculator (rendered as a link). */
  calc?: string;
  /** Rendered in <strong>. */
  strong?: boolean;
}

export type LinkedText = LinkedTextSegment[];

/**
 * Resolve a segment's slug to its URL; unknown slug → undefined, and the
 * renderer falls back to plain text (fail closed — never a broken link).
 */
export function calculatorUrl(slug: string): string | undefined {
  return getCalculator(slug)?.url;
}

/** True when the value is a LinkedText array (as opposed to a plain string). */
export function isLinkedText(value: string | LinkedText): value is LinkedText {
  return Array.isArray(value);
}

/** Plain-text rendering of a LinkedText value (for contexts that cannot render links). */
export function linkedTextToPlain(value: string | LinkedText): string {
  if (typeof value === "string") return value;
  return value.map((seg) => seg.text).join("");
}
