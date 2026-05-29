# SCRUM-281: MFA Setup Onboarding Flow for Admin/Superadmin Users — PLAN

**Status**: Planning Complete
**Module**: auth
**Sprint**: 13 (Dashboard Shell)
**Date Planned**: 2026-03-18
**Implementation Pattern**: Enterprise-grade (GitHub/AWS/Okta model)

---

## 1. Problem Statement

**Current Blocker**: ADMIN and SUPERADMIN users without MFA cannot authenticate. Backend returns `mfaSetupRequired: true` but frontend has no handler, creating a deadlock.

**Root Cause**:
- MFA is mandatory for ADMIN/SUPERADMIN roles
- Users without MFA cannot get a full JWT
- Without JWT, users cannot call `/auth/mfa/setup` endpoint
- No intermediate authentication mechanism exists

**User Impact**: ADMIN/SUPERADMIN users cannot access the system even with correct credentials.

---

## 2. Solution Architecture

### Approach: Scope-Limited Tokens (Enterprise Pattern)

**Pattern Reference**: GitHub, AWS, Okta use this model for MFA enrollment:
1. User authenticates with password
2. System issues **temporary scope-limited token** (10 min expiry)
3. Token grants ONLY MFA setup permission
4. User completes MFA setup flow
5. User re-authenticates with MFA for full session

**Why This Works**:
- No deadlock (user CAN proceed without full auth)
- No privilege escalation (token is time-limited, scope-limited)
- Professional UX (guided setup flow)
- Consistent (reuses existing MFA endpoints)

---

## 3. Backend Implementation Strategy

### Phase 1: Token Service Enhancement

**File**: `nexacore-api/src/auth/token.service.ts`

**Changes**:
1. Add `mfaSetupSecret` field (HMAC-derived from main JWT secret)
2. Initialize in constructor:
   ```typescript
   this.mfaSetupSecret = crypto
     .createHmac('sha256', jwtSecret)
     .update(MFA_SETUP_HMAC_LABEL)
     .digest('hex');
   ```
3. Add `signMfaSetupToken(userId: string): string` method
   - Creates JWT with `type: 'mfa-setup'`
   - Expires in 10 minutes
   - Uses mfaSetupSecret (not main JWT secret)

4. Add `verifyMfaSetupToken(token: string): { sub: string }` method
   - Validates token signature with mfaSetupSecret
   - Checks token type === 'mfa-setup'
   - Throws if invalid/expired

**Constants**: `nexacore-api/src/auth/constants/auth.constants.ts`
- `MFA_SETUP_HMAC_LABEL = 'mfa-setup-token'`
- `MFA_SETUP_TOKEN_TYPE = 'mfa-setup'`
- `MFA_SETUP_EXPIRY = '10m'`

**Rationale**: Separate HMAC secret ensures setup tokens cannot be reused as general JWTs.

---

### Phase 2: Login Service Integration

**File**: `nexacore-api/src/auth/login.service.ts`

**Changes**:
1. Modify `handleMfaSetupRequired(user: User)` method:
   - Call `tokenService.signMfaSetupToken(user.id)`
   - Return `{ mfaSetupRequired: true, setupToken, message }`

2. Add audit event: `LOGIN_SUCCESS` with `mfaSetupRequired: true` metadata

**Rationale**: Login flow explicitly emits setup token so frontend can begin MFA setup.

---

### Phase 3: Authentication Guards

**Files**:
- `nexacore-api/src/auth/guards/mfa-setup.guard.ts` (NEW)
- `nexacore-api/src/auth/guards/jwt-or-mfa-setup.guard.ts` (NEW)

**MfaSetupGuard**:
- Extracts token from Authorization header
- Validates using `tokenService.verifyMfaSetupToken()`
- Returns SafeUser on success
- Throws UnauthorizedException if invalid

**JwtOrMfaSetupGuard** (Composite):
- Tries standard JwtAuthGuard first
- If fails, tries MfaSetupGuard
- Returns SafeUser if either succeeds
- Enables both modes (onboarding + settings)

**Applied To**:
- `POST /auth/mfa/setup`
- `POST /auth/mfa/verify-setup`

**Rationale**: Dual-mode auth allows both new users (setup token) and existing users (full JWT) to use same endpoints.

---

### Phase 4: Module Registration

**File**: `nexacore-api/src/auth/auth.module.ts`

**Changes**:
- Import `MfaSetupGuard`, `JwtOrMfaSetupGuard`
- Export `TokenService` for guard injection
- Register guards in provider array

