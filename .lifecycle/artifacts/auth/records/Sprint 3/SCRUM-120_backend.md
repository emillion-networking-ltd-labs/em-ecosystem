# Implementation Record: SCRUM-120 Reduce Session Timeouts to NIST AAL2

## Summary

Reduced session idle timeout from 24h to 0.5h (30 min) and absolute session lifetime from 7d to 12h for NIST SP 800-63B §7.2 / OWASP ASVS V3.3.2 + V3.3.3 AAL2 compliance. Config-only defaults — env vars still override.

- **Scope**: backend
- **Branch**: `feature/SCRUM-120-backend`
- **Implementation date**: 2026-03-04

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-120_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `a99b966` | feat(SCRUM-120): reduce session timeouts to NIST AAL2 (V3.3.2/V3.3.3) | `src/auth/constants/auth.constants.ts`, `src/auth/auth.service.ts`, `src/sessions/tests/sessions.service.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Unit tests**: 757 passed / 0 failed (43 suites)
- **Build**: `nest build` — zero errors
- **Verification**: SESSION_IDLE_TIMEOUT_HOURS = parseFloat('0.5'), JWT_REFRESH_EXPIRATION = '12h', isSessionIdle tests adjusted for 30-min default

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added SCRUM-120 individual changelog entry |
| `ai-specs/specs/api-spec.yml` | Updated POST /auth/refresh idle timeout description (24h → 0.5h), AuthResponse refreshToken description (7d → 12h) |

## Lessons Learned

- **parseInt → parseFloat**: Critical change — `parseInt('0.5', 10)` returns `0`, which would make ALL sessions idle immediately. `parseFloat('0.5')` correctly returns `0.5`.
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.
