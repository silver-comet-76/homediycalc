# Deployment — HomeDIYCalc (Cloudflare Pages)

> Status: Phase 6 — deployment preparation complete (2026-11-20). Nothing has
> been deployed. There is no Cloudflare account, no Cloudflare Pages project,
> and no domain yet. The code is on GitHub at https://github.com/silver-comet-76/homediycalc (main at merge commit `e8345f7e`, PR #2 merged 2026-11-22). Everything below is preparation
> and documentation; the first real deployment still needs owner approval
> (see §13).

## 1. Overview

- **Host:** Cloudflare Pages, free tier.
- **Source:** GitHub repository https://github.com/silver-comet-76/homediycalc (main at merge commit `e8345f7e`, PR #2 merged 2026-11-22).
- **Build command:** `npm run build`
- **Build output directory:** `dist/`
- **Node version for the build:** 24 (set `NODE_VERSION=24` in the Pages project; see §3). The project's `package.json` engines field requires Node `>=22.23.4` — per the license audit, the Cloudflare Pages build image must be Node ≥22.23.4, and Node 24 is what the project is developed and tested on (v24.22.1).
- **Environment variables:** none required. The site must build and run with zero environment variables. If a build ever requires one, that is a defect to fix, not a variable to add. The only optional variables are the AdSense placeholders in `src/lib/ads.ts` (`PUBLIC_ADSENSE_PUBLISHER_ID`, `PUBLIC_ADSENSE_SLOT_*`); they are ignored while ads are disabled (ADR-8) and must never be set to real IDs without the owner decision in §12.
- **Serverless functions / Workers / KV / R2:** none. The site is pure static files.

## 2. Prerequisites

1. **GitHub repository with the project pushed** (all 25 calculators and main pages complete). **Done 2026-11-21:** the repository https://github.com/silver-comet-76/homediycalc exists (public, main at merge commit `e8345f7e` — PR #2 merged 2026-11-22). The Git-integration path in §3 can now be executed once a Cloudflare account and Pages project exist.
2. **A Cloudflare account (free).** **Not created.** The agent does not create accounts on the user's behalf without instruction. Do not create one as part of Phase 6.
3. **Node.js 24** for the build (see §1). Locally verified: Node v24.22.1.
4. **Wrangler (for the manual path only).** **Not installed** in this environment (`command -v wrangler` returns nothing). Do not add it as a project dependency without a license note; install it only when a manual deploy is actually being done (see §4).

## 3. Deployment via Git Integration (recommended)

Documented, not executed — no Cloudflare account or Pages project exists yet, so no Pages project can be connected today.

1. Push the project to GitHub (once the repository exists), branch `main`.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the GitHub repository and the production branch (`main`).
4. Set the build configuration:
   - **Framework preset:** Astro (or "None" with the commands below — confirm against the dashboard at setup time).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist/`
   - **Root directory:** `/` (repository root).
   - **Environment variables:** `NODE_VERSION=24`. Leave everything else empty — no other variable is required.
5. Click **Save and Deploy**. Cloudflare builds the site and assigns a `*.pages.dev` URL.
6. Verify: open the `*.pages.dev` URL, check the home page and at least one calculator page load, confirm a calculation returns a result, and confirm the security headers from `public/_headers` are present in the response (see §11 — the local preview server does **not** apply `_headers`, so this check can only happen on the live deploy).
7. Every subsequent push to the production branch triggers an automatic production deploy. Pull requests get preview deployments automatically.

## 4. Manual Deployment (alternative)

Documented, not executed — no deploy has been run in Phase 6.

**Dashboard upload (no tooling needed):**

1. Run `npm run build` locally.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Upload assets**.
3. Upload the contents of `dist/` (the directory itself, not a zip of the repo).
4. Verify the assigned `*.pages.dev` URL as in §3 step 6.

**Wrangler (command line):**

```bash
# One-time install, only when a manual deploy is actually being done.
# Wrangler is NOT a project dependency and is NOT installed in this environment.
npm install -g wrangler

