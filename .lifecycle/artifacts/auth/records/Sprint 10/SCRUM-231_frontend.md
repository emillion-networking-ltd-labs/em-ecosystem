# Implementation Record: SCRUM-231 — Fix MFA Form A11y Gaps (FE-26)

## Summary

Fixed 2 WCAG 2.1 AA accessibility gaps in auth frontend components: added `role="alert"` and `aria-live="polite"` to TOTP view error container (matching existing recovery view pattern), and removed `tabIndex={-1}` from password toggle button to restore keyboard accessibility. Attribute-level fixes only, no logic changes.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-231-frontend`
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-231_frontend.md`
- **Plan followed**: Yes (0 deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `96ae9be` | SCRUM-231: Fix MFA form accessibility gaps (FE-26) | 2 files (0 new, 2 modified) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

N/A — attribute-level HTML changes, no testable logic. Frontend build has a pre-existing failure in `ConnectedAccounts.tsx:115` (conditional `useState` hook) confirmed identical on `main` — unrelated to SCRUM-231 changes.

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` | Added `role="alert"` and `aria-live="polite"` to TOTP view error div (line 274), matching recovery view pattern at line 148 |
| `nexacore-dashboard/src/components/ui/Input.tsx` | Removed `tabIndex={-1}` from password toggle button, restoring default keyboard accessibility |
| `ai-specs/ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-231 |

## Lessons Learned

- The TOTP and recovery views in MfaTotpStep.tsx share the same error container pattern but the TOTP view was missing the aria attributes — likely a copy-paste oversight when the component was split into two views. When duplicating UI patterns, all accessibility attributes should be included in the checklist.
- `tabIndex={-1}` on interactive elements is a common intentional UX pattern (to reduce tab stops), but it conflicts with WCAG 2.1 AA keyboard accessibility requirements. Native `<button>` elements are keyboard-accessible by default and should not have their tabIndex overridden.
