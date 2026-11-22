# Phase Report — HomeDIYCalc

> Note 2026-11-21: the repo now exists at https://github.com/silver-comet-76/homediycalc, main at snapshot 34b917a8; the per-phase 'not pushed' rows below describe the state at the time of each phase.

> One section per phase. Phase 0 is filled in below. Later phases are empty stubs until that phase's work is done and its exit criteria are checked against evidence.

## Phase 0 — Planning and Documentation

### 1. Objectives

Produce the complete planning and documentation set for HomeDIYCalc before any code is written: project operating notes, README, full PRD, architecture, roadmap, SEO strategy, architecture decision records, deployment plan, documented P0 formulas, initial QA report, and this phase report — all honest about what is and is not done.

### 2. Status

**Complete.** All 11 documentation files were written in Phase 0. No code was written, no build was run, and no tests were executed in this phase (by design — Phase 0 is documentation only).

### 3. Completed Work

| # | File | Contents |
|---|---|---|
| 1 | `AGENTS.md` | Project operating notes: fixed stack, commands, conventions (registry, unit engine, pure formulas), what never to do |
| 2 | `README.md` | Project overview, stack, features, 25 calculators, local setup, build/deploy, docs index |
| 3 | `docs/PRD.md` | Full product requirements: objectives, users, business rules, 25 calculators with priorities, functional requirements, shopping list/project planner, site structure, UI/UX, SEO, AdSense, security/privacy/performance, phases, acceptance criteria |
| 4 | `docs/ARCHITECTURE.md` | Astro SSG structure, TypeScript strict, React Islands, registry, unit engine, pure functions, LocalStorage, testing strategy, Cloudflare Pages deployment, no-backend constraint |
| 5 | `docs/ROADMAP.md` | Phases 0–6 with scope per phase and exit criteria |
| 6 | `docs/SEO-STRATEGY.md` | US English intent, static HTML, titles/descriptions, canonicals, sitemap, robots.txt, breadcrumbs, Open Graph, structured data, internal linking, Search Console verification |
| 7 | `docs/DECISIONS.md` | 8 ADRs: Astro over Next.js, React Islands, no backend/DB, Tailwind, Vitest+Playwright, Cloudflare Pages, LocalStorage-only persistence, ads disabled by default |
| 8 | `docs/DEPLOYMENT.md` | Cloudflare Pages deployment (Git + manual), build command, custom domain notes (do not purchase a domain), ads.txt, Search Console setup |
| 9 | `docs/FORMULAS.md` | Documented formulas for the 10 P0 calculators with formula, units, rounding rules, limitations, worked examples; all marked "to be validated by unit tests in Phase 5" |
| 10 | `docs/QA-REPORT.md` | Initial report: no tests have run yet, test plan, acceptance criteria checklist (unchecked), environments to test |
| 11 | `docs/PHASE-REPORT.md` | This file; Phase 0 section filled, later phases as stubs |

### 4. Approach

- Worked from the project brief as the single source of requirements: 25 calculators with P0/P1/P2 priorities, 6 categories, fixed architecture (Astro, TypeScript strict, React Islands, Tailwind, pure-TS calc, Vitest, Playwright, Cloudflare Pages), no backend/login/paid API/database, US market primary, US English throughout.
- Each document was written to be self-contained and cross-referenced (PRD ↔ Architecture ↔ Roadmap ↔ Formulas ↔ QA) so a later phase can be executed from these docs alone.
- Honesty rule applied throughout: no claimed test results, no invented metrics, no placeholder functionality presented as done. Every formula is explicitly marked as not yet validated by tests; every acceptance criterion is unchecked.

### 5. Decisions

- All architecture decisions were recorded as ADRs in `docs/DECISIONS.md` (ADR-1 through ADR-8), including the alternatives considered for each.
- AdSense disabled by default (ADR-8); enabling it later requires an owner decision and a new ADR.
- No domain to be purchased for this project (recorded in PRD, Roadmap, and Deployment docs).
- Contact page must not present a fake submitting form until a backend is chosen (PRD §7, Architecture §12).
- Reference values in `docs/FORMULAS.md` that lack a confirmed source (paint coverage ~350 ft²/gal, gravel density ~2,800 lb/yd³, modular brick size, slab waste default 10%, quarter-yard rounding) are explicitly marked "to be confirmed" in Phase 2 rather than stated as fact.

### 6. Test Results

**None.** No tests were run in Phase 0 — there is no code to test. No test result is claimed anywhere in the Phase 0 documentation.

### 7. Outstanding Issues

- Reference values in `docs/FORMULAS.md` need named sources confirmed in Phase 2 (paint coverage, gravel density, brick size, slab waste default, quarter-yard rounding convention).
- Open architecture questions deferred to Phase 1 (see `docs/ARCHITECTURE.md` §13): dynamic route vs. one file per calculator page, `client:load` vs. `client:visible` default, exact LocalStorage key, `astro check` vs. `tsc`, sitemap generation approach.
- Repository state at end of Phase 0 (verified by the coordinator): local git repo initialized in the workspace (`main` branch, identity 和香 / itgaminglim@gmail.com, repo-local only), Phase 0 files committed locally only — NOT pushed. No remote configured: creating `silver-comet-76/homediycalc` on GitHub via the connector failed with 403 "Resource not accessible by integration" because the Muse GitHub App installation is not finished (the user authorized OAuth but has not completed the repository-selection step). Creating the repo is blocked on that step; fallback is the browser web-UI route. No code was pushed anywhere in Phase 0.

### 8. Deviations

None. The brief's fixed architecture, 25-calculator list, URL pattern, categories, and main pages were followed as specified.

### 9. Risks / Assumptions

- **Assumption:** the brief's fixed architecture (Astro, React Islands, Tailwind, Cloudflare Pages) is final; changing it requires an ADR and owner approval.
- **Risk:** reference values marked "to be confirmed" could shift calculator defaults in Phase 2; the docs are written so defaults are editable fields, limiting the blast radius.
- **Risk:** the Contact page has no backend by design; if the owner expects a working form at launch, that decision must be made before Phase 3, or the page ships with an email address instead.
- **Assumption:** US English and imperial-default/metric-toggle behavior match the target users; to be validated against real usage after launch, not before.

### 10. Next Steps

1. Phase 1 — project scaffold: initialize Astro + TypeScript strict + React + Tailwind; set up scripts, base layout, unit engine with tests, calculator registry with all 25 entries.
2. In Phase 1, confirm the open architecture questions listed in §7 and the repo/GitHub remote state.
3. In Phase 2, confirm the "to be confirmed" reference values in `docs/FORMULAS.md` against named sources before the P0 calculators ship with those defaults.

### 11. Decisions Needing Owner Approval

- None arising from Phase 0 itself. Standing items that will need an owner decision later (not now): enabling AdSense (Phase 4/6 at the earliest), connecting a custom domain if the owner already owns one (Phase 6), choosing a Contact form backend if a submitting form is ever wanted (before Phase 3).

---

## Phase 1 — Project Scaffold

### 1. Objectives

Scaffold the Astro project with the exact pinned stack from the license audit; build the unit conversion engine (`src/lib/units.ts`) and the centralized calculator registry (`src/lib/registry.ts`) with all 25 calculators; create the shared layout, components, and SEO infrastructure; ship the static foundation pages (Home, All Calculators, 6 category pages, My Project, About, Contact, Privacy Policy, Terms of Use, Disclaimer); add Vitest unit tests and a Playwright smoke test; verify build, tests, and strict typecheck all pass; resolve the ARCHITECTURE.md §13 open questions with what was actually built.

### 2. Status

**Complete.** All 11 items in the Phase 1 scope are done and verified on 2026-11-20 (Node v24.22.1). `npm run build` succeeds (fully static, 14 pages in `dist/`), `npm run test` passes 52/52, `npm run test:e2e` passes 4/4 (Chromium desktop + mobile), `npm run typecheck` passes with 0 errors across 27 files. No calculator pages exist yet — those are Phases 2–3 — and no page links to a calculator page that does not exist.

### 3. Completed Work

| # | Item | Evidence |
|---|---|---|
| 1 | Astro scaffold with exact pinned dependencies | `package.json` pins astro 7.4.13, @astrojs/react 7.1.9, react/react-dom 19.3.1, tailwindcss/@tailwindcss/vite 4.3.5, typescript 6.0.3, vitest/@vitest/coverage-v8 5.1.1, @playwright/test 1.65.1, jsdom 31.0.1, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @types/react/@types/react-dom 19.3.0 — no `^` ranges. `npm install` added 283 packages. `@testing-library/jest-dom` deliberately **not** installed per the Phase 1 task (its v8.0.0 stable release now exists, but the task instruction took precedence; component tests use plain Vitest matchers). |
| 2 | Unit conversion engine | `src/lib/units.ts` — canonical units ft / ft² / ft³ / US gal; named documented constants (1 yd³ = 27 ft³, 1 US gal = 3.785411784 L, 1 ft = 0.3048 m, 1 in = 25.4 mm); length/area/volume conversions both directions, imperial↔metric, round-trip quantity preservation; `roundForDisplay` for display-only rounding. |
| 3 | Calculator registry | `src/lib/registry.ts` — all 25 calculators (slug, name, category, priority, URL `/calculators/<slug>/`, phase, related calculators, SEO title/description, summary) and all 6 categories with descriptions and SEO metadata. 10 P0, 8 P1, 7 P2. Registry tests assert completeness, uniqueness, URL pattern, and that every related slug resolves. |
| 4 | Shared layout + components | `src/components/Layout.astro` (header with nav + search box, footer), `SEO.astro` (title, meta description, canonical, Open Graph, Twitter card, BreadcrumbList + FAQPage JSON-LD), `Breadcrumbs.astro`, `CalculatorShell.astro` (calculator page layout for Phases 2–4), `Faq.astro`, `AdSlot.astro` (renders nothing — ads disabled, ADR-8), React `CalculatorInputs.tsx` (`NumberInput` with inline validation, `UnitToggle`, `ResultPanel`). Tailwind v4 CSS-first via `@tailwindcss/vite`; no `tailwind.config.js`. |
| 5 | Pages (static) | Home (hero with the exact tagline, category cards, P0 popular calculators, how-it-works, FAQ), All Calculators (searchable/filterable directory generated from the registry, client-side filter script), 6 category pages (dynamic route `src/pages/categories/[slug].astro` from the registry), My Project (honest placeholder: planner arrives in Phase 4, LocalStorage key named), About, Contact (no fake form, no invented email — states plainly there is no contact route yet), Privacy Policy, Terms of Use, Disclaimer (real, complete pages). Calculator entries are shown as plain text with "Arrives in Phase 2/3" badges — no dead links to unimplemented pages anywhere. |
| 6 | SEO infrastructure | Build-time sitemap endpoint `src/pages/sitemap.xml.ts` generated from the registry + static page list (14 URLs; no unshipped calculator URL listed), `public/robots.txt` pointing at `/sitemap.xml`, canonicals on every page (self-referential paths — no domain exists yet, per SEO-STRATEGY.md §3), breadcrumbs with BreadcrumbList JSON-LD on category/all-calculators pages, FAQPage JSON-LD on Home. |
| 7 | Tests | Vitest: 52 tests in 4 files (`units.test.ts` round-trips/boundaries/exact constants, `registry.test.ts`, `project.test.ts`, `CalculatorInputs.test.tsx` jsdom). Playwright: home smoke test — page loads, nav works (Home → All Calculators → category → My Project), no console errors; plus sitemap/robots served — run on Chromium desktop and Pixel 5 mobile viewports against the production build. |
| 8 | Verification | `npm run build` succeeds (14 pages, fully static `dist/`); `npm run test` 52/52 pass; `npm run test:e2e` 4/4 pass; `npm run typecheck` (`astro check`) 0 errors, 27 files. |
| 9 | Docs updated | This Phase 1 section; `docs/QA-REPORT.md` (actual results); `docs/ARCHITECTURE.md` §13 resolved; `docs/LICENSE-AUDIT.md` §7 appendix (license-checker output on the real lockfile); `README.md` status → Phase 1. |
| 10 | LocalStorage key decided | `src/lib/project.ts` — key `homediycalc:project:v1`, schema version 1, guarded serialize/parse (corrupt/wrong-version data returns an empty project, never throws), plain-text shopping-list formatter. Unit-tested. |
| 11 | Committed locally | Committed on branch `main` with repo-local identity 和香 / itgaminglim@gmail.com. **Not pushed** — the GitHub repo does not exist yet (App installation pending; SSH push blocked from this VM). |

### 4. Approach

- Scaffolded with a hand-written `package.json` (exact pins) + `astro.config.mjs` instead of the interactive `astro create` flow, to keep versions exact and the install non-interactive.
- Registry-first: every page that lists calculators reads `src/lib/registry.ts`; nothing hard-codes a calculator list.
- Honesty rule for unshipped work: calculator names appear only as non-linked entries with their arrival phase. The sitemap endpoint lists only shipped pages.
- Two real defects were found and fixed during verification: (a) `astro check` needs `@astrojs/check` — see §5; (b) 9 type errors from the breadcrumb prop type requiring `path` on the current-page crumb — fixed by making `path` optional and falling back to the page canonical in JSON-LD. Three test-expectation precision issues (floating-point `toBe` on conversions, one wrong expected value) were fixed in the tests, not by weakening the engine.

### 5. Decisions

