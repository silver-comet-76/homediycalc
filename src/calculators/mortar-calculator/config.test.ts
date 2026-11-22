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
