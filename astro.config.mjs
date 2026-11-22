// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { validateProductionOrigin } from "./src/lib/origin.ts";

// https://astro.new/config
export default defineConfig({
  // Fully static output (Astro default). No SSR, no server, no adapter.
  output: "static",
  // Canonical base URL, set only from the owner-approved production
  // origin (Phase 8, Issue #3): the Cloudflare Pages production
  // environment sets PUBLIC_SITE_URL to the live origin. The value is
  // validated by the same rule as src/lib/site.ts (ADR-15): an invalid
  // origin fails the build loudly instead of shipping wrong URLs.
  // Until a valid origin is set, the site uses relative/self-referential
  // canonicals built from page paths. Never hard-code a host here.
  site: validateProductionOrigin(process.env.PUBLIC_SITE_URL),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
