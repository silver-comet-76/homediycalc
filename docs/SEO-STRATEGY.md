# SEO Strategy — HomeDIYCalc

> Status: Phase 0 — planning document. No pages exist yet; nothing here describes measured rankings or traffic. Any numbers added later must come from Search Console or another named source.

## 1. Goal

Rank in US search for calculator-intent queries (e.g. "concrete calculator", "how much paint do I need", "gravel calculator cubic yards") with pages that genuinely answer the query — original content, transparent math, and a working tool — and earn repeat visits through the shopping list / My Project features.

## 2. Principles

1. **One page, one intent.** Each calculator page targets one calculation. No doorway pages, no near-duplicate pages for keyword variants.
2. **Static HTML first.** Content (headings, how-to text, FAQs, formulas) is rendered at build time so search engines can read it without JavaScript.
3. **Original content per page.** Every calculator page has its own how-to-measure guidance, worked example, limitations, and FAQ. No spun or copied text across pages.
4. **US English.** All titles, descriptions, and copy are US English. Metric support is a feature of the tool, not a separate set of pages.
5. **No tricks.** No hidden text, no keyword stuffing, no fake reviews/testimonials, no purchased links.

## 3. On-Page SEO (every page)

| Element | Rule |
|---|---|
| Title tag | Unique per page; calculator pages follow "[Calculator Name] \| HomeDIYCalc" (final pattern to be confirmed in Phase 4); under ~60 characters where possible |
| Meta description | Unique per page, plain US English, describes what the calculator does and what the user gets; under ~160 characters |
| Canonical URL | Every page declares its own canonical (`https://<domain>/calculators/<slug>/` once a domain exists; relative/self-referential until then — confirm in Phase 4) |
| Headings | One H1 per page (the calculator/page name); logical H2/H3 structure |
| URL | `/calculators/<slug>/` for calculators; short, lowercase, hyphenated slugs |
| Images/diagrams | Inline SVG (no SEO image work needed); any raster images get descriptive `alt` text |
| Internal links | Every calculator page links to its related calculators and its category page; every category page links to its calculators |

## 4. Technical SEO

- **Static HTML:** Astro SSG output; no client-side-only rendering of content.
- **Sitemap:** `sitemap.xml` listing every shipped page, updated as part of the build/deploy process (generation approach to be decided in Phase 1). No unshipped page appears in the sitemap.
- **robots.txt:** allows crawling of all public pages; points to the sitemap. Disallow nothing the site wants indexed.
- **Performance:** static files on Cloudflare Pages; minimal JavaScript (islands only); target Lighthouse performance ≥ 90 on calculator pages (target, not a claim — to be measured in Phase 5).
- **Mobile-first:** responsive design; mobile viewport is the primary test viewport.
- **HTTPS:** provided by Cloudflare Pages by default.

## 5. Breadcrumbs

- Visible breadcrumb trail on every calculator and category page: Home › Category › Calculator.
- `BreadcrumbList` JSON-LD structured data on the same pages.

## 6. Open Graph and Social

- Open Graph tags on every page (title, description, type, URL, image).
- One shared OG image for the site initially; per-category OG images are a later option, not a launch requirement.
- Twitter card tags (`summary_large_image`) alongside Open Graph.

## 7. Structured Data (JSON-LD)

| Type | Where |
|---|---|
| `BreadcrumbList` | Calculator and category pages |
| `FAQPage` | Pages with an FAQ section (most calculator pages) |
| `HowTo` | Calculator pages where the measurement steps fit the HowTo pattern (confirm per page in Phase 4; do not force it where it does not fit) |
| `WebSite` (+ `SearchAction` only if a real site search exists) | Home page — `SearchAction` only if/when site search is implemented; do not declare a search the site does not have |

Structured data must match visible page content. Never mark up content that is not on the page.

## 8. Internal Linking

- **Hub pages:** Home and All Calculators link to every calculator (grouped by category).
- **Category pages:** link to all calculators in the category and to related categories.
- **Calculator pages:** "Related calculators" section (from the registry), plus contextual links in the how-to text where genuinely relevant.
- **My Project / legal pages:** linked from the footer, not from calculator content.

## 9. Content Requirements Per Calculator Page

Each calculator page must contain, at minimum:

1. What the calculator does and what inputs it needs.
2. How to measure (with an SVG diagram where helpful).
3. The formula, with numbers substituted ("How this is calculated").
4. A worked example with a stated answer.
5. Limitations (what the calculator does not account for — e.g. slope, compaction, spillage).
6. An FAQ (3–5 genuine questions).
7. Related calculators.

Thin pages (tool only, no explanation) do not ship.

## 10. What We Will Not Do

- No doorway pages or keyword-variant duplicates.
- No auto-generated location pages.
- No fake reviews, ratings, or testimonials markup.
- No hidden or cloaked content.
- No sitemap entries for unshipped pages.

## 11. Search Console Verification

1. Create/verify the property in Google Search Console (owner's Google account; the agent does not create Google accounts).
2. Verify ownership via the method Search Console offers — **HTML file** (download Search Console's file, place it unchanged in `public/`, redeploy, verify), **HTML meta tag** (add the tag Search Console gives to the shared `src/components/Layout.astro` `<head>`, redeploy, verify), or **DNS TXT record** (add the TXT record Search Console gives at the domain's DNS provider; no code change; best choice if the owner controls the domain's DNS). Full step-by-step instructions for all three methods are in `docs/DEPLOYMENT.md` §8. Do not invent a verification filename, meta-tag value, or TXT value — each comes from Search Console at setup time.
3. Submit `sitemap.xml` after launch (Phase 6): `https://<domain>/sitemap.xml` under **Sitemaps**. The sitemap lists exactly the shipped pages (39 URLs).
4. Monitor Coverage and Performance reports weekly for the first month after launch; fix crawl errors before adding new pages. The weekly checklist (Coverage, Performance, Enhancements, Core Web Vitals, Manual actions / Security issues) is in `docs/DEPLOYMENT.md` §8.4.

Bing Webmaster Tools submission is optional and follows the same sitemap; it is not a launch blocker.

## 12. Measurement (after launch only)

- Rankings and traffic are reported only from Search Console (or another named tool) after launch. No traffic or ranking numbers are claimed before measurement.
- The SEO checklist (per-page titles, descriptions, canonicals, sitemap, structured data) is tracked in `docs/QA-REPORT.md` and must be complete before Phase 6 launch.