---

## 4. Frontend Implementation Strategy

### Phase 1: Type Updates

**File**: `nexacore-dashboard/src/lib/types.ts`

**Changes**:
```typescript
export type LoginResponse =
  | AuthResponse
  | { mfaRequired: true; mfaToken: string }
  | { mfaSetupRequired: true; setupToken: string; message: string };  // ← New
```

**Rationale**: Type system reflects both MFA flows (challenge vs setup).

---

### Phase 2: AuthContext State Management

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

**New State Fields**:
```typescript
mfaSetupRequired: boolean;
mfaSetupToken: string | null;
```

**New Action Type**:
```typescript
{ type: "MFA_SETUP_REQUIRED"; payload: { setupToken: string } }
```

**Reducer Logic**:
- `MFA_SETUP_REQUIRED` action sets state fields
- Routes to MFA setup flow instead of MFA challenge

**New Methods**:
1. `setupMfa()`
   - POST to `/auth/mfa/setup`
   - Pass setupToken in Authorization header: `Bearer <setupToken>`
   - Returns `{ secret, qrCodeDataUrl, recoveryCodes }`

2. `verifyMfaSetup(code: string)`
   - POST to `/auth/mfa/verify-setup` with 6-digit code
   - Pass setupToken in Authorization header
   - On success: logs out user, redirects to `/login`
   - On failure: throws error for component to handle

3. `cancelMfa()`
   - Clears MFA setup state
   - Redirects to login

**Rationale**: Encapsulates setup token handling, allows component to call setup/verify methods.

---

### Phase 3: MfaSetupStep Component (4-Phase Flow)

**File**: `nexacore-dashboard/src/components/auth/MfaSetupStep.tsx` (NEW)

**Phase 1: Loading** (1-2 seconds)
- Call `setupMfa()` on mount
- Fetch QR code, secret, recovery codes from backend
- Transition to QR phase on success
- Transition to error phase on failure

**Phase 2: QR Code Display**
- Show QR code from `qrCodeDataUrl`
- Show secret in monospace (read-only input with copy button)
- Fallback: "Or enter this key manually" section
- Buttons: Cancel | Next

**Phase 3: Recovery Codes**
- Display 10 recovery codes in 2×5 grid
- Copy-all button
- Info: "Save these in a safe place"
- Buttons: Back | I saved them

**Phase 4: TOTP Verification**
- 6-digit input (auto-advance)
- Real-time validation
- Error handling (invalid code → banner)
- Calls `verifyMfaSetup(code)` on complete
- Buttons: Back | Enable MFA (disabled until 6 digits entered)

