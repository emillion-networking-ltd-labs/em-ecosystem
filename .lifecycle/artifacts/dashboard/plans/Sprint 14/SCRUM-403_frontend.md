# Frontend Implementation Plan: SCRUM-403 — Empty/error/loader states in 4 AUTH profile components

## 2. Overview

Replace inline `<p>` empty/error/loader patterns with design-system primitives (`<EmptyState>`, `<Spinner>`) in the 4 AUTH profile components: ActiveSessions, TrustedDevices, PasskeyManager, SecurityActivity. **9 instances** scoped (4 empty + 1 error + 4 loaders/verifications). Uses the `variant="error"` shipped in SCRUM-408 for the error path.

This is **B1 of SCRUM-352** (Audit Loading & Empty States Phase A). The fixes apply the canonical patterns §0.1-0.5 documented in `ui-design-system.md` (added by SCRUM-352).

**AUTH directness**: all 4 components are AUTH-related (sessions, MFA trusted devices, WebAuthn passkeys, security events). High-impact on the AUTH stabilization track.

Architecture principles:
- **Design system compliance**: every empty/error/loader rendering uses the documented primitive (§36 EmptyState, §0.3 Spinner rules). No inline `<p>` text for primary states.
- **Visual continuity**: copy strings preserved (or refined for clarity within the canonical pattern). Same recovery actions, same icons where contextually correct.
- **Backward compat at action level**: existing Trust/Add Passkey/Retry flows + modals unchanged — only the visual container moves into `<EmptyState action={...}>`.

## 3. Architecture Context

**Files affected**:
- `nexacore-dashboard/src/components/profile/ActiveSessions.tsx` — refactor empty (line 294-295) + loader (line 281-291)
- `nexacore-dashboard/src/components/profile/TrustedDevices.tsx` — refactor empty (line 225-230) + verify loader size (line 217-223)
- `nexacore-dashboard/src/components/profile/PasskeyManager.tsx` — refactor empty (line 316-322) + verify loader size (line 307-313)
- `nexacore-dashboard/src/components/profile/SecurityActivity.tsx` — refactor empty (line 152-154) + error (line 147-149) + verify loader (line 139-145)

**Dependencies (read-only)**:
- `<EmptyState>` API (from SCRUM-408 — `variant="default"` + `variant="error"` supported)
- `<Spinner>` size scale (sm 16px / md 24px / lg 32px per §0.3)
- lucide-react icons: `Smartphone`, `ShieldCheck`, `Key`, `Activity` (stable v1)
- Canonical patterns: `ui-design-system.md` §Loading-Empty-Error-Patterns

**Component registry impact**: none — only consumer-side refactor, no new primitives.

**State management**: unchanged — components keep `loading`, `loadError`, `events`, `devices`, `passkeys`, `sessions` state. Only the render branches change.

## 4. Implementation Steps

### Step 0 — Feature branch from latest main

```bash
git checkout main
git pull origin main
git checkout -b feature/SCRUM-403-frontend
```

### Step 1 — Refactor ActiveSessions.tsx (instances #1 + #2)

- **File**: `nexacore-dashboard/src/components/profile/ActiveSessions.tsx`
- **Imports to ensure**: `EmptyState` from `@/components/ui/EmptyState`, `Spinner` from `@/components/ui/Spinner`, `Smartphone` (likely already imported per lucide usage in the file).
- **Loader (line 281-291)**:
  - Replace inline `<p>Loading sessions...</p>` pattern with `<div className="flex justify-center py-8"><Spinner size="lg" aria-label="Loading sessions" /></div>` (or equivalent centered container).
- **Empty (line 294-295)**:
  - Replace `<p className="py-4 text-center text-body text-content-tertiary">No active sessions found.</p>` with:
    ```tsx
    <EmptyState
      icon={<Smartphone size={48} />}
      title="No active sessions"
      description="Sign in on another device to see it here."
    />
    ```
- **Implementation notes**: preserve surrounding conditional structure (`{loading ? <loader/> : sessions.length === 0 ? <empty/> : <list/>}`).

### Step 2 — Refactor TrustedDevices.tsx (instances #3 + #4)

