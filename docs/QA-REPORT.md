# QA Report — HomeDIYCalc

> Status: Phase 4 complete (2026-11-20). All 25 calculators are built, tested, and live in the local build — results are in §6 (Phase 1), §7 (Phase 2), §8 (Phase 3), and §9 (Phase 4) below. No calculator remains unshipped.

## 1. Current State

- Phase 0 (documentation) is complete: `AGENTS.md`, `README.md`, and the `docs/` set exist.
- Phase 1 (scaffold) is complete: Astro project with the pinned stack, unit engine, registry, shared layout/components, 14 static pages, sitemap/robots, Vitest + Playwright tests — all verified (see §6).
- Phase 2 (P0 calculators) is complete: all 10 P0 calculators built and tested (see §7).
- Phase 3 (P1 calculators) is complete: all 8 P1 calculators built and tested (see §8). The site is not deployed anywhere.
- Phase 4 (P2 calculators + Project Planner) is complete: all 7 P2 calculators built and tested, My Project completed end-to-end (edit, rooms, totals, CSV, print, confirmed clear), SVG measurement diagrams on all 25 calculator pages (see §9). All 25 calculators are now shipped. The site is not deployed anywhere.
- Phase 5 (validation and audit) is complete (2026-11-20): all 25 formulas re-validated by hand-check + Vitest 201/201, Playwright 68/68 (desktop + mobile), Lighthouse measured on Home, Paint, and Concrete pages, accessibility/SEO/security/privacy/performance audits run — 8 defects found and fixed, including one blocking defect (see §10). The site is still not deployed anywhere.
- Phase 6 (deployment preparation) is complete (2026-11-20): clean production build re-verified (39 pages), full suites re-run (Vitest 204/204 including 3 new ads-guard tests, Playwright 68/68, typecheck 0/0/0), final smoke test 25/25 calculator URLs 200 with zero console errors, Cloudflare Pages deployment documentation completed (Git + manual paths, Node 24 build settings, `_headers` verified, rollback procedure), Search Console instructions documented (all three verification methods), AdSense scaffolding built with ads verified disabled (see §11). Nothing is deployed anywhere — no Cloudflare account, no Pages project, no domain. The code is on GitHub at https://github.com/silver-comet-76/homediycalc (main at snapshot 34b917a8). ADR-9 passed on 2026-11-20 at commit ca29ba1 (3 consecutive clean rounds — see §12); the release gate is met.

## 2. Test Plan

### 2.1 Vitest unit tests (Phase 2 onwards, full pass in Phase 5)

- Every formula module: worked examples from `docs/FORMULAS.md`, boundary cases (0, negative, very large inputs), and round-up behavior (`ceil` on all package quantities).
- Unit engine: conversion round-trips, exact constants (1 yd³ = 27 ft³; 1 US gal ≈ 3.785411784 L; 1 ft = 0.3048 m).
- Shopping-list formatting and LocalStorage serialization (mocked `localStorage`), including corrupt/old-version data handling.
- Command: `npm run test`.

### 2.2 Playwright browser tests (Phase 2 onwards, full pass in Phase 5)

- Every calculator page: loads successfully, default result renders, invalid input shows an inline error, Reset restores defaults, shopping list copies.
- Navigation: Home → category → calculator; All Calculators search/filter; My Project save/remove flow.
- Viewports: desktop (1280×720) and mobile (360×800).
- Tests run against the production build (`npm run preview`), not only the dev server.
- Command: `npm run test:e2e`.

### 2.3 Manual QA (Phase 5)

- Cross-browser spot checks (Chrome, Firefox, Safari — or the subset Playwright covers, plus one manual Safari check if available).
- Accessibility spot checks: keyboard navigation, labeled inputs, contrast.
- Link check: no broken internal links; every nav link resolves.
- LocalStorage behavior: save, reload, remove, clear; corrupt stored data does not crash the page.
- Content review: every page has original, US English content; no placeholder text; no invented prices or reference values without a source.
- Lighthouse measurement per calculator page (performance, accessibility, best practices, SEO).

### 2.4 Environments to Test

| Environment | Purpose |
|---|---|
| Local dev (`npm run dev`) | Development iteration |
| Local production build (`npm run build` + `npm run preview`) | Pre-deploy verification; Playwright runs here |
| Cloudflare Pages preview deploy (per PR) | Review of changes before merge |
| Cloudflare Pages production (`*.pages.dev`, later custom domain if provided) | Launch smoke test |
| Mobile viewport 360px (emulated + at least one real-device spot check if available) | Mobile-first verification |
| Desktop viewport 1280px | Desktop verification |

## 3. Acceptance Criteria Checklist

- [x] All 25 calculators live at `/calculators/<slug>/`, each with imperial+metric, waste allowance, editable coverage/density/yield with references, package quantities rounded up, optional prices with cost estimate, formulas shown, reset, copyable shopping list, validation, and mobile-first layout. — **Done (Phases 2–4, re-verified in Phase 5).** All 25 pages live; per-calculator Playwright tests pass on desktop + mobile; formulas re-validated by hand-check in Phase 5 (see §10).
- [x] My Project works end-to-end in LocalStorage (save, list, remove, copy combined list). — **Done in Phase 2 (early).** Add to Project on every calculator page saves to `homediycalc:project:v1`; the My Project page lists saved items with remove/clear/copy. Covered by the per-calculator Playwright tests (save step) — a dedicated save/remove/copy flow test is a Phase 5 item.
- [x] Home, All Calculators, 6 category pages, My Project, About, Contact, Privacy Policy, Terms of Use, Disclaimer all live with real content. — **Done in Phase 1** (14 pages in `dist/`, verified by `npm run build` + Playwright nav test).
- [x] `npm run build` produces a fully static site; `npm run test` (Vitest) and `npm run test:e2e` (Playwright) pass. — **Done for all 25 calculators (Phase 5):** build (39 pages), Vitest (201/201), Playwright (68/68, desktop + mobile), typecheck (0 errors, 0 warnings, 0 hints). See §10.
- [x] Lighthouse performance ≥ 90 on calculator pages (measured and recorded — not claimed before measurement). — **Measured in Phase 5:** Paint Calculator 99 and 92 on two final runs (and 98/99 before the CSS fix), Concrete Calculator 97, Home 99–100. All measured pages are ≥ 90. Lighthouse 12.8.2, local preview server, desktop emulation, HeadlessChrome 159. See §10. (Lighthouse scores are per-run measurements on a shared 1.5-CPU VM, not guarantees — one mid-audit run scored 79 under load; see §10.)
- [ ] SEO checklist complete: unique titles/descriptions, canonicals, sitemap, robots.txt, breadcrumbs, structured data, Search Console verified. — **Per-page checks complete in Phase 5** (unique titles/descriptions, canonicals, sitemap 39/39 URLs, robots.txt, breadcrumbs, structured data valid and matching visible content, Open Graph, no dead internal links, original content 527–1,087 words per calculator page). **Not complete:** canonical URLs and the robots.txt `Sitemap:` directive are relative paths, which Lighthouse flags as invalid — both need an absolute domain, which does not exist yet (Phase 6). Search Console verification instructions are documented in `docs/DEPLOYMENT.md` §8 (all three methods) but nothing is submitted — no domain, no live site yet.
- [x] No paid API, backend, database, login, or fake data anywhere in the shipped site. — **Holds for Phase 1.** Verified: static-only build, no server code, no ad/analytics scripts (grep of `dist/` found no ad scripts), no invented contact email or prices.
- [x] AdSense disabled by default; no ad/analytics scripts unless owner-approved. — **Holds for Phase 1.** `AdSlot.astro` renders nothing; no ad script in `dist/`.

## 4. Defects and Issues

### 4.1 Fixed in Phase 1

1. **`astro check` hung without `@astrojs/check`.** `npm run typecheck` prompted interactively to install `@astrojs/check` and waited forever in non-interactive use. Fixed by installing `@astrojs/check@0.9.12` (MIT, pinned exact) as a devDependency. Typecheck now passes with 0 errors.
2. **Breadcrumb prop type (9 type errors).** `SEO.astro`/`Layout.astro` required `path` on every breadcrumb, but the current-page crumb has none. Fixed by making `path` optional and falling back to the page canonical in the BreadcrumbList JSON-LD.
3. **Test expectation precision (3 Vitest failures).** Two `toBe` assertions on floating-point conversions (99.99999999999999 vs 100; 3.7854117840000003 vs 3.785411784) and one wrong expected value (5 gal = 0.66840278 ft³, not 0.668402). Fixed in the tests with `toBeCloseTo` and the correct value; the engine was not weakened.