- **Typechecking = `astro check`.** Resolves ARCHITECTURE.md §13. Requires `@astrojs/check@0.9.12` (MIT, official Astro package, pinned exact) as a devDependency — the audit listed it as optional, and it was added because `astro check` otherwise prompts interactively and hangs in non-interactive use. Recorded in `docs/LICENSE-AUDIT.md` §7.
- **Dynamic route for category pages** (`src/pages/categories/[slug].astro` with `getStaticPaths` from the registry). Calculator pages will use the same pattern in Phases 2–3 (one dynamic route driven by the registry, not 25 files).
- **Default island hydration = `client:visible`.** No islands exist yet in Phase 1; this is the default for calculator islands in Phases 2–4 (below-fold widgets stay light), with `client:load` only where a specific page justifies it.
- **Sitemap = build-time endpoint** (`src/pages/sitemap.xml.ts`), not the `@astrojs/sitemap` integration (not in the audited pin list) and not hand-maintained `public/sitemap.xml` — the endpoint is generated from the registry, so it cannot drift from the shipped pages.
- **Canonical URLs are self-referential paths** until a domain exists (Phase 6), per SEO-STRATEGY.md §3. No domain was invented.
- **LocalStorage key = `homediycalc:project:v1`**, schema version 1 (see item 10 above).
- **Contact page has no email address.** No real contact address exists and no backend exists, so publishing one would invent a contact route. The page states this plainly.

### 6. Test Results

- **Vitest (`npm run test`):** 52 tests passed, 0 failed, 4 files — `src/lib/units.test.ts` (28 tests), `src/lib/registry.test.ts` (12), `src/lib/project.test.ts` (8), `src/components/react/CalculatorInputs.test.tsx` (4). Duration ~1.7s.
- **Playwright (`npm run test:e2e`):** 4 tests passed, 0 failed — home smoke test (loads, nav, no console errors) and sitemap/robots test, each on Chromium desktop and Pixel 5 mobile, against `npm run preview` (production build). Duration ~9.5s. Chromium Headless Shell 159.0.8154.6 downloaded via `npx playwright install chromium` (free, ~126 MB).
- **Typecheck (`npm run typecheck`, `astro check`):** 0 errors, 0 warnings, 0 hints, 27 files.
- **Build (`npm run build`):** success in ~1.5s; 14 pages (home, calculators index, 6 category pages, my-project, about, contact, privacy-policy, terms-of-use, disclaimer, sitemap.xml) + `robots.txt`, `favicon.svg`, `og-image.svg` in `dist/`.
- **License check (`npx license-checker --summary` on the real lockfile, 367 packages):** MIT 307, ISC 15, Apache-2.0 13, BSD-2/3-Clause 15, BlueOak 4, MPL-2.0 3, CC0 2, 0BSD 2, LGPL-3.0-or-later 2 + 1 mixed (sharp/libvips build-time binaries only — see §7), UNLICENSED 1 (the project itself, private). No GPL/AGPL, no paid dependency. Full output in `docs/LICENSE-AUDIT.md` §7.

### 7. Outstanding Issues

- **LGPL in the transitive tree.** The audit expected no GPL-family licence, but `license-checker` found LGPL-3.0-or-later in 3 packages: `@img/sharp-libvips-linux-x64`, `@img/sharp-libvips-linuxmusl-x64`, and `@img/sharp-wasm32` (also Apache-2.0/MIT). These are precompiled libvips binaries behind `sharp`, a transitive dependency of Astro's image tooling. They are build-time only — the site uses no Astro `<Image>` and ships no libvips code in `dist/` — and are used unmodified, which LGPL permits. No action required; recorded in `docs/LICENSE-AUDIT.md` §7 rather than hidden.
- **Project license undecided.** `package.json` has `"private": true` and no license field (hence the UNLICENSED entry). An owner decision on the project license is still open.
- **No domain, no deployment, no GitHub repo yet.** Canonicals are relative paths; Cloudflare Pages Node version (`NODE_VERSION=24` recommended) is unverified until the Pages project exists; the repo remains local-only (see Phase 0 §7 for the GitHub App blocker).
- **Jest-dom v8 now exists** (`npm view` returned 8.0.0 on 2026-11-20) but was not installed per the Phase 1 task instruction. Revisit in a later phase if jest-dom matchers are wanted.

### 8. Deviations

- One dependency beyond the license audit's pin list: `@astrojs/check@0.9.12` (MIT) — required for `astro check` to run at all (see §5). Pinned exact; no other version drifted from the audit.
- `astro.config.mjs` sets no `site` URL (no domain exists); canonicals are paths, as the SEO strategy allows until Phase 4/6.

### 9. Risks / Assumptions

- **Assumption:** the Phase 1 task instruction (do not install jest-dom) overrides the audit's conditional "install v8.x if stable" — v8.0.0 stable now exists, but it was left out. If a later phase wants it, it can be added with a one-line pin.
- **Risk:** `@astrojs/check` is an additional devDependency to keep in sync with Astro upgrades; it is official and MIT, so the risk is low.
- **Assumption:** relative canonicals are acceptable pre-domain (per SEO-STRATEGY.md §3); they must be replaced with absolute URLs once a domain exists in Phase 6.

### 10. Next Steps

1. Phase 2 — P0 calculators (10): registry-driven calculator pages, formula modules with worked examples from `docs/FORMULAS.md`, React islands (`client:visible` default), per-calculator tests (Vitest + Playwright), and sitemap entries for each shipped calculator page.
2. Confirm the "to be confirmed" reference values in `docs/FORMULAS.md` against named sources before P0 calculators ship with those defaults.
3. Decide the project license (see §7) and record it in `package.json` + `docs/DECISIONS.md`.

### 11. Decisions Needing Owner Approval

- None arising from Phase 1 itself. Standing items needing an owner decision later (not now): project license; enabling AdSense (Phase 4/6 at the earliest); connecting a custom domain if the owner already owns one (Phase 6); choosing a Contact form backend if a submitting form is ever wanted (before Phase 3).

---

## Phase 2 — P0 Calculators (10)

### 1. Objectives

Build and test the ten P0 calculators: registry-driven pages, pure formula modules with worked examples from `docs/FORMULAS.md`, React islands (`client:load`), per-calculator Vitest + Playwright tests, and sitemap entries for each shipped page. Confirm every "to be confirmed" reference value in `docs/FORMULAS.md` against a named source before shipping it as a default. No new dependency unless recorded in `docs/LICENSE-AUDIT.md`.

### 2. Status

**Complete.** All 11 items in the Phase 2 scope are done and verified on 2026-11-20 (Node v24.22.1). `npm run build` succeeds (24 pages in `dist/`, all 10 new calculator pages + sitemap entries), `npm run test` passes 104/104, `npm run test:e2e` passes 26/26 (Chromium desktop + Pixel 5 mobile), `npm run typecheck` passes with 0 errors. No new dependency was added.

### 3. Completed Work

| # | Item | Evidence |
|---|---|---|
| 1 | Reference values confirmed with named sources | `docs/FORMULAS.md` §11 (new): paint coverage 350 ft²/gal (Sherwin-Williams SuperPaint data sheet, low end of 350–400); QUIKRETE No. 1101 bag yields 0.30/0.45/0.60 ft³; gravel 2,800 lb/yd³ (range 2,400–3,000); mulch density **not** confirmed to a single figure (400–800 lb/yd³ range) so no density is assumed; standard mulch bag 2 ft³; BIA TN10 modular brick 7⅝×2¼×3⅝ in, ⅜ in joint, 675/100 ft², mortar 8.1 ft³/1,000 bricks; QUIKRETE mortar 37 bricks per 80 lb bag; concrete waste 10% default; quarter-yard ordering convention. Every default is editable on its page with the source named next to the field. |
| 2 | Pure formula modules (10) | `src/lib/formulas/<slug>.ts` — concrete, square-footage, paint, gravel, mulch, concrete-slab, cubic-yard, cubic-feet, tile, brick. All pure (same inputs → same outputs), all conversion through `src/lib/units.ts`. |
| 3 | Vitest formula tests (10 files, 52 new tests) | `src/lib/formulas/<slug>.test.ts` — every worked example in `docs/FORMULAS.md`, boundary cases (zero, large), and rounding-up behavior. Total suite now 104 tests in 14 files, all passing. |
| 4 | Shared calculator island | `src/components/react/GenericCalculator.tsx` + `src/components/react/CalculatorConfig.ts` — one island drives all ten calculators from per-calculator configs: imperial/metric toggle (converts entered values, never clears them), per-field unit pickers where needed, validation with inline errors, live results, Reset, copyable shopping list, Add to Project (LocalStorage via `src/lib/project.ts`). `src/lib/validation.ts` holds the shared validation rules. |
| 5 | Per-calculator configs (10) | `src/calculators/<slug>/config.ts` — input modes, field specs with defaults/hints/sources, formula, how-to-measure, worked example, limitations, FAQ (3–4 each). Modes differentiate genuinely similar tools: paint has Room vs Known-area; square footage has Rectangle/Circle/Triangle/L-shape; cubic yard has Convert vs Dimensions; cubic feet has per-dimension unit pickers; slab adds thickness presets, thickened edge, and mesh sheets; tile adds grout-joint allowance; brick adds mortar volume + bags. |
| 6 | Registry-driven calculator pages | `src/pages/calculators/[slug].astro` (dynamic route, per ARCHITECTURE.md §13 — not 10 static files; output URLs are identical: `/calculators/<slug>/`). `CalculatorShell.astro` supplies title, intro, formula, FAQ, and related calculators from the registry. Home, All Calculators, and category pages now link the 10 shipped calculators; P1/P2 entries stay unlinked. |
| 7 | Sitemap | `src/pages/sitemap.xml.ts` now lists the 10 shipped calculator URLs (24 URLs total); no unshipped P1/P2 URL is listed. |
| 8 | My Project save flow | `src/lib/project.ts` gained guarded `loadProject` / `addItemToProject` / `removeItemFromProject` / `clearProject` (LocalStorage, key `homediycalc:project:v1`). Every calculator island has Add to Project; `src/pages/my-project.astro` now lists saved items with remove/clear/copy instead of the Phase 4 placeholder text. |
| 9 | Tests | Vitest 104/104 (see §6); Playwright 26/26 — one test per calculator (loads, default result renders, invalid input shows an error and hides results, Reset restores, Add to Project saves to LocalStorage) on Chromium desktop + Pixel 5 mobile, plus home smoke and sitemap tests. |
| 10 | Docs updated | This Phase 2 section; `docs/FORMULAS.md` (§11 confirmed values, all 10 P0 validation statuses now "validated by Vitest in Phase 2"); `docs/QA-REPORT.md` (actual results + defects found/fixed); `README.md` status → Phase 2; `AGENTS.md` (island-props lesson, see §5). |
| 11 | Committed locally | Committed on branch `main` with repo-local identity 和香 / itgaminglim@gmail.com. **Not pushed** — no remote exists yet; the GitHub repo creation is still blocked on the App installation (see Phase 0 §7). |

### 4. Approach

- Config-driven islands: one `GenericCalculator` component plus one data config per calculator, instead of ten near-identical islands. Shared behavior (unit toggle, validation, reset, copy, save) is implemented once and therefore identical everywhere; per-calculator differences live in the config and the pure formula module.
- Reference values first: every Phase 0 "to be confirmed" value was checked against a manufacturer or technical source (Sherwin-Williams data sheets, QUIKRETE data sheets, BIA Technical Note 10) before any calculator shipped with it. Mulch density could not be confirmed to a single figure, so the calculator assumes none — a weight appears only when the user enters a density.
- Worked examples as tests: each formula's Vitest file asserts the exact worked example in `docs/FORMULAS.md`, so the docs and the code cannot drift apart silently.

### 5. Decisions

- **Dynamic route for calculator pages** (`src/pages/calculators/[slug].astro` with `getStaticPaths` from the config map), per ARCHITECTURE.md §13 — not the 10 static `index.astro` files the Phase 2 task text suggested. Output URLs are identical; the registry-driven route cannot drift from the shipped set.
- **`client:load` for calculator islands, not the `client:visible` default.** The calculator is the page's main, above-fold content, and lazy hydration created a real race: users (and tests) could type into the server-rendered inputs before React hydrated, and React then discarded the input. `client:load` hydrates immediately.
- **Island props are JSON — never pass functions or objects carrying them.** Astro serializes island props; the first build passed the whole config (including `compute` functions) as a prop, which silently dropped the functions on hydration and broke every calculator island. The island now receives only a slug string and resolves its config client-side from the imported config map. Recorded in `AGENTS.md`.
- **Floating-point-safe round-up (`ceilUp` in `src/lib/units.ts`).** `Math.ceil(100 × 1.10)` is 111 in binary floating point (110.00000000000001). All package quantities now use `ceilUp`, which tolerates 1e-9 of noise and normalizes −0 to 0.
- **Per-field canonical units (`canonicalUnit` on field specs).** The unit engine's canonical length is feet, but tile and brick formulas take inches. Fields whose formula expects inches declare `canonicalUnit: "in"`; the island converts display units to that unit via the engine. No inline conversion anywhere.
- **My Project listing shipped early.** Add to Project needed a real destination, so the My Project page now lists saved items (remove/clear/copy) in Phase 2 instead of waiting for Phase 4. The full Phase 4 scope (SEO/content) is unchanged.
- **Quarter-yard rounding is a supplier convention, not a rule.** The concrete/slab calculators default to quarter-yard rounding and offer whole-yard rounding as a choice, with the source named.
- **No new dependency.** `package.json` is unchanged; nothing was added to `docs/LICENSE-AUDIT.md` because there is nothing to record.

### 6. Test Results

