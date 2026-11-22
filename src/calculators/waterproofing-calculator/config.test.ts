import { describe, expect, it } from "vitest";
import { validateField } from "../../lib/validation";
import { waterproofingConfig } from "./config";

/**
 * Config-level tests for WTP-1: two coats is a requirement, not a
 * choice — a 1-coat entry must be rejected with an inline error and
 * no result. The shared island validates each field against its
 * min, so the rejection is enforced by the coats field's minimum.
 */
describe("waterproofingConfig coats minimum (WTP-1)", () => {
  it("sets the coats field minimum to 2 in every liquid mode", () => {
    const liquidModes = waterproofingConfig.modes.filter((m) => m.id.startsWith("liquid"));
    expect(liquidModes.length).toBeGreaterThan(0);
    for (const mode of liquidModes) {
      const coats = mode.fields.find((f) => f.id === "coats");
      expect(coats).toBeDefined();
      expect(coats?.min).toBe(2);
      expect(coats?.defaultImp).toBe("2");
    }
  });

  it("rejects a 1-coat entry under the field's validation rule", () => {
    const rejected = validateField("1", {
      label: "Coats",
      min: 2,
      integer: true,
    });
    expect(rejected.error).toBe("Coats must be at least 2.");
    const accepted = validateField("2", {
      label: "Coats",
      min: 2,
      integer: true,
    });
    expect(accepted.error).toBeUndefined();
    expect(accepted.value).toBe(2);
  });
});