### 4.3 Fixed in Phase 2

1. **Island props are JSON — functions do not survive hydration (all 10 calculator Playwright tests failed).** The first build passed the whole calculator config, including `compute` functions, as a React island prop. Astro serializes island props to JSON, so the functions were dropped on hydration; the client component threw and React kept remounting the inputs ("element was detached from the DOM"). Fixed by passing only the slug string to the island and resolving the config client-side from the imported config map. Lesson recorded in `AGENTS.md`.
2. **Hydration race discarded typed input (Gravel/Brick Playwright failures).** With `client:visible`, a user could type into the server-rendered inputs before React hydrated, and hydration then discarded the input — no error appeared even though the field held "-1". Fixed by switching calculator islands to `client:load` (the calculator is the page's main above-fold content) and adding a `data-hydrated` marker the tests wait for.
3. **Tile/brick dimensions canonicalized to feet, formulas expect inches (live-value bug).** The unit engine's canonical length is feet, so a 12 in tile arrived at the formula as 1 (foot) and the tile page showed 15,516 tiles for 100 ft². Fixed with a per-field `canonicalUnit` ("in") on tile/brick dimension and joint fields; the island converts display units to that unit via the engine. Spot-checked after the fix: 108 tiles / 11 boxes.
4. **Zero is a valid value for some fields (Brick page showed no result on load).** The "Openings area" field defaults to 0, but the shared validation treated every non-price field as must-be-greater-than-0, so the brick calculator showed an error and no result with its own defaults. Fixed by allowing an explicit `min: 0` (inclusive) on fields where zero is legitimate (openings area, grout/mortar joint width).
5. **Floating-point round-up (1 Vitest failure).** `100 × 1.10` is 110.00000000000001 in binary floating point, so `Math.ceil` gave 111 tiles where the worked example says 110. Fixed with `ceilUp` (1e-9 epsilon, −0 normalized to 0) in `src/lib/units.ts`, used for every package quantity.
6. **Typecheck: `Record<string, number>` indexing under `noUncheckedIndexedAccess` (103 errors).** Config compute functions read `v.length` etc. as possibly `undefined`. Fixed with `req()`/`opt()` accessors in `CalculatorConfig.ts` (`req` throws on a missing required value; `opt` defaults to 0 for shape-dependent fields). No engine or formula was weakened.

### 4.4 Fixed in Phase 3

1. **Stale sitemap assertions (2 Playwright failures).** `tests/home.spec.ts` and `tests/calculators.spec.ts` still asserted that the P1 pages (drywall, mortar) were *not* in the sitemap, from Phase 2 when they were unshipped. Fixed by updating both specs to assert the 8 P1 URLs are listed and the P2 URLs (ceiling-tile, primer) are not.
2. **Typecheck: shared field arrays widened `kind` to `string` (6 errors).** In the grout, mortar, and paver configs, `COMMON_FIELDS` entries written as `kind: "length"` without `as const` widened the array's union type, so the spread into `fields: FieldSpec[]` failed. Fixed by annotating the three arrays as `FieldSpec[]` (imported type). No engine or formula was changed.
3. **Test expectation errors (3 Vitest failures, all in the tests, not the formulas).** Grout mosaic: the joint-length ratio for 2 × 2 vs 12 × 12 tile is 6×, not 12× (144 in vs 24 in of joint per ft²), so the expected grout was 28.22 lb / 3 bags, not 56.42 lb / 6 bags. Paver joint sand: the exact value is 7.0152 in³/ft², which is outside `toBeCloseTo(7.01, 2)` tolerance — expected value corrected to 7.02. Topsoil: `50 × 1.10` is 55.00000000000001 in binary floating point, so `toBe(55)` failed — changed to `toBeCloseTo`. Each was fixed by re-deriving the arithmetic by hand; no formula was weakened.

### 4.5 Fixed in Phase 4

1. **Registry still said P2 shipped in Phase 3 (1 Vitest failure).** The registry's P2 entries said `phase: 3`, a leftover from the original P1+P2 Phase 3 grouping, and the registry test asserted that. Fixed by correcting the registry to `phase: 4` (type widened to `2 | 3 | 4`) and updating the test to P0→2, P1→3, P2→4.
2. **Sealant coverage expectations (2 Vitest failures, both in the tests, not the formula).** The expected coverage per tube was written as 24.27 ft (1/4 in bead) and 10.79 ft (3/8 in bead); re-deriving by hand — 10.1 fl oz × 1.8047 in³/fl oz = 18.227 in³, ÷ 0.0625 in² ÷ 12 = 24.30 ft — showed the expectations were wrong. Fixed in the tests (24.30 and 10.80); the formula was not weakened.
3. **Wallpaper FAQ roll count wrong (found by hand-check while writing the config copy, not by a test).** The FAQ said a 12 × 12 ft room with 9 ft walls and a 27 in repeat needs 10 double rolls; the arithmetic is 29 strips, 32 with 10% waste, 2 strips per roll = 16 rolls (plain paper: 11). Fixed in the config copy; the formula and its tests already agreed on 16.
4. **An emptied price field saved $0.00 (1 Vitest failure).** `Number("")` is 0, so clearing the unit price on the My Project page would have saved a $0.00 price instead of clearing it. Fixed in the page (send NaN for an empty price field) and in `updateProjectItem` (a non-finite cost clears the price). Test updated to document the contract.
5. **Planner e2e looked for item names as text (2 Playwright failures, both viewports).** On the My Project page the item name renders in an editable input, so `getByText` found nothing. Fixed the test to assert the input values instead; the page was correct.
6. **Typecheck: implicit `any` in the My Project page script (3 errors).** `money(value)` had an untyped parameter and `const rooms = []` had no element type under strict mode. Fixed with `value: number` and `const rooms: string[] = []`. No logic changed.

### 4.6 Fixed in Phase 5

1. **Blocking — the site shipped with no CSS at all (all pages unstyled since Phase 1).** `src/styles/global.css` was never imported by any component, so Vite never bundled it: `dist/` contained no `.css` file, and a computed-style probe on the Paint Calculator showed the browser defaults — body background transparent, body text black, `.btn-primary` the default gray button with 0 border-radius, nav links 17 px tall. Every functional test passed anyway (no test asserted styles), and Lighthouse did not flag it. Fixed by importing the stylesheet in `src/components/Layout.astro` (`import "../styles/global.css"`). After the fix the build emits `dist/_astro/Layout.*.css` (21,660 B raw, 4,772 B gzipped), the probe shows body white, body text slate-800, `.btn-primary` brand-600 `#c2410c` with white text and 8 px radius, nav links 28 px tall, and a screenshot confirms the styled layout. A permanent regression test (`tests/styles.spec.ts`) now asserts the stylesheet loads and applies. Lesson recorded in `AGENTS.md`: a page can pass every functional test while shipping unstyled — assert computed styles, not just behavior.
2. **Typecheck failed with 1 error (new since Phase 4).** `tests/project.spec.ts` imports `readFile` from `node:fs/promises` to read the exported CSV, but `tsconfig.json` restricts automatic `@types` inclusion to `["vitest/globals"]` and `@types/node` was never installed, so the module had no types. Fixed by installing `@types/node@24.19.2` (MIT, pinned exact) as a devDependency and adding `"node"` to the tsconfig `types` array; recorded in `docs/LICENSE-AUDIT.md` §7. Typecheck is now 0 errors, 0 warnings, 0 hints.
3. **Typecheck hint: unused `ratio` in the mortar config (pre-existing, Phase 3).** `src/calculators/mortar-calculator/config.ts` declared `const ratio = MORTAR_MIX_RATIOS[mortarType]` and never read it. Fixed by removing the declaration and the now-unused `MORTAR_MIX_RATIOS` import (the ratio is used inside `calculateMortar`, not in the config).
4. **Invalid ARIA role on SVG diagrams (Lighthouse a11y).** `MeasurementDiagram.astro` put `role="img"` on a `<figure>`, which is not an allowed role for that element. Fixed by removing the role (the `aria-label` on the figure stays, and the SVG itself is `aria-hidden`).
5. **Touch targets below 24 px (Lighthouse a11y, WCAG 2.2 Target Size Minimum).** Header nav, category nav, footer nav, and breadcrumb links were ~17–20 px tall. Fixed by adding `inline-block py-1` to those links (28 px tall after the CSS fix). The skip link is still flagged by Lighthouse in its visually-hidden state — a false positive: when focused it is ~33 px tall.
6. **Result detail text failed contrast on the results card (Lighthouse a11y).** `text-slate-500` on the `bg-brand-50` card is 4.48:1, just under WCAG AA 4.5:1. Fixed by changing the ResultPanel detail spans to `text-slate-600` (7.14:1 on the same background).
7. **Stale "first 10 calculators" copy on 4 pages.** Home hero, Home FAQ ("When will the calculators be available?"), All Calculators intro, About status, and the Privacy Policy ("When the My Project planner arrives…") still described the Phase 2 state although all 25 calculators and the planner shipped in Phase 4. Fixed to present tense on all five spots (Home FAQ question is now "Are all the calculators available?"). A grep of `src/` and `dist/` confirms no stale phrasing remains.
8. **No visible focus ring on toggle buttons.** The Imperial/Metric toggle and the calculation-method buttons used raw Tailwind classes without the `focus-visible` outline the shared `.btn-primary`/`.btn-secondary` classes carry. Fixed by adding `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600` to both button states in `CalculatorInputs.tsx` and `GenericCalculator.tsx`.

### 4.2 Open

- **LGPL in the transitive dependency tree** (sharp/libvips build-time binaries only; no GPL/AGPL). See `docs/LICENSE-AUDIT.md` §7. No action required; recorded, not hidden.
- **Project license undecided** (`package.json` has no license field; `"private": true`).
- **No domain yet — canonicals and robots.txt sitemap are relative paths.** Lighthouse SEO is 83 on every measured page for exactly two failing audits: `robots-txt` ("Invalid sitemap URL" — `Sitemap: /sitemap.xml` must be absolute) and `canonical` (relative `rel=canonical` is not valid). Both are correct by design until a domain exists (SEO-STRATEGY.md §3, ARCHITECTURE.md §13) and are Phase 6 work: set the domain, make canonicals and the sitemap URL absolute, re-run Lighthouse.
- **Toggle-button state is conveyed by color alone (low).** The selected Imperial/Metric and method buttons differ from the unselected ones only by background color; `aria-pressed` covers assistive technology, but a sighted user gets no non-color cue. Deferred: the color difference (orange vs white) is strong and the buttons are labeled; a non-color cue (e.g. a check mark) can be added in Phase 6.
- **Category pages were thin (90–162 words of visible text).** The Phase 5 audit recorded them as 108–180 words, but a re-measurement on 2026-11-21 with the same method (visible text inside `<main>`) gives Painting 90, Landscaping 133, Flooring and Tiles 136, Measurement 137, Concrete and Masonry 162, Interior and Maintenance 162 — Painting was 90, not 108 as recorded earlier. Fixed in Phase 7 (2026-11-21, working tree): each category page now carries an About section, a choosing guide, common mistakes, and an FAQ — re-measured after the fix at Painting 629, Landscaping 680, Flooring and Tiles 704, Measurement 624, Concrete and Masonry 695, Interior and Maintenance 807 words.
- **Unused JavaScript (low, informational).** Lighthouse flags ~35 KiB of the shared React client bundle as unused on a calculator page (54% of `client.*.js`). That is the shared React runtime every island needs; reducing it would mean splitting the island bundle. Deferred.
- **Cross-browser coverage is Chromium + Firefox only.** Firefox 159 probe passed (home, paint, concrete, my-project load; results render; no console errors). Safari/WebKit was not tested — no WebKit browser is installed in this environment. Recorded, not claimed.
- **Lighthouse performance varies run to run on this VM.** Final Paint runs scored 99 and 92; one mid-audit run scored 79 (TBT 900 ms) while the machine was loaded. Scores are measurements, not guarantees; re-measure on the deployed host in Phase 6.

## 5. What This Report Does Not Claim

- Lighthouse scores now exist (see §10) — each is named with the command, date, page, and environment. They are per-run measurements on a shared local VM, not guarantees; one mid-audit run scored 79 under load.
- No traffic, ranking, or Search Console data exists. No deployment exists. Firefox was probed; Safari/WebKit was not tested.

## 6. Phase 1 Results (2026-11-20, Node v24.22.1)

| Check | Command | Result |
|---|---|---|
| Production build | `npm run build` | ✅ Success in ~1.5s. 14 pages, fully static `dist/` (home, calculators index, 6 category pages, my-project, about, contact, privacy-policy, terms-of-use, disclaimer, sitemap.xml) + robots.txt, favicon.svg, og-image.svg. |
| Unit tests | `npm run test` | ✅ 52 passed, 0 failed (4 files: units 28, registry 12, project 8, CalculatorInputs 4). ~1.7s. |
| Browser tests | `npm run test:e2e` | ✅ 4 passed, 0 failed — home smoke test (loads, nav Home → All Calculators → category → My Project, no console errors) + sitemap/robots test, on Chromium desktop and Pixel 5 mobile, against `npm run preview`. ~9.5s. |
| Typecheck | `npm run typecheck` | ✅ `astro check`: 0 errors, 0 warnings, 0 hints, 27 files. |
| License check | `npx license-checker --summary` | 367 packages: MIT 307, ISC 15, Apache-2.0 13, BSD-2/3-Clause 15, BlueOak 4, MPL-2.0 3, CC0 2, 0BSD 2, LGPL-3.0-or-later 2 + 1 mixed (sharp/libvips, build-time only), UNLICENSED 1 (the project itself). No GPL/AGPL, no paid dependency. Full output in `docs/LICENSE-AUDIT.md` §7. |
| Sitemap check | Playwright + manual read of `dist/sitemap.xml` | ✅ 14 URLs, all shipped pages; no unshipped calculator URL listed. |
| Ads check | grep of `dist/` | ✅ No ad/analytics scripts in the built output. |

## 7. Phase 2 Results (2026-11-20, Node v24.22.1)

| Check | Command | Result |
|---|---|---|
| Production build | `npm run build` | ✅ Success in ~1s. 24 pages, fully static `dist/` (14 foundation + 10 calculator pages) + sitemap.xml with 24 URLs. |
| Unit tests | `npm run test` | ✅ 104 passed, 0 failed (14 files: units 28, registry 12, project 8, CalculatorInputs 4, plus 52 new formula tests — concrete 6, square-footage 5, paint 6, gravel 5, mulch 5, concrete-slab 4, cubic-yard 6, cubic-feet 4, tile 5, brick 6). ~4s. |
| Browser tests | `npm run test:e2e` | ✅ 26 passed, 0 failed — 10 calculator tests × 2 viewports (loads, default result renders, invalid input shows an inline error and hides results, Reset restores the default result, Add to Project saves to LocalStorage, no console errors) + home smoke + sitemap tests, against `npm run preview`. ~16s. |
| Typecheck | `npm run typecheck` | ✅ `astro check`: 0 errors, 0 warnings, 0 hints. |
| Sitemap check | Playwright + manual read of `dist/sitemap.xml` | ✅ 24 URLs: all shipped pages including the 10 P0 calculator pages; no unshipped P1/P2 URL listed. |
| Spot checks | Playwright probe | ✅ Tile defaults: 108 tiles / 11 boxes for 100 ft², 12×12 in tiles, ⅛ in joint, 10% waste. Brick defaults: 576 bricks, 18 mortar bags, 5.34 ft³ mortar for the 10×8 ft modular wall. Both match `docs/FORMULAS.md` worked examples. (Note 2026-11-21, Phase 7: the brick figures were corrected to 9 mortar bags and 5.09 ft³ — see §13.) |
| Dependencies | `git diff package.json` | ✅ No change — no new dependency in Phase 2, so nothing to add to `docs/LICENSE-AUDIT.md`. |

## 8. Phase 3 Results (2026-11-20, Node v24.22.1)

| Check | Command | Result |
|---|---|---|
| Production build | `npm run build` | ✅ Success in ~1s. 32 pages, fully static `dist/` (14 foundation + 18 calculator pages) + sitemap.xml with 32 URLs. |
| Unit tests | `npm run test` | ✅ 145 passed, 0 failed (22 files: units 28, registry 12, project 8, CalculatorInputs 4, plus 93 formula tests — 52 from Phase 2 and 41 new P1 tests: drywall 5, concrete-bags 5, flooring 5, paver 5, topsoil 5, grout 5, board-foot 5, mortar 6). ~2s. |
| Browser tests | `npm run test:e2e` | ✅ 42 passed, 0 failed — 18 calculator tests × 2 viewports (loads, default result renders, invalid input shows an inline error and hides results, Reset restores the default result, Add to Project saves to LocalStorage, no console errors) + home smoke + sitemap tests, against `npm run preview`. ~24s. |
| Typecheck | `npm run typecheck` | ✅ `astro check`: 0 errors, 0 warnings, 1 hint. |
| Sitemap check | Playwright + manual read of `dist/sitemap.xml` | ✅ 32 URLs: all shipped pages including the 8 P1 calculator pages; no unshipped P2 URL listed. |
| Spot checks | Playwright probe | ✅ Drywall defaults: 17 sheets / 2 pails / 1 roll / 483 screws for the 12×12 ft room. Concrete bags defaults: 50 × 80 lb bags for 1 yd³ with 10% waste. Paver defaults: 207 pavers / 2.96 yd³ loose base / 2 joint-sand bags for the 16×12 ft patio. All match `docs/FORMULAS.md` worked examples. (Note 2026-11-21, Phase 7: the paver loose base was corrected to 3.41 yd³ with the 6-in base extension — see §13.) |
| Dependencies | `git diff package.json` | ✅ No change — no new dependency in Phase 3, so nothing to add to `docs/LICENSE-AUDIT.md`. |

## 9. Phase 4 Results (2026-11-20, Node v24.22.1)

| Check | Command | Result |
|---|---|---|
| Production build | `npm run build` | ✅ Success in ~1.3s. 39 pages, fully static `dist/` (14 foundation + 25 calculator pages) + sitemap.xml with 39 URLs. |
| Unit tests | `npm run test` | ✅ 201 passed, 0 failed (30 files: 145 pre-existing + 56 new — 40 P2 formula tests: ceiling-tile 8, tile-adhesive 6, primer 5, wallpaper 5, sealant 5, waterproofing 6, baseboard 5; 16 planner tests: 8 more in `project.test.ts` — now 16 total, covering v1 migration, totals, text/CSV export, corrupt data — plus 8 new LocalStorage-backed tests in `project-storage.test.ts`). ~8s. |
| Browser tests | `npm run test:e2e` | ✅ 60 passed, 0 failed — 25 calculator tests × 2 viewports (loads, default result renders, invalid input shows an inline error and hides results, Reset restores the default result, Add to Project saves to LocalStorage, no console errors) + sitemap test × 2 + home smoke × 2 + planner end-to-end × 2 (add from two calculators, edit room/price/quantity, export CSV and read its contents, clear with confirmation; corrupt stored data shows the empty state), against `npm run preview`. ~30s. |
| Typecheck | `npm run typecheck` | ✅ `astro check`: 0 errors, 0 warnings, 1 hint (the pre-existing unused-`ratio` hint in the mortar config from Phase 3). |
| Sitemap check | Playwright + manual read of `dist/sitemap.xml` | ✅ 39 URLs: all shipped pages including the 7 P2 calculator pages; no unshipped calculator URL listed — all 25 calculators are now shipped. |
| Spot checks | Playwright probe | ✅ Ceiling-tile defaults: 40 tiles / 3 cartons / 2 main tees / 15 four-foot tees / 18 two-foot tees / 5 wall-angle pieces / 6 hangers for the 12×12 ft room. Primer defaults: 2 gallons for the 12×15 ft new-drywall room. Baseboard defaults: 7 pieces of 8 ft stock (56 ft purchased) for the 12×12 ft room with one door. All match `docs/FORMULAS.md` worked examples. |
| Dependencies | `git diff package.json` | ✅ No change — no new dependency in Phase 4, so nothing to add to `docs/LICENSE-AUDIT.md`. |

## 10. Phase 5 Results (2026-11-20, Node v24.22.1)

Environment for every check below: local VM (shared 1.5 CPU), Node v24.22.1, `npm run preview` on http://127.0.0.1:4321, Chromium Headless 159 (Playwright 1.65.1) unless noted. Lighthouse 12.8.2 via `npx lighthouse` with `CHROME_PATH` set to the Playwright Chromium binary, desktop emulation, `--chrome-flags="--headless --no-sandbox --disable-gpu"`.

| Check | Command | Result |
|---|---|---|
| Production build | `npm run build` | ✅ Success in ~1.5s. 39 pages, fully static `dist/` (14 foundation + 25 calculator pages) + sitemap.xml with 39 URLs + `public/_headers` (security headers, new in Phase 5) + `Layout.*.css` (21,660 B raw, 4,772 B gzipped — the stylesheet that was missing before the Phase 5 fix). |
| Unit tests | `npm run test` | ✅ 201 passed, 0 failed (30 files, ~8s). Every formula test file contains a worked-example test (25/25); all 25 worked examples were also hand-computed in Phase 5 and compared with the program's output — all match (see formula validation below). |
| Browser tests | `npm run test:e2e` | ✅ 68 passed, 0 failed (35–41s) — 25 calculator tests × 2 viewports + home smoke × 2 + sitemap × 2 + planner × 2 (CSV export with contents, print calls `window.print`, clear with confirmation, corrupt-data empty state) + a11y keyboard × 2 + styles × 2, against `npm run preview`. |
| Typecheck | `npm run typecheck` | ✅ `astro check`: 0 errors, 0 warnings, 0 hints (111 files). Was 1 error + 1 hint at the start of Phase 5; both fixed (see §4.6). |
| Formula validation | Hand-check + Vitest | ✅ All 25 worked examples hand-computed and matched against the program's output. The only apparent mismatches in the hand-check were the checker's own rounding (gravel 2,592.59 lb shown as 2,593 lb; sealant 45.71 fl oz shown as 45.7 fl oz) and binary floating-point artifacts (`100 × 1.10` = 110.00000000000001; `16 × 1.10` = 17.6 — the drywall formula applies waste to area before dividing by sheet area, giving 17 sheets, which the docs and tests agree on). `ceilUp` absorbs the float noise. Boundary cases (zero, negative, very large) and round-up behavior are covered by the Vitest suites, which pass 201/201. `docs/FORMULAS.md` statuses updated to "re-validated in Phase 5" for all 25. |
| SEO crawl | Python crawl of `dist/` (39 pages) | ✅ 39/39 pages: unique title (none duplicated, none over 65 chars) and unique meta description (none over 165 chars), canonical present and self-referential, Open Graph + Twitter card present, exactly one H1 per page, all JSON-LD parses and matches visible content (Home FAQPage 5/5 questions visible; Paint FAQPage 4/4; BreadcrumbList crumbs match the visible trail), zero dead internal links, no placeholder text. Calculator pages carry 527–1,087 words of visible text each; category pages 624–807 words (re-measured 2026-11-21 in Phase 7 after the category-content rewrite — Painting 629, Landscaping 680, Flooring and Tiles 704, Measurement 624, Concrete and Masonry 695, Interior and Maintenance 807; the 108–180 figure recorded in Phase 5 was wrong — Painting was 90, not 108 — see §4.2). Sitemap lists exactly the 39 shipped pages. |
| Accessibility | Lighthouse a11y + Playwright keyboard tests + contrast computation | ✅ Final Lighthouse accessibility 100 on Home and Paint (2 runs each). Keyboard: skip link works (focus moves to `#main-content`, `tabindex="-1"` added in Phase 5), full tab order reaches every control (unit toggle, mode buttons, all inputs, Reset, Copy, Add to Project), toggles operable by Enter/Space, every input on 4 sampled pages has an associated label. Contrast computed for every text color used: all pass WCAG AA (e.g. white on brand-600 5.18:1, brand-700 on white 7.31:1, slate-500 on white 4.76:1, slate-600 on brand-50 7.14:1) after fixing the one failure (slate-500 on brand-50 was 4.48:1). Focus visible on toggle buttons (fixed in Phase 5). Diagrams: `role="img"` removed from `<figure>` (invalid role); `aria-label` kept. |
| Security | Grep of `src/` + `dist/` | ✅ No secrets/keys/tokens in the repo (grep found only the word "token" in a design-token sentence in `docs/DECISIONS.md`). No external scripts loaded: zero `<script src="http…">` in `dist/`; the only external URL string in built JS is `https://react.dev` inside React's error-message text (not a network call). No `fetch`/`XMLHttpRequest`/`sendBeacon`/`WebSocket` anywhere in `src/`. No `dangerouslySetInnerHTML`; the only `innerHTML` in the codebase is `roomsEl.innerHTML = ""` (clearing) in My Project — all user-entered text is rendered via `textContent`/`createElement` (My Project) or React's default escaping (calculator islands). Security headers added: `public/_headers` (nosniff, DENY framing, strict-origin-when-cross-origin, Permissions-Policy, CSP with `default-src 'self'` and `'unsafe-inline'` for scripts/styles — documented as required by Astro's inlined island loader and component styles) and documented in `docs/DEPLOYMENT.md` §11. Not deployed — headers are not live yet. |
| Privacy | Grep of `dist/` + policy read | ✅ No analytics/tracking beyond what the policy discloses: no tracking domains in `dist/` (the 3 "DoubleClick" hits are React's `onDoubleClick` event names, not tracking). No cookies, no analytics, no ads (AdSense disabled, `AdSlot` renders nothing). LocalStorage use matches the policy: key `homediycalc:project:v1`, opt-in by clicking save, nothing leaves the browser — confirmed by code inspection (no network calls from calculator or planner code) and by the built JS (no `fetch`/XHR to any host). Privacy Policy §3 was stale ("When the My Project planner arrives…") and was corrected to present tense in Phase 5. |
| Performance — Lighthouse | `npx lighthouse` (see environment above) | ✅ Home: Performance 99, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.9s, CLS 0, TTI 1.0s, TBT 110 ms, 9 KiB). Paint Calculator, final runs: Performance 99 and 92, Accessibility 100, Best Practices 100, SEO 83 (LCP 1.8s / 0.8s, CLS 0, TTI 1.8s / 1.5s, TBT 60 ms / 340 ms, 129 KiB). Concrete Calculator (pre-CSS-fix build): Performance 97, Accessibility 96, Best Practices 100, SEO 83 (LCP 1.5s, CLS 0, TTI 1.8s, TBT 200 ms). SEO 83 on every page is the same two audits: relative canonical and relative robots.txt sitemap URL — both need a domain (Phase 6). One mid-audit Paint run scored Performance 79 (TBT 900 ms) while the shared VM was loaded; scores vary run to run and are recorded as measurements, not guarantees. |
| Performance — shipped assets | `du`, `gzip -c` | ✅ `dist/` totals 1.3 MB. Per calculator page: HTML ~27 KB (paint), CSS 21,660 B raw / 4,772 B gzipped (shared `Layout.*.css`), JS ~116 KB gzipped (React client 65.7 KB gz + GenericCalculator 47.1 KB gz + react 3.0 KB gz; raw 393 KB). My Project page JS 4.7 KB raw / 1.6 KB gz. No external assets at all (no web fonts, no images beyond local SVG). |
| Cross-browser | Firefox 159 probe | ✅ Firefox 159.0 (Playwright firefox v1572, installed for this audit): home, paint, concrete, and my-project pages load with correct H1s; Paint results render; `.btn-primary` is brand orange; zero console errors. Safari/WebKit was not tested — no WebKit browser is installed in this environment. |
| Sitemap check | Playwright + manual read of `dist/sitemap.xml` | ✅ 39 URLs: all shipped pages including all 25 calculator pages; no unshipped page listed — there are no unshipped pages left. |
| Spot checks | Playwright probe + screenshot | ✅ Paint defaults render with styled layout (screenshot verified visually after the CSS fix: orange toggle buttons, bordered inputs, breadcrumbs). Ceiling-tile, primer, and baseboard defaults still match the FORMULAS.md worked examples (Phase 4 spot checks, re-confirmed by the passing Vitest worked-example tests). |
| Dependencies | `git diff package.json` | ✅ One new devDependency in Phase 5: `@types/node@24.19.2` (MIT, pinned exact) — fixes the typecheck error; recorded in `docs/LICENSE-AUDIT.md` §7. No new runtime dependency. |

## 11. Phase 6 Results (2026-11-20, Node v24.22.1)

Environment for every check below: local VM (shared 1.5 CPU), Node v24.22.1, `npm run preview` on http://127.0.0.1:4321, Chromium Headless 159 (Playwright 1.65.1) unless noted. The smoke test was run twice: once before and once after the AdSlot wiring change; the numbers below are from the final run, against the final build.

| Check | Command | Result |
|---|---|---|
| Production build (clean) | `rm -rf dist/ && npm run build` | ✅ Success in ~1.5s. 39 pages, fully static `dist/` (14 foundation + 25 calculator pages) + sitemap.xml with 39 URLs + `public/_headers` copied to `dist/_headers` (900 bytes) + `favicon.svg` + `og-image.svg`. `dist/` totals ~1.4 MB. |
| Unit tests | `npm run test` | ✅ 204 passed, 0 failed (31 files, ~7s) — 201 pre-existing + 3 new ads-guard tests in `src/lib/ads.test.ts` (ads disabled; publisher ID is the `ca-pub-XXXXXXXXXXXXXXXX` placeholder; slot IDs are `XXXXXXXXXX` placeholders). |
| Browser tests | `npm run test:e2e` | ✅ 68 passed, 0 failed (~37s) — 25 calculator tests × 2 viewports + home smoke × 2 + sitemap × 2 + planner × 2 (CSV export with contents, print calls `window.print`, clear with confirmation, corrupt-data empty state) + a11y keyboard × 2 + styles × 2, against `npm run preview`. |
| Typecheck | `npm run typecheck` | ✅ `astro check`: 0 errors, 0 warnings, 0 hints (113 files; was 111 in Phase 5, +2 for the new ads files). |
| Final smoke test | Playwright probe of `npm run preview` | ✅ 25/25 calculator URLs return 200, hydrate (`data-hydrated="true"`), zero console errors, zero page errors. Home, calculators index, My Project, and all 6 category pages also 200 with zero console errors. `sitemap.xml`, `robots.txt`, `favicon.svg`, `og-image.svg` all 200. |
| Sitemap check | Playwright + manual read of `dist/sitemap.xml` | ✅ 39 URLs: all shipped pages including all 25 calculator pages; no unshipped page listed — there are no unshipped pages left. |
| Security headers | Read of `public/_headers` + clean-build check | ✅ File is valid Cloudflare Pages `_headers` format (`/*` rule, indented headers) and lands in `dist/_headers`. Not live-verified: `astro preview` does not apply `_headers` locally, so the live header check is a post-launch step (`docs/DEPLOYMENT.md` §10). |
| Ads disabled | Grep of `dist/` + new guard tests | ✅ No `adsbygoogle`, `pagead2`, or `googlesyndication` markup or script anywhere in `dist/`; no external `<script src="http…">`; the only external URL strings in built JS are `https://react.dev` (React error text) and `http://www.w3.org` (namespace string), neither a network call. No `fetch(` in built JS. The two grep hits for "ads"/"analytics" are React's `onDoubleClick` event names in the client bundle and the privacy-policy prose stating ads are disabled. `AdSlot` renders nothing and is now wired into the shared layout; publisher/slot IDs are placeholders in the single config `src/lib/ads.ts`. No `public/ads.txt` exists; the template is `docs/ads.txt.template` with `pub-REPLACE-WITH-REAL-PUBLISHER-ID`. |
| Deployment prep | Documentation review | ✅ `docs/DEPLOYMENT.md` rewritten for Phase 6: Git integration path (§3, documented not executed — no Cloudflare account or Pages project yet; the GitHub repo now exists), manual deploy path with exact Wrangler commands (§4; wrangler **not** installed, install documented as a future step), build settings incl. Node 24 (§1, §3), pre-deploy checklist (§5), ads.txt (§7), Search Console verification for all three methods + sitemap submission + weekly first-month checks (§8), rollback procedure (§9), post-launch checks (§10), AdSense enablement checklist (§12), and §13 status (prepared vs needs owner approval). `docs/SEO-STRATEGY.md` §11 cross-references §8. |
| Dependencies | `git diff package.json` | ✅ No change — no new dependency in Phase 6, so nothing to add to `docs/LICENSE-AUDIT.md`. |

**Not done in Phase 6 (by design — needs owner approval):** no public deployment, no Cloudflare account created, GitHub repository created: https://github.com/silver-comet-76/homediycalc (main at snapshot 34b917a8), no domain purchased or connected, no Search Console submission, AdSense not enabled.

## 12. ADR-9 Release Gate — Three Consecutive Clean Full Test Rounds

Owner requirement (2026-11-20, recorded as ADR-9 in `docs/DECISIONS.md`): before the project is reported complete, run at least 3 FULL test rounds. Each round starts from a clean state (`rm -rf dist/`) and covers: Vitest unit tests, production build, Playwright end-to-end tests, and the Phase 5 audit checks (formulas, accessibility, SEO, security, privacy, performance). Only if ALL 3 rounds pass with ZERO failures or issues may the project be reported complete. If any round finds an issue, fix it and RESTART the count — the 3 clean rounds must be consecutive.

Each round runs the same checklist:

- Clean production build (`rm -rf dist/ && npm run build`) — must succeed, 39 pages.
- Vitest (`npm run test`) — must be 204/204, 0 failed.
- Typecheck (`npm run typecheck`) — must be 0 errors, 0 warnings, 0 hints.
- Playwright (`npx playwright test`) — must be 68/68, 0 failed (desktop + mobile).
- Audit checks — a scripted crawl of `dist/`: 39 HTML pages; sitemap lists exactly the 39 shipped URLs; every page has a unique title, unique meta description, canonical, and exactly one H1; zero dead internal links; no external `<script src>` in `dist/`; no tracking/ad strings (`doubleclick.net`, `google-analytics.com`, `googletagmanager.com`, `adsbygoogle`, `pagead2`); no `fetch`/`XMLHttpRequest`/`WebSocket` in built output; no real-looking publisher ID in `src/lib/ads.ts`. (Formula validation is covered by the Vitest worked-example tests, re-validated by hand in Phase 5; accessibility is covered by the Playwright a11y tests plus Lighthouse below.)
- Lighthouse (`npx lighthouse`, desktop preset, `CHROME_PATH` = Playwright Chromium 159) on Home and Paint — performance, accessibility, best-practices, SEO. **SEO 83 is the expected score, not a failure:** the only failing audits are the relative canonical and relative robots.txt sitemap URL, which both need a domain (no domain exists yet — owner approval pending). This was 83 in Phase 5 too; it is a documented limitation, not a defect.

### Round 1 — 2026-11-20 ~10:23–10:30 JST — ✅ PASS (clean round 1 of 3)

| Check | Result |
|---|---|
| Clean production build | ✅ 39 pages in 1.61s |
| Vitest | ✅ 204 passed, 0 failed (31 files) |
| Typecheck | ✅ 0 errors, 0 warnings, 0 hints |
| Playwright | ✅ 68 passed, 0 failed (36.4s) |
| Audit checks (SEO crawl + security + privacy) | ✅ PASS — 39 pages, sitemap 39 URLs, unique titles/descriptions, canonicals, one H1 each, zero dead internal links, no external scripts, no tracking/ad strings, no network calls in built output |
| Lighthouse Home | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.3s, CLS 0) |
| Lighthouse Paint | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0) |

