import { describe, expect, it } from "vitest";
import { calculateCeilingGrid, calculateCeilingTiles } from "./ceiling-tile";

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
