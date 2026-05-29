---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-492
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
status: draft
last_completed_ticket: SCRUM-491
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-492 Token Engine v2 Internal Scaffolding (AUTH v2 Phase 1.1)

## 1. Codebase State Snapshot

- **Date**: 2026-05-19
- **Last completed ticket**: SCRUM-491 (Tenant HTTP surface, merged `622baa4` on `main`)
- **Integration state verified**: Yes — `integration-state.md` last refreshed by SCRUM-491 `/update-docs` (2026-05-19 row). AuthModule structure unchanged since SCRUM-489.
- **Framework version**: 0.15.0.

### Files verified against live code

- `nexacore-api/src/auth/auth.module.ts` — confirms `JwtModule.registerAsync` with `useFactory` reading `auth.jwtSecret` + `auth.jwtAccessExpiration` from ConfigService. `signOptions` includes `issuer: JWT_ISSUER`, `audience: JWT_AUDIENCE`, `algorithm: 'HS256'`. `verifyOptions` mirrors. **JwtService is therefore preconfigured for both sign + verify** — any service injecting `JwtService` inherits these settings.
- `nexacore-api/src/auth/constants/auth.constants.ts` — confirms `JWT_ISSUER = 'nexacore-api'`, `JWT_AUDIENCE = 'nexacore-api'`.
- `nexacore-api/src/config/auth.config.ts` — confirms `authConfig` defaults: `jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m'`, `jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '12h'`.
- `nexacore-api/src/common/interfaces/jwt-payload.interface.ts` — confirms current v1 shape: `{sub, email, role, jti, sessionId?, iat?}`. v2 will be in a separate file, NOT in `common/interfaces/`.
- `nexacore-api/src/auth/token.service.ts` — confirms v1 `TokenService` constructor `(jwtService, sessionsService, usersService, tokenDenyListService, auditService)` and the mint pattern at lines 110-121 (`this.jwtService.sign(payload, { expiresIn: this.accessExpiration as StringValue })`). v1 stays untouched per program doc strangler pattern.
- `nexacore-api/src/auth/strategies/jwt.strategy.ts` — confirms `validate(payload: JwtPayload)` returns `SafeUser`. Phase 1.1 does NOT modify this; Phase 1.3 will add a parallel `JwtV2Strategy`.
- `nexacore-api/src/auth/tests/` — confirms the existing test directory convention (`token.service.spec.ts` exists transitively via `auth-token.spec.ts`; new spec lives at `src/auth/tests/token.service.v2.spec.ts`).
- `@prisma/client` exports `TenantRole` enum (verified via SCRUM-487/491 imports across the codebase). Phase 1.1 imports `TenantRole` directly from there — consistent with SCRUM-487/491.

### Constructor signatures verified

- `TokenService(jwtService, sessionsService, usersService, tokenDenyListService, auditService, configService?, loginSecurityService)` — 5–7 deps (deep). **NOT modified** in this ticket.
- `JwtStrategy(usersService, tokenDenyListService, configService)` — 3 deps. **NOT modified**.
- NEW `TokenServiceV2(jwt: JwtService)` — 1 dep. The full surface area.

### Methods verified to exist

- `JwtService.sign(payload, options?)` — built into `@nestjs/jwt`. `signOptions` set at module-registration are the default; `options.expiresIn` overrides per-call.
- `JwtService.verify<T>(token, options?)` — built in. `verifyOptions` from module-registration apply; throws `TokenExpiredError` / `JsonWebTokenError` (subclasses of `Error`) on failure.

### Guard dependency chain verified

This ticket introduces NO new `@UseGuards()` declarations. `JwtV2Strategy` is explicitly out of scope (Phase 1.3). No guard chain changes.

### Discrepancies with integration-state.md

None. integration-state.md was just refreshed at SCRUM-491 `/update-docs`. AuthModule providers row will gain one entry (`TokenServiceV2`) at this ticket's `/update-docs`.

