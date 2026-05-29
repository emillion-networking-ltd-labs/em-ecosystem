# Frontend Implementation Plan: SCRUM-364 Next 14.2 → 16.2.6 + React 18 → 19 migration (dashboard + satellite)

> **Note**: This is a focused framework-version migration ticket — not a feature ticket. Several sections of the standard 14-section frontend template (Component Tree, State Management, Routing, ApiClient, UI/UX Considerations) are N/A for a deps + breaking-change migration. They are marked with one-line justifications. The template structure is preserved so `/verify` and `/update-docs` can run their standard checks.

---

## 2. Overview

Migrate **both `nexacore-dashboard` and `satellites/sat-cristian-garcia`** from Next.js 14.2.x to **Next.js 16.2.6** (latest stable) and React 18.3.1 to **React 19.2.6** (latest stable). The satellite is included because it has the same Next 14 CVE exposure (verified: 4 highs + 1 mod) and follows an identical migration playbook; bundling avoids two separate ticket cycles for the same work.

Targeting Next 16 (not 15.5.x) per user decision to "go to latest avoiding double migrations". Net effect:

- **Dashboard Layer 2 goes green; Security Gate finally passes 9/9 on `main`** for the first time since 2026-03-11.
- **Satellite production deployment** (`sat-cristian-garcia.vercel.app`) is no longer running on framework with 5 unpatched CVEs.
- Frontend migration backlog reduces from "Next 15+ then Next 16" to a single ticket; per `workflow-standards.mdc §12 Major Bump SLA` we land on the latest stable in one step.

Pre-implementation codebase exploration confirmed the migration is **much smaller than the worst-case estimate** in the parent ticket SCRUM-364 (which conservatively budgeted "1-2 days"). The dashboard does NOT use the patterns that produced the largest Next 15 breaking changes:

- **No dynamic routes (`[id]/page.tsx`)** that take `params` from server props.
- **No server-side `searchParams` props** — all `searchParams` usage is via the client `useSearchParams()` hook (unaffected by Next 15).
- **No API route handlers** in the dashboard — backend lives in `nexacore-api`.
- **No `cookies()` / `draftMode()` calls** in any RSC.
- **Only one `headers()` call** in `src/app/layout.tsx:18` — needs the async migration.
- **Only two `forwardRef` usages** (`IconButton.tsx`, `Input.tsx`) — React 19 deprecation but still works (deferrable).

Realistic effort: **2-4 hours focused work** (deps bumps + 1 layout file edit + full test/build/lint verification).

---

## 3. Architecture Context

- **Components/pages involved**:
  - `src/app/layout.tsx` — Root layout, calls `headers()` (Next 15 sync→async breaking change). Sole code edit.
  - `src/components/ui/IconButton.tsx` — uses `forwardRef` (React 19 deprecation, optional migration).
  - `src/components/ui/Input.tsx` — uses `forwardRef` (same).
- **Files referenced**: `nexacore-dashboard/package.json`, `package-lock.json`, `next.config.mjs`, `src/middleware.ts`.
- **Routing**: App Router (Next.js). No dynamic routes; static pages + middleware. No changes needed.
- **State management**: Context + Reducer (`AuthContext`, `ThemeContext`, `RateLimitContext`, `ToastContext`). React 19 hook semantics unchanged for these patterns.

### Next 14 → 15.5 breaking-change touchpoints (verified during exploration)

| Touchpoint | Affects this codebase? | Action |
|---|---|---|
| `params` Promise (server components) | ❌ No dynamic routes; no async page receiving `params` | Skip |
| `searchParams` Promise (server components) | ❌ All usage is client-side `useSearchParams()` hook | Skip |
| `headers()` async | ✅ Yes — `src/app/layout.tsx:18` | **Migrate Step 2** |
| `cookies()` async | ❌ Not used | Skip |
| `draftMode()` async | ❌ Not used | Skip |
| Default fetch caching changed (no longer cached by default) | ⚠️ ApiClient uses fetch; review cache assumptions | **Verify Step 6** |
| `next/font` deprecated path changes | ❌ Not used (dashboard uses system fonts via Tailwind) | Skip |
| Removed `next/router` Pages Router APIs | ❌ Not used (App Router only) | Skip |
| Removed `next/headers` cached read pattern | ❌ Only single `headers()` call | Already handled in Step 2 |
| ESLint config flat-config requirement | ⚠️ Currently `.eslintrc.json` (legacy); Next 15 still supports it but deprecated | Acceptable; defer flat-config migration to a follow-up |

