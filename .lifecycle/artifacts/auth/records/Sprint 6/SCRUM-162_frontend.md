# Implementation Record: SCRUM-162 Frontend — ConnectedAccounts Multi-Provider Redesign

## 1. Summary

Aligned frontend SafeUser type, OAuth API client, and ConnectedAccounts component with the multi-provider backend architecture (SCRUM-161). ConnectedAccounts now supports independent connect/disconnect per provider with last-provider safety guard. Admin components updated to use `isActive` instead of removed `lockedUntil` field.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-162-frontend`
- **Implementation date**: 2026-03-09
- **PR**: #45

## 2. Plan Reference

- **Plan**: `ai-specs/ai-specs/changes/plans/Sprint 6/SCRUM-162_frontend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `4fca50a` | feat(SCRUM-162): redesign ConnectedAccounts for multi-provider OAuth | `src/components/profile/ConnectedAccounts.tsx`, `src/lib/types.ts`, `src/lib/oauth-api.ts`, `src/context/AuthContext.tsx`, `src/components/profile/ChangeEmailForm.tsx` + 5 more |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 1 | Remove `failedAttempts`, `lockedUntil`, `lockoutCount` from SafeUser | Removed as planned, but caused TS errors in 4 admin/profile components not listed in plan | Plan did not account for admin components using `lockedUntil` for lock status display | Accepted — fixed during implementation by replacing `lockedUntil` check with `!isActive` |
| Step 1 | Remove `provider` and `providerId` from SafeUser type | Kept `provider` and `providerId` in SafeUser type | Backend still returns these fields (dual-write, removed in SCRUM-163). Removing them from the type would break type safety for any code that reads the API response | Accepted — will be removed in SCRUM-163 |

## 5. Files Changed

### Renamed Files (1)

| File | Purpose |
|------|---------|
| `src/lib/unlink-oauth-api.ts` → `src/lib/oauth-api.ts` | Broader OAuth API client (unlink + list providers) |

### Modified Source Files (9)

| File | Changes |
|------|---------|
| `src/lib/types.ts` | SafeUser: removed `failedAttempts`/`lockedUntil`/`lockoutCount`, added `oauthProviders: string[]`. New `LinkedProvider` type. `UnlinkOAuthDto.password` made optional |
| `src/lib/oauth-api.ts` | `unlinkOAuth(provider, password)` per-provider endpoint, new `getLinkedProviders()` |
| `src/components/profile/ConnectedAccounts.tsx` | Multi-provider: `oauthProviders.includes()`, per-provider modal via `disconnectingProvider` state, `/auth/link/` redirect, last-provider safety guard |
| `src/context/AuthContext.tsx` | `handleOAuthCallback` toast uses `oauthProviders[]` instead of `user.provider` |
| `src/components/profile/ChangeEmailForm.tsx` | `isOAuthOnly` replaces `isLocal`, multi-provider name display |
| `src/app/admin/page.tsx` | `handleToggleLock` uses `isActive` instead of `lockedUntil` |
| `src/components/admin/ActionDropdown.tsx` | `isLocked` uses `!user.isActive` |
| `src/components/admin/UsersTable.tsx` | `isLocked` uses `!user.isActive` |
| `src/components/profile/AccountInfo.tsx` | `isLocked` uses `!user.isActive` |

## 6. Test Results

- **Frontend**: 7 suites, 31 tests — all pass
- **TypeScript**: `tsc --noEmit` compiles clean
- **Net test change**: 0 (no new tests — logic changes only, no new components)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added (see Part 2) |

## 9. Lessons Learned

- Backend SafeUser omits `failedAttempts`/`lockedUntil`/`lockoutCount` via `Omit<>`, but the frontend type still had them. Admin components depended on `lockedUntil` for display — required updating 4 additional files not in the plan.
- Keeping `provider`/`providerId` in the frontend SafeUser type during the dual-write phase (SCRUM-161→SCRUM-163) prevents type mismatches when the backend response includes these fields. The plan recommended removing them, but pragmatic approach is to remove them only when the backend stops sending them (SCRUM-163).
- File rename (`unlink-oauth-api.ts` → `oauth-api.ts`) tracked well by git with `git mv`.
