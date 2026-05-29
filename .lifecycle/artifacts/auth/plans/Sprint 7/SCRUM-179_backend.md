# Backend Implementation Plan: SCRUM-179 Migrate process.env Reads to ConfigService

## 1. Header

- **Ticket**: SCRUM-179
- **Sprint**: Sprint 7 - Audit Remediation
- **Parent**: SCRUM-174 (Auth Module Audit Epic)
- **Audit Finding**: Phase 6 I-10 FAIL (MEDIUM) — 28 direct process.env accesses across auth files. Replace with ConfigService + validated ConfigModule schema.

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-178 (documentation-only, data-model.md status badges)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/app.module.ts` — No ConfigModule import. Imports: RedisModule, ThrottlerModule, PrismaModule, GeolocationModule, AuthModule, UsersModule, AuditModule, SecurityModule, MailModule, PermissionsModule. APP_GUARD: CustomThrottlerGuard.
  - `src/auth/auth.module.ts` — `JwtModule.register()` at lines 36-50 with `process.env.JWT_SECRET` and `process.env.JWT_ACCESS_EXPIRATION`. No ConfigModule/ConfigService usage.
  - `src/auth/auth.controller.ts` — Constructor(AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService) at lines 66-72. `process.env.FRONTEND_URL` at lines 301, 323, 657. `process.env.OAUTH_ALLOWED_REDIRECT_URLS` at line 659. Helper method `getValidatedFrontendUrl()` at lines 656-669.
  - `src/auth/auth.service.ts` — Constructor(UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, TokenDenyListService) at lines 108-121. `process.env.JWT_REFRESH_EXPIRATION` at line 123. `process.env.JWT_SECRET` at line 126. `process.env.JWT_ACCESS_EXPIRATION` at lines 515, 728. `process.env.NODE_ENV` at lines 1238, 1252.
  - `src/auth/constants/auth.constants.ts` — Top-level `process.env` at lines 76 (SESSION_IDLE_TIMEOUT_HOURS), 84 (MAX_CONCURRENT_SESSIONS), 93 (TRUSTED_DEVICE_TTL_DAYS). These are module-load-time constants, not injectable.
  - `src/auth/strategies/jwt.strategy.ts` — Constructor(UsersService, TokenDenyListService) at lines 12-14. `super()` call with `process.env.JWT_SECRET` at line 20.
  - `src/auth/strategies/google.strategy.ts` — Constructor(AuthService, OAuthStateStore) at lines 11-13. `super()` call with `process.env.GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` at lines 16-20.
  - `src/auth/strategies/github.strategy.ts` — Constructor(AuthService, OAuthStateStore) at lines 11-13. `super()` call with `process.env.GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` at lines 16-20.
  - `src/auth/guards/oauth-callback.filter.ts` — No constructor injection. `process.env.FRONTEND_URL` at line 15.
  - `nexacore-api/package.json` — `@nestjs/config` is NOT installed.
- **Constructor signatures verified**:
  - `AuthController(AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService)` — 5 deps. ConfigService will be 6th.
  - `AuthService(UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, TokenDenyListService)` — 12 deps. ConfigService will be 13th.
  - `JwtStrategy(UsersService, TokenDenyListService)` — 2 deps. ConfigService will be 3rd.
  - `GoogleStrategy(AuthService, OAuthStateStore)` — 2 deps. ConfigService will be 3rd.
  - `GitHubStrategy(AuthService, OAuthStateStore)` — 2 deps. ConfigService will be 3rd.
  - `OAuthCallbackFilter()` — 0 deps (no constructor). Will need constructor with ConfigService.
- **Methods verified to exist**:
  - `AuthController.getValidatedFrontendUrl()` — line 656, private, uses FRONTEND_URL + OAUTH_ALLOWED_REDIRECT_URLS
  - `AuthService.buildRefreshCookie()` — line 1232, uses NODE_ENV
  - `AuthService.buildClearCookie()` — line 1246, uses NODE_ENV
  - `AuthService.generateTokens()` — line 722, uses JWT_ACCESS_EXPIRATION
  - `AuthService.refreshTokens()` — line 515 area, uses JWT_ACCESS_EXPIRATION
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None

---

## 3. Overview

Install `@nestjs/config` and create a centralized, typed, validated configuration system using `registerAs()` namespaced configs. Replace all `process.env` reads in auth source files with injected `ConfigService` or typed config objects. The app will fail fast at startup if required environment variables are missing.

**Architecture approach**: Use `registerAs()` factory functions to create typed config namespaces (auth, oauth, app) rather than raw `configService.get('KEY')` string lookups. This provides compile-time type safety and IDE autocomplete.

**Key challenge**: `auth.constants.ts` exports top-level constants evaluated at module load time (`parseFloat(process.env.X)`). These cannot use DI. Solution: convert to a function that accepts config values, called from the service that uses them — or make the constants file export defaults that are overridden by ConfigService at runtime in the consuming services.

---

## 4. Architecture Context

- **Modules involved**:
  - `AppModule` — add `ConfigModule.forRoot({ isGlobal: true })`
  - `AuthModule` — `JwtModule.register()` → `JwtModule.registerAsync()` with inject ConfigService
- **Components affected**:
  - New: `src/config/auth.config.ts` — JWT + session config namespace
  - New: `src/config/oauth.config.ts` — OAuth provider config namespace
  - New: `src/config/app.config.ts` — App-level config namespace (NODE_ENV, FRONTEND_URL)
  - New: `src/config/config.validation.ts` — Joi validation schema
  - Modified: `src/app.module.ts` — add ConfigModule.forRoot()
  - Modified: `src/auth/auth.module.ts` — JwtModule.registerAsync()
  - Modified: `src/auth/auth.controller.ts` — inject ConfigService, replace process.env
  - Modified: `src/auth/auth.service.ts` — inject ConfigService, replace process.env
  - Modified: `src/auth/constants/auth.constants.ts` — keep defaults as plain constants, remove process.env
  - Modified: `src/auth/strategies/jwt.strategy.ts` — inject ConfigService via super() pattern
  - Modified: `src/auth/strategies/google.strategy.ts` — inject ConfigService
  - Modified: `src/auth/strategies/github.strategy.ts` — inject ConfigService
  - Modified: `src/auth/guards/oauth-callback.filter.ts` — inject ConfigService
  - Modified: Test files for all above
- **Files referenced**: `ai-specs/specs/integration-state.md`, `ai-specs/specs/backend-standards.mdc`

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-179-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-179-backend`

