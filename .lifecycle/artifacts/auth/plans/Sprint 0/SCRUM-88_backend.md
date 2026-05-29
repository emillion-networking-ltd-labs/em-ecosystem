# Backend Implementation Plan: SCRUM-88 Auth Security Hardening — Compliance Remediation

## Codebase State Snapshot

- **Date**: 2026-02-27
- **Last completed ticket**: Security Compliance Audit (commit `eaf0bff` — 3 critical fixes: F-01, F-02, W-01)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.module.ts` — JwtModule.register at lines 28-34, providers list, imports
  - `src/auth/auth.service.ts` — All JWT sign/verify calls (generateTokens, refreshTokens, login MFA token)
  - `src/auth/auth.controller.ts` — All endpoints, guards, decorators (467 lines)
  - `src/auth/strategies/jwt.strategy.ts` — constructor options, validate() with isActive check
  - `src/auth/strategies/google.strategy.ts` — constructor super() options, validate(), passReqToCallback: true
  - `src/auth/strategies/github.strategy.ts` — same pattern as google
  - `src/auth/stores/oauth-state.store.ts` — Map<string, number>, generate(), validate()
  - `src/auth/mfa.service.ts` — constructor(UsersService, CryptoService, JwtService), verifySetup(), disableMfa()
  - `src/auth/mfa.controller.ts` — constructor(MfaService, AuthService), extractRequestMeta()
  - `src/users/users.controller.ts` — @Param('id') on lines 75, 88, 109 (no ParseUUIDPipe)
  - `src/permissions/permissions.service.ts` — setPermissionsForRole() at lines 123-156 (no acting user check)
  - `src/permissions/permissions.controller.ts` — setForRole() at line 74-83 (no @Request access)
  - `src/security/security.config.ts` — csrf.cookieOptions.httpOnly: true at line 30
  - `src/audit/enums/audit-action.enum.ts` — 15 actions, no MFA_ENABLED/MFA_DISABLED
  - `src/auth/dto/register.dto.ts` — @Matches(/(?=.*[@$!%*?&])/) at line 28
  - `src/auth/dto/reset-password.dto.ts` — same pattern at line 29
  - `src/users/dto/change-password.dto.ts` — same pattern at line 18
  - `src/main.ts` — validateProductionSecrets() already present (W-01 fix)
- **Constructor signatures verified**:
  - `AuthService(UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PrismaService, MailService)`
  - `MfaService(UsersService, CryptoService, JwtService)` — **note: no AuditService yet**
  - `MfaController(MfaService, AuthService)`
  - `PermissionsService(PrismaService, PermissionsCache)`
  - `PermissionsController(PermissionsService)` — **note: no @Request in setForRole()**
  - `GoogleStrategy(AuthService, OAuthStateStore)` — passReqToCallback: true
  - `GitHubStrategy(AuthService, OAuthStateStore)` — passReqToCallback: true
  - `OAuthStateStore()` — no dependencies
- **Guard dependency chain verified**:
  - `JwtAuthGuard` → no dependencies → always available
  - `RolesGuard` → `Reflector`, `AuditService` → requires AuditModule import
  - `PermissionsGuard` → `Reflector`, `PermissionsService` → @Global, always available
  - `CsrfGuard` → `Reflector` → APP_GUARD, always available

## Overview

This ticket implements 11 security compliance remediation items from the SCRUM-88 security audit:
- **7 FAIL items** (F-03 through F-09): OAuth PKCE, JWT iss/aud claims, ParseUUIDPipe, MFA audit logging, password restriction removal
- **4 WARN items** (W-02 through W-05): CSRF cookie fix, reset-password throttle, ADMIN self-escalation prevention, HTTPS enforcement

All changes are within the existing auth module architecture. No new modules or Prisma schema changes required.

## Architecture Context

### Modules affected
- **AuthModule** — strategies (PKCE), auth.service (JWT claims), mfa.service (audit logging), auth.controller (throttle), DTOs (password restriction)
- **UsersModule** — users.controller (ParseUUIDPipe), change-password.dto
- **PermissionsModule** — permissions.service + permissions.controller (self-escalation prevention)
- **SecurityModule** — security.config (CSRF cookie)
- **AuditModule** — audit-action.enum (new enum values)
- **AppModule** — main.ts (HTTPS middleware)

### Files affected (19 files)

| File | Changes |
|------|---------|
| `src/auth/stores/oauth-state.store.ts` | Extend to store PKCE code_verifier per state |
| `src/auth/strategies/google.strategy.ts` | Override authenticate() for PKCE |
| `src/auth/strategies/github.strategy.ts` | Override authenticate() for PKCE |
| `src/auth/auth.module.ts` | Add issuer/audience to JwtModule.register signOptions |
| `src/auth/auth.service.ts` | Add issuer/audience to all jwtService.verify() calls; MFA token audience |
| `src/auth/strategies/jwt.strategy.ts` | Add issuer/audience to strategy options |
| `src/auth/mfa.service.ts` | Inject AuditService; add audit logging to verifySetup() and disableMfa(); add meta parameter |
| `src/auth/mfa.controller.ts` | Pass request meta to mfaService.verifySetup() and disableMfa() |
| `src/audit/enums/audit-action.enum.ts` | Add MFA_ENABLED, MFA_DISABLED values |
| `src/auth/dto/register.dto.ts` | Remove special char @Matches; update ApiProperty |
| `src/auth/dto/reset-password.dto.ts` | Remove special char @Matches; update ApiProperty |
| `src/users/dto/change-password.dto.ts` | Remove special char @Matches |
| `src/users/users.controller.ts` | Add ParseUUIDPipe to @Param('id') (3 places) |
| `src/auth/auth.controller.ts` | Add ParseUUIDPipe to DELETE /sessions/:id; add @Throttle to resetPassword |
| `src/permissions/permissions.service.ts` | Add actingUserRole parameter to setPermissionsForRole(); add self-escalation check |
| `src/permissions/permissions.controller.ts` | Pass acting user role from @Request to service |
| `src/security/security.config.ts` | Change csrf.cookieOptions.httpOnly to false |
| `src/main.ts` | Add HTTPS enforcement middleware (production only) |
| `src/common/middleware/https-redirect.middleware.ts` | **NEW** — NestJS middleware for HTTP→HTTPS redirect |

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a feature branch
- **Branch name**: `feature/SCRUM-88-backend`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-88-backend`
  3. Verify with `git branch`

