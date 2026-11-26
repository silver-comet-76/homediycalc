#!/usr/bin/env node
/**
 * QA-17B1-UI-07: compare the baseline and candidate regression JSONs and
 * emit a per-calculator, per-scenario matrix (markdown). Usage:
 *   node scripts/compare-regression.mjs <baseline.json> <candidate.json> <matrix.md>
 * Exits non-zero when any compared scenario differs.
 *
 * What is compared exactly (functional values, not UI styling):
 *   default / imperial / metric / mode-<id> / cost — result rows + full text
 *   roundtrip — preserved flag, rowsMatchImperial, and the converted values
 *   invalid — error text and the absence of a result
 *   reset — restored value and rows matching the default
 * The hero row is compared with intent, not byte-equality: the baseline
 * has no hero promotion (hero null); the candidate's hero must be the
 * config heroResultLabel when that row exists in the mode, otherwise the
 * first row (the documented safe fallback, e.g. Mortar / Waterproofing
 * alternate modes).
 */
import { readFileSync, writeFileSync } from "node:fs";

const [baselinePath, candidatePath, matrixPath] = process.argv.slice(2);
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));

/** Config heroResultLabel per calculator (Stage 2, verified against each calculator's own default-mode compute). */
const HERO_LABEL = {
  "concrete-calculator": "Ready-mix to order",
  "square-footage-calculator": "Area",
  "paint-calculator": "Gallons to buy",
  "gravel-calculator": "Cubic yards to order",
  "mulch-calculator": "Bags to buy",
  "concrete-slab-calculator": "Ready-mix to order",
  "cubic-yard-calculator": "Cubic yards",
  "cubic-feet-calculator": "Cubic feet",
  "tile-calculator": "Boxes needed",
  "brick-calculator": "Bricks needed",
  "drywall-calculator": "Drywall sheets",
  "concrete-bags-calculator": "80 lb bags",
  "flooring-calculator": "Boxes needed",
  "paver-calculator": "Pavers needed",
  "topsoil-calculator": "Bulk to order",
  "grout-calculator": "Bags needed",
  "board-foot-calculator": "Total board feet",
  "mortar-calculator": "Pre-mixed mortar",
  "ceiling-tile-calculator": "Cartons to buy",
  "tile-adhesive-calculator": "Bags to buy",
  "primer-calculator": "Gallons to buy",
  "wallpaper-calculator": "Rolls to buy",
  "sealant-calculator": "Tubes to buy",
  "waterproofing-calculator": "Containers to buy",
  "baseboard-calculator": "Pieces to buy",
  "stair-calculator": "Risers",
};

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Expected candidate hero for a result set: the config label if that row exists, else the first row. */
function expectedHero(slug, result) {
  if (!result || !result.rows || result.rows.length === 0) return null;
  const label = HERO_LABEL[slug];
  if (result.rows.some((r) => r.label === label)) return label;
  return result.rows[0].label;
}

const scenarios = ["default", "imperial", "metric", "roundtrip", "invalid", "reset", "cost"];
const lines = [];
lines.push("# QA-17B1-UI-07 — Baseline-vs-Candidate Functional Regression Matrix");
lines.push("");
lines.push(`Baseline: ${baseline.head} (${baseline.label})`);
lines.push(`Candidate: ${candidate.head} (${candidate.label})`);
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Result values, secondary outputs, error text, reset behaviour and unit");
lines.push("round-trip are compared exactly. The hero row is compared with intent:");
lines.push("the baseline has no hero promotion (hero null); the candidate hero must");
lines.push("be the config heroResultLabel when that row exists, otherwise the first");
lines.push("row (the documented safe fallback).");
lines.push("");

let failures = 0;
let passes = 0;
let nas = 0;

