# Fullstack Implementation Spec: SCRUM-28 MFA/2FA with TOTP

## Overview

Complete implementation of Multi-Factor Authentication (MFA) using Time-based One-Time Passwords (TOTP) for the EM NexaCore platform. This story adds a full TOTP setup flow with QR code generation, a two-step login flow that requires TOTP verification when MFA is enabled, single-use backup/recovery codes for account recovery, and frontend UI for both the MFA setup experience and the login MFA challenge step.

**Epic**: SCRUM-22 — Auth Security Hardening & Enterprise Features
**Story**: SCRUM-28 — MFA/2FA with TOTP (Layer 6 of 8, HIGH priority)
**Sub-tasks**: SCRUM-64 through SCRUM-72

---

## Architecture Context

### MFA Login Flow (Two-Step)

```
User submits email + password
        │
        ▼
  Credentials valid?
   No ──► 401 Invalid credentials
   Yes ─┐
        ▼
  MFA enabled?
   No ──► Return { accessToken, refreshToken, user } (existing flow)
   Yes ─┐
        ▼
  Return { mfaRequired: true, mfaToken: "<temp-jwt>" }
        │
        ▼
  User submits TOTP code (or recovery code) + mfaToken
        │
        ▼
  POST /auth/mfa/verify-login
        │
        ▼
  Code valid?
   No ──► 401 Invalid MFA code
   Yes ─┐
        ▼
  Return { accessToken, refreshToken, user } (full auth)
```

### MFA Setup Flow

```
Authenticated user calls POST /auth/mfa/setup
        │
        ▼
  Generate TOTP secret + QR code URI
  Generate 10 recovery codes (plaintext returned ONCE, hashed stored)
        │
        ▼
  Return { secret, qrCodeDataUrl, recoveryCodes }
  (mfaEnabled remains false until verified)
        │
        ▼
  User scans QR code in authenticator app
  User enters 6-digit code from app
        │
        ▼
  POST /auth/mfa/verify-setup { token: "123456" }
        │
        ▼
  Code valid?
   No ──► 400 Invalid code
   Yes ─┐
        ▼
  Set mfaEnabled = true on User
  Return { success: true }
```

### Token Strategy for MFA Challenge

The `mfaToken` is a short-lived JWT (5 minutes) with a restricted payload:

```typescript
{
  sub: userId,
  type: 'mfa-challenge',  // distinguishes from regular access tokens
  iat: timestamp,
  exp: timestamp + 300     // 5 minutes
}
```

This token CANNOT be used to access protected resources — only to complete the MFA verification step via `POST /auth/mfa/verify-login`.

### Encryption Strategy for MFA Secrets

- **TOTP Secret**: Encrypted at rest using AES-256-GCM with a server-side key (`MFA_ENCRYPTION_KEY` env var). Stored as `iv:authTag:ciphertext` in the `mfaSecret` column.
- **Recovery Codes**: Individually hashed with bcrypt (cost factor 10) before storage. The `mfaRecoveryCodes` column stores a JSON array of hashed codes.
- **Why not just hash the TOTP secret?** The server needs the plaintext secret to verify TOTP codes on every login. Hashing is one-way; encryption is reversible with the key.

---

## Sub-task Mapping

| Sub-task | Scope | Description |
|---|---|---|
| SCRUM-64 | Backend | Prisma schema: add `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes` to User |
| SCRUM-65 | Backend | MFA encryption utility (`CryptoService`) for AES-256-GCM |
| SCRUM-66 | Backend | `POST /auth/mfa/setup` — generate TOTP secret, QR, recovery codes |
| SCRUM-67 | Backend | `POST /auth/mfa/verify-setup` — confirm initial TOTP code, enable MFA |
| SCRUM-68 | Backend | Modify login flow — return `mfaRequired` + `mfaToken` when MFA enabled |
| SCRUM-69 | Backend | `POST /auth/mfa/verify-login` — verify TOTP/recovery code, issue tokens |
| SCRUM-70 | Backend | `DELETE /auth/mfa` — disable MFA with password confirmation |
| SCRUM-71 | Frontend | MFA setup UI on profile page (QR code, verify input, recovery codes display) |
| SCRUM-72 | Frontend | Login MFA step (conditional TOTP input after credentials) |

---

## Endpoint Specification

### POST /auth/mfa/setup

**Guard**: `JwtAuthGuard` (must be authenticated)

**Request**: No body required.

**Response 200**:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeDataUrl": "data:image/png;base64,...",
  "recoveryCodes": [
    "a1b2c3d4e5",
    "f6g7h8i9j0",
    "k1l2m3n4o5",
    "p6q7r8s9t0",
    "u1v2w3x4y5",
    "z6a7b8c9d0",
    "e1f2g3h4i5",
    "j6k7l8m9n0",
    "o1p2q3r4s5",
    "t6u7v8w9x0"
  ]
}
```

**Error 409**: `{ "message": "MFA is already enabled" }`

### POST /auth/mfa/verify-setup

**Guard**: `JwtAuthGuard`

**Request**:
```json
{
  "token": "123456"
}
```

**Response 200**:
```json
{
  "message": "MFA enabled successfully"
}
```

**Error 400**: `{ "message": "Invalid verification code" }`
**Error 400**: `{ "message": "MFA setup not initiated. Call POST /auth/mfa/setup first" }`

### POST /auth/mfa/verify-login

**Guard**: None (public, uses mfaToken)

**Request**:
```json
{
  "mfaToken": "eyJhbGciOiJIUzI1NiIs...",
  "code": "123456"
}
```

OR with recovery code:
```json
{
  "mfaToken": "eyJhbGciOiJIUzI1NiIs...",
  "recoveryCode": "a1b2c3d4e5"
}
```

**Response 200**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { /* SafeUser */ }
}
```

**Error 401**: `{ "message": "Invalid or expired MFA token" }`
**Error 401**: `{ "message": "Invalid MFA code" }`
**Error 401**: `{ "message": "Invalid recovery code" }`

### DELETE /auth/mfa

**Guard**: `JwtAuthGuard`

**Request**:
```json
{
  "password": "CurrentP@ss1"
}
```

**Response 200**:
```json
{
  "message": "MFA disabled successfully"
}
```

**Error 400**: `{ "message": "MFA is not enabled" }`
**Error 401**: `{ "message": "Invalid password" }`

### POST /auth/mfa/recovery-codes (Regenerate)

**Guard**: `JwtAuthGuard`

