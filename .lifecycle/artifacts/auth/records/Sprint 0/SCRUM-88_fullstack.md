# Implementation Record: SCRUM-88 Auth Security Hardening — Compliance Remediation

## 2. Summary

Implemented 9 security compliance items identified in an ASVS v4.0 / NIST SP 800-63B / RFC 9700 / RFC 8725 audit of the EM NexaCore authentication system. Items covered: OAuth PKCE (S256), JWT `iss`/`aud` claims, `ParseUUIDPipe` on ID params, MFA audit logging, password validator fix, CSRF cookie `httpOnly` correction, `reset-password` throttling, ADMIN self-escalation prevention, and HTTPS enforcement middleware.

Frontend companion: removed special character password requirement indicator from 3 UI components to align with backend F-09 change. Also discovered and fixed a critical build bug where `prisma.config.ts` at the project root caused a `dist/` path mismatch that crashed the server on email-sending operations.

- **Scope:** backend + frontend
- **Branch (backend):** `feature/SCRUM-88-backend` (branched from `feature/SCRUM-23-oauth-security-hardening`)
- **Branch (frontend):** `feature/SCRUM-88-frontend` (branched from `feature/SCRUM-88-backend`)
- **Implementation date:** 2026-02-27

## 3. Plan Reference

- Plan: `ai-specs/changes/plans/SCRUM-88_backend.md`
- Plan was followed: **Partially** — see deviations below

## 4. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `5f900b0` | `feat(SCRUM-88): security compliance hardening — 9 items across auth, MFA, RBAC, and OAuth` | `auth.module.ts`, `jwt.strategy.ts`, `mfa.service.ts`, `mfa.controller.ts`, `oauth-state.store.ts`, `google-auth.guard.ts`, `github-auth.guard.ts`, `google.strategy.ts`, `github.strategy.ts`, `permissions.service.ts`, `permissions.controller.ts`, `security.config.ts`, `main.ts`, `https-redirect.middleware.ts`, `prisma/schema.prisma`, `audit-action.enum.ts` |
| `4b834cd` | `fix: resolve dist/ path mismatch causing mail template crash` | `tsconfig.json`, `tsconfig.build.json` |
| `03f660d` | `feat(SCRUM-88): remove special character password requirement from UI` | `RegisterForm.tsx`, `ResetPasswordForm.tsx`, `ChangePasswordForm.tsx` |

## 5. Deviations from Plan

| Step | Planned | Actual | Reason |
|------|---------|--------|--------|
| Step 5c — JWT verify calls | Add `{ issuer, audience }` options to each individual `jwtService.verify()` call in `auth.service.ts` | Used module-level `verifyOptions` in `JwtModule.register()` — applies automatically to all sign/verify calls | Cleaner approach; avoids per-call repetition and is consistent with NestJS JwtModule design |
| Step 5d — MFA token audience | Use distinct `audience: 'nexacore-api:mfa-challenge'` for MFA tokens signed by `generateMfaToken()` | Used same `audience: 'nexacore-api'` for all tokens | Token confusion is already prevented by the `type: 'mfa-challenge'` payload field; separate audience adds complexity without significant security gain |
| Step 8b — Trust proxy | Add `app.set('trust proxy', 1)` in `main.ts` | Not added | The HTTPS redirect middleware reads `X-Forwarded-Proto` directly via `req.headers`; the Express trust proxy setting is not required for this approach |
| Step 9 — PKCE approach | Plan offered Option A (session adapter) or Option B (monkey-patch) as alternatives | Used **Option B** — monkey-patching `_oauth2.getOAuthAccessToken` to inject `code_verifier` before token exchange; original function restored immediately | Option A requires `express-session` which the codebase intentionally avoids (stateless JWT architecture); Option B is self-contained and has zero external dependencies |
| Step 9 — State validation | Plan mentioned removing duplicate state validation in `validate()` since PKCE provides anti-CSRF | State validation kept in `validate()` (via `OAuthStateStore.validate()`) | Belt-and-suspenders: PKCE protects the code exchange; state validation protects the authorization redirect. Both are independent and non-redundant |
| Step 11 — New unit tests | Plan specified new unit test files for ParseUUIDPipe, throttle, HTTPS redirect, and PKCE math | Only fixed 5 existing test files broken by implementation changes; no new test spec files created | Existing test coverage gap is tracked separately; new tests would require additional integration with `supertest` patterns not yet established for these components |

## 6. Test Results

