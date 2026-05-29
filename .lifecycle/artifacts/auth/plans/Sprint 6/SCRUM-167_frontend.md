# Frontend Implementation Plan: SCRUM-167 Frontend Test Debt — Unit Tests + Passkey E2E Verification

## 1. Overview

Write unit tests for the 6 profile/auth components deferred in Sprint 4 (SCRUM-128 through SCRUM-134) and perform end-to-end manual verification of the Passkey flow. The test infrastructure (Jest 29 + RTL + user-event) was established by SCRUM-136 with 18 smoke tests for UI primitives. This ticket closes the testing gap for profile components.

**Sprint**: Backlog (no sprint assigned — technical debt)
**Scope**: frontend

## 2. Architecture Context

### Test Infrastructure (established by SCRUM-136)
- **Config**: `jest.config.mjs` — `next/jest`, jsdom environment, test root `<rootDir>/tests`
- **Setup**: `tests/setup.ts` — imports `@testing-library/jest-dom`
- **Utilities**: `tests/test-utils.tsx` — custom `render()` wrapping RTL with `AllProviders` (currently empty wrapper)
- **Mocks**: `tests/__mocks__/next-navigation.ts`, `next-image.tsx`, `fileMock.ts`
- **Existing tests** (7 files): Button, Input, Spinner, ErrorAlert, Pagination, LoginForm, usePasskey

### Components to Test
| Component | File | Lines | Hooks | API Module |
|-----------|------|-------|-------|------------|
| PasskeyManager | `src/components/profile/PasskeyManager.tsx` | 345 | usePasskey, useToast | `@/hooks/usePasskey` |
| TrustedDevices | `src/components/profile/TrustedDevices.tsx` | 214 | useTrustedDevices, useToast | `@/hooks/useTrustedDevices` |
| ChangeEmailForm | `src/components/profile/ChangeEmailForm.tsx` | 107 | useAuth, useToast | `@/lib/email-change-api` |
| DeleteAccount | `src/components/profile/DeleteAccount.tsx` | 154 | useAuth, useToast, useRouter | `@/lib/delete-account-api` |
| ConnectedAccounts | `src/components/profile/ConnectedAccounts.tsx` | 209 | useAuth, useToast | `@/lib/oauth-api` |
| SecurityActivity | `src/components/profile/SecurityActivity.tsx` | 146 | (none — standalone) | `@/lib/security-activity-api` |

### Mocking Strategy
All components use hooks or API modules that must be mocked:

| Dependency | Mock Approach |
|------------|--------------|
| `usePasskey` | `jest.mock('@/hooks/usePasskey')` — return configurable object |
| `useTrustedDevices` | `jest.mock('@/hooks/useTrustedDevices')` — return configurable object |
| `useAuth` (from `@/hooks/useAuth`) | `jest.mock('@/hooks/useAuth')` — return `{ user, accessToken, logout, refreshSession }` |
| `useToast` (from `@/context/ToastContext`) | `jest.mock('@/context/ToastContext')` — return `{ addToast: jest.fn() }` |
| `useRouter` (from `next/navigation`) | Already mocked in `__mocks__/next-navigation.ts` |
| API modules (`email-change-api`, `delete-account-api`, `oauth-api`, `security-activity-api`) | `jest.mock('@/lib/[module]')` |
| `lucide-react` icons | Not mocked — render as-is |

