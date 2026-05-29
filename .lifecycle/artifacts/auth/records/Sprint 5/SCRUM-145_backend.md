# Implementation Record: SCRUM-145 Login Lockout Anti-Enumeration

## 1. Summary

Eliminated email enumeration via login lockout status codes. Both lockout paths (already-locked and lockout-triggered) now throw `UnauthorizedException` (401) instead of `ForbiddenException` (403), producing identical responses to non-existing account and wrong-password paths. The `retryAfter` value is preserved in the exception response object so `HttpExceptionFilter` continues to set the `Retry-After` HTTP header.

- **Scope**: backend
- **Branch**: `feature/SCRUM-145-backend`
- **Implementation date**: 2026-03-08
- **PR**: #36
- **Security references**: CWE-203, OWASP ASVS V2.2, NIST SP 800-63B

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-145_backend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `eea35c5` | fix(SCRUM-145): unify lockout responses to prevent email enumeration on login | 2 files (1 source + 1 test) |

## 4. Deviations from Plan

| # | Deviation | Reason | Follow-up |
|---|-----------|--------|-----------|
| 1 | Plan's grep identified 5 lockout `ForbiddenException` tests but missed a 6th (audit resilience lockout test at line ~2594) | The test description didn't follow the same naming pattern as the others, so the codebase search missed it. Discovered during first test run (1 failure). | Accepted — test was found and updated during implementation. |

## 5. Files Changed

### Modified Source Files (1)
| File | Changes |
|------|---------|
| `nexacore-api/src/auth/auth.service.ts` | Two lockout `ForbiddenException` throws changed to `UnauthorizedException` with `message: 'Invalid credentials'` (same as non-existing account path). `retryAfter` preserved in exception response object. `ForbiddenException` import kept — still used for email-not-verified and impossible-travel-blocked paths. |

### Modified Test Files (1)
| File | Changes |
|------|---------|
| `nexacore-api/src/auth/tests/auth.service.spec.ts` | 6 existing lockout tests updated: `ForbiddenException` → `UnauthorizedException`. 1 new anti-enumeration test added: verifies locked account and non-existing account both throw `UnauthorizedException`. |

## 6. Test Results

- **Backend**: 44 suites, 819 tests — all pass
- **TypeScript**: `nest build` compiles clean
- **Net test change**: +1 new (lockout anti-enumeration parity test)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added. No module/guard/DI/controller/permission/schema changes — behavior-only security remediation. |
| `ai-specs/specs/api-spec.yml` | Login endpoint: lockout condition moved from 403 to 401 description. 401 now documents `Retry-After` header for locked accounts. 403 reduced to 2 conditions (email not verified, impossible travel). |

## 9. Lessons Learned

- **Grep for test locations is fragile**: Plan's codebase search found 5/6 lockout tests because the 6th had a different naming pattern ("audit rejects on locked account" vs "throw ForbiddenException when account is locked"). Always run tests before committing to catch missed updates.
- **Pre-existing frontend issue documented but not fixed**: `api.ts` only reads `Retry-After` header for 429 responses. Lockout countdown was already broken since SCRUM-140 (which stripped `retryAfter` from body). This needs a separate ticket — not in scope for SCRUM-145. **Resolved by SCRUM-165 (PR #48)** — exposed `Retry-After` via CORS and updated `parseErrorResponse` to recover `retryAfter` for 401 responses.
