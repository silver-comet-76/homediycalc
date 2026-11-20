# License Audit — HomeDIYCalc Foundation Dependencies

- **Audit date:** 2026-11-20
- **Auditor:** dependency reviewer (subagent)
- **Scope:** Core + supporting dependencies for the foundation phase only (Astro static site, TypeScript strict, React Islands, Tailwind CSS, Vitest, Playwright, Cloudflare Pages free tier). No backend, no database, no paid API, no paid runtime dependency — per `AGENTS.md`.
- **Method:** `browser.search` + `browser.open` on npmjs.com / GitHub project pages and official docs. Nothing was installed. Versions below are the latest **stable** versions verified as of 2026-11-20. Where a package page cache was stale (npmjs.com pages crawled in 2025), the version was cross-checked against the Astro docs, React docs, Vitest/Playwright release notes, and registry-derived trackers dated November 2026. No version or license in this file is invented.
- **Build VM Node version (verified by `node -v` during this audit):** v24.22.1

## 1. Audit table

| Dependency | Latest stable verified (date) | Pinned version (recommended) | License (SPDX) | Permissive? | Source link | Notes |
|---|---|---|---|---|---|---|
| `astro` | 7.4.13 (2026-11-18) | **7.4.13** (exact) | MIT | Yes | https://www.npmjs.com/package/astro | Astro docs state "The latest release of Astro is v7.4.13". MIT confirmed on npm + GitHub (`withastro/astro`). Astro joined Cloudflare 2026-01-16 and remains MIT-licensed. |
| `@astrojs/react` | 7.1.9 (2026-11-13) | **7.1.9** (exact) | MIT | Yes | https://www.npmjs.com/package/@astrojs/react | Official Astro React integration. v7 uses `@vitejs/plugin-react` v6 + Oxc for JSX/Fast Refresh; Babel option removed. Peer range includes React 17–19. |
| `react` | 19.3.1 (2026-10-14) | **19.3.1** (exact) | MIT | Yes | https://www.npmjs.com/package/react | 19.3.1 is npm's `latest` tag. **Security:** 19.3.1 patches the critical React Server Components unauthenticated RCE advisory published 2026-10-14 (fixes also in 19.0.9 / 19.1.10 / 19.2.9). Do not pin ≤ 19.3.0. |
| `react-dom` | 19.3.1 (2026-10-14) | **19.3.1** (exact) | MIT | Yes | https://www.npmjs.com/package/react-dom | Must match `react` exactly (same 19.3.1). Single direct dependency: `scheduler`. |
| `tailwindcss` | 4.3.5 (2026-11-06) | **4.3.5** (exact) | MIT | Yes | https://www.npmjs.com/package/tailwindcss | v4, CSS-first config (`@import "tailwindcss"` + `@theme` in CSS). No `tailwind.config.js` required. Zero direct dependencies. |
| `@tailwindcss/vite` | 4.3.5 (2026-11-06) | **4.3.5** (exact) | MIT | Yes | https://www.npmjs.com/package/@tailwindcss/vite | The Tailwind v4 Vite plugin — this is how Tailwind integrates with Astro 7. Version tracks `tailwindcss` 1:1; keep the two in lockstep. |
| `typescript` | 7.0.2 (2026-07-08) — **see flag below** | **6.0.3** (exact, deliberate downgrade from latest) | Apache-2.0 | Yes | https://www.npmjs.com/package/typescript | **Do NOT pin 7.x yet.** TS 7 is a Go rewrite with no stable programmatic compiler API; `astro check` refuses TS 7.0 ("astro check does not currently support TypeScript 7.0") and several tools that import `typescript` break. TS 6.0.3 (2026-04-16) is the last JS-based line and the compatibility line. Revisit after TS 7.1 (stable API planned) ships **and** Astro supports it. |
| `vitest` | 5.1.1 (2026-11-17) | **5.1.1** (exact) | MIT | Yes | https://www.npmjs.com/package/vitest | Requires Vite ≥ 6.4 and Node ≥ 22.12. Astro 7 bundles Vite 8 — do not pin `vite` separately; let Astro/Vitest resolve it. |
| `@vitest/coverage-v8` | 5.1.1 (2026-11-17) | **5.1.1** (exact) | MIT | Yes | https://www.npmjs.com/package/@vitest/coverage-v8 | Optional but recommended (coverage provider). Version tracks Vitest 1:1 — verify at install time; if it differs, take the matching 5.1.x. |
| `@playwright/test` | 1.65.1 (2026-11-13) | **1.65.1** (exact) | Apache-2.0 | Yes | https://www.npmjs.com/package/@playwright/test | 1.65.0 released 2026-11-05; 1.65.1 patch 2026-11-13. Browsers are downloaded separately (`npx playwright install chromium`) — free, no licence fee. |
| `jsdom` | 31.0.1 (2026-11-13) | **31.0.1** (exact) | MIT | Yes | https://www.npmjs.com/package/jsdom | DOM environment for Vitest component tests. Use per-file (`// @vitest-environment jsdom`) or a dedicated `dom` project, not globally — pure formula tests run in Node. |
| `@testing-library/react` | 16.3.3 (2026-08-27) | **16.3.3** (exact) | MIT | Yes | https://www.npmjs.com/package/@testing-library/react | Supports React 18 and 19 (peer range `^18.0.0 \|\| ^19.0.0`). Requires `@testing-library/dom` as a peer — install it explicitly. |
| `@testing-library/dom` | 10.4.2 (2026-09-13) | **10.4.2** (exact) | MIT | Yes | https://www.npmjs.com/package/@testing-library/dom | Peer dependency of `@testing-library/react` 16.x and (since v7) a required peer of `@testing-library/jest-dom`. |
| `@types/react` | 19.3.0 (2026-09-09) | **19.3.0** (exact) | MIT | Yes | https://www.npmjs.com/package/@types/react | DefinitelyTyped. Matches React 19.3 (includes `browser()` types). |
| `@types/react-dom` | 19.3.0 (2026-09-11) | **19.3.0** (exact) | MIT | Yes | https://www.npmjs.com/package/@types/react-dom | DefinitelyTyped. Matches React DOM 19.3. |
| `@testing-library/jest-dom` | 7.0.1 (2026-08-09) | **HOLD — do not install yet** | MIT | Yes | https://www.npmjs.com/package/@testing-library/jest-dom | **Unresolved flag (see §4).** Its README states v7 supports up to Vitest 4 and v8 supports Vitest 5+, but no stable v8 release could be verified as of 2026-11-20 (GitHub releases latest is v7.0.1). It is optional — Vitest's built-in `expect` + RTL work without it. At scaffold time run `npm view @testing-library/jest-dom version`: if v8.x stable exists, pin that; otherwise omit jest-dom and use plain matchers. Do not force-install 7.0.1 alongside Vitest 5. |