### Plan-time decisions (locked from /enrich-us open questions)

The enrichment surfaced 7 open questions. All 7 are resolved here:

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Issuer/audience constants reuse vs v2-specific | **REUSE** existing `JWT_ISSUER` + `JWT_AUDIENCE` | JwtModule already enforces them on both sign + verify via `signOptions` + `verifyOptions`. TokenServiceV2 inheriting from the same JwtService gets correctness for free. v2-specific audience (e.g. `nexacore-api-v2`) is a Phase 1.3 concern when JwtV2Strategy needs to distinguish v1 from v2 tokens. For Phase 1.1, payload shape distinguishes (v1 has `email` + `role`; v2 has `tenantId` + `tenantRole` + `isPlatformAdmin`). |
| Q2 | TTL source | **`auth.jwtAccessExpiration`** (existing v1 setting, default `15m`) | Already wired into `JwtModule.signOptions.expiresIn`. TokenServiceV2.mintAccessToken does NOT explicitly set expiresIn — inherits from JwtModule. This means v1 and v2 access tokens have identical TTL. Per-tenant `authPolicy` override deferred to later sub-phase. |
| Q3 | Shape validation in verify | **Raw `if` checks** on required keys | 5 lines. `class-validator` would force an `@Injectable` class shape on what is currently a pure interface — heavier than the value at this scope. The verify body does: parse via JwtService.verify (catches signature + expiry + issuer/audience) → check required keys present → throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` on shape mismatch. |
| Q4 | TenantRole import location | **`@prisma/client` directly** | Consistent with SCRUM-487/488/491 (all import TenantRole from @prisma/client). No new file. |
| Q5 | AuthModule imports for JwtService | **Already in place** | JwtModule.registerAsync at `auth.module.ts:55` provides JwtService to all consumers. No new imports. |
| Q6 | Cross-version verification interop (v1+v2 verify in one strategy) | **Out of scope — Phase 1.3** | Phase 1.1 ships TokenServiceV2 only. The decision about whether JwtV2Strategy verifies v1 tokens (for migration window) lives in Phase 1.3. Both versions share JWT_SECRET + issuer + audience, so the standard `jwtService.verify` succeeds against both signatures; the differentiator is payload shape (v2 has `tenantId`). A future ticket can decide whether to dual-verify or strict-v2-only. |
| Q7 | Telemetry hook for v2 mint count | **Out of scope** | Phase 1.1 has zero v2 mint consumers in production. Telemetry lands with the first v2 endpoint (Phase 2). |

### CI Gate Anticipation (per workflow-standards §22 / SCRUM-485)

| CI gate                                       | Expected behavior |
|-----------------------------------------------|-------------------|
| Job 1: `py_compile (all tools)`               | PASS / unchanged |
| Job 2: `Schema validate (changed artifacts)`  | PASS — plan/verify/record artifacts under `changes/auth/{plans,records}/Sprint 15/` — routed by existing SCHEMA_BY_PATH rules from SCRUM-489 |
| Job 2: `Groundedness (warn-only)`             | PASS / unchanged |
| Job 2: `Audit: coupling check (warn-only)`    | PASS / unchanged |
| Job 2: `Audit: completion check (warn-only)`  | SKIP (no new audit folder) |
| Job 3: `Schema validate (historical)`         | SKIP |
| Job 4: `Smoke test: state-machine.py`         | PASS / unchanged |
| Job 5: `pytest (linchpin tests)`              | PASS / unchanged |
| em-ecosystem CI Layer 4 (Backend Tests)       | **target PASS** — ≥10 new tests on a heavily-testable unit (pure mint/verify roundtrip + 4 error paths + cross-instance). Coverage net-positive. |

**SKIP_PATHS / SCHEMA_BY_PATH expectations**: no new `.md`/`.yml` files outside `ai-specs/changes/auth/{plans,records}/Sprint 15/SCRUM-492_*`. Existing routing covers.

## 2. Regression Impact Analysis

### Blast radius

**Direct dependents of modified files**: 1 file MOD (`auth.module.ts` — adds 1 provider line). Zero existing classes change constructor signatures.

**Production consumers of new code**: zero. `TokenServiceV2` is registered in `AuthModule.providers[]` but NOT in `exports[]` and NOT injected by any controller or service — strangler pattern internal scaffolding only.

**Test dependents**: zero existing spec file requires updates. The new `token.service.v2.spec.ts` is the only test surface that touches TokenServiceV2.

### Breaking changes identified

**None.** All changes are additive:

| Change | Why not breaking |
|--------|------------------|
| `JwtPayloadV2` interface (NEW file) | New interface, zero consumers |
| `TokenServiceV2` class (NEW file) | New class, registered as provider but NOT exported externally |
| `AuthModule.providers[]` +1 entry | Additive — no removal, no rename |
| Reuse of existing `JwtService` config | Module-level `signOptions` + `verifyOptions` are unchanged |

### API contract impact

ZERO. No HTTP routes added/modified/removed. `api-spec.yml` requires NO update.

### Schema migration impact

ZERO. No Prisma schema changes. No migrations.

### Test files requiring updates

**None.** All test impact lives in the NEW `token.service.v2.spec.ts`. Existing `token.service.spec.ts` (v1) untouched.

### Blast radius size

**4 files staged**: 3 NEW (interface, service, spec) + 1 MOD (auth.module.ts). **Well below the 5-file extra-review threshold.** Smallest ticket of the AUTH v2 program to date.

## 3. Overview

Phase 1.1 of the AUTH v2 + Tenancy v1 program. Per program doc §4 Phase 1, this ticket installs the **smallest meaningful internal v2 unit** following a strict strangler pattern: `JwtPayloadV2` interface (new shape with `tenantId`, `tenantRole`, `isPlatformAdmin`; removes `email` + `role`) + `TokenServiceV2` class with `mintAccessToken` + `verifyAccessToken`. **Zero HTTP routes. Zero controller wiring. Zero session/refresh changes. Zero migration.** v2 exists in memory and unit tests only; no production code path mints or verifies v2 tokens. This is the foundational unit that Phase 1.2 (opaque refresh + `SessionsServiceV2`) and Phase 1.3 (`JwtV2Strategy` + first verify consumer) build on.

Architecture principles applied:

- **Strangler pattern**: v1 untouched and in production; v2 ships in parallel without consumers; future tickets gradually migrate.
- **Reuse JwtModule's pre-wired config**: TokenServiceV2 injects only `JwtService` and inherits secret + signing algorithm + issuer + audience from the existing module-level registration. Zero config duplication.
- **Verify-side shape validation**: signature/expiry/issuer/audience all enforced by `JwtService.verify`. On top, TokenServiceV2.verifyAccessToken does an explicit shape check (required keys present) to defend against a forged v1-shape payload signed with the same secret.
- **No information leak**: shape-validation failures throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` — same message used by v1 paths. Caller cannot distinguish "wrong token" from "wrong shape".

