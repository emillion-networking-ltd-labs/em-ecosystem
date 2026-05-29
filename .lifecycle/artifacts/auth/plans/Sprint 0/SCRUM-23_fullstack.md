# Fullstack Implementation Plan: SCRUM-23 OAuth Security Hardening

## Overview

- **Epic**: SCRUM-22 (Auth Security Hardening)
- **Ticket**: SCRUM-23
- **Priority**: CRITICAL -- Layer 1 of 8
- **What this fixes**: The current OAuth callback flow passes JWT access tokens and refresh tokens as URL query parameters in plaintext (`/auth/callback?accessToken=...&refreshToken=...`). This exposes tokens to browser history, server logs, referrer headers, and shoulder-surfing. Additionally, the flow has no OAuth `state` parameter validation (CSRF vulnerability, OWASP A5:2017), no PKCE support, and no redirect URL allowlisting (open redirect risk, OWASP A7:2021).
- **OWASP References**:
  - **A01:2021 Broken Access Control** -- tokens in URLs enable unauthorized access via log leakage
  - **A05:2021 Security Misconfiguration** -- missing state validation, no redirect allowlist
  - **A07:2021 Identification and Authentication Failures** -- token leakage via query params
  - **CWE-601** -- Open redirect via unvalidated `FRONTEND_URL`
  - **CWE-352** -- CSRF via missing OAuth state parameter
  - **RFC 7636** -- PKCE for public clients (future enhancement, scoped out of this ticket)

## Architecture Context

### Current OAuth Flow (INSECURE)

```
Frontend                          Backend (NestJS)                  OAuth Provider
   |                                  |                                  |
   |-- GET /auth/google ------------->|                                  |
   |                                  |-- 302 redirect to Google ------->|
   |                                  |                                  |
   |                                  |<-- callback with code -----------|
   |                                  |                                  |
   |                                  |-- validate code, get profile     |
   |                                  |-- generate JWT pair              |
   |                                  |                                  |
   |<-- 302 /auth/callback?           |                                  |
   |    accessToken=xxx               |                                  |
   |    &refreshToken=yyy             |                                  |
   |                                  |                                  |
   |-- read tokens from URL           |                                  |
   |-- POST /api/auth/set-tokens      |                                  |
   |    { refreshToken }              |                                  |
   |-- GET /auth/me (Bearer access)   |                                  |
```

**Problems:**
1. Tokens in URL query parameters -- exposed in browser history, server access logs, Referer headers, HTTP proxies
2. No `state` parameter -- CSRF attack can force authentication with attacker's account
3. No redirect URL validation -- FRONTEND_URL is trusted blindly, allowing open redirect if env is compromised
4. No mechanism to bind OAuth initiation to callback (session fixation risk)

### New Secure OAuth Flow

```
Frontend                          Backend (NestJS)                  OAuth Provider
   |                                  |                                  |
   |-- GET /auth/google ------------->|                                  |
   |                                  |-- generate state (random UUID)   |
   |                                  |-- store state in OAuthStateStore |
   |                                  |    (in-memory with TTL)          |
   |                                  |-- pass state to OAuth provider   |
   |                                  |-- 302 redirect to Google ------->|
   |                                  |                                  |
   |                                  |<-- callback with code + state ---|
   |                                  |                                  |
   |                                  |-- validate state against store   |
   |                                  |-- delete state (single use)      |
   |                                  |-- validate code, get profile     |
   |                                  |-- generate JWT pair              |
   |                                  |-- generate ephemeral code (UUID) |
   |                                  |-- store code -> tokens mapping   |
   |                                  |    (OAuthCodeStore, 60s TTL)     |
   |                                  |                                  |
   |<-- 302 /auth/callback?           |                                  |
   |    code=<ephemeral>&state=ok     |                                  |
   |                                  |                                  |
   |-- POST /auth/oauth/exchange      |                                  |
   |    { code: <ephemeral> }         |                                  |
   |                                  |                                  |
   |                                  |-- lookup code in OAuthCodeStore  |
   |                                  |-- delete code (single use)       |
   |                                  |-- return { accessToken,          |
   |                                  |    refreshToken, user }          |
   |                                  |                                  |
   |<-- { accessToken, refreshToken } |                                  |
   |                                  |                                  |
   |-- POST /api/auth/set-tokens      |                                  |
   |    { refreshToken }              |                                  |
   |-- dispatch AUTH_SUCCESS           |                                  |
```

**Security improvements:**
1. Tokens NEVER appear in URLs -- exchanged via POST body over HTTPS
2. State parameter validates CSRF -- cryptographically random, single-use, time-limited
3. Ephemeral authorization code is single-use, time-limited (60s), and useless without backend exchange
4. Redirect URL validated against allowlist
5. All codes/states cleaned up automatically via TTL expiration

### Modules Affected

| Module | Package | Changes |
|--------|---------|---------|
| `auth` | `nexacore-api` | New stores, new endpoint, modified controller + strategies |
| `auth` (frontend) | `nexacore-dashboard` | Modified OAuthCallbackHandler, modified AuthContext |

## Endpoint Specification

### New Endpoints

| Method | URL | Auth | Request Body | Response Body | Status Codes |
|--------|-----|------|-------------|---------------|--------------|
| `POST` | `/auth/oauth/exchange` | None (public) | `{ "code": "string" }` | `{ "accessToken": "string", "refreshToken": "string", "user": SafeUser }` | `200` OK, `400` Invalid/missing code, `401` Expired/used code |

### Modified Endpoints

| Method | URL | Change Description |
|--------|-----|--------------------|
| `GET` | `/auth/google` | Now generates and stores OAuth state, passes to provider |
| `GET` | `/auth/google/callback` | Validates state, generates ephemeral code, redirects with code only |
| `GET` | `/auth/github` | Now generates and stores OAuth state, passes to provider |
| `GET` | `/auth/github/callback` | Validates state, generates ephemeral code, redirects with code only |

### Redirect URL Changes

| Before | After |
|--------|-------|
| `{FRONTEND_URL}/auth/callback?accessToken=xxx&refreshToken=yyy` | `{FRONTEND_URL}/auth/callback?code=<ephemeral_uuid>` |

## Database Changes

**None.** All state and ephemeral code storage is in-memory with TTL-based expiration. This is acceptable because:
- OAuth state parameters are valid for 5 minutes max
- Ephemeral codes are valid for 60 seconds max
- In a multi-instance deployment, a future migration to Redis would be straightforward (the store interface is abstracted)
- The volume is bounded (one entry per active OAuth flow)

