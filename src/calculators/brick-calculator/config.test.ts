import { describe, expect, it } from "vitest";
import { brickConfig } from "./config";
import { convertLength } from "../../lib/units";

/**
 * Config-level tests for ADR-12 (PR #2 second re-review): the bag
 * row, the shopping-list bag line, and the bag cost are suppressed
 * when the manufacturer rating does not apply (wider joint or
 * non-modular brick), and a verified user-entered yield brings the
 * count back. The standard wall still shows 18 bags.
 */
describe("brickConfig bag suppression (ADR-12)", () => {
  const wallMode = brickConfig.modes.find((m) => m.id === "wall");
  if (!wallMode) throw new Error("brick wall mode missing");

  function compute(overrides: Record<string, number> = {}, extraPresent: string[] = []) {
    const values = {
      length: 10,
      height: 8,
      openings: 0,
      brickLength: 7.625,
      brickHeight: 2.25,
      brickDepth: 3.625,
      joint: 0.375,
      waste: 5,
      mortarWaste: 15,
      bricksPerBag: 37,
      ...overrides,
    };
    const present = new Set([...Object.keys(values), ...extraPresent]);
    return wallMode!.compute(values, present);
  }

  function bagRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Mortar bags (80 lb)");
  }

  it("shows 18 bags for the standard wall", () => {
    const out = compute();
    expect(bagRow(out)?.value).toBe("18 bags");
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 18");
    expect(out.note).toBeUndefined();
  });

  it("suppresses the bag row, bag line, and note-explains it for a ¾ in joint", () => {
    const out = compute({ joint: 0.75 });
    expect(bagRow(out)).toBeUndefined();
    expect(out.lines).not.toContain("Mortar mix, 80 lb bags: 15");
    expect(out.lines).toEqual(["Bricks: 482"]);
    expect(out.note).toContain("verified yield");
    expect(out.workedLine).toContain("no bag count");
  });

  it("shows 30 bags for a ¾ in joint with a verified yield of 0.3 ft³ per bag", () => {
    const out = compute({ joint: 0.75, bagYieldFt3: 0.3 }, ["bagYieldFt3"]);
    expect(bagRow(out)?.value).toBe("30 bags");
    expect(bagRow(out)?.detail).toContain("0.3 ft³ per bag");
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 30");
    expect(out.note).toBeUndefined();
  });

  it("suppresses bags for a non-modular brick depth", () => {
    const out = compute({ brickDepth: 4.5 });
    expect(bagRow(out)).toBeUndefined();
    expect(out.note).toContain("verified yield");
  });

  it("matches metric inputs to the same outcomes", () => {
    // 19.05 mm = ¾ in joint: suppressed, like the imperial wide joint.
    const wide = compute({ joint: convertLength(19.05, "mm", "in") });
    expect(bagRow(wide)).toBeUndefined();
    // 9.5 mm joint with 194 × 57 × 92 mm brick: standard, 18 bags.
    const metric = compute({
      brickLength: convertLength(194, "mm", "in"),
      brickHeight: convertLength(57, "mm", "in"),
      brickDepth: convertLength(92, "mm", "in"),
      joint: convertLength(9.5, "mm", "in"),
    });
    expect(bagRow(metric)?.value).toBe("18 bags");
  });

  it("keeps the bag row for a narrower ¼ in joint", () => {
    const out = compute({ joint: 0.25 });
    expect(bagRow(out)?.value).toBe("19 bags");
  });

  // Partial cost (Phase 8, Issue #3): the bag count is unknown for a
  // wide joint, so a mortar price alone suppresses the cost (never $0)
  // and a brick price is shown labeled partial, excluding mortar.
  it("suppresses the cost when only a mortar price is entered and the bag count is unknown", () => {
    const out = compute({ joint: 0.75, pricePerMortarBag: 8 });
    expect(out.costUsd).toBeUndefined();
    expect(out.costLabel).toBeUndefined();
  });

  it("labels a bricks-only figure partial and excludes mortar for a ¾ in joint", () => {
    const out = compute({ joint: 0.75, pricePerBrick: 0.5 });
    expect(out.costUsd).toBe(482 * 0.5); // 241
    expect(out.costLabel).toBe("Partial cost (bricks only)");
    expect(out.costDetail).toContain("Excludes mortar");
    const both = compute({ joint: 0.75, pricePerBrick: 0.5, pricePerMortarBag: 8 });
    expect(both.costUsd).toBe(482 * 0.5);
    expect(both.costLabel).toBe("Partial cost (bricks only)");
  });

  it("does not label the cost partial when the bag count is known", () => {
    const out = compute({ pricePerBrick: 0.5, pricePerMortarBag: 8 });
    expect(out.costUsd).toBe(576 * 0.5 + 18 * 8);
    expect(out.costLabel).toBeUndefined();
    expect(out.costDetail).toBeUndefined();
  });
});