for (const slug of Object.keys(baseline.calculators).sort()) {
  const b = baseline.calculators[slug];
  const c = candidate.calculators[slug];
  lines.push(`## ${slug}`);
  lines.push("");
  lines.push("| Scenario | Result | Detail |");
  lines.push("| --- | --- | --- |");
  const row = (name, result, detail) => {
    if (result === "PASS") passes++;
    else if (result === "N/A") nas++;
    else failures++;
    lines.push(`| ${name} | ${result} | ${detail} |`);
  };

  // Result-value scenarios: exact comparison of rows + full text.
  for (const name of ["default", "imperial", "metric"]) {
    if (!b[name] || !c[name]) {
      row(name, "FAIL", "missing scenario data");
      continue;
    }
    const sameRows = deepEqual(b[name].rows, c[name].rows);
    const sameText = b[name].fullText === c[name].fullText;
    row(
      name,
      sameRows && sameText ? "PASS" : "FAIL",
      sameRows && sameText
        ? `${b[name].rows.length} rows identical`
        : `rows equal: ${sameRows}, full text equal: ${sameText}`,
    );
  }

  // Hero (default + each mode): intent comparison.
  const heroChecks = [];
  const bHero = b.default?.hero ?? null;
  const cHero = c.default?.hero ?? null;
  const expHero = expectedHero(slug, c.default);
  heroChecks.push(
    bHero === null && cHero === expHero
      ? `default hero ${cHero}`
      : `default hero: baseline ${bHero}, candidate ${cHero}, expected ${expHero}`,
  );
  const heroOk = bHero === null && cHero === expHero;
  const bModes = b.modes ?? {};
  const cModes = c.modes ?? {};
  let modesHeroOk = true;
  for (const modeId of Object.keys(cModes)) {
    if (modeId === "na") continue;
    const cm = cModes[modeId];
    const exp = expectedHero(slug, cm);
    if (cm.hero !== exp) {
      modesHeroOk = false;
      heroChecks.push(`mode ${modeId} hero ${cm.hero}, expected ${exp}`);
    }
  }
  if (
    deepEqual(bModes, cModes) === false &&
    Object.keys(cModes).length > 0 &&
    cModes.na === undefined
  ) {
    // Modes are compared on values below; hero is checked separately here.
  }
  row("hero (default + modes)", heroOk && modesHeroOk ? "PASS" : "FAIL", heroChecks.join("; "));

  // Alternate modes: exact result comparison.
  if (cModes.na) {
    row("alternate modes", "N/A", cModes.na.na);
  } else {
    const modeIds = Object.keys(cModes);
    let allOk = true;
    const details = [];
    for (const modeId of modeIds) {
      const ok =
        deepEqual(bModes[modeId]?.rows, cModes[modeId]?.rows) &&
        bModes[modeId]?.fullText === cModes[modeId]?.fullText;
      if (!ok) {
        allOk = false;
        details.push(`${modeId} differs`);
      } else details.push(`${modeId} identical`);
    }
    row("alternate modes", allOk ? "PASS" : "FAIL", details.join("; "));
  }

  // Round-trip.
  if (b.roundtrip && c.roundtrip) {
    const ok = deepEqual(b.roundtrip, c.roundtrip);
    row(
      "unit round-trip",
      ok ? "PASS" : "FAIL",
      ok
        ? `preserved=${c.roundtrip.preserved}, rows match=${c.roundtrip.rowsMatchImperial}`
        : `baseline ${JSON.stringify(b.roundtrip)} vs candidate ${JSON.stringify(c.roundtrip)}`,
    );
  } else row("unit round-trip", "FAIL", "missing scenario data");

  // Invalid input.
  if (b.invalid && c.invalid) {
    const ok = deepEqual(b.invalid, c.invalid);
    row(
      "invalid input",
      ok ? "PASS" : "FAIL",
      ok
        ? `error "${c.invalid.error}", no result`
        : `baseline ${JSON.stringify(b.invalid)} vs candidate ${JSON.stringify(c.invalid)}`,
    );
  } else row("invalid input", "FAIL", "missing scenario data");

  // Reset.
  if (b.reset && c.reset) {
    const ok = deepEqual(b.reset, c.reset);
    row(
      "reset",
      ok ? "PASS" : "FAIL",
      ok
        ? "defaults restored, rows match default"
        : `baseline ${JSON.stringify(b.reset)} vs candidate ${JSON.stringify(c.reset)}`,
    );
  } else row("reset", "FAIL", "missing scenario data");

  // Cost.
  if (c.cost?.na && b.cost?.na) {
    row("cost", "N/A", c.cost.na);
  } else if (b.cost && c.cost) {
    const ok = deepEqual(b.cost.rows, c.cost.rows) && b.cost.fullText === c.cost.fullText;
    row(
      "cost",
      ok ? "PASS" : "FAIL",
      ok ? `${c.cost.rows.length} rows identical at $10` : "cost rows differ",
    );
  } else row("cost", "FAIL", "missing scenario data");

  lines.push("");
}

lines.push("---");
lines.push("");
lines.push(`Totals: ${passes} PASS, ${failures} FAIL, ${nas} N/A.`);
lines.push("");
writeFileSync(matrixPath, lines.join("\n"));
console.log(`Matrix written to ${matrixPath}: ${passes} PASS, ${failures} FAIL, ${nas} N/A.`);
if (failures > 0) process.exit(1);