# Log in once (opens a browser; needs the owner's Cloudflare account).
wrangler login

# Deploy the built output.
npx wrangler pages deploy dist --project-name homediycalc
```

Confirm the exact command against the installed Wrangler version at the time — the `pages deploy` syntax has changed between Wrangler versions. Manual deploys do not auto-update on push; repeat the upload for each release.

## 5. Pre-Deploy Checklist (every deploy)

- [ ] `npm run build` succeeds locally with no errors (clean `dist/`, 40 pages: 39 shipped + 404).
- [ ] `npm run lint` passes (Prettier formatting check, ADR-10).
- [ ] `npm run typecheck` passes (0 errors, 0 warnings, 0 hints).
- [ ] `npm run test` (Vitest) passes.
- [ ] `npm run test:e2e` (Playwright) passes against the production build.
- [ ] `dist/sitemap.xml` lists exactly the shipped pages (39 URLs).
- [ ] `dist/robots.txt` present and pointing at the sitemap.
- [ ] `dist/_headers` present (security headers, §11).
- [ ] No placeholder pages, no fake data, no ad/analytics scripts unless owner-approved — verify with `grep -ri "adsbygoogle\|pagead2\|googlesyndication" dist/` (expect no hits outside the privacy-policy prose, which states ads are disabled) and the `src/lib/ads.test.ts` suite (asserts ads are disabled and all IDs are placeholders).
- [ ] `dist/` contains `favicon.svg` and `og-image.svg`.
- [ ] Tag the release commit in git (`git tag homediycalc-vX.Y.Z`) so any deployed state can be reproduced from a commit. `dist/` itself is gitignored and is **not** stored in the repo — a rollback rebuilds from the tag (see §9).

## 6. Custom Domain

- **Do not purchase a domain for this project.**
- If the owner already owns a domain and asks to connect it: in Cloudflare Pages, **Custom domains → Set up a custom domain**, follow the DNS instructions Cloudflare shows, and update canonical URLs, the sitemap, and `robots.txt` to the custom domain. Re-verify Search Console for the new domain.
- Until a production origin is set, the canonical domain is unset and every URL stays relative (see §14). The origin is supplied as the `PUBLIC_SITE_URL` environment variable in the Pages project's **production** environment only — never hard-coded, never invented.
- **After a production origin is set**, the two known SEO blockers disappear automatically: canonical URLs, the sitemap `<loc>` entries, and the `robots.txt` `Sitemap:` directive become absolute from that variable (ADR-14) — then re-run Lighthouse on Home, Paint, and Concrete and record the new scores in `docs/QA-REPORT.md`.

## 7. ads.txt

- **Only when AdSense is enabled** (disabled by default — see ADR-8 in `docs/DECISIONS.md`). There is **no** `public/ads.txt` in the repository today, and there must not be one until AdSense is enabled with a real publisher ID.
- The template is `docs/ads.txt.template`. It contains a single line with the placeholder `pub-REPLACE-WITH-REAL-PUBLISHER-ID`, which is deliberately not a number and cannot be mistaken for a real ID. The trailing `f08c47fec0942fa0` is Google's fixed certification authority ID — a public constant of the ads.txt specification, not a publisher ID.
- When AdSense is enabled: copy `docs/ads.txt.template` to `public/ads.txt`, replace the placeholder with the real publisher ID from the owner's AdSense account (a 16-digit number after `pub-`), redeploy, and confirm the file is reachable at `https://<domain>/ads.txt`.
- Do not create an `ads.txt` with invented publisher IDs. The file's contents come only from the owner's AdSense account.

## 8. Search Console Setup

Do not submit anything yet — there is no domain and no live site. The steps below are the instructions to follow at launch, in the owner's Google account (the agent does not create Google accounts).

