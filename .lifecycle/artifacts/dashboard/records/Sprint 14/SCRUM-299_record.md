# SCRUM-299 — Implementation Record

## Ticket
**Summary**: Auto-logout on expired session + fix duplicate toast on 401
**Sprint**: 14 — UI Foundation
**Status**: Done
**Commits**: 694e09d (Phase 1), d8d620f (Phase 2), 64e55f0 (test fixes)
**PR**: #179 (Phase 1, merged 2026-03-27) + direct-to-main (Phase 2, 2026-03-29)

## Phase 1 — PR #179 (3 files)

| File | Change |
|------|--------|
| `src/lib/api.ts` | `onAuthFailure` callback when silentRefresh returns null |
| `src/context/AuthContext.tsx` | `handleAuthFailure` dispatches LOGOUT on mount |
| `src/app/admin/page.tsx` | AbortController in fetchUsers useEffect |

## Phase 2 — Direct to main (5 files, 2 new)

| File | Change |
|------|--------|
| `src/lib/api.ts` | New `SessionExpiredError` class thrown on silentRefresh failure |
| `src/context/AuthContext.tsx` | Warning toast in handleAuthFailure + useIdleTimeout (30 min) + IdleWarningModal rendering |
| `src/app/admin/page.tsx` | Skips LOAD_USERS_FAILED toast on SessionExpiredError |
| `src/hooks/useIdleTimeout.ts` | NEW: Tracks real user interaction (mousemove, keydown, scroll, touch). Warning callback 2 min before timeout. keepAlive resets timer. Activity ignored during warning. |
| `src/components/ui/IdleWarningModal.tsx` | NEW: Countdown display + "Keep me signed in" button. z-50 overlay. |

## Security Layers (defense in depth)
1. **Frontend idle** (30 min) — primary, proactive, OWASP ASVS V3.3.2
2. **Backend idle** (30 min lastUsedAt check) — backup during silentRefresh
3. **Refresh token** (7d absolute max) — hard session limit
4. **SessionExpiredError** — prevents redundant component-level error toasts

## Test Updates (64e55f0)
- auth-password.spec.ts: Updated for forgotPassword universal flow
- users.service.spec.ts: auto-verify action expects 'auto-verified'
- users.service.ts: Step 1 returns 'login' for profile-only, 'auto-verified' for verify

## Deviations
- **Accepted-Quality**: Phase 2 scope expanded during manual testing to include idle timeout + warning modal (not in original ticket). Essential for OWASP V3.3.2 compliance.
