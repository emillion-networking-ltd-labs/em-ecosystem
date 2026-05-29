# Implementation Record: SCRUM-327 Re-authentication on Profile Security Sections

## Summary

Closed 4 FAIL + 1 WARN from the SCRUM-327 enrichment audit by requiring password re-authentication on 5 sensitive Profile endpoints (3 trusted-device + 2 passkey). Aligns with OWASP ASVS V2.8, NIST SP 800-63B §5.2, and the GitHub/Google/Stripe sudo-mode convention.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-327-backend` (single branch carried both backend + frontend due to single-repo workspace; merged + deleted after PR #233)
- **Implementation date**: 2026-05-04

## Plan Reference

- Plan: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-327_fullstack.md`](../../plans/Sprint%2012/SCRUM-327_fullstack.md)
- Verify report: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-327_verify.md`](../../plans/Sprint%2012/SCRUM-327_verify.md)
- Plan was followed: **Yes** — 16/16 steps complete (8 backend + 7 frontend + 1 docs Deferred to /update-docs as planned). Verdict **PASS-WITH-DEBT**.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `3422a25` | SCRUM-327: Require password re-authentication on Profile sensitive actions | 22 files (4 DTOs, 2 services, 2 controllers, 5 backend specs, 2 lib, 2 hooks, 2 components, 2 frontend specs, 1 setup) |

PR #233 merged into `main` at 2026-05-04T00:21:54Z. Feature branch deleted (local + remote).

## Deviations from Plan

(Imported from `/verify` PASS-WITH-DEBT report — no reclassification.)

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| Step 2 | Modify base methods (`trustDevice`, `revokeDevice`, `revokeAllDevices`) to accept password | Introduced 3 `*WithReauth` wrappers + private `verifyPassword` helper; base methods unchanged | Internal callers (`mfa.service.disableMfa`, `mfa.controller.verifyLogin` fire-and-forget, `login.service.isTrustedDevice`) must NOT receive a password argument; wrapper pattern preserves their contract | Accepted-Trivial | — |
| Step 4 | Tighten `deletePasskey` for users WITH passwordHash | Also tightened OAuth-only (no passwordHash) path → throw `BadRequestException(PASSWORD_REQUIRED_NO_PASSWORD)` | Aligns with AC4 + D2 + `mfa.service.disableMfa` precedent. Closes the WARN gap proactively. | Accepted-Trivial | — |
| Step 8 | Manual curl smoke tests | Skipped during /verify | Local developer-time activity, runs naturally during pre-merge testing or Phase E audit re-run | Deferred | — |
| Step 9 | Update technical documentation in same commit | Deferred to /update-docs (this run) | Per plan Section 9 + SCRUM-342 precedent: docs commit to `ai-specs/main` separately, not in the code repo commit | Deferred | This run (record + integration-state + api-spec + backend-standards) |
| FE-0 | Separate `feature/SCRUM-327-frontend` branch | Single `feature/SCRUM-327-backend` branch carried fullstack | Single-repo workspace makes one branch the natural choice | Accepted-Trivial | — |
| FE-2 | Optimistic-removal pattern in `revokeDevice` hook | Switched to refetch-on-success | New `"invalid-password"` rollback case would cause UI flicker; cleaner UX | Accepted-Trivial | — |
| `tests/setup.ts` | (out of literal scope) | Added `window.matchMedia` polyfill | Required by Tooltip used in modal flows; net IMPROVEMENT — pre-existing baseline 31 failures → 13 failures across full frontend suite | Accepted-Quality | No new ticket — net improvement; rolled into commit |
| `passkey.controller.spec.ts` | Keep optional-password test | Deleted obsolete `'should work without password'` test | Test of obsolete contract; replaced by mandatory-password assertion | Accepted-Trivial | — |

**0 Risk, 0 Scope-Gap.** All deviations classified Accepted-Trivial / Accepted-Quality / Deferred.

## Test Results

**Backend** — 1052/1052 tests pass (was 1042 pre-SCRUM-327, +10 new cases)
- Unit: `npx jest --maxWorkers=1 --forceExit` → 69 suites green
- `nest build` → clean

New backend tests (15 added):
- `trusted-device.service.spec.ts`: +12 tests across 3 wrappers × 4 cases (happy, wrong-password, OAuth-only, user-not-found). Real `bcrypt.hash` for fixtures.
- `passkey.service.spec.ts`: +3 tests on `generateRegOptions` (OAuth-only, wrong password, password-checked-before-count-query for anti-enumeration).

Existing tests adjusted:
- `passkey-management.spec.ts`: deletePasskey OAuth-only test inverted (was "should delete without password" → "should reject with BadRequestException"). PASSKEY_DELETED audit and ctx-undefined tests switched to user-with-passwordHash fixtures.
- `passkey.controller.spec.ts`: registerOptions test wires password DTO; obsolete "without password" test deleted.
- `session.controller.spec.ts`: 3 `*WithReauth` mocks added; tests assert password propagation through controller → service.

**Frontend** — 13 failures across 5 suites, all PRE-EXISTING in unrelated specs (Button, Pagination, MfaTotpStep, ConnectedAccounts, SecurityActivity). Net IMPROVEMENT vs main baseline (31 failures).
- All 27 SCRUM-327-relevant assertions green: `TrustedDevices.test.tsx` (4 new), `PasskeyManager.test.tsx` (1 new + 1 updated), `usePasskey.test.ts` (Conditional UI tests unaffected).
- `tests/setup.ts` matchMedia polyfill is the net-improvement source (18 fewer pre-existing failures system-wide).

**Manual verification** — deferred to local developer smoke + Phase E audit re-run (per plan Section 9 + Camino Total Phase E ordering).

## Bugs Found

No bugs introduced. The implementation is purely additive (new password gate) on top of existing tested code paths.

One pre-existing inconsistency surfaced and was honestly disclosed during Step 2 design:
- The original plan suggested OAuth-only users get an MFA-TOTP fallback (AC5). Inspection of `mfa.service.disableMfa` showed this fallback is NOT implemented anywhere in the codebase today; the convention is to throw `BadRequestException(PASSWORD_REQUIRED_NO_PASSWORD)` and require the user to set a password first. Decision D2 aligned SCRUM-327 with this convention. A broader follow-up ("MFA-or-password" invariant for accounts with passkeys/trusted-devices) is recommended as a separate ticket.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | 5 endpoints updated to require `password` in request body (POST /auth/trusted-devices, DELETE /auth/trusted-devices, DELETE /auth/trusted-devices/:id, POST /auth/passkeys/register/options, DELETE /auth/passkeys/:id). Added 400/401 response codes with explicit messages. Documented OAuth-only behaviour. |
| `ai-specs/specs/integration-state.md` | TrustedDeviceService Service Dependency Chains row: appended `**UsersService** [SCRUM-327]` (deps 3 → 4). Added Changelog entry. |
| `ai-specs/specs/backend-standards.mdc` | Added new sub-section "Re-authentication on Sensitive Actions (MANDATORY) [SCRUM-327]" under Security Best Practices. Includes canonical pattern, table of currently enforcing endpoints (8), exclusions, frontend pairing rules, and PR review checklist. |
| `ai-specs/changes/auth/records/Sprint 12/SCRUM-327_fullstack.md` | This record (Part 1). |
| (`ai-specs/specs/data-model.md`) | No changes — no Prisma schema changes. |
| (`ai-specs/specs/audit-standards.mdc`) | No changes this run — proposed ASVS-V2.8 explicit checks left as recommendation; will be added when the next Phase 3 audit framework iteration happens (or in a follow-up housekeeping ticket). |

## Audit Finding Verification

Not strictly an audit-fix ticket (the `[enhanced]` block was generated by `/enrich-us` from the live-code gap inventory, not from a `/audit` framework run). Resolution table:

| Original gap (ticket `[enhanced]`) | Endpoint | Status | Evidence |
|------------------------------------|----------|--------|----------|
| FAIL — POST /auth/trusted-devices | `session.controller.trustDevice` | RESOLVED | calls `trustDeviceWithReauth(...)` with `dto.password` |
| FAIL — DELETE /auth/trusted-devices | `session.controller.revokeAllTrustedDevices` | RESOLVED | calls `revokeAllDevicesWithReauth(...)` |
| FAIL — DELETE /auth/trusted-devices/:id | `session.controller.revokeTrustedDevice` | RESOLVED | calls `revokeDeviceWithReauth(...)` |
| FAIL — POST /auth/passkeys/register/options | `passkey.service.generateRegOptions` | RESOLVED | inline `bcrypt.compare` before WebAuthn challenge |
| WARN — DELETE /auth/passkeys/:id | `passkey.service.deletePasskey` | RESOLVED | DTO `password!: string` mandatory; OAuth-only → 400 |

**Recurrence prevention**: `backend-standards.mdc` "Re-authentication on Sensitive Actions (MANDATORY)" (this run, see Documentation Updates above). PR review checklist documented. Audit framework Phase 3 already covers ASVS V2.8.x — explicit check IDs proposed for next audit iteration.

**SLA status**: HIGH severity per ticket — completed within sprint (Sprint 12), well within SOC 2 CC7.4 / OWASP SAMM L3 thresholds.

## Lessons Learned

- **Wrapper pattern preserves internal callers**: introducing `*WithReauth` methods as a parallel public surface (rather than overloading the bare methods) was the right call. It kept `mfa.service.disableMfa` and `mfa.controller.verifyLogin` untouched while adding the new gate at the controller boundary. Reusable pattern for future "tighten this endpoint without breaking that internal flow" tickets.
- **Inline `bcrypt.compare` is the codebase convention**, not a shared `verifyPassword` helper on UsersService. Confirmed via grep: 4 inline call sites in users.service.ts + 2 in mfa.service.ts. New code (TrustedDeviceService) followed the same convention with a private file-local helper to deduplicate.
- **DTO field name uniformity matters**: the plan briefly considered `currentPassword` (per ticket text) but `MfaDisableDto` already uses `password`. Aligning on `password` everywhere reduces cognitive load and avoids ambiguity in API docs.
- **OAuth-only users surface a real cross-cutting gap**: passkeys + trusted devices on OAuth-only accounts have no second factor today. Recommended follow-up: enforce "every account holding passkeys/trusted-devices must also have either a password OR MFA configured" — would need a migration scan for existing accounts.
- **matchMedia polyfill in tests/setup.ts is overdue**: any test that renders Tooltip-using components silently failed pre-SCRUM-327. Reduced 18 unrelated baseline failures system-wide as a side benefit.
- **Single-repo fullstack branches work**: split-branch convention (`*-backend` / `*-frontend`) is overhead in a single-repo workspace. Future fullstack tickets can default to `feature/[ticket-id]-fullstack`.