**Phase 5: Error** (Portal Overlay)
- Uses `createPortal()` to render at document.body
- AuthLayout narrow component (matches VerifyEmailStatus pattern)
- CircleX icon (48px, red #8a1111)
- Text: "MFA setup failed! An unexpected error occurred. Please try again."
- Single button: "Go to Sign In" → window.location.href = "/login"

**Styling**:
- Reuses design tokens (Tailwind semantic colors)
- Responsive (md breakpoint for two-column layout)
- Consistent with login/register UI

**Rationale**: 4-phase flow guides user through setup step-by-step, portal error handling matches existing patterns.

---

### Phase 4: LoginForm Integration

**File**: `nexacore-dashboard/src/components/auth/LoginForm.tsx`

**Changes**:
```typescript
if (mfaSetupRequired) {
  return <MfaSetupStep />;
}
if (mfaRequired) {
  return <MfaTotpStep />;
}
```

**Rationale**: Setup flow takes precedence (user must complete MFA before challenging it).

---

### Phase 5: Error Pattern Consistency

**File**: `nexacore-dashboard/src/components/auth/AuthErrorFallback.tsx`

**Pattern Check**: Verify error boundary matches MfaSetupStep error phase:
- AuthLayout narrow wrapper
- CircleX icon with red color
- Text with line break
- Single navigation button

**Rationale**: Consistency across all error states in auth module.

---

## 5. Files to Create/Modify

### Backend
- ✅ `src/auth/constants/auth.constants.ts` — Add setup token constants
- ✅ `src/auth/token.service.ts` — Add setup token methods
- ✅ `src/auth/login.service.ts` — Emit setup token on MFA required
- ✅ `src/auth/interfaces/auth.interfaces.ts` — Add setupToken field
- ✅ `src/auth/guards/mfa-setup.guard.ts` — NEW
- ✅ `src/auth/guards/jwt-or-mfa-setup.guard.ts` — NEW
- ✅ `src/auth/mfa.controller.ts` — Update guard on endpoints
- ✅ `src/auth/auth.module.ts` — Register new guards

### Frontend
- ✅ `src/lib/types.ts` — Update LoginResponse union
- ✅ `src/context/AuthContext.tsx` — Setup state, methods, actions
- ✅ `src/components/auth/MfaSetupStep.tsx` — NEW (4-phase component)
- ✅ `src/components/auth/LoginForm.tsx` — Conditional rendering
- ✅ `src/components/auth/AuthErrorFallback.tsx` — Pattern verification

---

## 6. Testing Strategy

### Manual Testing
1. Create SUPERADMIN user without MFA
2. Attempt login with correct credentials
3. Verify backend returns `mfaSetupRequired: true` with setupToken
4. Verify frontend shows MfaSetupStep loading phase
5. Verify QR code displays correctly
6. Test manual secret entry and copy functionality
7. Proceed through recovery codes phase
8. Enter valid TOTP code (generated from secret)
9. Verify success → logout + redirect to login
10. Re-login with MFA challenge flow

### Edge Cases
- Invalid TOTP code → error banner with retry
- Network failure during setup → error portal
- Token expiry during flow → error portal
- Recovery code usage → code marked as used

### Security Validation
- Setup token uses HMAC-derived secret (not main JWT)
- Setup token expires in 10 minutes
- Token type explicitly checked (prevents reuse)
- Recovery codes hashed with bcrypt (10 rounds)
- TOTP uses standard otplib implementation

---

## 7. Acceptance Criteria

✅ ADMIN/SUPERADMIN users without MFA can authenticate
✅ Scope-limited setup token issued on login
✅ Frontend shows 4-phase MFA setup flow
✅ QR code displays correctly with manual fallback
✅ Recovery codes display and can be copied
✅ TOTP verification accepts 6-digit codes
✅ Setup success logs user out + redirects to login
✅ Error states use portal overlay matching existing patterns
✅ Setup tokens expire after 10 minutes
✅ Recovery codes are hashed and validated

---

## 8. Integration Points

- **TokenService**: Must expose setup token methods
- **LoginService**: Must call TokenService on MFA setup required
- **AuthModule**: Must register new guards
- **MFA Controller**: Must use JwtOrMfaSetupGuard
- **AuthContext**: Must handle MFA_SETUP_REQUIRED action
- **LoginForm**: Must conditionally render MfaSetupStep

---

## 9. Security Considerations

1. **Scope Limitation**: Setup token grants ONLY MFA setup permission
2. **Time Limitation**: 10-minute expiry window
3. **Type Checking**: Explicit token type validation
4. **Secret Isolation**: HMAC-derived secret prevents general JWT reuse
5. **Recovery Code Hashing**: bcrypt (10 rounds) prevents plaintext disclosure
6. **No Privilege Escalation**: Setup token cannot access other endpoints

---

## 10. Future Enhancements

1. Admin setup override (force-enable MFA on users)
2. Email notification for recovery codes
3. Backup codes download (PDF/TXT)
4. Setup timeout enforcement (auto-logout after 10 min)

---

## 11. Documentation Requirements

- Implementation record documenting all changes
- Architecture pattern explanation (enterprise MFA onboarding)
- Security validation checklist
- Integration state update
- API spec sync (if endpoints changed)

---

## 12. Deviations & Risks

**None identified**. Plan follows enterprise MFA onboarding pattern used by GitHub, AWS, Okta.

---

## 13. Rollback Plan

If implementation fails:
1. Remove setup token methods from TokenService
2. Remove new guards (MfaSetupGuard, JwtOrMfaSetupGuard)
3. Revert LoginService to emit only `mfaSetupRequired: true`
4. Remove MfaSetupStep component
5. Revert LoginForm conditional rendering
6. Keep token schema changes (backward compatible)

---

## 14. Success Metrics

✅ SUPERADMIN user can complete login → MFA setup → re-login flow
✅ No deadlock preventing MFA setup
✅ UX is professional and guided (4-phase flow)
✅ Error handling matches existing patterns
✅ Security validation passes all checks
✅ Code follows NestJS/React conventions

---

## 15. Timeline

**Estimated**: 4-6 hours (parallel backend/frontend development)
**Actual**: Completed 2026-03-18

---

**Next Steps**:
1. Implement backend changes (Phases 1-4)
2. Implement frontend changes (Phases 1-5)
3. Perform manual testing
4. Create implementation record
5. Run security validation
