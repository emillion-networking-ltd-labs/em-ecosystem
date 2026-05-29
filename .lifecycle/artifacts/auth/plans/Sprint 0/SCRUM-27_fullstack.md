# Fullstack Implementation Spec: SCRUM-27 Security Headers, CSP & CSRF Protection

## Overview

Comprehensive security hardening layer for the EM NexaCore platform. This story implements HTTP security headers via Helmet.js on the NestJS API, configures Content Security Policy (CSP) for both backend and frontend, adds CSRF protection using the double-submit cookie pattern, hardens CORS with explicit origin allowlists, and sets Referrer-Policy and Permissions-Policy headers. On the Next.js frontend, security headers are configured via `next.config.mjs` and a new `middleware.ts` generates per-request CSP nonces.

**Epic**: SCRUM-22 — Auth Security Hardening & Enterprise Features
**Story**: SCRUM-27 — Security Headers, CSP & CSRF Protection
**Priority**: HIGH
**Layer**: 5 of 8

### Sub-tasks

| Ticket | Summary |
|---|---|
| SCRUM-57 | Helmet.js integration and base security headers |
| SCRUM-58 | Content Security Policy (CSP) configuration |
| SCRUM-59 | CSRF protection (double-submit cookie pattern) |
| SCRUM-60 | CORS hardening with explicit origin allowlist |
| SCRUM-61 | Referrer-Policy header configuration |
| SCRUM-62 | Permissions-Policy header configuration |
| SCRUM-63 | Next.js security headers in next.config.mjs |

---

## Architecture Context

### Security Headers Flow

```
                        ┌──────────────────────────────┐
                        │   Browser (nexacore-dashboard)│
                        │   Next.js middleware adds:    │
                        │   - CSP with nonce            │
                        │   - X-Frame-Options           │
                        │   - X-Content-Type-Options    │
                        │   - Referrer-Policy           │
                        │   - Permissions-Policy        │
                        │   - CSRF token (cookie)       │
                        └──────────┬───────────────────┘
                                   │ HTTPS
                                   ▼
                        ┌──────────────────────────────┐
                        │   NestJS API (nexacore-api)   │
                        │   Helmet middleware adds:     │
                        │   - X-Content-Type-Options    │
                        │   - X-Frame-Options           │
                        │   - X-XSS-Protection          │
                        │   - Strict-Transport-Security │
                        │   - Referrer-Policy           │
                        │   - Permissions-Policy        │
                        │   - CSP (API-specific)        │
                        │   CsrfGuard validates:        │
                        │   - X-CSRF-Token header       │
                        │   - __csrf cookie             │
                        │   CORS validates:             │
                        │   - Origin allowlist           │
                        └──────────────────────────────┘
```

### CSRF Double-Submit Cookie Pattern

```
1. Client GET /auth/csrf-token
   ← Set-Cookie: __csrf=<token>; HttpOnly; SameSite=Strict; Secure; Path=/
   ← Body: { csrfToken: "<token>" }

2. Client POST /auth/login (state-changing request)
   → Cookie: __csrf=<token>
   → Header: X-CSRF-Token: <token>

3. Server CsrfGuard:
   - Extract token from cookie (__csrf)
   - Extract token from header (X-CSRF-Token)
   - Verify HMAC signature of cookie token
   - Compare cookie token === header token
   - Allow request if match, reject 403 if mismatch
```

### CORS Origin Resolution

```
Environment Variable: CORS_ALLOWED_ORIGINS
Format: comma-separated URLs
Example: "http://localhost:3001,https://dashboard.emillion.io"

Fallback: FRONTEND_URL (single origin, backward compatible)
Default: "http://localhost:3001"
```

---

## Endpoint Specification

### New Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/auth/csrf-token` | None | Generate and return CSRF token + set cookie |

#### `GET /auth/csrf-token`

**Response 200:**

```json
{
  "csrfToken": "a1b2c3d4e5f6..."
}
```

**Response Headers:**

```
Set-Cookie: __csrf=a1b2c3d4e5f6...; HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=86400
```

### Modified Endpoints

All state-changing endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) now require:

| Header | Value | Purpose |
|---|---|---|
| `X-CSRF-Token` | Token from `/auth/csrf-token` | CSRF validation |

**Excluded from CSRF** (safe methods or token-issuing):
- `GET /auth/csrf-token` (issues the token)
- `GET /auth/me`
- `GET /auth/google` and `GET /auth/github` (OAuth redirects)
- `GET /auth/google/callback` and `GET /auth/github/callback` (OAuth callbacks)
- `GET /users` and `GET /users/:id` (read-only)
- `GET /api/docs` (Swagger)

---

## Database Changes

