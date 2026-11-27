import { describe, expect, it } from "vitest";
import { mortarConfig } from "./config";
import { convertLength } from "../../lib/units";

/**
 * Config-level tests for ADR-12 (PR #2 second re-review): the bag
 * row, the shopping-list bag line, and the bag cost are suppressed
 * when the manufacturer rating does not apply (joint wider than the
 * standard ⅜ in), and a verified user-entered yield brings the count
 * back. Site-mix parts are unaffected — they come from the volume.
 */
describe("mortarConfig bag suppression (ADR-12)", () => {
  const dimsMode = mortarConfig.modes.find((m) => m.id === "dimensions");
  if (!dimsMode) throw new Error("mortar dimensions mode missing");

  function compute(overrides: Record<string, number> = {}, extraPresent: string[] = []) {
    const values = {
      length: 10,
      height: 8,
      openings: 0,
      unit: 1,
      joint: 0.375,
      waste: 15,
      mortarType: 1,
      ...overrides,
    };
    const present = new Set([...Object.keys(values), ...extraPresent]);
    return dimsMode!.compute(values, present);
  }

  function bagRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Pre-mixed mortar");
  }

  it("shows 18 bags for the standard wall", () => {
    const out = compute();
    expect(bagRow(out)?.value).toBe("18 bags");
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 18");
    expect(out.note).toContain("ASTM C270");
    expect(out.note).not.toContain("No bag count shown");
  });

  it("suppresses the bag row and bag line for a ¾ in joint, keeping the site mix", () => {
    const out = compute({ joint: 0.75 });
    expect(bagRow(out)).toBeUndefined();
    expect(out.lines.some((l) => l.startsWith("Mortar mix, 80 lb bags:"))).toBe(false);
    expect(out.note).toContain("No bag count shown");
    expect(out.note).toContain("verified yield");
    // Site mix still comes from the 8.82 ft³ volume.
    expect(out.rows.find((r) => r.label.startsWith("Site mix"))?.value).toBe("1.5 ft³ cement");
    expect(out.workedLine).toContain("no bag count");
  });

  it("shows 30 bags for a ¾ in joint with a verified yield of 0.3 ft³ per bag", () => {
    const out = compute({ joint: 0.75, bagYieldFt3: 0.3 }, ["bagYieldFt3"]);
    expect(bagRow(out)?.value).toBe("30 bags");
    expect(bagRow(out)?.detail).toContain("0.3 ft³ per bag");
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 30");
    expect(out.note).not.toContain("No bag count shown");
  });

  it("matches metric inputs to the same outcomes", () => {
    // 19.05 mm = ¾ in joint: suppressed, like the imperial wide joint.
    const wide = compute({ joint: convertLength(19.05, "mm", "in") });
    expect(bagRow(wide)).toBeUndefined();
    // 9.5 mm joint: standard, 18 bags.
    const metric = compute({ joint: convertLength(9.5, "mm", "in") });
    expect(bagRow(metric)?.value).toBe("18 bags");
  });

  it("keeps the bag row for a narrower ¼ in joint", () => {
    const out = compute({ joint: 0.25 });
    expect(bagRow(out)?.value).toBe("19 bags");
  });
});

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 bag", a count of 2 reads
 * "2 bags", in the Pre-mixed mortar row and in both worked-line
 * branches (manufacturer rating and user-entered yield).
 *
 * Counts are hand-derived from the formula (6.86 bricks/ft² for
 * modular brick at a ⅜ in joint; rating branch bags = installed
 * bricks × 1.15 ÷ 37, rounded up): a 2 × 2 ft wall has 28 bricks
 * and 1 bag; a 3 × 2 ft wall has 42 bricks and 2 bags. Yield branch
 * (¾ in joint, 5.73 bricks/ft², 0.3 ft³ per bag): a 2 × 1 ft wall
 * needs 0.23 ft³ of mortar, so 1 bag; a 2 × 2 ft wall needs 0.44 ft³,
 * so 2 bags.
 */
