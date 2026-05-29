# Frontend Implementation Plan: SCRUM-381 (reduced scope) — Pre-freeze AUTH cleanup

## 2. Overview

SCRUM-381 originally bundled 6 tech-debt issues. After state-check (2026-05-12):
- **Issue 4 RESOLVED** (em-icon aspect-ratio) — already shipped in chore PR #299.
- **Issues 5 + 6 deferred** (CI infra + React 19 layout) — NOT auth-specific, will be tracked separately.
- **Issues 1 + 2 + 3** retained — all AUTH-direct, fit "pre-freeze AUTH cleanup" directive.

This plan covers the reduced scope (3 issues).

## 3. Architecture Context

**Issue 1 — RSC 'Functions cannot be passed' boundary** (AUTH-direct, all public auth routes):
- Server Component → Client Component boundary somewhere in `RootLayout → Providers → (page) → GuestRoute → AuthLayout → Suspense → LoginForm` chain.
- Likely candidates investigated via static analysis (deeper investigation may need live browser repro).
- Affects: all public auth routes (/login, /register, /forgot-password, /reset-password, /verify-email, /password-reset/check-email, /activation/check-email).

**Issue 2 — NEXT_PUBLIC_VRT_BYPASS_AUTH scope** (AUTH-direct):
- `nexacore-dashboard/src/context/AuthContext.tsx` honors the env var unconditionally at AUTH_INIT.
- When set, public routes (/login etc.) auto-redirect to /dashboard because the mock SafeUser is dispatched immediately.
- Goal: gate the bypass dispatch behind a check that the current pathname is a post-auth route.

**Issue 3 — color-contrast a11y rule re-enable** (AUTH-direct):
- `nexacore-dashboard/tests/e2e/a11y.spec.ts` and `satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts` disable `color-contrast` via `.disableRules(['color-contrast'])`.
- Tailwind 4 color resolution surfaced contrast violations on auth forms.
- Goal: identify violations, apply contrast bumps that preserve TW3 visual baseline within tolerance, re-enable rule.

## 4. Implementation Steps

### Step 0 — Feature branch from latest main

```bash
git checkout main && git pull origin main
git checkout -b feature/SCRUM-381-frontend
```

### Step 1 — Issue 2: refactor VRT_BYPASS_AUTH scope

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

**Current behavior**: at module init, if `process.env.NEXT_PUBLIC_VRT_BYPASS_AUTH === '1'`, dispatch `AUTH_SUCCESS` with mock SUPERADMIN unconditionally. This triggers redirect on any GuestRoute-protected page (login, register, etc.).

**New behavior**: only dispatch the mock when the current pathname is NOT a public auth route. Implementation approach:

```typescript
// In AuthProvider, when VRT_BYPASS_AUTH=1:
//   - Read current pathname (window.location.pathname)
//   - If pathname matches /login, /register, /forgot-password, /reset-password,
//     /verify-email, /password-reset/*, /activation/*, /auth/callback → SKIP bypass
//   - Otherwise → dispatch AUTH_SUCCESS with mock SafeUser (for /dashboard, /profile, /settings, /admin/*)
```

**Verification**:
- With `NEXT_PUBLIC_VRT_BYPASS_AUTH=1`, navigate to `/login` → page renders form (no redirect).
- With `NEXT_PUBLIC_VRT_BYPASS_AUTH=1`, navigate to `/dashboard` → mock user logged in.
- Without the env var, behavior unchanged (current production path).

### Step 2 — Issue 1: locate + fix RSC boundary

**Investigation approach** (no live dev server required initially):

1. **Static review** of RSC boundaries in auth render chain:
   - `RootLayout` (server) → passes `nonce`, `children`. `nonce` is string. `children` is JSX. ✓
   - `Providers` (client) → wraps with ThemeProvider/ToastProvider/AuthProvider/PermissionsProvider. ✓
   - `LoginPage` etc. (server, NO 'use client') → renders `<GuestRoute><AuthLayout><Suspense><LoginForm/></Suspense></AuthLayout></GuestRoute>`. ✓ — all JSX children.
   - `error.tsx` files (client) → receive `error` + `reset` from Next framework. ✓ — framework-handled.

2. **Suspicious patterns to grep**:
   - Default function prop values that survive serialization (e.g., `prop = () => {}`).
   - Props with type `() => void` declared in server component that wrap a client component.
   - `useCallback`/`useMemo` returned from a server-callable path.

3. **If static review surfaces candidate**: apply fix per Next.js doc (`'use server'` action, restructure, or lift to client).

