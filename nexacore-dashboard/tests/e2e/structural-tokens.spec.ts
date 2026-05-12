// Structural design-token probe — workflow-standards.mdc §13.7.4 enforcement (SCRUM-396).
//
// Purpose:
//   Catch the three TW3→TW4 regression patterns at CI time, BEFORE merge,
//   independently of pixel VRT (which has the "uniform-baseline-captures-
//   uniform-bug" blind spot proven by SCRUM-396).
//
// What this probe asserts:
//   §13.7.1 Rule A — `--color-*` overrides in .dark / .light cascade re-resolve
//                    correctly for utility classes (bg-surface-inverse,
//                    text-content-inverse). No `@theme` indirection-bake.
//   §13.7.2 Rule B — `--color-error` is a VALID color literal (not the TW3
//                    "channels" form like `138 17 17`, not invalid via self-
//                    reference).
//   §13.7.3 Rule C — Circle button (w-9!/h-9!) survives cascade vs size-md
//                    (h-10). Width === height === 36 in both light and dark.
//
// Runs against /login (public route — no auth bypass required).

import { test, expect } from "@playwright/test";

function colorIsValid(value: string): boolean {
  if (!value) return false;
  if (value === "inherit" || value === "initial" || value === "unset") return false;
  // "138 17 17" (channels only, no rgb/rgba wrapper) is INVALID for `color:` consumers.
  // Valid forms: rgb(...), rgba(...), #hex, hex8, hsl(...), oklch(...), named colors.
  if (/^\d+\s+\d+\s+\d+\s*$/.test(value.trim())) return false;
  return true;
}

test.describe("Structural design-token probe (§13.7.4)", () => {
  test("§13.7.1 Rule A — dark wrapper inverts surface/content utilities", async ({ page }) => {
    await page.goto("http://localhost:3001/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
      // Inject probe DOM with both .light and .dark wrappers + buttons using
      // the same utility classes as Button.tsx primary variant.
      const utilities = "bg-surface-inverse text-content-inverse border border-border-components";

      const wrap = (ctx: string) => {
        const wrapper = document.createElement("div");
        wrapper.className = ctx;
        wrapper.innerHTML = `<button class="${utilities}" data-probe="primary">P</button>`;
        document.body.appendChild(wrapper);
        const btn = wrapper.querySelector("button")!;
        const cs = getComputedStyle(btn);
        const out = {
          ctx,
          bg: cs.backgroundColor,
          color: cs.color,
          colorSurfaceInverse: cs.getPropertyValue("--color-surface-inverse").trim(),
          colorContentInverse: cs.getPropertyValue("--color-content-inverse").trim(),
        };
        wrapper.remove();
        return out;
      };

      return {
        light: wrap("light"),
        dark: wrap("dark"),
      };
    });

    // Light and dark MUST resolve to DIFFERENT computed values for surface-inverse.
    // If they're equal, the @theme indirection bake bug is back.
    expect(result.light.bg).not.toBe(result.dark.bg);
    expect(result.light.color).not.toBe(result.dark.color);

    // --color-surface-inverse must also differ between wrappers (utility-variable level).
    expect(result.light.colorSurfaceInverse).not.toBe(result.dark.colorSurfaceInverse);
    expect(result.light.colorContentInverse).not.toBe(result.dark.colorContentInverse);
  });

  test("§13.7.2 Rule B — --color-error resolves to valid color in light and dark", async ({ page }) => {
    await page.goto("http://localhost:3001/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
      const wrap = (ctx: string) => {
        const wrapper = document.createElement("div");
        wrapper.className = ctx;
        wrapper.innerHTML = `<span class="text-error" data-probe="error">E</span>`;
        document.body.appendChild(wrapper);
        const span = wrapper.querySelector("span")!;
        const cs = getComputedStyle(span);
        const out = {
          ctx,
          // raw token (also used inline as `var(--color-error)` in some legacy spots)
          rawToken: cs.getPropertyValue("--color-error").trim(),
          // actual resolved color of text-error utility
          resolvedColor: cs.color,
        };
        wrapper.remove();
        return out;
      };
      return { light: wrap("light"), dark: wrap("dark") };
    });

    // raw token must be a valid CSS color value (not channels-only "138 17 17")
    for (const ctx of ["light", "dark"] as const) {
      expect(
        /^\d+\s+\d+\s+\d+\s*$/.test(result[ctx].rawToken),
        `${ctx}: --color-error must NOT be channels-only form (got "${result[ctx].rawToken}")`,
      ).toBe(false);

      expect(
        result[ctx].rawToken.length,
        `${ctx}: --color-error must be non-empty`,
      ).toBeGreaterThan(0);
    }

    // resolved color must be a red-ish value (not currentColor inheritance fallback)
    // We don't enforce exact value (light=#8a1111 vs dark=#ef4444), just that the
    // resolved color is the SAME shape both contexts (rgb function) and not the
    // surrounding inherited content color.
    for (const ctx of ["light", "dark"] as const) {
      expect(result[ctx].resolvedColor).toMatch(/^rgb/);
    }
    // light and dark must produce DIFFERENT error reds (different value per theme)
    expect(result.light.resolvedColor).not.toBe(result.dark.resolvedColor);
  });

  test("§13.7.3 Rule C — Circle button override (!w-9!/!h-9!) wins cascade vs sizeMd h-10", async ({ page }) => {
    await page.goto("http://localhost:3001/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
      // Replicate the exact className that ComponentShowcase produces for Circle buttons:
      //   ${baseClass} ${variantClasses.primary} ${sizeClasses.md} ${circleOverride}
      // sizeClasses.md includes `h-10` (40px) and `px-6 py-2.5` (which would expand vertical padding too).
      // circleOverride is `rounded-full! px-0! w-9! h-9! min-w-0!` and must WIN cascade.
      const baseClass = "relative items-center justify-center gap-2 whitespace-nowrap";
      const primary = "bg-surface-inverse text-content-inverse border border-border-components";
      const sizeMd = "px-6 py-2.5 text-body font-normal rounded-md h-10";
      const circle = "rounded-full! px-0! w-9! h-9! min-w-0!";
      const fullClass = `inline-flex ${baseClass} ${primary} ${sizeMd} ${circle}`;

      const wrap = (ctx: string) => {
        const wrapper = document.createElement("div");
        wrapper.className = ctx;
        wrapper.innerHTML = `<button class="${fullClass}">15</button>`;
        document.body.appendChild(wrapper);
        const btn = wrapper.querySelector("button")!;
        const cs = getComputedStyle(btn);
        const out = { ctx, width: cs.width, height: cs.height, borderRadius: cs.borderRadius };
        wrapper.remove();
        return out;
      };
      return { light: wrap("light"), dark: wrap("dark") };
    });

    for (const ctx of ["light", "dark"] as const) {
      expect(result[ctx].width, `${ctx}: circle width must be 36px (w-9 wins)`).toBe("36px");
      expect(result[ctx].height, `${ctx}: circle height must be 36px (h-9! wins over h-10)`).toBe("36px");
      // rounded-full is 100px in our theme — must not fall back to rounded-md (6px)
      expect(result[ctx].borderRadius).toMatch(/^(100px|9999px)$/);
    }
  });
});
