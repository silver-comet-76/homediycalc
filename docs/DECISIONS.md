# Architecture Decision Records — HomeDIYCalc

> ADR-style, short. Each record: context, decision, alternatives considered, consequences. Decisions here are binding unless superseded by a newer ADR (never edit history — add a new record marked "Supersedes ADR-N").

## ADR-1: Astro over Next.js

- **Status:** Accepted (Phase 0)
- **Context:** The site is content + calculators with no backend, no user accounts, and no server-side data. The priority is fast static HTML and minimal JavaScript.
- **Decision:** Use Astro for static site generation.
- **Alternatives considered:**
  - *Next.js* — powerful, but brings a server framework, larger runtime, and complexity the project does not need; its strengths (SSR, API routes, server components) are all things this project explicitly avoids.
  - *Plain HTML/CSS/JS* — simplest, but no component reuse, no TypeScript-first workflow, and the 25 near-identical calculator pages would become copy-paste maintenance.
  - *11ty / Hugo* — viable static generators, but weaker TypeScript + React island story than Astro.
- **Consequences:** Small build, fast pages, component reuse, and React islands where needed. The team must learn Astro conventions. If a backend is ever required, this decision must be revisited (new ADR).

## ADR-2: React Islands for Interactive Calculators

- **Status:** Accepted (Phase 0)
- **Context:** Calculators need rich interactivity (live results, unit toggles, validation). The surrounding content should stay static HTML for SEO and speed.
- **Decision:** Interactive calculators are React islands hydrated on the client (`client:load` / `client:visible`); all other content is static Astro HTML.
- **Alternatives considered:**
  - *All-React SPA* — would hurt SEO (content behind JS) and initial load.
  - *Vanilla JS widgets* — workable, but 25 calculators would duplicate state/validation logic without a component model.
  - *Astro-only with no framework* — insufficient for the interactive requirements (live updates, toggles, lists).
- **Consequences:** Only calculator widgets ship JavaScript; content pages stay light. React is a dependency, but its use is contained to islands. Islands must degrade gracefully (content still readable without JS).

## ADR-3: No Backend / No Database

- **Status:** Accepted (Phase 0)
- **Context:** The brief requires no registration, no login, no backend, no paid API, no database — and zero marginal hosting cost.
- **Decision:** The site is pure static files. All calculation is client-side. There is no API layer, no server function, no database of any kind.
- **Alternatives considered:**
  - *Serverless functions for forms/calculations* — adds cost, latency, and a failure mode; calculations do not need a server.
  - *A database for saved projects* — would require accounts, which the brief forbids; LocalStorage covers the use case.
  - *A headless CMS* — adds a paid/remote dependency for content that changes rarely and lives comfortably in the repo.
- **Consequences:** Hosting is free and the attack surface is minimal. The Contact page cannot have a submitting form until a backend is explicitly chosen (see PRD §7). Any future backend need requires a new ADR and owner approval.

## ADR-4: Tailwind CSS for Styling

- **Status:** Accepted (Phase 0)
- **Context:** 25 calculator pages plus main pages need a consistent, responsive, mobile-first design without a large custom CSS codebase.
- **Decision:** Tailwind CSS utility classes, with a small shared set of component classes only where repetition justifies it.
- **Alternatives considered:**
  - *Hand-written CSS* — full control, but slower to build consistently across 25 pages.
  - *A component UI library (e.g. shadcn, MUI)* — heavier than needed; the design is simple forms and results, not a design system showcase.
  - *Bootstrap* — viable, but larger default footprint and less suited to Astro + Tailwind-era tooling.
- **Consequences:** Fast, consistent styling; utility classes in markup. Design tokens (colors, spacing) are configured once in the Tailwind config.

## ADR-5: Vitest + Playwright for Testing

