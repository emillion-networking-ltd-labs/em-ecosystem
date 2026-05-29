# Implementation Record: SCRUM-283 Implement Constant-Time Login Responses

## Summary

Implemented two-layer timing attack defense on `LoginService.login()`: Layer 1 adds bcrypt.compare before account lockout throw (H-12), Layer 2 wraps entire login with MIN_LOGIN_DURATION_MS=350ms floor (EM-04). All login code paths now take ≥350ms regardless of branch.

- **Scope**: Backend
- **Branch**: `feature/SCRUM-283-backend`
- **Date**: 2026-03-18
- **PR**: [#154](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/154)

## Plan Reference

- **Plan**: `ai-specs/ai-specs/changes/auth/plans/Sprint 13/SCRUM-283_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `4ed5bbb` | SCRUM-283: Implement constant-time login responses (timing attack mitigation) | `auth.constants.ts`, `login.service.ts`, 6 test files |

## Deviations from Plan

Implementation followed the plan exactly. No deviations.

## Test Results

- **Unit tests**: 589 passed / 0 failed (all auth module tests)
- **New tests added**: 2 assertions in `timing-attack.spec.ts` for MIN_LOGIN_DURATION_MS
- **Manual verification**: N/A (constant/wrapper pattern, verified via tests)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added (no module/guard/export changes) |

## Lessons Learned

- Pre-push hooks add ~2 minutes per push due to full test suite — acceptable for security
- jest.mock() for constants works well to avoid test delays from setTimeout floor
- Prettier formatting must be run before commit (pre-commit hook catches it)
