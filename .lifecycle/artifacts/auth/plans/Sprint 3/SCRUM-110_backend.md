# Backend Implementation Plan: SCRUM-110 Passkeys / WebAuthn Support

## Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-109 (Suspicious Login Detection + Alerting) — commit `94013b3` on `feature/SCRUM-109-backend`
- **Integration state verified**: Yes
- **Sprint**: Sprint 3 — Auth Enterprise (id=37)
- **Files verified against live code**:
  - `src/auth/auth.module.ts` (62 lines) — Controllers: [AuthController, MfaController], 9 providers, 3 exports
  - `src/auth/auth.service.ts` (1173 lines) — 11 constructor deps, `generateTokensForMfa()` at lines 612-638 (includes impossible travel + suspicious login + new device checks)
  - `src/auth/mfa.controller.ts` (178 lines) — guard/throttle pattern reference
  - `src/auth/mfa.service.ts` (287 lines) — 5 constructor deps, JWT-based challenge pattern
  - `src/security/security.module.ts` (20 lines) — APP_GUARD: CsrfGuard, exports: SuspiciousLoginService
  - `src/auth/constants/auth.constants.ts` (101 lines) — AUTH_RATE_LIMITS.mfa: 5/60s, login: 10/60s
  - `src/auth/stores/oauth-state.store.ts` — Redis challenge pattern: `set(key, JSON.stringify, 'EX', 300)` + `getdel(key)`
  - `prisma/schema.prisma` — User model (25 fields), AuditAction enum (32 values), NO WebAuthnCredential
  - `src/audit/enums/audit-action.enum.ts` — 32 TS enum values, last: NEW_COUNTRY_LOGIN
  - `tsconfig.json` — `module: "nodenext"`, `resolvePackageJsonExports: true` (compatible with @simplewebauthn ESM)
  - `package.json` — NO @simplewebauthn installed
- **Constructor signatures verified**:
  - `AuthService(usersService, sessionsService, jwtService, oauthCodeStore, auditService, passwordBreachService, prisma, mailService, trustedDeviceService, impossibleTravelService, suspiciousLoginService)` — 11 params
  - `MfaService(usersService, cryptoService, jwtService, auditService, trustedDeviceService)` — 5 params
- **Guard dependency chain verified**: PasskeyController uses only `JwtAuthGuard` (no deps, extends AuthGuard('jwt')). AuditModule already imported by AuthModule. No RolesGuard or PermissionsGuard needed.

## Overview

Implement WebAuthn/FIDO2 passkey support as an alternative authentication method. Users can register passkey credentials (biometrics, hardware keys, platform authenticators) and authenticate without passwords or TOTP. The implementation adds a `PasskeyService` + `PasskeyController` within the existing `AuthModule`, a new `WebAuthnCredential` Prisma model, Redis-backed challenge storage, and 7 REST endpoints.

## Architecture Context

