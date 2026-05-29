# Implementation Record: SCRUM-122 Add OAuth URLs + JWT Expiry to Production Validation (O-03/J-04)

## Summary

Extended `validateProductionSecrets()` with OAuth callback HTTPS enforcement (RFC 9700) and JWT access token expiry <= 15m validation (RFC 8725). Added local `parseDurationToMs()` helper for duration string parsing.

- **Scope**: backend
- **Branch**: `feature/SCRUM-122-backend`
- **Implementation date**: 2026-03-04

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-122_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `146f9e8` | feat(SCRUM-122): add OAuth HTTPS + JWT expiry to production validation (RFC 9700/8725) | `src/common/utils/validate-production-secrets.ts`, `src/tests/validate-production-secrets.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Unit tests**: 765 passed / 0 failed (43 suites)
- **Build**: `nest build` — zero errors
- **New tests**: +9 (2 Google callback + 2 GitHub callback + 5 JWT expiry)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added SCRUM-122 changelog entry |

## Lessons Learned

- **Local parser duplication**: `parseDurationToMs()` duplicates logic from `auth.service.ts`'s private `parseDurationMs()`. Acceptable trade-off — coupling the startup validator to auth.service would create an unnecessary import dependency for ~10 lines of regex parsing.
- **Optional-only validation**: OAuth URLs and JWT expiry are validated only when set, matching the "fail-safe defaults" pattern — unset values use compliant defaults.
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.
