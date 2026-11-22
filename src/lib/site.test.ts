import { describe, expect, it } from "vitest";
import { absoluteUrl, resolveBuildConfig, resolveBuildMode } from "./site";
import { validateProductionOrigin } from "./origin";

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
  // These assertions use the pure resolver, not the module constants:
  // the constants read the ambient environment, and the release gate
  // runs Vitest with PUBLIC_SITE_URL set for the production build —
  // a test that asserts the constants' defaults would fail there
  // even though the code is correct. The rendered defaults (relative
  // URLs + noindex on every page) are covered by the gate audit's
  // local-mode build and the Playwright local-build test instead.
  it("has no production origin, so the default build stays relative", () => {
    expect(resolveBuildConfig({}).origin).toBeUndefined();
    expect(absoluteUrl("/", resolveBuildConfig({}).origin)).toBe("/");
  });

  it("is not a preview build", () => {
    expect(resolveBuildConfig({ preview: undefined }).mode).not.toBe("preview");
  });

  it("is a local build and not indexable (fail-closed default, ADR-15)", () => {
    expect(resolveBuildConfig({}).mode).toBe("local");
    expect(resolveBuildConfig({}).mode).not.toBe("production");
  });
});

describe("validateProductionOrigin (ADR-15)", () => {
  it("accepts a bare https hostname and normalizes it", () => {
    expect(validateProductionOrigin("https://homediycalc.pages.dev")).toBe(
      "https://homediycalc.pages.dev",
    );
    expect(validateProductionOrigin("https://Example.COM/")).toBe("https://example.com");
  });

  it("returns undefined for an unset or blank origin", () => {
    expect(validateProductionOrigin(undefined)).toBeUndefined();
    expect(validateProductionOrigin("")).toBeUndefined();
    expect(validateProductionOrigin("   ")).toBeUndefined();
  });

  it("rejects http, a missing scheme, a path, a query, and a port", () => {
    expect(() => validateProductionOrigin("http://example.com")).toThrow(/bare https/);
    expect(() => validateProductionOrigin("example.com")).toThrow(/not a URL/);
    expect(() => validateProductionOrigin("https://example.com/foo")).toThrow(/bare https/);
    expect(() => validateProductionOrigin("https://example.com/?x=1")).toThrow(/bare https/);
    expect(() => validateProductionOrigin("https://example.com:8080")).toThrow(/bare https/);
  });

  it("rejects localhost, bare hostnames, and IP literals", () => {
    expect(() => validateProductionOrigin("https://localhost")).toThrow(/bare https/);
    expect(() => validateProductionOrigin("https://homediycalc")).toThrow(/bare https/);
    expect(() => validateProductionOrigin("https://127.0.0.1")).toThrow(/bare https/);
    expect(() => validateProductionOrigin("https://[::1]")).toThrow(/bare https/);
  });
});

describe("resolveBuildMode / resolveBuildConfig (ADR-15)", () => {
  it("is local when neither variable is set", () => {
    expect(resolveBuildMode({})).toBe("local");
    expect(resolveBuildConfig({})).toEqual({ mode: "local", origin: undefined });
  });

  it("is production when a valid origin is set", () => {
    expect(resolveBuildMode({ siteUrl: "https://example.com" })).toBe("production");
    expect(resolveBuildConfig({ siteUrl: "https://example.com" })).toEqual({
      mode: "production",
      origin: "https://example.com",
    });
  });

  it("is preview when the preview flag is set, even with an origin", () => {
    expect(resolveBuildMode({ siteUrl: "https://example.com", preview: "true" })).toBe("preview");
    expect(resolveBuildConfig({ siteUrl: "https://example.com", preview: "true" })).toEqual({
      mode: "preview",
      origin: "https://example.com",
    });
  });

  it('is local when the preview flag is any value other than literal "true"', () => {
    expect(resolveBuildMode({ preview: "True" })).toBe("local");
    expect(resolveBuildMode({ preview: "1" })).toBe("local");
  });

  it("throws on an invalid production origin instead of building with it", () => {
    expect(() => resolveBuildConfig({ siteUrl: "http://example.com" })).toThrow(/bare https/);
  });
});
