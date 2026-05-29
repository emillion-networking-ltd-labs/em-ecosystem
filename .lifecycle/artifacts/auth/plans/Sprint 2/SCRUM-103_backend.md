# Backend Implementation Plan: SCRUM-103 Session Idle Timeout + Concurrent Limits

## Codebase State Snapshot
- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-102 (per integration-state.md)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/sessions/sessions.service.ts` — 161 lines, 8 methods, PrismaService-only dependency
  - `nexacore-api/src/sessions/sessions.module.ts` — minimal, providers+exports SessionsService only, no imports
  - `nexacore-api/src/sessions/entities/session.entity.ts` — Session interface (includes `lastUsedAt`), SessionResponse, toSessionResponse
  - `nexacore-api/src/sessions/tests/sessions.service.spec.ts` — 37 tests, Prisma mock with session methods, fake timers
  - `nexacore-api/src/auth/auth.service.ts` — generateTokens() lines 532-568 (private), refreshTokens() lines 342-407, login() lines 160-340, validateOAuthUser() lines 409-443, generateTokensForMfa() lines 510-530
  - `nexacore-api/src/auth/constants/auth.constants.ts` — 68 lines: BCRYPT_ROUNDS, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATIONS, GLOBAL_RATE_LIMIT, AUTH_RATE_LIMITS
  - `nexacore-api/src/audit/enums/audit-action.enum.ts` — 17 values (LOGIN_SUCCESS through MFA_DISABLED)
  - `nexacore-api/prisma/schema.prisma` — Session model lines 71-89, indexes: [userId], [tokenFamily], [userId, isRevoked]
- **Constructor signatures verified**: SessionsService(PrismaService), AuthService(UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService)
- **Guard dependency chain verified**: N/A — no guard changes
- **Test baseline**: 487 total project tests

## Overview

Implement two session security features: (1) **idle timeout** — sessions unused for N hours are rejected on token refresh and hidden from the active sessions list, and (2) **concurrent session limit** — cap active sessions per user at N, evicting the oldest when the limit is exceeded on new login. Both are configurable via env vars, enforced at request time (no scheduler), and audited.

## Architecture Context

- **Modules affected**: SessionsModule (new methods + AuditModule import), AuthModule (enforcement logic), AuditModule (new enum values), Prisma schema (new index + enum values)
- **DI change**: SessionsModule must import AuditModule so SessionsService can log eviction/idle-revocation events
- **No new controllers, guards, endpoints, or npm packages**
- **Pattern**: Constants in `auth.constants.ts`, enforcement at request-time in service layer, fire-and-forget audit logging

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-103-backend`
- **Steps**:
  1. `git checkout feature/SCRUM-102-backend` (latest branch)
  2. `git checkout -b feature/SCRUM-103-backend`
  3. `git branch` to verify

### Step 1: Add Session Constants

- **File**: `nexacore-api/src/auth/constants/auth.constants.ts`
- **Action**: Add after `AUTH_RATE_LIMITS` (after line 67)
- **Code**:
  ```typescript
  /**
   * Session idle timeout in hours.
   * Sessions with lastUsedAt older than this are rejected on refresh.
   */
  export const SESSION_IDLE_TIMEOUT_HOURS = parseInt(
    process.env.SESSION_IDLE_TIMEOUT_HOURS || '24',
    10,
  );

  /**
   * Maximum concurrent active (non-idle, non-revoked, non-expired) sessions per user.
   * Oldest evicted on overflow.
   */
  export const MAX_CONCURRENT_SESSIONS = parseInt(
    process.env.MAX_CONCURRENT_SESSIONS || '5',
    10,
  );
  ```

### Step 2: Add New Audit Actions

- **File 1**: `nexacore-api/src/audit/enums/audit-action.enum.ts`
- **Action**: Add two values after `MFA_DISABLED`:
  ```typescript
  SESSION_IDLE_REVOKED = 'SESSION_IDLE_REVOKED',
  SESSION_LIMIT_EXCEEDED = 'SESSION_LIMIT_EXCEEDED',
  ```

- **File 2**: `nexacore-api/prisma/schema.prisma`
- **Action**: Add two values to the Prisma `AuditAction` enum (before closing `}`):
  ```prisma
  SESSION_IDLE_REVOKED
  SESSION_LIMIT_EXCEEDED
  ```

### Step 3: Add Prisma Index + Generate Migration

- **File**: `nexacore-api/prisma/schema.prisma`
- **Action**: Add composite index to Session model after `@@index([userId, isRevoked])` (line 87):
  ```prisma
  @@index([userId, isRevoked, lastUsedAt])
  ```
- **Migration**:
  ```bash
  cd nexacore-api && npx prisma migrate dev --name add_session_idle_index_and_audit_actions
  npx prisma generate
  ```
