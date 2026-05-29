# Fullstack Implementation Spec: SCRUM-26 Token Lifecycle & Session Management

## Overview

Comprehensive implementation of secure token lifecycle management and user session tracking for the EM NexaCore platform. This story replaces the current single-refresh-token-per-user model with a full **refresh token rotation** system backed by a **Session** database model. It introduces **token family tracking** for theft detection, a **session management API** for listing and revoking active sessions, and a **frontend session viewer** in the profile/security settings.

**Epic**: SCRUM-22 — Auth Security Hardening & Enterprise Features
**Story**: SCRUM-26 — Token Lifecycle & Session Management
**Priority**: HIGH (Layer 4 of 8)

### Sub-tasks

| Key | Summary |
|---|---|
| SCRUM-50 | Refresh token rotation with old-token invalidation |
| SCRUM-51 | Token family tracking and theft detection |
| SCRUM-52 | Session model: store active sessions in database |
| SCRUM-53 | `GET /auth/sessions` — list active sessions |
| SCRUM-54 | `DELETE /auth/sessions/:id` and `DELETE /auth/sessions` — revocation |
| SCRUM-55 | Refresh token in httpOnly cookie (backend cookie support) |
| SCRUM-56 | Frontend session viewer in profile/security settings |

---

## Architecture Context

### Current State (Pre-SCRUM-26)

```
User model:
  refreshToken: String?  ← single bcrypt-hashed refresh token per user

Flow:
  1. Login/Register → generateTokens() → signs AT (15m) + RT (7d)
  2. RT hash stored on User.refreshToken
  3. POST /auth/refresh → body: { refreshToken } → verify JWT → bcrypt.compare against User.refreshToken → issue new pair
  4. Logout → sets User.refreshToken = null
  5. Frontend: RT stored in httpOnly cookie via Next.js API route /api/auth/set-tokens
  6. Frontend: /api/auth/refresh reads cookie, forwards RT to backend, rotates cookie if new RT returned
```

**Limitations**:
- Only one session per user (single refreshToken field)
- No token rotation — same RT valid for its entire 7d lifetime
- No theft detection — if RT is stolen, attacker has full 7d window
- No session visibility — users cannot see or manage active sessions
- No device/IP tracking

### Target State (Post-SCRUM-26)

```
Session model (NEW):
  id, userId, tokenFamily, refreshTokenHash, deviceInfo, ipAddress, userAgent,
  createdAt, lastUsedAt, expiresAt, isRevoked

Flow:
  1. Login/Register → generateTokens() → creates Session record with tokenFamily (UUIDv4)
  2. RT payload includes { sub, sessionId, family } — signed JWT
  3. POST /auth/refresh → verify JWT → look up Session by id →
     a. If session.isRevoked → THEFT DETECTED → revoke ALL sessions in family → 401
     b. If session valid → mark old session revoked → create NEW session (same family) → issue new AT + RT
  4. GET /auth/sessions → return user's active (non-revoked, non-expired) sessions
  5. DELETE /auth/sessions/:id → revoke specific session
  6. DELETE /auth/sessions → revoke ALL user sessions (logout everywhere)
  7. Logout → revokes current session only
  8. Backend sets RT in httpOnly cookie directly via Set-Cookie header (no body)

User model:
  refreshToken field → REMOVED (replaced by Session model)
```

### Token Family Theft Detection

```
Normal rotation:
  RT-1 (family=A) → RT-2 (family=A) → RT-3 (family=A)
  Each rotation marks the previous session record as revoked.

Theft scenario:
  Attacker steals RT-1 after user already rotated to RT-2.
  Attacker tries POST /auth/refresh with RT-1 →
    Lookup: Session for RT-1 has isRevoked=true →
    THEFT DETECTED: Revoke ALL sessions where family=A →
    Both attacker and user are logged out → user must re-authenticate.
```

### Cookie Architecture

```
Backend (NestJS):
  POST /auth/login      → Response body: { accessToken, user }
                           Set-Cookie: refresh_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800
  POST /auth/refresh     → Response body: { accessToken }
                           Set-Cookie: refresh_token=<newJWT>; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800
  POST /auth/logout      → Response body: { message }
                           Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=0

Frontend (Next.js):
  /api/auth/refresh route → reads refresh_token from cookie → forwards to backend
                           → proxies Set-Cookie header from backend response
  /api/auth/set-tokens   → DEPRECATED (backend now sets cookie directly)
```

---

## Endpoint Specification

### Modified Endpoints

#### `POST /auth/login`

**Changes**: Response no longer includes `refreshToken` in body. Backend sets refresh token as httpOnly cookie. Captures `deviceInfo`, `ipAddress`, `userAgent` from request headers.

```
Request:
  Body: { email: string, password: string }
  Headers: User-Agent (auto)

Response 200:
  Body: { accessToken: string, user: SafeUser }
  Set-Cookie: refresh_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800
```

#### `POST /auth/register`

**Changes**: Same cookie behavior as login.

```
Request:
  Body: { email: string, password: string }

Response 201:
  Body: { accessToken: string, user: SafeUser }
  Set-Cookie: refresh_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800
```

#### `POST /auth/refresh`

**Changes**: Reads refresh token from cookie instead of body. Performs token rotation with family tracking. Sets new cookie.

```
Request:
  Cookie: refresh_token=<JWT>
  (No body required — RefreshTokenDto removed from this endpoint)

Response 200:
  Body: { accessToken: string }
  Set-Cookie: refresh_token=<newJWT>; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800

Response 401 (token reuse / theft detected):
  Body: { statusCode: 401, message: "Token reuse detected. All sessions revoked.", error: "Unauthorized" }
  Set-Cookie: refresh_token=; Max-Age=0 (clear)

Response 401 (expired/invalid):
  Body: { statusCode: 401, message: "Invalid or expired refresh token", error: "Unauthorized" }
```

#### `POST /auth/logout`

**Changes**: Revokes current session (identified by refresh token in cookie). Clears cookie.

```
Request:
  Cookie: refresh_token=<JWT>
  Headers: Authorization: Bearer <accessToken>

Response 200:
  Body: { message: "Logged out successfully" }
  Set-Cookie: refresh_token=; Max-Age=0
```

#### OAuth Callbacks (`GET /auth/google/callback`, `GET /auth/github/callback`)

**Changes**: Redirect URL no longer includes refreshToken as query param. Instead, redirect includes a short-lived authorization code that the frontend exchanges. (Intermediate approach: continue passing tokens in URL but frontend immediately persists via set-tokens route, then SCRUM-26 transitions to backend setting the cookie on the redirect response itself.)

```
Response 302:
  Location: {frontendUrl}/auth/callback?accessToken={AT}
  Set-Cookie: refresh_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800
```

### New Endpoints

#### `GET /auth/sessions`

**Description**: Returns all active (non-revoked, non-expired) sessions for the authenticated user.

```
Request:
  Headers: Authorization: Bearer <accessToken>

Response 200:
  Body: {
    sessions: [
      {
        id: string,
        deviceInfo: string | null,
        ipAddress: string,
        userAgent: string | null,
        createdAt: string (ISO),
        lastUsedAt: string (ISO),
        expiresAt: string (ISO),
        isCurrent: boolean
      }
    ]
  }
```

