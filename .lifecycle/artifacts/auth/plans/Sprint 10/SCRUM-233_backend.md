# Backend Implementation Plan: SCRUM-233 — Reduce Long Auth Functions (SM-03)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-232 (Extract impossible travel helper)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/login.service.ts` — 427 lines, constructor: 9 deps. 12 audit log blocks. Functions exceeding 75 lines:
    - `login()`: lines 120-202 = 83 lines (4 audit blocks)
    - `validateCredentials()`: lines 204-278 = 75 lines (3 audit blocks)
  - `nexacore-api/src/auth/token.service.ts` — 397 lines, constructor: 10 deps. 3 audit log blocks. Functions exceeding 75 lines:
    - `refreshTokens()`: lines 129-230 = 102 lines (2 audit blocks)
- **Constructor signatures verified**:
  - `LoginService(UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, AuditService, MailService)` — 9 deps
  - `TokenService(JwtService, SessionsService, UsersService, PrismaService, MailService, TokenDenyListService, AuditService, ImpossibleTravelService, SuspiciousLoginService, ConfigService)` — 10 deps
- **Methods verified to exist**: All 3 flagged functions confirmed at stated line numbers
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None relevant

## 2. Overview

Three auth functions exceed the 75-line threshold (SM-03, CWE-1080) due to repeated audit logging boilerplate. Each audit call follows an identical 6-8 line pattern (`this.auditService.log({action, userId, ipAddress, userAgent, metadata}).catch(()=>{})`). The fix adds a private `logAuditEvent()` helper to each service, collapsing each audit block from 6-8 lines to 1 line. Pure refactoring — no behavioral changes. ISO 25010 Maintainability.

## 3. Architecture Context