- **Status:** Accepted (Phase 0)
- **Context:** Calculation correctness is the product's core promise; a wrong bag count or paint volume destroys trust. Both pure-function correctness and real-browser behavior need coverage.
- **Decision:** Vitest for unit tests (formulas, unit engine, shopping-list logic); Playwright for browser tests (page load, interaction, validation, mobile viewport).
- **Alternatives considered:**
  - *Jest only* — workable for units, but no browser coverage; Playwright is still needed.
  - *Cypress* — viable e2e alternative; Playwright was chosen for its multi-browser support and first-class mobile viewport emulation.
  - *No automated tests* — rejected; manual checking of 25 calculators on every change is unreliable.
- **Consequences:** Two test commands (`npm run test`, `npm run test:e2e`). Formula validation status in `docs/FORMULAS.md` stays "to be validated" until its Vitest tests actually pass.

## ADR-6: Cloudflare Pages (Free) for Hosting

- **Status:** Accepted (Phase 0)
- **Context:** The site is fully static and must cost nothing to host at the expected scale.
- **Decision:** Deploy the Astro static output to Cloudflare Pages free tier, via Git integration (primary) or manual upload.
- **Alternatives considered:**
  - *Netlify / Vercel free tiers* — both viable static hosts; Cloudflare Pages was chosen for its generous free tier and simple static deployment. Either could replace it with a one-line deployment change and no code change.
  - *GitHub Pages* — free and simple, but less flexible on headers/redirects than Cloudflare Pages.
  - *Paid hosting* — rejected; the brief requires zero hosting cost.
- **Consequences:** Free HTTPS, CDN, and deploys on push. No serverless features are used; the site must work as pure static files. No domain is to be purchased for this project.

## ADR-7: LocalStorage-Only Persistence

- **Status:** Accepted (Phase 0)
- **Context:** Users want to save calculator results into a project/shopping list, but there are no accounts and no backend.
- **Decision:** My Project persists only in the browser's LocalStorage, under a single versioned key, saved only when the user explicitly clicks save.
- **Alternatives considered:**
  - *No persistence at all* — simpler, but loses the "build your shopping list" value across sessions.
  - *Server-side accounts* — forbidden by the brief (no registration/login/backend).
  - *URL-encoded project state* — shareable, but URLs become long and fragile; may be added later as an export option, not as the primary store.
- **Consequences:** Projects are per-browser and per-device; clearing browser data clears them. The page must say so plainly. Corrupt or old-version stored data must be ignored, never crash the page.

## ADR-8: Ads Disabled by Default

- **Status:** Accepted (Phase 0)
- **Context:** AdSense is a possible future revenue source, but ads hurt performance, usability, and trust at launch, and require privacy-policy and `ads.txt` work.
- **Decision:** No ad scripts ship. AdSense is disabled by default and may be enabled only by an explicit owner decision, recorded here as a new ADR, with `ads.txt`, privacy policy updates, and a performance re-check done at the same time.
- **Alternatives considered:**
  - *Ads from launch* — rejected; the product should earn trust and traffic first.
  - *Affiliate links in content* — not decided; any future affiliate use needs its own owner decision and clear disclosure.
- **Consequences:** Zero ad-related performance or privacy cost at launch. Revenue is deferred deliberately.

## ADR-9: Three Consecutive Clean Full Test Rounds as Release Gate

- **Status:** Accepted (owner requirement, 2026-11-20, during Phase 4)
- **Context:** A single passing test run is not enough evidence to call the project complete. The owner requires repeated full verification before any "complete" report.
- **Decision:** Before the project is reported complete, run at least 3 FULL test rounds. Each round starts from a clean state (clean build output, fresh test run) and covers: Vitest unit tests, production build, Playwright end-to-end tests, and the Phase 5 audit checks (formulas, accessibility, SEO, security, privacy, performance). Only if ALL 3 rounds pass with ZERO failures or issues may the project be reported complete. If any round finds an issue, fix it and RESTART the count — the 3 clean rounds must be consecutive. Record every round's results (pass/fail, what failed, what was fixed) in `docs/QA-REPORT.md`.
- **Alternatives considered:**
  - *One full round* — rejected by the owner; a single pass can hide flaky or order-dependent issues.
  - *Three rounds without the clean-state restart* — rejected; fixes must be proven by fresh consecutive passes, not by counting a pass from before the fix.