## Files to Create

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `nexacore-api/src/auth/stores/oauth-state.store.ts` | In-memory store for OAuth state parameters with TTL cleanup |
| 2 | `nexacore-api/src/auth/stores/oauth-code.store.ts` | In-memory store for ephemeral authorization codes mapping to token payloads |
| 3 | `nexacore-api/src/auth/dto/oauth-exchange.dto.ts` | DTO for the `/auth/oauth/exchange` endpoint |
| 4 | `nexacore-api/src/auth/guards/oauth-state.guard.ts` | Guard that validates the OAuth state parameter on callbacks |
| 5 | `nexacore-api/src/auth/tests/oauth-state.store.spec.ts` | Unit tests for OAuthStateStore |
| 6 | `nexacore-api/src/auth/tests/oauth-code.store.spec.ts` | Unit tests for OAuthCodeStore |
| 7 | `nexacore-api/src/auth/tests/oauth-exchange.spec.ts` | Unit tests for the exchange endpoint |

## Files to Modify

| # | File Path | Changes |
|---|-----------|---------|
| 1 | `nexacore-api/src/auth/auth.controller.ts` | Add `POST /auth/oauth/exchange` endpoint; replace token-in-URL redirects in `googleAuthCallback` and `githubAuthCallback` with ephemeral code redirects; add state generation to `googleAuth`/`githubAuth`; inject OAuthStateStore and OAuthCodeStore; add redirect URL validation |
| 2 | `nexacore-api/src/auth/auth.service.ts` | Add `exchangeOAuthCode()` method; add `generateOAuthCode()` method |
| 3 | `nexacore-api/src/auth/auth.module.ts` | Register OAuthStateStore and OAuthCodeStore as providers |
| 4 | `nexacore-api/src/auth/strategies/google.strategy.ts` | Enable `passReqToCallback: true` to access the request's state parameter |
| 5 | `nexacore-api/src/auth/strategies/github.strategy.ts` | Enable `passReqToCallback: true` to access the request's state parameter |
| 6 | `nexacore-api/src/auth/guards/google-auth.guard.ts` | Override `getAuthenticateOptions()` to inject the state parameter from OAuthStateStore |
| 7 | `nexacore-api/src/auth/guards/github-auth.guard.ts` | Override `getAuthenticateOptions()` to inject the state parameter from OAuthStateStore |
| 8 | `nexacore-api/.env.example` | Add `OAUTH_ALLOWED_REDIRECT_URLS` variable |
| 9 | `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx` | Replace reading tokens from URL with reading ephemeral code, call new `POST /auth/oauth/exchange` via `apiClient`, then store tokens |
| 10 | `nexacore-dashboard/src/context/AuthContext.tsx` | Replace `handleOAuthCallback(accessToken, refreshToken)` signature with `handleOAuthCallback(code: string)` that calls the exchange endpoint |
| 11 | `nexacore-dashboard/src/lib/types.ts` | Add `OAuthExchangeResponse` type alias (same shape as `AuthResponse`) |
| 12 | `nexacore-api/src/auth/tests/auth.controller.spec.ts` | Update OAuth callback tests; add tests for exchange endpoint |
| 13 | `nexacore-api/src/auth/tests/auth.service.spec.ts` | Add tests for `exchangeOAuthCode` and `generateOAuthCode` |
| 14 | `nexacore-api/src/auth/tests/google.strategy.spec.ts` | Update for `passReqToCallback` changes |
| 15 | `nexacore-api/src/auth/tests/github.strategy.spec.ts` | Update for `passReqToCallback` changes |

## Implementation Steps (Ordered)

### Step 0: Create Feature Branch

```bash
cd em-ecosystem-code
git checkout -b feature/SCRUM-23-oauth-security-hardening
```

---

### Step 1: Create OAuthStateStore

- **File**: `nexacore-api/src/auth/stores/oauth-state.store.ts`
- **Action**: Create an injectable in-memory store for OAuth state parameters
- **Function Signature**:
  ```typescript
  @Injectable()
  export class OAuthStateStore {
    generate(): string;
    validate(state: string): boolean;
    cleanup(): void;
  }
  ```
- **Implementation Steps**:
  1. Create a `Map<string, number>` where key = state string, value = timestamp of creation
  2. `generate()`: Create a cryptographically random UUID using `crypto.randomUUID()`, store it with `Date.now()`, return the state string
  3. `validate(state)`: Check if state exists in the map AND was created less than `STATE_TTL_MS` (300000 = 5 minutes) ago. If valid, DELETE it from the map (single-use) and return `true`. Otherwise return `false`.
  4. `cleanup()`: Remove all entries older than `STATE_TTL_MS`. Call this from `generate()` to prevent memory leaks.
  5. The store is decorated with `@Injectable()` with default singleton scope (NestJS default)
- **Dependencies**:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { randomUUID } from 'crypto';
  ```
- **Implementation Notes**:
  - The `STATE_TTL_MS` should be a constant: `5 * 60 * 1000` (5 minutes)
  - `randomUUID()` is available in Node.js 14.17+ (our project uses Node 18+)
  - The cleanup is opportunistic (runs on each `generate()` call). Given the low volume of OAuth initiations, a scheduled interval is unnecessary.

**Full implementation**:
```typescript
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

const STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class OAuthStateStore {
  private readonly states = new Map<string, number>();

  generate(): string {
    this.cleanup();
    const state = randomUUID();
    this.states.set(state, Date.now());
    return state;
  }

  validate(state: string): boolean {
    const timestamp = this.states.get(state);
    if (!timestamp) return false;

    this.states.delete(state); // single-use

    if (Date.now() - timestamp > STATE_TTL_MS) return false;

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [state, timestamp] of this.states) {
      if (now - timestamp > STATE_TTL_MS) {
        this.states.delete(state);
      }
    }
  }
}
```

---

### Step 2: Create OAuthCodeStore

- **File**: `nexacore-api/src/auth/stores/oauth-code.store.ts`
- **Action**: Create an injectable in-memory store that maps ephemeral codes to token payloads
- **Function Signature**:
  ```typescript
  export interface OAuthTokenPayload {
    accessToken: string;
    refreshToken: string;
    user: SafeUser;
  }

  @Injectable()
  export class OAuthCodeStore {
    store(payload: OAuthTokenPayload): string;
    exchange(code: string): OAuthTokenPayload | null;
    cleanup(): void;
  }
  ```
- **Implementation Steps**:
  1. Create a `Map<string, { payload: OAuthTokenPayload; timestamp: number }>`
  2. `store(payload)`: Generate a UUID code, store the payload with the current timestamp, return the code
  3. `exchange(code)`: Look up the code. If found and not expired (`CODE_TTL_MS` = 60000 = 60 seconds), DELETE it (single-use) and return the payload. Otherwise return `null`.
  4. `cleanup()`: Remove all entries older than `CODE_TTL_MS`. Called from `store()`.
- **Dependencies**:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { randomUUID } from 'crypto';
  import { SafeUser } from '../../users/entities/user.entity';
  ```
