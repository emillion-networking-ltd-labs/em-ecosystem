import { test as base, expect } from "@playwright/test";

/**
 * Playwright fixture that fails any test whose page emitted a browser
 * `console.error` or `console.warning` it didn't allowlist.
 *
 * SCRUM-380: this is the gate that would have caught the recharts
 * `width(-1) height(-1)` warning, the Next/Image em-icon aspect-ratio
 * warning, and any future hydration / framework warnings BEFORE merge.
 *
 * Allowlist:
 *  - Next.js dev-mode informational logs (Hot reload, etc.)
 *  - The middleware -> proxy deprecation (tracked separately as a known
 *    Next 16 -> 17 forward-compat marker; will be done in its own ticket).
 *
 * Anything else fails the test with a message that includes every
 * captured console line so the diff is actionable.
 */
const ALLOWLIST: RegExp[] = [
  // Next dev-mode hot-reload chatter (not a regression signal)
  /\[Fast Refresh\]/i,
  /\[HMR\]/i,
  // Next 16 -> 17 forward-compat marker; tracked as a separate ticket
  /middleware.*deprecated.*proxy/i,
  // SCRUM-381 (TODO ticket): pre-existing RSC violation surfaced by this
  // gate. Some Server Component is passing a function prop to a Client
  // Component. Real bug to fix; allowlisted for now so the gate can ship
  // without blocking the SCRUM-380 PR. Remove this entry when SCRUM-381
  // fixes the underlying RSC violation.
  /Functions cannot be passed directly to Client Components/i,
  // CI has no backend running; the auth context's optional CSRF token
  // fetch fails with TypeError: Failed to fetch and retries. Expected
  // in CI — auto-blocking on this would require booting nexacore-api in
  // every PR run, which is too heavy for VRT scope.
  /Error fetching CSRF token: TypeError: Failed to fetch/i,
  /TypeError: Failed to fetch/i,
  // Same family — browser-level network error for the failed backend
  // requests that don't reach AuthContext's catch block.
  /Failed to load resource: net::ERR_CONNECTION_REFUSED/i,
  // Pre-existing Next/Image aspect-ratio warning on /em-icon.png.
  // Reverted SCRUM-279's `style` workaround because it broke VRT diff.
  // Real fix (set the image's intrinsic aspect or use a wrapper) tracked
  // under SCRUM-381.
  /Image with src ".*em-icon.*" has either width or height modified/i,
];

function isAllowlisted(text: string): boolean {
  return ALLOWLIST.some((re) => re.test(text));
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error" && msg.type() !== "warning") return;
      const text = msg.text();
      if (isAllowlisted(text)) return;
      violations.push(`[${msg.type()}] ${text}`);
    });
    page.on("pageerror", (err) => {
      violations.push(`[pageerror] ${err.message}`);
    });

    await use(page);

    if (violations.length > 0) {
      throw new Error(
        `Browser console emitted ${violations.length} unallowlisted error/warning(s):\n` +
          violations.map((v, i) => `  ${i + 1}. ${v}`).join("\n"),
      );
    }
  },
});

export { expect };