**None.** This story is purely infrastructure/middleware. No schema changes required.

---

## Files to Create

### Backend (nexacore-api)

| File | Purpose |
|---|---|
| `src/common/middleware/helmet.middleware.ts` | Helmet configuration with CSP, HSTS, and security header overrides |
| `src/common/guards/csrf.guard.ts` | CSRF double-submit cookie validation guard |
| `src/common/decorators/skip-csrf.decorator.ts` | Decorator to exempt specific routes from CSRF validation |
| `src/common/middleware/csrf-token.middleware.ts` | Middleware to generate and issue CSRF tokens |
| `src/security/security.module.ts` | Module registering all security middleware and providers |
| `src/security/security.config.ts` | Centralized security configuration constants |
| `src/security/tests/csrf.guard.spec.ts` | Unit tests for CSRF guard |
| `src/security/tests/security-headers.e2e-spec.ts` | E2E tests verifying all response headers |

### Frontend (nexacore-dashboard)

| File | Purpose |
|---|---|
| `src/middleware.ts` | Next.js middleware for CSP nonce generation and security headers |
| `src/lib/csrf.ts` | CSRF token management utility (fetch, cache, attach to requests) |

---

## Files to Modify

### Backend (nexacore-api)

| File | Changes |
|---|---|
| `package.json` | Add `helmet` dependency |
| `.env.example` | Add `CORS_ALLOWED_ORIGINS`, `CSRF_SECRET`, `NODE_ENV` variables |
| `src/main.ts` | Replace simple CORS config with hardened version; register Helmet middleware; register CSRF token middleware |
| `src/app.module.ts` | Import `SecurityModule` |
| `src/auth/auth.controller.ts` | Add `GET /auth/csrf-token` endpoint; add `@SkipCsrf()` on OAuth redirect endpoints |

### Frontend (nexacore-dashboard)

| File | Changes |
|---|---|
| `next.config.mjs` | Add security headers configuration |
| `src/lib/api.ts` | Add CSRF token fetching and `X-CSRF-Token` header injection on state-changing requests |
| `package.json` | No new dependencies needed (uses native crypto) |

---

## Implementation Steps

### Step 1: Security Configuration Constants (SCRUM-57)

**File: `nexacore-api/src/security/security.config.ts`**

```typescript
export const SecurityConfig = {
  /**
   * CORS configuration
   */
  cors: {
    getAllowedOrigins(): string[] {
      const originsEnv = process.env.CORS_ALLOWED_ORIGINS;
      if (originsEnv) {
        return originsEnv.split(',').map((o) => o.trim()).filter(Boolean);
      }
      // Backward compatible: fall back to FRONTEND_URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return [frontendUrl];
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  },

  /**
   * CSRF configuration
   */
  csrf: {
    cookieName: '__csrf',
    headerName: 'x-csrf-token',
    tokenLength: 32, // bytes, hex-encoded = 64 chars
    cookieOptions: {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 86400, // 24 hours in seconds
    },
    getSecret(): string {
      const secret = process.env.CSRF_SECRET;
      if (!secret || secret.length < 32) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'CSRF_SECRET must be set and at least 32 characters in production',
          );
        }
        return 'dev-csrf-secret-change-in-production-min32chars';
      }
      return secret;
    },
  },

  /**
   * Helmet / security headers configuration
   */
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const,
    },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      'interest-cohort': [],
      accelerometer: [],
      gyroscope: [],
      magnetometer: [],
      usb: [],
      'payment': [],
      'autoplay': [],
    },
  },
} as const;
```

---

### Step 2: Install Helmet & Update Environment (SCRUM-57)

**Install dependency:**

```bash
cd nexacore-api
npm install helmet
```

**File: `nexacore-api/.env.example`** (append)

```env
# Security
CORS_ALLOWED_ORIGINS="http://localhost:3001"
CSRF_SECRET="your-csrf-secret-min-32-characters-long"
NODE_ENV="development"
```

**File: `nexacore-api/package.json`** — `helmet` will appear under `dependencies`:

```json
"helmet": "^8.1.0"
```

---

### Step 3: Helmet Middleware Setup (SCRUM-57, SCRUM-58, SCRUM-61, SCRUM-62)

**File: `nexacore-api/src/common/middleware/helmet.middleware.ts`**

