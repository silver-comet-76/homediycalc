/**
 * Advertising configuration — DISABLED by default (ADR-8).
 *
 * This file is the single location for every ad-related value. Nothing in
 * it turns ads on: `ADS_ENABLED` is a hard-coded `false` and may only change
 * by an explicit owner decision recorded as a new ADR in
 * `docs/DECISIONS.md`, together with the `ads.txt`, privacy-policy,
 * consent-management, and CSP work listed in `docs/DEPLOYMENT.md` §12.
 * Setting an environment variable alone never enables ads.
 *
 * Publisher and slot IDs:
 * - Once a real AdSense account exists, set them with the
 *   `PUBLIC_ADSENSE_PUBLISHER_ID` / `PUBLIC_ADSENSE_SLOT_*` environment
 *   variables (Cloudflare Pages → Settings → Environment variables) or by
 *   editing the defaults below. Never commit a real ID to the repository.
 * - The defaults are placeholders made entirely of `X` characters. They are
 *   obviously not real IDs and would be rejected by AdSense if ever used.
 * - `src/lib/ads.test.ts` asserts that ads are disabled and that every ID
 *   here is still a placeholder, so an accidental real ID or an accidental
 *   enablement fails the test suite.
 */

const env = import.meta.env as Record<string, string | undefined>;

/** Master switch. Hard-coded off; see the header comment. */
export const ADS_ENABLED = false as const;

/** AdSense publisher ID, e.g. `ca-pub-XXXXXXXXXXXXXXXX` once real. */
export const ADSENSE_PUBLISHER_ID = env.PUBLIC_ADSENSE_PUBLISHER_ID ?? "ca-pub-XXXXXXXXXXXXXXXX";

/** AdSense ad-unit (slot) IDs, one per placement. */
export const AD_SLOTS = {
  /** In-content slot, used by the shared layout (`src/components/Layout.astro`). */
  inContent: env.PUBLIC_ADSENSE_SLOT_IN_CONTENT ?? "XXXXXXXXXX",
  /** Below-content slot, reserved for a future placement; unused today. */
  belowContent: env.PUBLIC_ADSENSE_SLOT_BELOW_CONTENT ?? "XXXXXXXXXX",
} as const;
