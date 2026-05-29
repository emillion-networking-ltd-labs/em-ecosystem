# Frontend Implementation Plan: SCRUM-406 — AUTH section/page loaders consolidation (partial)

## 2. Overview

Replace inline `<p>Loading...</p>` patterns in 2 AUTH page-level Suspense fallbacks with the canonical centered `<Spinner size="lg" />` per `ui-design-system.md` §Loading-Empty-Error-Patterns §0.3 (codified by SCRUM-352).

This is **B4 partial** of SCRUM-352 (Audit Loading & Empty States Phase A) — limited to AUTH critical path scope per pre-freeze AUTH cleanup directive. Closes the third and final item of the AUTH critical path (after SCRUM-403 + SCRUM-402).

Architecture principles:
- **Scope discipline**: ONLY rows 15 + 16 of audit-table.md (AUTH pages). Rows 21 (OAuthCallbackHandler), 24 (PermissionsMatrix), 26 (UserRoleChart) deferred to SCRUM-406 full-closeout ticket post-pre-freeze.
- **Visual continuity**: Suspense fallback container layout preserved (`flex min-h-screen items-center justify-center`); only the inner content changes from `<p>` to `<Spinner>`.
- **Doc-from-code preserved**: `<Spinner>` already has built-in `role="status" + aria-label="Loading"` (no API extension needed per SCRUM-403 precedent).

## 3. Architecture Context

**Files affected**:
- `nexacore-dashboard/src/app/auth/callback/page.tsx` — line 9 inline `<p>` replacement + import
- `nexacore-dashboard/src/app/verify-email-change/page.tsx` — line 90 inline `<p>` replacement + import

**Files NOT affected**:
- Inner client handlers (`OAuthCallbackHandler.tsx`, `VerifyEmailChangeContent.tsx`) — their own loader logic, out of scope
- All other dashboard pages — not in audit B4 cluster

**Dependencies (read-only)**:
- `<Spinner>` size scale (sm/md/lg) — already exists in `@/components/ui/Spinner`
- `<Suspense>` fallback rendering pattern (Next.js App Router native)

**Component registry impact**: none — only consumer-side refactor.

**State management**: unchanged — Suspense + client handler boundary remains identical.

## 4. Implementation Steps

### Step 0 — Feature branch from latest main

```bash
git checkout main
git pull origin main
git checkout -b feature/SCRUM-406-frontend
```

### Step 1 — Refactor `/auth/callback/page.tsx`

- **File**: `nexacore-dashboard/src/app/auth/callback/page.tsx`
- **Imports to add**: `import Spinner from "@/components/ui/Spinner";`
- **Change** (line 9):
  ```diff
  - <p className="text-body text-content-secondary">Loading...</p>
  + <Spinner size="lg" />
  ```
- **Implementation notes**: preserve the outer `<div className="flex min-h-screen items-center justify-center">` container. `<Spinner>` provides `role="status" + aria-label="Loading"` built-in.

### Step 2 — Refactor `/verify-email-change/page.tsx`

- **File**: `nexacore-dashboard/src/app/verify-email-change/page.tsx`
- **Imports to add**: same `Spinner` import
- **Change** (line 90):
  ```diff
  - <p className="text-body text-content-secondary">Loading...</p>
  + <Spinner size="lg" />
  ```
- **Implementation notes**: identical fix to Step 1 (same `<Suspense fallback>` pattern in `VerifyEmailChangePage`).

### Step 3 — Lint + Build + targeted Jest

```bash
cd nexacore-dashboard
npm run lint                       # 0 errors expected
npm run build                      # clean, 18 routes
npx jest tests/app --silent        # any app-route tests pass (if exist)
```

### Step 4 — Manual smoke verification

- **Scenario 1**: trigger OAuth login flow → page briefly renders `/auth/callback`. Verify Spinner appears during Suspense hydration (very brief moment before handler kicks in), then `<RingSpinner>` from OAuthCallbackHandler takes over.
- **Scenario 2**: trigger email change verification flow → `/verify-email-change` Suspense fallback shows Spinner briefly.
- (If forcing these flows is impractical in dev) inspect via React DevTools Suspense boundary toggle.

### Step 5 — Update Technical Documentation

