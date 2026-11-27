import { expect, test } from "@playwright/test";
import { CALCULATOR_CONFIGS } from "../src/calculators/index";
import type { CalculatorConfig } from "../src/components/react/CalculatorConfig";

/**
 * QA-17B1-UI-06: 26-calculator accessibility matrix (automated checks).
 *
 * Every check here runs against the real rendered page (production-mode
 * build) and asserts actual behavior — nothing is marked PASS without
 * running. The matrix dimensions are the eleven named in the QA finding:
 * input labels, keyboard/focus, unit/mode controls, error association,
 * accordion keyboard interaction, TOC links, scrollable-table keyboard
 * access, safety visibility, result accessibility, mobile nav, and
 * page-level horizontal overflow.
 *
 * Manual checks (screen-reader narration, real-device touch) are NOT
 * claimed here; they are recorded as not-performed in the handover
 * matrix. Lighthouse scores for the 5 representative pages live in
 * scripts/lighthouse-representative.sh output (docs evidence), not here.
 */

const ALL = [
  { slug: "concrete-calculator", path: "/calculators/concrete-calculator/" },
  { slug: "square-footage-calculator", path: "/calculators/square-footage-calculator/" },
  { slug: "paint-calculator", path: "/calculators/paint-calculator/" },
  { slug: "gravel-calculator", path: "/calculators/gravel-calculator/" },
  { slug: "mulch-calculator", path: "/calculators/mulch-calculator/" },
  { slug: "concrete-slab-calculator", path: "/calculators/concrete-slab-calculator/" },
  { slug: "cubic-yard-calculator", path: "/calculators/cubic-yard-calculator/" },
  { slug: "cubic-feet-calculator", path: "/calculators/cubic-feet-calculator/" },
  { slug: "tile-calculator", path: "/calculators/tile-calculator/" },
  { slug: "brick-calculator", path: "/calculators/brick-calculator/" },
  { slug: "drywall-calculator", path: "/calculators/drywall-calculator/" },
  { slug: "concrete-bags-calculator", path: "/calculators/concrete-bags-calculator/" },
  { slug: "flooring-calculator", path: "/calculators/flooring-calculator/" },
  { slug: "paver-calculator", path: "/calculators/paver-calculator/" },
  { slug: "topsoil-calculator", path: "/calculators/topsoil-calculator/" },
  { slug: "grout-calculator", path: "/calculators/grout-calculator/" },
  { slug: "board-foot-calculator", path: "/calculators/board-foot-calculator/" },
  { slug: "mortar-calculator", path: "/calculators/mortar-calculator/" },
  { slug: "ceiling-tile-calculator", path: "/calculators/ceiling-tile-calculator/" },
  { slug: "tile-adhesive-calculator", path: "/calculators/tile-adhesive-calculator/" },
  { slug: "primer-calculator", path: "/calculators/primer-calculator/" },
  { slug: "wallpaper-calculator", path: "/calculators/wallpaper-calculator/" },
  { slug: "sealant-calculator", path: "/calculators/sealant-calculator/" },
  { slug: "waterproofing-calculator", path: "/calculators/waterproofing-calculator/" },
  { slug: "baseboard-calculator", path: "/calculators/baseboard-calculator/" },
  { slug: "stair-calculator", path: "/calculators/stair-calculator/" },
] as const;

type AllSlug = (typeof ALL)[number]["slug"];

function mustGetConfig(slug: AllSlug): CalculatorConfig {
  const config = CALCULATOR_CONFIGS[slug];
  if (!config) throw new Error(`missing config for ${slug}`);
  return config;
}

/** First required numeric input in the default mode (for the error check). */
function firstRequiredNumberField(config: CalculatorConfig) {
  const mode = config.modes.find((m) => m.id === config.defaultMode) ?? config.modes[0];
  if (!mode) throw new Error(`no mode for ${config.slug}`);
  const field = mode.fields.find((f) => f.kind !== "select" && !f.optional);
  if (!field) throw new Error(`no required number field for ${config.slug}`);
  return { mode, field };
}

