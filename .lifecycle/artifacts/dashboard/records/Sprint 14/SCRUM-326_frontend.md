# Implementation Record: SCRUM-326 Fix Session Inconsistency

## Summary

Fixed "half-disconnected" state where UI thinks it's connected but backend doesn't. Root cause: api.ts threw SessionExpiredError immediately when accessToken was null (after F5) instead of attempting silentRefresh. Also improved idle timeout buffer and IdleWarningModal visual consistency.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-326-frontend`
- **PR**: #224 (merged)
- **Implementation date**: 2026-04-21

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-326_frontend.md`
- Plan was followed: **Yes** with visual improvements to IdleWarningModal

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `33f584c` | SCRUM-326: Fix session inconsistency + idle warning improvements | 5 files (71+, 45-) |
| `39e71a3` | Merge pull request #224 | merge |

## Changes

| Fix | File | Description |
|-----|------|-------------|
| F5 blank screen | api.ts | Removed early `if (!accessToken && !refreshPromise) throw SessionExpiredError` — now always attempts silentRefresh on 401 |
| Duplicate logout | api.ts | Added `authFailureTriggered` flag — onAuthFailure called exactly once |
| Idle timeout buffer | AuthContext.tsx | 28 min (was 30) — 2 min buffer before backend revokes at 30 |
| CountdownTimer | CountdownTimer.tsx | Added `variant` (error/warning) + `size` (sm/lg) props. Styles moved from CSS global to Tailwind |
| IdleWarningModal | IdleWarningModal.tsx | CountdownTimer warning/lg, overlay `bg-[var(--overlay)]`, button autoFocus |
| CSS cleanup | globals.css | Removed `.countdown-digit` class (moved to component) |

## Root Cause Analysis

The F5 problem: when page reloads, `accessToken` in memory is null. AuthContext calls `refreshSession()` (direct fetch, not via apiClient). Meanwhile components render and call `apiClient.get()`. The request goes without token → 401. api.ts line 125 checked `!this.accessToken && !this.refreshPromise` — both true because refreshSession doesn't use apiClient's silentRefresh. Result: immediate SessionExpiredError instead of attempting refresh.

Fix: removed the early exit. All 401s now attempt silentRefresh, which either succeeds (new token) or fails (clean logout via authFailureTriggered flag).

## Test Results

- **Frontend build**: PASS
- **Frontend TypeScript**: 0 errors
- **Backend tests**: 1032/1032 pass

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-326_frontend.md` | This record |

## Lessons Learned

- CSS variable format inconsistency (`--color-error` uses RGB values, `--color-warning` uses HEX) caused Tailwind arbitrary value syntax to fail — always verify token format before using `rgb(var(...))` pattern
- Component props (variant/size) are more reliable than CSS overrides for variant styling
- The early exit optimization in api.ts (skip refresh if no token) was premature and caused the exact problem it tried to avoid