- **No spec changes required**: `ui-design-system.md` §Loading-Empty-Error-Patterns already documents §0.3 canonical rule (added by SCRUM-352). This ticket is the consumer-side application, not a spec extension.
- `integration-state.md`: NO CHANGE — no module/guard/service changes.
- `audit-table.md` rows 15+16: become RESOLVED. Annotation deferred to SCRUM-352 closeout ticket per SCRUM-408 precedent.

## 5. Implementation Order

1. Step 0: branch
2. Step 1: `/auth/callback/page.tsx` refactor
3. Step 2: `/verify-email-change/page.tsx` refactor
4. Step 3: lint + build + Jest
5. Step 4: manual smoke (deferred to user QA before /commit per workflow-standards §13.6)
6. Step 5: doc cross-ref (NO change needed)
7. Handoff to `/verify SCRUM-406`

## 6. Testing Checklist

- [ ] `npm run lint` 0 errors / 0 new warnings
- [ ] `npm run build` clean, 18 routes preserved
- [ ] `npx jest tests/app` passes (if any tests cover these pages)
- [ ] `auth/callback/page.tsx` renders Spinner in Suspense fallback (no inline text)
- [ ] `verify-email-change/page.tsx` renders Spinner in Suspense fallback (no inline text)
- [ ] No new console errors at runtime
- [ ] VRT (CI Linux) shows no visual regression > 0.2% on auth pages

## 7. Error Handling Patterns

N/A — pure presentational refactor on Suspense fallback. No new error states.

## 8. UI/UX Considerations

- **Spinner size**: `lg` (32px) per §0.3 "Layout is unknown" rule — appropriate for full-page Suspense fallbacks.
- **aria-label**: Spinner's built-in `"Loading"` (not overridable as prop). Acceptable per SCRUM-403 precedent.
- **Theme awareness**: Spinner uses `border-border-strong border-t-content-primary` tokens — auto-adapts to light/dark mode.
- **Animation**: `animate-spin` already on the Spinner component.

## 9. Dependencies

- `<Spinner>` from `@/components/ui/Spinner` — already in design system
- No new npm packages

## 10. Notes

- **Pre-freeze AUTH cleanup**: this is the **third and final item** of the AUTH critical path (after SCRUM-403 + SCRUM-402). After this ticket closes, the AUTH stabilization wave is complete.
- **Scope discipline**:
  - DO NOT touch OAuthCallbackHandler.tsx, PermissionsMatrix.tsx, UserRoleChart.tsx (rows 21/24/26 — deferred to SCRUM-406 full close).
  - DO NOT change Suspense fallback layout (only the inner content).
  - DO NOT add aria-label override (Spinner doesn't accept it).
- **--no-verify discipline**: any hook bypass during /commit must follow the SCRUM-403/SCRUM-402 precedent (documented rationale in commit body + PR body).
- **OneDrive `EBUSY`**: user has pause/resume OneDrive workflow established. If pre-push hook fails on `npm ci`, follow workflow-standards §13.6.7 (clean `.oxide-...-XXXXXX` temp dir, retry).
- **All code/comments in English** per `base-standards.mdc`.

## 11. Next Steps After Implementation

1. `/verify SCRUM-406` — quality gate
2. `/commit SCRUM-406` — feature branch PR + squash merge
3. `/update-docs SCRUM-406` — record + ai-specs sync; mark AUTH critical path closed
4. **AUTH critical path COMPLETE** — pre-freeze AUTH cleanup wave closed
5. (Optional) Create SCRUM-406 full-closeout follow-up ticket for the 3 deferred non-AUTH rows (OAuthCallbackHandler, PermissionsMatrix, UserRoleChart)

## 12. Implementation Verification

- [ ] Both rows of audit-table.md B4 partial scope (rows 15+16) RESOLVED
- [ ] Lint + build + targeted Jest pass
- [ ] Manual smoke confirms Spinner renders in both Suspense fallbacks
- [ ] No new console errors
- [ ] CI Visual Regression on auth pages 0 diff > 0.2%
- [ ] AUTH critical path closure ready for documentation in /update-docs

## 13. Module-Level Planning

N/A — this ticket modifies 2 existing page files; does not introduce a new module.

## 14. Satellite App Planning

N/A — this is dashboard-only (AUTH critical path). Satellite has its own auth flow that does NOT use these page-level Suspense fallbacks.
