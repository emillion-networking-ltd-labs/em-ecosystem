# Implementation Record: SCRUM-23 OAuth Security Hardening

## Summary

Replaced tokens-in-URL OAuth flow with ephemeral code exchange pattern, added CSRF protection via state parameter validation, and implemented redirect URL allowlisting.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-23-oauth-security-hardening`
- **Implementation date**: 2026-02-26

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-23_fullstack.md`
- **Plan followed**: Partially — 2 minor deviations, both technically superior to planned approach (see Deviations section)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `cd89a34` | feat(SCRUM-23): OAuth security hardening — ephemeral code exchange, state validation, redirect allowlist | 20 files (see below) |

**Files created (8):**
- `nexacore-api/src/auth/stores/oauth-state.store.ts` — CSRF state parameter store (5min TTL)
- `nexacore-api/src/auth/stores/oauth-code.store.ts` — Ephemeral code-to-token mapping (60s TTL)
- `nexacore-api/src/auth/dto/oauth-exchange.dto.ts` — DTO for POST /auth/oauth/exchange
- `nexacore-api/src/auth/tests/oauth-state.store.spec.ts` — 6 unit tests
- `nexacore-api/src/auth/tests/oauth-code.store.spec.ts` — 6 unit tests
- `nexacore-api/src/auth/tests/oauth-exchange.spec.ts` — 3 integration tests
- `nexacore-api/src/auth/tests/google.strategy.spec.ts` — Strategy state validation tests
- `nexacore-api/src/auth/tests/github.strategy.spec.ts` — Strategy state validation tests

**Files modified (12):**
- `nexacore-api/src/auth/auth.controller.ts` — Added exchange endpoint, redirect validation, updated callbacks
- `nexacore-api/src/auth/auth.service.ts` — Added generateOAuthCode/exchangeOAuthCode methods
- `nexacore-api/src/auth/auth.module.ts` — Registered OAuthStateStore and OAuthCodeStore providers
- `nexacore-api/src/auth/guards/google-auth.guard.ts` — Inject state into OAuth initiation
- `nexacore-api/src/auth/guards/github-auth.guard.ts` — Inject state into OAuth initiation
- `nexacore-api/src/auth/strategies/google.strategy.ts` — passReqToCallback, state validation
- `nexacore-api/src/auth/strategies/github.strategy.ts` — passReqToCallback, state validation
- `nexacore-api/src/auth/tests/auth.controller.spec.ts` — Updated callback tests, added exchange tests
- `nexacore-api/src/auth/tests/auth.service.spec.ts` — Added OAuthCodeStore mock and method tests
- `nexacore-api/.env.example` — Added OAUTH_ALLOWED_REDIRECT_URLS
- `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx` — Reads code instead of tokens
- `nexacore-dashboard/src/context/AuthContext.tsx` — handleOAuthCallback exchanges code via POST

## Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | Create `guards/oauth-state.guard.ts` as separate guard for state validation | State validation done inside strategies via `passReqToCallback: true` | Standard Passport pattern — guard generates state on initiation, strategy validates on callback. A separate guard would add unnecessary coupling (3 components instead of 2) |
| 2 | Modify `nexacore-dashboard/src/lib/types.ts` to add `OAuthExchangeResponse` type | Not modified | `AuthResponse` already has the exact shape `{ user, accessToken, refreshToken }` — duplicate type unnecessary |

## Test Results

- **Unit tests**: 101 passed / 0 failed (11 suites)
- **Integration tests**: Included in above count (oauth-exchange.spec.ts)
- **Both builds**: `nest build` and `next build` succeeded
- **Manual verification**:
  - Register via POST /auth/register — PASS (returns tokens + user)
  - Login via POST /auth/login — PASS (returns tokens + user)
  - Fabricated code on POST /auth/oauth/exchange — PASS (401 Unauthorized)
  - Empty body on POST /auth/oauth/exchange — PASS (400 Validation Error)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Added POST /auth/oauth/exchange endpoint; updated OAuth callback descriptions to reflect ephemeral code redirect; added state parameter and redirect allowlist documentation |

## Lessons Learned

- In-memory stores (OAuthStateStore, OAuthCodeStore) are appropriate for single-instance deployments but will need Redis backing for horizontal scaling (future SCRUM ticket scope)
- The `passReqToCallback: true` Passport option is essential for state parameter validation within NestJS strategy classes
- PowerShell aliases `curl` to `Invoke-WebRequest` on Windows — manual test instructions should specify `Invoke-RestMethod` or use bash terminal
