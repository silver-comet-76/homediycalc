import { describe, expect, it } from "vitest";
import { costShoppingListLine, type CalcOutput } from "./CalculatorConfig";

/**
 * The shopping-list cost line is the one place a copied list can
 * present a figure as a total, so the partial-cost wording is tested
 * here directly (Phase 8, Issue #3).
 */
describe("costShoppingListLine", () => {
  function output(overrides: Partial<CalcOutput> = {}): CalcOutput {
    return { rows: [], lines: ["Bricks: 482"], ...overrides };
  }

  it("returns undefined when no cost is shown", () => {
    expect(costShoppingListLine(output())).toBeUndefined();
  });

  it("labels a full cost as the estimated total", () => {
    expect(costShoppingListLine(output({ costUsd: 432 }))).toBe(
      "Estimated total: $432.00 (only if the prices you entered hold)",
    );
  });

  it("labels a partial cost with what it excludes, never as a total", () => {
    const line = costShoppingListLine(
      output({
        costUsd: 241,
        costLabel: "Partial cost (bricks only)",
        costDetail: "Excludes mortar — no bag count for this brick size or joint",
      }),
    );
    expect(line).toBe(
      "Partial cost (bricks only): $241.00 (Excludes mortar — no bag count for this brick size or joint)",
    );
    expect(line).not.toContain("total");
  });

  it("keeps the label even without a detail", () => {
    expect(
      costShoppingListLine(output({ costUsd: 100, costLabel: "Partial cost (bricks only)" })),
    ).toBe("Partial cost (bricks only): $100.00");
  });
});
