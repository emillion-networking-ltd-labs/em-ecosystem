# SCRUM-301 — Implementation Record

## Ticket
**Summary**: Allow OAuth login for unverified local accounts (auto-verify + anti pre-hijack)
**Sprint**: 14 — UI Foundation
**Status**: Done
**Commits**: 3575004, 5e4aca4, c2b9fbd, 3696a6a
**PR**: #181 (merged 2026-03-28) + direct-to-main fixes (2026-03-28/29)

## Changes (10+ files across 4 commits)

### PR #181 — Core auto-verify logic
| File | Change |
|------|--------|
| `src/common/interfaces/oauth-profile.interface.ts` | Added `emailVerified?: boolean` field |
| `src/auth/strategies/google.strategy.ts` | Passes `emailVerified: true` (Google always verifies) |
| `src/auth/strategies/github.strategy.ts` | Extracts `verified` from primary email, passes `emailVerified` |
| `src/audit/enums/audit-action.enum.ts` | Added `OAUTH_AUTO_VERIFIED` |
| `prisma/schema.prisma` + migration | Added `OAUTH_AUTO_VERIFIED` to AuditAction enum |
| `src/users/users.service.ts` | `findOrCreateByOAuth`: auto-link + verify + nullify passwordHash |
| `src/users/tests/users.service.spec.ts` | 2 new tests |
| `src/auth/tests/google.strategy.spec.ts` | Updated for emailVerified field |
| `src/auth/tests/github.strategy.spec.ts` | Updated for emailVerified field |

### Fix c2b9fbd — Step 1 re-login auto-verify
| File | Change |
|------|--------|
| `src/users/users.service.ts` | Step 1 (existing OAuthAccount) also auto-verifies if emailVerified=false |
| `src/users/tests/users.service.spec.ts` | Updated mock users with emailVerified=true |

### Commit 3696a6a — UX: auto-verified action + toast + profile banner
| File | Change |
|------|--------|
| `src/auth/interfaces/auth.interfaces.ts` | Added `'auto-verified'` to oauthAction type |
| `src/auth/auth.service.ts` | Updated oauthAction type |
| `src/auth/oauth-auth.service.ts` | Added `'auto-verified'` to auditActionMap + types |
| `src/auth/stores/oauth-code.store.ts` | Added oauthAction to OAuthTokenPayload |
| `src/users/users.service.ts` | Returns `action: 'auto-verified'` (both paths) |
| `nexacore-dashboard/src/context/AuthContext.tsx` | Warning toast (10s) on auto-verify |
| `nexacore-dashboard/src/lib/types.ts` | Added `'auto-verified'` to frontend type |
| `nexacore-dashboard/src/components/profile/ChangePasswordForm.tsx` | Warning banner when !hasPassword |

## Security
- Anti pre-hijack: passwordHash nullified (OWASP 2022, USENIX research)
- Only providers with emailVerified=true trigger auto-verify
- GitHub unverified emails still blocked (ConflictException)
- Audit trail: OAUTH_AUTO_VERIFIED logged with provider metadata
- Warning toast guides user to set password for alternative access

## Deviations
- **Accepted-Quality**: Step 1 re-login path initially missed auto-verify (fix c2b9fbd). Found during manual testing.
- **Accepted-Quality**: oauthAction 'auto-verified' added post-merge to improve UX feedback (commit 3696a6a).