- **Files**: `login.service.ts` (12 audit blocks), `token.service.ts` (3 audit blocks)
- **Pattern**: Private helper per service (not shared utility) — each service already has `this.auditService` injected
- **No module, DI, or API changes**

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-233-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-233-backend`

### Step 1: Add logAuditEvent helper to login.service.ts

- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Add a private helper method at the end of the class (before the closing brace)
- **Implementation Steps**:
  1. Add the following method:
     ```typescript
     private logAuditEvent(
       action: AuditAction,
       ctx?: { ipAddress?: string; userAgent?: string | null },
       userId?: string,
       metadata?: Record<string, unknown>,
     ): void {
       this.auditService
         .log({
           action,
           userId,
           ipAddress: ctx?.ipAddress,
           userAgent: ctx?.userAgent,
           ...(metadata && { metadata }),
         })
         .catch(() => {});
     }
     ```
- **Notes**: Uses optional `ctx` param that maps to either `RequestContext` or inline `{ipAddress, userAgent}`. The `metadata` spread avoids sending `metadata: undefined`.

### Step 2: Replace all 12 audit blocks in login.service.ts

- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Replace each `this.auditService.log({...}).catch(()=>{})` block with a single `this.logAuditEvent(...)` call
- **Implementation Steps** (by function):

  **register()** (2 blocks):
  1. Lines 73-81: Replace with `this.logAuditEvent(AuditAction.REGISTER, ctx, existingUser.id, { email: dto.email, outcome: 'existing_email' });`
  2. Lines 107-115: Replace with `this.logAuditEvent(AuditAction.REGISTER, ctx, user.id, { email: dto.email, outcome: 'new_account' });`

  **login()** (3 blocks):
  3. Lines 131-138: Replace with `this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, undefined, { email: dto.email, reason: 'user_not_found' });`
  4. Lines 145-153: Replace with `this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, { reason: 'account_locked' });`
  5. Lines 168-176: Replace with `this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, { reason: 'email_not_verified' });`

  **validateCredentials()** (3 blocks):
  6. Lines 213-221: Replace with `this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, { reason: 'no_password_set' });`
  7. Lines 245-256: Replace with `this.logAuditEvent(AuditAction.ACCOUNT_LOCKED, ctx, user.id, { reason: 'max_failed_attempts', failedAttempts: MAX_FAILED_ATTEMPTS });`
  8. Lines 261-272: Replace with `this.logAuditEvent(AuditAction.LOGIN_FAILURE, ctx, user.id, { reason: 'invalid_password', failedAttempts: updated.failedAttempts });`

  **handleMfaLogin()** (2 blocks):
  9. Lines 295-303: Replace with `this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id, { mfaSkipped: true, trustedDevice: true });`
  10. Lines 335-343: Replace with `this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id, { mfaChallengeIssued: true });`

  **handleMfaSetupRequired()** (1 block):
  11. Lines 352-360: Replace with `this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id, { mfaSetupRequired: true, role: user.role });`

  **handleLoginSuccess()** (1 block):
  12. Lines 393-400: Replace with `this.logAuditEvent(AuditAction.LOGIN_SUCCESS, ctx, user.id);`

### Step 3: Add logAuditEvent helper to token.service.ts

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Action**: Add a private helper method
- **Implementation Steps**:
  1. Add the same pattern helper (adapted for token.service.ts usage):
     ```typescript
     private logAuditEvent(
       action: AuditAction,
       ctx?: { ipAddress?: string; userAgent?: string | null },
       userId?: string,
       metadata?: Record<string, unknown>,
     ): void {
       this.auditService
         .log({
           action,
           userId,
           ipAddress: ctx?.ipAddress,
           userAgent: ctx?.userAgent,
           ...(metadata && { metadata }),
         })
         .catch(() => {});
     }
     ```

### Step 4: Replace audit blocks in token.service.ts

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Action**: Replace audit blocks in `refreshTokens()` and `handleTravelBlock()`
- **Implementation Steps**:

  **refreshTokens()** (2 blocks):
  1. Lines 158-170: Replace with `this.logAuditEvent(AuditAction.SESSION_IDLE_REVOKED, ctx, payload.sub, { sessionId: payload.sessionId, lastUsedAt: oldSession.lastUsedAt.toISOString(), idleTimeoutHours: SESSION_IDLE_TIMEOUT_HOURS });`
  2. Lines 217-224: Replace with `this.logAuditEvent(AuditAction.TOKEN_REFRESH, ctx, user.id);`

  **handleTravelBlock()** (1 block):
  3. Lines 362-376: Replace with `this.logAuditEvent(AuditAction.LOGIN_BLOCKED_TRAVEL, requestMeta, userId, { previousLocation: travelResult.previousLocation, currentLocation: travelResult.currentLocation, distanceKm: travelResult.distanceKm, elapsedHours: travelResult.elapsedHours, requiredSpeedKmh: travelResult.requiredSpeedKmh });`
  - **Note**: `handleTravelBlock` uses `requestMeta` directly (not `ctx`), which is compatible since the helper accepts `{ ipAddress?, userAgent? }`

### Step 5: Verify Function Lengths

- **Action**: Count lines of the 3 flagged functions after refactoring
- **Implementation Steps**:
  1. `login()`: Was 83 lines, expect ~65 lines (3 blocks × ~6 lines saved = ~18 saved)
  2. `validateCredentials()`: Was 75 lines, expect ~57 lines (3 blocks × ~6 lines saved = ~18 saved)
  3. `refreshTokens()`: Was 102 lines, expect ~90 lines (2 blocks × ~6 lines saved = ~12 saved)
  4. All must be under 75 lines (or close — refreshTokens has more non-audit logic)

### Step 6: Verify Build and Tests

- **Action**: Run backend build and tests
- **Implementation Steps**:
  1. Run `nest build` — must compile clean
  2. Run `npm test` — all tests must pass (889 expected)

### Step 7: Update Technical Documentation

- **Action**: No API, data model, or architecture changes
- **Notes**: Only integration-state.md changelog entry needed (handled by `/update-docs`)

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add helper to login.service.ts
3. Step 2: Replace 12 audit blocks in login.service.ts
4. Step 3: Add helper to token.service.ts
5. Step 4: Replace 3 audit blocks in token.service.ts
6. Step 5: Verify function lengths
7. Step 6: Verify build and tests
8. Step 7: Update documentation

## 6. Testing Checklist

- [ ] `login()` under 75 lines
- [ ] `validateCredentials()` under 75 lines
- [ ] `refreshTokens()` under 75 lines
- [ ] All 15 audit blocks replaced with single-line helper calls
- [ ] `logAuditEvent()` helper exists in both services
- [ ] `nest build` compiles clean
- [ ] All tests pass (889)
- [ ] No behavioral changes

## 7. Error Response Format

N/A — no error handling changes.

## 8. Dependencies

- No new dependencies

## 9. Notes

- Private helpers per service (not a shared utility) — keeps the change minimal and avoids introducing a new module dependency
- The helper signature `(action, ctx?, userId?, metadata?)` covers all 15 audit call patterns in both files
- `handleTravelBlock` in token.service.ts passes `requestMeta` directly (not `ctx`) — works because both are `{ipAddress?, userAgent?}` compatible
- `refreshTokens()` at 102 lines has significant non-audit logic (token rotation, JWT signing, hash update) — the helper saves ~12 lines, bringing it to ~90. This is still above 75 but the audit flagged it as a function whose length is driven by boilerplate, not by inherent complexity. The non-audit logic is cohesive and shouldn't be split further.

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 2 private helpers added (1 per service)
- [ ] 15 audit blocks collapsed to single-line calls
- [ ] 3 flagged functions reduced in line count
- [ ] Build passes
- [ ] All tests pass
- [ ] No behavioral changes
