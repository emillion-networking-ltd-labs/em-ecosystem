# Implementation Record: SCRUM-146 Forgot-Password Timing Anti-Enumeration

## 1. Summary

Added `bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH)` timing protection to both early-return paths in `forgotPassword()` (non-existing email and OAuth-only account) to prevent CWE-203 timing side-channel email enumeration. Removed two `logger.log` calls that leaked raw email addresses in log output (CWE-532).

- **Scope**: backend
- **Branch**: `feature/SCRUM-146-backend`
- **Implementation date**: 2026-03-08
- **PR**: #37
- **Security references**: CWE-203, CWE-532, OWASP ASVS V2.1.1, NIST SP 800-63B §5.1.1.1

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-146_backend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `abc6854` | fix(SCRUM-146): add timing protection to forgot-password to prevent email enumeration | 2 files (1 source + 1 test) |

## 4. Deviations from Plan

Implementation followed the plan exactly.

## 5. Files Changed

### Modified Source Files (1)
| File | Changes |
|------|---------|
| `nexacore-api/src/auth/auth.service.ts` | `forgotPassword()`: added `await bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH)` to non-existing email path (line ~1043) and OAuth-only path (line ~1051). Removed 2 `logger.log` calls that leaked raw email addresses (`Forgot password requested for non-existent email: ${dto.email}` and `Forgot password requested for OAuth account: ${dto.email}`). Existing LOCAL email path unchanged. |

### Modified Test Files (1)
| File | Changes |
|------|---------|
| `nexacore-api/src/auth/tests/auth.service.spec.ts` | 2 existing forgotPassword tests updated: added `(bcrypt.compare as jest.Mock).mockResolvedValue(false)` setup and `bcrypt.compare` call assertions with `mock.calls[0][0]` email verification. 1 new parity test: "non-existing and OAuth-only paths should both call bcrypt.compare for timing protection" — verifies both early-return paths invoke bcrypt.compare. |

## 6. Test Results

- **Backend**: 44 suites, 820 tests — all pass
- **TypeScript**: `nest build` compiles clean
- **Net test change**: +1 new (timing protection parity test)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added. No module/guard/DI/controller/permission/schema changes — behavior-only security remediation. |

## 9. Lessons Learned

- **Consistent anti-enumeration pattern**: This is the third ticket (after SCRUM-141 and SCRUM-145) using `bcrypt.compare(DUMMY_PASSWORD_HASH)` for timing protection. The pattern is now well-established: add bcrypt.compare to fast paths, assert with `mock.calls[0][0]` in tests (due to jest.mock making DUMMY_PASSWORD_HASH undefined).
- **CWE-532 in logger.log**: The `logger.log` calls embedding `${dto.email}` in plaintext were an additional information disclosure vector beyond timing — raw email addresses in logs. Always sanitize or omit PII from log messages.
- **Simplest approach works**: bcrypt.compare (~250ms) plus strict throttle (3 req/15min) makes timing enumeration impractical. No need for fire-and-forget or minimum delay floor complexity.
