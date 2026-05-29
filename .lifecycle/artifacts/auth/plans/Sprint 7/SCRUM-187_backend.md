# Backend Implementation Plan: SCRUM-187 Enable TypeScript strict:true + Replace any Types

## 1. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-186 (npm vulnerability remediation)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/tsconfig.json` — `strictNullChecks: true`, no `strict: true`, no `noImplicitAny`
  - `nexacore-api/tsconfig.build.json` — extends tsconfig.json, excludes node_modules/test/dist/spec/prisma.config
  - `nexacore-api/src/auth/auth.controller.ts` — 14 `req: any` occurrences (13 endpoints + `getCurrentSessionId`)
  - `nexacore-api/src/auth/mfa.controller.ts` — 3 `req: any` occurrences
  - `nexacore-api/src/auth/passkey.controller.ts` — 3 `req: any` occurrences
  - `nexacore-api/src/auth/strategies/github.strategy.ts` — `authenticate(req: any, options?: any)` (line 35)
  - `nexacore-api/src/auth/strategies/google.strategy.ts` — `authenticate(req: any, options?: any)` (line 35)
  - `nexacore-api/src/auth/strategies/pkce-authenticate.ts` — 4 `any` occurrences (strategy, req, options, callback)
  - `nexacore-api/src/permissions/permissions.controller.ts` — 1 `req: any` (line 78)
  - `nexacore-api/src/common/utils/request-meta.ts` — already properly typed (no `any`)
  - `nexacore-api/src/users/entities/user.entity.ts` — `SafeUser` type exists
  - 20 DTO files — all have TS2564 errors under strict mode (properties without initializer)
- **Constructor signatures verified**: N/A (no constructor modifications)
- **Methods verified to exist**: N/A (no method modifications)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None relevant to this ticket

## 2. Overview

Enable TypeScript `strict: true` in `tsconfig.json` (replacing the individual `strictNullChecks: true`) and fix all resulting compilation errors. Also replace all 29 explicit `any` types in production code with proper types per audit finding TS-02.

The `strict: true` flag enables 7 sub-flags: `strictNullChecks` (already on), `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.

No business logic changes — only type annotations and the tsconfig flag.

## 3. Architecture Context

- **Modules involved**: None (type-level changes only)
- **Components affected**: DTOs (20 files), controllers (3 auth + 1 permissions), strategies (2 + 1 shared helper)
- **Files affected**:
  - `nexacore-api/tsconfig.json`
  - 20 DTO files (add `!` definite assignment assertions)
  - `nexacore-api/src/auth/auth.controller.ts`
  - `nexacore-api/src/auth/mfa.controller.ts`
  - `nexacore-api/src/auth/passkey.controller.ts`
  - `nexacore-api/src/permissions/permissions.controller.ts`
  - `nexacore-api/src/auth/strategies/github.strategy.ts`
  - `nexacore-api/src/auth/strategies/google.strategy.ts`
  - `nexacore-api/src/auth/strategies/pkce-authenticate.ts`
  - New file: `nexacore-api/src/common/interfaces/authenticated-request.interface.ts`

## 4. Error Analysis (from `tsc --noEmit --strict`)

All 25 errors are **TS2564** (`strictPropertyInitialization`):
- 16 DTO files in `src/auth/dto/` — class-validator handles initialization at runtime
- 1 DTO in `src/permissions/dto/`
- 3 DTOs in `src/users/dto/`

No `noImplicitAny` errors because all `any` types are explicit annotations (not implicit). However, the 29 explicit `any` types must still be replaced per audit TS-02.

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-187-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-187-backend`

### Step 1: Enable strict:true in tsconfig.json