No failures, no issues found. Running tally: **1 consecutive clean round**.

### Round 2 — 2026-11-20 ~10:26–10:35 JST — ❌ FAIL (environment failure, not a product defect)

| Check | Result |
|---|---|
| Clean production build | ✅ 39 pages in 1.53s |
| Vitest | ✅ 204 passed, 0 failed (31 files) |
| Typecheck | ✅ 0 errors, 0 warnings, 0 hints |
| Playwright | ❌ **Did not run** — the runner could not start a browser or a server (see diagnosis) |
| Audit checks (SEO crawl + security + privacy) | ✅ PASS — 39 pages, sitemap 39 URLs, unique titles/descriptions, canonicals, one H1 each, zero dead internal links, no external scripts, no tracking/ad strings, no network calls in built output |
| Lighthouse | ❌ Not run — no working browser to measure with |

**What failed:** the Playwright step failed before any test executed. `npx playwright test` died with an npm permissions error; the direct binary run then failed with `Error: EPERM: operation not permitted, write`. The site code had not changed since Round 1 (only this report file was edited).

**Diagnosis (all 2026-11-20, same session):** the failures are environmental, and they began at ~10:26 JST, after Round 1 passed clean at 10:23 and Lighthouse ran fine at 10:24–10:25:

- `astro preview` (Playwright's webServer) starts, prints "ready", then **exits code 1** because writing its lockfile `.astro/preview.json` fails with `EPERM: operation not permitted, write` (lockfile.js:126). The lockfile was left 0 bytes; deleting it and re-verifying 5/5 Node writes succeed did **not** fix it — the next `astro preview` failed the same way. A plain Python `http.server` on the same port serves `dist/` fine (200 on `/` and on the CSS file), so the built site is servable; only Astro's lockfile write fails.
- With a working static server, the Playwright styles test still failed: Chromium headless shell launches then **dies with SIGTRAP** (`process did exit: exitCode=null, signal=SIGTRAP`); Playwright then reports `Error: EPERM: operation not permitted, write` when the dead browser's pipe breaks.
- The browser is broken outside Playwright too: `chrome-headless-shell --dump-dom` and full `chrome --dump-dom` both exit 133 (SIGTRAP) with 0 bytes output; `--single-process --no-zygote` exits 132 (**SIGILL / Illegal instruction**); Firefox 159 `--dump-dom` exits 1 with no output and no error text. `--version` works for both browsers, so the binaries start but crash as soon as they render. CPU is AMD EPYC 9D25 with AVX/AVX2/FMA, so this is not a missing CPU feature.
- The EPERM is systemic, not Astro-specific: `npm` intermittently fails to start (`npm error … permissions of the file and its containing directories`, debug log left 0 bytes); `apt-get` (during an attempted `playwright install chromium --with-deps`) failed with `E: Write error - write (1: Operation not permitted)`; Node `writeFileSync` to `.astro/preview.json` failed EPERM once, then succeeded after a shell write to the same file. Shell writes (`echo > file`) to the same paths succeed. Disk is fine (142 GB free, /tmp 488 MB free, /dev/shm 794 MB free). Host memory is tight (MemAvailable ~580–630 MB of 7.9 GB; the visible processes use only ~270 MB RSS, so the pressure comes from elsewhere on the shared host).
- **Not a product defect:** no product file changed between Round 1 (pass) and Round 2 (fail); the build, Vitest, typecheck, and audit checks all pass identically in both rounds. The failures are all in the environment's ability to start a server/browser and write files.

**Fix attempted:** deleted the 0-byte `.astro/preview.json` lockfile (writes then succeeded 5/5 from a Node one-liner) — did not fix `astro preview`, which failed again the same way. Tried a plain Python static server as the Playwright webServer replacement — server works, but the browser itself still crashes, so the round cannot proceed. Attempted `playwright install chromium --with-deps` to rule out a corrupted browser install; the `apt-get` part needs owner approval (approval request timed out, **not performed** — see below) and the reinstall was not completed. A fresh browser copy was not verified, because Firefox (a separate install) fails the same way, which points away from a corrupted Chromium install and toward the environment.

**Count reset:** per ADR-9, a round that does not pass restarts the count. **Running tally: 0 consecutive clean rounds.** Three fresh consecutive clean rounds are required once the environment recovers (working browser + working `astro preview`/static server + no EPERM on writes). The product itself needs no fix for this failure.

**Open item:** `playwright install chromium --with-deps` (reinstall browsers + system deps via apt) was attempted to rule out a corrupted browser install; the apt step requires owner approval, the approval request timed out, and it was **not performed**. If the environment stays broken, this is a candidate next step — but it needs the owner's approval first, and it should only be tried after confirming the environment (writes, memory) is healthy again, since apt itself hit the same EPERM.

### Round 1 (new series) — 2026-11-20 ~12:27–12:32 JST — ✅ PASS (clean round 1 of 3)

Environment recovered since the Round 2 failure: file writes work (shell + Node), Chromium headless shell and full Chrome both launch and render (exit 0), `astro preview` starts and serves (lockfile write works). Memory still tight (MemAvailable ~620 MB at round start, ~1.2 GB later — varies with host load).

| Check | Result |
|---|---|
| Clean production build | ✅ 39 pages in 1.51s (`rm -rf dist/ && npm run build`), `dist/` 1.4 MB |
| Vitest | ✅ 204 passed, 0 failed (31 files, 7.33s) |
| Typecheck | ✅ 0 errors, 0 warnings, 0 hints (115 files) |
| Playwright | ✅ 68 passed, 0 failed (36.7s, desktop + mobile) |
| Audit checks (SEO crawl + security + privacy) | ✅ PASS — 39 pages, sitemap 39 URLs matching shipped pages exactly, unique titles/descriptions, canonicals, one H1 each, zero dead internal links (39 checked), no external scripts, no tracking/ad strings, no fetch/XHR/WebSocket in built JS, ads.ts publisher ID is the placeholder |
| Lighthouse Home | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0, TTI 0.2s, TBT 0 ms) |
| Lighthouse Paint | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0, TTI 0.3s, TBT 0 ms) |

