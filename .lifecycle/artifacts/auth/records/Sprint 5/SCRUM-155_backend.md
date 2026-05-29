# Implementation Record: SCRUM-155 Inconsistent Password Error Messages

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
| `"Incorrect password"` in codebase | Zero occurrences (eliminated by SCRUM-140) |
| `"Password confirmation required"` in codebase | Zero occurrences (eliminated by SCRUM-140) |
| `auth.service.ts` login (lines 216, 236, 263, 293, 315) | All use `'Invalid credentials'` — anti-enumeration (CWE-203) |
| `users.service.ts:340` changePassword | `ErrorMessages.user.INVALID_PASSWORD` = "Invalid password" |
| `mfa.service.ts:201` disableMfa | `ErrorMessages.user.INVALID_PASSWORD` = "Invalid password" |
| `passkey.service.ts:408` deletePasskey | `ErrorMessages.user.INVALID_PASSWORD` = "Invalid password" |

The remaining 2-message pattern ("Invalid credentials" for login vs "Invalid password" for authenticated endpoints) is **intentionally correct**:
- **Login (public)**: "Invalid credentials" prevents user enumeration — same message for user-not-found and wrong-password
- **Authenticated endpoints**: "Invalid password" is safe because the user is already identified via JWT — no enumeration risk

## 6. Test Results

No tests changed. Existing 821 tests (44 suites) confirm correct messages.

## 7. Bugs Found

No bugs found during verification.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| Jira SCRUM-155 | Description enriched with [Enhanced] — RESOLVED by SCRUM-140 section, transitioned to Done |

## 9. Lessons Learned

- Password error messages correctly follow the anti-enumeration vs authenticated endpoint distinction established in Sprint 5: public endpoints use generic messages to prevent enumeration, authenticated endpoints can be more specific since the user identity is already known.
- 2 of the 4 original variants ("Incorrect password", "Password confirmation required") were eliminated by SCRUM-140. The remaining 2 are intentionally different for security reasons.