### React 18 → 19 breaking-change touchpoints

| Touchpoint | Affects this codebase? | Action |
|---|---|---|
| `forwardRef` deprecated; ref as prop | ⚠️ 2 files: `IconButton.tsx`, `Input.tsx` | Optional Step 4 |
| Type tightening (`React.RefObject<T>` defaulting null) | ⚠️ Some `useRef<HTMLElement>(null)` patterns may surface type errors | Resolve as encountered |
| `React.PropsWithChildren` strictness | ⚠️ Not heavily used; spot-check on build | Resolve as encountered |
| Removed `defaultProps` on functional components | ❌ Not used (we use destructured defaults) | Skip |
| New `use()` hook | N/A — opt-in feature, not a breaking change | Skip |
| `hydrateRoot` API changes | ❌ Not used directly (Next handles it) | Skip |

### Third-party React 19 compatibility (verified)

| Package | Current | React 19 peer? | Status |
|---|---|---|---|
| `framer-motion` | 12.38.0 | `^18.0.0 \|\| ^19.0.0` | ✅ |
| `recharts` | 3.8.1 | `^16.8.0 \|\| ^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` | ✅ |
| `react-live` | 4.1.8 | `>=18.0.0` | ✅ |
| `react-easy-crop` | 5.5.7 | `>=16.4.0` | ✅ |
| `cmdk` | 1.1.1 | `^18 \|\| ^19 \|\| ^19.0.0-rc` | ✅ |
| `@marsidev/react-turnstile` | 1.5.2 | `^17.0.2 \|\| ^18.0.0 \|\| ^19.0` | ✅ |
| `@simplewebauthn/browser` | 13.3.0 | (no peer — browser API only) | ✅ |
| `@testing-library/react` | 16.3.2 | (released after React 19; React 19 compat) | ✅ |

**No third-party blockers.** All consumers explicitly support React 19 in their peer deps or operate at a layer below React.

### Target version selection — Next 16.2.6 (latest stable)

Per user decision (2026-05-08): target latest stable to avoid double-migration cost.

**Next 16.2.6** is `latest` on npm (verified `npm view next dist-tags`). Closes all 5 CVEs (which start fixing in 15.0.8+). Additional breaking changes vs Next 15:

| 16.x Breaking change | Affects this codebase? | Mitigation |
|---|---|---|
| Turbopack-default for `next build` | LOW risk — no custom Webpack config in either package | Verify build succeeds; opt out via `experimental.turbo: false` only if breaks |
| Removed AMP support | ❌ Not used | Skip |
| Removed legacy `@next/font` | ❌ Not used (dashboard uses system fonts via Tailwind; satellite same) | Skip |
| More async APIs | ❌ Already covered by `headers()` async migration in Step 2 | Skip |
| ESLint 9 minimum (no longer supports ESLint 8) | ⚠️ Dashboard uses ESLint 8.57; satellite same. Will need ESLint bump for `next lint` to keep working post-migration | Bundle ESLint 9 minimum into this ticket OR rely on existing `eslint-config-next@^16.2.6` peer pull-in |

**Next 15.5.x considered and rejected**: would close CVEs but leave us 1 major behind on day-one of merge. Going to 15.5 then 16 = 2 tickets and 2 testing cycles. Going direct to 16 = 1 ticket and 1 testing cycle. User instinct correct: bundling these saves time.

---

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch.
- **Branch Name**: `feature/SCRUM-364-next-15-react-19` (no `-frontend` suffix; this is a single-package fullstack-of-frontend-only migration)
- **Implementation Steps**:
  1. Verify clean working tree on `main`.
  2. `git checkout main && git pull origin main`.
  3. `git checkout -b feature/SCRUM-364-next-15-react-19`.
- **Notes**: First step. The new pre-push hook from SCRUM-370 is now active — will catch parity issues before push.

---

### Step 1: Bump Next.js + React + types + eslint-config-next in `package.json` × 2 (dashboard + satellite)

