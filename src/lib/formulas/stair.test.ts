import { describe, expect, it } from "vitest";
import { calculateStair, MAX_RISER_IN, MAX_SINGLE_FLIGHT_RISE_IN, MIN_TREAD_IN } from "./stair";

describe("calculateStair", () => {
  it("calculates a standard staircase (105 in rise, 10.5 in tread)", () => {
    const r = calculateStair({ totalRiseIn: 105, treadDepthIn: 10.5 });
    // 105 / 7.75 = 13.55, so 14 risers; 105 / 14 = 7.5 in each.
    expect(r.riserCount).toBe(14);
    expect(r.riserHeightIn).toBeCloseTo(7.5, 2);
    // One fewer tread than risers: 13 treads x 10.5 in = 136.5 in of run.
    expect(r.treadCount).toBe(13);
    expect(r.totalRunIn).toBeCloseTo(136.5, 2);
    // Stringer is the hypotenuse: sqrt(105^2 + 136.5^2) = sqrt(29642.25) = 172.21 in.
    expect(r.stringerLengthIn).toBeCloseTo(172.21, 2);
    // Angle: atan(105 / 136.5) = 37.57 degrees.
    expect(r.stairAngleDeg).toBeCloseTo(37.57, 2);
  });

  it("uses the IRC defaults when tread depth and max riser are omitted", () => {
    const r = calculateStair({ totalRiseIn: 105 });
    expect(r.riserCount).toBe(14);
    expect(r.riserHeightIn).toBeCloseTo(7.5, 2);
    expect(r.totalRunIn).toBeCloseTo(136.5, 2);
  });

  it("handles a rise exactly divisible by the max riser (93 in / 7.75 in)", () => {
    const r = calculateStair({ totalRiseIn: 93, treadDepthIn: 10.5 });
    // 93 / 7.75 = 12 exactly, so 12 risers at the full 7.75 in each.
    expect(r.riserCount).toBe(12);
    expect(r.riserHeightIn).toBeCloseTo(7.75, 2);
    // 11 treads x 10.5 in = 115.5 in of run.
    expect(r.treadCount).toBe(11);
    expect(r.totalRunIn).toBeCloseTo(115.5, 2);
    // Stringer: sqrt(93^2 + 115.5^2) = sqrt(21989.25) = 148.29 in.
    expect(r.stringerLengthIn).toBeCloseTo(148.29, 2);
    // Angle: atan(93 / 115.5) = 38.84 degrees.
    expect(r.stairAngleDeg).toBeCloseTo(38.84, 2);
  });

  it("calculates a second standard staircase (96 in rise, 11 in tread)", () => {
    const r = calculateStair({ totalRiseIn: 96, treadDepthIn: 11 });
    // 96 / 7.75 = 12.39, so 13 risers; 96 / 13 = 7.38 in each.
    expect(r.riserCount).toBe(13);
    expect(r.riserHeightIn).toBeCloseTo(7.38, 2);
    // 12 treads x 11 in = 132 in of run (11 ft).
    expect(r.treadCount).toBe(12);
    expect(r.totalRunIn).toBeCloseTo(132, 2);
    // Stringer: sqrt(96^2 + 132^2) = sqrt(26640) = 163.22 in.
    expect(r.stringerLengthIn).toBeCloseTo(163.22, 2);
    // Angle: atan(96 / 132) = 36.03 degrees.
    expect(r.stairAngleDeg).toBeCloseTo(36.03, 2);
  });

  it("rejects a tread depth below the 10 in IRC minimum", () => {
    expect(() => calculateStair({ totalRiseIn: 105, treadDepthIn: 9.5 })).toThrow();
    expect(() => calculateStair({ totalRiseIn: 105, treadDepthIn: 9.5 })).toThrow(/at least 10 in/);
  });

  it("accepts a tread depth of exactly 10 in", () => {
    const r = calculateStair({ totalRiseIn: 105, treadDepthIn: 10 });
    expect(r.treadCount).toBe(13);
    expect(r.totalRunIn).toBeCloseTo(130, 2);
  });

  it("rejects a maximum riser height above the 7.75 in IRC maximum (8 in)", () => {
    expect(() => calculateStair({ totalRiseIn: 105, maxRiserIn: 8 })).toThrow();
    expect(() => calculateStair({ totalRiseIn: 105, maxRiserIn: 8 })).toThrow(/7.75/);
  });

  it("rejects a maximum riser height above the 7.75 in IRC maximum (10 in)", () => {
    expect(() => calculateStair({ totalRiseIn: 105, maxRiserIn: 10 })).toThrow();
    expect(() => calculateStair({ totalRiseIn: 105, maxRiserIn: 10 })).toThrow(/7.75/);
  });

  it("accepts a stricter maximum riser height below the IRC maximum (7 in)", () => {
    const r = calculateStair({ totalRiseIn: 105, maxRiserIn: 7 });
    // 105 / 7 = 15 exactly, so 15 risers at the full 7 in each.
    expect(r.riserCount).toBe(15);
    expect(r.riserHeightIn).toBeCloseTo(7, 2);
  });

  it("accepts a maximum riser height of exactly 7.75 in", () => {
    const r = calculateStair({ totalRiseIn: 105, maxRiserIn: 7.75 });
    expect(r.riserCount).toBe(14);
    expect(r.riserHeightIn).toBeCloseTo(7.5, 2);
  });

  it("reports the 151 in single-flight limit without throwing", () => {
    // 151 in is the limit itself (12 ft 7 in, IRC R311.7.3) — allowed.
    expect(calculateStair({ totalRiseIn: 151 }).exceedsSingleFlightLimit).toBe(false);
    // 152 in exceeds it, but the numbers are still returned as a
    // straight-flight planning estimate.
    const over = calculateStair({ totalRiseIn: 152 });
    expect(over.exceedsSingleFlightLimit).toBe(true);
    expect(over.riserCount).toBe(20);
    const tall = calculateStair({ totalRiseIn: 160 });
    expect(tall.exceedsSingleFlightLimit).toBe(true);
    expect(tall.riserCount).toBe(21);
  });

  it("rejects a total rise of zero or less", () => {
    expect(() => calculateStair({ totalRiseIn: 0 })).toThrow();
    expect(() => calculateStair({ totalRiseIn: -48 })).toThrow();
  });

  it("exports the IRC limits", () => {
    expect(MAX_RISER_IN).toBe(7.75);
    expect(MIN_TREAD_IN).toBe(10);
    expect(MAX_SINGLE_FLIGHT_RISE_IN).toBe(151);
  });
});