#### `DELETE /auth/sessions/:id`

**Description**: Revokes a specific session by ID. Users can only revoke their own sessions.

```
Request:
  Headers: Authorization: Bearer <accessToken>
  Params: id (UUID)

Response 200:
  Body: { message: "Session revoked successfully" }
  (If revoking current session, also clears refresh_token cookie)

Response 404:
  Body: { statusCode: 404, message: "Session not found", error: "Not Found" }
```

#### `DELETE /auth/sessions`

**Description**: Revokes ALL sessions for the authenticated user (logout everywhere). Clears the refresh token cookie.

```
Request:
  Headers: Authorization: Bearer <accessToken>

Response 200:
  Body: { message: "All sessions revoked successfully" }
  Set-Cookie: refresh_token=; Max-Age=0
```

---

## Database Changes

### New Model: Session

```prisma
model Session {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenFamily      String
  refreshTokenHash String
  deviceInfo       String?
  ipAddress        String
  userAgent        String?
  isRevoked        Boolean  @default(false)
  createdAt        DateTime @default(now())
  lastUsedAt       DateTime @default(now())
  expiresAt        DateTime

  @@index([userId])
  @@index([tokenFamily])
  @@index([userId, isRevoked])
  @@map("sessions")
}
```

### Modified Model: User

```prisma
model User {
  // ... existing fields ...
  refreshToken   String?        // REMOVE this field
  sessions       Session[]      // ADD relation
  // ... rest ...
}
```

### Migration SQL

```sql
-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenFamily" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_tokenFamily_idx" ON "sessions"("tokenFamily");

-- CreateIndex
CREATE INDEX "sessions_userId_isRevoked_idx" ON "sessions"("userId", "isRevoked");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Remove refreshToken from users
ALTER TABLE "users" DROP COLUMN "refreshToken";
```

---

## Files to Create

### Backend

| File | Purpose |
|---|---|
| `nexacore-api/src/sessions/sessions.module.ts` | Sessions module registration |
| `nexacore-api/src/sessions/sessions.service.ts` | Session CRUD, token family operations, revocation logic |
| `nexacore-api/src/sessions/entities/session.entity.ts` | Session type and SessionResponse DTO |
| `nexacore-api/src/sessions/dto/session-response.dto.ts` | API response shape for sessions |
| `nexacore-api/src/auth/decorators/cookies.decorator.ts` | Custom `@Cookies()` parameter decorator |
| `nexacore-api/src/auth/interfaces/refresh-token-payload.interface.ts` | Typed payload for refresh tokens |
| `nexacore-api/src/auth/strategies/jwt-refresh.strategy.ts` | Passport strategy extracting RT from cookie |
| `nexacore-api/src/auth/guards/jwt-refresh-auth.guard.ts` | Guard using jwt-refresh strategy |
| `nexacore-api/prisma/migrations/YYYYMMDD_add_sessions_model/migration.sql` | Migration for Session table + User.refreshToken removal |
| `nexacore-api/tests/auth/token-rotation.spec.ts` | Unit tests for token rotation logic |
| `nexacore-api/tests/auth/session-management.spec.ts` | Unit tests for session endpoints |
| `nexacore-api/tests/auth/theft-detection.spec.ts` | Unit tests for token family theft detection |

### Frontend

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/components/profile/ActiveSessions.tsx` | Session viewer component with revoke actions |
| `nexacore-dashboard/src/app/api/auth/refresh/route.ts` | MODIFIED — updated to proxy cookie-based refresh |

---

## Files to Modify

### Backend

| File | Changes |
|---|---|
| `nexacore-api/prisma/schema.prisma` | Add Session model, add `sessions Session[]` to User, remove `refreshToken String?` |
| `nexacore-api/src/auth/auth.module.ts` | Import SessionsModule, register new strategies/guards |
| `nexacore-api/src/auth/auth.service.ts` | Rewrite `generateTokens()` to create Session records, rewrite `refreshTokens()` with rotation + family tracking, add session-aware logout, add cookie setting |
| `nexacore-api/src/auth/auth.controller.ts` | Add session endpoints, switch refresh to cookie-based, add `@Res()` for cookie setting, add device info extraction |
| `nexacore-api/src/users/users.service.ts` | Remove `updateRefreshToken()` method (replaced by SessionsService) |
| `nexacore-api/src/users/entities/user.entity.ts` | Remove `refreshToken` from User interface and SafeUser Omit |
| `nexacore-api/src/auth/strategies/jwt.strategy.ts` | No changes needed (access token strategy unchanged) |
| `nexacore-api/src/common/interfaces/jwt-payload.interface.ts` | No changes (access token payload unchanged) |

### Frontend

| File | Changes |
|---|---|
| `nexacore-dashboard/src/context/AuthContext.tsx` | Remove refreshToken from login/register body handling; refresh via cookie only; add `sessions` state management |
| `nexacore-dashboard/src/lib/api.ts` | Ensure `credentials: 'include'` on all backend calls for cookie forwarding |
| `nexacore-dashboard/src/lib/types.ts` | Add `Session` type, `SessionsResponse` type |
| `nexacore-dashboard/src/app/api/auth/set-tokens/route.ts` | DEPRECATE — kept for backward compat but simplified |
| `nexacore-dashboard/src/app/api/auth/refresh/route.ts` | Update to forward cookies and proxy Set-Cookie headers |
| `nexacore-dashboard/src/app/api/auth/logout/route.ts` | Update to forward cookie to backend for session-aware logout |
| `nexacore-dashboard/src/app/profile/page.tsx` | Add ActiveSessions component |

---

## Implementation Steps

### Step 1: Prisma Schema — Add Session Model (SCRUM-52)

**File**: `nexacore-api/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  SUPERADMIN
  ADMIN
  USER
}

enum Provider {
  LOCAL
  GOOGLE
  GITHUB
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String?
  firstName      String?
  lastName       String?
  avatarUrl      String?
  role           Role      @default(USER)
  provider       Provider  @default(LOCAL)
  providerId     String?
  emailVerified  Boolean   @default(false)
  isActive       Boolean   @default(true)
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  sessions       Session[]

  @@map("users")
}

