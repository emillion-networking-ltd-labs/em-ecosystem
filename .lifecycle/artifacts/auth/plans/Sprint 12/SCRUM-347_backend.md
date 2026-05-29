# Backend Implementation Plan: SCRUM-347 — Individual session revocation should deny-list access token immediately

## 1. Header

- **Ticket**: SCRUM-347
- **Sprint**: 12 (id=411)
- **Scope**: backend (`nexacore-api/`)
- **Module**: auth (sessions sub-module + auth deny-list)
- **Severity**: MEDIUM (security hardening — closes a JWT eventual-consistency tradeoff up to 15 min)
- **Branch**: `feature/SCRUM-347-backend`
- **Author**: Claude Opus 4.7
- **Date**: 2026-05-03

## 2. Codebase State Snapshot

- **Date**: 2026-05-03
- **Last completed ticket**: SCRUM-342 (frontend regression fix that surfaced this gap during AC5 smoke). Merged em-ecosystem PR #231 / commit `d9cd7d9`.
- **Integration state verified**: Yes — read `ai-specs/specs/integration-state.md` and cross-checked against live code.

### Files verified against live code

| File | Lines read | Findings |
|------|-----------|----------|
| `nexacore-api/src/sessions/sessions.service.ts` | 1-40, 130-173 | Constructor: `PrismaService, AuditService, GeolocationService` (3 deps). `revokeSession(sessionId, userId)` only marks `isRevoked=true` — no deny-list call. `revokeAllUserSessions(userId)` same — no deny-list. |
| `nexacore-api/src/sessions/sessions.module.ts` | full | imports: `[AuditModule]`. providers: `[SessionsService]`. exports: `[SessionsService]`. Does NOT import AuthModule. |
| `nexacore-api/src/auth/token.service.ts` | 75-125, 240-355 | `generateTokens` signs access token at lines 80-90 BEFORE creating the session at line 102-110. `sessionId` is in scope at line 115 (used in refresh-token payload only). `logoutAll(userId)` at 344-355 correctly pairs `revokeAllUserSessions` + `denyAllForUser`. |
| `nexacore-api/src/auth/token-deny-list.service.ts` | full (60 lines) | Methods: `denyToken(jti, ttl)`, `denyAllForUser(userId, ttl)`, `isDenied(jti, userId, iat?)`. NO `denyBySessionId`. Backed by Redis (`REDIS_CLIENT`). |
| `nexacore-api/src/auth/strategies/jwt.strategy.ts` | full | `validate(payload)` checks `tokenDenyListService.isDenied(jti, sub, iat)` only. No session-level check. |
| `nexacore-api/src/common/interfaces/jwt-payload.interface.ts` | full | `JwtPayload = { sub, email, role, jti, iat? }`. **NO `sessionId`**. |
| `nexacore-api/src/auth/interfaces/refresh-token-payload.interface.ts` | full | `RefreshTokenPayload = { sub, sessionId, family }`. Has `sessionId`. |
| `nexacore-api/src/auth/email-verification.service.ts:104` | grep + read | Calls `revokeAllUserSessions(user.id)` — no deny-list. Same bug class. |
| `nexacore-api/src/auth/password-reset.service.ts:144` | grep + read | Calls `revokeAllUserSessions(resetToken.userId)` — no deny-list. Same bug class. |
| `nexacore-api/src/users/users.service.ts:754` | read | Password CHANGE flow calls `revokeAllUserSessions(userId)` — no deny-list. Same bug class. |
| `nexacore-api/src/users/users.service.ts:842-847` | read | Admin lock-user flow calls BOTH `revokeAllUserSessions` + `denyAllForUser`. Only correct caller of the pattern outside `logoutAll`. |
| `nexacore-api/src/auth/auth.module.ts` | inferred from integration-state | Imports SessionsModule, exports TokenDenyListService. |

### Constructor signatures verified

| Class | Current constructor (live code) |
|-------|---------------------------------|
| `SessionsService` | `(prisma: PrismaService, audit: AuditService, geolocation: GeolocationService)` — 3 deps |
| `JwtStrategy` | `(usersService: UsersService, tokenDenyListService: TokenDenyListService, configService: ConfigService)` — 3 deps |
| `TokenDenyListService` | `(@Inject(REDIS_CLIENT) redis: Redis)` — 1 dep |
| `TokenService` | `(jwtService, sessionsService, usersService, tokenDenyListService, auditService, configService, loginSecurityService)` — 7 deps |

