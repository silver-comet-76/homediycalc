# Product Requirements Document (PRD) — HomeDIYCalc

> Status: Phase 0 planning document (written before any code existed). The site has since been built: 26 calculators, 41 pages — see `docs/PHASE-REPORT.md`.

> Update 2026-11-27: Phase 17B2 adds five landscaping calculators (Sand, Raised Garden Bed Soil, Sod/Turf, Lawn Seed, Fence), bringing the site to 31 calculators and 46 sitemap URLs (47 built pages: 46 shipped + 404).
> Position: "Calculate Materials. Estimate Costs. Build Your Shopping List."
> Market: US primary; UK, Canada, Australia, New Zealand secondary.
> Language: US English throughout.

## 1. Objectives

1. Give homeowners, DIYers, and small contractors a free, fast, no-signup way to calculate how much material a home improvement job needs and what it will roughly cost.
2. Cover the 26 most-searched material calculations with correct, transparent math — every formula shown on the page.
3. Turn each calculation into a copyable shopping list and an optional saved project, so the calculator output is directly usable at the store.
4. Rank in US search for calculator-intent queries through original, genuinely useful pages — no doorway pages, no thin content.
5. Run at zero marginal cost: fully static, no backend, no database, no paid API, hosted on Cloudflare Pages free tier.

## 2. Users

| User | Needs |
|---|---|
| Homeowner / DIYer (primary) | "How many bags of concrete / gallons of paint / boxes of tile do I need?" Wants a quick answer in familiar units, with waste included, and a list to take to the store. |
| Small contractor / handyman | Repeat calculations across jobs; wants editable coverage/yield rates that match the products they actually buy, and a saved project list. |
| International visitor (UK, CA, AU, NZ) | Metric inputs and metric display; US defaults must not confuse them. |

Non-users by design: nobody is required to register, log in, or pay. There is no account system.

## 3. Business Rules

1. **Free forever, no registration, no login.** All 31 calculators are usable without any account.
2. **No backend, no database, no paid API.** All calculation happens in the browser in pure TypeScript. The site must build and run with zero server-side logic.
3. **No invented data.** Prices, coverage rates, densities, and yields shown as defaults must be labeled as typical/reference values with a source. If the user enters no price, no cost is shown — never a fabricated price.
4. **Package quantities always round up.** A shopping list must never under-order.
5. **User data stays in the user's browser.** Project persistence is LocalStorage only, opt-in by saving; nothing is sent to a server. Clearing browser data clears saved projects.
6. **Ads disabled by default.** Google AdSense may be enabled later only by an explicit owner decision, recorded in `docs/DECISIONS.md`, with `ads.txt` and the privacy policy updated at the same time.
7. **US English only.** All shipped copy is US English. Imperial units are the default; metric is a first-class toggle, not an afterthought.
8. **No placeholder pages.** A page ships only when its content, calculator, and tests are complete.

## 4. The 26 Calculators

URL pattern: `/calculators/<slug>/` (e.g. `/calculators/concrete-calculator/`).

### 4.1 P0 (build first)

| # | Calculator | Slug | Category |
|---|---|---|---|
| 1 | Concrete Calculator | `concrete-calculator` | Concrete and Masonry |
| 2 | Square Footage Calculator | `square-footage-calculator` | Measurement |
| 3 | Paint Calculator | `paint-calculator` | Painting |
| 4 | Gravel Calculator | `gravel-calculator` | Landscaping |
| 5 | Mulch Calculator | `mulch-calculator` | Landscaping |
| 6 | Concrete Slab Calculator | `concrete-slab-calculator` | Concrete and Masonry |
| 7 | Cubic Yard Calculator | `cubic-yard-calculator` | Measurement |
| 8 | Cubic Feet Calculator | `cubic-feet-calculator` | Measurement |
| 9 | Tile Calculator | `tile-calculator` | Flooring and Tiles |
| 10 | Brick Calculator | `brick-calculator` | Concrete and Masonry |

### 4.2 P1

| # | Calculator | Slug | Category |
|---|---|---|---|
| 11 | Drywall Calculator | `drywall-calculator` | Interior and Maintenance |
| 12 | Concrete Bags Calculator | `concrete-bags-calculator` | Concrete and Masonry |
| 13 | Flooring Calculator | `flooring-calculator` | Flooring and Tiles |
| 14 | Paver Calculator | `paver-calculator` | Landscaping |
| 15 | Topsoil Calculator | `topsoil-calculator` | Landscaping |
| 16 | Grout Calculator | `grout-calculator` | Flooring and Tiles |
| 17 | Board Foot Calculator | `board-foot-calculator` | Measurement |
| 18 | Mortar Calculator | `mortar-calculator` | Concrete and Masonry |

### 4.3 P2