---

### Step 1: F-09 — Remove special character restriction from password DTOs

- **Files**: `src/auth/dto/register.dto.ts`, `src/auth/dto/reset-password.dto.ts`, `src/users/dto/change-password.dto.ts`
- **Action**: Remove the `@Matches(/(?=.*[@$!%*?&])/)` decorator from all three DTOs
- **Implementation Steps**:
  1. In `register.dto.ts:28-30`: Delete the entire `@Matches(/(?=.*[@$!%*?&])/, { message: '...' })` decorator block
  2. In `register.dto.ts:13-14`: Update the `@ApiProperty.description` to remove "and special character" from the text. New text: `'Password (min 8 chars, must include uppercase, lowercase, and number)'`
  3. In `reset-password.dto.ts:29-31`: Delete the same `@Matches` decorator
  4. In `reset-password.dto.ts:14-15`: Update `@ApiProperty.description` similarly
  5. In `change-password.dto.ts:18-20`: Delete the same `@Matches` decorator
- **Notes**: Keep uppercase, lowercase, and digit requirements. Removing composition rules entirely (per NIST 800-63B) is a separate discussion — this ticket only removes the special char restriction per OWASP ASVS V2.1.3.

---

### Step 2: F-06 — Add ParseUUIDPipe to all :id path parameters

