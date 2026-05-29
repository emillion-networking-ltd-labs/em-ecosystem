# Implementation Record: SCRUM-188 Add error.tsx Boundaries to Next.js Auth Routes

## 1. Summary
- Added Next.js App Router error boundaries (`error.tsx` and `global-error.tsx`) for graceful error recovery across all routes. Since no `(auth)` route group exists, the app-level `error.tsx` covers all routes including auth.
- **Scope**: frontend
- **Branch**: `feature/SCRUM-188-frontend`
- **Date**: 2026-03-12

## 2. Plan Reference
- **Plan**: `ai-specs/changes/plans/Sprint 7/SCRUM-188_frontend.md`
- **Plan followed**: Yes — all steps executed as planned.

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `7336302` | feat(dashboard): add error.tsx and global-error.tsx error boundaries (SCRUM-188) | `nexacore-dashboard/src/app/error.tsx`, `nexacore-dashboard/src/app/global-error.tsx`, `nexacore-dashboard/tests/components/error-boundaries.test.tsx` |

## 4. Deviations from Plan

Implementation followed the plan exactly.

## 5. Test Results
- **92 tests** passed across 15 suites (frontend)
- **16 new tests** in `error-boundaries.test.tsx`
- Build succeeds (`next build`)
- No tests skipped

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated header to SCRUM-188, added changelog entry |

## 8. Lessons Learned
- Next.js `global-error.tsx` must be fully self-contained (own `<html>`, `<body>`, inline styles) since the root layout tree is broken when it activates
- Naming a component export `Error` (matching the file convention) clashes with JavaScript's built-in `Error` constructor in test files — import as `ErrorPage` in tests to avoid shadowing
- `globalThis.Error` is the workaround for creating Error instances when the component import shadows the constructor
- App-root `error.tsx` provides better coverage than a route-group-scoped boundary when no route group exists — catches errors from all routes as a single boundary