model Session {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenFamily      String
  refreshTokenHash String
  deviceInfo       String?
  ipAddress        String
  userAgent        String?
  isRevoked        Boolean  @default(false)
  createdAt        DateTime @default(now())
  lastUsedAt       DateTime @default(now())
  expiresAt        DateTime

  @@index([userId])
  @@index([tokenFamily])
  @@index([userId, isRevoked])
  @@map("sessions")
}
```

Run migration:

```bash
cd nexacore-api
npx prisma migrate dev --name add_sessions_remove_user_refresh_token
```

---

### Step 2: Session Entity and DTO (SCRUM-52)

**File**: `nexacore-api/src/sessions/entities/session.entity.ts`

```typescript
export interface Session {
  id: string;
  userId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  isRevoked: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

export interface SessionResponse {
  id: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function toSessionResponse(
  session: Session,
  currentSessionId?: string,
): SessionResponse {
  return {
    id: session.id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt.toISOString(),
    lastUsedAt: session.lastUsedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    isCurrent: session.id === currentSessionId,
  };
}
```

---

### Step 3: Sessions Service (SCRUM-50, SCRUM-51, SCRUM-52)

**File**: `nexacore-api/src/sessions/sessions.service.ts`

```typescript
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Session, SessionResponse, toSessionResponse } from './entities/session.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new session record for a user.
   * Used on login, register, and OAuth callback.
   */
  async createSession(params: {
    userId: string;
    refreshToken: string;
    tokenFamily?: string;
    deviceInfo?: string | null;
    ipAddress: string;
    userAgent?: string | null;
    expiresAt: Date;
  }): Promise<Session> {
    const refreshTokenHash = await bcrypt.hash(params.refreshToken, BCRYPT_ROUNDS);
    const tokenFamily = params.tokenFamily || crypto.randomUUID();

    return this.prisma.session.create({
      data: {
        userId: params.userId,
        tokenFamily,
        refreshTokenHash,
        deviceInfo: params.deviceInfo || null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent || null,
        expiresAt: params.expiresAt,
      },
    }) as Promise<Session>;
  }

  /**
   * Find a session by ID. Returns null if not found.
   */
  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    }) as Promise<Session | null>;
  }

  /**
   * Rotate a refresh token: revoke the old session, create a new one in the same family.
   * If the old session is already revoked, this is a THEFT DETECTION event —
   * revoke ALL sessions in the token family and throw.
   */
  async rotateRefreshToken(params: {
    oldSessionId: string;
    oldRefreshToken: string;
    newRefreshToken: string;
    ipAddress: string;
    userAgent?: string | null;
    expiresAt: Date;
  }): Promise<Session> {
    const oldSession = await this.findById(params.oldSessionId);

    if (!oldSession) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Check if session has expired
    if (oldSession.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // THEFT DETECTION: If the session is already revoked, an old token is being reused.
    // Revoke ALL sessions in the token family to protect the user.
    if (oldSession.isRevoked) {
      await this.revokeAllByFamily(oldSession.tokenFamily);
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked for security.',
      );
    }

    // Verify the refresh token hash matches
    const isValid = await bcrypt.compare(
      params.oldRefreshToken,
      oldSession.refreshTokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the old session
    await this.prisma.session.update({
      where: { id: params.oldSessionId },
      data: { isRevoked: true },
    });

    // Create new session in the same token family
    return this.createSession({
      userId: oldSession.userId,
      refreshToken: params.newRefreshToken,
      tokenFamily: oldSession.tokenFamily,
      deviceInfo: oldSession.deviceInfo,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent || oldSession.userAgent,
      expiresAt: params.expiresAt,
    });
  }

  /**
   * Revoke ALL sessions in a token family (theft detection).
   */
  async revokeAllByFamily(tokenFamily: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenFamily, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke a single session by ID. Verifies ownership.
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.findById(sessionId);

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke ALL sessions for a user (logout everywhere).
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Get all active (non-revoked, non-expired) sessions for a user.
   */
  async getActiveSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponse[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return (sessions as Session[]).map((s) =>
      toSessionResponse(s, currentSessionId),
    );
  }

  /**
   * Clean up expired sessions (can be called by a cron job).
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    return result.count;
  }
}
```

---

### Step 4: Sessions Module (SCRUM-52)

**File**: `nexacore-api/src/sessions/sessions.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
```

---

### Step 5: Refresh Token Payload Interface (SCRUM-50)

**File**: `nexacore-api/src/auth/interfaces/refresh-token-payload.interface.ts`

```typescript
export interface RefreshTokenPayload {
  sub: string;       // userId
  sessionId: string; // session record ID
  family: string;    // token family UUID for theft detection
}
```

---

### Step 6: Cookies Decorator (SCRUM-55)

**File**: `nexacore-api/src/auth/decorators/cookies.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extract a specific cookie value from the request.
 * Usage: @Cookies('refresh_token') refreshToken: string
 */
export const Cookies = createParamDecorator(
  (cookieName: string, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return cookieName ? request.cookies?.[cookieName] : request.cookies;
  },
);
```

---

### Step 7: Rewrite AuthService (SCRUM-50, SCRUM-51, SCRUM-55)

**File**: `nexacore-api/src/auth/auth.service.ts`

```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, SafeUser, toSafeUser } from '../users/entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import type { StringValue } from 'ms';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;

/** Parse a duration string like '7d' or '15m' into milliseconds */
function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000;
  }
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface CookieConfig {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
  };
}

@Injectable()
export class AuthService {
  private readonly refreshExpiration: string;
  private readonly refreshMaxAgeMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {
    this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
    this.refreshMaxAgeMs = parseDurationMs(this.refreshExpiration);
  }

  async register(
    dto: RegisterDto,
    requestMeta: { ipAddress: string; userAgent?: string; deviceInfo?: string },
  ): Promise<{ accessToken: string; user: SafeUser; cookie: CookieConfig }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    const result = await this.generateTokens(user, requestMeta);