- **Files**: `src/users/users.controller.ts`, `src/auth/auth.controller.ts`
- **Action**: Add `ParseUUIDPipe` to all `@Param('id')` declarations
- **Implementation Steps**:
  1. In `users.controller.ts`: Add `ParseUUIDPipe` import from `@nestjs/common`
  2. Line 75 (getUser): Change `@Param('id') id: string` → `@Param('id', ParseUUIDPipe) id: string`
  3. Line 88 (adminUpdateUser): Same change
  4. Line 109 (deleteUser): Same change
  5. In `auth.controller.ts`: Add `ParseUUIDPipe` import
  6. Line 244 (revokeSession): Change `@Param('id') sessionId: string` → `@Param('id', ParseUUIDPipe) sessionId: string`
- **Notes**: NestJS automatically returns `400 Bad Request` with message `"Validation failed (uuid is expected)"` for invalid UUIDs. This prevents malformed IDs from reaching Prisma.

---

### Step 3: W-03 — Add throttle to reset-password endpoint

- **File**: `src/auth/auth.controller.ts`
- **Action**: Add `@Throttle` decorator to the `resetPassword()` method
- **Implementation Steps**:
  1. Add decorator above `resetPassword()` (line ~322), after `@SkipCsrf()`:
     ```
     @Throttle({ default: { ttl: 60_000, limit: 5 } })
     ```
  2. This limits to 5 attempts per minute per IP, matching the login endpoint's rate
- **Notes**: `Throttle` import already exists in auth.controller.ts (line 24). The `@SkipCsrf` must come before `@Throttle` in decorator order.

---

### Step 4: F-07 + F-08 — Add MFA audit logging (MFA_ENABLED and MFA_DISABLED)

- **Files**: `src/audit/enums/audit-action.enum.ts`, `src/auth/mfa.service.ts`, `src/auth/mfa.controller.ts`
- **Action**: Add audit trail for MFA enable and disable events

#### Step 4a: Add enum values

- **File**: `src/audit/enums/audit-action.enum.ts`
- Add two new values to the enum:
  ```
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  ```
- Place after `SUPERADMIN_BYPASS` (end of enum).

#### Step 4b: Inject AuditService into MfaService

- **File**: `src/auth/mfa.service.ts`
- **Current constructor**: `constructor(private readonly usersService, private readonly cryptoService, private readonly jwtService)`
- Add `private readonly auditService: AuditService` to constructor
- Add imports: `import { AuditService } from '../audit/audit.service';` and `import { AuditAction } from '../audit/enums/audit-action.enum';`
- **Circular dependency check**: MfaService is in AuthModule. AuthModule imports AuditModule. AuditModule exports AuditService. So AuditService is available in AuthModule's DI context. **No circular dependency**.

#### Step 4c: Add request meta parameter to verifySetup() and disableMfa()

- **File**: `src/auth/mfa.service.ts`
- **verifySetup()** (line 73): Change signature from `verifySetup(userId: string, token: string)` to `verifySetup(userId: string, token: string, meta?: { ipAddress?: string; userAgent?: string | null })`
- After `await this.usersService.enableMfa(userId)` (line 95), add audit log:
  ```
  this.auditService.log({
    action: AuditAction.MFA_ENABLED,
    userId,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  }).catch(() => {});
  ```
- **disableMfa()** (line 155): Change signature from `disableMfa(userId: string, password: string)` to `disableMfa(userId: string, password: string, meta?: { ipAddress?: string; userAgent?: string | null })`
- After `await this.usersService.disableMfa(userId)` (line 176), add audit log:
  ```
  this.auditService.log({
    action: AuditAction.MFA_DISABLED,
    userId,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  }).catch(() => {});
  ```

#### Step 4d: Thread request meta from MfaController

- **File**: `src/auth/mfa.controller.ts`
- `verifySetup()` (line 64-70): Extract meta and pass to service:
  ```
  const meta = this.extractRequestMeta(req);
  await this.mfaService.verifySetup(req.user.id, dto.token, meta);
  ```
  Note: need to add `@Request() req: any` — currently the method only receives `req: { user: SafeUser }`. Change to `req: any` to access `req.ip` and `req.headers`.
