import { describe, expect, it } from "vitest";
import { parseNumber, validateField } from "./validation";

/**
 * Shared input validation (QA-16A-05 second corrective round):
 * targeted unit coverage of the validation categories the shared
 * GenericCalculator island relies on — including the non-numeric
 * branch, which a real type=number input can never produce through
 * the UI (the browser sanitizes it to empty), so it is covered here
 * rather than in Playwright.
 */
describe("parseNumber", () => {
  it("returns undefined for empty and non-numeric input", () => {
    expect(parseNumber("")).toBeUndefined();
    expect(parseNumber("   ")).toBeUndefined();
    expect(parseNumber("abc")).toBeUndefined();
    expect(parseNumber("12a")).toBeUndefined();
  });

  it("parses plain and decimal numbers", () => {
    expect(parseNumber("12")).toBe(12);
    expect(parseNumber("7.75001")).toBe(7.75001);
    expect(parseNumber("  3.5  ")).toBe(3.5);
  });
});

describe("validateField", () => {
  it("rejects non-numeric input with its own message", () => {
    const result = validateField("abc", { label: "Room length" });
    expect(result.error).toBe("Room length must be a number.");
    expect(result.present).toBe(true);
  });

  it("requires a value for a required field and allows empty for an optional one", () => {
    expect(validateField("", { label: "Room length" }).error).toBe("Room length is required.");
    const optional = validateField("", { label: "Price", optional: true });
    expect(optional.error).toBeUndefined();
    expect(optional.present).toBe(false);
  });

  it("enforces an exclusive minimum (must be greater than 0)", () => {
    const rule = { label: "Room length", min: 0, exclusiveMin: true };
    expect(validateField("0", rule).error).toBe("Room length must be greater than 0.");
    expect(validateField("-5", rule).error).toBe("Room length must be greater than 0.");
    expect(validateField("0.5", rule).error).toBeUndefined();
  });

  it("enforces inclusive minimum and maximum bounds", () => {
    const bounded = { label: "Coats", min: 1, max: 5 };
    expect(validateField("0", bounded).error).toBe("Coats must be at least 1.");
    expect(validateField("6", bounded).error).toBe("Coats must be 5 or less.");
    expect(validateField("1", bounded).error).toBeUndefined();
    expect(validateField("5", bounded).error).toBeUndefined();
  });

  it("rejects non-whole numbers for integer fields", () => {
    const result = validateField("1.5", { label: "Doors", integer: true });
    expect(result.error).toBe("Doors must be a whole number.");
  });

  it("accepts a value exactly at an inclusive bound", () => {
    expect(
      validateField("7.75", { label: "Maximum riser height", max: 7.75 }).error,
    ).toBeUndefined();
    expect(validateField("10", { label: "Tread depth", min: 10 }).error).toBeUndefined();
  });
});
