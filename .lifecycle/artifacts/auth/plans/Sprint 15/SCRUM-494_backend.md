---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-494
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-20
status: draft
last_completed_ticket: SCRUM-493
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-494 AUTH v2 Phase 1.3 — `JwtV2Strategy` + first consumer endpoint (`POST /auth/v2/refresh`)

## 1. Codebase State Snapshot

- **Date**: 2026-05-20
- **Last completed ticket**: SCRUM-493 (AUTH v2 Phase 1.2 — opaque refresh tokens + SessionsServiceV2 tenant-aware, merged `18fd537`). Main coverage at **91.15% statements + lines** with +1.15 pp margin above 90% threshold.
- **Integration state verified**: Yes (read header confirms `Last update: SCRUM-493`).
- **Files verified against live code** (all read from `nexacore-api/`):
  - `src/auth/auth.module.ts:1-117` — current AuthModule layout: imports include `forwardRef(() => UsersModule)`, `AuditModule`, `forwardRef(() => SessionsModule)`, `CryptoModule`, `MailModule`, `SecurityModule`, `PassportModule.register({ defaultStrategy: 'jwt' })`, `JwtModule.registerAsync(...)`. Providers (24) include `TokenServiceV2` (line 88) since SCRUM-492; `JwtStrategy` (line 95) is v1. Exports (5): `AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService` — `TokenServiceV2` NOT exported (strangler invariant from Phase 1.1, deliberately preserved).
  - `src/auth/auth.controller.ts:152-185` — v1 `POST /auth/refresh` shape reference: `@HttpCode(HttpStatus.OK)`, `@Throttle({ global: AUTH_RATE_LIMITS.refresh })`, reads cookie via `req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]`, calls `authService.refreshTokens(refreshToken, meta, meta)`, returns `{ accessToken }` after `setCookieFromConfig(res, result.cookie)`.
  - `src/auth/strategies/jwt.strategy.ts:1-54` — v1 JwtStrategy pattern: extends `PassportStrategy(Strategy)` (no explicit name → default `'jwt'`); constructor deps `UsersService + TokenDenyListService + ConfigService`; `super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: configService.get('auth.jwtSecret')!, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, algorithms: ['HS256'] })`; `validate(payload: JwtPayload): Promise<SafeUser>` — does deny-list check + user lookup → returns `SafeUser`. **v2 strategy will differ**: no UsersService lookup (payload IS the canonical source for tenant + flag), no TokenDenyListService (v2 doesn't use deny-list — Phase 1.2 design); minimal deps (`ConfigService` only).
  - `src/auth/token.service.v2.ts:43-102` — Phase 1.1 reference: `@Injectable` with single dep (`JwtService`); private `isValidV2Payload(p: unknown): p is JwtPayloadV2` at line 89-101 — this is the shape guard that JwtV2Strategy needs. **Decision locked at /plan**: extract to standalone util `src/auth/utils/jwt-payload-v2.guard.ts` (pure type guard, no DI); update `token.service.v2.ts` to import + use the extracted version. Public API of `verifyAccessToken` unchanged.
  - `src/auth/interfaces/jwt-payload-v2.interface.ts:21-46` — JwtPayloadV2 shape (7 keys: sub, jti, sessionId, iat, tenantId, tenantRole, isPlatformAdmin) — drives the guard.
  - `src/sessions/sessions.service.v2.ts:65-293` — Phase 1.2 reference: 4 public methods (`createSession`, `validateAndRotate`, `revokeSession`, `revokeAllForTenant`). `validateAndRotate(opaqueToken: string)` returns `{ sessionId, refreshToken (new plaintext), userId, tenantId, tenantRole, isPlatformAdmin, expiresAt }`. All failures throw `UnauthorizedException(AUTHENTICATION_FAILED)`.
  - `src/sessions/sessions.module.ts:1-15` — current shape: `providers: [SessionsService, SessionsServiceV2]`, `exports: [SessionsService]`. **This ticket adds `SessionsServiceV2` to `exports[]`** — first named consumer wired (the new AuthV2Controller in AuthModule).
  - `src/auth/constants/auth.constants.ts:70-81, 152, 158-159` — `AUTH_RATE_LIMITS.refresh = { ttl: 60_000, limit: 30 }`; `REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'`; `JWT_ISSUER = JWT_AUDIENCE = 'nexacore-api'`. **NEW constant** `REFRESH_TOKEN_COOKIE_NAME_V2 = 'refresh_token_v2'` to be added by this ticket.
  - `src/auth/token.service.ts:338-350` — v1 `buildRefreshCookie` reference: returns `CookieConfig` (name + value + options { httpOnly: true, secure: isProduction, sameSite: 'strict', path: '/', maxAge: refreshMaxAgeMs/1000 }). v2 controller can build the cookie inline with same shape OR via a new helper on TokenServiceV2 — recommend inline for now (no helper duplication; revisit when 2nd v2 endpoint arrives).
  - `src/auth/interfaces/auth.interfaces.ts:1-13` — `CookieConfig` interface (`name, value, options { httpOnly, secure, sameSite, path, maxAge }`). Reusable for v2.
  - `src/common/utils/cookie.util.ts:7-9` — `setCookieFromConfig(res, cookie)`. Reusable.
  - `src/common/utils/request-meta.ts:6-18` — `extractRequestMeta(req)` returns `{ ipAddress, userAgent }`. Reusable for audit context if needed; for v2 refresh, ip/ua may not be strictly needed (rotation inherits from row).
  - `src/common/constants/error-messages.ts:4` — `ErrorMessages.auth.AUTHENTICATION_FAILED` exists. Reuse.
  - `test/auth-e2e/setup.ts:12, 699` — e2e tests bootstrap full `AppModule` via `Test.createTestingModule({ imports: [AppModule] })`. **Critical implication**: new strategy + controller will be DI-exercised by every e2e suite on bootstrap. Bootstrap must be clean (no new cycles; all providers resolvable).
  - `src/auth/tests/jwt.strategy.spec.ts:1-90` — v1 strategy spec pattern reference. NEW v2 strategy spec follows the same idiom.

- **Constructor signatures verified** (live code):
  - `JwtStrategy(usersService: UsersService, tokenDenyListService: TokenDenyListService, configService: ConfigService)` — v1, unchanged.
  - `TokenServiceV2(jwt: JwtService)` — Phase 1.1, unchanged.
  - `SessionsServiceV2(prisma: PrismaService, auditService: AuditService, configService: ConfigService)` — Phase 1.2, unchanged.
  - **NEW** `JwtV2Strategy(configService: ConfigService)` — single dep.
  - **NEW** `AuthV2Controller(tokenServiceV2: TokenServiceV2, sessionsServiceV2: SessionsServiceV2)` — 2 deps, both AuthModule-resolvable (TokenServiceV2 same-module; SessionsServiceV2 via SessionsModule.exports[] addition in this ticket).

- **Methods verified to exist**:
  - `tokenServiceV2.mintAccessToken({ userId, sessionId, tenantId, tenantRole, isPlatformAdmin })` at `src/auth/token.service.v2.ts:53` — returns `string`.
  - `sessionsServiceV2.validateAndRotate(opaqueToken: string)` at `src/sessions/sessions.service.v2.ts` — returns `RotateResult { sessionId, refreshToken, expiresAt, userId, tenantId, tenantRole, isPlatformAdmin }`.

- **Guard dependency chain verified**: N/A — this ticket adds NO `@UseGuards()` to the new endpoint (refresh tokens ARE the authentication; access tokens may be expired). `JwtV2Strategy` is the Passport strategy used for OTHER v2-guarded endpoints in Phase 2+, not for `/auth/v2/refresh`.

- **Discrepancies with integration-state.md**: **None** (header says SCRUM-493 last; live code matches).

### Plan-time decisions (operator-locked from enriched ticket)

| # | Decision | Locked value |
|---|---|---|
| 1 | Extract `isValidV2Payload` to standalone util? | **YES** — new file `src/auth/utils/jwt-payload-v2.guard.ts` (pure function, no DI). 1-line MOD on `token.service.v2.ts` to use it. First Phase 1.1 production code touch since SCRUM-492 (explicit acknowledgement). |
| 2 | Refresh token transport (body vs cookie) | **Cookie-only** — matches v1; httpOnly + secure + sameSite=strict; XSS-resistant. |
| 3 | Cookie name | **`refresh_token_v2`** — continuity with v1's naming. |
| 4 | Response body includes refresh token? | **No** — cookie-only (more secure; mobile clients in future will use different mechanism). |
| 5 | `SessionsModule.exports[]` change | **YES** — first named consumer (AuthV2Controller) wired in this ticket. |
| 6 | Preserve `TokenServiceV2.verifyAccessToken` public API after extracting guard? | **YES** — internal change only; spec from Phase 1.1 stays green unchanged. |

### CI Gate Anticipation (per SCRUM-485 mandate — em-ecosystem Security Pipeline)

| CI gate | Expected behavior |
|---|---|
| Layer 1: Secrets Detection | PASS / unchanged (no secrets in fixtures; opaque tokens generated at runtime) |
| Layer 2: Dependency Audit (nexacore-api) | PASS / unchanged (`passport-jwt` + `@nestjs/passport` already in deps from v1) |
| Layer 2: Dependency Audit (nexacore-dashboard) | PASS / unchanged (not touched) |
| Layer 3: SAST (Backend) | PASS — zero new `process.env`; ErrorMessages constants only; no `any`; cookie via inline build that mirrors v1's structure |
| Layer 3: SAST (Frontend) | PASS / unchanged |
| **Layer 4: Tests (Backend)** | **PASS** — coverage delta favorable: +~17 new tests on heavily-testable surface (mock-free strategy spec + mocked-services controller spec); main at 91.15% pre-staged. Phase 1.1 spec stays green after isValidV2Payload extraction (verified pattern: spec asserts behavior of `verifyAccessToken`, not the private). |
| Layer 4: Tests (Frontend) | PASS / unchanged |
| Layer 5: Build (Backend) | PASS (gated by L4); **AppModule DI bootstrap critical** — e2e tests will fail on bootstrap if new strategy/controller have unresolvable deps. Plan ensures clean DI. |
| Layer 5: Build (Frontend) | PASS / unchanged |
| Security Gate | PASS (cascade) |

**Migration handling**: NONE — zero Prisma schema changes.

**ai-specs CI**: NOT exercised by this ticket — em-ecosystem PR doesn't touch ai-specs. Plan + verify + record handled by lifecycle commands.

## 2. Regression Impact Analysis

- **Blast radius**:
  - **Direct dependents** of touched code:
    - `nexacore-api/src/auth/token.service.v2.ts` (1-line MOD: import the extracted guard, replace inline call) — direct touch.
    - `nexacore-api/src/auth/auth.module.ts` (MOD: +2 imports + 1 provider + 1 controller).
    - `nexacore-api/src/sessions/sessions.module.ts` (MOD: 1 line in `exports[]`).
    - `nexacore-api/src/auth/constants/auth.constants.ts` (MOD: +1 export).
  - **Transitive dependents** of `SessionsModule.exports[]` change: zero — additive export. Existing consumers (AuthModule, UsersModule) inject `SessionsService` v1, NOT affected.
  - **Transitive dependents** of `TokenServiceV2.verifyAccessToken` behavior: unchanged (the extracted guard returns the same result; only call site moves).
  - **Test dependents**:
    - `src/auth/tests/token.service.v2.spec.ts` — Phase 1.1 spec uses real JwtModule + real TokenServiceV2. After guard extraction, the private method no longer exists in TokenServiceV2. **Verify**: spec asserts behavior of `verifyAccessToken` end-to-end, NOT the private method, so it should still pass unchanged. Re-run after Step 1 to confirm.
    - `test/auth-e2e/*.e2e-spec.ts` — bootstrap full AppModule. Adding new strategy/controller is additive; e2e tests exercise v1 paths only, so behavior unchanged. **DI bootstrap MUST be clean** — verify by running `nest build` (catches DI typing) + spot-check e2e startup.
- **Breaking changes identified**: **None at the API level**. New endpoint (`/auth/v2/refresh`) is purely additive. v1 `/auth/refresh` continues to serve all production traffic.
- **API contract impact**: ONE new endpoint added (`POST /auth/v2/refresh`). `api-spec.yml` will gain new path entry — handled by `/update-docs`, NOT in this branch (per wave convention).
- **Schema migration impact**: **None** — zero Prisma schema changes.
- **Test files requiring updates**:
  - None mandatory. The existing `token.service.v2.spec.ts` should pass unchanged after guard extraction — but **must be re-run as part of Step 7 verification**.
  - Existing e2e specs unchanged.
- **Blast radius size**: **5 files touched** (4 MOD + 0 NEW prod files in this section; the NEW prod files are listed in §5). Plus 2 new spec files. Under the 5-file threshold for "extra review attention" only because all 4 MODs are purely additive — no behavioral changes to existing code paths.

## 3. Overview

Third and final sub-phase of Phase 1 of the AUTH v2 + Tenancy v1 program. **This is the moment v2 stops being internal scaffolding and gains its first production HTTP surface**: a guarded `POST /auth/v2/refresh` endpoint that exercises both `TokenServiceV2` (Phase 1.1 — access token mint) and `SessionsServiceV2` (Phase 1.2 — opaque refresh rotation) end-to-end through Passport.

**Architecture principles applied**:
- **Strangler-pattern relaxation is NAMED here**: Phase 1.2 deliberately kept `SessionsServiceV2` un-exported; Phase 1.3 IS its first consumer. The export change is a feature, not a leak.
- **Two-gate verification** on JwtV2Strategy (matches Phase 1.1 discipline): gate 1 is crypto (Passport-jwt verifies signature + iss/aud/alg + expiry via `JwtModule` config); gate 2 is shape (extracted guard rejects forged v1-shape payloads).
- **No failure-mode enumeration**: every refresh failure (missing cookie / token-not-found / revoked / expired / membership-stale / hash-mismatch / membership-stale) throws the same `UnauthorizedException(AUTHENTICATION_FAILED)`. The reason class lives only in audit metadata (emitted by SessionsServiceV2 internally) — never in the HTTP response.
- **Cookie isolation**: `refresh_token_v2` is distinct from v1's `refresh_token`. Clients holding both can use both; the namespaces don't collide. Eventually v1 cookies will age out as v1 endpoints are sunset.
- **Order-of-operations honesty**: `validateAndRotate` commits before `mintAccessToken` runs (Phase 1.2's atomicity boundary). If access-mint throws (e.g., JwtModule misconfig), the rotation is already committed → orphan rotation. Acceptable trade-off per program doc §2.4; client retries refresh. Not wrapping both in a single tx preserves the "TokenServiceV2 doesn't touch DB" invariant.

## 4. Architecture Context

- **Modules involved**:
  - `AuthModule` (gains 1 new provider `JwtV2Strategy` + 1 new controller `AuthV2Controller`). `exports[]` UNCHANGED.
  - `SessionsModule` (gains 1 entry in `exports[]`: `SessionsServiceV2`). `providers[]` UNCHANGED.
  - `JwtModule` (unchanged; v2 reuses v1's secret/issuer/audience config — program decision §2.3.1).
  - `PassportModule` (unchanged; supports multiple named strategies natively).

- **Components affected** (all NEW unless noted):
  - 1 NEW Passport strategy: `JwtV2Strategy` (`@Injectable`, strategy name `'jwt-v2'`).
  - 1 NEW NestJS controller: `AuthV2Controller` (`@Controller('auth/v2')`).
  - 1 NEW endpoint: `POST /auth/v2/refresh`.
  - 1 NEW pure-function util: `isValidV2Payload(p: unknown): p is JwtPayloadV2`.
  - 1 NEW constant: `REFRESH_TOKEN_COOKIE_NAME_V2 = 'refresh_token_v2'`.
  - 1 MOD: `TokenServiceV2` — import extracted guard, replace inline private method (delete the private).
  - 1 MOD: `AuthModule.providers[]` + `controllers[]`.
  - 1 MOD: `SessionsModule.exports[]`.
  - 2 NEW spec files.

- **Files referenced**:
  - `src/auth/strategies/jwt-v2.strategy.ts` (NEW)
  - `src/auth/auth-v2.controller.ts` (NEW)
  - `src/auth/utils/jwt-payload-v2.guard.ts` (NEW)
  - `src/auth/tests/jwt-v2.strategy.spec.ts` (NEW)
  - `src/auth/tests/auth-v2.controller.spec.ts` (NEW)
  - `src/auth/token.service.v2.ts` (MOD)
  - `src/auth/auth.module.ts` (MOD)
  - `src/sessions/sessions.module.ts` (MOD)
  - `src/auth/constants/auth.constants.ts` (MOD)

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: `feature/SCRUM-494-backend` from latest main.
- **Branch Naming**: `feature/SCRUM-494-backend` (REQUIRED). NEVER branch from another feature branch.
- **Implementation Steps**:
  1. `cd ~/projects/em-ecosystem && git checkout main && git pull origin main`.
  2. Confirm `git log --oneline -1` shows `18fd537` (SCRUM-493 squash merge).
  3. `git checkout -b feature/SCRUM-494-backend`.
  4. `git branch --show-current` → `feature/SCRUM-494-backend`.

### Step 1: Extract `isValidV2Payload` to standalone util

- **File**: `nexacore-api/src/auth/utils/jwt-payload-v2.guard.ts` (NEW, ~20 LOC) + `nexacore-api/src/auth/token.service.v2.ts` (MOD: 1 line).
- **Action**: Move the private `isValidV2Payload` method out of `TokenServiceV2` into a pure standalone function. Both consumers (TokenServiceV2.verifyAccessToken + new JwtV2Strategy.validate) reuse it.
- **Implementation Steps**:
  1. Create `src/auth/utils/jwt-payload-v2.guard.ts`:
     ```typescript
     // WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15)

     import { JwtPayloadV2 } from '../interfaces/jwt-payload-v2.interface';

     /**
      * Type guard for JwtPayloadV2. Pure function, no DI.
      *
      * Two-gate verification (SCRUM-492 Phase 1.1 + SCRUM-494 Phase 1.3):
      *   - Gate 1 (crypto): handled by JwtService.verify / Passport-jwt.
      *   - Gate 2 (shape): THIS guard rejects forged v1-shape payloads that
      *     pass crypto by virtue of sharing the secret.
      *
      * Single source of truth: imported by TokenServiceV2.verifyAccessToken
      * AND JwtV2Strategy.validate. NEVER duplicate the field list elsewhere.
      */
     export function isValidV2Payload(p: unknown): p is JwtPayloadV2 {
       if (!p || typeof p !== 'object') return false;
       const o = p as Record<string, unknown>;
       return (
         typeof o.sub === 'string' &&
         typeof o.jti === 'string' &&
         typeof o.sessionId === 'string' &&
         typeof o.iat === 'number' &&
         typeof o.tenantId === 'string' &&
         typeof o.tenantRole === 'string' &&
         typeof o.isPlatformAdmin === 'boolean'
       );
     }
     ```
  2. Update `src/auth/token.service.v2.ts`:
     - Add import: `import { isValidV2Payload } from './utils/jwt-payload-v2.guard';`
     - Replace the call `this.isValidV2Payload(decoded)` (line 83) with `isValidV2Payload(decoded)`.
     - **Delete** the private `isValidV2Payload` method (lines 89-101).
  3. Run `npm run build` — must exit 0.
  4. Run `npx jest --testPathPatterns='token.service.v2' --maxWorkers=1 --forceExit` — must pass all 18 tests unchanged (the spec tests `verifyAccessToken` behavior, not the private method).
- **Implementation Notes**:
  - Public API of `verifyAccessToken` is unchanged — same input, same return type, same throw semantics.
  - This is the **first time** Phase 1.1 production code is modified. Acknowledged at plan time per operator decision #1.

### Step 2: Add `JwtV2Strategy`

- **File**: `nexacore-api/src/auth/strategies/jwt-v2.strategy.ts` (NEW, ~50 LOC).
- **Action**: Passport strategy for v2 access tokens. Named `'jwt-v2'` to coexist with v1's `'jwt'`.
- **Function Signature**:
  ```typescript
  constructor(configService: ConfigService)
  validate(payload: unknown): Promise<JwtPayloadV2>
  ```
- **Implementation Steps**:
  1. **File header** (mandatory AUTH-domain convention):
     ```typescript
     // WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

     /**
      * JwtV2Strategy — Passport strategy for v2 access tokens.
      *
      * SCRUM-494 / AUTH v2 + Tenancy v1 Phase 1.3.
      *
      * Two-gate verification:
      *   - Gate 1 (crypto): Passport-jwt validates signature + iss/aud/alg + expiry
      *     using the shared JwtModule config (same secret as v1 — program §2.3.1).
      *   - Gate 2 (shape): isValidV2Payload guard rejects forged v1-shape payloads.
      *
      * On success: returns the typed JwtPayloadV2 (payload IS the canonical source
      * for tenantId / tenantRole / isPlatformAdmin — no user lookup, unlike v1).
      * On failure: throws UnauthorizedException(AUTHENTICATION_FAILED) — no enumeration.
      */
     ```
  2. Imports:
     ```typescript
     import { Injectable, UnauthorizedException } from '@nestjs/common';
     import { ConfigService } from '@nestjs/config';
     import { PassportStrategy } from '@nestjs/passport';
     import { ExtractJwt, Strategy } from 'passport-jwt';
     import { JwtPayloadV2 } from '../interfaces/jwt-payload-v2.interface';
     import { isValidV2Payload } from '../utils/jwt-payload-v2.guard';
     import { ErrorMessages } from '../../common/constants/error-messages';
     import { JWT_ISSUER, JWT_AUDIENCE } from '../constants/auth.constants';
     ```
  3. Class:
     ```typescript
     @Injectable()
     export class JwtV2Strategy extends PassportStrategy(Strategy, 'jwt-v2') {
       constructor(configService: ConfigService) {
         super({
           jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
           ignoreExpiration: false,
           secretOrKey: configService.get<string>('auth.jwtSecret')!,
           issuer: JWT_ISSUER,
           audience: JWT_AUDIENCE,
           algorithms: ['HS256'],
         });
       }

       validate(payload: unknown): Promise<JwtPayloadV2> {
         if (!isValidV2Payload(payload)) {
           throw new UnauthorizedException(
             ErrorMessages.auth.AUTHENTICATION_FAILED,
           );
         }
         return Promise.resolve(payload);
       }
     }
     ```
- **Implementation Notes**:
  - Strategy name `'jwt-v2'` is the SECOND argument to `PassportStrategy(Strategy, 'jwt-v2')`. Distinct from v1's default `'jwt'`. NestJS Passport supports multiple named strategies natively.
  - Does NOT touch `TokenDenyListService` — v2 has no deny-list per Phase 1.2 design (sessions revoked by row flag).
  - Does NOT call `usersService.findById` — payload carries canonical tenantId/tenantRole/isPlatformAdmin; user lookup adds latency without value. Phase 2 (AuthIntent) may layer further checks downstream if needed.
  - `validate` returns `Promise<JwtPayloadV2>` because PassportStrategy.validate is declared async — wrap in `Promise.resolve` for the sync path.

### Step 3: Add `REFRESH_TOKEN_COOKIE_NAME_V2` constant

- **File**: `nexacore-api/src/auth/constants/auth.constants.ts` (MOD: +1 line).
- **Action**: Append the new constant right after the existing `REFRESH_TOKEN_COOKIE_NAME` (line 152).
- **Implementation Steps**:
  1. Add: `export const REFRESH_TOKEN_COOKIE_NAME_V2 = 'refresh_token_v2';`
  2. Optional inline comment: `/** SCRUM-494 / Phase 1.3 — distinct cookie name to coexist with v1 during overlap. */`
- **Implementation Notes**: v1's `REFRESH_TOKEN_COOKIE_NAME` is `'refresh_token'`. Distinct names prevent overlap collisions during the strangler-pattern overlap period.

### Step 4: Add `AuthV2Controller` with `POST /auth/v2/refresh`

- **File**: `nexacore-api/src/auth/auth-v2.controller.ts` (NEW, ~140 LOC).
- **Action**: First production HTTP surface for v2.
- **Function Signature**:
  ```typescript
  constructor(tokenServiceV2: TokenServiceV2, sessionsServiceV2: SessionsServiceV2, configService: ConfigService)
  async refresh(req: Request, res: Response): Promise<{ accessToken: string; user: { id, tenantId, tenantRole, isPlatformAdmin } }>
  ```
- **Implementation Steps**:
  1. **File header** (mandatory AUTH-domain convention).
  2. Imports:
     ```typescript
     import {
       Controller, Post, HttpCode, HttpStatus,
       Req, Res, UnauthorizedException,
     } from '@nestjs/common';
     import { ConfigService } from '@nestjs/config';
     import { Throttle } from '@nestjs/throttler';
     import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
     import type { Request, Response } from 'express';
     import { TokenServiceV2 } from './token.service.v2';
     import { SessionsServiceV2 } from '../sessions/sessions.service.v2';
     import {
       REFRESH_TOKEN_COOKIE_NAME_V2,
       AUTH_RATE_LIMITS,
     } from './constants/auth.constants';
     import { setCookieFromConfig } from '../common/utils/cookie.util';
     import { ErrorMessages } from '../common/constants/error-messages';
     import { parseDurationMs } from './utils/parse-duration';
     ```
  3. Class shape:
     ```typescript
     @ApiTags('Auth v2')
     @Controller('auth/v2')
     export class AuthV2Controller {
       private readonly isProduction: boolean;
       private readonly refreshMaxAgeMs: number;

       constructor(
         private readonly tokenServiceV2: TokenServiceV2,
         private readonly sessionsServiceV2: SessionsServiceV2,
         configService: ConfigService,
       ) {
         this.isProduction = configService.get<string>('app.env') === 'production';
         const refreshExpiration = configService.get<string>('auth.jwtRefreshExpiration')!;
         this.refreshMaxAgeMs = parseDurationMs(refreshExpiration);
       }

       @Post('refresh')
       @HttpCode(HttpStatus.OK)
       @Throttle({ global: AUTH_RATE_LIMITS.refresh })
       @ApiOperation({ summary: 'Refresh v2 access token using httpOnly opaque refresh cookie' })
       @ApiResponse({ status: 200, description: 'Token refreshed' })
       @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
       @ApiResponse({ status: 429, description: 'Too many requests' })
       async refresh(
         @Req() req: Request,
         @Res({ passthrough: true }) res: Response,
       ) {
         const refreshToken = (req as Request & { cookies?: Record<string, string | undefined> })
           .cookies?.[REFRESH_TOKEN_COOKIE_NAME_V2];
         if (!refreshToken) {
           throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
         }

         // validateAndRotate is atomic (Phase 1.2). Throws the generic
         // exception on ANY failure — caller never learns the reason class.
         const rotated = await this.sessionsServiceV2.validateAndRotate(refreshToken);

         // Mint new access token using the rotated session's canonical values.
         // If this throws (e.g., JwtModule misconfig), the rotation already
         // committed → orphan rotation. Client retries refresh.
         const accessToken = this.tokenServiceV2.mintAccessToken({
           userId: rotated.userId,
           sessionId: rotated.sessionId,
           tenantId: rotated.tenantId,
           tenantRole: rotated.tenantRole,
           isPlatformAdmin: rotated.isPlatformAdmin,
         });

         // Set new refresh cookie. httpOnly + secure-in-prod + sameSite=strict
         // mirrors v1's TokenService.buildRefreshCookie.
         setCookieFromConfig(res, {
           name: REFRESH_TOKEN_COOKIE_NAME_V2,
           value: rotated.refreshToken,
           options: {
             httpOnly: true,
             secure: this.isProduction,
             sameSite: 'strict',
             path: '/',
             maxAge: Math.floor(this.refreshMaxAgeMs / 1000),
           },
         });

         return {
           accessToken,
           user: {
             id: rotated.userId,
             tenantId: rotated.tenantId,
             tenantRole: rotated.tenantRole,
             isPlatformAdmin: rotated.isPlatformAdmin,
           },
         };
       }
     }
     ```
- **Implementation Notes**:
  - `@Throttle({ global: AUTH_RATE_LIMITS.refresh })` matches v1's `/auth/refresh` exactly (30 req/min).
  - Cookie shape is **inline** to avoid coupling AuthV2Controller to TokenService v1's `buildRefreshCookie` (which uses v1's cookie name). Phase 1.4+ may extract a v2-specific cookie builder if a second v2 endpoint arrives.
  - **NO `@UseGuards()`** on this endpoint. Refresh tokens ARE the authentication; access tokens may be expired. The "guard" is the opaque-refresh token itself.
  - **NO `setCookieFromConfig(res, clearCookie)` on failure**: per the no-failure-mode-enumeration discipline, we don't differentiate "you had a cookie but it's bad" from "you had no cookie" — both return the same 401 generic. If a future audit requires clearing the bad cookie, that's a Phase 1.4 follow-up.

### Step 5: Wire `JwtV2Strategy` + `AuthV2Controller` into `AuthModule`

- **File**: `nexacore-api/src/auth/auth.module.ts` (MOD: +2 imports + 1 provider + 1 controller).
- **Action**: Register the new strategy + controller. `exports[]` UNCHANGED.
- **Implementation Steps**:
  1. Add imports (alphabetically near existing strategy + controller imports):
     ```typescript
     import { AuthV2Controller } from './auth-v2.controller';
     import { JwtV2Strategy } from './strategies/jwt-v2.strategy';
     ```
  2. Add `AuthV2Controller` to `controllers[]` array (line 77-84). Suggested position: after `AuthController` to group v1+v2 auth-routing entries.
  3. Add `JwtV2Strategy` to `providers[]` array (line 85-108). Suggested position: right after `JwtStrategy` (line 95) — keeps strategies clustered.
  4. **Do NOT modify `exports[]`** — strategy + controller stay internal to AuthModule.

### Step 6: Export `SessionsServiceV2` from `SessionsModule`

- **File**: `nexacore-api/src/sessions/sessions.module.ts` (MOD: 1 line in `exports[]`).
- **Action**: Add `SessionsServiceV2` to exports so AuthModule (already imports SessionsModule via forwardRef) can inject it into `AuthV2Controller`.
- **Implementation Steps**:
  1. Change line 13 from `exports: [SessionsService],` to `exports: [SessionsService, SessionsServiceV2],`.
  2. Update the inline comment from line 12 to reflect that the strangler invariant is now NAMED-relaxed:
     ```
     // SessionsServiceV2 [SCRUM-493 — Phase 1.2 internal scaffolding]: now EXPORTED
     // as of SCRUM-494 — Phase 1.3 wired the first consumer (AuthV2Controller).
     ```
- **Implementation Notes**:
  - This is the NAMED transition out of the strangler-pattern invariant. Phase 1.2 deliberately kept `SessionsServiceV2` un-exported precisely so this moment would be a deliberate, reviewable change rather than a silent leak.

### Step 7: Write specs

#### Step 7a: `jwt-v2.strategy.spec.ts` (mock-free, ConfigService mock only)

- **File**: `nexacore-api/src/auth/tests/jwt-v2.strategy.spec.ts` (NEW, ~140 LOC).
- **Pattern**: mirror `src/auth/tests/jwt.strategy.spec.ts` idiom. Standalone `Test.createTestingModule` with `JwtV2Strategy` + mocked `ConfigService`.
- **Test coverage (~10 tests)**:
  - `describe('validate — happy path')` (1 test): valid full v2 payload → returns the same typed payload.
  - `describe('validate — rejection paths')` (7 tests, one per required field):
    - Missing `sub` (or wrong type) → `UnauthorizedException(AUTHENTICATION_FAILED)`.
    - Missing `jti` → same.
    - Missing `sessionId` → same.
    - Missing `iat` (or not a number) → same.
    - Missing `tenantId` → same.
    - Missing `tenantRole` → same.
    - Missing `isPlatformAdmin` (or not a boolean) → same.
  - `describe('forged-v1-shape')` (1 test): payload with v1's email + role + sub but missing tenantId → rejected.
  - `describe('message invariance')` (1 test): all rejection paths throw the bit-identical message `ErrorMessages.auth.AUTHENTICATION_FAILED`.
- **Implementation Notes**:
  - Strategy `validate` can be called directly on the instance (Passport doesn't need to be exercised for unit testing the shape gate; gate 1 crypto is JwtModule's responsibility, already tested in Phase 1.1).
  - No need for a real `JwtModule` here (unlike Phase 1.1's spec) — we test the gate-2 shape guard via the strategy's `validate` method directly.

#### Step 7b: `auth-v2.controller.spec.ts` (mocked services)

- **File**: `nexacore-api/src/auth/tests/auth-v2.controller.spec.ts` (NEW, ~280 LOC).
- **Pattern**: mirror SCRUM-491's `tenants.controller.spec.ts` idiom — mocked services with `jest.fn()` providers + real `Response` mock for cookie assertion.
- **Test coverage (~12 tests)**:
  - `describe('refresh — happy path')` (5 tests):
    - Valid cookie → returns `{ accessToken, user: { id, tenantId, tenantRole, isPlatformAdmin } }`.
    - Calls `sessionsServiceV2.validateAndRotate` with the cookie value.
    - Calls `tokenServiceV2.mintAccessToken` with the rotated session's canonical values.
    - Sets new cookie via `res.cookie(REFRESH_TOKEN_COOKIE_NAME_V2, rotated.refreshToken, { httpOnly, secure, sameSite: 'strict', path: '/', maxAge })`.
    - Cookie `secure` flag is `false` in non-production, `true` in production (mock ConfigService).
  - `describe('refresh — rejection paths')` (4 tests):
    - Missing cookie → 401 with generic message; `validateAndRotate` NEVER called.
    - `validateAndRotate` throws `UnauthorizedException` → re-thrown unchanged (pass-through; no enumeration leak).
    - `mintAccessToken` throws (synthetic config error) → re-thrown; rotation already committed (orphan documented).
    - `validateAndRotate` throws non-UnauthorizedException (synthetic infrastructure error) → propagates; controller does not catch.
  - `describe('cookie integrity')` (2 tests):
    - Cookie name is exactly `refresh_token_v2`.
    - `maxAge` matches `parseDurationMs('12h') / 1000`.
  - `describe('response shape contract')` (1 test): asserts the body matches the OpenAPI contract — body has exactly `accessToken: string` and `user: { id, tenantId, tenantRole, isPlatformAdmin }`, no other keys.

### Step 8: Build, lint, jest verification + DI bootstrap smoke

- **File**: N/A.
- **Action**: All-up verification before staging.
- **Implementation Steps**:
  1. `cd nexacore-api && npm run build` → exit 0. **Critical** — this catches DI typing errors (missing providers, wrong module imports). If this fails, the e2e tests will fail to bootstrap.
  2. `npx jest --testPathPatterns='jwt-v2|auth-v2|token.service.v2' --maxWorkers=1 --forceExit` → 18 (Phase 1.1 unchanged) + 10 + 12 = 40 tests pass.
  3. Full project: `npx jest --maxWorkers=1 --forceExit` → 1297 baseline + ~22 net new = ~1319 tests, 0 failures.
  4. Coverage: `npx jest --coverage --maxWorkers=1 --forceExit` → global statements + lines ≥ 91% maintained. Per-file: `jwt-v2.strategy.ts` ≥ 95%; `auth-v2.controller.ts` ≥ 95%; `jwt-payload-v2.guard.ts` ≥ 95% (effectively 100% — pure 1-fn file).
  5. ESLint: `npx eslint src/auth/strategies/jwt-v2.strategy.ts src/auth/auth-v2.controller.ts src/auth/utils/jwt-payload-v2.guard.ts src/auth/tests/jwt-v2.strategy.spec.ts src/auth/tests/auth-v2.controller.spec.ts --fix`. Then re-check all 5 files clean.
  6. **DI bootstrap smoke**: `nest start --dry-run` (if available) OR run one e2e suite header: `npx jest test/auth-e2e/auth-flows.e2e-spec.ts --testNamePattern='^should set up app'` — confirms `AppModule` bootstraps cleanly with the new strategy + controller registered.
  7. Grep invariant (Phase 1.3 RELAXATION acknowledged):
     - `grep -rn "SessionsServiceV2" src/`: now 4+ references (declaration + providers + spec + module.exports + the new controller). The previous "3-reference" invariant from Phase 1.2 is deliberately retired here.
     - `grep -rn "TokenServiceV2" src/`: now 3+ references (declaration + providers + spec + new controller).
     - **What we still want to confirm**: `git diff main -- src/auth/auth.controller.ts src/auth/auth.service.ts src/auth/token.service.ts src/auth/strategies/jwt.strategy.ts` returns empty (v1 paths untouched).

### Step 9: Update Technical Documentation

- **Action**: Per `documentation-standards.mdc`, deferred-by-design to `/update-docs` (same wave convention as SCRUM-487/488/489/491/492/493).
- **Not in this branch** (handled by `/update-docs` after merge):
  - `ai-specs/specs/integration-state.md`: header bump; Module Registry annotation on AuthModule (new strategy + controller; SessionsModule now exports SessionsServiceV2); Service Dependency Chains entry (`JwtV2Strategy → ConfigService`; `AuthV2Controller → TokenServiceV2, SessionsServiceV2, ConfigService`); Controller Guard Chains entry for `AuthV2Controller` (no guards, throttle only); Changelog row.
  - `ai-specs/changes/auth/programs/AUTH-v2.md`: §6 Phase 1.3 row marked complete; Phase 1 umbrella row marked complete (all 3 sub-phases done); Next milestone footer rewritten to point at Phase 2 (AuthIntent state machine).
  - `ai-specs/specs/api-spec.yml`: NEW path `/auth/v2/refresh` under tag `Auth v2`. POST, no Bearer (cookie-based), responses 200 / 401 / 429.
  - `ai-specs/specs/data-model.md`: UNCHANGED (no entity changes).

## 6. Implementation Order

1. Step 0: Create feature branch.
2. Step 1: Extract `isValidV2Payload` to standalone util + update TokenServiceV2.
3. Step 2: Implement `JwtV2Strategy`.
4. Step 3: Add `REFRESH_TOKEN_COOKIE_NAME_V2` constant.
5. Step 4: Implement `AuthV2Controller`.
6. Step 5: Wire strategy + controller into `AuthModule`.
7. Step 6: Export `SessionsServiceV2` from `SessionsModule`.
8. Step 7a: Write strategy spec.
9. Step 7b: Write controller spec.
10. Step 8: Build + lint + jest + DI bootstrap smoke + grep invariants.
11. Step 9: Documentation deferred to `/update-docs`.

Then: `/verify SCRUM-494` → `/commit SCRUM-494` → `/update-docs SCRUM-494`.

## 7. Testing Checklist

- [ ] `npm run build` exit 0 (Prisma client unchanged; DI compiles).
- [ ] `npx jest --testPathPatterns='jwt-v2|auth-v2|token.service.v2'` → 40 pass.
- [ ] Full project: `npx jest --maxWorkers=1 --forceExit` → ~1319 pass, 0 fail.
- [ ] Coverage: global ≥ 90.5% statements + lines; per-file ≥ 95% on the 3 new files.
- [ ] ESLint clean on all 5 new/touched files.
- [ ] `git diff main -- src/auth/auth.controller.ts src/auth/auth.service.ts src/auth/token.service.ts src/auth/strategies/jwt.strategy.ts` returns empty (v1 paths untouched).
- [ ] `AppModule` bootstraps cleanly (one-line e2e harness OR `nest start --dry-run`).
- [ ] No new `process.env` reads (config via `ConfigService` only).
- [ ] All `UnauthorizedException` instances in new code use `ErrorMessages.auth.AUTHENTICATION_FAILED`.
- [ ] Cookie `refresh_token_v2` is distinct from v1's `refresh_token` (no collision).

**Regression test checklist** (from §2):

| File from blast radius | Updated? | Why |
|---|---|---|
| `token.service.v2.spec.ts` | NO (no update needed) | Phase 1.1 spec tests `verifyAccessToken` end-to-end; private method extraction is internal refactor. Re-run as part of Step 8.2 to confirm green. |
| `test/auth-e2e/*.e2e-spec.ts` | NO | All v1 paths. Additive changes don't affect existing flows. Re-run by Layer 4 CI. |

## 8. Error Response Format

Standard HttpExceptionFilter JSON shape:

```json
{
  "statusCode": 401,
  "message": "Authentication failed",
  "error": "Unauthorized"
}
```

Status codes used by `/auth/v2/refresh`:
- `200` — success (with new cookie + body).
- `401` — any refresh failure (missing cookie / invalid token / expired / membership-stale / mint failure). **Same message for all** — no enumeration.
- `429` — rate limit exceeded.

## 9. Dependencies

- **No new dependencies**. All used (`@nestjs/common`, `@nestjs/config`, `@nestjs/passport`, `@nestjs/swagger`, `@nestjs/throttler`, `passport-jwt`, `express`) are already in `nexacore-api/package.json`.
- **Zero `package.json` edits**.

## 10. Notes

- **English only** in all code + comments + spec test names (per `base-standards.mdc`).
- **`workflow-standards.mdc §15` AUTH change-control APPLIES**. PR touches: `src/auth/strategies/**` (new strategy), `src/auth/*.controller.ts` (new controller), `src/auth/constants/**`, `src/auth/utils/**` (new guard util), `src/auth/token.service.v2.ts` (1-line MOD), `src/auth/auth.module.ts`, `src/sessions/sessions.module.ts`. **Single-domain AUTH per §15.3.3 → no split-PR required**. Mandatory §12 Rollback Playbook in record.
- **First v2 production endpoint** — security review attention warranted. Cookie posture, rate-limit, no-enumeration discipline, order-of-operations honesty all documented above.
- **Strangler-pattern transition**: `SessionsServiceV2` now exported, `TokenServiceV2` gains a consumer. Phase 1.2's 3-reference grep invariant is deliberately retired. v1 `TokenService` + `SessionsService` + `AuthController` + `JwtStrategy` remain bit-identical to main.

## 11. Next Steps After Implementation

- `/verify SCRUM-494`: confirm strangler relaxation is the only invariant change; v1 paths bit-identical; AppModule bootstraps clean.
- `/commit SCRUM-494`: expect **one-shot CI green** (post-SCRUM-490/1.2 coverage margin holds; +22 new tests on heavily-testable surface).
- `/update-docs SCRUM-494`: integration-state.md, AUTH-v2.md §6 (Phase 1 umbrella COMPLETE → Phase 2 unblocked), api-spec.yml NEW path.
- **Phase 2 unblocked**: AuthIntent state machine becomes the next named milestone.

## 12. Implementation Verification

- **Code Quality**: NEW files follow Phase 1.1 + 1.2 discipline (AUTH header, no-enumeration, ErrorMessages constant, deterministic config).
- **Functionality**: refresh endpoint exercises TokenServiceV2 + SessionsServiceV2 end-to-end. Strategy validates v2 shape on top of crypto.
- **Testing**: strategy spec (mock-free), controller spec (mocked services), guard util implicitly covered via TokenServiceV2 spec.
- **Regression**: zero v1 path modifications; e2e tests unchanged; Phase 1.1 spec stays green after guard extraction.
- **Integration**: AuthModule.providers[] +1, controllers[] +1; SessionsModule.exports[] +1; AppModule bootstrap clean.
- **Documentation**: deferred-by-design to `/update-docs`.

## 13. Open considerations for /develop time

1. **`parseDurationMs` import path**: confirmed at `src/auth/utils/parse-duration.ts` (from SCRUM-493 lookup). Verify at /develop time the import still resolves.
2. **`ConfigService.get('app.env')`** — confirm key exists in `auth.config.ts` or wherever the env discriminator lives. If absent, use a different discriminator (e.g., `NODE_ENV` via existing util) or add a config entry. Spot-check at /develop.
3. **`@nestjs/swagger` decorators** — confirm the project uses them (v1 controller has `@ApiOperation`, `@ApiResponse`). Already verified by reading auth.controller.ts.
4. **AppModule e2e bootstrap smoke**: if no `nest start --dry-run` mode, use the existing e2e harness header (it bootstraps AppModule on `beforeAll`); any test failure on bootstrap means a DI issue with the new strategy/controller.
5. **Audit emission on strategy success?** — Phase 1.2 emits `SESSION_V2_*` from inside `SessionsServiceV2`. Strategy could optionally emit `AUTH_TOKEN_V2_VALIDATED` on success — DEFER to Phase 2 (when there's a real-traffic consumer to observe).
