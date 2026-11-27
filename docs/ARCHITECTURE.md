# Architecture — HomeDIYCalc

> Status: Phase 1 complete (2026-11-20). The foundation is built and verified: Astro scaffold, unit engine, registry, shared layout/components, 14 static pages, sitemap/robots, Vitest + Playwright tests all passing. No calculator pages exist yet (Phases 2–3). The §13 open questions are resolved below with what was actually built.
>
> Update 2026-11-27: Phases 2–4 and Phase 15 have since shipped; 26 calculator pages are now live and the sitemap lists 41 URLs; counts in the dated Phase 1 record above are as of that phase.

> Update 2026-11-27: Phase 17B2 adds five landscaping calculators (Sand, Raised Garden Bed Soil, Sod/Turf, Lawn Seed, Fence), bringing the site to 31 calculator pages and 46 sitemap URLs.

## 1. Overview

HomeDIYCalc is a **fully static website**. Astro generates HTML at build time. Interactivity lives in small React islands that hydrate in the browser. All calculation happens client-side in pure TypeScript functions. There is no server, no API route, no database, and no external service required at runtime.

```
┌─────────────────────────────────────────────────────────────┐
│  Build time (Astro SSG)                                     │
│  Registry + content → static HTML pages                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ deployed as static files
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Pages (free, static hosting)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ browser
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  Static HTML (content, SEO) + React islands (calculators)   │
│  Pure TS functions ← unit engine ← LocalStorage (optional)  │
└─────────────────────────────────────────────────────────────┘
```

## 2. Astro SSG Structure

- **Astro** is the framework and static site generator. Pages are `.astro` files under `src/pages/`.
- **Routing is file-based.** `/calculators/<slug>/` maps to `src/pages/calculators/<slug>/index.astro` (or a dynamic route driven by the registry — see §4; either way, the URL pattern is fixed).
- **Content is static.** All page content (titles, descriptions, how-to text, FAQs) is authored in the repo, not fetched from a CMS or API.
- **Build output is plain HTML/CSS/JS** in `dist/`, deployable to any static host. `npm run build` must succeed offline with respect to paid/remote services.

### Directory layout

```
src/
  components/        # Astro components: Layout, Header, Footer, SEO, Breadcrumbs,
                     # CalculatorShell, ResultPanel, ShoppingList, SvgDiagram, Faq
  components/react/  # React islands: one per calculator + shared input components
  lib/
    registry.ts      # Centralized calculator registry
    units.ts         # Unified unit conversion engine
    formulas/        # Pure calculation functions, one module per calculator
    shopping-list.ts # Shopping list formatting + My Project (LocalStorage) logic
    validation.ts    # Shared input validation helpers
  pages/
    index.astro
    calculators/index.astro
    calculators/<slug>/index.astro   (×26)
    categories/<slug>.astro          (×6)
    my-project.astro
    about.astro  contact.astro
    privacy-policy.astro  terms-of-use.astro  disclaimer.astro
  styles/
    global.css       # Tailwind directives + base styles
public/
  robots.txt  sitemap.xml  ads.txt (only when AdSense is enabled)
  favicon.svg  og-image.png (or .svg)
tests/               # Playwright e2e tests
docs/                # Project documentation
```

## 3. TypeScript Strict Config

- `tsconfig.json` uses `"strict": true`, including `noUncheckedIndexedAccess: true` (confirmed in Phase 1 when the config was written).
- All calculator inputs are typed; no `any` in calculation code. Shared input/output types live in `src/lib/types.ts` (planned).
- `npm run typecheck` is `astro check` (resolved in Phase 1 — see §13) and must pass before a build is considered green.

## 4. Centralized Calculator Registry

`src/lib/registry.ts` is the **single source of truth** for the 31 calculators:

