/**
 * Site-wide constants.
 *
 * Production origin (Phase 8, Issue #3): the site's canonical, sitemap,
 * and robots URLs are absolute only when the build sets PUBLIC_SITE_URL
 * (e.g. the Cloudflare Pages production environment variable). With the
 * variable unset — local builds, the release gate, and preview
 * deployments — every URL stays relative, exactly as before. No host is
 * ever defaulted or invented here: the origin must come from the
 * owner-approved production deployment. See docs/DEPLOYMENT.md §14.
 *
 * Preview flag (Phase 8): PUBLIC_PREVIEW=true marks a build as a
 * non-production preview. Preview builds carry a robots noindex meta
 * tag on every page so a staging URL is never indexed. It is a safety
 * net, not access control — real restriction is Cloudflare Access on
 * the preview hostname (docs/DEPLOYMENT.md §14).
 */
export const SITE_NAME = "HomeDIYCalc";
export const SITE_TAGLINE = "Calculate Materials. Estimate Costs. Build Your Shopping List.";
export const SITE_DESCRIPTION =
  "Free home improvement calculators: work out how much concrete, paint, gravel, tile, and more you need, with a shopping list to take to the store. No signup, no cost.";
// No contact email exists yet and there is no form backend (ADR-3), so no
// email address is published here. The Contact page says so honestly
// instead of listing an address that does not exist. Do not invent one.

/** Production origin without a trailing slash, or undefined when unset. */
export const SITE_URL: string | undefined =
  (import.meta.env.PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, "") || undefined;

/** True when this build is a non-production preview (PUBLIC_PREVIEW=true). */
export const IS_PREVIEW: boolean = import.meta.env.PUBLIC_PREVIEW === "true";

/**
 * Make a site path absolute against the production origin when one is
 * set; otherwise return the path unchanged (relative URLs, as before).
 * `origin` is injectable so the rule is unit-testable without env vars.
 */
export function absoluteUrl(path: string, origin: string | undefined = SITE_URL): string {
  if (!origin) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