    return {
      accessToken: result.accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(result.refreshToken),
    };
  }

  async login(
    dto: LoginDto,
    requestMeta: { ipAddress: string; userAgent?: string; deviceInfo?: string },
  ): Promise<{ accessToken: string; user: SafeUser; cookie: CookieConfig }> {
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

    const result = await this.generateTokens(user, requestMeta);

    return {
      accessToken: result.accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(result.refreshToken),
    };
  }

  async refreshTokens(
    refreshToken: string,
    requestMeta: { ipAddress: string; userAgent?: string },
  ): Promise<{ accessToken: string; cookie: CookieConfig }> {
    // 1. Verify JWT signature and extract payload
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Look up user
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 3. Generate new tokens FIRST (need the raw RT for the new session)
    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
    });

    const expiresAt = new Date(Date.now() + this.refreshMaxAgeMs);
    const newSessionId = crypto.randomUUID();

    const newRefreshToken = this.jwtService.sign(
      {
        sub: user.id,
        sessionId: newSessionId,
        family: payload.family,
      } satisfies RefreshTokenPayload,
      {
        expiresIn: this.refreshExpiration as StringValue,
      },
    );

    // 4. Rotate in SessionsService (validates old session, detects theft, creates new)
    // We pass the pre-generated session ID concept — but actually SessionsService.rotateRefreshToken
    // creates the session record. The newSessionId in the JWT must match.
    // Better approach: let rotateRefreshToken return the new session, then sign the JWT.
    // Rewrite to two-phase:

    // Phase A: Validate old session and revoke it (with theft detection)
    const newSession = await this.sessionsService.rotateRefreshToken({
      oldSessionId: payload.sessionId,
      oldRefreshToken: refreshToken,
      newRefreshToken: newRefreshToken,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent || null,
      expiresAt,
    });

    // Phase B: Re-sign RT with the actual new session ID from the DB
    const finalRefreshToken = this.jwtService.sign(
      {
        sub: user.id,
        sessionId: newSession.id,
        family: payload.family,
      } satisfies RefreshTokenPayload,
      {
        expiresIn: this.refreshExpiration as StringValue,
      },
    );

    // Update the session's refreshTokenHash to match the final signed token
    const bcryptHash = await bcrypt.hash(finalRefreshToken, BCRYPT_ROUNDS);
    await this.sessionsService.updateSessionHash(newSession.id, bcryptHash);

    return {
      accessToken: newAccessToken,
      cookie: this.buildRefreshCookie(finalRefreshToken),
    };
  }

  async validateOAuthUser(
    profile: OAuthProfile,
    requestMeta: { ipAddress: string; userAgent?: string; deviceInfo?: string },
  ): Promise<{ accessToken: string; user: SafeUser; cookie: CookieConfig }> {
    const user = await this.usersService.findOrCreateByOAuth(profile);
    const result = await this.generateTokens(user, requestMeta);
    return {
      accessToken: result.accessToken,
      user: toSafeUser(user),
      cookie: this.buildRefreshCookie(result.refreshToken),
    };
  }

  async logout(refreshToken: string): Promise<CookieConfig> {
    // Verify token to get session ID, then revoke that session
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
      await this.sessionsService.revokeSession(payload.sessionId, payload.sub);
    } catch {
      // Token is invalid/expired — just clear the cookie
    }

    return this.buildClearCookie();
  }

  async logoutAll(userId: string): Promise<CookieConfig> {
    await this.sessionsService.revokeAllUserSessions(userId);
    return this.buildClearCookie();
  }

  /**
   * Generate access + refresh token pair and create a Session record.
   */
  private async generateTokens(
    user: User,
    requestMeta: { ipAddress: string; userAgent?: string; deviceInfo?: string },
  ): Promise<TokenResult> {
    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
    });

    const tokenFamily = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.refreshMaxAgeMs);

    // Create session record first to get the session ID
    // We'll use a temporary hash, then update after signing
    const tempToken = crypto.randomUUID();
    const session = await this.sessionsService.createSession({
      userId: user.id,
      refreshToken: tempToken, // temporary — will be replaced
      tokenFamily,
      deviceInfo: requestMeta.deviceInfo || null,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent || null,
      expiresAt,
    });

    // Now sign the refresh token with the real session ID
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        sessionId: session.id,
        family: tokenFamily,
      } satisfies RefreshTokenPayload,
      {
        expiresIn: this.refreshExpiration as StringValue,
      },
    );

    // Update session with the actual refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.sessionsService.updateSessionHash(session.id, refreshTokenHash);

    return { accessToken, refreshToken, sessionId: session.id };
  }

  /**
   * Build the Set-Cookie config for a refresh token.
   */
  buildRefreshCookie(refreshToken: string): CookieConfig {
    return {
      name: 'refresh_token',
      value: refreshToken,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: Math.floor(this.refreshMaxAgeMs / 1000), // seconds
      },
    };
  }

  /**
   * Build a Set-Cookie config that clears the refresh token.
   */
  buildClearCookie(): CookieConfig {
    return {
      name: 'refresh_token',
      value: '',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      },
    };
  }
}
```

Add `updateSessionHash` to SessionsService:

```typescript
// Add to nexacore-api/src/sessions/sessions.service.ts

  /**
   * Update the refresh token hash for a session (used after signing the JWT with the session ID).
   */
  async updateSessionHash(sessionId: string, refreshTokenHash: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash },
    });
  }
```

---

### Step 8: Rewrite AuthController (SCRUM-50, SCRUM-53, SCRUM-54, SCRUM-55)

**File**: `nexacore-api/src/auth/auth.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Redirect,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService, CookieConfig } from './auth.service';
import { SessionsService } from '../sessions/sessions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { SafeUser } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Helper: extract request metadata ──

  private extractRequestMeta(req: ExpressRequest): {
    ipAddress: string;
    userAgent: string | undefined;
    deviceInfo: string | undefined;
  } {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'];
    // deviceInfo can be extracted from a custom header or user-agent parsing
    const deviceInfo = req.headers['x-device-info'] as string | undefined;
    return { ipAddress, userAgent, deviceInfo };
  }

  // ── Helper: set cookie on response ──

  private setCookie(res: Response, cookie: CookieConfig): void {
    res.cookie(cookie.name, cookie.value, cookie.options);
  }

  // ── Auth Endpoints ──

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractRequestMeta(req);
    const result = await this.authService.register(registerDto, meta);
    this.setCookie(res, result.cookie);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = this.extractRequestMeta(req);
    const result = await this.authService.login(loginDto, meta);
    this.setCookie(res, result.cookie);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or reused refresh token' })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new (await import('@nestjs/common')).UnauthorizedException(
        'No refresh token provided',
      );
    }

    const meta = this.extractRequestMeta(req);
    try {
      const result = await this.authService.refreshTokens(refreshToken, {
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      this.setCookie(res, result.cookie);
      return { accessToken: result.accessToken };
    } catch (error) {
      // On any auth error, clear the cookie
      this.setCookie(res, this.authService.buildClearCookie());
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    const clearCookie = refreshToken
      ? await this.authService.logout(refreshToken)
      : this.authService.buildClearCookie();
    this.setCookie(res, clearCookie);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Request() req: { user: SafeUser }) {
    return req.user;
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Access admin dashboard (ADMIN role required)' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  getAdminDashboard() {
    return { message: 'Admin access granted' };
  }

  // ── Session Management Endpoints ──

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of active sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(
    @Request() req: { user: SafeUser },
    @Req() rawReq: ExpressRequest,
  ) {
    // Determine current session ID from cookie if available
    let currentSessionId: string | undefined;
    const refreshToken = rawReq.cookies?.['refresh_token'];
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
        currentSessionId = payload.sessionId;
      } catch {
        // Cookie may be expired — that's fine, just don't mark any as current
      }
    }

    const sessions = await this.sessionsService.getActiveSessions(
      req.user.id,
      currentSessionId,
    );
    return { sessions };
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeSession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Request() req: { user: SafeUser },
    @Req() rawReq: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.sessionsService.revokeSession(sessionId, req.user.id);

    // If revoking the current session, clear the cookie
    const refreshToken = rawReq.cookies?.['refresh_token'];
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
        if (payload.sessionId === sessionId) {
          this.setCookie(res, this.authService.buildClearCookie());
        }
      } catch {
        // Token invalid — no cookie to clear
      }
    }

    return { message: 'Session revoked successfully' };
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions (logout everywhere)' })
  @ApiResponse({ status: 200, description: 'All sessions revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeAllSessions(
    @Request() req: { user: SafeUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const clearCookie = await this.authService.logoutAll(req.user.id);
    this.setCookie(res, clearCookie);
    return { message: 'All sessions revoked successfully' };
  }

  // ── OAuth Endpoints ──

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with access token',
  })
  async googleAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; user: SafeUser; cookie: CookieConfig };
    },
    @Res() res: Response,
  ) {
    const { accessToken, cookie } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    this.setCookie(res, cookie);
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}`);
  }

  @Get('github')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub authorization',
  })
  githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with access token',
  })
  async githubAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; user: SafeUser; cookie: CookieConfig };
    },
    @Res() res: Response,
  ) {
    const { accessToken, cookie } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    this.setCookie(res, cookie);
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}`);
  }
}
```

---

### Step 9: Update AuthModule (SCRUM-52)

**File**: `nexacore-api/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

