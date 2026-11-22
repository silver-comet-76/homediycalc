// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.new/config
export default defineConfig({
  // Fully static output (Astro default). No SSR, no server, no adapter.
  output: "static",
  // Canonical base URL, set only from the owner-approved production
  // origin (Phase 8, Issue #3): the Cloudflare Pages production
  // environment sets PUBLIC_SITE_URL to the live origin. Until then the
  // site uses relative/self-referential canonicals built from page
  // paths. Never hard-code a host here.
  site: process.env.PUBLIC_SITE_URL,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
