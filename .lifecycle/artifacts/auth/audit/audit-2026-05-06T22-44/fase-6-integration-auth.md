# Phase 6 — INTEGRATION (auth module)

| Field | Value |
|------|------|
| Date | 2026-05-06 22:44 UTC |
| Module | `auth` |
| Standards | ISO 25010 §4.2.1 (Modularity); NestJS Module Architecture; CWE-1047 (Circular Dependencies) |
| Inputs | `nexacore-api/src/auth/auth.module.ts`, `nexacore-api/src/auth/*.controller.ts`, `nexacore-api/src/auth/*.service.ts`, `nexacore-api/src/auth/guards/*.ts`, `nexacore-api/src/permissions/constants/default-permissions.ts`, `ai-specs/specs/integration-state.md` |
| Previous baseline | 2026-03-29 — 6 PASS / 2 WARN / 0 FAIL |

## 1. Result Summary

| Severity | Count |
|---------|-------|
| **PASS** | 10 |
| **WARN** | 2 |
| **FAIL** | 0 |

**Verdict:** PASS — 0-FAIL baseline maintained. Two long-standing low-severity WARNs unchanged from previous audits (W-01, W-02 both pre-existing).

## 2. Check-by-Check Results

| ID | Check | Severity | Result | Evidence |
|----|-------|----------|--------|----------|
| I-01 | Module imports match docs | HIGH | PASS | `auth.module.ts:42-73` declares `forwardRef(() => UsersModule)`, `AuditModule`, `forwardRef(() => SessionsModule)`, `CryptoModule`, `MailModule`, `SecurityModule`, `PassportModule.register({ defaultStrategy: 'jwt' })`, `JwtModule.registerAsync(...)`. integration-state.md row 14 lists exactly the same 8 imports. |
| I-02 | Module exports match docs | HIGH | PASS | `auth.module.ts:105-111` exports `AuthService`, `TokenService`, `PasswordBreachService`, `TrustedDeviceService`, `TokenDenyListService` — identical to integration-state.md row 14. |
| I-03 | Module providers match docs | HIGH | PASS | `auth.module.ts:82-104` registers 21 providers (8 services + 3 strategies + 3 stores + 3 auth-private guards + 4 security/lifecycle services). All cited in integration-state.md (Service Dependency Chains §, Test Mock Requirements §, Guard Dependency Map §). |
| I-04 | Module controllers match docs | MEDIUM | PASS | `auth.module.ts:74-81` registers 6 controllers: `AuthController`, `OAuthController`, `AccountController`, `SessionController`, `MfaController`, `PasskeyController` — identical to integration-state.md Controller Guard Chains table. |
| I-05 | @Global flag matches docs | MEDIUM | PASS | `auth.module.ts` has no `@Global()` decorator (only `@Module(...)`). integration-state.md row 14 confirms `@Global: No`. |
| I-06 | Guard chains per controller method match docs | HIGH | PASS | All 6 controllers (Auth/Account/OAuth/Session/Mfa/Passkey) verified method-by-method against integration-state.md sub-tables. Notable: `MfaController.setup` and `verify-setup` use `JwtOrMfaSetupGuard` (mfa.controller.ts:52,69), `OAuthController` link routes use `OAuthLinkGuard, GoogleAuthGuard` / `OAuthLinkGuard, GitHubAuthGuard` (oauth.controller.ts:213,237), `AuthController.admin` uses `JwtAuthGuard, RolesGuard` + `@Roles(Role.ADMIN)` (auth.controller.ts:250-251). All match. |
| I-07 | Constructor DI matches docs | HIGH | PASS | Verified all 13 service/controller constructors against integration-state.md Test Mock Requirements + Service Dependency Chains: `AuthService` (5 deps), `TokenService` (8 deps), `LoginService` (6), `OAuthAuthService` (5), `EmailVerificationService` (5), `PasswordResetService` (6), `MfaService` (6), `PasskeyService` (5), `LoginSecurityService` (5), `TrustedDeviceService` (3), `TokenDenyListService` (1, REDIS_CLIENT), `JwtStrategy` (3), `GoogleStrategy`/`GitHubStrategy` (3 each), `MfaSetupGuard` (2), `JwtOrMfaSetupGuard` (1: MfaSetupGuard), `OAuthLinkGuard` (1: OAuthLinkCodeStore), 6 controllers all match. `PasswordBreachService` has no DI (per docs). |
| I-08 | Permissions registry matches docs | MEDIUM | PASS | `permissions/constants/default-permissions.ts` defines exactly 9 keys: `dashboard:read`, `users:read`, `users:write`, `users:delete`, `audit-logs:read`, `permissions:read`, `permissions:write`, `settings:read`, `settings:write`. integration-state.md Permissions Registry lists same 9. Default role mappings (USER → 2 perms; ADMIN → 8 perms; SUPERADMIN bypasses) also match. |
| I-09 | Cross-module boundaries — imports target only public services | HIGH | PASS | All 80+ cross-module imports under `src/auth/` target public surface: service classes (`UsersService`, `AuditService`, `SessionsService`, `MailService`, `PrismaService`, `PermissionsService`, `ImpossibleTravelService`, `SuspiciousLoginService`, `TurnstileService`, `CryptoService`), entity files (`users/entities/user.entity`), enum files (`users/enums/role.enum`, `users/enums/provider.enum`, `audit/enums/audit-action.enum`), interface files (`audit/interfaces/audit-log-entry.interface`), shared utilities under `common/*` (decorators, guards, interceptors, utils, constants, services), Redis token (`REDIS_CLIENT` from `common/services/redis.constants`). Zero imports reference internal implementation files (no `*.private.*`, no relative drills into another module's internals). 0 boundary violations. |
| I-10 | ConfigService centralization | MEDIUM | PASS | `grep process.env src/auth/` shows ONLY 8 hits, all in test specs (`tests/github.strategy.spec.ts`, `tests/google.strategy.spec.ts` — setup/teardown of test env). 0 occurrences in production service/controller/guard/strategy/store code. All env access flows through `ConfigService.get(...)` with namespaced keys (`auth.jwtSecret`, `auth.jwtAccessExpiration`, `auth.jwtRefreshExpiration`, `auth.mfaAppName`, `auth.webauthnRpId`, `auth.webauthnRpName`, `auth.webauthnOrigin`, `oauth.googleClientId`, `oauth.googleClientSecret`, `oauth.googleCallbackUrl`, `oauth.githubClientId`, `oauth.githubClientSecret`, `oauth.githubCallbackUrl`). |

## 3. WARN List (Recurrence)

| ID | Severity | Description | First Seen | Status vs Baseline (2026-03-29) | Notes |
|----|----------|-------------|------------|----------------------------------|-------|
| W-01 | LOW | `AuthService` is exported by `AuthModule` but no external module imports it as a service. Only `cookie.util.ts` imports the `CookieConfig` *type* (type-only import, no runtime DI dependency). | pre-2026-03-29 | UNCHANGED | Recommend Accepted-Risk MINOR or remove from `exports` array if no consumer is planned. Same recommendation as previous audits. |
| W-02 | LOW | `TokenService` is exported by `AuthModule` but no external module currently injects it. All current consumers (`MfaController`, `PasskeyController`, `MfaSetupGuard`) are inside AuthModule. | pre-2026-03-29 | UNCHANGED | Could be useful for future SessionsModule usage; keep export for forward compatibility. |

## 4. FAIL List

None. No FAIL findings detected.

## 5. Recurrence Analysis (vs 2026-03-29 baseline)

| Baseline finding | 2026-05-06 status |
|------------------|-------------------|
| W-01 (AuthService exported but unused externally) | RECURRING — same root cause |
| W-02 (TokenService exported but unused externally) | RECURRING — same root cause |
| 6 PASS | All maintained; expanded to 10 PASS (no regressions, all checks remain green) |

No new failures or warnings introduced since baseline.

## 6. Recommendations

1. **W-01 / W-02 disposition:** Either (a) formally Accept-Risk MINOR with rationale "kept for forward compatibility with planned cross-module integrations" (cleanest), or (b) trim `exports` array down to `PasswordBreachService`, `TrustedDeviceService`, `TokenDenyListService` (the three actually consumed by `UsersModule` / `SessionsModule`). Decision is cosmetic; no security or runtime impact.
2. **Module structure remains sound** — no circular-dependency hazards introduced; SessionsModule ↔ AuthModule cycle is properly bidirectional via `forwardRef()` on both sides (SCRUM-347).
3. **ConfigService centralization is exemplary** — keep this discipline as new endpoints are added.
