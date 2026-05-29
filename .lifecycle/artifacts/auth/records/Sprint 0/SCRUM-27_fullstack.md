# Implementation Record: SCRUM-27 Security Headers, CSP & CSRF Protection

## Summary

Implemented comprehensive security hardening: Helmet.js with CSP/HSTS/X-Frame-Options/Referrer-Policy, CSRF double-submit cookie pattern with HMAC-signed tokens, CORS hardening with explicit origin allowlist, Permissions-Policy restricting browser APIs, Next.js middleware with per-request CSP nonces, and frontend auto-attach/auto-retry CSRF flow.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-23-oauth-security-hardening`
- **Implementation date**: 2026-02-26

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-27_fullstack.md`
- **Plan followed**: Partially — 9 deviations, mostly simplifications, stale snapshot handling, and one critical correctness improvement not in the plan (AuthContext CSRF). All 7 subtasks fully implemented.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| ae3fd5b | feat(SCRUM-27): security headers, CSP & CSRF protection — full-stack | 16 files (see below) |
| f3eaffe | fix(SCRUM-27): add unsafe-eval to CSP in dev mode for webpack compatibility | `nexacore-dashboard/src/middleware.ts` |

**Files created (8):**
- `nexacore-api/src/security/security.config.ts` — Centralized config: CORS allowlist, CSRF cookie/HMAC settings, Helmet CSP/HSTS/Referrer/Permissions directives
- `nexacore-api/src/security/security.module.ts` — Registers CsrfGuard as global APP_GUARD
- `nexacore-api/src/common/guards/csrf.guard.ts` — Double-submit cookie guard: HMAC verification, timing-safe comparison, safe method exemption, `@SkipCsrf()` support, static `generateToken()`
- `nexacore-api/src/common/decorators/skip-csrf.decorator.ts` — `@SkipCsrf()` metadata decorator
- `nexacore-api/src/common/middleware/helmet.middleware.ts` — `registerHelmetMiddleware()`: Helmet config + custom Permissions-Policy middleware
- `nexacore-api/src/security/tests/csrf.guard.spec.ts` — 13 unit tests for CsrfGuard (safe methods, missing tokens, mismatch, tampered HMAC, SkipCsrf, token generation)
- `nexacore-dashboard/src/middleware.ts` — Next.js middleware: per-request CSP nonce generation, CSP header with `strict-dynamic`, matcher excluding static files
- `nexacore-dashboard/src/lib/csrf.ts` — CSRF token management: `getCsrfToken()` (fetch + cache + singleton promise), `clearCsrfToken()`, `getCachedCsrfToken()`

**Files modified (8):**
- `nexacore-api/package.json` / `package-lock.json` — Added `helmet` ^8.1.0
- `nexacore-api/src/main.ts` — Added Helmet registration before cookie-parser, replaced simple CORS with hardened origin-function pattern using SecurityConfig
- `nexacore-api/src/app.module.ts` — Added `SecurityModule` to imports (preserved ThrottlerModule from SCRUM-24, AuditModule from SCRUM-25)
- `nexacore-api/src/auth/auth.controller.ts` — Added `GET /auth/csrf-token` endpoint with `@SkipCsrf()`, imported SkipCsrf/CsrfGuard/SecurityConfig
- `nexacore-dashboard/next.config.mjs` — Added `headers()` function: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection (disabled), Referrer-Policy, Permissions-Policy (10 features), HSTS
- `nexacore-dashboard/src/lib/api.ts` — Added CSRF token auto-attach on POST/PUT/PATCH/DELETE, 403 CSRF auto-retry (clear + re-fetch + retry once)
- `nexacore-dashboard/src/context/AuthContext.tsx` — Added CSRF token to direct `fetch` calls (refreshSession, logout), clearCsrfToken on logout

## Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | Create `src/common/middleware/csrf-token.middleware.ts` (Files to Create table) | Not created | CSRF token issuance logic placed directly in `GET /auth/csrf-token` controller endpoint. Standalone NestJS middleware is over-engineered for a single endpoint — controller approach is simpler and equally functional. |
| 2 | Apply `@SkipCsrf()` to OAuth GET endpoints (google, github, callbacks) (Step 9) | Not applied | Redundant — CsrfGuard already exempts GET/HEAD/OPTIONS via `SAFE_METHODS` set. All OAuth endpoints are `@Get()`, so they pass the guard automatically without the decorator. |
| 3 | `api.ts` detects CSRF 403 via `body?.error?.message?.includes('CSRF')` only (Step 13) | Detects via `body?.message?.includes('CSRF') \|\| body?.error?.message?.includes('CSRF')` | NestJS `ForbiddenException` puts the message in `body.message` by default, not `body.error.message`. Implementation handles both response shapes for robustness. |
| 4 | `api.ts` silentRefresh uses `/api/auth/refresh` (BFF route) (Step 13) | Uses `${API_BASE_URL}/auth/refresh` (direct API) | Plan snapshot was stale (pre-SCRUM-26). BFF routes were deleted in SCRUM-26. Frontend calls backend directly with `credentials: 'include'`. |
| 5 | `api.ts` exports only `apiClient` (Step 13) | Exports `apiClient` and `API_BASE_URL` | `API_BASE_URL` export established in SCRUM-26 — needed by AuthContext for direct fetch calls. |
| 6 | `auth.controller.ts` snapshot without @Throttle, sessions, cookies, ephemeral codes (Step 9) | Correctly merged CSRF additions into real controller with SCRUM-23/24/25/26 code | Plan had stale pre-SCRUM-23 snapshot. Same pattern as all prior layers. |
| 7 | `app.module.ts` without ThrottlerModule, AuditModule (Step 8) | Preserves all prior modules, adds SecurityModule | Plan had stale snapshot. Correctly merged. |
| 8 | `import * as cookieParser from 'cookie-parser'` in main.ts (Step 7) | `import cookieParser from 'cookie-parser'` | Default import established in SCRUM-26 for ESM compatibility. |
| 9 | Plan does not mention AuthContext.tsx changes | Added CSRF token to refreshSession/logout direct fetch calls + clearCsrfToken on logout | **Critical correctness improvement.** AuthContext makes direct `fetch` calls (not through apiClient) for refresh and logout. Without CSRF tokens, these POSTs would be rejected by the global CsrfGuard. Plan oversight. |

