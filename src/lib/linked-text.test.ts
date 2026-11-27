import { describe, expect, it } from "vitest";
import { CALCULATOR_CONFIGS } from "../calculators/index";
import { getCalculator } from "./registry";
import { calculatorUrl, isLinkedText, linkedTextToPlain, type LinkedText } from "./linked-text";
import type { CalculatorConfig } from "../components/react/CalculatorConfig";

/**
 * LinkedText tests (Phase 17B-1, Tranches B + D).
 *
 * The mechanism's contract: a segment's `calc` is a registry slug, never
 * a hard-coded URL; the renderer resolves it through getCalculator() and
 * fails closed to plain text for unknown slugs. These tests scan every
 * config for every `calc` slug in use and assert each one resolves, so a
 * typo'd slug fails the gate instead of shipping a dead link.
 */

describe("linked-text helpers", () => {
  it("resolves a known slug to its registry URL", () => {
    expect(calculatorUrl("paint-calculator")).toBe("/calculators/paint-calculator/");
    expect(calculatorUrl("stair-calculator")).toBe("/calculators/stair-calculator/");
  });

  it("returns undefined for an unknown slug (fail closed)", () => {
    expect(calculatorUrl("not-a-calculator")).toBeUndefined();
    expect(calculatorUrl("")).toBeUndefined();
  });

  it("renders a LinkedText value to plain text by joining segments", () => {
    expect(
      linkedTextToPlain([
        { text: "see the " },
        { text: "Paint Calculator", calc: "paint-calculator" },
        { text: " for net paintable area." },
      ]),
    ).toBe("see the Paint Calculator for net paintable area.");
    expect(linkedTextToPlain("already plain")).toBe("already plain");
  });

  it("distinguishes a LinkedText array from a plain string", () => {
    expect(isLinkedText("plain")).toBe(false);
    expect(isLinkedText([{ text: "linked" }])).toBe(true);
  });
});

/** Collect every LinkedText value reachable from a config's static data. */
function staticLinkedTexts(config: CalculatorConfig): LinkedText[] {
  const found: LinkedText[] = [];
  const push = (value: string | LinkedText | undefined) => {
    if (value !== undefined && isLinkedText(value)) found.push(value);
  };
  for (const step of config.howTo) push(step);
  for (const item of config.limitations) push(item);
  for (const faq of config.faqs) push(faq.answer);
  push(config.lookupTable?.note);
  for (const section of config.depthSections ?? []) {
    for (const block of section.blocks) {
      if (block.type === "paragraph") push(block.text);
    }
  }
  return found;
}

describe("every calc slug used in any config resolves", () => {
  it("resolves every segment slug in howTo, limitations, FAQs, lookup notes, and depth sections", () => {
    const slugs = new Set<string>();
    for (const [slug, config] of Object.entries(CALCULATOR_CONFIGS)) {
      for (const text of staticLinkedTexts(config)) {
        for (const seg of text) {
          if (seg.calc === undefined) continue;
          slugs.add(seg.calc);
          expect(
            getCalculator(seg.calc),
            `${slug} links to unknown calculator slug "${seg.calc}"`,
          ).toBeDefined();
          // Slugs, never hard-coded URLs.
          expect(seg.calc).not.toContain("/");
          expect(seg.calc).not.toContain("http");
        }
      }
    }
    // At least the 12 static B links plus the depth-section links are in use.
    expect(slugs.size).toBeGreaterThanOrEqual(10);
  });

  it("uses no hard-coded calculator URL inside any segment text", () => {
    for (const config of Object.values(CALCULATOR_CONFIGS)) {
      for (const text of staticLinkedTexts(config)) {
        for (const seg of text) {
          expect(seg.text).not.toContain("/calculators/");
        }
      }
    }
  });
});

/** A registered config that must exist (strict indexing makes the lookup possibly undefined). */
function mustConfig(slug: string): CalculatorConfig {
  const config = CALCULATOR_CONFIGS[slug];
  if (config === undefined) throw new Error(`no calculator config for slug ${slug}`);
  return config;
}

/** A mode that must exist. */
function mustMode(config: CalculatorConfig): CalculatorConfig["modes"][number] {
  const mode = config.modes.find((m) => m.id === config.defaultMode) ?? config.modes[0];
  if (mode === undefined) throw new Error(`no default mode for ${config.slug}`);
  return mode;
}

/**
 * Build canonical values from a mode's own imperial defaults, the way the
 * island initialises a calculator. Select values are numeric factors;
 * fields with an empty default are left absent (optional).
 */
function defaultValues(config: CalculatorConfig): {
  values: Record<string, number>;
  present: Set<string>;
} {
  const mode = mustMode(config);
  const values: Record<string, number> = {};
  const present = new Set<string>();
  for (const field of mode.fields) {
    const raw = field.defaultImp;
    if (raw === undefined || raw === "") continue;
    const n = Number(raw);
    if (Number.isNaN(n)) continue;
    values[field.id] = n;
    present.add(field.id);
  }
  return { values, present };
}

describe("result-note links (B1, B5)", () => {
  it("Paint result note links the Primer Calculator and resolves", () => {
    const config = mustConfig("paint-calculator");
    const { values, present } = defaultValues(config);
    const mode = mustMode(config);
    const out = mode.compute(values, present);
    expect(isLinkedText(out.note ?? "")).toBe(true);
    const note = out.note as LinkedText;
    expect(linkedTextToPlain(note)).toContain("Primer Calculator");
    for (const seg of note) {
      if (seg.calc !== undefined) {
        expect(getCalculator(seg.calc)).toBeDefined();
      }
    }
    expect(note.some((seg) => seg.calc === "primer-calculator")).toBe(true);
  });

  it("Primer result note links the Paint Calculator and resolves", () => {
    const config = mustConfig("primer-calculator");
    const { values, present } = defaultValues(config);
    const mode = mustMode(config);
    const out = mode.compute(values, present);
    expect(isLinkedText(out.note ?? "")).toBe(true);
    const note = out.note as LinkedText;
    expect(linkedTextToPlain(note)).toContain("Paint Calculator");
    expect(note.some((seg) => seg.calc === "paint-calculator")).toBe(true);
  });
});
