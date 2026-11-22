import { describe, expect, it } from "vitest";
import {
  calculateCeilingGrid,
  calculateCeilingTiles,
  tilesPerCartonForTileArea,
} from "./ceiling-tile";

describe("calculateCeilingTiles", () => {
  it("matches the FORMULAS.md worked example: 12 × 12 ft room, 2 × 2 ft tiles", () => {
    // 144 ft² × 1.10 ÷ 4 ft² = 39.6 -> 40 tiles; 40 ÷ 16 per carton -> 3 cartons.
    const r = calculateCeilingTiles({
      areaFt2: 144,
      tileAreaFt2: 4,
      tilesPerCarton: 16,
      wastePct: 10,
    });
    expect(r.tiles).toBe(40);
    expect(r.cartons).toBe(3);
  });

  it("counts 2 × 4 ft tiles and their cartons", () => {
    // 144 ft² × 1.10 ÷ 8 ft² = 19.8 -> 20 tiles; 20 ÷ 8 per carton -> 3 cartons.
    const r = calculateCeilingTiles({
      areaFt2: 144,
      tileAreaFt2: 8,
      tilesPerCarton: 8,
      wastePct: 10,
    });
    expect(r.tiles).toBe(20);
    expect(r.cartons).toBe(3);
  });

  it("derives the carton count from the tile size when none is given (CEI-1)", () => {
    expect(tilesPerCartonForTileArea(4)).toBe(16);
    expect(tilesPerCartonForTileArea(8)).toBe(8);
    // 2 × 4 ft tiles, 144 ft², 10% waste: 20 tiles. Divided by the
    // 2 × 2 ft carton count of 16 that would be 2 cartons (16 tiles) —
    // an under-buy. With the 2 × 4 ft count of 8 it is 3 cartons.
    const r = calculateCeilingTiles({
      areaFt2: 144,
      tileAreaFt2: 8,
      wastePct: 10,
    });
    expect(r.tiles).toBe(20);
    expect(r.cartons).toBe(3);
    const twoByTwo = calculateCeilingTiles({
      areaFt2: 144,
      tileAreaFt2: 4,
      wastePct: 10,
    });
    expect(twoByTwo.tiles).toBe(40);
    expect(twoByTwo.cartons).toBe(3);
  });

  it("still respects an explicitly entered carton count", () => {
    const r = calculateCeilingTiles({
      areaFt2: 144,
      tileAreaFt2: 8,
      tilesPerCarton: 16,
      wastePct: 10,
    });
    expect(r.cartons).toBe(2);
  });

  it("prices cartons only when a price is entered", () => {
    const r = calculateCeilingTiles({
      areaFt2: 144,
      tileAreaFt2: 4,
      tilesPerCarton: 16,
      wastePct: 10,
      pricePerCarton: 25,
    });
    expect(r.costUsd).toBe(75);
    const unpriced = calculateCeilingTiles({
      areaFt2: 144,
      tileAreaFt2: 4,
      tilesPerCarton: 16,
      wastePct: 10,
    });
    expect(unpriced.costUsd).toBeUndefined();
  });

  it("handles zero area", () => {
    const r = calculateCeilingTiles({
      areaFt2: 0,
      tileAreaFt2: 4,
      tilesPerCarton: 16,
      wastePct: 10,
    });
    expect(r.tiles).toBe(0);
    expect(r.cartons).toBe(0);
  });
});

describe("calculateCeilingGrid", () => {
  it("matches the published table for a 12 × 12 ft room, 2 × 2 ft tiles", () => {
    // Main lines at 4 and 8 ft: 2 lines × 12 ft -> 2 tees (12 ft).
    // 4 ft tees: 3 bays × 5 positions = 15. 2 ft tees: 3 lines × 6 = 18.
    // Wall angle: 48 ft perimeter -> 5 pieces of 10 ft. Hangers: 24 ft -> 6.
    const g = calculateCeilingGrid({ lengthFt: 12, widthFt: 12, tileAreaFt2: 4 });
    expect(g.mainLines).toBe(2);
    expect(g.mainTees).toBe(2);
    expect(g.crossTees4Ft).toBe(15);
    expect(g.crossTees2Ft).toBe(18);
    expect(g.wallAnglePieces).toBe(5);
    expect(g.hangers).toBe(6);
  });

  it("matches the published table for a 10 × 8 ft room, 2 × 2 ft tiles", () => {
    const g = calculateCeilingGrid({ lengthFt: 10, widthFt: 8, tileAreaFt2: 4 });
    expect(g.mainLines).toBe(1);
    expect(g.mainTees).toBe(1);
    expect(g.crossTees4Ft).toBe(8);
    expect(g.crossTees2Ft).toBe(10);
    expect(g.wallAnglePieces).toBe(4);
    expect(g.hangers).toBe(3);
  });

  it("needs no 2 ft cross tees for 2 × 4 ft tiles", () => {
    const g = calculateCeilingGrid({ lengthFt: 12, widthFt: 12, tileAreaFt2: 8 });
    expect(g.crossTees2Ft).toBe(0);
    expect(g.crossTees4Ft).toBe(15);
    expect(g.mainTees).toBe(2);
  });

  it("handles odd widths: 12 ft room, 9/10/11 ft wide, 2 × 2 ft tiles", () => {
    // Main lines sit 4 ft apart across the width, so 9, 10, and 11 ft
    // widths all have 2 interior main lines; the 2 ft cross tees step
    // up when the width passes 10 ft (the third 2 ft offset appears).
    for (const widthFt of [9, 10, 11]) {
      const g = calculateCeilingGrid({ lengthFt: 12, widthFt, tileAreaFt2: 4 });
      expect(g.mainLines).toBe(2);
      expect(g.mainTees).toBe(2);
      expect(g.crossTees4Ft).toBe(15);
      expect(g.wallAnglePieces).toBe(5);
      expect(g.hangers).toBe(6);
    }
    expect(calculateCeilingGrid({ lengthFt: 12, widthFt: 9, tileAreaFt2: 4 }).crossTees2Ft).toBe(
      12,
    );
    expect(calculateCeilingGrid({ lengthFt: 12, widthFt: 10, tileAreaFt2: 4 }).crossTees2Ft).toBe(
      12,
    );
    expect(calculateCeilingGrid({ lengthFt: 12, widthFt: 11, tileAreaFt2: 4 }).crossTees2Ft).toBe(
      18,
    );
  });

  it("lays out a 2 × 4 ft grid with no 2 ft cross tees", () => {
    // 10 × 8 ft room, 2 × 4 ft tiles: 1 main line, 1 main tee,
    // 8 four-foot tees, no two-foot tees, 4 wall-angle pieces, 3 hangers.
    const g = calculateCeilingGrid({ lengthFt: 10, widthFt: 8, tileAreaFt2: 8 });
    expect(g.mainLines).toBe(1);
    expect(g.mainTees).toBe(1);
    expect(g.crossTees4Ft).toBe(8);
    expect(g.crossTees2Ft).toBe(0);
    expect(g.wallAnglePieces).toBe(4);
    expect(g.hangers).toBe(3);
  });

  it("handles a narrow room with no interior main line", () => {
    const g = calculateCeilingGrid({ lengthFt: 10, widthFt: 3, tileAreaFt2: 4 });
    expect(g.mainLines).toBe(0);
    expect(g.mainTees).toBe(0);
    expect(g.hangers).toBe(0);
    expect(g.crossTees4Ft).toBe(4);
    expect(g.crossTees2Ft).toBe(5);
    expect(g.wallAnglePieces).toBe(3);
  });
});
