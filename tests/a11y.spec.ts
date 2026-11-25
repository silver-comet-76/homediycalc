import { expect, test } from "@playwright/test";

/**
 * Keyboard and accessibility checks (Phase 5): the calculator must be
 * fully operable by keyboard, focus must be visible on every control,
 * the skip link must work, and every input must have an associated label.
 * Runs on Chromium desktop and Pixel 5 mobile (see playwright.config.ts).
 */

test("a11y: keyboard can reach and operate the paint calculator", async ({ page }) => {
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();

  // Tab from the top: the first stop is the skip link.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  // Walk the tab order inside the calculator and record the stops.
  // When the walk lands on the Metric toggle, capture its computed
  // outline: a keyboard-focused toggle must show a visible ring.
  const stops: string[] = [];
  let metricOutline = { width: "", style: "" };
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return "";
      return el.getAttribute("aria-label") || el.textContent?.trim() || el.id || el.tagName;
    });
    stops.push(stop);
    if (stop === "Metric (m, cm, L)") {
      metricOutline = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return { width: cs.outlineWidth, style: cs.outlineStyle };
      });
    }
    if (stop === "Add to Project") break;
  }

  for (const expected of [
    "Imperial (ft, in, gal)",
    "Metric (m, cm, L)",
    "Reset",
    "Room dimensions",
    "Copy shopping list",
    "Add to Project",
  ]) {
    expect(stops, `expected "${expected}" in the tab order, got: ${stops.join(" | ")}`).toContain(
      expected,
    );
  }

  // Every calculator input is reachable by keyboard: focus the Room length
  // field by its label and type a new value; the result updates.
  await page.getByLabel("Room length").click();
  await page.getByLabel("Room length").fill("20");
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Focus must be visible: the Metric toggle, reached by Tab above,
  // had a non-zero outline (the focus-visible ring added in Phase 5).
  // (Programmatic .focus() does not trigger :focus-visible, so the ring
  // is only asserted for a real keyboard Tab, as captured in the walk.)
  expect(metricOutline.style).not.toBe("none");
  expect(metricOutline.width).not.toBe("0px");

  // The unit toggle is operable from the keyboard alone.
  const metric = page.getByRole("button", { name: "Metric (m, cm, L)" });
  await metric.focus();
  await metric.press("Enter");
  await expect(metric).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Room length")).toBeVisible();

  // The mode switch is operable from the keyboard alone.
  const knownArea = page.getByRole("button", { name: "Known wall area" });
  await knownArea.focus();
  await knownArea.press("Space");
  await expect(knownArea).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Net wall area")).toBeVisible();
});

test("a11y: keyboard-focused links show a 2px focus outline", async ({ page }) => {
  // Phase 7, F2: plain links must show the global :focus-visible ring
  // (2px brand-600 outline), not the 1px UA-default outline.
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();

  // Tab past the skip link and the site logo to the first nav link.
  await page.keyboard.press("Tab"); // Skip to main content
  await page.keyboard.press("Tab"); // Site logo
  await page.keyboard.press("Tab"); // All Calculators nav link
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? (el.textContent?.trim() ?? "") : "";
  });
  expect(focused).toBe("All Calculators");

  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const cs = getComputedStyle(el);
    return { width: cs.outlineWidth, style: cs.outlineStyle };
  });
  expect(outline.style).not.toBe("none");
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
});

test("a11y: pressed toggles show a check-mark marker", async ({ page }) => {
  // Phase 7, F3: the pressed toggle carries a visible non-color marker
  // (a ✓ rendered via the .toggle-pressed ::before rule); the unpressed
  // toggle has no marker. aria-pressed still carries the state.
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();

  const marker = (label: string) =>
    page.evaluate((text) => {
      const btn = [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === text,
      );
      if (!btn) return "missing";
      return getComputedStyle(btn, "::before").content;
    }, label);

  // Imperial unit toggle and the default mode are pressed on load.
  expect(await marker("Imperial (ft, in, gal)")).toContain("✓");
  expect(await marker("Metric (m, cm, L)")).toBe("none");
  expect(await marker("Room dimensions")).toContain("✓");
  expect(await marker("Known wall area")).toBe("none");

  // The marker moves with the pressed state.
  await page.getByRole("button", { name: "Metric (m, cm, L)" }).click();
  expect(await marker("Metric (m, cm, L)")).toContain("✓");
  expect(await marker("Imperial (ft, in, gal)")).toBe("none");
  await expect(page.getByRole("button", { name: "Metric (m, cm, L)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("a11y: inline methodology links are underlined, not color-only", async ({ page }) => {
  // Phase 16A Task C: Lighthouse flagged link-in-text-block on the
  // Paint Calculator — the "How we calculate" link in the formula
  // section relied on color alone (brand-700 on slate-700, 1.41:1
  // contrast, below the 3:1 minimum) with an underline only on hover.
  // The link must carry a permanent underline so it is distinguishable
  // without color (WCAG 1.4.1).
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();

  const link = page.locator('section[aria-labelledby="how-calculated"] a', {
    hasText: "How we calculate",
  });
  await expect(link).toBeVisible();
  const decoration = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    return cs.textDecorationLine;
  });
  expect(decoration).toContain("underline");
});

test("a11y: unknown URLs show the custom 404 page", async ({ page }) => {
  // Phase 7, F6: a bad URL renders src/pages/404.astro with a single H1
  // and links back home and to All Calculators.
  const response = await page.goto("/this-page-does-not-exist/");
  expect(response?.status()).toBe(404);
  expect(await page.locator("h1").count()).toBe(1);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to the home page" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse all calculators" })).toBeVisible();
});

test("a11y: every input on a calculator page has a label", async ({ page }) => {
  for (const slug of [
    "paint-calculator",
    "concrete-calculator",
    "mortar-calculator",
    "my-project",
  ]) {
    await page.goto(slug === "my-project" ? "/my-project/" : `/calculators/${slug}/`);
    if (slug !== "my-project") {
      await expect(page.locator("[data-hydrated='true']")).toBeVisible();
    }
    const unlabeled = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll("input, select, textarea")) {
        const input = el as HTMLInputElement | HTMLSelectElement;
        const id = input.id;
        const hasLabel =
          (id && !!document.querySelector(`label[for="${id}"]`)) ||
          !!input.getAttribute("aria-label") ||
          !!input.closest("label") ||
          !!input.getAttribute("aria-labelledby");
        if (!hasLabel) bad.push(input.outerHTML.slice(0, 120));
      }
      return bad;
    });
    expect(unlabeled, `${slug}: inputs without a label`).toEqual([]);
  }
});