- **Implementation Notes**:
  - `CODE_TTL_MS = 60 * 1000` (60 seconds) -- extremely short-lived, tokens must be exchanged immediately
  - Single use: once exchanged, the code is deleted and cannot be reused (replay protection)

**Full implementation**:
```typescript
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SafeUser } from '../../users/entities/user.entity';

const CODE_TTL_MS = 60 * 1000; // 60 seconds

export interface OAuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

@Injectable()
export class OAuthCodeStore {
  private readonly codes = new Map<
    string,
    { payload: OAuthTokenPayload; timestamp: number }
  >();

  store(payload: OAuthTokenPayload): string {
    this.cleanup();
    const code = randomUUID();
    this.codes.set(code, { payload, timestamp: Date.now() });
    return code;
  }

  exchange(code: string): OAuthTokenPayload | null {
    const entry = this.codes.get(code);
    if (!entry) return null;

    this.codes.delete(code); // single-use

    if (Date.now() - entry.timestamp > CODE_TTL_MS) return null;

    return entry.payload;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [code, entry] of this.codes) {
      if (now - entry.timestamp > CODE_TTL_MS) {
        this.codes.delete(code);
      }
    }
  }
}
```

---

### Step 3: Create OAuthExchangeDto

- **File**: `nexacore-api/src/auth/dto/oauth-exchange.dto.ts`
- **Action**: Create a DTO for validating the exchange request body
- **Function Signature**:
  ```typescript
  export class OAuthExchangeDto {
    @ApiProperty({ description: 'Ephemeral authorization code from OAuth callback', example: 'a1b2c3d4-...' })
    @IsString()
    @IsNotEmpty()
    code: string;
  }
  ```
- **Dependencies**:
  ```typescript
  import { IsString, IsNotEmpty } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  ```

**Full implementation**:
```typescript
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthExchangeDto {
  @ApiProperty({
    description: 'Ephemeral authorization code received from OAuth callback redirect',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
```

---

### Step 4: Modify OAuth Auth Guards to Inject State Parameter

- **File**: `nexacore-api/src/auth/guards/google-auth.guard.ts`
- **Action**: Override `getAuthenticateOptions()` to include dynamically generated state parameter; inject OAuthStateStore
- **Implementation Steps**:
  1. Convert from simple `AuthGuard('google')` to a full class with constructor injection
  2. Inject `OAuthStateStore` via constructor
  3. Override `getAuthenticateOptions(context: ExecutionContext)` to return `{ state: this.oauthStateStore.generate() }` -- but ONLY for the initiation request (GET `/auth/google`), not for the callback
  4. For the callback route, Passport reads the state from the query and makes it available; we validate it separately

**Full implementation for Google guard**:
```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateStore } from '../stores/oauth-state.store';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly oauthStateStore: OAuthStateStore) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // Only generate state for the initiation endpoint, not the callback
    if (!request.query?.code) {
      return { state: this.oauthStateStore.generate() };
    }
    return {};
  }
}
```

- **File**: `nexacore-api/src/auth/guards/github-auth.guard.ts`
- **Action**: Same pattern as Google guard but for GitHub

**Full implementation for GitHub guard**:
```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateStore } from '../stores/oauth-state.store';

@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  constructor(private readonly oauthStateStore: OAuthStateStore) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.query?.code) {
      return { state: this.oauthStateStore.generate() };
    }
    return {};
  }
}
```

---

### Step 5: Modify OAuth Strategies for State Validation

- **File**: `nexacore-api/src/auth/strategies/google.strategy.ts`
- **Action**: Enable `passReqToCallback: true` so we can read the `state` query parameter from the request; inject OAuthStateStore for validation
- **Implementation Steps**:
  1. Add `passReqToCallback: true` to the `super()` options
  2. Update the `validate` method signature to accept `req` as the first parameter
  3. Extract `state` from `req.query.state`
  4. Validate the state against OAuthStateStore
  5. If state is invalid, call `done(new Error('Invalid OAuth state parameter'))` and return early

