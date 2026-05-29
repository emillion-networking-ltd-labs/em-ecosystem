# Implementation Record: SCRUM-217 Fix User Enumeration via Login Status Codes

## Summary

Normalized all login failure HTTP responses to return identical HTTP 401 with "Invalid credentials" message, preventing user enumeration via status code differences (CWE-203, OWASP ASVS V2.2.1). Previously, unverified email login returned 403 while all other failures returned 401.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-217-fullstack`
- **Implementation date**: 2026-03-13

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-217_fullstack.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `9f6131b` | fix(auth): normalize login failure responses to prevent user enumeration (SCRUM-217) | `login.service.ts`, `auth-login.spec.ts`, `auth.service.spec.ts`, `LoginForm.tsx`, `AuthContext.tsx`, `error-constants.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Overall coverage**: Not measured (no new files — modification only)
- **Unit tests**: 859 passed / 0 failed
- **Build (backend)**: `nest build` clean
- **Build (frontend)**: `next build` clean
- **Verification**: `/verify SCRUM-217` — PASS (9/9 steps, 0 deviations)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/ai-specs/specs/api-spec.yml` | Updated POST /auth/login: 401 description now includes unverified email; 403 narrowed to impossible travel only |

## Lessons Learned

- The fix was straightforward because the codebase already had a consistent pattern (all other failure paths returned 401). The vulnerability was introduced by SCRUM-140 (email verification feature) which deliberately chose 403 to provide a better UX hint — a classic security vs UX trade-off.
- Silent re-verification email preserves UX without leaking account state.
- Frontend cleanup was significant (~95 lines removed) because the DETECTION_EMAIL_VERIFICATION detection logic was deeply integrated into LoginForm (resend button, cooldown timer, error branching).
