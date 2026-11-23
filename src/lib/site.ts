/**
 * Site-wide constants and build-mode resolution.
 *
 * Build modes (Phase 8 review response, PR #4 review 6012776210, P0,
 * ADR-15; mode derivation replaced by ADR-17 after review 6013166210):
 * production is an explicit opt-in, never an inference. A build is
 * indexable only when ALL of these hold:
 *
 *   - `PUBLIC_BUILD_MODE` is exactly `production` (no other spelling:
 *     "Production", "prod", or any other value fails the build), AND
 *   - `PUBLIC_SITE_URL` is a valid owner-approved HTTPS origin
 *     (validated by src/lib/origin.ts — an invalid value fails the
 *     build loudly), AND
 *   - on Cloudflare Pages (`CF_PAGES` set), the deployment branch
 *     (`CF_PAGES_BRANCH`) equals the production branch
 *     (`PUBLIC_PRODUCTION_BRANCH`, default `main`): a preview branch
 *     can never be a production build just via inherited flags. If the
 *     branch context is missing on a Pages build, the build fails
 *     closed instead of guessing.
 *
 * The other modes:
 *   - "preview": `PUBLIC_BUILD_MODE=preview`, or (with no explicit
 *     mode) the legacy `PUBLIC_PREVIEW=true`. Absolute URLs when an
 *     origin is also set, relative otherwise — but always noindex, so
 *     a preview can never become indexable merely by missing env.
 *   - "local": everything else — local dev, the release gate's
 *     default build, and any build whose config is missing, mistyped,
 *     or origin-only. Relative URLs and noindex on every page: an
 *     origin alone never implies production, and a local build ignores
 *     the origin for URL generation (a mistyped origin still fails
 *     the build loudly — it is validated in every mode — so the error
 *     surfaces instead of being silently ignored).
 *
 * Conflicts fail the build instead of picking a winner: an explicit
 * production or local mode together with `PUBLIC_PREVIEW=true` is a
 * contradiction, not a precedence rule.
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
// Official contact email (owner-confirmed 2026-11-23, Phase 9). There is
// still no form backend (ADR-3): the Contact page links to this address
// with a mailto link only. Do not invent or substitute another address —
// notably not contact@homediycalc.com, a domain the owner does not own.
// Inbound delivery test sent 2026-11-23; see docs/DEPLOYMENT.md §14.10
// for the verification status.
export const SITE_CONTACT_EMAIL = "homediycalc@gmail.com";

/** The three build modes. See the header comment. */
export type BuildMode = "local" | "preview" | "production";

/** Raw environment values the mode resolution reads. Pure inputs. */
export interface BuildEnv {
  siteUrl?: string;
  preview?: string;
  buildMode?: string;
  cfPages?: string;
  cfPagesBranch?: string;
  productionBranch?: string;
}

/** The owner-configured production branch (docs/DEPLOYMENT.md §14.2). */
export const DEFAULT_PRODUCTION_BRANCH = "main";

/**
 * Derive the build mode from the raw environment values. Pure, so it
 * is unit-testable without env vars. Production is a positive explicit
 * opt-in: an origin alone never implies production, and a mistyped
 * preview flag (`True`, `1`) never implies preview either — both fall
 * through to local. Conflicts fail loudly instead of picking a winner.
 */
export function resolveBuildMode(env: BuildEnv): BuildMode {
  const mode = env.buildMode === undefined ? undefined : env.buildMode.trim();
  const previewFlag = env.preview === "true";
  if (mode !== undefined && mode !== "") {
    if (mode !== "local" && mode !== "preview" && mode !== "production") {
      throw new Error(
        `Unknown PUBLIC_BUILD_MODE "${env.buildMode}": expected exactly "local", "preview", or "production". ` +
          `An unknown or missing mode is never indexable — set PUBLIC_BUILD_MODE explicitly.`,
      );
    }
    if (previewFlag && mode !== "preview") {
      throw new Error(
        `Conflicting build config: PUBLIC_BUILD_MODE=${mode} with PUBLIC_PREVIEW=true. ` +
          `A production or local build must not carry the preview flag; set PUBLIC_BUILD_MODE=preview instead, or unset PUBLIC_PREVIEW.`,
      );
    }
    return mode;
  }
  if (previewFlag) return "preview";
  return "local";
}