- `disable()` (line 104-110): Same pattern:
  ```
  const meta = this.extractRequestMeta(req);
  await this.mfaService.disableMfa(req.user.id, dto.password, meta);
  ```
  Again, change `req: { user: SafeUser }` to `req: any`.

---

### Step 5: F-04 + F-05 — Add JWT issuer and audience claims

- **Files**: `src/auth/auth.module.ts`, `src/auth/auth.service.ts`, `src/auth/strategies/jwt.strategy.ts`, `src/auth/mfa.service.ts`
- **Action**: Add `iss` and `aud` claims to all JWT tokens and validate on all verify calls

#### Step 5a: JwtModule configuration

- **File**: `src/auth/auth.module.ts`, lines 28-34
- Add `issuer` and `audience` to signOptions:
  ```
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
    signOptions: {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
      issuer: 'nexacore-api',
      audience: 'nexacore-api',
    },
  }),
  ```
- This automatically adds `iss` and `aud` to tokens signed via `jwtService.sign()` (unless overridden).

#### Step 5b: JwtStrategy validation

- **File**: `src/auth/strategies/jwt.strategy.ts`, lines 11-16
- Add `issuer` and `audience` to the strategy constructor options (passport-jwt validates these on every request):
  ```
  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
    issuer: 'nexacore-api',
    audience: 'nexacore-api',
  });
  ```

#### Step 5c: Refresh token verify calls

- **File**: `src/auth/auth.service.ts`
- **refreshTokens()** (line 330): Add options to verify:
  ```
  this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
    issuer: 'nexacore-api',
    audience: 'nexacore-api',
  });
  ```
- **logout()** (line 446): Same verify update
- **getCurrentSessionId()** in auth.controller.ts (line 77): Same verify update

#### Step 5d: MFA challenge tokens — distinct audience

- **File**: `src/auth/auth.service.ts`, login() MFA branch (line 284):
  ```
  this.jwtService.sign(
    { sub: user.id, type: 'mfa-challenge' },
    { expiresIn: '5m' as StringValue, audience: 'nexacore-api:mfa-challenge' },
  );
  ```
  The `audience: 'nexacore-api:mfa-challenge'` overrides the module-level default, ensuring MFA tokens cannot be used as access tokens and vice versa.

- **File**: `src/auth/mfa.service.ts`, verifyLoginCode() (line 118):
  ```
  this.jwtService.verify<{ sub: string; type: string }>(mfaToken, {
    issuer: 'nexacore-api',
    audience: 'nexacore-api:mfa-challenge',
  });
  ```

- **File**: `src/auth/mfa.service.ts`, generateMfaToken() (line 99):
  ```
  this.jwtService.sign(
    { sub: user.id, type: 'mfa-challenge' },
    { expiresIn: MFA_TOKEN_EXPIRY as StringValue, audience: 'nexacore-api:mfa-challenge' },
  );
  ```

- **IMPORTANT**: All existing access tokens in circulation will be rejected after deployment because they lack `iss`/`aud` claims. **This is intentional** — users will need to re-authenticate. Document this in the release notes.

---

### Step 6: W-02 — Fix CSRF cookie httpOnly contradiction

- **File**: `src/security/security.config.ts`
- **Action**: Change `httpOnly: true` to `httpOnly: false` on the CSRF cookie
- **Implementation Steps**:
  1. Line 30: Change `httpOnly: true` → `httpOnly: false`
  2. This allows the frontend's JavaScript to read the `__csrf` cookie and echo it as the `x-csrf-token` header, which is the correct double-submit pattern.
- **Notes**: CSRF cookies are NOT sensitive (they contain a random token, not a session). `httpOnly: false` is the standard configuration for double-submit CSRF. The security comes from the HMAC signature validation, not from hiding the token.

---

### Step 7: W-04 — Prevent ADMIN self-escalation via permissions