- **Expected SQL**: `ALTER TYPE "AuditAction" ADD VALUE ...` (x2) + `CREATE INDEX ... ON "sessions"("userId", "isRevoked", "lastUsedAt")`

### Step 4: Add/Modify SessionsService Methods + Update Module

#### 4a: Update SessionsModule to Import AuditModule

- **File**: `nexacore-api/src/sessions/sessions.module.ts`
- **Change**: Add `imports: [AuditModule]`
  ```typescript
  import { Module } from '@nestjs/common';
  import { SessionsService } from './sessions.service';
  import { AuditModule } from '../audit/audit.module';

  @Module({
    imports: [AuditModule],
    providers: [SessionsService],
    exports: [SessionsService],
  })
  export class SessionsModule {}
  ```

#### 4b: Add AuditService Dependency to SessionsService

- **File**: `nexacore-api/src/sessions/sessions.service.ts`
- **Imports to add**:
  ```typescript
  import { AuditService } from '../audit/audit.service';
  import { AuditAction } from '../audit/enums/audit-action.enum';
  import {
    SESSION_IDLE_TIMEOUT_HOURS,
    MAX_CONCURRENT_SESSIONS,
  } from '../auth/constants/auth.constants';
  ```
- **Constructor change** (line 19):
  ```typescript
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}
  ```

#### 4c: Add `isSessionIdle()` Method

- **Location**: After `updateSessionHash()` (after line 160)
- **Signature**:
  ```typescript
  isSessionIdle(
    lastUsedAt: Date,
    idleTimeoutHours: number = SESSION_IDLE_TIMEOUT_HOURS,
  ): boolean {
    const idleThreshold = new Date(Date.now() - idleTimeoutHours * 60 * 60 * 1000);
    return lastUsedAt < idleThreshold;
  }
  ```
- **Notes**: Public (not static) for mockability. Pure function, no side effects.

#### 4d: Add `getActiveNonIdleSessions()` Method

- **Signature**:
  ```typescript
  async getActiveNonIdleSessions(userId: string): Promise<Session[]> {
    const idleThreshold = new Date(
      Date.now() - SESSION_IDLE_TIMEOUT_HOURS * 60 * 60 * 1000,
    );
    return this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
        lastUsedAt: { gte: idleThreshold },
      },
      orderBy: { lastUsedAt: 'asc' },
    }) as Promise<Session[]>;
  }
  ```
- **Notes**: Ordered by `lastUsedAt ASC` so oldest are first (for eviction). Uses composite index.

#### 4e: Add `enforceSessionLimit()` Method

- **Signature**:
  ```typescript
  async enforceSessionLimit(
    userId: string,
    ctx?: { ipAddress?: string; userAgent?: string | null },
  ): Promise<void> {
    const activeSessions = await this.getActiveNonIdleSessions(userId);
    const sessionsToRevoke = activeSessions.length - (MAX_CONCURRENT_SESSIONS - 1);
    if (sessionsToRevoke <= 0) return;

    const sessionsToEvict = activeSessions.slice(0, sessionsToRevoke);
    for (const session of sessionsToEvict) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      this.auditService
        .log({
          action: AuditAction.SESSION_LIMIT_EXCEEDED,
          userId,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
          metadata: {
            revokedSessionId: session.id,
            reason: 'concurrent_session_limit',
            activeCount: activeSessions.length,
            limit: MAX_CONCURRENT_SESSIONS,
          },
        })
        .catch(() => {});
    }
  }
  ```
