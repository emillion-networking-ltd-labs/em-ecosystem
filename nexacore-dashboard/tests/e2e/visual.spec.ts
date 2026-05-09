import { test, expect } from "./fixtures/no-console-errors";

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

/**
 * Post-auth routes — only snapshot when VRT_BYPASS is enabled (CI sets
 * NEXT_PUBLIC_VRT_BYPASS_AUTH=1 so AuthContext seeds a mock SafeUser).
 * Tests are skipped locally unless the env var is set.
 *
 * SCRUM-380 Step 3: extended coverage so post-auth pages stop being
 * blind to framework-bump visual regressions.
 */
const POST_AUTH_ROUTES = [
  { path: "/dashboard", name: "dashboard" },
  { path: "/admin/audit-logs", name: "admin-audit-logs" },
  { path: "/admin/permissions", name: "admin-permissions" },
  { path: "/admin/design-system", name: "admin-design-system" },
  { path: "/profile", name: "profile" },
  { path: "/settings", name: "settings" },
] as const;

const VRT_AUTH_BYPASS = process.env.NEXT_PUBLIC_VRT_BYPASS_AUTH === "1";

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
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      // Wait for fonts to settle to avoid font-flicker false positives.
      await page.evaluate(() => document.fonts.ready);
      // Settle pending layout work; avoid `networkidle` because the auth
      // context attempts a CSRF-token fetch that fails in CI (no backend),
      // causing the page to never reach networkidle.
      await page.waitForTimeout(500);

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
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${route.name}-dark.png`, {
        fullPage: true,
      });
    });
  }
});

// =============================================================================
// POST-AUTH ROUTES — gated on NEXT_PUBLIC_VRT_BYPASS_AUTH=1
// =============================================================================

test.describe("Visual regression — post-auth routes (light theme)", () => {
  test.skip(!VRT_AUTH_BYPASS, "VRT_BYPASS_AUTH not set — skipping post-auth routes");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    });
  });

  for (const route of POST_AUTH_ROUTES) {
    test(`${route.name} renders consistently`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);

      await expect(page).toHaveScreenshot(`${route.name}-light.png`, {
        fullPage: true,
      });
    });
  }
});

test.describe("Visual regression — post-auth routes (dark theme)", () => {
  test.skip(!VRT_AUTH_BYPASS, "VRT_BYPASS_AUTH not set — skipping post-auth routes");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    });
  });

  for (const route of POST_AUTH_ROUTES) {
    test(`${route.name} dark mode renders consistently`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);

      await expect(page).toHaveScreenshot(`${route.name}-dark.png`, {
        fullPage: true,
      });
    });
  }
});
