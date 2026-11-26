import { expect, test } from "@playwright/test";

/**
 * Phase 17B1-UI Stage 1 corrective round (ChatGPT independent QA,
 * REQUEST CHANGES). Regression tests for the four corrective findings
 * plus the keyboard-accessibility verification the authorization
 * requires. Each test names the finding it guards.
 *
 * QA-17B1-UI-01 — safety content must be default-visible, not merely
 * present in the DOM. These tests assert actual visibility.
 * QA-17B1-UI-03 — the stair diagram geometry must match the
 * calculator's convention (Treads = Risers − 1; Total Run excludes the
 * upper floor). These tests read the SVG geometry, not just labels.
 * Verification req. 6/7 — keyboard access to accordion summaries, TOC
 * links, horizontal navigation and scrollable tables, with visible focus.
 */

test("QA-17B1-UI-01: stair nosing FAQ is open and its safety answer is visible by default", async ({
  page,
}) => {
  await page.goto("/calculators/stair-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const faq = page.locator("details.faq-item", { hasText: "How deep should stair treads be?" });
  await expect(faq).toHaveAttribute("open", "");
  // Actual visibility, not DOM presence: the nosing requirements must be
  // readable without opening anything.
  await expect(faq.getByText("nosing projecting", { exact: false })).toBeVisible();
  await expect(faq.getByText("R311.7.5.3", { exact: false })).toBeVisible();
  await expect(faq.getByText("¾ in to 1-¼ in", { exact: false })).toBeVisible();
});

test("QA-17B1-UI-01: only the first and nosing FAQs are open on Stair by default", async ({
  page,
}) => {
  await page.goto("/calculators/stair-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const items = page.locator("details.faq-item");
  await expect(items).toHaveCount(4);
  await expect(items.nth(0)).toHaveAttribute("open", "");
  await expect(items.nth(1)).not.toHaveAttribute("open", "");
  await expect(items.nth(2)).not.toHaveAttribute("open", "");
  await expect(items.nth(3)).toHaveAttribute("open", "");
});

test("QA-17B1-UI-01 audit: the ⅜-inch riser rule is visible in the expanded Limitations", async ({
  page,
}) => {
  await page.goto("/calculators/stair-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  // Scope to Limitations: the same phrase also appears in a collapsed
  // depth chapter, which is not default-visible.
  const limitations = page.locator("section[aria-labelledby='limitations']");
  await expect(limitations.getByText("within ⅜ in of each other", { exact: false })).toBeVisible();
});

test("QA-17B1-UI-01 audit: 95% mortar contact is visible in the expanded How to measure", async ({
  page,
}) => {
  await page.goto("/calculators/tile-adhesive-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByText("95% in wet areas", { exact: false })).toBeVisible();
});

test("QA-17B1-UI-01 audit: primer guidance is visible in the expanded Paint Limitations", async ({
  page,
}) => {
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  await expect(page.getByText("need primer first", { exact: false })).toBeVisible();
});

test("QA-17B1-UI-03: stair diagram has 4 risers and 3 treads (Treads = Risers − 1)", async ({
  page,
}) => {
  await page.goto("/calculators/stair-calculator/");
  const geom = await page.locator("figure svg").evaluate((svg) => {
    const polygon = svg.querySelector("polygon");
    const pts = (polygon?.getAttribute("points") ?? "")
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(",").map(Number);
        return { x: x as number, y: y as number };
      });
    // Step profile: from the first point up to the topmost point (min y).
    // The two closing edges (right edge down, bottom edge back) are not
    // risers or treads.
    let topIdx = 0;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      const best = pts[topIdx];
      if (p !== undefined && best !== undefined && p.y < best.y) topIdx = i;
    }
    const profile = pts.slice(0, topIdx + 1);
    let risers = 0;
    let treads = 0;
    for (let i = 1; i < profile.length; i++) {
      const a = profile[i - 1] as { x: number; y: number };
      const b = profile[i] as { x: number; y: number };
      if (a.x === b.x) risers++;
      else if (a.y === b.y) treads++;
    }
    const lines = [...svg.querySelectorAll("line")];
    const dashed = lines.find((l) => l.getAttribute("stroke-dasharray"));
    const runLine = lines.find((l) => l.getAttribute("y1") === "178");
    const riseLine = lines.find((l) => l.getAttribute("x1") === "40");
    return {
      risers,
      treads,
      firstPoint: pts[0],
      topPoint: pts[topIdx],
      pitch: dashed
        ? (["x1", "y1", "x2", "y2"].map((a) => Number(dashed.getAttribute(a))) as [
            number,
            number,
            number,
            number,
          ])
        : null,
      run: runLine
        ? [Number(runLine.getAttribute("x1")), Number(runLine.getAttribute("x2"))]
        : null,
      rise: riseLine
        ? [Number(riseLine.getAttribute("y1")), Number(riseLine.getAttribute("y2"))]
        : null,
    };
  });
  expect(geom.risers, "riser count").toBe(4);
  expect(geom.treads, "tread count").toBe(3);
  expect(geom.risers).toBe(geom.treads + 1);
  // The stringer diagonal runs from the base of the first riser to the
  // top of the last riser — the same rise/run the dimensions measure.
  expect(geom.pitch).toEqual([
    geom.firstPoint?.x,
    geom.firstPoint?.y,
    geom.topPoint?.x,
    geom.topPoint?.y,
  ]);
  // Total Run spans exactly the tread intervals (3 treads), not the upper floor.
  expect(geom.run).toEqual([geom.firstPoint?.x, geom.topPoint?.x]);
  expect(geom.run?.[1]).toBeLessThan(300);
  // Total Rise spans the full rise, floor to floor.
  expect(geom.rise).toEqual([geom.topPoint?.y, geom.firstPoint?.y]);
});

test("keyboard: a closed Stair FAQ opens with Enter", async ({ page }) => {
  await page.goto("/calculators/stair-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const faq = page.locator("details.faq-item").nth(1);
  await expect(faq).not.toHaveAttribute("open", "");
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => faq.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(true);
});

test("keyboard: a closed Tile Adhesive FAQ opens with Enter", async ({ page }) => {
  await page.goto("/calculators/tile-adhesive-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const faq = page.locator("details.faq-item").nth(2);
  await expect(faq).not.toHaveAttribute("open", "");
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => faq.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(true);
});

test("keyboard: TOC links are focusable and activate to their anchors", async ({ page }) => {
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const link = page.locator('nav[aria-label="On this page"] a', { hasText: "Quick reference" });
  await link.focus();
  await expect(link).toBeFocused();
  // A focused link has a visible focus outline (2px brand-600).
  const outline = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { width: cs.outlineWidth, style: cs.outlineStyle };
  });
  expect(outline.style).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#common-sizes$/);
  await expect(page.locator("#common-sizes")).toBeVisible();
});

test("keyboard: compact mobile nav links are focusable at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/calculators/paint-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const navLink = page.locator("header nav a", { hasText: "Calculators" }).first();
  await navLink.focus();
  await expect(navLink).toBeFocused();
});