```typescript
import helmet from 'helmet';
import { INestApplication } from '@nestjs/common';
import { SecurityConfig } from '../../security/security.config';

/**
 * Registers Helmet middleware on the NestJS application.
 * Configures: CSP, HSTS, X-Content-Type-Options, X-Frame-Options,
 * X-XSS-Protection (disabled — modern CSP supersedes it),
 * Referrer-Policy, and Permissions-Policy.
 */
export function registerHelmetMiddleware(app: INestApplication): void {
  const { contentSecurityPolicy, hsts, referrerPolicy } =
    SecurityConfig.helmet;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: contentSecurityPolicy.directives,
        reportOnly: false,
      },
      crossOriginEmbedderPolicy: false, // required for Swagger UI assets
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: hsts,
      referrerPolicy: referrerPolicy,
      xContentTypeOptions: true, // X-Content-Type-Options: nosniff
      xFrameOptions: { action: 'deny' }, // X-Frame-Options: DENY
      xXssProtection: false, // Deprecated; CSP is the replacement
    }),
  );

  // Permissions-Policy is not natively supported by Helmet v8;
  // set it manually via middleware.
  const permissionsPolicy = SecurityConfig.helmet.permissionsPolicy;
  app.use((_req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    const directives = Object.entries(permissionsPolicy)
      .map(([feature, allowlist]) => {
        if (allowlist.length === 0) {
          return `${feature}=()`;
        }
        return `${feature}=(${allowlist.join(' ')})`;
      })
      .join(', ');
    res.setHeader('Permissions-Policy', directives);
    next();
  });
}
```

---

### Step 4: CSRF Skip Decorator (SCRUM-59)

**File: `nexacore-api/src/common/decorators/skip-csrf.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Decorator to exempt a route handler from CSRF validation.
 * Use on safe (GET) endpoints or on the CSRF token issuing endpoint itself.
 *
 * @example
 * @SkipCsrf()
 * @Get('csrf-token')
 * getCsrfToken() { ... }
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
```

---

### Step 5: CSRF Guard (SCRUM-59)

**File: `nexacore-api/src/common/guards/csrf.guard.ts`**

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';
import { SecurityConfig } from '../../security/security.config';

// Safe HTTP methods that do not require CSRF validation
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Safe methods are exempt
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    // Check for @SkipCsrf() decorator
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCsrf) {
      return true;
    }

    const cookieName = SecurityConfig.csrf.cookieName;
    const headerName = SecurityConfig.csrf.headerName;

    // Extract tokens
    const cookieToken = request.cookies?.[cookieName];
    const headerToken = request.headers[headerName] as string | undefined;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Verify HMAC signature of cookie token
    if (!this.verifyToken(cookieToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    // Compare cookie and header tokens using timing-safe comparison
    if (!this.timingSafeEqual(cookieToken, headerToken)) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }

  /**
   * Verifies the HMAC signature of a CSRF token.
   * Token format: <random>.<hmac>
   */
  private verifyToken(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [randomPart, signature] = parts;
    const secret = SecurityConfig.csrf.getSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(randomPart)
      .digest('hex');

    return this.timingSafeEqual(signature, expectedSignature);
  }

  /**
   * Timing-safe string comparison to prevent timing attacks.
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Generates a signed CSRF token.
   * Format: <random_hex>.<hmac_hex>
   */
  static generateToken(): string {
    const secret = SecurityConfig.csrf.getSecret();
    const randomPart = crypto
      .randomBytes(SecurityConfig.csrf.tokenLength)
      .toString('hex');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(randomPart)
      .digest('hex');
    return `${randomPart}.${signature}`;
  }
}
```

---

### Step 6: Security Module (SCRUM-57)

**File: `nexacore-api/src/security/security.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from '../common/guards/csrf.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class SecurityModule {}
```

---

### Step 7: Update main.ts (SCRUM-57, SCRUM-58, SCRUM-59, SCRUM-60)

**File: `nexacore-api/src/main.ts`**

```typescript
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { registerHelmetMiddleware } from './common/middleware/helmet.middleware';
import { SecurityConfig } from './security/security.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Security Headers (Helmet) ---
  registerHelmetMiddleware(app);

  // --- Cookie Parser (required for CSRF) ---
  app.use(cookieParser());

  // --- CORS Hardening ---
  const allowedOrigins = SecurityConfig.cors.getAllowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: SecurityConfig.cors.methods,
    allowedHeaders: SecurityConfig.cors.allowedHeaders,
    credentials: SecurityConfig.cors.credentials,
    maxAge: SecurityConfig.cors.maxAge,
  });

  // --- Validation ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- Exception Filter ---
  app.useGlobalFilters(new HttpExceptionFilter());

  // --- Swagger ---
  const config = new DocumentBuilder()
    .setTitle('EM NexaCore API')
    .setDescription(
      'EM Ecosystem Core Platform — Authentication & User Management',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

**Install cookie-parser:**

```bash
cd nexacore-api
npm install cookie-parser
npm install -D @types/cookie-parser
```

---

### Step 8: Update app.module.ts (SCRUM-57)

**File: `nexacore-api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, SecurityModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

### Step 9: Add CSRF Token Endpoint to AuthController (SCRUM-59)

**File: `nexacore-api/src/auth/auth.controller.ts`** — Add the following endpoint and decorators:

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
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator';
import { Role } from '../users/enums/role.enum';
import { SafeUser } from '../users/entities/user.entity';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SecurityConfig } from '../security/security.config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- CSRF Token Endpoint ---

  @Get('csrf-token')
  @SkipCsrf()
  @ApiOperation({ summary: 'Generate CSRF token and set cookie' })
  @ApiResponse({ status: 200, description: 'CSRF token issued' })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const token = CsrfGuard.generateToken();
    const { cookieName, cookieOptions } = SecurityConfig.csrf;

    res.cookie(cookieName, token, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge * 1000, // Express expects ms
    });

    return { csrfToken: token };
  }

  // --- Existing Endpoints (with CSRF annotations) ---

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
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
  @SkipCsrf()
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
  @SkipCsrf()
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
  @SkipCsrf()
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
  @SkipCsrf()
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

### Step 10: Next.js Security Headers (SCRUM-63)

**File: `nexacore-dashboard/next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'avatars.githubusercontent.com' },
    ],
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '0', // Disabled; CSP is the modern replacement
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), payment=(), autoplay=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