export interface BuildConfig {
  mode: BuildMode;
  /** Validated origin for preview/production builds; undefined for local. */
  origin: string | undefined;
}

/**
 * Resolve mode + origin together. Throws on an invalid origin, a
 * missing origin for a production build, a mode/flag conflict, and —
 * on Cloudflare Pages — a production build whose deployment branch is
 * not the production branch, or whose branch context is missing.
 * Pure, so it is unit-testable without env vars.
 */
export function resolveBuildConfig(env: BuildEnv): BuildConfig {
  const mode = resolveBuildMode(env);
  // A non-blank origin is validated in every mode so a mistyped value
  // fails the build loudly instead of being silently ignored — even
  // though a local build does not use it for URLs.
  const rawOrigin = validateProductionOrigin(env.siteUrl);
  if (mode === "local") {
    return { mode, origin: undefined };
  }
  if (mode === "production") {
    if (rawOrigin === undefined) {
      throw new Error(
        "PUBLIC_BUILD_MODE=production requires a valid PUBLIC_SITE_URL: " +
          "a production build needs an explicit, owner-approved https:// origin. " +
          "An origin alone never implies production, and a missing origin is never indexable.",
      );
    }
    // Provider branch guard (review 6013166210): on Cloudflare Pages,
    // a preview branch must not become a production build just because
    // the production mode/origin flags were inherited (e.g. set for all
    // environments). Local builds and Direct Upload deploys have no
    // Pages context, so the guard only runs when CF_PAGES/CF_PAGES_BRANCH
    // is present — which is exactly when a deployment could go live.
    const onPages =
      (env.cfPages !== undefined && env.cfPages.trim() !== "") ||
      (env.cfPagesBranch !== undefined && env.cfPagesBranch.trim() !== "");
    if (onPages) {
      const branch = env.cfPagesBranch === undefined ? undefined : env.cfPagesBranch.trim();
      if (branch === undefined || branch === "") {
        throw new Error(
          "Production build on Cloudflare Pages requires CF_PAGES_BRANCH: " +
            "the deployment branch cannot be verified, so the build fails closed instead of guessing. " +
            "A preview branch must never be a production build.",
        );
      }
      const productionBranch =
        env.productionBranch === undefined || env.productionBranch.trim() === ""
          ? DEFAULT_PRODUCTION_BRANCH
          : env.productionBranch.trim();
      if (branch !== productionBranch) {
        throw new Error(
          `Production build refused: Cloudflare Pages branch "${branch}" is not the production branch "${productionBranch}". ` +
            "A preview branch cannot be a production build just via inherited flags — " +
            "set PUBLIC_BUILD_MODE=preview (and unset the production origin) for preview deployments.",
        );
      }
    }
    return { mode, origin: rawOrigin };
  }
  return { mode, origin: rawOrigin };
}

const BUILD_CONFIG: BuildConfig = resolveBuildConfig({
  siteUrl: import.meta.env.PUBLIC_SITE_URL as string | undefined,
  preview: import.meta.env.PUBLIC_PREVIEW as string | undefined,
  buildMode: import.meta.env.PUBLIC_BUILD_MODE as string | undefined,
  cfPages: import.meta.env.CF_PAGES as string | undefined,
  cfPagesBranch: import.meta.env.CF_PAGES_BRANCH as string | undefined,
  productionBranch: import.meta.env.PUBLIC_PRODUCTION_BRANCH as string | undefined,
});

/** This build's mode: "local" | "preview" | "production". */
export const BUILD_MODE: BuildMode = BUILD_CONFIG.mode;

/** Production origin without a trailing slash, or undefined when unset/local. */
export const SITE_URL: string | undefined = BUILD_CONFIG.origin;

/** True only for a production build (explicit mode + validated origin + branch match). */
export const IS_PRODUCTION: boolean = BUILD_MODE === "production";

/** True when this build is a non-production preview. */
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
