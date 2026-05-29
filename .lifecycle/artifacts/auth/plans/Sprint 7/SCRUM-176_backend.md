# Backend Implementation Plan: SCRUM-176 Add Cache-Control: no-store to Auth Endpoints

## 1. Header

- **Ticket**: SCRUM-176
- **Sprint**: Sprint 7 - Audit Remediation
- **Parent**: SCRUM-174 (Auth Module Audit Epic)
- **Audit Finding**: Phase 3 V8.2.1 FAIL (MEDIUM) — No Cache-Control header on auth endpoints

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-184 (commit `2990ad3`, delete obsolete E2E test)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.controller.ts` — `@ApiTags('auth') @Controller('auth')` at lines 63-64. No `@UseInterceptors`. Constructor: `AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService`
  - `src/auth/mfa.controller.ts` — `@ApiTags('auth') @Controller('auth/mfa')` at lines 31-32. No `@UseInterceptors`. Constructor: `MfaService, AuthService`
  - `src/auth/passkey.controller.ts` — `@ApiTags('auth') @Controller('auth/passkeys')` at lines 35-36. No `@UseInterceptors`. Constructor: `PasskeyService`
  - `src/auth/auth.module.ts` — 12 providers, 3 controllers. No interceptors registered.
  - `src/common/` — Subdirectories: constants, decorators, filters, guards, interfaces, middleware, services, utils. No `interceptors/` directory.
  - `src/security/security.config.ts` — Helmet config (CSP, HSTS, referrer, permissions policy). No Cache-Control config.
- **Constructor signatures verified**: N/A — no constructors modified
- **Methods verified to exist**: N/A — no method integration points
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None

---

## 3. Overview

Create a `NoCacheInterceptor` that sets anti-caching headers (`Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`) on all auth endpoint responses. Apply at the controller class level to all 3 auth controllers. This prevents browsers and proxies from caching sensitive auth data (tokens, user profiles, session lists), satisfying OWASP ASVS V8.2.1.

**Why interceptor, not middleware?** Interceptors run in the NestJS execution pipeline (after guards, before response), are decorator-based (`@UseInterceptors`), and can be scoped to specific controllers. Middleware would require path matching and runs before guards.

**Why controller-level, not global?** Only auth endpoints return sensitive data. Global would add unnecessary headers to non-auth endpoints (health checks, Swagger docs, static resources).

---

## 4. Architecture Context

- **Modules involved**: None modified — interceptor is applied via decorator, no module registration needed
- **Components affected**:
  - New: `src/common/interceptors/no-cache.interceptor.ts`
  - Modified: `src/auth/auth.controller.ts`, `src/auth/mfa.controller.ts`, `src/auth/passkey.controller.ts` (add `@UseInterceptors`)
  - New test: `src/common/interceptors/tests/no-cache.interceptor.spec.ts`
- **Files referenced**: None additional

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-176-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-176-backend`

### Step 1: Create NoCacheInterceptor

- **File**: `src/common/interceptors/no-cache.interceptor.ts`
- **Action**: Create a NestJS interceptor that sets anti-caching headers
- **Implementation Steps**:
  1. Create `src/common/interceptors/` directory
  2. Implement the interceptor:
     ```typescript
     @Injectable()
     export class NoCacheInterceptor implements NestInterceptor {
       intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
         const response = context.switchToHttp().getResponse<Response>();
         response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
         response.setHeader('Pragma', 'no-cache');
         response.setHeader('Expires', '0');
         return next.handle();
       }
     }
     ```
- **Dependencies**: `@nestjs/common` (Injectable, NestInterceptor, ExecutionContext, CallHandler), `rxjs` (Observable), `express` (Response)
- **Implementation Notes**:
  - `no-store` prevents caching entirely (RFC 7234 §5.2.2.5)
  - `no-cache` requires revalidation (backward compat with HTTP/1.1 caches)
  - `must-revalidate` prevents stale serving
  - `Pragma: no-cache` for HTTP/1.0 backward compat
  - `Expires: 0` marks as already expired

### Step 2: Apply Interceptor to Auth Controllers

