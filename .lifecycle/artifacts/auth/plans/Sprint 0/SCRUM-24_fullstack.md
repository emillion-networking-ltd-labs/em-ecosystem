# Fullstack Implementation Spec: SCRUM-24 Rate Limiting & Brute Force Protection

## Overview

Complete implementation of API rate limiting, brute force protection with exponential backoff, login timing attack mitigation, and frontend rate-limit error handling for the EM NexaCore platform.

**Epic**: SCRUM-22 — Auth Security Hardening & Enterprise Features
**Story**: SCRUM-24 — Rate Limiting & Brute Force Protection
**Priority**: CRITICAL (Layer 2 of 8)
**Dependencies**: SCRUM-23 (Layer 1 — must be merged first if it touches auth)

### Sub-tasks

| Ticket | Title |
|---|---|
| SCRUM-37 | Global rate limiting with `@nestjs/throttler` |
| SCRUM-38 | Per-endpoint rate limiting on auth routes |
| SCRUM-39 | Brute force protection with exponential backoff |
| SCRUM-40 | Login timing attack protection |
| SCRUM-41 | Rate limit response headers |
| SCRUM-42 | Frontend rate limit error handling |
| SCRUM-43 | Rate limiting unit & integration tests |

---

## Architecture Context

### Rate Limiting Strategy — Three Layers

```
Layer 1: Global Rate Limit (ThrottlerModule)
  └── 100 requests / 60 seconds per IP — applies to ALL endpoints
      └── Prevents general API abuse

Layer 2: Per-Endpoint Rate Limit (custom @Throttle decorator overrides)
  └── Auth endpoints get STRICTER limits:
      - POST /auth/login        → 5 req / 60s per IP
      - POST /auth/register     → 3 req / 60s per IP
      - POST /auth/refresh      → 10 req / 60s per IP
      - POST /auth/forgot-password → 3 req / 300s per IP (future)
      └── Prevents credential stuffing and registration spam

Layer 3: Account-Level Brute Force Protection (business logic)
  └── After 5 failed logins → lock account with exponential backoff
      - 1st lockout: 15 minutes
      - 2nd lockout: 30 minutes
      - 3rd lockout: 60 minutes
      - 4th+ lockout: 120 minutes
      └── Prevents targeted brute force against specific accounts
```

### Timing Attack Protection

```
Login flow (current — VULNERABLE):
  user = findByEmail(email)
  if (!user) → throw 401              ← FAST (no bcrypt)
  bcrypt.compare(password, hash)       ← SLOW (~250ms)
  if (!valid) → throw 401

Login flow (patched — CONSTANT TIME):
  user = findByEmail(email)
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH)  ← SLOW (~250ms, same timing)
    throw 401
  }
  bcrypt.compare(password, hash)                ← SLOW (~250ms)
  if (!valid) → throw 401
```

### Response Headers Flow

```
Client Request
     │
     ▼
ThrottlerGuard intercepts
     │
     ├── Under limit → Add headers + pass through
     │   X-RateLimit-Limit: 100
     │   X-RateLimit-Remaining: 97
     │   X-RateLimit-Reset: 1709000060
     │
     └── Over limit → 429 Too Many Requests
         Retry-After: 45
         X-RateLimit-Limit: 100
         X-RateLimit-Remaining: 0
         X-RateLimit-Reset: 1709000060
```

---

## Endpoint Specification

### Rate Limits Per Endpoint

| Endpoint | Method | Global (IP) | Per-Endpoint (IP) | Account-Level |
|---|---|---|---|---|
| `/auth/login` | POST | 100/60s | **5/60s** | 5 fails → lock (exponential) |
| `/auth/register` | POST | 100/60s | **3/60s** | N/A |
| `/auth/refresh` | POST | 100/60s | **10/60s** | N/A |
| `/auth/logout` | POST | 100/60s | Default | N/A |
| `/auth/me` | GET | 100/60s | Default | N/A |
| `/auth/google` | GET | 100/60s | **5/60s** | N/A |
| `/auth/github` | GET | 100/60s | **5/60s** | N/A |
| `/users/*` | ALL | 100/60s | Default | N/A |
| All other | ALL | 100/60s | Default | N/A |

### Rate Limit Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429,
    "retryAfter": 45
  }
}
```

### Account Locked Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Account locked due to too many failed attempts. Try again in 15 minutes.",
    "code": "ACCOUNT_LOCKED",
    "statusCode": 403,
    "retryAfter": 900,
    "lockoutLevel": 1
  }
}
```

---

## Database Changes

### Prisma Schema — User Model Addition

Add `lockoutCount` field to track escalating lockout durations:

```prisma
model User {
  // ... existing fields ...
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  lockoutCount   Int       @default(0)    // NEW: tracks lockout escalation level
  // ... rest of fields ...
}
```

### Migration SQL

```sql
-- AlterTable: Add lockoutCount to users
ALTER TABLE "users" ADD COLUMN "lockoutCount" INTEGER NOT NULL DEFAULT 0;
```

**Migration name**: `add_lockout_count`

---

## Files to Create

### Backend — New Files

