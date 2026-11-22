/**
 * Sitemap endpoint — generated at build time from the registry and the
 * static page list. No unshipped page appears here: calculator URLs are
 * NOT listed until their pages exist (Phases 2–3 add them). Every shipped
 * page must appear in this list.
 *
 * Locations are absolute only when a production origin is set
 * (PUBLIC_SITE_URL, Phase 8); otherwise they stay relative paths, as
 * before — so local builds and the release gate are unchanged.
 */
import { CATEGORIES } from "../lib/registry";
import { SHIPPED_CALCULATOR_SLUGS } from "../calculators/index";
import { absoluteUrl } from "../lib/site";
import type { APIRoute } from "astro";

const STATIC_PAGES = [
  "/",
  "/calculators/",
  "/my-project/",
  "/about/",
  "/contact/",
  "/privacy-policy/",
  "/terms-of-use/",
  "/disclaimer/",
];

export const GET: APIRoute = () => {
  const urls = [
    ...STATIC_PAGES,
    ...CATEGORIES.map((category) => category.url),
    // Only shipped calculator pages are listed (P0 in Phase 2, P1 in Phase 3, P2 in Phase 4).
    ...SHIPPED_CALCULATOR_SLUGS.map((slug) => `/calculators/${slug}/`),
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${absoluteUrl(url)}</loc></url>`),
    "</urlset>",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