- **Files**: `src/permissions/permissions.service.ts`, `src/permissions/permissions.controller.ts`
- **Action**: Prevent an ADMIN from modifying the permissions of their own role

#### Step 7a: Update service signature

- **File**: `src/permissions/permissions.service.ts`
- Change `setPermissionsForRole(role: Role, keys: string[])` → `setPermissionsForRole(role: Role, keys: string[], actingUserRole?: Role)`
- After the SUPERADMIN check (line 124-128), add:
  ```
  if (actingUserRole && actingUserRole === role && actingUserRole !== Role.SUPERADMIN) {
    throw new ForbiddenException('Cannot modify permissions of your own role');
  }
  ```
- Add `ForbiddenException` to the imports from `@nestjs/common`.

#### Step 7b: Pass acting user role from controller

- **File**: `src/permissions/permissions.controller.ts`
- Add `@Request() req: any` to `setForRole()` method parameters (line 74):
  ```
  async setForRole(
    @Param('role') role: string,
    @Body() dto: SetRolePermissionsDto,
    @Request() req: any,
  ) {
    await this.permissionsService.setPermissionsForRole(
      this.parseRole(role),
      dto.permissionKeys,
      req.user.role,
    );
    ...
  }
  ```
- Add `Request` to the `@nestjs/common` import if not already present.

---

### Step 8: W-05 — HTTPS enforcement middleware (production only)

- **Files**: `src/common/middleware/https-redirect.middleware.ts` (NEW), `src/main.ts`
- **Action**: Reject plain HTTP requests in production with a 301 redirect to HTTPS

#### Step 8a: Create middleware

- **File**: `src/common/middleware/https-redirect.middleware.ts` (NEW)
- NestJS middleware that:
  1. Checks `process.env.NODE_ENV === 'production'`
  2. Reads `X-Forwarded-Proto` header (set by reverse proxies like nginx, AWS ALB, etc.)
  3. If proto is not `https`, returns 301 redirect to `https://` version of the URL
  4. If proto is `https` or not in production, calls `next()`
- Class: `HttpsRedirectMiddleware implements NestMiddleware`

#### Step 8b: Register middleware in main.ts

- **File**: `src/main.ts`
- After `registerHelmetMiddleware(app)` (line 33), add:
  ```
  if (process.env.NODE_ENV === 'production') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }
  ```
- Apply the middleware globally via `app.use()` before other middleware.
- Alternative: register via `AppModule.configure(consumer)` using `NestModule.configure()`.
- **Notes**: `trust proxy` is needed for Express to correctly read `X-Forwarded-Proto` behind a reverse proxy. The value `1` trusts the first proxy.

---

### Step 9: F-03 — PKCE for OAuth flows (HIGH complexity)

- **Files**: `src/auth/stores/oauth-state.store.ts`, `src/auth/strategies/google.strategy.ts`, `src/auth/strategies/github.strategy.ts`
- **Action**: Implement PKCE (Proof Key for Code Exchange, RFC 7636) for both OAuth providers

#### Step 9a: Extend OAuthStateStore for PKCE

- **File**: `src/auth/stores/oauth-state.store.ts`
- Change the store type from `Map<string, number>` to `Map<string, { timestamp: number; codeVerifier: string }>`
- Update `generate()`:
  1. Generate `codeVerifier = crypto.randomBytes(32).toString('base64url')` (43 chars, 256 bits entropy)
  2. Compute `codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')`
  3. Store `{ timestamp: Date.now(), codeVerifier }` keyed by state
  4. Return `{ state, codeChallenge, codeChallengeMethod: 'S256' }`
- Update `validate(state)`:
  1. Return `{ valid: boolean; codeVerifier?: string }` instead of `boolean`
  2. If valid, return the `codeVerifier` alongside `valid: true`
  3. Delete the entry (single-use — already done)
- Update `cleanup()`: Same logic, now iterates `{ timestamp, codeVerifier }`.
- Add import: `import { randomBytes, createHash } from 'crypto';`

