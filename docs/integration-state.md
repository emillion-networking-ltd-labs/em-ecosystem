# EM NexaCore — Integration State (Architecture)

> Migrated from the em-development-framework repo (SCRUM-572, Wave 8). This is the
> NexaCore application architecture map (modules, guards, controllers, permissions,
> service dependencies, test-mock requirements). The framework's wave changelog stays
> in the framework repo; this file's changelog starts fresh here for em-ecosystem.

## Module Registry

| Module | @Global? | Imports | Exports | Controllers |
|--------|----------|---------|---------|-------------|
| **AppModule** | No | **ConfigModule**, ThrottlerModule, PrismaModule, **RedisModule**, **GeolocationModule**, AuthModule, UsersModule, AuditModule, SecurityModule, MailModule, PermissionsModule, **StorageModule**, **OnlineMlScorerModule** [SCRUM-462], **TenantsModule** [SCRUM-487], ServeStaticModule | — | — |
| **PrismaModule** | **Yes** | — | PrismaService (factory provider installs tenant-filter `$extends` at boot [SCRUM-488]; module declares `OnApplicationShutdown` for `$disconnect`) | — |
| **RedisModule** | **Yes** | — | REDIS_CLIENT (ioredis) | — |
| **CryptoModule** | **Yes** | — | CryptoService | — |
| **PermissionsModule** | **Yes** | AuditModule | PermissionsService, PermissionsCache, PermissionsGuard | PermissionsController |
| **AuthModule** | No | UsersModule (forwardRef), AuditModule, **SessionsModule (forwardRef)** [SCRUM-347], CryptoModule, MailModule, PassportModule, JwtModule, SecurityModule | AuthService, **TokenService**, PasswordBreachService, TrustedDeviceService, **TokenDenyListService** (internal-only providers, NOT exported: **`TokenServiceV2`** [SCRUM-492 — Phase 1.1; gained first production consumer `AuthV2Controller` in SCRUM-494 Phase 1.3], **`JwtV2Strategy`** [SCRUM-494 — Phase 1.3; Passport strategy named `'jwt-v2'`, two-gate verify via `isValidV2Payload` util], **`AuthIntentService`** [SCRUM-497 — Phase 2.2; state-machine driver for v2 login orchestration, 7-dep constructor]) | AuthController, **AuthV2Controller** [SCRUM-494 — Phase 1.3; first v2 production HTTP surface, hosts `POST /auth/v2/refresh`], **AuthIntentController** [SCRUM-497 — Phase 2.2; hosts `POST /auth/v2/intents` + `POST /auth/v2/intents/:id/advance`, NO `@UseGuards`, gated by `app.authIntentV2Enabled` feature flag], OAuthController, AccountController, SessionController, MfaController, PasskeyController |
| **UsersModule** | No | AuditModule, SessionsModule, MailModule, AuthModule (forwardRef), **StorageModule** | UsersService | UsersController |
| **StorageModule** | No | — | FILE_STORAGE (LocalStorageProvider) | — |
| **AuditModule** | No | — | AuditService | AuditLogController |
| **GeolocationModule** | **Yes** | AuditModule, MailModule | GeolocationService, ImpossibleTravelService | — |
| **SessionsModule** | No | AuditModule, **AuthModule (forwardRef)** [SCRUM-347] | SessionsService, **`SessionsServiceV2`** [SCRUM-493 + SCRUM-494 — Phase 1.2 internal scaffolding; now EXPORTED as of SCRUM-494 Phase 1.3 with first consumer `AuthV2Controller`; strangler-pattern invariant NAMED-relaxed] | — |
| **MailModule** | No | MailerModule | MailService | — |
| **SecurityModule** | No | AuditModule, MailModule | SuspiciousLoginService, **TurnstileService**, **TurnstileGuard** (registers CsrfGuard as APP_GUARD) | — |
| **OnlineMlScorerModule** [SCRUM-462] | No | — | OnlineMlScorerService, OnlineMlScorerInterceptor | — |
| **TenantsModule** [SCRUM-487 + SCRUM-491 + SCRUM-495] | **Yes** | AuditModule [SCRUM-491] | TenantsService, **MembershipsService** [SCRUM-491], **OrganizationsService** [SCRUM-495 — Phase 2.1] | **TenantsController** [SCRUM-491], **OrganizationsController** [SCRUM-495 — Phase 2.1]. Now `implements NestModule.configure(consumer)` — registers **`SubdomainTenantResolverMiddleware`** [SCRUM-495 — Phase 2.1] globally on `*` routes (binds `TenantContext` from Host's subdomain at request boundary; skip-paths: localhost/127.0.0.1, /health, /metrics; platform-admin canonical subdomain → runWithBypass). |

## Guard Dependency Map

**CRITICAL**: Any module whose controller uses a guard must have access to that guard's dependencies.

| Guard | Constructor Dependencies | Source Module | Available Via |
|-------|-------------------------|---------------|---------------|
| `JwtAuthGuard` | — (extends AuthGuard('jwt')) | Passport global registry | Always available |
| `RolesGuard` | `Reflector`, **`AuditService`** | AuditModule | **Must import AuditModule**. Bypass triggered by `User.isPlatformAdmin === true` [SCRUM-489 — Phase 0.3], NOT legacy `Role.SUPERADMIN`. Audit action name `SUPERADMIN_BYPASS` preserved for log-history compatibility (semantic meaning unchanged). |
| `PermissionsGuard` | `Reflector`, `PermissionsService` | PermissionsModule | @Global — always available. Bypass triggered by `User.isPlatformAdmin === true` [SCRUM-489 — Phase 0.3], NOT legacy `Role.SUPERADMIN`. |
| `CsrfGuard` | `Reflector` | NestJS Core | Always available (registered as APP_GUARD) |
| `CustomThrottlerGuard` | — (extends ThrottlerGuard) | ThrottlerModule | Always available (registered as APP_GUARD) |
| `GoogleAuthGuard` | `OAuthStateStore` | AuthModule | Only in AuthModule context |
| `GitHubAuthGuard` | `OAuthStateStore` | AuthModule | Only in AuthModule context |
| `OAuthLinkGuard` | `OAuthLinkCodeStore` | AuthModule | Only in AuthModule context |
| `TurnstileGuard` | `TurnstileService` | SecurityModule | AuthModule imports SecurityModule |
| **`MfaSetupGuard`** | **`TokenService`** | **AuthModule** | **Only in AuthModule context** |
| **`JwtOrMfaSetupGuard`** | **`JwtAuthGuard`, `MfaSetupGuard`** | **AuthModule** | **Only in AuthModule context** |

### Import Rule

> **Any controller using `@UseGuards(RolesGuard)` MUST be in a module that imports `AuditModule`.**

Modules that currently import AuditModule:
- AuthModule
- UsersModule
- PermissionsModule
- SessionsModule

## Controller Guard Chains

| Controller | Module | Class-Level Guards | Method-Level Guards | Services Injected |
|------------|--------|-------------------|--------------------|--------------------|
| **AuthController** | AuthModule | @UseInterceptors(NoCacheInterceptor) | Mixed (see below) | AuthService, PermissionsService |
| **AccountController** | AuthModule | @UseInterceptors(NoCacheInterceptor) | Mixed (see below) | AuthService |
| **OAuthController** | AuthModule | @UseInterceptors(NoCacheInterceptor) | Mixed (see below) | AuthService, ConfigService, OAuthLinkCodeStore |
| **SessionController** | AuthModule | @UseInterceptors(NoCacheInterceptor) | JwtAuthGuard (all methods), @Throttle (1 method) | SessionsService, TrustedDeviceService, JwtService |
| **MfaController** | AuthModule | @UseInterceptors(NoCacheInterceptor) | JwtAuthGuard (most methods), @Throttle (5 methods) | MfaService, **TokenService**, **TrustedDeviceService** |
| **PasskeyController** | AuthModule | @UseInterceptors(NoCacheInterceptor) | JwtAuthGuard (5 methods), @Throttle (4 methods) | PasskeyService, **TokenService** |
| **UsersController** | UsersModule | — | Mixed (see below) | UsersService |
| **AuditLogController** | AuditModule | JwtAuthGuard, RolesGuard, PermissionsGuard | Inherits class guards | AuditService |
| **PermissionsController** | PermissionsModule | JwtAuthGuard, RolesGuard, PermissionsGuard | Inherits class guards | PermissionsService |
| **TenantsController** [SCRUM-491] | TenantsModule | **JwtAuthGuard** (class-level) | `@Throttle(THROTTLE_CONFIGS.sensitiveAction)` on createInvitation + acceptInvitation | InvitationsService, MembershipsService |
| **OrganizationsController** [SCRUM-495 — Phase 2.1] | TenantsModule | **`AuthGuard('jwt')`** (class-level, equivalent to JwtAuthGuard) | — | OrganizationsService, MembershipsService, TenantsService |
| **AuthIntentController** [SCRUM-497 — Phase 2.2] | AuthModule | **NONE** (the intent IS the auth state) | `@Throttle({ global: AUTH_RATE_LIMITS.login })` on both endpoints | AuthIntentService, ConfigService |

### AuthIntentController Method Guards [SCRUM-497 — Phase 2.2]

| Method | Guards | Decorators | Authz model |
|--------|--------|------------|-------------|
| POST /auth/v2/intents | — | `@Throttle({ global: AUTH_RATE_LIMITS.login })`, `@HttpCode(201)` | NONE — entry point of orchestration. Feature flag gate: `assertEnabled()` private helper throws `NotFoundException` if `app.authIntentV2Enabled=false` (mimics "endpoint doesn't exist"). |
| POST /auth/v2/intents/:id/advance | — | `@Throttle({ global: AUTH_RATE_LIMITS.login })`, `@HttpCode(200)` | NONE — the intent itself IS the auth state. Service-layer validation: 404 on intent-not-found OR flag-off; 410 Gone on terminal-state replay (succeeded/failed/expired); 401 with `ErrorMessages.auth.AUTHENTICATION_FAILED` on any credential/MFA/tenant-pick failure (single throw site, 11 distinct reasons in audit metadata). |

**Note**: AuthIntentController deliberately uses **no guards**. The state machine itself encapsulates authentication: each `advance()` call advances the intent through credential / MFA / tenant-pick gates, and only at `status === 'succeeded'` does it mint an access token + set the `refresh_token_v2` cookie. The 410 Gone on terminal-state replay is the v2 equivalent of "session ended"; the 404 on intent-not-found prevents existence enumeration. Cookie posture mirrors AuthV2Controller Phase 1.3 (httpOnly + secure-in-prod + sameSite=strict + path=/).

### OrganizationsController Method Guards [SCRUM-495 — Phase 2.1]

| Method | Guards | Decorators | Authz model |
|--------|--------|------------|-------------|
| GET /tenants/:tenantId/organizations | AuthGuard('jwt') | — | Service-layer: `MembershipsService.requireMembership(:tenantId, userId, isPlatformAdmin)` — 404 on cross-tenant denial. Platform admins additionally verified via `TenantsService.findById` (defensive — `requireMembership` returns null for platform admins without checking tenant existence). |
| GET /tenants/:tenantId/organizations/:orgId | AuthGuard('jwt') | — | Service-layer: `MembershipsService.requireMembership` + `OrganizationsService.findById(:orgId, :tenantId)` (tenantId scoping inside service — returns null if org belongs to a different tenant). |
| POST /tenants/:tenantId/organizations | AuthGuard('jwt') | — | Service-layer: `MembershipsService.requireTenantRole(:tenantId, userId, [OWNER, ADMIN], isPlatformAdmin)` — 404 on insufficient role. |
| POST /organizations/:orgId/members | AuthGuard('jwt') | — | Service-layer: for non-platform-admin, `OrganizationsService.requireMembership(:orgId, actorId)` MUST return OWNER or ADMIN — otherwise 404 (hides org existence). Platform admins bypass the caller-membership check entirely. |

**Note**: OrganizationsController mirrors TenantsController's deliberate non-use of `RolesGuard`/`PermissionsGuard`: role checks happen at the service layer because guards cannot cleanly read `:tenantId`/`:orgId` path params via `ExecutionContext`. Cross-tenant/cross-org denial returns 404 (not 403) per the same 404-not-403 convention as SCRUM-491. Defense-in-depth: `SubdomainTenantResolverMiddleware` binds `TenantContext` from the Host's subdomain BEFORE these methods run — the JWT's `tenantId` claim is NOT trusted blindly (validator-not-binder semantics in `TenantContextInterceptor`).

### TenantsController Method Guards [SCRUM-491]

| Method | Guards | Decorators | Authz model |
|--------|--------|------------|-------------|
| POST /tenants/:tenantId/invitations | JwtAuthGuard | @Throttle(sensitiveAction) | Service-layer: `MembershipsService.requireTenantRole(:tenantId, userId, [OWNER, ADMIN], isPlatformAdmin)` |
| POST /tenants/invitations/accept | JwtAuthGuard | @Throttle(sensitiveAction) | Authenticated; service-layer enforces token + email match |
| DELETE /tenants/:tenantId/invitations/:invitationId | JwtAuthGuard | — | Service-layer: `MembershipsService.requireTenantRole(:tenantId, userId, [OWNER, ADMIN], isPlatformAdmin)` |
| GET /tenants/:tenantId/members | JwtAuthGuard | — | Service-layer: `MembershipsService.requireMembership(:tenantId, userId, isPlatformAdmin)` |

**Note**: TenantsController deliberately does NOT use `RolesGuard` or `PermissionsGuard`. Tenant-role checks are service-layer (helpers in `MembershipsService`) because NestJS guards cannot cleanly read `:tenantId` path params via `ExecutionContext`. Cross-tenant denial returns 404 (not 403) per plan §1 decision Q1. Platform-admin (`req.user.isPlatformAdmin === true`) bypasses tenant-role checks at the controller layer — Prisma extension (SCRUM-488) remains the backstop for cross-tenant data access.

### AuthController Method Guards

| Method | Guards | Decorators |
|--------|--------|------------|
| GET /csrf-token | — | @SkipCsrf |
| POST /register | **TurnstileGuard** | @Throttle |
| POST /login | **TurnstileGuard** | @Throttle |
| POST /refresh | — | @Throttle |
| POST /logout | — | — |
| POST /logout-all | JwtAuthGuard | — |
| GET /me | JwtAuthGuard | — |
| GET /admin | JwtAuthGuard, RolesGuard | @Roles(ADMIN) |

### AccountController Method Guards

| Method | Guards | Decorators |
|--------|--------|------------|
| POST /verify-email | — | @SkipCsrf, @Throttle |
| POST /verify-email-change | — | @SkipCsrf, @Throttle |
| POST /resend-verification | JwtAuthGuard | — |
| POST /resend-verification-public | **TurnstileGuard** | @SkipCsrf, @Throttle |
| POST /forgot-password | **TurnstileGuard** | @SkipCsrf, @Throttle |
| POST /reset-password | — | @SkipCsrf, @Throttle |
| POST /validate-reset-token | — | @SkipCsrf |

### OAuthController Method Guards

| Method | Guards | Decorators |
|--------|--------|------------|
| GET /google | GoogleAuthGuard | @Throttle |
| GET /google/callback | GoogleAuthGuard | @SkipThrottle, @UseFilters(OAuthCallbackFilter) |
| GET /github | GitHubAuthGuard | @Throttle |
| GET /github/callback | GitHubAuthGuard | @SkipThrottle, @UseFilters(OAuthCallbackFilter) |
| POST /oauth/exchange | — | @Throttle |
| POST /link/code | JwtAuthGuard | @ApiBearerAuth |
| GET /link/google | OAuthLinkGuard, GoogleAuthGuard | @Throttle(oauth), @ApiBearerAuth |
| GET /link/github | OAuthLinkGuard, GitHubAuthGuard | @Throttle(oauth), @ApiBearerAuth |

### SessionController Method Guards

| Method | Guards | Decorators |
|--------|--------|------------|
| GET /sessions | JwtAuthGuard | — |
| DELETE /sessions/:id | JwtAuthGuard | — |
| POST /trusted-devices | JwtAuthGuard | @Throttle(5/60s) |
| GET /trusted-devices | JwtAuthGuard | — |
| DELETE /trusted-devices | JwtAuthGuard | — |
| DELETE /trusted-devices/:id | JwtAuthGuard | — |

### MfaController Method Guards

| Method | Guards | Decorators |
|--------|--------|------------|
| POST /auth/mfa/setup | **JwtOrMfaSetupGuard** | @Throttle(mfa) |
| POST /auth/mfa/verify-setup | **JwtOrMfaSetupGuard** | @Throttle(mfa) |
| POST /auth/mfa/verify-login | — | @Throttle(mfa) |
| DELETE /auth/mfa | JwtAuthGuard | @Throttle(mfa) |
| POST /auth/mfa/recovery-codes | JwtAuthGuard | @Throttle(mfa) |
| GET /auth/mfa/status | JwtAuthGuard | @Throttle(mfa) |

### PasskeyController Method Guards

| Method | Guards | Decorators |
|--------|--------|------------|
| POST /auth/passkeys/register/options | JwtAuthGuard | @Throttle(mfa) |
| POST /auth/passkeys/register/verify | JwtAuthGuard | @Throttle(mfa) |
| POST /auth/passkeys/login/options | — | @Throttle(login) |
| POST /auth/passkeys/login/verify | — | @Throttle(login) |
| GET /auth/passkeys | JwtAuthGuard | — |
| PATCH /auth/passkeys/:id | JwtAuthGuard | — |
| DELETE /auth/passkeys/:id | JwtAuthGuard | @Throttle(mfa) |

### UsersController Method Guards

| Method | Guards | Decorators |
|--------|--------|------------|
| PATCH /me | JwtAuthGuard | — |
| POST /me/avatar | JwtAuthGuard | FileFieldsInterceptor (avatar + original) |
| DELETE /me/avatar | JwtAuthGuard | — |
| PATCH /me/password | JwtAuthGuard | — |
| POST /me/email | JwtAuthGuard | @Throttle |
| DELETE /me | JwtAuthGuard | — |
| GET /me/oauth | JwtAuthGuard | — |
| DELETE /me/oauth/:provider | JwtAuthGuard | @Throttle(5/60s) |
| GET /me/security-activity | JwtAuthGuard | — |
| GET / | JwtAuthGuard, RolesGuard, PermissionsGuard | @Roles(ADMIN), @RequirePermissions('users:read') |
| GET /:id | JwtAuthGuard, RolesGuard, PermissionsGuard | @Roles(ADMIN), @RequirePermissions('users:read') |
| PATCH /:id | JwtAuthGuard, RolesGuard, PermissionsGuard | @Roles(ADMIN), @RequirePermissions('users:write') |
| DELETE /:id | JwtAuthGuard, RolesGuard, PermissionsGuard | @Roles(ADMIN), @RequirePermissions('users:delete') |

## Global Guards (APP_GUARD)

Applied to ALL routes before controller-level guards:

1. **CustomThrottlerGuard** (from AppModule) — Rate limiting
2. **CsrfGuard** (from SecurityModule) — CSRF token validation (skips GET/HEAD/OPTIONS and @SkipCsrf)

## Global Interceptors (APP_INTERCEPTOR)

Applied to ALL routes AFTER guards pass (per NestJS lifecycle: Middleware → Guards → Interceptors → Handler):

1. **OnlineMlScorerInterceptor** [SCRUM-462; updated SCRUM-464] (from OnlineMlScorerModule) — Calls `OnlineMlScorerService.score()` post-handler in `tap.next`/`tap.error`. AUTH-skip via centralized constant `AUTH_SKIP_PATHS` (`src/common/constants/auth-skip-paths.constants.ts`, imported by both interceptor and service per defense-in-depth dupla; mirror of framework template `ai-specs/templates/constants/auth-skip-paths.ts`). Shadow-mode only (writes JSONL log; never blocks). Fail-open on errors.

2. **TenantContextInterceptor** [SCRUM-488; rewritten SCRUM-495 — Phase 2.1] (registered inline in `AppModule`; class lives at `src/common/interceptors/tenant-context.interceptor.ts`) — **Validator-not-binder** as of SCRUM-495. Two modes:
   - **MODE 1 — context already bound (middleware ran on a subdomain-routed request)**: calls `memberships.requireMembership(activeTenantId, userId, isPlatformAdmin)` WITHOUT re-binding context. This preserves `AsyncLocalStorage` scope set by `SubdomainTenantResolverMiddleware`; a nested `TenantContext.run` would shadow it. 404 (NotFoundException) on cross-tenant denial — same 404-not-403 discipline as `MembershipsService`. Unauthenticated requests (no `req.user`) pass through without membership check (the middleware itself decides whether subdomain-binding is appropriate for unauthenticated traffic — Phase 2.2 AuthIntent flow).
   - **MODE 2 — context NOT bound (skip-path: localhost / /health / /metrics, or no subdomain resolved)**: preserves the Phase 0.2 behavior — resolves via `TenantsService.findFirstActiveMembership` and wraps `next.handle()` in `TenantContext.run(tenantId, ...)`. Unauthenticated → `runWithBypass('unauthenticated')` WITHOUT audit (documented exception).
   - Constructor changed from `(tenants: TenantsService)` (1 dep) → `(tenants: TenantsService, memberships: MembershipsService)` (2 deps). Both DI-resolvable via @Global TenantsModule. AsyncLocalStorage propagates across `await` + RxJS pipelines. **Phase 1 forward-compat preserved**: when JWT v2 carries `tenantId`, MODE 1 path still validates JWT-tenantId against subdomain-tenantId via the membership check.

## Permissions Registry

9 permissions seeded by `PermissionsService.onModuleInit()`:

| Key | Resource | Action | Description |
|-----|----------|--------|-------------|
| `dashboard:read` | dashboard | read | View dashboard metrics and summary statistics |
| `users:read` | users | read | List users and view individual user profiles |
| `users:write` | users | write | Update user profiles, change roles (cannot elevate to own role level or above) |
| `users:delete` | users | delete | Delete user accounts (SUPERADMIN accounts are immune) |
| `audit-logs:read` | audit-logs | read | View audit log entries with filtering and pagination |
| `permissions:read` | permissions | read | View role-permission assignments for all roles |
| `permissions:write` | permissions | write | Modify role-permission assignments (ADMIN cannot modify ADMIN permissions) |
| `settings:read` | settings | read | View application settings (planned) |
| `settings:write` | settings | write | Modify application settings (planned) |

### Default Role Assignments

| Role | Permissions |
|------|------------|
| USER | `dashboard:read`, `settings:read` |
| ADMIN | All except `permissions:write` |
| SUPERADMIN | Bypasses all checks (returns `['*']`) |

## Test Mock Requirements

When creating a `TestingModule` for a class, ALL constructor dependencies must be mocked.

| Class Under Test | Required Mocks |
|-----------------|----------------|
| **AuthController** | AuthService, **PermissionsService** |
| **OAuthController** | AuthService, **ConfigService**, OAuthLinkCodeStore |
| **AccountController** | AuthService |
| **SessionController** | SessionsService, TrustedDeviceService, JwtService |
| **UsersController** | UsersService |
| **AuditLogController** | AuditService, **PermissionsService** (via PermissionsGuard in @UseGuards) |
| **PermissionsController** | PermissionsService, **AuditService** (via RolesGuard in @UseGuards) |
| **RolesGuard** | Reflector, AuditService |
| **PermissionsGuard** | Reflector, PermissionsService |
| **MfaController** | MfaService, **TokenService**, TrustedDeviceService |
| **PasskeyController** | PasskeyService, **TokenService** |
| **PasskeyService** | PrismaService, UsersService, AuditService, REDIS_CLIENT (ioredis), **ConfigService** |
| **JwtStrategy** | UsersService, **TokenDenyListService**, **ConfigService** |
| **TokenDenyListService** | REDIS_CLIENT (ioredis) |
| **LoginSecurityService** | ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService |
| **SuspiciousLoginService** | AuditService, MailService, PrismaService |
| **SessionsService** | PrismaService, AuditService, **GeolocationService**, **TokenDenyListService (forwardRef)** [SCRUM-347] |
| **AuthService** | LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService |
| **LoginService** | UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService |
| **TokenService** | JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, **ConfigService**, LoginSecurityService |
| **OAuthAuthService** | UsersService, OAuthCodeStore, TokenService, LoginSecurityService, AuditService |
| **EmailVerificationService** | PrismaService, MailService, UsersService, SessionsService, AuditService |
| **PasswordResetService** | PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService |
| **MfaService** | UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, **ConfigService** |
| **TrustedDeviceService** | PrismaService, AuditService, **ConfigService** |
| **ImpossibleTravelService** | GeolocationService, PrismaService, AuditService, MailService |
| **UsersService** | PrismaService, AuditService, SessionsService, MailService, PasswordBreachService (forwardRef), TrustedDeviceService (forwardRef), TokenDenyListService (forwardRef) |
| **OnlineMlScorerService** [SCRUM-462; updated SCRUM-464] | — (no NestJS constructor deps; constructor body added by SCRUM-464 for opt-in Ajv validation init under `SHADOW_LOG_VALIDATE=true` + `SHADOW_LOG_SCHEMA_PATH`; reads `process.env`, `fs.readFileSync`/`existsSync`, `fs/promises.appendFile` (async fire-and-forget per SCRUM-464 T-1), `js-yaml`, and `ajv` (^8.20.0, opt-in). Imports `AUTH_SKIP_PATHS` from `src/common/constants/auth-skip-paths.constants.ts`. Test pattern: dual mocks `jest.mock('fs', ...)` AND `jest.mock('fs/promises', ...)` at top of spec — see `src/common/services/tests/online-ml-scorer.service.spec.ts` (7 tests after SCRUM-464 T-4 additions)) |
| **OnlineMlScorerInterceptor** [SCRUM-462] | OnlineMlScorerService |
| **OrganizationsController** [SCRUM-495 — Phase 2.1] | OrganizationsService, MembershipsService, TenantsService |
| **OrganizationsService** [SCRUM-495 — Phase 2.1] | PrismaService, AuditService |
| **SubdomainTenantResolverMiddleware** [SCRUM-495 — Phase 2.1] | TenantsService, ConfigService, AuditService |
| **AuthIntentController** [SCRUM-497 — Phase 2.2] | AuthIntentService, ConfigService |
| **AuthIntentService** [SCRUM-497 — Phase 2.2] | PrismaService, AuditService, TokenServiceV2, SessionsServiceV2, UsersService, CryptoService, ConfigService (7 deps — largest service in the AUTH v2 wave so far) |
| **AuthContext (post-SCRUM-499)** [dashboard] | apiClient (singleton); useRouter (next/navigation); useToast (`@/context/ToastContext`); useReducer with extended AuthState (4 new fields: `authIntentId`, `authIntentStatus`, `authIntentExpiresAt`, `authIntentAvailableTenantIds`) + 2 new actions (`AUTH_INTENT_MFA_REQUIRED`, `AUTH_INTENT_TENANT_PICK_REQUIRED`) — v1 reducer cases preserved. |
| **LoginFormV2 / MfaTotpStepV2 / TenantPickStep / AuthIntentFlow** [SCRUM-499 — Phase 2.3, dashboard] | All consume `useAuth()` (extended with `loginV2`, `advanceMfaV2`, `advanceTenantPickV2`, `cancelAuthIntentV2` methods + 4 new state fields). Visual primitives reused as-is: `<Button>`, `<Input>`, `<InlineError>`, `<MfaDigitInput>`, `<RateLimitBanner>`, `<Checkbox>` (TenantPickStep uses none — pure Button list). |
| **TenantContextInterceptor** (post-SCRUM-495) | TenantsService, MembershipsService — constructor changed from 1 dep to 2 deps; all existing specs that instantiate this class must add a `MembershipsService` provider with `requireMembership: jest.fn()`. |

> **Rule**: When a controller uses `@UseGuards(Guard)`, the guard's dependencies must ALSO be mocked in the test module — NestJS resolves guard dependencies during TestingModule creation.

## Service Dependency Chains

```
AuthService (facade) → LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService
LoginSecurityService → ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService
TokenService → JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, **ConfigService**, LoginSecurityService
TokenServiceV2 → JwtService [SCRUM-492 — Phase 1.1; tenant-aware mint+verify pair for v2 JwtPayloadV2 shape (sub, jti, sessionId, iat, tenantId, tenantRole, isPlatformAdmin); inherits secret/issuer/audience/algorithm/expiresIn from JwtModule (no per-call options override); two-gate verify: cryptographic (`jwt.verify`) + private `isValidV2Payload` shape guard (rejects forged v1-shape payloads sharing the secret); all failure modes throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` — no failure-mode enumeration; internal-only, NOT in AuthModule.exports[]; zero production consumers in Phase 1.1]
JwtV2Strategy → ConfigService [SCRUM-494 — Phase 1.3; Passport strategy named `'jwt-v2'`; two-gate verify (Passport-jwt crypto + extracted `isValidV2Payload` util); `validate(payload): JwtPayloadV2` rejects any non-v2 shape with `UnauthorizedException(AUTHENTICATION_FAILED)`; no user lookup — payload IS canonical source for tenantId/tenantRole/isPlatformAdmin]
AuthV2Controller → TokenServiceV2, SessionsServiceV2, ConfigService [SCRUM-494 — Phase 1.3; first v2 production HTTP surface; hosts `POST /auth/v2/refresh`; reads httpOnly cookie `refresh_token_v2`, calls `sessionsServiceV2.validateAndRotate` (atomic), then `tokenServiceV2.mintAccessToken`, sets new cookie; rate-limited at `AUTH_RATE_LIMITS.refresh` (matches v1); no `@UseGuards` — refresh token IS the auth; no failure-mode enumeration; orphan-rotation acceptable if mint throws (documented)]
isValidV2Payload util → no DI [SCRUM-494 — Phase 1.3; pure type guard extracted from TokenServiceV2's private method; consumed by both `TokenServiceV2.verifyAccessToken` and `JwtV2Strategy.validate` — single source of truth for v2 shape validation; 7-field check: sub/jti/sessionId/iat/tenantId/tenantRole/isPlatformAdmin]
SessionsServiceV2 → PrismaService, AuditService, ConfigService [SCRUM-493 + SCRUM-494 — Phase 1.2 scaffolding + Phase 1.3 NAMED-EXPORTED; v2 opaque-refresh session lifecycle (4 public methods: createSession, validateAndRotate, revokeSession, revokeAllForTenant); 256-bit CSPRNG → base64url plaintext → SHA-256 hex stored as `SessionV2.refreshTokenHash @unique`; plaintext returned ONCE on mint/rotate, never logged; one-time-use rotation enforced atomically inside `prisma.$transaction` (revoke OLD + create NEW in same tx); cross-tenant lookup wrapped in `TenantContext.runWithBypass('session-v2-refresh-lookup')` then `TenantContext.run(session.tenantId, ...)` for the rotation; centralized `rejectRefresh(reasonClass, userId)` private helper = single throw site for 4 rejection paths (not-found / revoked / expired / membership-stale), all emit `AuditAction.SESSION_V2_REFRESH_REJECTED` with reason in metadata + throw `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` — no enumeration; `revokeAllForTenant` is tenant-scoped (mitigates MT-10 vs v1's cross-tenant `revokeAllUserSessions`); no `TokenDenyListService` injection (v2 sessions revoked by row flag, not Redis); internal-only, NOT in SessionsModule.exports[]; zero production consumers in Phase 1.2]
LoginService → UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService
OAuthAuthService → UsersService, OAuthCodeStore, TokenService, LoginSecurityService, AuditService
EmailVerificationService → PrismaService, MailService, UsersService, SessionsService, AuditService
PasswordResetService → PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService
MfaService → UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, **ConfigService**
PasskeyService → PrismaService, UsersService, AuditService, REDIS_CLIENT, **ConfigService**
TrustedDeviceService → PrismaService, AuditService, **ConfigService**
UsersService → PrismaService, AuditService, SessionsService, MailService, TrustedDeviceService (forwardRef), **TokenDenyListService** (forwardRef)
AuditService → PrismaService
SessionsService → PrismaService, AuditService, GeolocationService
GeolocationService → maxmind (external library)
ImpossibleTravelService → GeolocationService, PrismaService, AuditService, MailService
PermissionsService → PrismaService, PermissionsCache
SuspiciousLoginService → AuditService, MailService, PrismaService
MailService → MailerService (nodemailer)
CryptoService → (no dependencies)
OAuthStateStore → REDIS_CLIENT (ioredis)
OAuthCodeStore → REDIS_CLIENT (ioredis)
TokenDenyListService → REDIS_CLIENT (ioredis)
OnlineMlScorerInterceptor → OnlineMlScorerService [SCRUM-462]
OnlineMlScorerService → (no NestJS DI; uses fs + fs/promises + process.env + js-yaml + ajv (opt-in) directly. Imports AUTH_SKIP_PATHS from common/constants. Shadow-mode only.) [SCRUM-462; updated SCRUM-464]
TenantsService.findFirstActiveMembership() → uses TenantContext.runWithBypass('tenant-context-resolution', ...) — bootstrap path for the per-request tenant resolution; consumed by TenantContextInterceptor [SCRUM-488 — Phase 0.2]
InvitationsService → PrismaService + AuditService [SCRUM-491 — Phase 0.4]; createInvitation uses partial unique index `uniq_tenant_invitation_pending` + P2002 race recovery; acceptInvitation wraps in `TenantContext.runWithBypass('invitation-token-lookup', ...)` then `TenantContext.run(invitation.tenantId, ...)` for the materialization $transaction
MembershipsService → PrismaService [SCRUM-491 — Phase 0.4]; requireMembership / requireTenantRole throw 404 (not 403) to hide tenant existence (GitHub/Linear convention); platform-admin (`isPlatformAdmin === true`) returns null short-circuit (no synthetic OWNER row)
OrganizationsService → PrismaService, AuditService [SCRUM-495 — Phase 2.1]; 6 public methods (create / findById / findBySlug / listForTenant / addMember / removeMember / requireMembership). Tenant-scoping enforced inside `findById` (returns null if `org.tenantId !== tenantId`). P2002 → ConflictException(SLUG_TAKEN or MEMBER_EXISTS). P2025 on remove → idempotent swallow (no audit emission). Audit emissions on every mutation: ORGANIZATION_CREATED / ORGANIZATION_MEMBER_ADDED / ORGANIZATION_MEMBER_REMOVED. 404-not-403 for cross-org denial via `requireMembership` (platform-admin returns null short-circuit, mirrors MembershipsService). Internal-only — exported from TenantsModule for consumption by OrganizationsController + future Phase 2.3 dashboard wiring.
SubdomainTenantResolverMiddleware → TenantsService, ConfigService, AuditService [SCRUM-495 — Phase 2.1]; request-boundary tenant binding via Host's subdomain. Skip paths (localhost, 127.0.0.1, 0.0.0.0, /health, /metrics). Reserved-subdomain blocklist (15 names: admin/api/app/auth/dashboard/mail/support/status/www/static/cdn/health/metrics/platform/internal) → 404 NotFoundException with generic `ErrorMessages.tenants.NOT_FOUND`. Platform-admin canonical subdomain (configurable via `app.platformAdminSubdomain`, default 'admin') → `TenantContext.runWithBypass('platform-admin-route')`. Lookup failures (not found / suspended / deleted) → 404 generic + `AuditAction.SUBDOMAIN_RESOLUTION_FAILED` audit (rate-limited 10 events/60s via token bucket — prevents audit-storm DoS on dictionary-attack-against-subdomains). **Module-level LRU cache**: 1024 entries × 5min TTL (in-process per-instance, no Redis dependency). Static `invalidate(subdomain: string)` method consumed by `TenantsService.update` on subdomain mutation (single source of truth — cache only invalidated on the field that's the cache key).
TenantContextInterceptor → TenantsService, MembershipsService [SCRUM-488 + SCRUM-495 — Phase 2.1]; **validator-not-binder semantics post-SCRUM-495** (see Global Interceptors section); preserves Phase 0.2 fallback behavior on skip-paths.
TenantsService → PrismaService [SCRUM-487 + SCRUM-495 — Phase 2.1 added `findBySubdomain(subdomain)` method mirroring `findBySlug`; `create(dto)` extended to also INSERT default `Organization` row in the same `$transaction` (mirrors bootstrap migration invariant); `update(id, dto)` invalidates `SubdomainTenantResolverMiddleware` LRU cache on subdomain mutation only — Open Decision #5]
AuthIntentService → PrismaService, AuditService, TokenServiceV2, SessionsServiceV2, UsersService, CryptoService, ConfigService [SCRUM-497 — Phase 2.2; server-side state-machine driver for v2 login orchestration replacing v1 `LoginService.executeLogin` (strangler — v1 untouched). 2 public methods: `createIntent(meta)` mints `requires_credentials` intent with 15-min TTL (configurable via `app.authIntentTtlMs`); `advance(intentId, input, meta)` central dispatcher applies the next transition based on `input.kind`. State machine: `requires_credentials` → `requires_mfa` (if user.mfaEnabled) → `requires_tenant_pick` (if multi-tenant + no subdomain auto-resolve per `TenantContext.getActiveTenantId()`) → `succeeded`. 8-value enum with explicit `expired` (decision E). Terminal-state replay → 410 Gone (decision D4). Lazy expiry-flip → 410 + AUTH_INTENT_EXPIRED audit (decision D3). Single throw site: 11 distinct failure reasons (user_not_found, account_locked, bad_password, email_not_verified, no_tenant_membership, invalid_state, mfa_state_invalid, mfa_code_wrong, tenant_pick_invalid, state_mismatch, passkey_not_implemented) all converge to `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`; discrimination only in `AuthAction.AUTH_INTENT_FAILED.metadata.reason`. `succeed()` wraps cross-tenant mint in `TenantContext.runWithBypass('auth-intent-succeed-mint')` (SCRUM-488 convention) then mints session via `SessionsServiceV2.createSession` + access via `TokenServiceV2.mintAccessToken`. `emitAdvancedAudit()` private helper (Rule of Three extraction). MFA gate inline (otpVerify + bcrypt recovery-code compare loop — does NOT reuse `MfaService.verifyLoginCode` since that requires v1 mfaToken JWT). Internal-only, NOT in AuthModule.exports[]; sole consumer is AuthIntentController.]
AuthIntentController → AuthIntentService, ConfigService [SCRUM-497 — Phase 2.2; 2 endpoints (`POST /auth/v2/intents`, `POST /auth/v2/intents/:id/advance`) under `@Controller('auth/v2/intents')`. NO `@UseGuards` — the intent IS the auth state. Rate-limited at `AUTH_RATE_LIMITS.login` on both. `assertEnabled()` private helper at top of every method throws `NotFoundException(AUTHENTICATION_FAILED)` if `app.authIntentV2Enabled=false` (plan decision A — "endpoint doesn't exist" pattern). On `status === 'succeeded'`: sets `refresh_token_v2` cookie (httpOnly + secure-in-prod + sameSite=strict + path=/, maxAge from `auth.jwtRefreshExpiration`) — mirrors AuthV2Controller Phase 1.3 posture.]

# ─── nexacore-dashboard (frontend) ──────────────────────────────
AuthContext.loginV2 / advanceMfaV2 / advanceTenantPickV2 / cancelAuthIntentV2 → apiClient, ToastContext, next/navigation router [SCRUM-499 — Phase 2.3; frontend consumer of the v2 AuthIntent endpoints]. Single source of truth = AuthContext state (`authIntentId`, `authIntentStatus`, `authIntentExpiresAt`, `authIntentAvailableTenantIds`). `handleAuthIntentResult` private helper centralizes the status → reducer-dispatch fan-out (single source of truth — same pattern as backend `transitionFromCredsCleared` from Phase 2.2). `stateRef` mirror lets advance methods read fresh `authIntentId` without churning useCallback identity. 410 Gone detection via `isGoneError` helper → toast `AUTH_INTENT_EXPIRED` + dispatch `AUTH_STOP` + `router.replace('/login')`. v1 `login()` body untouched (strangler invariant).
AuthIntentFlow → useAuth() [SCRUM-499 — Phase 2.3; pure switch on `authIntentStatus` → renders LoginFormV2 / MfaTotpStepV2 / TenantPickStep / null. No API calls, no local state.]
LoginFormV2 / MfaTotpStepV2 / TenantPickStep → useAuth(), useToast(), useRateLimit() [SCRUM-499 — Phase 2.3; visual parity with v1 LoginForm + MfaTotpStep verified — 330/348 column system, text-h1 + text-justify text-body subtitle, reused Button/Input/MfaDigitInput/InlineError/RateLimitBanner primitives. Zero new TailwindCSS tokens.]
auth-intent-api.ts → apiClient.post [SCRUM-499 — Phase 2.3; thin typed wrapper for `POST /auth/v2/intents` + `POST /auth/v2/intents/:id/advance`. 100% test coverage.]
SKIP_REFRESH_ON_401 / shouldSkipRefresh helper [SCRUM-499 — Phase 2.3]: extended in `src/lib/api.ts` to do `startsWith` matching so `/auth/v2/intents` covers `/auth/v2/intents/:id/advance`. Backward-compatible for v1 endpoints (exact match returns identical behavior).
AUTH_INTENT_V2_ENABLED env flag [SCRUM-499 — Phase 2.3]: `process.env.NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED === 'true'`, default `false` in prod. Next.js inlines at build time. `/login/page.tsx` Server Component reads the flag and renders `<AuthIntentFlow />` (v2) vs `<LoginForm />` (v1).
```