- **Notes**: Subtracts 1 from limit because the new session is about to be created AFTER this returns. Audit is fire-and-forget but `enforceSessionLimit` itself is awaited (don't allow unbounded sessions if DB fails).

#### 4f: Modify `getActiveSessions()` to Filter Idle Sessions

- **Current** (lines 134-150): Filters `isRevoked: false, expiresAt > now()`.
- **Change**: Add `lastUsedAt: { gte: idleThreshold }` to where clause:
  ```typescript
  async getActiveSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponse[]> {
    const idleThreshold = new Date(
      Date.now() - SESSION_IDLE_TIMEOUT_HOURS * 60 * 60 * 1000,
    );
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
        lastUsedAt: { gte: idleThreshold },
      },
      orderBy: { lastUsedAt: 'desc' },
    });
    return (sessions as Session[]).map((s) =>
      toSessionResponse(s, currentSessionId),
    );
  }
  ```

### Step 5: Modify AuthService

- **File**: `nexacore-api/src/auth/auth.service.ts`

#### 5a: Add Constant Import

- **Action**: Add `SESSION_IDLE_TIMEOUT_HOURS` to the existing import from `'./constants/auth.constants'` (line 35-36)

#### 5b: Add Idle Check to `refreshTokens()` — BEFORE Rotation

- **Location**: After user lookup (after line 357), BEFORE rotation call (before line 360)
- **Code to insert**:
  ```typescript
  // Idle timeout check: reject refresh if session inactive too long
  const oldSession = await this.sessionsService.findById(payload.sessionId);
  if (
    oldSession &&
    !oldSession.isRevoked &&
    this.sessionsService.isSessionIdle(oldSession.lastUsedAt)
  ) {
    await this.prisma.session.update({
      where: { id: payload.sessionId },
      data: { isRevoked: true },
    });

    this.auditService
      .log({
        action: AuditAction.SESSION_IDLE_REVOKED,
        userId: payload.sub,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: {
          sessionId: payload.sessionId,
          lastUsedAt: oldSession.lastUsedAt.toISOString(),
          idleTimeoutHours: SESSION_IDLE_TIMEOUT_HOURS,
        },
      })
      .catch(() => {});

    throw new UnauthorizedException('Session expired due to inactivity');
  }
  ```
- **Notes**: Uses `this.prisma.session.update` directly (pattern established by `notifyIfNewDevice` which also uses `this.prisma.session.findMany` directly). This avoids `revokeSession()` which would do a redundant `findById`. If `oldSession` is null or already revoked, skip idle check — `rotateRefreshToken` handles those cases.

#### 5c: Add Concurrent Limit Enforcement to `generateTokens()`

- **Location**: In `generateTokens()` after line 542 (`expiresAt` calculation), BEFORE line 545 (`tempToken`)
- **Code to insert**:
  ```typescript
  // Enforce concurrent session limit — evict oldest if over limit
  await this.sessionsService.enforceSessionLimit(user.id, {
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
  });
  ```
- **Notes**: `generateTokens()` is called from `login()`, `validateOAuthUser()`, and `generateTokensForMfa()` — one insertion point covers all 3 flows. Awaited (not fire-and-forget) because limit enforcement is mandatory.

### Step 6: SessionsService Tests

- **File**: `nexacore-api/src/sessions/tests/sessions.service.spec.ts`

#### 6a: Update Test Setup
- Add `AuditService` mock provider: `{ provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } }`
- Add `auditService` variable for assertions

#### 6b: Tests for `isSessionIdle()` (3 tests)
1. `should return true when lastUsedAt is older than threshold` — 25h ago with default 24h
2. `should return false when lastUsedAt is within threshold` — 23h ago with default 24h
3. `should respect custom idle timeout parameter` — custom 1h timeout

#### 6c: Tests for `getActiveNonIdleSessions()` (3 tests)
1. `should query with correct where clause` — verify all 4 where conditions + orderBy ASC
2. `should return sessions ordered by lastUsedAt ASC` — verify orderBy
3. `should return empty array when no qualifying sessions` — findMany returns []

#### 6d: Tests for `enforceSessionLimit()` (5 tests)
1. `should do nothing when active sessions below limit` — 3 sessions, no revocations
2. `should revoke oldest session when at limit` — 5 sessions, oldest revoked
3. `should revoke multiple sessions when over limit` — 6 sessions, 2 oldest revoked
4. `should log SESSION_LIMIT_EXCEEDED audit event per eviction` — verify auditService.log args
5. `should not fail when audit logging fails` — auditService.log rejects, method completes

#### 6e: Update Existing `getActiveSessions()` Test (1 update + 1 new)
- Update existing where-clause assertion to include `lastUsedAt` filter
- New: `should exclude idle sessions from results` — verify the lastUsedAt filter

**Total: ~12 new tests + 1 updated**

### Step 7: AuthService Tests

- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`

#### 7a: Update Mocks
- Add to SessionsService mock: `isSessionIdle: jest.fn().mockReturnValue(false)`, `getActiveNonIdleSessions: jest.fn().mockResolvedValue([])`, `enforceSessionLimit: jest.fn().mockResolvedValue(undefined)`
- Add to PrismaService session mock (if not already present): ensure `update` mock exists

#### 7b: Tests for Idle Timeout in `refreshTokens()` (4 tests)
1. `should throw UnauthorizedException when session is idle` — findById returns session, isSessionIdle returns true, verify 401
2. `should NOT call rotateRefreshToken when session is idle` — verify rotateRefreshToken NOT called
3. `should revoke idle session and log SESSION_IDLE_REVOKED audit` — verify prisma update + audit log
4. `should proceed normally when session is not idle` — isSessionIdle returns false, verify rotateRefreshToken called

#### 7c: Tests for Concurrent Limit in Login Flows (3 tests)
1. `should call enforceSessionLimit before session creation on login` — verify called with userId + requestMeta
2. `should call enforceSessionLimit on OAuth login` — validateOAuthUser flow
3. `should call enforceSessionLimit on MFA login` — generateTokensForMfa flow

#### 7d: Edge Case Tests (2 tests)
1. `should propagate enforceSessionLimit errors` — enforceSessionLimit rejects, login throws (not fire-and-forget)
2. `should pass correct ctx to enforceSessionLimit` — verify ipAddress + userAgent shape

**Total: ~9 new tests**

### Step 8: Update integration-state.md

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Changes**:
  1. Header: "Last update: SCRUM-103 (2026-03-02)"
  2. Module Registry: SessionsModule imports → `AuditModule`
  3. Service Dependency Chains: `SessionsService → PrismaService, AuditService`
  4. Test Mock Requirements: Add `| **SessionsService** | PrismaService, AuditService |`
  5. Changelog entry: Session idle timeout + concurrent limits summary

### Step 9: Verify Implementation

1. `cd nexacore-api && npx prisma migrate dev --name add_session_idle_index_and_audit_actions`
2. `npx prisma generate`
3. `npx nest build` — must compile clean
4. `npx jest --maxWorkers=1 --forceExit` — all tests must pass
5. Verify test count ~508 (487 + ~21 new)
6. Verify `npx nest start` boots with 14 modules, 36 routes

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add constants
3. Step 2: Add audit actions (TS enum + Prisma enum)
4. Step 3: Add Prisma index + migration
5. Step 4: SessionsService methods + module update
6. Step 5: AuthService modifications (idle check + concurrent limit)
7. Step 6: SessionsService tests (~12 new)
8. Step 7: AuthService tests (~9 new)
9. Step 8: Update integration-state.md
10. Step 9: Verify (build + test)

## Testing Checklist

- [ ] `isSessionIdle()` true for sessions older than threshold
- [ ] `isSessionIdle()` false for sessions within threshold
- [ ] `isSessionIdle()` respects custom timeout parameter
- [ ] `getActiveNonIdleSessions()` filters idle/revoked/expired, orders by lastUsedAt ASC
- [ ] `enforceSessionLimit()` no-op when under limit
- [ ] `enforceSessionLimit()` revokes oldest when at limit
- [ ] `enforceSessionLimit()` revokes multiple when over limit
- [ ] `enforceSessionLimit()` logs SESSION_LIMIT_EXCEEDED per eviction
- [ ] `getActiveSessions()` excludes idle sessions from response
- [ ] `refreshTokens()` rejects idle sessions with 401
- [ ] `refreshTokens()` does NOT rotate idle sessions
- [ ] `refreshTokens()` logs SESSION_IDLE_REVOKED audit event
- [ ] `refreshTokens()` proceeds normally for non-idle sessions
- [ ] `generateTokens()` calls `enforceSessionLimit()` for login, OAuth, MFA
- [ ] All existing ~487 tests still pass
- [ ] `nest build` compiles clean

## Error Response Format

- **Idle timeout**: HTTP 401 `{ "message": "Session expired due to inactivity", "statusCode": 401 }` — same format as existing refresh errors
- **Concurrent limit**: No user-facing error — login always succeeds, oldest session silently evicted

## Dependencies

- **No new npm packages**
- **DI change**: SessionsModule now imports AuditModule
- **Prisma migration**: New composite index + 2 new AuditAction enum values
- **New env vars**: `SESSION_IDLE_TIMEOUT_HOURS` (default 24), `MAX_CONCURRENT_SESSIONS` (default 5)

## Notes

- **No cron/scheduler**: Idle sessions lazily rejected on refresh and filtered from `getActiveSessions()`. `expiresAt` (7d) provides absolute cleanup. No `@nestjs/schedule` dependency.
- **`lastUsedAt` on rotation**: `rotateRefreshToken()` creates a NEW session with `lastUsedAt = now()` via Prisma default. No explicit update needed.
- **Idle sessions don't count toward concurrent limit**: `getActiveNonIdleSessions()` excludes them, preventing idle sessions from occupying active slots.
- **`enforceSessionLimit()` is awaited, not fire-and-forget**: If DB fails, we must not create unbounded sessions. Only the audit log within it is fire-and-forget.
- **Race condition**: Between counting and creating, another request could also create a session. Worst case: `MAX_CONCURRENT_SESSIONS + 1` temporarily. Acceptable vs. pessimistic locking.
- **Double findById in refresh**: The idle check calls `findById` before `rotateRefreshToken` (which also calls `findById` internally). Minor overhead for clean separation of concerns — consistent with codebase pattern.

## Implementation Verification

- [ ] **Code Quality**: Constants configurable, no code duplication, follows existing patterns
- [ ] **Functionality**: Idle timeout + concurrent limit enforced across all login flows
- [ ] **Testing**: ~21 new tests covering all branches
- [ ] **Integration**: `nest build` + `nest start` clean, migration applied
- [ ] **Documentation**: integration-state.md updated
