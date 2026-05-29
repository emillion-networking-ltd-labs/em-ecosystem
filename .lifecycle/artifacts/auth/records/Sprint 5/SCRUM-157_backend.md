# Implementation Record: SCRUM-157 Validation Errors Expose Internal DTO Field Names

## 1. Summary

Verified as already fixed by SCRUM-140. No code changes required — closed as Done.

- **Scope**: backend
- **Branch**: N/A (no code changes)
- **Implementation date**: 2026-03-09
- **PR**: N/A
- **Security references**: CWE-200
- **Resolution**: ALREADY FIXED by SCRUM-140 (PR #31)

## 2. Plan Reference

- **Plan**: N/A (no plan needed — ticket resolved by prior work)
- **Plan was followed**: N/A

## 3. Commits

No commits — issue was already remediated.

## 4. Deviations from Plan

N/A — no plan, no implementation.

## 5. Verification Evidence

| Check | Result |
|-------|--------|
| `passwordHash` in DTOs | Zero occurrences |
| `mfaSecret` in DTOs | Zero occurrences |
| Internal fields in any DTO | Zero occurrences — 28 DTOs verified |
| `sanitizeValidationDetails` in HttpExceptionFilter | Active (lines 70-76) — strips field name prefix from all validation messages |

Defense-in-depth via two layers:

**Layer 1: DTO Design** — All 28 DTOs only expose user-facing field names (email, password, firstName, lastName, code, token, etc.). Internal fields (passwordHash, mfaSecret, mfaRecoveryCodes, lockoutCount, failedAttempts, lockedUntil, emailVerificationToken) are never present in DTOs.

**Layer 2: HttpExceptionFilter.sanitizeValidationDetails** — Even if a DTO field name appears in a class-validator message (e.g., "email must be an email"), the sanitizer strips the leading field name, converting it to "Must be an email". Added by SCRUM-140.

## 6. Test Results

No tests changed. Existing 821 tests (44 suites) confirm correct behavior. Tests at `http-exception.filter.spec.ts` lines 67-136 specifically verify field name stripping.

## 7. Bugs Found

No bugs found during verification.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| Jira SCRUM-157 | Description enriched with [Enhanced] — RESOLVED by SCRUM-140 section, transitioned to Done |

## 9. Lessons Learned

- The original finding assumed internal fields like `passwordHash` and `mfaSecret` could appear in validation errors, but these fields were never exposed in DTOs — they only exist in Prisma entities. SCRUM-140 added `sanitizeValidationDetails` as defense-in-depth to strip even user-facing field names from validation messages.