```ts
// Illustrative shape — exact fields to be finalized in Phase 1.
interface CalculatorMeta {
  slug: string;            // e.g. "concrete-calculator"
  name: string;            // e.g. "Concrete Calculator"
  category: CategorySlug;  // one of the 6 categories
  priority: "P0" | "P1" | "P2";
  url: string;             // "/calculators/<slug>/"
  seoTitle: string;
  seoDescription: string;
  related: string[];       // slugs of related calculators
}
```

- Home, All Calculators, category pages, sitemap, breadcrumbs, and "related calculators" sections are all generated from the registry.
- Adding a calculator means: registry entry + formula module + tests + React island + Astro page. A calculator with a missing piece is not done.
- The registry is also the checklist for completeness: 26 entries, 11 P0, 8 P1, 7 P2.

## 5. React Islands Pattern

- Each calculator's interactive UI is a **React island** (`client:load` or `client:visible` — to be decided per page in Phase 1; default to `client:visible` for below-fold calculators to keep initial load light).
- Static content around the island (headings, how-to text, FAQ, formulas, related links) is plain Astro HTML — rendered at build time, indexable, and visible with JavaScript disabled.
- Islands are small and self-contained: one island per calculator, sharing generic input components (`NumberInput`, `UnitToggle`, `WasteInput`, `PriceInput`, `ResultPanel`).
- An island must degrade gracefully: if JavaScript fails, the page still shows the explanation, formula, and example — it simply cannot compute interactively. (This is a design goal, not yet implemented or tested.)

## 6. Reusable Layout and Components

| Component | Purpose |
|---|---|
| `Layout.astro` | HTML shell, head, SEO tags, header/footer slots |
| `SEO.astro` | Title, description, canonical, Open Graph, structured data (JSON-LD) |
| `Breadcrumbs.astro` | Breadcrumb nav + BreadcrumbList structured data |
| `CalculatorShell.astro` | Shared calculator page layout: title, intro, island slot, formula section, FAQ, related calculators |
| `SvgDiagram` | Inline SVG measurement diagrams (one per calculator where helpful) |
| `ResultPanel` (React) | Results display, rounding note, cost breakdown |
| `ShoppingList` (React) | Copyable list output + "Save to My Project" |
| `Faq.astro` | FAQ section + FAQPage structured data |

Styling is Tailwind CSS utility classes, with a small set of shared component classes in `global.css` only where repetition justifies it. No CSS framework beyond Tailwind.

## 7. Unified Unit Conversion Engine

`src/lib/units.ts` is the only place unit conversion happens:

- **Canonical internal units:** feet (length), square feet (area), cubic feet (volume), US gallons (liquid volume).
- Inputs in metric (or yards/inches) are converted to canonical units on entry; results are converted back for display.
- All constants are named, documented, and sourced in `docs/FORMULAS.md`. Examples: 1 yd³ = 27 ft³; 1 US gal ≈ 3.785411784 L; 1 ft = 0.3048 m (exact).
- Components and formula modules **never** convert inline. A code review finding an inline conversion factor is a defect to fix, not a style nit.
- The engine is covered by its own Vitest suite (conversion round-trips, exact constants).

## 8. Pure Calculation Functions

- One module per calculator under `src/lib/formulas/` (e.g. `concrete.ts`, `paint.ts`).
- Pure functions: same inputs → same outputs. No DOM, no `fetch`, no `localStorage`, no `Date.now()`, no randomness.
- Each function takes a typed input object and returns a typed result object including: raw required amount, waste-adjusted amount, package quantities (rounded up), and — when prices are supplied — itemized cost and total.
- Formulas are documented in `docs/FORMULAS.md` with worked examples; unit tests assert those exact examples.
- UI components call these functions and render the results; they contain no calculation math of their own.

## 9. LocalStorage Persistence (My Project)