**Full implementation**:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateStore: OAuthStateStore,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: { query: { state?: string } },
    _accessToken: string,
    _refreshToken: string,
    profile: {
      emails?: { value: string }[];
      id: string;
      name?: { givenName?: string; familyName?: string };
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    // Validate OAuth state parameter (CSRF protection)
    const state = req.query?.state;
    if (!state || !this.oauthStateStore.validate(state)) {
      done(new Error('Invalid or expired OAuth state parameter'), undefined);
      return;
    }

    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email provided by Google'), undefined);
      return;
    }

    try {
      const result = await this.authService.validateOAuthUser({
        email,
        provider: Provider.GOOGLE,
        providerId: profile.id,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, result);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
```

- **File**: `nexacore-api/src/auth/strategies/github.strategy.ts`
- **Action**: Same pattern -- add `passReqToCallback`, validate state

**Full implementation**:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../stores/oauth-state.store';
import { Provider } from '../../users/enums/provider.enum';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateStore: OAuthStateStore,
  ) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: { query: { state?: string } },
    _accessToken: string,
    _refreshToken: string,
    profile: {
      emails?: { value: string }[];
      id: string;
      displayName?: string;
      photos?: { value: string }[];
    },
    done: (error: Error | null, user?: Record<string, unknown>) => void,
  ): Promise<void> {
    // Validate OAuth state parameter (CSRF protection)
    const state = req.query?.state;
    if (!state || !this.oauthStateStore.validate(state)) {
      done(new Error('Invalid or expired OAuth state parameter'));
      return;
    }

    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email provided by GitHub'));
      return;
    }

    let firstName: string | undefined;
    let lastName: string | undefined;
    if (profile.displayName) {
      const parts = profile.displayName.split(' ');
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
    }

    try {
      const result = await this.authService.validateOAuthUser({
        email,
        provider: Provider.GITHUB,
        providerId: profile.id,
        firstName,
        lastName,
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, result);
    } catch (err) {
      done(err as Error);
    }
  }
}
```

---

### Step 6: Modify AuthService -- Add OAuth Code Exchange Methods

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Inject `OAuthCodeStore`, add methods to generate and exchange ephemeral codes
- **Function Signatures**:
  ```typescript
  generateOAuthCode(tokens: { accessToken: string; refreshToken: string; user: SafeUser }): string;
  exchangeOAuthCode(code: string): { accessToken: string; refreshToken: string; user: SafeUser };
  ```
- **Implementation Steps**:
  1. Add `OAuthCodeStore` to the constructor injection
  2. Add `generateOAuthCode()` method that delegates to `oauthCodeStore.store()`
  3. Add `exchangeOAuthCode()` method that delegates to `oauthCodeStore.exchange()` and throws `UnauthorizedException` if the code is invalid/expired
- **Dependencies**:
  ```typescript
  import { OAuthCodeStore } from './stores/oauth-code.store';
  ```

**Changes to auth.service.ts** (additions only):

```typescript
// Add to constructor:
constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
  private readonly oauthCodeStore: OAuthCodeStore,
) {}

// Add new methods:
generateOAuthCode(payload: {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}): string {
  return this.oauthCodeStore.store(payload);
}

exchangeOAuthCode(code: string): {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
} {
  const payload = this.oauthCodeStore.exchange(code);
  if (!payload) {
    throw new UnauthorizedException('Invalid or expired authorization code');
  }
  return payload;
}
```

---

### Step 7: Modify AuthController -- Replace Token-in-URL with Ephemeral Code

- **File**: `nexacore-api/src/auth/auth.controller.ts`
- **Action**: Modify callback handlers to use ephemeral codes; add exchange endpoint; add redirect URL validation
- **Implementation Steps**:
  1. Add `OAuthExchangeDto` import
  2. Add redirect URL validation helper method
  3. Modify `googleAuthCallback()` to call `authService.generateOAuthCode()` and redirect with code instead of tokens
  4. Modify `githubAuthCallback()` in the same way
  5. Add new `POST /auth/oauth/exchange` endpoint
  6. Add Swagger documentation for the new endpoint

**Changes to auth.controller.ts**:

New imports to add:
```typescript
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { UnauthorizedException } from '@nestjs/common';
```

Add redirect URL validation as a private method:
```typescript
private getValidatedFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const allowedUrls = (process.env.OAUTH_ALLOWED_REDIRECT_URLS || frontendUrl)
    .split(',')
    .map((u) => u.trim());

  if (!allowedUrls.includes(frontendUrl)) {
    throw new UnauthorizedException('Invalid redirect configuration');
  }

  return frontendUrl;
}
```

Replace `googleAuthCallback`:
```typescript
@Get('google/callback')
@UseGuards(GoogleAuthGuard)
@Redirect()
@ApiOperation({ summary: 'Google OAuth callback' })
@ApiResponse({
  status: 302,
  description: 'Redirects to frontend with ephemeral authorization code',
})
googleAuthCallback(
  @Request()
  req: {
    user: { accessToken: string; refreshToken: string; user: SafeUser };
  },
) {
  const code = this.authService.generateOAuthCode(req.user);
  const frontendUrl = this.getValidatedFrontendUrl();
  return {
    url: `${frontendUrl}/auth/callback?code=${code}`,
  };
}
```

Replace `githubAuthCallback` (same pattern):
```typescript
@Get('github/callback')
@UseGuards(GitHubAuthGuard)
@Redirect()
@ApiOperation({ summary: 'GitHub OAuth callback' })
@ApiResponse({
  status: 302,
  description: 'Redirects to frontend with ephemeral authorization code',
})
githubAuthCallback(
  @Request()
  req: {
    user: { accessToken: string; refreshToken: string; user: SafeUser };
  },
) {
  const code = this.authService.generateOAuthCode(req.user);
  const frontendUrl = this.getValidatedFrontendUrl();
  return {
    url: `${frontendUrl}/auth/callback?code=${code}`,
  };
}
```

Add new exchange endpoint:
```typescript
@Post('oauth/exchange')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Exchange ephemeral OAuth code for tokens' })
@ApiResponse({ status: 200, description: 'Tokens returned successfully' })
@ApiResponse({ status: 400, description: 'Invalid request body' })
@ApiResponse({ status: 401, description: 'Invalid or expired authorization code' })
exchangeOAuthCode(@Body() dto: OAuthExchangeDto) {
  return this.authService.exchangeOAuthCode(dto.code);
}
```

Also add `UnauthorizedException` to imports from `@nestjs/common` (it is not currently imported in the controller).

---

### Step 8: Update AuthModule to Register New Providers

- **File**: `nexacore-api/src/auth/auth.module.ts`
- **Action**: Register `OAuthStateStore` and `OAuthCodeStore` as providers
- **Implementation Steps**:
  1. Import both store classes
  2. Add them to the `providers` array

**Full implementation**:
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
import { OAuthStateStore } from './stores/oauth-state.store';
import { OAuthCodeStore } from './stores/oauth-code.store';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
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
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    OAuthStateStore,
    OAuthCodeStore,
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

---

### Step 9: Update .env.example

- **File**: `nexacore-api/.env.example`
- **Action**: Add the new environment variable for allowed redirect URLs

Add at the end:
```
# OAuth Security
OAUTH_ALLOWED_REDIRECT_URLS="http://localhost:3001"
```

---

### Step 10: Modify Frontend -- OAuthCallbackHandler

- **File**: `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx`
- **Action**: Replace reading tokens from URL with reading ephemeral code, then calling the exchange endpoint via AuthContext
- **Implementation Steps**:
  1. Remove `searchParams.get('accessToken')` and `searchParams.get('refreshToken')`
  2. Read `code` from `searchParams.get('code')` instead
  3. Call `handleOAuthCallback(code)` with the single code parameter
  4. Keep error handling as-is

**Full implementation**:
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RingSpinner from '@/components/ui/RingSpinner';

export default function OAuthCallbackHandler() {
  const { handleOAuthCallback, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const urlError = searchParams.get('error');

    if (urlError) {
      setError('Authentication failed. Please try again.');
      setTimeout(() => router.replace('/login?error=oauth_failed'), 2000);
      return;
    }

    if (!code) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    handleOAuthCallback(code).catch(() => {
      router.replace('/login?error=oauth_failed');
    });
  }, [searchParams, handleOAuthCallback, router]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <p className="text-sm text-error">{error}</p>
        ) : (
          <>
            <RingSpinner size="xl" />
            <p className="text-sm text-content-primary/50">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
```

---

### Step 11: Modify Frontend -- AuthContext

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Change `handleOAuthCallback` to accept a single `code` parameter and call the backend exchange endpoint
- **Implementation Steps**:
  1. Change `handleOAuthCallback` signature from `(accessToken: string, refreshToken: string)` to `(code: string)`
  2. Make a POST to the backend `/auth/oauth/exchange` endpoint with `{ code }`
  3. On success, receive `{ accessToken, refreshToken, user }` from the response
  4. Store refresh token in httpOnly cookie via `/api/auth/set-tokens`
  5. Set access token in apiClient
  6. Dispatch `AUTH_SUCCESS`
  7. Update the `AuthContextType` type to match the new signature

**Changes to AuthContext.tsx**:

Update the type:
```typescript
type AuthContextType = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  handleOAuthCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
};
```

Replace the `handleOAuthCallback` implementation:
```typescript
const handleOAuthCallback = useCallback(
  async (code: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/oauth/exchange', { code });
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
        payload: extractErrorMessage(err, 'OAuth authentication failed.'),
      });
    }
  },
  [],
);
```

**Key change**: The old implementation called `apiClient.get<SafeUser>('/auth/me')` separately to get the user. The new implementation gets the user directly from the exchange response (same shape as `AuthResponse`), which is one fewer network round-trip.

---

### Step 12: Update Frontend Types (Optional, for clarity)

- **File**: `nexacore-dashboard/src/lib/types.ts`
- **Action**: The existing `AuthResponse` type already matches the shape returned by `/auth/oauth/exchange`, so no change is strictly needed. However, for documentation clarity, add a type alias:

```typescript
/** Response from POST /auth/oauth/exchange -- same shape as AuthResponse */
export type OAuthExchangeResponse = AuthResponse;
```

This step is optional. The existing `AuthResponse` type works as-is.

---

### Step 13: Update Existing Unit Tests -- auth.controller.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth.controller.spec.ts`
- **Action**: Update OAuth callback tests and add exchange endpoint tests
- **Implementation Steps**:
  1. Add `OAuthCodeStore` mock to the test module providers (or mock `authService.generateOAuthCode` / `authService.exchangeOAuthCode`)
  2. Update `googleAuthCallback` test to expect URL with `code=` parameter (not `accessToken=` / `refreshToken=`)
  3. Update `githubAuthCallback` test similarly
  4. Add test suite for `exchangeOAuthCode` endpoint
  5. Add test for invalid code (should propagate UnauthorizedException)