## 4. Architecture Context

### Modules involved

- **AuthModule** (existing) — gains 1 provider (`TokenServiceV2`). No new imports (`JwtService` is already there via `JwtModule.registerAsync`). No new exports.
- **No other modules touched.**

### Components affected

| Layer | File | Disposition |
|-------|------|-------------|
| Interface | `src/auth/interfaces/jwt-payload-v2.interface.ts` (NEW) | `JwtPayloadV2` shape |
| Service | `src/auth/token.service.v2.ts` (NEW) | `TokenServiceV2` class with 2 methods |
| Module | `src/auth/auth.module.ts` (MOD) | +1 provider line |
| Tests | `src/auth/tests/token.service.v2.spec.ts` (NEW) | 10+ test cases |

## 5. Architecture Context — Detailed Patterns

### 5.1 JwtPayloadV2 interface

```typescript
// src/auth/interfaces/jwt-payload-v2.interface.ts (sketch — final code at /develop)
import { TenantRole } from '@prisma/client';

/**
 * v2 JWT payload — multi-tenant aware.
 *
 * SCRUM-492 / AUTH v2 + Tenancy v1 — Phase 1.1.
 * See ai-specs/changes/auth/programs/AUTH-v2.md §2.3.
 *
 * Differences from v1 (JwtPayload):
 *   - REMOVED: email, role
 *   - ADDED:   tenantId, tenantRole, isPlatformAdmin
 *   - Required: sessionId, iat (no longer optional)
 *
 * Internal scaffolding only — no production consumers yet.
 */
export interface JwtPayloadV2 {
  /** User id — global identity, stable across tenant context. */
  sub: string;
  /** Unique token identifier (revocation key). */
  jti: string;
  /** Session id — per-session revocation. */
  sessionId: string;
  /** Issued-at unix seconds (JWT standard). */
  iat: number;
  /** Active tenant for this token. */
  tenantId: string;
  /** Caller's role within the active tenant. */
  tenantRole: TenantRole;
  /** Cross-tenant capability flag (mirror of User.isPlatformAdmin, SCRUM-489). */
  isPlatformAdmin: boolean;
}
```