**Request**:
```json
{
  "password": "CurrentP@ss1"
}
```

**Response 200**:
```json
{
  "recoveryCodes": ["a1b2c3d4e5", "...9 more"]
}
```

### GET /auth/mfa/status

**Guard**: `JwtAuthGuard`

**Response 200**:
```json
{
  "mfaEnabled": true,
  "recoveryCodesRemaining": 8
}
```

### Modified: POST /auth/login

**Response when MFA required (200)**:
```json
{
  "mfaRequired": true,
  "mfaToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response when MFA not required (200)**: Unchanged (returns `accessToken`, `refreshToken`, `user`).

---

## Database Changes

### Prisma Schema Migration

**Migration name**: `add_mfa_fields`

```prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  passwordHash     String?
  firstName        String?
  lastName         String?
  avatarUrl        String?
  role             Role      @default(USER)
  provider         Provider  @default(LOCAL)
  providerId       String?
  emailVerified    Boolean   @default(false)
  isActive         Boolean   @default(true)
  failedAttempts   Int       @default(0)
  lockedUntil      DateTime?
  refreshToken     String?
  mfaEnabled       Boolean   @default(false)   // NEW
  mfaSecret        String?                      // NEW — AES-256-GCM encrypted
  mfaRecoveryCodes String[]  @default([])       // NEW — bcrypt hashed codes
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@map("users")
}
```

### Raw SQL Migration

```sql
ALTER TABLE "users" ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "mfaSecret" TEXT;
ALTER TABLE "users" ADD COLUMN "mfaRecoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MFA_ENCRYPTION_KEY` | Yes (prod) | `dev-mfa-key-change-in-production-32ch` | 32-character key for AES-256-GCM encryption of TOTP secrets |
| `MFA_APP_NAME` | No | `EM NexaCore` | Issuer name displayed in authenticator apps |

---

## Files to Create

### Backend

| File | Purpose |
|---|---|
| `nexacore-api/src/common/services/crypto.service.ts` | AES-256-GCM encrypt/decrypt for MFA secrets |
| `nexacore-api/src/common/services/crypto.module.ts` | Module exporting CryptoService |
| `nexacore-api/src/auth/dto/mfa-verify-setup.dto.ts` | DTO for `POST /auth/mfa/verify-setup` |
| `nexacore-api/src/auth/dto/mfa-verify-login.dto.ts` | DTO for `POST /auth/mfa/verify-login` |
| `nexacore-api/src/auth/dto/mfa-disable.dto.ts` | DTO for `DELETE /auth/mfa` |
| `nexacore-api/src/auth/dto/mfa-regenerate-codes.dto.ts` | DTO for `POST /auth/mfa/recovery-codes` |
| `nexacore-api/src/auth/mfa.service.ts` | MFA business logic (setup, verify, recovery codes) |
| `nexacore-api/src/auth/mfa.controller.ts` | MFA endpoints controller |
| `nexacore-api/src/auth/tests/mfa.service.spec.ts` | Unit tests for MfaService |
| `nexacore-api/src/auth/tests/mfa.controller.spec.ts` | Unit tests for MfaController |
| `nexacore-api/src/common/services/tests/crypto.service.spec.ts` | Unit tests for CryptoService |
| `nexacore-api/prisma/migrations/YYYYMMDDHHMMSS_add_mfa_fields/migration.sql` | Database migration |

### Frontend

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/components/profile/MfaSetup.tsx` | MFA setup card with QR code, verify input, recovery codes display |
| `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` | TOTP input step shown after password during login |

---

## Files to Modify

### Backend

| File | Changes |
|---|---|
| `nexacore-api/prisma/schema.prisma` | Add `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes` fields to User model |
| `nexacore-api/src/users/entities/user.entity.ts` | Add `mfaEnabled` to User interface; add to SafeUser (exclude `mfaSecret` and `mfaRecoveryCodes`) |
| `nexacore-api/src/auth/auth.service.ts` | Modify `login()` to return `mfaRequired` + `mfaToken` when user has MFA enabled |
| `nexacore-api/src/auth/auth.controller.ts` | Import and register MFA routes OR delegate to `MfaController` |
| `nexacore-api/src/auth/auth.module.ts` | Register `MfaService`, `MfaController`, `CryptoModule` |
| `nexacore-api/src/users/users.service.ts` | Add MFA-related data access methods |
| `nexacore-api/package.json` | Add `otplib` and `qrcode` dependencies |

### Frontend

| File | Changes |
|---|---|
| `nexacore-dashboard/src/lib/types.ts` | Add `mfaEnabled` to SafeUser; add `MfaSetupResponse`, `LoginResponse` union type |
| `nexacore-dashboard/src/context/AuthContext.tsx` | Modify `login()` to handle `mfaRequired` response; add `verifyMfaLogin()` method |
| `nexacore-dashboard/src/components/auth/LoginForm.tsx` | Add `'mfa'` step after password when `mfaRequired` is returned |
| `nexacore-dashboard/src/app/profile/page.tsx` | Add `MfaSetup` component to profile sections |
| `nexacore-dashboard/package.json` | Add `qrcode.react` dependency |

---

## Implementation Steps

### Step 1: Install Dependencies (SCRUM-64)

**Backend**:
```bash
cd em-ecosystem-code/nexacore-api
npm install otplib qrcode
npm install -D @types/qrcode
```

**Frontend**:
```bash
cd em-ecosystem-code/nexacore-dashboard
npm install qrcode.react
```

### Step 2: Prisma Schema Migration (SCRUM-64)

**File**: `nexacore-api/prisma/schema.prisma`

```prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  passwordHash     String?
  firstName        String?
  lastName         String?
  avatarUrl        String?
  role             Role      @default(USER)
  provider         Provider  @default(LOCAL)
  providerId       String?
  emailVerified    Boolean   @default(false)
  isActive         Boolean   @default(true)
  failedAttempts   Int       @default(0)
  lockedUntil      DateTime?
  refreshToken     String?
  mfaEnabled       Boolean   @default(false)
  mfaSecret        String?
  mfaRecoveryCodes String[]  @default([])
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@map("users")
}
```

Run migration:
```bash
cd nexacore-api
npx prisma migrate dev --name add_mfa_fields
```

### Step 3: Update User Entity (SCRUM-64)

**File**: `nexacore-api/src/users/entities/user.entity.ts`

```typescript
import { Role } from '../enums/role.enum';
import { Provider } from '../enums/provider.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: Role;
  provider: Provider;
  providerId: string | null;
  emailVerified: boolean;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  refreshToken: string | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaRecoveryCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash' | 'refreshToken' | 'mfaSecret' | 'mfaRecoveryCodes'>;