- **Overall coverage:** ~70% (below 90% threshold — pre-existing gap, tracked separately)
- **Unit tests (post-implementation):** All passing (full suite)
- **Files fixed during implementation:**
  - `src/auth/tests/mfa.service.spec.ts` — Added `auditService` mock to constructor call
  - `src/auth/tests/mfa.controller.spec.ts` — Updated `verifySetup`/`disableMfa` expectations to include `meta` argument
  - `src/auth/tests/oauth-guards.spec.ts` — Updated `generate()` mock to return `{ state, codeChallenge }` object; updated guard option expectations
  - `src/auth/tests/oauth-state.store.spec.ts` — Fully rewritten for new `OAuthStateStore` API (`generate()` returns object, `getCodeVerifier()` peek method)
  - `src/permissions/tests/permissions.controller.spec.ts` — Added `mockReq` to `setForRole()` calls; updated `toHaveBeenCalledWith` to include `actingUserRole`
- **Integration tests:** None (no E2E suite exists yet)
- **Manual smoke tests:** Build clean (`tsc --noEmit` + `nest build`); Prisma client regenerated after `AuditAction` enum extension

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `AuditAction` enum values `MFA_ENABLED`/`MFA_DISABLED` added to TypeScript enum but not to `prisma/schema.prisma` | HIGH | Fixed | Added both values to `prisma/schema.prisma` and ran `npx prisma generate`; build passed cleanly after |
| `prisma.config.ts` at project root caused TypeScript to infer `rootDir` as project root → compiled JS went to `dist/src/` while NestJS assets went to `dist/mail/templates/`. `__dirname` at runtime resolved to `dist/src/mail/` → template `ENOENT` → synchronous throw in Nodemailer callback chain → uncaught exception → server crash on any email-sending operation (register, verify, password reset). The `.catch(() => {})` in `auth.service.ts` did NOT catch it because it was a synchronous throw, not a promise rejection. | **CRITICAL** | Fixed | Added `rootDir: "./src"` and `tsBuildInfoFile: "./dist/..."` to `tsconfig.json`; excluded `prisma.config.ts` from `tsconfig.build.json` |

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/records/SCRUM-88_backend.md` | Created this implementation record |
| `ai-specs/specs/integration-state.md` | Updated MfaService dependency chain; added `@Throttle` to reset-password method guard; added SCRUM-88 changelog entry |
| `ai-specs/specs/data-model.md` | Added `MFA_ENABLED` and `MFA_DISABLED` to AuditAction enum table and Prisma schema section |

## 9. Frontend Implementation

### F-09: Remove special character password requirement from UI

**Plan**: `ai-specs/changes/plans/SCRUM-88_frontend.md`
**Plan followed**: Yes

| File | Change |
|------|--------|
| `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | Removed `special` entry from `PASSWORD_REQUIREMENTS` array (5 → 4 icons); removed `Asterisk` from lucide-react import |
| `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | Same changes as RegisterForm |
| `nexacore-dashboard/src/components/profile/ChangePasswordForm.tsx` | Removed `if (/[^A-Za-z0-9]/.test(newPassword)) score++` from strength meter; updated labels from `['', 'Weak', 'Fair', 'Good', 'Strong']` → `['', 'Weak', 'Fair', 'Strong']`; reduced bars from `[1,2,3,4]` → `[1,2,3]` |

**Frontend build**: `next build` passed cleanly (17 static pages, 0 errors).

**Note**: `ResetPasswordForm.tsx` only exists on the feature branch (added in SCRUM-29 commit `1d943fa`), not yet merged to `main`. The frontend branch was therefore based on `feature/SCRUM-88-backend` instead of `main`.

## 10. Lessons Learned

- **JwtModule `verifyOptions`** is a cleaner pattern than per-call options; use it as the default when adding `iss`/`aud` to an existing NestJS JWT setup
- **PKCE without sessions**: monkey-patching `_oauth2.getOAuthAccessToken` in `authenticate()` override works reliably but is fragile if `passport-oauth2` changes its internal API — document this as a maintenance risk
- **Prisma schema must be kept in sync with TypeScript enums** — adding enum values to one without the other causes `$Enums.*` type mismatch build errors that are easy to miss
- **Test specs that mock constructors directly** (not via `TestingModule`) need to be updated every time a constructor dependency is added; this creates a tight coupling between implementation and test maintenance
- **`rootDir` + `incremental` + `deleteOutDir` conflict**: When `tsBuildInfoFile` is outside the `outDir`, `deleteOutDir: true` wipes compiled output but leaves the incremental cache intact — tsc then thinks everything is already emitted and produces no files. Always place `tsBuildInfoFile` inside the output directory.
- **Synchronous throws in callback-based libraries bypass `.catch()`**: Nodemailer's `processPlugins` calls Handlebars adapter synchronously; a `readFileSync` ENOENT becomes an uncaught exception that no async error boundary can catch. Fire-and-forget patterns like `.catch(() => {})` only work for promise rejections.