### Methods verified to exist

- `SessionsService.revokeSession(sessionId, userId)` — `sessions.service.ts:155-166` ✓
- `SessionsService.revokeAllUserSessions(userId)` — `sessions.service.ts:168-173` ✓
- `TokenDenyListService.denyToken(jti, ttl)` — `token-deny-list.service.ts:13-21` ✓
- `TokenDenyListService.denyAllForUser(userId, ttl)` — `token-deny-list.service.ts:23-32` ✓
- `TokenDenyListService.isDenied(jti, userId, iat?)` — `token-deny-list.service.ts:34-59` ✓

### Discrepancies with integration-state.md

None. Live code matches the recorded module dependency graph.

### Scope expansion discovered during planning

The original ticket described only **per-row session revoke** as the affected path. Live-code analysis found **3 additional same-class bugs** in `revokeAllUserSessions` callers that do NOT pair the call with `denyAllForUser`:

| File | Line | Flow | Has deny-list pair? |
|------|------|------|---------------------|
| `auth/email-verification.service.ts` | 104 | Email-verified-elsewhere flow | ❌ NO |
| `auth/password-reset.service.ts` | 144 | Password reset success flow | ❌ NO |
| `users/users.service.ts` | 754 | Password CHANGE flow | ❌ NO |
| `users/users.service.ts` | 842-847 | Admin lock-user flow | ✅ YES |
| `auth/token.service.ts logoutAll` | 345 | User-initiated logout-all | ✅ YES |

**Implication**: fixing the bug at the `SessionsService` method level (Option A — push deny-list call inside the service methods themselves) automatically closes all 4 callers in one stroke. This is the recommended approach. The ticket scope effectively expands from 1 caller to 4, but the surface change stays the same: 2 service methods get the deny call inside them.

## 3. Regression Impact Analysis

### Blast radius — files that import or reference modified classes

`grep -r "SessionsService\|sessionsService\|TokenDenyListService\|tokenDenyListService" --include="*.ts" nexacore-api/src/` (excluding `*.spec.ts` and `node_modules/`):

**Direct dependents of `SessionsService`**:
- `auth/auth.module.ts` (imports SessionsModule)
- `auth/token.service.ts` (injects + calls)
- `auth/email-verification.service.ts` (injects + calls)
- `auth/password-reset.service.ts` (injects + calls)
- `auth/login-security.service.ts` (injects + calls)
- `auth/session.controller.ts` (injects + calls)
- `users/users.module.ts` (imports SessionsModule)
- `users/users.service.ts` (injects + calls)

**Direct dependents of `TokenDenyListService`**:
- `auth/auth.module.ts` (provides + exports)
- `auth/strategies/jwt.strategy.ts` (injects + calls)
- `auth/token.service.ts` (injects + calls in `logoutAll`)
- `users/users.service.ts` (injects + calls in admin flows)

**Direct dependents of `JwtPayload`**:
- `auth/strategies/jwt.strategy.ts` (parameter type in `validate`)
- `auth/token.service.ts` (signs the payload — `generateTokens`, `refreshTokens`, `signMfaSetupToken`-not-affected, etc.)
- All `@CurrentUser()` decorator consumers receive the resolved `SafeUser`, not the raw payload — NOT affected by adding `sessionId`.

### Test files requiring mock updates

`grep -r "SessionsService\|TokenDenyListService\|JwtStrategy" --include="*.spec.ts" nexacore-api/src/`:

**Must update — new mocks needed when SessionsService gains TokenDenyListService dep**:
1. `nexacore-api/src/sessions/tests/sessions.service.spec.ts` — add TokenDenyListService mock provider
2. `nexacore-api/src/auth/tests/auth-test.helpers.ts` — already mocks SessionsService; verify revokeSession + revokeAllUserSessions mocks still work
3. `nexacore-api/src/auth/tests/token.service.spec.ts` — uses SessionsService; no new mock needed (existing one stays)
4. `nexacore-api/src/auth/tests/email-verification.service.spec.ts` — verify revokeAllUserSessions assertion still works (no new behavioral assertion needed because deny is now internal to SessionsService)
5. `nexacore-api/src/auth/tests/password-reset.service.spec.ts` — same as above
6. `nexacore-api/src/users/tests/users.service.spec.ts` — same as above
7. `nexacore-api/src/auth/tests/strategies/jwt.strategy.spec.ts` — add new test cases for sessionId-based deny (extends existing isDenied mock)
8. `nexacore-api/src/auth/tests/token-deny-list.service.spec.ts` — add tests for new `denyBySessionId` method + extended `isDenied` signature
9. `nexacore-api/src/auth/tests/login.service.spec.ts` — no change (calls SessionsService indirectly via TokenService.generateTokens)

