---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-433
sprint: Sprint 14
scope: fullstack
module: auth
date: 2026-05-14
status: draft
last_completed_ticket: SCRUM-304
---

# Fullstack Implementation Plan: SCRUM-433 Auth audit 2026-05-14 batch consolidation of 15 Tier-1 WARNs

> Consolidated remediation of 15 WARN findings (Tier-1) from the full audit of the auth module on 2026-05-14. Audit parent: [SCRUM-432](https://emillionnetworking-ltd-labs.atlassian.net/browse/SCRUM-432). Single batch — no individual sub-tickets. Tier 2 (14 items) and Tier 3 (3 items) are out of scope (see audit report §11.4 / §11.7).

---

## 2. Codebase State Snapshot

- **Date**: 2026-05-14
- **Last completed ticket**: SCRUM-304 (auth-related, `@simplewebauthn/types` deprecation)
- **Integration state verified**: Yes
- **Files verified against live code (read during /plan)**:
  - `nexacore-api/src/config/auth.config.ts` (T1-A site 1)
  - `nexacore-api/src/common/services/crypto.service.ts` (T1-A site 2)
  - `nexacore-api/src/security/security.config.ts` (T1-A site 3 — discovered during enrichment; not in original audit citation)
  - `nexacore-api/src/users/users.service.ts` (T1-B downloadAndStoreAvatar, T1-D adminUpdateUser, T1-F EM-08 sites)
  - `nexacore-api/src/auth/guards/mfa-setup.guard.ts` (T1-E)
  - `nexacore-api/src/auth/guards/jwt-or-mfa-setup.guard.ts` (T1-E 4th variant)
  - `nexacore-api/src/auth/token.service.ts` (T1-F EM-10 line 281)
  - `nexacore-api/src/users/users.controller.ts` (T1-F line 90 avatar)
  - `nexacore-api/src/common/constants/error-messages.ts` (T1-F target catalog)
  - `nexacore-api/prisma/schema.prisma` (T1-C 7 cascade lines)
  - `nexacore-api/.env.example` (T1-H line 11 API_URL)
  - `nexacore-api/package.json` (T1-G coverageThreshold lines 137-143; T1-K jest config block)
  - `nexacore-api/src/auth/trusted-device.service.ts:148` (T1-N listTrustedDevices)
  - `nexacore-api/src/auth/login-security.service.ts` (T1-N logAudit return type)
  - `nexacore-api/src/auth/mfa.service.ts:128` (T1-N generateMfaToken — already `: string`, drop from scope)
  - `nexacore-dashboard/src/lib/oauth-api.ts` (T1-I getLinkedProviders)
  - `nexacore-dashboard/src/components/auth/RegisterForm.tsx` (T1-M)
  - `nexacore-dashboard/src/components/auth/LoginForm.tsx` (T1-M)
  - `nexacore-dashboard/src/components/profile/ChangeEmailForm.tsx` (T1-M)
  - `nexacore-dashboard/src/components/profile/ProfileForm.tsx` (T1-M)
  - `nexacore-dashboard/src/lib/validation.ts` (existing utility — extend for T1-M)
  - `em-ecosystem/.github/workflows/*.yml` (T1-J verification)
  - `ai-specs/specs/data-model.md` (T1-C docs target)
  - `ai-specs/specs/workflow-standards.mdc §2, §8` (T1-L + T1-O docs targets)
- **Constructor signatures verified**:
  - `CryptoService()` — no DI deps; reads `process.env.MFA_ENCRYPTION_KEY` directly in constructor (line 13). Plan keeps the constructor shape; only removes the `||` fallback.
  - `UsersService.adminUpdateUser(targetId, dto, actingUser, ctx?)` — 4 params, signature confirmed at line 773-778.
  - `MfaSetupGuard(tokenService, usersService)` — 2 deps, no change.
  - `JwtOrMfaSetupGuard(mfaSetupGuard)` — 1 dep, no change.
- **Methods verified to exist**:
  - `UsersService.downloadAndStoreAvatar(externalUrl, userId)` at `users.service.ts:946` ✓
  - `UsersService.adminUpdateUser(targetId, dto, actingUser, ctx?)` at `users.service.ts:773` ✓
  - `MfaSetupGuard.canActivate` at `mfa-setup.guard.ts:26` ✓
  - `JwtOrMfaSetupGuard.canActivate` at `jwt-or-mfa-setup.guard.ts:23` ✓
  - `TokenService.verifyMfaSetupToken` at `token.service.ts:276` ✓ (throws `'Invalid setup token'` at line 281)
  - `UsersController.uploadAvatar` at `users.controller.ts:82-99` ✓ (throws `'Avatar file is required'` at line 90)
  - `MfaService.generateMfaToken(user: User): string` at `mfa.service.ts:128` ✓ (already explicit — drop from T1-N)
  - `TrustedDeviceService.listTrustedDevices(userId: string)` at `trusted-device.service.ts:148` — verified missing return type
  - `LoginSecurityService.logAudit(action, requestMeta, userId, metadata?)` — verified, missing return type
- **Guard dependency chain verified**: No new guard chains introduced (T1-E modifies existing guard internals only; no `@UseGuards` changes).
- **Discrepancies with integration-state.md**: None. AuthModule imports/exports/controllers all match live code (cross-verified during Phase 6 of the audit).
- **Discrepancies vs original audit (delta found during /enrich-us)**:
  1. T1-A: original WARN cited 2 sites (auth.config.ts:5, crypto.service.ts:13); live grep found a **3rd** site at `security.config.ts:51` (returns `'dev-csrf-secret-…'` fallback). Added to scope.
  2. T1-J: original WARN said "verify CI uses npm ci"; live grep confirms 10/10 invocations already use `npm ci`. **No code change required** — only completion-report annotation.
  3. T1-N: original scope was 3 methods; live verification shows `generateMfaToken` already has `: string`. **Effective scope = 2 methods** (`listTrustedDevices`, `logAudit`).
  4. T1-L: original recommendation mentioned `templates/implementation-record.template.md`; no such file exists today (only satellite templates in `ai-specs/specs/templates/`). Action redirected to `workflow-standards.mdc §8` mapping subsection.

---

## 3. Regression Impact Analysis

- **Blast radius (direct importers)**:
  - `auth.config.ts` → consumed via `src/config/index.ts` → used by `auth.module.ts`, `token.service.ts`. Removing the `||` fallback affects boot semantics only when env var is missing AND `NODE_ENV !== 'production'`. Current `validate-production-secrets.ts` already covers production; dev startup will need `.env` populated.
  - `crypto.service.ts` → imported by `mfa.service.ts`, `crypto.module.ts`. Same as above: tightens dev-time env requirement.
  - `security.config.ts` → consumed by `security.module.ts`, helmet middleware. Same.
  - `users.service.ts` → imported by 4 spec files + multiple module consumers. T1-D adds a single early-return check at the top of `adminUpdateUser`; behavior change is rejection of an admin acting on its own row. T1-B adds allowlist check inside `downloadAndStoreAvatar` (private method, no caller-visible change unless URL is rejected).
  - `mfa-setup.guard.ts` + `jwt-or-mfa-setup.guard.ts` → used by `mfa.controller.ts`. Message-text change only; no signature change. Spec file `mfa.controller.spec.ts` may need string updates if it asserts specific messages.
  - `oauth-api.ts` → `getLinkedProviders` has **0 consumers** (verified via grep). Safe to delete.
  - `error-messages.ts` → adding 4 new constants (EMAIL_CHANGE_NOT_AVAILABLE, EMAIL_UNCHANGED, PASSWORD_CONFIRMATION_REQUIRED, AVATAR_REQUIRED). Additions only; no rename.
- **Breaking changes identified**: **None public-facing.** All changes are internal hygiene:
  - HTTP response bodies unchanged (only the internal exception message string is normalised — externally still surfaces as 401/403 with a generic message via global filter).
  - Constructor signatures unchanged.
  - DTO shapes unchanged.
  - Prisma schema unchanged (T1-C is doc-only).
  - Guard behavior unchanged (T1-E narrows discriminator but keeps the same 401 status).
- **API contract impact**: **Zero** — `api-spec.yml` requires no change. Phase 4 re-run after merge MUST still PASS at 42↔42.
- **Schema migration impact**: **Zero** — Prisma schema not touched. T1-C is purely documentation in `data-model.md`.
- **Test files requiring updates** (regression test checklist):
  1. `nexacore-api/src/auth/tests/mfa.controller.spec.ts` — if any test asserts the literal `'Missing authorization token'` / `'User not found'` / `'Invalid or expired setup token'` / `'Valid access token or MFA setup token required'`, replace with `ErrorMessages.auth.AUTHENTICATION_FAILED`. (T1-E)
  2. `nexacore-api/src/users/tests/users.service.spec.ts` — add unit test for V4.3.1 self-modification rejection (T1-D recurrence prevention). Verify existing adminUpdateUser tests still pass.
  3. `nexacore-api/src/users/tests/users.controller.spec.ts` — if any test asserts `'Avatar file is required'`, replace with `ErrorMessages.user.AVATAR_REQUIRED`.
  4. `nexacore-api/src/tests/validate-production-secrets.spec.ts` — verify still passes (it sets env vars then calls validateProductionSecrets — should be unaffected by removing dev fallbacks elsewhere).
  5. `nexacore-api/src/security/tests/security.config.spec.ts` — covers `getSecret()` fallback path. If the dev fallback is removed, this spec must be updated to either set `CSRF_SECRET` env or be allowed to throw.
  6. `nexacore-api/src/common/services/tests/*` (if any test for CryptoService) — verify still constructs without the fallback.
  7. `nexacore-dashboard/tests/...` — verify no tests reference `getLinkedProviders` (T1-I).
- **Blast radius size**: **~7 spec files + ~12 production files = ~19 files** — **>5, flag for careful regression testing in `/verify`.** However: each Tier-1 fix is independent (no inter-dependencies), so the surface per-fix is small.

---

## 4. Overview

This ticket batches 15 Tier-1 hygiene/security fixes from the 2026-05-14 audit into a single PR. Architecture principles:

- **No behavior change visible to API consumers.** Every fix tightens internal hygiene (secret-fallback removal, error-message consolidation, doc accuracy, threshold raise, dead-code deletion). All HTTP responses, DTO shapes, and OpenAPI contracts remain unchanged.
- **NestJS standards**: continue using `ConfigService.get('auth.X')`, `class-validator` DTOs, `@Injectable()` services, single global `ValidationPipe` + `HttpExceptionFilter`. The `ErrorMessages` catalog is the single source of truth for client-facing strings.
- **Frontend standards**: extract shared utilities into `src/lib/validation.ts`; do not duplicate regex; respect Next.js 14 App Router + `'use client'` directives.
- **Backward compatibility**: removing dev secret fallbacks shifts dev failures earlier (boot-time `undefined` instead of silent default). This is intentional — `.env.example` is the source of truth; dev environments should populate `.env` from it.

---

## 5. Architecture Context

**Modules affected**: `auth`, `users`, `security`, `common` (backend); `lib`, `components/auth`, `components/profile` (frontend); `data-model.md`, `workflow-standards.mdc`, `.env.example`, `package.json` (config/docs).

**Components per Tier-1 item**:

| Item | Layer | Component | File |
|------|-------|-----------|------|
| T1-A · V2.10.1 | Backend config | 3 config sites | `src/config/auth.config.ts:5`, `src/common/services/crypto.service.ts:13`, `src/security/security.config.ts:51` |
| T1-B · SS-01+SS-02 | Backend service | Avatar fetch | `src/users/users.service.ts:946-960` |
| T1-C · D-09 | Docs | Data model | `ai-specs/specs/data-model.md` (per-entity Cascade Behavior) |
| T1-D · V4.3.1 | Backend service | Admin update guard | `src/users/users.service.ts:773` |
| T1-E · EM-07 | Backend guards | Setup-token guards | `src/auth/guards/mfa-setup.guard.ts:31,41,47` + `jwt-or-mfa-setup.guard.ts:35` |
| T1-F · EM-08+EM-10 | Backend catalog | Error messages | `src/common/constants/error-messages.ts` + 6 callsite files |
| T1-G · T-13 | Config | Jest thresholds | `nexacore-api/package.json:137-143` |
| T1-H · B-07 | Config | Env example | `nexacore-api/.env.example:11` |
| T1-I · FE-01 | Frontend lib | Dead OAuth helper | `nexacore-dashboard/src/lib/oauth-api.ts:14` |
| T1-J · DEP-07 | Audit annotation | CI workflows | (already-satisfied — completion-report update only) |
| T1-K · T-12 | Config | Jest restoreMocks | `nexacore-api/package.json` jest block |
| T1-L · DC-06 | Framework docs | Workflow standards | `ai-specs/specs/workflow-standards.mdc §8` |
| T1-M · FE-25 | Frontend lib + 4 components | Email regex | `nexacore-dashboard/src/lib/validation.ts` (extract) + 4 component files |
| T1-N · TS-06 | Backend service typings | 2 methods | `src/auth/trusted-device.service.ts:148`, `src/auth/login-security.service.ts logAudit` |
| T1-O · DC-04 | Framework docs | Workflow standards | `ai-specs/specs/workflow-standards.mdc §2` |

**Modified shared modules**: none — all changes are intra-module.

---

## 6. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch.
- **Branch naming**: `feature/SCRUM-433-fullstack` (required — must not piggyback on another ticket's branch).
- **Implementation steps**:
  1. Ensure on `main`: `git checkout main`
  2. Pull: `git pull origin main`
  3. Create: `git checkout -b feature/SCRUM-433-fullstack`
  4. Verify: `git branch` shows the new branch active.
- **Notes**: per `workflow-standards.mdc §2 Branch Lifecycle`.

### Step 1: T1-A · Remove dev-secret fallbacks (CRITICAL · V2.10.1)

- **Files**:
  1. `nexacore-api/src/config/auth.config.ts:5` — replace `process.env.JWT_SECRET || 'default-dev-secret-change-in-production'` with `process.env.JWT_SECRET` (TypeScript optional). Add a runtime check at module load — see implementation note below.
  2. `nexacore-api/src/common/services/crypto.service.ts:13-14` — replace `process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-in-production-32ch'` with `process.env.MFA_ENCRYPTION_KEY`. Throw if undefined.
  3. `nexacore-api/src/security/security.config.ts:51` — change the `else` branch from `return 'dev-csrf-secret-change-in-production-min32chars'` to `throw new Error('CSRF_SECRET must be set and at least 32 characters (no dev fallback)')`.
- **Implementation note**: `validate-production-secrets.ts` already throws on missing/default in production. The change here makes the same behavior apply to ALL environments — dev included. Update `.env.example` to be the source of truth, and ensure local `.env` files populate JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET with non-default values (the audit standards prefer "fail fast on missing env"; current dev-fallback pattern fails late and silently).
- **Dependencies**: none new.
- **Acceptance**: `grep -rEn "'default-dev-secret|'dev-mfa-key-change|'dev-csrf-secret"` returns **only** matches in `validate-production-secrets.ts` (which legitimately uses the literals as known-bad values to reject) and `.spec.ts` files (which set the literals in tests).

### Step 2: T1-B · Avatar fetch hostname allowlist (CRITICAL+HIGH · SS-01+SS-02)

- **File**: `nexacore-api/src/users/users.service.ts:946-970`
- **Action**: Add hostname allowlist + HTTPS-only check at the top of `downloadAndStoreAvatar` before the `fetch(externalUrl)` call.
- **Function signature** (unchanged): `private async downloadAndStoreAvatar(externalUrl: string, userId: string): Promise<string | null>`
- **Implementation steps**:
  1. Define a module-level constant: `const AVATAR_URL_ALLOWLIST = ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'];`
  2. At the top of the method: `const url = new URL(externalUrl);` (wrap in try/catch — invalid URL → return null).
  3. Validate `url.protocol === 'https:'` → return null if not.
  4. Validate `AVATAR_URL_ALLOWLIST.includes(url.hostname)` → return null if not.
  5. Optionally log the rejection via `auditService` with action `OAUTH_LOGIN` and metadata `{ avatarRejectedReason: 'hostname-not-allowlisted'|'scheme-not-https' }` (use existing AuditAction values, do not create a new one — that's Tier-2 scope).
- **Dependencies**: none new (URL is global).
- **Acceptance**: existing OAuth login tests still pass (Google/GitHub profile URLs match allowlist); attempted attacker-supplied URLs return null.

### Step 3: T1-C · Document onDelete: Cascade behavior (CRITICAL · D-09)

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Add a "### Cascade Behavior" subsection to the User entity (line 69+) listing the 6 dependents that are deleted when a User row is deleted, plus a subsection to the Permission entity (line 306+) listing the 1 dependent (RolePermission).
- **Content per entity**:
  - For User: enumerate Session, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, OAuthAccount. State the GDPR/right-to-erasure rationale: user-data deletion path.
  - For Permission: enumerate RolePermission. State the rationale: removing a permission must un-grant it from all roles.
- **Implementation note**: docs only; no code change.

### Step 4: T1-D · Admin self-modification check (HIGH · V4.3.1)

- **File**: `nexacore-api/src/users/users.service.ts:773-778` (top of `adminUpdateUser`)
- **Action**: Add early `if` guard rejecting admin-on-self.
- **Code snippet** (insert before the existing `await this.findById(targetId)` call):
  ```typescript
  if (actingUser.id === targetId) {
    throw new ForbiddenException(ErrorMessages.permission.ACCESS_DENIED);
  }
  ```
- **Acceptance**: a new unit test in `users.service.spec.ts` asserts ForbiddenException when `actingUser.id === targetId`. Existing tests still pass.

### Step 5: T1-E · Collapse MfaSetupGuard messages (HIGH · EM-07)

- **Files**:
  - `nexacore-api/src/auth/guards/mfa-setup.guard.ts:31,41,47`
  - `nexacore-api/src/auth/guards/jwt-or-mfa-setup.guard.ts:35`
- **Action**: Replace each `throw new UnauthorizedException('<distinct message>')` with `throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)`. Import `ErrorMessages` if not already.
- **Acceptance**: all 4 throws emit identical client-facing message; per CWE-200/203 same error regardless of which validation step failed.

### Step 6: T1-F · Centralize inline error strings (HIGH+MEDIUM · EM-08+EM-10)

- **Files**:
  - `nexacore-api/src/common/constants/error-messages.ts` — add 4 new entries:
    - `user.EMAIL_CHANGE_NOT_AVAILABLE = 'Email change not available for OAuth accounts'`
    - `user.EMAIL_UNCHANGED = 'New email must be different from current email'`
    - `user.PASSWORD_CONFIRMATION_REQUIRED = 'Password confirmation required for local accounts'`
    - `user.AVATAR_REQUIRED = 'Avatar file is required'`
  - `nexacore-api/src/auth/token.service.ts:281` — `'Invalid setup token'` → `ErrorMessages.mfa.INVALID_TOKEN`
  - `nexacore-api/src/users/users.service.ts:741` — duplicate breach message → `ErrorMessages.auth.PASSWORD_BREACHED`
  - `nexacore-api/src/users/users.service.ts:1031` → `ErrorMessages.user.EMAIL_CHANGE_NOT_AVAILABLE`
  - `nexacore-api/src/users/users.service.ts:1047` → `ErrorMessages.user.EMAIL_UNCHANGED`
  - `nexacore-api/src/users/users.service.ts:1129` → `ErrorMessages.user.PASSWORD_CONFIRMATION_REQUIRED`
  - `nexacore-api/src/users/users.controller.ts:90` → `ErrorMessages.user.AVATAR_REQUIRED`
- **Acceptance**: `grep -rEn "throw new \w+Exception\(['\"]" src/` returns only matches inside `error-messages.ts` (the catalog itself) and validate-production-secrets.ts (where literal exception messages are intentional fatal-error strings).

### Step 7: T1-G · Raise jest coverage thresholds (HIGH · T-13)

- **File**: `nexacore-api/package.json:137-143`
- **Action**: Replace `{ "branches": 80, "functions": 85, "lines": 90, "statements": 90 }` with `{ "branches": 85, "functions": 90, "lines": 90, "statements": 90 }`.
- **Acceptance**: `npx jest --coverage` passes thresholds across the whole codebase (not only auth-scoped). If a non-auth module is below threshold, raising auth-scoped only is acceptable per audit-standards but document the deviation.

### Step 8: T1-H · Remove API_URL from .env.example (HIGH · B-07)

- **File**: `nexacore-api/.env.example:11`
- **Action**: Delete the line `API_URL="http://localhost:3000"`.
- **Acceptance**: `grep -n 'API_URL' .env.example` returns 0 matches; `grep -rE 'process\.env\.API_URL' src/` returns 0 matches (re-confirms no consumer).

### Step 9: T1-I · Delete dead getLinkedProviders (HIGH · FE-01)

- **File**: `nexacore-dashboard/src/lib/oauth-api.ts:14-16`
- **Action**: Delete the 3-line function `export function getLinkedProviders(): Promise<LinkedProvider[]>`.
- **Implementation steps**:
  1. Remove the function from `oauth-api.ts`.
  2. Remove the `LinkedProvider` import from line 2 if no other reference.
  3. `grep -rE 'getLinkedProviders' src/ tests/` must return 0 matches.
- **Acceptance**: frontend build and jest pass.

### Step 10: T1-J · Confirm CI uses npm ci (HIGH · DEP-07) — NO CODE CHANGE

- **Action**: Verify (already verified during /enrich-us) all `.github/workflows/*.yml` use `npm ci`. Update `auth-completion-report.md §11.4` Risk Register to re-classify DEP-07 as RESOLVED — to be done in Step 19 (documentation update).
- **Acceptance**: `grep -rE 'npm install\b' .github/workflows/`: 0 matches. `grep -rE 'npm ci\b' .github/workflows/`: ≥1 match per workflow that installs.

### Step 11: T1-K · Enable global jest restoreMocks (MEDIUM · T-12)

- **File**: `nexacore-api/package.json` (jest config block, around line 144 after `coverageThreshold`)
- **Action**: Add property `"restoreMocks": true` to the jest config block.
- **Acceptance**: `npx jest --testPathPatterns=src/auth/tests/(hash-token|audit-log.helper|rate-limiting|parse-duration|brute-force|timing-attack|pkce-authenticate)` passes (the 7 specs that had no `afterEach` cleanup).

### Step 12: T1-L · Document audit-vs-workflow taxonomy mapping (MEDIUM · DC-06)

- **File**: `ai-specs/specs/workflow-standards.mdc §8 Deviation Classification System` (line 248+)
- **Action**: Add a "### Mapping to audit-standards.mdc taxonomy" subsection after the existing categories table. Include a bidirectional table mapping the 6 workflow categories to the 3 audit categories (Justified / Process / Unjustified).
- **Suggested mapping**:
  - Accepted-Trivial → Process (no risk)
  - Accepted-Quality → Justified (technical/quality trade-off documented)
  - Accepted-Risk → Justified IF user-approved, else Unjustified
  - Deferred → Process (scope decision)
  - Pre-existing → Process (out of ticket scope)
  - Scope-Gap → Unjustified

### Step 13: T1-M · Align frontend email regex (MEDIUM · FE-25)

- **Files**:
  - `nexacore-dashboard/src/lib/validation.ts` — add `export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);`
  - `nexacore-dashboard/src/components/auth/RegisterForm.tsx:20-21` — replace inline regex with `import { isValidEmail } from "@/lib/validation";`
  - `nexacore-dashboard/src/components/auth/LoginForm.tsx:28-29` — same
  - `nexacore-dashboard/src/components/profile/ChangeEmailForm.tsx:14` — remove local `EMAIL_REGEX`; import shared
  - `nexacore-dashboard/src/components/profile/ProfileForm.tsx:34` — same
- **Acceptance**: `grep -rE "\^\[\^\\\\s@\]\+@" src/` returns matches only in `validation.ts`.

### Step 14: T1-N · Explicit return types (LOW · TS-06)

- **Files**:
  - `nexacore-api/src/auth/trusted-device.service.ts:148` — add return type to `async listTrustedDevices(userId: string)`. Inspect existing usages to determine the concrete type (likely `Promise<TrustedDeviceListItem[]>` or similar).
  - `nexacore-api/src/auth/login-security.service.ts` — add `: void` (or `: Promise<void>` if async) to `logAudit(...)`.
- **Note**: `generateMfaToken` is **already** `: string` (verified live); dropped from scope.

### Step 15: T1-O · Document DTO-implicit-in-controller convention (MEDIUM · DC-04 partial)

- **File**: `ai-specs/specs/workflow-standards.mdc §2 Branch Lifecycle` (Definition of DONE subsection, line 56+)
- **Action**: Add a sentence: *"A record's controller mention implicitly covers DTOs co-located with that controller, unless the record lists DTOs explicitly. This excludes such DTOs from the Phase 7 DC-04 orphan check."*
- **Acceptance**: docs-only.

### Step 16: Run tests + coverage

- **Action**:
  1. `cd nexacore-api && npx jest --testPathPatterns=src/auth --coverage --maxWorkers=2 --forceExit` — must exit 0; coverage ≥ 85/90/90/90.
  2. `npx jest --maxWorkers=2 --forceExit` — full suite must pass (no regression from raising thresholds).
  3. `cd ../nexacore-dashboard && npm test` — must pass.

### Step 17: Run audit re-check (PDCA "Check")

- **Action**: After all 15 steps land, re-run targeted audit phases:
  1. `/audit auth security` — must show V2.10.1, V4.3.1, EM-07, EM-08, EM-10, SS-01, SS-02 as PASS.
  2. `/audit auth tests` — must show T-12, T-13 as PASS.
  3. `/audit auth code-quality` — must show TS-06 as PASS for the 2 methods.
  4. `/audit auth docs` — must show DC-06 as PASS (mapping documented).

### Step 18: Update technical documentation

- **Action**: Per `documentation-standards.mdc`, review and update:
  - `ai-specs/specs/data-model.md` — Cascade Behavior subsections (already done in Step 3, just verify).
  - `ai-specs/specs/workflow-standards.mdc` — taxonomy mapping + DTO convention (Steps 12 + 15).
  - `ai-specs/changes/auth/audit/audit-2026-05-14T16-58/auth-completion-report.md` — re-classify DEP-07 from WARN → RESOLVED with note about live grep confirmation.
  - No changes to `api-spec.yml` (verified zero contract impact).
  - No changes to `integration-state.md` (no module dependency change).
- **Notes**: Per `documentation-standards.mdc`, all updates in English. Verify via diff before commit.

---

## 7. Implementation Order

1. Step 0 — Branch creation.
2. Step 1 — T1-A dev-secret fallbacks (riskiest — boot semantics; do first to detect early).
3. Step 2 — T1-B avatar SSRF.
4. Step 3 — T1-C cascade docs.
5. Step 4 — T1-D admin self-mod guard.
6. Step 5 — T1-E MfaSetupGuard collapse.
7. Step 6 — T1-F error-messages centralization.
8. Step 7 — T1-G jest thresholds.
9. Step 8 — T1-H .env.example cleanup.
10. Step 9 — T1-I dead-code delete.
11. Step 10 — T1-J CI verification (no code).
12. Step 11 — T1-K restoreMocks.
13. Step 12 — T1-L workflow-standards taxonomy.
14. Step 13 — T1-M frontend email regex.
15. Step 14 — T1-N explicit return types.
16. Step 15 — T1-O DC-04 convention doc.
17. Step 16 — Test + coverage suite.
18. Step 17 — Audit re-check (PDCA).
19. Step 18 — Documentation update.

---

## 8. Testing Checklist

- [ ] `npx jest --maxWorkers=2 --forceExit` — exit 0, 607+ tests pass.
- [ ] `npx jest --coverage` — coverage meets new thresholds (≥85 branches / ≥90 functions / ≥90 lines / ≥90 statements).
- [ ] `npm audit --json` — total vulnerabilities = 0.
- [ ] Frontend `npm test` — all React component tests green; no reference to deleted `getLinkedProviders`.
- [ ] **Regression test checklist (per §3 blast radius)**:
  - [ ] `src/auth/tests/mfa.controller.spec.ts` — passes; message-string assertions updated if any.
  - [ ] `src/users/tests/users.service.spec.ts` — passes; new test for V4.3.1 self-mod rejection added.
  - [ ] `src/users/tests/users.controller.spec.ts` — passes; avatar message reference updated if any.
  - [ ] `src/tests/validate-production-secrets.spec.ts` — passes.
  - [ ] `src/security/tests/security.config.spec.ts` — passes after dev-fallback removal; env var pre-set in test setup.
  - [ ] No frontend test references `getLinkedProviders`.

---

## 9. Error Response Format

No changes. All exceptions continue to flow through `HttpExceptionFilter` which produces:

```json
{
  "success": false,
  "error": { "message": "…", "code": "…", "statusCode": 401 }
}
```

Tier-1 fixes only normalise the `message` field for guards (T1-E) and feature-state errors (T1-F). HTTP status codes remain identical.

---

## 10. Error Handling Patterns (frontend)

- **T1-I (FE-01) deletion** — no UI surface impacted (function had zero callers).
- **T1-M (FE-25) email regex** — the shared `isValidEmail()` returns boolean only. Callers must continue to surface their own error message ("Please enter a valid email") on `false`. No change to error toasts or to the existing `parseErrorResponse()` flow in `lib/api.ts`.
- Backend error normalisation (Steps 5+6) tightens internal messages but flows through `HttpExceptionFilter` to the same JSON envelope — frontend `parseErrorResponse()` requires zero change.

---

## 11. Dependencies

- **None added.** All fixes use existing libraries: `class-validator`, `bcrypt`, `@nestjs/config`, `@nestjs/common`, `URL` global, `jest`.

---

## 12. Notes

- **No API contract change** — `api-spec.yml` untouched, Phase 4 re-run must remain 42↔42.
- **No Prisma migration** — schema untouched.
- **No new env vars** — `.env.example` only LOSES `API_URL` (which had no consumer).
- **Boot-semantics tightening** — removing dev-secret fallbacks (Step 1) means a dev env without populated `.env` will fail to boot. This is intentional per audit V2.10.1 recommendation; document in commit message and PR description.
- **English only** — per `documentation-standards.mdc`, all code comments, error strings, and doc edits in English.
- **One PR, one ticket** — do NOT create sub-PRs; the 18 steps land together in `feature/SCRUM-433-fullstack`. Commit messages reference the check_id (e.g., `fix(auth): remove dev-secret fallback (V2.10.1)`).
- **Out of scope** — Tier 2 (14 items: EM-05, D-11, FE-14, T-06+T-11, DC-01, FE-24, SM-01, SM-03, CX-01, CX-04+CX-05, DU-01+DU-03+DU-04, SD-03, TS-02+TS-05, DC-04 sweep) and Tier 3 (SD-04, Phase 9b Playwright, avatar CDN). Per `workflow-standards.mdc §8`, those would be classified as "Deferred" if encountered during implementation; create separate feature tickets in Sprint 15 planning.

---

## 13. Next Steps After Implementation

1. `/verify SCRUM-433` to produce the verification document with deviation classification.
2. `/commit SCRUM-433` to finalize the commit and open a PR.
3. `/update-docs SCRUM-433` to write the implementation record and update integration-state if any signature changed (expected: no signature changes).
4. Once merged to `main`, re-run `/audit auth full` (or selectively `/audit auth security` + `/audit auth code-quality` + `/audit auth tests`) to confirm 7 WARNs cleared. Re-run `/audit-check` to close the PDCA loop opened by SCRUM-432.

---

## 14. Implementation Verification

- [ ] **Code quality**: ESLint exit 0 across changed files; no `any` introduced.
- [ ] **Functionality**: each Tier-1 item's acceptance bullet satisfied (see per-step acceptance lines).
- [ ] **Testing**: full jest suite green; coverage clears 85/90/90/90; no skipped tests.
- [ ] **Regression**: all files in §3 blast radius verified (imports resolve, tests pass, no broken mocks).
- [ ] **Integration**: auth module bootstrap clean; no new module imports needed; `integration-state.md` unchanged.
- [ ] **Documentation**: data-model.md cascade subsections present; workflow-standards.mdc mapping + DTO convention added; completion-report DEP-07 reclassified.
- [ ] **Out-of-scope discipline**: no Tier-2 or Tier-3 items touched in this PR (would be deviation-Scope-Gap if so).

---

## Frontend section

The 2 frontend-touching items (T1-I, T1-M) are described above in Steps 9 and 13. There is no separate frontend plan because:

1. The scope is small (1 dead-code deletion + 4 component imports updated).
2. No new Next.js routes, no new context, no new API client methods.
3. No design-system change.

If a future Tier-2 item (e.g., FE-14 lockout UX) is brought in scope, a separate fullstack plan will be required.