describe("mortarConfig singular/plural bags", () => {
  const dimsMode = mortarConfig.modes.find((m) => m.id === "dimensions");
  if (!dimsMode) throw new Error("mortar dimensions mode missing");

  function compute(overrides: Record<string, number> = {}, extraPresent: string[] = []) {
    const values = {
      length: 2,
      height: 2,
      openings: 0,
      unit: 1,
      joint: 0.375,
      waste: 15,
      mortarType: 1,
      ...overrides,
    };
    const present = new Set([...Object.keys(values), ...extraPresent]);
    return dimsMode!.compute(values, present);
  }

  function bagRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Pre-mixed mortar");
  }

  it("says '1 bag' for a 2 × 2 ft wall (rating branch)", () => {
    const out = compute();
    expect(bagRow(out)?.value).toBe("1 bag");
    expect(out.workedLine).toBe(
      "4 ft² × 6.86 bricks/ft² = 28 bricks; mortar 0.26 ft³; 28 × 115% ÷ 37 per bag = 1 bag.",
    );
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 1");
  });

  it("says '2 bags' for a 3 × 2 ft wall (rating branch)", () => {
    const out = compute({ length: 3 });
    expect(bagRow(out)?.value).toBe("2 bags");
    expect(out.workedLine).toBe(
      "6 ft² × 6.86 bricks/ft² = 42 bricks; mortar 0.39 ft³; 42 × 115% ÷ 37 per bag = 2 bags.",
    );
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 2");
  });

  it("says '1 bag' for a 2 × 1 ft wall with a ¾ in joint and a 0.3 ft³ yield", () => {
    const out = compute({ height: 1, joint: 0.75, bagYieldFt3: 0.3 }, ["bagYieldFt3"]);
    expect(bagRow(out)?.value).toBe("1 bag");
    expect(out.workedLine).toBe(
      "2 ft² × 5.73 bricks/ft² = 12 bricks; mortar 0.23 ft³ ÷ 0.3 ft³ per bag = 1 bag.",
    );
  });

  it("says '2 bags' for a 2 × 2 ft wall with a ¾ in joint and a 0.3 ft³ yield", () => {
    const out = compute({ joint: 0.75, bagYieldFt3: 0.3 }, ["bagYieldFt3"]);
    expect(bagRow(out)?.value).toBe("2 bags");
    expect(out.workedLine).toBe(
      "4 ft² × 5.73 bricks/ft² = 23 bricks; mortar 0.44 ft³ ÷ 0.3 ft³ per bag = 2 bags.",
    );
  });
});

/**
 * Config-level tests for the singular/plural sweep follow-up (Phase
 * 17B2 QA corrective round): the site-mix cement count reads
 * "1 × 94 lb sack" at count 1 and "2 × 94 lb sacks" at count 2, in
 * both the site-mix row detail and the shopping-list line.
 *
 * Counts are hand-derived from the formula (Type N cement yield
 * 0.17 ft³ per ft³ of mortar; one 94 lb sack = 1 ft³): a 2 × 2 ft
 * wall needs 0.26 ft³ of mortar, so 0.26 × 0.17 = 0.044 ft³ of
 * cement → 1 sack. A 12 × 8 ft wall needs 659 units × 0.008063
 * ft³ × 115% = 6.11 ft³ of mortar, so 6.11 × 0.17 = 1.04 ft³ of
 * cement → 2 sacks.
 */
describe("mortarConfig singular/plural cement sacks", () => {
  const dimsMode = mortarConfig.modes.find((m) => m.id === "dimensions");
  if (!dimsMode) throw new Error("mortar dimensions mode missing");

  function compute(overrides: Record<string, number> = {}, extraPresent: string[] = []) {
    const values = {
      length: 2,
      height: 2,
      openings: 0,
      unit: 1,
      joint: 0.375,
      waste: 15,
      mortarType: 1,
      ...overrides,
    };
    const present = new Set([...Object.keys(values), ...extraPresent]);
    return dimsMode!.compute(values, present);
  }

  function siteMixRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label.startsWith("Site mix"));
  }

  it("says '1 × 94 lb sack' for a 2 × 2 ft wall", () => {
    const out = compute();
    expect(siteMixRow(out)?.detail).toContain("1 × 94 lb sack;");
    expect(out.lines.some((l) => l.includes("cement: 1 × 94 lb sack ("))).toBe(true);
  });

  it("says '2 × 94 lb sacks' for a 12 × 8 ft wall", () => {
    const out = compute({ length: 12, height: 8 });
    expect(siteMixRow(out)?.detail).toContain("2 × 94 lb sacks;");
    expect(out.lines.some((l) => l.includes("cement: 2 × 94 lb sacks ("))).toBe(true);
  });
});
