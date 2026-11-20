import { expect, test } from "@playwright/test";

/**
 * Styles regression test (Phase 5): the Tailwind stylesheet must load and
 * actually apply. This guards the Phase 5 finding that
 * src/styles/global.css was never imported, so the site shipped with no
 * CSS at all — browser-default buttons, unstyled text, 17 px nav links —
 * while every functional test still passed. Runs on Chromium desktop and
 * Pixel 5 mobile (see playwright.config.ts).
 */

test("styles: the Tailwind stylesheet loads and applies", async ({
  page,
}) => {
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();

  const styles = await page.evaluate(() => {
    const btn = document.querySelector(".btn-primary");
    const btnCs = btn ? getComputedStyle(btn) : null;
    const bodyCs = getComputedStyle(document.body);
    const nav = document.querySelector("header nav a");
    return {
      styleSheets: [...document.styleSheets].map((s) => s.href || "inline"),
      bodyBg: bodyCs.backgroundColor,
      btnBg: btnCs?.backgroundColor,
      btnColor: btnCs?.color,
      btnRadius: btnCs?.borderRadius,
      navHeight: nav?.getBoundingClientRect().height,
    };
  });

  // A real stylesheet (not just the inline astro-island rule) is loaded.
  expect(
    styles.styleSheets.filter((href) => href.endsWith(".css")),
    `expected a .css stylesheet, got: ${styles.styleSheets.join(", ")}`,
  ).toHaveLength(1);

  // The design tokens apply: white page, brand-orange primary button
  // with white text and rounded corners (not the browser-default gray).
  expect(styles.bodyBg).toBe("rgb(255, 255, 255)");
  expect(styles.btnBg).toBe("rgb(194, 65, 12)"); // brand-600 #c2410c
  expect(styles.btnColor).toBe("rgb(255, 255, 255)");
  expect(styles.btnRadius).toBe("8px");

  // Header nav links meet the 24 px minimum touch-target height
  // (WCAG 2.2 Target Size, Minimum) once the stylesheet applies.
  expect(styles.navHeight).toBeGreaterThanOrEqual(24);
});