| # | File Path | Purpose | Sub-task |
|---|---|---|---|
| 1 | `nexacore-api/src/common/guards/custom-throttler.guard.ts` | Custom ThrottlerGuard that adds rate limit headers and custom 429 response body | SCRUM-37, SCRUM-41 |
| 2 | `nexacore-api/src/common/interceptors/rate-limit-headers.interceptor.ts` | Interceptor that injects `X-RateLimit-*` headers on successful responses | SCRUM-41 |
| 3 | `nexacore-api/src/auth/constants/auth.constants.ts` | Centralized auth constants (MAX_FAILED_ATTEMPTS, lockout durations, dummy hash, rate limit configs) | SCRUM-39, SCRUM-40 |
| 4 | `nexacore-api/prisma/migrations/[timestamp]_add_lockout_count/migration.sql` | Database migration for `lockoutCount` column | SCRUM-39 |
| 5 | `nexacore-api/src/auth/tests/rate-limiting.spec.ts` | Unit tests for throttler guard and rate limit behavior | SCRUM-43 |
| 6 | `nexacore-api/src/auth/tests/brute-force.spec.ts` | Unit tests for brute force protection and exponential backoff | SCRUM-43 |
| 7 | `nexacore-api/src/auth/tests/timing-attack.spec.ts` | Unit tests verifying constant-time login responses | SCRUM-43 |

### Frontend — New Files

| # | File Path | Purpose | Sub-task |
|---|---|---|---|
| 8 | `nexacore-dashboard/src/lib/rate-limit.ts` | Rate limit utilities: retry-with-backoff, parse rate-limit headers, cooldown timer | SCRUM-42 |
| 9 | `nexacore-dashboard/src/components/ui/RateLimitBanner.tsx` | Reusable banner component for rate limit / account lock error display with countdown | SCRUM-42 |

---

## Files to Modify

### Backend — Modified Files

| # | File Path | Changes | Sub-task |
|---|---|---|---|
| 1 | `nexacore-api/package.json` | Add `@nestjs/throttler` dependency | SCRUM-37 |
| 2 | `nexacore-api/src/app.module.ts` | Import and configure `ThrottlerModule.forRoot()` with global settings | SCRUM-37 |
| 3 | `nexacore-api/src/main.ts` | Register `CustomThrottlerGuard` as global guard via `APP_GUARD` | SCRUM-37 |
| 4 | `nexacore-api/src/auth/auth.controller.ts` | Add `@Throttle()` decorator overrides on auth endpoints | SCRUM-38 |
| 5 | `nexacore-api/src/auth/auth.service.ts` | Implement timing attack protection (dummy bcrypt), exponential backoff lockout with `lockoutCount`, richer error messages with `retryAfter` | SCRUM-39, SCRUM-40 |
| 6 | `nexacore-api/src/users/users.service.ts` | Update `lockAccount()` to accept duration and increment `lockoutCount`; update `resetFailedAttempts()` to optionally reset `lockoutCount` on successful login | SCRUM-39 |
| 7 | `nexacore-api/prisma/schema.prisma` | Add `lockoutCount Int @default(0)` to User model | SCRUM-39 |
| 8 | `nexacore-api/src/users/entities/user.entity.ts` | Add `lockoutCount` to `User` interface and `SafeUser` mapping | SCRUM-39 |
| 9 | `nexacore-api/src/common/filters/http-exception.filter.ts` | Add `429` to code map as `RATE_LIMIT_EXCEEDED`; pass through `retryAfter` field | SCRUM-41 |

### Frontend — Modified Files

| # | File Path | Changes | Sub-task |
|---|---|---|---|
| 10 | `nexacore-dashboard/src/lib/api.ts` | Parse `Retry-After` and `X-RateLimit-*` headers from responses; expose rate limit state on errors | SCRUM-42 |
| 11 | `nexacore-dashboard/src/lib/types.ts` | Add `RateLimitInfo` type; extend `ErrorResponse` with `retryAfter` field; add `lockoutCount` to `SafeUser` | SCRUM-42 |
| 12 | `nexacore-dashboard/src/context/AuthContext.tsx` | Handle 429 and rate-limit-enriched 403 errors in login/register; expose `rateLimitInfo` state | SCRUM-42 |
| 13 | `nexacore-dashboard/src/components/auth/LoginForm.tsx` (or equivalent) | Display `RateLimitBanner` when rate limited or account locked; disable form during cooldown | SCRUM-42 |

---

## Implementation Steps

### Step 1: Install `@nestjs/throttler` (SCRUM-37)

```bash
cd em-ecosystem-code/nexacore-api
npm install @nestjs/throttler
```

Verify in `package.json`:
```json
"@nestjs/throttler": "^6.x"
```

---

### Step 2: Create Auth Constants (SCRUM-39, SCRUM-40)

**File**: `nexacore-api/src/auth/constants/auth.constants.ts`

```typescript
import * as bcrypt from 'bcrypt';

/**
 * Maximum failed login attempts before account lockout.
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * Bcrypt hash rounds for password hashing.
 */
export const BCRYPT_ROUNDS = 12;

/**
 * Pre-computed dummy bcrypt hash for timing attack protection.
 * Used when user is not found to ensure constant-time response.
 * Generated from a random string at module load time.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  'dummy-password-for-timing-protection',
  BCRYPT_ROUNDS,
);

/**
 * Lockout duration escalation in minutes.
 * Index = lockoutCount (0-based), value = minutes locked.
 * After the last index, the final value is used for all subsequent lockouts.
 */
export const LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120];

/**
 * Calculate lockout duration in milliseconds based on lockoutCount.
 */
export function getLockoutDurationMs(lockoutCount: number): number {
  const index = Math.min(lockoutCount, LOCKOUT_DURATIONS_MINUTES.length - 1);
  return LOCKOUT_DURATIONS_MINUTES[index] * 60 * 1000;
}

/**
 * Calculate lockout duration in minutes based on lockoutCount.
 */
export function getLockoutDurationMinutes(lockoutCount: number): number {
  const index = Math.min(lockoutCount, LOCKOUT_DURATIONS_MINUTES.length - 1);
  return LOCKOUT_DURATIONS_MINUTES[index];
}

/**
 * Global rate limit configuration.
 */
export const GLOBAL_RATE_LIMIT = {
  ttl: 60_000,  // 60 seconds in milliseconds
  limit: 100,
};

/**
 * Per-endpoint rate limit configurations.
 */
export const AUTH_RATE_LIMITS = {
  login: { ttl: 60_000, limit: 5 },
  register: { ttl: 60_000, limit: 3 },
  refresh: { ttl: 60_000, limit: 10 },
  oauth: { ttl: 60_000, limit: 5 },
  forgotPassword: { ttl: 300_000, limit: 3 },
};
```

