# Implementation Record: SCRUM-156 Inconsistent Account Restriction Messages

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
| `"Account is deactivated"` in codebase | Zero occurrences |
| `"Account is banned"` in codebase | Zero occurrences |
| `"Account is suspended"` in codebase | Zero occurrences |
| `auth.service.ts` login (locked account, lines 236, 293) | `UnauthorizedException('Invalid credentials')` — anti-enumeration |
| `jwt.strategy.ts:38` (deactivated account) | `ErrorMessages.auth.AUTHENTICATION_FAILED` = "Authentication failed" |
| `passkey.service.ts:253` (deactivated account) | `ErrorMessages.auth.AUTHENTICATION_FAILED` = "Authentication failed" |

The data model only has `isActive` (boolean) and `lockedUntil` (DateTime?) — no concept of "banned" or "suspended" states. All restricted-account responses already use generic messages:
- **Login (public)**: "Invalid credentials" — prevents user enumeration (same for locked, not-found, wrong-password)
- **JWT/Passkey (authenticated)**: "Authentication failed" — safe generic message for deactivated accounts

## 6. Test Results

No tests changed. Existing 821 tests (44 suites) confirm correct messages.

## 7. Bugs Found

No bugs found during verification.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| Jira SCRUM-156 | Description enriched with [Enhanced] — RESOLVED by SCRUM-140 section, transitioned to Done |

## 9. Lessons Learned

- The original finding assumed multiple account restriction states ("deactivated", "banned", "suspended") that don't exist in the data model — only `isActive` (boolean) and `lockedUntil` (DateTime?). SCRUM-140 already unified all account-state error messages to generic anti-enumeration messages.
