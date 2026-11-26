import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.js"],
    coverage: {
      include: ["src/**/*.js"],
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 90,
        branches: 85,
        "src/**/logic.js": { lines: 95, branches: 95, perFile: true },
      },
    },
  },
});
