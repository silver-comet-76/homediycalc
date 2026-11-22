import { describe, expect, it } from "vitest";
import { absoluteUrl, IS_PREVIEW, SITE_URL } from "./site";

/**
 * Phase 8 (Issue #3): canonical, sitemap, and robots URLs are absolute
 * only when a production origin is set (PUBLIC_SITE_URL); otherwise they
 * stay relative, exactly as before. No host is ever invented.
 */
describe("absoluteUrl", () => {
  it("returns the path unchanged when no origin is set", () => {
    expect(absoluteUrl("/calculators/paint-calculator/", undefined)).toBe(
      "/calculators/paint-calculator/",
    );
    expect(absoluteUrl("/sitemap.xml", undefined)).toBe("/sitemap.xml");
  });

  it("makes the path absolute against an explicit origin", () => {
    expect(absoluteUrl("/calculators/paint-calculator/", "https://example.com")).toBe(
      "https://example.com/calculators/paint-calculator/",
    );
    expect(absoluteUrl("/sitemap.xml", "https://example.com")).toBe(
      "https://example.com/sitemap.xml",
    );
  });

  it("adds a leading slash when the path has none", () => {
    expect(absoluteUrl("sitemap.xml", "https://example.com")).toBe(
      "https://example.com/sitemap.xml",
    );
  });
});

describe("site env defaults (no PUBLIC_* vars set)", () => {
  it("has no production origin, so the default build stays relative", () => {
    expect(SITE_URL).toBeUndefined();
    expect(absoluteUrl("/")).toBe("/");
  });

  it("is not a preview build", () => {
    expect(IS_PREVIEW).toBe(false);
  });
});