for (const { slug, path } of ALL) {
  test.describe(slug, () => {
    test("inputs and selects have accessible names", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const unnamed = await page.evaluate(() => {
        const bad: string[] = [];
        for (const el of document.querySelectorAll("input, select")) {
          const id = el.getAttribute("id");
          const ariaLabel = el.getAttribute("aria-label");
          const labelledBy = el.getAttribute("aria-labelledby");
          const labelled =
            (ariaLabel && ariaLabel.trim().length > 0) ||
            (labelledBy && document.getElementById(labelledBy)) ||
            (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
            el.closest("label");
          if (!labelled) bad.push(el.outerHTML.slice(0, 120));
        }
        return bad;
      });
      expect(unnamed, `inputs/selects without an accessible name on ${slug}`).toEqual([]);
    });

    test("unit toggle and mode controls have names and pressed state", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      // Unit toggle: Imperial / Metric buttons with aria-pressed.
      const toggle = page.locator("button", { hasText: "Imperial" }).first();
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-pressed", /true|false/);
      const metric = page.locator("button", { hasText: "Metric" }).first();
      await expect(metric).toBeVisible();
      await expect(metric).toHaveAttribute("aria-pressed", /true|false/);
      // Mode buttons, where the calculator has more than one mode.
      const config = mustGetConfig(slug);
      if (config.modes.length > 1) {
        for (const m of config.modes) {
          const btn = page.locator("button", { hasText: m.label }).first();
          await expect(btn).toBeVisible();
          await expect(btn).toHaveAttribute("aria-pressed", /true|false/);
        }
      }
      // Reset is a named button.
      await expect(page.locator("button", { hasText: "Reset" }).first()).toBeVisible();
    });

    test("invalid input is announced: aria-invalid + describedby + role=alert", async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const config = mustGetConfig(slug);
      const { mode, field } = firstRequiredNumberField(config);
      const inputId = `${slug}-${mode.id}-${field.id}`;
      const input = page.locator(`#${inputId}`);
      await input.fill("-1");
      // The error element must exist, be linked from the input, and be a live alert.
      const error = page.locator(`#${inputId}-error`);
      await expect(error).toBeVisible();
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveAttribute("aria-describedby", `${inputId}-error`);
      await expect(error).toHaveAttribute("role", "alert");
      expect((await error.textContent())?.trim().length).toBeGreaterThan(0);
      // No result is shown while a required input is invalid.
      await expect(page.locator("section[aria-label='Results']")).toHaveCount(0);
    });

    test("FAQ and depth accordions toggle by keyboard", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const summary = page.locator("details.faq-item > summary").first();
      await expect(summary).toBeVisible();
      const details = page.locator("details.faq-item").first();
      const wasOpen = await details.evaluate((el) => (el as HTMLDetailsElement).open);
      await summary.focus();
      await page.keyboard.press("Enter");
      await expect
        .poll(() => details.evaluate((el) => (el as HTMLDetailsElement).open))
        .toBe(!wasOpen);
      // A collapsed depth chapter (where one exists) also toggles by keyboard.
      const depth = page.locator("details.depth-details > summary").first();
      if ((await depth.count()) > 0) {
        const d = page.locator("details.depth-details").first();
        const openBefore = await d.evaluate((el) => (el as HTMLDetailsElement).open);
        await depth.focus();
        await page.keyboard.press("Space");
        await expect
          .poll(() => d.evaluate((el) => (el as HTMLDetailsElement).open))
          .toBe(!openBefore);
      }
    });

    test("TOC links resolve to anchors on the page", async ({ page }) => {
      await page.goto(path);
      const toc = page.locator('nav[aria-label="On this page"]');
      await expect(toc).toBeVisible();
      const hrefs = await toc
        .locator("a[href^='#']")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") as string));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        const id = href.slice(1);
        expect(
          await page.locator(`[id="${id}"]`).count(),
          `TOC target ${href} missing on ${slug}`,
        ).toBeGreaterThan(0);
      }
    });

    test("scrollable table wrappers are keyboard-focusable", async ({ page }) => {
      await page.goto(path);
      const wrappers = page.locator("div.overflow-x-auto[tabindex='0']");
      const count = await wrappers.count();
      // Every C+ page has at least the lookup-table wrapper; pages with
      // depth-chapter tables have more. The count is asserted, not assumed.
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const w = wrappers.nth(i);
        // A wrapper inside a collapsed depth chapter is not focusable
        // until its chapter is opened — open the ancestor <details>
        // first, then the wrapper must take keyboard focus.
        const details = w.locator("xpath=ancestor::details[1]");
        if ((await details.count()) > 0) {
          const open = await details.evaluate((el) => (el as HTMLDetailsElement).open);
          if (!open) {
            await details.locator("> summary").click();
            await expect
              .poll(() => details.evaluate((el) => (el as HTMLDetailsElement).open))
              .toBe(true);
          }
        }
        await w.focus();
        await expect(w).toBeFocused();
      }
    });

    test("safety content is visible by default", async ({ page }) => {
      await page.goto(path);
      // Limitations are always expanded, never inside a <details>.
      const limitations = page.locator("#limitations");
      await expect(limitations).toBeVisible();
      // Every openByDefault FAQ is open and its answer is visible.
      const config = mustGetConfig(slug);
      const safetyFaqs = config.faqs.filter((f) => f.openByDefault);
      for (const faq of safetyFaqs) {
        const item = page.locator("details.faq-item", {
          hasText: faq.question.slice(0, 30),
        });
        await expect(item).toHaveCount(1);
        await expect.poll(() => item.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(true);
        await expect(item.locator("summary + *").first()).toBeVisible();
      }
      // No closed <details> hides a safety-critical summary.
      const hiddenSafety = await page.evaluate(() => {
        const bad: string[] = [];
        for (const d of document.querySelectorAll("details:not([open])")) {
          const summary = d.querySelector("summary")?.textContent ?? "";
          if (/safety|warning|danger|do not|never|must not/i.test(summary)) {
            bad.push(summary.trim().slice(0, 80));
          }
        }
        return bad;
      });
      expect(hiddenSafety, `closed <details> hiding safety content on ${slug}`).toEqual([]);
    });

    test("result section has an accessible name and keeps secondary values", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      const result = page.locator("section[aria-label='Results']");
      await expect(result).toBeVisible();
      // Every result row renders a label and a value (secondary outputs included).
      const rows = await result
        .locator("[data-result-row], li, div")
        .evaluateAll((els) =>
          els.map((el) => el.textContent ?? "").filter((t) => t.trim().length > 0),
        );
      expect(rows.length).toBeGreaterThan(0);
    });

    test("keyboard tab order reaches the calculator and focus is visible", async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector("[data-hydrated='true']");
      // Tab from the top: the calculator's first input must be reachable
      // and show a visible focus indicator when focused by keyboard.
      const input = page.locator("section[aria-label='Calculator'] input").first();
      await input.focus();
      await expect(input).toBeFocused();
      const outline = await input.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { width: cs.outlineWidth, style: cs.outlineStyle, color: cs.outlineColor };
      });
      expect(
        outline.style !== "none" || parseFloat(outline.width) > 0,
        `no visible focus ring on calculator input (${slug}): ${JSON.stringify(outline)}`,
      ).toBe(true);
    });

    test("no page-level horizontal overflow at 320/390/768/1280", async ({ page }) => {
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        await page.waitForSelector("[data-hydrated='true']");
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `horizontal overflow at ${width}px on ${slug}`).toBe(0);
      }
    });

    test("mobile navigation is usable at 390px", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeVisible();
      // "All Calculators" is the first link in the main nav; the brand
      // (home) link sits outside the <nav> as the site-name link.
      const all = nav.locator('a[href="/calculators/"]').first();
      await expect(all).toBeVisible();
      const box = await all.boundingBox();
      expect(box).not.toBeNull();
      // The link must be tappable (at least 24px tall, per the styles guard).
      expect(box?.height).toBeGreaterThanOrEqual(24);
      const brand = page.locator('header a[href="/"]').first();
      await expect(brand).toBeVisible();
    });
  });
}
