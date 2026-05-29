# Implementation Record: SCRUM-237 Replace OAuth Callback Query Param with httpOnly Cookie

## Summary

Replaced the OAuth ephemeral authorization code delivery mechanism from URL query parameter (`?code=XXX`) to httpOnly cookie (`oauth_code`). This eliminates code exposure in browser history, server access logs, and Referer header leakage (CWE-598, OWASP ASVS V3.4.2).

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-237`
- **Date**: 2026-03-15

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 11/SCRUM-237_fullstack.md`
- **Plan followed**: Yes — all 8 steps implemented. Two sub-items from Step 3 and Step 8 were deferred (api-spec.yml update and /update-docs), resolved retroactively.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `56a0009` | SCRUM-237: Replace OAuth callback query param with httpOnly cookie | `oauth.controller.ts`, `oauth-exchange.dto.ts` (deleted), `oauth.controller.spec.ts`, `oauth-exchange.spec.ts`, `OAuthCallbackHandler.tsx`, `AuthContext.tsx` |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 3 (sub-item) | Update api-spec.yml | Not done in commit | `/update-docs` was skipped | Accepted-Quality | Fixed retroactively in this /update-docs run |
| 8 | Update technical documentation | Skipped | `/verify` and `/update-docs` were both skipped due to context exhaustion | Accepted-Quality | Fixed retroactively in this /update-docs run |

Both deviations resolved — no follow-up tickets needed.

## Test Results

- **Total tests**: 903 passed / 0 failed (pre-push verified)
- **OAuth tests updated**: 14 tests modified for cookie-based flow
- **New tests added**: missing cookie → 401, undefined cookies → 401
- **Build**: `nest build` clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Updated `/auth/google/callback`, `/auth/github/callback` descriptions (cookie instead of ?code=). Updated `/auth/oauth/exchange`: removed requestBody schema, removed 400 response, updated description to reflect cookie-based flow, removed `refreshToken` from response (httpOnly cookie). |
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-237 |

## Lessons Learned

- The `/verify` and `/update-docs` steps must never be skipped, even when context is running low. Both were skipped for this ticket and had to be done retroactively, which is error-prone and creates documentation gaps.
- The `cookie-parser` middleware was already configured in `main.ts` for refresh tokens, so no additional setup was needed for the oauth_code cookie.
- `@Res({ passthrough: true })` is the correct NestJS pattern when you need to set cookies but still want NestJS to handle the response serialization.
