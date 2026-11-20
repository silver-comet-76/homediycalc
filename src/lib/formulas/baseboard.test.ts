import { describe, expect, it } from "vitest";
import { calculateBaseboard, roomNetLengthFt } from "./baseboard";

describe("calculateBaseboard", () => {
  it("matches the FORMULAS.md worked example: 12 × 12 ft room, 1 door, 8 ft pieces", () => {
    // Perimeter 48 ft − 3 ft door = 45 ft net; with 10% waste 49.5 ft.
    // 49.5 ÷ 8 = 6.19 -> 7 pieces (56 ft purchased).
    const net = roomNetLengthFt(12, 12, 1, 3);
    expect(net).toBe(45);
    const r = calculateBaseboard({ netLengthFt: net, pieceLengthFt: 8, wastePct: 10 });
    expect(r.adjustedFt).toBeCloseTo(49.5, 2);
    expect(r.pieces).toBe(7);
    expect(r.purchasedFt).toBe(56);
  });

  it("needs fewer, longer pieces in 12 ft stock", () => {
    // 49.5 ÷ 12 = 4.13 -> 5 pieces (60 ft purchased).
    const r = calculateBaseboard({ netLengthFt: 45, pieceLengthFt: 12, wastePct: 10 });
    expect(r.pieces).toBe(5);
    expect(r.purchasedFt).toBe(60);
  });

  it("needs more pieces with a 15% allowance for a complex room", () => {
    // 45 × 1.15 = 51.75 ft; 51.75 ÷ 8 = 6.47 -> 7 pieces.
    const r = calculateBaseboard({ netLengthFt: 45, pieceLengthFt: 8, wastePct: 15 });
    expect(r.adjustedFt).toBeCloseTo(51.75, 2);
    expect(r.pieces).toBe(7);
  });

  it("prices purchased feet only when a price is entered", () => {
    const r = calculateBaseboard({
      netLengthFt: 45,
      pieceLengthFt: 8,
      wastePct: 10,
      pricePerFt: 1.5,
    });
    expect(r.costUsd).toBe(84);
    const unpriced = calculateBaseboard({
      netLengthFt: 45,
      pieceLengthFt: 8,
      wastePct: 10,
    });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero length", () => {
    const r = calculateBaseboard({ netLengthFt: 0, pieceLengthFt: 8, wastePct: 10 });
    expect(r.adjustedFt).toBe(0);
    expect(r.pieces).toBe(0);
    expect(r.purchasedFt).toBe(0);
  });
});