4. **If static review inconclusive**: timebox 30 min. Document attempt in /verify. Open follow-up sub-ticket for live debugging (Issue 1 alone). This is **acceptable** per pre-freeze directive: we documented but don't block on a heisenbug.

### Step 3 — Issue 3: re-enable color-contrast rule

**Files**:
- `nexacore-dashboard/tests/e2e/a11y.spec.ts` — remove `.disableRules(['color-contrast'])`
- `satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts` — same

**Investigation**:
1. Run `npm run test:e2e -- a11y.spec.ts` locally WITH the rule enabled.
2. Capture all violations: each one will name element + current contrast ratio.
3. Decide remediation per violation:
   - If violation is on `text-content-tertiary` opacity-based class → bump opacity (e.g., `0.55` → `0.65`) only on auth-page contexts, or use a dedicated `text-auth-helper` class with stronger ratio.
   - If on a specific component → adjust within that component only (no global token change to preserve TW3 visual elsewhere).

**Constraint per pre-freeze directive**: minimal visual diff. Each contrast bump must keep the change under VRT 0.2% diff threshold OR be explicitly accepted as design adjustment.

**Re-enable rule** only when 0 violations remain.

### Step 4 — Cleanup fixtures

**Files**:
- `nexacore-dashboard/tests/e2e/fixtures/no-console-errors.ts` — remove allowlist entries for Issue 1 (RSC) and Issue 2 (VRT bypass) ONLY IF those issues are fully resolved.
- `satellites/sat-cristian-garcia/tests/e2e/fixtures/no-console-errors.ts` — same.

If Issue 1 deferred to sub-ticket: leave its allowlist entry, update the comment to reference the new sub-ticket.

### Step 5 — Smoke test + lint + build

```bash
cd nexacore-dashboard
npm run dev  # verify /login renders + check console for RSC error
npm run lint
npm run build
```

### Step 6 — Update technical documentation

- Update `audit-standards.mdc` if the VRT_BYPASS_AUTH scope refactor changes the test-harness pattern documented there.
- No `integration-state.md` changes expected (no module-level changes).

## 5. Implementation Order

1. Step 0: branch
2. Step 1: VRT_BYPASS_AUTH refactor (lowest-risk, static, easy to verify)
3. Step 3: color-contrast investigation + fix
4. Step 2: RSC boundary investigation (timeboxed 30 min static, then defer if needed)
5. Step 4: fixture cleanup (conditional on Issues 1, 2, 3 outcomes)
6. Step 5: lint + build + smoke
7. Step 6: docs

## 6. Testing Checklist

- [ ] `NEXT_PUBLIC_VRT_BYPASS_AUTH=1 npm run dev` + curl /login → 200 with form HTML (no redirect)
- [ ] Same env + curl /dashboard → 200 with mock-authed render
- [ ] `npm run test:e2e -- a11y.spec.ts` PASS with color-contrast rule ENABLED
- [ ] Same for satellite a11y spec
- [ ] If Issue 1 fixed: browser DevTools console on /login fresh load → 0 "Functions cannot be passed" errors
- [ ] `npm run lint` 0 errors
- [ ] `npm run build` clean
- [ ] Allowlist entries removed for issues actually resolved (kept for deferred ones)

## 9. Dependencies

None new. All work uses existing libraries.

## 10. Notes

- **Pre-freeze AUTH cleanup**: scope strict to AUTH-direct improvements. No new features, no token-system overhaul, no refactor of unrelated code.
- **Issue 1 timebox**: if static analysis fails to find RSC boundary in ~30 min, document attempt in `/verify` as Accepted-Quality deviation + open follow-up sub-ticket. Pre-freeze directive favors closing what can be closed cleanly over heroic debugging.
- **Visual preservation**: any color/opacity bumps for Issue 3 must keep VRT diff under threshold. Run probe locally before committing.

## 11. Next Steps After Implementation

1. `/verify SCRUM-381` — quality gate.
2. `/commit SCRUM-381` — PR + merge.
3. `/update-docs SCRUM-381` — record + ai-specs sync.
4. Continue with SCRUM-352 (next in pre-freeze AUTH cleanup queue).

## 12. Implementation Verification

- [ ] Each of Issues 1, 2, 3 has a clear DONE / DONE-DEVIATED / DEFERRED resolution.
- [ ] Allowlist entries match resolution state (removed = resolved, kept = deferred).
- [ ] No new console warnings introduced.
- [ ] No visual regression on auth pages (VRT under threshold).
- [ ] Builds + lints clean.