### Breaking change detection

| Change | Breaking? | Mitigation |
|--------|-----------|------------|
| `JwtPayload` adds `sessionId: string` | **Soft-breaking** for in-flight access tokens at deploy time | Treat the field as `string \| undefined` at validate time → JwtStrategy passes `payload.sessionId` (which may be undefined) to `isDenied`, and `isDenied` skips the session check when sessionId is missing. Within 15 min of deploy, all access tokens are re-issued with the new field. **No user impact.** |
| `SessionsService` constructor adds `TokenDenyListService` (forwardRef) | Breaking for unit-test mocks | Update `sessions.service.spec.ts` mock provider list. List of test files to update is exhaustively in section "Test files requiring mock updates" above. |
| `TokenDenyListService.isDenied()` signature adds optional `sessionId?: string` parameter | Non-breaking (optional 4th param) | Existing callers continue to pass 3 params and behave identically. |
| `SessionsModule.imports` adds `forwardRef(() => AuthModule)` | Module graph change | Resolved via NestJS forwardRef. Pattern already used in `UsersModule → AuthModule` per integration-state.md. |
| `SessionsService.revokeSession` semantic: now also denies the session's tokens | Behavioral change (the WHOLE POINT) | Documented in Acceptance Criteria; tests updated; integration-state.md note added. |
| `SessionsService.revokeAllUserSessions` semantic: now also denies-by-user | Behavioral change for 3 indirect callers (email-verification, password-reset, users-password-change) | Documented as scope expansion. The 3 callers will now correctly deny-list — this is closing a latent same-class bug. |

### API contract impact

None. No endpoint route, method, DTO, or response schema changes. The DELETE `/auth/sessions/:id` endpoint signature remains identical; only its server-side effect becomes stronger (now-instant invalidation).

`api-spec.yml` — no update required.

### Schema migration impact

None. No Prisma schema changes. The Session model already has `isRevoked` field used today. Deny-list lives in Redis, not Postgres.

### Blast radius size

**11 productive files affected** (5 modified + 0 new + 6 indirect via test mock updates). Above the 5-file threshold from `/plan` standard, so flagged for **careful regression testing in `/verify`**:

- 5 modified productive files: `jwt-payload.interface.ts`, `token.service.ts`, `token-deny-list.service.ts`, `jwt.strategy.ts`, `sessions.service.ts`, `sessions.module.ts` (technically 6 — slight overrun, kept as-is).
- 9 modified test files (per "Test files requiring mock updates" table).

## 4. Overview

This ticket closes a JWT eventual-consistency tradeoff in the NexaCore auth module by extending the Redis token deny-list to support per-session entries (`deny:session:{sessionId}` keys), and wiring `SessionsService.revokeSession` and `SessionsService.revokeAllUserSessions` to call the deny-list whenever they mark a session row as revoked. The fix follows the industry-standard pattern used by Auth0, Okta, Firebase Auth, and AWS Cognito GlobalSignOut: validate session-level deny on every authenticated request, with O(1) Redis lookup.

The implementation requires adding `sessionId: string` to the access-token `JwtPayload`, reordering `TokenService.generateTokens` so the session row exists before signing the access token, and propagating the new field through every code path that signs an access token (login success, MFA verify, refresh, OAuth callback, trusted-device login).

The fix is fully backward-compatible during deploy: in-flight access tokens lacking the `sessionId` field continue to validate (the deny check is conditional on `sessionId` being present), and all tokens are re-issued with the new field within 15 minutes of deploy.

## 5. Architecture Context

### Modules involved
- `AuthModule` (no change to provides/exports — just used as the source of `TokenDenyListService` for `SessionsModule`)
- `SessionsModule` — adds `forwardRef(() => AuthModule)` to imports
- All test modules that import `SessionsModule` or mock `SessionsService`

