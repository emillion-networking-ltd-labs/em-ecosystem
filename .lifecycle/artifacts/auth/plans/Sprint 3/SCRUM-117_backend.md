# Backend Implementation Plan: SCRUM-117 Add jti Claim to JWT Tokens + Redis Deny-List

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket**: SCRUM-126 (CORS null-origin accepted risk)
- **Integration state verified**: Yes (2026-03-04)
- **Files verified against live code**:
  - `src/common/interfaces/jwt-payload.interface.ts` — only `sub`, `email`, `role` (no `jti`)
  - `src/auth/auth.service.ts` — AuthService constructor (11 deps), `generateTokens()` at L669, `refreshTokens()` access token sign at L495, `logout()` at L598, `logoutAll()` at L622, `resetPassword()` revoke at L1120, `verifyEmailChange()` revoke at L934
  - `src/auth/strategies/jwt.strategy.ts` — constructor has 1 dep (UsersService), `validate()` at L22
  - `src/auth/auth.module.ts` — 10 providers, 3 exports, no REDIS_CLIENT import (RedisModule is @Global)
  - `src/users/users.service.ts` — constructor has 6 deps (prisma, auditService, sessionsService, mailService, passwordBreachService via forwardRef, trustedDeviceService via forwardRef), revoke points: `changePassword()` L306, `adminUpdateUser()` L390, `softDelete()` L416, `selfDeleteAccount()` L567, `unlinkOAuth()` L694
  - `src/auth/interfaces/refresh-token-payload.interface.ts` — `sub`, `sessionId`, `family` (no jti — refresh tokens use sessionId for revocation)
  - `src/common/services/redis.constants.ts` — `REDIS_CLIENT = 'REDIS_CLIENT'`
  - `src/auth/tests/jwt.strategy.spec.ts` — 3 tests, mocks UsersService only
- **Constructor signatures verified**: AuthService (11 deps), JwtStrategy (1 dep: UsersService), UsersService (6 deps)
- **Guard dependency chain verified**: N/A — no guard changes. JwtStrategy is a Passport strategy (not a guard) but is resolved by JwtAuthGuard via Passport registry.

## Overview

Add a unique `jti` (JWT ID) claim to every access token per RFC 8725 §3.9, and implement a Redis-backed deny-list for immediate access token revocation on security-sensitive events. This closes the only remaining security FAIL from the auth module audit (J-05).

**Problem**: Currently, if an access token is leaked, it remains valid for up to 15 minutes with no way to revoke it. Refresh tokens have per-session revocation (`sessionId`), but access tokens have none.

**Solution**: Two-part approach:
1. **jti in every access token** — unique UUID per token for individual identification
2. **User-level deny-list** — on security events (logout, password change, etc.), deny ALL tokens for that user via a single Redis key with 15-min TTL. This avoids needing to track individual jtis and is simpler/cheaper.

**Design decision — user-level vs per-token deny**:
- Per-token deny (`deny:jti:{jti}`) would require storing the jti at sign-time and looking it up later. It adds complexity with no benefit: every security event already revokes ALL sessions, so denying all tokens for a user is the correct granularity.
- User-level deny (`deny:user:{userId}`) is a single SET+GET per event. The `jti` in the token still satisfies RFC 8725 §3.9 and enables future per-token revocation if needed.
- **Chosen approach**: Add `jti` to token payload (RFC compliance) + use user-level deny-list (simplicity). The service exposes both `denyToken()` and `denyAllForUser()` for flexibility.

## Architecture Context

- **Modules affected**: AuthModule (new service + provider changes), UsersModule (new dependency via forwardRef)
- **Components affected**:
  - `JwtPayload` interface — add `jti` field
  - `TokenDenyListService` — NEW injectable service
  - `AuthService` — add jti to signing, inject deny-list, add deny calls at 4 points
  - `JwtStrategy` — inject deny-list, add deny check in `validate()`
  - `UsersService` — inject deny-list, add deny calls at 5 points
  - `AuthModule` — register new provider + export
- **Redis infrastructure**: Already available via `@Global RedisModule` (REDIS_CLIENT). No new module imports needed.

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-117-backend` from latest main
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-117-backend`
  3. Verify: `git branch`

### Step 1: Update JwtPayload Interface