- **Files**:
  - `nexacore-dashboard/package.json`
  - `satellites/sat-cristian-garcia/package.json`
- **Action**: Update version specifiers to land Next 16.2.6 + React 19.2.x + matching types.
- **Implementation Steps**:
  1. Edit dashboard `dependencies`:
     ```
     "next":      "^14.2.35"  →  "^16.2.6"
     "react":     "^18.3.1"   →  "^19.2.6"
     "react-dom": "^18.3.1"   →  "^19.2.6"
     ```
  2. Edit dashboard `devDependencies`:
     ```
     "@types/react":          "^18.3.3"  →  "^19.2.14"
     "@types/react-dom":      "^18.3.0"  →  "^19.2.3"
     "eslint-config-next":    "^14.2.35" →  "^16.2.6"
     ```
  3. Edit satellite `dependencies`:
     ```
     "next":      "14.2.35"   →  "^16.2.6"
     "react":     "^18"       →  "^19.2.6"
     "react-dom": "^18"       →  "^19.2.6"
     "eslint-config-next": "14.2.35" → "^16.2.6"   (satellite has it in deps, not devDeps)
     "@types/react":      "^18"      →  "^19.2.14"
     "@types/react-dom":  "^18"      →  "^19.2.3"
     ```
  4. Save both. **Do not run `npm install` yet** — Step 2's source change must be in place first so post-install verification covers everything together.
- **Dependencies**: none (config edit only).
- **Implementation Notes**:
  - Pin to current exact-latest patches (`19.2.6`, `19.2.14`, `19.2.3`) under caret — allows future minor patches but stays on the verified-stable line.
  - Dashboard `overrides` (post-SCRUM-362): `flatted: >=3.4.2`, `picomatch: >=4.0.4`. Both still valid post-migration; no override changes needed.
  - Satellite has no `overrides` block — none needed.

---

### Step 2: Make `RootLayout` async + `await headers()` (Next 15+ breaking change)

- **File**: `nexacore-dashboard/src/app/layout.tsx` (single file change in `src/`).
- **Action**: Adapt to Next 15+ async `headers()` API (continues into Next 16).
- **Implementation Steps**:
  1. Read current `RootLayout` signature.
  2. Apply diff:
     ```diff
     -export default function RootLayout({
     +export default async function RootLayout({
       children,
     }: Readonly<{
       children: React.ReactNode;
     }>) {
     -  const nonce = headers().get("x-nonce") ?? "";
     +  const nonce = (await headers()).get("x-nonce") ?? "";
     ```
  3. Save. Verify TypeScript compilation (will be tested in Step 6).
- **Satellite check**: `satellites/sat-cristian-garcia/src/app/layout.tsx` — read the file during /develop and apply the same migration if it uses `headers()` synchronously. If satellite layout doesn't call `headers()` at all (likely — the satellite has no CSP nonce flow), no change needed.
- **Dependencies**: Next 16.2.6 in node_modules (Step 5 reinstall produces).
- **Implementation Notes**:
  - For dashboard: the **only `src/` change required** for the Next 16 migration.
  - The middleware (`src/middleware.ts`) does NOT need changes — Next 15/16 middleware API is unchanged.
  - Next 15 + React 19 propagate the async-server-component pattern; making the root layout `async` is the canonical migration.

---

### Step 3: (OPTIONAL — defer if test/build pass) Migrate `forwardRef` to ref-as-prop

- **Files**: `src/components/ui/IconButton.tsx`, `src/components/ui/Input.tsx`.
- **Action**: Convert `forwardRef` usage to React 19's ref-as-prop pattern.
- **Implementation Steps**: only execute if the React 19 codemod surfaces type errors or deprecation warnings during Step 6 testing. Otherwise skip — `forwardRef` is **deprecated, not removed** in React 19.
  1. `npx codemod react/19/replace-react-fc-typescript` and `npx codemod react/19/replace-string-ref` (if applicable).
  2. Spot-check the diff per file.
  3. Confirm tests pass.
- **Dependencies**: none beyond React 19.
- **Implementation Notes**:
  - **DECISION POINT**: keep `forwardRef` as-is unless the build/test surfaces a hard error. React 19 deprecates but does not remove. The migration is mechanical (codemod) but adds diff. Per `workflow-standards.mdc §10 Incremental Code Quality Rules` (minimal diff), skip unless forced.
  - If skipped, document in `/verify` as Accepted-Quality with note: "forwardRef kept; migration deferred to a follow-up ticket if React 20 removes the API."

