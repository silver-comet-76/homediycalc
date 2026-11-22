/**
 * Production-origin validation (Phase 8 review response, PR #4 review
 * 6012776210, P0).
 *
 * The old code accepted any PUBLIC_SITE_URL string and treated a missing
 * one as "relative URLs, still indexable" — a mistyped or missing origin
 * silently produced an indexable build with wrong or relative URLs. The
 * production build must now require a valid owner-approved HTTPS origin,
 * and any other build must be noindex (fail-closed). This module is pure:
 * no import.meta.env, no side effects — so both src/lib/site.ts and
 * astro.config.mjs use the same single rule.
 *
 * A valid production origin is a bare https:// hostname: no http, no
 * path, no port, no query, no fragment, no userinfo, no localhost, no
 * IP literal, and a real dotted hostname (a bare word like
 * "https://homediycalc" is a typo, not an origin). The return value is
 * the normalized origin (lowercase host, no trailing slash).
 */
export function validateProductionOrigin(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(
      `Invalid PUBLIC_SITE_URL "${raw}": not a URL. A production origin must be a bare https:// hostname, e.g. https://homediycalc.pages.dev — no http, path, port, or query.`,
    );
  }
  const host = url.hostname;
  const isIpLiteral = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith("[");
  const invalid =
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== "" ||
    host === "" ||
    !host.includes(".") ||
    host === "localhost" ||
    host.endsWith(".local") ||
    isIpLiteral;
  if (invalid) {
    throw new Error(
      `Invalid PUBLIC_SITE_URL "${raw}": a production origin must be a bare https:// hostname, e.g. https://homediycalc.pages.dev — no http, path, port, query, localhost, or IP address.`,
    );
  }
  return `https://${host.toLowerCase()}`;
}