### Components affected
- `JwtPayload` interface — schema change
- `JwtStrategy.validate` — added session-level deny check
- `TokenDenyListService` — new method `denyBySessionId`, extended `isDenied`
- `TokenService.generateTokens` and `TokenService.refreshTokens` — sessionId added to access-token payload
- `SessionsService.revokeSession` and `SessionsService.revokeAllUserSessions` — added deny-list calls
- `SessionsModule` — imports AuthModule via forwardRef

### Files referenced (read-only during this work)

- `nexacore-api/src/auth/constants/auth.constants.ts` — `ACCESS_TOKEN_TTL_SECONDS = 900` (used as TTL for new deny-list keys)

## 6. Implementation Steps

### Step 0: Create feature branch

```bash
git -C em-ecosystem-code checkout main
git -C em-ecosystem-code pull origin main
git -C em-ecosystem-code checkout -b feature/SCRUM-347-backend
git -C em-ecosystem-code branch
```

### Step 1: Add `sessionId` to `JwtPayload` interface

**File**: `nexacore-api/src/common/interfaces/jwt-payload.interface.ts`

```ts
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  jti: string;
  sessionId?: string; // optional during rollout — required after 15-min TTL window post-deploy
  iat?: number;
}
```

**Implementation notes**:
- `sessionId` is **optional (`?`)** during the deploy/rollout window. In-flight tokens without it continue to validate.
- After 15 min post-deploy, all tokens have it. Could harden to required in a follow-up ticket once safe.
- TypeScript strict mode allows optional fields cleanly.

### Step 2: Extend `TokenDenyListService` with session-level deny

**File**: `nexacore-api/src/auth/token-deny-list.service.ts`

**Action 1**: Add new method `denyBySessionId(sessionId, ttlSeconds)`.

```ts
async denyBySessionId(sessionId: string, ttlSeconds: number): Promise<void> {
  try {
    await this.redis.set(`deny:session:${sessionId}`, '1', 'EX', ttlSeconds);
  } catch (err) {
    this.logger.warn(
      `Failed to deny session=${sessionId}: ${(err as Error).message}`,
    );
  }
}
```

**Action 2**: Extend `isDenied()` signature with optional `sessionId?: string` parameter and add session-level pipeline check.

```ts
async isDenied(
  jti: string,
  userId: string,
  iat?: number,
  sessionId?: string,
): Promise<boolean> {
  try {
    const pipeline = this.redis.pipeline();
    pipeline.exists(`deny:jti:${jti}`);
    pipeline.get(`deny:user:${userId}`);
    if (sessionId) pipeline.exists(`deny:session:${sessionId}`);
    const results = await pipeline.exec();
    if (!results) return false;

    const jtiDenied = results[0]?.[1] === 1;
    const denyBefore = results[1]?.[1] as string | null;
    const sessionDenied = sessionId ? results[2]?.[1] === 1 : false;

    if (jtiDenied || sessionDenied) return true;
    if (denyBefore && iat) return iat <= parseInt(denyBefore, 10);
    return !!denyBefore;
  } catch (err) {
    this.logger.warn(`Failed to check deny-list: ${(err as Error).message}`);
    return false; // fail-open per existing convention
  }
}
```

**Implementation notes**:
- Backward compatible: 3-arg callers continue to work.
- New 4th arg is optional; pipeline only adds the session check when `sessionId` is provided.
- Fail-open behavior preserved (line `return false` in catch).

### Step 3: Update `JwtStrategy.validate` to pass `sessionId`

**File**: `nexacore-api/src/auth/strategies/jwt.strategy.ts`

```ts
async validate(payload: JwtPayload): Promise<SafeUser> {
  const isDenied = await this.tokenDenyListService.isDenied(
    payload.jti,
    payload.sub,
    payload.iat,
    payload.sessionId, // NEW — undefined for legacy in-flight tokens, OK
  );
  if (isDenied) {
    throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
  }

  const user = await this.usersService.findById(payload.sub);
  if (!user) {
    throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
  }
  if (!user.isActive) {
    throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
  }
  return toSafeUser(user);
}
```

### Step 4: Reorder `TokenService.generateTokens` and add `sessionId` to access-token payload

**File**: `nexacore-api/src/auth/token.service.ts:75-125`

**Current order** (problematic): sign access token at line 80 → create session at line 102 → sign refresh token at line 112.

**New order**: enforce session limit → create session → sign access token (with sessionId) → sign refresh token.

