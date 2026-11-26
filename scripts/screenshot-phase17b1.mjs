/**
 * Take desktop + mobile full-page screenshots of the 8 Phase 17B-1
 * changed calculator pages (plus the homepage, for the D1 line).
 * Dev/CI utility (not shipped to the site).
 *
 * Usage: node scripts/screenshot-phase17b1.mjs <worktreeDir> <port> <outDir>
 * Serves the worktree's dist/ with `astro preview`, screenshots each page
 * at desktop 1280x800 and mobile 390x844 (2x DPR), then stops the server.
 * Requires the site to be built first (e.g. `npm run build`).
 * Note: `astro preview` can leave an orphan server behind on SIGTERM;
 * the caller should kill any leftover `astro preview` process after
 * this script exits (see the CI workflow, which pkill's it).
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const [worktreeDir, portStr, outDir] = process.argv.slice(2);
const port = Number(portStr);
const base = `http://127.0.0.1:${port}`;

const PAGES = [
  ["home", "/"],
  ["concrete-calculator", "/calculators/concrete-calculator/"],
  ["paint-calculator", "/calculators/paint-calculator/"],
  ["tile-calculator", "/calculators/tile-calculator/"],
  ["stair-calculator", "/calculators/stair-calculator/"],
  ["concrete-bags-calculator", "/calculators/concrete-bags-calculator/"],
  ["grout-calculator", "/calculators/grout-calculator/"],
  ["wallpaper-calculator", "/calculators/wallpaper-calculator/"],
  ["drywall-calculator", "/calculators/drywall-calculator/"],
];

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

mkdirSync(outDir, { recursive: true });

const server = spawn("npx", ["astro", "preview", "--port", String(port), "--host", "127.0.0.1"], {
  cwd: worktreeDir,
  stdio: "ignore",
});
try {
  await waitForServer(`${base}/`);
  const browser = await chromium.launch();
  for (const [slug, path] of PAGES) {
    for (const [label, viewport, isMobile] of [
      ["desktop", { width: 1280, height: 800 }, false],
      ["mobile", { width: 390, height: 844 }, true],
    ]) {
      const ctx = await browser.newContext({
        viewport,
        isMobile,
        deviceScaleFactor: isMobile ? 2 : 1,
      });
      const page = await ctx.newPage();
      await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const out = `${outDir}/${slug}-${label}.png`;
      await page.screenshot({ path: out, fullPage: true });
      console.log("wrote", out);
      await ctx.close();
    }
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}