- **Vitest (`npm run test`):** 104 tests passed, 0 failed, 14 files — 52 pre-existing (units 28, registry 12, project 8, CalculatorInputs 4) + 52 new formula tests (concrete 6, square-footage 5, paint 6, gravel 5, mulch 5, concrete-slab 4, cubic-yard 6, cubic-feet 4, tile 5, brick 6). Duration ~4s.
- **Playwright (`npm run test:e2e`):** 26 tests passed, 0 failed — 10 calculator tests × 2 viewports (loads, default result renders, invalid input shows an inline error and hides results, Reset restores the default result, Add to Project saves to LocalStorage with no console errors) + home smoke + sitemap tests, against `npm run preview` (production build). Duration ~16s.
- **Typecheck (`npm run typecheck`, `astro check`):** 0 errors, 0 warnings, 0 hints.
- **Build (`npm run build`):** success in ~1s; 24 pages (14 foundation + 10 calculator pages) + sitemap.xml with 24 URLs.
- **Spot checks (manual, via Playwright probe):** tile defaults render 108 tiles / 11 boxes for 100 ft² with 12×12 in tiles, ⅛ in joint, 10% waste; brick defaults render 576 bricks, 18 mortar bags, 5.34 ft³ mortar for the 10×8 ft modular wall — both matching the `docs/FORMULAS.md` worked examples. (Note 2026-11-21, Phase 7: corrected to 9 mortar bags and 5.09 ft³ — see `docs/QA-REPORT.md` §13. Note 2026-11-22, PR #2 review response: the 9-bag volume figure was wrong and the bag count is now 18 from the manufacturer rating — see `docs/QA-REPORT.md` §13.4.)

### 7. Outstanding Issues

- **No domain, no deployment, no GitHub repo yet.** Canonicals are relative paths; the repo remains local-only (App installation pending — see Phase 0 §7). Unchanged from Phase 1.
- **Project license undecided** (`package.json` has no license field; `"private": true`). Unchanged from Phase 1.
- **No Lighthouse measurement yet** (Phase 5). No performance number is claimed for the calculator pages.
- **No SVG measurement diagrams** on calculator pages yet. The PRD lists diagrams as "where helpful"; pages ship with how-to-measure text instead. Diagrams are a Phase 4 content candidate, not a Phase 2 blocker.
- **LGPL in the transitive tree** (sharp/libvips build-time binaries only). Unchanged from Phase 1; see `docs/LICENSE-AUDIT.md` §7.

### 8. Deviations

- Dynamic route instead of 10 static `index.astro` files (see §5 — ARCHITECTURE.md §13 already decided this; output URLs identical).
- `client:load` instead of the `client:visible` default (see §5 — justified: the calculator is the page's main above-fold content, and lazy hydration discarded user input typed before hydration).
- My Project listing implemented in Phase 2 rather than Phase 4 (see §5 — Add to Project needed a real destination).
- No new dependency; `package.json` unchanged.

### 9. Risks / Assumptions

- **Assumption:** the Sherwin-Williams 350–400 ft²/gal range and the QUIKRETE/BIA figures remain the right defaults for the target user; every one is editable on the page and labeled with its source, so a wrong default costs the user one field edit, not a wrong order.
- **Risk:** the shared-island design means a bug in `GenericCalculator` affects all ten calculators at once. Mitigation is the per-calculator Playwright test plus the formula-level Vitest tests, both of which run on every change.
- **Assumption:** quarter-yard rounding and the 10% concrete waste default match most US suppliers; both are editable, and the whole-yard option is offered.

### 10. Next Steps

1. Phase 3 — P1 + P2 calculators (15): same config-driven pattern; add the remaining configs, formulas, and tests; My Project is already live, so Phase 3 focuses on the calculators.
2. Phase 4 — SEO and content: SVG measurement diagrams for calculator pages, per-page SEO review, Lighthouse measurement.
3. Decide the project license and record it in `package.json` + `docs/DECISIONS.md`.
4. Complete the GitHub App installation so the repo can be created and pushed.

### 11. Decisions Needing Owner Approval

- None arising from Phase 2 itself. Standing items needing an owner decision later (not now): project license; enabling AdSense (Phase 4/6 at the earliest); connecting a custom domain if the owner already owns one (Phase 6); choosing a Contact form backend if a submitting form is ever wanted (before Phase 3).

---

## Phase 3 — P1 Calculators (8)

### 1. Objectives

Build and test the eight P1 calculators — Drywall, Concrete Bags, Flooring, Paver, Topsoil, Grout, Board Foot, Mortar — to the same standard as the P0 calculators: registry-driven pages, pure formula modules with worked examples from `docs/FORMULAS.md`, React islands (`client:load`), per-calculator Vitest + Playwright tests, and sitemap entries for each shipped page. Confirm every reference value against a named source (manufacturer or technical reference) before shipping it as a default; any value that cannot be confirmed stays flagged and editable. No new dependency unless recorded in `docs/LICENSE-AUDIT.md`.

### 2. Status

**Complete (P1 only).** All 11 items in the Phase 3 P1 scope are done and verified on 2026-11-20 (Node v24.22.1). `npm run build` succeeds (32 pages in `dist/`, all 8 new calculator pages + sitemap entries), `npm run test` passes 145/145, `npm run test:e2e` passes 42/42 (Chromium desktop + Pixel 5 mobile), `npm run typecheck` passes with 0 errors. No new dependency was added. The 7 P2 calculators from the original Phase 3 roadmap scope are **not** done — see §8 (deviation).

### 3. Completed Work

| # | Item | Evidence |
|---|---|---|
| 1 | Reference values confirmed with named sources | `docs/FORMULAS.md` (Phase 3 table, new): drywall 4×8 ft = 32 ft², compound ~100 ft²/gal (Level 4; USG ~2 × 4.5 gal pails per 1,000 ft²), screws ~28 wall / ~35 ceiling per sheet, tape ~370 ft per 1,000 ft², door 20 ft² / window 15 ft² deductions; concrete bag yields reused from Phase 2 (QUIKRETE No. 1101, 0.30/0.45/0.60 ft³); flooring box coverage laminate 18–24 / vinyl plank 18–30 / hardwood 20–25 ft², waste 10% straight / 15% diagonal / 15–20% herringbone, underlayment ~100 ft²/roll; ICPI paver base 4 in patio / 8 in driveway, bedding sand 1 in, 20% compaction loss (order 1.25×), bedding sand 2,750 lb/yd³, joint sand 100 lb/ft³; topsoil density **not** confirmed to a single figure (2,000–3,400 lb/yd³ range) so the default 2,000 lb/yd³ is labeled loose/dry and editable, bag 0.75 ft³; grout density 98.5 lb/ft³ (MAPEI Ultracolor Plus FA chart within 2%); board foot = T×W×L÷12, nominal dimensions for softwood (NIST PS 20-25); ASTM C270 mortar ratios N 1:1:6, S 1:½:4½, M 1:¼:3¾, O 1:2:9; mortar bag yield ~0.6 ft³ per 80 lb bag; BIA mortar 8.1 ft³ per 1,000 bricks, waste 15–25%. Every default is editable on its page with the source named next to the field. |
| 2 | Pure formula modules (8) | `src/lib/formulas/<slug>.ts` — drywall, concrete-bags, flooring, paver, topsoil, grout, board-foot, mortar. All pure (same inputs → same outputs), all conversion through `src/lib/units.ts`, package quantities via `ceilUp`. |
| 3 | Vitest formula tests (8 files, 41 new tests) | `src/lib/formulas/<slug>.test.ts` — every worked example in `docs/FORMULAS.md`, boundary cases (zero, large), and rounding-up behavior. Total suite now 145 tests in 22 files, all passing. |
| 4 | Shared calculator island | Unchanged — the Phase 2 `GenericCalculator` + `CalculatorConfig` drive all eight new calculators from their configs with no island changes. One fix during Phase 3: three configs needed `FieldSpec[]` annotations on their shared field arrays so `kind` did not widen to `string` under strict mode (see `docs/QA-REPORT.md` §4.4). |
| 5 | Per-calculator configs (8) | `src/calculators/<slug>/config.ts` — input modes, field specs with defaults/hints/sources, formula, how-to-measure, worked example, limitations, FAQ (3–4 each). Modes differentiate genuinely similar tools: drywall has Room dimensions vs Known area (walls and ceilings counted separately, with different screw rates); concrete bags has Known volume vs Dimensions and is bag-first (the Concrete Calculator is volume-first/ready-mix); flooring has Room dimensions vs Known area with optional plank count and underlayment toggle; paver has Patio dimensions vs Known area with base/bedding/joint sand as ordering information; topsoil has Area and depth vs Known volume; grout has Room dimensions vs Known area with joint-depth input; board foot is a single measurement mode with piece count; mortar has Wall dimensions vs Known area with a unit-type select (brick/block) and a mortar-type select (N/S/M/O) for the site-mix breakdown. |
| 6 | Registry-driven calculator pages | No new page files — the existing dynamic route `src/pages/calculators/[slug].astro` renders the 8 new configs automatically. Registry entries for all 8 P1 slugs already existed (Phase 1); `src/calculators/index.ts` now maps them to configs, so Home, All Calculators, and category pages link them and `getRelatedCalculators` cross-links them. |
| 7 | Sitemap | `src/pages/sitemap.xml.ts` now lists the 8 shipped P1 calculator URLs (32 URLs total); no unshipped P2 URL is listed. |
| 8 | My Project save flow | Unchanged — Add to Project on every new calculator page saves to `homediycalc:project:v1`, covered by the per-calculator Playwright tests (save step). |
| 9 | Tests | Vitest 145/145 (see §6); Playwright 42/42 — one test per calculator (loads, default result renders, invalid input shows an error and hides results, Reset restores, Add to Project saves to LocalStorage) on Chromium desktop + Pixel 5 mobile, plus home smoke and sitemap tests. |
| 10 | Docs updated | This Phase 3 section; `docs/FORMULAS.md` (Phase 3 reference table, §§11–18 for the eight P1 formulas, all validated by Vitest in Phase 3; the ambiguous "see §11" references in the P0 sections now point at the Phase 2 reference table by name); `docs/QA-REPORT.md` (actual results + defects found/fixed); `README.md` status → Phase 3. |
| 11 | Committed locally | Committed on branch `main` with repo-local identity 和香 / itgaminglim@gmail.com. **Not pushed** — no remote exists yet; the GitHub repo creation is still blocked on the App installation (see Phase 0 §7). |

### 4. Approach

- Same config-driven pattern as Phase 2: one shared island, one config + one pure formula module + one test file per calculator. No island changes were needed — the eight calculators fit the existing field kinds (including `select` with numeric option values for sheet size, unit type, and mortar type).
- Reference values first: every P1 default was checked against a manufacturer or technical source (USG/ASTM C840/GA-216 for drywall, ICPI Tech Spec 2/4 for pavers, MAPEI's Ultracolor Plus FA chart for grout, ASTM C270 for mortar ratios, NIST PS 20-25 for board feet) before shipping. Topsoil density could not be confirmed to a single figure, so the calculator defaults to the loose/dry figure and states the range — the same treatment mulch density got in Phase 2.
- Worked examples as tests: each formula's Vitest file asserts the exact worked example in `docs/FORMULAS.md`, so the docs and the code cannot drift apart silently. Two test expectations were wrong on first write (grout mosaic ratio, paver joint-sand rounding) and were fixed by re-deriving the arithmetic by hand, not by weakening the formulas.

### 5. Decisions

- **Phase 3 delivers P1 only (8 calculators), not P1+P2 (15).** The roadmap's Phase 3 scope covers all 15 remaining calculators, but the Phase 3 task scoped this phase to the eight P1 calculators. The 7 P2 calculators remain unshipped; their registry entries exist but have no configs, so their URLs do not exist. See §8.
- **Concrete Bags is bag-first, distinct from the Concrete Calculator.** The task required the two to be genuinely distinct: the Concrete Calculator is volume-first and ready-mix focused; the Concrete Bags Calculator takes a volume (or dimensions) and returns the shopping list of bags for all three sizes, with a price comparison and a cheapest-option highlight. Same for Mortar vs. Brick: the Brick Calculator counts bricks with mortar as a secondary output; the Mortar Calculator is mortar-first (volume, bags, site-mix breakdown) for brick or block.
- **Paver base and sand are ordering information, not the shopping list.** The paver count is the purchase; the base gravel (loose volume, with the 1.25× compaction factor), bedding sand, and joint sand are shown as information outputs with their own rows, because under-ordering the base is the common failure.
- **Joint sand and grout are computed from joint volume, not flat coverage rules.** Coverage per bag changes sharply with paver/tile size, so both calculators derive joint volume geometrically from size, joint width, and depth/thickness, with an editable density that reproduces the manufacturer's chart.
- **Topsoil density is a labeled estimate, not a fact.** No single figure is confirmed (2,000–3,400 lb/yd³ by texture and moisture). The calculator defaults to 2,000 lb/yd³ for loose, dry screened topsoil, states the range next to the field, and shows weight only from the density entered.
- **No new dependency.** `package.json` is unchanged; nothing was added to `docs/LICENSE-AUDIT.md` because there is nothing to record.

### 6. Test Results

- **Vitest (`npm run test`):** 145 tests passed, 0 failed, 22 files — 104 pre-existing + 41 new formula tests (drywall 5, concrete-bags 5, flooring 5, paver 5, topsoil 5, grout 5, board-foot 5, mortar 6). Duration ~2s.
- **Playwright (`npm run test:e2e`):** 42 tests passed, 0 failed — 18 calculator tests × 2 viewports (loads, default result renders, invalid input shows an inline error and hides results, Reset restores the default result, Add to Project saves to LocalStorage with no console errors) + home smoke + sitemap tests, against `npm run preview` (production build). Duration ~24s.
- **Typecheck (`npm run typecheck`, `astro check`):** 0 errors, 0 warnings, 1 hint.
- **Build (`npm run build`):** success in ~1s; 32 pages (14 foundation + 18 calculator pages) + sitemap.xml with 32 URLs.
- **Spot checks (manual, via Playwright probe):** drywall defaults render 17 sheets / 2 pails / 1 roll / 483 screws for the 12×12 ft room; concrete bags defaults render 50 × 80 lb bags for 1 yd³ with 10% waste; paver defaults render 207 pavers / 2.96 yd³ loose base / 2 joint-sand bags for the 16×12 ft patio — all matching the `docs/FORMULAS.md` worked examples. (Note 2026-11-21, Phase 7: the paver loose base was corrected to 3.41 yd³ with the 6-in base extension — see `docs/QA-REPORT.md` §13.)

### 7. Outstanding Issues

- **7 P2 calculators not built** (Ceiling Tile, Tile Adhesive, Primer, Wallpaper, Sealant, Waterproofing, Baseboard). Registry entries exist; configs, formulas, tests, and pages do not. A follow-up phase is needed to finish the 25.
- **No domain, no deployment, no GitHub repo yet.** Canonicals are relative paths; the repo remains local-only (App installation pending — see Phase 0 §7). Unchanged from Phase 2.
- **Project license undecided** (`package.json` has no license field; `\"private\": true`). Unchanged from Phase 2.
- **No Lighthouse measurement yet** (Phase 5). No performance number is claimed for the calculator pages.
- **No SVG measurement diagrams** on calculator pages yet. The PRD lists diagrams as "where helpful"; pages ship with how-to-measure text instead. Diagrams are a Phase 4 content candidate, not a Phase 3 blocker.
- **LGPL in the transitive tree** (sharp/libvips build-time binaries only). Unchanged from Phase 2; see `docs/LICENSE-AUDIT.md` §7.

### 8. Deviations

- Phase 3 scope reduced to the 8 P1 calculators (see §5 — the task scoped this phase to P1; the 7 P2 calculators remain for a later phase). The Phase 3 heading in this report and the roadmap's "P1 + P2 (15)" scope no longer match; the roadmap should be updated when the P2 phase is scheduled.
- No new dependency; `package.json` unchanged.
- No island or registry changes beyond adding the 8 configs to `src/calculators/index.ts` — the Phase 2 dynamic route and sitemap endpoint already handled new calculators.

### 9. Risks / Assumptions

- **Assumption:** the USG/ICPI/MAPEI/ASTM figures remain the right defaults for the target user; every one is editable on the page and labeled with its source, so a wrong default costs the user one field edit, not a wrong order.
- **Risk:** the shared-island design means a bug in `GenericCalculator` affects all eighteen calculators at once. Mitigation is the per-calculator Playwright test plus the formula-level Vitest tests, both of which run on every change.
- **Assumption:** the 1.25× base compaction factor and the 100 lb/ft³ joint-sand density match typical US practice; both are editable, and the joint-sand density is validated against the MAPEI-style chart only for grout — paver joint-sand coverage should be checked against the bag's own chart, as the page says.

### 10. Next Steps

1. Follow-up phase — the 7 P2 calculators (Ceiling Tile, Tile Adhesive, Primer, Wallpaper, Sealant, Waterproofing, Baseboard): same config-driven pattern; add the remaining configs, formulas, and tests.
2. Phase 4 — SEO and content: SVG measurement diagrams for calculator pages, per-page SEO review, Lighthouse measurement.
3. Decide the project license and record it in `package.json` + `docs/DECISIONS.md`.
4. Complete the GitHub App installation so the repo can be created and pushed.

### 11. Decisions Needing Owner Approval

- None arising from Phase 3 itself. Standing items needing an owner decision later (not now): project license; enabling AdSense (Phase 4/6 at the earliest); connecting a custom domain if the owner already owns one (Phase 6); choosing a Contact form backend if a submitting form is ever wanted.

---

## Phase 4 — P2 Calculators (7) and Shopping List / Project Planner

### 1. Objectives

Build and test the seven P2 calculators — Ceiling Tile, Tile Adhesive, Primer, Wallpaper, Sealant, Waterproofing, Baseboard — to the same standard as the P0/P1 calculators, complete the Shopping List / Project Planner (My Project) end-to-end, and add SVG measurement diagrams to calculator pages. Confirm every reference value against a named source (manufacturer or technical reference) before shipping it as a default; any value that cannot be confirmed to a single figure stays flagged and editable. No new dependency unless recorded in `docs/LICENSE-AUDIT.md`.

### 2. Status

**Complete.** All 11 items in the Phase 4 scope are done and verified on 2026-11-20 (Node v24.22.1). `npm run build` succeeds (39 pages in `dist/` — 14 foundation + 25 calculator pages — sitemap with 39 URLs), `npm run test` passes 201/201, `npm run test:e2e` passes 60/60 (Chromium desktop + Pixel 5 mobile), `npm run typecheck` passes with 0 errors. No new dependency was added. All 25 calculators are now shipped; there are no unshipped calculator pages left.

### 3. Completed Work

| # | Item | Evidence |
|---|---|---|
| 1 | Reference values confirmed with named sources | `docs/FORMULAS.md` (Phase 4 table, new): Armstrong install guide LA294998 (main beams 4 ft on center, cross tees 2 ft apart, hanger wires 4 ft apart; grid counts cross-checked against published room tables); CUSTOM VersaBond TDS-119 coverage chart (90–100 / 60–67 / 42–47 / 34–38 ft² per 50 lb bag by notch, low ends used); Sherwin-Williams ProBlock primers 400 ft²/gal, PVA drywall primer 250–300 ft²/gal (default 300); primer surface factors and the back-buttering factor labeled **estimating guidance**, not manufacturer figures; US double roll 20.5 in × 33 ft = 56.4 ft², single 28.2 ft², metric 0.53 m × 10 m = 57.1 ft²; sealant 10.1 fl oz = 18.2 in³, 24.3 ft/tube at a 1/4 × 1/4 in bead; RedGard TDS-104 (110 ft²/gal per coat general, 80 ft²/gal IAPMO pan liner, 100 ft²/gal crack prevention), AquaDefense ~210 ft² per 3.5 gal pail over two coats, KERDI 200/10M 108 ft²/roll; baseboard stock 8/12/16 ft, 10% miter waste (15–20% for complex rooms). Every default is editable on its page with the source named next to the field. |
| 2 | Pure formula modules (7) | `src/lib/formulas/<slug>.ts` — ceiling-tile (tiles + geometric grid: main lines, main tees, 4 ft and 2 ft cross tees, wall angle, hangers), tile-adhesive (notch coverage, bag-weight scaling, back-butter factor), primer (surface-condition factor), wallpaper (strip counting with pattern repeat, not area division), sealant (bead-volume method), waterproofing (liquid gallons + sheet rolls), baseboard (net length, piece counts, purchased length). All pure, all conversion through `src/lib/units.ts`, package quantities via `ceilUp`. One engine addition: `CUBIC_INCHES_PER_FLUID_OUNCE` (231/128, exact) in `src/lib/units.ts` for the sealant volume conversion. |
| 3 | Vitest formula tests (7 files, 40 new tests) | `src/lib/formulas/<slug>.test.ts` — every worked example in `docs/FORMULAS.md`, boundary cases (zero, impossible strip fit, narrow room), and rounding-up behavior. Total suite now 201 tests in 30 files, all passing. |
| 4 | Shared calculator island | Unchanged — the Phase 2 `GenericCalculator` + `CalculatorConfig` drive all seven new calculators from their configs with no island changes. One config-type addition: optional `diagram` field (see item 8). |
| 5 | Per-calculator configs (7) | `src/calculators/<slug>/config.ts` — input modes, field specs with defaults/hints/sources, formula, how-to-measure, worked example, limitations, FAQ (3–4 each). Modes differentiate genuinely similar tools: ceiling tile has Room dimensions (tiles + grid) vs Known area (tiles only); primer has Room vs Known area with a surface-condition select; wallpaper has Room vs Known wall length and counts strips, not area; waterproofing has Liquid (dimensions / known area) vs Sheet (rolls); baseboard has Room vs Known wall length with a stock-length select; tile adhesive has Dimensions vs Known area with a trowel-notch select and a back-butter select; sealant is a single joint-length mode with bead width/depth. |
| 6 | Registry-driven calculator pages | No new page files — the existing dynamic route `src/pages/calculators/[slug].astro` renders the 7 new configs automatically. Registry entries for all 7 P2 slugs already existed (Phase 1); their `phase` field is now 4 (was 3, a leftover from the original Phase 3 grouping — see §8), and `src/calculators/index.ts` now maps them to configs, so Home, All Calculators, and category pages link them and `getRelatedCalculators` cross-links them. |
| 7 | Sitemap | `src/pages/sitemap.xml.ts` now lists all 25 shipped calculator URLs (39 URLs total); there are no unshipped calculator pages left to exclude. |
| 8 | SVG measurement diagrams | New shared component `src/components/MeasurementDiagram.astro` (one component, seven variants: area, volume, wall, ceiling, joint, linear, board), rendered by `src/pages/calculators/[slug].astro` from the config's `diagram` field. All 25 calculator configs now carry a diagram kind (7 new + 18 existing, added in this phase). |
| 9 | Shopping List / Project Planner (My Project, completed) | `src/lib/project.ts` schema version 2 (same key `homediycalc:project:v1`): items gained `id`, `quantity` (default 1), and `room` (default "General"); the project gained a `name`. `parseProject` migrates version 1 data (items keep lines, cost, and saved date; they gain id/quantity/room) instead of dropping it. New helpers: `updateProjectItem` (edit label/quantity/price/room; quantity clamped to a whole number ≥ 1; an emptied price clears it), `removeProjectItem` (by id), `saveProject`, `totalProjectCost`, `projectHasCost`, `formatProjectAsCsv` (RFC 4180 escaping, one row per item plus a total row). `src/pages/my-project.astro` rewritten: project name, items grouped by room with subtotals, editable label/quantity/unit-price/room per item, total estimated cost, Copy combined list, Download CSV (Blob download), Print list (window.print with print CSS hiding nav/buttons), Clear project with a `confirm()` dialog. |
| 10 | Tests | Vitest 201/201 (see §6); Playwright 60/60 — one test per calculator (loads, default result renders, invalid input shows an error and hides results, Reset restores, Add to Project saves to LocalStorage) on Chromium desktop + Pixel 5 mobile for all 25 calculators, plus home smoke, sitemap, and two planner end-to-end tests (add from two calculators, edit room/price/quantity, export CSV, clear with confirmation; corrupt stored data shows the empty state). |
| 11 | Docs updated | This Phase 4 section; `docs/FORMULAS.md` (Phase 4 reference table, §§19–25 for the seven P2 formulas, all validated by Vitest in Phase 4); `docs/QA-REPORT.md` (actual results + defects found/fixed); `README.md` status → Phase 4. |

### 4. Approach

- Same config-driven pattern as Phases 2–3: one shared island, one config + one pure formula module + one test file per calculator. No island changes were needed — the seven calculators fit the existing field kinds (including `select` with numeric option values for tile size, trowel notch, surface condition, roll size, stock length, and back-buttering).
- Reference values first: every P2 default was checked against a manufacturer or technical source (Armstrong install guide, CUSTOM TDS-119, Sherwin-Williams ProBlock data sheets, RedGard TDS-104/TB94, Schluter KERDI product list) before shipping. Two values are explicitly labeled estimating guidance rather than manufacturer figures — the primer surface-condition factors (derived from the published coverage ranges) and the tile-adhesive back-buttering factor (~35%) — the same honesty treatment mulch and topsoil densities got in Phases 2–3.
- Worked examples as tests: each formula's Vitest file asserts the exact worked example in `docs/FORMULAS.md`. Two test expectations were wrong on first write (sealant coverage 24.27 vs the correct 24.30 ft/tube; a wallpaper FAQ roll count) and were fixed by re-deriving the arithmetic by hand, not by weakening the formulas.
- Planner as a schema migration, not a rebuild: the Phase 2 listing already worked, so Phase 4 extended `src/lib/project.ts` in place (version bump with migration) and rewrote the My Project page around the new helpers, keeping the key, the Add to Project flow, and the plain-text formatter.
- Diagrams as data, not pages: one shared SVG component driven by a config field, so a new calculator gets a diagram by naming its kind.

### 5. Decisions

- **P2 registry `phase` corrected from 3 to 4.** The registry still said P2 shipped in Phase 3 (a leftover from the original P1+P2 Phase 3 grouping, corrected by the 2026-11-20 roadmap note). The registry type is now `2 | 3 | 4` and the seven P2 entries say 4. The registry test was updated to match (P0→2, P1→3, P2→4).
- **Ceiling grid is geometric, not area-factored.** Area-based grid factors (e.g. 10.5 LF of main tee per 100 ft²) undercount against a drawn layout, so the grid is computed from the room dimensions (main lines every 4 ft, cross tees every 2 ft per bay, 2 ft tees at the non-main 2 ft offsets). The counts reproduce the published room tables cited in `docs/FORMULAS.md` for a 12 × 12 ft and a 10 × 8 ft room; the page still calls them a planning estimate.
- **Wallpaper counts strips, not area.** Dividing wall area by roll area under-orders on patterned papers (the worked example: 9 rolls by area vs 12 by strips). The calculator counts whole strips, adds the pattern repeat and 4 in trim to each strip length, rounds strips per roll down, and does not deduct doors or windows.
- **Primer factors are guidance, not manufacturer figures.** No manufacturer publishes a single "new drywall needs ×1.20 primer" factor. The factors are derived from the published coverage ranges (ProBlock 400 ft²/gal vs PVA 250–300 ft²/gal) and labeled as such on the page, in the formula module, and in `docs/FORMULAS.md`.
- **Planner schema version 2, same key, migrating migration.** Bumping the schema version without changing the key keeps existing saved projects readable; version 1 items are migrated (id/quantity/room defaulted), never dropped. A corrupt or unknown-version store still returns an empty project, never throws.
- **An emptied price clears the price, not $0.00.** `Number("")` is 0, so the My Project page sends NaN for an empty price field and `updateProjectItem` treats a non-finite cost as "clear". Found by a failing test; see `docs/QA-REPORT.md` §4.5.
- **No new dependency.** `package.json` is unchanged; nothing was added to `docs/LICENSE-AUDIT.md` because there is nothing to record.

### 6. Test Results

- **Vitest (`npm run test`):** 201 tests passed, 0 failed, 30 files — 145 pre-existing + 56 new (40 P2 formula tests: ceiling-tile 8, tile-adhesive 6, primer 5, wallpaper 5, sealant 5, waterproofing 6, baseboard 5; 16 planner tests: 8 more in `project.test.ts` — now 16 total, covering v1 migration, totals, text/CSV export, and corrupt data — plus 8 new LocalStorage-backed tests in `project-storage.test.ts`). Duration ~8s.
- **Playwright (`npm run test:e2e`):** 60 tests passed, 0 failed — 25 calculator tests × 2 viewports (loads, default result renders, invalid input shows an inline error and hides results, Reset restores the default result, Add to Project saves to LocalStorage with no console errors) + sitemap test × 2 + home smoke × 2 + planner end-to-end × 2 (add from two calculators, edit room/price/quantity, export CSV and read its contents, clear with confirmation; corrupt stored data shows the empty state), against `npm run preview` (production build). Duration ~30s.
- **Typecheck (`npm run typecheck`, `astro check`):** 0 errors, 0 warnings, 1 hint (the pre-existing unused-`ratio` hint in the mortar config from Phase 3).
- **Build (`npm run build`):** success in ~1.3s; 39 pages (14 foundation + 25 calculator pages) + sitemap.xml with 39 URLs.
- **Spot checks (manual, via the passing tests):** ceiling-tile defaults render 40 tiles / 3 cartons / 2 main tees / 15 four-foot tees / 18 two-foot tees / 5 wall-angle pieces / 6 hangers for the 12 × 12 ft room; primer defaults render 2 gallons for the 12 × 15 ft new-drywall room; baseboard defaults render 7 pieces of 8 ft stock for the 12 × 12 ft room with one door — all matching the `docs/FORMULAS.md` worked examples.
- **Dependencies:** `git diff package.json` shows no change — no new dependency in Phase 4, so nothing to add to `docs/LICENSE-AUDIT.md`.

### 7. Outstanding Issues

- **No domain, no deployment, no GitHub repo yet.** Canonicals are relative paths; the repo remains local-only (App installation pending — see Phase 0 §7). Unchanged from Phase 3.
- **Project license undecided** (`package.json` has no license field; `"private": true`). Unchanged from Phase 3.
- **No Lighthouse measurement yet** (Phase 5). No performance number is claimed for the calculator pages.
- **LGPL in the transitive tree** (sharp/libvips build-time binaries only). Unchanged from Phase 1; see `docs/LICENSE-AUDIT.md` §7.
- **The unused-`ratio` hint in the mortar config** (Phase 3) is still present — cosmetic, not a defect.

### 8. Deviations

- P2 registry `phase` corrected from 3 to 4 (see §5 — the roadmap's phase structure already said Phase 4 = P2; the registry had not caught up).
- The Phase 4 task text said "39 pages in dist/ — 14 foundation + 25 calculator pages" and the build produced exactly that; the sitemap likewise lists 39 URLs. No deviation from the task's numbers.
- One engine addition: `CUBIC_INCHES_PER_FLUID_OUNCE` in `src/lib/units.ts` (exact, 231/128) — a named constant in the single unit engine, not an inline conversion.
- No new dependency; `package.json` unchanged.

### 9. Risks / Assumptions

- **Assumption:** the Armstrong/CUSTOM/Sherwin-Williams/RedGard/Schluter figures remain the right defaults for the target user; every one is editable on the page and labeled with its source, so a wrong default costs the user one field edit, not a wrong order.
- **Risk:** the shared-island design means a bug in `GenericCalculator` affects all twenty-five calculators at once. Mitigation is the per-calculator Playwright test plus the formula-level Vitest tests, both of which run on every change.
- **Assumption:** the geometric ceiling-grid counts match typical US residential layouts; rooms that are not multiples of 2 ft, or that have many fixtures, need a drawn layout — the page says so.
- **Risk:** a version 1 project saved by an older build is migrated on first read; the migration assigns fresh ids, so any external reference to a version 1 item id (none exists — ids are new in v2) cannot break.

### 10. Next Steps

1. Phase 5 — Validation and audit: re-verify every formula against `docs/FORMULAS.md`, accessibility audit, SEO audit, Lighthouse measurement, security/privacy audit.
2. Phase 6 — Deployment prep: Cloudflare Pages project, custom domain decision, Search Console verification.
3. Decide the project license and record it in `package.json` + `docs/DECISIONS.md`.
4. Complete the GitHub App installation so the repo can be created and pushed.

### 11. Decisions Needing Owner Approval

- None arising from Phase 4 itself. Standing items needing an owner decision later (not now): project license; enabling AdSense (Phase 4/6 at the earliest); connecting a custom domain if the owner already owns one (Phase 6); choosing a Contact form backend if a submitting form is ever wanted.

---

## Phase 5 — Validation, Testing and Audit

### 1. Objectives

Re-verify every one of the 25 calculators' formulas against the worked examples in `docs/FORMULAS.md` (hand-computed, plus the Vitest suite); run the full Playwright suite on desktop and mobile viewports against the production build and add tests for any uncovered planner/a11y flow; audit accessibility, SEO, security, privacy, and performance (Lighthouse) with real measured numbers; fix every blocking defect; update `docs/FORMULAS.md`, `docs/QA-REPORT.md`, this report, and the README status; fix the pre-existing typecheck hint (unused `ratio` in the mortar config). Do not claim any check passed that did not run.

### 2. Status

**Complete.** All 11 items in the Phase 5 scope are done and verified on 2026-11-20 (Node v24.22.1). `npm run build` succeeds (39 pages), `npm run test` passes 201/201, `npm run test:e2e` passes 68/68 (Chromium desktop + Pixel 5 mobile), `npm run typecheck` passes with 0 errors, 0 warnings, 0 hints. Lighthouse measured on Home, Paint, and Concrete pages. Eight defects were found and fixed, including one blocking defect (the site shipped with no CSS at all — see §5). The site is not deployed anywhere, and the project is **not** reported as complete: ADR-9 requires 3 consecutive clean full test rounds after Phases 4–6, which run after this phase. (Note 2026-11-20: ADR-9 has since passed at commit ca29ba1 — see `docs/QA-REPORT.md` §12.)

### 3. Completed Work

| # | Item | Evidence |
|---|---|---|
| 1 | Formula validation (all 25) | Every worked example in `docs/FORMULAS.md` hand-computed and compared with the program's output — all 25 match. Every formula test file contains a worked-example test (25/25 files). Vitest 201/201 pass. `docs/FORMULAS.md` statuses updated to "re-validated in Phase 5" for all 25 formulas. |
| 2 | Browser testing (desktop + mobile) | Playwright 68/68 (was 60): 25 calculator tests × 2 viewports + home/sitemap/planner/a11y/styles tests, against `npm run preview`. New tests: `tests/a11y.spec.ts` (keyboard tab order, focus visibility, skip link, label coverage) and `tests/styles.spec.ts` (stylesheet loads and applies); `tests/project.spec.ts` gained a print-invocation test (`window.print` stubbed and asserted). Firefox 159 probe passed (4 pages, no console errors); Safari/WebKit not tested. |
| 3 | Accessibility audit | Lighthouse accessibility 100 on Home and Paint (final runs). Keyboard navigation verified by test; focus rings added to toggle buttons; `tabindex="-1"` added to `<main>` so the skip link moves focus; invalid `role="img"` removed from `<figure>`; nav/breadcrumb/footer links raised to 28 px touch targets; result-detail contrast fixed (slate-500 4.48:1 → slate-600 7.14:1 on the results card). All text colors computed against WCAG AA — all pass. |
| 4 | SEO audit | Python crawl of all 39 pages in `dist/`: unique titles/descriptions, canonicals, Open Graph/Twitter, exactly one H1 per page, JSON-LD parses and matches visible content, zero dead internal links, no placeholder text, calculator pages 527–1,087 words each. Sitemap lists exactly the 39 shipped pages. Lighthouse SEO 83 on every measured page — the only failures are the relative canonical and relative robots.txt sitemap URL, which need a domain (Phase 6). |
| 5 | Security audit | Grep of `src/` + `dist/`: no secrets/keys/tokens; no external scripts; no `fetch`/XHR/WebSocket in `src/`; no `dangerouslySetInnerHTML`; My Project renders user text via `textContent`/`createElement`. `public/_headers` added (Cloudflare Pages security headers incl. CSP) and documented in `docs/DEPLOYMENT.md` §11. Not deployed — headers are not live yet. |
| 6 | Privacy audit | No tracking domains in `dist/` (the "DoubleClick" hits are React's `onDoubleClick` event names); no cookies, analytics, or ads; LocalStorage use matches the policy (key `homediycalc:project:v1`, opt-in, nothing leaves the browser). Privacy Policy §3 corrected from future to present tense. |
| 7 | Performance audit | Lighthouse 12.8.2 (local preview, desktop emulation, HeadlessChrome 159): Home 99/100/100/83; Paint 99 and 92 / 100 / 100 / 83 on two final runs; Concrete 97/96/100/83 (pre-CSS-fix build). LCP 0.8–1.8s, CLS 0, TTI 1.0–1.8s. Shipped assets: `dist/` 1.3 MB; CSS 21,660 B raw / 4,772 B gzipped; JS ~116 KB gzipped per calculator page; no external assets. |
| 8 | Fixes | 8 defects fixed (see §5), including the blocking missing-CSS defect, the typecheck error, and the unused-`ratio` hint. Full suite re-run green after every fix. |
| 9 | Docs updated | This Phase 5 section; `docs/FORMULAS.md` (25 statuses + header + status note); `docs/QA-REPORT.md` (§1, §3 checklist, §4.6, §5, §10 results); `docs/DEPLOYMENT.md` §11 (security headers); `docs/LICENSE-AUDIT.md` §7 (`@types/node` addition); `README.md` status → Phase 5. |
| 10 | Tests added | `tests/a11y.spec.ts` (2 tests), `tests/styles.spec.ts` (1 test), print test in `tests/project.spec.ts` (1 test) — 4 new tests × 2 viewports = 8 more Playwright tests (60 → 68). |
| 11 | Committed locally | Committed on branch `main` with repo-local identity 和香 / itgaminglim@gmail.com. **Not pushed** — no remote exists yet; the GitHub repo creation is still blocked on the App installation (see Phase 0 §7). |

### 4. Approach

- Audit, don't build: every claim in this section names the command run and the result. The formula hand-check was done with independent arithmetic (Python), not by re-running the program — the two apparent mismatches it surfaced were the checker's own rounding, and the drywall "mismatch" was the checker applying waste to the sheet count instead of the area (the formula, docs, and tests all agree on 17 sheets).
- The blocking defect (no CSS) was found by a computed-style probe, not by any test: the site rendered with browser defaults while every functional test passed. The fix is one import line; the guard is a permanent regression test asserting computed styles.
- Lighthouse was run repeatedly (Paint: 98, 99, 79, 99, 92) because scores move with machine load on a shared 1.5-CPU VM; the report records the range and the outlier honestly instead of cherry-picking the best run.

### 5. Decisions

- **The missing stylesheet is a blocking defect, fixed in Phase 5.** `src/styles/global.css` was never imported, so no `.css` file shipped in `dist/` and every page rendered unstyled since Phase 1. Fixed with one import in `src/components/Layout.astro`; verified by computed styles, a screenshot, and a new permanent `tests/styles.spec.ts` regression test. Lesson: functional tests cannot catch a missing stylesheet — assert computed styles.
- **Typecheck error fixed with a new devDependency, not by avoiding the import.** `tests/project.spec.ts` needs `node:fs/promises` to read the exported CSV; `@types/node@24.19.2` (MIT, pinned exact) was installed and `"node"` added to the tsconfig `types` array. Recorded in `docs/LICENSE-AUDIT.md` §7. No runtime dependency was added.
- **CSP keeps `'unsafe-inline'` and says so.** Astro inlines the island loader script and component styles at build time, so a strict CSP would break calculator hydration. The policy still blocks every external source. Documented in `docs/DEPLOYMENT.md` §11.
- **Relative canonicals and robots.txt sitemap stay until Phase 6.** Lighthouse flags both as invalid, but no domain exists yet and inventing one would be worse. Deferred to Phase 6 with the domain.
- **Toggle-button state by color alone is deferred (low).** `aria-pressed` covers assistive technology; the orange-vs-white difference is strong for sighted users. A non-color cue can be added in Phase 6.
- **No new runtime dependency.** `package.json` gained only the `@types/node` devDependency; nothing was added to the runtime bundle.

### 6. Test Results

- **Vitest (`npm run test`):** 201 tests passed, 0 failed, 30 files. Duration ~8s.
- **Playwright (`npm run test:e2e`):** 68 tests passed, 0 failed — 25 calculator tests × 2 viewports + home smoke × 2 + sitemap × 2 + planner × 2 (CSV export with contents, print calls `window.print`, clear with confirmation, corrupt-data empty state) + a11y keyboard × 2 + styles × 2, against `npm run preview` (production build). Duration ~35–41s.
- **Typecheck (`npm run typecheck`, `astro check`):** 0 errors, 0 warnings, 0 hints, 111 files. (Started Phase 5 at 1 error + 1 hint; both fixed.)
- **Build (`npm run build`):** success in ~1.5s; 39 pages (14 foundation + 25 calculator pages) + sitemap.xml with 39 URLs + `public/_headers`.
- **Lighthouse 12.8.2** (local preview, desktop emulation, HeadlessChrome 159): Home Performance 99, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.9s, CLS 0, TTI 1.0s, TBT 110 ms, 9 KiB); Paint Calculator Performance 99 and 92 on two final runs, Accessibility 100, Best Practices 100, SEO 83 (LCP 1.8s / 0.8s, CLS 0, TTI 1.8s / 1.5s, TBT 60 ms / 340 ms, 129 KiB); Concrete Calculator Performance 97, Accessibility 96, Best Practices 100, SEO 83 (pre-CSS-fix build). SEO 83 everywhere is the relative-canonical/robots.txt issue (no domain yet). One mid-audit Paint run scored Performance 79 under VM load — recorded, not hidden.
- **Firefox 159 probe:** home, paint, concrete, my-project load with correct H1s; Paint results render; `.btn-primary` is brand orange; zero console errors.
- **Formula hand-check:** all 25 worked examples hand-computed and matched against the program's output (see `docs/QA-REPORT.md` §10 for the two rounding notes and the drywall method note).

### 7. Outstanding Issues

- **No domain, no deployment, no GitHub repo yet.** Canonicals are relative paths; the repo remains local-only (App installation pending — see Phase 0 §7). Unchanged from Phase 4.
- **Project license undecided** (`package.json` has no license field; `"private": true`). Unchanged from Phase 4.
- **SEO 83 until a domain exists** (relative canonicals + relative robots.txt sitemap URL). Phase 6 work.
- **Safari/WebKit not tested.** Firefox 159 probed and passed; no WebKit browser is installed in this environment.
- **Toggle-button state by color alone (low).** Deferred to Phase 6 (see §5).
- **Category pages are thin (108–180 words).** Deferred; content task, not a blocker.
- **Unused JavaScript (~35 KiB of the shared React client bundle on a calculator page).** Deferred; informational.
- **LGPL in the transitive tree** (sharp/libvips build-time binaries only). Unchanged from Phase 1; see `docs/LICENSE-AUDIT.md` §7.
- **ADR-9 release gate not yet run.** Three consecutive clean full test rounds are required after Phases 4–6; they run after this phase, not inside it.

### 8. Deviations

- Phase 5 added one devDependency (`@types/node@24.19.2`) to fix a real typecheck error — see §5. No other dependency change.
- Lighthouse was measured on 3 pages (Home, Paint, Concrete), not all 39 — the audit scope said "per page" but a full 39-page Lighthouse run was not proportionate; the three pages cover the home page, a representative calculator, and a second calculator, and the SEO crawl covered all 39 pages for the per-page checks. Recorded honestly in `docs/QA-REPORT.md` §10.

### 9. Risks / Assumptions

- **Assumption:** Lighthouse scores measured on the local preview server on a shared VM approximate the deployed Cloudflare Pages performance; re-measure on the live host in Phase 6.
- **Risk:** the missing-CSS defect shipped undetected through four phases because no test asserted styles. Mitigation is the new permanent `tests/styles.spec.ts` regression test plus the AGENTS.md lesson.
- **Assumption:** relative canonicals are acceptable pre-domain (per SEO-STRATEGY.md §3); they must be replaced with absolute URLs once a domain exists in Phase 6.

### 10. Next Steps

1. Phase 6 — deployment prep: Cloudflare Pages project, absolute canonicals/sitemap once a domain exists, Search Console verification, final smoke test, AdSense stays disabled.
2. ADR-9: run the 3 consecutive clean full test rounds after Phases 4–6. (Note 2026-11-20: ADR-9 has since passed at commit ca29ba1 — see `docs/QA-REPORT.md` §12.)
3. Decide the project license and record it in `package.json` + `docs/DECISIONS.md`.
4. Complete the GitHub App installation so the repo can be created and pushed.

### 11. Decisions Needing Owner Approval

- None arising from Phase 5 itself. Standing items needing an owner decision later (not now): project license; enabling AdSense (Phase 6 at the earliest); connecting a custom domain if the owner already owns one (Phase 6); choosing a Contact form backend if a submitting form is ever wanted.

---

## Phase 6 — Deployment Preparation

### 1. Objectives

Verify the production build from a clean state and re-run the full test suites against it; smoke-test every calculator URL on the local production build; prepare (not execute) the Cloudflare Pages deployment — Git integration path, manual deploy path, build settings, `_headers` verification, rollback procedure; document Search Console verification (all three methods), sitemap submission, and first-month checks; build the AdSense scaffolding with ads still disabled (ADR-8) and publisher/slot IDs configurable from one location with obvious placeholders; update `docs/DEPLOYMENT.md`, `docs/QA-REPORT.md`, this report, and the README status. Do not deploy publicly, create a Cloudflare account, purchase a domain, enable AdSense, or invent publisher/slot IDs, domain names, or verification codes.

### 2. Status

**Complete (preparation only).** All 11 items in the Phase 6 scope are done and verified on 2026-11-20 (Node v24.22.1). Clean build succeeds (39 pages), `npm run test` passes 204/204 (31 files, including 3 new ads-guard tests), `npm run test:e2e` passes 68/68 (Chromium desktop + Pixel 5 mobile), `npm run typecheck` passes with 0 errors, 0 warnings, 0 hints. The final smoke test against the local production build is 25/25 calculator URLs returning 200 with zero console errors. **Nothing is deployed anywhere** — no Cloudflare account, no Pages project, no domain. The code is on GitHub at https://github.com/silver-comet-76/homediycalc (main at snapshot 34b917a8). ADR-9 passed on 2026-11-20 at commit ca29ba1 (3 consecutive clean rounds — see `docs/QA-REPORT.md` §12); the release gate is met.

### 3. Completed Work

| # | Item | Evidence |
|---|---|---|
| 1 | Clean production build verified | `rm -rf dist/ && npm run build`: success in ~1.5s, 39 pages (14 foundation + 25 calculator pages). `dist/` contains 39 `index.html` files, `sitemap.xml` with 39 URLs, `robots.txt`, `public/_headers` copied to `dist/_headers` (900 bytes), `favicon.svg`, `og-image.svg`. Total `dist/` size ~1.4 MB. |
| 2 | Full test suites re-run against the clean build | Vitest 204/204 (31 files, ~7s) — 201 pre-existing + 3 new ads-guard tests. Playwright 68/68 (~37s) — 25 calculator tests × 2 viewports + home smoke × 2 + sitemap × 2 + planner × 2 + a11y × 2 + styles × 2, against `npm run preview`. Typecheck (`astro check`): 0 errors, 0 warnings, 0 hints, 113 files (was 111 in Phase 5; +2 for the new ads files). |
| 3 | Final smoke test | Served the production build locally (`npm run preview`, 127.0.0.1:4321) and probed every URL with a Playwright script: 25/25 calculator URLs return 200, hydrate (`data-hydrated="true"`), and show zero console errors and zero page errors; home, calculators index, My Project, and all 6 category pages also 200 with zero console errors. `sitemap.xml`, `robots.txt`, `favicon.svg`, `og-image.svg` all 200. Re-run after the AdSlot wiring change so the numbers describe the final build. |
| 4 | Cloudflare Pages Git integration documented | `docs/DEPLOYMENT.md` §3: exact dashboard steps, build command `npm run build`, output directory `dist/`, root `/`, environment variable `NODE_VERSION=24`. Documented, not executed — no Cloudflare account or Pages project exists yet. |
| 5 | Manual deploy path documented | `docs/DEPLOYMENT.md` §4: dashboard upload steps plus exact Wrangler commands (`npm install -g wrangler`, `wrangler login`, `npx wrangler pages deploy dist --project-name homediycalc`). Wrangler is **not** installed in this environment and was **not** installed or added as a dependency — the install is documented as a future step, to be done only when a manual deploy is actually run. No deploy was run. |
| 6 | Build settings recorded | `docs/DEPLOYMENT.md` §1 and §3: build command `npm run build`, output `dist/`, Node 24 (`NODE_VERSION=24`; `package.json` engines requires ≥22.23.4 per the license audit). No environment variable is required; the only optional ones are the AdSense placeholders, ignored while ads are disabled. |
| 7 | `_headers` verified and documented | `docs/DEPLOYMENT.md` §11: the file is valid Cloudflare Pages `_headers` format (`/*` rule, indented headers) and the clean build copies it to `dist/_headers`. Each header's purpose is documented in the existing table. Honest limitation recorded: `astro preview` does not apply `_headers` locally, so the live header check is a post-launch step (§10). |
| 8 | Rollback procedure documented | `docs/DEPLOYMENT.md` §9: Git-integration rollback (Deployments → Rollback, or revert + push), manual rollback (rebuild from the tagged release commit and re-upload — `dist/` is gitignored, so the tag is the only durable record), plus the content-error and CSP-problem playbooks. |
| 9 | Search Console instructions documented | `docs/DEPLOYMENT.md` §8: property setup, all three verification methods with exact steps (HTML file → `public/`; HTML meta tag → shared `Layout.astro` head; DNS TXT record → domain DNS provider), sitemap submission, and the weekly first-month checklist (Coverage, Performance, Enhancements, Core Web Vitals, Manual actions / Security issues). Cross-referenced from `docs/SEO-STRATEGY.md` §11. Nothing submitted — no domain, no live site. |
| 10 | AdSense scaffolding (disabled) | New single config `src/lib/ads.ts` (`ADS_ENABLED = false`, publisher ID `ca-pub-XXXXXXXXXXXXXXXX`, slot IDs `XXXXXXXXXX` — obvious placeholders, no digits); `src/components/AdSlot.astro` now gates on `ADS_ENABLED` and renders nothing while disabled; the slot is wired into the shared `src/components/Layout.astro` (renders nothing today). New guard tests `src/lib/ads.test.ts` (3 tests) assert ads are disabled and every ID is still a placeholder. `docs/ads.txt.template` prepared with `pub-REPLACE-WITH-REAL-PUBLISHER-ID`; no `public/ads.txt` exists. `docs/DEPLOYMENT.md` §7 (ads.txt) and §12 (9-step enablement checklist: owner ADR, consent management, privacy policy update, real IDs, switch, AdSense script + CSP, ads.txt, performance re-check, verification). Verified disabled: grep of `dist/` finds no `adsbygoogle`/`pagead2`/`googlesyndication` markup or script anywhere (the only "ads" hits are React's `onDoubleClick` event names and the privacy-policy prose stating ads are disabled). |
| 11 | Docs updated + committed locally | This Phase 6 section; `docs/DEPLOYMENT.md` (rewritten: status, prerequisites, both deploy paths, checklist, ads.txt, Search Console, rollback, headers, AdSense enablement checklist, §13 status); `docs/SEO-STRATEGY.md` §11; `docs/QA-REPORT.md` (§1, §11 results); `README.md` status → Phase 6. Committed on branch `main` with repo-local identity 和香 / itgaminglim@gmail.com. **Pushed 2026-11-21** as snapshot commit 34b917a8 on main at https://github.com/silver-comet-76/homediycalc (local history stays local; see `docs/QA-REPORT.md` §12). |

### 4. Approach

- Verify first, document second: every number in this section comes from a command that actually ran in Phase 6 (clean build, Vitest, Playwright, typecheck, smoke probe, dist greps). The smoke test was re-run after the AdSlot wiring change so the reported numbers describe the final build, not the build before the last edit.
- Preparation, not execution: the deployment paths are written so the owner (or a later phase with approval) can follow them without re-deriving anything, but no account was created, no repo was created, no deploy was run, and no domain, publisher ID, or verification code was invented.
- Ads scaffolding as a guard, not a feature: the config, the component, and the tests are wired together so that enabling ads later is a deliberate, test-breaking change (the guard tests must be updated as part of it), while today the shipped output contains no ad markup at all — verified by grep, not by assumption.

### 5. Decisions

- **AdSlot is wired into the shared layout while still rendering nothing.** Previously `AdSlot.astro` was defined but imported nowhere, so the "slot" existed only as a file. It is now rendered by `src/components/Layout.astro` after `<main>` on every page — but because `ADS_ENABLED` is false it adds no markup to `dist/`, which the post-change build + full Playwright run (68/68) confirms. The placement is fixed now, so a future enablement changes one flag, not every page.
- **Wrangler is documented, not installed.** The manual-deploy path needs Wrangler, but adding it as a project dependency (or installing it globally) for a deploy that is not happening would add an unaudited dependency for no benefit. The exact install and deploy commands are in `docs/DEPLOYMENT.md` §4 for when a manual deploy is actually run.
- **Node 24 for the Pages build.** The project is developed and tested on Node v24.22.1 and `package.json` requires ≥22.23.4; the Pages project must set `NODE_VERSION=24` explicitly rather than relying on the Pages default.
- **No new runtime dependency.** `package.json` is unchanged; nothing was added to `docs/LICENSE-AUDIT.md` because there is nothing to record.

### 6. Test Results

- **Vitest (`npm run test`):** 204 tests passed, 0 failed, 31 files — 201 pre-existing + 3 new ads-guard tests (`src/lib/ads.test.ts`: ads disabled, publisher ID is a placeholder, slot IDs are placeholders). Duration ~7s.
- **Playwright (`npm run test:e2e`):** 68 tests passed, 0 failed — 25 calculator tests × 2 viewports + home smoke × 2 + sitemap × 2 + planner × 2 (CSV export with contents, print calls `window.print`, clear with confirmation, corrupt-data empty state) + a11y keyboard × 2 + styles × 2, against `npm run preview` (production build). Duration ~37s.
- **Typecheck (`npm run typecheck`, `astro check`):** 0 errors, 0 warnings, 0 hints, 113 files.
- **Build (`npm run build`, from `rm -rf dist/`):** success in ~1.5s; 39 pages (14 foundation + 25 calculator pages) + sitemap.xml with 39 URLs + `public/_headers` + `favicon.svg` + `og-image.svg`.
- **Smoke test (Playwright probe against `npm run preview` on 127.0.0.1:4321):** 25/25 calculator URLs 200, hydrated, zero console errors, zero page errors; home, calculators index, My Project, and all 6 category pages 200 with zero console errors; `sitemap.xml`, `robots.txt`, `favicon.svg`, `og-image.svg` all 200.
- **Ads-disabled verification (grep of `dist/`):** no `adsbygoogle`, `pagead2`, or `googlesyndication` markup or script anywhere; no external `<script src="http…">` in `dist/`; the only external URL strings in built JS are `https://react.dev` (React error text) and `http://www.w3.org` (namespace string), neither a network call. No `fetch(` in built JS.
- **Dependencies:** `git diff package.json` shows no change — no new dependency in Phase 6, so nothing to add to `docs/LICENSE-AUDIT.md`.

### 7. Outstanding Issues

- **No domain, no deployment yet.** Canonicals are relative paths. The code is on GitHub at https://github.com/silver-comet-76/homediycalc (main at snapshot 34b917a8). Public deployment needs owner approval.
- **Project license undecided** (`package.json` has no license field; `"private": true`). Unchanged from Phase 5.
- **SEO 83 until a domain exists** (relative canonicals + relative robots.txt sitemap URL). Fix at deploy time per `docs/DEPLOYMENT.md` §6, then re-run Lighthouse on the live host.
- **Safari/WebKit not tested.** Firefox 159 probed and passed in Phase 5; no WebKit browser is installed in this environment.
- **Toggle-button state by color alone (low).** Deferred from Phase 5; `aria-pressed` covers assistive technology.
- **Category pages are thin (108–180 words).** Deferred; content task, not a blocker.
- **Unused JavaScript (~35 KiB of the shared React client bundle on a calculator page).** Deferred; informational.
- **LGPL in the transitive tree** (sharp/libvips build-time binaries only). Unchanged from Phase 1; see `docs/LICENSE-AUDIT.md` §7.
- **ADR-9 release gate not yet run.** Three consecutive clean full test rounds are required after Phases 4–6; they run after this phase, not inside it.

### 8. Deviations

- None from the Phase 6 task scope. The task asked for deployment preparation, not deployment, and no deploy was executed.
- The task listed the AdSlot verification and config work; the guard tests (`src/lib/ads.test.ts`) and wiring the slot into the shared layout are additions beyond the literal task text, both in service of making "verified disabled" test-backed rather than asserted.

### 9. Risks / Assumptions

- **Assumption:** the Cloudflare Pages dashboard and Wrangler command syntax in `docs/DEPLOYMENT.md` are current as of 2026-11-20; both are flagged in the doc as "confirm against the dashboard / installed version at setup time" because Cloudflare changes them.
- **Risk:** the GitHub App installation is still the blocker for the Git-integration path. If it stays blocked, the fallback is creating the repo via the browser web UI and pushing over HTTPS, then connecting Pages — the doc covers the Pages side, not the repo-creation side.
- **Assumption:** Node 24 remains available on the Cloudflare Pages build image at deploy time; if the image drops it, the fallback is the highest available Node ≥22.23.4, and the doc says so via the engines requirement.

### 10. Next Steps

1. Owner decisions needed before anything else deploys: approve the public deployment, complete the GitHub App installation (or create the repo via the web UI), and decide whether a custom domain is involved (none to be purchased).
2. ADR-9: done — passed 2026-11-20 at commit ca29ba1 (see `docs/QA-REPORT.md` §12).
3. Decide the project license and record it in `package.json` + `docs/DECISIONS.md`.
4. After the first live deploy: run the `docs/DEPLOYMENT.md` §10 post-launch checks, verify the `_headers` headers live, submit the sitemap to Search Console, and re-run Lighthouse on the live host.

### 11. Decisions Needing Owner Approval

- **Public deployment to Cloudflare Pages** (no account, no Pages project, no deploy run yet).
- **GitHub repository creation** (blocked on the App installation; needs the owner to finish the repository-selection step or use the web-UI route).
- **Custom domain** — only if the owner already owns one; none to be purchased.
- **AdSense** — stays disabled (ADR-8); enabling needs the owner decision and the full `docs/DEPLOYMENT.md` §12 checklist.
- Standing items from earlier phases: project license; choosing a Contact form backend if a submitting form is ever wanted.

---

## Phase 7 — Independent Audit and Remediation (GitHub Issue #1)

### 1. Objectives

Execute the independent formula and launch-readiness audit ordered by GitHub Issue #1 (reviewer fnaticjohn / ChatGPT, Product Manager): audit all 25 formulas against independently derived examples and authoritative references; audit WebKit/Safari, keyboard and visual-state accessibility, and actual computed styles; audit absolute canonical/sitemap/robots URL readiness using an owner-approved origin (none exists — no invented domain); review thin category content and the actual lint configuration (a no-op); reconcile README and phase status with the final three clean rounds in `docs/QA-REPORT.md` and the now-existing GitHub repo (without implying deployment occurred); record the license as an owner decision; create separate GitHub issues for substantiated defects and remediation tasks; remediate on a separate phase-7 branch; complete three consecutive clean full test rounds per ADR-9 after remediation; submit for independent review. Do not merge into main, close issues, deploy publicly, enable advertisements, purchase domains, or incur costs without approval.

### 2. Status

**Complete on GitHub; in final re-review.** All 11 items in the Phase 7 scope are done and verified on 2026-11-21 (Node v24.22.1). Audit: 25-calculator matrix produced (7 PASS, 18 DEFECT — 11 major, 19 minor formula defects), WebKit/Safari recorded honestly as untestable, canonical/robots recorded as a deployment blocker, lint fixed for real (ADR-10), 24 stale statements corrected, 6 category pages rewritten to ≥ 300 words. Remediation: every audit defect fixed on the local `phase-7` branch with regression tests. ADR-9 re-gate: **3 consecutive clean full test rounds PASSED** (see `docs/QA-REPORT.md` §13). The branch was pushed to GitHub on 2026-11-22 (snapshot commit `43ce2bf`), PR #2 was opened, and the Issue #1 summary comment was posted. The reviewer returned REQUEST_CHANGES on PR #2 (review 6009535299, 2026-11-22); the response is in §9 below and `docs/QA-REPORT.md` §13.4, re-gated with 3 fresh clean rounds. The reviewer then returned a second review (6009895920, 2026-11-22) accepting the standard-case fixes and raising one remaining P0 — the count rating breaking for custom joint widths and brick dimensions; the response is in §9 below and `docs/QA-REPORT.md` §13.5, re-gated with 3 fresh clean rounds. Nothing is deployed anywhere.

### 3. Completed Work

| # | Item | Evidence |
|---|---|---|
| 1 | 25-calculator formula audit | Five independent read-only auditors; every worked example hand-derived and checked against manufacturer/standards sources (QUIKRETE, Sherwin-Williams, MAPEI, ASTM C270, BIA TN10, ICPI Tech Spec 2, CUSTOM TDS-119, RedGard TDS-104, Schluter KERDI). Matrix: 7 PASS, 18 DEFECT (11 major + 19 minor). |
| 2 | Formula remediation | All 30 formula defects fixed on the `phase-7` branch with regression tests (see §5); `docs/FORMULAS.md` updated for every fix. New `coverage` unitKind (ft²/gal ↔ m²/L) fixes the systematic metric-coverage defect on paint, primer, waterproofing, and drywall compound. |
| 3 | WebKit/Safari + keyboard + computed-styles audit | WebKit binary downloaded (webkit-2388) but cannot launch — 12 missing host libraries, sudo/apt install required; recorded honestly as UNAVAILABLE, no WebKit claim made. Chromium a11y/styles specs 3/3 × 2 projects; contrast fix verified from rendered pixels at exactly 7.14:1. Six minor findings (F1–F6) fixed with tests. |
| 4 | Canonical/sitemap/robots audit | All relative on all 39 pages; plumbing complete; recorded as deployment blocker / owner decision. No invented domain anywhere. |
| 5 | Lint | `prettier@3.10.1` (MIT) promoted to direct devDependency (exact pin); `npm run lint` is now a real `prettier --check` (`.prettierrc` printWidth 100, `.prettierignore` for `.astro`/Markdown/`dist`/generated); whole code tree formatted once with `prettier --write`; ADR-10 in `docs/DECISIONS.md`; `docs/LICENSE-AUDIT.md` entry; wired into `docs/DEPLOYMENT.md` §5. |
| 6 | Thin category content | All 6 category pages rewritten to ≥ 300 words of original prose (Painting 90 → 629, Landscaping 133 → 680, Flooring and Tiles 136 → 704, Measurement 137 → 624, Concrete and Masonry 162 → 695, Interior and Maintenance 162 → 807); stale "linked only when built and tested" boilerplate replaced on 7 pages + Home FAQ; 108–180 claim corrected in `docs/QA-REPORT.md`. |
| 7 | README + phase-status reconciliation | All 24 stale Category-A statements corrected (README status + clone URL, DEPLOYMENT §§1–3/13, QA-REPORT §§1/11/12, PHASE-REPORT Phase 6, ROADMAP, PRD); ADR-9 outcome line in `docs/DECISIONS.md`; dated note atop this report; historical per-phase rows left untouched with the note. |
| 8 | License | Confirmed: no `LICENSE` file, no `license` field in `package.json`, `"private": true`. Recorded as an owner decision; no license selected. |
| 9 | Competitor/SEO opportunities | 12 opportunities from `docs/MARKET-RESEARCH.md` listed separately from defects (long-tail concrete family, cubic-yard as winnable head term, paint/tile/drywall gaps, free shopping-list differentiator, etc.). To be filed as their own issue(s) once GitHub writes are approved. |
| 10 | ADR-9 re-gate | 3 consecutive clean full rounds PASSED after remediation (see `docs/QA-REPORT.md` §13): clean build 40 pages, Vitest 254/254, typecheck 0/0/0, lint pass, audit checks PASS, Playwright 76/76, Lighthouse Home + Paint 100/100/100/83 (Paint performance 99/98 on rounds 2–3 — shared-VM variance). One failed pre-count attempt (home.spec strict-mode violation from new category prose) fixed by a test-precision change; count restarted from 0. Re-gated again after the PR #2 review response: 3 fresh clean rounds PASSED 2026-11-22 (Vitest 258/258) — see §9 and `docs/QA-REPORT.md` §13.4. Re-gated again after the second re-review response: 3 fresh clean rounds PASSED 2026-11-22 ~12:04–12:09 JST (Vitest 282/282) — see §9 and `docs/QA-REPORT.md` §13.5. |
| 11 | Docs updated + committed locally | This Phase 7 section; `docs/QA-REPORT.md` §13 (audit, remediation, gate); `docs/DECISIONS.md` (ADR-9 outcome, ADR-10); `docs/LICENSE-AUDIT.md` (Prettier); `docs/DEPLOYMENT.md` §5 (lint in checklist, 40 pages); `README.md` status → Phase 7; `docs/ROADMAP.md` Phase 7 section. Committed on branch `phase-7` with repo-local identity 和香 / itgaminglim@gmail.com. Pushed to GitHub 2026-11-22 (snapshot commit `43ce2bf`); PR #2 open; Issue #1 summary comment posted. |

### 4. Approach

- Audit first, by independent agents that could not edit files: each auditor derived expected values by hand from authoritative references rather than re-running the program, and reported defects with evidence, source links, affected paths, and acceptance criteria. Defects where doc + code + tests agreed with each other but disagreed with the external reference (the majority) were caught exactly this way.
- Remediation by five parallel agents with partitioned file ownership (one owns live `docs/FORMULAS.md` edits; the others wrote exact old→new spec files the coordinator applied and verified — all 19 spec edits matched exactly once). The coordinator fixed one more defect found during integration (drywall compound coverage, same metric-coverage class) and the lint setup, and ran the gate.
- Gate discipline per ADR-9: the first post-remediation e2e failure (74/76) restarted the count from zero, and an incomplete round (Lighthouse never ran because `--chrome-path` is rejected by Lighthouse 12.8.2 — `CHROME_PATH` env var required) was discarded, not counted. The gate script `scripts/gate-round.sh` (with `scripts/gate-audit.py`) runs every step identically and fails the round if Lighthouse produces no output; both scripts are committed in the repo (they were first written to `/tmp` and lost in a VM replacement, then recreated and committed on 2026-11-22).

### 5. Decisions

- **The manufacturer count rating governs mortar bags (B-1, corrected 2026-11-22 in the PR #2 review response).** The Brick Calculator's 37-bricks-per-bag rating and the Mortar Calculator's 0.6 ft³/bag yield contradicted each other 2× for the same wall — and the 0.6 ft³ figure is not on the QUIKRETE Mortar Mix No. 1102 data sheet at all: the sheet states only "each 80 lb bag will lay up to 37 standard bricks or 13 standard blocks" and no cubic-foot yield, so no volumetric bag yield is claimed. Bags now come from the rating, derated by the waste allowance: the larger of the bricks you buy ÷ 37 and the installed bricks × (1 + mortar waste%) ÷ 37 governs (18 bags for the 80 ft² worked example, not 9). Both calculators agree. Waste is counted once per material: brick breakage in the brick count only, mortar waste derating the rating only. See `docs/QA-REPORT.md` §13.4 and ADR-11.
- **ASTM C270 table yields replace share-of-volume site-mix (M-1).** Shares understated ingredients by 24–39% (an under-buy). Yields per ft³ of mortar: N 0.17/0.17/1.0, S 0.22/0.11/1.0, M 0.33/0.08/1.0, O 0.11/0.22/1.0 (cement/lime/sand), verified against two fetched sources. The displayed Type M ratio stays 1:¼:3¾ (sand at 3× cementitious, inside C270's 2¼–3× range); the yield table implies ~2.44× for Type M — both inside the range, and the range is now documented.
- **Coverage is a true area-per-volume unit (P-1/PRI-1/WTP-2).** New `coverage` unitKind (ft²/gal ↔ m²/L, 1 ft²/gal = 0.024542 m²/L exact): paint 8.59, primer 7.36, waterproofing 2.70, drywall compound 2.45 m²/L. Hints state both units in one line — there is no per-system hint mechanism, and adding one was out of scope.
- **Slab edge band corrected, not documented-around (S-1).** The formula is now the true non-overlapping band 2(L+W−2w)·w·e (40.00 ft³ for the tested case), not the overcounting perimeter approximation.
- **Paver base on the extended footprint (PVR-2).** Base and bedding volumes use the paver area + 6 in per side (or the base thickness when deeper than 6 in); when only the area is known the footprint is estimated as if square (documented; exact with length + width). Corrected audit figures: loose 3.41 yd³ / 4.77 t (the audit brief's 3.42/4.79 were wrong by rounding — re-derived exactly).
- **Lint is Prettier formatting only (ADR-10).** ESLint was deferred; the immediate gap was the false-green no-op. `.astro` files and Markdown prose are excluded (no Prettier parser for Astro; reformatting all docs would churn the audit branch). The one-time `--write` pass reformatted ~80 code files mechanically.
- **Historical rows are annotated, not rewritten.** `docs/QA-REPORT.md` §§7–8 and this report's Phase 2–3 spot checks quoted pre-fix figures (18 bags, 5.34 ft³, 2.96 yd³); each carries a dated Phase 7 note pointing at `docs/QA-REPORT.md` §13 with the corrected figures.

### 6. Test Results

- **Vitest (`npm run test`):** 254 tests passed, 0 failed, 37 files — 204 pre-existing + 50 new Phase 7 regression tests (coverage-unit 9, `ceilUp` suite, corrected topsoil/brick/mortar/paver/drywall/ceiling-tile/waterproofing/baseboard cases, config-level tests for drywall/ceiling-tile/waterproofing/paver, a11y/styles/404 tests). Duration ~10s. After the PR #2 review response (§9): 258 tests, 0 failed — 4 new (rating-governed mortar bags for brick and block, rating floor, `ceilUp` tiny-positive cases).
- **Playwright (`npm run test:e2e`):** 76 tests passed, 0 failed — 68 pre-existing + 8 new (a11y focus-outline, toggle marker, 404 page, card-link heights × 2 viewports), against `npm run preview` (production build). Duration ~38–40s per round.
- **Typecheck (`npm run typecheck`, `astro check`):** 0 errors, 0 warnings, 0 hints, 122 files.
- **Lint (`npm run lint`, `prettier --check`):** passes on the clean tree.
- **Build (`npm run build`, from `rm -rf dist/`):** success in ~1.6s; 40 pages (39 shipped + 404) + sitemap.xml with 39 URLs + `public/_headers` + `favicon.svg` + `og-image.svg`.
- **Audit checks (`scripts/gate-audit.py`):** PASS all three gate rounds — 39 indexable pages + custom 404, sitemap 39 URLs matching shipped pages, unique titles/descriptions, canonicals, one H1 each, zero dead internal links, no external scripts, no tracking/ad endpoints, no fetch/XHR/WebSocket, ads.ts placeholder.
- **Lighthouse 12.8.2** (local preview, desktop emulation, headless-shell Chrome): Home 100/100/100/83 all three rounds; Paint 100/100/100/83, then 99 and 98 on performance (shared-VM variance; LCP 0.8–1.7s, CLS 0, TTI 0.8–1.7s). SEO 83 everywhere is the relative-canonical/robots.txt issue (no domain yet).
- **Smoke test (implicit in e2e + audit):** all 25 calculator URLs load with defaults rendering; the custom 404 page serves with a single H1 and links home + All Calculators.

### 7. Outstanding Issues

- **Remote `phase-7` branch — on GitHub since 2026-11-22** (snapshot commit `43ce2bf`); PR #2 open; Issue #1 summary comment posted. Reviewer returned REQUEST_CHANGES (review 6009535299); response in §9, re-gated in `docs/QA-REPORT.md` §13.4.
- **PR #2 review response (2026-11-22) — done, awaiting re-review.** See §9.
- **No domain, no deployment.** Canonicals are relative paths. Public deployment needs owner approval.
- **Project license undecided** (`package.json` has no license field; `"private": true`; no `LICENSE` file). Owner decision.
- **SEO 83 until a domain exists** (relative canonicals + relative robots.txt sitemap URL). Fix at deploy time per `docs/DEPLOYMENT.md` §6, then re-run Lighthouse on the live host.
- **Safari/WebKit not tested.** WebKit binary downloaded but cannot launch (12 missing host libraries; needs sudo/apt approval). No WebKit claim is made.
- **Toggle-button state by color alone (low) — resolved in Phase 7.** Pressed toggles now show a ✓ marker in addition to color + border + `aria-pressed`; the deferred item is closed.
- **Category pages are thin — resolved in Phase 7.** All 6 pages now have ≥ 300 words of original prose (624–807 words each).
- **Unused JavaScript (~35 KiB of the shared React client bundle on a calculator page).** Deferred; informational.
- **LGPL in the transitive tree** (sharp/libvips build-time binaries only). Unchanged from Phase 1; see `docs/LICENSE-AUDIT.md` §7.
- **Observation:** raw `npx tsc --noEmit` reports a pre-existing error in `src/lib/ads.ts(23,25)` (`import.meta.env` not typed under plain tsc). Not a project command; the project's own typecheck is clean; not fixed in this phase.
- **ADR-9 re-gate passed** (see §10 / `docs/QA-REPORT.md` §13). The Phase 7 work itself is complete except the GitHub steps above.

### 8. Deviations

- GitHub issues were not created before remediation (the task order said issues first), because the remote branch and every connector write need user approval and the first approval expired before it was answered. Issues will be filed after the branch exists, referencing the branch and the remediation commits; the audit findings are fully recorded in `docs/QA-REPORT.md` §13 meanwhile.
- The task brief's paver figures (loose 3.42 yd³, 4.79 tons) were corrected to 3.41 yd³ / 4.77 t by exact re-derivation (2.7284 × 1.25 = 3.4105, not 3.42); code, tests, config, and docs all use the corrected figures.
- Type M's displayed mortar ratio stays 1:¼:3¾ while the C270 yield table implies sand ≈ 2.44× cementitious; both are inside C270's 2¼–3× range and the range is documented (see §5).
- The drywall compound-coverage metric defect (same class as P-1/PRI-1/WTP-2) was found during integration, not by an auditor, and fixed the same way (2.45 m²/L + equivalence test).
- Lighthouse measurement note: Lighthouse 12.8.2 requires the `CHROME_PATH` environment variable; `--chrome-path` is rejected. The gate script sets it to the Playwright headless-shell binary.

### 9. PR #2 Review Response (2026-11-22)

Reviewer fnaticjohn returned REQUEST_CHANGES on PR #2 (review 6009535299, commit `43ce2bf`). All three findings were addressed on the `phase-7` branch; full detail and the fresh 3-round re-gate (PASSED 2026-11-22) are in `docs/QA-REPORT.md` §13.4.

- **P0 — mortar bags undercut the manufacturer maximum.** The 9-bag figure came from an unsourced 0.6 ft³/bag yield that is not on the QUIKRETE Mortar Mix No. 1102 data sheet (verified by reading the sheet: it states only "up to 37 standard bricks or 13 standard blocks" per 80 lb bag, no cubic-foot yield, no waste allowance). Bags now come from that rating, derated by the waste allowance — the larger of the bricks you buy ÷ 37 and the installed bricks × (1 + mortar waste%) ÷ 37 governs: 18 bags for the 80 ft² worked example. Both calculators agree at 18. New regression tests cover standard bricks (18 bags, floor 16, zero-waste case 16) and standard blocks (100 ft² → 10 bags, 80 ft² → 8 bags), plus a floor test that bags × units-per-bag always covers the waste-adjusted unit count. Shopping-list lines and cost use the new bag count (worked-example cost 576 × $0.50 + 18 × $8 = $432). The `bagYieldFt3` input and the `MORTAR_BAG_YIELD_FT3` constant are removed; the mortar volume (5.09 ft³) is unchanged and still feeds the site-mix parts.
- **P1 — `ceilUp` boundary.** The fixed 1e-9 epsilon could round a strictly positive requirement below 1e-9 down to zero packages. `ceilUp` now uses a relative 1e-12 epsilon (float noise is ~1e-13 relative, so a genuinely above-integer requirement still rounds up) and guarantees any positive requirement orders at least one package; zero stays zero. Tests cover tiny positives (1e-12, 5e-10 → 1), a genuinely above-integer value (5.0000000005 → 6), and zero/negative → 0. Recorded as ADR-11.
- **P1 — status and reproducibility.** README and QA §13 lines claiming the remote branch and Issue #1 comment did not exist are corrected (both exist since 2026-11-22). The gate scripts are committed in the repo (`scripts/gate-round.sh`, `scripts/gate-audit.py`; Lighthouse pinned to 12.8.2) with per-round logs under `docs/gate-logs/2026-11-22-review-response/`. Lighthouse is reported as ranges across rounds (Paint Performance 98–100), and the 39 indexable pages + custom 404 are stated explicitly wherever the build count appears.
- **Deferred/owner gates unchanged:** WebKit gap, absolute URLs, license, deployment, ads — still owner decisions, no action taken.

**Second re-review (2026-11-22, review 6009895920, on commit `0f042c7f`).** The reviewer accepted the standard-case fixes (18 bags), the `ceilUp` guard, and the committed gate scripts/logs, and raised one remaining P0: the count-only rating breaks for custom geometry. Both calculators accept an adjustable joint width and Brick accepts custom brick dimensions, yet the bag count used the fixed standard-unit rating — so on the 80 ft² modular wall at 15% mortar waste, widening the joint from ⅜ to ¾ in raises the mortar volume from 5.09 to 8.82 ft³ while the recommended bags fall from 18 to 15, contradicting the claim that the bag count covers the waste-adjusted volume.

- **Fix (ADR-12):** the rating now applies only to standard geometry — modular brick or standard block at the standard ⅜ in joint or narrower, within a 1% tolerance that absorbs metric rounding (9.5 mm joint, 194 × 57 × 92 mm brick). A narrower joint stays applicable (¼ in → 3.58 ft³, 19 bags, still covering the volume). For wider joints or non-modular brick, the bag count comes from a verified user-entered yield (ft³ per bag, from the bag's own data sheet — no default, no product yield claimed): bags = ceil(waste-adjusted volume ÷ yield); with no yield entered, no bag count, bag cost, or shopping-list bag line is shown and the page explains why. The standard case is unchanged at 18 bags. The alternative of adding a volume-coverage check against the rating's implied yield was rejected — the implied yield is a property of the standard geometry, not of the bag, so using it elsewhere would invent a product yield.
- **Tests:** 24 new regression tests (formula level: wide joint suppressed, user-yield path 30 bags at 0.3 ft³/bag, narrow joint 19 bags, custom depth/length/height suppressed, metric equivalents; config level: bag row/line/cost suppression and the yield path in both calculators) — Vitest 258 → 282. Cross-calculator agreement holds on the user-yield path too (both 30 bags).
- **Nonblocking notes addressed in the same change:** the gate script no longer hardcodes the Chromium path (resolves `$CHROME_PATH`, else the newest `chromium_headless_shell-*` in the Playwright cache) and now enforces explicit Lighthouse launch thresholds (Performance/Accessibility/Best Practices ≥ 90, SEO ≥ 80, documented in the script header); the stale "ready to push" line in QA §13.4 is corrected.
- **Re-gate:** 3 fresh consecutive clean rounds PASSED 2026-11-22 ~12:04–12:09 JST (Vitest 282/282, Playwright 76/76, Lighthouse Home + Paint 100/100/100/83 every round, thresholds enforced) — see `docs/QA-REPORT.md` §13.5; logs in `docs/gate-logs/2026-11-22-second-review-response/`.

### 10. Risks / Assumptions

- **Assumption:** the snapshot-push mechanism will carry the local `phase-7` branch (including the Prettier reformat of ~80 files) to GitHub as one commit when the branch is created and approved; the reviewer is told the reformat is mechanical so the substantive fixes stay reviewable via the file list in `docs/QA-REPORT.md` §13. *(Confirmed 2026-11-22: the push worked — remote `phase-7` at snapshot commit `43ce2bf`, 109 files.)*
- **Risk:** the Prettier `--write` pass touched ~80 code files; a formatting-only change cannot alter behavior, and the full suite (254 Vitest, 76 Playwright, typecheck, build) was re-run green afterwards on every gate round — but a reviewer diffing the branch against `main` will see formatting noise alongside the fixes.
- **Assumption:** the ASTM C270 yield table, BIA TN10, ICPI Tech Spec 2, and manufacturer TDS figures as fetched in the audit remain current; the periodic content refresh in the roadmap backlog re-checks them.

### 11. Next Steps

1. Await re-review of PR #2 (reviewer: fnaticjohn / ChatGPT). Do NOT close Issue #1.
2. After reviewer sign-off: merge decision (owner approval required — do NOT merge without it).
3. Owner decisions still pending (unchanged): domain/origin, project license, public deployment to Cloudflare Pages, AdSense enablement.
4. After the first live deploy: run the `docs/DEPLOYMENT.md` §10 post-launch checks, verify the `_headers` headers live, submit the sitemap to Search Console, and re-run Lighthouse on the live host.

### 12. Decisions Needing Owner Approval

- **Merge of the `phase-7` branch into `main`** (only after independent reviewer sign-off).
- **Public deployment to Cloudflare Pages** (no account, no Pages project, no deploy run yet).
- **Custom domain** — only if the owner already owns one; none to be purchased.
- **Project license** — no license selected in this phase.
- **AdSense** — stays disabled (ADR-8); enabling needs the owner decision and the full `docs/DEPLOYMENT.md` §12 checklist.
- Standing items from earlier phases: choosing a Contact form backend if a submitting form is ever wanted.
