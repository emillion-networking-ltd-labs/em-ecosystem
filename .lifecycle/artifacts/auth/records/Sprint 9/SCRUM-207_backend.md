# Implementation Record: SCRUM-207 Harden error messages against info disclosure

## Summary

Replaced 8 hard-coded error messages that revealed CAPTCHA mechanism, MFA internals, or used inconsistent patterns. Added 4 new ErrorMessages sections and centralized all exception messages.

- **Scope**: backend
- **Branch**: `feature/SCRUM-207-backend`
- **Date**: 2026-03-13

## Plan Reference

- Plan: `ai-specs/changes/plans/Sprint 9/SCRUM-207_backend.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `8620936` | fix(security): harden error messages against info disclosure (SCRUM-207) (#77) | 7 files |

## Changes

| File | Change |
|------|--------|
| `error-messages.ts` | Added `passkey`, `device`, `audit`, `security` sections with NOT_FOUND and VERIFICATION constants |
| `turnstile.guard.ts` | "CAPTCHA verification required/failed" -> `ErrorMessages.security.VERIFICATION_REQUIRED/FAILED` |
| `mfa.service.ts` | Hard-coded MFA endpoint/recovery strings -> `ErrorMessages.mfa.OPERATION_NOT_AVAILABLE` / `INVALID_CODE` |
| `passkey.service.ts` | "Passkey not found" (2x) -> `ErrorMessages.passkey.NOT_FOUND` |
| `trusted-device.service.ts` | "Trusted device not found" -> `ErrorMessages.device.NOT_FOUND` |
| `audit.controller.ts` | "Audit log not found" -> `ErrorMessages.audit.NOT_FOUND` |
| `session.controller.spec.ts` | Updated test to use `ErrorMessages.device.NOT_FOUND` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Full suite**: 860 passed / 0 failed
- **Build**: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated header (SCRUM-205->207), added changelog entry |

## Lessons Learned

- The CAPTCHA-specific terminology ("CAPTCHA verification") is unnecessary in error messages — a generic "Verification required" is equally useful for users while preventing mechanism enumeration.
- Centralizing error messages to a constants file makes security auditing much simpler — grep for hard-coded strings in thrown exceptions.