### Step 11: Next.js CSP Middleware with Nonce (SCRUM-58, SCRUM-63)

**File: `nexacore-dashboard/src/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js middleware that generates a per-request CSP nonce and sets
 * the Content-Security-Policy header. The nonce is passed to components
 * via the x-nonce response header (accessible in Server Components via headers()).
 *
 * This runs on every request EXCEPT static files and images.
 */
export function middleware(request: NextRequest) {
  // Generate a random nonce for this request
  const nonce = generateNonce();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Build CSP directives
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind requires unsafe-inline for style injection
    `img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com`,
    `font-src 'self'`,
    `connect-src 'self' ${apiUrl}`,
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ];

  const cspHeaderValue = cspDirectives.join('; ');

  // Clone the request headers and add the nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set CSP header on the response
  response.headers.set('Content-Security-Policy', cspHeaderValue);

  // Also expose the nonce to Server Components
  response.headers.set('x-nonce', nonce);

  return response;
}

/**
 * Generate a cryptographically random nonce (base64, 16 bytes).
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Convert to base64
  return btoa(String.fromCharCode(...array));
}

/**
 * Matcher: run middleware on all routes except static files, images, and favicon.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

### Step 12: CSRF Token Management Utility (SCRUM-59)

**File: `nexacore-dashboard/src/lib/csrf.ts`**

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let cachedCsrfToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

/**
 * Fetches a CSRF token from the API and caches it.
 * The API also sets an HttpOnly cookie (__csrf) that will be sent
 * automatically with subsequent requests (credentials: 'include').
 *
 * Uses a singleton promise to prevent concurrent fetches.
 */
export async function getCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) return cachedCsrfToken;

  if (tokenFetchPromise) return tokenFetchPromise;

  tokenFetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Failed to fetch CSRF token:', res.status);
        return null;
      }

      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken;
    } catch (err) {
      console.error('Error fetching CSRF token:', err);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

/**
 * Clears the cached CSRF token. Call this on logout or
 * when receiving a 403 CSRF error (to force re-fetch).
 */
export function clearCsrfToken(): void {
  cachedCsrfToken = null;
}

/**
 * Returns the cached token synchronously (may be null if not yet fetched).
 */
export function getCachedCsrfToken(): string | null {
  return cachedCsrfToken;
}
```

---

### Step 13: Update ApiClient with CSRF Support (SCRUM-59)

**File: `nexacore-dashboard/src/lib/api.ts`**

```typescript
import { getCsrfToken, clearCsrfToken } from './csrf';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// HTTP methods that require CSRF tokens
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
    const method = (options.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
    };

    // Attach CSRF token for state-changing requests
    if (CSRF_METHODS.has(method)) {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
        credentials: 'include', // Required for CSRF cookies
      });
    } catch {
      throw {
        error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
      };
    }

    // Handle 403 CSRF token errors — clear and retry once
    if (response.status === 403) {
      const body = await response.clone().json().catch(() => null);
      if (body?.error?.message?.includes('CSRF')) {
        clearCsrfToken();
        const newCsrfToken = await getCsrfToken();
        if (newCsrfToken) {
          headers['X-CSRF-Token'] = newCsrfToken;
          try {
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers: { ...headers, ...(options.headers as Record<string, string>) },
              credentials: 'include',
            });
            if (!retryResponse.ok) {
              throw await this.parseErrorResponse(retryResponse);
            }
            return retryResponse.json();
          } catch (retryErr) {
            if ((retryErr as { error?: unknown })?.error) throw retryErr;
            throw {
              error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
            };
          }
        }
      }
    }

    // Handle 401 with silent refresh
    if (response.status === 401 && this.accessToken) {
      const newToken = await this.silentRefresh();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        // Re-fetch CSRF token if needed
        if (CSRF_METHODS.has(method)) {
          const csrfToken = await getCsrfToken();
          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
          }
        }
        let retryResponse: Response;
        try {
          retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...(options.headers as Record<string, string>) },
            credentials: 'include',
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
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
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

### Step 14: CSRF Guard Unit Tests (SCRUM-59)

**File: `nexacore-api/src/security/tests/csrf.guard.spec.ts`**

```typescript
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from '../../common/guards/csrf.guard';