### Step 10: Install cookie-parser Middleware

**File**: `nexacore-api/src/main.ts` (add cookie-parser)

```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

Add to `main.ts`:

```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing for refresh token in httpOnly cookies
  app.use(cookieParser());

  // ... existing CORS config — IMPORTANT: add credentials support
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true, // Required for cookies to be sent cross-origin
  });

  // ... rest of bootstrap
}
```

---

### Step 11: Update User Entity — Remove refreshToken (SCRUM-52)

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
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash'>;

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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return safeUser;
}
```

---

### Step 12: Update UsersService — Remove updateRefreshToken (SCRUM-52)

**File**: `nexacore-api/src/users/users.service.ts`

Remove the `updateRefreshToken` method entirely. Also update `changePassword` to revoke all sessions via SessionsService instead of setting `refreshToken: null`.

```typescript
// In changePassword method, replace:
//   data: { passwordHash: newHash, refreshToken: null }
// with:
//   data: { passwordHash: newHash }
// And after the update, call:
//   await this.sessionsService.revokeAllUserSessions(userId);

// This requires injecting SessionsService into UsersService, or alternatively
// the AuthController/AuthService orchestrates the session revocation after password change.
```

**Recommended approach**: Keep the revocation in the service layer. Add `SessionsModule` to `UsersModule` imports and inject `SessionsService`:

```typescript
// In UsersService constructor:
constructor(
  private readonly prisma: PrismaService,
  private readonly sessionsService: SessionsService,
) {}

// In changePassword:
async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
  const user = await this.findById(userId);
  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!user.passwordHash) {
    throw new ForbiddenException(
      'Password change not available for OAuth accounts',
    );
  }

  const isCurrentValid = await bcrypt.compare(
    dto.currentPassword,
    user.passwordHash,
  );
  if (!isCurrentValid) {
    throw new UnauthorizedException('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

  await this.prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Revoke all sessions — user must re-login
  await this.sessionsService.revokeAllUserSessions(userId);
}
```

Update `UsersModule`:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [PrismaModule, SessionsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

### Step 13: Update OAuth Strategies (SCRUM-55)

The Google and GitHub strategies must pass request metadata to `validateOAuthUser`. Since Passport strategies don't have direct access to `Request`, the approach is:

**File**: `nexacore-api/src/auth/strategies/google.strategy.ts` — update `validate()` to return profile data that the controller uses with `authService.validateOAuthUser()`.

The current pattern already works: the strategy returns profile data, the guard calls `validate`, and the controller receives `req.user`. The change is in the controller (Step 8), where `googleAuthCallback` receives `req.user` containing the cookie config from `authService.validateOAuthUser()`.

Update the strategy's validate method to call `authService.validateOAuthUser` with request metadata:

```typescript
// In GoogleStrategy and GitHubStrategy, the validate() method currently calls
// authService.validateOAuthUser(profile). Update to include request meta:
// Since Passport strategies can access the request by setting passReqToCallback: true.

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: true, // NEW: pass request to validate
    });
  }

  async validate(
    req: ExpressRequest,    // NEW: request object
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
  ) {
    const oauthProfile: OAuthProfile = {
      email: profile.emails[0].value,
      provider: Provider.GOOGLE,
      providerId: profile.id,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatarUrl: profile.photos?.[0]?.value,
    };

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'];

    return this.authService.validateOAuthUser(oauthProfile, {
      ipAddress,
      userAgent,
      deviceInfo: undefined,
    });
  }
}
```

Apply the same pattern to `GitHubStrategy`.

---

### Step 14: Frontend — Update Types (SCRUM-56)

**File**: `nexacore-dashboard/src/lib/types.ts`

Add Session types:

```typescript
// ... existing types ...

export type Session = {
  id: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export type SessionsResponse = {
  sessions: Session[];
};
```

Update `AuthResponse` to no longer include `refreshToken` (the backend now sets it as a cookie):

```typescript
export type AuthResponse = {
  user: SafeUser;
  accessToken: string;
  // refreshToken removed — now in httpOnly cookie set by backend
};
```

---

### Step 15: Frontend — Update ApiClient (SCRUM-55)

**File**: `nexacore-dashboard/src/lib/api.ts`

Add `credentials: 'include'` to all requests to the backend to enable cookie forwarding:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
    };

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include', // ADDED: send cookies with cross-origin requests
        headers: { ...headers, ...(options.headers as Record<string, string>) },
      });
    } catch {
      throw {
        error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
      };
    }

    // Handle 401 with silent refresh
    if (response.status === 401 && this.accessToken) {
      const newToken = await this.silentRefresh();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        let retryResponse: Response;
        try {
          retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            credentials: 'include', // ADDED
            headers: { ...headers, ...(options.headers as Record<string, string>) },
          });
        } catch {
          throw {
            error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
          };
        }
        if (!retryResponse.ok) {
          throw await this.parseErrorResponse(retryResponse);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      throw await this.parseErrorResponse(response);
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  }

  put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async parseErrorResponse(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return {
        error: {
          message: `Server error (${response.status})`,
          code: 'SERVER_ERROR',
          statusCode: response.status,
        },
      };
    }
  }

  private async silentRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!res.ok) return null;
        const data = await res.json();
        this.accessToken = data.accessToken;
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const apiClient = new ApiClient();
```

---

### Step 16: Frontend — Update AuthContext (SCRUM-55, SCRUM-56)

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

Key changes:
- Login/register no longer receive `refreshToken` in body (cookie set by backend)
- Remove `set-tokens` calls for login/register (backend sets cookie via `credentials: 'include'`)
- OAuth callback still needs `set-tokens` temporarily until OAuth redirect sets cookie

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
import type { SafeUser, AuthResponse } from '@/lib/types';

/* ===== State ===== */

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SafeUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
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
      };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, isInitialized: true, error: action.payload };
    case 'LOGOUT':
      return { user: null, accessToken: null, isLoading: false, isInitialized: true, error: null };
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
  register: (email: string, password: string) => Promise<void>;
  handleOAuthCallback: (accessToken: string) => Promise<void>;
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

/* ===== Provider ===== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    error: null,
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

  // Attempt silent refresh on mount to restore session from httpOnly cookie
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Backend sets refresh_token cookie via credentials: 'include'
      const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
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

  const register = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Backend sets refresh_token cookie via credentials: 'include'
      const data = await apiClient.post<AuthResponse>('/auth/register', { email, password });
      apiClient.setAccessToken(data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Registration failed. Please try again.'),
      });
    }
  }, []);

  const handleOAuthCallback = useCallback(
    async (accessToken: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        // Refresh token is already set as cookie by the backend OAuth redirect
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
      // Call backend to revoke session — also clears cookie
      await apiClient.post('/auth/logout');
    } catch {
      // Even if backend call fails, clear local state
    } finally {
      // Also clear via Next.js API route to remove cookie from BFF layer
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
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

---

### Step 17: Frontend — Update BFF Refresh Route (SCRUM-55)

**File**: `nexacore-dashboard/src/app/api/auth/refresh/route.ts`

The BFF route now proxies the cookie to the backend and forwards the Set-Cookie header from the backend response.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    // Forward the refresh token as a cookie to the backend
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    if (!res.ok) {
      const response = NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
      response.cookies.delete('refresh_token');
      return response;
    }

    const data = (await res.json()) as { accessToken: string };
    const response = NextResponse.json({ accessToken: data.accessToken });

    // Proxy the Set-Cookie header from the backend (rotated refresh token)
    const setCookieHeader = res.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse the refresh_token value from the Set-Cookie header
      const match = setCookieHeader.match(/refresh_token=([^;]*)/);
      if (match && match[1]) {
        response.cookies.set('refresh_token', match[1], {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days (matches backend)
          path: '/',
        });
      }
    }

    return response;
  } catch {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
```

