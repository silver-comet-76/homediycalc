import { describe, expect, it } from "vitest";
import { concreteConfig } from "./config";
import { validateField } from "../../lib/validation";

/**
 * The Concrete Calculator's length, width, and depth fields carry no
 * explicit `min`, so the shared validation in GenericCalculator applies
 * its default minimum of 0 exclusively — a zero dimension is rejected
 * with "must be greater than 0" instead of producing a zero result.
 * This test pins that behavior at the config level, mirroring the rule
 * GenericCalculator builds for each field.
 */
describe("concreteConfig zero-input rejection", () => {
  it("rejects zero length, width, and depth", () => {
    const mode = concreteConfig.modes.find((m) => m.id === "pour");
    expect(mode).toBeDefined();
    for (const id of ["length", "width", "depth"]) {
      const field = mode?.fields.find((f) => f.id === id);
      expect(field).toBeDefined();
      expect(field?.min).toBeUndefined();
      const result = validateField("0", {
        label: field?.label ?? id,
        min: field?.min ?? 0,
        exclusiveMin:
          field?.min === undefined &&
          !(field?.kind === "percent" || field?.kind === "price" || field?.kind === "select"),
      });
      expect(result.error).toBe(`${field?.label} must be greater than 0.`);
    }
  });

  it("still accepts positive dimensions", () => {
    const mode = concreteConfig.modes.find((m) => m.id === "pour");
    const field = mode?.fields.find((f) => f.id === "length");
    const result = validateField("10", {
      label: field?.label ?? "Length",
      min: field?.min ?? 0,
      exclusiveMin: field?.min === undefined,
    });
    expect(result.error).toBeUndefined();
    expect(result.value).toBe(10);
  });
});
