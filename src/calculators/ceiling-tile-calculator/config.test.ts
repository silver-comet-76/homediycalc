import { describe, expect, it } from "vitest";
import { ceilingTileConfig } from "./config";

/**
 * Config-level tests for CEI-1: the carton default must follow the
 * tile size. The room-mode defaults are a 12 × 12 ft room (144 ft²)
 * with 10% waste — 20 tiles of 2 × 4 ft, 40 tiles of 2 × 2 ft —
 * with the tiles-per-carton field left blank.
 */
describe("ceilingTileConfig carton defaults (CEI-1)", () => {
  const roomMode = ceilingTileConfig.modes.find((m) => m.id === "room");
  if (!roomMode) throw new Error("ceiling-tile room mode missing");

  function computeWithTileSize(tileSize: number, tilesPerCarton?: number) {
    const values: Record<string, number> = {
      length: 12,
      width: 12,
      tileSize,
      waste: 10,
    };
    if (tilesPerCarton !== undefined) values["tilesPerCarton"] = tilesPerCarton;
    const present = new Set(Object.keys(values));
    const out = roomMode?.compute(values, present);
    const row = out?.rows.find((r) => r.label === "Cartons to buy");
    return row?.value;
  }

  it("shows 3 cartons for 2 × 4 ft tiles with the default carton count", () => {
    // 20 tiles ÷ 8 per carton = 2.5 -> 3 cartons (not 2 cartons of 16).
    expect(computeWithTileSize(8)).toBe("3 cartons");
  });

  it("shows 3 cartons for 2 × 2 ft tiles with the default carton count", () => {
    // 40 tiles ÷ 16 per carton = 2.5 -> 3 cartons.
    expect(computeWithTileSize(4)).toBe("3 cartons");
  });

  it("still respects an explicitly entered carton count", () => {
    // 20 tiles ÷ 16 per carton = 1.25 -> 2 cartons, when the user
    // says their 2 × 4 ft tiles really do come 16 to a carton.
    expect(computeWithTileSize(8, 16)).toBe("2 cartons");
  });

  it("leaves the tiles-per-carton field blank by default so the size-derived count applies", () => {
    for (const mode of ceilingTileConfig.modes) {
      const field = mode.fields.find((f) => f.id === "tilesPerCarton");
      expect(field?.optional).toBe(true);
      expect(field?.defaultImp).toBe("");
    }
  });
});