All 16 rows above are MIT or Apache-2.0. **No GPL / AGPL / LGPL, no copyleft, no paid tier, no external API, no phone-home behaviour at runtime was found in any of them.** All are free and open source; the only costs in the whole stack are CI minutes and the (free-tier) Cloudflare Pages hosting already chosen in `AGENTS.md`.

## 2. Recommended pinned versions (foundation phase)

Pin exact versions (no `^`) in `package.json` so the foundation build is reproducible. Use `npm install --save-exact` or write the versions literally.

```json
{
  "dependencies": {
    "astro": "7.4.13",
    "@astrojs/react": "7.1.9",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "tailwindcss": "4.3.5",
    "@tailwindcss/vite": "4.3.5"
  },
  "devDependencies": {
    "typescript": "6.0.3",
    "vitest": "5.1.1",
    "@vitest/coverage-v8": "5.1.1",
    "@playwright/test": "1.65.1",
    "jsdom": "31.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/dom": "10.4.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0"
  }
}
```

Notes on the pin list:

- `@testing-library/jest-dom` is deliberately **absent** — see the HOLD flag in §1/§4.
- `vite` is deliberately **absent** — Astro 7 manages Vite 8 (8.3.8 at audit time, MIT) internally. Pinning it separately risks a version skew with Astro's Rolldown-based build.
- `@astrojs/check` (the `astro check` type-checker) is optional and was not pinned: it type-checks `.astro` files via Volar and its peer range is TypeScript 5/6, which is consistent with the TS 6.0.3 pin — add it later only if the foundation phase wants `astro check` in CI.
- No Cloudflare adapter is needed: the site is fully static (`output: "static"`, the Astro default), so deployment is a plain static upload to Cloudflare Pages. Do **not** add `@astrojs/cloudflare` unless SSR is ever introduced (it is not planned).

