# Implementation Record: SCRUM-107 Device Fingerprinting + Trusted Devices

## Summary

Implemented server-side device fingerprinting and trusted device management within the AuthModule. Users who verify via MFA can mark their device as trusted, skipping MFA on subsequent logins for a configurable period (default 30 days). Fingerprints are stored as salted HMAC-SHA256 hashes.

- **Scope**: backend
- **Branch**: `feature/SCRUM-107-backend`
- **Implementation date**: 2026-03-03

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/Sprint 3/SCRUM-107_backend.md`
- **Plan was followed**: Partially (minor deviations documented below)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `53d19f9` | feat(SCRUM-107): add device fingerprinting and trusted device management | 16 files: schema.prisma, trusted-device.service.ts (NEW), trust-device.dto.ts (NEW), auth.controller.ts, auth.service.ts, auth.module.ts, mfa.service.ts, users.service.ts, auth.constants.ts, audit-action.enum.ts, + 6 test files |

## Deviations from Plan

| Step | Planned | Actual | Reason |
|------|---------|--------|--------|
| Step 4 | Service at `src/auth/services/trusted-device.service.ts` | Service at `src/auth/trusted-device.service.ts` (root of auth/) | Consistent with existing auth module layout — `MfaService` and other services sit directly in `src/auth/`, not in a `services/` subfolder |
| Step 4 | `TrustedDeviceService` depends on `PrismaService`, `CryptoService`, `AuditService` | Depends on `PrismaService` and `AuditService` only (no CryptoService) | HMAC-SHA256 hashing uses Node.js built-in `crypto.createHmac()` directly, no need for CryptoService (CryptoService handles AES encryption, not hashing) |
| Step 4 | `parseDeviceName` initial implementation with OS detection order: Windows, macOS, Linux, Android, iOS | Fixed to: Android, iOS, Windows, macOS, Linux | Android UAs contain "Linux" and iOS UAs contain "Mac OS X" — original order caused misdetection. Caught by unit tests and fixed in same commit |
| Step 6 | Pass fingerprint through `ctx` / `RequestContext` interface modification | Pass fingerprint as separate 4th parameter to `login()` | Cleaner API — fingerprint is not part of the audit context. Extracted from `X-Device-Fingerprint` header in controller and passed directly |
| Step 7 | `listTrustedDevices` returns `isCurrent` flag (comparing fingerprintHash) | Returns list without `isCurrent` flag | Simplified — the `isCurrent` flag would require passing the current fingerprint through the GET endpoint, adding unnecessary complexity. Can be added later if needed by the frontend |

## Test Results

- **Overall**: 594 tests pass, 37 suites
- **Coverage**: stmts 98.5%, branches 87.01%, funcs 92.44%, lines 98.65%
- **New tests**: 36 (30 in trusted-device.service.spec.ts, 3 in auth.service.spec.ts, 6 in auth.controller.spec.ts, minus shared mock updates)
- **Unit tests**: 594 passed / 0 failed
- **Integration tests**: N/A (unit tests only)
- **Manual verification**: N/A (no running server — verified via build and test suite)
- **Tests skipped**: None

### Test files modified/created:

| File | Tests Added | Purpose |
|------|-------------|---------|
| `trusted-device.service.spec.ts` (NEW) | 30 | Full coverage: hashFingerprint, trustDevice, isTrustedDevice, listTrustedDevices, revokeDevice, revokeAllDevices, parseDeviceName |
| `auth.service.spec.ts` | 3 | MFA skip on trusted device, MFA challenge on untrusted, MFA challenge with no fingerprint |
| `auth.controller.spec.ts` | 6 | trustDevice, listTrustedDevices, revokeAllTrustedDevices, revokeTrustedDevice (success + NotFoundException) |
| `mfa.service.spec.ts` | 0 (mock added) | TrustedDeviceService mock to prevent constructor failure |
| `users.service.spec.ts` | 0 (mock + assertion) | TrustedDeviceService mock + changePassword cascade assertion |
| `oauth-exchange.spec.ts` | 0 (mock added) | TrustedDeviceService mock to prevent TestingModule failure |

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `parseDeviceName` OS detection order — Android detected as "Linux", iOS as "macOS" | MEDIUM | Fixed | Reordered OS detection checks: Android/iOS before Linux/macOS in `trusted-device.service.ts` |
| Missing TrustedDeviceService mock in `oauth-exchange.spec.ts` | LOW | Fixed | Added mock provider to TestingModule — dependency introduced by adding TrustedDeviceService to AuthController constructor |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/data-model.md` | Added TrustedDevice entity #19 (10 fields), `trustedDevices` relation to User, DEVICE_TRUSTED/DEVICE_UNTRUSTED to AuditAction enum, Prisma schema section updated |
| `ai-specs/specs/api-spec.yml` | Added 4 new endpoints under `/auth/trusted-devices` with full OpenAPI spec (POST, GET, DELETE all, DELETE /:id) |
| `ai-specs/specs/integration-state.md` | Updated AuthModule exports, AuthController services (5th dep), 4 new method guard entries, test mock requirements, service dependency chains, changelog entry |

## Lessons Learned

- **OS detection order matters**: User-Agent strings for mobile platforms contain desktop OS substrings (Android contains "Linux", iOS contains "Mac OS X"). Always check mobile platforms first in User-Agent parsing logic.
- **Test mock propagation**: Adding a new service to a controller constructor requires updating mocks in ALL test files that create a TestingModule with that controller — not just the direct service test. The `oauth-exchange.spec.ts` was affected even though it doesn't test trusted devices.
- **forwardRef consistency**: The circular dependency pattern (UsersModule ↔ AuthModule via forwardRef) is well-established — adding TrustedDeviceService to UsersService followed the exact same `@Inject(forwardRef(() => ...))` pattern as PasswordBreachService.
- **Route ordering**: NestJS evaluates route handlers top-to-bottom. `DELETE /trusted-devices` (revoke all) must be defined BEFORE `DELETE /trusted-devices/:id` to prevent `:id` from matching the empty string.
