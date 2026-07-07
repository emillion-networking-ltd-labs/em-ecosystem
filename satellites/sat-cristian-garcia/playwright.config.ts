import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for sat-cristian-garcia.
 *
 * SCRUM-379 — visual regression testing. CI-first: snapshots are captured
 * and compared on Linux runners (see .github/workflows/visual-regression.yml).
 * Local runs are advisory only — pixel-perfect parity is platform-specific.
 *
 * ECO-157 (E4c) — el VRT del satélite es ahora una GUARDIA de propagación REQUIRED. La RED DE FLAKE que hace
 * seguro requerir un check visual (canónicamente flaky por font-hinting/AA/timing) es esta config: retries en
 * CI + `maxDiffPixelRatio` como umbral + `animations: "disabled"`. Runbook de re-run de un flake genuino y de
 * onboarding de baseline en el spec de ECO-157.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",

  timeout: process.env.VRT === "1" ? 120_000 : 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      // Umbral de tolerancia a sub-pixel/AA (parte de la red de flake de E4c, ECO-157).
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
    },
  },

  // Red de flake (ECO-157/E4c): 2 reintentos en CI antes de fallar la guardia required, para no bloquear
  // merges por un wobble transitorio de render. Un fallo que persiste tras 2 retries es una regresión real.
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