test("keyboard: the quick-reference table wrapper is focusable and scrolls at 390px", async ({
  page,
  isMobile,
}) => {
  // Keyboard scrolling is a desktop interaction model; a touch device
  // scrolls this table by swipe, so the mobile project is skipped.
  test.skip(isMobile, "touch devices scroll by swipe, not keyboard");
  // The Stair lookup table (6 columns) is the one that overflows at
  // 390px; Paint and Tile Adhesive (4 columns) fit. Verified by
  // measurement: Stair scrollWidth 400 > clientWidth 358.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/calculators/stair-calculator/");
  await expect(page.locator("[data-hydrated='true']")).toBeVisible();
  const wrapper = page.locator("#common-sizes").locator("..").locator("div[tabindex='0']").first();
  await expect(wrapper).toHaveAttribute("tabindex", "0");
  const overflows = await wrapper.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflows, "stair table should overflow the 390px viewport").toBe(true);
  await wrapper.focus();
  await expect(wrapper).toBeFocused();
  // Focusing scrolls the wrapper into view, and the document uses
  // smooth scrolling (html scroll-behavior: smooth), so the scroll is
  // still animating when focus lands. Wait for it to settle, or the
  // ArrowRight presses are consumed by the in-flight scroll.
  await page.waitForTimeout(600);
  // Arrow keys scroll a focused overflow container (End moves in the
  // block direction, not horizontally, so it does not scroll this table).
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => wrapper.evaluate((el) => el.scrollLeft), { timeout: 5000 })
    .toBeGreaterThan(0);
});