| # | Calculator | Slug | Category |
|---|---|---|---|
| 19 | Ceiling Tile Calculator | `ceiling-tile-calculator` | Interior and Maintenance |
| 20 | Tile Adhesive Calculator | `tile-adhesive-calculator` | Flooring and Tiles |
| 21 | Primer Calculator | `primer-calculator` | Painting |
| 22 | Wallpaper Calculator | `wallpaper-calculator` | Interior and Maintenance |
| 23 | Sealant Calculator | `sealant-calculator` | Interior and Maintenance |
| 24 | Waterproofing Calculator | `waterproofing-calculator` | Interior and Maintenance |
| 25 | Baseboard Calculator | `baseboard-calculator` | Interior and Maintenance |
| 26 | Stair Calculator | `stair-calculator` | Measurement |

### 4.4 Categories (6)

1. Concrete and Masonry — Concrete, Concrete Slab, Brick, Concrete Bags, Mortar
2. Painting — Paint, Primer
3. Flooring and Tiles — Tile, Flooring, Grout, Tile Adhesive
4. Landscaping — Gravel, Mulch, Paver, Topsoil
5. Measurement — Square Footage, Cubic Yard, Cubic Feet, Board Foot, Stair
6. Interior and Maintenance — Drywall, Ceiling Tile, Wallpaper, Sealant, Waterproofing, Baseboard

## 5. Functional Requirements (apply to every calculator unless noted)

### 5.1 Inputs and units

- **FR-1 — Imperial + metric.** Every dimensional input accepts imperial (ft/in, yd³, gal) and metric (m/cm, m³, L) via a unit toggle. The toggle converts existing entered values; it never clears them.
- **FR-2 — Unified unit engine.** All conversions go through the single unit engine (`src/lib/units.ts`). No inline conversion constants in components or formulas.
- **FR-3 — Shape support where relevant.** Area/volume calculators accept rectangle (L×W), and where applicable circle, triangle, and irregular/L-shaped inputs (documented per calculator in its formula entry).

### 5.2 Calculation behavior

- **FR-4 — Waste allowance.** Every material calculator has a waste allowance input (percentage), with a sensible default per calculator (typically 5–10%) that the user can change, including 0%.
- **FR-5 — Editable coverage / density / yield.** Coverage (paint, primer, sealant, waterproofing), density (gravel, topsoil, mulch), bag yield (concrete bags), and tile/grout coverage values are user-editable. Each shows its reference/typical value and source next to the field.
- **FR-6 — Package quantities rounded up.** Bags, boxes, rolls, gallons, sheets, and packs are always `ceil(required ÷ package capacity)`. The raw required amount is also shown so the user can see the rounding.
- **FR-7 — Optional prices, cost estimate.** Price-per-unit inputs are optional. When all needed prices are entered, show itemized cost and total. When any price is missing, show quantities only — never invent a price.
- **FR-8 — Formulas shown.** Each calculator page displays its formula(s) in plain language with the actual numbers substituted ("How this is calculated"), so the result is checkable.
- **FR-9 — Pure functions.** All calculation logic is pure TypeScript (same inputs → same outputs, no I/O). UI components call these functions; they contain no math of their own.

### 5.3 Output and project features

- **FR-10 — Reset.** A Reset button restores defaults and clears results.
- **FR-11 — Copyable shopping list.** Each calculator produces a plain-text shopping list (item, quantity, package count, optional cost) with a Copy button.
- **FR-12 — Save to My Project.** From any calculator, the user can add the result to My Project. Projects persist in LocalStorage only. My Project lists saved items, lets the user remove items, and exports/copies the combined list.
- **FR-13 — Validation.** Invalid input (empty required field, zero/negative where positive is required, non-numeric, implausibly large values) shows an inline error and suppresses the result. Validation messages are specific ("Length must be greater than 0").

### 5.4 Per-calculator notes (summary; formulas in `docs/FORMULAS.md`)

- **Concrete / Concrete Slab:** volume from L×W×depth; output in yd³, ft³, m³; bag counts by bag size; 10% waste default is typical for slabs — confirm per calculator during implementation.
- **Square Footage:** area for rectangle/circle/triangle; output ft² and m².
- **Paint / Primer:** net paintable area (walls minus doors/windows where entered) × coats ÷ coverage; output gallons + quarts/liters; primer is a separate calculator with its own coverage.
- **Gravel / Topsoil / Mulch:** volume from area × depth; weight via editable density; output yd³/ft³/m³ and tons/kg.
- **Cubic Yard / Cubic Feet:** unit conversion calculators (ft³ ↔ yd³ ↔ m³) with dimension input.
- **Tile / Paver / Ceiling Tile:** area ÷ single-unit area, adjusted for waste; output unit count + boxes.
- **Brick / Mortar:** wall area, brick size + mortar joint; output brick count and mortar volume/bags.
- **Drywall:** wall/ceiling area ÷ sheet area; output sheets, plus joint compound and tape estimates where defined.
- **Concrete Bags:** volume ÷ yield per bag size (40/60/80 lb); output bag counts per size.
- **Flooring:** area ÷ box coverage; output boxes + planks/tiles.
- **Grout:** tile area, tile size, joint width/depth; output grout weight/volume.
- **Board Foot:** board feet = thickness(in) × width(in) × length(ft) ÷ 12.
- **Tile Adhesive:** area ÷ coverage per bag; output bags.
- **Wallpaper:** wall area ÷ roll coverage, accounting for pattern repeat where entered; output rolls.
- **Sealant:** joint length and bead size; output tubes/cartridges.
- **Waterproofing:** area × coats ÷ coverage; output gallons/liters.
- **Baseboard:** linear feet of wall minus openings, plus waste; output lengths/pieces.

