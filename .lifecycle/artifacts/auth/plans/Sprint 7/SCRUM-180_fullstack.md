# Fullstack Implementation Plan: SCRUM-180 Add Trust this device prompt to MFA login flow

## 1. Header

- **Ticket**: SCRUM-180
- **Sprint**: Sprint 7 - Audit Remediation
- **Parent**: SCRUM-174 (Auth Module Audit Epic)
- **Audit Finding**: Phase 9 FE-11 FAIL (HIGH) — MFA verify flow missing "Trust this device" checkbox. Backend supports trustDevice but frontend never offers it.

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-179 (ConfigService migration)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/mfa.controller.ts` — Constructor(MfaService, AuthService) at lines 34-37. `verifyLogin()` method at lines 98-115: calls `mfaService.verifyLoginCode()` then `authService.generateTokensForMfa()`, sets cookie, returns accessToken + user. Does NOT extract fingerprint header. Does NOT call trustedDeviceService.
  - `src/auth/dto/mfa-verify-login.dto.ts` — 3 fields: `mfaToken` (required), `code?` (optional), `recoveryCode?` (optional). NO `trustDevice` field.
  - `src/auth/trusted-device.service.ts` — `trustDevice(userId, fingerprint, ipAddress, userAgent)` at line 33. Fully implemented.
  - `src/auth/auth.controller.ts` — Login endpoint (line 162) reads `req.headers?.['x-device-fingerprint']` and passes to authService.login(). `POST /auth/trusted-devices` (line 582) uses `dto.fingerprint` from body.
  - Frontend `src/context/AuthContext.tsx` — `verifyMfaLogin(code, isRecoveryCode)` at line 283. Sends `{ mfaToken, code?, recoveryCode? }` to `/auth/mfa/verify-login`. Does NOT send trustDevice.
  - Frontend `src/components/auth/MfaTotpStep.tsx` — 316 lines. TOTP 6-digit input + recovery code mode. NO "Trust this device" checkbox. Calls `verifyMfaLogin(codeStr, isRecovery)`.
  - Frontend `src/lib/api.ts` — `deviceFingerprint` stored as private field (line 11). Sent as `X-Device-Fingerprint` header on every request (line 35). Already available during MFA verify call.
  - Frontend `src/lib/fingerprint.ts` — `getFingerprint()` generates browser fingerprint on mount.
- **Constructor signatures verified**:
  - `MfaController(MfaService, AuthService)` — 2 deps. TrustedDeviceService will be 3rd.
- **Methods verified to exist**:
  - `MfaController.verifyLogin()` — line 98
  - `MfaController.extractRequestMeta()` — line 39
  - `TrustedDeviceService.trustDevice()` — line 33
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None

---

## 3. Overview

Wire the existing "Trust this device" backend infrastructure into the MFA login verification flow. The backend `TrustedDeviceService` is fully implemented but never called from the MFA verify-login endpoint. The frontend `MfaTotpStep` component needs a checkbox that triggers device trusting after successful MFA verification.

**Key design decision**: The device fingerprint is already sent as `X-Device-Fingerprint` header on every API request (including the MFA verify call). Therefore, the DTO only needs a `trustDevice?: boolean` flag — no need to add `deviceFingerprint` to the body. The controller reads the header directly, matching the pattern used in the login endpoint.

---

## 4. Architecture Context

- **Modules involved**: AuthModule (MfaController, TrustedDeviceService)
- **Components affected**:
  - Modified: `src/auth/dto/mfa-verify-login.dto.ts` — add `trustDevice` boolean
  - Modified: `src/auth/mfa.controller.ts` — inject TrustedDeviceService, read fingerprint header, call trustDevice()
  - Modified: `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` — add checkbox
  - Modified: `nexacore-dashboard/src/context/AuthContext.tsx` — pass trustDevice to API
  - Modified: `nexacore-api/src/auth/tests/mfa.controller.spec.ts` — test trust device flow
- **API Contract**: `POST /auth/mfa/verify-login` request body gains `trustDevice?: boolean`. Response unchanged. Device fingerprint read from `X-Device-Fingerprint` header (already sent).

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-180-fullstack` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-180-fullstack`

---

### BACKEND

---

### Step 1: Update MfaVerifyLoginDto

- **File**: `nexacore-api/src/auth/dto/mfa-verify-login.dto.ts`
- **Action**: Add `trustDevice` optional boolean field
- **Implementation Steps**:
  1. Add imports: `IsBoolean` from `class-validator`
  2. Add field after `recoveryCode`:
     ```typescript
     @ApiPropertyOptional({
       description: 'Mark this device as trusted to skip MFA on future logins (30 days)',
       default: false,
     })
     @IsOptional()
     @IsBoolean()
     trustDevice?: boolean;
     ```
- **Implementation Notes**: No `deviceFingerprint` field needed — it's already in the `X-Device-Fingerprint` header sent by the frontend on every request.

### Step 2: Update MfaController.verifyLogin()

- **File**: `nexacore-api/src/auth/mfa.controller.ts`
- **Action**: Inject TrustedDeviceService, read fingerprint header, call trustDevice() after successful MFA verification
- **Implementation Steps**:
  1. Add import: `TrustedDeviceService` from `./trusted-device.service`
  2. Add `TrustedDeviceService` as 3rd constructor dependency:
     ```typescript
     constructor(
       private readonly mfaService: MfaService,
       private readonly authService: AuthService,
       private readonly trustedDeviceService: TrustedDeviceService,
     ) {}
     ```
  3. In `verifyLogin()` method, after the `res.cookie()` line (line 112), add trust device logic:
     ```typescript
     // Trust device (fire-and-forget — failure must not block login)
     if (dto.trustDevice) {
       const fingerprint = req.headers?.['x-device-fingerprint'];
       if (fingerprint) {
         this.trustedDeviceService
           .trustDevice(user.id, fingerprint, meta.ipAddress, meta.userAgent)
           .catch(() => {});
       }
     }
     ```
  4. Note: The `user` variable comes from `mfaService.verifyLoginCode()` return — destructured at line 103.
- **Implementation Notes**:
  - Fire-and-forget pattern (`.catch(() => {})`) ensures trust failure never blocks login.
  - Fingerprint header read mirrors the pattern in `auth.controller.ts` login endpoint (line 162).
  - `TrustedDeviceService` is already provided by AuthModule — no module changes needed.

### Step 3: Update Backend Tests

- **File**: `nexacore-api/src/auth/tests/mfa.controller.spec.ts`
- **Action**: Add TrustedDeviceService mock, add test cases for trust device
- **Implementation Steps**:
  1. Add `trustedDeviceService` mock to the test setup:
     ```typescript
     let trustedDeviceService: { trustDevice: jest.Mock };
     ```
  2. In `beforeEach`, initialize:
     ```typescript
     trustedDeviceService = { trustDevice: jest.fn().mockResolvedValue({ id: 'device-1' }) };
     ```
  3. Add `TrustedDeviceService` provider to TestingModule (or direct instantiation — match existing pattern)
  4. Add test cases:
     - `'should trust device when trustDevice=true and fingerprint header present'` — verify `trustedDeviceService.trustDevice` called with correct args
     - `'should not trust device when trustDevice is false or omitted'` — verify `trustedDeviceService.trustDevice` NOT called
     - `'should not trust device when fingerprint header is missing'` — verify NOT called even with `trustDevice=true`
     - `'should not block login when trust device fails'` — mock `trustDevice` to reject, verify login still returns tokens

---

### FRONTEND

---

### Step 4: Update AuthContext.verifyMfaLogin()

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Add `trustDevice` parameter to verifyMfaLogin
- **Implementation Steps**:
  1. Update `AuthContextType` interface (line 83):
     ```typescript
     verifyMfaLogin: (code: string, isRecoveryCode?: boolean, trustDevice?: boolean) => Promise<void>;
     ```
  2. Update function signature (line 283):
     ```typescript
     const verifyMfaLogin = useCallback(async (code: string, isRecoveryCode = false, trustDevice = false) => {
     ```
  3. Update body construction (after line 290):
     ```typescript
     const body: Record<string, string | boolean> = { mfaToken: state.mfaToken! };
     if (isRecoveryCode) {
       body.recoveryCode = code;
     } else {
       body.code = code;
     }
     if (trustDevice) {
       body.trustDevice = true;
     }
     ```
  4. Update `useCallback` dependencies if needed (line 310) — `trustDevice` is a parameter, not state, so no dependency change needed.

### Step 5: Add Trust Device Checkbox to MfaTotpStep

- **File**: `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx`
- **Action**: Add "Trust this device for 30 days" checkbox in both TOTP and recovery code views
- **Implementation Steps**:
  1. Add state (after line 19):
     ```typescript
     const [trustDevice, setTrustDevice] = useState(false);
     ```
  2. Update `handleVerify` callback to pass `trustDevice` (line 28-37):
     ```typescript
     const handleVerify = useCallback(
       async (codeStr: string, isRecovery: boolean) => {
         try {
           await verifyMfaLogin(codeStr, isRecovery, trustDevice);
         } catch (err) {
           if (err instanceof RateLimitError) {
             setRateLimit(err.retryAfter, err.message);
           }
         }
       },
       [verifyMfaLogin, setRateLimit, trustDevice],
     );
     ```
  3. Add checkbox UI in the **TOTP view** — insert between the error/rate-limit section and the "Use recovery code" link (after line 270, before line 272):
     ```tsx
     {/* Trust device checkbox */}
     <label className="flex cursor-pointer items-center gap-2">
       <input
         type="checkbox"
         checked={trustDevice}
         onChange={(e) => setTrustDevice(e.target.checked)}
         className="h-4 w-4 rounded border-border-default accent-surface-inverse"
       />
       <span className="text-sm leading-[21px] text-content-primary/75">
         Trust this device for 30 days
       </span>
     </label>
     ```
  4. Add the same checkbox in the **recovery code view** — insert between the error section and the "Use authenticator app" link (after line 162, before line 164):
     ```tsx
     {/* Trust device checkbox */}
     <label className="flex cursor-pointer items-center gap-2">
       <input
         type="checkbox"
         checked={trustDevice}
         onChange={(e) => setTrustDevice(e.target.checked)}
         className="h-4 w-4 rounded border-border-default accent-surface-inverse"
       />
       <span className="text-sm leading-[21px] text-content-primary/75">
         Trust this device for 30 days
       </span>
     </label>
     ```
  5. The checkbox state persists when switching between TOTP and recovery code modes (shared `trustDevice` state).

### Step 6: Update Frontend Tests

- **File**: `nexacore-dashboard/tests/components/auth/MfaTotpStep.test.tsx` (NEW)
- **Action**: Create basic test for trust device checkbox
- **Implementation Steps**:
  1. Create test file following `LoginForm.test.tsx` patterns (mock useAuth, useRateLimit, etc.)
  2. Test cases:
     - `'renders trust device checkbox unchecked by default'`
     - `'passes trustDevice=true to verifyMfaLogin when checkbox is checked'`
     - `'passes trustDevice=false to verifyMfaLogin when checkbox is unchecked'`
     - `'checkbox persists state when switching to recovery code mode'`

### Step 7: Update Technical Documentation

- **Action**: Update api-spec.yml and integration-state.md
- **Implementation Steps**:
  1. Update `ai-specs/specs/api-spec.yml` — add `trustDevice` boolean to MFA verify-login request schema
  2. Update `ai-specs/specs/integration-state.md`:
     - MfaController Services Injected: add TrustedDeviceService
     - Test Mock Requirements: add TrustedDeviceService to MfaController mocks
     - Changelog entry

---

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update MfaVerifyLoginDto (add `trustDevice` field)
3. Step 2: Update MfaController.verifyLogin() (inject TrustedDeviceService, wire trust logic)
4. Step 3: Update backend tests
5. Step 4: Update AuthContext.verifyMfaLogin() (add `trustDevice` parameter)
6. Step 5: Add checkbox to MfaTotpStep (both TOTP and recovery views)
7. Step 6: Create frontend test for checkbox
8. Step 7: Update documentation

---

## 7. Testing Checklist

- [ ] `POST /auth/mfa/verify-login` with `trustDevice: true` + `X-Device-Fingerprint` header → device trusted in DB
- [ ] `POST /auth/mfa/verify-login` with `trustDevice: false` or omitted → no device trusted
- [ ] `POST /auth/mfa/verify-login` with `trustDevice: true` but no fingerprint header → login succeeds, no trust
- [ ] Trust device failure does not block login
- [ ] MfaTotpStep renders checkbox unchecked by default
- [ ] Checkbox visible in both TOTP and recovery code modes
- [ ] Checkbox state persists when switching modes
- [ ] All existing backend tests pass (829+)
- [ ] All existing frontend tests pass (71+)
- [ ] Build clean (backend + frontend)

---

## 8. Error Response Format

No new error responses. The `trustDevice` functionality is fire-and-forget — it either silently succeeds or silently fails. The MFA verify-login response format is unchanged.

---

## 9. Dependencies

- No new dependencies needed (both backend and frontend)

---

## 10. Notes

- **Fingerprint already in header**: The frontend `apiClient` sends `X-Device-Fingerprint` on every request. No need to duplicate it in the DTO body. This is simpler and consistent with the login endpoint pattern.
- **Fire-and-forget**: Trust device must never block or fail the MFA login. Use `.catch(() => {})` pattern.
- **TrustedDeviceService already in AuthModule**: No module import changes needed — it's already a provider in AuthModule.
- **30-day TTL**: Matches `TRUSTED_DEVICE_TTL_DAYS = 30` constant. Checkbox label reflects this.
- **Auto-submit on 6th digit**: The TOTP auto-submit (line 55-60) will use the current `trustDevice` state at the time of submission. This is correct because React state updates are synchronous within the same render.

---

## 11. Next Steps After Implementation

- Run `/update-docs SCRUM-180` to create implementation record
- Commit and create PR
- Continue to next Sprint 7 ticket

---

## 12. Implementation Verification

- [ ] `MfaVerifyLoginDto` has `trustDevice?: boolean` with IsOptional + IsBoolean decorators
- [ ] `MfaController` constructor has TrustedDeviceService as 3rd dependency
- [ ] `verifyLogin()` reads `X-Device-Fingerprint` header and calls `trustDevice()` when flag is true
- [ ] Trust device is fire-and-forget (`.catch(() => {})`)
- [ ] MfaTotpStep has checkbox in both TOTP and recovery code views
- [ ] AuthContext.verifyMfaLogin() accepts and passes `trustDevice` parameter
- [ ] Backend tests cover trust=true, trust=false, no-fingerprint, and trust-failure scenarios
- [ ] Frontend test verifies checkbox renders and toggles
- [ ] api-spec.yml updated
- [ ] integration-state.md updated
