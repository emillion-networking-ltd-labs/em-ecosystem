# Backend Implementation Plan: SCRUM-197 Split auth.controller.ts into Focused Controllers

## 1. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-190 (.env.example completion)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/auth.controller.ts` — 707 lines, 6 constructor deps, 25 endpoints
  - `nexacore-api/src/auth/auth.module.ts` — controllers: [AuthController, MfaController, PasskeyController]
  - `nexacore-api/src/auth/auth.service.ts` — facade with 9 deps, delegates to 5 decomposed services
  - `nexacore-api/src/auth/mfa.controller.ts` — 186 lines, pattern reference (`@Controller('auth/mfa')`)
  - `nexacore-api/src/auth/passkey.controller.ts` — pattern reference (`@Controller('auth/passkeys')`)
  - `nexacore-api/src/auth/constants/auth.constants.ts` — AUTH_RATE_LIMITS definitions
  - `nexacore-api/src/auth/trusted-device.service.ts` — TrustedDeviceService
  - `nexacore-api/src/sessions/sessions.service.ts` — SessionsService
- **Constructor signatures verified**:
  - `AuthController(authService: AuthService, sessionsService: SessionsService, jwtService: JwtService, permissionsService: PermissionsService, trustedDeviceService: TrustedDeviceService, configService: ConfigService)` — 6 deps
- **Methods verified to exist**: All 25 endpoint methods in auth.controller.ts confirmed via read
- **Guard dependency chain verified**: JwtAuthGuard, RolesGuard, TurnstileGuard, GoogleAuthGuard, GitHubAuthGuard, OAuthLinkGuard — all already registered in AuthModule
- **Discrepancies with integration-state.md**: None

## 2. Overview

Split `auth.controller.ts` (707 lines, 25 endpoints) into 4 focused controllers following the service decomposition completed in SCRUM-181. The current controller handles core auth, OAuth, email verification, password reset, sessions, and trusted devices — violating Single Responsibility Principle.

**Split strategy**: Group endpoints by domain, matching the decomposed service architecture. Keep using `AuthService` facade to avoid cascading refactoring.

## 3. Architecture Context

### Current State
- **1 controller** (AuthController) with 707 lines, 6 DI deps, 25 endpoints
- **2 existing controllers** already separated: MfaController (186 lines), PasskeyController (168 lines)
- AuthService is a facade delegating to: LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService

### Target State
- **4 controllers** replacing the single AuthController:

| Controller | Route Prefix | Endpoints | ~Lines | Dependencies |
|------------|-------------|-----------|--------|--------------|
| **AuthController** | `auth` | csrf-token, register, login, refresh, logout, logout-all, me, admin | ~200 | AuthService, PermissionsService |
| **OAuthController** | `auth` | google, google/callback, github, github/callback, oauth/exchange, link/google, link/github | ~220 | AuthService, ConfigService |
| **AccountController** | `auth` | verify-email, verify-email-change, resend-verification, resend-verification-public, forgot-password, reset-password, validate-reset-token | ~160 | AuthService, ConfigService |
| **SessionController** | `auth` | sessions (GET, DELETE), trusted-devices (POST, GET, DELETE, DELETE/:id) | ~130 | SessionsService, TrustedDeviceService, JwtService |

- MfaController and PasskeyController remain unchanged
- Total: 6 controllers in AuthModule (was 3), each < 230 lines

