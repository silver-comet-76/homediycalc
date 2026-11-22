/**
 * robots.txt endpoint (Phase 8, Issue #3; modes per ADR-15) — generated
 * at build time so the Sitemap directive is absolute when a production
 * origin is set (PUBLIC_SITE_URL) and relative otherwise. This replaces
 * the static public/robots.txt: a static file cannot vary by
 * environment, and the production robots must point at the absolute
 * sitemap URL or the relative-URL SEO cap (Lighthouse SEO 83) never
 * lifts. The origin is validated at build time; a mistyped host fails
 * the build instead of shipping a wrong Sitemap URL.
 *
 * The file allows all crawling. Preview builds are kept out of search
 * results by the noindex meta tag (Layout.astro), not by robots.txt —
 * disallowing previews in robots.txt would stop crawlers from ever
 * seeing the noindex tag.
 */
import { absoluteUrl, SITE_URL } from "../lib/site";
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml", SITE_URL)}`,
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
