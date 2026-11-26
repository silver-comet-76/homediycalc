/**
 * Stage 1 UI measurement — before/after comparison for Direction C+.
 * Dev/CI utility (not shipped to the site).
 *
 * Usage: node scripts/measure-ui-stage1.mjs <worktreeDir> <port> <outDir> [label]
 * Serves the worktree's dist/ with `astro preview`, and for each of the
 * three Stage 1 pages (Paint, Tile Adhesive, Stair) at 320 / 390 / 768 /
 * 1280 px widths measures:
 *   - default document height and fully-expanded height (all <details> open)
 *   - distance from the page top to the calculator and to the result panel
 *   - horizontal overflow (scrollWidth vs innerWidth)
 *   - visible word count (innerText of <main>; collapsed <details> content
 *     is excluded) vs total word count (textContent)
 *   - result rows + worked line in the default state
 *   - Tile Adhesive 5%-waste scenario outputs (owner-corrected figures)
 * Takes full-page screenshots (default + expanded) and writes
 * measurements.json to outDir. Requires the site to be built first
 * (e.g. `npm run build` with PUBLIC_BUILD_MODE=local).
 *
 * Note: `astro preview` can leave an orphan server behind on SIGTERM;
 * the caller should kill any leftover `astro preview` process after
 * this script exits.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const [worktreeDir, portStr, outDir, label = "run"] = process.argv.slice(2);
const port = Number(portStr);
const base = `http://127.0.0.1:${port}`;

const PAGES = [
  ["paint-calculator", "/calculators/paint-calculator/"],
  ["tile-adhesive-calculator", "/calculators/tile-adhesive-calculator/"],
  ["stair-calculator", "/calculators/stair-calculator/"],
];
const WIDTHS = [320, 390, 768, 1280];

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve(true);
      } catch {
        /* not up yet */
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`server ${url} did not start`));
      setTimeout(tick, 500);
    };
    tick();
  });
}

async function measureState(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    const calc = document.querySelector('section[aria-label="Calculator"]');
    const result = document.querySelector('section[aria-label="Results"]');
    const visibleWords = (main?.innerText ?? "").trim().split(/\s+/).filter(Boolean).length;
    const totalWords = (main?.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
    const resultText = result ? result.innerText : null;
    const workedLine = (() => {
      const el = [...document.querySelectorAll("p")].find((p) =>
        p.textContent?.startsWith("Your calculation:"),
      );
      return el ? el.innerText : null;
    })();
    return {
      height: document.documentElement.scrollHeight,
      calculatorTop: calc ? Math.round(calc.getBoundingClientRect().top + window.scrollY) : null,
      resultTop: result ? Math.round(result.getBoundingClientRect().top + window.scrollY) : null,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      visibleWords,
      totalWords,
      resultText,
      workedLine,
    };
  });
}

mkdirSync(outDir, { recursive: true });

const server = spawn("./node_modules/.bin/astro", ["preview", "--port", String(port), "--host", "127.0.0.1"], {
  cwd: worktreeDir,
  stdio: "ignore",
});
const report = { label, pages: {} };
try {
  await waitForServer(`${base}/`);
  const browser = await chromium.launch();
  for (const [slug, path] of PAGES) {
    report.pages[slug] = {};
    for (const width of WIDTHS) {
      const isMobile = width <= 390;
      const ctx = await browser.newContext({
        viewport: { width, height: 800 },
        isMobile,
        deviceScaleFactor: isMobile ? 2 : 1,
      });
      const page = await ctx.newPage();
      await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
      await page.waitForSelector('[data-hydrated="true"]', { timeout: 15000 });
      await page.waitForTimeout(400);

      const def = await measureState(page);
      await page.screenshot({ path: `${outDir}/${slug}-${width}-default.png`, fullPage: true });

      // Tile Adhesive owner-corrected scenario: 1/2 x 1/2 in notch, 5% waste.
      let scenario = null;
      if (slug === "tile-adhesive-calculator") {
        await page.getByLabel(/Trowel notch/).selectOption("42");
        await page.getByLabel(/Waste allowance/).fill("5");
        await page.waitForTimeout(400);
        scenario = await measureState(page);
        // Restore defaults for the expanded measurement.
        await page.getByLabel(/Trowel notch/).selectOption("90");
        await page.getByLabel(/Waste allowance/).fill("10");
        await page.waitForTimeout(400);
      }

      // Fully expanded: open every <details> on the page (no-op when none exist).
      const detailsCount = await page.evaluate(() => {
        const all = [...document.querySelectorAll("details")];
        all.forEach((d) => {
          d.open = true;
        });
        return all.length;
      });
      await page.waitForTimeout(300);
      const exp = await measureState(page);
      await page.screenshot({ path: `${outDir}/${slug}-${width}-expanded.png`, fullPage: true });

      report.pages[slug][String(width)] = {
        default: def,
        detailsCount,
        expanded: exp,
        scenario,
      };
      console.log(`measured ${slug} @ ${width}px: default ${def.height}px, expanded ${exp.height}px`);
      await ctx.close();
    }
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}

writeFileSync(`${outDir}/measurements.json`, JSON.stringify(report, null, 2));
console.log(`wrote ${outDir}/measurements.json`);
