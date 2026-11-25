import { describe, expect, it } from "vitest";
import { stairConfig } from "./config";
import { convertLength } from "../../lib/units";

/**
 * Stair Calculator result presentation (Phase 16A): results respect
 * the selected unit system. The calculation stays canonical inches —
 * only the presentation converts, once, through the unit engine.
 * Imperial output is unchanged from before; metric output shows cm
 * (detail in m). Riser/tread counts and the stair angle are
 * unit-independent.
 */

const MODE = stairConfig.modes[0]!;

function compute(values: Record<string, number>, system?: "imperial" | "metric") {
  return MODE.compute(values, new Set(Object.keys(values)), system);
}

const DEFAULTS = { totalRise: 105, treadDepth: 10.5, maxRiser: 7.75 };

describe("stair config: imperial results (unchanged)", () => {
  it("formats the 105 in default case in inches and feet", () => {
    const out = compute(DEFAULTS, "imperial");
    expect(out.rows).toEqual([
      { label: "Risers", value: "14 risers", detail: "7.5 in each" },
      { label: "Treads", value: "13 treads", detail: "10.5 in deep" },
      { label: "Total run", value: "136.5 in", detail: "11.38 ft" },
      { label: "Stringer length", value: "172.21 in", detail: "14.35 ft" },
      { label: "Stair angle", value: "37.6°", detail: "From horizontal" },
    ]);
    expect(out.lines).toEqual([
      "Risers: 14 at 7.5 in each",
      "Treads: 13 at 10.5 in deep",
      "Total run: 136.5 in (11.38 ft)",
      "Stringer length: 172.21 in (14.35 ft)",
    ]);
    expect(out.workedLine).toBe(
      "105 in ÷ 7.75 in max riser = 14 risers at 7.5 in; 13 treads × 10.5 in = 136.5 in run.",
    );
    expect(out.warnings).toBeUndefined();
  });

  it("defaults to imperial when no system is passed (lookup-table path)", () => {
    const out = compute(DEFAULTS);
    expect(out.rows[2]).toEqual({
      label: "Total run",
      value: "136.5 in",
      detail: "11.38 ft",
    });
  });
});

describe("stair config: metric results", () => {
  it("formats the 105 in default case in centimetres and metres", () => {
    const out = compute(DEFAULTS, "metric");
    // Hand-verified conversions (1 in = 2.54 cm exactly):
    // riser 7.5 in = 19.05 cm; tread 10.5 in = 26.67 cm;
    // run 136.5 in = 346.71 cm (3.47 m);
    // stringer 172.21 in = 437.42 cm (4.37 m).
    expect(out.rows).toEqual([
      { label: "Risers", value: "14 risers", detail: "19.05 cm each" },
      { label: "Treads", value: "13 treads", detail: "26.67 cm deep" },
      { label: "Total run", value: "346.71 cm", detail: "3.47 m" },
      { label: "Stringer length", value: "437.42 cm", detail: "4.37 m" },
      { label: "Stair angle", value: "37.6°", detail: "From horizontal" },
    ]);
    expect(out.lines).toEqual([
      "Risers: 14 at 19.05 cm each",
      "Treads: 13 at 26.67 cm deep",
      "Total run: 346.71 cm (3.47 m)",
      "Stringer length: 437.42 cm (4.37 m)",
    ]);
    // Total rise 105 in = 266.7 cm; the 7.75 in cap is exactly
    // 19.685 cm, shown to 3 decimals (2 decimals would read 19.68).
    expect(out.workedLine).toBe(
      "266.7 cm ÷ 19.685 cm max riser = 14 risers at 19.05 cm; 13 treads × 26.67 cm = 346.71 cm run.",
    );
    expect(out.warnings).toBeUndefined();
  });

  it("keeps riser count, tread count, and angle unit-independent", () => {
    const imperial = compute(DEFAULTS, "imperial");
    const metric = compute(DEFAULTS, "metric");
    expect(metric.rows[0]?.value).toBe(imperial.rows[0]?.value);
    expect(metric.rows[1]?.value).toBe(imperial.rows[1]?.value);
    expect(metric.rows[4]).toEqual(imperial.rows[4]);
  });

  it("has no physical-value drift: metric display converts back to the imperial values", () => {
    const metric = compute(DEFAULTS, "metric");
    // Parse the displayed cm figures and convert back to inches:
    // each must match the canonical value within display rounding.
    const runCm = 346.71;
    const stringerCm = 437.42;
    const riserCm = 19.05;
    expect(convertLength(runCm, "cm", "in")).toBeCloseTo(136.5, 2);
    expect(convertLength(stringerCm, "cm", "in")).toBeCloseTo(172.21, 2);
    expect(convertLength(riserCm, "cm", "in")).toBeCloseTo(7.5, 2);
    expect(metric.rows[2]?.value).toBe("346.71 cm");
    expect(metric.rows[3]?.value).toBe("437.42 cm");
  });
});

describe("stair config: 151 in limit in both systems", () => {
  it("shows no warning at exactly 151 in, in either system", () => {
    expect(compute({ ...DEFAULTS, totalRise: 151 }, "imperial").warnings).toBeUndefined();
    expect(compute({ ...DEFAULTS, totalRise: 151 }, "metric").warnings).toBeUndefined();
  });

  it("shows the same warning over 151 in, in either system", () => {
    const imperial = compute({ ...DEFAULTS, totalRise: 160 }, "imperial");
    const metric = compute({ ...DEFAULTS, totalRise: 160 }, "metric");
    expect(imperial.warnings).toHaveLength(1);
    expect(metric.warnings).toEqual(imperial.warnings);
    expect(imperial.warnings?.[0]).toContain("151 in");
    // The numbers are still shown as a planning estimate.
    expect(metric.rows[0]?.value).toBe("21 risers");
    expect(metric.rows[2]?.value).toBe("533.4 cm");
  });

  it("shows no warning for the exact metric boundary 383.54 cm, in either system (QA-16A-01)", () => {
    // 383.54 cm converts to 151.00000000000003 in — conversion noise,
    // not a real excess over the 151 in limit.
    const totalRise = convertLength(383.54, "cm", "in");
    expect(compute({ ...DEFAULTS, totalRise }, "imperial").warnings).toBeUndefined();
    expect(compute({ ...DEFAULTS, totalRise }, "metric").warnings).toBeUndefined();
  });

  it("shows the warning for 383.5401 cm, in either system (QA-16A-01)", () => {
    // 383.5401 cm converts to 151.00004 in — genuinely above the limit.
    const totalRise = convertLength(383.5401, "cm", "in");
    const imperial = compute({ ...DEFAULTS, totalRise }, "imperial");
    const metric = compute({ ...DEFAULTS, totalRise }, "metric");
    expect(imperial.warnings).toHaveLength(1);
    expect(metric.warnings).toEqual(imperial.warnings);
    expect(imperial.warnings?.[0]).toContain("151 in");
  });
});