**Updated test for googleAuthCallback**:
```typescript
describe('googleAuthCallback', () => {
  it('should return redirect URL with ephemeral code (not tokens)', () => {
    authService.generateOAuthCode = jest.fn().mockReturnValue('ephemeral-code-uuid');

    const req = {
      user: {
        accessToken: 'google-access',
        refreshToken: 'google-refresh',
        user: mockAuthResult.user,
      },
    };

    const result = controller.googleAuthCallback(req);

    expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    expect(result.url).toBe('http://localhost:3001/auth/callback?code=ephemeral-code-uuid');
    expect(result.url).not.toContain('accessToken');
    expect(result.url).not.toContain('refreshToken');
  });
});
```

**New test for exchangeOAuthCode**:
```typescript
describe('exchangeOAuthCode', () => {
  it('should return tokens and user for a valid code', async () => {
    authService.exchangeOAuthCode = jest.fn().mockReturnValue(mockAuthResult);

    const result = await controller.exchangeOAuthCode({ code: 'valid-code' });

    expect(authService.exchangeOAuthCode).toHaveBeenCalledWith('valid-code');
    expect(result.accessToken).toBe('access-token-123');
    expect(result.user.email).toBe('test@example.com');
  });

  it('should propagate UnauthorizedException for invalid code', async () => {
    authService.exchangeOAuthCode = jest.fn().mockImplementation(() => {
      throw new UnauthorizedException('Invalid or expired authorization code');
    });

    await expect(controller.exchangeOAuthCode({ code: 'invalid-code' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
```

---

### Step 14: Update Existing Unit Tests -- auth.service.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`
- **Action**: Add test cases for `generateOAuthCode` and `exchangeOAuthCode`; add OAuthCodeStore mock
- **Implementation Steps**:
  1. Add `OAuthCodeStore` mock to the providers
  2. Add test suite for `generateOAuthCode`
  3. Add test suite for `exchangeOAuthCode`

**Mock addition in beforeEach**:
```typescript
{
  provide: OAuthCodeStore,
  useValue: {
    store: jest.fn(),
    exchange: jest.fn(),
  },
},
```

**New test suites**:
```typescript
describe('generateOAuthCode', () => {
  it('should store the token payload and return an ephemeral code', () => {
    const payload = { accessToken: 'at', refreshToken: 'rt', user: toSafeUser(mockUser) };
    oauthCodeStore.store.mockReturnValue('ephemeral-code-123');

    const code = authService.generateOAuthCode(payload);

    expect(oauthCodeStore.store).toHaveBeenCalledWith(payload);
    expect(code).toBe('ephemeral-code-123');
  });
});

describe('exchangeOAuthCode', () => {
  it('should return token payload for a valid code', () => {
    const payload = { accessToken: 'at', refreshToken: 'rt', user: toSafeUser(mockUser) };
    oauthCodeStore.exchange.mockReturnValue(payload);

    const result = authService.exchangeOAuthCode('valid-code');

    expect(oauthCodeStore.exchange).toHaveBeenCalledWith('valid-code');
    expect(result).toEqual(payload);
  });

  it('should throw UnauthorizedException for null (invalid/expired code)', () => {
    oauthCodeStore.exchange.mockReturnValue(null);

    expect(() => authService.exchangeOAuthCode('bad-code')).toThrow(
      UnauthorizedException,
    );
  });
});
```

---

### Step 15: Update OAuth Strategy Tests

- **File**: `nexacore-api/src/auth/tests/google.strategy.spec.ts`
- **Action**: Update tests to account for `passReqToCallback` and state validation
- **Implementation Steps**:
  1. Add `OAuthStateStore` mock to providers
  2. Update `validate` calls to include `req` as first parameter
  3. Add test case for invalid state parameter
  4. Add test case for missing state parameter