**Measurement note (not a product issue):** Lighthouse's chrome-launcher failed twice with the full Chrome binary (`CHROME_PATH` = Playwright Chromium 159 full `chrome`) — "waiting for dynamic debugging port" — even though the same binary launches fine standalone and opens its DevTools port (verified manually: Chrome/159.0.8154.6, `/json/version` responds). The runs above used the Playwright Chromium **headless shell** binary as `CHROME_PATH` instead, which works. Playwright itself (68 tests) ran on its default browser with no issue, so the browser is healthy; only the Lighthouse↔full-Chrome launcher handshake fails in this environment. The Lighthouse binary used is recorded here for reproducibility.

No failures, no issues found. Running tally: **1 consecutive clean round**.

### Round 2 (new series) — 2026-11-20 ~12:32–12:34 JST — ✅ PASS (clean round 2 of 3)

| Check | Result |
|---|---|
| Clean production build | ✅ 39 pages in 1.52s (`rm -rf dist/ && npm run build`) |
| Vitest | ✅ 204 passed, 0 failed (31 files) |
| Typecheck | ✅ 0 errors, 0 warnings, 0 hints |
| Playwright | ✅ 68 passed, 0 failed (37.4s, desktop + mobile) |
| Audit checks (SEO crawl + security + privacy) | ✅ PASS — same audit script as Round 1 (`/tmp/gate-audit.py`): 39 pages, sitemap 39 URLs, unique titles/descriptions, canonicals, one H1 each, zero dead internal links, no external scripts, no tracking/ad strings, no fetch/XHR/WebSocket, ads.ts placeholder |
| Lighthouse Home | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0, TTI 0.2s, TBT 0 ms) |
| Lighthouse Paint | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0, TTI 0.2s, TBT 0 ms) |

