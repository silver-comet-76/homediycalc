import { expect, test } from "@playwright/test";

const CONTACT_EMAIL = "homediycalc@gmail.com";

/**
 * Phase 9 owner decisions (2026-11-23): contact email, operator identity
 * (individual based in Malaysia), governing law (Laws of Malaysia,
 * APPROVED — Issue #5 comment 7091231814), All Rights Reserved wording
 * for materials the operator owns, subject to third-party rights and
 * licenses (APPROVED — same comment), and the corrected deployment-status
 * statements on the legal pages.
 *
 * Review response (PR #6 review 6016380187, CHANGES_REQUESTED): the legal
 * pages must not make categorical "no personal data" claims (hosting
 * processing and voluntary email contact are real), must not assert an
 * unverified business-registration status, must limit copyright claims
 * to material the operator actually owns while preserving third-party
 * rights, and must not publish internal approval notes as live Terms.
 * The tests below guard the corrected wording.
 *
 * Privacy §6 production-status correction (PR #7, staging review
 * 7091853733): the §6 deployment-status sentence must describe the
 * public production site as live at the production origin, not as
 * pending launch approval — the pending wording becomes stale the
 * moment production goes live. The privacy test guards the live
 * wording and forbids the stale wording.
 *
 * Terms §6 whitespace fix (PR #7, same staging review): the
 * cross-reference was split across source lines ("See the" then the
 * link) and Astro stripped the space, rendering "See thePrivacy
 * Policy." — the fix keeps "See the" and the link on one source line,
 * and the terms test guards the rendered "See the Privacy Policy."
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

test("about page names the individual operator based in Malaysia, no registration claim", async ({
  page,
}) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: "About HomeDIYCalc" })).toBeVisible();
  await expect(
    page.getByText("operated independently by an individual based in Malaysia"),
  ).toBeVisible();
  await expect(page.getByText("It is not a company")).toBeVisible();
  // Owner-confirmed: individual, not a company. Whether the operator is
  // registered as a sole proprietorship is a different, unconfirmed
  // question — the page must not assert a registration status either way.
  await expect(page.getByText("registered business")).toHaveCount(0);
  await expect(page.getByText("Sdn")).toHaveCount(0);
  // The meta description must not make a categorical "no data" claim.
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).not.toContain("no data collected");
  await expect(page.getByRole("link", { name: "Contact", exact: true }).first()).toBeVisible();
});

test("privacy policy distinguishes browser-local processing from hosting and email — no categorical 'no personal data'", async ({
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
  // Privacy §6 production-status correction (PR #7): the public
  // production site is described as live at the production origin, and
  // the stale "pending launch approval" wording must not appear.
  await expect(page.getByText("the public production site is live at")).toBeVisible();
  await expect(page.getByText("pending the owner's launch approval")).toHaveCount(0);
  // No tracking or advertising.
  await expect(page.getByText("The site itself sets no cookies")).toBeVisible();
  await expect(page.getByText("No advertising scripts are loaded on this site.")).toBeVisible();

  // Review 6016380187: no categorical "no personal data" claims. The
  // site does not ask for personal information, calculator inputs stay
  // in the browser, the operator receives only what a person chooses to
  // email, and the hosting provider processes request data — all stated
  // separately, none of them as "nothing is collected".
  await expect(page.getByText("collects no personal data")).toHaveCount(0);
  await expect(page.getByText("The only personal information we ever receive")).toHaveCount(0);
  await expect(page.getByText("no personal data from anyone")).toHaveCount(0);
  // No absolute claim about Cloudflare log access/non-access.
  await expect(page.getByText("we do not receive or use that information")).toHaveCount(0);
  await expect(
    page.getByText("The only personal information the operator receives").first(),
  ).toBeVisible();
  await expect(page.getByText("may log standard web-server information")).toBeVisible();
  await expect(page.getByText("governed by Cloudflare's own privacy policy")).toBeVisible();
  // The meta description must not carry the categorical claim either.
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).not.toContain("collects no personal data");
});

test("terms of use name the operator, the approved governing law, and the narrowed copyright wording", async ({
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

  // Review 6016380187: no categorical "no personal data" claim in §6.
  await expect(page.getByText("The site collects no personal data")).toHaveCount(0);
  await expect(page.getByText("does not ask for your personal information")).toBeVisible();
  // Terms §6 whitespace fix (PR #7, staging review 7091853733): the
  // cross-reference must render as "See the Privacy Policy." — the
  // source previously split "See the" and the link across lines and
  // Astro stripped the space, rendering "See thePrivacy Policy.".
  await expect(page.getByText("See the Privacy Policy.")).toBeVisible();
  await expect(page.getByText("See thePrivacy Policy")).toHaveCount(0);
  // No internal approval notes published as live Terms (the governing-law
  // and copyright choices are now owner-approved — Issue #5 comment
  // 7091231814 — so the pages state them plainly; the approval record
  // lives in the PR and the decision log, not on the page).
  await expect(page.getByText("subject to final confirmation")).toHaveCount(0);
  await expect(page.getByText("proposed")).toHaveCount(0);
  // Copyright is narrowed to material the operator actually owns;
  // third-party rights and licenses are preserved, not overridden.
  await expect(page.getByText("operator's copyrighted work")).toHaveCount(0);
  await expect(page.getByText("operator's own work")).toBeVisible();
  await expect(page.getByText("Third-party materials")).toBeVisible();
  await expect(page.getByText("remain the property of their owners")).toBeVisible();
  await expect(page.getByText("does not change those licenses")).toBeVisible();

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
