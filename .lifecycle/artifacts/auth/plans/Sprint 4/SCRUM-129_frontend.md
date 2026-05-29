# Frontend Implementation Plan: SCRUM-129 Trusted Device Management + Fingerprint

## 1. Overview

Add device fingerprinting and trusted device management to nexacore-dashboard. The backend (SCRUM-107) implements 4 trusted device endpoints and MFA-skip logic via the `X-Device-Fingerprint` header. Currently the frontend never sends this header, so trusted device MFA skip is 100% non-functional. This ticket enables it by generating a stable browser fingerprint, injecting the header on all API requests, and providing a profile section for managing trusted devices.

**Architecture**: Next.js 14 App Router, `apiClient` singleton with automatic header injection, custom hooks for state, TailwindCSS for styling.

## 2. Architecture Context

### Components/Pages Involved
- **New**: `src/lib/fingerprint.ts` — singleton fingerprint generator (caches result)
- **New**: `src/lib/trusted-device-api.ts` — 4 API functions for trusted device endpoints
- **New**: `src/hooks/useTrustedDevices.ts` — custom hook for device list + CRUD
- **New**: `src/components/profile/TrustedDevices.tsx` — profile section component
- **Modified**: `src/lib/types.ts` — add trusted device response types
- **Modified**: `src/lib/api.ts` — add `deviceFingerprint` property + header injection
- **Modified**: `src/context/AuthContext.tsx` — generate fingerprint on mount
- **Modified**: `src/app/profile/page.tsx` — render TrustedDevices component

### Routing Considerations
- No new routes. Trusted devices management lives on existing `/profile` page.

### State Management
- **ApiClient level**: `deviceFingerprint` property injected into all request headers
- **AuthProvider level**: Fingerprint generated on mount, set on apiClient before any auth call
- **Local state in TrustedDevices**: device list, loading, error, success messages
- **Local state via useTrustedDevices hook**: encapsulates all CRUD operations

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-129-frontend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-129-frontend`
  3. Verify: `git branch`
- **Notes**: Must be the FIRST step before any code changes.

### Step 1: Install @fingerprintjs/fingerprintjs

- **File**: `nexacore-dashboard/package.json`
- **Action**: Add the open-source browser fingerprinting library
- **Implementation Steps**:
  1. Run `npm install @fingerprintjs/fingerprintjs` in nexacore-dashboard/
  2. Verify it appears in `dependencies` (not devDependencies)
- **Dependencies**: `@fingerprintjs/fingerprintjs` (MIT license, open-source version)
- **Notes**: This is the open-source version (not Pro). It generates a stable visitor ID from browser characteristics (canvas, WebGL, fonts, plugins, etc.). The visitor ID is deterministic — same browser+device produces the same ID. Typically 32-character hex string, well within the backend's 16-512 char requirement.

### Step 2: Add Trusted Device Types

- **File**: `src/lib/types.ts`
- **Action**: Add TypeScript types matching backend response shapes
- **Types to add**:

```typescript
export type TrustedDeviceResponse = {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastVerifiedAt: string;
  expiresAt: string;
  createdAt: string;
};

export type TrustDeviceResult = {
  id: string;
  deviceName: string;
  expiresAt: string;
};

