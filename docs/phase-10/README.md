# Phase 10 — Integration candidate (PR #7 + PR #8)

## Production artifact manifest

`production-manifest.sha256` is the path-inclusive SHA-256 manifest
of the production artifact built from the integration branch head
`8f6b1e2` (GitHub Actions run 45145984363,
"Production artifact (audited, not deployed)" job).

- Build: `PUBLIC_BUILD_MODE=production`
  `PUBLIC_SITE_URL=https://homediycalc.pages.dev`
- Audit: `python3 scripts/gate-audit.py --mode production --origin
  https://homediycalc.pages.dev dist/` — ALL CHECKS PASSED.
- 51 files. Top digest (sha256 of this manifest):
  `b23c36a980c07c6ed3fafb7bb62c1dda5e994305bc83dff4646ef9243fed073a`
- Verified: sitemap uses the production origin (39 URLs); robots.txt
  allows all and lists the production sitemap; no `noindex` in any
  production HTML; homepage canonical is
  `https://homediycalc.pages.dev/`; the Modern DIY homepage (V2) and
  the production-live Privacy Policy §6 sentence are present; all 40
  HTML routes are present (25 calculators, 6 categories, legal pages,
  My Project, About, Contact, 404).
- The manifest is path-inclusive (sha256 + relative path per file),
  per the PR #7 review's note that a filename-omitting digest is
  weaker provenance. Verify it with (from inside `dist/`):
  `sha256sum -c ../production-manifest.sha256` — all 51 files OK.

The artifact was NOT deployed. It is a candidate for review only.
Do NOT merge or deploy without explicit owner authorization.
