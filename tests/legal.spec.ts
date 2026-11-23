import { expect, test } from "@playwright/test";

const CONTACT_EMAIL = "homediycalc@gmail.com";

/**
 * Phase 9 owner decisions (2026-11-23): contact email, operator identity
 * (individual based in Malaysia), governing law (Laws of Malaysia,
 * proposed), All Rights Reserved wording (preferred), and the corrected
 * deployment-status statements on the legal pages.
 */
test("contact page publishes the official email as a mailto link, no form", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto("/contact/");
  await expect(page.getByRole("heading", { name: "Contact", exact: true })).toBeVisible();

  const mailto = page.getByRole("link", { name: CONTACT_EMAIL });
  await expect(mailto).toBeVisible();
  await expect(mailto).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);

  // No contact form: the only form on the page is the header site search
  // (role="search", GET to /calculators/). A contact form would be a
  // non-search form; there must be none, and no form may POST anywhere.
  await expect(page.locator("form:not([role='search'])")).toHaveCount(0);
  await expect(page.locator('form[method="post"]')).toHaveCount(0);
  // No file uploads anywhere on the page.
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  // The forbidden domain must never appear.
  await expect(page.getByText("contact@homediycalc.com")).toHaveCount(0);
  // No external scripts (no tracking, no ads).
  await expect(page.locator('script[src^="http"]')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test("about page names the individual operator based in Malaysia", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: "About HomeDIYCalc" })).toBeVisible();
  await expect(
    page.getByText("operated independently by an individual based in Malaysia"),
  ).toBeVisible();
  await expect(page.getByText("It is not a company")).toBeVisible();
  await expect(page.getByText("Sdn")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Contact", exact: true }).first()).toBeVisible();
});

test("privacy policy states the contact email, LocalStorage, and live hosting — no stale 'not live yet'", async ({
  page,
}) => {
  await page.goto("/privacy-policy/");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await expect(page.getByText("Last updated: November 23, 2026.")).toBeVisible();

  // Contact email is published and linked.
  const mailto = page.getByRole("link", { name: CONTACT_EMAIL });
  await expect(mailto).toBeVisible();
  await expect(mailto).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);

  // Browser-local processing and My Project storage.
  await expect(page.getByText("homediycalc:project:v1")).toBeVisible();
  await expect(page.getByText("processed entirely in your own browser")).toBeVisible();
  // Hosting is live on Cloudflare Pages; the stale pre-deployment line is gone.
  await expect(page.getByText("Cloudflare Pages")).toBeVisible();
  await expect(page.getByText("not live yet")).toHaveCount(0);
  // No tracking or advertising.
  await expect(page.getByText("The site itself sets no cookies")).toBeVisible();
  await expect(page.getByText("No advertising scripts are loaded on this site.")).toBeVisible();
});

test("terms of use name the operator, the proposed governing law, and the copyright wording", async ({
  page,
}) => {
  await page.goto("/terms-of-use/");
  await expect(page.getByRole("heading", { name: "Terms of Use" })).toBeVisible();
  await expect(page.getByText("Last updated: November 23, 2026.")).toBeVisible();

  await expect(
    page.getByText("operated independently by an individual based in Malaysia"),
  ).toBeVisible();
  await expect(page.getByText("governed by the laws of Malaysia")).toBeVisible();
  await expect(page.getByText("All rights reserved")).toBeVisible();

  const mailto = page.getByRole("link", { name: CONTACT_EMAIL });
  await expect(mailto).toBeVisible();
  await expect(mailto).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
});

test("disclaimer states estimates are not guaranteed quantities or professional advice", async ({
  page,
}) => {
  await page.goto("/disclaimer/");
  await expect(page.getByRole("heading", { name: "Disclaimer" })).toBeVisible();
  await expect(page.getByText("Last updated: November 23, 2026.")).toBeVisible();

  await expect(page.getByText("not guaranteed purchase quantities")).toBeVisible();
  await expect(page.getByText("not professional engineering advice")).toBeVisible();
  await expect(page.getByText("operated by an individual, not a company")).toBeVisible();
});

test("footer links reach every legal and contact page", async ({ page }) => {
  await page.goto("/");
  for (const [name, url] of [
    ["About", /\/about\/?$/],
    ["Contact", /\/contact\/?$/],
    ["Privacy Policy", /\/privacy-policy\/?$/],
    ["Terms of Use", /\/terms-of-use\/?$/],
    ["Disclaimer", /\/disclaimer\/?$/],
  ] as const) {
    await page.getByRole("link", { name, exact: true }).last().click();
    await expect(page).toHaveURL(url);
    await page.goto("/");
  }
});