// Mock the SecurityConfig before importing
jest.mock('../../security/security.config', () => ({
  SecurityConfig: {
    csrf: {
      cookieName: '__csrf',
      headerName: 'x-csrf-token',
      tokenLength: 32,
      getSecret: () => 'test-csrf-secret-must-be-32-chars-long',
      cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        path: '/',
        maxAge: 86400,
      },
    },
  },
}));

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CsrfGuard(reflector);
  });

  function createMockContext(
    method: string,
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          cookies,
          headers,
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn() as unknown,
    } as unknown as ExecutionContext;
  }

  it('should allow GET requests without CSRF token', () => {
    const context = createMockContext('GET');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow HEAD requests without CSRF token', () => {
    const context = createMockContext('HEAD');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow OPTIONS requests without CSRF token', () => {
    const context = createMockContext('OPTIONS');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when CSRF cookie is missing on POST', () => {
    const context = createMockContext('POST', {}, { 'x-csrf-token': 'token' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
  });

  it('should throw ForbiddenException when CSRF header is missing on POST', () => {
    const context = createMockContext('POST', { __csrf: 'token' }, {});
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
  });

  it('should throw ForbiddenException when tokens do not match', () => {
    const token = CsrfGuard.generateToken();
    const differentToken = CsrfGuard.generateToken();
    const context = createMockContext(
      'POST',
      { __csrf: token },
      { 'x-csrf-token': differentToken },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('CSRF token mismatch');
  });

  it('should allow POST when cookie and header tokens match and are valid', () => {
    const token = CsrfGuard.generateToken();
    const context = createMockContext(
      'POST',
      { __csrf: token },
      { 'x-csrf-token': token },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow PATCH when cookie and header tokens match and are valid', () => {
    const token = CsrfGuard.generateToken();
    const context = createMockContext(
      'PATCH',
      { __csrf: token },
      { 'x-csrf-token': token },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow DELETE when cookie and header tokens match and are valid', () => {
    const token = CsrfGuard.generateToken();
    const context = createMockContext(
      'DELETE',
      { __csrf: token },
      { 'x-csrf-token': token },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException for tampered token (invalid HMAC)', () => {
    const token = CsrfGuard.generateToken();
    const [randomPart] = token.split('.');
    const tamperedToken = `${randomPart}.invalidsignature`;
    const context = createMockContext(
      'POST',
      { __csrf: tamperedToken },
      { 'x-csrf-token': tamperedToken },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Invalid CSRF token');
  });

  it('should skip CSRF when @SkipCsrf() decorator is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext('POST');
    expect(guard.canActivate(context)).toBe(true);
  });

  describe('generateToken', () => {
    it('should generate a token with random part and HMAC signature', () => {
      const token = CsrfGuard.generateToken();
      expect(token).toContain('.');
      const parts = token.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBe(64); // 32 bytes hex
      expect(parts[1].length).toBe(64); // SHA-256 HMAC hex
    });

    it('should generate unique tokens on each call', () => {
      const token1 = CsrfGuard.generateToken();
      const token2 = CsrfGuard.generateToken();
      expect(token1).not.toBe(token2);
    });
  });
});
```

---

### Step 15: Security Headers E2E Tests (SCRUM-57, SCRUM-58, SCRUM-61, SCRUM-62)

**File: `nexacore-api/src/security/tests/security-headers.e2e-spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../app.module';
import { registerHelmetMiddleware } from '../../common/middleware/helmet.middleware';

describe('Security Headers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    registerHelmetMiddleware(app);
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Helmet Security Headers', () => {
    it('should set X-Content-Type-Options: nosniff', async () => {
      const res = await request(app.getHttpServer()).get('/auth/csrf-token');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options: DENY', async () => {
      const res = await request(app.getHttpServer()).get('/auth/csrf-token');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('should NOT set X-XSS-Protection (deprecated)', async () => {
      const res = await request(app.getHttpServer()).get('/auth/csrf-token');
      expect(res.headers['x-xss-protection']).toBeUndefined();
    });

    it('should set Strict-Transport-Security', async () => {
      const res = await request(app.getHttpServer()).get('/auth/csrf-token');
      expect(res.headers['strict-transport-security']).toContain(
        'max-age=31536000',
      );
      expect(res.headers['strict-transport-security']).toContain(
        'includeSubDomains',
      );
    });

    it('should set Content-Security-Policy', async () => {
      const res = await request(app.getHttpServer()).get('/auth/csrf-token');
      const csp = res.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should set Referrer-Policy: strict-origin-when-cross-origin', async () => {
      const res = await request(app.getHttpServer()).get('/auth/csrf-token');
      expect(res.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin',
      );
    });

    it('should set Permissions-Policy restricting browser features', async () => {
      const res = await request(app.getHttpServer()).get('/auth/csrf-token');
      const pp = res.headers['permissions-policy'];
      expect(pp).toBeDefined();
      expect(pp).toContain('camera=()');
      expect(pp).toContain('microphone=()');
      expect(pp).toContain('geolocation=()');
    });
  });

  describe('CSRF Token Endpoint', () => {
    it('should return a CSRF token and set __csrf cookie', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/csrf-token')
        .expect(200);

      expect(res.body).toHaveProperty('csrfToken');
      expect(typeof res.body.csrfToken).toBe('string');
      expect(res.body.csrfToken).toContain('.');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const csrfCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('__csrf='))
        : cookies.startsWith('__csrf=')
          ? cookies
          : undefined;
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).toContain('HttpOnly');
      expect(csrfCookie).toContain('SameSite=Strict');
    });
  });

  describe('CSRF Protection on State-Changing Requests', () => {
    it('should reject POST without CSRF token with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.error?.message).toContain('CSRF');
    });

    it('should accept POST with valid CSRF token', async () => {
      // First, get a CSRF token
      const csrfRes = await request(app.getHttpServer())
        .get('/auth/csrf-token')
        .expect(200);

      const csrfToken = csrfRes.body.csrfToken;
      const cookies = csrfRes.headers['set-cookie'];
      const csrfCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('__csrf='))
        : cookies;

      // Use it in a POST (login will fail with 401 but NOT 403)
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Cookie', csrfCookie || '')
        .set('X-CSRF-Token', csrfToken)
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      // Should get 401 (invalid credentials), NOT 403 (CSRF)
      expect(loginRes.status).toBe(401);
    });
  });
});
```

---

## Testing Checklist

### Helmet / Security Headers (SCRUM-57)
- [ ] `X-Content-Type-Options: nosniff` present on all API responses
- [ ] `X-Frame-Options: DENY` present on all API responses
- [ ] `X-XSS-Protection` NOT present (disabled intentionally)
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` present
- [ ] `X-Powered-By` header removed (Helmet default behavior)
- [ ] `X-Download-Options: noopen` present (Helmet default)

