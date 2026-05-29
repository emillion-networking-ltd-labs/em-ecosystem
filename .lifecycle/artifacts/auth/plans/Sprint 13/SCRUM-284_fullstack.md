# Plan: SCRUM-284 — Unify Login Response Shapes (Error Enumeration Mitigation)

## Context

Audit finding **EM-01** (MEDIUM): The `POST /auth/login` endpoint returns three different response shapes depending on the code path taken. An attacker who provides valid credentials can infer:
- `{ accessToken, user }` → regular user without MFA
- `{ mfaRequired: true, mfaToken }` → user has MFA enabled
- `{ mfaSetupRequired: true, setupToken, message }` → admin without MFA

This violates CWE-200/CWE-203 — response structure acts as an oracle for account state enumeration.

**Goal**: Unify all login responses to use an explicit `status` discriminator field instead of implicit property-presence discrimination. Combined with SCRUM-283's timing floor, this eliminates both timing and structural enumeration vectors.

---

## Approach: Explicit Status Discriminator

Add a `status` field to all login response types. The controller and frontend switch on `status` instead of checking property existence (`'mfaRequired' in result`).

### New Response Shapes

**Success**:
```json
{ "status": "success", "accessToken": "...", "user": {...} }
```

**MFA Required**:
```json
{ "status": "mfa_required", "mfaToken": "..." }
```

**MFA Setup Required**:
```json
{ "status": "mfa_setup_required", "setupToken": "...", "message": "..." }
```

All responses now share a common `status` field as the discriminator. The `mfaRequired: true` and `mfaSetupRequired: true` boolean flags are removed.

---

## Codebase State Snapshot

- **Date**: 2026-03-18
- **Last completed ticket**: SCRUM-283 (constant-time login)
- **Scope**: Fullstack (backend response types + frontend type guards + API spec)

### Current Types (from `auth.interfaces.ts`)
```typescript
interface AuthResult { accessToken: string; user: SafeUser; cookie: CookieConfig; oauthAction?: string; }
interface MfaChallengeResult { mfaRequired: true; mfaToken: string; }
interface MfaSetupRequiredResult { mfaSetupRequired: true; setupToken: string; message: string; }
```

### Current Frontend Types (from `types.ts`)
```typescript
type LoginResponse =
  | AuthResponse  // { user, accessToken, oauthAction? }
  | { mfaRequired: true; mfaToken: string }
  | { mfaSetupRequired: true; setupToken: string; message: string };
```

### Current Discrimination Pattern
- **Controller** (`auth.controller.ts:135-142`): `if ('mfaRequired' in result)` / `if ('mfaSetupRequired' in result)`
- **AuthContext** (`AuthContext.tsx:255-290`): `isMfaResponse()` / `isMfaSetupResponse()` type guards using `'mfaRequired' in data`
- **LoginForm** (`LoginForm.tsx:157-163`): reads `mfaRequired` / `mfaSetupRequired` from context state (no change needed)

---

## Regression Impact Analysis

### Backend Blast Radius

| File | Impact |
|------|--------|
| `src/auth/interfaces/auth.interfaces.ts` | MODIFY: Add `status` field to all 3 result types, remove boolean discriminators |
| `src/auth/login.service.ts` | MODIFY: Add `status` to all return objects in `handleMfaLogin()`, `handleMfaSetupRequired()`, `handleLoginSuccess()` |
| `src/auth/auth.controller.ts` | MODIFY: Switch from `'mfaRequired' in result` to `result.status === 'mfa_required'` |
| `src/auth/auth.service.ts` | NO CHANGE: Pure facade, delegates unchanged |
| `src/auth/tests/auth.controller.spec.ts` | MODIFY: Update assertions for `status` field |
| `src/auth/tests/auth.service.spec.ts` | MODIFY: Update mock return values with `status` field |
| `src/auth/tests/auth-login.spec.ts` | MODIFY: Update mock return values with `status` field |
| `src/auth/tests/auth-login-security.spec.ts` | MODIFY: Update assertions for `mfaSetupRequired` response |
| `src/auth/tests/auth-login-device.spec.ts` | MODIFY: Update mock return values with `status` field |

### Frontend Blast Radius

| File | Impact |
|------|--------|
| `src/lib/types.ts` | MODIFY: Add `status` to LoginResponse union variants |
| `src/context/AuthContext.tsx` | MODIFY: Update type guards to use `status` field |
| `src/components/auth/LoginForm.tsx` | NO CHANGE: Reads from context state, not response directly |
| `src/components/auth/MfaSetupStep.tsx` | NO CHANGE: Reads from context state |
| `src/components/auth/MfaTotpStep.tsx` | NO CHANGE: Reads from context state |

### API Spec
| File | Impact |
|------|--------|
| `ai-specs/specs/api-spec.yml` | MODIFY: Add `status` field to all 3 response schemas |

**Total blast radius**: ~12 files (6 backend source/test, 2 frontend, 1 API spec, plus additional test files that assert on response shapes)

**Breaking changes**: YES — response shape changes. But frontend and backend deploy together (monorepo), so coordination is automatic.

---

## Implementation Steps

### Step 0: Create Feature Branch

```bash
git checkout main && git pull origin main
git checkout -b feature/SCRUM-284-fullstack
```

---

### Step 1: Update Backend Interface Types

**File**: `nexacore-api/src/auth/interfaces/auth.interfaces.ts`

Add `status` field and a type for the discriminator:

```typescript
export type LoginStatus = 'success' | 'mfa_required' | 'mfa_setup_required';

export interface AuthResult {
  status: 'success';
  accessToken: string;
  user: SafeUser;
  cookie: CookieConfig;
  oauthAction?: 'login' | 'created' | 'linked';
}

export interface MfaChallengeResult {
  status: 'mfa_required';
  mfaToken: string;
}

export interface MfaSetupRequiredResult {
  status: 'mfa_setup_required';
  setupToken: string;
  message: string;
}
```

Remove `mfaRequired: true` and `mfaSetupRequired: true` boolean fields.

---

### Step 2: Update LoginService Return Values

**File**: `nexacore-api/src/auth/login.service.ts`

In `handleMfaLogin()` (~line 251):
```typescript
return { status: 'mfa_required' as const, mfaRequired: true, mfaToken };
// Change to:
return { status: 'mfa_required' as const, mfaToken };
```

In `handleMfaSetupRequired()` (~line 319):
```typescript
return { status: 'mfa_setup_required' as const, setupToken, message: ErrorMessages.mfa.SETUP_REQUIRED };
```

In `handleLoginSuccess()` and `completeTrustedDeviceLogin()`:
```typescript
return { status: 'success' as const, accessToken, user: toSafeUser(user), cookie: ... };
```

---

### Step 3: Update Auth Controller

**File**: `nexacore-api/src/auth/auth.controller.ts`

Change discrimination from property-presence to status field:

```typescript
// OLD:
if ('mfaRequired' in result) { return result as MfaChallengeResult; }
if ('mfaSetupRequired' in result) { return result as MfaSetupRequiredResult; }

// NEW:
if (result.status === 'mfa_required') { return result; }
if (result.status === 'mfa_setup_required') { return result; }

// Success path unchanged (set cookie, return accessToken + user + status)
setCookieFromConfig(res, result.cookie);
return { status: result.status, accessToken: result.accessToken, user: result.user };
```

---

### Step 4: Update Frontend Types

**File**: `nexacore-dashboard/src/lib/types.ts`

```typescript
export type LoginResponse =
  | (AuthResponse & { status: 'success' })
  | { status: 'mfa_required'; mfaToken: string }
  | { status: 'mfa_setup_required'; setupToken: string; message: string };
```

---

### Step 5: Update AuthContext Type Guards

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

Update type guards:
```typescript
// OLD:
function isMfaResponse(data: LoginResponse): data is { mfaRequired: true; mfaToken: string } {
  return 'mfaRequired' in data && data.mfaRequired === true;
}

// NEW:
function isMfaResponse(data: LoginResponse): data is { status: 'mfa_required'; mfaToken: string } {
  return data.status === 'mfa_required';
}

function isMfaSetupResponse(data: LoginResponse): data is { status: 'mfa_setup_required'; setupToken: string; message: string } {
  return data.status === 'mfa_setup_required';
}
```

---

### Step 6: Update Backend Test Files

Update all test files that assert on login response shapes:

1. `auth.controller.spec.ts` — update assertions to expect `status` field
2. `auth.service.spec.ts` — update mock return values with `status`
3. `auth-login.spec.ts` — update mock return values with `status`
4. `auth-login-security.spec.ts` — update `mfaSetupRequired` assertions
5. `auth-login-device.spec.ts` — update mock return values with `status`

Pattern: grep for `mfaRequired: true`, `mfaSetupRequired: true`, `'mfaRequired' in`, `'mfaSetupRequired' in` in all spec files and update.

---

### Step 7: Update API Spec

**File**: `ai-specs/ai-specs/specs/api-spec.yml`

Add `status` field to all 3 response schemas:

```yaml
AuthResponse:
  properties:
    status:
      type: string
      enum: ['success']
    accessToken: ...
    user: ...
  required: [status, accessToken, user]

MfaChallengeResponse:
  properties:
    status:
      type: string
      enum: ['mfa_required']
    mfaToken: ...
  required: [status, mfaToken]

MfaSetupRequiredResponse:
  properties:
    status:
      type: string
      enum: ['mfa_setup_required']
    setupToken: ...
    message: ...
  required: [status, setupToken, message]
```

Remove `mfaRequired` and `mfaSetupRequired` boolean properties from schemas.

---

### Step 8: Run Tests + Build

```bash
cd nexacore-api && npx jest --maxWorkers=1 --forceExit && npx nest build
cd ../nexacore-dashboard && npm run build
```

---

## Implementation Order

1. Step 0: Create branch
2. Step 1: Backend interface types (foundation)
3. Step 2: LoginService return values
4. Step 3: Auth controller discrimination
5. Step 4: Frontend types
6. Step 5: AuthContext type guards
7. Step 6: Backend test files
8. Step 7: API spec
9. Step 8: Tests + build

---

## Testing Checklist

- [ ] All 3 login response types include `status` field
- [ ] `mfaRequired: true` boolean removed from MfaChallengeResult
- [ ] `mfaSetupRequired: true` boolean removed from MfaSetupRequiredResult
- [ ] Controller uses `result.status` not `'mfaRequired' in result`
- [ ] AuthContext type guards use `data.status` not `'mfaRequired' in data`
- [ ] Frontend LoginResponse union uses `status` discriminator
- [ ] API spec updated with `status` field in all schemas
- [ ] All auth tests pass
- [ ] Backend build clean
- [ ] Frontend build clean

---

## Notes

- **No new dependencies**: Pure type/structural change
- **Breaking change**: Response shape changes, but monorepo deploys frontend+backend together
- **LoginForm.tsx unchanged**: Reads auth state from context, not response directly
- **OAuth flows**: `AuthResult` is also returned by OAuth callback — verify `oauthAction` field still works alongside `status: 'success'`
- **Timing defense intact**: SCRUM-283's `MIN_LOGIN_DURATION_MS` wrapper is on `login()` method, which is unchanged by this ticket
