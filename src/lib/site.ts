/**
 * Site-wide constants and build-mode resolution.
 *
 * Build modes (Phase 8 review response, PR #4 review 6012776210, P0,
 * ADR-15): the old code treated a missing PUBLIC_SITE_URL as "relative
 * URLs, still indexable" and added noindex only for the literal
 * PUBLIC_PREVIEW=true — a missing or mistyped origin silently produced
 * an indexable build with wrong or relative URLs. Builds are now
 * explicit and fail-closed:
 *
 *   - "production": PUBLIC_SITE_URL set to a valid owner-approved HTTPS
 *     origin (validated by src/lib/origin.ts — an invalid value fails
 *     the build loudly) and PUBLIC_PREVIEW not set to "true". The only
 *     indexable build: absolute canonical/sitemap/robots URLs with
 *     exactly that origin, no noindex meta.
 *   - "preview": PUBLIC_PREVIEW=true (the Cloudflare preview
 *     environment). Absolute URLs when an origin is also set, relative
 *     otherwise — but always noindex, so a preview can never become
 *     indexable merely by missing env.
 *   - "local": neither set — local dev, the release gate's default
 *     build, and any build whose config is missing. Relative URLs and
 *     noindex on every page: unconfigured means unindexed, never
 *     "indexable by accident".
 *
 * No host is ever defaulted or invented: the origin must come from the
 * owner-approved production deployment. See docs/DEPLOYMENT.md §14.
 * The noindex tag is a safety net, not access control — real
 * restriction is the Cloudflare Pages preview access policy
 * (docs/DEPLOYMENT.md §14.4).
 */
import { validateProductionOrigin } from "./origin";

export const SITE_NAME = "HomeDIYCalc";
export const SITE_TAGLINE = "Calculate Materials. Estimate Costs. Build Your Shopping List.";
export const SITE_DESCRIPTION =
  "Free home improvement calculators: work out how much concrete, paint, gravel, tile, and more you need, with a shopping list to take to the store. No signup, no cost.";
// No contact email exists yet and there is no form backend (ADR-3), so no
// email address is published here. The Contact page says so honestly
// instead of listing an address that does not exist. Do not invent one.

/** The three build modes. See the header comment. */
export type BuildMode = "local" | "preview" | "production";

/**
 * Derive the build mode from the raw environment values. Pure, so it
 * is unit-testable without env vars. The preview flag wins over an
 * origin: a preview deployment must stay noindex even if an origin
 * was also set.
 */
export function resolveBuildMode(env: { siteUrl?: string; preview?: string }): BuildMode {
  if (env.preview === "true") return "preview";
  if (env.siteUrl !== undefined && env.siteUrl.trim() !== "") return "production";
  return "local";
}

export interface BuildConfig {
  mode: BuildMode;
  /** Validated production origin, or undefined when unset. */
  origin: string | undefined;
}

/**
 * Resolve mode + origin together. Throws on an invalid production
 * origin (fail loudly at build time instead of shipping a build with
 * wrong URLs). Pure, so it is unit-testable without env vars.
 */
export function resolveBuildConfig(env: { siteUrl?: string; preview?: string }): BuildConfig {
  return {
    mode: resolveBuildMode(env),
    origin: validateProductionOrigin(env.siteUrl),
  };
}

const BUILD_CONFIG: BuildConfig = resolveBuildConfig({
  siteUrl: import.meta.env.PUBLIC_SITE_URL as string | undefined,
  preview: import.meta.env.PUBLIC_PREVIEW as string | undefined,
});

/** This build's mode: "local" | "preview" | "production". */
export const BUILD_MODE: BuildMode = BUILD_CONFIG.mode;

/** Production origin without a trailing slash, or undefined when unset. */
export const SITE_URL: string | undefined = BUILD_CONFIG.origin;

/** True only for a production build (validated origin, no preview flag). */
export const IS_PRODUCTION: boolean = BUILD_MODE === "production";

/** True when this build is a non-production preview (PUBLIC_PREVIEW=true). */
export const IS_PREVIEW: boolean = BUILD_MODE === "preview";

/** True when this build may be indexed: production only (fail-closed). */
export const IS_INDEXABLE: boolean = IS_PRODUCTION;

/**
 * Make a site path absolute against the production origin when one is
 * set; otherwise return the path unchanged (relative URLs, as before).
 * `origin` is an explicit argument with no default — callers pass
 * SITE_URL — so `absoluteUrl(path, undefined)` always means "no
 * origin", whatever the ambient environment holds. That keeps the rule
 * unit-testable without env vars, including when a test runner (or the
 * release gate) has PUBLIC_SITE_URL set for another purpose.
 */
export function absoluteUrl(path: string, origin: string | undefined): string {
  if (!origin) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
