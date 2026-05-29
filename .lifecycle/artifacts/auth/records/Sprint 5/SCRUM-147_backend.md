# Implementation Record: SCRUM-147 User Not Found on Self-Service Endpoints

## 1. Summary

Replaced `NotFoundException(ErrorMessages.user.NOT_FOUND)` with `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` on 4 self-service methods in `users.service.ts` where `userId` comes from the JWT payload. Prevents CWE-200 account deletion state disclosure. Admin-facing methods (`adminUpdateUser`, `softDelete`) retain `NotFoundException` — 404 is correct HTTP semantics for admin resource lookups.

- **Scope**: backend
- **Branch**: `feature/SCRUM-147-backend`
- **Implementation date**: 2026-03-08
- **PR**: #38
- **Security references**: CWE-200

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-147_backend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `8fbdf39` | fix(SCRUM-147): replace NotFoundException with UnauthorizedException on self-service endpoints | 2 files (1 source + 1 test) |

## 4. Deviations from Plan

| # | Deviation | Reason | Follow-up |
|---|-----------|--------|-----------|
| 1 | Ticket listed methods as being in `auth.service.ts` but they are in `users.service.ts` | Ticket description was inaccurate — methods were moved during earlier refactoring | Accepted — correct file targeted |
| 2 | `requestEmailChange` (4th method) not listed in ticket but fixed | Same pattern as the other 3 — JWT-derived userId with NotFoundException | Accepted — consistent remediation |

## 5. Files Changed

### Modified Source Files (1)
| File | Changes |
|------|---------|
| `nexacore-api/src/users/users.service.ts` | 4 self-service methods changed: `changePassword` (line 326), `requestEmailChange` (line 545), `selfDeleteAccount` (line 637), `unlinkOAuth` (line 727) — `NotFoundException(ErrorMessages.user.NOT_FOUND)` → `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`. `NotFoundException` import kept (still used by admin methods). |

### Modified Test Files (1)
| File | Changes |
|------|---------|
| `nexacore-api/src/users/tests/users.service.spec.ts` | 4 tests updated: `NotFoundException` → `UnauthorizedException` for changePassword, requestEmailChange, selfDeleteAccount, unlinkOAuth. Test descriptions updated with "(CWE-200)" suffix. Admin tests (`adminUpdateUser`, `softDelete`) unchanged. |

## 6. Test Results

- **Backend**: 44 suites, 820 tests — all pass
- **TypeScript**: `nest build` compiles clean
- **Net test change**: 0 (4 tests updated, none added or removed)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added. No module/guard/DI/controller/permission/schema changes — exception type change only. |

## 9. Lessons Learned

- **NEVER close tickets without verifying ALL items in actual codebase**: Initial enrichment incorrectly concluded all 10 occurrences were fixed by SCRUM-140. Thorough grep of the actual source files (not just auth module) revealed 3+1 remaining in users.service.ts.
- **Ticket file paths may be stale**: SCRUM-147 listed methods in `auth.service.ts` but they were in `users.service.ts`. Always verify file locations against live code.
- **Self-service vs admin distinction matters**: The same exception type (`NotFoundException`) is correct for admin endpoints (resource lookup by ID) but incorrect for self-service endpoints (JWT-derived userId). The fix must be selective.