Lighthouse again via the headless shell binary (full-Chrome launcher handshake still fails — see Round 1 note; browser itself verified healthy). No failures, no issues found. Running tally: **2 consecutive clean rounds**.

### Round 3 (new series) — 2026-11-20 ~12:34–12:36 JST — ✅ PASS (clean round 3 of 3)

| Check | Result |
|---|---|
| Clean production build | ✅ 39 pages in 1.68s (`rm -rf dist/ && npm run build`) |
| Vitest | ✅ 204 passed, 0 failed (31 files) |
| Typecheck | ✅ 0 errors, 0 warnings, 0 hints |
| Playwright | ✅ 68 passed, 0 failed (35.6s, desktop + mobile) |
| Audit checks (SEO crawl + security + privacy) | ✅ PASS — same audit script as Rounds 1–2: 39 pages, sitemap 39 URLs, unique titles/descriptions, canonicals, one H1 each, zero dead internal links, no external scripts, no tracking/ad strings, no fetch/XHR/WebSocket, ads.ts placeholder |
| Lighthouse Home | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0, TTI 0.2s, TBT 0 ms) |
| Lighthouse Paint | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0.005, TTI 0.2s, TBT 0 ms — CLS 0.005 is well within the "good" threshold of < 0.1; recorded as measured, not a defect) |