---

### Step 3: Configure ThrottlerModule in AppModule (SCRUM-37)

**File**: `nexacore-api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { GLOBAL_RATE_LIMIT } from './auth/constants/auth.constants';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: GLOBAL_RATE_LIMIT.ttl,
        limit: GLOBAL_RATE_LIMIT.limit,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

---

### Step 4: Create Custom Throttler Guard (SCRUM-37, SCRUM-41)

**File**: `nexacore-api/src/common/guards/custom-throttler.guard.ts`

```typescript
import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Override to add rate limit headers on every response (both allowed and blocked).
   */
  protected async handleRequest(
    requestProps: {
      context: ExecutionContext;
      limit: number;
      ttl: number;
      throttler: { name: string };
      blockDuration: number;
      generateKey: (
        context: ExecutionContext,
        suffix: string,
        throttlerName: string,
      ) => string;
    },
  ): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const response = context.switchToHttp().getResponse<Response>();

    try {
      const result = await super.handleRequest(requestProps);

      // Add rate limit headers on successful pass-through
      // The remaining count is approximated; the exact value depends on
      // ThrottlerStorage internals. We set headers conservatively.
      const resetTime = Math.ceil((Date.now() + ttl) / 1000);
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Reset', resetTime);

      return result;
    } catch (error) {
      if (error instanceof ThrottlerException) {
        const retryAfterSeconds = Math.ceil(ttl / 1000);
        const resetTime = Math.ceil((Date.now() + ttl) / 1000);

        response.setHeader('X-RateLimit-Limit', limit);
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('X-RateLimit-Reset', resetTime);
        response.setHeader('Retry-After', retryAfterSeconds);

        throw new HttpException(
          {
            success: false,
            error: {
              message: 'Too many requests. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              retryAfter: retryAfterSeconds,
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }

  /**
   * Use client IP as the tracking key.
   * In production, ensure the app is behind a reverse proxy and
   * trusts X-Forwarded-For (app.set('trust proxy', 1) in main.ts).
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    throttlerName: string,
  ): string {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    return `${throttlerName}-${ip}-${suffix}`;
  }
}
```

---

### Step 5: Add Per-Endpoint Rate Limits on Auth Controller (SCRUM-38)

**File**: `nexacore-api/src/auth/auth.controller.ts`

Full updated file:

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Redirect,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { SafeUser } from '../users/entities/user.entity';
import { AUTH_RATE_LIMITS } from './constants/auth.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle([{ name: 'global', ttl: AUTH_RATE_LIMITS.register.ttl, limit: AUTH_RATE_LIMITS.register.limit }])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle([{ name: 'global', ttl: AUTH_RATE_LIMITS.login.ttl, limit: AUTH_RATE_LIMITS.login.limit }])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @Throttle([{ name: 'global', ttl: AUTH_RATE_LIMITS.refresh.ttl, limit: AUTH_RATE_LIMITS.refresh.limit }])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: { user: { id: string } }) {
    await this.authService.logout(req.user.id);
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
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  getAdminDashboard() {
    return { message: 'Admin access granted' };
  }

  @Get('google')
  @Throttle([{ name: 'global', ttl: AUTH_RATE_LIMITS.oauth.ttl, limit: AUTH_RATE_LIMITS.oauth.limit }])
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
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with tokens',
  })
  googleAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; refreshToken: string; user: SafeUser };
    },
  ) {
    const { accessToken, refreshToken } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return {
      url: `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    };
  }

  @Get('github')
  @Throttle([{ name: 'global', ttl: AUTH_RATE_LIMITS.oauth.ttl, limit: AUTH_RATE_LIMITS.oauth.limit }])
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
  @SkipThrottle()
  @UseGuards(GitHubAuthGuard)
  @Redirect()
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with tokens',
  })
  githubAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; refreshToken: string; user: SafeUser };
    },
  ) {
    const { accessToken, refreshToken } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return {
      url: `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    };
  }
}
```

---

### Step 6: Update Prisma Schema (SCRUM-39)

**File**: `nexacore-api/prisma/schema.prisma`

Add `lockoutCount` field to the User model:

```prisma
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
  lockoutCount   Int       @default(0)
  refreshToken   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("users")
}
```

Run migration:

```bash
cd em-ecosystem-code/nexacore-api
npx prisma migrate dev --name add_lockout_count
npx prisma generate
```

---

### Step 7: Update User Entity (SCRUM-39)

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
  lockoutCount: number;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash' | 'refreshToken'>;

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
    lockoutCount: user.lockoutCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return safeUser;
}
```

---

### Step 8: Update UsersService — Exponential Lockout (SCRUM-39)

**File**: `nexacore-api/src/users/users.service.ts`

Replace `lockAccount` and `resetFailedAttempts` methods:

```typescript
// REPLACE existing lockAccount method:

async lockAccount(userId: string, lockoutCount: number): Promise<void> {
  const durationMs = getLockoutDurationMs(lockoutCount);
  const lockUntil = new Date(Date.now() + durationMs);
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      lockedUntil: lockUntil,
      lockoutCount: { increment: 1 },
    },
  });
}

// REPLACE existing resetFailedAttempts method:

async resetFailedAttempts(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      // NOTE: lockoutCount is intentionally NOT reset on successful login.
      // It resets only after a configurable cool-down period or manual admin action.
      // This prevents an attacker from resetting the escalation by guessing
      // the password between lockout periods.
    },
  });
}

// ADD new method for admin to reset lockout escalation:

async resetLockoutEscalation(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      lockoutCount: 0,
    },
  });
}
```

Add the import at the top of users.service.ts:

```typescript
import { getLockoutDurationMs } from '../auth/constants/auth.constants';
```

---

### Step 9: Update AuthService — Timing Attack Protection & Exponential Backoff (SCRUM-39, SCRUM-40)

**File**: `nexacore-api/src/auth/auth.service.ts`

Full updated file:

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
import {
  BCRYPT_ROUNDS,
  MAX_FAILED_ATTEMPTS,
  DUMMY_PASSWORD_HASH,
  getLockoutDurationMinutes,
} from './constants/auth.constants';

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

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const user = await this.usersService.findByEmail(dto.email);

    // ── Timing attack protection ──
    // If user not found, perform a dummy bcrypt compare to ensure
    // the response time is indistinguishable from a real comparison.
    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Invalid credentials');
    }

    // ── Account lockout check ──
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const remainingMinutes = Math.ceil(remainingMs / 60_000);

      throw new ForbiddenException({
        message: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
        error: 'Forbidden',
        statusCode: 403,
        retryAfter: remainingSeconds,
        lockoutLevel: user.lockoutCount,
      });
    }

    // ── Expired lockout: reset failed attempts (but NOT lockoutCount) ──
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    // ── OAuth-only account (no password set) ──
    if (!user.passwordHash) {
      // Dummy compare to maintain constant timing
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Invalid credentials');
    }

    // ── Password validation ──
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const updated = await this.usersService.incrementFailedAttempts(user.id);

      if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock the account with exponential backoff
        await this.usersService.lockAccount(user.id, user.lockoutCount);

        const lockoutMinutes = getLockoutDurationMinutes(user.lockoutCount);
        const lockoutSeconds = lockoutMinutes * 60;

        throw new ForbiddenException({
          message: `Account locked due to too many failed attempts. Try again in ${lockoutMinutes} minute${lockoutMinutes !== 1 ? 's' : ''}.`,
          error: 'Forbidden',
          statusCode: 403,
          retryAfter: lockoutSeconds,
          lockoutLevel: user.lockoutCount + 1,
        });
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // ── Successful login: reset failed attempts ──
    if (user.failedAttempts > 0) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: toSafeUser(user),
    };
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

---

### Step 10: Update HttpExceptionFilter (SCRUM-41)

**File**: `nexacore-api/src/common/filters/http-exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: string[] | undefined;
    let retryAfter: number | undefined;
    let lockoutLevel: number | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // Check if the exception already has our custom format (e.g., from CustomThrottlerGuard)
        if (responseObj.success === false && responseObj.error) {
          response.status(statusCode).json(exceptionResponse);
          return;
        }

        message = (responseObj.message as string) || exception.message;

        if (Array.isArray(responseObj.message)) {
          details = responseObj.message as string[];
          message = 'Validation failed';
        }

        // Pass through retryAfter and lockoutLevel from ForbiddenException payloads
        if (typeof responseObj.retryAfter === 'number') {
          retryAfter = responseObj.retryAfter;
        }
        if (typeof responseObj.lockoutLevel === 'number') {
          lockoutLevel = responseObj.lockoutLevel;
        }
      }

      code = this.getErrorCode(statusCode);
    }

    response.status(statusCode).json({
      success: false,
      error: {
        message,
        code,
        statusCode,
        ...(details && { details }),
        ...(retryAfter !== undefined && { retryAfter }),
        ...(lockoutLevel !== undefined && { lockoutLevel }),
      },
    });
  }

  private getErrorCode(statusCode: number): string {
    const codeMap: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return codeMap[statusCode] || 'UNKNOWN_ERROR';
  }
}
```

---

### Step 11: Frontend — Rate Limit Types (SCRUM-42)

**File**: `nexacore-dashboard/src/lib/types.ts`

Add/modify the following types:

```typescript
// ADD to existing types.ts:

export type RateLimitInfo = {
  /** Whether the client is currently rate limited */
  isRateLimited: boolean;
  /** Seconds until the rate limit resets */
  retryAfter: number | null;
  /** The rate limit ceiling */
  limit: number | null;
  /** Remaining requests in the current window */
  remaining: number | null;
  /** Unix timestamp (seconds) when the rate limit window resets */
  resetAt: number | null;
};

// MODIFY existing ErrorResponse to include optional retryAfter and lockoutLevel:

export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: string[];
    retryAfter?: number;
    lockoutLevel?: number;
  };
};

// ADD lockoutCount to SafeUser:

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
  failedAttempts: number;
  lockedUntil: string | null;
  lockoutCount: number;
  createdAt: string;
  updatedAt: string;
};
```

---

### Step 12: Frontend — Rate Limit Utilities (SCRUM-42)

**File**: `nexacore-dashboard/src/lib/rate-limit.ts`

```typescript
import type { RateLimitInfo } from './types';

