# Fullstack Implementation Plan: SCRUM-317 Trusted Devices Toast + Revoke Fix

## Overview

Fix two bugs in Trusted Devices: (1) duplicate trust toast when device already trusted, (2) wrong toast on trust failure (shows revoke error).

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-317-fullstack`

### Step 1: Backend — detect already-trusted in trustDevice
**File**: `src/auth/trusted-device.service.ts` (line 36)

Before the upsert, check if device already exists and is active:
```ts
const existing = await this.prisma.trustedDevice.findUnique({
  where: { userId_fingerprintHash: { userId, fingerprintHash } },
});
if (existing && !existing.isRevoked && existing.expiresAt > new Date()) {
  return { ...existing, alreadyTrusted: true };
}
```

### Step 2: Backend — return alreadyTrusted flag in controller
**File**: `src/auth/session.controller.ts` (line 105)

Check the returned device for `alreadyTrusted` flag and return 200 (not 201):

### Step 3: Frontend — different toast based on response
**File**: `src/components/profile/TrustedDevices.tsx` (line 70-78)

Check response for `alreadyTrusted` and show appropriate toast. Fix line 77 — wrong toast (REVOKE_FAILED → TRUST_FAILED).

### Step 4: Frontend — add toast constants
**File**: `src/lib/toast-messages.ts`

Add `DEVICE_ALREADY_TRUSTED` and `DEVICE_TRUST_FAILED` constants.

## Files
- `nexacore-api/src/auth/trusted-device.service.ts`
- `nexacore-api/src/auth/session.controller.ts`
- `nexacore-dashboard/src/components/profile/TrustedDevices.tsx`
- `nexacore-dashboard/src/lib/toast-messages.ts`
- `nexacore-dashboard/src/hooks/useTrustedDevices.ts`
