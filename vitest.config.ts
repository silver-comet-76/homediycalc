import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-function tests run in Node by default. Component tests opt into
    // jsdom per file with `// @vitest-environment jsdom`.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
    },
  },
});