No failures, no issues found. Running tally: **3 consecutive clean rounds**.

## ADR-9 Release Gate — ✅ PASSED (2026-11-20 ~12:36 JST)

Three consecutive full test rounds (Rounds 1–3 of the new series, ~12:27–12:36 JST) passed with zero failures or issues after the earlier Round 2 environment failure reset the count. Each round ran from a clean state (`rm -rf dist/`): clean production build (39 pages), Vitest 204/204, typecheck 0/0/0, Playwright 68/68 (desktop + mobile), the scripted SEO/security/privacy audit (PASS all three rounds), and Lighthouse on Home and Paint (Performance 100, Accessibility 100, Best Practices 100, SEO 83 on every run — the expected score, as documented: the only failing SEO audits are the relative canonical and relative robots.txt sitemap URL, which need a domain that does not exist yet).

The gate's requirements are met: **the project may be reported complete.** Standing limitations carried forward (not gate failures): no domain yet (SEO 83 cap), no public deployment, AdSense disabled, WebKit/Safari untested (no WebKit browser in this environment — see Phase 5). (The GitHub repo now exists at https://github.com/silver-comet-76/homediycalc.) The Lighthouse full-Chrome launcher quirk (see Round 1 note) is an environment measurement detail, not a product issue; Lighthouse was run via the Playwright Chromium headless shell binary.

