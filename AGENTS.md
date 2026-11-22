# AGENTS.md — HomeDIYCalc Project Operating Notes

> Project: HomeDIYCalc — free online home improvement / DIY / construction material calculator website.
> Position: "Calculate Materials. Estimate Costs. Build Your Shopping List."
> Market: US primary; UK, Canada, Australia, New Zealand secondary.
> Language: US English throughout. No registration, no login, no backend, no paid API, no database.

## Stack (fixed — do not change without an ADR in `docs/DECISIONS.md`)

| Layer | Choice |
|---|---|
| Static site generation | Astro |
| Language | TypeScript, strict mode |
| Interactive calculators | React Islands (hydrated only where needed) |
| Styling | Tailwind CSS |
| Calculation logic | Pure TypeScript functions — no server-side calculation |
| Diagrams | Inline SVG |
| Optional project persistence | LocalStorage only |
| Unit tests | Vitest |
| Browser tests | Playwright |
| Version control | GitHub |
| Hosting | Cloudflare Pages (free tier) |

No external API is required by any calculator. No backend, no database, no paid dependency.

## Commands

```bash
npm install          # install dependencies
npm run dev          # local dev server
npm run build        # production build (Astro SSG)
npm run preview      # preview the production build locally
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright browser tests
npm run lint         # lint (if configured)
npm run typecheck    # TypeScript strict check
```

Build output must be fully static. If `npm run build` requires network access to a paid API or a server, the build is broken — fix it, do not work around it.

## Repository Layout (planned)

```
src/
  components/        # Shared Astro/React components (layout, header, footer, SEO, breadcrumbs)
  calculators/       # One folder per calculator: React island + pure calc module + tests
  lib/
    units.ts         # Unified unit conversion engine (single source of truth)
    registry.ts      # Centralized calculator registry (see below)
    formulas/        # Pure calculation functions, one module per calculator
    shopping-list.ts # Shopping list / project planner logic (LocalStorage)
  pages/
    index.astro                  # Home
    calculators/
      index.astro                # All Calculators
      <slug>/index.astro         # One page per calculator
    categories/<slug>.astro      # 6 category pages
    my-project.astro
    about.astro  contact.astro  privacy-policy.astro  terms-of-use.astro  disclaimer.astro
  styles/
public/
  _headers  favicon.svg  og-image.svg  (robots.txt is a build-time route, `src/pages/robots.txt.ts`; sitemap.xml is generated at build time, `src/pages/sitemap.xml.ts`; ads.txt only when AdSense is enabled)
docs/                # This project's documentation (PRD, architecture, roadmap, ...)
tests/               # Playwright e2e tests
```

## Conventions

### Styles must actually load — assert computed styles, not just behavior

- **Phase 5 lesson (blocking defect):** `src/styles/global.css` was never imported by any component, so Vite never bundled it and the site shipped with **no CSS at all** from Phase 1 through Phase 4 — browser-default buttons, unstyled text, 17 px nav links — while every functional test passed and Lighthouse did not flag it. The fix is one import in `src/components/Layout.astro` (`import "../styles/global.css"`); the guard is the permanent regression test `tests/styles.spec.ts`, which asserts a `.css` stylesheet loads and that computed styles apply (body white, `.btn-primary` brand-600, nav links ≥ 24 px tall). A page can pass every functional test while shipping unstyled: if a visual change touches the stylesheet, the styles test is the check that catches a missing import.

### Calculator registry (`src/lib/registry.ts`)

- Every calculator is registered exactly once in the central registry: slug, name, category, priority (P0/P1/P2), URL (`/calculators/<slug>/`), related calculators, SEO title/description, and input/output schema reference.
- Pages, navigation, sitemap, category listings, and "related calculators" are all generated from the registry. Never hard-code a calculator list in a page.
- Adding a calculator = add a registry entry + calculator folder + page + tests. If any of those is missing, the calculator is not done.

### Unit engine (`src/lib/units.ts`)

