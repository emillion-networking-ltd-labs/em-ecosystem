# SCRUM-301 — Plan: Allow OAuth login for unverified local accounts

## Scope
Backend

## Steps

### Step 1 — Add emailVerified to OAuthProfile interface
**File**: `nexacore-api/src/common/interfaces/oauth-profile.interface.ts`
- Add `emailVerified?: boolean` field

### Step 2 — Google strategy: extract email_verified
**File**: `nexacore-api/src/auth/strategies/google.strategy.ts`
- Pass `emailVerified: true` (Google always verifies emails)

### Step 3 — GitHub strategy: extract email verification
**File**: `nexacore-api/src/auth/strategies/github.strategy.ts`
- Pass `emailVerified: primaryEmail.verified` from GitHub emails array

### Step 4 — Add OAUTH_AUTO_VERIFIED audit action
**File**: `nexacore-api/src/audit/enums/audit-action.enum.ts`
- Add `OAUTH_AUTO_VERIFIED = 'OAUTH_AUTO_VERIFIED'`

### Step 5 — Modify findOrCreateByOAuth for auto-verify
**File**: `nexacore-api/src/users/users.service.ts`
- When unverified local account + OAuth provider emailVerified=true:
  - Create OAuthAccount link
  - Set emailVerified=true, passwordHash=null (anti pre-hijack)
  - Log OAUTH_AUTO_VERIFIED audit event
  - Return { user, action: 'linked' }
- When provider emailVerified !== true: keep ConflictException

### Step 6 — Update tests
**File**: `nexacore-api/src/users/tests/users.service.spec.ts`
- Test: verified OAuth + unverified local → auto-link + verify + nullify password
- Test: unverified OAuth + unverified local → ConflictException

### Step 7 — Build verification
- nest build compiles, all tests pass

## Security
- Anti pre-hijack: passwordHash nullified
- Only trusted providers with emailVerified=true trigger auto-verify
- Audit trail: OAUTH_AUTO_VERIFIED logged
- GitHub unverified emails still blocked