- **File**: `nexacore-api/tsconfig.json`
- **Action**: Replace `strictNullChecks: true` with `strict: true`
- **Implementation Steps**:
  1. Remove `"strictNullChecks": true` from `compilerOptions`
  2. Add `"strict": true` to `compilerOptions`
  3. Keep `"forceConsistentCasingInFileNames": true` (already set, but `strict` doesn't include this)

### Step 2: Create AuthenticatedRequest Interface

- **File**: `nexacore-api/src/common/interfaces/authenticated-request.interface.ts` (NEW)
- **Action**: Define typed request interface for JWT-authenticated endpoints
- **Implementation Steps**:
  1. Create interface extending Express `Request` with `user: SafeUser` and `cookies` property
  2. This replaces all `req: any` in controller parameters

```typescript
import type { Request } from 'express';
import { SafeUser } from '../../users/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: SafeUser;
}
```

### Step 3: Fix DTO strictPropertyInitialization Errors (20 files)

- **Files**: All 20 DTO files listed in Section 4
- **Action**: Add `!` definite assignment assertion to all class-validator properties
- **Implementation Steps**:
  1. For each property that uses `@IsEmail()`, `@IsString()`, etc., add `!` after the property name
  2. Example: `email: string;` → `email!: string;`
  3. This is the standard NestJS pattern — class-validator guarantees initialization at runtime via the `ValidationPipe`
  4. Optional properties (`?`) do NOT need `!` — they are already allowed to be undefined

**Files and properties to fix**:
- `auth/dto/forgot-password.dto.ts`: `email!`
- `auth/dto/login.dto.ts`: `email!`, `password!`
- `auth/dto/mfa-disable.dto.ts`: `password!`
- `auth/dto/mfa-regenerate-codes.dto.ts`: `password!`
- `auth/dto/mfa-verify-login.dto.ts`: `mfaToken!`
- `auth/dto/mfa-verify-setup.dto.ts`: `token!`
- `auth/dto/oauth-exchange.dto.ts`: `code!`
- `auth/dto/passkey-login-verify.dto.ts`: `credential!`, `challengeId!`
- `auth/dto/passkey-register-verify.dto.ts`: `credential!`
- `auth/dto/passkey-rename.dto.ts`: `name!`
- `auth/dto/refresh-token.dto.ts`: `refreshToken!`
- `auth/dto/register.dto.ts`: `email!`, `password!`
- `auth/dto/resend-verification-public.dto.ts`: `email!`
- `auth/dto/reset-password.dto.ts`: `token!`, `newPassword!`
- `auth/dto/trust-device.dto.ts`: `fingerprint!`
- `auth/dto/validate-reset-token.dto.ts`: `token!`
- `permissions/dto/set-role-permissions.dto.ts`: `permissionKeys!`
- `users/dto/change-email.dto.ts`: `newEmail!`, `password!`
- `users/dto/change-password.dto.ts`: `newPassword!`
- `users/dto/unlink-oauth.dto.ts`: `password!`

### Step 4: Replace `any` in Auth Controllers

- **Files**: `auth.controller.ts`, `mfa.controller.ts`, `passkey.controller.ts`
- **Action**: Replace `@Request() req: any` with `@Request() req: AuthenticatedRequest`
- **Implementation Steps**:
  1. Add `import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';` to each controller
  2. Replace all `@Request() req: any` parameters with `@Request() req: AuthenticatedRequest`
  3. Replace `getCurrentSessionId(req: any)` with `getCurrentSessionId(req: AuthenticatedRequest)` in `auth.controller.ts`
  4. Specific counts:
     - `auth.controller.ts`: 14 replacements (13 method params + 1 private method)
     - `mfa.controller.ts`: 3 replacements
     - `passkey.controller.ts`: 3 replacements

### Step 5: Replace `any` in Permissions Controller

- **File**: `permissions/permissions.controller.ts`
- **Action**: Replace `@Request() req: any` with typed request
- **Implementation Steps**:
  1. Add `import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';`
  2. Replace `@Request() req: any` with `@Request() req: AuthenticatedRequest`

### Step 6: Replace `any` in OAuth Strategies and PKCE Helper

- **Files**: `strategies/github.strategy.ts`, `strategies/google.strategy.ts`, `strategies/pkce-authenticate.ts`
- **Action**: Replace `any` with proper types where possible
- **Implementation Steps**:
  1. In `pkce-authenticate.ts`:
     - `strategy: any` → `strategy: { _oauth2: OAuthClient }` (inline structural type)
     - `req: any` → `req: { query?: { code?: string; state?: string } }` (inline structural type)
     - `options: any` → `options: Record<string, unknown>`
     - `callback: (...args: any[])` → `callback: (...args: unknown[])`
     - `superAuthenticate: Function` → keep `Function` (Passport limitation — cannot type `super.authenticate`)
  2. In `github.strategy.ts` and `google.strategy.ts`:
     - `authenticate(req: any, options?: any)` → `authenticate(req: Request, options?: Record<string, unknown>)` — import `Request` from `express`
  3. **NOTE**: The `(this as any)._oauth2` casts were already removed by SCRUM-182 (extracted to `pkce-authenticate.ts`). The strategies no longer have `(this as any)` patterns.

### Step 7: Build and Test Verification

- **Action**: Verify all changes compile and tests pass
- **Implementation Steps**:
  1. Run `npx tsc --noEmit -p tsconfig.build.json` — expect 0 errors
  2. Run `npm run build` (`nest build`) — expect clean compilation
  3. Run `npm test` — expect all 846+ tests to pass
  4. Verify: `grep -rn ": any" src/ --include="*.ts" --exclude-dir=tests --exclude="*.spec.ts"` — expect 0 matches (or only in `pkce-authenticate.ts` callback if `unknown` doesn't work with passport)

### Step 8: Update Technical Documentation

- **Action**: Update integration-state.md changelog
- **Implementation Steps**:
  1. No architecture/API changes — no updates to data-model.md or api-spec.yml
  2. Add changelog entry to `ai-specs/specs/integration-state.md` for SCRUM-187

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Enable `strict: true` in tsconfig.json
3. Step 2: Create `AuthenticatedRequest` interface
4. Step 3: Fix DTO `strictPropertyInitialization` errors (20 files)
5. Step 4: Replace `any` in auth controllers (3 files)
6. Step 5: Replace `any` in permissions controller (1 file)
7. Step 6: Replace `any` in OAuth strategies and PKCE helper (3 files)
8. Step 7: Build and test verification
9. Step 8: Documentation update

## 7. Testing Checklist

- [ ] `npx tsc --noEmit --strict -p tsconfig.build.json` produces 0 errors
- [ ] `npm run build` succeeds
- [ ] All 846+ tests pass (`npm test`)
- [ ] `grep -rn ": any" src/ --include="*.ts" --exclude-dir=tests --exclude="*.spec.ts"` returns 0 production `any` types (or documented exceptions)
- [ ] No new `@ts-ignore` or `@ts-expect-error` introduced

## 8. Error Response Format

N/A — no API changes.

## 9. Partial Update Support

N/A

## 10. Dependencies

- No new packages required
- TypeScript (existing, ^5.7.3) already supports `strict: true`

## 11. Notes

- **DTO `!` assertions are standard NestJS**: class-validator + `ValidationPipe` guarantee properties are initialized at runtime. The `!` assertion is the accepted pattern across the NestJS ecosystem.
- **Strategy `any` types**: The `authenticate()` method in Passport strategies uses `any` because Passport's TypeScript typings don't expose proper types for the raw request object passed to `authenticate()`. Using `Request` from Express is acceptable — Passport extends it.
- **`pkce-authenticate.ts` structural types**: Using inline structural types instead of creating interfaces since these types are specific to the Passport OAuth2 internals and not reused elsewhere.
- **Test files excluded**: Test files (`.spec.ts`) are excluded from `tsconfig.build.json` and therefore not affected by `strict: true` for compilation. However, `ts-jest` may apply tsconfig.json — if test compilation breaks, the same DTO `!` fix resolves it since tests import the production DTOs.
- **Scope**: This ticket only addresses TS-01 and TS-02 from the audit. Other code quality findings (SM-01, CX-01, SD-03) are separate tickets.

## 12. Next Steps After Implementation

- Re-run audit Phase 10e checks TS-01 and TS-02 to verify PASS
- Monitor for any implicit `any` introduced in future tickets (strict mode catches these at compile time)

## 13. Implementation Verification

- [ ] `tsconfig.json` has `strict: true` and no individual strict sub-flags
- [ ] All 20 DTO files have `!` on required properties
- [ ] `AuthenticatedRequest` interface created and used in all 4 controllers
- [ ] OAuth strategies and PKCE helper have no `any` types
- [ ] 0 production `any` types (verified by grep)
- [ ] 846+ tests pass
- [ ] Build succeeds
- [ ] No code logic changes — only type annotations