#### Step 9b: Update GoogleAuthGuard and GitHubAuthGuard

- The auth guards need to generate state with PKCE params and pass them to the authorization URL.
- Read the actual guard files first to determine the current override pattern.
- The guards likely override `getAuthenticateOptions()` to inject state. Extend this to include `code_challenge` and `code_challenge_method` as authorization params.

#### Step 9c: Modify Google and GitHub strategies for PKCE token exchange

- **Challenge**: The `passport-oauth2` library handles the token exchange internally inside `authenticate()`. The `code_verifier` must be passed to the token exchange call, but `tokenParams()` only receives `options` (not `req` or state).
- **Approach**: Override `authenticate()` in each strategy to handle the callback path:
  1. In the callback path (when `req.query.code` exists), extract `state` from `req.query.state`
  2. Validate state via `oauthStateStore.validate(state)` — now returns `{ valid, codeVerifier }`
  3. Monkey-patch `this._oauth2._request` or use `tokenParams()` with the verifier stashed on `this` or `req`
  4. Preferred: Override `tokenParams(options)` and temporarily store codeVerifier on `req` object: `req._pkceVerifier = codeVerifier`

  **Concrete approach per strategy**:
  ```
  authenticate(req, options) {
    // Callback path: req.query.code exists
    if (req.query && req.query.code) {
      const state = req.query.state;
      const result = this.oauthStateStore.validate(state);
      if (!result.valid) {
        return this.fail('Invalid or expired OAuth state');
      }
      req._pkceVerifier = result.codeVerifier;
    } else {
      // Initiation path: generate state with PKCE
      const { state, codeChallenge, codeChallengeMethod } = this.oauthStateStore.generate();
      options.state = state;
      options.code_challenge = codeChallenge;
      options.code_challenge_method = codeChallengeMethod;
    }
    super.authenticate(req, options);
  }

  tokenParams(options) {
    // Can access 'this' but not 'req' — need alternative approach
  }
  ```

  **Problem**: `tokenParams()` doesn't have access to `req`. Alternative approaches:

  **Option A (Recommended)**: Use passport-oauth2's built-in PKCE with a custom session adapter.
  - Create a lightweight `OAuthSessionAdapter` that delegates to `OAuthStateStore` but exposes a `req.session`-like interface
  - Enable `pkce: 'S256'` in strategy super() options
  - passport-oauth2 v1.7+ handles code_verifier/code_challenge lifecycle automatically
  - Implement: add `req.session = new OAuthSessionProxy(this.oauthStateStore)` in `authenticate()` before `super.authenticate()`

  **Option B**: Override the internal `_oauth2.getOAuthAccessToken()` method in `authenticate()` callback path to inject `code_verifier` into the token exchange params.

  **Option C**: Use a request-scoped store (Map keyed by request ID or state) accessible from `tokenParams()`.

- **Notes**:
  - GitHub OAuth supports PKCE since 2023. Must verify the GitHub OAuth App settings allow PKCE.
  - Google OAuth supports PKCE (S256 method) by default.
  - Test with both providers after implementation.
  - The existing `validate()` method in each strategy currently also validates state. After this change, state validation moves to `authenticate()` override, and `validate()` only handles profile extraction and user creation. **Remove the duplicate state validation from validate()**.

---

### Step 10: Write/Update Unit Tests

- **Action**: Add tests for all changes. Update existing tests that break due to JWT iss/aud or password regex changes.

#### Step 10a: Password DTO tests
- Update any existing tests that use passwords with only `@$!%*?&` — they should still pass
- Add tests confirming passwords with `#`, `^`, `(`, `)`, `=`, `+` are now accepted

#### Step 10b: ParseUUIDPipe tests
- Add test for `GET /users/not-a-uuid` → expect 400 (not 500)
- Add test for `DELETE /auth/sessions/not-a-uuid` → expect 400