- **Module**: AuthModule (existing — add PasskeyController + PasskeyService, no new imports needed)
- **New components**: PasskeyController (7 endpoints), PasskeyService (7 methods), 5 DTOs, 1 constants file
- **Modified components**: prisma/schema.prisma, audit-action.enum.ts, auth.module.ts, package.json, .env.example
- **Key pattern reuse**: `AuthService.generateTokensForMfa()` handles token+session+security checks for passkey login (same as MFA verify)
- **Challenge storage**: Redis with `getdel` (single-use), following OAuth store pattern
- **Library**: `@simplewebauthn/server` v13.x + `@simplewebauthn/types` v13.x

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-110-backend` from latest code
- **Steps**:
  1. `git checkout feature/SCRUM-109-backend && git pull`
  2. `git checkout -b feature/SCRUM-110-backend`

### Step 1: Install npm Dependencies

- **File**: `nexacore-api/package.json`
- **Action**: Install `@simplewebauthn/server@^13.2.0` and `@simplewebauthn/types@^13.2.0`
- **Steps**:
  1. `cd nexacore-api && npm install @simplewebauthn/server@^13.2.0 @simplewebauthn/types@^13.2.0`
  2. Verify both in `dependencies` section
- **Notes**: v13 uses ESM exports; project's `nodenext` module resolution + `resolvePackageJsonExports: true` handles this.

### Step 2: Prisma Schema + AuditAction Enum

- **Files**: `prisma/schema.prisma`, `src/audit/enums/audit-action.enum.ts`
- **Action**: Add WebAuthnCredential model, User relation, 4 AuditAction values

#### 2.1: WebAuthnCredential model (after TrustedDevice model)

```prisma
model WebAuthnCredential {
  id           String    @id @default(uuid())
  userId       String
  credentialId String    @unique
  publicKey    Bytes
  signCount    Int       @default(0)
  transports   String[]  @default([])
  backedUp     Boolean   @default(false)
  deviceType   String    @default("singleDevice")
  name         String?
  lastUsedAt   DateTime?
  createdAt    DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("webauthn_credentials")
}
```

#### 2.2: User model — add relation

```prisma
webAuthnCredentials  WebAuthnCredential[]
```

#### 2.3: AuditAction enum — add 4 values (both Prisma + TypeScript)

```
PASSKEY_REGISTERED
PASSKEY_DELETED
PASSKEY_AUTH_SUCCESS
PASSKEY_AUTH_FAILURE
```

#### 2.4: Generate Prisma client

```bash
npx prisma generate
```

- **Notes**: `publicKey` uses `Bytes` → PostgreSQL `bytea`. Store as `Buffer.from(registrationInfo.credential.publicKey)`. `credentialId` stored as base64url string (native @simplewebauthn v13 format).

### Step 3: Create Passkey Constants

- **File**: `src/auth/constants/passkey.constants.ts` (NEW)
- **Action**: Define Redis key prefixes, TTL, max credentials, name limits
- **Constants**:
  - `WEBAUTHN_REG_KEY_PREFIX = 'webauthn:reg:'` (key: `webauthn:reg:{userId}`)
  - `WEBAUTHN_AUTH_KEY_PREFIX = 'webauthn:auth:'` (key: `webauthn:auth:{challengeId}`)
  - `WEBAUTHN_CHALLENGE_TTL_SECONDS = 300`
  - `MAX_PASSKEYS_PER_USER = 10`
  - `PASSKEY_NAME_MAX_LENGTH = 64`
  - `DEFAULT_PASSKEY_NAME = 'Passkey'`

### Step 4: Create DTOs (5 files)

- **Files**: `src/auth/dto/passkey-*.dto.ts`

| DTO | Fields | Validation |
|-----|--------|------------|
| `PasskeyRegisterVerifyDto` | `credential: Record<string, unknown>`, `name?: string` | `@IsObject`, `@IsOptional @IsString @MaxLength(64)` |
| `PasskeyLoginOptionsDto` | `email?: string` | `@IsOptional @IsEmail` |
| `PasskeyLoginVerifyDto` | `credential: Record<string, unknown>`, `challengeId: string` | `@IsObject`, `@IsString` |
| `PasskeyRenameDto` | `name: string` | `@IsString @MinLength(1) @MaxLength(64)` |
| `PasskeyDeleteDto` | `password?: string` | `@IsOptional @IsString` |

- **Notes**: `credential` typed as `Record<string, unknown>` — deep validation done by `@simplewebauthn/server` library internally.

### Step 5: Create PasskeyService

- **File**: `src/auth/passkey.service.ts` (NEW)
- **Constructor**: `PrismaService, UsersService, AuditService, @Inject(REDIS_CLIENT) Redis`
- **RP config**: From env vars `WEBAUTHN_RP_ID` (default: localhost), `WEBAUTHN_RP_NAME` (default: EM NexaCore), `WEBAUTHN_ORIGIN` (default: http://localhost:3001)

#### Methods:

| Method | Purpose | Key Logic |
|--------|---------|-----------|
| `generateRegOptions(userId)` | Generate registration options | Check max limit (10), get excludeCredentials, call `generateRegistrationOptions()`, store full options in Redis (`EX 300`) |
| `verifyRegistration(userId, credential, name?, ctx?)` | Verify attestation + store | `getdel` challenge from Redis, call `verifyRegistrationResponse()`, store credential in DB with `Buffer.from(publicKey)`, audit log `PASSKEY_REGISTERED` |
| `generateAuthOptions(email?)` | Generate auth options | If email → find user's credentials for `allowCredentials`; generate UUID `challengeId`, store in Redis, return both. Anti-enumeration: no error if email unknown |
| `verifyAuthentication(challengeId, credential, ctx?)` | Verify assertion + return userId | `getdel` challenge, find credential by `authResponse.id`, check `user.isActive`, call `verifyAuthenticationResponse()`, validate sign count, update `signCount` + `lastUsedAt`, audit log `PASSKEY_AUTH_SUCCESS` |
| `listPasskeys(userId)` | List user's passkeys | Select: id, name, deviceType, backedUp, transports, lastUsedAt, createdAt |
| `renamePasskey(userId, id, name)` | Rename passkey | findFirst (userId + id), throw NotFoundException if not found, update name |
| `deletePasskey(userId, id, password?, ctx?)` | Delete passkey | If user has passwordHash → require + verify password. findFirst, delete, audit `PASSKEY_DELETED` |

- **Security patterns**:
  - Challenges: Redis `set/getdel` (single-use, 5min TTL)
  - Sign count: Reject if `response.signCount <= stored.signCount` (unless both 0)
  - Anti-enumeration: `generateAuthOptions` never reveals if email exists
  - Fail-safe audit: `.catch(() => {})` on all audit calls

### Step 6: Verify AuthService.generateTokensForMfa() (READ-ONLY)

- **No modifications needed**
- `generateTokensForMfa(userId, requestMeta)` at lines 612-638 already:
  1. Creates tokens + session via `generateTokens()` (line 620)
  2. Checks impossible travel (line 625)
  3. Notifies new device (line 630)
  4. Checks suspicious login (line 631)
  5. Returns `{ accessToken, user: SafeUser, cookie: CookieConfig }`
- PasskeyController will call this directly after passkey auth verification.

### Step 7: Create PasskeyController

- **File**: `src/auth/passkey.controller.ts` (NEW)
- **Route prefix**: `auth/passkeys`
- **Constructor**: `PasskeyService, AuthService`
- **Private helper**: `extractRequestMeta(req)` → `{ ipAddress, userAgent }`

| # | Method | Path | Auth | Throttle | Logic |
|---|--------|------|------|----------|-------|
| 1 | POST | `register/options` | JwtAuthGuard | mfa (5/60s) | `passkeyService.generateRegOptions(req.user.id)` |
| 2 | POST | `register/verify` | JwtAuthGuard | mfa (5/60s) | `passkeyService.verifyRegistration(userId, dto.credential, dto.name, meta)` → 201 |
| 3 | POST | `login/options` | None | login (10/60s) | `passkeyService.generateAuthOptions(dto.email)` |
| 4 | POST | `login/verify` | None | login (10/60s) | `passkeyService.verifyAuthentication(dto.challengeId, dto.credential, meta)` → `authService.generateTokensForMfa(userId, meta)` → set cookie → return tokens |
| 5 | GET | ` ` | JwtAuthGuard | Global | `passkeyService.listPasskeys(req.user.id)` |
| 6 | PATCH | `:id` | JwtAuthGuard | Global | `passkeyService.renamePasskey(req.user.id, id, dto.name)` |
| 7 | DELETE | `:id` | JwtAuthGuard | mfa (5/60s) | `passkeyService.deletePasskey(req.user.id, id, dto.password, meta)` |

- **Notes**: Endpoint 4 (`login/verify`) mirrors MFA controller's `verifyLogin` pattern — verify credential, then delegate to `AuthService.generateTokensForMfa()` for token+session+security.

### Step 8: Register in AuthModule

- **File**: `src/auth/auth.module.ts`
- **Changes**:
  1. Import `PasskeyController` and `PasskeyService`
  2. Add `PasskeyController` to `controllers` array
  3. Add `PasskeyService` to `providers` array
- **No new module imports needed**: PrismaService (@Global), REDIS_CLIENT (@Global), AuditService (already imported), UsersService (already imported via forwardRef)

### Step 9: Unit Tests — PasskeyService (~35 tests)

- **File**: `src/auth/tests/passkey.service.spec.ts` (NEW)
- **Mock setup**: `jest.mock('@simplewebauthn/server')`, mock PrismaService (webAuthnCredential.count/findMany/findUnique/findFirst/create/update/delete), UsersService (findById/findByEmail), AuditService (log), REDIS_CLIENT (set/getdel)

| Describe | Tests | Key assertions |
|----------|-------|----------------|
| `generateRegOptions` | 5 | Returns options + stores in Redis, throws on user not found, throws on max limit, includes excludeCredentials, correct RP params |
| `verifyRegistration` | 8 | Stores credential on success, uses provided name, generates default name, throws on missing challenge, throws on verification fail, race condition guard, audits PASSKEY_REGISTERED, audits failure |
| `generateAuthOptions` | 4 | Returns challengeId + options, includes allowCredentials, discoverable when no email, anti-enumeration |
| `verifyAuthentication` | 10 | Returns userId on success, throws on expired challenge, credential not found, deactivated user, verification throws, verified=false, sign count replay, allows zero counters, audits success, audits failures |
| `listPasskeys` | 2 | Returns credentials, empty array |
| `renamePasskey` | 3 | Updates name, NotFoundException if not found, rejects other user's passkey |
| `deletePasskey` | 6 | Deletes with valid password, deletes without password (OAuth user), requires password, invalid password, not found, user not found |

### Step 10: Unit Tests — PasskeyController (~15 tests)

- **File**: `src/auth/tests/passkey.controller.spec.ts` (NEW)
- **Mock setup**: `jest.mock('@simplewebauthn/server')`, mock PasskeyService (all 7 methods), AuthService (generateTokensForMfa)

| Describe | Tests | Key assertions |
|----------|-------|----------------|
| `registerOptions` | 1 | Delegates to service with userId |
| `registerVerify` | 2 | Returns 201 with id+name, passes meta+name |
| `loginOptions` | 2 | Delegates with email, works without email |
| `loginVerify` | 3 | Verifies + generates tokens + sets cookie, passes meta, correct param flow |
| `list` | 1 | Delegates with userId |
| `rename` | 1 | Delegates with userId + id + name |
| `remove` | 2 | Delegates with password, works without password |

### Step 11: Build and Verify

1. `npx prisma generate`
2. `npx nest build` — zero errors
3. `npx jest --coverage` — all tests pass, thresholds met (stmts ≥90%, branches ≥85%, funcs ≥90%, lines ≥90%)
4. `npx nest start` — verify 43 routes (36 existing + 7 new), no DI errors
5. New routes confirmed: `/auth/passkeys/register/options`, `/auth/passkeys/register/verify`, `/auth/passkeys/login/options`, `/auth/passkeys/login/verify`, `/auth/passkeys`, `/auth/passkeys/:id` (PATCH), `/auth/passkeys/:id` (DELETE)

### Step 12: Update Technical Documentation

| File | Changes |
|------|---------|
| `ai-specs/specs/integration-state.md` | AuthModule: +PasskeyController, +PasskeyService; PasskeyService dep chain; test mock requirements; changelog |
| `ai-specs/specs/data-model.md` | +WebAuthnCredential entity (11 fields); +4 AuditAction values |
| `ai-specs/specs/api-spec.yml` | +7 endpoints under `/auth/passkeys` (total: 43 operations) |
| `.env.example` | +3 WebAuthn env vars (WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME, WEBAUTHN_ORIGIN) |

## Implementation Order

1. Step 0: Feature branch
2. Step 1: npm install
3. Step 2: Prisma schema + AuditAction enum + generate
4. Step 3: Constants (parallel with Step 4)
5. Step 4: DTOs
6. Step 5: PasskeyService
7. Step 6: Verify generateTokensForMfa (read-only)
8. Step 7: PasskeyController
9. Step 8: Register in AuthModule
10. Step 9: PasskeyService tests
11. Step 10: PasskeyController tests
12. Step 11: Build and verify
13. Step 12: Update documentation

## Testing Checklist

- [ ] `nest build` compiles with zero errors
- [ ] All existing tests pass (no regressions)
- [ ] PasskeyService: ~35 new tests passing
- [ ] PasskeyController: ~15 new tests passing
- [ ] Total new tests: ~50
- [ ] Coverage thresholds met (stmts ≥90%, branches ≥85%, funcs ≥90%, lines ≥90%)
- [ ] `nest start` loads without DI errors, 43 routes registered
- [ ] Registration: options → verify → credential stored
- [ ] Authentication: options → verify → JWT tokens issued + session created
- [ ] Anti-enumeration: login/options with unknown email returns valid discoverable options
- [ ] Sign count replay rejected
- [ ] Max 10 passkeys enforced
- [ ] Single-use challenges (getdel)
- [ ] Password confirmation on delete
- [ ] All operations audit-logged

## Error Response Format

| Status | Condition |
|--------|-----------|
| 400 | Max passkeys reached, missing challenge, verification failed, password required |
| 401 | Invalid auth, invalid passkey, invalid password, expired challenge |
| 403 | Account deactivated |
| 404 | Passkey not found |
| 429 | Rate limit exceeded |

## Dependencies

- `@simplewebauthn/server` ^13.2.0 — WebAuthn ceremony (registration + authentication)
- `@simplewebauthn/types` ^13.2.0 — TypeScript types
- No other new dependencies

## Notes

- **No new NestJS module**: PasskeyService + PasskeyController register inside existing AuthModule. All deps already available.
- **Token reuse**: `AuthService.generateTokensForMfa()` already handles session creation + impossible travel + suspicious login + new device notification. Zero duplication.
- **Anti-enumeration**: `POST /auth/passkeys/login/options` never reveals whether an email has passkeys.
- **Sign count**: Reject when `response.signCount <= stored.signCount` (unless both 0). Detects cloned credentials.
- **No migration**: Using `npx prisma generate` only (no `migrate dev`). Migration handled at deploy time.
- **ESM compatibility**: @simplewebauthn v13 is ESM; project's `nodenext` + `resolvePackageJsonExports` handles it.

## Implementation Verification

- [ ] Code Quality: NestJS patterns, proper DI, no circular deps
- [ ] Functionality: Registration + authentication + management all working
- [ ] Security: Single-use challenges, sign count, anti-enumeration, rate limiting, audit trail
- [ ] Testing: ~50 new tests, all thresholds met
- [ ] Integration: AuthModule wired correctly, all 7 routes registered
- [ ] Documentation: integration-state.md, data-model.md, api-spec.yml, .env.example updated

## Files Summary

### New (10 files)
- `src/auth/constants/passkey.constants.ts`
- `src/auth/dto/passkey-register-verify.dto.ts`
- `src/auth/dto/passkey-login-options.dto.ts`
- `src/auth/dto/passkey-login-verify.dto.ts`
- `src/auth/dto/passkey-rename.dto.ts`
- `src/auth/dto/passkey-delete.dto.ts`
- `src/auth/passkey.service.ts`
- `src/auth/passkey.controller.ts`
- `src/auth/tests/passkey.service.spec.ts`
- `src/auth/tests/passkey.controller.spec.ts`

### Modified (4 files)
- `prisma/schema.prisma` — WebAuthnCredential model + User relation + 4 AuditAction values
- `src/audit/enums/audit-action.enum.ts` — +4 values
- `src/auth/auth.module.ts` — +PasskeyController, +PasskeyService
- `package.json` — +@simplewebauthn/server, +@simplewebauthn/types
