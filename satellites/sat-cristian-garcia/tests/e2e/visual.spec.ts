import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests — SCRUM-379 (satellite).
 *
 * All 14 static routes are public. Each gets a screenshot in light + dark
 * mode against a committed Linux-CI baseline. PR fails if any diff > 0.2%.
 *
 * Update baseline (intentional design changes only):
 *   gh workflow run visual-regression.yml -f capture_baseline=true
 */

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/sobre-mi", name: "sobre-mi" },
  { path: "/servicios", name: "servicios" },
  { path: "/precios", name: "precios" },
  { path: "/portfolio", name: "portfolio" },
  { path: "/testimonios", name: "testimonios" },
  { path: "/contacto", name: "contacto" },
  { path: "/legal/privacidad", name: "legal-privacidad" },
  { path: "/legal/terminos", name: "legal-terminos" },
] as const;

test.describe("Visual regression — satellite (light theme)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "light");
      } catch {}
      try {
        // Skip the IntroLoader splash so we snapshot the real content.
        sessionStorage.setItem("intro_seen", "1");
      } catch {}
    });
  });

  for (const route of ROUTES) {
    test(`${route.name} renders consistently`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${route.name}-light.png`, {
        fullPage: true,
      });
    });
  }
});

test.describe("Visual regression — satellite (dark theme)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
      try {
        sessionStorage.setItem("intro_seen", "1");
      } catch {}
    });
  });

  for (const route of ROUTES) {
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
