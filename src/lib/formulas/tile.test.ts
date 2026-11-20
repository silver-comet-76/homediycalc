import { describe, expect, it } from "vitest";
import { calculateTile } from "./tile";

describe("calculateTile", () => {
  it("matches the FORMULAS.md worked example: 100 ft², 12 × 12 in tiles, 10% waste", () => {
    const r = calculateTile({
      areaFt2: 100, tileLengthIn: 12, tileWidthIn: 12, jointIn: 0,
      wastePct: 10, tilesPerBox: 10,
    });
    expect(r.tileAreaFt2).toBe(1);
    expect(r.tilesNeeded).toBe(110);
    expect(r.boxesNeeded).toBe(11);
  });

  it("counts the grout-line allowance in each tile's footprint", () => {
    const r = calculateTile({
      areaFt2: 100, tileLengthIn: 12, tileWidthIn: 12, jointIn: 0.125,
      wastePct: 10, tilesPerBox: 10,
    });
    // Effective tile area = 12.125 × 12.125 in = 1.0209 ft²; 110 / 1.0209 = 107.75 -> 108.
    expect(r.effectiveTileAreaFt2).toBeCloseTo(1.0209, 4);
    expect(r.tilesNeeded).toBe(108);
    expect(r.boxesNeeded).toBe(11);
  });

  it("rounds boxes up, never down", () => {
    const r = calculateTile({
      areaFt2: 101, tileLengthIn: 12, tileWidthIn: 12, jointIn: 0,
      wastePct: 0, tilesPerBox: 10,
    });
    expect(r.tilesNeeded).toBe(101);
    expect(r.boxesNeeded).toBe(11);
  });

  it("handles rectangular tiles and per-tile pricing", () => {
    const r = calculateTile({
      areaFt2: 50, tileLengthIn: 24, tileWidthIn: 12, jointIn: 0,
      wastePct: 10, tilesPerBox: 6, pricePerTile: 2,
    });
    // Tile area 2 ft²; 50 × 1.10 / 2 = 27.5 -> 28 tiles.
    expect(r.tilesNeeded).toBe(28);
    expect(r.boxesNeeded).toBe(5);
    expect(r.costUsd).toBe(56);
    const boxPriced = calculateTile({
      areaFt2: 50, tileLengthIn: 24, tileWidthIn: 12, jointIn: 0,
      wastePct: 10, tilesPerBox: 6, pricePerBox: 25,
    });
    expect(boxPriced.costUsd).toBe(125);
  });

  it("handles zero area", () => {
    const r = calculateTile({
      areaFt2: 0, tileLengthIn: 12, tileWidthIn: 12, jointIn: 0,
      wastePct: 10, tilesPerBox: 10,
    });
    expect(r.tilesNeeded).toBe(0);
    expect(r.boxesNeeded).toBe(0);
  });
});