### Content Security Policy (SCRUM-58)
- [ ] API CSP: `default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'`
- [ ] Frontend CSP: includes `nonce-<random>` in `script-src`
- [ ] Frontend CSP: `connect-src 'self' <API_URL>` allows API calls
- [ ] Frontend CSP: `img-src` includes Google/GitHub avatar domains
- [ ] Frontend CSP: `style-src 'self' 'unsafe-inline'` (Tailwind requirement)
- [ ] CSP nonce rotates per request (verify different nonces on consecutive requests)
- [ ] Swagger UI (`/api/docs`) still loads correctly with API CSP

### CSRF Protection (SCRUM-59)
- [ ] `GET /auth/csrf-token` returns `{ csrfToken }` and sets `__csrf` HttpOnly cookie
- [ ] `POST /auth/login` without CSRF token returns 403
- [ ] `POST /auth/login` with valid CSRF token proceeds (returns 401 for bad creds, not 403)
- [ ] `POST /auth/register` requires CSRF token
- [ ] `POST /auth/refresh` requires CSRF token
- [ ] `POST /auth/logout` requires CSRF token
- [ ] `PATCH /users/me` requires CSRF token
- [ ] `PATCH /users/me/password` requires CSRF token
- [ ] `DELETE /users/:id` requires CSRF token
- [ ] OAuth redirect endpoints (`GET /auth/google`, `GET /auth/github`) exempt from CSRF
- [ ] OAuth callback endpoints exempt from CSRF
- [ ] Token with tampered HMAC signature rejected
- [ ] Cookie-header mismatch rejected
- [ ] Frontend `ApiClient` auto-fetches and attaches CSRF tokens on state-changing requests
- [ ] Frontend auto-retries on 403 CSRF error (clears cache, re-fetches token)
- [ ] CSRF cookie: `HttpOnly`, `SameSite=Strict`, `Secure` (in production)

