import { describe, expect, it } from "vitest";
import { ADS_ENABLED, ADSENSE_PUBLISHER_ID, AD_SLOTS } from "./ads";

/**
 * Guard for ADR-8 (ads disabled by default). If the owner ever approves
 * AdSense, this test must be updated deliberately as part of that change —
 * it must never be weakened silently to make a suite pass.
 */
describe("ads configuration (ADR-8)", () => {
  it("ads are disabled", () => {
    expect(ADS_ENABLED).toBe(false);
  });

  it("publisher ID is an obvious placeholder, not a real ID", () => {
    expect(ADSENSE_PUBLISHER_ID).toBe("ca-pub-XXXXXXXXXXXXXXXX");
    expect(ADSENSE_PUBLISHER_ID).not.toMatch(/\d/);
  });

  it("every slot ID is an obvious placeholder, not a real ID", () => {
    for (const slotId of Object.values(AD_SLOTS)) {
      expect(slotId).toBe("XXXXXXXXXX");
      expect(slotId).not.toMatch(/\d/);
    }
  });
});
