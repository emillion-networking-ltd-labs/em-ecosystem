# Implementation Record: SCRUM-165 Expose Retry-After Header via CORS

## Summary

Fixed CORS not exposing the `Retry-After` header to the browser, and fixed the frontend `parseErrorResponse` only recovering `retryAfter` for 429 responses (account lockout returns 401 with `Retry-After`).

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-165-fullstack`
- **PR**: #48
- **Date**: 2026-03-10

## Plan Reference

No formal plan — hotfix discovered during SCRUM-164 manual verification (inline error checklist).

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `82477b3` | fix(SCRUM-165): expose Retry-After header via CORS and recover retryAfter for 401 (#48) | `nexacore-api/src/main.ts`, `nexacore-api/src/security/security.config.ts`, `nexacore-dashboard/src/lib/api.ts` |

## Deviations from Plan

No plan existed — implementation was a targeted 3-file fix.

## Test Results

- Manual verification: Retry-After header visible in browser DevTools for 429 and 401 lockout responses
- Lockout banner renders correctly with countdown timer
- No automated tests changed (CORS config not unit-tested)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added |

## Lessons Learned

- CORS `exposedHeaders` is often forgotten — browsers silently drop non-standard headers unless explicitly exposed
- Lockout responses (401) also need `Retry-After` parsing, not just throttle responses (429)