### CORS Hardening (SCRUM-60)
- [ ] Requests from allowed origin succeed
- [ ] Requests from disallowed origin are rejected
- [ ] Requests with no origin succeed (server-to-server compatibility)
- [ ] `Access-Control-Allow-Credentials: true` present
- [ ] `Access-Control-Allow-Headers` includes `X-CSRF-Token`
- [ ] Preflight `OPTIONS` requests return correct headers
- [ ] `CORS_ALLOWED_ORIGINS` env var supports comma-separated values
- [ ] Fallback to `FRONTEND_URL` when `CORS_ALLOWED_ORIGINS` not set

### Referrer-Policy (SCRUM-61)
- [ ] API response: `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Frontend response: `Referrer-Policy: strict-origin-when-cross-origin`

### Permissions-Policy (SCRUM-62)
- [ ] API response includes `Permissions-Policy` header
- [ ] `camera=()` restricts camera access
- [ ] `microphone=()` restricts microphone access
- [ ] `geolocation=()` restricts geolocation access
- [ ] `interest-cohort=()` opts out of FLoC/Topics
- [ ] Frontend `next.config.mjs` sets matching `Permissions-Policy`

### Next.js Security Headers (SCRUM-63)
- [ ] `X-Content-Type-Options: nosniff` present on frontend responses
- [ ] `X-Frame-Options: DENY` present on frontend responses
- [ ] `Strict-Transport-Security` present on frontend responses
- [ ] `Referrer-Policy` present on frontend responses
- [ ] `Permissions-Policy` present on frontend responses
- [ ] CSP nonce in middleware applied to all page routes
- [ ] Static assets (`_next/static`) excluded from middleware

### Build & Regression
- [ ] `nest build` succeeds (nexacore-api)
- [ ] `next build` succeeds (nexacore-dashboard)
- [ ] All existing unit tests pass
- [ ] All existing e2e tests pass
- [ ] Login flow works end-to-end with CSRF
- [ ] Registration flow works end-to-end with CSRF
- [ ] OAuth login (Google/GitHub) works without CSRF interference
- [ ] Profile update works with CSRF
- [ ] Admin user management works with CSRF
- [ ] Swagger UI loads and is functional

---

## Error Handling

### CSRF Errors

| Scenario | Status | Error Code | Message |
|---|---|---|---|
| Missing CSRF cookie or header | 403 | `FORBIDDEN` | `CSRF token missing` |
| Invalid HMAC signature on token | 403 | `FORBIDDEN` | `Invalid CSRF token` |
| Cookie and header tokens do not match | 403 | `FORBIDDEN` | `CSRF token mismatch` |

### CORS Errors

| Scenario | Behavior |
|---|---|
| Disallowed origin | Request rejected by CORS middleware (no `Access-Control-Allow-Origin` header) |
| Missing origin (server-to-server) | Allowed through (backward compatible) |

### CSP Violations (Frontend)

| Scenario | Behavior |
|---|---|
| Inline script without nonce | Blocked by browser, logged to console |
| External script from unauthorized domain | Blocked by browser |
| Image from unauthorized domain | Blocked by browser |

### Frontend CSRF Auto-Recovery

```
1. ApiClient sends POST with stale/invalid CSRF token
2. Server returns 403 with "CSRF" in error message
3. ApiClient clears cached token
4. ApiClient fetches new token from GET /auth/csrf-token
5. ApiClient retries the original request with new token
6. If retry also fails, error propagates to caller
```

---

## Non-Functional Requirements

### Performance

| Aspect | Target | Notes |
|---|---|---|
| Helmet overhead per request | < 1ms | Helmet sets static headers; negligible overhead |
| CSRF token generation | < 2ms | `crypto.randomBytes(32)` + HMAC computation |
| CSP nonce generation (frontend) | < 1ms | `crypto.getRandomValues(16)` per request |
| CORS origin validation | < 0.1ms | Array `includes()` on small allowlist |
| Preflight cache | 24 hours | `Access-Control-Max-Age: 86400` reduces OPTIONS requests |

### Security Standards Compliance

| Standard | Status |
|---|---|
| OWASP Secure Headers | Fully compliant (all recommended headers set) |
| OWASP CSRF Prevention Cheat Sheet | Double-submit cookie with HMAC signing |
| OWASP CORS Cheat Sheet | Explicit allowlist, no wildcards |
| CSP Level 3 | Nonce-based with `strict-dynamic` (frontend) |
| HSTS Preload | Eligible (`max-age >= 1 year`, `includeSubDomains`, `preload`) |

### Compatibility

| Item | Notes |
|---|---|
| Swagger UI | Works with API CSP (`crossOriginEmbedderPolicy: false`) |
| OAuth redirects | Exempt from CSRF and frame restrictions via `@SkipCsrf()` |
| Next.js hot reload (dev) | CSP `style-src 'unsafe-inline'` allows Tailwind injection |
| Server-to-server API calls | CORS allows requests with no `Origin` header |

---

## Dependencies

### New Packages (nexacore-api)

| Package | Version | Purpose |
|---|---|---|
| `helmet` | ^8.1.0 | Security headers middleware (CSP, HSTS, X-Frame-Options, etc.) |
| `cookie-parser` | ^1.4.7 | Parse cookies from incoming requests (required for CSRF) |
| `@types/cookie-parser` | ^1.4.7 | TypeScript types for cookie-parser (devDependency) |

### New Packages (nexacore-dashboard)

None. The frontend uses native `crypto.getRandomValues()` (available in Edge Runtime) and `fetch` API.

### Existing Dependencies Used

| Package | Usage in this story |
|---|---|
| `@nestjs/common` | `CanActivate`, `ExecutionContext`, `ForbiddenException`, `SetMetadata` |
| `@nestjs/core` | `Reflector`, `APP_GUARD` |
| `next` | `NextRequest`, `NextResponse`, middleware API |
| `crypto` (Node.js built-in) | HMAC, randomBytes for CSRF tokens |

---

## Environment Variables

### New Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CORS_ALLOWED_ORIGINS` | No | Falls back to `FRONTEND_URL` | Comma-separated list of allowed origins for CORS |
| `CSRF_SECRET` | Yes (production) | Dev fallback provided | Secret key for HMAC-signing CSRF tokens (min 32 chars) |
| `NODE_ENV` | No | `development` | Controls `Secure` flag on CSRF cookie |