### Step 1: Install @nestjs/config

- **Action**: Add dependency
- **Implementation Steps**:
  1. `cd nexacore-api && npm install @nestjs/config`
  2. Verify in `package.json` that `@nestjs/config` appears in dependencies

### Step 2: Create Typed Config Files

- **File**: `src/config/auth.config.ts`
- **Action**: Create registerAs namespace for auth-related env vars
- **Implementation Steps**:
  1. Create `src/config/` directory
  2. Create `auth.config.ts`:
     ```typescript
     import { registerAs } from '@nestjs/config';

     export const authConfig = registerAs('auth', () => ({
       jwtSecret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
       jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
       jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '12h',
       sessionIdleTimeoutHours: parseFloat(process.env.SESSION_IDLE_TIMEOUT_HOURS || '0.5'),
       maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5', 10),
       trustedDeviceTtlDays: parseInt(process.env.TRUSTED_DEVICE_TTL_DAYS || '30', 10),
     }));

     export type AuthConfig = ReturnType<typeof authConfig>;
     ```

- **File**: `src/config/oauth.config.ts`
- **Action**: Create registerAs namespace for OAuth provider vars
- **Implementation Steps**:
  1. Create `oauth.config.ts`:
     ```typescript
     import { registerAs } from '@nestjs/config';

     export const oauthConfig = registerAs('oauth', () => ({
       googleClientId: process.env.GOOGLE_CLIENT_ID || '',
       googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
       googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
       githubClientId: process.env.GITHUB_CLIENT_ID || '',
       githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
       githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
     }));

     export type OAuthConfig = ReturnType<typeof oauthConfig>;
     ```

