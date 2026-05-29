# Implementation Record: SCRUM-140 Security: Error Message Information Disclosure Audit & Remediation

## 1. Summary

Standardized all user-facing error messages across the NexaCore API to eliminate information disclosure vulnerabilities, addressing 17 security findings (6 CRITICAL, 8 HIGH, 3 MEDIUM) per OWASP ASVS, NIST SP 800-63B, CWE-200/203/209.

- **Scope**: backend
- **Branch**: `feature/SCRUM-140-backend`
- **Implementation date**: 2026-03-08
- **PR**: #31

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-140_backend.md`
- **Plan was followed**: Partially (see Deviations)

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `f1fd291` | fix(SCRUM-140): standardize error messages to prevent information disclosure | 19 files (1 new + 12 source + 6 tests) |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 1 | ErrorMessages constants with `validation.FAILED` | Created as planned | — | — |
| Step 2 | Strip retryAfter/lockoutLevel from body + sanitize validation field names (M-03) | Stripped retryAfter/lockoutLevel, added Retry-After header; **did NOT sanitize validation field names** | M-03 (validation field name stripping) deferred — class-validator field names in details array are useful for frontend form field mapping; stripping them would break client-side validation UX | SCRUM-159 (Deferred) |
| Step 5 | Plan listed `trusted-device.service.ts` as affected | **Not modified** — no information-leaking messages found after review | Trusted device errors were already generic | Accepted |
| Step 11 | Create `error-messages.spec.ts` test file | **Not created** | Constants file is trivially correct (string literals); test would add maintenance burden without value | Accepted |
| Step 11 | Update ~20 spec files | Updated 6 spec files; 2 suites (auth.service, users.service) have **13 pre-existing failures on main** unrelated to SCRUM-140 | Pre-existing failures stem from SCRUM-138 OAuth `findOrCreateByOAuth` return type change and `changePassword`/`unlinkOAuth` behavioral changes — not introduced by this ticket | Fixed in PR #32 (Pre-existing) |
| Step 10 | Change exception types for SUPERADMIN messages | Kept `ForbiddenException` (not changed to generic) | SUPERADMIN endpoints are behind JwtAuthGuard + RolesGuard + PermissionsGuard — only admins can trigger these, so ForbiddenException is appropriate | Accepted |

## 5. Files Changed

### New Files
| File | Purpose |
|------|---------|
| `src/common/constants/error-messages.ts` | Centralized error message constants organized by domain (auth, mfa, session, user, permission, csrf, validation) |

### Modified Source Files (12)
| File | Changes |
|------|---------|
| `src/common/filters/http-exception.filter.ts` | Removed retryAfter/lockoutLevel from JSON body; added Retry-After header via `response.setHeader()` |
| `src/auth/auth.service.ts` | C-01 (registration), C-02 (email verification), C-05 (lockout ×2), refresh token, OAuth code, MFA token gen messages |
| `src/auth/auth.controller.ts` | Refresh token missing, OAuth redirect messages |
| `src/auth/mfa.service.ts` | H-01 (User not found ×5), H-07 (MFA status ×4), ConflictException → BadRequestException, unified MFA code/token messages |
| `src/auth/passkey.service.ts` | C-03 (deactivated), C-04 (clone detection), ForbiddenException → UnauthorizedException, unified passkey auth failures |
| `src/auth/strategies/jwt.strategy.ts` | Unified User not found/Account deactivated → Authentication failed |
| `src/auth/guards/permissions.guard.ts` | H-02: removed permission name enumeration from error message |
| `src/auth/guards/roles.guard.ts` | Standardized access denied / insufficient role messages |
| `src/common/guards/csrf.guard.ts` | H-04: unified 3 CSRF messages into 1 |
| `src/sessions/sessions.service.ts` | H-05: hidden token reuse detection details |
| `src/users/users.service.ts` | M-01 (password variants ×4), M-02 (SUPERADMIN ×2), email enumeration |
| `src/users/users.controller.ts` | User not found standardized |

### Modified Test Files (6)
| File | Changes |
|------|---------|
| `src/common/filters/tests/http-exception.filter.spec.ts` | Added `mockSetHeader`, updated retryAfter test for header assertion |
| `src/auth/tests/jwt.strategy.spec.ts` | 'Account deactivated' → 'Authentication failed' |
| `src/auth/tests/mfa.service.spec.ts` | ConflictException → BadRequestException, updated messages |
| `src/auth/tests/passkey.service.spec.ts` | ForbiddenException → UnauthorizedException, updated messages |
| `src/security/tests/csrf.guard.spec.ts` | 3 CSRF messages unified |
| `src/sessions/tests/sessions.service.spec.ts` | Token reuse message updated |

## 6. Test Results

- **Coverage**: stmts 95.94%, branches 82.78%, funcs 92.93%, lines 96.63%
- **Test Suites**: 42 passed, 2 failed (pre-existing), 44 total
- **Tests**: 800 passed, 13 failed (pre-existing), 813 total
- **Pre-existing failures**: 13 tests in `auth.service.spec.ts` (5) and `users.service.spec.ts` (8) — confirmed by running same tests on `main` branch. Related to SCRUM-138 OAuth return type changes, not SCRUM-140.
- **Build**: `nest build` compiles clean with 0 errors

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `response.setHeader` not in test mock | LOW | Fixed | Added `mockSetHeader` to HttpExceptionFilter test mock |
| 13 pre-existing test failures on main | MEDIUM | Deferred | Not caused by SCRUM-140; needs separate fix for SCRUM-138 OAuth return type and users.service behavioral changes |

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added SCRUM-140 changelog entry |

## 9. Lessons Learned

- **Exception type changes cascade through tests**: Changing `ConflictException` → `BadRequestException` and `ForbiddenException` → `UnauthorizedException` requires updating both the exception class AND the message string in test assertions.
- **Pre-existing test failures complicate verification**: The 13 failures on main made it necessary to verify on both branches to confirm SCRUM-140 didn't introduce regressions. Always check main first.
- **M-03 (validation field stripping) should be a separate ticket**: Stripping field names from validation errors would break frontend form validation UX. This should be evaluated as a separate trade-off, not bundled with security hardening.