#### Step 10c: JWT iss/aud tests
- Update `jwt.strategy.spec.ts` — the mock JWT payload must now include valid iss/aud or the test module must configure JwtModule with matching issuer/audience
- Update `auth.service.spec.ts` — verify calls now include `{ issuer, audience }` options
- Add test: token without `iss` claim → rejected by JwtStrategy
- Add test: MFA token with `audience: 'nexacore-api:mfa-challenge'` accepted by verifyLoginCode
- Add test: MFA token with `audience: 'nexacore-api'` rejected (wrong audience)

#### Step 10d: MFA audit logging tests
- In `mfa.service.spec.ts`:
  - Mock `AuditService` in TestingModule
  - Test: `verifySetup()` calls `auditService.log()` with `MFA_ENABLED` action
  - Test: `disableMfa()` calls `auditService.log()` with `MFA_DISABLED` action
  - Test: meta (ipAddress, userAgent) is passed through correctly

#### Step 10e: ADMIN self-escalation test
- In `permissions.service.spec.ts`:
  - Test: `setPermissionsForRole(Role.ADMIN, ['users:read'], Role.ADMIN)` → throws ForbiddenException
  - Test: `setPermissionsForRole(Role.USER, ['users:read'], Role.ADMIN)` → succeeds (ADMIN modifying USER role is OK)
  - Test: `setPermissionsForRole(Role.ADMIN, ['users:read'], Role.SUPERADMIN)` → succeeds (SUPERADMIN bypass)

#### Step 10f: Reset-password throttle test
- Test: 6th request to `POST /auth/reset-password` within 1 minute → returns 429

#### Step 10g: HTTPS redirect middleware test
- Test: `X-Forwarded-Proto: http` in production → 301 redirect with `https://` URL
- Test: `X-Forwarded-Proto: https` in production → next() called
- Test: Non-production env → next() called regardless of proto

#### Step 10h: PKCE tests
- Test: `OAuthStateStore.generate()` returns `{ state, codeChallenge, codeChallengeMethod }`
- Test: `OAuthStateStore.validate(state)` returns `{ valid: true, codeVerifier }` for valid state
- Test: `OAuthStateStore.validate(state)` returns `{ valid: false }` for expired/unknown state
- Test: code_challenge = base64url(sha256(code_verifier)) — verify mathematical relationship
- Integration tests for Google/GitHub callback with PKCE (mock token exchange)

---

### Step 11: Update Technical Documentation

- **Action**: Update all affected documentation files
- **Implementation Steps**:
  1. **`ai-specs/specs/api-spec.yml`**:
     - Update `POST /auth/reset-password` to document `@Throttle(5/min)`
     - Note `ParseUUIDPipe` on :id params (400 response for invalid UUIDs)
  2. **`ai-specs/specs/integration-state.md`**:
     - Update `MfaService` dependency chain: add `AuditService`
     - Update `PermissionsController` setForRole: note `@Request` access for acting user role
     - Add `HttpsRedirectMiddleware` to middleware section
     - Add changelog entry for SCRUM-88
  3. **`ai-specs/specs/data-model.md`**:
     - Add `MFA_ENABLED`, `MFA_DISABLED` to AuditAction enum documentation
  4. **`ai-specs/ai-specs/changes/records/SCRUM-88_record.md`**:
     - Create implementation record with 9 sections per template

## Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-88-backend`
2. **Step 1**: F-09 — Remove special char restriction (3 files, ~5 lines each)
3. **Step 2**: F-06 — ParseUUIDPipe (2 files, 4 params)
4. **Step 3**: W-03 — Reset-password throttle (1 line)
5. **Step 4**: F-07/F-08 — MFA audit logging (4 files)
6. **Step 5**: F-04/F-05 — JWT iss/aud claims (4 files — **test impact: high**)
7. **Step 6**: W-02 — CSRF cookie fix (1 line)
8. **Step 7**: W-04 — ADMIN self-escalation prevention (2 files)
9. **Step 8**: W-05 — HTTPS enforcement (2 files, 1 new)
10. **Step 9**: F-03 — PKCE for OAuth (3 files — **highest complexity**)
11. **Step 10**: Tests — after each step AND comprehensive pass at end
12. **Step 11**: Documentation update