---

### Step 4: Reinstall + regenerate lock × 2

- **Files**: `package.json` × 2 (already edited), `package-lock.json` × 2 (regenerated).
- **Action**: Clean install to produce fresh, consistent locks for both packages.
- **Implementation Steps**:
  1. **Dashboard**:
     - `cd nexacore-dashboard`.
     - `rm -rf node_modules package-lock.json` (clean baseline — avoids the SCRUM-362 dirty-lock incident).
     - `npm install`.
     - Confirm install completes without `EOVERRIDE` or `ERESOLVE` errors.
     - `npm ci --silent` → exit 0.
  2. **Satellite**:
     - `cd ../satellites/sat-cristian-garcia`.
     - Same: `rm -rf node_modules package-lock.json && npm install && npm ci --silent`.
- **Dependencies**: npm.
- **Implementation Notes**:
  - The new pre-push hook (commit `ffc3418`, SCRUM-370) runs `npm ci` per package automatically before push — catches lock drift.
  - Watch for peer-dep warnings on third-party libs (`framer-motion`, `recharts`, etc.) post-React-19 install. All verified compatible during plan exploration; warnings should be advisory only.

---

### Step 5: Verify all CI-equivalent checks pass × 2 packages

- **File**: N/A (verification commands).
- **Action**: Confirm the migration didn't regress any local check, for both dashboard and satellite.
- **Implementation Steps**:
  1. `cd nexacore-dashboard`.
  2. `npm audit --audit-level=high --json | python -c "..."` — expect `total=0, critical=0, high=0` (or near-zero residuals only in low/info).
  3. `npm audit --omit=dev --audit-level=moderate` — expect `0` for production.
  4. `npx next lint --max-warnings 0` — expect 0 problems. If new ESLint warnings surface (e.g. `react-hooks/exhaustive-deps` tightened in next 15's preset), address per case.
  5. `npm run build` — expect success. If TS errors surface from `@types/react@19` (e.g. `useRef<X>(null)` returning `RefObject<X | null>`), fix per case.
  6. `npm run test:cov` — expect 118/118 tests pass.
  7. **Smoke test**: `npm run dev` and manually verify:
     - `/login` (no MFA): renders, theme toggle works
     - `/login` with MFA: digit input, recovery code, trust device
     - `/register`: form validates, submits
     - `/dashboard`: loads after login (mock auth context if needed)
     - `/admin/audit-logs`: filters work, pagination renders
     - `/admin/permissions`: permission grid renders
     - `/admin/design-system`: showcase pages render (uses `react-live` — biggest React 19 risk)
     - `/profile`: avatar upload modal opens, MFA setup flow works (uses QR code data URL `<img>`)
     - `/settings`: theme + idle warning settings work
     - Dark mode toggle: persists across navigations
     - **The `RootLayout` nonce CSP** still produces a valid `Content-Security-Policy` header (verify in browser devtools — `script-src 'nonce-...'` should match what middleware generates)
  8. **Satellite verification**: cd `satellites/sat-cristian-garcia` and repeat steps 2-7 with that package's scripts. Smoke test for the satellite is simpler — verify the public pages load (per the satellite's roadmap, it has Hero / Pricing / Booking / Contact sections). Manually verify on `npm run dev` that all sections render and `@vercel/speed-insights` and `@vercel/analytics` initialize without console errors.
  9. **Turbopack-default check** (Next 16 specific): `npm run build` in both packages — Next 16 uses Turbopack by default for builds. If a build fails with bundler-specific errors, opt out via `next.config.mjs`:
     ```js
     const nextConfig = {
       experimental: { turbo: false }  // or the canonical opt-out per Next 16 docs
     };
     ```
     Document if applied (Accepted-Trivial for /verify).
