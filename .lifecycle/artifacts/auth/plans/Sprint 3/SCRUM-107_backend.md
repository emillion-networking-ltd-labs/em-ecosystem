# Backend Implementation Plan: SCRUM-107 Device Fingerprinting + Trusted Devices

## 1. Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-114 (Endpoint Correctness)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `prisma/schema.prisma` — User model (line 51-80), Session model (line 82-101), AuditAction enum (line 21-44). No TrustedDevice model exists yet.
  - `src/auth/auth.module.ts` — providers: AuthService, MfaService, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthStateStore, OAuthCodeStore, PasswordBreachService. Imports: UsersModule (forwardRef), AuditModule, SessionsModule, CryptoModule, MailModule, PassportModule, JwtModule.
  - `src/auth/auth.service.ts` — constructor: UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService. login() at line 161 checks mfaEnabled at line 301, returns MfaChallengeResult. No fingerprint logic exists.
  - `src/auth/auth.controller.ts` — constructor: AuthService, SessionsService, JwtService, PermissionsService. login() at line 143 passes meta to auth.service.login(). No trusted device endpoints exist.
  - `src/auth/mfa.controller.ts` — constructor: MfaService, AuthService. verifyLogin() at line 98 calls mfaService.verifyLoginCode then authService.generateTokensForMfa().
  - `src/auth/mfa.service.ts` — constructor: UsersService, CryptoService, JwtService, AuditService. disableMfa() at line 177.
  - `src/users/users.service.ts` — changePassword() at line 261, disableMfa() at line 448.
  - `src/auth/constants/auth.constants.ts` — AUTH_RATE_LIMITS at line 61 (login, register, refresh, oauth, mfa).
- **Constructor signatures verified**: AuthService (8 deps), AuthController (4 deps), MfaController (2 deps), MfaService (4 deps)
- **Guard dependency chain verified**: JwtAuthGuard → no deps (always available). No RolesGuard/PermissionsGuard needed for trusted device endpoints (user manages own devices).

## 2. Overview

Implement server-side device fingerprinting and trusted device management within the existing AuthModule. When a user marks a device as trusted (post-MFA verification), subsequent logins from that device skip MFA for a configurable period (default 30 days). Fingerprints are sent by the client as opaque strings and stored server-side as salted SHA-256 hashes using the existing CryptoService pattern.

## 3. Architecture Context

- **Modules affected**: AuthModule (new service + 4 controller endpoints), UsersModule (cascade revocation hooks)
- **Components affected**:
  - NEW: `TrustedDeviceService` — CRUD, fingerprint hashing, trust verification
  - NEW: `TrustDeviceDto` — validation DTO
  - MODIFIED: `AuthService.login()` — check trusted device before MFA challenge
  - MODIFIED: `AuthController` — 4 new endpoints
  - MODIFIED: `MfaService.disableMfa()` — cascade revoke trusted devices
  - MODIFIED: `UsersService.changePassword()` — cascade revoke trusted devices
  - MODIFIED: `prisma/schema.prisma` — TrustedDevice model + AuditAction values
  - MODIFIED: `auth.module.ts` — register TrustedDeviceService
  - MODIFIED: `auth.constants.ts` — trusted device constants