- **Files**: `src/auth/auth.controller.ts`, `src/auth/mfa.controller.ts`, `src/auth/passkey.controller.ts`
- **Action**: Add `@UseInterceptors(NoCacheInterceptor)` at class level
- **Implementation Steps**:
  1. In `auth.controller.ts`, add between `@ApiTags('auth')` and `@Controller('auth')`:
     ```typescript
     @UseInterceptors(NoCacheInterceptor)
     ```
     Add to imports: `UseInterceptors` from `@nestjs/common`, `NoCacheInterceptor` from `../../common/interceptors/no-cache.interceptor`
  2. In `mfa.controller.ts`, add between `@ApiTags('auth')` and `@Controller('auth/mfa')`:
     ```typescript
     @UseInterceptors(NoCacheInterceptor)
     ```
  3. In `passkey.controller.ts`, add between `@ApiTags('auth')` and `@Controller('auth/passkeys')`:
     ```typescript
     @UseInterceptors(NoCacheInterceptor)
     ```
- **Implementation Notes**: `UseInterceptors` is already available in `@nestjs/common`. Check if it's already imported in each controller; if not, add it to the import destructuring.

### Step 3: Write Unit Tests for NoCacheInterceptor

- **File**: `src/common/interceptors/tests/no-cache.interceptor.spec.ts`
- **Action**: Unit tests verifying headers are set correctly
- **Implementation Steps**:
  1. Create `src/common/interceptors/tests/` directory
  2. Test cases:
     - Sets `Cache-Control: no-store, no-cache, must-revalidate` header
     - Sets `Pragma: no-cache` header
     - Sets `Expires: 0` header
     - Calls `next.handle()` (passes through to handler)
     - Headers are set before handler executes (verify via mock order)
  3. Mock `ExecutionContext` with `switchToHttp().getResponse()` returning a mock with `setHeader` spy
  4. Mock `CallHandler` with `handle()` returning `of({})` from rxjs

### Step 4: Run All Tests

- **Action**: Verify no regressions
- **Implementation Steps**:
  1. `npx jest --no-coverage` — verify all unit tests pass (829 + new interceptor tests)
  2. `npx jest --config test/jest-e2e.json test/auth-e2e/ --no-coverage` — verify 57 E2E tests pass

### Step 5: Update Technical Documentation

- **Action**: Update integration-state.md and api-spec.yml
- **Implementation Steps**:
  1. Add changelog entry to `integration-state.md`
  2. Update `api-spec.yml` to document Cache-Control headers on auth endpoints (add to global auth tag or individual endpoint responses)

---

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create `NoCacheInterceptor`
3. Step 2: Apply to 3 auth controllers
4. Step 3: Write unit tests
5. Step 4: Run all tests
6. Step 5: Update documentation

---

## 7. Testing Checklist

- [ ] `NoCacheInterceptor` sets all 3 headers
- [ ] `NoCacheInterceptor` passes through to handler (doesn't block)
- [ ] Auth controller responses include `Cache-Control` header
- [ ] MFA controller responses include `Cache-Control` header
- [ ] Passkey controller responses include `Cache-Control` header
- [ ] Non-auth endpoints do NOT have the header (verify by absence)
- [ ] All 829+ unit tests pass
- [ ] All 57 E2E tests pass

---

## 8. Error Response Format

N/A — interceptor only adds response headers, no error scenarios.

---

## 9. Partial Update Support

N/A

---

## 10. Dependencies

No new dependencies. Uses only `@nestjs/common`, `rxjs`, and `express` (all already in project).

---

## 11. Notes

- OWASP ASVS V8.2.1: "Verify that the application sets sufficient anti-caching headers so that sensitive data is not cached in modern browsers."
- RFC 7234 §5.2: Cache-Control header field definition
- The interceptor is intentionally NOT global — only auth controllers handle sensitive data. Other controllers (users admin CRUD, audit logs, permissions) may benefit from caching.
- Helmet does NOT set Cache-Control by default. Helmet's `noCache()` was deprecated in v4+ and removed.

---

## 12. Next Steps After Implementation

- Run `/update-docs` to create implementation record
- Commit and create PR

---

## 13. Implementation Verification

- [ ] New file: `src/common/interceptors/no-cache.interceptor.ts`
- [ ] New test: `src/common/interceptors/tests/no-cache.interceptor.spec.ts`
- [ ] 3 controllers updated with `@UseInterceptors(NoCacheInterceptor)`
- [ ] All tests pass (no regressions)
- [ ] Documentation updated (integration-state.md changelog)