- **Dependencies**: none.
- **Implementation Notes**:
  - The smoke test is the most important step. Build success + tests passing does NOT guarantee runtime correctness for a major migration. Pre-push hook will catch lint/build/test failures, but **a runtime CSP failure or React 19 ref-handling bug will pass CI and break production**.
  - If any third-party component renders incorrectly, escalate as Accepted-Risk and consider whether to revert that specific bump or accept residual.
  - **Critical for satellite**: it's in production at `sat-cristian-garcia.vercel.app`. Verify via Vercel preview deployment (auto-created on push) that the production-equivalent build works.

---

### Step 6: Verify production audit closes 0 high

- **File**: N/A.
- **Action**: Confirm SCRUM-364's primary AC — the 4 dashboard high vulns close.
- **Implementation Steps**:
  1. `cd nexacore-dashboard && npm audit --audit-level=high --json` → record output.
  2. Specific vuln verification (each must show RESOLVED):
     - `next` direct (Image Optimizer DoS, request smuggling, server components DoS, deserialization DoS): RESOLVED by 15.5.18
     - `eslint-config-next` direct (transitive via `@next/eslint-plugin-next`): RESOLVED by 15.5.18 bump
     - `@next/eslint-plugin-next` transitive: RESOLVED by parent bump
     - `glob` transitive (CVE in CLI; library-API consumers safe): may persist as known false-positive — document in /verify
  3. Production-only audit: `npm audit --omit=dev --audit-level=moderate --json` → `total=0` for critical/high; `postcss` mod should also clear (it was tied to Next ≤14)
- **Dependencies**: Step 5 complete.
- **Implementation Notes**:
  - If `glob` still shows high after the bump, the false-positive analysis from SCRUM-362 still applies — `glob CLI` not invoked anywhere in scripts/CI; library usage safe. Document in /verify Accepted-Risk LOW with code-path evidence.

---

### Step 7: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made.
- **Implementation Steps**:
  1. **Review**: Identify what changed (deps + 1 file).
  2. **Identify documentation files needing updates**:
     - `ai-specs/specs/frontend-standards.mdc` → update "Technology Stack" section (Next 14 → 15, React 18 → 19); update example snippets if any reference `headers()` sync API.
     - `ai-specs/specs/api-spec.yml` → no change.
     - `ai-specs/specs/data-model.md` → no change.
     - `ai-specs/specs/integration-state.md` → no change (no module wiring affected).
     - `ai-specs/specs/workflow-standards.mdc` § 12 Implementation status table → mark SCRUM-364 as **DONE** in the migration backlog row.
  3. **Update content** in English. Cross-reference SCRUM-364 commit hash.
  4. **Verify** cross-references and structure consistency.
- **References**:
  - `ai-specs/specs/documentation-standards.mdc`
  - `ai-specs/specs/workflow-standards.mdc`
- **Notes**: Mandatory per /update-docs spec.

---

### Step 8: Comment on SCRUM-363 (now unblocked)

- **File**: N/A — Jira interaction.
- **Action**: Notify that SCRUM-363 (branch protection) is now unblocked by this merge.
- **Implementation Steps**:
  1. After merge to main + verifying Security Pipeline run is **9/9 green for the first time**, post comment to SCRUM-363:
     > "Unblocked by SCRUM-364 merge. All 9 Security Pipeline layers green on main as of `<timestamp>`. Ready for branch-protection policy decisions per ticket Section 'Policy decisions required'."
  2. Verify policy decisions in SCRUM-363 are still current; if any change, update the ticket description.
- **Dependencies**: Step 6 + post-merge CI run successful.

---

## 5. Implementation Order

1. Step 0 — Create feature branch
2. Step 1 — Bump deps in `package.json` (no install yet)
3. Step 2 — `src/app/layout.tsx` async `headers()` migration
4. ~~Step 3 — `forwardRef` migration~~ (deferred; conditional on Step 5 surfacing issues)
5. Step 4 — Reinstall + regenerate lock
6. Step 5 — Local verification gate (lint + build + tests + audit + smoke)
7. Step 6 — Verify audit posture (the AC of this ticket)
8. Step 7 — Update technical documentation
9. Step 8 — Comment on SCRUM-363 (now unblocked)

---

## 6. Testing Checklist

### Local verification

