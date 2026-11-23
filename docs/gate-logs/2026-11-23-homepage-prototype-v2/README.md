# Gate logs — Homepage Visual Prototype V2 (Direction A: Modern DIY)

ADR-9 gate, 3 consecutive clean rounds, run on GitHub Actions
(run 45140987501, "ADR-9 Gate (Prototype V2)", head c9261c3),
2026-11-23. The local VM's filesystem intermittently refuses the
writes the Astro build needs (EPERM on the generated-types write),
so the final gate ran on a clean GitHub-hosted runner instead of
locally. Each round: Vitest 328/328, Playwright 94/94, Lighthouse
Home 100/100/100/100 and Paint 100/100/100/100, audit ALL CHECKS
PASSED, negative builds 5/5 + positive branch check.

See `docs/prototype/homepage-modern-diy/README.md` for the V2
summary. The same logs are also in the run's `gate-logs-v2`
artifact (30-day retention).