### 5.2 TokenServiceV2 class

```typescript
// src/auth/token.service.v2.ts (sketch — final code at /develop)
import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantRole } from '@prisma/client';
import { ErrorMessages } from '../common/constants/error-messages';
import { JwtPayloadV2 } from './interfaces/jwt-payload-v2.interface';

export interface MintAccessTokenInput {
  userId: string;
  sessionId: string;
  tenantId: string;
  tenantRole: TenantRole;
  isPlatformAdmin: boolean;
}

@Injectable()
export class TokenServiceV2 {
  constructor(private readonly jwt: JwtService) {}

  mintAccessToken(input: MintAccessTokenInput): string {
    const payload = {
      sub: input.userId,
      jti: randomUUID(),
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      tenantRole: input.tenantRole,
      isPlatformAdmin: input.isPlatformAdmin,
    };
    // expiresIn, issuer, audience, algorithm all inherited from JwtModule signOptions.
    // iat is auto-populated by jwtService.sign.
    return this.jwt.sign(payload);
  }

  verifyAccessToken(token: string): JwtPayloadV2 {
    let decoded: unknown;
    try {
      decoded = this.jwt.verify(token);
      // verifyOptions (issuer, audience, algorithms) inherited from JwtModule.
    } catch {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    if (!this.isValidV2Payload(decoded)) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    return decoded;
  }

  private isValidV2Payload(p: unknown): p is JwtPayloadV2 {
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
}
```

**Notes**:
- `mintAccessToken` does NOT explicitly pass `expiresIn` — inherits from `JwtModule.signOptions.expiresIn` (= `auth.jwtAccessExpiration` config, default 15m).
- `verifyAccessToken` does NOT explicitly pass issuer/audience/algorithms options — inherits from `JwtModule.verifyOptions`.
- `isPlatformAdmin` is a boolean. The shape check verifies the type but accepts both `true` and `false`. A forged v1 payload (with `email` + `role` but no `tenantId`) would fail at `typeof o.tenantId === 'string'`.
- All thrown exceptions use the existing `ErrorMessages.auth.AUTHENTICATION_FAILED` constant — no new ErrorMessages entries needed.

### 5.3 AuthModule provider registration

```typescript
// src/auth/auth.module.ts (single-line MOD inside providers[])
@Module({
  imports: [ ...existing... ],
  controllers: [ ...existing... ],
  providers: [
    AuthService,
    TokenService,
    TokenServiceV2, // NEW — SCRUM-492 / Phase 1.1
    LoginService,
    // ... rest unchanged ...
  ],
  exports: [
    AuthService,
    TokenService,
    // TokenServiceV2 NOT exported — internal scaffolding only
    // ... rest unchanged ...
  ],
})
export class AuthModule {}
```