```ts
async generateTokens(
  user: User,
  requestMeta: { ipAddress: string; userAgent?: string | null },
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  const tokenFamily = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + this.refreshMaxAgeMs);

  // Enforce concurrent session limit BEFORE signing tokens
  await this.sessionsService.enforceSessionLimit(user.id, {
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
  });

  // Create session FIRST so we have session.id for both tokens
  const tempToken = crypto.randomUUID();
  const session = await this.sessionsService.createSession({
    userId: user.id,
    refreshToken: tempToken,
    tokenFamily,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent || null,
    expiresAt,
  });

  // Now sign access token WITH sessionId
  const accessToken = this.jwtService.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: crypto.randomUUID(),
      sessionId: session.id, // NEW
    } satisfies JwtPayload,
    {
      expiresIn: this.accessExpiration as StringValue,
    },
  );

  const refreshToken = this.jwtService.sign(
    {
      sub: user.id,
      sessionId: session.id,
      family: tokenFamily,
    } satisfies RefreshTokenPayload,
    { expiresIn: this.refreshExpiration as StringValue },
  );

  const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await this.sessionsService.updateSessionHash(session.id, refreshTokenHash);

  return { accessToken, refreshToken, sessionId: session.id };
}
```

### Step 5: Update `TokenService.refreshTokens` to include `sessionId` in new access token

**File**: `nexacore-api/src/auth/token.service.ts:127-300` (refresh path)

The refresh path also signs new access tokens. Find the sign call (around line 282 per earlier integration-state grep) and add `sessionId: payload.sessionId` (the refresh token already has sessionId on its payload).

Verify all other paths that sign access tokens during /develop:

```bash
grep -n "jwtService.sign" em-ecosystem-code/nexacore-api/src/auth/
```

Expected hits to update:
- `token.service.ts` access-token sign in `generateTokens` (Step 4 ✓)
- `token.service.ts` access-token sign in `refreshTokens` (this Step 5)
- `token.service.ts` access-token sign in `signMfaChallengeToken` — different token type (MFA_CHALLENGE), NO sessionId needed, leave alone.
- `token.service.ts` access-token sign in `signMfaSetupToken` — different token type (MFA_SETUP), NO sessionId needed, leave alone.

If grep finds any other access-token sign call site (e.g., trusted-device or oauth-auth direct sign — they should call `generateTokens` instead, but verify), apply the same fix.

### Step 6: Wire `SessionsService.revokeSession` to call deny-list

**File**: `nexacore-api/src/sessions/sessions.service.ts`

**Action 1**: Add `TokenDenyListService` to constructor via forwardRef:

```ts
import { forwardRef, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokenDenyListService } from '../auth/token-deny-list.service';
import { ACCESS_TOKEN_TTL_SECONDS } from '../auth/constants/auth.constants';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly geolocationService: GeolocationService,
    @Inject(forwardRef(() => TokenDenyListService))
    private readonly tokenDenyListService: TokenDenyListService,
  ) {}
  // ...
}
```

**Action 2**: Extend `revokeSession`:

```ts
async revokeSession(sessionId: string, userId: string): Promise<void> {
  const session = await this.findById(sessionId);
  if (!session || session.userId !== userId) {
    throw new NotFoundException(ErrorMessages.session.NOT_FOUND);
  }
  await this.prisma.session.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
  // Deny-list the session's access tokens immediately. Pairs with isRevoked
  // so the revocation is visible to JwtStrategy.validate within ~1 sec
  // (Redis lookup latency) instead of waiting up to ACCESS_TOKEN_TTL_SECONDS
  // for the JWT to expire by clock.
  await this.tokenDenyListService.denyBySessionId(
    sessionId,
    ACCESS_TOKEN_TTL_SECONDS,
  );
}
```

**Action 3**: Extend `revokeAllUserSessions`:

```ts
async revokeAllUserSessions(userId: string): Promise<void> {
  await this.prisma.session.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
  // User-level deny-list closes the same eventual-consistency gap for the
  // 3 callers that revoke all sessions without their own deny-list call:
  // email-verification.service.ts:104, password-reset.service.ts:144,
  // users.service.ts:754 (password CHANGE flow).
  await this.tokenDenyListService.denyAllForUser(
    userId,
    ACCESS_TOKEN_TTL_SECONDS,
  );
}
```