### Test Patterns (from existing tests)
- **LoginForm.test.tsx**: Mocks multiple hooks + context + child components. Uses `screen.getByRole()`, `screen.getByText()`.
- **usePasskey.test.ts**: Uses `renderHook()` + `act()` + `waitFor()`. Mocks `useAuth` and `SimpleWebAuthn`.
- **Button.test.tsx**: Simple render, role queries, state assertions (loading, disabled).

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Branch**: `feature/SCRUM-167-frontend`
- **Base**: `main`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-167-frontend`

### Step 1: Create Shared Test Helpers
- **File**: `tests/helpers/profile-mocks.ts`
- **Action**: Create reusable mock factories for profile component tests
- **Implementation**:
  1. Create `mockUser(overrides?)` factory returning `SafeUser` with sensible defaults:
     ```
     { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User',
       hasPassword: true, oauthProviders: [], isActive: true, ... }
     ```
  2. Create `mockPasskey(overrides?)` factory returning `PasskeyResponse`:
     ```
     { id: '1', name: 'My Passkey', credentialId: 'cred-1', deviceType: 'platform',
       backedUp: false, createdAt: '2026-01-01T00:00:00Z', lastUsed: null }
     ```
  3. Create `mockTrustedDevice(overrides?)` factory returning `TrustedDeviceResponse`:
     ```
     { id: '1', deviceName: 'Chrome on Windows', fingerprint: 'fp-1',
       trustedAt: '2026-01-01T00:00:00Z', expiresAt: '2026-04-01T00:00:00Z',
       lastVerified: '2026-03-01T00:00:00Z' }
     ```
  4. Create `mockSecurityEvent(overrides?)` factory returning `SecurityEvent`:
     ```
     { id: '1', action: 'LOGIN_SUCCESS', ipAddress: '192.168.1.1',
       createdAt: '2026-03-01T12:00:00Z', details: null }
     ```
  5. Create `setupToastMock()` helper returning `{ addToast: jest.fn() }` and wiring `jest.mocked(useToast).mockReturnValue(...)`.

### Step 2: PasskeyManager Tests
- **File**: `tests/components/profile/PasskeyManager.test.tsx`
- **Mocks**: `usePasskey`, `useToast`
- **Test Cases** (8 minimum):

| # | Test | What to Assert |
|---|------|----------------|
| 1 | renders passkey list with data | Passkey names visible, device icons rendered |
| 2 | renders empty state when no passkeys | "No passkeys registered" text visible |
| 3 | shows browser unsupported warning | `isSupported: false` → AlertTriangle warning visible |
| 4 | register button click opens registration view | Click "Add Passkey" → name input visible |
| 5 | register flow calls registerPasskey | Enter name → click Register → `registerPasskey(name)` called |
| 6 | delete flow shows password modal | Click trash icon → password input + "Delete" button visible |
| 7 | rename flow shows rename modal | Click pencil icon → rename input visible with current name |
| 8 | shows max reached message at 10 passkeys | 10 passkeys → "Maximum reached" text, button disabled |

- **Implementation Notes**:
  - Mock `usePasskey` to return configurable state per test
  - Use `userEvent.click()` for interactions (not `fireEvent`)
  - For register flow: mock `registerPasskey` as `jest.fn().mockResolvedValue(newPasskey)`
  - For error scenarios: mock `registerPasskey` as `jest.fn().mockRejectedValue(new Error(...))`

### Step 3: TrustedDevices Tests
- **File**: `tests/components/profile/TrustedDevices.test.tsx`
- **Mocks**: `useTrustedDevices`, `useToast`
- **Test Cases** (6 minimum):

| # | Test | What to Assert |
|---|------|----------------|
| 1 | renders device list with data | Device names visible, expiry dates shown |
| 2 | renders empty state when no devices | "No trusted devices" text visible |
| 3 | shows loading spinner during fetch | `isLoading: true, devices: []` → Spinner rendered |
| 4 | revoke device shows confirmation modal | Click trash icon → modal with "Revoke" button visible |
| 5 | revoke calls revokeDevice with correct id | Confirm revoke → `revokeDevice(id)` called |
| 6 | trust current device calls trustCurrentDevice | Click "Trust This Device" → `trustCurrentDevice()` called |

- **Implementation Notes**:
  - Mobile vs desktop icon rendering based on device name
  - "Revoke All" button visible only when devices.length > 0

### Step 4: ChangeEmailForm Tests
- **File**: `tests/components/profile/ChangeEmailForm.test.tsx`
- **Mocks**: `useAuth`, `useToast`, `@/lib/email-change-api`
- **Test Cases** (5 minimum):

| # | Test | What to Assert |
|---|------|----------------|
| 1 | renders form with email and password inputs | Email input, password input, submit button visible |
| 2 | shows OAuth-only message for OAuth accounts | `user.hasPassword: false, oauthProviders: ['GOOGLE']` → info message visible, form hidden |
| 3 | submit calls requestEmailChange | Fill valid email + password → click submit → API called |
| 4 | shows success toast on successful submission | API resolves → `addToast` called with variant='success' |
| 5 | shows error toast on API failure | API rejects → `addToast` called with variant='error' |

- **Implementation Notes**:
  - Validation: email regex, not same as current, password >= 8 chars
  - Submit button disabled until all validations pass

### Step 5: DeleteAccount Tests
- **File**: `tests/components/profile/DeleteAccount.test.tsx`
- **Mocks**: `useAuth`, `useToast`, `@/lib/delete-account-api`, `next/navigation`
- **Test Cases** (6 minimum):

| # | Test | What to Assert |
|---|------|----------------|
| 1 | renders danger zone with delete button | "Delete Account" button visible |
| 2 | shows confirmation modal on click | Click delete → modal with "DELETE" input visible |
| 3 | requires password for password users | `hasPassword: true` → password input visible in modal |
| 4 | no password field for OAuth-only users | `hasPassword: false` → no password input in modal |
| 5 | successful deletion triggers logout + redirect | API resolves → `logout()` called → `router.push('/login')` called |
| 6 | shows error toast on API failure | API rejects → `addToast` called with variant='error' |

- **Implementation Notes**:
  - Confirm text must be exactly "DELETE" (case-sensitive)
  - Modal closes on Escape key and backdrop click
  - Submit disabled until confirmText === 'DELETE' && (!requiresPassword || password.length >= 8)

### Step 6: ConnectedAccounts Tests
- **File**: `tests/components/profile/ConnectedAccounts.test.tsx`
- **Mocks**: `useAuth`, `useToast`, `@/lib/oauth-api`
- **Test Cases** (7 minimum):

| # | Test | What to Assert |
|---|------|----------------|
| 1 | renders connected providers with status | Google/GitHub shown, "Connected"/"Connect" labels |
| 2 | renders unconnected providers | No oauthProviders → both show "Connect" button |
| 3 | connect button sets window.location.href | Click Connect → location changed to OAuth URL |
| 4 | disconnect button shows password modal | Click Disconnect → password input visible |
| 5 | unlink calls unlinkOAuth + refreshSession | Confirm unlink → `unlinkOAuth()` called, then `refreshSession()` called |
| 6 | cannot disconnect last auth method | `hasPassword: false, oauthProviders: ['GOOGLE']` → "Set a password first" shown, disconnect disabled |
| 7 | shows error toast on unlink failure | API rejects → `addToast` called with variant='error' |

- **Implementation Notes**:
  - For window.location.href test: mock `Object.defineProperty(window, 'location', ...)`
  - `isLastAuthMethod = !user.hasPassword && user.oauthProviders.length === 1`
  - After successful unlink, `refreshSession()` must be called to update user state

### Step 7: SecurityActivity Tests
- **File**: `tests/components/profile/SecurityActivity.test.tsx`
- **Mocks**: `@/lib/security-activity-api`
- **Test Cases** (5 minimum):

| # | Test | What to Assert |
|---|------|----------------|
| 1 | renders events list with data | Event labels visible (e.g., "Login Success"), IP addresses shown |
| 2 | renders empty state when no events | "No security events." text visible |
| 3 | shows loading text during fetch | Initial render → "Loading events..." visible |
| 4 | event type labels render correctly | LOGIN_SUCCESS → "Login Success", ACCOUNT_LOCKED → "Account Locked" |
| 5 | pagination changes page and refetches | Click page 2 → `getSecurityActivity(2, 10)` called |

- **Implementation Notes**:
  - Mock `getSecurityActivity` to return `{ data: [...], meta: { total, page, limit, totalPages } }`
  - SecurityActivity has NO context dependencies — simplest component to test
  - Uses Pagination component (already tested in tests/components/ui/Pagination.test.tsx)

### Step 8: Run All Tests and Verify Coverage
- **Action**: Run `npm test` to verify all tests pass, then `npm run test:cov` for coverage
- **Implementation Steps**:
  1. Run `npm test` — all existing + new tests must pass
  2. Run `npm run test:cov` — verify `src/components/profile/` reaches >= 70% statement coverage
  3. Fix any failing tests
  4. Verify no regressions in existing UI/hook tests

### Step 9: Passkey E2E Manual Verification
- **Action**: Manual end-to-end verification with backend running
- **Prerequisites**: Backend running locally, Chrome/Edge browser
- **Checklist**:
  1. Register a passkey from Profile > Security > Passkeys — verify browser prompt, passkey saved
  2. Login with passkey (conditional UI) — verify autofill prompt on login page
  3. Rename a passkey — verify name updates in list
  4. Delete a passkey — verify confirmation modal, passkey removed
  5. Verify passkey login creates audit log entry (SecurityActivity shows it)
  6. Verify graceful fallback message in unsupported browser

### Step 10: Update Technical Documentation
- **Action**: Update documentation to reflect new test coverage
- **Implementation Steps**:
  1. No code documentation changes expected (tests only)
  2. Update `ai-specs/specs/frontend-standards.mdc` testing section if new patterns established
  3. Update `ai-specs/specs/integration-state.md` changelog with SCRUM-167 entry

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create shared test helpers (profile-mocks.ts)
3. Step 7: SecurityActivity tests (simplest — no context deps, validates pattern)
4. Step 4: ChangeEmailForm tests (simple form, useAuth + useToast)
5. Step 3: TrustedDevices tests (custom hook + useToast)
6. Step 5: DeleteAccount tests (modal + useAuth + useRouter)
7. Step 6: ConnectedAccounts tests (most complex — OAuth + window.location)
8. Step 2: PasskeyManager tests (most complex — usePasskey + multiple views)
9. Step 8: Run all tests + verify coverage
10. Step 9: Passkey E2E manual verification
11. Step 10: Update documentation

**Rationale**: Start with SecurityActivity (zero context deps) to validate the testing pattern, then increase complexity. Finish with PasskeyManager (most hooks, most states) which benefits from patterns established in earlier tests.

## 5. Testing Checklist

### Unit Tests
- [ ] 6 new test files in `tests/components/profile/`
- [ ] 1 helper file in `tests/helpers/profile-mocks.ts`
- [ ] >= 37 new tests total (8+6+5+6+7+5)
- [ ] All tests use `@testing-library/user-event` (not `fireEvent`)
- [ ] All API calls mocked (no network dependencies)
- [ ] All tests deterministic (no timing, no random)
- [ ] Coverage >= 70% for `src/components/profile/`
- [ ] All existing tests still pass

### Passkey E2E
- [ ] Registration flow works
- [ ] Login conditional UI works
- [ ] Rename passkey works
- [ ] Delete passkey works
- [ ] Audit log entry created on passkey login
- [ ] Unsupported browser shows fallback

## 6. Error Handling Patterns

All profile components follow the same error handling pattern:
```
try {
  await apiCall(...)
  addToast({ variant: 'success', message: '...' })
} catch (error) {
  const message = extractMessageByStatus(error, {
    [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests...',
    [HTTP_STATUS.UNAUTHORIZED]: 'Invalid password.',
    default: 'Operation failed.'
  })
  addToast({ variant: 'error', message })
}
```

Tests must verify both success and error paths for each API interaction.

## 7. Dependencies

- No new dependencies required
- All test tooling already installed:
  - `jest@^29.7.0`
  - `jest-environment-jsdom@^29.7.0`
  - `@testing-library/react@^16.3.2`
  - `@testing-library/jest-dom@^6.9.1`
  - `@testing-library/user-event@^14.6.1`

## 8. Notes

- **No code changes to source components** — this is purely a testing ticket
- Follow existing test patterns from `tests/components/ui/` and `tests/hooks/`
- Use the custom `render()` from `tests/test-utils.tsx` for all component tests
- Mock hooks at module level (`jest.mock`), configure return values per test with `mockReturnValue`
- For async operations: use `waitFor()` from RTL to assert post-async state
- The `ConfirmModal` component used by PasskeyManager, TrustedDevices, DeleteAccount, and ConnectedAccounts should NOT be mocked — test through it to verify modal interactions

## 9. Next Steps After Implementation

1. Run `/commit SCRUM-167` with test results
2. Run `/update-docs SCRUM-167`
3. Consider adding tests for remaining untested components (ProfileForm, ActiveSessions, ChangePasswordForm) in a future ticket

## 10. Implementation Verification

- [ ] All 37+ tests pass (`npm test`)
- [ ] No regressions in existing 31 tests
- [ ] Coverage >= 70% for profile components
- [ ] Passkey E2E checklist complete
- [ ] No new dependencies added
- [ ] Test patterns consistent with existing tests
- [ ] Documentation updated
