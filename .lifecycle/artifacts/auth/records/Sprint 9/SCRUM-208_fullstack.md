# Implementation Record: SCRUM-208 Move Verification Tokens to POST Body

## Summary

Refactored email verification and email-change verification endpoints from GET (query params + redirect) to POST (request body + JSON response) per OWASP ASVS V8.3.1. Email links now point to frontend pages which POST the token to the backend API.

- **Scope:** fullstack
- **Branch:** `feature/SCRUM-208-fullstack`
- **Date:** 2026-03-13

## Plan Reference

- Plan: `ai-specs/changes/plans/Sprint 9/SCRUM-208_fullstack.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `ee57f07` | fix(security): move verification tokens from query strings to POST body (SCRUM-208) | `account.controller.ts`, `mail.service.ts`, `VerifyEmailStatus.tsx`, `verify-email-change/page.tsx`, 2 DTOs, 2 test files |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- Unit tests: 859 passed / 0 failed (was 860 — 1 GET redirect test removed, replaced by DTO validation)
- `nest build`: clean
- `next build`: clean
- Manual verification: email link → frontend page → POST token → JSON response flow confirmed

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Updated `/auth/verify-email` and `/auth/verify-email-change` from GET (query + redirect) to POST (body + JSON) |
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-208 |

## Lessons Learned

- Password reset already used POST body pattern — only email verification endpoints needed the fix
- DTO validation with `@IsNotEmpty()` replaces the manual "missing token" check, simplifying the controller
- The `!` definite assignment assertion is required for class-validator decorated DTO properties under strict TypeScript
