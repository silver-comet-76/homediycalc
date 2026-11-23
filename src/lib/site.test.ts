import { describe, expect, it } from "vitest";
import { absoluteUrl, resolveBuildConfig, resolveBuildMode, SITE_CONTACT_EMAIL } from "./site";
import { validateProductionOrigin } from "./origin";

/**
 * Phase 8 (Issue #3): canonical, sitemap, and robots URLs are absolute
 * only in a preview or production build with an origin set; a local
 * build stays relative, exactly as before. No host is ever invented.
 * Mode derivation is ADR-17 (review 6013166210): production is an
 * explicit opt-in (PUBLIC_BUILD_MODE=production), never an inference
 * from the origin alone.
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

  it("is a local build and not indexable (fail-closed default, ADR-17)", () => {
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

describe("resolveBuildMode / resolveBuildConfig (ADR-17)", () => {
  it("is local when neither variable is set", () => {
    expect(resolveBuildMode({})).toBe("local");
    expect(resolveBuildConfig({})).toEqual({ mode: "local", origin: undefined });
  });

  it("origin alone never implies production (review 6013166210)", () => {
    // The ADR-15 rule (any valid origin => production) was the leak:
    // a preview that inherited the origin became indexable.
    expect(resolveBuildMode({ siteUrl: "https://example.com" })).toBe("local");
    expect(resolveBuildConfig({ siteUrl: "https://example.com" })).toEqual({
      mode: "local",
      origin: undefined,
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
    // The reviewer's exact repro: origin + mistyped preview flag must
    // not be production — it is local, never indexable.
    expect(resolveBuildMode({ siteUrl: "https://example.com", preview: "True" })).toBe("local");
    expect(resolveBuildConfig({ siteUrl: "https://example.com", preview: "True" })).toEqual({
      mode: "local",
      origin: undefined,
    });
  });

  it("throws on an invalid production origin instead of building with it", () => {
    expect(() => resolveBuildConfig({ siteUrl: "http://example.com" })).toThrow(/bare https/);
    expect(() =>
      resolveBuildConfig({ buildMode: "production", siteUrl: "http://example.com" }),
    ).toThrow(/bare https/);
  });

  it("is production only with an explicit mode plus a valid origin", () => {
    expect(resolveBuildMode({ buildMode: "production", siteUrl: "https://example.com" })).toBe(
      "production",
    );
    expect(resolveBuildConfig({ buildMode: "production", siteUrl: "https://example.com" })).toEqual(
      { mode: "production", origin: "https://example.com" },
    );
  });

  it("throws when production mode has no origin", () => {
    expect(() => resolveBuildConfig({ buildMode: "production" })).toThrow(
      /requires a valid PUBLIC_SITE_URL/,
    );
    expect(() => resolveBuildConfig({ buildMode: "production", siteUrl: "" })).toThrow(
      /requires a valid PUBLIC_SITE_URL/,
    );
  });

  it("rejects a mistyped mode value instead of guessing", () => {
    // Exact match only: "Production" is not "production".
    expect(() => resolveBuildMode({ buildMode: "Production" })).toThrow(
      /Unknown PUBLIC_BUILD_MODE/,
    );
    expect(() => resolveBuildMode({ buildMode: "prod" })).toThrow(/Unknown PUBLIC_BUILD_MODE/);
    expect(() => resolveBuildMode({ buildMode: "staging" })).toThrow(/Unknown PUBLIC_BUILD_MODE/);
  });

  it("accepts surrounding whitespace in the mode value", () => {
    expect(resolveBuildMode({ buildMode: " production ", siteUrl: "https://example.com" })).toBe(
      "production",
    );
  });

  it("rejects an explicit mode that conflicts with the preview flag", () => {
    expect(() =>
      resolveBuildConfig({
        buildMode: "production",
        preview: "true",
        siteUrl: "https://example.com",
      }),
    ).toThrow(/Conflicting build config/);
    expect(() => resolveBuildConfig({ buildMode: "local", preview: "true" })).toThrow(
      /Conflicting build config/,
    );
    // Consistent combination: preview mode with the preview flag.
    expect(
      resolveBuildConfig({ buildMode: "preview", preview: "true", siteUrl: "https://example.com" }),
    ).toEqual({ mode: "preview", origin: "https://example.com" });
  });

  it("a local build ignores the origin for URLs but still validates it", () => {
    expect(resolveBuildConfig({ buildMode: "local", siteUrl: "https://example.com" })).toEqual({
      mode: "local",
      origin: undefined,
    });
    expect(() => resolveBuildConfig({ buildMode: "local", siteUrl: "http://example.com" })).toThrow(
      /bare https/,
    );
  });

  it("branch guard: a preview branch cannot be production on Cloudflare Pages", () => {
    const prod = { buildMode: "production", siteUrl: "https://example.com" };
    // Inherited production flags on a preview branch: refused.
    expect(() => resolveBuildConfig({ ...prod, cfPages: "1", cfPagesBranch: "feature-x" })).toThrow(
      /not the production branch/,
    );
    // Branch context present without CF_PAGES also triggers the guard.
    expect(() => resolveBuildConfig({ ...prod, cfPagesBranch: "release-1" })).toThrow(
      /not the production branch/,
    );
    // Missing branch context on a Pages build: fail closed, do not guess.
    expect(() => resolveBuildConfig({ ...prod, cfPages: "1" })).toThrow(/requires CF_PAGES_BRANCH/);
    // The production branch itself is allowed.
    expect(resolveBuildConfig({ ...prod, cfPages: "1", cfPagesBranch: "main" })).toEqual({
      mode: "production",
      origin: "https://example.com",
    });
    // A custom production branch is honored (and enforced).
    expect(() =>
      resolveBuildConfig({
        ...prod,
        cfPages: "1",
        cfPagesBranch: "main",
        productionBranch: "prod",
      }),
    ).toThrow(/not the production branch/);
    expect(
      resolveBuildConfig({
        ...prod,
        cfPages: "1",
        cfPagesBranch: "prod",
        productionBranch: "prod",
      }),
    ).toEqual({ mode: "production", origin: "https://example.com" });
    // No Pages context (local build / Direct Upload deploy): no guard.
    expect(resolveBuildConfig(prod)).toEqual({ mode: "production", origin: "https://example.com" });
    // The guard only gates production: a preview on a branch is fine.
    expect(
      resolveBuildConfig({
        buildMode: "preview",
        siteUrl: "https://example.com",
        cfPages: "1",
        cfPagesBranch: "feature-x",
      }),
    ).toEqual({ mode: "preview", origin: "https://example.com" });
  });
});

/**
 * Phase 9 owner decisions (2026-11-23): the official contact email is
 * owner-confirmed. Guard the exact address — notably NOT
 * contact@homediycalc.com, a domain the owner does not own — so a typo
 * or a "helpful" substitution cannot silently publish the wrong address.
 */
describe("SITE_CONTACT_EMAIL (Phase 9 owner decision)", () => {
  it("is the owner-confirmed Gmail address", () => {
    expect(SITE_CONTACT_EMAIL).toBe("homediycalc@gmail.com");
  });

  it("is a well-formed email address on gmail.com", () => {
    expect(SITE_CONTACT_EMAIL).toMatch(/^[a-z0-9._%+-]+@gmail\.com$/);
  });

  it("is never a homediycalc.com address (domain not owned)", () => {
    expect(SITE_CONTACT_EMAIL).not.toContain("homediycalc.com");
  });
});