## Subtask Mapping

| Key | Plan Description | Implemented? |
|-----|-----------------|-------------|
| SCRUM-57 | Helmet.js integration and base security headers | YES |
| SCRUM-58 | Content Security Policy (CSP) configuration | YES — API via Helmet, frontend via Next.js middleware with per-request nonce |
| SCRUM-59 | CSRF protection (double-submit cookie pattern) | YES — CsrfGuard, SkipCsrf decorator, SecurityModule, csrf-token endpoint, frontend csrf.ts + api.ts integration |
| SCRUM-60 | CORS hardening with explicit origin allowlist | YES — SecurityConfig.cors + origin function in main.ts |
| SCRUM-61 | Referrer-Policy header configuration | YES — API via Helmet, frontend via next.config.mjs |
| SCRUM-62 | Permissions-Policy header configuration | YES — API via custom middleware, frontend via next.config.mjs |
| SCRUM-63 | Next.js security headers in next.config.mjs | YES — 6 headers on all routes |

## Test Results

- **Unit tests**: 154 passed / 0 failed (17 suites)
- **Backend build**: `nest build` succeeded
- **Frontend build**: `next build` compiled + type-checked OK (10 routes, 12 static pages, middleware 26.8 kB)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| TS2352: `readonly []` not assignable to `string[]` in helmet.middleware.ts Permissions-Policy iteration | LOW | Fixed | Changed cast to `as readonly string[]` — `as const` config makes arrays readonly |
| Next.js TS error: `Uint8Array` spread with `--downlevelIteration` in middleware.ts nonce generation | MEDIUM | Fixed | Replaced `String.fromCharCode(...array)` with `String.fromCharCode.apply(null, Array.from(array))` — avoids spread on typed arrays |
| CSP `script-src` missing `'unsafe-eval'` blocks webpack in dev mode — React hydration silently fails (blank spinner) | **HIGH** | Fixed (`f3eaffe`) | Added `'unsafe-eval'` to `script-src` and `ws://localhost:3001` to `connect-src` conditionally when `NODE_ENV === 'development'`. Production CSP remains strict. See detail below. |

### Post-deployment Bug: CSP Blocks webpack eval() in Development

**Discovered during**: SCRUM-28 (MFA) implementation — dashboard stuck on loading spinner indefinitely.

**Symptom**: `isInitialized` in AuthContext never becomes `true` because React never hydrates. The server-rendered spinner stays forever.

**Root cause**: CSP directive `script-src 'self' 'nonce-...' 'strict-dynamic'` blocks `eval()` calls. Next.js 14 with webpack in `next dev` uses `eval()` for fast module loading and source maps. Without `'unsafe-eval'`, all webpack modules are silently blocked by the browser.

**Why it wasn't caught earlier**: `next build` (production) does not use `eval()` — it outputs proper JS files. Build verification always passed. The bug only manifests in `next dev` when CSP is enforced by the browser. CSP violations are invisible from server-side testing (curl).

**Fix** (`nexacore-dashboard/src/middleware.ts`):
```typescript
const isDev = process.env.NODE_ENV === 'development';
const scriptSrc = isDev
  ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
  : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
const connectSrc = isDev
  ? `connect-src 'self' ${apiUrl} ws://localhost:3001`
  : `connect-src 'self' ${apiUrl}`;
```

## Documentation Updates

Deferred — same as SCRUM-23 through SCRUM-26. API spec, backend-standards, and frontend-standards docs will be updated in batch after the SCRUM-22 epic completes. `.env.example` update also deferred.

## Lessons Learned

- **CsrfGuard safe methods check eliminates redundant decorators**: GET/HEAD/OPTIONS are automatically exempt. `@SkipCsrf()` is only needed for non-safe methods that should bypass CSRF (none in current API).
- **Direct fetch calls bypass apiClient CSRF**: When AuthContext uses `fetch()` directly (for refresh/logout), it must manually attach CSRF tokens. The plan only addressed `apiClient` CSRF integration, missing the direct calls. Always audit ALL HTTP call sites when adding global guards.
- **`as const` config + Helmet permissions iteration**: TypeScript `as const` makes all arrays `readonly`. When iterating with `.join()`, cast to `readonly string[]` (not `string[]`).
- **Uint8Array spread in Edge Runtime**: Next.js middleware runs in Edge Runtime where `String.fromCharCode(...typedArray)` fails without `downlevelIteration`. `Array.from()` wrapper is the portable solution.
- **CSRF middleware vs controller endpoint**: For single-endpoint token issuance, a controller method is simpler than a NestJS middleware (which requires consumer registration in a module). Reserve middleware for cross-cutting concerns applied to multiple routes.
- **Always test CSP in the browser during dev mode**, not just via `next build` or curl. Production builds use different module loading strategies (no eval) so build-time verification is insufficient. Next.js dev mode (webpack) requires `'unsafe-eval'` in CSP — this is a well-documented requirement.