**Implementation notes**:
- Both methods pair the DB write with a Redis deny-list write. If Redis fails, the deny call logs and returns (fail-open per existing convention).
- The `users.service.ts:842-847` admin-lock flow already calls `denyAllForUser` after `revokeAllUserSessions`. After this change, that's a redundant double-call — harmless (idempotent — second call just refreshes the TTL of the same Redis key). Documented in `/verify` as Accepted-Trivial.
- Same applies to `token.service.ts logoutAll` line 345: now also calls denyAllForUser via SessionsService internally + its own line 347. Idempotent. Documented as Accepted-Trivial.

### Step 7: Wire `SessionsModule` to import `AuthModule` via forwardRef

**File**: `nexacore-api/src/sessions/sessions.module.ts`

```ts
import { forwardRef, Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuditModule, forwardRef(() => AuthModule)],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
```

**Implementation notes**:
- AuthModule already imports SessionsModule, so forwardRef is mandatory to break the cycle.
- Pattern already established by `UsersModule → AuthModule` forwardRef per `integration-state.md` (UsersService uses TokenDenyListService via forwardRef).
- AuthModule must export TokenDenyListService — verify in `auth.module.ts` at /develop time. If not currently exported, add to `exports[]`. Per integration-state.md it IS exported.

### Step 8: Update unit tests for affected services

For each test file in section 3 "Test files requiring mock updates":

- **`tests/sessions/sessions.service.spec.ts`** — add `TokenDenyListService` mock to providers (`{ provide: TokenDenyListService, useValue: { denyBySessionId: jest.fn(), denyAllForUser: jest.fn() } }`). Add new test cases:
  - `revokeSession calls tokenDenyListService.denyBySessionId(sessionId, ACCESS_TOKEN_TTL_SECONDS)`
  - `revokeAllUserSessions calls tokenDenyListService.denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS)`
  - `revokeSession with non-existent sessionId throws NotFoundException AND does not call deny`
- **`tests/auth/token-deny-list.service.spec.ts`** — add new test cases:
  - `denyBySessionId writes deny:session:{id} to Redis with correct TTL`
  - `isDenied returns true when sessionId is in deny-list (4-arg call)`
  - `isDenied does not check sessionId when not provided (3-arg call backward compat)`
- **`tests/auth/strategies/jwt.strategy.spec.ts`** — add new test cases:
  - `validate throws 401 when payload.sessionId is in deny-list`
  - `validate succeeds with payload.sessionId NOT in deny-list (3-deny check still passes)`
  - `validate handles undefined sessionId (legacy in-flight token) gracefully`
- **`tests/auth/email-verification.service.spec.ts`**, **`tests/auth/password-reset.service.spec.ts`**, **`tests/users/users.service.spec.ts`** — verify existing assertions on `revokeAllUserSessions` still pass; the new internal `denyAllForUser` call is encapsulated in SessionsService mock so these test files don't need to know about it.

### Step 9: Backend integration test for end-to-end revoke flow

**File**: `nexacore-api/src/auth/tests/integration/session-revoke.spec.ts` (new)

