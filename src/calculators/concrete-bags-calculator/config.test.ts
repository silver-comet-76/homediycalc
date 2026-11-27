import { describe, expect, it } from "vitest";
import { concreteBagsConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 bag", a count of 2 reads
 * "2 bags", in each bag-size row and in the worked line.
 *
 * Counts are hand-derived from the formula (bags = adjusted volume
 * ÷ yield per bag, rounded up; yields 0.30 / 0.45 / 0.60 ft³ for
 * 40 / 60 / 80 lb bags, 10% waste): 0.25 ft³ is 0.275 ft³ adjusted,
 * so 1 bag of every size; 0.5 ft³ is 0.55 ft³ adjusted, so 2 bags
 * of 40 lb, 2 of 60 lb, and 1 of 80 lb; 1 ft³ is 1.1 ft³ adjusted,
 * so 2 bags of 80 lb. Volume is passed in canonical cubic feet.
 *
 * The "Cheapest priced option" row is different: cheapestSize is
 * the bag SIZE ("80 lb"), not a count, so its value is "80 lb bags"
 * — the size name, not "1 bag". Both cheapest sizes are pinned so
 * the row can never render "80 lb lb bags".
 */
describe("concreteBagsConfig singular/plural bags", () => {
  const volumeMode = concreteBagsConfig.modes.find((m) => m.id === "volume");
  if (!volumeMode) throw new Error("concrete-bags volume mode missing");

  function compute(overrides: Record<string, number> = {}, extraPresent: string[] = []) {
    const values = { volume: 0.25, waste: 10, ...overrides };
    const present = new Set([...Object.keys(values), ...extraPresent]);
    return volumeMode!.compute(values, present);
  }

  function row(out: ReturnType<typeof compute>, label: string) {
    return out.rows.find((r) => r.label === label);
  }

  it("says '1 bag' for all three sizes at 0.25 ft³", () => {
    const out = compute();
    expect(row(out, "40 lb bags")?.value).toBe("1 bag");
    expect(row(out, "60 lb bags")?.value).toBe("1 bag");
    expect(row(out, "80 lb bags")?.value).toBe("1 bag");
    expect(out.workedLine).toContain("1 × 80 lb bag (0.60 ft³ each), or 1 × 60 lb, or 1 × 40 lb.");
    expect(out.lines).toContain("Concrete mix, 80 lb bags: 1");
  });

  it("says '2 bags' for 40 and 60 lb and '1 bag' for 80 lb at 0.5 ft³", () => {
    const out = compute({ volume: 0.5 });
    expect(row(out, "40 lb bags")?.value).toBe("2 bags");
    expect(row(out, "60 lb bags")?.value).toBe("2 bags");
    expect(row(out, "80 lb bags")?.value).toBe("1 bag");
    expect(out.workedLine).toContain("1 × 80 lb bag (0.60 ft³ each), or 2 × 60 lb, or 2 × 40 lb.");
  });

  it("says '2 bags' for 80 lb at 1 ft³, with a plural worked line", () => {
    const out = compute({ volume: 1 });
    expect(row(out, "80 lb bags")?.value).toBe("2 bags");
    expect(out.workedLine).toContain("2 × 80 lb bags (0.60 ft³ each), or 3 × 60 lb, or 4 × 40 lb.");
  });

  it("names the cheapest size, not a count: '80 lb bags'", () => {
    // 0.5 ft³: 2 × $6 (40 lb) = $12, 2 × $5 (60 lb) = $10, 1 × $4 (80 lb) = $4.
    const out = compute({ volume: 0.5, pricePerBag40: 6, pricePerBag60: 5, pricePerBag80: 4 }, [
      "pricePerBag40",
      "pricePerBag60",
      "pricePerBag80",
    ]);
    expect(row(out, "Cheapest priced option")?.value).toBe("80 lb bags");
    expect(row(out, "Cheapest priced option")?.value).not.toContain("lb lb");
  });

  it("names the cheapest size when the 40 lb bag wins: '40 lb bags'", () => {
    // 0.5 ft³: 2 × $1 (40 lb) = $2, 2 × $5 (60 lb) = $10, 1 × $4 (80 lb) = $4.
    const out = compute({ volume: 0.5, pricePerBag40: 1, pricePerBag60: 5, pricePerBag80: 4 }, [
      "pricePerBag40",
      "pricePerBag60",
      "pricePerBag80",
    ]);
    expect(row(out, "Cheapest priced option")?.value).toBe("40 lb bags");
  });
});