- **Only** persistence mechanism. No cookies for tracking, no server sync.
- Saved items are plain JSON under a single versioned key (e.g. `homediycalc:project:v1` — exact key to be finalized in Phase 1).
- `src/lib/shopping-list.ts` owns serialization, validation of stored data (corrupt/old-version data is ignored, never crashes the page), and the plain-text shopping list formatter.
- Saving is explicit (user clicks "Save to My Project"). Nothing is persisted silently.
- My Project page reads LocalStorage on the client; server-rendered HTML shows an empty-state message until hydration.

## 10. Testing Strategy

### Vitest (unit)

- Every formula module has a test file asserting the worked examples in `docs/FORMULAS.md`, boundary cases (0, negative, huge values), and round-up behavior (`ceil` on package quantities).
- The unit engine has round-trip and constant tests.
- Shopping-list formatting and LocalStorage serialization have unit tests (with a mocked `localStorage`).
- Target: all formula tests pass before a calculator ships. Coverage targets to be set in Phase 5; no coverage number is claimed before measurement.

### Playwright (browser)

- Every calculator page: loads, default result renders, invalid input shows an inline error, Reset works, shopping list copies.
- Navigation: Home → category → calculator; All Calculators search/filter; My Project save/remove flow.
- Mobile viewport (360px) included in the matrix, plus a desktop viewport.
- Tests run against the production build (`npm run preview`), not only the dev server.

### Manual / QA

- Acceptance checklist in `docs/QA-REPORT.md`; Lighthouse performance measured per calculator page (target ≥ 90, to be confirmed in QA — not claimed before measurement).

## 11. Deployment — Cloudflare Pages

- Static output (`dist/`) deployed to Cloudflare Pages free tier. See `docs/DEPLOYMENT.md`.
- Two deployment paths: Git integration (push to GitHub → automatic deploy) and manual upload (`wrangler` or dashboard drag-and-drop).
- Build command: `npm run build`. Output directory: `dist/`. No environment variables are required by the site; none should be needed for a calculator to work.
- Custom domain: only if the owner provides one; **do not purchase a domain** for this project.
- No serverless functions, no Workers, no KV, no R2 — the site must work as pure static files.

## 12. No-Backend Constraint — Enforcement

- There is no API layer to secure because there is no API. Any proposal that adds a server route, form endpoint, database, or third-party data service must go through an ADR in `docs/DECISIONS.md` and an owner decision.
- The Contact page has no submitting form until a backend is explicitly chosen; until then it shows an email address (or states the form is unavailable). A form that pretends to submit is a defect.
- AdSense/analytics scripts are the only third-party scripts ever contemplated, and they are disabled by default (see `docs/DECISIONS.md`).

## 13. Open Questions — Resolved in Phase 1 (2026-11-20)

- **Dynamic route vs. one `.astro` file per calculator page:** registry-driven dynamic route. Category pages already use it (`src/pages/categories/[slug].astro` with `getStaticPaths` from the registry). Calculator pages in Phases 2–3 will use the same pattern (`src/pages/calculators/[slug].astro`), not 26 files.
- **`client:load` vs. `client:visible` default for calculator islands:** default is `client:visible` (below-fold widgets stay light); `client:load` only where a specific page justifies it. No islands exist yet in Phase 1.
- **Exact LocalStorage key and schema versioning:** `homediycalc:project:v1`, schema version 1, owned by `src/lib/project.ts` (guarded serialize/parse; corrupt/wrong-version data returns an empty project, never throws).
- **`astro check` vs. plain `tsc` for typechecking:** `astro check` (script `npm run typecheck`). Requires `@astrojs/check@0.9.12` (MIT, pinned exact) as a devDependency — see `docs/PHASE-REPORT.md` Phase 1 §5. Passes with 0 errors across 27 files.
- **Sitemap generation:** build-time endpoint `src/pages/sitemap.xml.ts`, generated from the registry + static page list (no `@astrojs/sitemap` integration, no hand-maintained file). Lists only shipped pages; calculator URLs are added as their pages ship in Phases 2–3.
