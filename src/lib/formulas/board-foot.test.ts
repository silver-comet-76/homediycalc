import { describe, expect, it } from "vitest";
import { calculateBoardFoot } from "./board-foot";

describe("calculateBoardFoot", () => {
  it("matches the FORMULAS.md worked example: ten 2 × 6 × 8 ft boards", () => {
    // One board: 2 × 6 × 8 / 12 = 8 board feet.
    // Ten boards: 80 board feet; with 5% waste: 84 board feet = 7 ft³.
    const r = calculateBoardFoot({
      thicknessIn: 2,
      widthIn: 6,
      lengthFt: 8,
      pieces: 10,
      wastePct: 5,
    });
    expect(r.boardFeetPerPiece).toBe(8);
    expect(r.boardFeetTotal).toBe(84);
    expect(r.volumeFt3).toBe(7);
  });

  it("counts one board foot for a 1 × 12 × 1 ft board", () => {
    const r = calculateBoardFoot({
      thicknessIn: 1,
      widthIn: 12,
      lengthFt: 1,
      pieces: 1,
      wastePct: 0,
    });
    expect(r.boardFeetPerPiece).toBe(1);
    expect(r.volumeFt3).toBeCloseTo(1 / 12, 4);
  });

  it("handles fractional board feet and piece counts", () => {
    const r = calculateBoardFoot({
      thicknessIn: 1,
      widthIn: 6.5,
      lengthFt: 8,
      pieces: 1,
      wastePct: 0,
    });
    // 1 × 6.5 × 8 / 12 = 4.333... board feet.
    expect(r.boardFeetPerPiece).toBeCloseTo(4.3333, 4);
  });

  it("prices board feet only when a price is entered", () => {
    const r = calculateBoardFoot({
      thicknessIn: 2,
      widthIn: 6,
      lengthFt: 8,
      pieces: 10,
      wastePct: 5,
      pricePerBoardFoot: 2.5,
    });
    expect(r.costUsd).toBe(210);
    const unpriced = calculateBoardFoot({
      thicknessIn: 2,
      widthIn: 6,
      lengthFt: 8,
      pieces: 10,
      wastePct: 5,
    });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero pieces", () => {
    const r = calculateBoardFoot({
      thicknessIn: 2,
      widthIn: 6,
      lengthFt: 8,
      pieces: 0,
      wastePct: 5,
    });
    expect(r.boardFeetTotal).toBe(0);
    expect(r.volumeFt3).toBe(0);
  });
});
