# Backend Implementation Plan: SCRUM-244 Audit Fix Batch 2 — Documentation

## Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-243 (Audit Fix Batch 1 — Code Fixes)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/oauth-auth.service.ts` — constructor lines 18-24 (5 deps)
  - `nexacore-api/src/auth/token.service.ts` — constructor lines 50-61 (10 deps)
  - `nexacore-api/src/auth/login.service.ts` — constructor lines 41-51 (9 deps)
  - `ai-specs/ai-specs/specs/integration-state.md` — lines 189-202 (Service Dependency Chains)
- **Constructor signatures verified**:
  - `OAuthAuthService(usersService, oauthCodeStore, tokenService, auditService, suspiciousLoginService)` — 5 deps
  - `TokenService(jwtService, sessionsService, usersService, prisma, mailService, tokenDenyListService, auditService, impossibleTravelService, suspiciousLoginService, configService)` — 10 deps
  - `LoginService(usersService, tokenService, emailVerificationService, passwordBreachService, trustedDeviceService, impossibleTravelService, suspiciousLoginService, auditService, mailService)` — 9 deps
- **Discrepancies with integration-state.md**:
  1. Line 193: OAuthAuthService lists ImpossibleTravelService — **REMOVED by SCRUM-232** (actual: 5 deps, documented: 6)
  2. Line 191: TokenService missing ConfigService — **ADDED by SCRUM-223** (actual: 10 deps, documented: 9)

## Overview

Fix remaining audit finding I-06 (FAIL): update stale Service Dependency Chains in integration-state.md. All other findings (D-03, D-06, D-09, D-12, I-05, I-10) were verified as already fixed.

## Architecture Context

- **Modules involved**: None (documentation-only)
- **Files affected**: `ai-specs/ai-specs/specs/integration-state.md` (lines 191, 193)
- **No code changes required**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-244-backend` from latest `main`
- **Branch Naming**: `feature/SCRUM-244-backend`

### Step 1: Fix OAuthAuthService Dependency Chain (I-06)

- **File**: `ai-specs/ai-specs/specs/integration-state.md`, line 193
- **Action**: Remove `ImpossibleTravelService` from OAuthAuthService chain
- **Current (stale)**: `OAuthAuthService → UsersService, OAuthCodeStore, TokenService, AuditService, ImpossibleTravelService, SuspiciousLoginService`
- **Correct**: `OAuthAuthService → UsersService, OAuthCodeStore, TokenService, AuditService, SuspiciousLoginService`
- **Reason**: SCRUM-232 removed ImpossibleTravelService from constructor (6→5 deps)

### Step 2: Fix TokenService Dependency Chain (additional I-06 drift)

- **File**: `ai-specs/ai-specs/specs/integration-state.md`, line 191
- **Action**: Add `ConfigService` to TokenService chain
- **Current (stale)**: `TokenService → JwtService, SessionsService, UsersService, PrismaService, MailService, TokenDenyListService, AuditService, ImpossibleTravelService, SuspiciousLoginService`
- **Correct**: `TokenService → JwtService, SessionsService, UsersService, PrismaService, MailService, TokenDenyListService, AuditService, ImpossibleTravelService, SuspiciousLoginService, **ConfigService**`
- **Reason**: SCRUM-223 injected ConfigService as 10th constructor dep

### Step 3: Update Changelog

- **File**: `ai-specs/ai-specs/specs/integration-state.md`, Changelog section
- **Action**: Add entry for SCRUM-244

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Fix OAuthAuthService chain
3. Step 2: Fix TokenService chain
4. Step 3: Update changelog

## Testing Checklist

- [ ] No code changes — no build/test verification needed
- [ ] Verify OAuthAuthService chain matches constructor (5 deps)
- [ ] Verify TokenService chain matches constructor (10 deps)
- [ ] Changelog entry added

## Dependencies

None — documentation-only changes.

## Notes

- 6 of 7 original findings were already resolved by previous tickets
- This ticket addresses only the remaining stale documentation (I-06)
- No code, build, or test changes required
