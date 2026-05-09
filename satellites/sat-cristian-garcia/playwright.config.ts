import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for sat-cristian-garcia.
 *
 * SCRUM-379 — visual regression testing. CI-first: snapshots are captured
 * and compared on Linux runners (see .github/workflows/visual-regression.yml).
 * Local runs are advisory only — pixel-perfect parity is platform-specific.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",

  timeout: process.env.VRT === "1" ? 120_000 : 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
    },
  },

  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