export function toSafeUser(user: User): SafeUser {
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    provider: user.provider,
    providerId: user.providerId,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    failedAttempts: user.failedAttempts,
    lockedUntil: user.lockedUntil,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return safeUser;
}
```

### Step 4: CryptoService (SCRUM-65)

**File**: `nexacore-api/src/common/services/crypto.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor() {
    const envKey =
      process.env.MFA_ENCRYPTION_KEY ||
      'dev-mfa-key-change-in-production-32ch';
    // Ensure exactly 32 bytes for AES-256
    this.key = Buffer.from(envKey.padEnd(32, '0').slice(0, 32), 'utf-8');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all hex-encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  }
}
```

**File**: `nexacore-api/src/common/services/crypto.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { CryptoService } from './crypto.service';

@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
```

### Step 5: MFA DTOs (SCRUM-66, SCRUM-69, SCRUM-70)

**File**: `nexacore-api/src/auth/dto/mfa-verify-setup.dto.ts`

```typescript
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaVerifySetupDto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  token: string;
}
```

**File**: `nexacore-api/src/auth/dto/mfa-verify-login.dto.ts`

```typescript
import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MfaVerifyLoginDto {
  @ApiProperty({
    description: 'Temporary MFA challenge token from login response',
  })
  @IsString()
  mfaToken: string;

  @ApiPropertyOptional({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Single-use recovery code (if TOTP unavailable)',
    example: 'a1b2c3d4e5',
  })
  @IsOptional()
  @IsString()
  recoveryCode?: string;
}
```

**File**: `nexacore-api/src/auth/dto/mfa-disable.dto.ts`

```typescript
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaDisableDto {
  @ApiProperty({
    description: 'Current account password for confirmation',
    example: 'SecureP@ss1',
  })
  @IsString()
  password: string;
}
```

**File**: `nexacore-api/src/auth/dto/mfa-regenerate-codes.dto.ts`

```typescript
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaRegenerateCodesDto {
  @ApiProperty({
    description: 'Current account password for confirmation',
    example: 'SecureP@ss1',
  })
  @IsString()
  password: string;
}
```

### Step 6: MfaService (SCRUM-66, SCRUM-67, SCRUM-69, SCRUM-70)

**File**: `nexacore-api/src/auth/mfa.service.ts`

```typescript
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { CryptoService } from '../common/services/crypto.service';
import { UsersService } from '../users/users.service';
import { User, SafeUser, toSafeUser } from '../users/entities/user.entity';
import type { StringValue } from 'ms';

const BCRYPT_ROUNDS_RECOVERY = 10;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;
const MFA_TOKEN_EXPIRY = '5m';

