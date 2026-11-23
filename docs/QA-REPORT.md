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
| Spot checks | Playwright probe | ✅ Tile defaults: 108 tiles / 11 boxes for 100 ft², 12×12 in tiles, ⅛ in joint, 10% waste. Brick defaults: 576 bricks, 18 mortar bags, 5.34 ft³ mortar for the 10×8 ft modular wall. Both match `docs/FORMULAS.md` worked examples. (Note 2026-11-21, Phase 7: the brick figures were corrected to 9 mortar bags and 5.09 ft³ — see §13. Note 2026-11-22, PR #2 review response: the 9-bag volume figure was wrong — the QUIKRETE data sheet states no cubic-foot yield — and the bag count is now 18 from the manufacturer rating; see §13.4.) |
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

Phase 7 is the independent audit ordered by GitHub Issue #1 (reviewer: fnaticjohn / ChatGPT, Product Manager). All work happened on the local `phase-7` branch (base `ca29ba1`, content-identical to GitHub `main` at snapshot `34b917a8`). The branch was pushed to GitHub on 2026-11-22 as snapshot commit `43ce2bf` (109 files); PR #2 (`phase-7` → `main`) was opened the same day and a summary comment was posted on Issue #1. The reviewer returned REQUEST_CHANGES on PR #2 (review 6009535299, 2026-11-22); the response — rating-governed mortar bags, the `ceilUp` boundary fix, and the reproducibility fixes — is recorded in §13.4 below and re-gated there. Nothing is merged or deployed.

### 13.1 Audit (five independent read-only auditors, 2026-11-21)

- **Formula audit (25 calculators):** every worked example in `docs/FORMULAS.md` was hand-derived from first principles and checked against manufacturer/standards sources (QUIKRETE, Sherwin-Williams, MAPEI, ASTM C270, BIA TN10, ICPI Tech Spec 2, CUSTOM TDS-119, RedGard TDS-104, Schluter KERDI). **7 calculators PASS** (concrete bags, cubic yard, cubic feet, mulch, board foot, tile adhesive, sealant). **18 DEFECT — 11 major, 19 minor formula defects total.** No formula told a user to buy too little except where flagged below.
- **Major defects found:** paint metric coverage was m²/gal, not m²/L (~3.8× over-order); topsoil cost double-counted bulk + bags with no rounded bulk order quantity; brick gave 18 mortar bags vs the Mortar Calculator's 9 for the same wall; mortar site-mix understated ASTM C270 yields by 24–39%; grout 25-lb FAQ coverage wrong on all three figures (267 vs 388); drywall screws not scaled by sheet size (301 vs 430 for 4×12); paver base tons used compacted volume (20% low), base/bedding omitted the 6-in extension (~15% short), and the joint-sand FAQ was ~50% off; ceiling-tile carton default stayed 16 for 2×4 tiles (direct under-buy); waterproofing allowed 1 coat though TDS-104 requires 2.
- **Minor defects found (19):** false "0.33 ft" worked-example text (concrete, concrete slab); concrete accepted zero dimensions; slab edge formula double-counted corners (42.67 vs 40.00 ft³) and mesh was undocumented; rounded-intermediate equations (gravel, topsoil); tile doc omitted the grout joint; brick mortar volume double-counted waste; Type M sand range undocumented; paint doc promised quarts that do not exist; door-area convention split (21 vs 20 ft²); square-footage doc omitted the L-shape mode; flooring waste applied to underlayment; paver driveway depth 8 in vs ICPI 6 in; primer/waterproofing metric coverage mislabeled; wallpaper FAQ strip length wrong; baseboard net length not clamped (negative pieces).
- **Accessibility audit:** WebKit/Safari **untestable in this environment** (binary downloaded, cannot launch — 12 missing host libraries; install needs sudo/apt approval). Chromium keyboard/labels/focus/skip-link/computed-styles/contrast all verified clean; the claimed contrast fix verified from rendered pixels at exactly 7.14:1. Six minor findings (F1–F6): card-title links 22px (< 24px WCAG 2.2 minimum), 1px UA focus outline on plain links, toggle state with no text/icon cue, select error path lacking `aria-describedby`, no `prefers-reduced-motion` override, no custom 404 page.
- **SEO/docs audit:** canonical/sitemap/robots all relative on all 39 pages — a deployment blocker (owner decision), not a defect; plumbing is complete, only the owner-approved origin is missing. `npm run lint` was a no-op echo exiting 0 (false green), with no linter installed and a dangling pointer to `docs/DECISIONS.md`. Category pages thin — Painting measured **90 words**, not the 108 claimed in §4.2/§10; the other five measured 133–162. 24 stale statements (README, DEPLOYMENT, QA-REPORT, PHASE-REPORT, ROADMAP, PRD) saying "no GitHub repo" / "ADR-9 requires 3 rounds" after the repo existed and the gate had passed. License: no `LICENSE` file — owner decision. 12 US competitor/SEO opportunities recorded separately from defects (see `docs/MARKET-RESEARCH.md`).

### 13.2 Remediation (all audit defects fixed on the `phase-7` branch)

| Area | Fixes |
|---|---|
| Formulas (groups A+B) | ⅓ ft text; zero dims rejected; slab edge band corrected to 2(L+W−2w)·w·e (40.00 ft³) + mesh documented; unrounded intermediates; topsoil rounded bulk order qty (whole-yard `ceilUp`) + either/or cost with bulk precedence; tile doc effective area; brick mortar bags now from the manufacturer count rating (18 bags, matching Mortar Calculator) with the waste-adjusted volume as the second governing constraint — the 0.6 ft³/bag volume figure is not on the QUIKRETE data sheet and was removed in the §13.4 review response; brick mortar volume from pre-waste count (5.09 ft³); mortar site-mix replaced with ASTM C270 table yields (worked example 0.87/0.87/5.09 ft³) + M/O tests; sand range noted; grout FAQ corrected to 388/776/97.5 sq ft (MAPEI TDS); quarts sentence deleted; door convention documented; L-shape documented with non-overlap warning; direct `ceilUp` test suite added. |
| Formulas (group C) | Drywall screws scale by sheet size (28/35, 32/40, 40/50; 4×12 case = 430 screws); underlayment from raw area (100 ft² → 1 roll); paver base tons from loose volume (4.77 t) on the extended footprint (2.73 compacted / 3.41 loose yd³, bedding 18.42 ft³); driveway base 6 in per ICPI; joint-sand FAQ 123/56 ft² per bag; ceiling-tile carton default follows tile size (2×4 → 3 cartons); wallpaper FAQ 10.83 ft strips / 0.5 ft tail; waterproofing coats minimum 2; baseboard net length clamped at 0. |
| Metric coverage (systematic) | New `coverage` unitKind (ft²/gal ↔ m²/L; 1 ft²/gal = 0.024542 m²/L exact): paint 8.59, primer 7.36, waterproofing 2.70 m²/L, plus drywall compound coverage 100 ft²/gal = 2.45 m²/L (found during integration — same defect class, was never converted in metric mode). Metric≡imperial purchase-equivalence tests added. |
| Accessibility (F1–F6) | Card-title links ≥ 24px (`py-0.5`); global 2px brand-600 `:focus-visible` for links; ✓ marker on pressed toggles; select error `id` + `aria-describedby`; `prefers-reduced-motion` override; new `src/pages/404.astro` (single H1, links home + All Calculators, excluded from sitemap). |
| Docs + categories | All 24 stale statements corrected; ADR-9 outcome line added to `docs/DECISIONS.md`; dated note atop `docs/PHASE-REPORT.md`; ROADMAP Phase 1–6 boxes ticked where met. All 6 category pages rewritten to ≥ 300 words of original prose (Painting 90 → 629, Landscaping 133 → 680, Flooring and Tiles 136 → 704, Measurement 137 → 624, Concrete and Masonry 162 → 695, Interior and Maintenance 162 → 807); "linked only when built and tested" boilerplate replaced on 7 pages + Home FAQ. |
| Lint (ADR-10) | `prettier@3.10.1` (MIT) promoted from transitive to direct devDependency (exact pin); `npm run lint` is now a real `prettier --check` over the code tree with `.prettierrc` (printWidth 100) and `.prettierignore` (`.astro` — no Prettier parser — Markdown prose, `dist/`, `node_modules`, `coverage`, `package-lock.json`); whole code tree formatted once with `prettier --write` (mechanical only, no behavior change); recorded in `docs/LICENSE-AUDIT.md` and `docs/DEPLOYMENT.md` §5. |

**Corrections to historical figures in this report:** §7 (Phase 2) spot checks quoted the pre-fix brick figures (18 mortar bags, 5.34 ft³) and §8 (Phase 3) quoted the pre-fix paver loose base (2.96 yd³). Both rows now carry dated Phase 7 notes; the corrected figures are 18 bags / 5.09 ft³ (18, not the 9 bags first recorded in Phase 7 — the 9-bag volume figure was corrected in the PR #2 review response, §13.4) and 3.41 yd³. The rows describe what was true when recorded and are left otherwise untouched.

### 13.3 ADR-9 re-gate — ✅ PASSED (2026-11-21 ~18:43–18:49 JST)

Three consecutive FULL clean rounds after remediation, each from a clean state (`rm -rf dist/`), run with the gate script `scripts/gate-round.sh` (build, Vitest, typecheck, lint, scripted audit checks `scripts/gate-audit.py`, Playwright e2e with full log, Lighthouse Home + Paint via the Playwright Chromium headless-shell binary with `CHROME_PATH` set — Lighthouse 12.8.2 ignores `--chrome-path`; the env var is required). The scripts were first written to `/tmp` and lost in a VM replacement; they were recreated and committed to the repo on 2026-11-22 (see §13.4), so any round can be reproduced with `bash scripts/gate-round.sh <n> <log-file>`. Lighthouse is pinned to 12.8.2 in the script.

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

Paint performance 100 → 99 → 98 across the three rounds is shared-VM load variance (LCP/TTI move with it); Accessibility, Best Practices, and SEO are identical on every run, and SEO 83 is the expected score (relative canonical + relative robots.txt sitemap URL, which need a domain). Stated as ranges across the three rounds: Home 100/100/100/83 every round; Paint Performance 98–100, Accessibility 100, Best Practices 100, SEO 83. No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.**

**Counts changed since the 2026-11-20 gate:** Vitest 204 → 254 (50 new regression tests), Playwright 68 → 76 (8 new a11y/styles/404 tests), pages 39 → 40 (custom 404 page added; sitemap still lists exactly the 39 shipped pages).

**Standing limitations carried forward (not gate failures):** no domain yet (SEO 83 cap), no public deployment, AdSense disabled, WebKit/Safari untested (no WebKit browser can launch in this environment), project license undecided (owner decision), canonical/sitemap/robots absolute-URL readiness blocked on an owner-approved origin. The `phase-7` branch is on GitHub (snapshot commit `43ce2bf`, 2026-11-22) with PR #2 open and the Issue #1 summary comment posted; the reviewer returned REQUEST_CHANGES (review 6009535299) — see §13.4.

**Observation (not a defect, not a gate failure):** raw `npx tsc --noEmit` (not the project's typecheck) reports a pre-existing error in `src/lib/ads.ts(23,25)` (`import.meta.env` not typed under plain tsc). The project's own typecheck (`astro check`) is clean; the raw-tsc invocation is not a project command and was not fixed in this phase.

### 13.4 PR #2 review response — ✅ re-gate PASSED (2026-11-22 ~11:05–11:10 JST)

Reviewer fnaticjohn returned REQUEST_CHANGES on PR #2 (review 6009535299, submitted 2026-11-22 01:52 UTC, on snapshot commit `43ce2bf`). All three findings were addressed on the `phase-7` branch (local commit `5e558e6`, "Phase 7 review response (PR #2)") and the ADR-9 gate was re-run from scratch — 3 consecutive clean full rounds, no failures, no issues.

**P0 — mortar purchase recommendation contradicted the manufacturer yield.** The worked example recommended 9 bags from a 0.6 ft³/bag volumetric yield, while the QUIKRETE Mortar Mix No. 1102 data sheet rates one 80 lb bag at up to 37 standard bricks (576 ÷ 37 = 16 bags minimum). Reading the data sheet (both pages, 2026-11-22) showed the 0.6 ft³ figure is not on it at all: the sheet states only the count rating — "each 80 lb bag will lay up to 37 standard bricks or 13 standard (8 in by 8 in by 16 in) blocks" — no cubic-foot yield and no waste allowance. Fix: bags now come from the rating, derated by the waste allowance — the larger of the bricks you buy ÷ 37 and the installed bricks × (1 + mortar waste%) ÷ 37 governs (18 bags for the worked example). Waste is counted once per material: brick breakage in the brick count only, mortar waste derating the rating only. At the rating's implied yield (37 × 0.00806 ≈ 0.30 ft³ per bag), 18 bags provide ≈ 5.37 ft³, covering the 5.09 ft³ waste-adjusted volume. The `bagYieldFt3` input and the `MORTAR_BAG_YIELD_FT3` constant are removed; the mortar volume is unchanged and still feeds the site-mix parts. Regression tests: brick rating floor (16), zero-mortar-waste case (16), block 100 ft² → 10 bags, block 80 ft² → 8 bags, a floor sweep (bags × units-per-bag ≥ waste-adjusted unit count for brick and block at 4 areas), and the cross-calculator agreement test (both 18 bags). Shopping-list lines and cost use the new bag count (worked-example cost 576 × $0.50 + 18 × $8 = $432). Recorded as ADR-11; `docs/FORMULAS.md` §§10/18, both calculator configs, and both worked examples updated.

**P1 — `ceilUp` boundary.** The fixed 1e-9 epsilon could round a strictly positive requirement below 1e-9 down to zero packages, and could round a genuinely above-integer value within epsilon down. Fix: a relative 1e-12 epsilon (the larger of 1e-12 absolute and 1e-12 × |value|) — floating-point noise after the codebase's short calculation chains is at most ~1e-13 relative — plus a guarantee that any strictly positive requirement orders at least one package (zero stays zero). Tests: tiny positives (1e-12, 5e-10 → 1), genuinely above-integer (5.0000000005 → 6), zero/negative → 0. Tolerance and the guarantee are documented in `src/lib/units.ts` and ADR-11.

**P1 — status / reproducibility.** README and this §13 claimed the remote branch and the Issue #1 comment did not exist; both exist since 2026-11-22 (branch snapshot `43ce2bf`, PR #2, comment 7072488501) and the lines are corrected. The gate scripts the reviewer asked for are committed in the repo — `scripts/gate-round.sh` (one full round, log file argument) and `scripts/gate-audit.py` (14 checks over `dist/`) — with Lighthouse pinned to 12.8.2. The originals lived only in `/tmp` and were lost in a VM replacement; they were recreated from the §13.3 description and committed on 2026-11-22. Lighthouse is reported as ranges (Paint Performance 98–100 across both gates), and the build count is stated as 39 indexable pages + custom 404 wherever it appears. Prettier is described as a formatting check only, per ADR-10.

**Deferred/owner gates unchanged:** WebKit environment gap, absolute URLs and live validation, license, deployment, ads. No domain bought, no ads activated.

Three consecutive FULL clean rounds after the review-response fix, each from a clean state (`rm -rf dist/`), run with `scripts/gate-round.sh` (build, Vitest, typecheck, lint, `scripts/gate-audit.py`, Playwright e2e with full log, Lighthouse Home + Paint via the Playwright Chromium headless-shell binary with `CHROME_PATH` set, Lighthouse 12.8.2). Per-round logs: `docs/gate-logs/2026-11-22-review-response/round-{1,2,3}.log`.

| Check | Round 1 (~11:05–11:06 JST) | Round 2 (~11:07–11:08 JST) | Round 3 (~11:08–11:10 JST) |
|---|---|---|---|
| Clean production build | ✅ 40 pages in 1.54s (39 indexable + 404) | ✅ 40 pages | ✅ 40 pages |
| Vitest | ✅ 258 passed, 0 failed (37 files) | ✅ 258/258 | ✅ 258/258 |
| Typecheck | ✅ 0 errors, 0 warnings, 0 hints | ✅ 0/0/0 | ✅ 0/0/0 |
| Lint (`npm run lint`) | ✅ Prettier check passes | ✅ Pass | ✅ Pass |
| Playwright e2e | ✅ 76 passed, 0 failed (39.8s, desktop + mobile) | ✅ 76/76 (38.5s) | ✅ 76/76 (39.9s) |
| Audit checks (SEO crawl + security + privacy) | ✅ PASS — 39 indexable pages + 404, sitemap 39 URLs, unique titles/descriptions, canonicals, one H1 each, zero dead internal links, no external scripts, no tracking/ad endpoints, no fetch/XHR/WebSocket, ads.ts placeholder | ✅ PASS | ✅ PASS |
| Lighthouse Home | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.2s, CLS 0, TTI 0.2s) | ✅ 100/100/100/83 (LCP 0.2s, CLS 0, TTI 0.2s) | ✅ 100/100/100/83 (LCP 0.2s, CLS 0, TTI 0.2s) |
| Lighthouse Paint | ✅ Performance 100, Accessibility 100, Best Practices 100, SEO 83 (LCP 0.4s, CLS 0, TTI 0.4s) | ✅ 100/100/100/83 (LCP 0.4s, CLS 0, TTI 0.4s) | ✅ 100/100/100/83 (LCP 0.2s, CLS 0.005, TTI 0.2s) |

Ranges across these three rounds: Home 100/100/100/83 every round; Paint Performance 100, Accessibility 100, Best Practices 100, SEO 83. (Across both gates — §13.3 and this one — Paint Performance is 98–100; the 98/99 in §13.3 were shared-VM load variance.) SEO 83 is the expected score (relative canonical + relative robots.txt sitemap URL, which need a domain). No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.**

**Counts changed since §13.3:** Vitest 254 → 258 (4 new regression tests: brick rating floor + zero-waste case, block 80 ft² case, rating-floor sweep, `ceilUp` tiny-positive cases). Playwright still 76/76, pages still 40 (39 indexable + 404), sitemap still 39 URLs.

**Standing limitations carried forward (not gate failures):** unchanged from §13.3 — no domain yet (SEO 83 cap), no public deployment, AdSense disabled, WebKit/Safari untested, project license undecided (owner decision), canonical/sitemap/robots absolute-URL readiness blocked on an owner-approved origin. The review-response changes were pushed to the remote `phase-7` branch (head `0f042c7f`, 2026-11-22) and the review was answered on PR #2 (comment 7073041173, re-review requested). The reviewer then returned a second review (6009895920) with one remaining P0 — see §13.5. Nothing is merged, deployed, or closed.

### 13.5 PR #2 second re-review response (ADR-12) — ✅ re-gate PASSED (2026-11-22 ~12:04–12:09 JST)

**Review:** PR #2, review 6009895920 (submitted 2026-11-22T02:55:17Z, against commit `0f042c7f`). The reviewer accepted the standard-case fixes (18 bags), the `ceilUp` guard, and the committed gate scripts/logs, and raised one remaining P0: the count-only manufacturer rating breaks for custom geometry. Both calculators accept an adjustable joint width and Brick accepts custom brick dimensions, yet the bag count used the fixed standard-unit rating — so on the 80 ft² modular wall at 15% mortar waste, widening the joint from ⅜ to ¾ in raises the mortar volume from 5.09 to 8.82 ft³ while the recommended bags fall from 18 to 15, contradicting the claim that the bag count covers the waste-adjusted volume.

**Fixes (all in `src/lib/formulas/brick.ts`, `src/lib/formulas/mortar.ts`, both calculator configs, `docs/FORMULAS.md` §§10/18, ADR-12):**

- **P0 — rating limited to standard geometry.** The manufacturer count rating now applies only to modular brick (7⅝ × 2¼ × 3⅝ in) or standard 8 × 8 × 16 block at the standard ⅜ in joint or narrower, within a 1% relative tolerance that absorbs metric rounding only (9.5 mm joint, 194 × 57 × 92 mm brick). A narrower joint stays applicable: it uses no more mortar per unit than the standard case, so the rating remains a conservative basis (¼ in joint → 3.58 ft³, 19 bags, still covering the volume at the rating's implied yield). The standard case is unchanged: 18 bags for the worked example in both calculators.
- **P0 — verified user-entered yield for custom geometry.** For wider joints or non-modular brick, the bag count comes from a user-entered verified yield (ft³ per 80 lb bag, from the bag's own data sheet — no default, no product yield claimed): bags = ceil(waste-adjusted mortar volume ÷ yield). With no yield entered, no bag count, bag cost, or shopping-list bag line is shown, and the page explains why and what to enter (a `note` under the results). The rejected alternative — adding a volume-coverage check against the rating's implied yield — would itself invent a product yield, since the implied yield (≈ 0.30 ft³/bag) is a property of the standard geometry, not of the bag.
- **Nonblocking notes addressed in the same change.** The gate script no longer hardcodes the Chromium path: it resolves `$CHROME_PATH` when set, otherwise the newest `chromium_headless_shell-*` under the Playwright cache. It now enforces explicit Lighthouse launch thresholds (Performance/Accessibility/Best Practices ≥ 90, SEO ≥ 80, documented in the script header) — a passing round now means the scores were checked, not just produced. The stale "ready to push" line at the end of §13.4 is corrected (the changes were pushed and the review answered).

**Regression tests:** 24 new tests (Vitest 258 → 282) — formula level: wide joint suppressed (8.82 ft³, no bags), user-yield path (30 bags at 0.3 ft³/bag, agreeing across both calculators), narrow joint (19 bags, volume covered), custom depth/length/height suppressed, metric equivalents (19.05 mm → suppressed; 9.5 mm and 194 × 57 × 92 mm → 18 bags); config level: bag row/line/cost suppression and the yield path in both calculators, including the site-mix parts still coming from the volume when bags are suppressed.

**Re-gate — 3 consecutive clean full rounds PASSED (2026-11-22 ~12:04–12:09 JST):**

| Check | Round 1 (03:04:52Z) | Round 2 (03:06:34Z) | Round 3 (03:08:09Z) |
|---|---|---|---|
| Clean build | 40 pages | 40 pages | 40 pages |
| Vitest | 282/282 | 282/282 | 282/282 |
| Typecheck | 0 errors / 0 warnings / 0 hints | 0/0/0 | 0/0/0 |
| Lint (Prettier check) | pass | pass | pass |
| Scripted audit checks (`scripts/gate-audit.py`) | ALL CHECKS PASSED | ALL CHECKS PASSED | ALL CHECKS PASSED |
| Playwright e2e | 76/76 (40.6 s) | 76/76 (37.2 s) | 76/76 (37.8 s) |
| Lighthouse Home (desktop) | 100/100/100/83 | 100/100/100/83 | 100/100/100/83 |
| Lighthouse Paint (desktop) | 100/100/100/83 | 100/100/100/83 | 100/100/100/83 |

Ranges across these three rounds: Home 100/100/100/83 every round (LCP 0.2 s, CLS 0, TTI 0.2 s); Paint 100/100/100/83 every round (LCP 0.4 s, TTI 0.4 s; CLS 0, 0, 0.005). Across all three gates (§13.3, §13.4, this one) Paint Performance is 98–100; the 98/99 in §13.3 were shared-VM load variance. SEO 83 is the expected score (relative canonical + relative robots.txt sitemap URL, which need a domain). Lighthouse thresholds were enforced by the script in every round (all scores above their floors). No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.**

**Counts changed since §13.4:** Vitest 258 → 282 (24 new regression tests, listed above). Playwright still 76/76, pages still 40 (39 indexable + 404), sitemap still 39 URLs.

**Standing limitations carried forward (not gate failures):** unchanged from §13.4 — no domain yet (SEO 83 cap), no public deployment, AdSense disabled, WebKit/Safari untested, project license undecided (owner decision), canonical/sitemap/robots absolute-URL readiness blocked on an owner-approved origin. The second-review-response changes were pushed to the remote `phase-7` branch (head `f4d2f3e1`, 2026-11-22, 121 files) and the review was answered on PR #2 (comment 7077400091, final re-review requested). The reviewer then approved (review 6011576970) and the owner approved the merge — see §13.6. Nothing is deployed or closed.

**Method note (same as §13.3):** all rounds run from a clean state (`rm -rf dist/`) with `bash scripts/gate-round.sh <round> <log-file>`; per-round logs in `docs/gate-logs/2026-11-22-second-review-response/` (`round-1.log`, `round-2.log`, `round-3.log`, `summary.txt`); Lighthouse pinned to 12.8.2; the Chromium headless-shell binary is resolved dynamically (see the script header); the gate now asserts the Lighthouse launch thresholds instead of only reporting the scores. Node v24.22.1, npm 10.9.4, Python 3.12.3.

### 13.6 PR #2 merged into main (2026-11-22)

**Verification before the merge:** PR #2 was read back from GitHub — state open, not merged, head `f4d2f3e13a04d0329c73300d1bf014d2461d351b` (`f4d2f3e1`), exactly the head ChatGPT's final approval review 6011576970 (fnaticjohn, APPROVED, 2026-11-22T09:52:14Z) was given against. The Project Owner's approval to merge was given in chat on 2026-11-22.

**Merge:** PR #2 merged into `main` on 2026-11-22 with a merge commit (method: merge, not squash/rebase, so the review history stays attached to the PR). **Merge commit: `e8345f7e0cb04051767955968bd8ef0efabd65e9`.** No unrelated changes were included — the merge contains only the reviewed `phase-7` head `f4d2f3e1` on top of `main` at snapshot `34b917a8`.

**Post-merge verification (completed 2026-11-22 ~20:30 JST):** read back from GitHub — PR #2 state `closed`, `merged: true`, `merged_at` 2026-11-22T10:25:04Z, `merged_by` silver-comet-76, head `f4d2f3e1` (ref `phase-7`), base `34b917a8` (ref `main`). (The MCP pull-request schema carries no `merge_commit_sha` field; the merge SHA is established from the branch head instead.) The `phase-8-launch` branch created from `main` points at head `e8345f7e0cb04051767955968bd8ef0efabd65e9`, whose message is "Merge pull request #2 from silver-comet-76/phase-7" — confirming the merge commit. Key files read back from `main`: `scripts/gate-round.sh` byte-identical to the reviewed head; `src/lib/formulas/brick.ts` matches the reviewed head exactly (the local copy differs only by the Phase 8 ADR-13 partial-cost changes); `docs/QA-REPORT.md` matches the reviewed head exactly (the local copy differs only by the §13.5 correction and the new §13.6/§14). The merged baseline is fully verified. Phase 8 work proceeds from the local `phase-8-launch` branch created from `f5a533b`, which is content-identical to the reviewed head `f4d2f3e1` — the merge adds no content changes of its own.

**Counts at merge:** 25 calculators, Vitest 282/282, Playwright 76/76, 40 pages (39 indexable + 404), Lighthouse Home + Paint 100/100/100/83. Issue #1 stays open (no auto-close keyword was ever in the PR body) until reviewer sign-off + owner approval are both recorded; the owner has approved the merge only, not the closure. Nothing is deployed.

## 14. Phase 8 — Controlled Staging and Pre-Public-Launch Readiness (Issue #3)

### 14.1 Scope and baseline

Phase 8 works from the merged `main` (PR #2, merge commit `e8345f7e`, reviewed head `f4d2f3e1`) on the local `phase-8-launch` branch (base `f5a533b`, content-identical to the reviewed head — the merge adds no content changes of its own). The Phase 8 change is local commit `c533731`. Scope per Issue #3: Brick partial-cost display; stale README/QA push-status reconciliation and merged-baseline documentation; privacy/terms/disclaimer/contact and ownership/license review; Cloudflare Pages configuration and controlled staging; environment-specific absolute canonical/sitemap/robots URLs from a verified owner-approved production origin; preview noindex and duplicate-content guards; launch/rollback documentation; WebKit/Safari verification or a documented blocker; security-header live checks (pending — no staging exists); Search Console steps. No new calculators, no scope creep, no public deploy, no domain purchase, no account creation, no ads/analytics, no indexing requests, no AdSense applications.

### 14.2 Fixes

- **Brick partial cost (ADR-13).** `src/lib/formulas/brick.ts` builds the cost per component: a mortar price alone with no bag count buys no countable quantity, so the total is suppressed (`costUsd` undefined) — never $0. A brick price with no bag count still buys a known brick count, so that figure is shown with `costPartial: true`. `CalculatorConfig.ts` adds `costLabel` / `costDetail` to `CalcOutput` and the `costShoppingListLine()` helper; `GenericCalculator.tsx` renders "Partial cost (bricks only)" with the detail "Excludes mortar — no bag count for this brick size or joint" in the results row and the copied shopping list. The Mortar Calculator already suppressed its cost when its bag count was unknown, so Brick was the only calculator with this defect. Known limitation (deferred, not fixed here): a partial brick cost added to My Project is stored as its bricks-only figure, so the project total excludes mortar — the calculator page labels it partial before the user adds it, and the versioned LocalStorage schema change is out of scope for this issue.
- **Environment-specific absolute URLs + preview noindex (ADR-14).** `src/lib/site.ts` exposes `SITE_URL` / `absoluteUrl()` from `PUBLIC_SITE_URL` (undefined when unset — no host is ever defaulted or invented) and `IS_PREVIEW` from `PUBLIC_PREVIEW`. `astro.config.mjs` sets `site` from the same variable. Canonical, `og:url`, breadcrumb `item` URLs (`SEO.astro`), sitemap `<loc>` entries (`sitemap.xml.ts`), and the robots `Sitemap:` directive (new build-time route `src/pages/robots.txt.ts`, replacing static `public/robots.txt`) all go through `absoluteUrl` — with the variable unset, every URL stays relative, exactly as before. `Layout.astro` adds `<meta name="robots" content="noindex, nofollow">` when `PUBLIC_PREVIEW=true`. The gate audit (`scripts/gate-audit.py`) now accepts absolute canonicals (path must still match the page's own path) and fails any build in which a page carries a noindex meta tag.
- **Privacy Policy §6** corrected: hosting was described as live ("The pages are served as static files from the hosting provider") before any deployment — now "once the site is deployed — it is not live yet" (date bumped to 2026-11-22). Terms, Disclaimer, and Contact reviewed: no invented identity or legal claim found. The Terms name no governing law and the pages speak as "HomeDIYCalc" with no personal/company operator — both are open owner decisions (`docs/DEPLOYMENT.md` §14.10), not decided here. Contact still honestly says no contact route exists and one will be set up before launch.
- **Deployment/staging documentation** (`docs/DEPLOYMENT.md` §14): exact Pages project settings, production-vs-preview environment-variable table, Cloudflare Access restriction steps (Zero Trust free tier, 50 users), local-preview staging procedure, live header-check commands (pending), Search Console notes, launch/rollback sequence, duplicate-content guard, and the owner-decisions table. No account, project, or deployment was created.
- **Merged-baseline reconciliation:** §13.5 stale closing line corrected; §13.6 records the merge; `README.md` Phase 7 paragraph updated to merged state + new Phase 8 paragraph; `docs/DEPLOYMENT.md` baseline references updated from snapshot `34b917a8` to merge `e8345f7e`; `docs/SEO-STRATEGY.md` §§3–4 and `AGENTS.md` layout updated to the ADR-14 design; `docs/FORMULAS.md` §10 Cost line corrected (it previously described only the brick component) and documents the partial rule.

### 14.3 Environment mechanism verification (local, before the gate)

Built with `PUBLIC_SITE_URL=https://example.com PUBLIC_PREVIEW=true` (the RFC 2606 test origin — a mechanism test only, never a production host): canonicals absolute (`https://example.com/`, `https://example.com/calculators/paint-calculator/`), 39/39 sitemap locations absolute, robots `Sitemap: https://example.com/sitemap.xml`, and a noindex meta on every page. The gate audit on that build passed the canonical check and correctly **failed** the noindex check — proving the guard works. The default build was rebuilt afterwards: relative URLs, no noindex anywhere. No production origin was set or invented at any point.

### 14.4 WebKit / Safari — blocked, with procedure

**Not verified in this environment.** The Playwright WebKit binary is installed (`webkit-2388`) but cannot launch: the host is missing 12 system libraries (`libgtk-4-1`, `libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `libgstreamer-gl1.0-0`, `libgstreamer-plugins-bad1.0-0`, `libgraphene-1.0-0`, `libevent-2.1-7t64`, `libavif16`, `libmanette-0.2-0`, `libenchant-2-2`, `libsecret-1-0`, `libgles2`). Installing them needs `npx playwright install-deps webkit` (privileged `apt-get`); its approval card timed out on 2026-11-22 and the install did not run — retrying needs the owner's approval tap. The precise blocker and the independent device test procedure (real iPhone + Mac Safari, step by step) are documented in `docs/DEPLOYMENT.md` §14.8. No WebKit claim is made.

### 14.5 Security headers — live check pending

`public/_headers` is committed and copied to `dist/_headers` by the build, but `astro preview` does not apply it, so the headers cannot be verified locally. The live check (`curl -sI https://<live-host>/`) and the expected values are in `docs/DEPLOYMENT.md` §14.6. Until a staging or production host exists, this check is **pending**, not passed. No live deployment evidence exists for Phase 8 — all evidence below is local.

### 14.6 Regression tests — 16 new (Vitest 282 → 298; Playwright 76 → 78)

- Formula level (`brick.test.ts`, +4): mortar-only price with unknown bags → `costUsd` undefined (never $0); brick-only price → 241 partial; both prices → 241 partial; standard geometry → not partial; no prices → undefined.
- Config level (`brick config.test.ts`, +3): mortar-only → cost suppressed; brick price → "Partial cost (bricks only)" + "Excludes mortar"; standard geometry → no partial label.
- Shopping-list line (`CalculatorConfig.test.ts`, +4): undefined when no cost; full cost → "Estimated total…"; partial cost → "Partial cost (bricks only): $241.00 (Excludes mortar — …)" and never contains "total"; label kept without a detail.
- Site env (`site.test.ts`, +5): relative by default; absolute with an explicit origin; leading slash added; no origin and not a preview by default.
- Playwright (`home.spec.ts`, +1 test × 2 projects): default build carries no noindex meta and a relative canonical (`/`).

### 14.7 Re-gate — 3 consecutive clean full rounds PASSED (2026-11-22 ~20:18–20:23 JST)

| Check | Round 1 (11:18:49Z) | Round 2 (11:20:38Z) | Round 3 (11:22:16Z) |
|---|---|---|---|
| Clean build | 40 pages | 40 pages | 40 pages |
| Vitest | 298/298 | 298/298 | 298/298 |
| Typecheck | 0 errors / 0 warnings / 0 hints | 0/0/0 | 0/0/0 |
| Lint (Prettier check) | pass | pass | pass |
| Scripted audit checks (`scripts/gate-audit.py`) | ALL CHECKS PASSED | ALL CHECKS PASSED | ALL CHECKS PASSED |
| Playwright e2e | 78/78 (45.7 s) | 78/78 (39.4 s) | 78/78 (37.7 s) |
| Lighthouse Home (desktop) | 100/100/100/83 | 100/100/100/83 | 100/100/100/83 |
| Lighthouse Paint (desktop) | 100/100/100/83 | 100/100/100/83 | 100/100/100/83 |

Ranges across these three rounds: Home 100/100/100/83 every round (LCP 0.2 s, CLS 0, TTI 0.2 s); Paint 100/100/100/83 every round (LCP 0.4/0.3/0.4 s, CLS 0.005, TTI 0.4/0.3/0.4 s). SEO 83 is the expected score (relative canonical + relative robots.txt sitemap URL, which need a production origin). Lighthouse thresholds were enforced by the script in every round (all scores above their floors). No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.**

**Counts changed since §13.5:** Vitest 282 → 298 (16 new tests, §14.6). Playwright 76 → 78 (the new noindex test × 2 projects). Pages still 40 (39 indexable + 404), sitemap still 39 URLs.

**Standing limitations carried forward (not gate failures):** no domain/production origin yet (SEO 83 cap; absolute URLs ready but unactivated — ADR-14); no public deployment; AdSense disabled; WebKit/Safari unverified (§14.4); project license undecided (owner decision); security-headers live check pending (§14.5); post-merge read-back from GitHub completed (§13.6, 2026-11-22 ~20:30 JST). Nothing is merged, deployed, or closed.

**Method note (same as §13.3):** all rounds run from a clean state (`rm -rf dist/`) with `bash scripts/gate-round.sh <round> <log-file>`; per-round logs in `docs/gate-logs/2026-11-22-phase-8/` (`round-1.log`, `round-2.log`, `round-3.log`, `summary.txt`); Lighthouse pinned to 12.8.2; the Chromium headless-shell binary is resolved dynamically (see the script header); the gate asserts the Lighthouse launch thresholds instead of only reporting the scores. Node v24.22.1, npm 10.9.4, Python 3.12.3.

## 15. Phase 8 Review Response (PR #4, review 6012776210) — 2026-11-22 ~23:42 JST to 2026-11-23 ~00:07 JST

### 15.1 The review

ChatGPT review **6012776210** (fnaticjohn, CHANGES_REQUESTED, submitted 2026-11-22T14:31:47Z, against commit `9a522b50`). It verified the PR #2 merge, the robots route + static deletion, and the calculator-level partial cost; it did **not** independently rerun the reported test numbers. Findings: **P0** deployment defaults fail open; **P1** partial cost lost in My Project; docs corrections (stale §14.1 read-back text, first-public-deploy-as-staging fallback, `private: true` note); WebKit still an environment/owner-approval blocker. The response is commits `54250c3` (P0 + P1 + docs) and `b3d396e` (gate round-1 fix, §15.6).

### 15.2 P0 — explicit build modes, validated origin, fail-closed noindex (ADR-15)

- New `src/lib/origin.ts` (pure, no `import.meta.env`): `validateProductionOrigin` accepts only a bare `https://` hostname — no http, path, port, query, fragment, userinfo, localhost, `.local`, or IP literal; a bare word without a dot is rejected as a typo. Returns the normalized `https://<lowercase-host>`. An invalid value fails the build (exit 1, naming the bad value and the rule).
- `src/lib/site.ts` rewritten: `resolveBuildMode` / `resolveBuildConfig` (pure) derive **local** (neither variable set), **preview** (`PUBLIC_PREVIEW=true`, wins over an origin), or **production** (validated origin, no preview flag). Only a production build is indexable (`IS_INDEXABLE = IS_PRODUCTION`). `Layout.astro` renders the noindex meta whenever the build is not production, so a build with missing or mistyped config can never leak into search results. `astro.config.mjs` sets `site` through the same validator imported from `./src/lib/origin.ts`.
- `scripts/gate-audit.py`: `--mode {production,preview,local}` + `--origin`; production requires the exact origin in canonicals, sitemap `<loc>` entries, and the robots `Sitemap:` directive, and no noindex anywhere; preview requires noindex on every indexable page and the 404, with URLs using exactly the origin when one is set; local requires noindex everywhere with all URLs relative. `scripts/gate-round.sh` builds all three modes per round — production with the RFC 2606 test origin `https://example.com` (mechanism test only, never a production host) for the full check set, then preview and local builds for audit-only mode checks.
- Verified by hand (2026-11-22 ~23:48 JST): default build → noindex present, relative URLs; `PUBLIC_SITE_URL=http://example.com` and `PUBLIC_SITE_URL=example.com` builds fail with exit 1 and the clear "Invalid PUBLIC_SITE_URL … bare https:// hostname" error; production build → no noindex, absolute canonical/sitemap/robots with the exact origin; preview build (origin + `PUBLIC_PREVIEW=true`) → noindex present + absolute canonicals. Negative audit checks: a production build audited with `--origin https://wrong.org` FAILS (39 wrong-origin sitemap URLs, robots, canonicals); a production build audited as `--mode local` FAILS (absolute URLs + missing noindex).
- Docs: `docs/DEPLOYMENT.md` §14.1 stale "read-back pending" text corrected (read-back completed 2026-11-22 ~20:30 JST, §13.6); §14.2 safe creation — connect Git, immediately Pause deployments / disable automatic production-branch deployments, set env vars + the preview access policy, verify, only then resume; §14.3 rewritten as the mode table (local/preview/production); §14.4 native Pages preview access policy (Settings → General → Enable access policy, covering the hash URL `<hash>.<project>.pages.dev` and the branch alias `<branch>.<project>.pages.dev`, not production `*.pages.dev`) — the "first public deploy as staging" fallback is **removed** (an unverified public deploy is a process failure to roll back, not a staging check); §14.5 mode-aware local procedure; §14.9 duplicate-content guard restated for fail-closed; §14.10 license row corrected (`"private": true` only blocks an accidental `npm publish`; the GitHub repository is public and the code is visible to anyone).

### 15.3 P1 — partial cost preserved through My Project (ADR-16)

- `CalcOutput` gains `costPartial`; the Brick config passes it through; `GenericCalculator.addToProject` saves `costPartial`/`costLabel`/`costDetail`. `ProjectItem` gains the same three optional fields — **no schema version bump** (stays version 2; optional fields, safely normalized; old items read as not-partial; a partial flag is kept only when a finite cost is stored).
- The partial flag is labeled everywhere a cost shows: the My Project item line (`Line total: $X ($Y × N) — Partial cost (bricks only)` + the detail as its own line), the room subtotal (`Subtotal for {room}: $X (partial total — …)` when any room item is partial), and the project total (`Partial total (incomplete estimate): $X (…some items are partial, see their notes)`). The text export shows the label + detail per item and a "Partial total (incomplete estimate)" total; the CSV gains a "Cost note" column (label + detail per row) and a "Partial total (incomplete estimate)" total row. Print uses the same page, so the labels print with it. Quantity multiplication keeps the flag; editing the unit price clears it (the edited price is the user's own figure). A mortar-only result with no priced bricks still suppresses the cost entirely.
- Reference math: ¾ in joint + $0.50/brick → 482 bricks, $241.00, partial true; standard geometry + brick price only → $288.00, not partial.

### 15.4 Tests added

- **Vitest 318/318 (41 files):** `src/lib/site.test.ts` 15 tests (5 → 15, +10: origin validation 4, mode resolution 5, defaults 3 — the defaults now assert through the pure `resolveBuildConfig`, not the env-reading module constants, see §15.6); `src/lib/project.test.ts` 26 tests (+10: serialize/parse round-trip, pre-field migration, flag dropped without a cost, text/CSV partial labels and totals, quantity multiplication, LocalStorage add/update round-trips with a stubbed store).
- **Playwright 80/80:** new partial-cost E2E test in `tests/project.spec.ts` (brick ¾ in joint + $0.50/brick → save → reload → quantity 2 → CSV → price edit clears the flag) × 2 projects; the sitemap tests in `tests/calculators.spec.ts` and `tests/home.spec.ts` are origin-aware (absolute `<loc>`/canonical in a production build, relative in a local build); the existing planner test's CSV header assertion includes the new "Cost note" column.
- Typecheck 0 errors / 0 warnings / 0 hints; lint (Prettier check) pass.

### 15.5 WebKit — environment blocker cleared

- System libraries installed 2026-11-22 (owner-approved; `npx playwright install-deps webkit` exit 0, log at `~/workspace/webkit-install.log`; debconf frontend fallback warnings are harmless). `ldconfig -p` shows libgtk-4, libgstreamer-1.0, libgraphene-1.0, libevent-2.1, libenchant-2, libsecret-1, libmanette-0.2, libavif, libGLESv2. Playwright WebKit launched and loaded https://example.com ("Example Domain").
- Smoke test 2026-11-23 ~00:05 JST: temporary `webkit` project (Desktop Safari, `playwright.webkit.config.ts` — deleted after the run, not added to the permanent gate config), `tests/home.spec.ts` + `tests/calculators.spec.ts` against the production-mode build (`PUBLIC_SITE_URL=https://example.com`): **29 passed (2.3 min)**. The WebKit/Safari environment blocker is cleared. Real Safari device checks remain pending (`docs/DEPLOYMENT.md` §14.8).

### 15.6 Gate failure on the way — count reset, re-run from zero

- First attempt, round 1 (started 2026-11-22T14:56:52Z): Vitest **3 failed / 315 passed** in `src/lib/site.test.ts`. The gate exported `PUBLIC_SITE_URL=https://example.com` for the production build and Vitest's `import.meta.env` picked it up, so the "no env vars set" assertions saw production values. Root cause: `absoluteUrl` defaulted its `origin` parameter to the module constant `SITE_URL`, so `absoluteUrl(path, undefined)` meant "use SITE_URL" in that environment; and the defaults tests asserted the env-reading module constants.
- Fix (commit `b3d396e`): `absoluteUrl(path, origin)` takes an explicit origin — `SEO.astro`, `sitemap.xml.ts`, and `robots.txt.ts` pass `SITE_URL`, so `absoluteUrl(path, undefined)` now always means "no origin" whatever the environment holds; the defaults tests assert through the pure `resolveBuildConfig`; `scripts/gate-round.sh` unsets `PUBLIC_*` before Vitest/typecheck/lint and re-exports the origin before the audit/Playwright steps. Verified Vitest 318/318 both with and without `PUBLIC_SITE_URL` set.
- The failed attempt is preserved at the top of `docs/gate-logs/2026-11-22-phase-8-review-response/round-1.log` (the script appends with `tee -a`); the passing re-run follows in the same file. Per ADR-9 the failed round did not count; the count restarted at zero.

### 15.7 Re-gate — 3 consecutive clean full rounds PASSED (2026-11-22 23:58:52 JST – 2026-11-23 00:04:43 JST)

| Check | Round 1 (14:58:52Z) | Round 2 (15:01:08Z) | Round 3 (15:03:00Z) |
|---|---|---|---|
| Clean build | 40 pages | 40 pages | 40 pages |
| Vitest | 318/318 | 318/318 | 318/318 |
| Typecheck | 0 errors / 0 warnings / 0 hints | 0/0/0 | 0/0/0 |
| Lint (Prettier check) | pass | pass | pass |
| Scripted audit checks (`scripts/gate-audit.py`) | ALL CHECKS PASSED (all 3 modes) | ALL CHECKS PASSED (all 3 modes) | ALL CHECKS PASSED (all 3 modes) |
| Playwright e2e | 80/80 (57.5 s) | 80/80 (46.1 s) | 80/80 (41.5 s) |
| Lighthouse Home (desktop) | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 |
| Lighthouse Paint (desktop) | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 |

Ranges across these three rounds: Home 100/100/100/100 every round (LCP 0.2 s, CLS 0, TTI 0.2 s); Paint 100/100/100/100 every round (LCP 0.3/0.4/0.3 s, CLS 0.005/0/0.005, TTI 0.4/0.4/0.3 s). **SEO is now 100, not 83: the production-mode build's absolute canonicals lifted the cap the relative canonicals imposed (ADR-15).** Lighthouse thresholds were enforced by the script in every round (all scores above their floors). No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.**

**Counts changed since §14.7:** Vitest 298 → 318 (+20: 10 site + 10 project). Playwright 78 → 80 (the new partial planner test × 2 projects). Pages still 40 (39 indexable + 404), sitemap still 39 URLs.

**Standing limitations carried forward (not gate failures):** no domain/production origin yet (the gate uses the RFC 2606 test origin `https://example.com`; the SEO 100 is measured on that test-origin production build and must be re-measured after a real origin is set); no public deployment; AdSense disabled; project license undecided (owner decision); security-headers live check pending (§14.6); real Safari device checks pending (§14.8). Nothing is merged, deployed, or closed.

**Method note (same as §13.3):** all rounds run from a clean state (`rm -rf dist/`) with `bash scripts/gate-round.sh <round> <log-file>`; per-round logs in `docs/gate-logs/2026-11-22-phase-8-review-response/` (`round-1.log`, `round-2.log`, `round-3.log`); Lighthouse pinned to 12.8.2; the Chromium headless-shell binary is resolved dynamically (see the script header); the gate asserts the Lighthouse launch thresholds instead of only reporting the scores. Node v24.22.1, npm 10.9.4, Python 3.12.3.

## 16. Phase 8 Re-Review Response (PR #4, review 6013166210) — 2026-11-23 ~01:02 JST to ~01:16 JST

### 16.1 The re-review

ChatGPT review **6013166210** (fnaticjohn, CHANGES_REQUESTED, submitted 2026-11-22T16:01:55Z, against commit `a15e2e5c`). It **accepted** ADR-16 partial-cost preservation (storage normalization, rendering, text/CSV, quantity and price edit), origin validation, exact-origin audits, and the WebKit smoke + three clean rounds as developer-reported evidence (not independently executed). **One remaining P0** from the original deployment-safety request, not new scope: `resolveBuildMode` still treated any nonempty valid `PUBLIC_SITE_URL` as production unless `PUBLIC_PREVIEW` was exactly `"true"` — the reviewer's repro is `resolveBuildConfig({siteUrl: "https://example.com", preview: "True"})`, or omitting the preview flag on a Cloudflare preview that inherited the origin: mode production, `IS_INDEXABLE=true`. The ADR-15 claim that a mistyped/missing preview configuration cannot leak into indexing was therefore false. The review also required: a positive explicit production mode plus validated origin, unknown/missing mode never indexable, conflicts rejected, the provider branch/deployment context used as a protective override on actual Cloudflare builds (validate against the owner-configured production branch, fail closed if context is missing), tests covering origin-only, mistyped mode, inherited production flags on preview, correct production and local/preview modes, the gate explicitly opting into production and auditing the negative builds, and a fix for `docs/DEPLOYMENT.md` §14.2 (connect-Git-then-pause is a race, not safe initial creation; do not rely on noindex or rollback as access control). No changes requested to the accepted partial-cost or WebKit scope. The response is commit `0cc103c`.

### 16.2 P0 — explicit production opt-in, conflict rejection, Cloudflare branch guard (ADR-17)

- `src/lib/site.ts` rewritten (mode derivation; ADR-15's fail-closed principle stands, the derivation is replaced): `PUBLIC_BUILD_MODE` must be exactly `production` — `"Production"`, `"prod"`, `"staging"` and any other value fail the build with an "Unknown PUBLIC_BUILD_MODE" error — **plus** a validated origin (ADR-15 validation, unchanged). An origin alone never implies production: `resolveBuildConfig({siteUrl: "https://example.com"})` is now local, and a local build ignores the origin for URL generation (relative canonicals/sitemap/robots, noindex on every page). A non-blank origin is still validated in every mode, so a mistyped origin fails the build loudly instead of being silently ignored.
- Conflicts fail the build instead of picking a winner: an explicit production or local mode together with `PUBLIC_PREVIEW=true` throws ("Conflicting build config"). The consistent combination — `PUBLIC_BUILD_MODE=preview` with `PUBLIC_PREVIEW=true` — is allowed; with no explicit mode, the legacy `PUBLIC_PREVIEW=true` still means preview (backward-compatible with the existing preview setup). A mistyped preview flag (`True`, `1`) means local, never preview.
- Cloudflare branch guard: on a Pages build (`CF_PAGES` set — the Pages docs inject it as `1` — or `CF_PAGES_BRANCH` present), a production build requires the deployment branch to equal the production branch (`PUBLIC_PRODUCTION_BRANCH`, default `main`, the owner-configured production branch in `docs/DEPLOYMENT.md` §14.2). A preview branch with inherited production flags is refused ("Production build refused: ... is not the production branch"); a missing `CF_PAGES_BRANCH` on a Pages build fails closed ("Production build on Cloudflare Pages requires CF_PAGES_BRANCH") instead of guessing. The guard runs only when Pages context is present (local builds and Direct Upload deploys have no provider context to validate against; their mode is baked in at local build time) and gates production only — a preview build on any branch is unaffected.
- `astro.config.mjs` is unchanged (it validates the origin; `Astro.site` is not read anywhere, so its `site` value does not affect rendered URLs).

### 16.3 §14.2 — safe creation is Direct Upload only (ADR-17)

- Verified against the Cloudflare docs before rewriting: the controls that stop automatic deployments (Pause deployments; Branch control) only exist *after* the project exists, and a Git-integrated project cannot switch to Direct Upload later (nor vice versa). There is no documented way to prevent the first Git-triggered public deployment before creation, so "connect Git, then immediately pause" is a race, not safe initial creation — the reviewer's claim stands.
- `docs/DEPLOYMENT.md` §14.2 now requires a **Direct Upload project** (dashboard or `npx wrangler pages project create <project> --production-branch=main`): no repository connection, no build on Cloudflare, no automatic deployment — nothing goes live until the owner uploads prebuilt files. The trade-off is stated plainly: a Direct Upload project can never switch to Git integration, and it has no automatic per-branch previews — a preview is an explicit `npx wrangler pages deploy dist --branch=<branch> --project-name=<project>` upload. Moving to Git-based automatic deployments later means a new project and its own safe-creation procedure; it is not approved here. **External staging via Git integration stays blocked** until a verified prevention exists (none is known). Rollback and noindex are no longer offered as the remedy — neither is access control.
- §14.3 rewritten for ADR-17 (mode/env tables: `PUBLIC_BUILD_MODE`, `PUBLIC_PRODUCTION_BRANCH`, `CF_PAGES`/`CF_PAGES_BRANCH`); §14.5 mode-aware local procedure (production check now `PUBLIC_BUILD_MODE=production PUBLIC_SITE_URL=https://example.com npm run build`; origin-only build verified to stay noindex); §14.9 launch sequence (Direct Upload deploy command) and duplicate-content guard restated for the explicit mode + branch guard. `README.md` Phase 8 paragraph and `docs/SEO-STRATEGY.md` §§3–4 updated for ADR-17.

### 16.4 Tests added

- **Vitest 325/325 (41 files, was 318):** `src/lib/site.test.ts` +7 — origin-only → local (the reviewer's leak, now a regression test), the exact repro (origin + preview `"True"` → local), explicit production + origin, production without an origin → throws, mistyped mode values (`"Production"`, `"prod"`, `"staging"`) → throws, mode/flag conflicts (production+preview, local+preview → throws; preview+preview consistent), local build ignores the origin for URLs but still validates it, and the branch guard (preview branch refused, branch present without `CF_PAGES` refused, missing branch context refused, production branch allowed, custom production branch honored/enforced, no Pages context = no guard, preview on a branch unaffected).
- **Playwright 80/80 (unchanged count):** `tests/home.spec.ts` derives the expected mode from `PUBLIC_BUILD_MODE` (with the `PUBLIC_PREVIEW` fallback) and expects an origin in URLs only for production/preview modes — so the same suite passes against the production build (absolute) and would catch an origin-only build leaking absolute URLs.
- **Gate script:** `scripts/gate-round.sh` now sets `PUBLIC_BUILD_MODE=production` explicitly for the production build (the origin alone no longer suffices) and adds, per round, 5 negative builds (origin-only and mistyped-preview-flag builds must pass the local audit and *fail* the production audit; a production build on a preview branch, a production build with missing branch context, and a production+preview-flag conflict must fail the build with the expected error message, asserted by grep) plus 1 positive branch check (production build on branch `main` must pass the production audit).
- Typecheck 0 errors / 0 warnings / 0 hints; lint (Prettier check) pass.

### 16.5 Build-matrix verification by hand (2026-11-23 ~01:05 JST, before the gate)

All 11 cases behaved as designed: (1) default → build OK, noindex present, relative canonical; (2) origin-only → build OK, noindex present, relative canonical (the leak closed); (3) origin + `PUBLIC_PREVIEW=True` (the reviewer's repro) → build OK, noindex present, relative canonical; (4) `PUBLIC_BUILD_MODE=production` + origin → build OK, no noindex, absolute canonical `https://example.com/`; (5) production + preview flag → build fails exit 1 ("Conflicting build config"); (6) production + origin + `CF_PAGES=1` + `CF_PAGES_BRANCH=feature-x` → build fails exit 1 ("not the production branch"); (7) production + origin + `CF_PAGES=1` + branch `main` → build OK, indexable; (8) production + origin + `CF_PAGES=1`, no branch → build fails exit 1 ("requires CF_PAGES_BRANCH"); (9) preview mode + origin + flag → build OK, noindex present, absolute canonical; (10) mode `"Production"` → build fails exit 1 ("Unknown PUBLIC_BUILD_MODE"); (11) production mode, no origin → build fails exit 1.

### 16.6 ADR-9 gate — 3 consecutive clean full rounds PASSED (2026-11-23 01:09:34 JST – 01:16:04 JST)

| Check | Round 1 (16:09:34Z) | Round 2 (16:11:41Z) | Round 3 (16:13:45Z) |
|---|---|---|---|
| Clean build | 40 pages | 40 pages | 40 pages |
| Vitest | 325/325 | 325/325 | 325/325 |
| Typecheck | 0 errors / 0 warnings / 0 hints | 0/0/0 | 0/0/0 |
| Lint (Prettier check) | pass | pass | pass |
| Scripted audit checks (`scripts/gate-audit.py`) | ALL CHECKS PASSED × 6 (production, preview, local, origin-only local, mistyped-flag local, positive-branch production) | ALL CHECKS PASSED × 6 | ALL CHECKS PASSED × 6 |
| Negative builds (ADR-17) | 5/5 passed (origin-only, mistyped flag, preview branch, missing branch, conflict) + 1 positive branch check | 5/5 + 1 | 5/5 + 1 |
| Playwright e2e | 80/80 (43.9 s) | 80/80 (43.0 s) | 80/80 (49.9 s) |
| Lighthouse Home (desktop) | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 |
| Lighthouse Paint (desktop) | 100/100/100/100 | 100/100/100/100 | 99/100/100/100 |

Ranges across these three rounds: Home 100/100/100/100 every round (LCP 0.2 s, CLS 0, TTI 0.2 s); Paint 100/100/100/100 in rounds 1–2, 99/100/100/100 in round 3 (Performance 99, LCP 0.3 s, CLS 0.005, TTI 0.5 s — above the 90 threshold, not a failure; the other three categories stayed 100). Lighthouse thresholds were enforced by the script in every round (all scores above their floors). No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.** No gate failure on the way this time — the first attempt passed all three rounds.

**Counts changed since §15.7:** Vitest 318 → 325 (+7 site tests, §16.4). Playwright 80/80 unchanged. Pages still 40 (39 indexable + 404), sitemap still 39 URLs.

**Standing limitations carried forward (not gate failures):** no domain/production origin yet (the gate uses the RFC 2606 test origin `https://example.com`; the SEO 100 is measured on that test-origin production build and must be re-measured after a real origin is set); no public deployment; AdSense disabled; project license undecided (owner decision); security-headers live check pending (§14.6); real Safari device checks pending (§14.8). Nothing is merged, deployed, or closed.

**Method note (same as §13.3):** all rounds run from a clean state (`rm -rf dist/`) with `bash scripts/gate-round.sh <round> <log-file>`; per-round logs in `docs/gate-logs/2026-11-23-phase-8-re-review/` (`round-1.log`, `round-2.log`, `round-3.log`); Lighthouse pinned to 12.8.2; the Chromium headless-shell binary is resolved dynamically (see the script header); the gate asserts the Lighthouse launch thresholds instead of only reporting the scores. Node v24.22.1, npm 10.9.4, Python 3.12.3.

## 17. Phase 9 Owner Decisions — Contact and Legal Pages (2026-11-23)

Scope (branch `phase-9-legal-contact`, from merged main `a4925bfe`): implement the owner decisions confirmed 2026-11-23 (Issue #5) — official contact email, operator identity (individual based in Malaysia), production origin, proposed governing law, preferred All Rights Reserved wording — on the Contact, About, Privacy Policy, Terms of Use, and Disclaimer pages, with tests and documentation. No new calculators, no architecture change, no backend, no form, no tracking, no ads.

### 17.1 Changes

- `src/lib/site.ts`: new `SITE_CONTACT_EMAIL = "homediycalc@gmail.com"` (owner-confirmed); the stale "No contact email exists yet" comment replaced. The Contact, Privacy Policy, and Terms of Use pages import the constant — the address is defined once, so a typo cannot publish a different address.
- Contact page: mailto link to the official email; states plainly there is no contact form and no other contact address (no backend by design, ADR-3); operator is an individual based in Malaysia; emails are read by the operator personally; do not send sensitive personal information.
- About page: new "Who runs HomeDIYCalc" section — operated independently by an individual based in Malaysia, not a company, not a registered business; free tool for US homeowners/DIY users; link to Contact.
- Privacy Policy (last updated November 23, 2026): operator identity added; new §7 "Contacting us" — emailing the published address sends the operator your email address and message, used only to answer you, never sold/shared/added to a mailing list; §6 fixed the stale "(Cloudflare Pages, once the site is deployed — it is not live yet)" — the site is deployed on Cloudflare Pages, public production pending launch approval, staging preview access-restricted via Cloudflare Access (sign-in processes the visitor's email for authentication only); §4 clarified the site itself sets no cookies while Cloudflare may set security cookies.
- Terms of Use (last updated November 23, 2026): §1 operator identity; §7 governing law — Laws of Malaysia (proposed wording, flagged for final owner confirmation); §8 copyright — "© 2026 HomeDIYCalc. All rights reserved." (preferred wording, flagged for final confirmation; the repository license is NOT changed — package.json still has no license field); §9 contact.
- Disclaimer (last updated November 23, 2026): results are "not guaranteed purchase quantities, and not professional engineering advice"; operator is an individual, not a company.
- Docs: `docs/DEPLOYMENT.md` §14.10 rewritten as the confirmed-decisions record (governing law and license marked proposed/preferred, pending final confirmation); README Phase 8 line corrected (merged 2026-11-23, staging verified, decisions confirmed).
- Historical phase reports (`docs/QA-REPORT.md` §§10–12, `docs/PHASE-REPORT.md` Phase 5) still say "the site is not deployed anywhere" — those are historical snapshots of when those phases completed and are left as written; the current state is recorded here and in `docs/DEPLOYMENT.md` §14.10.

### 17.2 Contact email delivery verification

- Test email sent 2026-11-23 12:30:32 JST from itgaminglim@gmail.com (the operator's connected Gmail) to homediycalc@gmail.com, subject "HomeDIYCalc contact email delivery test — 2026-11-23", code HDY-20261123-1229. Send confirmed (message in Sent).
- Bounce check: no delivery-failure / bounce / undeliverable message in the sender's inbox as of ~12:50 JST (~20 minutes after send). Gmail rejects a non-existent @gmail.com address with a bounce within minutes, so no bounce is evidence the address exists and Gmail accepted the message.
- Inbox receipt CONFIRMED: the owner verified the test email (code HDY-20261123-1229) was received at homediycalc@gmail.com, recorded on Issue #5 comment 7091231814 (2026-11-23T04:03:03Z). This closes the previously pending inbound-delivery check; homediycalc@gmail.com is the official contact route. No claim beyond the owner's confirmation is made here.

### 17.3 No tracking, no ads, no external uploads (verified on the new build)

- Grep of `src/` + the production-mode `dist/`: zero `<script src="http…">`; the only AdSense-related code is `src/lib/ads.ts` with placeholder IDs and `ADS_ENABLED` false without env vars (AdSense disabled, ADR-8); no `fetch`/`XMLHttpRequest`/`sendBeacon`/`WebSocket` in `src/`; no file inputs on the legal/contact pages (asserted in `tests/legal.spec.ts`); the site itself sets no cookies (no cookie code in `src/`).
- CSP in `dist/_headers` unchanged (`default-src 'self'`, no external loads).

### 17.4 Tests added

- Vitest: +3 in `src/lib/site.test.ts` — `SITE_CONTACT_EMAIL` equals `homediycalc@gmail.com`, is a well-formed gmail.com address, and never contains `homediycalc.com` (the unowned domain). Total: 328/328.
- Playwright: new `tests/legal.spec.ts` (6 tests × chromium + Pixel 5 mobile = 12) — contact mailto + no non-search form + no POST form + no file inputs + no homediycalc.com address + no external scripts; About operator wording; Privacy Policy contact email + LocalStorage key + Cloudflare Pages + no "not live yet"; Terms operator + Laws of Malaysia + All rights reserved + mailto; Disclaimer estimates wording; footer links reach all five pages. 12/12 on the production-mode build (test origin).
- The legal spec caught one real test bug during development: the first "no form" assertion failed because the Layout header carries a site-search form (`role="search"`, GET to `/calculators/`) on every page — the assertion was corrected to forbid only non-search forms and POST forms.

### 17.5 ADR-9 gate (3 consecutive clean rounds) — PASSED 2026-11-23 12:37–12:46 JST

Three consecutive clean rounds on the final source (commit `dcfe2a0`). Two earlier round-1 attempts failed and restarted the count: a Prettier formatting failure in `tests/legal.spec.ts` (fixed with `prettier --write`) and a scripted-audit failure — the new Privacy Policy meta description was 166 characters, one over the 165 limit (shortened to 137). Both fixes were committed before the counted rounds.

| Check | Round 1 (03:37:50Z) | Round 2 (03:40:47Z) | Round 3 (03:43:34Z) |
|---|---|---|---|
| Vitest | 328/328 | 328/328 | 328/328 |
| Typecheck | 0/0/0 | 0/0/0 | 0/0/0 |
| Lint (Prettier check) | pass | pass | pass |
| Scripted audit checks (`scripts/gate-audit.py`) | ALL CHECKS PASSED × 6 (production, preview, local, origin-only local, mistyped-flag local, positive-branch production) | ALL CHECKS PASSED × 6 | ALL CHECKS PASSED × 6 |
| Negative builds (ADR-17) | 5/5 passed (origin-only, mistyped flag, preview branch, missing branch, conflict) + 1 positive branch check | 5/5 + 1 | 5/5 + 1 |
| Playwright e2e | 92/92 (1.1 m) | 92/92 (1.0 m) | 92/92 (1.0 m) |
| Lighthouse Home (desktop) | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 |
| Lighthouse Paint (desktop) | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 |

Playwright 80 → 92 (+12: the new `tests/legal.spec.ts`, 6 tests × chromium + Pixel 5 mobile). Lighthouse Home LCP 0.2 s, CLS 0, TTI 0.2 s every round; Paint LCP 0.4 s, CLS 0.005, TTI 0.4 s every round. No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.** Per-round logs in `docs/gate-logs/2026-11-23-phase-9-legal-contact/` (`round-1.log` also contains the two failed attempts, `round-2.log`, `round-3.log`); Lighthouse pinned to 12.8.2. Node v24.22.1, npm 10.9.4, Python 3.12.3.

### 17.6 Standing limitations carried forward

- Governing law (Laws of Malaysia) and the All Rights Reserved wording are now owner-approved (Issue #5 comment 7091231814) — see `docs/DEPLOYMENT.md` §14.10. The approvals do not authorize the PR merge, a staging redeploy, or public launch.
- Contact-email inbox receipt CONFIRMED by the owner (test code HDY-20261123-1229 received at homediycalc@gmail.com).
- Production NOT deployed; public launch still needs separate owner approval.
- Real iOS/macOS Safari device check still pending (owner-side); WebKit smoke evidence is on the production-mode build, not a real device.

### 17.7 Review response — PR #6 review 6016380187 + owner final confirmations (2026-11-23)

ChatGPT independent review of PR #6 (id 6016380187, CHANGES_REQUESTED, 2026-11-23T03:55:31Z) accepted the contact mailto, the operator-as-individual phrasing in general, the staging/production distinction, and the 3-round QA evidence, and requested targeted wording corrections. All four findings were addressed on the same branch:

1. **Categorical personal-data claims corrected.** Privacy Policy meta description, intro, §1, and §8, and Terms §6, no longer say "collects no personal data" / "no data collected" / "the only personal information we ever receive". The pages now distinguish three things separately: calculator inputs are processed in the browser and are not sent anywhere; the site does not ask for personal information; the operator receives only what a person chooses to send by email; and the hosting provider (Cloudflare) processes standard request data (IP addresses in server logs, security cookies) to serve and protect the site. The absolute claim "we do not receive or use that information" about Cloudflare logs was removed; §6 now says how Cloudflare handles that information is governed by Cloudflare's own privacy policy. The About meta description was corrected the same way. No absolute claim of Cloudflare log access or non-access is made.
2. **Unsupported business-registration claim removed.** About no longer says "not run by a registered business". The owner confirmed the operator is an individual, not a company; whether the operator is registered as a sole proprietorship is a different, unconfirmed question, so the page asserts no registration status. "It is not a company" (owner-confirmed) stays.
3. **Copyright wording narrowed.** Terms §8 no longer asserts all text/design/calculator pages are "the operator's copyrighted work". It now says the original text, design, and calculator pages are the operator's own work; third-party materials and open-source dependencies remain the property of their owners and are used under their respective licenses; the reservation of rights does not change those licenses. The source-code sentence (public GitHub repository, not open-source licensed, no permission to reuse granted here) is unchanged.
4. **Internal approval notes removed from the live Terms.** The parentheticals "(The governing-law wording is the operator's proposed choice and is subject to final confirmation.)" and "(The All Rights Reserved wording is the operator's preferred option and is subject to final confirmation as the licensing decision.)" were removed from Terms §§7–8. The pages now state the wording plainly. The proposed/pending status was never a page concern after the owner's final confirmations (Issue #5 comment 7091231814, 2026-11-23T04:03:03Z): governing law Laws of Malaysia APPROVED (approval covers the choice, not a blanket legal-compliance certification); copyright All Rights Reserved for materials the operator owns, subject to third-party rights and licenses, APPROVED; contact-email receipt CONFIRMED. The approval record lives in the PR, the decision log (`docs/DEPLOYMENT.md` §14.10), and Issue #5 — not on the pages.

Tests: `tests/legal.spec.ts` guards the corrected assertions — "registered business" absent on About; "collects no personal data", "The only personal information we ever receive", "no personal data from anyone", and "we do not receive or use that information" absent on Privacy; "The site collects no personal data", "subject to final confirmation", "proposed", and "operator's copyrighted work" absent on Terms; the new distinguishing and third-party wording present; both meta descriptions free of the categorical claims.

[Gate results for this review response — PASSED 2026-11-23 13:08–13:17 JST]

Three consecutive clean rounds on the final source (commit `3ad6fb7`). One failed round-1 attempt on the way: the new privacy-policy Playwright test used a `getByText` substring that matched three paragraphs, so Playwright refused it with a strict-mode violation — a test bug, not a site defect. Fixed by scoping the assertion with `.first()`, verified the legal spec 12/12 on a production-mode build, amended the commit, and restarted the count from zero per ADR-9.

| Check | Round 1 (04:08:38Z) | Round 2 (04:11:28Z) | Round 3 (04:14:15Z) |
|---|---|---|---|
| Vitest | 328/328 | 328/328 | 328/328 |
| Typecheck | 0/0/0 | 0/0/0 | 0/0/0 |
| Lint (Prettier check) | pass | pass | pass |
| Scripted audit checks (`scripts/gate-audit.py`) | ALL CHECKS PASSED × 6 | ALL CHECKS PASSED × 6 | ALL CHECKS PASSED × 6 |
| Negative builds (ADR-17) | 5/5 + 1 positive | 5/5 + 1 | 5/5 + 1 |
| Playwright e2e | 92/92 (1.1 m) | 92/92 (1.1 m) | 92/92 (1.1 m) |
| Lighthouse Home (desktop) | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 |
| Lighthouse Paint (desktop) | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 |

Lighthouse Home LCP 0.2 s, CLS 0, TTI 0.2 s every round; Paint LCP 0.4 s, CLS 0.005, TTI 0.4 s every round. No failures, no issues found in any of the three counted rounds. Running tally: **3 consecutive clean rounds.** Per-round logs in `docs/gate-logs/2026-11-23-phase-9-review-response/` (`round-1.log` also contains the one failed attempt). Node v24.22.1, npm 10.9.4, Python 3.12.3.

### 17.8 Privacy §6 production-status correction — PR #7 (2026-11-23)

Narrow follow-up to the staging handover review (Issue #5 comment
7091853733, staging CONDITIONALLY ACCEPTED, production NO-GO). One
sentence in Privacy Policy §6 changed, nothing else:

- Before: "The site is deployed on Cloudflare Pages: the public
  production deployment is pending the owner's launch approval, and
  the staging preview is access-restricted (sign-in required via
  Cloudflare Access) and not public."
- After: "The site is deployed on Cloudflare Pages: the public
  production site is live at https://homediycalc.pages.dev, and the
  staging preview is access-restricted (sign-in required via Cloudflare
  Access) and not public."

Rationale: the pending wording becomes false the moment the public
production site goes live. The new sentence describes the production
deployment's status, which is a fact about the live site and stays true
when read on either build. Sequencing: this PR must NOT be merged
before the production launch is approved — merging it early would make
the staging preview prematurely claim production is live. It is merged
as part of the launch, and the production artifact is built from the
merged source.

Tests: `tests/legal.spec.ts` (privacy test) now asserts the new
wording is present ("the public production site is live at") and the
stale wording is absent ("pending the owner's launch approval" count 0).

[Gate results for this §6 correction to be recorded here after the three rounds run on the final source.]
