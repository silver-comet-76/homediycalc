// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.new/config
export default defineConfig({
  // Fully static output (Astro default). No SSR, no server, no adapter.
  output: "static",
  // Canonical base URL is set once a domain exists (Phase 6). Until then the
  // site uses relative/self-referential canonicals built from page paths.
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