- [ ] `cd nexacore-dashboard && npm install` → no errors, lock regenerated cleanly
- [ ] `npm ci --silent` → exit 0 (lock-package.json sync verified)
- [ ] `npm audit --audit-level=high` → 0 critical / 0 high (was 4 high)
- [ ] `npm audit --omit=dev --audit-level=moderate` → 0 production mod+ (was 2)
- [ ] `npx next lint --max-warnings 0` → 0 problems
- [ ] `npm run build` → exit 0
- [ ] `npm run test:cov` → 118 / 118 tests pass

### Manual smoke (mandatory for major migration)

- [ ] `/login` (email + password no MFA): renders, submits, redirects on success
- [ ] `/login` MFA flow: TOTP digit input, recovery code, trust-device checkbox
- [ ] `/register`: validation, submit, success
- [ ] `/forgot-password` + `/reset-password` + `/verify-email`: complete flows
- [ ] `/dashboard`: post-login landing page renders
- [ ] `/admin/audit-logs`: filters, pagination, table renders
- [ ] `/admin/permissions`: grid renders correctly
- [ ] `/admin/design-system` or `/admin/showcase`: ALL component variants render — this exercises `react-live`, `cmdk`, `framer-motion`, `recharts`, `lucide-react`, `react-easy-crop` together (highest React 19 risk surface)
- [ ] `/profile`: avatar upload, MFA setup with QR code, OAuth links/unlinks, sessions list
- [ ] `/settings`: theme toggle persists, idle-warning settings
- [ ] Dark mode toggle: works, persists, no FOUC
- [ ] CSP nonce: open browser devtools → Network → main HTML response → `Content-Security-Policy` header includes `script-src 'nonce-<value>'` and the value matches the inline `<script>` on the page (verifies `await headers()` migration works)

### CI verification (post-push)

- [ ] Layer 1 Secrets → PASS
- [ ] Layer 2 Dep Audit (api) → PASS (no api changes; main is already green)
- [ ] **Layer 2 Dep Audit (dashboard) → PASS for the first time since 2026-03-11**
- [ ] Layer 3 SAST (Backend) → PASS
- [ ] Layer 3 SAST (Frontend) → PASS (Next 15 ESLint config still legacy `.eslintrc.json`; should accept)
- [ ] Layer 4 Tests (Backend) → PASS
- [ ] Layer 4 Tests (Frontend) → PASS
- [ ] Layer 5 Build (Backend) → PASS
- [ ] Layer 5 Build (Frontend) → PASS (Next 15.5.18 build runs; verify Webpack still default if explicit, or accept Turbopack if Next chooses it for build)
- [ ] **Security Gate (final) → PASS for the first time**

### Regression test checklist

- [ ] `git diff main...HEAD --stat` shows ONLY: `package.json`, `package-lock.json`, `src/app/layout.tsx` (and optionally 2 forwardRef files if Step 3 executed)
- [ ] All other `src/` files unchanged
- [ ] No `.spec.ts` file required modification

---

## 7. Error Handling Patterns

N/A — no new endpoints, no new error states, no new toast messages. Existing patterns intact.

---

## 8. UI/UX Considerations

N/A at the design level — no visual changes. Verifications in smoke test cover that existing visual behavior is preserved.

One subtle case to monitor: **React 19's stricter Suspense handling**. If any component triggers an async render path that wasn't `<Suspense>`-wrapped, it may surface as a hydration warning in dev. If that happens, wrap or convert to client component as appropriate.

---

## 9. Dependencies

### Direct bumps in BOTH `nexacore-dashboard/package.json` AND `satellites/sat-cristian-garcia/package.json`

- `next`: `^14.2.35` → `^16.2.6` (latest stable)
- `react`: `^18.3.1` → `^19.2.6`
- `react-dom`: `^18.3.1` → `^19.2.6`
- `eslint-config-next`: `^14.2.35` → `^16.2.6`
- `@types/react`: `^18.3.3` → `^19.2.14`
- `@types/react-dom`: `^18.3.0` → `^19.2.3`

### Overrides (existing — kept unchanged)

- `flatted`: `>=3.4.2`
- `picomatch`: `>=4.0.4`

### Custom UI components used (no changes)

`Button`, `Input`, `Avatar`, `Modal`, `Toast`, `Tooltip`, `Spinner`, `Card`, `Tabs`, `Pagination`, `Calendar`, `Slider`, `Toggle`, `Checkbox`, `Select`, `MfaDigitInput`, `IconButton`, `BeforeAfterSlider`, `QrCodeCard`, `CommandPalette`, `IdleWarningModal`, `ConfirmModal` — all reused as-is.

