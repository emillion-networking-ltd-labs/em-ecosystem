import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for nexacore-dashboard E2E tests.
 *
 * SCRUM-350 / Phase 9b — see audit-standards.mdc for the check definitions
 * (FE-27..FE-32) and ai-specs/changes/auth/plans/Sprint 12/SCRUM-350_frontend.md
 * for the rollout plan.
 *
 * Local usage:
 *   1. Start backend stack (nexacore-api + Postgres + Redis). docker-compose
 *      for the E2E backend is tracked as a follow-up — for now boot manually.
 *   2. Start dashboard dev server: `npm run dev` (port 3001).
 *   3. In another terminal: `npm run test:e2e` (or `test:e2e:ui` for UI mode).
 *
 * First-time setup: `npx playwright install chromium` to download the browser.
 *
 * CI integration tracked separately — see SCRUM-350_verify.md Deferred items.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  // Skip Jest-style *.test.* files — those are unit/integration covered by Jest.
  testIgnore: ["**/*.test.ts", "**/*.test.tsx"],

  // Each individual test gets 30s; VRT tests get longer because Turbopack
  // first-render of a fresh route can take 60-90s on Windows OneDrive.
  timeout: process.env.VRT === "1" ? 120_000 : 30_000,
  expect: {
    timeout: 5_000,
    // SCRUM-379 — Visual Regression Testing thresholds.
    // 0.2% pixel diff allowed before flagging a regression.
    // Snapshots are platform-specific (Playwright suffixes -<platform>.png).
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      // Mask volatile regions (timestamps, animation frames). Tests can
      // override per-call when needed.
      animations: "disabled",
    },
  },

  // 2 retries on CI; 0 locally.
  retries: process.env.CI ? 2 : 0,

  // Parallel execution within a single file by default; one worker on CI to
  // simplify backend state assumptions.
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
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
    // firefox + webkit projects can be enabled when cross-browser coverage
    // is needed — chromium-only as the baseline per SCRUM-350 plan.
  ],

  // webServer is intentionally unset: contributors start the dev server
  // manually for now. When docker-compose.e2e.yml lands, this can become:
  //   webServer: {
  //     command: "npm run dev",
  //     url: "http://localhost:3001",
  //     reuseExistingServer: !process.env.CI,
  //   },
});