### Updated `.env.example`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/em_ecosystem?schema=public"
JWT_SECRET="your-jwt-secret-min-32-characters-long"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=3000
FRONTEND_URL="http://localhost:3001"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"

# Security (SCRUM-27)
CORS_ALLOWED_ORIGINS="http://localhost:3001"
CSRF_SECRET="your-csrf-secret-min-32-characters-long"
NODE_ENV="development"
```

---

## Documentation Updates

| File | Changes |
|---|---|
| `ai-specs/specs/backend-standards.mdc` | Add "Security Headers & CSRF" section documenting Helmet config, CSRF flow, CORS policy |
| `ai-specs/specs/frontend-standards.mdc` | Add "Security Headers" section documenting Next.js middleware CSP nonce pattern |
| `ai-specs/specs/api-spec.yml` | Add `GET /auth/csrf-token` endpoint; document `X-CSRF-Token` header requirement on state-changing endpoints |
| `nexacore-api/.env.example` | Add `CORS_ALLOWED_ORIGINS`, `CSRF_SECRET`, `NODE_ENV` |

---

## Definition of Done

- [ ] `helmet` installed and registered in `main.ts` bootstrap
- [ ] All Helmet security headers verified in API responses (X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy)
- [ ] Content Security Policy configured for API (restrictive) and frontend (nonce-based)
- [ ] CSP nonce generated per-request in Next.js middleware
- [ ] CSRF double-submit cookie pattern implemented with HMAC-signed tokens
- [ ] `GET /auth/csrf-token` endpoint issues token and sets HttpOnly cookie
- [ ] `CsrfGuard` registered as global guard, validates all state-changing requests
- [ ] `@SkipCsrf()` decorator applied to OAuth and safe endpoints
- [ ] Frontend `ApiClient` fetches, caches, and attaches CSRF tokens automatically
- [ ] Frontend auto-retries on CSRF 403 (clears cache, re-fetches)
- [ ] CORS hardened: explicit origin allowlist from `CORS_ALLOWED_ORIGINS` env var
- [ ] CORS credentials enabled, `X-CSRF-Token` in allowed headers
- [ ] Permissions-Policy restricts camera, microphone, geolocation, FLoC
- [ ] `next.config.mjs` sets security headers on all frontend routes
- [ ] All unit tests pass (including new `csrf.guard.spec.ts`)
- [ ] All e2e tests pass (including new `security-headers.e2e-spec.ts`)
- [ ] `nest build` succeeds
- [ ] `next build` succeeds
- [ ] Existing login/register/OAuth/profile/admin flows verified working
- [ ] Swagger UI functional
- [ ] `.env.example` updated with new variables
- [ ] No TypeScript errors
