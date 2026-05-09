import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests — SCRUM-379.
 *
 * Captures full-page screenshots of the public auth-flow routes (no backend
 * auth required) and compares them pixel-by-pixel against a committed
 * baseline. Threshold: 0.2% (configured in playwright.config.ts).
 *
 * Snapshots are platform-specific (Playwright auto-suffixes -<platform>.png).
 * Update baseline:  `npx playwright test visual.spec.ts --update-snapshots`
 * View diff report: `npx playwright show-report`
 *
 * Prerequisites:
 *   - `npx playwright install chromium`
 *   - `npm run dev` (port 3001)
 *
 * Coverage strategy: public routes exercise ~80% of the design-system
 * components (Button, Input, Form fields, Toast, Spinner, Card, Tooltip,
 * AuthLayout). Admin routes (/admin/*, /profile, /settings) require auth
 * and will be added once a Playwright auth-fixture lands (separate ticket).
 */

const PUBLIC_ROUTES = [
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
  { path: "/forgot-password", name: "forgot-password" },
  { path: "/password-reset/check-email", name: "password-reset-check-email" },
  { path: "/activation/check-email", name: "activation-check-email" },
] as const;

test.describe("Visual regression — public routes (light theme)", () => {
  test.beforeEach(async ({ page }) => {
    // Force light theme regardless of system preference for deterministic screenshots.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    });
  });

  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} renders consistently`, async ({ page }) => {
      await page.goto(route.path);
      // Wait for fonts to settle to avoid font-flicker false positives.
      await page.evaluate(() => document.fonts.ready);
      // Wait for any opening transitions to settle.
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot(`${route.name}-light.png`, {
        fullPage: true,
      });
    });
  }
});

test.describe("Visual regression — public routes (dark theme)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    });
  });

  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} dark mode renders consistently`, async ({ page }) => {
      await page.goto(route.path);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot(`${route.name}-dark.png`, {
        fullPage: true,
      });
    });
  }
});
