import { describe, expect, it } from "vitest";
import { paverConfig } from "./config";

/**
 * Config-level tests for PVR-2: the dimensions mode must pass the
 * patio length and width through so the base and bedding sand are
 * computed on the extended footprint (17 × 13 = 221 ft² for a
 * 16 × 12 ft patio), not the paver area.
 */
describe("paverConfig extended footprint (PVR-2)", () => {
  const dimensionsMode = paverConfig.modes.find((m) => m.id === "dimensions");
  if (!dimensionsMode) throw new Error("paver dimensions mode missing");

  it("shows the worked-example base and bedding figures on the extended footprint", () => {
    const values = {
      length: 16,
      width: 12,
      paverLength: 12,
      paverWidth: 12,
      joint: 0.125,
      paverThickness: 2.375,
      waste: 10,
      baseDepth: 4,
      baseDensity: 2800,
      beddingSandDepth: 1,
      jointSandDensity: 100,
      jointSandBag: 50,
    };
    const present = new Set(Object.keys(values));
    const out = dimensionsMode?.compute(values, present);
    const baseRow = out?.rows.find((r) => r.label === "Base gravel to order");
    expect(baseRow?.value).toBe("3.41 yd³");
    expect(baseRow?.detail).toContain("221 ft²");
    expect(baseRow?.detail).toContain("4.77 tons");
    const beddingRow = out?.rows.find((r) => r.label === "Bedding sand");
    expect(beddingRow?.value).toBe("0.68 yd³");
    expect(beddingRow?.detail).toContain("18.42 ft³");
    const paversRow = out?.rows.find((r) => r.label === "Pavers needed");
    expect(paversRow?.value).toBe("207 pavers");
    expect(out?.note).toContain("already include the base extending");
  });

  it("states the 6 in driveway depth, not 8 in (PVR-3)", () => {
    const hint = dimensionsMode?.fields.find((f) => f.id === "baseDepth")?.hint;
    expect(hint).toContain("6 in for a residential driveway");
    expect(hint).not.toContain("8 in for a residential driveway");
    const faq = paverConfig.faqs.find((f) =>
      f.question.includes("How deep should the gravel base be"),
    );
    expect(faq?.answer).toContain("6 inches for a residential driveway");
    expect(faq?.answer).toContain("8–10 inches total for a driveway");
  });

  it("states the corrected joint-sand coverage per bag (PVR-4)", () => {
    const faq = paverConfig.faqs.find((f) => f.question.includes("How much polymeric sand"));
    expect(faq?.answer).toContain("roughly 123 sq ft");
    expect(faq?.answer).toContain("about 56 sq ft");
    expect(faq?.answer).not.toContain("190 sq ft");
    expect(faq?.answer).not.toContain("90 sq ft");
  });
});