- **File**: `src/config/app.config.ts`
- **Action**: Create registerAs namespace for app-level vars
- **Implementation Steps**:
  1. Create `app.config.ts`:
     ```typescript
     import { registerAs } from '@nestjs/config';

     export const appConfig = registerAs('app', () => ({
       nodeEnv: process.env.NODE_ENV || 'development',
       frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
       oauthAllowedRedirectUrls: process.env.OAUTH_ALLOWED_REDIRECT_URLS || '',
       isProduction: process.env.NODE_ENV === 'production',
     }));

     export type AppConfig = ReturnType<typeof appConfig>;
     ```

- **File**: `src/config/index.ts`
- **Action**: Barrel export
- **Implementation Steps**:
  1. Create `index.ts`:
     ```typescript
     export { authConfig, AuthConfig } from './auth.config';
     export { oauthConfig, OAuthConfig } from './oauth.config';
     export { appConfig, AppConfig } from './app.config';
     ```

### Step 3: Create Validation Schema

- **File**: `src/config/config.validation.ts`
- **Action**: Joi validation for required env vars (fail-fast on missing)
- **Dependencies**: `npm install joi` (if not already installed)
- **Implementation Steps**:
  1. Create `config.validation.ts`:
     ```typescript
     import * as Joi from 'joi';

     export const configValidationSchema = Joi.object({
       // App
       NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
       PORT: Joi.number().default(3000),
       FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),
       OAUTH_ALLOWED_REDIRECT_URLS: Joi.string().optional().default(''),

       // JWT
       JWT_SECRET: Joi.string().min(32).required().messages({
         'any.required': 'JWT_SECRET is required. Set a strong secret (min 32 chars).',
         'string.min': 'JWT_SECRET must be at least 32 characters.',
       }),
       JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
       JWT_REFRESH_EXPIRATION: Joi.string().default('12h'),

       // Session
       SESSION_IDLE_TIMEOUT_HOURS: Joi.number().default(0.5),
       MAX_CONCURRENT_SESSIONS: Joi.number().integer().default(5),
       TRUSTED_DEVICE_TTL_DAYS: Joi.number().integer().default(30),

       // OAuth (required in production, optional in dev)
       GOOGLE_CLIENT_ID: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required(), otherwise: Joi.optional().default('') }),
       GOOGLE_CLIENT_SECRET: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required(), otherwise: Joi.optional().default('') }),
       GOOGLE_CALLBACK_URL: Joi.string().default('http://localhost:3000/auth/google/callback'),
       GITHUB_CLIENT_ID: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required(), otherwise: Joi.optional().default('') }),
       GITHUB_CLIENT_SECRET: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required(), otherwise: Joi.optional().default('') }),
       GITHUB_CALLBACK_URL: Joi.string().default('http://localhost:3000/auth/github/callback'),
     }).options({ allowUnknown: true });
     ```
- **Implementation Notes**:
  - `allowUnknown: true` — allow other env vars (DATABASE_URL, REDIS_URL, etc.) not covered by this schema
  - `JWT_SECRET` is required with min 32 chars — no more fallback to insecure default in production
  - OAuth credentials required only in production — dev/test can run without them

### Step 4: Register ConfigModule in AppModule

- **File**: `src/app.module.ts`
- **Action**: Add `ConfigModule.forRoot()` as first import
- **Implementation Steps**:
  1. Add imports: `ConfigModule` from `@nestjs/config`
  2. Import config factories: `authConfig, oauthConfig, appConfig` from `./config`
  3. Import validation: `configValidationSchema` from `./config/config.validation`
  4. Add as first item in imports array:
     ```typescript
     ConfigModule.forRoot({
       isGlobal: true,
       load: [authConfig, oauthConfig, appConfig],
       validationSchema: configValidationSchema,
       validationOptions: { abortEarly: true },
     }),
     ```