### 5.4 Test plan in detail

Suite organized in `src/auth/tests/token.service.v2.spec.ts`, using `Test.createTestingModule` with a real `JwtModule.register` (NOT the async version) for the spec — pinning a deterministic secret + TTL:

```typescript
// spec setup sketch
const module = await Test.createTestingModule({
  imports: [
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '15m', issuer: 'nexacore-api', audience: 'nexacore-api', algorithm: 'HS256' },
      verifyOptions: { issuer: 'nexacore-api', audience: 'nexacore-api', algorithms: ['HS256'] },
    }),
  ],
  providers: [TokenServiceV2],
}).compile();
service = module.get(TokenServiceV2);
```

**10 test cases**:

1. **Roundtrip happy**: `mintAccessToken({...})` → `verifyAccessToken(token)` returns a payload with all input fields preserved.
2. **Payload shape**: returned `JwtPayloadV2` has the 7 declared keys + no `email` / no `role` (legacy fields absent — assert via `Object.keys()` check).
3. **`jti` uniqueness**: two consecutive mints with identical input → different `jti`.
4. **`iat` correctness**: `payload.iat` within ±2 seconds of `Math.floor(Date.now() / 1000)`.
5. **Wrong signature rejected**: token signed with a different secret via a separate JwtService instance → verify throws `UnauthorizedException(AUTHENTICATION_FAILED)`.
6. **Expired token rejected**: mint with `JwtModule.register({ signOptions: { expiresIn: '-1s' } })` in a sibling test module → verify throws `UnauthorizedException`.
7. **Malformed payload — missing `tenantId`**: forge a v1-shape payload via `jwt.sign({sub, email, role, jti, sessionId, iat}, 'test-secret', {issuer, audience, algorithm})` → TokenServiceV2.verifyAccessToken throws `UnauthorizedException` (signature valid, shape invalid).
8. **Malformed payload — missing `isPlatformAdmin`**: forge `{sub, jti, sessionId, iat, tenantId, tenantRole}` — verify throws.
9. **Wrong issuer rejected**: mint with `issuer: 'different-issuer'` in a sibling module → verify throws.
10. **TenantRole enum values round-trip**: parameterized test across `[OWNER, ADMIN, MEMBER, VIEWER, CUSTOM]` — each value mints + verifies correctly.

Plus optional:
- **`isPlatformAdmin: true` and `false` both round-trip** (2 sub-cases, can be merged into roundtrip or split out).
- **Cross-instance verify**: a separate TokenServiceV2 instance (different `Test.createTestingModule` with the same secret config) verifies a token minted by the first instance. Proves TokenServiceV2 is stateless.

Net new tests: **10 minimum**, ~12 with the optional cases.

## 6. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-492-auth-backend`.
- **Branch Naming**: MANDATORY `feature/SCRUM-492-auth-backend`.
- **Implementation Steps**:
  1. `git checkout main && git pull origin main` — verify HEAD is `622baa4` or later (SCRUM-491 merged).
  2. `git checkout -b feature/SCRUM-492-auth-backend`.
  3. `git branch` — confirm.
- **Notes**: AUTH-deep ticket per §15. Single-domain — no split-PR.

### Step 1: Create `JwtPayloadV2` interface

- **File**: `nexacore-api/src/auth/interfaces/jwt-payload-v2.interface.ts` (NEW).
- **Action**: Export the v2 payload interface as in §5.1.
- **Implementation Steps**:
  1. Create the file with `TenantRole` import from `@prisma/client`.
  2. Define the interface with all 7 fields (no optionals).
  3. Add file-level JSDoc citing SCRUM-492, the program doc §2.3, and the differences-from-v1 summary.
- **Implementation Notes**: NO dependency on `Role` enum. NO `email` field. NO optional `iat` / `sessionId` — both required in v2.

