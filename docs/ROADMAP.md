# Roadmap — HomeDIYCalc

> Update 2026-11-27: the Stair Calculator shipped in Phase 15, bringing the site to 26 calculators and 41 sitemap URLs (42 built pages: 41 shipped + 404); counts in the dated phase records below are as of their phase. In particular, the sitemap now lists exactly the 41 shipped pages.

> Update 2026-11-27: Phase 17B2 adds five landscaping calculators (Sand, Raised Garden Bed Soil, Sod/Turf, Lawn Seed, Fence), bringing the site to 31 calculators and 46 sitemap URLs (47 built pages: 46 shipped + 404).

> Phases 0–6. Each phase has scope and exit criteria. A phase is done only when its exit criteria are met and recorded in `docs/PHASE-REPORT.md`. No phase's exit criteria may be marked met on the basis of work that was not done or tests that did not run.

## Phase 0 — Planning and Documentation (complete)

**Scope:** Project documentation set: `AGENTS.md`, `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/SEO-STRATEGY.md`, `docs/DECISIONS.md`, `docs/DEPLOYMENT.md`, `docs/FORMULAS.md` (P0 formulas documented), `docs/QA-REPORT.md` (initial), `docs/PHASE-REPORT.md` (Phase 0 section filled). Repository created on GitHub. No code, no tests.

**Exit criteria:**
- [x] All 11 documentation files written, in US English, with no claimed test results, no invented metrics, and no placeholder functionality presented as done.
- [x] 25 calculators, 6 categories, and site structure agreed and recorded in the PRD.
- [x] Fixed architecture recorded (Astro, TypeScript strict, React Islands, Tailwind, pure-TS calc, Vitest, Playwright, Cloudflare Pages).
- [x] P0 formulas documented with worked examples in `docs/FORMULAS.md`.

## Phase 1 — Project Scaffold

**Scope:** Initialize Astro + TypeScript strict + React + Tailwind project; `package.json` scripts (`dev`, `build`, `preview`, `test`, `test:e2e`, `typecheck`, `lint`); base layout, header, footer, SEO component; unit engine (`src/lib/units.ts`) with tests; calculator registry (`src/lib/registry.ts`) with all 25 entries; `robots.txt`; sitemap approach decided; Tailwind config; GitHub repo hygiene (README, `.gitignore`, license decision).

**Exit criteria:**
- [x] `npm install && npm run build` succeeds and produces a static site.
- [x] `npm run typecheck` passes under TypeScript strict.
- [x] Unit engine tests pass (conversion round-trips, exact constants).
- [x] Registry contains all 25 calculators with correct slugs, categories, and priorities.
- [x] Home page renders with real (non-placeholder) shell content.

## Phase 2 — P0 Calculators (10)

**Scope:** The 10 P0 calculators — Concrete, Square Footage, Paint, Gravel, Mulch, Concrete Slab, Cubic Yard, Cubic Feet, Tile, Brick — each with: formula module, Vitest tests, React island, Astro page, SVG diagram where helpful, formula section, FAQ, related calculators, shopping list output, validation, reset, imperial+metric, waste allowance, editable coverage/density/yield with references, package quantities rounded up, optional prices with cost estimate.

**Exit criteria:**
- [x] All 10 P0 calculator pages live at `/calculators/<slug>/` with all functional requirements from PRD §5.
- [x] Every P0 formula's Vitest tests pass, including the worked examples in `docs/FORMULAS.md`.
- [x] Playwright tests pass for each P0 page (load, default result, invalid input error, reset).
- [ ] Lighthouse performance measured per P0 page and recorded (target ≥ 90; target is not a claim until measured). — *Not met: no Lighthouse measurement was run in Phase 2 (see `docs/PHASE-REPORT.md` Phase 2 §7); Phase 5 measured Home, Paint, and Concrete only, not all 10 P0 pages.*

## Phase 3 — P1 Calculators (8)

**Scope:** The 8 P1 calculators (Drywall, Concrete Bags, Flooring, Paver, Topsoil, Grout, Board Foot, Mortar), each to the same standard as P0: formula module, Vitest tests, React island, Astro page, formula section, FAQ, related calculators, shopping list output, validation, reset, imperial+metric, waste allowance, editable coverage/density/yield with references, package quantities rounded up, optional prices with cost estimate.

> Correction 2026-11-20: an earlier draft of this roadmap grouped P1+P2+My Project into Phase 3. The phase structure follows the master instruction (PRD §15): Phase 3 = P1 only; Phase 4 = P2 + Shopping List/Project Planner; Phase 5 = validation and audit; Phase 6 = deployment prep. The work itself is unchanged, only the grouping.

**Exit criteria:**
- [x] All 8 P1 calculator pages live at `/calculators/<slug>/` with all functional requirements from PRD §5.
- [x] Every P1 formula's Vitest tests pass, including the worked examples in `docs/FORMULAS.md`.
- [x] Playwright tests pass for each P1 page (load, default result, invalid input error, reset).
- [x] Full Vitest + Playwright suites pass.