@Injectable()
export class MfaService {
  private readonly appName: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
  ) {
    this.appName = process.env.MFA_APP_NAME || 'EM NexaCore';
  }

  /**
   * Generate TOTP secret, QR code, and recovery codes.
   * Does NOT enable MFA — user must call verify-setup first.
   */
  async setupMfa(
    userId: string,
  ): Promise<{ secret: string; qrCodeDataUrl: string; recoveryCodes: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled');
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();

    // Generate OTP Auth URI for QR code
    const otpauthUrl = authenticator.keyuri(user.email, this.appName, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes();

    // Hash recovery codes for storage
    const hashedCodes = await Promise.all(
      recoveryCodes.map((code) => bcrypt.hash(code, BCRYPT_ROUNDS_RECOVERY)),
    );

    // Encrypt TOTP secret for storage
    const encryptedSecret = this.cryptoService.encrypt(secret);

    // Store encrypted secret and hashed recovery codes (MFA not yet enabled)
    await this.usersService.updateMfaSetupData(
      userId,
      encryptedSecret,
      hashedCodes,
    );

    return {
      secret,
      qrCodeDataUrl,
      recoveryCodes,
    };
  }

  /**
   * Verify the initial TOTP code and enable MFA on the user account.
   */
  async verifySetup(userId: string, token: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException(
        'MFA setup not initiated. Call POST /auth/mfa/setup first',
      );
    }

    // Decrypt stored secret
    const secret = this.cryptoService.decrypt(user.mfaSecret);

    // Verify TOTP code
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable MFA
    await this.usersService.enableMfa(userId);
  }

  /**
   * Generate MFA challenge token for two-step login.
   */
  generateMfaToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, type: 'mfa-challenge' },
      { expiresIn: MFA_TOKEN_EXPIRY as StringValue },
    );
  }

  /**
   * Verify TOTP code during login and issue full auth tokens.
   */
  async verifyLoginCode(
    mfaToken: string,
    code?: string,
    recoveryCode?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    if (!code && !recoveryCode) {
      throw new BadRequestException(
        'Either code or recoveryCode must be provided',
      );
    }

    // Validate MFA challenge token
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify<{ sub: string; type: string }>(mfaToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (payload.type !== 'mfa-challenge') {
      throw new UnauthorizedException('Invalid MFA token type');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (code) {
      // Verify TOTP code
      const secret = this.cryptoService.decrypt(user.mfaSecret);
      const isValid = authenticator.verify({ token: code, secret });
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    } else if (recoveryCode) {
      // Verify recovery code
      const codeIndex = await this.findMatchingRecoveryCode(
        recoveryCode,
        user.mfaRecoveryCodes,
      );
      if (codeIndex === -1) {
        throw new UnauthorizedException('Invalid recovery code');
      }

      // Remove used recovery code
      const updatedCodes = [...user.mfaRecoveryCodes];
      updatedCodes.splice(codeIndex, 1);
      await this.usersService.updateRecoveryCodes(user.id, updatedCodes);
    }

    // Return full auth tokens (delegated back to AuthService)
    return { accessToken: '', refreshToken: '', user: toSafeUser(user) };
  }

  /**
   * Disable MFA on account after password confirmation.
   */
  async disableMfa(userId: string, password: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password confirmation required but no password set',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.usersService.disableMfa(userId);
  }

  /**
   * Regenerate recovery codes (requires password confirmation).
   */
  async regenerateRecoveryCodes(
    userId: string,
    password: string,
  ): Promise<string[]> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password confirmation required but no password set',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const recoveryCodes = this.generateRecoveryCodes();
    const hashedCodes = await Promise.all(
      recoveryCodes.map((code) => bcrypt.hash(code, BCRYPT_ROUNDS_RECOVERY)),
    );

    await this.usersService.updateRecoveryCodes(userId, hashedCodes);

    return recoveryCodes;
  }

  /**
   * Get MFA status for user (enabled + remaining recovery codes).
   */
  async getMfaStatus(
    userId: string,
  ): Promise<{ mfaEnabled: boolean; recoveryCodesRemaining: number }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      mfaEnabled: user.mfaEnabled,
      recoveryCodesRemaining: user.mfaRecoveryCodes.length,
    };
  }

  // ── Private helpers ──

  private generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      let code = '';
      for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    return codes;
  }

  private async findMatchingRecoveryCode(
    plainCode: string,
    hashedCodes: string[],
  ): Promise<number> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(plainCode, hashedCodes[i]);
      if (isMatch) return i;
    }
    return -1;
  }
}
```

### Step 7: MfaController (SCRUM-66, SCRUM-67, SCRUM-69, SCRUM-70)

**File**: `nexacore-api/src/auth/mfa.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MfaVerifySetupDto } from './dto/mfa-verify-setup.dto';
import { MfaVerifyLoginDto } from './dto/mfa-verify-login.dto';
import { MfaDisableDto } from './dto/mfa-disable.dto';
import { MfaRegenerateCodesDto } from './dto/mfa-regenerate-codes.dto';
import { SafeUser } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly authService: AuthService,
  ) {}

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate TOTP secret and QR code for MFA setup' })
  @ApiResponse({ status: 200, description: 'MFA setup data returned' })
  @ApiResponse({ status: 409, description: 'MFA is already enabled' })
  async setup(@Request() req: { user: SafeUser }) {
    return this.mfaService.setupMfa(req.user.id);
  }

  @Post('verify-setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify TOTP code and enable MFA' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifySetup(
    @Request() req: { user: SafeUser },
    @Body() dto: MfaVerifySetupDto,
  ) {
    await this.mfaService.verifySetup(req.user.id, dto.token);
    return { message: 'MFA enabled successfully' };
  }

  @Post('verify-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP/recovery code during login' })
  @ApiResponse({ status: 200, description: 'MFA verified, tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid MFA code or token' })
  async verifyLogin(@Body() dto: MfaVerifyLoginDto) {
    // verifyLoginCode validates the mfaToken and the code/recoveryCode
    const { user } = await this.mfaService.verifyLoginCode(
      dto.mfaToken,
      dto.code,
      dto.recoveryCode,
    );
    // Generate full auth tokens via AuthService
    const tokens = await this.authService.generateTokensForMfa(user.id);
    return { ...tokens, user };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA (requires password confirmation)' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'MFA is not enabled' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async disable(
    @Request() req: { user: SafeUser },
    @Body() dto: MfaDisableDto,
  ) {
    await this.mfaService.disableMfa(req.user.id, dto.password);
    return { message: 'MFA disabled successfully' };
  }

  @Post('recovery-codes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate recovery codes (requires password)' })
  @ApiResponse({ status: 200, description: 'New recovery codes generated' })
  async regenerateCodes(
    @Request() req: { user: SafeUser },
    @Body() dto: MfaRegenerateCodesDto,
  ) {
    const recoveryCodes = await this.mfaService.regenerateRecoveryCodes(
      req.user.id,
      dto.password,
    );
    return { recoveryCodes };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get MFA status and remaining recovery codes' })
  @ApiResponse({ status: 200, description: 'MFA status returned' })
  async status(@Request() req: { user: SafeUser }) {
    return this.mfaService.getMfaStatus(req.user.id);
  }
}
```

### Step 8: Modify AuthService — Two-Step Login (SCRUM-68)

**File**: `nexacore-api/src/auth/auth.service.ts`

Changes to the `login()` method and new `generateTokensForMfa()` method:

```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, SafeUser, toSafeUser } from '../users/entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import type { StringValue } from 'ms';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;

type LoginResult =
  | { accessToken: string; refreshToken: string; user: SafeUser }
  | { mfaRequired: true; mfaToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: toSafeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account locked. Try again later.');
    }

    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      const updated = await this.usersService.incrementFailedAttempts(user.id);
      if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await this.usersService.lockAccount(user.id);
        throw new ForbiddenException('Account locked. Try again later.');
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failedAttempts > 0) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    // ── MFA check ──
    if (user.mfaEnabled) {
      const mfaToken = this.jwtService.sign(
        { sub: user.id, type: 'mfa-challenge' },
        { expiresIn: '5m' as StringValue },
      );
      return { mfaRequired: true, mfaToken };
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: toSafeUser(user),
    };
  }

  /**
   * Generate full auth tokens after MFA verification.
   * Called by MfaController.verifyLogin after TOTP/recovery code validation.
   */
  async generateTokensForMfa(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.generateTokens(user);
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isRefreshValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokens(user);
  }

  async validateOAuthUser(
    profile: OAuthProfile,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const user = await this.usersService.findOrCreateByOAuth(profile);
    const tokens = await this.generateTokens(user);
    return { ...tokens, user: toSafeUser(user) };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as StringValue,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }
}
```

### Step 9: UsersService — MFA Data Access Methods (SCRUM-64)

Add these methods to `nexacore-api/src/users/users.service.ts`:

```typescript
// ── MFA data access methods (SCRUM-28) ──

async updateMfaSetupData(
  userId: string,
  encryptedSecret: string,
  hashedRecoveryCodes: string[],
): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      mfaSecret: encryptedSecret,
      mfaRecoveryCodes: hashedRecoveryCodes,
    },
  });
}

async enableMfa(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });
}

async disableMfa(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaRecoveryCodes: [],
    },
  });
}

async updateRecoveryCodes(
  userId: string,
  hashedCodes: string[],
): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: { mfaRecoveryCodes: hashedCodes },
  });
}
```

### Step 10: Update AuthModule (SCRUM-66)

**File**: `nexacore-api/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';
import { CryptoModule } from '../common/services/crypto.module';