- **Implementation Notes**: `isGlobal: true` makes ConfigService available everywhere without importing ConfigModule in each feature module.

### Step 5: Migrate JwtModule to registerAsync in AuthModule

- **File**: `src/auth/auth.module.ts`
- **Action**: Replace `JwtModule.register()` with `JwtModule.registerAsync()`
- **Implementation Steps**:
  1. Add imports: `ConfigModule, ConfigService` from `@nestjs/config`
  2. Replace `JwtModule.register({...})` with:
     ```typescript
     JwtModule.registerAsync({
       imports: [ConfigModule],
       inject: [ConfigService],
       useFactory: (configService: ConfigService) => ({
         secret: configService.get<string>('auth.jwtSecret'),
         signOptions: {
           expiresIn: configService.get<string>('auth.jwtAccessExpiration') as StringValue,
           issuer: 'nexacore-api',
           audience: 'nexacore-api',
           algorithm: 'HS256' as const,
         },
         verifyOptions: {
           issuer: 'nexacore-api',
           audience: 'nexacore-api',
           algorithms: ['HS256'],
         },
       }),
     }),
     ```
  3. Remove `type { StringValue } from 'ms'` import if no longer needed at top level (it will be used inside the factory). Actually keep it — the factory return type needs the cast.

### Step 6: Migrate AuthService

- **File**: `src/auth/auth.service.ts`
- **Action**: Inject ConfigService, replace 6 process.env reads
- **Implementation Steps**:
  1. Add `ConfigService` from `@nestjs/config` to constructor as 13th dep:
     ```typescript
     private readonly configService: ConfigService,
     ```
  2. Replace constructor body (lines 122-131):
     ```typescript
     this.refreshExpiration = this.configService.get<string>('auth.jwtRefreshExpiration')!;
     this.refreshMaxAgeMs = parseDurationMs(this.refreshExpiration);
     const jwtSecret = this.configService.get<string>('auth.jwtSecret')!;
     this.mfaChallengeSecret = crypto
       .createHmac('sha256', jwtSecret)
       .update('mfa-challenge-token')
       .digest('hex');
     ```
  3. Replace `process.env.JWT_ACCESS_EXPIRATION` at lines 515 and 728:
     ```typescript
     { expiresIn: this.configService.get<string>('auth.jwtAccessExpiration') as StringValue }
     ```
  4. Replace `process.env.NODE_ENV` at lines 1238 and 1252:
     ```typescript
     secure: this.configService.get<boolean>('app.isProduction'),
     ```

### Step 7: Migrate AuthController

- **File**: `src/auth/auth.controller.ts`
- **Action**: Inject ConfigService, replace 4 process.env reads
- **Implementation Steps**:
  1. Add `ConfigService` from `@nestjs/config` to constructor as 6th dep:
     ```typescript
     private readonly configService: ConfigService,
     ```
  2. Replace `process.env.FRONTEND_URL` at lines 301, 323 with:
     ```typescript
     const frontendUrl = this.configService.get<string>('app.frontendUrl')!;
     ```
  3. Replace `getValidatedFrontendUrl()` method (lines 656-669):
     ```typescript
     private getValidatedFrontendUrl(): string {
       const frontendUrl = this.configService.get<string>('app.frontendUrl')!;
       const allowedUrlsRaw = this.configService.get<string>('app.oauthAllowedRedirectUrls');
       const allowedUrls = (allowedUrlsRaw || frontendUrl)
         .split(',')
         .map((u) => u.trim());

       if (!allowedUrls.includes(frontendUrl)) {
         throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
       }

       return frontendUrl;
     }
     ```

### Step 8: Migrate JwtStrategy