## Phase 4 — P2 Calculators (7) and Shopping List / Project Planner

**Scope:** The 7 P2 calculators (Ceiling Tile, Tile Adhesive, Primer, Wallpaper, Sealant, Waterproofing, Baseboard), each to the same standard as P0/P1. Shopping List / Project Planner: add results from multiple calculators into one project, edit quantities and prices, organize by project or room, total estimated material cost, export as printable document or CSV, save/restore locally (LocalStorage only), clear all saved data. My Project page completed end-to-end. SVG measurement diagrams on calculator pages where helpful.

**Exit criteria:**
- [x] All 25 calculators live and passing the same checks as P0/P1.
- [x] My Project works end-to-end in LocalStorage (save, list, edit, remove, clear, copy/print combined list, CSV export).
- [x] All main pages live with real content; no placeholder pages.
- [x] Full Vitest + Playwright suites pass.

## Phase 5 — Validation, Testing and Audit

**Scope:** Comprehensive formula validation (every formula re-verified against `docs/FORMULAS.md` worked examples; validation status updated only after tests run), browser testing (Playwright desktop + 360px mobile), accessibility audit, SEO audit (per-page titles/descriptions, canonicals, breadcrumbs, structured data, Open Graph, sitemap, robots.txt, internal linking, original-content review, no doorway pages), security audit, privacy audit, performance audit (Lighthouse measurement per page, Core Web Vitals, mobile performance).

**Exit criteria:**
- [ ] All acceptance criteria in PRD §13 checked off with evidence recorded in `docs/QA-REPORT.md`. — *Not fully: per-page checks are done and recorded in `docs/QA-REPORT.md` §10, but Search Console verification and absolute canonicals need a domain (Phase 6).*
- [x] Every formula's validation status in `docs/FORMULAS.md` updated from "to be validated by unit tests in Phase 5" to its actual result — only after the tests run. — *Done: all 25 re-validated in Phase 5 (hand-check + Vitest 201/201).*
- [ ] SEO checklist in `docs/SEO-STRATEGY.md` complete for every page; sitemap lists every shipped page and no unshipped page. — *Per-page checks complete; sitemap lists exactly the 39 shipped pages. Canonicals and the robots.txt sitemap URL are relative until a domain exists (Phase 6).*
- [x] Zero known blocking defects; remaining non-blocking issues logged with severity. — *Done: 8 defects fixed in Phase 5 (1 blocking — the missing stylesheet); remaining issues logged in `docs/QA-REPORT.md` §4.2 with severity.*

## Phase 6 — Production Build, Deployment Prep, Search Console, AdSense Scaffolding

**Scope:** Production build verification, Cloudflare Pages deployment preparation (Git integration and manual deploy documented; public deployment only with owner approval), Search Console setup instructions and verification, AdSense scaffolding (component present, ads DISABLED by default, configurable publisher/slot IDs, consent management requirements, privacy disclosures, ads.txt instructions — no monetization activation without owner approval). Final smoke test of the production build. No domain purchase.

**Exit criteria:**
- [x] Production build succeeds and serves all 25 calculator URLs locally.
- [x] Cloudflare Pages deployment steps documented and rehearsed (deploy itself only with owner approval). — *Steps documented in `docs/DEPLOYMENT.md` §§3–4; rehearsal was the local production-build smoke test (25/25 URLs, `docs/QA-REPORT.md` §11) — no live deploy rehearsed, as no Cloudflare account exists yet.*
- [x] Search Console verification instructions documented.
- [x] AdSense still disabled unless the owner approved enabling it (recorded decision).

## Phase 7 — Independent Audit and Remediation (GitHub Issue #1)

- [x] Audit all 25 formulas against independently derived examples and authoritative references (7 PASS, 18 DEFECT — 11 major, 19 minor).
- [x] Audit WebKit/Safari, keyboard navigation, and computed styles; record WebKit honestly as untestable in this environment.
- [x] Audit canonical/sitemap/robots URL readiness; record as a deployment blocker (owner-approved origin needed, no invented domain).
- [x] Review thin category content (all 6 pages rewritten to ≥ 300 words) and the lint configuration (now a real Prettier check, ADR-10).
- [x] Reconcile README and phase status with the final clean rounds and the GitHub repo; record the license as an owner decision.
- [x] Remediate all audit defects on the `phase-7` branch with regression tests.
- [x] ADR-9 re-gate: 3 consecutive clean full test rounds after remediation (see `docs/QA-REPORT.md` §13).
- [ ] Create the remote `phase-7` branch, push the branch, file the separate GitHub issues, and post the Issue #1 summary comment requesting reviewer sign-off — **blocked on owner approval of the connector writes**.
- [ ] Merge into `main` — only after independent reviewer sign-off and owner approval.

## After Launch (not a phase — backlog)

- Additional calculators only via registry + ADR if they change the architecture.
- Periodic content refresh (coverage/density reference values re-checked against sources).
- AdSense enablement only by owner decision, with `ads.txt`, privacy policy update, and performance re-check.