export type RevokeAllDevicesResponse = {
  message: string;
  count: number;
};
```

### Step 3: Create Fingerprint Module

- **File**: `src/lib/fingerprint.ts` (NEW)
- **Action**: Singleton module that generates and caches a browser fingerprint
- **Exports**:

```typescript
export function getFingerprint(): Promise<string>
```

- **Implementation Steps**:
  1. Import `FingerprintJS` from `@fingerprintjs/fingerprintjs`
  2. Create module-level `cachedFingerprint: string | null = null` and `loadPromise: Promise<string> | null = null`
  3. `getFingerprint()`:
     - If `cachedFingerprint` exists, return immediately
     - If `loadPromise` exists, return it (dedup concurrent calls)
     - Otherwise: `loadPromise = FingerprintJS.load().then(fp => fp.get()).then(result => { cachedFingerprint = result.visitorId; return result.visitorId; })`
     - On error: return empty string (fail-open — login still works, just can't skip MFA)
  4. Add `'use client'` directive (uses browser APIs)
- **Implementation Notes**:
  - FingerprintJS.load() initializes the agent (one-time, ~50ms)
  - fp.get() collects browser signals and generates visitorId (~100ms first time)
  - Result is cached — subsequent calls return instantly
  - visitorId is typically 32 hex chars — satisfies backend's 16-512 char requirement
  - Fail-open: if fingerprinting fails, empty string means header is not sent, login works normally without MFA skip

### Step 4: Add Device Fingerprint to ApiClient

- **File**: `src/lib/api.ts`
- **Action**: Add `deviceFingerprint` property and inject `X-Device-Fingerprint` header on all requests
- **Implementation Steps**:
  1. Add private property: `private deviceFingerprint: string | null = null;`
  2. Add setter: `setDeviceFingerprint(fp: string | null) { this.deviceFingerprint = fp; }`
  3. In `request()` method, modify the headers construction to include fingerprint:
     ```typescript
     const headers: Record<string, string> = {
       'Content-Type': 'application/json',
       ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
       ...(this.deviceFingerprint && { 'X-Device-Fingerprint': this.deviceFingerprint }),
     };
     ```
- **Implementation Notes**:
  - Header is injected on ALL requests, not just login. The backend only reads it on login, but sending it universally is harmless and simpler.
  - The retry branch in `request()` (after 401 refresh) also uses the same `headers` object, so fingerprint is included on retries too.

### Step 5: Generate Fingerprint on AuthProvider Mount

- **File**: `src/context/AuthContext.tsx`
- **Action**: Generate fingerprint on mount, before any auth call
- **Implementation Steps**:
  1. Import `getFingerprint` from `@/lib/fingerprint`
  2. In the existing `useEffect` that calls `refreshSession()` on mount, add fingerprint generation BEFORE the refresh:
     ```typescript
     useEffect(() => {
       (async () => {
         const fp = await getFingerprint();
         if (fp) apiClient.setDeviceFingerprint(fp);
         await refreshSession();
       })();
     }, [refreshSession]);
     ```
  3. This ensures the fingerprint is set before any API call (refresh, login, etc.)
- **Implementation Notes**:
  - The fingerprint is generated once on mount (~150ms), then cached
  - If it fails, `fp` is empty string → `setDeviceFingerprint` ignores it (falsy check)
  - The `refreshSession()` call now happens after fingerprint is ready
  - No changes to `login()`, `register()`, or `passkeyLogin()` — they all go through `apiClient.request()` which now auto-injects the header

### Step 6: Create Trusted Device API Module

- **File**: `src/lib/trusted-device-api.ts` (NEW)
- **Action**: 4 API functions for trusted device endpoints
- **Functions**:

```typescript
import { apiClient } from './api';
import type { TrustedDeviceResponse, TrustDeviceResult, RevokeAllDevicesResponse, MessageResponse } from './types';

export function trustDevice(fingerprint: string): Promise<TrustDeviceResult>
// POST /auth/trusted-devices { fingerprint }

export function listTrustedDevices(): Promise<TrustedDeviceResponse[]>
// GET /auth/trusted-devices

export function revokeDevice(id: string): Promise<MessageResponse>
// DELETE /auth/trusted-devices/:id

