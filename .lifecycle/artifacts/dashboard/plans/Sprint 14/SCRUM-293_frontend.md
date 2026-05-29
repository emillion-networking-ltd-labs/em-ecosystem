# Frontend Implementation Plan: SCRUM-293 Session/Device Management & Security Activity UI (Retroactive)

## Overview

Expose 3 backend APIs that were already implemented but had no frontend UI: Active Sessions, Trusted Devices, and Security Activity Timeline. All placed in the profile page as sections.

**Note**: This plan is retroactive — the implementation was completed in prior sprints as part of the profile page buildout. This plan documents the actual state for compliance.

## Architecture Context

- **Backend endpoints** (all pre-existing):
  - `GET /auth/sessions` — list active sessions
  - `DELETE /auth/sessions/:id` — revoke session
  - `GET /auth/trusted-devices` — list trusted devices
  - `DELETE /auth/trusted-devices/:id` — remove trusted device
  - `GET /users/me/security-activity` — paginated security events
- **Frontend components**: `profile/ActiveSessions.tsx`, `profile/TrustedDevices.tsx`, `profile/SecurityActivity.tsx`
- **API clients**: `lib/security-activity-api.ts`, `lib/trusted-device-api.ts`
- **Custom hook**: `hooks/useTrustedDevices.ts`
- **Integration page**: `app/profile/page.tsx`

## Implementation Steps (as executed)

### Step 1: API Client Methods

**Files**: `src/lib/security-activity-api.ts`, `src/lib/trusted-device-api.ts`

- `getSecurityActivity(page, limit)` → `GET /users/me/security-activity`
- `getActiveSessions()` → `GET /auth/sessions`
- `revokeSession(id)` → `DELETE /auth/sessions/:id`
- `revokeAllSessions()` → `POST /auth/logout-all`
- `trustDevice(fingerprint)` → `POST /auth/trusted-devices`
- `listTrustedDevices()` → `GET /auth/trusted-devices`
- `revokeDevice(id)` → `DELETE /auth/trusted-devices/:id`
- `revokeAllDevices()` → `DELETE /auth/trusted-devices`

### Step 2: ActiveSessions Component

**File**: `src/components/profile/ActiveSessions.tsx`

- Lists sessions with device type parsing from userAgent (Mobile/Desktop icons)
- Shows IP address, last active (relative time), current session badge (green)
- Revoke individual sessions with loading state + toast
- "Revoke all others" bulk action
- Error handling with toast notifications

### Step 3: TrustedDevices Component

**File**: `src/components/profile/TrustedDevices.tsx`

- Custom hook `useTrustedDevices()` for state management
- Lists devices with type detection, IP, last verified, expiration
- "Trust This Device" with fingerprinting
- Revoke individual/all with confirmation modal
- Device count badge, empty state, loading states

### Step 4: SecurityActivity Component

**File**: `src/components/profile/SecurityActivity.tsx`

- Paginated timeline (10 events/page)
- 26 audit action types with labels and color categories (info/success/warning/danger)
- IP address + formatted timestamp per event
- Pagination controls
- Loading and empty states

### Step 5: Profile Page Integration

**File**: `src/app/profile/page.tsx`

All 3 components mounted in profile page order:
1. ProfileForm
2. ChangeEmailForm
3. ChangePasswordForm
4. MfaSetup
5. PasskeyManager
6. TrustedDevices
7. AccountInfo
8. ConnectedAccounts
9. ActiveSessions
10. DeleteAccount
11. SecurityActivity

## Type Definitions

```typescript
// SessionResponse
{ id, deviceInfo, ipAddress, userAgent, locationCity, locationCountry, createdAt, lastUsedAt, expiresAt, isCurrent }

// TrustedDeviceResponse
{ id, deviceName, ipAddress, lastVerifiedAt, expiresAt, createdAt }

// SecurityEvent
{ id, action, ipAddress, userAgent, metadata, createdAt }

// PaginatedResponse<T>
{ data: T[], meta: { total, page, limit, totalPages } }
```

All types synchronized between backend and frontend.

## Security

- All endpoints: JwtAuthGuard (Bearer token)
- DELETE session/device: ownership verification (userId match)
- POST trusted-devices: rate limited
- Security activity: scoped to authenticated user only