## 6. Shopping List / Project Planner (My Project)

- **FR-14.** My Project (`/my-project/`) lists all saved calculator results with quantities and optional costs, grouped by calculator.
- **FR-15.** Users can remove individual items or clear the whole project.
- **FR-16.** One-click copy of the combined shopping list as plain text; printable view.
- **FR-17.** No account, no sync, no server. A notice on the page states data is stored only in this browser.

## 7. Site Structure

| Page | URL |
|---|---|
| Home | `/` |
| All Calculators | `/calculators/` |
| Calculator page (×26) | `/calculators/<slug>/` |
| Category page (×6) | `/categories/<slug>/` |
| My Project | `/my-project/` |
| About | `/about/` |
| Contact | `/contact/` |
| Privacy Policy | `/privacy-policy/` |
| Terms of Use | `/terms-of-use/` |
| Disclaimer | `/disclaimer/` |

- Home: hero ("Calculate Materials. Estimate Costs. Build Your Shopping List."), calculator search/browse, category cards, popular calculators, how-it-works, FAQ.
- All Calculators: full list grouped by category, filterable/searchable client-side.
- Category pages: description, calculators in that category, related categories.
- Contact: a contact form that does **not** submit to a server by default — see §9. Until a form backend is chosen by the owner, the Contact page must present an email address (or state that the form is unavailable) rather than a fake submitting form. No fake form submissions.
- Legal pages: Privacy Policy, Terms of Use, Disclaimer are real, complete pages, not placeholders.

## 8. UI/UX Requirements

- **Mobile-first responsive** design; calculators fully usable on a 360px-wide phone.
- **Live results** update as inputs change; no "Calculate" button required (a button may exist for accessibility but must not be the only path).
- **Accessible:** labeled inputs, keyboard navigable, sufficient contrast, semantic HTML.
- **Fast:** static HTML for content; React islands hydrate only the calculator widgets. Target: Lighthouse performance ≥ 90 on calculator pages (to be measured, not claimed, in QA).
- **Diagrams:** simple inline SVG diagrams showing what to measure (e.g. length/width/depth arrows on a slab). No stock-photo dependency.
- **No dark patterns:** no fake urgency, no forced signup, no hidden costs.

## 9. SEO Requirements

See `docs/SEO-STRATEGY.md`. Summary: unique title + meta description per page, canonical URLs, `sitemap.xml`, `robots.txt`, breadcrumbs with structured data, Open Graph tags, FAQ/HowTo structured data where applicable, internal linking between related calculators, original content per page, no doorway pages.

## 10. AdSense

- Disabled by default. No ad scripts ship until the owner approves enabling AdSense.
- When enabled: `ads.txt` in `public/`, ad slots only in designated positions that do not break calculator usability, privacy policy updated, and performance re-checked.

## 11. Security / Privacy / Performance

- No user accounts, no passwords, no personal data collection by design.
- No third-party scripts by default (no analytics, no ads) until an owner decision.
- Contact page must not pretend to submit if there is no backend.
- All user input is treated as untrusted: validate, never inject raw input into HTML.
- Static hosting only; no server-side code paths to secure.
- Performance budget to be set in Phase 1 and measured in QA; no performance numbers are claimed before measurement.

## 12. Phases

See `docs/ROADMAP.md` (Phases 0–6). P0 calculators ship first; P1, then P2; SEO, QA, and launch follow.

## 13. Acceptance Criteria (project-level)

- [ ] All 31 calculators live at their specified URLs, each with imperial+metric, waste allowance, editable coverage/density/yield with references, package quantities rounded up, optional prices with cost estimate, formulas shown, reset, copyable shopping list, validation, and mobile-first layout.
- [ ] My Project works end-to-end in LocalStorage (save, list, remove, copy combined list).
- [ ] Home, All Calculators, 6 category pages, My Project, About, Contact, Privacy Policy, Terms of Use, Disclaimer all live with real content.
- [ ] `npm run build` produces a fully static site; `npm run test` (Vitest) and `npm run test:e2e` (Playwright) pass.
- [ ] Lighthouse performance ≥ 90 on calculator pages (measured, recorded in QA report).
- [ ] SEO checklist complete: unique titles/descriptions, canonicals, sitemap, robots.txt, breadcrumbs, structured data, Search Console verified.
- [ ] No paid API, backend, database, login, or fake data anywhere in the shipped site.
- [ ] AdSense disabled by default; no ad/analytics scripts unless owner-approved.

*Acceptance criteria are unchecked until the work is done and verified. See `docs/QA-REPORT.md`.*
