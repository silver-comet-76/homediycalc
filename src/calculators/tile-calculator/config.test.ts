import { describe, expect, it } from "vitest";
import { tileConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 box", a count of 2 reads
 * "2 boxes", in the result row and the worked line. The shopping-list
 * line is number-only after its label and stays that way. Tile counts
 * themselves are individual pieces and are out of scope for this sweep.
 *
 * Counts are hand-derived from the formula (effective area per tile
 * is (12.125 × 12.125) ÷ 144 = 1.0209 ft² with a ⅛ in joint; tiles =
 * area × 1.10 ÷ 1.0209, rounded up; boxes = tiles ÷ 10, rounded up):
 * 1 ft² needs 2 tiles, so 1 box; 10 ft² needs 11 tiles, so 2 boxes.
 */
describe("tileConfig singular/plural boxes", () => {
  const areaMode = tileConfig.modes.find((m) => m.id === "area");
  if (!areaMode) throw new Error("tile area mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      area: 1,
      tileLength: 12,
      tileWidth: 12,
      joint: 0.125,
      waste: 10,
      tilesPerBox: 10,
      ...overrides,
    };
    const present = new Set(Object.keys(values));
    return areaMode!.compute(values, present);
  }

  function boxRow(out: ReturnType<typeof compute>) {
    return out.rows.find((r) => r.label === "Boxes needed");
  }

  it("says '1 box' for a 1 ft² area", () => {
    const out = compute();
    expect(boxRow(out)?.value).toBe("1 box");
    expect(out.workedLine).toBe("1 ft² × 110% ÷ 1.0209 ft² per tile = 2 tiles → 1 box.");
    expect(out.lines).toContain("Boxes of tile (10 per box): 1");
  });

  it("says '2 boxes' for a 10 ft² area", () => {
    const out = compute({ area: 10 });
    expect(boxRow(out)?.value).toBe("2 boxes");
    expect(out.workedLine).toBe("10 ft² × 110% ÷ 1.0209 ft² per tile = 11 tiles → 2 boxes.");
    expect(out.lines).toContain("Boxes of tile (10 per box): 2");
  });
});
