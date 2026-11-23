/**
 * Take desktop + mobile full-page screenshots of the built homepage.
 * Dev utility for the homepage prototype (not shipped to the site).
 *
 * Usage: node scripts/screenshot-home.mjs <worktreeDir> <port> <outPrefix>
 * Serves the worktree's dist/ with `astro preview`, screenshots /,
 * then stops the server. Screenshots are full-page PNGs.
 * Requires the site to be built first (e.g. `npm run build`).
 * Note: `astro preview` can leave an orphan server behind on SIGTERM;
 * the caller should kill any leftover `astro preview` process after
 * this script exits (see the CI workflow, which pkill's it).
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const [worktreeDir, portStr, outPrefix] = process.argv.slice(2);
const port = Number(portStr);
const base = `http://127.0.0.1:${port}`;

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

const server = spawn("npx", ["astro", "preview", "--port", String(port), "--host", "127.0.0.1"], {
  cwd: worktreeDir,
  stdio: "ignore",
});
try {
  await waitForServer(`${base}/`);
  const browser = await chromium.launch();
  const shots = [
    { name: `${outPrefix}-desktop.png`, viewport: { width: 1280, height: 800 }, isMobile: false },
    { name: `${outPrefix}-mobile.png`, viewport: { width: 390, height: 844 }, isMobile: true },
  ];
  for (const shot of shots) {
    const ctx = await browser.newContext({
      viewport: shot.viewport,
      isMobile: shot.isMobile,
      deviceScaleFactor: shot.isMobile ? 2 : 1,
    });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: shot.name, fullPage: true });
    console.log("wrote", shot.name);
    await ctx.close();
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}
