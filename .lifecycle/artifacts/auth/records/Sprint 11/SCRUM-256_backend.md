# Implementation Record: SCRUM-256 — Code Hygiene Batch A (CH-01, EM-08, DU-04, TS-05)

## Summary

Fixed 4 WARN findings from the auth audit (2026-03-15). Extracted magic rate-limit numbers and cookie maxAge to named constants. Unified error message that disclosed OAuth-only account state. Deduplicated private `setCookie()` methods into shared utility. Replaced unsafe `Function` type with typed callback.

- **Scope**: backend
- **Branch**: feature/SCRUM-256-backend (merged, deleted)
- **Implementation date**: 2026-03-16

## Plan Reference

- **Plan**: ai-specs/changes/plans/Sprint 11/SCRUM-256_backend.md
- **Plan was followed**: Yes (1 minor deviation — see below)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `b3e9e99` | SCRUM-256: Fix 4 code hygiene WARNs (CH-01, EM-08, DU-04, TS-05) | `auth.constants.ts`, `account.controller.ts`, `users.controller.ts`, `oauth.controller.ts`, `auth.controller.ts`, `error-messages.ts`, `cookie.util.ts` (new), `pkce-authenticate.ts` |

## Deviations from Plan

| Step | Status | Deviation | Category |
|------|--------|-----------|----------|
| 0-6, 8-10 | DONE | — | — |
| 7 | DONE-DEVIATED | Plan specified `(this: unknown, req: unknown, options: unknown) => void` for `superAuthenticate`. Actual: `(...args: any[]) => void` with eslint-disable comment. `super.authenticate` from passport has typed `Request` params incompatible with `unknown`. | **Accepted-Trivial** — `(...args: any[])` is the ESLint-recommended `Function` replacement; no security or behavioral impact. |

## Test Results

- Overall: 919 tests passed, 0 failed, 65 suites
- Coverage: unchanged (V8 provider)
- No test file changes needed — error message constant name unchanged, value change matched existing test assertions

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added for SCRUM-256 |

## Lessons Learned

- TypeScript's `Function` type cannot always be replaced with fully typed signatures when wrapping framework internals (passport `super.authenticate`). The `(...args: any[]) => void` pattern with eslint-disable is the standard workaround.
- `setCookieFromConfig` shared utility cleanly eliminates duplicate private methods across controllers — good pattern for other cross-controller utilities.

## Audit Finding Verification

| Finding | Check | Result |
|---------|-------|--------|
| CH-01 (magic numbers) | `grep -rn "ttl: 900000\|ttl: 60_000.*limit: 5\|maxAge: 30_000" src/` | 0 matches — all extracted to constants |
| EM-08 (error disclosure) | `grep -rn "no password set" src/` | 0 matches — message unified |
| DU-04 (duplicate code) | `grep -rn "private setCookie" src/` | 0 matches — extracted to shared utility |
| TS-05 (unsafe type) | `grep -rn "superAuthenticate: Function" src/` | 0 matches — replaced with typed callback |

---
*Record created: 2026-03-16 | Ticket: SCRUM-256*