### Helper Method Mapping
- `setCookie(res, cookie)` — private method in AuthController and OAuthController (both need it)
- `getCurrentSessionId(req)` — moves to SessionController (only consumer)
- `getValidatedFrontendUrl()` — moves to OAuthController (only consumer)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-197-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-197-backend`

### Step 1: Create OAuthController

- **File**: `nexacore-api/src/auth/oauth.controller.ts`
- **Action**: Extract all OAuth endpoints from AuthController
- **Implementation Steps**:
  1. Create new file with `@Controller('auth')` and `@ApiTags('auth')` and `@UseInterceptors(NoCacheInterceptor)`
  2. Constructor: `OAuthController(authService: AuthService, configService: ConfigService)`
  3. Move these endpoints:
     - `GET google` (lines 452-467) — with GoogleAuthGuard
     - `GET google/callback` (lines 469-495) — with GoogleAuthGuard, OAuthCallbackFilter
     - `GET github` (lines 497-512) — with GitHubAuthGuard
     - `GET github/callback` (lines 514-540) — with GitHubAuthGuard, OAuthCallbackFilter
     - `POST oauth/exchange` (lines 542-574) — with rate limiting
     - `GET link/google` (lines 646-667) — with OAuthLinkGuard, GoogleAuthGuard
     - `GET link/github` (lines 669-690) — with OAuthLinkGuard, GitHubAuthGuard
  4. Move `getValidatedFrontendUrl()` private method (lines 692-706)
  5. Add `setCookie()` private method (copy from AuthController)
  6. Imports: AuthService, ConfigService, GoogleAuthGuard, GitHubAuthGuard, OAuthCallbackFilter, OAuthLinkGuard, OAuthExchangeDto, CookieConfig, SafeUser, AUTH_RATE_LIMITS, NoCacheInterceptor, extractRequestMeta

### Step 2: Create AccountController

- **File**: `nexacore-api/src/auth/account.controller.ts`
- **Action**: Extract email verification and password reset endpoints
- **Implementation Steps**:
  1. Create new file with `@Controller('auth')` and `@ApiTags('auth')` and `@UseInterceptors(NoCacheInterceptor)`
  2. Constructor: `AccountController(authService: AuthService, configService: ConfigService)`
  3. Move these endpoints:
     - `GET verify-email` (lines 300-320) — redirect endpoint
     - `GET verify-email-change` (lines 322-344) — redirect endpoint
     - `POST resend-verification` (lines 346-360) — JwtAuthGuard
     - `POST resend-verification-public` (lines 362-383) — TurnstileGuard, SkipCsrf
     - `POST forgot-password` (lines 387-403) — TurnstileGuard, SkipCsrf
     - `POST reset-password` (lines 405-422) — SkipCsrf
     - `POST validate-reset-token` (lines 424-433) — SkipCsrf
  4. Imports: AuthService, ConfigService, JwtAuthGuard, TurnstileGuard, ForgotPasswordDto, ResetPasswordDto, ValidateResetTokenDto, ResendVerificationPublicDto, SkipCsrf, NoCacheInterceptor, extractRequestMeta, ErrorMessages

### Step 3: Create SessionController

- **File**: `nexacore-api/src/auth/session.controller.ts`
- **Action**: Extract session and trusted device management endpoints
- **Implementation Steps**:
  1. Create new file with `@Controller('auth')` and `@ApiTags('auth')` and `@UseInterceptors(NoCacheInterceptor)`
  2. Constructor: `SessionController(sessionsService: SessionsService, trustedDeviceService: TrustedDeviceService, jwtService: JwtService)`
  3. Move these endpoints:
     - `GET sessions` (lines 254-266) — JwtAuthGuard
     - `DELETE sessions/:id` (lines 268-280) — JwtAuthGuard
     - `POST trusted-devices` (lines 578-605) — JwtAuthGuard
     - `GET trusted-devices` (lines 607-615) — JwtAuthGuard
     - `DELETE trusted-devices` (lines 617-627) — JwtAuthGuard
     - `DELETE trusted-devices/:id` (lines 629-642) — JwtAuthGuard
  4. Move `getCurrentSessionId(req)` private method (lines 85-94)
  5. Imports: SessionsService, TrustedDeviceService, JwtService, JwtAuthGuard, TrustDeviceDto, RefreshTokenPayload, NoCacheInterceptor, extractRequestMeta, ParseUUIDPipe

### Step 4: Slim Down AuthController

- **File**: `nexacore-api/src/auth/auth.controller.ts`
- **Action**: Remove extracted endpoints, simplify constructor
- **Implementation Steps**:
  1. Remove all endpoints moved to OAuthController, AccountController, SessionController
  2. Remove helper methods: `getCurrentSessionId`, `getValidatedFrontendUrl`
  3. Update constructor to only inject: `AuthService, PermissionsService`
  4. Keep these endpoints:
     - `GET csrf-token` (lines 96-113)
     - `POST register` (lines 115-138) — TurnstileGuard
     - `POST login` (lines 140-183) — TurnstileGuard
     - `POST refresh` (lines 185-216) — rate limited
     - `POST logout` (lines 218-235)
     - `POST logout-all` (lines 237-252) — JwtAuthGuard
     - `GET me` (lines 282-296) — JwtAuthGuard
     - `GET admin` (lines 437-450) — JwtAuthGuard, RolesGuard
  5. Keep `setCookie()` private method
  6. Remove unused imports (SessionsService, TrustedDeviceService, JwtService, ConfigService, etc.)
  7. Note: AuthController still needs `UnauthorizedException` (for refresh), `CsrfGuard` (static method for csrf-token), `SecurityConfig` (csrf config)

### Step 5: Update AuthModule

- **File**: `nexacore-api/src/auth/auth.module.ts`
- **Action**: Register new controllers
- **Implementation Steps**:
  1. Import OAuthController, AccountController, SessionController
  2. Update `controllers` array:
     ```typescript
     controllers: [AuthController, OAuthController, AccountController, SessionController, MfaController, PasskeyController],
     ```
  3. No changes to providers or exports — all services remain the same

### Step 6: Update Tests

- **File**: `nexacore-api/tests/auth/auth.controller.spec.ts` (and new test files)
- **Action**: Reorganize existing controller tests to match the new controller structure
- **Implementation Steps**:
  1. Read existing test file to understand current test structure
  2. Create `nexacore-api/tests/auth/oauth.controller.spec.ts` — move OAuth-related tests
  3. Create `nexacore-api/tests/auth/account.controller.spec.ts` — move email verification + password reset tests
  4. Create `nexacore-api/tests/auth/session.controller.spec.ts` — move session + trusted device tests
  5. Update `auth.controller.spec.ts` — keep only core auth tests, update mock providers to match new constructor
  6. Each test file should mock only the dependencies needed by its controller
  7. Verify all tests pass: `npx jest --testPathPattern=auth/.*controller`

### Step 7: Update Technical Documentation

- **Action**: Update integration-state.md to reflect the new controller structure
- **Implementation Steps**:
  1. Update AuthModule row in Module Registry to list all 6 controllers
  2. Add changelog entry for SCRUM-197
  3. No API endpoint changes (routes remain identical)
  4. No api-spec.yml changes (endpoints unchanged)

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create OAuthController
3. Step 2: Create AccountController
4. Step 3: Create SessionController
5. Step 4: Slim down AuthController
6. Step 5: Update AuthModule
7. Step 6: Update tests
8. Step 7: Update technical documentation

## 6. Testing Checklist

- [ ] All existing tests pass (no regressions)
- [ ] Each new controller has its own test file with appropriate mocks
- [ ] OAuth endpoints work: `GET /auth/google`, `GET /auth/github`, `POST /auth/oauth/exchange`
- [ ] Account endpoints work: `GET /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- [ ] Session endpoints work: `GET /auth/sessions`, `DELETE /auth/sessions/:id`
- [ ] Trusted device endpoints work: `POST /auth/trusted-devices`, `GET /auth/trusted-devices`
- [ ] Core auth endpoints work: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] `nest build` succeeds
- [ ] No circular dependencies introduced
- [ ] E2E tests pass (routes unchanged)