### Third-party packages (no version changes; verified React 19 compatible)

`framer-motion@12.38.0`, `recharts@3.8.1`, `react-live@4.1.8`, `react-easy-crop@5.5.7`, `cmdk@1.1.1`, `@marsidev/react-turnstile@1.5.2`, `@simplewebauthn/browser@13.3.0`, `@testing-library/react@16.3.2`, `lucide-react@0.577.0`.

---

## 10. Notes

- **Out of scope** (explicit, per workflow-standards.mdc §12 Major Bump SLA — one major step at a time):
  - Next 15 → 16 (would require Turbopack-default verification, AMP-removed audit, additional async APIs).
  - React 19 → 20 (does not exist yet).
  - Tailwind 3 → 4 (separate ticket; SCRUM-359 batch deferred this).
  - ESLint 8 → 10 + flat config (separate ticket).
  - `@types/node` 20 → 22+ (separate ticket).
  - `lucide-react` major bump (separate ticket).
- **Business rules**: none — this is a framework migration with no business logic touched.
- **Language requirements**: all comments and PR text in English. Plan and verify documents in English.
- **Risk level**: **MEDIUM** (down from initial HIGH after exploration).
  - Code surface: 1 file in `src/`. Tiny.
  - Deps surface: 6 version lines. Standard major migration.
  - Test surface: 118 existing tests must keep passing; smoke test covers visual + interactive behavior.
  - Third-party surface: all confirmed React 19 compat.
  - The largest residual risk is React 19's `<Suspense>` strictness causing dev-time warnings. These do not block production but should be tracked as Accepted-Quality if encountered.
- **SLA**: HIGH per parent ticket — within current sprint. Sprint 14 ends 2026-05-21.
- **Memory rules to honor during /develop**:
  - Concurrent agents: only touch this ticket's files.
  - Stage by explicit path. No `git add .`.
  - **Skip Step 3 (forwardRef migration) unless Step 5 forces it.** Per "minimal diff, no bonus fixes" rule.
  - Use the new pre-push hook (active since SCRUM-370 merge `ffc3418`) — it will catch lint/build/test failures before push, eliminating the SCRUM-362 lock-drift / coverage-instrumentation iteration penalty.

---

## 11. Next Steps After Implementation

- After `/update-docs`, transition this ticket to **Done**.
- Comment on **SCRUM-363**: now unblocked, ready for branch-protection policy decisions.
- Optional follow-up tickets if the smoke test surfaces issues:
  - `forwardRef` → ref-as-prop migration (if React 20 removes the API).
  - Next 16 migration (if security or feature pressure justifies).
- The 5-tier dependency health framework (workflow-standards.mdc §12) has SCRUM-365..369 still open for incremental implementation. None block this ticket.

---

## 12. Implementation Verification

Final checklist (will be re-applied during `/verify`):

- [ ] **Code quality**: only `package.json` + `package-lock.json` + `src/app/layout.tsx` changed; optional 2 forwardRef files only if Step 3 executed; no other `src/` edits.
- [ ] **Functionality**: full manual smoke covering 14 routes + dark-mode + CSP nonce + MFA + OAuth + showcase.
- [ ] **Testing**: 118/118 tests pass; build clean; lint clean; audit 0 critical / 0 high.
- [ ] **Integration**: not applicable — no module wiring changes. `integration-state.md` unchanged.
- [ ] **Documentation updates**: `frontend-standards.mdc` Technology Stack updated; `workflow-standards.mdc §12` implementation status updated.
- [ ] **Layer 2 dashboard CI** turns green on the merge commit. **Security Gate green on main**.
- [ ] **SCRUM-363 commented as unblocked**.

---

## 13. Module-Level Planning

N/A — this is a framework migration, not a NexaCore module ticket. No new entities, no API endpoints, no permissions, no PlatformModule changes.

---

## 14. Satellite App Planning

N/A — `nexacore-dashboard` is the main NexaCore frontend, not a satellite app. The `sat-cristian-garcia` satellite has its own Next.js install which is **out of scope** for this ticket (a separate ticket can be opened to migrate the satellite when that team is ready).