export function revokeAllDevices(): Promise<RevokeAllDevicesResponse>
// DELETE /auth/trusted-devices (no body needed)
```

- **Implementation Notes**:
  - `trustDevice` uses `apiClient.post()`
  - `revokeDevice` uses `apiClient.delete()` (no body needed)
  - `revokeAllDevices` uses `apiClient.delete()` (no body needed)
  - Rate limit: POST is 5/60s; others unlimited

### Step 7: Create useTrustedDevices Hook

- **File**: `src/hooks/useTrustedDevices.ts` (NEW)
- **Action**: Custom hook encapsulating device list + CRUD
- **Exports**:

```typescript
export function useTrustedDevices() {
  return {
    devices: TrustedDeviceResponse[],
    isLoading: boolean,
    fetchDevices: () => Promise<void>,
    trustCurrentDevice: () => Promise<boolean>,
    revokeDevice: (id: string) => Promise<boolean>,
    revokeAllDevices: () => Promise<boolean>,
    error: string | null,
    clearError: () => void,
  };
}
```

- **Implementation Steps**:
  1. State: `devices`, `isLoading`, `error`
  2. `fetchDevices()`: Call `listTrustedDevices()`, store in state
  3. `trustCurrentDevice()`:
     - Get fingerprint via `getFingerprint()`
     - If empty, set error "Device fingerprinting not available"
     - Call `trustDevice(fingerprint)` → refresh list on success
     - Catch 429 → "Too many requests. Try again later."
  4. `revokeDevice(id)`: Call API `revokeDevice(id)` → refresh list
  5. `revokeAllDevices()`: Call API `revokeAllDevices()` → refresh list
  6. Error extraction: same `extractMessage()` pattern as `usePasskey.ts`
- **Dependencies**: `@/lib/trusted-device-api`, `@/lib/fingerprint`, `@/lib/types`

### Step 8: Create TrustedDevices Profile Component

- **File**: `src/components/profile/TrustedDevices.tsx` (NEW)
- **Action**: Profile section for listing and managing trusted devices
- **Component**: `export default function TrustedDevices()`

- **Implementation Steps**:
  1. **Section card**: Same style as PasskeyManager/ConnectedAccounts — `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card`
  2. **Header**: Icon (Shield) + "Trusted Devices" title + device count badge + "Revoke All" button (danger variant, visible when devices.length > 0)
  3. **Loading state**: Spinner while `isLoading && devices.length === 0`
  4. **Empty state**: "No trusted devices. When you log in with MFA and trust a device, it will appear here."
  5. **Device list items** — for each device:
     - Device icon: `Laptop` for desktop-sounding names, `Smartphone` for mobile
     - `deviceName` (e.g., "Chrome on Windows") — bold
     - `ipAddress` — secondary text
     - `lastVerifiedAt` — "Last verified: {relative time}"
     - `expiresAt` — "Expires: {date}"
     - Revoke button (Trash2 icon) → ConfirmModal
  6. **Revoke single modal**: ConfirmModal with title "Revoke Device Trust", description "This device will require MFA verification on next login.", variant="danger"
  7. **Revoke all modal**: ConfirmModal with title "Revoke All Devices", description "All devices will require MFA verification on next login. {count} devices will be affected.", variant="danger"
  8. **Success/error messages**: Local state with auto-dismiss (3s for success)
  9. **"Trust This Device" button**: Button that calls `trustCurrentDevice()` — only shown if browser fingerprinting is supported. Allows user to proactively trust their current device from the profile page.
- **Dependencies**: `useTrustedDevices` hook, `Button`, `ConfirmModal`, lucide icons (`Shield`, `Laptop`, `Smartphone`, `Trash2`, `AlertTriangle`, `ShieldCheck`)
- **Pattern Reference**: Follow PasskeyManager.tsx layout and styling exactly

### Step 9: Add TrustedDevices to Profile Page

- **File**: `src/app/profile/page.tsx`
- **Action**: Import and render TrustedDevices after PasskeyManager
- **Implementation Steps**:
  1. Import: `import TrustedDevices from '@/components/profile/TrustedDevices';`
  2. Add `<TrustedDevices />` after `<PasskeyManager />`
- **New order**:
  ```
  <ProfileForm />
  <ChangePasswordForm />
  <PasskeyManager />
  <TrustedDevices />     ← NEW
  <AccountInfo />
  <ConnectedAccounts />
  ```

### Step 10: Build Verification

- **Action**: Verify the build passes
- **Implementation Steps**:
  1. Run `npm run build` (or `npx next build`) in nexacore-dashboard/
  2. Verify 0 TypeScript errors, all pages compile
  3. Check that `/profile` page size increased (includes TrustedDevices)
  4. Check that `@fingerprintjs/fingerprintjs` is bundled (check shared chunks)

### Step 11: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes from steps 1-9
  2. **Update `integration-state.md`**: Add SCRUM-129 changelog entry
  3. **Verify `api-spec.yml`**: Trusted device endpoints should already be documented from SCRUM-107 backend — verify frontend consumption matches. Consider adding `X-Device-Fingerprint` header documentation to the login endpoint.
  4. **Verify Documentation**: Confirm all changes accurately reflected, English only
- **References**: Follow `documentation-standards.mdc`
- **Notes**: MANDATORY step before considering implementation complete

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-129-frontend`
2. **Step 1**: Install `@fingerprintjs/fingerprintjs`
3. **Step 2**: Add trusted device types to `types.ts`
4. **Step 3**: Create `fingerprint.ts` singleton module
5. **Step 4**: Add `deviceFingerprint` to `ApiClient` + header injection
6. **Step 5**: Generate fingerprint in `AuthProvider` on mount
7. **Step 6**: Create `trusted-device-api.ts` module
8. **Step 7**: Create `useTrustedDevices.ts` hook
9. **Step 8**: Create `TrustedDevices.tsx` component
10. **Step 9**: Add TrustedDevices to profile page
11. **Step 10**: Build verification (`next build`)
12. **Step 11**: Update technical documentation

## 5. Testing Checklist

### Build Verification
- [ ] `next build` passes with 0 errors
- [ ] No TypeScript errors

### Manual Verification
- [ ] Fingerprint generated on page load (check network tab for `X-Device-Fingerprint` header on any API request)
- [ ] Profile page shows "Trusted Devices" section
- [ ] Empty state shows when no devices are trusted
- [ ] "Trust This Device" button generates fingerprint and calls POST endpoint
- [ ] After trusting: device appears in list with correct name, IP, dates
- [ ] Revoke single device: confirmation modal → device removed from list
- [ ] Revoke all devices: confirmation modal → all devices removed
- [ ] Error states display correctly (network errors, 429)
- [ ] Build: `next build` passes

### MFA Skip Verification (requires MFA-enabled account)
- [ ] Login with MFA user + trusted device → MFA skipped, tokens returned directly
- [ ] Login with MFA user + untrusted device → MFA challenge returned
- [ ] After revoking device → next login requires MFA again