### 8.1 Add the property

1. Go to [Google Search Console](https://search.google.com/search-console) and sign in with the owner's Google account.
2. Click **Add property**. Choose **Domain** (covers all subdomains; requires DNS verification) or **URL prefix** (simpler; enter the exact live URL, e.g. `https://<site>.pages.dev/` or the custom domain once connected). URL prefix is enough for this site; use Domain only if the owner prefers it.

### 8.2 Verify ownership — pick one method

**Option A — HTML file (easiest with this static site):**

1. In Search Console, choose the **HTML file** verification method and download the file (named like `googleXXXXXXXXXXXXXXXX.html` — the exact name comes from Search Console; do not invent one).
2. Place the downloaded file unchanged in `public/` (so it ships at the site root as `https://<domain>/googleXXXXXXXXXXXXXXXX.html`).
3. Rebuild, redeploy, confirm the file loads in a browser, then click **Verify** in Search Console.
4. Keep the file in `public/` permanently — removing it can un-verify the property.

**Option B — HTML meta tag:**

1. Choose the **HTML tag** method and copy the meta tag Search Console shows (it contains a unique `content` value — do not invent one).
2. Add the tag to the `<head>` of every page. For this site that means `src/components/Layout.astro` (the shared layout), not individual pages.
3. Rebuild, redeploy, confirm the tag is present in the served HTML, then click **Verify**.

**Option C — DNS TXT record:**

1. Choose the **DNS** method and copy the TXT record value Search Console shows.
2. Add a TXT record at the domain's DNS provider (Cloudflare DNS if the domain uses Cloudflare, otherwise the registrar's DNS):
   - Host/name: `@` (root) for a Domain property, or as Search Console instructs.
   - Type: `TXT`. Value: the exact string Search Console gave.
3. Wait for DNS propagation (usually minutes, up to 48 hours), then click **Verify**. This method needs no file or code change and survives redeploys, which is why it is the best choice if the owner controls the domain's DNS.

### 8.3 Submit the sitemap

1. After the first successful deploy and verification, go to **Sitemaps** in Search Console.
2. Enter `sitemap.xml` (URL-prefix property) or the full URL `https://<domain>/sitemap.xml` (Domain property) and click **Submit**.
3. The sitemap must list exactly the shipped pages — 39 URLs today. If Search Console reports a sitemap error, fix the sitemap (regenerated from the registry at build time) and resubmit; do not hand-edit `dist/sitemap.xml`.

### 8.4 What to check weekly in the first month

- **Pages / Coverage:** any page Search Console says is "not indexed" or errored. Fix crawl errors before adding new pages. Expect the 39 pages to appear gradually over the first 1–2 weeks, not all at once.
- **Performance:** impressions and clicks per query/page. Record the numbers only from Search Console; do not claim rankings or traffic from any other source.
- **Enhancements:** structured-data (FAQ, Breadcrumb) errors — the JSON-LD must keep matching visible content.
- **Core Web Vitals / Experience:** any URL flagged "Poor" — re-measure with Lighthouse on the live host if flagged.
- **Manual actions / Security issues:** must stay empty; any entry here is a launch blocker to report immediately.
- After the first month, switch to a monthly check unless a report shows a new error.

Bing Webmaster Tools is optional and uses the same sitemap (`https://<domain>/sitemap.xml`); it is not a launch blocker.

## 9. Rollback