**Updated test for Google strategy**:
```typescript
describe('validate', () => {
  it('should validate state, call authService.validateOAuthUser, and invoke done', async () => {
    oauthStateStore.validate.mockReturnValue(true);
    authService.validateOAuthUser.mockResolvedValue(mockOAuthResult);
    const done = jest.fn();

    await strategy.validate(
      { query: { state: 'valid-state' } },
      'google-access-token',
      'google-refresh-token',
      { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
      done,
    );

    expect(oauthStateStore.validate).toHaveBeenCalledWith('valid-state');
    expect(authService.validateOAuthUser).toHaveBeenCalledWith({
      email: 'google@example.com',
      provider: Provider.GOOGLE,
      providerId: 'google-id-123',
    });
    expect(done).toHaveBeenCalledWith(null, mockOAuthResult);
  });

  it('should call done with error when state is invalid', async () => {
    oauthStateStore.validate.mockReturnValue(false);
    const done = jest.fn();

    await strategy.validate(
      { query: { state: 'invalid-state' } },
      'google-access-token',
      'google-refresh-token',
      { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
      done,
    );

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired OAuth state parameter' }),
      undefined,
    );
    expect(authService.validateOAuthUser).not.toHaveBeenCalled();
  });

  it('should call done with error when state is missing', async () => {
    const done = jest.fn();

    await strategy.validate(
      { query: {} },
      'google-access-token',
      'google-refresh-token',
      { emails: [{ value: 'google@example.com' }], id: 'google-id-123' },
      done,
    );

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired OAuth state parameter' }),
      undefined,
    );
  });
});
```

- **File**: `nexacore-api/src/auth/tests/github.strategy.spec.ts`
- **Action**: Same pattern as Google strategy tests -- apply the analogous changes for state parameter validation and `passReqToCallback`.

---

### Step 16: Write New Unit Tests -- oauth-state.store.spec.ts

- **File**: `nexacore-api/src/auth/tests/oauth-state.store.spec.ts`
- **Action**: Comprehensive unit tests for OAuthStateStore

**Full implementation**:
```typescript
import { OAuthStateStore } from '../stores/oauth-state.store';

describe('OAuthStateStore', () => {
  let store: OAuthStateStore;

  beforeEach(() => {
    store = new OAuthStateStore();
  });

  describe('generate', () => {
    it('should return a non-empty string', () => {
      const state = store.generate();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should return unique values on each call', () => {
      const state1 = store.generate();
      const state2 = store.generate();
      expect(state1).not.toBe(state2);
    });
  });

  describe('validate', () => {
    it('should return true for a recently generated state', () => {
      const state = store.generate();
      expect(store.validate(state)).toBe(true);
    });

    it('should return false for an unknown state', () => {
      expect(store.validate('nonexistent-state')).toBe(false);
    });

    it('should return false on second use (single-use)', () => {
      const state = store.generate();
      expect(store.validate(state)).toBe(true);
      expect(store.validate(state)).toBe(false);
    });

    it('should return false for an expired state', () => {
      const state = store.generate();

      // Manually manipulate the timestamp to simulate expiry
      // Access private map via type assertion for testing
      const statesMap = (store as unknown as { states: Map<string, number> }).states;
      statesMap.set(state, Date.now() - 6 * 60 * 1000); // 6 minutes ago

      expect(store.validate(state)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const state = store.generate();
      const statesMap = (store as unknown as { states: Map<string, number> }).states;
      statesMap.set(state, Date.now() - 6 * 60 * 1000);

      store.cleanup();

      expect(statesMap.has(state)).toBe(false);
    });

    it('should keep non-expired entries', () => {
      const state = store.generate();
      store.cleanup();
      const statesMap = (store as unknown as { states: Map<string, number> }).states;
      expect(statesMap.has(state)).toBe(true);
    });
  });
});
```

---

### Step 17: Write New Unit Tests -- oauth-code.store.spec.ts

- **File**: `nexacore-api/src/auth/tests/oauth-code.store.spec.ts`
- **Action**: Comprehensive unit tests for OAuthCodeStore

**Full implementation**:
```typescript
import { OAuthCodeStore, OAuthTokenPayload } from '../stores/oauth-code.store';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('OAuthCodeStore', () => {
  let store: OAuthCodeStore;

  const mockPayload: OAuthTokenPayload = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: 'uuid-123',
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      provider: Provider.GOOGLE,
      providerId: 'google-123',
      emailVerified: true,
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    store = new OAuthCodeStore();
  });

  describe('store', () => {
    it('should return a non-empty code string', () => {
      const code = store.store(mockPayload);
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    it('should return unique codes for different store calls', () => {
      const code1 = store.store(mockPayload);
      const code2 = store.store(mockPayload);
      expect(code1).not.toBe(code2);
    });
  });

  describe('exchange', () => {
    it('should return the payload for a valid code', () => {
      const code = store.store(mockPayload);
      const result = store.exchange(code);
      expect(result).toEqual(mockPayload);
    });

    it('should return null for an unknown code', () => {
      expect(store.exchange('nonexistent-code')).toBeNull();
    });

    it('should return null on second exchange (single-use)', () => {
      const code = store.store(mockPayload);
      expect(store.exchange(code)).toEqual(mockPayload);
      expect(store.exchange(code)).toBeNull();
    });

    it('should return null for an expired code', () => {
      const code = store.store(mockPayload);

      // Manipulate timestamp to simulate expiry (> 60 seconds)
      const codesMap = (store as unknown as {
        codes: Map<string, { payload: OAuthTokenPayload; timestamp: number }>;
      }).codes;
      const entry = codesMap.get(code)!;
      codesMap.set(code, { ...entry, timestamp: Date.now() - 61 * 1000 });

      expect(store.exchange(code)).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const code = store.store(mockPayload);
      const codesMap = (store as unknown as {
        codes: Map<string, { payload: OAuthTokenPayload; timestamp: number }>;
      }).codes;
      const entry = codesMap.get(code)!;
      codesMap.set(code, { ...entry, timestamp: Date.now() - 61 * 1000 });

      store.cleanup();

      expect(codesMap.has(code)).toBe(false);
    });

    it('should keep non-expired entries', () => {
      const code = store.store(mockPayload);
      store.cleanup();
      const codesMap = (store as unknown as {
        codes: Map<string, { payload: OAuthTokenPayload; timestamp: number }>;
      }).codes;
      expect(codesMap.has(code)).toBe(true);
    });
  });
});
```

---

### Step 18: Write Integration Test for OAuth Exchange Flow

- **File**: `nexacore-api/src/auth/tests/oauth-exchange.spec.ts`
- **Action**: Integration-style test that validates the full code generation and exchange cycle

