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
  // CI has no backend running; the auth context's optional CSRF token
  // fetch fails with TypeError: Failed to fetch and retries. Expected
  // in CI — auto-blocking on this would require booting nexacore-api in
  // every PR run, which is too heavy for VRT scope.
  /Error fetching CSRF token: TypeError: Failed to fetch/i,
  /TypeError: Failed to fetch/i,
  // Same family — browser-level network error for the failed backend
  // requests that don't reach AuthContext's catch block.
  /Failed to load resource: net::ERR_CONNECTION_REFUSED/i,
  // Generic resource load failures from missing CI backend (any 4xx/5xx).
  /Failed to load resource: the server responded with a status of \d+/i,
  // React 19 added a runtime warning about <script> tags inside React
  // component trees. We use one in layout.tsx (THEME_INIT_SCRIPT for
  // FOUC prevention) — intentional pattern, also used by next-themes.
  // SCRUM-381 may revisit using the dangerouslySetInnerHTML+template
  // approach if the warning becomes a real defect signal.
  /Encountered a script tag while rendering React component/i,
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