- **No new modules**: TrustedDeviceService lives inside AuthModule (it's tightly coupled to auth flows)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-107-backend` from latest `feature/SCRUM-114-backend`
- **Branch Naming**: `feature/SCRUM-107-backend`
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-114-backend`
  2. `git checkout -b feature/SCRUM-107-backend`
  3. `git branch` — verify

### Step 1: Update Prisma Schema

- **File**: `prisma/schema.prisma`
- **Action**: Add TrustedDevice model, new AuditAction values, User relation
- **Implementation Steps**:
  1. Add to AuditAction enum (after `ACCOUNT_SELF_DELETED`):
     ```prisma
     DEVICE_TRUSTED
     DEVICE_UNTRUSTED
     ```
  2. Add TrustedDevice model after PasswordResetToken:
     ```prisma
     model TrustedDevice {
       id              String   @id @default(uuid())
       userId          String
       user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
       fingerprintHash String
       deviceName      String
       ipAddress       String
       lastVerifiedAt  DateTime @default(now())
       expiresAt       DateTime
       isRevoked       Boolean  @default(false)
       createdAt       DateTime @default(now())
       updatedAt       DateTime @updatedAt

       @@unique([userId, fingerprintHash])
       @@index([userId, isRevoked, expiresAt])
       @@map("trusted_devices")
     }
     ```
  3. Add relation to User model (after `passwordResetTokens`):
     ```prisma
     trustedDevices           TrustedDevice[]
     ```
  4. Run `npx prisma generate` to regenerate client (do NOT run `prisma migrate` — schema-only for now)
- **Dependencies**: None
- **Implementation Notes**: The `@@unique([userId, fingerprintHash])` prevents duplicate trusted device entries per user. The `onDelete: Cascade` ensures trusted devices are removed when user is deleted.

### Step 2: Add Trusted Device Constants

- **File**: `src/auth/constants/auth.constants.ts`
- **Action**: Add trusted device configuration constants
- **Implementation Steps**:
  1. Add after `MAX_CONCURRENT_SESSIONS`:
     ```typescript
     /**
      * Trusted device TTL in days.
      * After this period, the device must re-verify via MFA.
      */
     export const TRUSTED_DEVICE_TTL_DAYS = parseInt(
       process.env.TRUSTED_DEVICE_TTL_DAYS || '30',
       10,
     );

     /**
      * Maximum trusted devices per user.
      * Oldest revoked when exceeded.
      */
     export const MAX_TRUSTED_DEVICES_PER_USER = 10;
     ```
- **Dependencies**: None

### Step 3: Create TrustDeviceDto

- **File**: `src/auth/dto/trust-device.dto.ts` (NEW)
- **Action**: Create validation DTO for trusting a device
- **Implementation Steps**:
  1. Create DTO:
     ```typescript
     import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

     export class TrustDeviceDto {
       @IsString()
       @IsNotEmpty()
       @MinLength(16)
       @MaxLength(512)
       fingerprint: string;
     }
     ```
- **Dependencies**: `class-validator`
- **Implementation Notes**: `MinLength(16)` ensures the fingerprint is a meaningful hash, not trivial data. `MaxLength(512)` prevents abuse.

### Step 4: Create TrustedDeviceService

- **File**: `src/auth/services/trusted-device.service.ts` (NEW)
- **Action**: Implement service with CRUD, fingerprint hashing, trust verification
- **Implementation Steps**:
  1. Create injectable service with dependencies: `PrismaService`, `CryptoService`, `AuditService`
  2. Implement `hashFingerprint(userId: string, fingerprint: string): string`:
     - Uses HMAC-SHA256 with `DEVICE_FINGERPRINT_SECRET` env var (or derived from JWT_SECRET)
     - Salt: userId (ensures same fingerprint on different accounts produces different hashes)
     - Returns hex digest
  3. Implement `trustDevice(userId: string, fingerprint: string, ipAddress: string, userAgent: string | null): Promise<TrustedDevice>`:
     - Hash fingerprint
     - Check max trusted devices limit, revoke oldest if exceeded
     - Upsert: if (userId, fingerprintHash) exists and is revoked, re-activate with new expiry
     - If new, create with `expiresAt = now + TRUSTED_DEVICE_TTL_DAYS`
     - Parse `userAgent` to derive `deviceName` (e.g., "Chrome on Windows")
     - Audit log: `DEVICE_TRUSTED`
  4. Implement `isTrustedDevice(userId: string, fingerprint: string): Promise<boolean>`:
     - Hash fingerprint
     - Query: `findFirst({ where: { userId, fingerprintHash, isRevoked: false, expiresAt: { gt: new Date() } } })`
     - If found, update `lastVerifiedAt` to now
     - Return boolean
  5. Implement `listTrustedDevices(userId: string, currentFingerprint?: string): Promise<TrustedDeviceResponse[]>`:
     - Query all non-revoked, non-expired for userId
     - Map to response DTO with `isCurrent` flag (compare fingerprintHash)
  6. Implement `revokeDevice(userId: string, deviceId: string): Promise<void>`:
     - Verify ownership (userId matches)
     - Set `isRevoked: true`
     - Audit log: `DEVICE_UNTRUSTED`
  7. Implement `revokeAllDevices(userId: string): Promise<number>`:
     - `updateMany({ where: { userId, isRevoked: false }, data: { isRevoked: true } })`
     - Return count revoked
     - Audit log if count > 0: `DEVICE_UNTRUSTED` with metadata `{ scope: 'all', count }`
  8. Implement `parseDeviceName(userAgent: string | null): string`:
     - Simple regex extraction: browser + OS from User-Agent string
     - Fallback: "Unknown Device"
- **Dependencies**: `PrismaService` (@Global), `CryptoService` (@Global), `AuditService` (via AuditModule import in AuthModule)
- **Implementation Notes**: The fingerprint hashing key is derived from `JWT_SECRET` using HMAC (same pattern as `mfaChallengeSecret` in AuthService/MfaService). No new env var needed.

### Step 5: Register TrustedDeviceService in AuthModule

- **File**: `src/auth/auth.module.ts`
- **Action**: Add TrustedDeviceService to providers and exports
- **Implementation Steps**:
  1. Import `TrustedDeviceService` from `./services/trusted-device.service`
  2. Add to `providers` array: `TrustedDeviceService`
  3. Add to `exports` array: `TrustedDeviceService` (needed by UsersModule for cascade revocation)
- **Dependencies**: None new — AuditModule already imported

### Step 6: Modify AuthService.login() for Trusted Device Check

- **File**: `src/auth/auth.service.ts`
- **Action**: Check trusted device before issuing MFA challenge
- **Implementation Steps**:
  1. Add `TrustedDeviceService` to constructor injection (9th dependency)
  2. Import `TrustedDeviceService`
  3. In `login()`, after email verification check (line 294) and lockout reset (line 298), BEFORE the MFA check (line 301):
     ```typescript
     // MFA check — skip if device is trusted
     if (user.mfaEnabled) {
       // Check if this device is trusted (fingerprint from header)
       const fingerprint = ctx?.fingerprint;
       if (fingerprint) {
         const isTrusted = await this.trustedDeviceService.isTrustedDevice(
           user.id,
           fingerprint,
         );
         if (isTrusted) {
           // Trusted device — skip MFA, proceed to token generation
           if (user.failedAttempts > 0 || user.lockoutCount > 0) {
             await this.usersService.resetLockoutEscalation(user.id);
           }

           const { accessToken, refreshToken, sessionId } =
             await this.generateTokens(user, requestMeta);

           this.auditService
             .log({
               action: AuditAction.LOGIN_SUCCESS,
               userId: user.id,
               ipAddress: ctx?.ipAddress,
               userAgent: ctx?.userAgent,
               metadata: { mfaSkipped: true, trustedDevice: true },
             })
             .catch(() => {});

           this.notifyIfNewDevice(user, sessionId, requestMeta).catch(() => {});

           return {
             accessToken,
             user: toSafeUser(user),
             cookie: this.buildRefreshCookie(refreshToken),
           };
         }
       }

       // Not trusted — issue MFA challenge as before
       const mfaToken = this.jwtService.sign(
         { sub: user.id, type: 'mfa-challenge' },
         { expiresIn: '5m' as StringValue, secret: this.mfaChallengeSecret },
       );
       // ... (rest of existing MFA logic unchanged)
     ```
  4. Update `login()` signature to accept fingerprint via `ctx`:
     - Modify `RequestContext` interface in `src/audit/interfaces/audit-log-entry.interface.ts` to add optional `fingerprint?: string`
     - OR pass fingerprint through existing `requestMeta` by adding `fingerprint?: string` to it
  5. In `AuthController.login()`, extract `X-Device-Fingerprint` header from request and pass to auth service
- **Dependencies**: `TrustedDeviceService` injection
- **Implementation Notes**: The fingerprint is passed via `X-Device-Fingerprint` HTTP header. This keeps the LoginDto unchanged (fingerprint is not credentials, it's device metadata). The header is optional — if not sent, MFA flow proceeds normally.

### Step 7: Add Trusted Device Endpoints to AuthController

- **File**: `src/auth/auth.controller.ts`
- **Action**: Add 4 trusted device endpoints
- **Implementation Steps**:
  1. Add `TrustedDeviceService` to constructor (5th dependency)
  2. Import `TrustDeviceDto`
  3. Add endpoints:

  **POST /auth/trusted-devices** — Trust current device:
  ```typescript
  @Post('trusted-devices')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Mark current device as trusted (skips MFA on future logins)' })
  @ApiResponse({ status: 201, description: 'Device trusted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async trustDevice(
    @Body() dto: TrustDeviceDto,
    @Request() req: any,
  ) {
    const meta = this.extractRequestMeta(req);
    const device = await this.trustedDeviceService.trustDevice(
      req.user.id,
      dto.fingerprint,
      meta.ipAddress,
      meta.userAgent,
    );
    return {
      id: device.id,
      deviceName: device.deviceName,
      expiresAt: device.expiresAt,
    };
  }
  ```

  **GET /auth/trusted-devices** — List trusted devices:
  ```typescript
  @Get('trusted-devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List trusted devices for current user' })
  @ApiResponse({ status: 200, description: 'List of trusted devices' })
  async listTrustedDevices(@Request() req: any) {
    return this.trustedDeviceService.listTrustedDevices(req.user.id);
  }
  ```

  **DELETE /auth/trusted-devices/:id** — Revoke specific device:
  ```typescript
  @Delete('trusted-devices/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke trust for a specific device' })
  @ApiResponse({ status: 200, description: 'Device trust revoked' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async revokeTrustedDevice(
    @Param('id', ParseUUIDPipe) deviceId: string,
    @Request() req: any,
  ) {
    await this.trustedDeviceService.revokeDevice(req.user.id, deviceId);
    return { message: 'Device trust revoked' };
  }
  ```

  **DELETE /auth/trusted-devices** — Revoke all devices:
  ```typescript
  @Delete('trusted-devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all trusted devices' })
  @ApiResponse({ status: 200, description: 'All trusted devices revoked' })
  async revokeAllTrustedDevices(@Request() req: any) {
    const count = await this.trustedDeviceService.revokeAllDevices(req.user.id);
    return { message: 'All trusted devices revoked', count };
  }
  ```
- **Dependencies**: `TrustedDeviceService`, `TrustDeviceDto`, `ParseUUIDPipe` (already imported)
- **Implementation Notes**: Routes registered under `auth/trusted-devices` to colocate with session management. Using `JwtAuthGuard` only (no RolesGuard/PermissionsGuard — users manage their own devices). POST is rate-limited to prevent fingerprint enumeration.

### Step 8: Add Cascade Revocation on Password Change

- **File**: `src/users/users.service.ts`
- **Action**: Revoke all trusted devices when password is changed
- **Implementation Steps**:
  1. Add `TrustedDeviceService` to UsersService constructor via `@Inject(forwardRef(() => TrustedDeviceService))` (since AuthModule ↔ UsersModule have circular dependency via forwardRef)
  2. In `changePassword()` (line 261), after successful password update and session revocation, add:
     ```typescript
     await this.trustedDeviceService.revokeAllDevices(userId);
     ```
  3. Import `TrustedDeviceService` and `forwardRef`
- **Dependencies**: `TrustedDeviceService` from AuthModule (via forwardRef — same pattern as PasswordBreachService)
- **Implementation Notes**: The circular dependency is already handled — UsersModule imports AuthModule via forwardRef, and AuthModule exports TrustedDeviceService.

### Step 9: Add Cascade Revocation on MFA Disable

- **File**: `src/auth/mfa.service.ts`
- **Action**: Revoke all trusted devices when MFA is disabled
- **Implementation Steps**:
  1. Add `TrustedDeviceService` to MfaService constructor (5th dependency)
  2. In `disableMfa()` (line 177), after `this.usersService.disableMfa(userId)` (line 202), add:
     ```typescript
     await this.trustedDeviceService.revokeAllDevices(userId);
     ```
  3. Import `TrustedDeviceService`
- **Dependencies**: `TrustedDeviceService` (same module — AuthModule)
- **Implementation Notes**: When MFA is disabled, trusted devices become meaningless (no MFA to skip). Revoking them ensures clean state if MFA is re-enabled later.

### Step 10: Write Unit Tests

- **File**: `src/auth/tests/trusted-device.service.spec.ts` (NEW)
- **Action**: Comprehensive tests for TrustedDeviceService
- **Test Categories**:
  1. **hashFingerprint()**:
     - Should return consistent hash for same userId + fingerprint
     - Should return different hash for same fingerprint + different userId (salt isolation)
     - Should return different hash for different fingerprint + same userId
  2. **trustDevice()**:
     - Should create trusted device with correct expiry (30 days)
     - Should derive deviceName from User-Agent
     - Should upsert when same fingerprint re-trusted (update expiry, unrevoke)
     - Should enforce MAX_TRUSTED_DEVICES_PER_USER limit (revoke oldest)
     - Should audit log DEVICE_TRUSTED
  3. **isTrustedDevice()**:
     - Should return true for valid, non-expired, non-revoked device
     - Should return false for expired device
     - Should return false for revoked device
     - Should return false for unknown fingerprint
     - Should update lastVerifiedAt on successful check
  4. **listTrustedDevices()**:
     - Should return non-revoked, non-expired devices only
     - Should include isCurrent flag
  5. **revokeDevice()**:
     - Should set isRevoked to true
     - Should throw NotFoundException for wrong userId (ownership)
     - Should audit log DEVICE_UNTRUSTED
  6. **revokeAllDevices()**:
     - Should revoke all non-revoked devices
     - Should return count of revoked devices
     - Should not fail when no devices exist

- **File**: `src/auth/tests/auth.service.spec.ts` (MODIFY)
- **Action**: Add trusted device tests to login() describe block
- **Test Categories**:
  1. Should skip MFA when trusted device fingerprint matches
  2. Should proceed with MFA challenge when fingerprint does not match
  3. Should proceed with MFA challenge when no fingerprint provided
  4. Should proceed with MFA challenge when fingerprint is for an expired trusted device

- **File**: `src/auth/tests/auth.controller.spec.ts` (MODIFY)
- **Action**: Add TrustedDeviceService mock, test 4 new endpoints
- **Test Categories**:
  1. POST /auth/trusted-devices: success, unauthorized
  2. GET /auth/trusted-devices: success, unauthorized
  3. DELETE /auth/trusted-devices/:id: success, not found, unauthorized
  4. DELETE /auth/trusted-devices: success, unauthorized

### Step 11: Build, Test, and Verify

- **Action**: Post-implementation integrity checks
- **Implementation Steps**:
  1. `npx prisma generate` — regenerate client
  2. `npx nest build` — must compile clean
  3. `npx jest --maxWorkers=1 --forceExit` — all tests must pass (expect 558+)
  4. `npx jest --coverage` — verify thresholds met

### Step 12: Update Technical Documentation

- **Action**: Update api-spec.yml, data-model.md, integration-state.md
- **Implementation Steps**:
  1. `ai-specs/specs/data-model.md`:
     - Add TrustedDevice entity (10 fields)
     - Add DEVICE_TRUSTED, DEVICE_UNTRUSTED to AuditAction enum
     - Update User entity relations
  2. `ai-specs/specs/api-spec.yml`:
     - Add 4 new endpoints under `/auth/trusted-devices`
     - Add TrustedDeviceResponse schema
  3. `ai-specs/specs/integration-state.md`:
     - Update AuthModule providers/exports
     - Update AuthController constructor dependencies
     - Update MfaService dependency chain
     - Update UsersService dependency chain
     - Changelog entry

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update Prisma schema (TrustedDevice model, AuditAction values)
3. Step 2: Add trusted device constants
4. Step 3: Create TrustDeviceDto
5. Step 4: Create TrustedDeviceService
6. Step 5: Register in AuthModule
7. Step 6: Modify AuthService.login() for trusted device check
8. Step 7: Add 4 endpoints to AuthController
9. Step 8: Cascade revocation on password change (UsersService)
10. Step 9: Cascade revocation on MFA disable (MfaService)
11. Step 10: Write unit tests
12. Step 11: Build + test + coverage
13. Step 12: Update technical documentation

## 6. Testing Checklist

- [ ] `trusted-device.service.spec.ts`: All CRUD, hashing, expiry, limit, audit tests pass
- [ ] `auth.service.spec.ts`: MFA skip on trusted device, MFA required on unknown/expired device
- [ ] `auth.controller.spec.ts`: 4 new endpoint tests pass, TrustedDeviceService properly mocked
- [ ] `mfa.service.spec.ts`: Still passes (TrustedDeviceService mock added)
- [ ] All 558+ existing tests still pass (no regressions)
- [ ] `nest build` compiles clean
- [ ] `prisma generate` succeeds
- [ ] Coverage thresholds met

## 7. Error Response Format

**POST /auth/trusted-devices with invalid fingerprint:**
```json
{
  "statusCode": 400,
  "message": ["fingerprint must be longer than or equal to 16 characters"],
  "error": "Bad Request"
}
```

**DELETE /auth/trusted-devices/:id with wrong owner:**
```json
{
  "statusCode": 404,
  "message": "Trusted device not found",
  "error": "Not Found"
}
```

**Login with trusted device (MFA skipped):**
```json
{
  "accessToken": "eyJhbG...",
  "user": { ... }
}
```

**Login without trusted device (MFA required, same as current):**
```json
{
  "mfaRequired": true,
  "mfaToken": "eyJhbG..."
}
```

## 8. Partial Update Support

N/A — no PATCH operations for trusted devices. Devices are either trusted or revoked.

## 9. Dependencies

- No new external libraries. All crypto operations use Node.js built-in `crypto` module (same as existing auth patterns).
- `class-validator` already available for DTO validation.
- Prisma Client regeneration required (schema change).

## 10. Notes

- **Fingerprint transport**: `X-Device-Fingerprint` HTTP header (not body). This separates device metadata from credentials and keeps DTOs clean.
- **Fingerprint hashing key**: Derived from `JWT_SECRET` via HMAC (same pattern as `mfaChallengeSecret` in AuthService line 112-115 and MfaService line 38-40). No new environment variable needed.
- **No migration**: The plan does NOT include `prisma migrate` because the project manages migrations separately. Only `prisma generate` is run.
- **Circular dependency**: UsersModule already imports AuthModule via `forwardRef()`. TrustedDeviceService is exported from AuthModule and injected into UsersService via `@Inject(forwardRef())` — same pattern as PasswordBreachService.
- **Route ordering**: `DELETE /auth/trusted-devices` (revoke all) must be defined BEFORE `DELETE /auth/trusted-devices/:id` in the controller to avoid `:id` matching "trusted-devices". Alternatively, keep both as `@Delete()` with distinct paths.
- **User-Agent parsing**: Simple regex for device name (e.g., "Chrome on Windows"). No external library — good enough for display purposes.

## 11. Next Steps After Implementation

- Frontend: implement client-side fingerprinting and UI for trusted device management (separate ticket)
- Integration testing: verify trusted device flow end-to-end with frontend
- Consider cleanup cron job for expired trusted devices (optimization, not critical — queries filter by expiresAt)

## 12. Implementation Verification

- [ ] TrustedDevice model in Prisma schema with unique constraint and index
- [ ] Fingerprint hashing produces consistent, salted SHA-256 hashes
- [ ] POST /auth/trusted-devices creates record with 30-day expiry
- [ ] GET /auth/trusted-devices returns user's devices with isCurrent flag
- [ ] DELETE /auth/trusted-devices/:id revokes single device (ownership enforced)
- [ ] DELETE /auth/trusted-devices revokes all devices
- [ ] Login with MFA + trusted device fingerprint skips MFA
- [ ] Login with MFA + unknown/expired fingerprint requires MFA
- [ ] Password change revokes all trusted devices
- [ ] MFA disable revokes all trusted devices
- [ ] All trust/untrust events audit-logged
- [ ] All tests pass, build clean, coverage thresholds met
- [ ] api-spec.yml, data-model.md, integration-state.md updated

## 13. Module-Level Planning

- **Module Scope**: Extends existing AuthModule (no new module). Adds TrustedDevice entity.
- **Entity Design**: TrustedDevice — 10 fields, userId FK with cascade delete, unique on (userId, fingerprintHash), composite index for query performance.
- **API Surface**: 4 new endpoints (POST, GET, DELETE, DELETE) under `/auth/trusted-devices`. All protected by JwtAuthGuard.
- **Cross-Module Dependencies**: TrustedDeviceService injected into AuthService (same module), MfaService (same module), and UsersService (cross-module via forwardRef).
- **Domain Events**: DEVICE_TRUSTED, DEVICE_UNTRUSTED audit actions.
- **Transaction Boundaries**: No multi-table transactions. Upsert in trustDevice() is a single Prisma operation.
- **Permissions**: No new permissions — users manage their own devices (JwtAuthGuard only).

## 14. Satellite App Planning

N/A — NexaCore internal changes only.
