# Backend Implementation Plan: SCRUM-318 OAuth 500 from SUPERADMIN

## Overview

Diagnose and fix 500 error when SUPERADMIN connects Google/GitHub accounts from Connected Accounts section. Per SUPERADMIN Role Policy, all roles must be able to link OAuth accounts.

## Architecture Context

- **OAuth link flow**: POST /auth/link/code → GET /auth/link/{provider}?code=... → Provider redirect → Callback → findOrCreateByOAuth
- **Guards**: JwtAuthGuard (link/code), OAuthLinkGuard + GoogleAuthGuard/GitHubAuthGuard (link endpoints)
- **No role restrictions** in any of these endpoints

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-318-backend`

### Step 1: Reproduce and Diagnose

1. Start backend with `npm run start:dev` (shows stack traces)
2. Login as SUPERADMIN
3. Go to Profile → Connected Accounts → Click "Connect" on Google or GitHub
4. Capture the backend console error (stack trace + status code)
5. Determine which endpoint returns 500:
   - POST /auth/link/code (link code generation)
   - GET /auth/link/google (OAuthLinkGuard + redirect)
   - GET /auth/google/callback (OAuth callback)

### Step 2: Fix Based on Root Cause

**If link code generation fails** (OAuthLinkCodeStore):
- Check Redis connection (`oauth-link-code.store.ts`)
- Check if store uses in-memory Map vs Redis based on config

**If OAuthLinkGuard fails**:
- Check if guard correctly reads `?code=` query param
- Check if code validation fails for valid codes

**If OAuth callback fails**:
- Check if `findOrCreateByOAuth` handles SUPERADMIN user correctly
- The SUPERADMIN user was created via seed (not OAuth) — verify upsert handles existing non-OAuth users

**If provider redirect fails**:
- Verify Google/GitHub callback URLs match the configured ones
- Check if CORS or CSP blocks the redirect

### Step 3: Verify Fix
- Test connect flow for all 3 roles: USER, ADMIN, SUPERADMIN
- Test both Google and GitHub
- Verify no 500 errors in backend logs

### Step 4: Test if Issue Affects Other Roles
- Login as regular USER → try Connect → does it work?
- If it fails for all roles → the bug is not SUPERADMIN-specific

## Testing Checklist
- [ ] SUPERADMIN can connect Google account
- [ ] SUPERADMIN can connect GitHub account
- [ ] USER can connect accounts (no regression)
- [ ] ADMIN can connect accounts (no regression)
- [ ] Build clean, tests pass

## Notes
- This ticket requires runtime debugging — cannot be fully diagnosed from static analysis
- OAuth credentials are configured in .env (verified)
- No code path explicitly blocks SUPERADMIN from OAuth
- The error may affect all roles, not just SUPERADMIN — needs verification