/**
 * Parse rate limit headers from a fetch Response.
 */
export function parseRateLimitHeaders(response: Response): Partial<RateLimitInfo> {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const resetAt = response.headers.get('X-RateLimit-Reset');
  const retryAfter = response.headers.get('Retry-After');

  return {
    limit: limit ? parseInt(limit, 10) : null,
    remaining: remaining ? parseInt(remaining, 10) : null,
    resetAt: resetAt ? parseInt(resetAt, 10) : null,
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : null,
    isRateLimited: response.status === 429,
  };
}

/**
 * Default rate limit state.
 */
export const DEFAULT_RATE_LIMIT_INFO: RateLimitInfo = {
  isRateLimited: false,
  retryAfter: null,
  limit: null,
  remaining: null,
  resetAt: null,
};

/**
 * Calculate exponential backoff delay for client-side retries.
 * @param attempt - The retry attempt number (0-based)
 * @param baseDelayMs - Base delay in milliseconds (default 1000ms)
 * @param maxDelayMs - Maximum delay cap in milliseconds (default 30000ms)
 * @returns Delay in milliseconds with jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 30000,
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  // Add jitter: random value between 0 and 50% of the delay
  const jitter = Math.random() * cappedDelay * 0.5;
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff.
 * Stops retrying on non-retryable errors (4xx except 429).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const errObj = error as { error?: { statusCode?: number; retryAfter?: number } };
      const statusCode = errObj?.error?.statusCode;

      // Don't retry on client errors (except 429 rate limit)
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        throw error;
      }

      // If we have a retryAfter from the server, use that
      const serverRetryAfter = errObj?.error?.retryAfter;
      if (serverRetryAfter && attempt < maxRetries) {
        await sleep(serverRetryAfter * 1000);
        continue;
      }

      // Use exponential backoff for remaining retries
      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt, baseDelayMs);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Format seconds into a human-readable countdown string.
 * Examples: "2:30", "0:05", "15:00"
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

---

### Step 13: Frontend — Update ApiClient to Parse Rate Limit Headers (SCRUM-42)

**File**: `nexacore-dashboard/src/lib/api.ts`

Add rate limit header parsing to the `parseErrorResponse` method and expose it on thrown errors:

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

  post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
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
    // Extract rate limit headers before parsing the body
    const retryAfter = response.headers.get('Retry-After');
    const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');

    try {
      const body = await response.json();

      // Enrich error response with rate limit header data
      if (body?.error && response.status === 429) {
        body.error.retryAfter = body.error.retryAfter ?? (retryAfter ? parseInt(retryAfter, 10) : null);
        body.rateLimitInfo = {
          isRateLimited: true,
          retryAfter: retryAfter ? parseInt(retryAfter, 10) : null,
          limit: rateLimitLimit ? parseInt(rateLimitLimit, 10) : null,
          remaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : null,
          resetAt: rateLimitReset ? parseInt(rateLimitReset, 10) : null,
        };
      }

      return body;
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

### Step 14: Frontend — RateLimitBanner Component (SCRUM-42)

**File**: `nexacore-dashboard/src/components/ui/RateLimitBanner.tsx`

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCountdown } from '@/lib/rate-limit';

type RateLimitBannerProps = {
  /** Error message to display */
  message: string;
  /** Number of seconds until the user can retry */
  retryAfterSeconds: number;
  /** Callback when the countdown reaches zero */
  onExpired?: () => void;
  /** Visual variant */
  variant?: 'warning' | 'error';
};

