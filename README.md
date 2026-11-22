# HomeDIYCalc

**Calculate Materials. Estimate Costs. Build Your Shopping List.**

HomeDIYCalc is a free online home improvement / DIY / construction material calculator website for the US market (secondary: UK, Canada, Australia, New Zealand). No registration, no login, no backend, no paid API, no database. Every calculator runs entirely in the browser.

## Features

- **25 calculators** across 6 categories: Concrete and Masonry, Painting, Flooring and Tiles, Landscaping, Measurement, Interior and Maintenance.
- **Imperial + metric** inputs on every calculator, with a unified unit conversion engine.
- **Waste allowance** on every material calculator, plus editable coverage / density / yield values with cited reference values.
- **Package quantities rounded up** — you are never told to buy less than you need.
- **Optional cost estimates** — enter your local prices and get a total; no price entered means no invented cost.
- **Formulas shown on every page** so users can check the math.
- **Copyable shopping list** and an optional **My Project** planner, saved only in the user's own browser (LocalStorage).
- **Mobile-first, fast, static** — Astro static site generation, React Islands for interactivity, Tailwind CSS, SVG diagrams.
- **SEO-ready** — unique titles/descriptions, canonicals, sitemap, breadcrumbs, structured data. See `docs/SEO-STRATEGY.md`.

## The 25 Calculators

| Priority | Calculators |
|---|---|
| P0 | Concrete, Square Footage, Paint, Gravel, Mulch, Concrete Slab, Cubic Yard, Cubic Feet, Tile, Brick |
| P1 | Drywall, Concrete Bags, Flooring, Paver, Topsoil, Grout, Board Foot, Mortar |
| P2 | Ceiling Tile, Tile Adhesive, Primer, Wallpaper, Sealant, Waterproofing, Baseboard |

URLs follow `/calculators/<slug>/` (e.g. `/calculators/concrete-calculator/`).

## Tech Stack

- **Astro** — static site generation
- **TypeScript (strict)** — all logic, including pure calculation functions
- **React Islands** — interactive calculators, hydrated only where needed
- **Tailwind CSS** — styling
- **Vitest** — unit tests for calculation functions
- **Playwright** — browser tests
- **Cloudflare Pages (free)** — hosting
- **GitHub** — version control

No backend, no database, no paid API. No external API is required by any calculator.

## Local Setup

```bash
git clone https://github.com/silver-comet-76/homediycalc
cd homediycalc
npm install
npm run dev
```

Open the local dev URL shown in the terminal (Astro default: `http://localhost:4321`).

## Build and Deploy

```bash
npm run build      # production static build
npm run preview    # preview the production build locally
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright browser tests
```

Deployment is to Cloudflare Pages (free tier), via Git integration or manual upload. Full steps: `docs/DEPLOYMENT.md`. Do **not** purchase a domain for this project.

## Documentation Index

| Document | Contents |
|---|---|
| `AGENTS.md` | Project operating notes: stack, commands, conventions, what never to do |
| `docs/PRD.md` | Full product requirements: objectives, users, business rules, all 25 calculators, functional requirements, site structure, SEO, phases, acceptance criteria |
| `docs/ARCHITECTURE.md` | Astro SSG structure, TypeScript strict config, React Islands, registry, unit engine, pure functions, LocalStorage, testing, deployment |
| `docs/ROADMAP.md` | Phases 0–6 with scope and exit criteria |
| `docs/SEO-STRATEGY.md` | US English intent, static HTML, titles/descriptions, canonicals, sitemap, structured data, internal linking, Search Console |
| `docs/DECISIONS.md` | Architecture decision records (ADR-style) |
| `docs/DEPLOYMENT.md` | Cloudflare Pages deployment, build command, custom domain notes, ads.txt, Search Console |
| `docs/FORMULAS.md` | Documented formulas for all 25 calculators, with worked test-case examples |
| `docs/QA-REPORT.md` | QA report: test plan, acceptance checklist, Phase 1–6 results, and the ADR-9 release-gate record (passed 2026-11-20) |
| `docs/PHASE-REPORT.md` | Phase reports for Phases 0–6 |

## Status

**Phase 7 (independent audit and remediation) — audit and remediation complete, ADR-9 re-gate passed; on GitHub as PR #2, awaiting re-review.** See `docs/PHASE-REPORT.md` Phase 7 and `docs/QA-REPORT.md` §13. The audit ordered by GitHub Issue #1 found 11 major and 19 minor formula defects across 18 of 25 calculators (7 passed) plus 6 accessibility findings, a no-op lint script, 24 stale statements, and category pages thinner than documented — all fixed on the `phase-7` branch with 54 new regression tests (Vitest 258/258, Playwright 76/76, typecheck 0/0/0, lint passes, 40 pages built — 39 indexable + custom 404 — Lighthouse Home 100/100/100/83 every round and Paint Performance 98–100 across rounds, 3 consecutive clean gate rounds, re-gated after the review response). The branch is on GitHub (snapshot commit `43ce2bf`, pushed 2026-11-22); PR #2 (`phase-7` → `main`) is open and the Issue #1 summary comment is posted. The reviewer returned REQUEST_CHANGES on PR #2 (review 6009535299, 2026-11-22): the mortar-bag method now follows the manufacturer count rating (18 bags, not 9, for the worked example), `ceilUp` can no longer recommend zero packages for a positive requirement, and the gate scripts are committed in the repo — see `docs/QA-REPORT.md` §13.4. Nothing is deployed anywhere — no Cloudflare account, no Pages project, no domain; the code is on GitHub at https://github.com/silver-comet-76/homediycalc (main at snapshot 34b917a8, pushed 2026-11-21). ADR-9 passed on 2026-11-20 at commit ca29ba1, again on 2026-11-21 after the Phase 7 remediation, and again on 2026-11-22 after the PR #2 review response (3 consecutive clean full test rounds each time); the release gate is met. See `docs/QA-REPORT.md` §13.4 for the review-response re-gate.

## Contributing

Follow `AGENTS.md`. In short: pure functions for calculations, everything through the unit engine and calculator registry, US English, no fake data, no paid dependencies, no placeholder pages, and tests for every formula.