## 7. Error Response Format

N/A — no changes to error handling. All endpoints retain their existing response formats and HTTP status codes.

## 8. Dependencies

No new dependencies required. All services and guards are already registered in AuthModule.

## 9. Notes

- **Routes are unchanged**: All endpoints keep their exact same paths under `/auth/*`. This is purely an internal structural refactoring.
- **Multiple controllers can share a route prefix**: NestJS supports multiple controllers with `@Controller('auth')` — it merges all routes.
- **AuthService facade preserved**: New controllers continue using `AuthService` as their primary dependency (except SessionController which uses `SessionsService` and `TrustedDeviceService` directly, matching the current pattern).
- **`setCookie` duplication**: The helper is duplicated in AuthController and OAuthController (2 occurrences). This is acceptable — it's a 3-line method. Extracting to a utility would over-engineer.
- **Naming choice**: `AccountController` groups email verification + password reset because both are unauthenticated account management workflows (token-based email flows). This is more cohesive than separate 70-line and 100-line controllers.

## 10. Next Steps After Implementation

- Run `/update-docs SCRUM-197` to create implementation record
- Proceed to SCRUM-201 (split auth.service.spec.ts) — which directly depends on this controller split

## 11. Implementation Verification

- [ ] **Code Quality**: Each controller < 230 lines, single responsibility, clean imports
- [ ] **Functionality**: All 25 endpoints accessible at same paths, same behavior
- [ ] **Testing**: All controller tests pass, organized per controller
- [ ] **Integration**: AuthModule registers 6 controllers, no circular deps
- [ ] **Documentation**: integration-state.md updated with new controller structure
