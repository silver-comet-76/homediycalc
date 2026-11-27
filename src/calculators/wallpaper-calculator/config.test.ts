import { describe, expect, it } from "vitest";
import { wallpaperConfig } from "./config";

/**
 * Config-level tests for the singular/plural sweep (Phase 17B2 QA
 * corrective round): a count of 1 reads "1 strip" / "1 roll", a
 * count of 2 reads "2 strips" / "2 rolls", in every result row, both
 * shopping-list lines, and the worked line.
 *
 * Counts are hand-derived from the formula (US double roll: 20.5 in
 * × 33 ft; strips = wall length ÷ roll width, rounded up; strip
 * length = height + 18 in repeat + 4 in trim = 9.83 ft at 8 ft
 * walls; strips per roll = 33 ÷ 9.83, rounded down = 3; rolls =
 * ceil(ceil(strips × 1.10) ÷ strips per roll)): 1 ft of wall needs
 * 1 strip and 1 roll; 2 ft needs 2 strips and 1 roll; 4 ft needs
 * 3 strips and 2 rolls. A 15 ft wall makes 16.83 ft strips, so 1
 * strip per roll; a 10 ft wall makes 11.83 ft strips, so 2 per roll.
 * Wall length and height are passed in canonical feet; the repeat
 * in canonical inches.
 */
describe("wallpaperConfig singular/plural strips and rolls", () => {
  const lengthMode = wallpaperConfig.modes.find((m) => m.id === "length");
  if (!lengthMode) throw new Error("wallpaper length mode missing");

  function compute(overrides: Record<string, number> = {}) {
    const values = {
      wallLength: 1,
      height: 8,
      rollType: 0,
      repeat: 18,
      waste: 10,
      ...overrides,
    };
    const present = new Set(Object.keys(values));
    return lengthMode!.compute(values, present);
  }

  function row(out: ReturnType<typeof compute>, label: string) {
    return out.rows.find((r) => r.label === label);
  }

  it("says '1 strip' and '1 roll' for 1 ft of wall at 8 ft high", () => {
    const out = compute();
    expect(row(out, "Strips needed")?.value).toBe("1 strip");
    expect(row(out, "Strips per roll")?.value).toBe("3 strips");
    expect(row(out, "Rolls to buy")?.value).toBe("1 roll");
    expect(out.lines).toContain("Wallpaper (US double roll (20.5 in × 33 ft)): 1 roll");
    expect(out.lines).toContain("1 strip of 9.83 ft, 3 strips per roll");
    expect(out.workedLine).toBe("1 strip × 110% ÷ 3 strips per roll = 1 roll.");
  });

  it("says '2 strips' for 2 ft of wall, still '1 roll'", () => {
    const out = compute({ wallLength: 2 });
    expect(row(out, "Strips needed")?.value).toBe("2 strips");
    expect(row(out, "Rolls to buy")?.value).toBe("1 roll");
    expect(out.lines).toContain("2 strips of 9.83 ft, 3 strips per roll");
    expect(out.workedLine).toBe("2 strips × 110% ÷ 3 strips per roll = 1 roll.");
  });

  it("says '2 rolls' for 4 ft of wall", () => {
    const out = compute({ wallLength: 4 });
    expect(row(out, "Strips needed")?.value).toBe("3 strips");
    expect(row(out, "Rolls to buy")?.value).toBe("2 rolls");
    expect(out.lines).toContain("Wallpaper (US double roll (20.5 in × 33 ft)): 2 rolls");
    expect(out.workedLine).toBe("3 strips × 110% ÷ 3 strips per roll = 2 rolls.");
  });

  it("says '1 strip per roll' for a 15 ft wall (16.83 ft strips)", () => {
    const out = compute({ height: 15 });
    expect(row(out, "Strips per roll")?.value).toBe("1 strip");
    expect(row(out, "Rolls to buy")?.value).toBe("2 rolls");
    expect(out.lines).toContain("1 strip of 16.83 ft, 1 strip per roll");
    expect(out.workedLine).toBe("1 strip × 110% ÷ 1 strip per roll = 2 rolls.");
  });

  it("says '2 strips per roll' for a 10 ft wall (11.83 ft strips)", () => {
    const out = compute({ height: 10 });
    expect(row(out, "Strips per roll")?.value).toBe("2 strips");
    expect(row(out, "Rolls to buy")?.value).toBe("1 roll");
    expect(out.lines).toContain("1 strip of 11.83 ft, 2 strips per roll");
    expect(out.workedLine).toBe("1 strip × 110% ÷ 2 strips per roll = 1 roll.");
  });
});