## 6. Error Handling Patterns

| Error Source | Error | Frontend Behavior |
|-------------|-------|-------------------|
| FingerprintJS | Library load failure | Fail silently; `getFingerprint()` returns empty string; MFA skip won't work but login is unaffected |
| Backend 401 | Unauthorized | Handled by ApiClient silent refresh + retry |
| Backend 429 | Rate limited on POST /trusted-devices | Show "Too many requests. Try again later." |
| Backend 404 | DELETE /:id device not found | Refresh list (device already removed), show error |
| Network | Connection error | Show "Network error. Please check your connection." (from ApiClient) |

## 7. UI/UX Considerations

### TailwindCSS & Theme
- Card: `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card` (matches all profile sections)
- Section header: `text-body-sm font-semibold uppercase tracking-wider text-content-primary`
- Device list items: `rounded-xl border border-border-default p-4` with `flex items-center justify-between`
- Error messages: `border-error-border bg-error-bg` with `AlertTriangle` icon
- Success messages: `border-success-border bg-success-bg` with `ShieldCheck` icon
- Use existing `Button` component (variants: outline, danger)
- Use existing `ConfirmModal` for revoke confirmations

### Responsive Design
- TrustedDevices: full width within `max-w-2xl` container (profile page constraint)
- Device list items: stack metadata vertically on mobile

### Accessibility
- Revoke buttons: `aria-label="Revoke trust for {deviceName}"`
- Loading states: screen reader announces "Loading trusted devices"

### Loading States
- List loading: Spinner on mount
- Trust device: Button loading state during API call
- Revoke: ConfirmModal loading state during API call

## 8. Dependencies

### External Libraries
- `@fingerprintjs/fingerprintjs` — open-source browser fingerprinting (MIT, ~12KB gzip)

### Internal Components Used
- `Button` (`@/components/ui/Button`) — outline, danger variants
- `ConfirmModal` (`@/components/ui/ConfirmModal`) — revoke confirmations
- `apiClient` (`@/lib/api`) — API singleton

### Lucide Icons
- `Shield` / `ShieldCheck` — section header + success badge
- `Laptop` / `Smartphone` — device type icons
- `Trash2` — revoke action
- `AlertTriangle` — error messages

## 9. Notes

- **Fingerprint is NOT sensitive**: The open-source FingerprintJS generates a hash from browser signals (canvas, WebGL, etc.). It's not PII — it's a derived identifier. The backend further hashes it with HMAC-SHA256 before storage.
- **No localStorage/sessionStorage**: Fingerprint is cached in-memory only. Regenerated each session (~150ms cold, instant warm).
- **MFA Trust checkbox deferred**: The "Trust this device" checkbox after MFA TOTP verification requires MFA TOTP step UI, which doesn't exist on main branch. The `trustCurrentDevice()` method is ready in the hook; it will be wired to the MFA flow when that UI is built.
- **X-Device-Fingerprint on all requests**: The header is sent on every request for simplicity. Backend only reads it during login; other endpoints ignore it.
- **Backend hashes the fingerprint**: Client sends raw visitorId. Backend applies `HMAC-SHA256(userId:fingerprint, derivedKey)` before storing. Client never sees or stores the hash.
- **Max 10 devices**: Backend auto-revokes oldest when limit exceeded. Frontend should refresh list after trusting.
- **30-day TTL**: Devices expire after 30 days (configurable server-side). Frontend shows expiry date.
- **All code and documentation in English**.

## 10. Next Steps After Implementation

1. Run build: `npm run build` — must pass with zero errors
2. Manual testing with backend running (localhost:3000 + localhost:3001)
3. Test MFA skip: login with MFA user after trusting device → should skip MFA
4. Create PR: `feature/SCRUM-129-frontend` → `main`
5. Update Jira ticket SCRUM-129 status

## 11. Implementation Verification

### Code Quality
- [ ] No TypeScript errors (`next build` passes)
- [ ] Consistent naming (PascalCase components, camelCase functions)
- [ ] No `any` types — all properly typed
- [ ] Fingerprint module has proper error handling (fail-open)

### Functionality
- [ ] Fingerprint generated on AuthProvider mount
- [ ] X-Device-Fingerprint header present on all API requests
- [ ] Trusted devices list renders correctly (empty + populated)
- [ ] Trust/revoke/revoke-all operations work
- [ ] Error states handled gracefully

### Integration
- [ ] Auth token refresh still works with fingerprint header
- [ ] Profile page renders TrustedDevices correctly
- [ ] Build size reasonable (fingerprint lib ~12KB gzip)

### Documentation
- [ ] `integration-state.md` updated with SCRUM-129 changelog
- [ ] Implementation record created after completion