- All unit conversion goes through the single unit engine. Never convert inline in a component or formula (e.g. do not write `* 27` for ft³→yd³ inside a calculator; call the engine).
- Canonical internal units: feet for length, square feet for area, cubic feet for volume, US gallons for liquid volume. Metric inputs are converted to canonical units on entry and converted back for display.
- Conversion constants are named and documented in the engine, with sources in `docs/FORMULAS.md` (e.g. 1 yd³ = 27 ft³; 1 US gal ≈ 3.785411784 L).

### Pure calculation functions (`src/lib/formulas/`)

- One module per calculator, exporting pure functions: same inputs → same outputs, no I/O, no DOM, no `Date.now()`, no randomness.
- Every formula is documented in `docs/FORMULAS.md` with formula, units, rounding rules, limitations, and worked test-case examples.
- Rounding rule: package quantities always round **up** (`Math.ceil`) — a user must never be told to buy less than they need. Displayed quantities round to a sensible precision; keep full precision internally until the final display step.
- Validation: every calculator validates inputs (positive numbers, sane ranges), shows inline errors, and never produces a result from invalid input. Empty input = no result, not zero.

### React islands and props

- **Island props are JSON.** Astro serializes island props, so a prop that carries functions (e.g. a calculator config with `compute` functions) arrives on the client with the functions dropped — the island then throws on hydration. Pass only plain data (a slug string) to an island and resolve anything carrying functions client-side from an imported module.
- **Hydration timing matters.** With `client:visible`, a user can type into the server-rendered inputs before React hydrates, and hydration discards the input. The calculator island uses `client:load` because the calculator is the page's main above-fold content; the island sets `data-hydrated="true"` after hydration so tests can wait for it deterministically.

### Calculator UI (shared pattern)

- Imperial + metric input toggle; waste allowance input (default per calculator, user-editable); coverage / density / yield fields editable with a cited reference value shown next to them.
- Optional price inputs → cost estimate. No price entered = no cost shown (never invent a price).
- Formula shown on the page ("How this is calculated"), Reset button, copyable shopping list output.
- Mobile-first responsive layout; results update live as inputs change; keyboard accessible.

### Content and copy

- US English spelling throughout (e.g. "customize", "color", "organize"). No placeholder copy ("Lorem ipsum", "Coming soon") on any shipped page.
- Every calculator page has original content: what it calculates, how to measure, worked example, limitations. No doorway pages, no spun/duplicate content.

### Testing

- Every pure formula has Vitest unit tests covering the worked examples in `docs/FORMULAS.md`, boundary cases (zero, negative, very large), and rounding-up behavior.
- Every calculator page has at least one Playwright test: page loads, default calculation renders, invalid input shows an error, reset works.
- A formula's validation status in `docs/FORMULAS.md` is "to be validated by unit tests in Phase 5" until its tests actually run and pass. Never claim a test passed that did not run.

### SEO

- Titles, descriptions, canonicals, breadcrumbs, Open Graph, and structured data come from the registry + page frontmatter. See `docs/SEO-STRATEGY.md`.
- `sitemap.xml` and `robots.txt` are generated/maintained as part of the build; every shipped page must appear in the sitemap.

## What Never To Do

- **No fake data.** No invented prices, coverage rates, product names, test results, traffic numbers, or testimonials. If a value is a reference/typical value, label it as such with its source.
- **No paid dependencies or paid APIs.** No service that requires a key, subscription, or per-call billing. If a feature seems to need one, redesign it or record it as a deferred decision — do not add it silently.
- **No placeholder pages.** Do not ship a page, calculator, or link that leads to unfinished content. Unfinished work stays off the nav and out of the sitemap.
- **No backend, database, login, or registration.** User data lives only in the user's own browser (LocalStorage), and only when they opt in by saving a project.
- **No tracking beyond what the privacy policy discloses.** AdSense is disabled by default; do not enable ad or analytics scripts without an owner decision recorded in `docs/DECISIONS.md`.
- **No claims without evidence.** Do not write "tested", "verified", "accurate to X%", or performance numbers unless the test or measurement actually ran and is recorded in `docs/QA-REPORT.md`.
- **No Traditional Chinese or other-language copy** in the shipped site; US English only.
- **Do not change the fixed architecture** (Astro, React Islands, Tailwind, pure-TS calc, Cloudflare Pages) without an ADR.