## 13. Phase 7 Results — Independent Audit and Remediation (2026-11-21, Node v24.22.1)

Phase 7 is the independent audit ordered by GitHub Issue #1 (reviewer: fnaticjohn / ChatGPT, Product Manager). All work happened on the local `phase-7` branch (base `ca29ba1`, content-identical to GitHub `main` at snapshot `34b917a8`); the remote branch does not exist yet — creating it needs a fresh user approval on the connector card (the first approval expired before it was answered), so nothing in this section has been pushed.

### 13.1 Audit (five independent read-only auditors, 2026-11-21)

- **Formula audit (25 calculators):** every worked example in `docs/FORMULAS.md` was hand-derived from first principles and checked against manufacturer/standards sources (QUIKRETE, Sherwin-Williams, MAPEI, ASTM C270, BIA TN10, ICPI Tech Spec 2, CUSTOM TDS-119, RedGard TDS-104, Schluter KERDI). **7 calculators PASS** (concrete bags, cubic yard, cubic feet, mulch, board foot, tile adhesive, sealant). **18 DEFECT — 11 major, 19 minor formula defects total.** No formula told a user to buy too little except where flagged below.
- **Major defects found:** paint metric coverage was m²/gal, not m²/L (~3.8× over-order); topsoil cost double-counted bulk + bags with no rounded bulk order quantity; brick gave 18 mortar bags vs the Mortar Calculator's 9 for the same wall; mortar site-mix understated ASTM C270 yields by 24–39%; grout 25-lb FAQ coverage wrong on all three figures (267 vs 388); drywall screws not scaled by sheet size (301 vs 430 for 4×12); paver base tons used compacted volume (20% low), base/bedding omitted the 6-in extension (~15% short), and the joint-sand FAQ was ~50% off; ceiling-tile carton default stayed 16 for 2×4 tiles (direct under-buy); waterproofing allowed 1 coat though TDS-104 requires 2.
- **Minor defects found (19):** false "0.33 ft" worked-example text (concrete, concrete slab); concrete accepted zero dimensions; slab edge formula double-counted corners (42.67 vs 40.00 ft³) and mesh was undocumented; rounded-intermediate equations (gravel, topsoil); tile doc omitted the grout joint; brick mortar volume double-counted waste; Type M sand range undocumented; paint doc promised quarts that do not exist; door-area convention split (21 vs 20 ft²); square-footage doc omitted the L-shape mode; flooring waste applied to underlayment; paver driveway depth 8 in vs ICPI 6 in; primer/waterproofing metric coverage mislabeled; wallpaper FAQ strip length wrong; baseboard net length not clamped (negative pieces).
- **Accessibility audit:** WebKit/Safari **untestable in this environment** (binary downloaded, cannot launch — 12 missing host libraries; install needs sudo/apt approval). Chromium keyboard/labels/focus/skip-link/computed-styles/contrast all verified clean; the claimed contrast fix verified from rendered pixels at exactly 7.14:1. Six minor findings (F1–F6): card-title links 22px (< 24px WCAG 2.2 minimum), 1px UA focus outline on plain links, toggle state with no text/icon cue, select error path lacking `aria-describedby`, no `prefers-reduced-motion` override, no custom 404 page.
- **SEO/docs audit:** canonical/sitemap/robots all relative on all 39 pages — a deployment blocker (owner decision), not a defect; plumbing is complete, only the owner-approved origin is missing. `npm run lint` was a no-op echo exiting 0 (false green), with no linter installed and a dangling pointer to `docs/DECISIONS.md`. Category pages thin — Painting measured **90 words**, not the 108 claimed in §4.2/§10; the other five measured 133–162. 24 stale statements (README, DEPLOYMENT, QA-REPORT, PHASE-REPORT, ROADMAP, PRD) saying "no GitHub repo" / "ADR-9 requires 3 rounds" after the repo existed and the gate had passed. License: no `LICENSE` file — owner decision. 12 US competitor/SEO opportunities recorded separately from defects (see `docs/MARKET-RESEARCH.md`).