**Rationale**: Ordered by increasing complexity. Simple one-line changes first to build momentum and validate the branch. PKCE last because it's the most architecturally complex item and benefits from all other changes being stable.

## Testing Checklist

- [ ] All 392 existing tests pass (no regressions)
- [ ] New tests added for each of the 11 items
- [ ] `nest build` completes without errors
- [ ] `npm run start:dev` starts without errors
- [ ] Test coverage ≥ 90% on modified files
- [ ] Manual smoke test: register, login, refresh, MFA setup/verify, admin operations
- [ ] Manual test: invalid UUID on `GET /users/xxx` returns 400 (not 500)
- [ ] Manual test: `POST /auth/reset-password` returns 429 after 5 rapid requests
- [ ] Manual test: password with `#` or `^` accepted at registration

## Error Response Format

All new errors follow the existing `HttpExceptionFilter` pattern:

```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

| Change | HTTP Code | Error |
|--------|-----------|-------|
| ParseUUIDPipe invalid | 400 | `Validation failed (uuid is expected)` |
| Reset-password throttled | 429 | `{ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', retryAfter } }` |
| ADMIN self-escalation | 403 | `Cannot modify permissions of your own role` |
| HTTP in production | 301 | Redirect to `https://` equivalent |
| JWT wrong issuer | 401 | `Unauthorized` (passport-jwt rejects automatically) |
| JWT wrong audience | 401 | `Unauthorized` (passport-jwt rejects automatically) |

## Dependencies

- No new external libraries required
- All changes use existing NestJS built-ins (`ParseUUIDPipe`, `@Throttle`, `NestMiddleware`)
- PKCE uses Node.js `crypto` module (already used throughout codebase)
- passport-oauth2 v1.7+ recommended for built-in PKCE support (verify current version in `package.json`)

## Notes

- **Breaking change**: JWT iss/aud addition invalidates all existing access and refresh tokens. Users must re-authenticate. Schedule deployment during low-traffic window. Alternatively, implement a 24h grace period by temporarily accepting tokens without iss/aud — but this is NOT recommended (defeats the purpose).
- **PKCE complexity**: This is the hardest item. If passport's built-in PKCE doesn't work well without sessions, fall back to manual `authenticate()` override. Budget extra time for this step.
- **CSRF cookie change**: Coordinate with frontend team — the dashboard can now optionally read the CSRF token from the `__csrf` cookie instead of (or in addition to) the `GET /auth/csrf-token` endpoint.
- **All code and documentation in English** per project standards.
- **Do not auto-commit** — wait for explicit commit instruction.

## Next Steps After Implementation

1. Run full test suite and verify 392+ tests pass
2. Run `nest build` to confirm clean compilation
3. Create implementation record at `ai-specs/ai-specs/changes/records/SCRUM-88_record.md`
4. Update integration-state.md with all changes
5. Commit with message: `fix(SCRUM-88): security compliance remediation — 7 FAIL + 4 WARN`
6. Create PR targeting `main`
7. Transition SCRUM-88 to "In Progress" → "Done" in Jira

## Implementation Verification

- [ ] **Code Quality**: No `any` types added (except existing `req: any` patterns). No new linting errors.
- [ ] **Functionality**: All 11 items implemented as specified. Each verified independently.
- [ ] **Testing**: New tests for every change. No regressions. Coverage ≥ 90% on modified files.
- [ ] **Integration**: Module imports correct. Guard dependency chains intact. No circular dependencies.
- [ ] **Security**: PKCE verified with both OAuth providers. JWT iss/aud rejecting old tokens. ParseUUIDPipe blocking malformed IDs. ADMIN cannot self-escalate.
- [ ] **Documentation**: api-spec.yml, integration-state.md, data-model.md, implementation record — all updated.