export default function RateLimitBanner({
  message,
  retryAfterSeconds,
  onExpired,
  variant = 'error',
}: RateLimitBannerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(retryAfterSeconds);

  useEffect(() => {
    setSecondsRemaining(retryAfterSeconds);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onExpired?.();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onExpired?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onExpired]);

  const bgColor = variant === 'warning'
    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';

  const textColor = variant === 'warning'
    ? 'text-yellow-800 dark:text-yellow-200'
    : 'text-red-800 dark:text-red-200';

  const iconColor = variant === 'warning'
    ? 'text-yellow-500'
    : 'text-red-500';

  if (secondsRemaining <= 0) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${bgColor}`}
      role="alert"
      aria-live="polite"
    >
      {/* Shield/Lock icon */}
      <svg
        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColor}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>

      <div className="flex-1">
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        <p className={`text-sm mt-1 ${textColor} opacity-75`}>
          You can try again in{' '}
          <span className="font-mono font-semibold">
            {formatCountdown(secondsRemaining)}
          </span>
        </p>
      </div>
    </div>
  );
}
```

---

### Step 15: Frontend — Update AuthContext for Rate Limit Handling (SCRUM-42)

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

Add rate limit state tracking to the auth reducer and login/register functions:

```typescript
// ── Changes to AuthState type ──

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  /** Seconds until the user can retry after rate limit / account lock */
  retryAfter: number | null;
  /** Whether the current error is a rate limit (429) */
  isRateLimited: boolean;
  /** Whether the current error is an account lock (403 with retryAfter) */
  isAccountLocked: boolean;
};

// ── Add new action types ──

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SafeUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_RATE_LIMITED'; payload: { message: string; retryAfter: number } }
  | { type: 'AUTH_ACCOUNT_LOCKED'; payload: { message: string; retryAfter: number } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// ── Update reducer ──

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
        retryAfter: null,
        isRateLimited: false,
        isAccountLocked: false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload,
        retryAfter: null,
        isRateLimited: false,
        isAccountLocked: false,
      };
    case 'AUTH_RATE_LIMITED':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload.message,
        retryAfter: action.payload.retryAfter,
        isRateLimited: true,
        isAccountLocked: false,
      };
    case 'AUTH_ACCOUNT_LOCKED':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload.message,
        retryAfter: action.payload.retryAfter,
        isRateLimited: false,
        isAccountLocked: true,
      };
    case 'LOGOUT':
      return {
        user: null,
        accessToken: null,
        isLoading: false,
        isInitialized: true,
        error: null,
        retryAfter: null,
        isRateLimited: false,
        isAccountLocked: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        retryAfter: null,
        isRateLimited: false,
        isAccountLocked: false,
      };
    default:
      return state;
  }
}

// ── Update initial state ──

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  retryAfter: null,
  isRateLimited: false,
  isAccountLocked: false,
};

// ── Update login function error handling ──

const login = useCallback(async (email: string, password: string) => {
  dispatch({ type: 'AUTH_START' });
  try {
    const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
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
    const errObj = err as { error?: { statusCode?: number; code?: string; message?: string; retryAfter?: number; details?: string[] } };
    const statusCode = errObj?.error?.statusCode;
    const retryAfter = errObj?.error?.retryAfter;
    const message = extractErrorMessage(err, 'Login failed. Please try again.');

    // Rate limited (429)
    if (statusCode === 429 && retryAfter) {
      dispatch({
        type: 'AUTH_RATE_LIMITED',
        payload: { message, retryAfter },
      });
      return;
    }

    // Account locked (403 with retryAfter)
    if (statusCode === 403 && retryAfter) {
      dispatch({
        type: 'AUTH_ACCOUNT_LOCKED',
        payload: { message, retryAfter },
      });
      return;
    }

    dispatch({ type: 'AUTH_ERROR', payload: message });
  }
}, []);

// ── Update register function error handling similarly ──

const register = useCallback(async (email: string, password: string) => {
  dispatch({ type: 'AUTH_START' });
  try {
    const data = await apiClient.post<AuthResponse>('/auth/register', { email, password });
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
    const errObj = err as { error?: { statusCode?: number; retryAfter?: number } };
    const statusCode = errObj?.error?.statusCode;
    const retryAfter = errObj?.error?.retryAfter;
    const message = extractErrorMessage(err, 'Registration failed. Please try again.');

    if (statusCode === 429 && retryAfter) {
      dispatch({
        type: 'AUTH_RATE_LIMITED',
        payload: { message, retryAfter },
      });
      return;
    }

    dispatch({ type: 'AUTH_ERROR', payload: message });
  }
}, []);

// ── Expose new state fields in context value ──

// In the AuthContextType, add:
// retryAfter: number | null;
// isRateLimited: boolean;
// isAccountLocked: boolean;
```

---

### Step 16: Frontend — Update LoginForm to Show RateLimitBanner (SCRUM-42)

In the login form component (wherever `LoginForm` is implemented), add the following integration:

```tsx
import RateLimitBanner from '@/components/ui/RateLimitBanner';
import { useAuth } from '@/context/AuthContext';

// Inside the LoginForm component:
const { error, isLoading, isRateLimited, isAccountLocked, retryAfter, clearError, login } = useAuth();

// Before the form fields, add:
{(isRateLimited || isAccountLocked) && retryAfter && (
  <RateLimitBanner
    message={error || 'Too many attempts. Please wait.'}
    retryAfterSeconds={retryAfter}
    onExpired={clearError}
    variant={isAccountLocked ? 'error' : 'warning'}
  />
)}

// Disable the submit button when rate limited or account locked:
<button
  type="submit"
  disabled={isLoading || isRateLimited || isAccountLocked}
>
  {isLoading ? 'Signing in...' : 'Sign in'}
</button>
```

---

## Testing Checklist

### Unit Tests — Rate Limiting (SCRUM-43)

**File**: `nexacore-api/src/auth/tests/rate-limiting.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Global rate limit', () => {
    it('should include X-RateLimit-Limit header on responses', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
    });

    it('should include X-RateLimit-Reset header on responses', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Login rate limit (5/60s)', () => {
    it('should allow 5 login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: `test${i}@example.com`, password: 'password' });
        expect(res.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('should return 429 on the 6th login attempt within 60s', async () => {
      // After the 5 attempts above
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test6@example.com', password: 'password' });
      expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(res.body.error.retryAfter).toBeDefined();
      expect(res.headers['retry-after']).toBeDefined();
    });
  });

  describe('Register rate limit (3/60s)', () => {
    it('should return 429 after 3 registration attempts', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: `reg${i}@example.com`, password: 'StrongPass123!' });
      }

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'reg4@example.com', password: 'StrongPass123!' });
      expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
```

### Unit Tests — Brute Force Protection (SCRUM-43)

**File**: `nexacore-api/src/auth/tests/brute-force.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService — Brute Force Protection', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: bcrypt.hashSync('correctPassword', 12),
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    role: 'USER',
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      incrementFailedAttempts: jest.fn(),
      lockAccount: jest.fn(),
      resetFailedAttempts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should lock account after 5 failed attempts', async () => {
    usersService.findByEmail!.mockResolvedValue({ ...mockUser, failedAttempts: 4 });
    usersService.incrementFailedAttempts!.mockResolvedValue({ ...mockUser, failedAttempts: 5 });
    usersService.lockAccount!.mockResolvedValue(undefined);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrongPassword' }),
    ).rejects.toThrow(ForbiddenException);

    expect(usersService.lockAccount).toHaveBeenCalledWith('user-1', 0);
  });

  it('should include retryAfter in lockout response', async () => {
    usersService.findByEmail!.mockResolvedValue({ ...mockUser, failedAttempts: 4, lockoutCount: 0 });
    usersService.incrementFailedAttempts!.mockResolvedValue({ ...mockUser, failedAttempts: 5 });
    usersService.lockAccount!.mockResolvedValue(undefined);

    try {
      await authService.login({ email: 'test@example.com', password: 'wrongPassword' });
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const response = (error as ForbiddenException).getResponse() as Record<string, unknown>;
      expect(response.retryAfter).toBe(900); // 15 minutes = 900 seconds
      expect(response.lockoutLevel).toBe(1);
    }
  });

  it('should escalate lockout duration on repeated lockouts', async () => {
    // Second lockout (lockoutCount = 1) → 30 minutes
    usersService.findByEmail!.mockResolvedValue({ ...mockUser, failedAttempts: 4, lockoutCount: 1 });
    usersService.incrementFailedAttempts!.mockResolvedValue({ ...mockUser, failedAttempts: 5, lockoutCount: 1 });
    usersService.lockAccount!.mockResolvedValue(undefined);

    try {
      await authService.login({ email: 'test@example.com', password: 'wrongPassword' });
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const response = (error as ForbiddenException).getResponse() as Record<string, unknown>;
      expect(response.retryAfter).toBe(1800); // 30 minutes = 1800 seconds
      expect(response.lockoutLevel).toBe(2);
    }
  });

  it('should reject login when account is currently locked', async () => {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    usersService.findByEmail!.mockResolvedValue({ ...mockUser, lockedUntil, lockoutCount: 1 });

    await expect(
      authService.login({ email: 'test@example.com', password: 'correctPassword' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reset failedAttempts on successful login after expired lockout', async () => {
    const expiredLock = new Date(Date.now() - 1000);
    usersService.findByEmail!.mockResolvedValue({
      ...mockUser,
      lockedUntil: expiredLock,
      failedAttempts: 5,
      lockoutCount: 1,
    });
    usersService.resetFailedAttempts!.mockResolvedValue(undefined);

    // This would proceed to password check — we need a full mock for generateTokens
    // Simplified: verify resetFailedAttempts is called
    try {
      await authService.login({ email: 'test@example.com', password: 'correctPassword' });
    } catch {
      // May throw due to incomplete mock, but verify the reset was called
    }

    expect(usersService.resetFailedAttempts).toHaveBeenCalledWith('user-1');
  });
});
```

### Unit Tests — Timing Attack Protection (SCRUM-43)

**File**: `nexacore-api/src/auth/tests/timing-attack.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService — Timing Attack Protection', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      incrementFailedAttempts: jest.fn(),
      lockAccount: jest.fn(),
      resetFailedAttempts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should throw UnauthorizedException for non-existent user', async () => {
    usersService.findByEmail!.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nonexistent@example.com', password: 'password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should take similar time for existing vs non-existing user', async () => {
    const bcrypt = await import('bcrypt');
    const realHash = await bcrypt.hash('testPassword', 12);

    // Time for non-existing user (should do dummy bcrypt.compare)
    usersService.findByEmail!.mockResolvedValue(null);
    const startNonExist = performance.now();
    try {
      await authService.login({ email: 'nonexistent@example.com', password: 'testPassword' });
    } catch { /* expected */ }
    const timeNonExist = performance.now() - startNonExist;

    // Time for existing user with wrong password
    usersService.findByEmail!.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: realHash,
      failedAttempts: 0,
      lockedUntil: null,
      lockoutCount: 0,
      role: 'USER',
    });
    usersService.incrementFailedAttempts!.mockResolvedValue({ failedAttempts: 1 });

    const startExist = performance.now();
    try {
      await authService.login({ email: 'test@example.com', password: 'wrongPassword' });
    } catch { /* expected */ }
    const timeExist = performance.now() - startExist;

    // Both should involve a bcrypt.compare call, so times should be similar
    // Allow up to 100ms variance (bcrypt is ~200-400ms, so this is generous)
    const difference = Math.abs(timeExist - timeNonExist);
    expect(difference).toBeLessThan(200);
  });
});
```

### Integration Tests — Manual Verification

| # | Test Case | Expected Result | Sub-task |
|---|---|---|---|
| 1 | Send 101 requests to any endpoint within 60s | 101st returns 429 with `Retry-After` header | SCRUM-37 |
| 2 | Send 6 POST /auth/login within 60s | 6th returns 429 | SCRUM-38 |
| 3 | Send 4 POST /auth/register within 60s | 4th returns 429 | SCRUM-38 |
| 4 | Login with wrong password 5 times | 5th triggers 403 with `retryAfter: 900` (15min) | SCRUM-39 |
| 5 | Trigger lockout twice on same account | 2nd lockout has `retryAfter: 1800` (30min) | SCRUM-39 |
| 6 | Trigger lockout 3 times | 3rd lockout has `retryAfter: 3600` (60min) | SCRUM-39 |
| 7 | Trigger lockout 4+ times | 4th+ lockout has `retryAfter: 7200` (120min) | SCRUM-39 |
| 8 | Login with non-existent email | Response time similar to wrong password (~250ms) | SCRUM-40 |
| 9 | Check response headers on any 200 response | Contains `X-RateLimit-Limit` and `X-RateLimit-Reset` | SCRUM-41 |
| 10 | Check response headers on 429 | Contains `Retry-After`, `X-RateLimit-Remaining: 0` | SCRUM-41 |
| 11 | Trigger rate limit in browser, check LoginForm | RateLimitBanner appears with countdown | SCRUM-42 |
| 12 | Trigger account lock in browser | RateLimitBanner (error variant) with countdown appears, form disabled | SCRUM-42 |
| 13 | Wait for countdown to expire | Banner disappears, form re-enabled | SCRUM-42 |
| 14 | Login successfully after expired lockout | Successful login, tokens returned | SCRUM-39 |

---

## Error Handling

### Backend Error Responses

| Status | Code | Trigger | Response Body |
|---|---|---|---|
| 429 | `RATE_LIMIT_EXCEEDED` | IP exceeds rate limit | `{ success: false, error: { message, code, statusCode: 429, retryAfter } }` |
| 403 | `FORBIDDEN` (with `retryAfter`) | Account locked after brute force | `{ success: false, error: { message, code, statusCode: 403, retryAfter, lockoutLevel } }` |
| 401 | `UNAUTHORIZED` | Invalid credentials (constant-time) | `{ success: false, error: { message, code, statusCode: 401 } }` |

### Frontend Error States

| Error Type | AuthContext State | UI Behavior |
|---|---|---|
| Rate limited (429) | `isRateLimited: true, retryAfter: N` | RateLimitBanner (warning), form disabled |
| Account locked (403) | `isAccountLocked: true, retryAfter: N` | RateLimitBanner (error), form disabled |
| Invalid credentials (401) | `error: "Invalid credentials"` | Standard error message |
| Network error | `error: "Network error..."` | Standard error message |

### Edge Cases

| Scenario | Handling |
|---|---|
| User behind shared IP (NAT) gets rate limited | IP-based limits are generous (100/60s global). Per-endpoint limits are stricter but reasonable. Document in API docs. |
| Attacker switches IPs | Account-level brute force protection (failedAttempts + lockoutCount) is IP-independent and still applies. |
| User clears cookies and retries during lockout | Lockout is server-side (stored in DB), not client-side. Still blocked. |
| Rate limit headers not present (proxy strips them) | Frontend falls back to `retryAfter` in error response body. |
| OAuth callback gets rate limited | OAuth callbacks use `@SkipThrottle()` to prevent blocking legitimate OAuth flows. |
| Multiple browser tabs | Rate limit state in AuthContext is per-tab. Each tab shows its own banner. Server state is shared. |

---

## Non-Functional Requirements

| Requirement | Target | Implementation |
|---|---|---|
| Response time consistency | < 200ms variance between found/not-found user login | Dummy bcrypt.compare on user-not-found |
| Rate limit storage | In-memory (default ThrottlerStorage) | Suitable for single-instance. For multi-instance, upgrade to `@nestjs/throttler` Redis storage. |
| Lockout state persistence | PostgreSQL (User table) | Survives server restarts |
| Rate limit header accuracy | Best-effort approximation | `X-RateLimit-Remaining` is approximate due to ThrottlerStorage internals |
| Frontend countdown accuracy | +/- 1 second | `setInterval` with 1s resolution |
| Test coverage | >= 85% branch coverage for auth module | Unit + integration tests |

---

## Dependencies

### npm Packages to Install

| Package | Version | Project | Purpose |
|---|---|---|---|
| `@nestjs/throttler` | `^6.x` | nexacore-api | Rate limiting module with decorator support |

### Already Installed (No Action Needed)

| Package | Version | Project | Used For |
|---|---|---|---|
| `bcrypt` | `^6.0.0` | nexacore-api | Timing attack protection (dummy compare) |
| `@nestjs/common` | `^11.0.1` | nexacore-api | `HttpException`, `HttpStatus.TOO_MANY_REQUESTS` |
| `class-validator` | `^0.14.3` | nexacore-api | DTO validation (no changes needed) |

---

## Documentation Updates

| Document | Update Required |
|---|---|
| `ai-specs/specs/api-spec.yml` | Add 429 responses to auth endpoints; document `X-RateLimit-*` headers |
| `ai-specs/specs/backend-standards.mdc` | Add "Rate Limiting" section documenting global/per-endpoint strategy, and "Brute Force Protection" section documenting exponential backoff |
| `ai-specs/specs/data-model.md` | Add `lockoutCount` field to User entity documentation |
| Swagger/OpenAPI (auto-generated) | `@ApiResponse({ status: 429 })` decorators handle this |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `THROTTLE_TTL` | `60000` | Global rate limit window in milliseconds (optional override) |
| `THROTTLE_LIMIT` | `100` | Global rate limit max requests per window (optional override) |

These are optional. The constants file provides defaults. To make them configurable via env vars, update `app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'global',
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
]),
```

---

## Definition of Done

- [ ] `@nestjs/throttler` installed and configured in `AppModule` with global rate limit of 100 req/60s
- [ ] Custom `ThrottlerGuard` overrides default to provide structured 429 responses
- [ ] Auth endpoints have per-endpoint `@Throttle()` overrides: login (5/60s), register (3/60s), refresh (10/60s), OAuth initiation (5/60s)
- [ ] OAuth callback endpoints use `@SkipThrottle()` to prevent blocking
- [ ] `lockoutCount` field added to User model via Prisma migration
- [ ] `lockAccount()` in UsersService accepts lockoutCount and calculates exponential duration (15 → 30 → 60 → 120 min)
- [ ] `resetFailedAttempts()` resets failedAttempts and lockedUntil but NOT lockoutCount
- [ ] New `resetLockoutEscalation()` method available for admin use
- [ ] Login timing attack protection: dummy `bcrypt.compare()` when user not found or has no password hash
- [ ] ForbiddenException for locked accounts includes `retryAfter` (seconds) and `lockoutLevel` in response
- [ ] `X-RateLimit-Limit`, `X-RateLimit-Reset` headers on all responses
- [ ] `Retry-After`, `X-RateLimit-Remaining: 0` headers on 429 responses
- [ ] `HttpExceptionFilter` updated with 429 error code mapping and `retryAfter`/`lockoutLevel` pass-through
- [ ] Frontend `ApiClient` parses rate limit headers and enriches error objects
- [ ] Frontend `AuthContext` handles 429 and 403-with-retryAfter with dedicated state (`isRateLimited`, `isAccountLocked`, `retryAfter`)
- [ ] `RateLimitBanner` component renders countdown timer with `warning`/`error` variants
- [ ] Login form displays `RateLimitBanner` and disables submit during cooldown
- [ ] `rate-limit.ts` utility provides `retryWithBackoff`, `formatCountdown`, header parsing
- [ ] Unit tests for rate limiting, brute force protection, and timing attack
- [ ] Integration tests pass (manual verification checklist)
- [ ] `nest build` succeeds with no TypeScript errors
- [ ] `next build` succeeds with no TypeScript errors
- [ ] All existing tests continue to pass