### 13.2 Remediation (all audit defects fixed on the `phase-7` branch)

| Area | Fixes |
|---|---|
| Formulas (groups A+B) | ⅓ ft text; zero dims rejected; slab edge band corrected to 2(L+W−2w)·w·e (40.00 ft³) + mesh documented; unrounded intermediates; topsoil rounded bulk order qty (whole-yard `ceilUp`) + either/or cost with bulk precedence; tile doc effective area; brick mortar bags now volume/yield primary (9 bags, matching Mortar Calculator) with the 37/bag rating as cross-check; brick mortar volume from pre-waste count (5.09 ft³); mortar site-mix replaced with ASTM C270 table yields (worked example 0.87/0.87/5.09 ft³) + M/O tests; sand range noted; grout FAQ corrected to 388/776/97.5 sq ft (MAPEI TDS); quarts sentence deleted; door convention documented; L-shape documented with non-overlap warning; direct `ceilUp` test suite added. |
| Formulas (group C) | Drywall screws scale by sheet size (28/35, 32/40, 40/50; 4×12 case = 430 screws); underlayment from raw area (100 ft² → 1 roll); paver base tons from loose volume (4.77 t) on the extended footprint (2.73 compacted / 3.41 loose yd³, bedding 18.42 ft³); driveway base 6 in per ICPI; joint-sand FAQ 123/56 ft² per bag; ceiling-tile carton default follows tile size (2×4 → 3 cartons); wallpaper FAQ 10.83 ft strips / 0.5 ft tail; waterproofing coats minimum 2; baseboard net length clamped at 0. |
| Metric coverage (systematic) | New `coverage` unitKind (ft²/gal ↔ m²/L; 1 ft²/gal = 0.024542 m²/L exact): paint 8.59, primer 7.36, waterproofing 2.70 m²/L, plus drywall compound coverage 100 ft²/gal = 2.45 m²/L (found during integration — same defect class, was never converted in metric mode). Metric≡imperial purchase-equivalence tests added. |
| Accessibility (F1–F6) | Card-title links ≥ 24px (`py-0.5`); global 2px brand-600 `:focus-visible` for links; ✓ marker on pressed toggles; select error `id` + `aria-describedby`; `prefers-reduced-motion` override; new `src/pages/404.astro` (single H1, links home + All Calculators, excluded from sitemap). |
| Docs + categories | All 24 stale statements corrected; ADR-9 outcome line added to `docs/DECISIONS.md`; dated note atop `docs/PHASE-REPORT.md`; ROADMAP Phase 1–6 boxes ticked where met. All 6 category pages rewritten to ≥ 300 words of original prose (Painting 90 → 629, Landscaping 133 → 680, Flooring and Tiles 136 → 704, Measurement 137 → 624, Concrete and Masonry 162 → 695, Interior and Maintenance 162 → 807); "linked only when built and tested" boilerplate replaced on 7 pages + Home FAQ. |
| Lint (ADR-10) | `prettier@3.10.1` (MIT) promoted from transitive to direct devDependency (exact pin); `npm run lint` is now a real `prettier --check` over the code tree with `.prettierrc` (printWidth 100) and `.prettierignore` (`.astro` — no Prettier parser — Markdown prose, `dist/`, `node_modules`, `coverage`, `package-lock.json`); whole code tree formatted once with `prettier --write` (mechanical only, no behavior change); recorded in `docs/LICENSE-AUDIT.md` and `docs/DEPLOYMENT.md` §5. |

**Corrections to historical figures in this report:** §7 (Phase 2) spot checks quoted the pre-fix brick figures (18 mortar bags, 5.34 ft³) and §8 (Phase 3) quoted the pre-fix paver loose base (2.96 yd³). Both rows now carry a dated Phase 7 note; the corrected figures are 9 bags / 5.09 ft³ and 3.41 yd³. The rows describe what was true when recorded and are left otherwise untouched.

### 13.3 ADR-9 re-gate — ✅ PASSED (2026-11-21 ~18:43–18:49 JST)

Three consecutive FULL clean rounds after remediation, each from a clean state (`rm -rf dist/`), run with the gate script `/tmp/phase7-gate-round.sh` (build, Vitest, typecheck, lint, scripted audit checks `/tmp/phase7-gate-audit.py`, Playwright e2e with full log, Lighthouse Home + Paint via the Playwright Chromium headless-shell binary with `CHROME_PATH` set — Lighthouse 12.8.2 ignores `--chrome-path`; the env var is required).

**Failed attempt before the count started:** the first post-remediation e2e run failed 74/76 — both home-page tests, because the new category prose mentions "Paint Calculator" in paragraph text and the test's `getByText("Paint Calculator")` became ambiguous (strict-mode violation). Fix: the test now uses `getByRole("link", { name: "Paint Calculator" })` (and the same for "Concrete Calculator" on the calculators index). A test-precision fix, not a product change. Count restarted from 0 per ADR-9. (A second script defect in the same attempt — Lighthouse never ran because `--chrome-path` was rejected — was fixed in the gate script and is recorded here, not hidden; that run is not counted as a round.)

| Check | Round 1 (~18:43–18:45 JST) | Round 2 (~18:45–18:47 JST) | Round 3 (~18:47–18:49 JST) |
|---|---|---|---|
| Clean production build | ✅ 40 pages in 1.92s (39 shipped + 404) | ✅ 40 pages | ✅ 40 pages |
| Vitest | ✅ 254 passed, 0 failed (37 files) | ✅ 254/254 | ✅ 254/254 |
| Typecheck | ✅ 0 errors, 0 warnings, 0 hints | ✅ 0/0/0 | ✅ 0/0/0 |
| Lint (`npm run lint`) | ✅ Prettier check passes | ✅ Pass | ✅ Pass |
| Playwright e2e | ✅ 76 passed, 0 failed (40.0s, desktop + mobile) | ✅ 76/76 (39.0s) | ✅ 76/76 (38.1s) |
| Audit checks (SEO crawl + security + privacy) | ✅ PASS — 39 pages, sitemap 39 URLs, unique titles/descriptions, canonicals, one H1 each, zero dead internal links, no external scripts, no tracking/ad strings, no fetch/XHR/WebSocket, ads.ts placeholder | ✅ PASS | ✅ PASS |
| Lighthouse Home | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.8s, CLS 0, TTI 0.8s) | ✅ 100/100/100/83 (LCP 0.8s, CLS 0, TTI 0.8s) | ✅ 100/100/100/83 (LCP 0.8s, CLS 0, TTI 0.8s) |
| Lighthouse Paint | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 1.7s, CLS 0, TTI 1.7s) | ✅ Performance 99, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.8s, CLS 0, TTI 0.9s) | ✅ Performance 98, Accessibility 100, Best Practices 100, SEO 83 (LCP 1.7s, CLS 0, TTI 1.7s) |

Paint performance 100 → 99 → 98 across the three rounds is shared-VM load variance (LCP/TTI move with it); Accessibility, Best Practices, and SEO are identical on every run, and SEO 83 is the expected score (relative canonical + relative robots.txt sitemap URL, which need a domain). No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.**

**Counts changed since the 2026-11-20 gate:** Vitest 204 → 254 (50 new regression tests), Playwright 68 → 76 (8 new a11y/styles/404 tests), pages 39 → 40 (custom 404 page added; sitemap still lists exactly the 39 shipped pages).

**Standing limitations carried forward (not gate failures):** no domain yet (SEO 83 cap), no public deployment, AdSense disabled, WebKit/Safari untested (no WebKit browser can launch in this environment), project license undecided (owner decision), canonical/sitemap/robots absolute-URL readiness blocked on an owner-approved origin. The `phase-7` branch exists locally only — the remote branch, the per-defect GitHub issues, and the Issue #1 summary comment still need user approval on the connector cards.

**Observation (not a defect, not a gate failure):** raw `npx tsc --noEmit` (not the project's typecheck) reports a pre-existing error in `src/lib/ads.ts(23,25)` (`import.meta.env` not typed under plain tsc). The project's own typecheck (`astro check`) is clean; the raw-tsc invocation is not a project command and was not fixed in this phase.