## 3. Version-compatibility constraints

| Constraint | Detail |
|---|---|
| Node.js | **Build VM has Node v24.22.1 — satisfies everything.** Astro 7.4.2+ requires **≥ 22.23.4** (7.0–7.3: ≥ 22.12.0; 7.4.0–7.4.1: ≥ 22.22.0). Vitest 5 requires ≥ 22.12. Playwright 1.65 requires Node 22, 24 or 26 — **Node 20 is no longer tested/dropped in 1.65**. `@testing-library/jest-dom` 7 requires Node ≥ 22. Set `NODE_VERSION=24` (or at least `22.23.4`) in the Cloudflare Pages build settings — do not rely on the Pages default image, which may be older. |
| Astro + React adapter | `@astrojs/react` 7.x pairs with Astro 7.x. Upgrade them together with `npx @astrojs/upgrade`. React 17/18 projects would additionally need `react-compiler-runtime`; React 19 does not. |
| React / React DOM / types | `react`, `react-dom` must be the **same** version (19.3.1). `@types/react` / `@types/react-dom` 19.3.0 match the 19.3 line. |
| Tailwind vs Astro integration | **There is no `@astrojs/tailwind` integration for Astro 7 / Tailwind v4 — do not install it.** The supported route is `npx astro add tailwind`, which installs `@tailwindcss/vite` + `tailwindcss` and wires the Vite plugin into `astro.config`. Tailwind v4 is CSS-first: theme lives in CSS (`@theme`), not `tailwind.config.js`. One community report notes `astro add tailwind` can fail with a Rolldown `tsconfigPaths` error on some Astro 7 patches; if that occurs, the fallback is the PostCSS integration (`@tailwindcss/postcss`, also MIT, same version line) — record it if used, do not silently switch. |
| TypeScript vs Astro | **TypeScript 6.0.3, not 7.x** (see §4). `astro check` and Volar import the `typescript` JS API, which TS 7.0 does not ship. Plain `tsc` works under TS 7, but the Astro toolchain does not. |
| Vitest vs Vite | Vitest 5 needs Vite ≥ 6.4; Astro 7 ships Vite 8, so this is satisfied transitively. Do not install a second Vite. |
| Vitest vs jest-dom | See HOLD flag: jest-dom 7.x is documented for Vitest ≤ 4; Vitest 5 support is stated for jest-dom v8, which had **no verifiable stable release** at audit time. |
| Playwright 1.65 breaking changes | Ten documented breaking changes in 1.65, most likely to bite: (1) Node 20 dropped; (2) Playwright now honours `useDefineForClassFields` from `tsconfig.json` — page-object class fields reading `this.page` at field-initialiser time now throw; (3) stricter RFC 6265 cookie matching; (4) proxy credentials no longer sent to websites; (5) CSS imports must exist. Review the 1.65 release notes before writing page objects. |
| React 19.3.1 security | 19.3.1 (2026-10-14) is a security patch for the React Server Components RCE advisory. This project does not use Server Components, but pin 19.3.1 anyway — never pin 19.3.0 or earlier. |

## 4. Flags and open items