- **File**: `src/auth/strategies/jwt.strategy.ts`
- **Action**: Inject ConfigService, pass to super()
- **Implementation Steps**:
  1. Add `ConfigService` from `@nestjs/config` to constructor as 3rd dep
  2. Replace `super()` call:
     ```typescript
     constructor(
       private readonly usersService: UsersService,
       private readonly tokenDenyListService: TokenDenyListService,
       configService: ConfigService,
     ) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         secretOrKey: configService.get<string>('auth.jwtSecret'),
         issuer: 'nexacore-api',
         audience: 'nexacore-api',
         algorithms: ['HS256'],
       });
     }
     ```
  3. Note: `configService` is NOT `private readonly` — it's only used in `super()`, not stored.

### Step 9: Migrate GoogleStrategy

- **File**: `src/auth/strategies/google.strategy.ts`
- **Action**: Inject ConfigService, pass to super()
- **Implementation Steps**:
  1. Add `ConfigService` from `@nestjs/config` as 3rd constructor param (not private — used only in super)
  2. Replace `super()` call:
     ```typescript
     constructor(
       private readonly authService: AuthService,
       private readonly oauthStateStore: OAuthStateStore,
       configService: ConfigService,
     ) {
       super({
         clientID: configService.get<string>('oauth.googleClientId'),
         clientSecret: configService.get<string>('oauth.googleClientSecret'),
         callbackURL: configService.get<string>('oauth.googleCallbackUrl'),
         scope: ['email', 'profile'],
         passReqToCallback: true,
       });
     }
     ```

### Step 10: Migrate GitHubStrategy

- **File**: `src/auth/strategies/github.strategy.ts`
- **Action**: Inject ConfigService, pass to super()
- **Implementation Steps**:
  1. Same pattern as GoogleStrategy:
     ```typescript
     constructor(
       private readonly authService: AuthService,
       private readonly oauthStateStore: OAuthStateStore,
       configService: ConfigService,
     ) {
       super({
         clientID: configService.get<string>('oauth.githubClientId'),
         clientSecret: configService.get<string>('oauth.githubClientSecret'),
         callbackURL: configService.get<string>('oauth.githubCallbackUrl'),
         scope: ['user:email'],
         passReqToCallback: true,
       });
     }
     ```

### Step 11: Migrate OAuthCallbackFilter

- **File**: `src/auth/guards/oauth-callback.filter.ts`
- **Action**: Add constructor with ConfigService injection
- **Implementation Steps**:
  1. Add constructor:
     ```typescript
     constructor(private readonly configService: ConfigService) {}
     ```
  2. Replace `process.env.FRONTEND_URL` at line 15:
     ```typescript
     const frontendUrl = this.configService.get<string>('app.frontendUrl')!;
     ```
  3. Add import: `ConfigService` from `@nestjs/config`

### Step 12: Update auth.constants.ts