### Step 2: Create `TokenServiceV2` class

- **File**: `nexacore-api/src/auth/token.service.v2.ts` (NEW).
- **Action**: Implement the class as in §5.2.
- **Function Signatures**:
  ```typescript
  mintAccessToken(input: MintAccessTokenInput): string
  verifyAccessToken(token: string): JwtPayloadV2
  ```
- **Dependencies**: `@nestjs/common` (Injectable, UnauthorizedException), `@nestjs/jwt` (JwtService), `crypto` (randomUUID), `@prisma/client` (TenantRole, via `MintAccessTokenInput`), `../common/constants/error-messages` (ErrorMessages), `./interfaces/jwt-payload-v2.interface` (JwtPayloadV2).
- **Implementation Notes**:
  - Export both the class AND the `MintAccessTokenInput` interface (the interface needs to be importable by future consumers — Phase 1.2+).
  - `mintAccessToken` does NOT pass options to `jwt.sign` — inherits everything from JwtModule. Single-arg call.
  - `verifyAccessToken` wraps `jwt.verify` in try/catch and re-throws as `UnauthorizedException`. The `try` block catches `TokenExpiredError`, `JsonWebTokenError`, and `NotBeforeError` (all subclasses of `JsonWebTokenError` per `jsonwebtoken` package).
  - `isValidV2Payload` is a private type-guard method. Uses `Object` typing not `any`.

### Step 3: Register `TokenServiceV2` in AuthModule

- **File**: `nexacore-api/src/auth/auth.module.ts` (MOD).
- **Action**: Add 1 import + 1 provider entry per §5.3.
- **Implementation Steps**:
  1. Add import `import { TokenServiceV2 } from './token.service.v2';` near the existing `import { TokenService } from './token.service';`.
  2. Add `TokenServiceV2,` to the `providers[]` array, immediately after the existing `TokenService,` entry.
  3. Do NOT add to `exports[]` — internal scaffolding only.
- **Implementation Notes**: Two lines of change total. Verify the surrounding `// WARNING: AUTH DOMAIN` comment stays as the top-of-file marker.

### Step 4: Write tests

- **File**: `nexacore-api/src/auth/tests/token.service.v2.spec.ts` (NEW).
- **Action**: Implement the 10–12 tests detailed in §5.4.
- **Test infrastructure**:
  - Use `Test.createTestingModule` with `JwtModule.register({...})` (NOT registerAsync) — pinning a deterministic test secret + TTL.
  - For expired-token + wrong-issuer tests: build a SECOND `TestingModule` with overridden config in that test's scope; mint a token there, verify with the primary TokenServiceV2.
  - Forge v1-shape payload via `jsonwebtoken.sign(...)` directly when needed (already a transitive dep via `@nestjs/jwt`).
- **Implementation Notes**:
  - Mock-free. The whole spec exercises real JwtService + real TokenServiceV2 — pure crypto, no DB.
  - Coverage target: 100% lines of token.service.v2.ts (the class is small enough).

### Step 5: Build + jest + lint

- **Action**: Final quality gates.
- **Implementation Steps**:
  1. `npm run build` — exit 0.
  2. `npx jest --maxWorkers=1 --forceExit` — full project ≥ 1223 baseline + 10 new tests, 0 failures.
  3. `npx eslint 'src/auth/interfaces/jwt-payload-v2.interface.ts' 'src/auth/token.service.v2.ts' 'src/auth/tests/token.service.v2.spec.ts' 'src/auth/auth.module.ts'` — clean.
  4. `nest start --debug` quick smoke (Ctrl+C after `Application successfully started`) — DI resolution must not fail.

### Step N+1: Update Technical Documentation