**Test cases**:
1. Login user → receive accessToken (now with sessionId in payload).
2. From a SECOND session (or simulated by directly calling `sessionsService.revokeSession` on the first session's id), revoke the first session.
3. Use the first session's accessToken on `GET /auth/me` → expect 401 within ~100ms (Redis lookup speed).
4. Verify the user's other sessions (if any) are unaffected.

This integration test is the canonical proof of AC1.

### Step 10: Build, lint, test verification

From `em-ecosystem-code/nexacore-api/`:
```bash
npm run lint
npm run build
npx jest --maxWorkers=1 --forceExit
```

All must pass. Backend startup test:
```bash
npm run start
# Should not crash with DI resolution errors. Hit /health if available, then Ctrl-C.
```

### Step 11: Phase 3 (security) audit re-run (MANDATORY)

Per `audit-standards.mdc` Section 6.7 (proposed in SCRUM-349, but applicable as practice now): any change to `nexacore-api/src/auth/strategies/`, `nexacore-api/src/auth/token-deny-list.service.ts`, or session revocation paths invalidates the prior Phase 3 PASS verdict.

Run:
```bash
# /audit auth phase 3
```

Expected output: `ai-specs/changes/auth/audit/audit-YYYY-MM-DDTHH-MM/fase-3-security-auth.md` with **0 FAIL**. Compare against last 0-FAIL baseline (2026-03-16T23-31). Document any deviations as Accepted-Risk (security) per audit-standards Section 6.4.

If new FAILs appear, **block /commit** until resolved.

### Step 12: Update integration-state.md

**File**: `ai-specs/specs/integration-state.md`

Add to the "Service Dependency Chains" table:
- `SessionsService` row: change deps from `PrismaService, AuditService, GeolocationService` → `PrismaService, AuditService, GeolocationService, TokenDenyListService (forwardRef)`.

Add to the "Module Registry" table:
- `SessionsModule` row: change imports from `AuditModule` → `AuditModule, AuthModule (forwardRef)`.

Add changelog row: `2026-05-XX | SCRUM-347 | SessionsService now injects TokenDenyListService via forwardRef; SessionsModule imports AuthModule via forwardRef. revokeSession + revokeAllUserSessions now deny-list affected tokens.`

### Step 13: Update technical documentation

`ai-specs/specs/api-spec.yml` — no change (API contract unchanged).
`ai-specs/specs/data-model.md` — no change (Prisma schema unchanged).
`ai-specs/specs/backend-standards.mdc` — optional enhancement: add a note about "session revocation must always pair DB-update with Redis deny-list" to prevent future recurrence. Decide at /develop time whether to add or leave as comment in code.

## 7. Implementation Order

1. Step 0 — Branch creation
2. Steps 1+2+3 — Schema + service extensions (parallel, no inter-dependencies):
   - Step 1: JwtPayload interface
   - Step 2: TokenDenyListService extensions
   - Step 3: JwtStrategy.validate update
3. Steps 4+5 — TokenService updates (sequential — Step 4 establishes pattern, Step 5 applies it):
   - Step 4: generateTokens reorder + sessionId
   - Step 5: refreshTokens sign path + sessionId
4. Steps 6+7 — SessionsService + Module wiring (sequential):
   - Step 6: SessionsService deny-list calls
   - Step 7: SessionsModule forwardRef
5. Step 8 — Unit test updates (after all production code is in place)
6. Step 9 — Integration test (after unit tests pass)
7. Step 10 — Build/lint/test verification
8. Step 11 — Phase 3 audit re-run (BLOCKS /commit until 0 FAIL)
9. Step 12 — integration-state.md update
10. Step 13 — Other documentation updates

Steps 1, 2, 3 may be done in parallel. Steps 4-7 are sequential because they depend on each other's signatures.

## 8. Testing Checklist

### Unit tests added/updated (all in `nexacore-api/src/`)

- [ ] `sessions/tests/sessions.service.spec.ts` — TokenDenyListService mock added; 3 new test cases (revokeSession deny, revokeAllUserSessions deny, error path)
- [ ] `auth/tests/token-deny-list.service.spec.ts` — denyBySessionId tests + isDenied 4-arg/3-arg backward compat
- [ ] `auth/tests/strategies/jwt.strategy.spec.ts` — sessionId-deny rejection, undefined sessionId backward compat
- [ ] `auth/tests/token.service.spec.ts` — verify generateTokens new order (session created before access token sign) + sessionId in payload
- [ ] `auth/tests/email-verification.service.spec.ts` — existing assertions still pass (no new behavior at this layer)
- [ ] `auth/tests/password-reset.service.spec.ts` — same
- [ ] `users/tests/users.service.spec.ts` — same; verify password-change flow's revokeAllUserSessions still asserted

### Integration test added

- [ ] `auth/tests/integration/session-revoke.spec.ts` (new) — end-to-end revoke + 401 within 1 sec

### Build / quality gates

- [ ] `npm run lint` clean
- [ ] `npm run build` clean (nest build)
- [ ] `npx jest --maxWorkers=1 --forceExit` all suites pass
- [ ] `npm run start` does not crash on boot (DI resolves)

### Regression checklist (per blast radius)

- [ ] `auth/tests/email-verification.service.spec.ts` passes (revokeAllUserSessions caller)
- [ ] `auth/tests/password-reset.service.spec.ts` passes (revokeAllUserSessions caller)
- [ ] `users/tests/users.service.spec.ts` passes (both revokeAllUserSessions callers + denyAllForUser pair)
- [ ] `auth/tests/token.service.spec.ts` passes (logoutAll caller)
- [ ] `auth/tests/login.service.spec.ts` passes (indirect via token.service)
- [ ] `auth/tests/auth.controller.spec.ts` passes (depends on TokenService)
- [ ] `auth/tests/session.controller.spec.ts` passes (calls SessionsService.revokeSession directly)
- [ ] All other existing `*.spec.ts` files still pass without changes

### Audit gate

- [ ] Phase 3 (security) re-run shows 0 FAIL with output at `ai-specs/changes/auth/audit/audit-YYYY-MM-DDTHH-MM/fase-3-security-auth.md`

### Manual smoke (post-deploy)

- [ ] Login user → note accessToken's sessionId claim (decode JWT to verify field present)
- [ ] In /profile Active Sessions, revoke one OTHER session via Trash icon
- [ ] In that other window/device, navigate to a protected route → expect "Session expired" toast + redirect to /login within 1-2 seconds
- [ ] In the original window, verify your own session is unaffected

## 9. Error Response Format

No change. JwtStrategy continues to return `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` on deny — wrapped by `HttpExceptionFilter` into the existing unified `{ success: false, error: { message, code: "UNAUTHORIZED", statusCode: 401 } }` shape.

## 10. Partial Update Support

N/A — this ticket does not introduce any PATCH endpoints or partial-update semantics.

## 11. Dependencies

No new external libraries. All required dependencies (Redis client, JwtService, NestJS forwardRef) already in use.

Internal cross-module references:
- `SessionsModule → AuthModule` (NEW, via forwardRef)
- `SessionsService` injects `TokenDenyListService` (NEW, via forwardRef)

## 12. Notes

- **Language**: All code, comments, and docs in English.
- **Commit message format**: `SCRUM-347: Backend — instant per-session deny-list on revoke`
- **No frontend changes**: SCRUM-342's UX layer already handles 401 → toast + redirect correctly. AC8 of the enriched ticket explicitly excludes frontend.
- **Audit re-run is mandatory before /commit**: Phase 3 must show 0 FAIL. Without this, /commit is blocked per `audit-standards.mdc` Section 6.7 spirit.
- **Memory rules respected**:
  - Reproduce before fix: live code state verified against integration-state.md (Section 2 above).
  - Minimal diff: 6 productive files + 9 test files; no scope expansion beyond what live-code analysis surfaced as same-class bugs (3 additional callers of revokeAllUserSessions).
  - No bonus fixes: out-of-scope items remain in SCRUM-349 (UX bundle) and SCRUM-350 (E2E tests).
  - Verify with user before push: /verify gate must produce PASS or PASS-WITH-DEBT before /commit.

## 13. Next Steps After Implementation

After /verify PASS and /commit completes:

1. Notify SCRUM-342 owner that AC5 (genuine session-expired toast in operation) is now testable end-to-end. Recommend SCRUM-350 (Phase 9b E2E tests) covers the smoke test in its FE-32 case.
2. SCRUM-349 (auth UX consistency bundle) becomes more relevant — TrustedDevices and PasskeyManager rate-limit toasts.
3. Update `frontend-standards.mdc` (in SCRUM-349 or follow-up) to reference SCRUM-347 when documenting the "instant revocation" guarantee.

## 14. Implementation Verification

Final checklist (mirrors `/verify` Step 4 expectations):

- [ ] **Code Quality**: 6 productive files modified (Steps 1-7); 0 productive files added; 9 test files updated (Step 8) + 1 test file added (Step 9). Net diff target: ~150-250 lines productive + ~250-400 lines test code.
- [ ] **Functionality**: Manual smoke (Section 8 last subsection) all passes.
- [ ] **Testing**: All new and existing tests pass; integration test in Step 9 proves AC1 end-to-end.
- [ ] **Regression**: All blast-radius test files pass without behavioral assertion changes (only mock provider additions).
- [ ] **Integration**: backend boots clean; DI resolves; `nest build` clean.
- [ ] **Documentation**: integration-state.md updated; api-spec.yml unchanged (verified, not stale); audit Phase 3 re-run output committed to ai-specs.
- [ ] **Plan compliance**: every step in this plan executed in order; deviations classified per `/verify`.

## 15. Module-Level Planning

N/A — no new NexaCore module created. SessionsModule and AuthModule receive minor wiring updates (forwardRef + 1 injection); not module-creation work.

## 16. Satellite App Planning

N/A — no satellite app work.
