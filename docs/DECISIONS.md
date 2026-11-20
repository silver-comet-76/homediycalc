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