- **File**: `src/auth/constants/auth.constants.ts`
- **Action**: Remove process.env reads, keep as static defaults
- **Implementation Steps**:
  1. Replace the 3 process.env constants with static defaults:
     ```typescript
     /** Default session idle timeout (hours). Overridden by ConfigService at runtime. */
     export const DEFAULT_SESSION_IDLE_TIMEOUT_HOURS = 0.5;

     /** Default max concurrent sessions. Overridden by ConfigService at runtime. */
     export const DEFAULT_MAX_CONCURRENT_SESSIONS = 5;

     /** Default trusted device TTL (days). Overridden by ConfigService at runtime. */
     export const DEFAULT_TRUSTED_DEVICE_TTL_DAYS = 30;
     ```
  2. Keep the existing `SESSION_IDLE_TIMEOUT_HOURS`, `MAX_CONCURRENT_SESSIONS`, `TRUSTED_DEVICE_TTL_DAYS` export names but source them from defaults (they're used in multiple files — renaming would cascade). Alternatively, check all consumers:
     - `SESSION_IDLE_TIMEOUT_HOURS` — used in `sessions.service.ts` and `auth.service.ts`
     - `MAX_CONCURRENT_SESSIONS` — used in `auth.service.ts`
     - `TRUSTED_DEVICE_TTL_DAYS` — used in `trusted-device.service.ts`
  3. **Decision**: Keep the exported constants with their current names but set them to the static defaults. The consuming services (AuthService, SessionsService, TrustedDeviceService) should use ConfigService values instead. But since those services are out of auth scope for this ticket, keep the constants as-is for backward compatibility and only remove `process.env` from `auth.constants.ts`. The consuming services will be migrated when their respective modules are addressed.
  4. **Actually simpler**: Just replace:
     ```typescript
     export const SESSION_IDLE_TIMEOUT_HOURS = parseFloat(
       process.env.SESSION_IDLE_TIMEOUT_HOURS || '0.5',
     );
     ```
     With the value from config. But since this is a top-level constant (no DI available), and the consuming services already have access to ConfigService, the cleanest approach is:
     - Keep the constants as plain defaults (no process.env)
     - Update the consuming services to prefer ConfigService over the constant
  5. For this ticket, since `sessions.service.ts` and `trusted-device.service.ts` are outside auth scope, just remove `process.env` from `auth.constants.ts` by using plain defaults, and update `auth.service.ts` (which IS in scope) to use ConfigService for `SESSION_IDLE_TIMEOUT_HOURS` and `MAX_CONCURRENT_SESSIONS`.
- **Implementation Notes**: Check where these constants are imported before changing names.

### Step 13: Update Test Files

- **Action**: Add ConfigService mocks to all affected test files
- **Implementation Steps**:
  1. For each test file that creates a `TestingModule` with an affected class, add a ConfigService mock provider:
     ```typescript
     {
       provide: ConfigService,
       useValue: {
         get: jest.fn((key: string) => {
           const config: Record<string, any> = {
             'auth.jwtSecret': 'test-secret-that-is-at-least-32-chars-long',
             'auth.jwtAccessExpiration': '15m',
             'auth.jwtRefreshExpiration': '12h',
             'auth.sessionIdleTimeoutHours': 0.5,
             'auth.maxConcurrentSessions': 5,
             'auth.trustedDeviceTtlDays': 30,
             'oauth.googleClientId': 'test-google-id',
             'oauth.googleClientSecret': 'test-google-secret',
             'oauth.googleCallbackUrl': 'http://localhost:3000/auth/google/callback',
             'oauth.githubClientId': 'test-github-id',
             'oauth.githubClientSecret': 'test-github-secret',
             'oauth.githubCallbackUrl': 'http://localhost:3000/auth/github/callback',
             'app.nodeEnv': 'test',
             'app.frontendUrl': 'http://localhost:3001',
             'app.oauthAllowedRedirectUrls': '',
             'app.isProduction': false,
           };
           return config[key];
         }),
       },
     },
     ```
  2. Affected test files:
     - `src/auth/tests/auth.service.spec.ts` — add ConfigService mock, remove `process.env.JWT_REFRESH_EXPIRATION` setup/cleanup
     - `src/auth/tests/auth.controller.spec.ts` — add ConfigService mock
     - `src/auth/tests/google.strategy.spec.ts` — add ConfigService mock
     - `src/auth/tests/github.strategy.spec.ts` — add ConfigService mock
     - Any other test that instantiates modified classes

### Step 14: Verify All process.env Removed from Auth Source Files

- **Action**: Run grep to confirm zero process.env in auth source files (excluding tests)
- **Implementation Steps**:
  1. `grep -r "process\.env" src/auth/ --include="*.ts" --exclude-dir="tests"` — should return zero results
  2. `npx jest --no-coverage` — all tests must pass
  3. `npx nest build` — must compile clean

### Step 15: Update Technical Documentation

- **Action**: Update integration-state.md and backend-standards.mdc
- **Implementation Steps**:
  1. Add changelog entry to `integration-state.md`
  2. Update Module Registry: AppModule imports now include ConfigModule
  3. Update Test Mock Requirements: add ConfigService to all affected test mocks
  4. Update Service Dependency Chains: add ConfigService to AuthService, AuthController deps

---

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Install @nestjs/config
3. Step 2: Create typed config files (auth, oauth, app, index)
4. Step 3: Create validation schema
5. Step 4: Register ConfigModule in AppModule
6. Step 5: Migrate JwtModule to registerAsync
7. Step 6: Migrate AuthService (6 process.env reads)
8. Step 7: Migrate AuthController (4 process.env reads)
9. Step 8: Migrate JwtStrategy (1 process.env read)
10. Step 9: Migrate GoogleStrategy (3 process.env reads)
11. Step 10: Migrate GitHubStrategy (3 process.env reads)
12. Step 11: Migrate OAuthCallbackFilter (1 process.env read)
13. Step 12: Update auth.constants.ts (3 process.env reads)
14. Step 13: Update test files
15. Step 14: Verify zero process.env + all tests pass + build clean
16. Step 15: Update documentation

---

## 7. Testing Checklist

- [ ] `@nestjs/config` installed in package.json
- [ ] ConfigModule.forRoot() registered globally in AppModule
- [ ] App fails fast with clear error when JWT_SECRET is missing
- [ ] App fails fast in production when OAuth credentials are missing
- [ ] App starts successfully with all env vars set
- [ ] JwtModule uses registerAsync with ConfigService
- [ ] Zero `process.env` reads in `src/auth/` source files (excluding tests)
- [ ] All existing unit tests pass (835+)
- [ ] `nest build` compiles clean
- [ ] Default values match previous process.env fallbacks exactly
- [ ] Config values are typed (not raw string lookups)

---

## 8. Error Response Format

N/A — no new endpoints or error responses. ConfigModule validation throws at startup (before any HTTP requests), not at runtime.

---

## 9. Partial Update Support

N/A

---

## 10. Dependencies

- **New**: `@nestjs/config` (NestJS official config module)
- **New**: `joi` (validation schema library — may already be a transitive dep, check before installing)

---

## 11. Notes

- **Fail-fast validation**: The Joi schema in Step 3 makes `JWT_SECRET` required with min 32 chars. The current codebase falls back to `'default-dev-secret-change-in-production'` which is insecure. The new validation will require a proper secret, which means `.env` files and CI must be updated.
- **Test environment**: Tests set `NODE_ENV=test`, which makes OAuth credentials optional. The test ConfigService mock provides test values.
- **Non-auth process.env**: There are 23+ additional `process.env` reads in non-auth files (main.ts, security, mail, redis, crypto, geolocation, prisma). These are OUT OF SCOPE for this ticket but will benefit from ConfigModule being globally available.
- **auth.constants.ts challenge**: Top-level constants cannot use DI. The approach is to remove process.env and use plain defaults, with the consuming services using ConfigService values at runtime. This is a deliberate trade-off to avoid a massive refactor of constants consumers.
- **Passport strategy pattern**: Passport strategies receive config in `super()` before the class is fully constructed. The `configService` param is used only in `super()` and not stored as a private field.

---

## 12. Next Steps After Implementation

- Run `/update-docs` to create implementation record
- Commit and create PR
- Future ticket: migrate remaining non-auth process.env reads to ConfigService

---

## 13. Implementation Verification

- [ ] `src/config/` directory with auth.config.ts, oauth.config.ts, app.config.ts, config.validation.ts, index.ts
- [ ] ConfigModule.forRoot() in AppModule with isGlobal, load, validationSchema
- [ ] JwtModule.registerAsync() in AuthModule
- [ ] ConfigService injected in: AuthService, AuthController, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthCallbackFilter
- [ ] auth.constants.ts has zero process.env reads
- [ ] Zero process.env in auth source files (grep verification)
- [ ] All tests pass (unit + build)
- [ ] Documentation updated (integration-state.md)