- **Consequences:** The release gate runs after Phases 4–6 are done. No "complete" report to the owner until 3 consecutive clean rounds are recorded. A failure in round 2 or 3 resets the count to zero even if round 1 was clean.
- **Outcome 2026-11-20:** gate PASSED at commit ca29ba1 (3 consecutive clean rounds); see `docs/QA-REPORT.md` §12.

## ADR-10: Linting with Prettier (formatting only)

- **Status:** Accepted (Phase 7, 2026-11-21)
- **Context:** The Phase 7 audit found `npm run lint` was a no-op echo that exited 0 — a check that always passes is worse than no check, because it looks like verification. No linter was installed and `docs/DECISIONS.md` never recorded the deferral, so the `package.json` pointer ("see docs/DECISIONS.md") dangled.
- **Decision:** Formatting is enforced with Prettier 3.10.1 (MIT), promoted from a transitive dependency to a direct devDependency, pinned exact. `npm run lint` runs `prettier --check` over the code tree (`src/**/*.{ts,tsx,css}`, `tests/**/*.{ts,tsx}`, `*.{json,mjs}`) with `.prettierrc` (printWidth 100) and `.prettierignore` (`.astro` files — Prettier has no Astro parser — Markdown prose, `dist/`, `node_modules`, `coverage`, `package-lock.json`). The code tree was formatted once with `prettier --write` so the check passes on a clean tree. `npm run lint` is part of the pre-deploy checklist (`docs/DEPLOYMENT.md` §5).
- **Alternatives considered:**
  - *ESLint + typescript-eslint + eslint-plugin-astro* — real linting (unused variables, bad patterns), not just formatting; deferred — it needs new devDependencies, a flat config, and a license-audit entry, and the audit's immediate gap was the false-green no-op. Revisit if the project wants rule-based linting.
  - *Prettier over the whole tree including docs* — rejected for now; reformatting all Markdown prose would churn the docs (including the audit branch) for no correctness gain. Docs stay out of the check via `.prettierignore`.
- **Consequences:** `npm run lint` can now fail, and does so on any unformatted code file. It is formatting only — it does not catch unused variables or logic errors; `npm run typecheck` remains the correctness check. The one-time `--write` pass reformatted ~80 code files; the diff is mechanical (line breaks, spacing) and changes no behavior.

## ADR-11: Mortar Bags from the Manufacturer Count Rating; Relative-Epsilon `ceilUp` (PR #2 Review Response)

