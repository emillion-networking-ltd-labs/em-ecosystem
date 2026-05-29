# Implementation Record: SCRUM-179 Migrate process.env Reads to ConfigService

## 1. Summary

- **What**: Replaced all direct `process.env` access in the auth module with NestJS `ConfigService` using typed config namespaces (`auth`, `oauth`, `app`), added Joi validation schema for fail-fast startup validation, and migrated `JwtModule.register()` to `JwtModule.registerAsync()`.
- **Scope**: backend
- **Branch**: `feature/SCRUM-179-backend`
- **Date**: 2026-03-12

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 7/SCRUM-179_backend.md`
- **Plan followed**: Partially — extended scope to cover 3 additional services (MfaService, TrustedDeviceService, PasskeyService) and 4 additional config vars not in the original plan.

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `18ec054` | feat(auth): migrate process.env reads to ConfigService with typed config namespaces | 28 files (5 new config, 13 modified source, 9 test updates, 1 package.json + lockfile) |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 6-11 | Migrate 6 source files (AuthService, AuthController, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthCallbackFilter) | Migrated 9 source files — added MfaService, TrustedDeviceService, PasskeyService | These 3 services also had `process.env` reads (JWT_SECRET, MFA_APP_NAME, WEBAUTHN_*) discovered during implementation | Accepted |
| Step 2 | auth.config.ts with 6 keys | auth.config.ts with 10 keys (added mfaAppName, webauthnRpId, webauthnRpName, webauthnOrigin) | Required by MfaService and PasskeyService migrations | Accepted |
| Step 3 | Validation schema with 13 env vars | Validation schema with 17 env vars (added MFA_APP_NAME, WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME, WEBAUTHN_ORIGIN) | Same reason — extended scope | Accepted |
| Step 12 | Rename constants to DEFAULT_* prefix | Kept original names (SESSION_IDLE_TIMEOUT_HOURS, MAX_CONCURRENT_SESSIONS, TRUSTED_DEVICE_TTL_DAYS) | Renaming would cascade to consumers outside ticket scope; plain defaults without process.env achieves the goal | Accepted |
| Step 13 | Update tests for 4-5 files | Updated tests for 9 files (auth.service, auth.controller, mfa.service, passkey.service, google.strategy, github.strategy, jwt.strategy, oauth-exchange, trusted-device.service) | All tests needed ConfigService mocks due to extended migration scope | Accepted |

## 5. Test Results

- **Unit tests**: 829 passed / 0 failed (44 suites)
- **Build**: `nest build` clean
- **Verification**: `grep -r "process\.env" src/auth/ --exclude-dir="tests"` — zero results
- **Pre-commit**: Prettier + lint-staged pass

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated Module Registry (AppModule imports ConfigModule), Test Mock Requirements (added ConfigService to 9 entries), Service Dependency Chains (added ConfigService to 6 chains), Changelog entry |

## 8. Lessons Learned

- **Extended scope was justified**: The plan identified 6 source files with process.env reads, but MfaService, TrustedDeviceService, and PasskeyService also had direct reads. Migrating them in the same ticket avoided leaving partial process.env usage in the auth module.
- **CRLF/LF on Windows**: `core.autocrlf=true` causes lint-staged stash/restore to convert LF→CRLF, which fails prettier's default `endOfLine: "lf"`. Fix: ensure files are saved with LF before staging (`sed -i 's/\r$//'`).
- **Passport strategy pattern**: ConfigService in strategies must be a plain param (not `private readonly`) since it's only used in `super()` before the class is constructed.
- **`ConfigService.get<T>()` returns `T | undefined`**: Strict TypeScript requires `!` non-null assertions or `!!` double-negation for boolean coercion. The Joi validation schema guarantees values exist at startup, making the assertions safe.
