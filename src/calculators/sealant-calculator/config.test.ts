import { describe, expect, it } from "vitest";
import { sealantConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep follow-up (Phase
 * 17B2 QA corrective round): a count of 1 reads "1 tube", a count of
 * 2 reads "2 tubes", in the result row, the shopping-list line, and
 * the worked line.
 *
 * Counts are hand-derived from the formula (volume = joint length ×
 * 12 × bead width × bead depth × 110% in³ ÷ 1.8047 in³/fl oz;
 * tubes = volume ÷ tube size, rounded up): a 10 ft joint at a
 * 0.25 × 0.25 in bead is 4.6 fl oz → 1 tube of 10.1 fl oz; a 25 ft
 * joint is 11.4 fl oz → 2 tubes.
 */
describe("sealantConfig singular/plural tubes", () => {
  const jointsMode = sealantConfig.modes.find((m) => m.id === "joints");
  if (!jointsMode) throw new Error("sealant joints mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      jointLength: 10,
      beadWidth: 0.25,
      beadDepth: 0.25,
      tubeVolume: 10.1,
      waste: 10,
      ...overrides,
    };
    return jointsMode!.compute(values, new Set(Object.keys(values)));
  }

  it("says '1 tube' for a 10 ft joint", () => {
    const out = compute();
    expect(out.rows.find((r) => r.label === "Tubes to buy")?.value).toBe("1 tube");
    expect(out.lines).toContain("Sealant (10.1 fl oz tubes): 1 tube (4.6 fl oz)");
    expect(out.workedLine).toBe("10 ft × 12 × 0.25 in × 0.25 in × 110% = 4.6 fl oz → 1 tube.");
  });

  it("says '2 tubes' for a 25 ft joint", () => {
    const out = compute({ jointLength: 25 });
    expect(out.rows.find((r) => r.label === "Tubes to buy")?.value).toBe("2 tubes");
    expect(out.lines).toContain("Sealant (10.1 fl oz tubes): 2 tubes (11.4 fl oz)");
    expect(out.workedLine).toBe("25 ft × 12 × 0.25 in × 0.25 in × 110% = 11.4 fl oz → 2 tubes.");
  });
});
