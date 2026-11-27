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

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 bag", a count of 2 reads
 * "2 bags", in the mortar-bag row, its detail, and the worked line.
 *
 * Counts are hand-derived from the formula (6.86 bricks/ft² for
 * modular brick at a ⅜ in joint; bags = the larger of bricks to buy
 * ÷ 37 and installed bricks × 1.15 ÷ 37, rounded up): a 2 × 2 ft
 * wall needs 29 bricks and 1 bag; a 3 × 2 ft wall needs 44 bricks
 * and 2 bags.
 */
describe("brickConfig singular/plural mortar bags", () => {
  const wallMode = brickConfig.modes.find((m) => m.id === "wall");
  if (!wallMode) throw new Error("brick wall mode missing");

  function compute(overrides: Record<string, number> = {}, extraPresent: string[] = []) {
    const values = {
      length: 2,
      height: 2,
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

  it("says '1 bag' for a 2 × 2 ft wall", () => {
    const out = compute();
    expect(bagRow(out)?.value).toBe("1 bag");
    expect(bagRow(out)?.detail).toBe(
      "QUIKRETE 37-brick maximum, derated by 15% waste — covers 29 bricks (1 bag) and the waste-adjusted volume",
    );
    expect(out.workedLine).toBe(
      "4 ft² × 6.86 bricks/ft² × 105% = 29 bricks; mortar 0.26 ft³ → 1 bag.",
    );
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 1");
  });

  it("says '2 bags' for a 3 × 2 ft wall", () => {
    const out = compute({ length: 3 });
    expect(bagRow(out)?.value).toBe("2 bags");
    expect(bagRow(out)?.detail).toBe(
      "QUIKRETE 37-brick maximum, derated by 15% waste — covers 44 bricks (2 bags) and the waste-adjusted volume",
    );
    expect(out.workedLine).toBe(
      "6 ft² × 6.86 bricks/ft² × 105% = 44 bricks; mortar 0.39 ft³ → 2 bags.",
    );
    expect(out.lines).toContain("Mortar mix, 80 lb bags: 2");
  });
});

/**
 * Config-level tests for the singular/plural sweep follow-up (Phase
 * 17B2 QA corrective round): the pallet count reads "1 pallet" at
 * count 1 and "2 pallets" at count 2.
 *
 * Counts are hand-derived from the formula (pallets = bricks to buy
 * ÷ bricks per pallet, rounded up): a 2 × 2 ft wall needs 29 bricks,
 * so a 500-brick pallet gives 1 pallet and a 20-brick pallet gives
 * 2 pallets.
 */
describe("brickConfig singular/plural pallets", () => {
  const wallMode = brickConfig.modes.find((m) => m.id === "wall");
  if (!wallMode) throw new Error("brick wall mode missing");

  function compute(overrides: Record<string, number> = {}, extraPresent: string[] = []) {
    const values = {
      length: 2,
      height: 2,
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

  function palletRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Pallets");
  }

  it("says '1 pallet' for a 2 × 2 ft wall with 500 bricks per pallet", () => {
    const out = compute({ palletSize: 500 });
    expect(palletRow(out)?.value).toBe("1 pallet");
    expect(palletRow(out)?.detail).toBe("500 bricks per pallet");
  });

  it("says '2 pallets' for a 2 × 2 ft wall with 20 bricks per pallet", () => {
    const out = compute({ palletSize: 20 });
    expect(palletRow(out)?.value).toBe("2 pallets");
    expect(palletRow(out)?.detail).toBe("20 bricks per pallet");
  });
});