- **File**: `nexacore-dashboard/src/components/profile/TrustedDevices.tsx`
- **Imports to add**: `EmptyState` from `@/components/ui/EmptyState`, `ShieldCheck` from `lucide-react`.
- **Loader (line 217-223, instance #3)**:
  - Current: `<Spinner size="md" />` centered via container.
  - Verify per §0.3 — section loader for unknown layout should be `size="lg"`. Bump if applicable. If the existing layout is intentionally compact (because TrustedDevices area is small), keep `md` and document as Accepted-Trivial in `/verify`.
- **Empty (line 225-230, instance #4)**:
  - Replace inline `<p>No trusted devices...</p>` + adjacent `<Button>Trust this device</Button>` with:
    ```tsx
    <EmptyState
      icon={<ShieldCheck size={48} />}
      title="No trusted devices"
      description="When you log in with MFA and trust this device, it appears here."
      action={<Button onClick={openTrustModal}>Trust this device</Button>}
    />
    ```
- **Implementation notes**: the existing button flow (opens TrustModal) is preserved; just move the JSX into `action` prop. Identify the existing onClick handler from the current button and reuse.

### Step 3 — Refactor PasskeyManager.tsx (instances #5 + #6)

- **File**: `nexacore-dashboard/src/components/profile/PasskeyManager.tsx`
- **Imports to add**: `EmptyState`, `Key` from `lucide-react`.
- **Loader (line 307-313, instance #5)**:
  - Verify Spinner size (same as TrustedDevices). Bump md→lg if section loader; document otherwise.
- **Empty (line 316-322, instance #6)**:
  - Replace inline `<p>No passkeys...</p>` with:
    ```tsx
    <EmptyState
      icon={<Key size={48} />}
      title="No passkeys registered"
      description="Add a passkey for faster, more secure sign-in."
      action={<Button onClick={startRegistration}>Add passkey</Button>}
    />
    ```
- **Implementation notes**: same approach as TrustedDevices — preserve existing Add Passkey flow handler in `action`.

### Step 4 — Refactor SecurityActivity.tsx (instances #7, #8, #9)

- **File**: `nexacore-dashboard/src/components/profile/SecurityActivity.tsx`
- **Imports to add**: `EmptyState`, `Activity` from `lucide-react` (Button likely already present).
- **Loader (line 139-145, instance #7)**:
  - Current: `<Spinner aria-label="Loading events" />` (probably without explicit size or with default).
  - Verify size + center container per §0.3. Set explicitly `size="lg"`.
- **Error (line 147-149, instance #8) — uses SCRUM-408 variant**:
  - Replace `<p className="text-error">{errorMessage}</p>` with:
    ```tsx
    <EmptyState
      variant="error"
      title="Couldn't load security events"
      description={errorMessage}
      action={<Button onClick={() => fetchEvents(eventsPage)}>Retry</Button>}
    />
    ```
- **Empty (line 152-154, instance #9)**:
  - Replace `<p>No security events.</p>` with:
    ```tsx
    <EmptyState
      icon={<Activity size={48} />}
      title="No security events"
      description="Your recent sign-ins and security events will appear here."
    />
    ```
- **Implementation notes**: SecurityActivity has the canonical `loading → error → empty → list` 4-way render branch. Confirm that the new error EmptyState's retry callback reuses the existing `fetchEvents` function (already wrapped in `useCallback`).

### Step 5 — Verify each component

After each file edit, run `npm run dev` and navigate to `/profile`:
- ActiveSessions: log in, revoke all sessions → empty state with Smartphone icon
- TrustedDevices: ensure no trusted devices → empty state with ShieldCheck icon + Trust button
- PasskeyManager: no passkeys → empty state with Key icon + Add button
- SecurityActivity:
  - Loading: refresh page → centered lg Spinner briefly
  - Empty: fresh account with no events → empty state with Activity icon
  - Error: force backend 500 (block /audit-logs) → error EmptyState with retry → click Retry → reloads

### Step 6 — Lint, build, tests

```bash
cd nexacore-dashboard
npm run lint   # 0 errors expected
npm run build  # clean, 19 routes
npx jest tests/components/profile --silent  # all pass; profile tests verify component behavior
```

### Step 7 — Update Technical Documentation

- The canonical patterns (binding) are already in `ui-design-system.md` §Loading-Empty-Error-Patterns (added by SCRUM-352). No further spec changes needed for this implementation.
- `integration-state.md`: no module/guard/service changes → no update.
- `audit-table.md` row entries for B1: these become RESOLVED. We could optionally annotate the audit-table.md with a "Resolved by SCRUM-403" note, but that's a SCRUM-352 closeout concern, not this ticket.

## 5. Implementation Order

1. Step 0: branch
2. Step 1: ActiveSessions refactor (#1, #2) — start with this since it has the canonical Smartphone icon already imported
3. Step 2: TrustedDevices refactor (#3, #4)
4. Step 3: PasskeyManager refactor (#5, #6)
5. Step 4: SecurityActivity refactor (#7, #8, #9)
6. Step 5: per-component dev smoke test (manual)
7. Step 6: full lint + build + Jest verification
8. Step 7: doc cross-ref grep
9. Handoff to `/verify SCRUM-403`

## 6. Testing Checklist

- [ ] `npm run lint` 0 errors, 0 new warnings
- [ ] `npm run build` clean, 19 routes preserved
- [ ] `npx jest tests/components/profile` all pass without snapshot update
- [ ] ActiveSessions empty state: Smartphone icon, title "No active sessions"
- [ ] ActiveSessions loader: centered Spinner lg
- [ ] TrustedDevices empty: ShieldCheck icon, title "No trusted devices", Trust button works
- [ ] TrustedDevices loader: lg (or documented as Accepted-Trivial)
- [ ] PasskeyManager empty: Key icon, title "No passkeys registered", Add button works
- [ ] PasskeyManager loader: lg (or documented)
- [ ] SecurityActivity loader: centered Spinner lg
- [ ] SecurityActivity error: AlertTriangle icon (`text-error`), title "Couldn't load security events", Retry button reloads
- [ ] SecurityActivity empty: Activity icon, title "No security events"
- [ ] No new console errors in browser DevTools

## 7. Error Handling Patterns

SecurityActivity row #8 introduces a Retry pattern. The retry callback re-invokes the existing `fetchEvents(page)` which:
- Sets `setIsFetching(true)`
- Re-attempts the helper call (`getSecurityActivity(page, pageSize)`)
- Updates state on success or `setLoadError(true)` on failure
- mountedRef guard (added in SCRUM-322) protects against stale-state on unmount

No new error states created; only the visual representation changes.

## 8. UI/UX Considerations

- **Icons**: chosen for contextual fit:
  - Smartphone (sessions = device contexts where the user signed in)
  - ShieldCheck (trusted device = MFA-validated device)
  - Key (passkey = literal cryptographic key)
  - Activity (security log = activity stream)
  - AlertTriangle (error variant default — no override needed)
- **Theme**: all icons + colors theme-aware via `--color-error` and `--color-content-primary/30` tokens. No manual light/dark branching.
- **A11y**: title + description in `<EmptyState>` are semantic `<p>` elements with proper text styles. Loaders use `aria-label="Loading X"`.
- **Responsive**: `<EmptyState>` is `flex flex-col items-center gap-3 py-12` (already responsive). No layout adjustments needed at breakpoints.
- **Animation**: no entry animation added (YAGNI).

## 9. Dependencies

- `<EmptyState>` API (variant="default"|"error") — shipped in SCRUM-408 ✓
- `<Spinner>` size scale (sm/md/lg) — already exists
- `lucide-react@^1.14.0` — provides Smartphone, ShieldCheck, Key, Activity, AlertTriangle (all stable v1 icons)

No new package.json changes.

## 10. Notes

- **Pre-freeze AUTH cleanup**: this is AUTH-direct work. 4 of 4 components are part of `/profile` (post-auth route) and manage AUTH-related state (sessions, MFA, passkeys, security events).
- **Scope discipline**: ONLY visual pattern refactor. No state-management refactor, no API changes, no flow changes.
- **Copy refinement**: the new title/description strings refine the previous inline copy to fit the EmptyState pattern (short imperative title + 1-sentence description). The intent is preserved; the phrasing tightens.
- **Spinner size verifications (rows #3, #5, #7)**: if the section is visually too small for `lg` (32px), keep `md` (24px) and document as Accepted-Trivial deviation. Don't bump blindly if it harms the layout.
- All code/comments in English per `base-standards.mdc`.

## 11. Next Steps After Implementation

1. `/verify SCRUM-403` — quality gate.
2. `/commit SCRUM-403` — feature branch PR + squash merge.
3. `/update-docs SCRUM-403` — record + ai-specs sync.
4. Continue with SCRUM-402 (color-contrast on auth forms) per AUTH critical path.

## 12. Implementation Verification

- [ ] All 9 instances resolved per the Jira [enhanced] matrix
- [ ] Lint + build + targeted Jest pass
- [ ] Manual smoke confirms each empty/error/loader renders correctly
- [ ] No new console errors
- [ ] Allowlist entries in `tests/e2e/fixtures/no-console-errors.ts` unchanged (no new entries needed; no entries removed)

## 13. Module-Level Planning

N/A — this ticket modifies 4 existing components, does not introduce a new module.

## 14. Satellite App Planning

N/A — profile components are dashboard-only (satellite has no profile area).