@Module({
  imports: [
    UsersModule,
    CryptoModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
      },
    }),
  ],
  controllers: [AuthController, MfaController],
  providers: [
    AuthService,
    MfaService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

### Step 11: Frontend Types (SCRUM-71, SCRUM-72)

**File**: `nexacore-dashboard/src/lib/types.ts`

Add/modify these types:

```typescript
export type SafeUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  provider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  providerId: string | null;
  emailVerified: boolean;
  isActive: boolean;
  mfaEnabled: boolean; // NEW
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

// NEW — Login can return either full auth or MFA challenge
export type LoginResponse =
  | AuthResponse
  | { mfaRequired: true; mfaToken: string };

// NEW — MFA setup response
export type MfaSetupResponse = {
  secret: string;
  qrCodeDataUrl: string;
  recoveryCodes: string[];
};

// NEW — MFA status response
export type MfaStatusResponse = {
  mfaEnabled: boolean;
  recoveryCodesRemaining: number;
};
```

### Step 12: Update AuthContext — MFA Login Flow (SCRUM-72)

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

```typescript
'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { apiClient } from '@/lib/api';
import type { SafeUser, AuthResponse, LoginResponse } from '@/lib/types';

/* ===== State ===== */

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaToken: string | null;
};

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SafeUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'MFA_REQUIRED'; payload: { mfaToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isLoading: false,
        isInitialized: true,
        error: null,
        mfaRequired: false,
        mfaToken: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload,
        mfaRequired: false,
        mfaToken: null,
      };
    case 'MFA_REQUIRED':
      return {
        ...state,
        isLoading: false,
        error: null,
        mfaRequired: true,
        mfaToken: action.payload.mfaToken,
      };
    case 'LOGOUT':
      return {
        user: null,
        accessToken: null,
        isLoading: false,
        isInitialized: true,
        error: null,
        mfaRequired: false,
        mfaToken: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

/* ===== Context ===== */

type AuthContextType = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfaLogin: (code: string, isRecoveryCode?: boolean) => Promise<void>;
  cancelMfa: () => void;
  register: (email: string, password: string) => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ===== Helpers ===== */

type ApiError = { error?: { message?: string; details?: string[] } };

function extractErrorMessage(err: unknown, fallback: string): string {
  const errObj = err as ApiError;
  const details = errObj?.error?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return errObj?.error?.message ?? fallback;
}

function isMfaResponse(
  data: LoginResponse,
): data is { mfaRequired: true; mfaToken: string } {
  return 'mfaRequired' in data && data.mfaRequired === true;
}

/* ===== Provider ===== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    mfaRequired: false,
    mfaToken: null,
  });

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!res.ok) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      const { accessToken } = (await res.json()) as { accessToken: string };
      apiClient.setAccessToken(accessToken);
      const user = await apiClient.get<SafeUser>('/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
    } catch {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      // Check if MFA is required
      if (isMfaResponse(data)) {
        dispatch({
          type: 'MFA_REQUIRED',
          payload: { mfaToken: data.mfaToken },
        });
        return;
      }

      // No MFA — complete login as normal
      await fetch('/api/auth/set-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: data.refreshToken }),
      });
      apiClient.setAccessToken(data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Login failed. Please try again.'),
      });
    }
  }, []);

  const verifyMfaLogin = useCallback(
    async (code: string, isRecoveryCode = false) => {
      if (!state.mfaToken) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: 'No MFA challenge in progress',
        });
        return;
      }

      dispatch({ type: 'AUTH_START' });
      try {
        const body: Record<string, string> = { mfaToken: state.mfaToken };
        if (isRecoveryCode) {
          body.recoveryCode = code;
        } else {
          body.code = code;
        }

        const data = await apiClient.post<AuthResponse>(
          '/auth/mfa/verify-login',
          body,
        );

        await fetch('/api/auth/set-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: data.refreshToken }),
        });
        apiClient.setAccessToken(data.accessToken);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.user, accessToken: data.accessToken },
        });
      } catch (err: unknown) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: extractErrorMessage(
            err,
            'MFA verification failed. Please try again.',
          ),
        });
      }
    },
    [state.mfaToken],
  );

  const cancelMfa = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
      });
      await fetch('/api/auth/set-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: data.refreshToken }),
      });
      apiClient.setAccessToken(data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(
          err,
          'Registration failed. Please try again.',
        ),
      });
    }
  }, []);

  const handleOAuthCallback = useCallback(
    async (accessToken: string, refreshToken: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        await fetch('/api/auth/set-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        apiClient.setAccessToken(accessToken);
        const user = await apiClient.get<SafeUser>('/auth/me');
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
      } catch (err: unknown) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: extractErrorMessage(err, 'OAuth authentication failed.'),
        });
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      apiClient.clearAccessToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user && !!state.accessToken,
        login,
        verifyMfaLogin,
        cancelMfa,
        register,
        handleOAuthCallback,
        logout,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ===== Hook ===== */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Step 13: MFA TOTP Step Component — Login (SCRUM-72)

**File**: `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx`

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import { useAuth } from '@/hooks/useAuth';

export default function MfaTotpStep() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const { verifyMfaLogin, cancelMfa, isLoading, error, clearError } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!useRecovery) {
      inputRefs.current[0]?.focus();
    }
  }, [useRecovery]);

  const handleDigitChange = (index: number, value: string) => {
    clearError();
    if (!/^\d*$/.test(value)) return; // Only digits

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // Only last character
    setDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (newDigits.every((d) => d !== '') && newDigits.join('').length === 6) {
      verifyMfaLogin(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      verifyMfaLogin(pasted);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    verifyMfaLogin(recoveryCode.trim(), true);
  };

  const showError = !!error;

  if (useRecovery) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Title Group */}
        <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Recovery Code
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              Enter one of your single-use recovery codes to sign in without
              your authenticator app.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="w-full md:w-[348px]">
          <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-2">
            <div className="flex min-h-[116px] flex-col gap-2">
              <label className="text-body-sm font-medium text-content-primary">
                Recovery Code
              </label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => {
                  clearError();
                  setRecoveryCode(e.target.value);
                }}
                placeholder="e.g. a1b2c3d4e5"
                autoFocus
                className={`h-12 w-full rounded-md border px-4 text-base text-content-primary placeholder:text-content-disabled bg-surface-primary outline-none transition-colors focus:border-border-focus ${
                  showError ? 'border-error' : 'border-border-default'
                }`}
              />

              <div className={`flex items-center gap-2 ${showError ? 'min-h-6' : 'h-6'}`}>
                {showError && (
                  <>
                    <AlertTriangle size={16} className="shrink-0 text-error" />
                    <span className="flex-1 text-xs leading-6 text-error">{error}</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !recoveryCode.trim()}
              className="relative flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none"
            >
              <span className={isLoading ? 'opacity-30' : ''}>Verify</span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>

            <div className="mt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setUseRecovery(false);
                  setRecoveryCode('');
                }}
                className="flex items-center gap-1 text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
              >
                <ArrowLeft size={14} />
                Back to TOTP
              </button>
              <button
                type="button"
                onClick={cancelMfa}
                className="text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
              >
                Cancel sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group */}
      <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-3 md:max-w-[300px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-subtle">
            <ShieldCheck size={20} className="text-content-primary" />
          </div>
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Two-Factor Authentication
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            Enter the 6-digit code from your authenticator app to complete sign
            in.
          </p>
        </div>
      </div>

      {/* TOTP Input */}
      <div className="w-full md:w-[348px]">
        <div className="flex flex-col gap-2">
          <label className="text-body-sm font-medium text-content-primary">
            Verification Code
          </label>

          {/* 6-digit code input */}
          <div className="flex gap-2" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`h-14 w-14 rounded-md border text-center text-xl font-semibold text-content-primary bg-surface-primary outline-none transition-colors focus:border-border-focus ${
                  showError ? 'border-error' : 'border-border-default'
                }`}
              />
            ))}
          </div>

          {/* Error message */}
          <div className={`flex items-center gap-2 ${showError ? 'min-h-6' : 'h-6'}`}>
            {showError && (
              <>
                <AlertTriangle size={16} className="shrink-0 text-error" />
                <span className="flex-1 text-xs leading-6 text-error">{error}</span>
              </>
            )}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <InfinitySpinner />
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                clearError();
                setUseRecovery(true);
                setDigits(Array(6).fill(''));
              }}
              className="text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
            >
              Use recovery code
            </button>
            <button
              type="button"
              onClick={cancelMfa}
              className="text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
            >
              Cancel sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 14: Update LoginForm — Add MFA Step (SCRUM-72)

**File**: `nexacore-dashboard/src/components/auth/LoginForm.tsx`

Add MFA step handling. Import `MfaTotpStep` and render it when `mfaRequired` is true. The key change is at the top of the component:

```tsx
// Add to imports:
import MfaTotpStep from './MfaTotpStep';

// Inside LoginForm component, before the existing step checks:
export default function LoginForm() {
  const [step, setStep] = useState<LoginStep>('email');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const {
    login,
    isLoading,
    isAuthenticated,
    error,
    clearError,
    mfaRequired, // NEW
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ... existing useEffect hooks ...

  // NEW: If MFA is required, show the TOTP step
  if (mfaRequired) {
    return <MfaTotpStep />;
  }

  // ... rest of existing code (email step, password step) ...
}
```

Full modified type at top of file:

```tsx
type LoginStep = 'email' | 'password';
```

The `mfaRequired` state is managed by AuthContext, not by local component state, so no new local step value is needed. When the login response triggers `MFA_REQUIRED`, `mfaRequired` becomes `true` in the context and `LoginForm` renders `MfaTotpStep`.

### Step 15: MFA Setup Component — Profile Page (SCRUM-71)

**File**: `nexacore-dashboard/src/components/profile/MfaSetup.tsx`

```tsx
'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldOff, Copy, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { MfaSetupResponse, MfaStatusResponse } from '@/lib/types';

type SetupStep = 'idle' | 'qr' | 'verify' | 'recovery' | 'complete';

export default function MfaSetup() {
  const { user, refreshSession } = useAuth();

  const [step, setStep] = useState<SetupStep>('idle');
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [mfaStatus, setMfaStatus] = useState<MfaStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Disable MFA state
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  // Regenerate codes state
  const [regenPassword, setRegenPassword] = useState('');
  const [showRegen, setShowRegen] = useState(false);

  const isMfaEnabled = user?.mfaEnabled ?? false;

  // ── Fetch MFA status ──
  const fetchStatus = async () => {
    try {
      const data = await apiClient.get<MfaStatusResponse>('/auth/mfa/status');
      setMfaStatus(data);
    } catch {
      // Silently fail
    }
  };

  // Load status on first render if MFA is enabled
  useState(() => {
    if (isMfaEnabled) fetchStatus();
  });

  // ── Setup Flow ──
  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.post<MfaSetupResponse>('/auth/mfa/setup', {});
      setSetupData(data);
      setRecoveryCodes(data.recoveryCodes);
      setStep('qr');
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/mfa/verify-setup', { token: verifyCode });
      setStep('recovery');
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = async () => {
    setStep('complete');
    setSuccess('MFA has been enabled successfully.');
    await refreshSession(); // Refresh user data to reflect mfaEnabled: true
    fetchStatus();
  };

  // ── Disable MFA ──
  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.delete('/auth/mfa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });
      setSuccess('MFA has been disabled.');
      setShowDisable(false);
      setDisablePassword('');
      setStep('idle');
      setMfaStatus(null);
      await refreshSession();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  // ── Regenerate Recovery Codes ──
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.post<{ recoveryCodes: string[] }>(
        '/auth/mfa/recovery-codes',
        { password: regenPassword },
      );
      setRecoveryCodes(data.recoveryCodes);
      setShowRegen(false);
      setRegenPassword('');
      setStep('recovery');
      setSuccess('Recovery codes regenerated. Save them securely.');
      fetchStatus();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || 'Failed to regenerate codes');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──
  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setSuccess('Recovery codes copied to clipboard.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const downloadRecoveryCodes = () => {
    const content = `EM NexaCore Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nEach code can only be used once.\nStore these codes in a safe place.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexacore-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
        Two-Factor Authentication
      </h2>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-error/10 p-3">
          <AlertTriangle size={16} className="shrink-0 text-error" />
          <span className="text-caption text-error">{error}</span>
        </div>
      )}

      {success && (
        <p className="mb-4 text-caption text-success">{success}</p>
      )}

      {/* ── MFA Enabled State ── */}
      {isMfaEnabled && step !== 'recovery' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <ShieldCheck size={20} className="text-success" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-primary">
                MFA is enabled
              </p>
              {mfaStatus && (
                <p className="text-caption text-content-tertiary">
                  {mfaStatus.recoveryCodesRemaining} recovery code
                  {mfaStatus.recoveryCodesRemaining !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowRegen(!showRegen)}
            >
              <RefreshCw size={14} />
              Regenerate Codes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => setShowDisable(!showDisable)}
            >
              <ShieldOff size={14} />
              Disable MFA
            </Button>
          </div>

          {/* Regenerate codes form */}
          {showRegen && (
            <form onSubmit={handleRegenerateCodes} className="mt-4 space-y-3 rounded-lg border border-border-default p-4">
              <p className="text-caption text-content-tertiary">
                This will invalidate all existing recovery codes. Enter your
                password to confirm.
              </p>
              <Input
                label="Password"
                type="password"
                name="regenPassword"
                value={regenPassword}
                onChange={(e) => setRegenPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={loading}>
                  Regenerate
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowRegen(false);
                    setRegenPassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Disable MFA form */}
          {showDisable && (
            <form onSubmit={handleDisableMfa} className="mt-4 space-y-3 rounded-lg border border-error/30 bg-error/5 p-4">
              <p className="text-caption text-error">
                Disabling MFA will make your account less secure. Enter your
                password to confirm.
              </p>
              <Input
                label="Password"
                type="password"
                name="disablePassword"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="danger" loading={loading}>
                  Disable MFA
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowDisable(false);
                    setDisablePassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── MFA Not Enabled — Idle State ── */}
      {!isMfaEnabled && step === 'idle' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-subtle">
              <ShieldOff size={20} className="text-content-tertiary" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-primary">
                MFA is not enabled
              </p>
              <p className="text-caption text-content-tertiary">
                Add an extra layer of security to your account with a
                time-based one-time password.
              </p>
            </div>
          </div>

          <Button type="button" size="md" onClick={handleStartSetup} loading={loading}>
            <ShieldCheck size={16} />
            Enable MFA
          </Button>
        </div>
      )}

      {/* ── QR Code Step ── */}
      {step === 'qr' && setupData && (
        <div className="space-y-4">
          <p className="text-body-sm text-content-secondary">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, 1Password, etc.), then enter the 6-digit code below.
          </p>

          <div className="flex justify-center rounded-lg border border-border-default bg-white p-6">
            <QRCodeSVG
              value={`otpauth://totp/${encodeURIComponent(user?.email || '')}?secret=${setupData.secret}&issuer=${encodeURIComponent('EM NexaCore')}`}
              size={200}
              level="M"
            />
          </div>

          <div className="rounded-lg bg-surface-subtle p-3">
            <p className="text-caption text-content-tertiary">
              Can&apos;t scan? Enter this key manually:
            </p>
            <p className="mt-1 select-all font-mono text-body-sm font-medium text-content-primary">
              {setupData.secret}
            </p>
          </div>

          <form onSubmit={handleVerifySetup} className="space-y-3">
            <Input
              label="Verification Code"
              type="text"
              name="verifyCode"
              value={verifyCode}
              onChange={(e) => {
                setError('');
                setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              }}
              placeholder="Enter 6-digit code"
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" size="md" loading={loading} disabled={verifyCode.length !== 6}>
                Verify & Enable
              </Button>
              <Button
                type="button"
                size="md"
                variant="secondary"
                onClick={() => {
                  setStep('idle');
                  setSetupData(null);
                  setVerifyCode('');
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Recovery Codes Step ── */}
      {step === 'recovery' && recoveryCodes.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <p className="text-body-sm font-medium text-warning">
              Save your recovery codes
            </p>
            <p className="mt-1 text-caption text-content-secondary">
              These codes can be used to sign in if you lose access to your
              authenticator app. Each code can only be used once. Store them
              somewhere safe.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border-default bg-surface-subtle p-4">
            {recoveryCodes.map((code, i) => (
              <span key={i} className="font-mono text-body-sm text-content-primary">
                {i + 1}. {code}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={copyRecoveryCodes}>
              <Copy size={14} />
              Copy
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={downloadRecoveryCodes}>
              <Download size={14} />
              Download
            </Button>
          </div>

          <Button
            type="button"
            size="md"
            fullWidth
            onClick={handleSetupComplete}
          >
            I&apos;ve saved my codes
          </Button>
        </div>
      )}

      {/* ── Complete Step ── */}
      {step === 'complete' && (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <ShieldCheck size={20} className="text-success" />
          </div>
          <p className="text-body-sm font-medium text-content-primary">
            MFA is now enabled on your account.
          </p>
        </div>
      )}
    </div>
  );
}
```

### Step 16: Update Profile Page (SCRUM-71)

**File**: `nexacore-dashboard/src/app/profile/page.tsx`

```tsx
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import ProfileForm from '@/components/profile/ProfileForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import MfaSetup from '@/components/profile/MfaSetup';
import AccountInfo from '@/components/profile/AccountInfo';
import ConnectedAccounts from '@/components/profile/ConnectedAccounts';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <h1 className="mb-6 text-body-sm font-semibold text-content-primary">Profile</h1>
        <div className="max-w-2xl space-y-6">
          <ProfileForm />
          <ChangePasswordForm />
          <MfaSetup />
          <AccountInfo />
          <ConnectedAccounts />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

## Testing Checklist

### Backend Unit Tests — MFA Service (SCRUM-66, SCRUM-67, SCRUM-69, SCRUM-70)

- [ ] `setupMfa()` generates secret, QR code data URL, and 10 recovery codes
- [ ] `setupMfa()` throws `ConflictException` if MFA already enabled
- [ ] `setupMfa()` stores encrypted secret and hashed recovery codes
- [ ] `verifySetup()` accepts valid TOTP code and enables MFA
- [ ] `verifySetup()` rejects invalid TOTP code with `BadRequestException`
- [ ] `verifySetup()` throws if no setup was initiated (`mfaSecret` is null)
- [ ] `verifyLoginCode()` accepts valid TOTP code and returns user data
- [ ] `verifyLoginCode()` rejects invalid TOTP code with `UnauthorizedException`
- [ ] `verifyLoginCode()` accepts valid recovery code and removes it from stored codes
- [ ] `verifyLoginCode()` rejects invalid recovery code
- [ ] `verifyLoginCode()` rejects expired mfaToken
- [ ] `verifyLoginCode()` rejects mfaToken with wrong type
- [ ] `disableMfa()` clears `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes`
- [ ] `disableMfa()` rejects wrong password
- [ ] `disableMfa()` throws if MFA not enabled
- [ ] `regenerateRecoveryCodes()` generates 10 new codes, replaces old ones
- [ ] `regenerateRecoveryCodes()` rejects wrong password
- [ ] `getMfaStatus()` returns correct enabled state and code count

### Backend Unit Tests — CryptoService (SCRUM-65)

- [ ] `encrypt()` produces different output for same input (random IV)
- [ ] `decrypt()` correctly reverses `encrypt()`
- [ ] `decrypt()` throws on tampered ciphertext (GCM auth tag validation)
- [ ] `decrypt()` throws on invalid format

### Backend Unit Tests — AuthService Login Modification (SCRUM-68)

- [ ] `login()` returns `mfaRequired: true` + `mfaToken` when user has MFA enabled
- [ ] `login()` returns normal tokens when user has MFA disabled
- [ ] `mfaToken` contains `type: 'mfa-challenge'` in payload
- [ ] `mfaToken` expires in 5 minutes
- [ ] `generateTokensForMfa()` produces valid access + refresh tokens

### Backend Integration Tests

- [ ] Full MFA setup flow: setup -> verify -> login with MFA -> verify-login
- [ ] Login with recovery code after MFA setup
- [ ] Recovery code is consumed (cannot reuse)
- [ ] Disable MFA -> login no longer requires MFA
- [ ] Regenerate codes -> old codes invalid, new codes work

### Frontend Tests — MFA Login Step (SCRUM-72)

- [ ] Login with MFA-enabled account shows TOTP input step
- [ ] 6-digit code auto-submits on completion
- [ ] Paste 6-digit code works
- [ ] "Use recovery code" switches to recovery code input
- [ ] "Back to TOTP" returns to digit input
- [ ] "Cancel sign in" returns to email step
- [ ] Invalid code shows error message
- [ ] Expired mfaToken shows error and returns to login

### Frontend Tests — MFA Setup (SCRUM-71)

- [ ] Profile shows "MFA is not enabled" with Enable button when disabled
- [ ] Enable MFA shows QR code and manual key
- [ ] Entering valid 6-digit code progresses to recovery codes step
- [ ] Recovery codes can be copied to clipboard
- [ ] Recovery codes can be downloaded as text file
- [ ] "I've saved my codes" completes setup
- [ ] Profile shows "MFA is enabled" with remaining code count after setup
- [ ] Disable MFA form requires password confirmation
- [ ] Regenerate codes form requires password confirmation
- [ ] Cancel buttons return to appropriate states

### Build Verification

- [ ] `nest build` succeeds (nexacore-api)
- [ ] `next build` succeeds (nexacore-dashboard)
- [ ] No TypeScript errors
- [ ] Prisma migration applies cleanly

---

## Error Handling

| Scenario | HTTP Status | Error Message | Handling |
|---|---|---|---|
| Setup MFA when already enabled | 409 | `MFA is already enabled` | Frontend shows error in card |
| Verify setup with invalid code | 400 | `Invalid verification code` | Frontend shows inline error |
| Verify setup without calling setup first | 400 | `MFA setup not initiated` | Frontend shows error |
| Login MFA verify with expired token | 401 | `Invalid or expired MFA token` | Frontend returns to login |
| Login MFA verify with invalid TOTP | 401 | `Invalid MFA code` | Frontend shows inline error |
| Login MFA verify with invalid recovery code | 401 | `Invalid recovery code` | Frontend shows inline error |
| Disable MFA with wrong password | 401 | `Invalid password` | Frontend shows inline error |
| Disable MFA when not enabled | 400 | `MFA is not enabled` | Frontend prevents action |
| Regenerate codes with wrong password | 401 | `Invalid password` | Frontend shows inline error |
| Neither `code` nor `recoveryCode` provided | 400 | `Either code or recoveryCode must be provided` | DTO validation |

---

## Non-Functional Requirements

| Requirement | Implementation |
|---|---|
| **TOTP secret encryption at rest** | AES-256-GCM with `MFA_ENCRYPTION_KEY` env variable |
| **Recovery code hashing** | bcrypt with cost factor 10 (lower than passwords since codes are random) |
| **MFA token expiry** | 5-minute TTL on JWT challenge token |
| **Rate limiting** | MFA verify-login should be rate-limited to 5 attempts per mfaToken (future: SCRUM rate limit ticket) |
| **TOTP window** | Default `otplib` window of 1 (accepts previous + next 30s window) |
| **Recovery code entropy** | 10 characters from `[a-z0-9]` = ~51 bits of entropy per code |
| **No secret in logs** | TOTP secrets never logged; only encrypted form persisted |
| **Graceful degradation** | If `MFA_ENCRYPTION_KEY` not set, falls back to dev key with console warning |

---

## Dependencies

### Backend (nexacore-api)

| Package | Version | Purpose |
|---|---|---|
| `otplib` | ^12.0.1 | TOTP secret generation and verification (RFC 6238) |
| `qrcode` | ^1.5.4 | QR code generation as data URL |
| `@types/qrcode` | ^1.5.5 | TypeScript types for qrcode (devDependency) |

### Frontend (nexacore-dashboard)

| Package | Version | Purpose |
|---|---|---|
| `qrcode.react` | ^4.1.0 | React component for rendering QR codes as SVG |

---

## Documentation Updates

| Document | Changes |
|---|---|
| `ai-specs/specs/api-spec.yml` | Add MFA endpoints: `/auth/mfa/setup`, `/auth/mfa/verify-setup`, `/auth/mfa/verify-login`, `/auth/mfa`, `/auth/mfa/recovery-codes`, `/auth/mfa/status`; update `/auth/login` response schema to union type |
| `ai-specs/specs/data-model.md` | Add `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes` fields to User entity |
| `ai-specs/specs/backend-standards.mdc` | Add MFA encryption policy section; document `MFA_ENCRYPTION_KEY` env requirement |
| `.env.example` | Add `MFA_ENCRYPTION_KEY` and `MFA_APP_NAME` variables |

---

## Definition of Done

- [ ] Prisma migration `add_mfa_fields` applied successfully
- [ ] All 6 MFA API endpoints implemented and documented in Swagger
- [ ] Login flow returns `mfaRequired` when user has MFA enabled
- [ ] TOTP secrets encrypted at rest with AES-256-GCM
- [ ] Recovery codes hashed with bcrypt before storage
- [ ] 10 single-use recovery codes generated at MFA setup
- [ ] Recovery codes consumed on use (count decrements)
- [ ] MFA can be enabled, disabled, and recovery codes regenerated from profile
- [ ] Frontend QR code setup flow works end-to-end
- [ ] Frontend login MFA challenge with 6-digit input works
- [ ] Frontend recovery code login works
- [ ] Unit tests for MfaService, CryptoService, AuthService changes
- [ ] `nest build` passes with no errors
- [ ] `next build` passes with no errors
- [ ] No TypeScript errors in either project
- [ ] All new environment variables documented
- [ ] Swagger documentation updated for all new/modified endpoints