- **File**: `src/common/interfaces/jwt-payload.interface.ts`
- **Action**: Add `jti` field to interface
- **Implementation Steps**:
  1. Add `jti: string` field to the `JwtPayload` interface
- **Final interface**:
  ```typescript
  export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    jti: string;
  }
  ```
- **Impact**: This will cause TypeScript errors everywhere `JwtPayload` is used with `satisfies` — those are the exact locations we need to update in Step 3.

### Step 2: Create TokenDenyListService

- **File**: `src/auth/token-deny-list.service.ts` (NEW)
- **Action**: Create Redis-backed deny-list service
- **Function Signatures**:
  ```typescript
  @Injectable()
  export class TokenDenyListService {
    private readonly logger = new Logger(TokenDenyListService.name);

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

    async denyToken(jti: string, ttlSeconds: number): Promise<void>
    async denyAllForUser(userId: string, ttlSeconds: number): Promise<void>
    async isDenied(jti: string, userId: string): Promise<boolean>
  }
  ```
- **Implementation Steps**:
  1. Import `Injectable`, `Inject`, `Logger` from `@nestjs/common`
  2. Import `Redis` from `ioredis`, `REDIS_CLIENT` from `../../common/services/redis.constants`
  3. **`denyToken(jti, ttlSeconds)`**:
     - `await this.redis.set(`deny:jti:${jti}`, '1', 'EX', ttlSeconds)`
     - Wrap in try/catch — log warning on Redis error but don't throw (fail-open)
  4. **`denyAllForUser(userId, ttlSeconds)`**:
     - `await this.redis.set(`deny:user:${userId}`, '1', 'EX', ttlSeconds)`
     - Wrap in try/catch — fail-open
  5. **`isDenied(jti, userId)`**:
     - Pipeline: `EXISTS deny:jti:${jti}` + `EXISTS deny:user:${userId}`
     - Return `true` if either exists
     - Wrap in try/catch — return `false` on Redis error (fail-open: availability over security for 15-min tokens)
  6. Export constant `ACCESS_TOKEN_TTL_SECONDS = 900` (15 min) for reuse
- **Dependencies**: `ioredis` (already installed), `REDIS_CLIENT` (already available via @Global RedisModule)
- **Implementation Notes**:
  - Redis key prefix (`nexacore:`) is already configured in RedisModule — no manual prefix needed
  - Keys auto-expire via EX — no cleanup job required
  - Pipeline for `isDenied` reduces round-trips from 2 to 1

### Step 3: Add jti to Access Token Signing

- **File**: `src/auth/auth.service.ts`
- **Action**: Add `jti: crypto.randomUUID()` to all access token sign calls
- **Implementation Steps**:
  1. **`generateTokens()` (L673-676)** — Change:
     ```typescript
     // Before
     { sub: user.id, email: user.email, role: user.role } satisfies JwtPayload
     // After
     { sub: user.id, email: user.email, role: user.role, jti: crypto.randomUUID() } satisfies JwtPayload
     ```
  2. **`refreshTokens()` (L495-498)** — Same change:
     ```typescript
     { sub: user.id, email: user.email, role: user.role, jti: crypto.randomUUID() } satisfies JwtPayload
     ```
  3. `crypto` is already imported at L11 (`import * as crypto from 'crypto'`)
  4. **DO NOT** add jti to MFA challenge tokens (L357, L408) — those use a separate secret and different payload structure
  5. **DO NOT** add jti to refresh tokens — they use `sessionId` for revocation
- **Implementation Notes**:
  - `crypto.randomUUID()` is Node.js native (available since Node 14.17) — no new dependencies
  - The `satisfies JwtPayload` assertion will enforce at compile time that jti is present

### Step 4: Inject TokenDenyListService into AuthService