- **Git integration:** in Cloudflare Pages, **Deployments** → select a previous successful deployment → **Rollback** (or re-deploy that commit). Alternatively, revert the offending commit on GitHub and push; the new build deploys automatically.
- **Manual:** rebuild from the tagged release commit (`git checkout <tag> && npm run build`) and re-upload `dist/`. Do **not** rely on a saved copy of `dist/` — it is gitignored and is not stored in the repo, so the tag is the only durable record of a deployed state.
- **If the bad deploy is a content/calculator error** (wrong numbers, broken page): fix the source, re-run the full test suite (Vitest + Playwright + typecheck) against a clean build, then deploy the fix. Do not hot-edit `dist/`.
- **If the bad deploy is a header/CSP problem** (pages load but calculators do not compute, or console errors about blocked inline scripts): the CSP in `public/_headers` keeps `'unsafe-inline'` because Astro inlines the island loader (see §11). Do not "fix" it by loosening the CSP further; revert the `_headers` change and redeploy.
- Keep the Git history clean so any deployed state can be reproduced from a commit. Tag every production release.

## 10. Post-Launch Checks (first deploy)

- [ ] All 25 calculator URLs return HTTP 200 on the live domain.
- [ ] Home page, all 6 category pages, and My Project return HTTP 200.
- [ ] Sitemap submitted to Search Console (§8.3).
- [ ] Home page, one calculator page, and My Project smoke-tested live.
- [ ] No console errors on calculator pages.
- [ ] `robots.txt` and `sitemap.xml` reachable.
- [ ] Response headers on the live home page include the five headers from `public/_headers` (check in browser devtools → Network; the local preview server does not apply `_headers`).
- [ ] Lighthouse re-run on the live host (Home, Paint, Concrete) — record the scores in `docs/QA-REPORT.md`; expect SEO to rise above 83 once canonicals and the robots.txt sitemap URL are absolute (§6).
- [ ] `ads.txt` is **absent** at `https://<domain>/ads.txt` (404) while AdSense is disabled — a file there with a placeholder ID would be a defect.

## 11. Security Headers (added in Phase 5, verified in Phase 6)

Cloudflare Pages applies the `public/_headers` file in the repository to
every response. The file (committed in Phase 5) sets:

| Header | Value | Why |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Stops browsers MIME-sniffing responses into executable content. |
| `X-Frame-Options` | `DENY` | The site must never be framed (clickjacking defense). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full URLs are not leaked to other origins. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | The site uses none of these capabilities. |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` | No external script, font, image, or frame source is allowed. |

**Verified in Phase 6:** the file is valid Cloudflare Pages `_headers`
format — a `/*` path rule followed by indented `Header: value` lines, with
the explanatory comments above it — and the clean production build copies
it to `dist/_headers` (900 bytes), which is what Cloudflare Pages reads.
`astro preview` does **not** apply `_headers` locally, so the headers
cannot be verified from the local smoke test; the live check in §10 is
required after the first deploy.

**Honest limitation:** the CSP keeps `'unsafe-inline'` for scripts and
styles because Astro inlines the island loader script (and the React
runtime snippet) and component styles at build time — 26 pages in `dist/`
carry an inline `<style>` tag and every calculator page carries inline
`<script>` tags for hydration. Removing `'unsafe-inline'` would break
calculator hydration, so it stays until the build can emit those assets
as external files. The policy still blocks every external source, which
is the part that matters for this site: there is no third-party script,
font, or frame to load.

Verify after the first deploy (Phase 6): open the live home page, check
the response headers in the browser devtools Network tab, and confirm
every calculator still computes (a CSP that blocks an inline script
would show as a console error and a dead calculator).

## 12. AdSense Enablement Checklist (disabled by default — ADR-8)

AdSense is **disabled** and must stay disabled until **all** of the
following are done, in order. No single step enables ads on its own.

1. **Owner decision, recorded as a new ADR** in `docs/DECISIONS.md` (superseding the disabled-by-default part of ADR-8), stating the decision, the date, and the placements approved.
2. **Consent management.** Before any ad script loads, the site needs a consent mechanism that satisfies Google's EU User Consent Policy and, for visitors in the EEA/UK, GDPR/UK GDPR: a consent banner/choice (e.g. Google's Funding Choices, or another CMP that integrates with AdSense) that records consent before personalized ads are served, and serves non-personalized ads (or no ads) when consent is refused. The US is the primary market, but the secondary markets include the UK, so consent cannot be skipped. No consent tool is installed today; choosing one is part of the enablement work, not a Phase 6 task.
3. **Privacy Policy update.** `src/pages/privacy-policy.astro` §5 currently says no advertising scripts are loaded and AdSense is disabled. Before ads go live, update it to disclose: Google AdSense, the use of cookies / advertising identifiers, personalized vs non-personalized ads, the consent choice, and how to opt out (Google's Ad Settings / `https://adssettings.google.com`). Update the "Last updated" date and post the new policy **before** the change takes effect (the current policy §8 already promises this).
4. **Publisher and slot IDs.** Set the real IDs from the owner's AdSense account in the Cloudflare Pages environment variables `PUBLIC_ADSENSE_PUBLISHER_ID` and `PUBLIC_ADSENSE_SLOT_*` (see `src/lib/ads.ts`), or edit the defaults in that file. Never commit a real ID to the repository. The current defaults are `ca-pub-XXXXXXXXXXXXXXXX` and `XXXXXXXXXX` — obvious placeholders, rejected by AdSense if ever used.
5. **Enable the switch.** Set `ADS_ENABLED = true` in `src/lib/ads.ts` and update `src/lib/ads.test.ts`, which currently asserts ads are disabled and all IDs are placeholders — the test must be changed deliberately as part of the enablement, never weakened silently.
6. **AdSense script + CSP.** Add the AdSense loader script (`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`) to the shared layout and extend the CSP in `public/_headers` to allow it (`script-src` must add `https://pagead2.googlesyndication.com`, `img-src`/`connect-src` must add the AdSense domains AdSense actually uses — confirm against Google's current documentation at the time; do not guess the list). Re-verify that calculators still compute after the CSP change.
7. **ads.txt.** Copy `docs/ads.txt.template` to `public/ads.txt` with the real publisher ID (§7) and confirm it is reachable at `https://<domain>/ads.txt`.
8. **Performance re-check.** Re-run Lighthouse on Home, Paint, and Concrete after enabling ads and record the scores in `docs/QA-REPORT.md`. Ads cost performance; if a calculator page drops below the ≥ 90 performance target, that is a launch issue to fix or to report to the owner before keeping ads on.
9. **Verification.** After deploy, confirm in the browser: the ad slot renders, no console errors appear on calculator pages, and the privacy policy page shows the updated text.

## 13. Deployment Status (Phase 6, 2026-11-20)

**Prepared in Phase 6 (done, verified locally):**

- Clean production build verified: 39 pages, `sitemap.xml` with 39 URLs, `robots.txt`, `public/_headers` copied to `dist/_headers`, `favicon.svg`, `og-image.svg` (see `docs/QA-REPORT.md` §11).
- Full test suites re-run against the clean build: Vitest 204/204 (31 files, including 3 new ads-guard tests), Playwright 68/68 (desktop + mobile), typecheck 0 errors / 0 warnings / 0 hints.
- Final smoke test against the local production build: 25/25 calculator URLs return 200 with zero console errors; home, calculators index, My Project, and all 6 category pages also 200 with zero console errors.
- Deployment documentation completed: Git integration path (§3), manual deploy path with exact Wrangler commands (§4), build settings including Node 24 (§1, §3), `_headers` verified and documented (§11), rollback procedure (§9), Search Console verification instructions for all three methods (§8), AdSense scaffolding with config, guard tests, and template (§7, §12).
- AdSense verified disabled: `AdSlot` renders nothing (and is now wired into the shared layout, so the slot exists but is empty), no ad/analytics scripts ship in `dist/`, publisher/slot IDs are placeholders (`ca-pub-XXXXXXXXXXXXXXXX`, `XXXXXXXXXX`) in the single config `src/lib/ads.ts`.
- GitHub repository — done: https://github.com/silver-comet-76/homediycalc exists (main at merge commit `e8345f7e`, PR #2 merged 2026-11-22).

**Still needs owner approval (not done, not attempted):**

- Public deployment to Cloudflare Pages (no account, no Pages project, no deploy run).
- Domain: none purchased, none connected; canonicals and the robots.txt sitemap URL stay relative until one exists.
- AdSense: stays disabled (ADR-8). Enabling needs the owner decision and the full §12 checklist.
- Search Console: nothing submitted (no domain, no live site).
- Project license: still undecided (`package.json` has no license field; `"private": true`).

ADR-9 passed on 2026-11-20 at commit ca29ba1 (3 consecutive clean full test rounds — see `docs/QA-REPORT.md` §12); the release gate is met. Still outstanding: public deployment, domain, and the owner decisions in §13.

## 14. Phase 8 — Controlled Staging and Pre-Public-Launch Readiness (2026-11-22, Issue #3)

### 14.1 Merged baseline

- PR #2 merged into `main` on 2026-11-22 (merge commit `e8345f7e0cb04051767955968bd8ef0efabd65e9`; reviewed head `f4d2f3e1`, approval review 6011576970). Phase 8 works on branch `phase-8-launch` from that content. See `docs/QA-REPORT.md` §13.6 for the merge record; the post-merge read-back from GitHub is pending a retapped approval card.
- Baseline at merge: 25 calculators, Vitest 282/282 (298 after the Phase 8 Brick partial-cost fix), Playwright 76/76, 40 pages (39 indexable + 404), Lighthouse Home + Paint 100/100/100/83.

### 14.2 Cloudflare Pages project settings (to apply when the project is created)

No Cloudflare account or Pages project exists yet — nothing here has been created. When the owner creates the project (dashboard: **Workers & Pages → Create → Pages → Connect to Git**), use exactly these settings:

| Setting | Value |
|---|---|
| Repository | `silver-comet-76/homediycalc` |
| Production branch | `main` |
| Framework preset | Astro (or "None" with the commands below) |
| Build command | `npm run build` |
| Build output directory | `dist/` |
| Root directory | `/` (repository root) |
| Node version | `NODE_VERSION=24` (see §1) |
| Environment variables | See §14.3 — production and preview environments differ |

### 14.3 Environment variables — production vs preview

| Variable | Production environment | Preview environments | Why |
|---|---|---|---|
| `NODE_VERSION` | `24` | `24` | Build image Node version (§1). |
| `PUBLIC_SITE_URL` | The live origin, e.g. `https://homediycalc.pages.dev` (the exact value Cloudflare assigns; or the custom domain once connected) | **Unset** | Canonical, sitemap, and robots URLs become absolute only in production (ADR-14). A preview must never claim the production origin, or search engines would see duplicate content across hosts. |
| `PUBLIC_PREVIEW` | **Unset** | `true` | Preview builds carry `<meta name="robots" content="noindex, nofollow">` on every page (ADR-14). Production builds never carry it — the release-gate audit fails any build that does. |

Never set `PUBLIC_SITE_URL` to a guessed hostname. The value comes from the Pages project Cloudflare actually creates; until then it stays unset and every URL stays relative.

### 14.4 Controlled staging — Cloudflare Access (real restriction; noindex is not one)

A `noindex` meta tag tells search engines not to list a page — it does not stop anyone from opening it. Staging must be access-restricted, not merely unindexed. The mechanism is **Cloudflare Access** (Cloudflare Zero Trust, free tier includes Access for up to 50 users — no paid plan needed for this):

1. In the Cloudflare dashboard, open **Zero Trust → Access → Applications → Add an application**.
2. Application type: **Self-hosted**. Application domain: the preview deployment hostname (e.g. `<branch>.homediycalc.pages.dev` — the exact hostname Cloudflare assigns to the preview deployment).
3. Policy: **Allow**, rule: **Emails** — the owner's email address only. (One email is enough for a staging check; add reviewers the same way if needed.)
4. Session duration: 24 hours is enough for a staging review.
5. Save. Open the preview URL in a private browser window: it must show the Cloudflare Access login before any site content. Sign in with the allowed email and confirm the site loads.
6. When staging is done, delete or disable the application, or leave it in place so every future preview of that hostname stays restricted — do not leave a preview hostname both unrestricted and indexed.

If Cloudflare Access cannot be configured (e.g. the account lacks Zero Trust access), the fallback is **no external staging at all**: verify against the local production preview only (`npm run build && npm run preview`, see §14.5) and treat the first public deploy as the staging check, with the rollback in §9 ready. Never treat "the preview URL is obscure" as access control.

### 14.5 Staging procedure (default: local production preview)

Until the owner authorizes an external deployment, staging means the local production preview:

1. `rm -rf dist/ && npm run build` — clean build, 40 pages, no errors.
2. `npm run preview` — serves the production build at `http://localhost:4321`.
3. Smoke-check: home page, all 6 category pages, My Project, and at least one calculator per category load with zero console errors; one calculation returns a result; the shopping-list copy and Add to Project work.
4. `curl -s http://localhost:4321/robots.txt` shows `Sitemap: /sitemap.xml` (relative — no origin is set locally, by design) and `curl -s http://localhost:4321/sitemap.xml` lists 39 URLs.
5. Confirm no page carries a noindex meta tag in a production build: `grep -r "noindex" dist/ --include="*.html"` must return nothing (the gate audit checks this too).

External staging (only after owner approval): create the Pages project (§14.2), set the preview environment variables (§14.3), push the `phase-8-launch` branch so Cloudflare builds a preview deployment, restrict it with Access (§14.4), then run the same smoke checks plus the live header check (§14.6) against the preview URL.

### 14.6 Security headers — live check (pending; no staging exists yet)

The `public/_headers` file is committed and copied to `dist/_headers` by the build, but `astro preview` does not apply it, so the headers cannot be verified locally. After the first external deployment (staging or production), run:

```bash
curl -sI https://<live-host>/ | grep -iE "x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy"
```

Expected on every response: `nosniff`, `DENY`, `strict-origin-when-cross-origin`, `camera=(), microphone=(), geolocation=(), payment=()`, and the CSP from §11. If any header is missing, the `_headers` file is not being applied — do not work around it by loosening the CSP; check the Pages project configuration instead. Record the result in `docs/QA-REPORT.md` (live evidence, dated) — until then this check is **pending**, not passed.

### 14.7 Search Console — verification and sitemap submission

Full steps are in §8 (all three verification methods + sitemap submission + the weekly checks for the first month). Phase 8 additions:

- The property to add is the production origin once it exists (URL-prefix property with the exact `*.pages.dev` URL, or the custom domain later). Do not add a property for a preview hostname.
- Submit `sitemap.xml` only after the first production deploy and verification. The sitemap then lists 39 absolute URLs (ADR-14).
- Do not submit indexing requests for individual pages and do not request AdSense review — neither is authorized.

### 14.8 WebKit / Safari — blocker and independent device test procedure

**Status: blocked in this environment (2026-11-22).** The Playwright WebKit browser binary is installed (`webkit-2388` in the Playwright cache) but it cannot launch: the host is missing system libraries (`libgtk-4-1`, `libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `libgstreamer-gl1.0-0`, `libgstreamer-plugins-bad1.0-0`, `libgraphene-1.0-0`, `libevent-2.1-7t64`, `libavif16`, `libmanette-0.2-0`, `libenchant-2-2`, `libsecret-1-0`, `libgles2`). Installing them needs `npx playwright install-deps webkit` (a privileged `apt-get` install); its approval card timed out on 2026-11-22 and the install did not run. Retrying it needs the owner's approval tap — the command is `npx playwright install-deps webkit` followed by `npx playwright test --project=webkit` against a temporary `webkit` project (Desktop Safari device) on `tests/home.spec.ts` and `tests/calculators.spec.ts`. Do not add WebKit to the permanent gate config until it launches reliably.

**Independent device test procedure (owner or reviewer, on a real Apple device):**

1. Open the staging or production URL in Safari on an iPhone (iOS Safari) and in Safari on a Mac (macOS Safari). Do not use a simulator for the final check.
2. On each device: load the home page; open one calculator (Brick); change a value and confirm the result updates; tap Reset and confirm the defaults return; copy the shopping list and confirm it pastes; open My Project, save the calculation, and confirm it appears.
3. Check layout at the phone width: no horizontal scrolling, no clipped buttons, the unit toggle and results readable without zooming.
4. Check the footer links (Privacy Policy, Terms of Use, Disclaimer, Contact) all open.
5. Record the device + Safari version + pass/fail per step in `docs/QA-REPORT.md`. A failure on a real device is a launch blocker to report; a pass here does not replace the automated WebKit run once the host libraries are installed.

### 14.9 Launch and rollback (Phase 8 additions to §9/§10)

- **Before any public deploy:** the Phase 8 PR must be reviewed (ChatGPT) and merged by the owner; the ADR-9 gate must have passed 3 consecutive clean rounds after the final fix; the tag `homediycalc-v0.2.0` (or the version the owner chooses) must be created on the merged commit.
- **Launch sequence:** merge Phase 8 PR → create the Pages project (§14.2) → set production env vars (§14.3) → first production deploy → run the §10 post-launch checks → verify headers (§14.6) → re-run Lighthouse on Home, Paint, Concrete and record the scores (expect SEO above 83 once the origin is set) → verify Search Console (§14.7) → submit the sitemap.
- **Rollback:** as §9 (Pages rollback to the previous deployment, or revert the commit and push). If the bad deploy is a content/calculator error, fix the source, re-run the full gate, then deploy the fix. Do not hot-edit `dist/`.
- **Duplicate-content guard:** production is the only host with `PUBLIC_SITE_URL` set and the only host without a noindex tag. Every other host (previews, forks, mirrors) either has `PUBLIC_PREVIEW=true` or serves relative URLs — so no second host can present itself as the canonical site.

### 14.10 Owner decisions still pending (no action taken unilaterally)

| Decision | Status | What the owner must do |
|---|---|---|
| Production origin / domain | Open | Create the Cloudflare account + Pages project (§14.2) or supply an existing domain; the `PUBLIC_SITE_URL` value comes from that project. No domain purchased, no host invented. |
| Project license | Open | Choose: keep the project private / all rights reserved (current state — `package.json` has no license field and `"private": true`), or pick a license (e.g. MIT). The choice is recorded as a new ADR; nothing is chosen here. |
| Contact route | Open | The Contact page honestly says there is no contact form or email yet and that a route will be set up before launch. Supply an email or a form endpoint, or approve revised wording. No address is invented. |
| Governing law (Terms of Use) | Open | The Terms name no jurisdiction. The owner (or their counsel) picks one; none is asserted here. |
| Operator identity | Open | The legal pages speak as "HomeDIYCalc" with no personal or company name — no identity is invented. If the owner wants a named operator (person or company), supply it and the pages will be updated. |
| Public deployment | Open | Separate approval required (§13). Nothing is deployed in Phase 8. |
| AdSense / analytics | Disabled (ADR-8) | Stays disabled. Enabling needs the owner decision + the full §12 checklist. No indexing requests, no AdSense applications. |
| Merge of the Phase 8 PR | Open | Requires ChatGPT review + owner approval. Phase 8 opens a PR; it does not merge it. |
| Issue #1 / Issue #3 closure | Open | Neither issue closes in Phase 8. Issue #1 closes only after reviewer sign-off + owner approval; Issue #3 closes only after the launch it tracks is complete. |
