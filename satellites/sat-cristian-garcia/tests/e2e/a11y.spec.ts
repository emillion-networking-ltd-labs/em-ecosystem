import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility regression tests for the satellite — SCRUM-380 Step 4.
 *
 * Same gate as dashboard: critical+serious WCAG 2.1 AA violations fail
 * the PR. Moderate+minor are logged but don't block.
 */

const ROUTES = [
  "/",
  "/sobre-mi",
  "/servicios",
  "/precios",
  "/portfolio",
  "/testimonios",
  "/contacto",
  "/legal/privacidad",
  "/legal/terminos",
];

const BLOCKING_IMPACTS = ["critical", "serious"] as const;

test.describe("a11y — satellite routes", () => {
  for (const path of ROUTES) {
    test(`${path} has no critical/serious WCAG 2.1 AA violations`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blocking = results.violations.filter((v) =>
        BLOCKING_IMPACTS.includes(
          v.impact as (typeof BLOCKING_IMPACTS)[number],
        ),
      );

      const nonBlocking = results.violations.filter(
        (v) =>
          !BLOCKING_IMPACTS.includes(
            v.impact as (typeof BLOCKING_IMPACTS)[number],
          ),
      );
      if (nonBlocking.length > 0) {
        console.log(
          `[a11y info] ${path} has ${nonBlocking.length} non-blocking violation(s):\n` +
            nonBlocking.map((v) => `  - ${v.id} (${v.impact})`).join("\n"),
        );
      }

      expect(
        blocking,
        blocking.length > 0
          ? `WCAG violations on ${path}:\n` +
              blocking
                .map(
                  (v) =>
                    `  - [${v.impact}] ${v.id}: ${v.description}\n` +
                    `    → nodes: ${v.nodes.length}\n` +
                    `    → help: ${v.helpUrl}`,
                )
                .join("\n")
          : undefined,
      ).toEqual([]);
    });
  }
});