- **Status:** Accepted (Phase 7 review response, 2026-11-22)
- **Context:** The independent reviewer (PR #2, review 6009535299) found the mortar-bag recommendation contradicted the manufacturer yield: the worked example recommended 9 bags from a 0.6 ft³/bag volumetric yield, while the QUIKRETE Mortar Mix No. 1102 data sheet rates one 80 lb bag at up to 37 standard bricks (576 ÷ 37 = 16 bags minimum). Reading the data sheet showed the 0.6 ft³ figure is not on it at all — the sheet states only the count rating, no cubic-foot yield and no waste allowance — so no product-specific volumetric bag yield may be claimed. The same review found `ceilUp`'s fixed 1e-9 epsilon could round a strictly positive requirement below 1e-9 down to zero packages.
- **Decision:**
  - Mortar bags come from the manufacturer count rating (37 standard bricks / 13 standard 8 × 8 × 16 blocks per 80 lb bag, QUIKRETE 1102 data sheet), derated by the waste allowance: the larger of the units you buy ÷ rating and the installed units × (1 + waste%) ÷ rating governs (18 bags for the 80 ft² worked example). Waste is counted once per material — brick breakage in the brick count only, mortar waste derating the rating only. The `bagYieldFt3` input and the `MORTAR_BAG_YIELD_FT3` constant are removed; the mortar volume (geometric joint volume, BIA-corroborated) is unchanged and still feeds the site-mix parts.
  - `ceilUp` uses a relative epsilon of 1e-12 (the larger of 1e-12 absolute and 1e-12 × |value|): floating-point noise after the codebase's short calculation chains is at most ~1e-13 relative, so a genuinely above-integer requirement still rounds up, and any strictly positive requirement orders at least one package (zero stays zero).
- **Alternatives considered:**
  - *Bags from the bricks-you-buy count only (16 for the worked example)* — meets the reviewer's stated minimum but leaves the waste-adjusted mortar volume (5.09 ft³) uncovered at the rating's implied yield (≈ 0.30 ft³ per bag: 16 × 0.30 = 4.77 ft³ < 5.09 ft³). Rejected; the max-of-both-constraints rule covers both.
  - *Keep the 0.6 ft³/bag yield as a user-editable default* — rejected; the figure is unsourced for this product and the default would still undercut the manufacturer maximum.
  - *Keep the fixed 1e-9 epsilon and only add the ≥ 1 guarantee* — rejected; a genuinely above-integer value within 1e-9 (e.g. 5.0000000005) would still round down. The relative epsilon fixes both defects with one rule.
- **Consequences:** The worked example changes from 9 to 18 bags in both calculators, `docs/FORMULAS.md` §§10/18, both configs, and the cost figures. Four new regression tests (brick rating floor + zero-waste case, block cases, rating floor sweep, `ceilUp` tiny-positive cases) bring Vitest to 258/258. The release gate was re-run from scratch after the fix — 3 consecutive clean rounds PASSED 2026-11-22 (`docs/QA-REPORT.md` §13.4).

## ADR-12: Mortar Bag Count Limited to Standard Geometry; User-Entered Yield for Custom Geometry (PR #2 Second Re-Review)

- **Status:** Accepted (Phase 7 second review response, 2026-11-22)
- **Context:** The re-review (PR #2, review 6009895920) accepted the rating fix for the standard brick case, the `ceilUp` guard, and the committed gate scripts — but found the count-only rating breaks for custom geometry. Both calculators accept an adjustable joint width and Brick accepts custom brick dimensions, yet the bag count used the fixed standard-unit rating independent of the actual joint volume. For the 80 ft² modular wall at 15% mortar waste, widening the joint from ⅜ to ¾ in raises the geometric mortar volume from 5.09 to 8.82 ft³ while the recommended bags fall from 18 to 15 — because fewer bricks fit per ft² — contradicting the claim that the bag count covers the waste-adjusted volume. The rating's implied yield (≈ 0.30 ft³ per bag at standard geometry) is a property of the geometry, not of the bag, so it cannot be carried to other joints.
- **Decision:**
  - The manufacturer count rating applies only to standard geometry: modular brick (7⅝ × 2¼ × 3⅝ in) or standard 8 × 8 × 16 block, at the standard ⅜ in joint or narrower, within a 1% relative tolerance that absorbs metric rounding only (9.5 mm joint, 194 × 57 × 92 mm brick). A narrower joint is safe — it uses no more mortar per unit than the standard case, so the rating stays a conservative basis (¼ in joint → 3.58 ft³, 19 bags, still covering the volume at the implied yield). A wider joint or a non-modular brick size makes the rating inapplicable.
  - For non-applicable geometry the bag count comes from a verified user-entered yield (ft³ per 80 lb bag, from the bag's own data sheet — no default, no product yield claimed): bags = ceil(waste-adjusted mortar volume ÷ yield). With no yield entered, no bag count, bag cost, or shopping-list bag line is shown, and the page explains why and what to enter.
  - The standard case is unchanged: 18 bags for the worked example in both calculators.
- **Alternatives considered:**
  - *Keep the count rule and add a volume-coverage check (bags = max(count rule, volume ÷ implied yield))* — rejected; the implied yield is derived from the rating at standard geometry, so applying it to custom geometry would itself be an invented product yield — exactly what the reviewer forbade.
  - *Require a user-entered yield for all geometry, including the standard case* — rejected; the standard case is well supported by the manufacturer rating, and forcing every user to look up a yield would remove the useful default.
  - *Treat any joint deviation (including narrower) as inapplicable* — rejected; the coverage arithmetic shows narrower joints are strictly safer, and suppressing the count for the common ¼ in joint would remove a correct answer for no gain.
- **Consequences:** The bag row, bag cost, and shopping-list bag line are now conditional in both calculators (a `note` explains the suppression on the page). New regression tests: wider joints (¾ in → suppressed, 8.82 ft³), custom depth/length/height (suppressed), narrower joint (19 bags), user-yield path (30 bags at 0.3 ft³/bag, agreeing across both calculators), and metric equivalents (19.05 mm → suppressed, 9.5 mm and 194 × 57 × 92 mm → 18 bags), at both the formula and config levels — Vitest 258 → 282. The release gate is re-run from scratch after the fix (3 consecutive clean rounds, `docs/QA-REPORT.md` §13.5).

## ADR-13: Brick Partial Cost — Suppress a Mortar-Only Total, Label a Bricks-Only Figure (Phase 8, Issue #3)

- **Status:** Accepted (Phase 8, 2026-11-22)
- **Context:** After ADR-12, a non-standard brick geometry (wider joint, non-modular brick) with no verified yield entered has no bag count — but the cost code still built a total from the two optional prices. With only a mortar price entered, the total was `0 + 0 = $0`, displayed as "Estimated cost: $0.00". With a brick price entered, the bricks-only figure was displayed as the "Estimated cost" total even though it excluded mortar entirely. The Mortar Calculator already suppresses its cost when its bag count is unknown (`costUsd` is undefined unless bags exist), so Brick was the only calculator with this defect.
- **Decision:**
  - The Brick cost is built per component: `brickCost = bricks × price per brick` (when a brick price is entered), `mortarCost = bags × price per bag` (only when a bag count exists). If neither component is priced, `costUsd` is undefined — a mortar price alone buys no countable quantity, so the total is suppressed, never $0.
  - When the bag count is unknown but a brick price was entered, `costUsd` is the bricks-only figure and `costPartial` is true. The UI labels it "Partial cost (bricks only)" with the detail "Excludes mortar — no bag count for this brick size or joint", in both the results row and the copied shopping-list line (`costShoppingListLine` in `CalculatorConfig.ts`), so a copied list never presents a bricks-only figure as a total.
  - When the bag count is known, nothing changes: a brick price alone is still shown as the estimated cost (mortar is known but unpriced, the same as any unpriced item on the site).
- **Alternatives considered:**
  - *Suppress the cost entirely whenever the bag count is unknown* — rejected; a brick price still buys a known brick count, and hiding a correct bricks-only figure removes useful information. The partial label keeps it honest instead.
  - *Keep showing the bricks-only figure as the total* — rejected; it is exactly the misleading presentation the issue names.
  - *Carry the partial flag into the My Project planner (stored item cost + project total)* — deferred, not rejected; the planner sums stored item costs, so a partial brick cost stored there is a bricks-only figure in the total. The calculator page labels it partial before the user adds it, and the known limitation is recorded in the Phase 8 PR body. Changing the versioned LocalStorage schema is out of scope for this issue.
- **Consequences:** New regression tests at formula level (mortar-only → undefined, brick-only → 241 partial, both → 241 partial, standard geometry → not partial, no prices → undefined) and config level (label/detail passthrough, no label when the count is known), plus unit tests for the shopping-list cost line — Vitest 282 → 298. `docs/FORMULAS.md` §10 Cost line corrected (it previously described only the brick component) and now documents the partial rule.

## ADR-14: Environment-Specific Absolute Canonical / Sitemap / Robots URLs; Preview Noindex (Phase 8, Issue #3)

- **Status:** Accepted (Phase 8, 2026-11-22)
- **Context:** Since Phase 6 the two known SEO blockers are relative canonical URLs and the relative `Sitemap:` directive in `robots.txt` (Lighthouse SEO 83 on every measured page). Both need an absolute production origin, which does not exist yet: no domain is purchased or connected, and no host may be invented. Preview deployments must also never be indexed, and noindex is not access control — the real restriction has to be Cloudflare Access on the preview hostname.
- **Decision:**
  - A build-time environment variable `PUBLIC_SITE_URL` carries the owner-approved production origin (e.g. the `*.pages.dev` URL once a Pages project exists, or a custom domain later). `src/lib/site.ts` exposes `SITE_URL` (trailing slash stripped, undefined when unset) and `absoluteUrl(path, origin?)`, which returns the path unchanged when no origin is set. Canonical, `og:url`, breadcrumb `item` URLs, sitemap `<loc>` entries, and the robots `Sitemap:` directive all go through `absoluteUrl`, so with the variable unset — local builds, the release gate, preview deployments — every URL stays relative, exactly as before.
  - `astro.config.mjs` sets `site: process.env.PUBLIC_SITE_URL` (undefined when unset) so Astro itself knows the origin; the same single variable feeds both.
  - `robots.txt` is no longer a static file in `public/` (a static file cannot vary by environment). It is now the build-time route `src/pages/robots.txt.ts`, which emits the same allow-all content with an absolute `Sitemap:` URL only when an origin is set.
  - Preview builds set `PUBLIC_PREVIEW=true`, which adds `<meta name="robots" content="noindex, nofollow">` to every page via `Layout.astro`. The release-gate audit (`scripts/gate-audit.py`) now fails any build in which a page carries a noindex meta tag, so a preview build can never pass as a production build; the audit's canonical check also accepts absolute canonicals (path must still match the page's own path).
  - No origin is ever defaulted. The Pages project sets `PUBLIC_SITE_URL` only in its production environment and `PUBLIC_PREVIEW=true` only in its preview environments (docs/DEPLOYMENT.md §14). The owner supplies the origin when the Pages project is created.
- **Alternatives considered:**
  - *Hard-code the expected `*.pages.dev` hostname* — rejected; the hostname does not exist yet (no Pages project) and guessing it would invent a host.
  - *Disallow previews in robots.txt instead of noindex* — rejected; a Disallow would stop crawlers from ever seeing the noindex tag. The meta tag is the correct mechanism; Cloudflare Access is the access control.
  - *Keep robots.txt static and document a manual edit at deploy time* — rejected; a manual edit to `dist/` is not reproducible and would be lost on the next build. The route is generated from the same variable as everything else.
- **Consequences:** New tests: `src/lib/site.test.ts` (relative by default, absolute with an explicit origin), a Playwright test that the default build carries no noindex meta and a relative canonical. Mechanism verified locally with the RFC 2606 test origin `https://example.com` (never a production host): `PUBLIC_SITE_URL=https://example.com PUBLIC_PREVIEW=true` produces absolute canonicals, 39/39 absolute sitemap locations, an absolute robots `Sitemap:`, and a noindex meta on every page — and the audit passes the canonicals while correctly failing the noindex check on that build. The default build is unchanged (relative URLs, no noindex) and the gate is unaffected. The Lighthouse SEO 83 cap lifts only once a real origin is set at deploy time; that re-measurement is a post-deploy step in docs/DEPLOYMENT.md §10.

## ADR-15: Explicit Local / Preview / Production Build Modes; Validated Origin; Fail-Closed Noindex (PR #4 Review Response, P0)

- **Status:** Accepted (Phase 8 review response, 2026-11-22)
- **Context:** The independent reviewer (PR #4, review 6012776210, CHANGES_REQUESTED) found the ADR-14 deployment design fails open. `src/lib/site.ts` added noindex only for the literal `PUBLIC_PREVIEW=true` and did no origin validation, so a missing or mistyped `PUBLIC_SITE_URL` silently produced an indexable build with relative or wrong URLs. The gate audit verified canonical and sitemap *paths* only, so wrong hosts and relative URLs could pass even at production launch. `docs/DEPLOYMENT.md` §14 also allowed the first public deploy as a staging fallback, and connecting Git to a Pages project triggers an initial deployment before settings/access are verified.
- **Decision:**
  - Three explicit build modes, derived in `src/lib/site.ts` from the raw env values (`resolveBuildMode` / `resolveBuildConfig`, pure and unit-tested): **local** (neither variable set), **preview** (`PUBLIC_PREVIEW=true`, which wins over an origin), **production** (`PUBLIC_SITE_URL` set to a valid origin, preview flag not set).
  - A production origin is validated by the single pure rule in `src/lib/origin.ts` (`validateProductionOrigin`, used by both `site.ts` and `astro.config.mjs`): a bare `https://` hostname — no http, path, port, query, fragment, userinfo, localhost, `.local`, or IP literal; a bare word without a dot is rejected as a typo. An invalid value fails the build loudly (exit 1, naming the bad value and the rule) instead of shipping wrong URLs. The normalized origin is lowercase, no trailing slash.
  - Fail-closed noindex: only a production build is indexable. `Layout.astro` renders `<meta name="robots" content="noindex, nofollow">` whenever the build is not production, so local and preview builds are noindex by construction — a build with missing or mistyped config can never leak into search results. The preview flag's literal spelling no longer matters for safety: any non-`true` value with no origin is a local build, which is noindex anyway.
  - The gate audit (`scripts/gate-audit.py`) takes `--mode` and `--origin` and enforces the exact origin, not just paths: production requires absolute canonicals, sitemap `<loc>` entries, and the robots `Sitemap:` directive with exactly the given origin, and no noindex on any page; preview requires a noindex tag on every indexable page and the 404, with URLs using exactly the origin when one is set and relative otherwise; local requires noindex on every page and the 404 with all URLs relative. The audit also validates the origin format itself. The gate (`scripts/gate-round.sh`) now builds all three modes per round — production with the RFC 2606 test origin `https://example.com` (mechanism test only, never a production host) for the full check set including Playwright and Lighthouse, then preview and local builds for audit-only mode checks. Negative checks verified: a build audited against a different origin fails all three URL checks, and a production build audited as local fails the noindex and relative-URL checks.
  - Docs (§14) now forbid using the first public deployment as a staging substitute: the safe creation sequence is to pause automatic deployments / disable automatic production-branch deployments immediately after connecting Git, set env vars and the preview access policy, and only then resume deployments — see `docs/DEPLOYMENT.md` §14.2/§14.4. The native Pages preview access policy (Settings → General → Enable access policy) replaces the Zero Trust application described in Phase 8 for preview restriction: it covers every preview deployment (hash-based `<hash>.<project>.pages.dev` and the branch alias `<branch>.<project>.pages.dev`) but not the production `*.pages.dev` domain.
- **Alternatives considered:**
  - *Keep the two-variable design and only add origin validation* — rejected; validation alone does not fix the default: a missing origin would still produce an indexable relative-URL build. The fail-closed default is the actual fix; validation is the second layer.
  - *Accept any truthy preview value ("1", "yes") as preview* — rejected; the literal `"true"` is documented and the fail-closed default makes other spellings safe anyway (no origin → local → noindex). Loosening the flag adds ambiguity for no safety gain.
  - *A separate `PUBLIC_BUILD_MODE` variable instead of deriving the mode* — rejected; a third variable can contradict the other two (e.g. mode=production with no origin), and the derivation has exactly one source of truth per mode. The derived mode is what the audit enforces.
  - *Keep the gate on a single default build* — rejected; a single build cannot prove the preview noindex or the local fail-closed default. The two extra builds are audit-only and cost seconds.
- **Consequences:** `src/lib/origin.ts` (new, pure), `src/lib/site.ts` (modes + `IS_PRODUCTION`/`IS_INDEXABLE`), `Layout.astro` (noindex when not production), `astro.config.mjs` (validated `site`), `scripts/gate-audit.py` (`--mode`/`--origin`, exact-origin + per-mode noindex checks), `scripts/gate-round.sh` (three mode builds per round), `tests/home.spec.ts` + `tests/calculators.spec.ts` (origin-aware sitemap/canonical/noindex assertions). New tests: origin validation (10 cases) + mode resolution (5 cases) in `src/lib/site.test.ts` — Vitest 298 → 308. The default build now carries a noindex tag (visible change, intended). The Lighthouse SEO score is re-measured per round on the production-mode build; the 80 threshold is unchanged. No owner-approved origin exists yet, so the gate still uses the `https://example.com` test origin and the SEO cap note is updated, not removed.

## ADR-16: Partial Cost Preserved Through My Project — Save, Reload, UI, Quantity, Exports (PR #4 Review Response, P1)

- **Status:** Accepted (Phase 8 review response, 2026-11-22)
- **Context:** The independent reviewer (PR #4, review 6012776210) found the ADR-13 partial-cost fix stopped at the calculator page. `GenericCalculator` saved only `result.costUsd` to My Project, `project.ts` normalized only `costUsd`, and `formatProjectAsText` called the figure "Estimated cost / Estimated total" — so a bricks-only estimate could be read as a full project total, and text/CSV/print exports lost the exclusion entirely.
- **Decision:**
  - `ProjectItem` gains three optional fields — `costPartial?: boolean`, `costLabel?: string`, `costDetail?: string` — carried from the calculator result (`CalcOutput.costPartial`, new) through `GenericCalculator.addToProject`, `addItemToProject`, LocalStorage serialization, and `normalizeItem` on reload. **No schema version bump** (the reviewer agreed it is unnecessary): the fields are optional, old items normalize to "not partial", and a partial flag is only kept when a finite cost is stored — an unpriced item has no cost to be partial about.
  - Every surface that shows a cost labels a partial one: the My Project item line (`Line total: $X ($Y × N) — Partial cost (bricks only)` + the detail as its own line), the room subtotal (`Subtotal for {room}: $X (partial total — …)` when any item in the room is partial), and the project total (`Partial total (incomplete estimate): $X (…some items are partial, see their notes)`). The text export shows the partial label + detail per item and a "Partial total (incomplete estimate)" total; the CSV gains a "Cost note" column carrying the label + detail per row and a "Partial total (incomplete estimate)" total row. Print needs no separate change: it prints the same page, so the labels print with it.
  - Quantity multiplication keeps the flag: the per-unit figure is partial, so the multiplied line total is partial too (`itemLineCost` already multiplies; the label follows the flag, not the arithmetic).
  - Editing the unit price in My Project clears the partial flag, label, and detail: the edited price is the user's own figure, no longer the calculator's partial output. Editing only the label, quantity, or room leaves the flag untouched. Clearing the price (empty field → NaN → undefined) also clears the flag, since there is no cost left to be partial about.
  - The unknown-mortar / no-priced-bricks case is unchanged: `costUsd` stays undefined and no cost is shown anywhere.
- **Alternatives considered:**
  - *Bump the schema to version 3 for the new fields* — rejected; a version bump would force a migration path for identical data. Optional fields with safe normalization are the lighter, reviewer-approved route, and the storage key stays `homediycalc:project:v1`.
  - *Store the partial flag but label only the project total* — rejected; the item line is where a user reads the figure, and the CSV row is what leaves the site — both must carry the note, or the export still misleads.
  - *Keep the partial flag when the user edits the price* — rejected; the edited price is not the calculator's bricks-only figure, so the flag would describe a number it no longer applies to. Clearing it is the honest rule, and it is tested.
  - *Suppress the cost entirely when saving a partial result* — rejected; the bricks-only figure is correct information, and the calculator page already labels it partial before the user saves. Hiding it in the planner would remove a useful number.
- **Consequences:** `src/lib/project.ts` (fields, normalization, `isItemCostPartial` / `projectHasPartialCost` / `itemCostLabel` / `itemCostNote`, text + CSV formats, price-edit clearing), `src/components/react/CalculatorConfig.ts` (`costPartial` on `CalcOutput`), `src/calculators/brick-calculator/config.ts` (passes `r.costPartial` through), `src/components/react/GenericCalculator.tsx` (saves the three fields), `src/pages/my-project.astro` (item/room/project partial labels). New tests: 10 unit tests in `src/lib/project.test.ts` (round-trip, pre-field migration, flag dropped without a cost, text/CSV partial labels and totals, quantity multiplication, LocalStorage add/update round-trips with a stubbed store) and a Playwright test in `tests/project.spec.ts` (brick ¾ in joint + $0.50/brick → save → reload → quantity 2 → CSV → price edit clears the flag) — Vitest 308 → 318, Playwright 78 → 80. `docs/FORMULAS.md` §10 Cost line notes the preservation. The CSV format gains a column (a deliberate, documented format change; the header test is updated).