1. **TypeScript 7 — DELIBERATE HOLD (not a licence problem).** Licence is Apache-2.0 (permissive). The hold is purely compatibility: TS 7.0.2 (Go rewrite, 2026-07-08) ships no stable compiler API, `astro check` explicitly refuses it, and tools that import `typescript` (typescript-eslint, ts-morph, Vue/Astro/Svelte template checkers) break. Microsoft's own guidance is to keep TS 6 alongside (`@typescript/typescript6`) where tooling needs it. **Action:** pin `typescript@6.0.3`; re-evaluate when TS 7.1 (new API planned) is stable **and** Astro announces support.
2. **`@testing-library/jest-dom` v8 — UNVERIFIED.** Licence MIT either way. Its README (via pkgstats) says v8 supports Vitest 5+, but GitHub releases show v7.0.1 (2026-08-09) as latest and no v8 stable version could be verified on 2026-11-20. **Action:** check `npm view @testing-library/jest-dom version` at scaffold time; install v8.x only if it exists as stable, otherwise omit the package (matchers are optional).
3. **Astro 7.4.13 freshness.** Published 2026-11-18, two days before this audit. It is the documented latest stable, but it is very fresh; one third-party upgrade tracker rated 7.4.13 "Wait" while rating 7.4.8 "Safe to upgrade". **Action:** pin 7.4.13, but if the scaffold build shows any regression, fall back to **7.4.8** and record the change — do not silently float to `^7`.
4. **Transitive dependencies not individually audited.** This audit covers direct dependencies only. The full tree (e.g. `scheduler` under react-dom, `@tailwindcss/oxide`, Vite, esbuild, Playwright's browser binaries) should be checked at scaffold time with `npx license-checker --summary` (or equivalent) and the output kept in this file's appendix. No GPL-family licence is expected — Astro/React/Tailwind/Vitest trees are overwhelmingly MIT/Apache-2.0/ISC/BSD — but that must be verified from the actual lockfile, not assumed.
5. **Playwright browser download is install-time network, not runtime.** `npx playwright install chromium` downloads a Chromium build (~150 MB) once at CI/dev setup. It is free and licence-free (Chromium is BSD-licensed); it is not a paid service and the shipped site never contacts it.

## 5. Audit verdict

**PASS — with the two holds above.**

- ✅ **No paid runtime dependency.** Every package is free and open source. Astro, React, Tailwind, TypeScript, Vitest, Playwright and all supporting packages cost $0; there is no licence key, subscription, or per-call billing anywhere in the stack.
- ✅ **No external API needed by any calculator.** All calculation logic is pure TypeScript running in the browser / at build time (per `AGENTS.md`). None of the audited packages requires an external API, account, or network call at runtime. The only network use is at install/build time (npm install, Playwright browser download, Cloudflare Pages deploy).
- ✅ **All licences permissive.** MIT (Astro, React, Tailwind, Vitest, jsdom, Testing Library, type packages) or Apache-2.0 (TypeScript, Playwright). No copyleft (GPL/AGPL/LGPL), no Commons Clause, no source-available licence.
- ✅ **No phone-home / telemetry in the shipped site.** None of the audited packages phones home from the built site. (Build-time tools may check for updates; that is not runtime behaviour of the site.)
- ⚠️ **Two holds, both compatibility — not licence:** pin TypeScript **6.0.3** (not the latest 7.0.2) and hold `@testing-library/jest-dom` until v8 is verifiable (see §4).

## 6. Dependencies to avoid (and why)

| Avoid | Why |
|---|---|
| `typescript@7.x` (for now) | No stable compiler API; breaks `astro check` / Volar. Revisit after TS 7.1 + Astro support. Licence itself (Apache-2.0) is fine. |
| `@astrojs/tailwind` | The old Tailwind integration; superseded by `@tailwindcss/vite` for Tailwind v4 + Astro 7. Installing it will conflict with the v4 setup. |
| `jest`, `ts-jest`, `babel-jest` | Unneeded: Vitest covers unit/component tests. Jest would duplicate the test stack and `ts-jest` is broken on TS 7 anyway. (Jest itself is MIT — avoided for redundancy, not licence.) |
| `cypress` | Unneeded duplicate of Playwright for e2e; its hosted dashboard (Cypress Cloud) is a paid tier, which conflicts with the no-paid-dependency rule even though the runner is MIT. |
| `enzyme` | Abandoned for React 19 (last release 3.11.0, Dec 2019; official adapters only to React 16). Use `@testing-library/react` 16.3.3. |
| `tailwindcss@3.x` / `tailwindcss` with `tailwind.config.js` | v3 line; the project standard is Tailwind v4 CSS-first. Mixing v3 config with the v4 Vite plugin will break the build. |
| Tailwind UI / Catalyst / any Tailwind paid component kit | Paid commercial licence — violates the no-paid-dependency rule. Build components from the free Tailwind v4 utilities. |
| Any analytics / ads / A-B SDK (`@google-analytics/*`, ad SDKs, etc.) | `AGENTS.md`: AdSense disabled by default; no tracking beyond what the privacy policy discloses. Do not add without an owner decision in `docs/DECISIONS.md`. |
| Any calculator / pricing / materials API package | No calculator may depend on an external API (per `AGENTS.md`). If a feature seems to need live prices or product data, redesign it or record a deferred decision — do not add a paid/free API client silently. |
| `next`, `nuxt`, `gatsby`, other meta-frameworks | Would replace the fixed Astro architecture. Changing the framework requires an ADR in `docs/DECISIONS.md`. |
| `@testing-library/jest-dom@7.x` alongside Vitest 5 | Documented for Vitest ≤ 4; Vitest 5 support is stated for the unverified v8. Omit until v8 is confirmed (see §4). |
| `react@≤19.3.0` / `react-dom@≤19.3.0` | Misses the 2026-10-14 Server Components RCE security patch. Pin 19.3.1. |
| Unpinned / floating ranges (`*`, `latest`, `^` on majors) | The foundation build must be reproducible. Pin exact versions (see §2); upgrades go through a deliberate bump + re-audit. |

## 7. Re-audit checklist — scaffold-time verification (2026-11-20)

Run at scaffold time per §7, against the real lockfile (`package-lock.json`,
367 packages total):

```text
├─ MIT: 307
├─ ISC: 15
├─ Apache-2.0: 13
├─ BSD-2-Clause: 10
├─ BSD-3-Clause: 5
├─ BlueOak-1.0.0: 4
├─ MPL-2.0: 3
├─ LGPL-3.0-or-later: 2
├─ CC0-1.0: 2
├─ 0BSD: 2
├─ Apache-2.0 AND LGPL-3.0-or-later AND MIT: 1
└─ UNLICENSED: 1
```

**Findings (recorded honestly — the audit's "no GPL-family licence expected" did not fully hold):**

- **LGPL-3.0-or-later (3 packages):** `@img/sharp-libvips-linux-x64@1.3.4`,
  `@img/sharp-libvips-linuxmusl-x64@1.3.4`, and `@img/sharp-wasm32@0.35.5`
  (the last also Apache-2.0 and MIT). These are the precompiled libvips native
  binaries behind `sharp`, a transitive dependency of Astro's image tooling.
  They are build-time tooling only: the site uses no Astro `<Image>` component
  and ships no image-optimization code, so no libvips code is bundled into
  `dist/` or served to users, and the binaries are used unmodified. LGPL
  permits use of an unmodified library in this way. No action required, but
  the finding is recorded here rather than hidden.
- **UNLICENSED (1 package):** `homediycalc@0.1.0` — the project itself
  (`"private": true`, no license field yet). Expected; a project license
  decision is still open (see `docs/DECISIONS.md` — not yet recorded).
- **No GPL/AGPL** anywhere in the tree. No paid dependency anywhere.

**Other §7 checklist items (2026-11-20):**

- [x] `npm install` from the §2 pin list succeeded on Node v24.22.1; `npm run build` succeeds.
- [x] `npm view @testing-library/jest-dom version` returned **8.0.0** (stable v8 now
  exists, resolving the §4 flag) — but jest-dom was still **not installed**, per the
  Phase 1 task instruction, which takes precedence. Component tests use plain
  Vitest matchers instead.
- [x] Cloudflare Pages build image Node version: not yet verified (no deployment
  yet — Phase 6). Recommend `NODE_VERSION=24` when the Pages project is created.
- [ ] TypeScript 7.1 / Astro TS 7 support: not re-checked — TS 6.0.3 remains pinned.

**One addition beyond the audit's pin list:** `@astrojs/check@0.9.12` (MIT,
official Astro package) was installed as a devDependency in Phase 1 because
`npm run typecheck` (`astro check`) refuses to run without it — the command
prompts interactively for installation and hangs in non-interactive use. This
resolves ARCHITECTURE.md §13 (typechecking = `astro check`). Pinned exact,
no `^` range.

**Phase 5 addition:** `@types/node@24.19.2` (MIT, DefinitelyTyped) was
installed as a devDependency in Phase 5. `npm run typecheck` failed with 1
error — `tests/project.spec.ts` imports `readFile` from `node:fs/promises`
to read the exported CSV, and the project's `tsconfig.json` restricts
automatic `@types` inclusion to `["vitest/globals"]`, so Node's built-in
module had no types. The fix was the types package (pinned exact) plus
`"node"` in the tsconfig `types` array; typecheck is now 0 errors, 0
warnings, 0 hints. No runtime code changed and no new runtime dependency
was added.

> The §7 checklist items were all actioned at scaffold time on 2026-11-20; results are above. The one expectation that did not hold is recorded there: LGPL-3.0-or-later does appear in the transitive tree (sharp/libvips build-time binaries only).