**Full implementation**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { UsersService } from '../../users/users.service';
import { OAuthCodeStore } from '../stores/oauth-code.store';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('OAuth Exchange Flow (Integration)', () => {
  let controller: AuthController;
  let oauthCodeStore: OAuthCodeStore;

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: null,
    lastName: null,
    avatarUrl: null,
    role: Role.USER,
    provider: Provider.GOOGLE,
    providerId: 'google-123',
    emailVerified: true,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    oauthCodeStore = new OAuthCodeStore();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            generateOAuthCode: jest.fn().mockImplementation((payload) =>
              oauthCodeStore.store(payload),
            ),
            exchangeOAuthCode: jest.fn().mockImplementation((code) => {
              const result = oauthCodeStore.exchange(code);
              if (!result) {
                throw new UnauthorizedException('Invalid or expired authorization code');
              }
              return result;
            }),
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should complete the full OAuth code exchange cycle', async () => {
    // Step 1: Simulate callback generating a code
    const tokenPayload = {
      accessToken: 'real-access-token',
      refreshToken: 'real-refresh-token',
      user: mockUser,
    };
    const req = { user: tokenPayload };
    const redirectResult = controller.googleAuthCallback(req);

    // Step 2: Extract code from redirect URL
    const url = new URL(redirectResult.url);
    const code = url.searchParams.get('code');
    expect(code).toBeTruthy();
    expect(url.searchParams.has('accessToken')).toBe(false);
    expect(url.searchParams.has('refreshToken')).toBe(false);

    // Step 3: Exchange code for tokens
    const exchangeResult = await controller.exchangeOAuthCode({ code: code! });
    expect(exchangeResult.accessToken).toBe('real-access-token');
    expect(exchangeResult.refreshToken).toBe('real-refresh-token');
    expect(exchangeResult.user.email).toBe('test@example.com');
  });

  it('should reject a code that has already been used', async () => {
    const req = {
      user: { accessToken: 'at', refreshToken: 'rt', user: mockUser },
    };
    const redirectResult = controller.googleAuthCallback(req);
    const code = new URL(redirectResult.url).searchParams.get('code')!;

    // First exchange succeeds
    await controller.exchangeOAuthCode({ code });

    // Second exchange fails
    await expect(controller.exchangeOAuthCode({ code })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject a fabricated code', async () => {
    await expect(
      controller.exchangeOAuthCode({ code: 'fabricated-code-123' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

---

### Step 19: Update Technical Documentation

- **Files to update** (not code files -- just noting which specs need changes):
  - `ai-specs/specs/api-spec.yml`: Add `POST /auth/oauth/exchange` endpoint definition; update `GET /auth/{provider}/callback` response descriptions
  - `ai-specs/specs/backend-standards.mdc`: Add note about OAuth security pattern (ephemeral code exchange, state validation)

---

## Testing Checklist

### Unit Tests

| # | Test Case | File |
|---|-----------|------|
| 1 | OAuthStateStore generates unique states | `oauth-state.store.spec.ts` |
| 2 | OAuthStateStore validates recently generated state | `oauth-state.store.spec.ts` |
| 3 | OAuthStateStore rejects unknown state | `oauth-state.store.spec.ts` |
| 4 | OAuthStateStore enforces single-use | `oauth-state.store.spec.ts` |
| 5 | OAuthStateStore rejects expired state (>5min) | `oauth-state.store.spec.ts` |
| 6 | OAuthStateStore cleanup removes expired entries | `oauth-state.store.spec.ts` |
| 7 | OAuthCodeStore generates unique codes | `oauth-code.store.spec.ts` |
| 8 | OAuthCodeStore returns payload for valid code | `oauth-code.store.spec.ts` |
| 9 | OAuthCodeStore returns null for unknown code | `oauth-code.store.spec.ts` |
| 10 | OAuthCodeStore enforces single-use | `oauth-code.store.spec.ts` |
| 11 | OAuthCodeStore returns null for expired code (>60s) | `oauth-code.store.spec.ts` |
| 12 | OAuthCodeStore cleanup removes expired entries | `oauth-code.store.spec.ts` |
| 13 | AuthService.generateOAuthCode delegates to store | `auth.service.spec.ts` |
| 14 | AuthService.exchangeOAuthCode returns payload for valid code | `auth.service.spec.ts` |
| 15 | AuthService.exchangeOAuthCode throws UnauthorizedException for invalid code | `auth.service.spec.ts` |
| 16 | AuthController.googleAuthCallback returns URL with code (no tokens) | `auth.controller.spec.ts` |
| 17 | AuthController.githubAuthCallback returns URL with code (no tokens) | `auth.controller.spec.ts` |
| 18 | AuthController.exchangeOAuthCode returns tokens for valid code | `auth.controller.spec.ts` |
| 19 | AuthController.exchangeOAuthCode propagates UnauthorizedException | `auth.controller.spec.ts` |
| 20 | GoogleStrategy validates state before processing profile | `google.strategy.spec.ts` |
| 21 | GoogleStrategy rejects invalid state | `google.strategy.spec.ts` |
| 22 | GoogleStrategy rejects missing state | `google.strategy.spec.ts` |
| 23 | GitHubStrategy validates state before processing profile | `github.strategy.spec.ts` |
| 24 | GitHubStrategy rejects invalid state | `github.strategy.spec.ts` |
| 25 | GitHubStrategy rejects missing state | `github.strategy.spec.ts` |

### Integration Tests

| # | Scenario | Description |
|---|----------|-------------|
| 1 | Full OAuth code exchange cycle | Generate code via callback -> extract from URL -> exchange -> receive tokens |
| 2 | Code replay rejection | Exchange same code twice -> second attempt fails with 401 |
| 3 | Fabricated code rejection | Attempt exchange with random string -> fails with 401 |
| 4 | State validation in flow | Generate state -> use it in callback -> validate succeeds; reuse -> fails |

### Manual Verification

**Prerequisites**: Both `nexacore-api` (port 3000) and `nexacore-dashboard` (port 3001) running locally.

1. **Google OAuth flow**:
   - Navigate to `http://localhost:3001/login`
   - Click "Sign in with Google"
   - Verify the URL redirected to by Google contains a `state` parameter
   - Complete Google sign-in
   - Verify the browser is redirected to `http://localhost:3001/auth/callback?code=<uuid>` (NOT `accessToken=...`)
   - Verify the dashboard loads with the authenticated user
   - Check browser history: no tokens should appear in any URL
   - Check Network tab: tokens should only appear in the response body of the POST to `/auth/oauth/exchange`

2. **GitHub OAuth flow**:
   - Same steps as above but with "Sign in with GitHub"

3. **Code replay attack**:
   - Intercept the `code` parameter from the callback URL (use DevTools Network tab)
   - Manually `curl -X POST http://localhost:3000/auth/oauth/exchange -H "Content-Type: application/json" -d '{"code":"<intercepted-code>"}'`
   - Should receive `401 Unauthorized` because the code was already consumed by the frontend

4. **Expired code**:
   - Start an OAuth flow but do NOT let the frontend complete the exchange
   - Wait 60+ seconds
   - Try to manually exchange the code
   - Should receive `401 Unauthorized`

5. **Missing state parameter** (requires temporarily removing state from the flow):
   - Directly navigate to `http://localhost:3000/auth/google/callback?code=fake` (without state)
   - Should receive an error response (not a token leak)

6. **CORS verification**:
   - Verify the exchange endpoint is accessible from the frontend origin
   - Verify it is NOT accessible from unauthorized origins

## Error Handling

| Scenario | Status Code | Error Response |
|----------|-------------|----------------|
| Invalid or expired ephemeral code | `401` | `{ "statusCode": 401, "message": "Invalid or expired authorization code", "error": "Unauthorized" }` |
| Missing code in exchange request | `400` | `{ "statusCode": 400, "message": ["code should not be empty", "code must be a string"], "error": "Bad Request" }` |
| Invalid OAuth state parameter | `401` (via Passport) | Passport returns error, user redirected to `/login?error=oauth_failed` |
| Expired OAuth state (>5min) | `401` (via Passport) | Same as above |
| Invalid redirect URL configuration | `401` | `{ "statusCode": 401, "message": "Invalid redirect configuration", "error": "Unauthorized" }` |
| OAuth provider error (e.g., user denies consent) | `302` | Redirect to `/auth/callback?error=access_denied` (existing behavior, unchanged) |

## Non-Functional Requirements

### Security Benchmarks
- **Token exposure in URLs**: ZERO -- tokens must never appear in any URL, query string, or fragment
- **State parameter entropy**: 128-bit (UUID v4 = 122 bits of randomness) -- exceeds OWASP minimum recommendation
- **Code TTL**: 60 seconds maximum -- per OAuth 2.0 best practice (RFC 6749 Section 4.1.2)
- **State TTL**: 5 minutes maximum -- allows for slow connections and multi-factor prompts at the provider
- **Single-use enforcement**: Both state and code must be deleted after first use/validation

### Performance
- **No database queries added** for code/state management (in-memory only)
- **No additional HTTP round trips from server side** -- the exchange is a single client-initiated POST
- **Frontend adds one POST request** (`/auth/oauth/exchange`) but **removes one GET request** (`/auth/me`), so net round-trips are the same
- **Memory overhead**: Negligible -- each state/code entry is ~200 bytes. At 1000 concurrent OAuth flows (unrealistic), overhead is ~200KB

### Compliance
- **OWASP ASVS V3.5**: OAuth state parameter validation
- **OWASP ASVS V3.7**: Token not transmitted via URL parameters
- **RFC 6749 Section 10.12**: CSRF protection via state parameter
- **RFC 6749 Section 4.1.2**: Authorization code (ephemeral) single-use and short-lived

## Dependencies

| Package | Version | Purpose | Install Target |
|---------|---------|---------|----------------|
| (none) | -- | -- | -- |

**No new npm packages are required.** All functionality is built using:
- Node.js `crypto.randomUUID()` -- built-in since Node 14.17
- NestJS `@Injectable()` / DI -- already installed
- `class-validator` decorators -- already installed
- `@nestjs/swagger` `@ApiProperty()` -- already installed

## Documentation Updates

| Document | Location | Changes |
|----------|----------|---------|
| `ai-specs/specs/api-spec.yml` | `paths` section | Add `POST /auth/oauth/exchange` with request/response schema; update `GET /auth/google/callback` and `GET /auth/github/callback` descriptions to note ephemeral code redirect |
| `ai-specs/specs/backend-standards.mdc` | Security section | Add "OAuth Security Hardening" subsection describing the ephemeral code exchange pattern, state validation, and redirect URL allowlisting |

## Definition of Done

- [ ] Feature branch `feature/SCRUM-23-oauth-security-hardening` created from `main`
- [ ] `OAuthStateStore` implemented with generate/validate/cleanup methods
- [ ] `OAuthCodeStore` implemented with store/exchange/cleanup methods
- [ ] `OAuthExchangeDto` created with class-validator decorations
- [ ] Google and GitHub OAuth guards updated to inject state parameter
- [ ] Google and GitHub strategies updated with `passReqToCallback: true` and state validation
- [ ] `AuthService` updated with `generateOAuthCode()` and `exchangeOAuthCode()` methods
- [ ] `AuthController` OAuth callbacks redirect with `?code=<ephemeral>` instead of `?accessToken=...&refreshToken=...`
- [ ] `AuthController` new `POST /auth/oauth/exchange` endpoint created
- [ ] Redirect URL validation implemented against allowlist
- [ ] `OAuthCallbackHandler.tsx` reads `code` from URL and calls exchange endpoint
- [ ] `AuthContext.tsx` `handleOAuthCallback` updated to accept single `code` parameter
- [ ] `.env.example` updated with `OAUTH_ALLOWED_REDIRECT_URLS`
- [ ] ALL existing unit tests updated and passing (no regressions)
- [ ] New unit tests for `OAuthStateStore` -- 6 test cases
- [ ] New unit tests for `OAuthCodeStore` -- 6 test cases
- [ ] New unit tests for exchange endpoint -- 2 test cases
- [ ] Integration test for full code exchange cycle -- 3 scenarios
- [ ] Strategy tests updated for state validation -- 6 new test cases (3 per provider)
- [ ] `npm run test` passes with 0 failures in `nexacore-api`
- [ ] `npm run build` succeeds in both `nexacore-api` and `nexacore-dashboard`
- [ ] `npm run lint` passes in both packages
- [ ] Manual Google OAuth flow verified: tokens never appear in URLs
- [ ] Manual GitHub OAuth flow verified: tokens never appear in URLs
- [ ] Code replay attack verified: second exchange returns 401
- [ ] Swagger documentation at `/api/docs` shows new exchange endpoint
- [ ] PR created with clear description referencing SCRUM-23