- **File**: `src/auth/auth.service.ts`
- **Action**: Add TokenDenyListService as 12th constructor dependency and add deny calls
- **Implementation Steps**:
  1. Import `TokenDenyListService` and `ACCESS_TOKEN_TTL_SECONDS`
  2. Add constructor parameter: `private readonly tokenDenyListService: TokenDenyListService` (12th dep, after `suspiciousLoginService`)
  3. Add fire-and-forget deny calls at these 4 points:
     - **`logout()` (after L605)**: `this.tokenDenyListService.denyAllForUser(payload.sub, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
       - Inside the try block, after `revokeSession`, before audit log
     - **`logoutAll()` (after L626)**: `this.tokenDenyListService.denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
     - **`resetPassword()` (after L1120)**: `this.tokenDenyListService.denyAllForUser(resetToken.userId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
     - **`verifyEmailChange()` (after L934)**: `this.tokenDenyListService.denyAllForUser(user.id, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
  4. All calls are fire-and-forget (`.catch(() => {})`) — session revocation is the primary security mechanism; deny-list is defense-in-depth

### Step 5: Update JwtStrategy to Check Deny-List

- **File**: `src/auth/strategies/jwt.strategy.ts`
- **Action**: Inject TokenDenyListService and add deny check in `validate()`
- **Implementation Steps**:
  1. Import `TokenDenyListService` from `../token-deny-list.service`
  2. Add constructor parameter: `private readonly tokenDenyListService: TokenDenyListService`
     - Note: Passport strategies use `super()` in constructor. The injection must be added AFTER the `super()` call won't work directly — use NestJS `@Inject()` pattern for additional deps:
     ```typescript
     constructor(
       private readonly usersService: UsersService,
       private readonly tokenDenyListService: TokenDenyListService,
     ) {
       super({ ... });
     }
     ```
  3. Update `validate()`:
     ```typescript
     async validate(payload: JwtPayload): Promise<SafeUser> {
       // Check deny-list first (fail-open: Redis down → allow)
       const isDenied = await this.tokenDenyListService.isDenied(payload.jti, payload.sub);
       if (isDenied) {
         throw new UnauthorizedException('Token has been revoked');
       }

       const user = await this.usersService.findById(payload.sub);
       if (!user) {
         throw new UnauthorizedException('User not found');
       }
       if (!user.isActive) {
         throw new UnauthorizedException('Account deactivated');
       }
       return toSafeUser(user);
     }
     ```
  4. The deny-list check comes BEFORE the DB lookup — saves a DB round-trip for revoked tokens
- **Implementation Notes**:
  - `isDenied()` is already fail-open internally (returns `false` on Redis error)
  - The `payload.jti` will be present on all new tokens. For old tokens signed before this change, `jti` will be `undefined` — `isDenied(undefined, userId)` will still check the user-level deny key correctly

### Step 6: Inject TokenDenyListService into UsersService

- **File**: `src/users/users.service.ts`
- **Action**: Add TokenDenyListService as 7th constructor dependency and add deny calls
- **Implementation Steps**:
  1. Import `TokenDenyListService` and `ACCESS_TOKEN_TTL_SECONDS` from auth module
  2. Add constructor parameter using forwardRef (circular dep with AuthModule):
     ```typescript
     @Inject(forwardRef(() => TokenDenyListService))
     private readonly tokenDenyListService: TokenDenyListService,
     ```
  3. Add fire-and-forget deny calls at these 5 points:
     - **`changePassword()` (after L306-307)**: `this.tokenDenyListService.denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
     - **`adminUpdateUser()` — deactivation branch (after L390)**: `this.tokenDenyListService.denyAllForUser(targetId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
     - **`softDelete()` (after L416)**: `this.tokenDenyListService.denyAllForUser(targetId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
     - **`selfDeleteAccount()` — after session deletion in transaction**: This one is tricky — sessions are deleted inside `$transaction` at L629. Add the deny call AFTER the transaction completes (before the audit log): `this.tokenDenyListService.denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
       - Note: Read the `selfDeleteAccount()` method carefully to find the exact insertion point after the `$transaction` and before the audit log
     - **`unlinkOAuth()` (after L694-695)**: `this.tokenDenyListService.denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});`
- **Implementation Notes**:
  - forwardRef is needed because UsersModule imports AuthModule (forwardRef) and TokenDenyListService is in AuthModule
  - Same fire-and-forget pattern as AuthService

### Step 7: Register TokenDenyListService in AuthModule

- **File**: `src/auth/auth.module.ts`
- **Action**: Add to providers and exports
- **Implementation Steps**:
  1. Import `TokenDenyListService` from `./token-deny-list.service`
  2. Add to `providers` array (after `TrustedDeviceService`): `TokenDenyListService`
  3. Add to `exports` array: `TokenDenyListService` (needed by UsersService via forwardRef)
- **Final exports**: `[AuthService, PasswordBreachService, TrustedDeviceService, TokenDenyListService]`

### Step 8: Write Unit Tests — TokenDenyListService

- **File**: `src/auth/tests/token-deny-list.service.spec.ts` (NEW)
- **Action**: Full unit test coverage for the new service
- **Implementation Steps**:
  1. Mock `REDIS_CLIENT` with `set`, `exists`, `pipeline` jest mocks
  2. Test cases:
     - `denyToken()` calls Redis SET with correct key and EX TTL
     - `denyAllForUser()` calls Redis SET with correct user key and EX TTL
     - `isDenied()` returns `true` when jti key exists
     - `isDenied()` returns `true` when user key exists
     - `isDenied()` returns `false` when neither key exists
     - `isDenied()` returns `false` when Redis throws (fail-open)
     - `denyToken()` does not throw when Redis fails (fail-open)
     - `denyAllForUser()` does not throw when Redis fails (fail-open)

### Step 9: Update Existing Tests — JwtStrategy

- **File**: `src/auth/tests/jwt.strategy.spec.ts`
- **Action**: Add TokenDenyListService mock and deny-list test cases
- **Implementation Steps**:
  1. Add `TokenDenyListService` mock to providers: `{ provide: TokenDenyListService, useValue: { isDenied: jest.fn().mockResolvedValue(false) } }`
  2. Update all existing `validate()` calls to include `jti: 'test-jti'` in payload
  3. Add test cases:
     - Token with denied jti → throws `UnauthorizedException('Token has been revoked')`
     - Token for denied user → throws `UnauthorizedException('Token has been revoked')`
     - Redis failure (isDenied throws) → still validates successfully (fail-open)

### Step 10: Update Existing Tests — AuthService

- **File**: `src/auth/tests/auth.service.spec.ts`
- **Action**: Add TokenDenyListService mock and verify jti + deny calls
- **Implementation Steps**:
  1. Add `TokenDenyListService` mock to the module providers: `{ provide: TokenDenyListService, useValue: { denyAllForUser: jest.fn().mockResolvedValue(undefined) } }`
  2. Add to `beforeEach`: wire up the mock reference
  3. Add test cases:
     - `generateTokens` includes jti in access token (decode the signed JWT and verify `jti` is a UUID)
     - `refreshTokens` includes jti in new access token
     - `logout()` calls `denyAllForUser(userId, 900)`
     - `logoutAll()` calls `denyAllForUser(userId, 900)`
     - `resetPassword()` calls `denyAllForUser(userId, 900)`
     - `verifyEmailChange()` calls `denyAllForUser(userId, 900)`
  4. Fire-and-forget resilience: `denyAllForUser` rejects → main flow still succeeds

### Step 11: Update Existing Tests — UsersService

- **File**: `src/users/tests/users.service.spec.ts`
- **Action**: Add TokenDenyListService mock and verify deny calls
- **Implementation Steps**:
  1. Add `TokenDenyListService` mock to the module providers (via forwardRef pattern matching existing mocks)
  2. Add test cases:
     - `changePassword()` calls `denyAllForUser(userId, 900)`
     - `adminUpdateUser()` with `isActive: false` calls `denyAllForUser(targetId, 900)`
     - `softDelete()` calls `denyAllForUser(targetId, 900)`
     - `selfDeleteAccount()` calls `denyAllForUser(userId, 900)`
     - `unlinkOAuth()` calls `denyAllForUser(userId, 900)`
  3. Fire-and-forget resilience: `denyAllForUser` rejects → main flow still succeeds

### Step 12: Update Technical Documentation

- **Action**: Update all relevant documentation
- **Implementation Steps**:
  1. **`ai-specs/specs/integration-state.md`**:
     - AuthModule providers: add `TokenDenyListService`
     - AuthModule exports: add `TokenDenyListService`
     - AuthService constructor: 12 deps (add TokenDenyListService)
     - JwtStrategy constructor: 2 deps (add TokenDenyListService)
     - UsersService constructor: 7 deps (add TokenDenyListService via forwardRef)
     - Changelog: add SCRUM-117 entry
  2. **`ai-specs/specs/data-model.md`**:
     - Add Redis key patterns section for token deny-list: `deny:jti:{jti}`, `deny:user:{userId}` with TTL = 900s
  3. **`ai-specs/changes/audit/audit-2026-03-03T16-24/fase-3-security-auth.md`**:
     - Update J-05 from FAIL to PASS with evidence
  4. **`ai-specs/changes/audit/audit-2026-03-03T16-24/fase-9-completion-report-auth.md`**:
     - Update FAIL-01 (J-05) to PASS
     - Update FAIL count: 2 → 1
     - Update Phase 3 FAIL count: 1 → 0
     - Update Security Compliance RFC 8725: 5/6 → 6/6 (100%)
     - Update sign-off checklist Phase 3 checkbox

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update JwtPayload interface (add `jti`)
3. Step 2: Create TokenDenyListService (new file)
4. Step 7: Register in AuthModule (providers + exports)
5. Step 3: Add jti to access token signing (2 locations in auth.service.ts)
6. Step 4: Inject deny-list into AuthService + add deny calls (4 points)
7. Step 5: Update JwtStrategy validate() with deny check
8. Step 6: Inject deny-list into UsersService + add deny calls (5 points)
9. Step 8: Write TokenDenyListService tests
10. Step 9: Update JwtStrategy tests
11. Step 10: Update AuthService tests
12. Step 11: Update UsersService tests
13. Verify: `nest build` clean, `npx jest` all pass, `nest start` routes OK
14. Step 12: Update documentation

## Testing Checklist

- [ ] `nest build` — zero TypeScript errors
- [ ] `npx jest` — all tests pass (773+ expected to grow to ~800+)
- [ ] `nest start` — 53 routes registered, no DI errors
- [ ] Coverage thresholds met (stmts >=90%, branches >=85%, funcs >=90%, lines >=90%)
- [ ] Decoded access token from login contains `jti` field (UUID format)
- [ ] Decoded access token from refresh contains `jti` field
- [ ] MFA challenge tokens do NOT contain `jti` (different payload)
- [ ] Refresh tokens do NOT contain `jti` (use sessionId)
- [ ] After logout: access token immediately rejected (deny-list)
- [ ] After password change: all user tokens rejected
- [ ] Redis down: authentication still works (fail-open verified by test)
- [ ] Redis deny keys expire after 900s (verified by TTL mock)

## Error Response Format

Token revocation returns standard 401:
```json
{
  "statusCode": 401,
  "message": "Token has been revoked",
  "error": "Unauthorized"
}
```

## Dependencies

- No new npm packages — uses existing `ioredis` via `REDIS_CLIENT` and native `crypto.randomUUID()`

## Notes

- **Backward compatibility**: Old tokens (without jti) will have `payload.jti === undefined`. `isDenied(undefined, userId)` will check `deny:jti:undefined` (won't match) + `deny:user:{userId}` (will match if user is denied). This is correct behavior — user-level deny catches all tokens regardless of jti presence.
- **Performance**: Redis EXISTS is O(1), ~1ms. Pipeline reduces to single round-trip for the 2-key check. Minimal impact on request latency.
- **Memory**: ~64 bytes per deny key. At 1000 concurrent logouts, ~64KB in Redis. Keys auto-expire after 15 min.
- **Refresh tokens are NOT affected**: They use `sessionId` for revocation (already working). Adding jti to refresh tokens would be redundant.
- **MFA challenge tokens are NOT affected**: They use a separate secret and expiry (5 min). They don't go through JwtStrategy.
- **Fire-and-forget pattern**: All `denyAllForUser()` calls use `.catch(() => {})`. Token deny-list is defense-in-depth — session revocation is the primary mechanism.

## Next Steps After Implementation

1. Create implementation record via `/update-docs SCRUM-117`
2. Update SCRUM-117 status to Done in Jira
3. Evaluate SCRUM-118 (mailer vulnerability) — the only remaining FAIL from the audit

## Implementation Verification

- [ ] **Code Quality**: TypeScript strict, no `any` casts, proper typing with `satisfies`
- [ ] **Functionality**: jti present in all access tokens, deny-list works on all 9 security events
- [ ] **Testing**: New service fully tested, existing tests updated, fire-and-forget resilience covered
- [ ] **Integration**: AuthModule exports TokenDenyListService, UsersModule consumes via forwardRef
- [ ] **Documentation**: integration-state.md, data-model.md, audit reports all updated
- [ ] **Security**: fail-open pattern, no new attack vectors, RFC 8725 §3.9 compliant