- **Action**: DEFERRED-BY-DESIGN to `/update-docs`.
- **Files at `/update-docs`**:
  - `ai-specs/specs/integration-state.md`:
    - Module Registry: AuthModule providers gain `TokenServiceV2` (NOT exported).
    - Service Dependency Chains: `TokenServiceV2 → JwtService` (single dep).
    - 2026-05-19 changelog row for SCRUM-492.
  - `ai-specs/specs/data-model.md`: **no change** (no schema modifications).
  - `ai-specs/specs/api-spec.yml`: **no change** (no HTTP endpoints).
  - `ai-specs/changes/auth/programs/AUTH-v2.md` §6: Phase 1.1 row → `complete` with PR + merge SHA. Phase 1.2 (next sub-fase) called out.

## 7. Implementation Order

1. Step 0 — Branch from main.
2. Step 1 — `JwtPayloadV2` interface.
3. Step 2 — `TokenServiceV2` class.
4. Step 3 — Register in `AuthModule.providers[]`.
5. Step 4 — Test spec.
6. Step 5 — Build + jest + lint + nest start smoke.

(Step N+1 documentation at `/update-docs`.)

## 8. Testing Checklist

Post-implementation:

- [ ] `nest build` exit 0.
- [ ] `npx jest --maxWorkers=1 --forceExit` — ≥ 1223 baseline + 10 new tests; 0 failures.
- [ ] ESLint clean on the 4 touched files.
- [ ] `nest start` does not crash (DI resolution OK).
- [ ] `Object.keys(verifyAccessToken(token))` returns exactly 7 keys — no leakage of v1 fields.
- [ ] All 5 `TenantRole` enum values round-trip cleanly.
- [ ] Forged v1-shape payload (correct signature, wrong shape) is rejected — proves shape validation is the second gate after cryptographic verify.

### Regression test checklist

- [ ] **No existing test files modified.** Full jest run confirms the 1223 baseline still passes.
- [ ] AuthModule still boots — verified by any existing AuthController/Service spec that compiles a NestJS testing module.

## 9. Error Response Format

