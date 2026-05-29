# Implementation Record: SCRUM-102 Login Notification Emails

## Summary

- **What**: Send "New sign-in detected" email when a user logs in from an unrecognized IP or user agent. Detection via `notifyIfNewDevice()` helper comparing request metadata against existing active sessions. First-ever logins excluded. Non-blocking fire-and-forget pattern.
- **Scope**: backend
- **Branch**: `feature/SCRUM-102-backend`
- **Date**: 2026-03-02

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-102_backend.md`
- **Plan followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `77cb997` | feat(SCRUM-102): add login notification emails on new device detection | `auth.service.ts`, `auth.service.spec.ts`, `mail.service.ts`, `mail.service.spec.ts`, `login-notification.hbs` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Total tests**: 487 passed, 0 failed (36 suites)
- **New tests**: 9 (4 MailService + 5 AuthService)
- **Build**: `nest build` clean
- **MailService tests**: correct params, name fallback, SMTP resilience, UA parsing (Chrome/Safari/Firefox/Edge)
- **AuthService tests**: new IP notification, new UA notification, first login skip, known device skip, email failure resilience

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Header updated to SCRUM-102, changelog entry added |

No changes to `data-model.md`, `api-spec.yml`, or standards files — this ticket adds internal logic and an email template only, no new endpoints or schema changes.

## Lessons Learned

- The `notifyIfNewDevice()` helper pattern (single private method called from 3 login flows) keeps detection logic DRY and testable
- Session exclusion via `id: { not: sessionId }` is critical — without it, the just-created session would always match current IP/UA, defeating detection
- Fire-and-forget `.catch(() => {})` pattern is well-established in the codebase (audit, email) and keeps login latency unaffected
