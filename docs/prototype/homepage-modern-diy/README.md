# Homepage Visual Prototype — Direction A: Modern DIY

Prototype only. Do not merge or deploy. This is a homepage-only visual
redesign for review; the navigation, footer, calculator pages, legal
pages, formulas, and My Project behavior are unchanged.

## What changed (homepage `/` only)

- **Hero** — replaced the dark, centered hero with a bright two-column
  hero (warm orange panel): headline, value proposition, two CTAs, three
  trust points, and a decorative example-result card on the right.
- **Project types** — the category list is now "What Are You Working On?",
  with an icon on each of the 6 category cards and a short description.
- **Featured calculators** — replaced the 10-item "Most popular" list
  with 4 product-like cards (Paint, Concrete, Tile, Gravel), each with a
  purpose line and a "You get" line, plus a path to all 25 calculators.
  No popularity ranking is claimed (there is no usage data).
- **How it works** — the 3 steps are now a connected flow ("From
  Measurements to Materials in 3 Easy Steps") with numbered circles.
- **Benefits** — new section, "Practical Tools. No Extra Hassle.", with
  4 value cards (free/no signup, private by design, imperial + metric,
  store-ready results).
- **Featured demo** — new "Painting a Room?" block showing the Paint
  Calculator's own default example as an illustrative example (see
  below).
- **FAQ** — same 5 questions and answers, same structured-data behavior
  (the FAQs are still passed to the layout for JSON-LD).
- **Closing CTA** — new orange banner ("Ready to Get Your Project
  Started?") with "Explore Free Calculators" and "Open My Project".
- **Copy** — approved V1 copy throughout (see the PR description).
  Headings, CTAs, and trust points use the approved wording verbatim.

## Copy-change rationale (short)

The old homepage read like a directory: a dark hero, a flat category
list, and a 10-item "Most popular" list whose ranking had no usage data
behind it. The new copy is action-oriented and practical: it leads with
the outcome ("Less Guesswork. Better DIY Projects."), frames categories
as the job the user is doing ("What Are You Working On?"), and replaces
the unsupported popularity ranking with a small featured set ("Your
Next Project Starts Here"). The Paint demo makes the value concrete by
showing a real, verified example instead of describing it. Nothing is
promised that the site cannot do: no claim that every project avoids
waste, shortages, or extra store trips, and no guaranteed quantities —
the demo is labelled an illustrative example.

## The Paint demo — verified numbers

The demo uses only the Paint Calculator's own default inputs and its
real output. Room mode defaults: 12 × 15 ft room, 8 ft ceilings,
1 door, 2 windows, 2 coats, coverage 350 ft²/gal, 10% waste.

- Net wall area: 2 × (12 + 15) × 8 − 21 − 30 = **381 ft²**
- Paint needed: 381 × 2 ÷ 350 = **2.18 gal**
- With 10% waste: 2.18 × 1.10 = **2.39 gal**
- Buy: **3 gal (11.36 L)**, rounded up to whole gallons

These match the calculator's own output rows ("Paintable area 381 ft²",
"Paint needed 2.18 gal", "Gallons to buy 3 gal"). The demo and the hero
card both label the numbers an example, not a promise for every room.

## Before / after

Screenshots are full-page captures of the local production build
(local mode, test origin), desktop 1280×800 and mobile 390×844.

| | Before (main) | After (this prototype) |
|---|---|---|
| Desktop | `before-desktop.png` | `after-desktop.png` |
| Mobile | `before-mobile.png` | `after-mobile.png` |

Before: dark slate hero, centered text, no visual; flat category cards
with long descriptions; a 10-item "Most popular" list; plain numbered
"How it works"; no benefits section, no demo, no closing CTA.
After: bright warm hero with a two-column layout and an example result
card; icon category cards; 4 featured product-like cards; a 3-step
flow; a benefits row; a concrete Paint demo with real numbers; a
closing CTA banner. Navigation, footer, and all other pages are
identical.

## Visual / technical notes

- Bright, warm, lightweight: the existing brand orange and warm tints,
  white cards, inline SVG icons only. No external images, no external
  APIs, no new dependencies, no analytics, no ads, no backend.
- All calculator names, URLs, and counts come from the registry
  (`src/lib/registry.ts`); the 4 featured calculators are resolved by
  slug. Category names and destination URLs are unchanged.
- Responsive: hero stacks on mobile (content first, example card below);
  grids collapse to one column; the demo's result row uses a smaller
  value size on mobile so "3 gal (11.36 L)" does not wrap awkwardly.
- Accessibility: semantic headings (single H1, section H2s), the hero
  example card is `aria-hidden` (decorative — the same numbers appear
  as accessible text in the demo section), icons are `aria-hidden`,
  focus-visible rings are untouched, and the featured cards keep the
  `.card` class so the styles guard (card-title links ≥ 24 px) still
  covers them.
- SEO: title, description, and canonical are unchanged; the FAQ
  structured data is unchanged (same FAQs passed to the layout).

## Verification — ADR-9 gate (3 consecutive clean rounds)

Run locally in this worktree (the local filesystem had recovered from
the earlier EPERM fault), 2026-11-23. Each round: production-mode
build (test origin https://example.com), Vitest, typecheck, Prettier,
scripted audit, Playwright (desktop + mobile), Lighthouse Home + Paint,
preview/local builds, and the ADR-17 negative builds.

| Round | Result |
|---|---|
| 1 | PASSED (final attempt; see note) |
| 2 | PASSED |
| 3 | PASSED |

Each round: Vitest 328/328 (41 files), typecheck 0 errors (129 files),
Prettier clean, audit ALL CHECKS PASSED, Playwright 92/92, Lighthouse
Home 100/100/100/100, Paint 100/100/100/100, negative builds 5/5 +
positive branch check. Full logs:
`docs/gate-logs/2026-11-23-homepage-prototype/round-1.log`,
`round-2.log`, `round-3.log`.

Note on round 1: the round-1 log contains two earlier failed attempts
before the final passing attempt. The first failed because a stale
`astro preview` server from the screenshot runs was still listening on
port 4321, so Playwright reused it and tested the old build (a test
harness issue, not a code defect). The second failed the styles guard:
the redesign had dropped the `.card` class from the featured cards, so
the card-title-link check found no links; the fix keeps the `.card`
class on the featured cards (the `rounded-2xl` utility still applies).
Both issues were fixed and the final round-1 attempt passed; rounds 2
and 3 then passed on the first attempt each.

## Files changed

- `src/pages/index.astro` — the homepage redesign (only file with
  visual/copy changes).
- `tests/home.spec.ts` — updated the homepage heading assertions to the
  approved V1 copy and added assertions for the new sections, the hero
  CTAs, and the demo numbers.
- `docs/prototype/homepage-modern-diy/` — this note + the 4 screenshots.
- `docs/gate-logs/2026-11-23-homepage-prototype/` — the 3 gate logs.

No other files changed. No deployment was performed. Staging and
production are untouched. This branch is based on main and does not
touch the PR #7 release branch (`phase-9-privacy-production-status`);
the two PRs are independent.