---

### Step 18: Frontend — Update BFF Logout Route (SCRUM-54)

**File**: `nexacore-dashboard/src/app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const authHeader = request.headers.get('authorization');

  // Forward logout to backend so it can revoke the session
  if (refreshToken && authHeader) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          Cookie: `refresh_token=${refreshToken}`,
        },
      });
    } catch {
      // Backend call failed — still clear the cookie locally
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('refresh_token');
  return response;
}
```

---

### Step 19: Frontend — Deprecate set-tokens Route (SCRUM-55)

**File**: `nexacore-dashboard/src/app/api/auth/set-tokens/route.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @deprecated SCRUM-26: Backend now sets refresh_token cookie directly.
 * Kept for backward compatibility during OAuth transition.
 * Remove once OAuth callbacks fully use backend cookie setting.
 */
export async function POST(request: NextRequest) {
  const { refreshToken } = (await request.json()) as { refreshToken: string };

  const response = NextResponse.json({ success: true });
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days (matches backend)
    path: '/',
  });

  return response;
}
```

---

### Step 20: Frontend — Active Sessions Component (SCRUM-56)

**File**: `nexacore-dashboard/src/components/profile/ActiveSessions.tsx`

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Session, SessionsResponse } from '@/lib/types';

function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };

  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os };
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SessionsResponse>('/auth/sessions');
      setSessions(data.sessions);
    } catch {
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setError('Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('This will log you out of all devices. Continue?')) return;
    setIsLoading(true);
    try {
      await apiClient.delete('/auth/sessions');
      // User will be logged out — redirect handled by AuthContext
      setSessions([]);
    } catch {
      setError('Failed to revoke all sessions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-body-sm font-semibold text-content-primary">
            Active Sessions
          </h2>
          <p className="text-caption text-content-secondary">
            Manage your active sessions across devices
          </p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAll}
            disabled={isLoading}
            className="rounded-md border border-status-error/30 px-3 py-1.5 text-caption font-medium text-status-error hover:bg-status-error/10 disabled:opacity-50"
          >
            Revoke All
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-status-error/10 p-3 text-caption text-status-error">
          {error}
        </div>
      )}

      {isLoading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="py-4 text-center text-caption text-content-secondary">
          No active sessions found.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const { browser, os } = parseUserAgent(session.userAgent);
            return (
              <div
                key={session.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  session.isCurrent
                    ? 'border-brand-primary/30 bg-brand-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Device icon */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-content-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-xs font-medium text-content-primary">
                        {browser} on {os}
                      </span>
                      {session.isCurrent && (
                        <span className="rounded-full bg-status-success/20 px-2 py-0.5 text-[10px] font-medium text-status-success">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-caption text-content-secondary">
                      <span>{session.ipAddress}</span>
                      <span>·</span>
                      <span>Last active {formatRelativeTime(session.lastUsedAt)}</span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revokingId === session.id}
                    className="rounded-md px-3 py-1.5 text-caption font-medium text-content-secondary hover:bg-surface-raised hover:text-content-primary disabled:opacity-50"
                  >
                    {revokingId === session.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

### Step 21: Frontend — Add ActiveSessions to Profile Page (SCRUM-56)

**File**: `nexacore-dashboard/src/app/profile/page.tsx`

```tsx
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import ProfileForm from '@/components/profile/ProfileForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import AccountInfo from '@/components/profile/AccountInfo';
import ConnectedAccounts from '@/components/profile/ConnectedAccounts';
import ActiveSessions from '@/components/profile/ActiveSessions';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <h1 className="mb-6 text-body-sm font-semibold text-content-primary">Profile</h1>
        <div className="max-w-2xl space-y-6">
          <ProfileForm />
          <ChangePasswordForm />
          <AccountInfo />
          <ConnectedAccounts />
          <ActiveSessions />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

### Step 22: Update OAuthCallbackHandler (SCRUM-55)

**File**: `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx`

Update to only extract `accessToken` from URL params (no more `refreshToken`):

```tsx
// In the callback handler, change the URL parsing:
// Before: const { accessToken, refreshToken } = params;
// After:  const accessToken = params.get('accessToken');
//
// Before: await handleOAuthCallback(accessToken, refreshToken);
// After:  await handleOAuthCallback(accessToken);
//
// The refresh token is already in the httpOnly cookie set by the backend redirect.
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `default-dev-secret-change-in-production` | Secret key for JWT signing |
| `JWT_ACCESS_EXPIRATION` | `15m` | Access token lifetime (short-lived) |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token lifetime (medium-lived) |
| `FRONTEND_URL` | `http://localhost:3001` | Frontend URL for CORS and OAuth redirects |
| `NODE_ENV` | `development` | Determines `Secure` flag on cookies |

---

## Testing Checklist

### Token Rotation (SCRUM-50)

- [ ] Login creates a new Session record in database
- [ ] `POST /auth/refresh` returns a new access token
- [ ] `POST /auth/refresh` sets a new `refresh_token` cookie (rotated)
- [ ] Old refresh token is invalidated (session marked `isRevoked: true`)
- [ ] New refresh token works for subsequent refreshes
- [ ] Expired refresh token returns 401
- [ ] Invalid JWT signature returns 401

### Token Family Theft Detection (SCRUM-51)

- [ ] Reusing a previously-rotated refresh token returns 401 with "Token reuse detected"
- [ ] All sessions in the same token family are revoked upon theft detection
- [ ] Legitimate user is forced to re-authenticate after theft detection
- [ ] Different login sessions have different token families
- [ ] Theft detection does NOT affect sessions from other token families

### Session Model (SCRUM-52)

- [ ] Session record created on login with correct userId, ipAddress, userAgent
- [ ] Session record created on register
- [ ] Session record created on OAuth login
- [ ] Multiple sessions can exist for the same user (multi-device)
- [ ] `expiresAt` matches JWT_REFRESH_EXPIRATION
- [ ] `lastUsedAt` updated on refresh

### Active Sessions Endpoint (SCRUM-53)

- [ ] `GET /auth/sessions` returns only non-revoked, non-expired sessions
- [ ] Sessions sorted by `lastUsedAt` descending (most recent first)
- [ ] Current session marked with `isCurrent: true`
- [ ] Other sessions marked with `isCurrent: false`
- [ ] Response includes `deviceInfo`, `ipAddress`, `userAgent`, timestamps
- [ ] Requires valid access token (401 without)

### Session Revocation (SCRUM-54)

- [ ] `DELETE /auth/sessions/:id` revokes a specific session
- [ ] Cannot revoke another user's session (404)
- [ ] Revoking current session clears the cookie
- [ ] `DELETE /auth/sessions` revokes ALL sessions for the user
- [ ] After revoking all, refresh tokens from all devices fail
- [ ] Logout (`POST /auth/logout`) revokes only the current session

### httpOnly Cookie (SCRUM-55)

- [ ] Refresh token NOT present in response body (login, register, refresh)
- [ ] Refresh token present in `Set-Cookie` header with `HttpOnly` flag
- [ ] Cookie has `Secure` flag in production
- [ ] Cookie has `SameSite=Strict`
- [ ] Cookie path is `/`
- [ ] Cookie `Max-Age` matches JWT_REFRESH_EXPIRATION
- [ ] CORS configured with `credentials: true`
- [ ] Frontend sends `credentials: 'include'` on API requests
- [ ] BFF `/api/auth/refresh` proxies cookie correctly

### Frontend Session Viewer (SCRUM-56)

- [ ] ActiveSessions component renders on profile page
- [ ] Sessions list loads on component mount
- [ ] Current session displays "Current" badge
- [ ] User-Agent parsed into browser/OS display
- [ ] IP address displayed
- [ ] "Last active" shows relative time
- [ ] "Revoke" button on non-current sessions works
- [ ] "Revoke All" button appears when >1 session
- [ ] "Revoke All" shows confirmation dialog
- [ ] Loading state displays spinner
- [ ] Error state displays error message
- [ ] Empty state displays appropriate message

### Regression Tests

- [ ] Existing login flow still works end-to-end
- [ ] Existing register flow still works end-to-end
- [ ] OAuth (Google) login still works
- [ ] OAuth (GitHub) login still works
- [ ] Silent refresh on page load still works
- [ ] ApiClient 401 retry with refresh still works
- [ ] Password change revokes all sessions
- [ ] Admin user management unaffected
- [ ] `nest build` succeeds
- [ ] `next build` succeeds
- [ ] No TypeScript errors

### Unit Test Files

**File**: `nexacore-api/tests/auth/token-rotation.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { SessionsService } from '../../src/sessions/sessions.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('Token Rotation', () => {
  let authService: AuthService;
  let sessionsService: SessionsService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SessionsService,
          useValue: {
            createSession: jest.fn().mockResolvedValue({
              id: 'session-1',
              userId: 'user-1',
              tokenFamily: 'family-1',
            }),
            rotateRefreshToken: jest.fn().mockResolvedValue({
              id: 'session-2',
              userId: 'user-1',
              tokenFamily: 'family-1',
            }),
            updateSessionHash: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: 'user-1',
              email: 'test@example.com',
              role: 'USER',
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-token'),
            verify: jest.fn().mockReturnValue({
              sub: 'user-1',
              sessionId: 'session-1',
              family: 'family-1',
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    sessionsService = module.get<SessionsService>(SessionsService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should rotate refresh token and return new access token', async () => {
    const result = await authService.refreshTokens('old-refresh-token', {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.cookie).toBeDefined();
    expect(result.cookie.name).toBe('refresh_token');
    expect(sessionsService.rotateRefreshToken).toHaveBeenCalled();
  });

  it('should throw on invalid JWT', async () => {
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(
      authService.refreshTokens('invalid-token', {
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when user not found', async () => {
    jest.spyOn(usersService, 'findById').mockResolvedValue(null);

    await expect(
      authService.refreshTokens('valid-token', {
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

**File**: `nexacore-api/tests/auth/theft-detection.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from '../../src/sessions/sessions.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('Token Family Theft Detection', () => {
  let sessionsService: SessionsService;
  let prismaService: PrismaService;

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    tokenFamily: 'family-1',
    refreshTokenHash: '', // set in beforeEach
    deviceInfo: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    isRevoked: false,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    mockSession.refreshTokenHash = await bcrypt.hash('valid-refresh-token', 12);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: {
            session: {
              findUnique: jest.fn().mockResolvedValue(mockSession),
              create: jest.fn().mockResolvedValue({ ...mockSession, id: 'session-2' }),
              update: jest.fn().mockResolvedValue(mockSession),
              updateMany: jest.fn().mockResolvedValue({ count: 3 }),
            },
          },
        },
      ],
    }).compile();

    sessionsService = module.get<SessionsService>(SessionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should detect theft when revoked token is reused', async () => {
    // Mark session as already revoked (simulates previous rotation)
    const revokedSession = { ...mockSession, isRevoked: true };
    jest
      .spyOn(prismaService.session, 'findUnique')
      .mockResolvedValue(revokedSession as never);

    await expect(
      sessionsService.rotateRefreshToken({
        oldSessionId: 'session-1',
        oldRefreshToken: 'stolen-token',
        newRefreshToken: 'new-token',
        ipAddress: '192.168.1.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    ).rejects.toThrow(UnauthorizedException);

    // Verify ALL sessions in family were revoked
    expect(prismaService.session.updateMany).toHaveBeenCalledWith({
      where: { tokenFamily: 'family-1', isRevoked: false },
      data: { isRevoked: true },
    });
  });

  it('should successfully rotate when session is valid', async () => {
    const result = await sessionsService.rotateRefreshToken({
      oldSessionId: 'session-1',
      oldRefreshToken: 'valid-refresh-token',
      newRefreshToken: 'new-refresh-token',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    expect(result.id).toBe('session-2');
    // Verify old session was revoked
    expect(prismaService.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { isRevoked: true },
    });
  });

  it('should throw on expired session', async () => {
    const expiredSession = {
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000),
    };
    jest
      .spyOn(prismaService.session, 'findUnique')
      .mockResolvedValue(expiredSession as never);

    await expect(
      sessionsService.rotateRefreshToken({
        oldSessionId: 'session-1',
        oldRefreshToken: 'valid-refresh-token',
        newRefreshToken: 'new-token',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

**File**: `nexacore-api/tests/auth/session-management.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from '../../src/sessions/sessions.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('Session Management', () => {
  let sessionsService: SessionsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: {
            session: {
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'session-1',
                  userId: 'user-1',
                  tokenFamily: 'family-1',
                  deviceInfo: null,
                  ipAddress: '127.0.0.1',
                  userAgent: 'Chrome/120',
                  isRevoked: false,
                  createdAt: new Date(),
                  lastUsedAt: new Date(),
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                {
                  id: 'session-2',
                  userId: 'user-1',
                  tokenFamily: 'family-2',
                  deviceInfo: null,
                  ipAddress: '192.168.1.1',
                  userAgent: 'Firefox/121',
                  isRevoked: false,
                  createdAt: new Date(),
                  lastUsedAt: new Date(),
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
              ]),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          },
        },
      ],
    }).compile();

    sessionsService = module.get<SessionsService>(SessionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getActiveSessions', () => {
    it('should return active sessions with isCurrent flag', async () => {
      const sessions = await sessionsService.getActiveSessions(
        'user-1',
        'session-1',
      );

      expect(sessions).toHaveLength(2);
      expect(sessions[0].isCurrent).toBe(true);
      expect(sessions[1].isCurrent).toBe(false);
    });

    it('should filter by non-revoked and non-expired', async () => {
      await sessionsService.getActiveSessions('user-1');

      expect(prismaService.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRevoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { lastUsedAt: 'desc' },
      });
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session owned by the user', async () => {
      jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
      } as never);

      await sessionsService.revokeSession('session-1', 'user-1');

      expect(prismaService.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      });
    });

    it('should throw NotFoundException for non-existent session', async () => {
      jest
        .spyOn(prismaService.session, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        sessionsService.revokeSession('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when userId does not match', async () => {
      jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue({
        id: 'session-1',
        userId: 'other-user',
      } as never);

      await expect(
        sessionsService.revokeSession('session-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all non-revoked sessions for a user', async () => {
      await sessionsService.revokeAllUserSessions('user-1');

      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });
});
```

---

## Error Handling

| Scenario | HTTP Status | Error Message | Action |
|---|---|---|---|
| No refresh token cookie | 401 | "No refresh token provided" | Clear cookie, redirect to login |
| JWT signature invalid | 401 | "Invalid or expired refresh token" | Clear cookie, redirect to login |
| JWT expired | 401 | "Invalid or expired refresh token" | Clear cookie, redirect to login |
| Session not found in DB | 401 | "Invalid or expired refresh token" | Clear cookie, redirect to login |
| Session expired in DB | 401 | "Invalid or expired refresh token" | Clear cookie, redirect to login |
| Token reuse detected (theft) | 401 | "Token reuse detected. All sessions revoked for security." | Revoke ALL family sessions, clear cookie, redirect to login |
| bcrypt hash mismatch | 401 | "Invalid or expired refresh token" | Clear cookie, redirect to login |
| Revoke non-existent session | 404 | "Session not found" | — |
| Revoke another user's session | 404 | "Session not found" | — |
| User not found during refresh | 401 | "Invalid or expired refresh token" | Clear cookie, redirect to login |

### Frontend Error Handling

The `ApiClient.silentRefresh()` method already handles 401 errors by returning `null`, which causes the request to fail and `AuthContext` to dispatch `LOGOUT`. No changes needed to the retry logic.

For the `ActiveSessions` component, errors are displayed inline with a retry option. Session revocation errors show a toast/inline message without disrupting the session list.

---

## Non-Functional Requirements

### Security

- **Token rotation**: Every refresh invalidates the previous token, limiting the window of exposure
- **Theft detection**: Token family tracking ensures that if a stolen token is used after rotation, ALL sessions in the family are revoked
- **httpOnly cookies**: Refresh tokens inaccessible to JavaScript (XSS protection)
- **Secure flag**: Cookies only sent over HTTPS in production
- **SameSite=Strict**: Cookies not sent on cross-site requests (CSRF protection)
- **bcrypt hashing**: Refresh token hashes stored (not plaintext) — even database compromise doesn't reveal tokens
- **Short-lived access tokens**: 15-minute expiry limits the damage window if an AT is compromised

### Performance

- **Database indexes**: `sessions` table indexed on `userId`, `tokenFamily`, and `(userId, isRevoked)` for fast lookups
- **Cleanup cron**: Expired/revoked sessions cleaned up periodically to prevent table bloat
- **bcrypt cost**: BCRYPT_ROUNDS=12 balances security and performance (~250ms per hash)

### Scalability

- **Session-per-device model**: Supports unlimited concurrent devices per user
- **Token family isolation**: Theft detection scoped to individual login chains, not entire user
- **Configurable expiry**: `JWT_ACCESS_EXPIRATION` and `JWT_REFRESH_EXPIRATION` tunable via env vars

### Observability

- Log theft detection events with userId, ipAddress, tokenFamily for security monitoring
- Log session creation/revocation for audit trail

---

## Dependencies

### New npm Packages

| Package | Version | Project | Purpose |
|---|---|---|---|
| `cookie-parser` | ^1.4.x | nexacore-api | Parse cookies from incoming requests |
| `@types/cookie-parser` | ^1.4.x | nexacore-api (devDep) | TypeScript types for cookie-parser |

### Existing Dependencies (No Changes)

| Package | Project | Used For |
|---|---|---|
| `@nestjs/jwt` | nexacore-api | JWT signing/verification |
| `bcrypt` | nexacore-api | Refresh token hashing |
| `@prisma/client` | nexacore-api | Database ORM |
| `passport` | nexacore-api | Authentication framework |

---

## Documentation Updates

| File | Changes |
|---|---|
| `ai-specs/specs/api-spec.yml` | Add `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `DELETE /auth/sessions` endpoints; update `POST /auth/refresh` to cookie-based; update `POST /auth/login` and `POST /auth/register` to remove refreshToken from response body |
| `ai-specs/specs/data-model.md` | Add Session entity definition; remove `refreshToken` from User entity |
| `ai-specs/specs/backend-standards.mdc` | Add "Token Lifecycle" section documenting rotation, family tracking, and cookie strategy |
| `ai-specs/specs/frontend-standards.mdc` | Update "Authentication" section to reflect cookie-based refresh flow |

---

## Definition of Done

- [ ] Session model exists in Prisma schema with all fields and indexes
- [ ] Migration runs successfully (`prisma migrate dev`)
- [ ] `refreshToken` field removed from User model
- [ ] `updateRefreshToken` method removed from UsersService
- [ ] SessionsService implements create, rotate, revoke, revokeAll, getActive, cleanupExpired
- [ ] AuthService.generateTokens creates Session record with token family
- [ ] AuthService.refreshTokens performs token rotation with theft detection
- [ ] AuthService.logout revokes current session only
- [ ] AuthService.logoutAll revokes all user sessions
- [ ] AuthController.refresh reads token from httpOnly cookie
- [ ] AuthController sets refresh token cookie on login, register, refresh, OAuth callback
- [ ] AuthController clears cookie on logout and auth errors
- [ ] `GET /auth/sessions` returns active sessions with `isCurrent` flag
- [ ] `DELETE /auth/sessions/:id` revokes specific session with ownership check
- [ ] `DELETE /auth/sessions` revokes all sessions
- [ ] cookie-parser middleware installed and configured
- [ ] CORS configured with `credentials: true`
- [ ] Frontend ApiClient sends `credentials: 'include'`
- [ ] Frontend AuthContext no longer handles refreshToken in response body
- [ ] Frontend BFF `/api/auth/refresh` proxies cookies and Set-Cookie headers
- [ ] Frontend BFF `/api/auth/logout` forwards cookie for session revocation
- [ ] ActiveSessions component displays sessions with device info, IP, timestamps
- [ ] ActiveSessions supports per-session revocation and "revoke all"
- [ ] Profile page includes ActiveSessions component
- [ ] OAuth callback handler updated for cookie-based flow
- [ ] Password change revokes all sessions via SessionsService
- [ ] Token theft detection tested: reused token revokes entire family
- [ ] All unit tests pass
- [ ] `nest build` succeeds with no TypeScript errors
- [ ] `next build` succeeds with no TypeScript errors
- [ ] No refresh token values exposed in response bodies, URLs, or localStorage