All `TokenServiceV2.verifyAccessToken` failures throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`. The existing `HttpExceptionFilter` (`src/common/filters/http-exception.filter.ts`) maps that to:

```json
{
  "success": false,
  "error": {
    "message": "Authentication failed",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

NO new `ErrorMessages` entries. NO new HTTP status codes introduced. Failure modes (signature invalid, expired, wrong issuer/audience, malformed payload shape) all map to the same envelope — deliberate, prevents enumeration.

## 10. Partial Update Support

N/A — no DTOs introduced.

## 11. Dependencies

ZERO new dependencies. All already in `package.json`:

- `@nestjs/common` (Injectable, UnauthorizedException)
- `@nestjs/jwt` (JwtService, JwtModule)
- `@nestjs/testing` (Test.createTestingModule)
- `@prisma/client` (TenantRole — generated types)
- Node built-in `crypto` (randomUUID)
- `jsonwebtoken` (transitive — used directly in tests for forging payloads)

## 12. Notes

### Business rules

- **Internal scaffolding only.** This ticket creates code that exists in memory + unit tests. ZERO production code path mints or verifies v2 tokens after this PR merges. v1 remains untouched and in production.
- **TTL is intentionally identical to v1** in this phase. Per-tenant TTL override via `TenantSettings.authPolicy` is a later sub-phase — Phase 1.x or Phase 2.
- **No new ErrorMessages entries.** All verify failures reuse `ErrorMessages.auth.AUTHENTICATION_FAILED`. Failure-mode enumeration prevention is intentional.
- **No issuer/audience versioning** in Phase 1.1. v2 tokens have the same `iss` + `aud` claims as v1. Payload shape distinguishes the two. The decision to add a v2-specific audience (e.g., `nexacore-api-v2`) is deferred to Phase 1.3 when JwtV2Strategy may need fast discrimination.
- **No JwtV2Strategy in this ticket.** Phase 1.3 introduces the Passport strategy that consumes TokenServiceV2.verifyAccessToken. Phase 1.1 is service-only.

### Workflow / security constraints

- **NOT-§15 review path REQUIRED**: touches `src/auth/interfaces/` + `src/auth/token.service.v2.ts` + `src/auth/auth.module.ts`. All AUTH domain per §15.1. Single-domain — **no split-PR** per §15.3.3. CODEOWNERS auto-requests AUTH reviewers.
- **NEVER `--no-verify`**: Husky pre-commit enforces Prettier — auto-fix at /develop Step 5 if it fires.
- **Token plaintext NEVER logged.** TokenServiceV2.mintAccessToken returns the token to its caller; that caller is responsible for transit security. The service itself produces zero log lines containing the token.

### Language

English only.

## 13. Next Steps After Implementation

1. Run `/verify SCRUM-492` immediately after Step 5. Quick run; small surface.
2. After PASS → `/commit SCRUM-492`. Expected one-shot CI green — coverage delta is comfortably net-positive given the small new surface + 10 dense tests.
3. After merge → `/update-docs SCRUM-492`:
   - integration-state.md: TokenServiceV2 provider note + 1 new dep chain edge + changelog row.
   - AUTH-v2.md §6: Phase 1.1 → complete.
4. **Phase 1.2** (next sub-fase) is the natural follow-up: opaque refresh tokens (D-003) + `SessionsServiceV2`. Operator decides when to create the Jira ticket; the draft for Phase 1.1 (`/tmp/scrum-phase-1-1-draft.md`) is the template pattern for the 1.2 draft.

## 14. Implementation Verification

### Code Quality
- [ ] File-level JSDoc on `jwt-payload-v2.interface.ts` and `token.service.v2.ts` cites SCRUM-492 + program doc §2.3.
- [ ] Zero `any` types in production code.
- [ ] Zero new `process.env` reads outside ConfigService (TokenServiceV2 does not read env; relies on JwtModule wiring).
- [ ] Zero new hardcoded error strings outside `ErrorMessages`.
- [ ] `isValidV2Payload` is a private method with `unknown` input + type guard return (not `any`).

### Functionality
- [ ] `mintAccessToken` returns a JWT signed with `JWT_SECRET`, issuer `nexacore-api`, audience `nexacore-api`, algorithm `HS256`.
- [ ] `verifyAccessToken` rejects: wrong signature, expired, wrong issuer, wrong audience, malformed payload.
- [ ] `verifyAccessToken` accepts a freshly-minted token from `mintAccessToken` and returns a JwtPayloadV2 with exactly the 7 declared keys.
- [ ] Two consecutive mints produce distinct `jti` values.

### Testing
- [ ] All 10+ tests pass.
- [ ] Full jest suite green (1223 + 10 = 1233+ tests).
- [ ] Coverage on `token.service.v2.ts` ≥ 95% lines + 95% branches.

### Regression
- [ ] Zero existing tests modified; all pre-existing 1223 tests still pass.
- [ ] `nest build` clean.
- [ ] `nest start` smoke OK.

### Integration
- [ ] AuthModule providers list now contains TokenServiceV2 between TokenService and LoginService.
- [ ] AuthModule.exports[] does NOT contain TokenServiceV2 (internal scaffolding).
- [ ] Zero other modules import TokenServiceV2 (verified via grep).

### Documentation updates
- [ ] Deferred-by-design to `/update-docs` (Step N+1).

### NOT-§15 review path
- [ ] PR title includes `[SCRUM-492]`.
- [ ] PR description cites §15 review path + lists `src/auth/**` files touched.
- [ ] CODEOWNERS auto-requests AUTH reviewers.

---

## Module-Level Planning

**N/A** — this ticket does NOT create a new NexaCore module. It adds a NEW service inside the existing `AuthModule` and a NEW interface inside `src/auth/interfaces/`. No entity additions, no permission seeding, no PlatformModule registration.

## Satellite App Planning

**N/A** — backend NexaCore-internal scaffolding. No satellite app involved.
