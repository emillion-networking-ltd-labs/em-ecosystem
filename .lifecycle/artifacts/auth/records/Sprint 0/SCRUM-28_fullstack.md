# Implementation Record: SCRUM-28 MFA/2FA with TOTP

## Summary

Implemented full TOTP-based Multi-Factor Authentication: AES-256-GCM secret encryption (`CryptoService`), `MfaService` with setup/verify/disable/recovery-code flows, `MfaController` with 6 protected endpoints, two-step login integration in `AuthService`/`AuthController`, Prisma schema migration, and full frontend UI (login TOTP challenge step + profile MFA management card).

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-23-oauth-security-hardening`
- **Implementation date**: 2026-02-27

## Plan Reference

- **Plan**: `ai-specs/changes/plans/SCRUM-28_fullstack.md`
- **Plan followed**: Partially — 4 deviations. All 9 subtasks (SCRUM-64 through SCRUM-72) fully implemented.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| d3c06e7 | feat(SCRUM-28): MFA/2FA with TOTP — backend implementation | 23 files, +1409 lines |
| d8f9654 | feat(SCRUM-28): MFA/2FA with TOTP — frontend implementation | 8 files, +743 lines |

**Backend files created (11):**
- `nexacore-api/prisma/migrations/20260226215701_add_mfa_fields/migration.sql`
- `nexacore-api/src/auth/dto/mfa-disable.dto.ts`
- `nexacore-api/src/auth/dto/mfa-regenerate-codes.dto.ts`
- `nexacore-api/src/auth/dto/mfa-verify-login.dto.ts`
- `nexacore-api/src/auth/dto/mfa-verify-setup.dto.ts`
- `nexacore-api/src/auth/mfa.controller.ts`
- `nexacore-api/src/auth/mfa.service.ts`
- `nexacore-api/src/auth/tests/mfa.service.spec.ts`
- `nexacore-api/src/common/services/crypto.module.ts`
- `nexacore-api/src/common/services/crypto.service.ts`
- `nexacore-api/src/common/services/tests/crypto.service.spec.ts`

**Backend files modified (12):**
- `nexacore-api/package.json` / `package-lock.json` — Added `otplib`, `qrcode`, `@types/qrcode`, `bcrypt`, `@types/bcrypt`
- `nexacore-api/prisma/schema.prisma` — Added `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes` to User model
- `nexacore-api/src/auth/auth.controller.ts` — Added MFA two-step login branching, injected MfaService
- `nexacore-api/src/auth/auth.module.ts` — Added MfaService, MfaController, CryptoModule
- `nexacore-api/src/auth/auth.service.ts` — Added MFA check in `login()`: returns `{ mfaRequired: true, mfaToken }` when MFA enabled
- `nexacore-api/src/auth/tests/auth.service.spec.ts` — Added MFA fields to mockUser/mockOAuthUser
- `nexacore-api/src/auth/tests/jwt.strategy.spec.ts` — Updated mock user with MFA fields
- `nexacore-api/src/auth/tests/oauth-code.store.spec.ts` — Added `mfaEnabled` to mock payload
- `nexacore-api/src/auth/tests/oauth-exchange.spec.ts` — Added `mfaEnabled` to mock user
- `nexacore-api/src/users/entities/user.entity.ts` — Added MFA fields to User entity
- `nexacore-api/src/users/users.service.ts` — Added `updateMfaSetupData`, `enableMfa`, `disableMfa`, `updateRecoveryCodes`

**Frontend files created (2):**
- `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` — 6-digit TOTP input with paste/auto-submit + recovery code fallback
- `nexacore-dashboard/src/components/profile/MfaSetup.tsx` — Multi-view MFA management card (status, setup QR, verify, recovery codes, disable, regenerate)

**Frontend files modified (6):**
- `nexacore-dashboard/package.json` / `package-lock.json` — Added `qrcode.react ^4.2.0`
- `nexacore-dashboard/src/lib/types.ts` — Added `LoginResponse` union, `MfaSetupResponse`, `MfaStatusResponse`
- `nexacore-dashboard/src/context/AuthContext.tsx` — Added `mfaRequired`/`mfaToken` state, `MFA_REQUIRED` reducer action, `verifyMfaLogin`, `cancelMfa`
- `nexacore-dashboard/src/components/auth/LoginForm.tsx` — Added MfaTotpStep gate (`if (mfaRequired) return <MfaTotpStep />`)
- `nexacore-dashboard/src/app/profile/page.tsx` — Added `<MfaSetup />` section

## Deviations from Plan

| # | Planned | Actual | Reason |
|---|---------|--------|--------|
| 1 | `import { authenticator } from 'otplib'` — uses `authenticator.generateSecret()`, `authenticator.keyuri()`, `authenticator.verify({ token, secret })` returning `boolean` | `import { generateSecret, generateURI, verify as otpVerify } from 'otplib'` — uses named exports; `otpVerify()` is async returning `Promise<{ valid: boolean }>` | otplib v4 changed API from class-based `authenticator` to named function exports. `verify` became async. Adapter pattern not needed — named imports are cleaner. |
| 2 | Prisma schema snapshot shows `refreshToken String?` on User model | `refreshToken` field absent — not present in actual schema | Plan snapshot was stale (pre-SCRUM-26). `refreshToken` was removed from the DB in SCRUM-26 (sessions table replaced it). Correct schema followed. |
| 3 | `SafeUser` type includes `Omit<User, ... \| 'refreshToken' \| ...>` | `SafeUser` does not exclude `refreshToken` — field doesn't exist in entity | Consequence of deviation #2. `refreshToken` was never in the entity at implementation time. |
| 4 | Tests use `jest.spyOn(otplib, 'verify')` / `jest.spyOn(authenticator, 'verify')` to mock TOTP verification | `jest.mock('otplib', () => ({ ... }))` factory at module level with a separate `mockVerify` jest.fn() | otplib v4 depends on `@scure/base` which is ESM-only. Jest (CommonJS) cannot transform ESM modules, so `jest.spyOn` on the import fails. Top-level `jest.mock` with a factory avoids the ESM import entirely. |

## Subtask Mapping

| Key | Description | Implemented? |
|-----|-------------|-------------|
| SCRUM-64 | Prisma schema: mfaEnabled, mfaSecret, mfaRecoveryCodes + migration | YES |
| SCRUM-65 | CryptoService: AES-256-GCM encrypt/decrypt for TOTP secrets | YES — also created CryptoModule |
| SCRUM-66 | POST /auth/mfa/setup | YES |
| SCRUM-67 | POST /auth/mfa/verify-setup | YES |
| SCRUM-68 | Login flow: return mfaRequired + mfaToken when MFA enabled | YES |
| SCRUM-69 | POST /auth/mfa/verify-login (TOTP + recovery code) | YES |
| SCRUM-70 | DELETE /auth/mfa + POST /auth/mfa/recovery-codes + GET /auth/mfa/status | YES — all three in MfaController |
| SCRUM-71 | Frontend MFA setup UI on profile page | YES — MfaSetup.tsx |
| SCRUM-72 | Frontend login MFA step | YES — MfaTotpStep.tsx + LoginForm gate |

## Test Results

- **Unit tests**: 191 passed / 0 failed (19 suites)
- **New tests added**: 37 (crypto.service.spec: 10, mfa.service.spec: 17, updated 4 existing suites with MFA user fields)
- **Backend build**: `nest build` — pass
- **Frontend build**: `next build` — pass (profile page +14.8 kB, login page unchanged)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `MfaSetup.tsx` passes `qrCodeDataUrl` (PNG data URL) as `value` to `<QRCodeSVG>` — component would encode the data URL string as a QR code instead of the otpauth:// URL | **HIGH** | Fixed (`a82d286`) | Replaced `<QRCodeSVG value={setupData.qrCodeDataUrl}>` with `<img src={setupData.qrCodeDataUrl} alt="MFA QR Code" width={200} height={200} />`. Removed `qrcode.react` dependency from `package.json`. |

## Documentation Updates

Deferred — same as SCRUM-23 through SCRUM-27. API spec, backend-standards, frontend-standards, and data-model docs will be updated in batch after the SCRUM-22 epic completes.

## Lessons Learned

- **otplib v4 breaking changes**: Named exports replace the `authenticator` object. `verify()` is now async. Always check the installed version's actual API before coding — plan snapshots lag behind package releases.
- **ESM-only dependencies in Jest**: otplib v4 → `@scure/base` is ESM-only. When a package uses ESM, `jest.spyOn` on its imports fails. Use `jest.mock('package', () => factory)` at module level to avoid the import entirely. Check for ESM dependencies before writing tests.
- **Plan schema snapshots go stale quickly**: SCRUM-28 plan still showed `refreshToken` (removed in SCRUM-26). Treat plan snapshots as approximate guides, always cross-check with the actual codebase. Never blindly copy-paste schema from a plan.
- **`QRCodeSVG` vs `<img>`**: `qrcode.react`'s `QRCodeSVG` generates a QR code client-side from a text value (e.g., `otpauth://`). It should NOT receive a pre-rendered `data:image/png` string. When the server already renders the QR code image, use `<img src={dataUrl}>` instead.
