# Backend Implementation Plan: SCRUM-311 Download OAuth Avatar Locally

## Codebase State Snapshot

- **Date**: 2026-04-18
- **Last completed ticket**: SCRUM-316 (401 race condition fix)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/users/users.service.ts` — findOrCreateByOAuth (line 136-302), uploadAvatar (line 510-560), constructor (line 50-63)
  - `nexacore-api/src/storage/file-storage.interface.ts` — FileStorageService interface (upload, delete, getPublicUrl)
  - `nexacore-api/src/common/interfaces/oauth-profile.interface.ts` — OAuthProfile (avatarUrl?: string)
  - `nexacore-api/src/auth/strategies/google.strategy.ts` — avatarUrl from profile.photos[0].value (line 84)
  - `nexacore-api/src/auth/strategies/github.strategy.ts` — avatarUrl from profile.photos[0].value (line 94)
- **Constructor verified**: `UsersService(prisma, auditService, sessionsService, mailService, passwordBreachService, trustedDeviceService, tokenDenyListService, storage)` — 8 deps, `storage` already injected (FILE_STORAGE token)
- **Methods verified**: `this.storage.upload(buffer, key)` returns `/uploads/avatars/{key}`

## Regression Impact Analysis

- **Blast radius**: 2 files directly affected (users.service.ts + tests)
- **Breaking changes**: None — findOrCreateByOAuth signature unchanged, OAuthProfile unchanged
- **API contract**: No endpoint changes — avatarUrl field type unchanged (still string), only value changes from external URL to local path
- **Test files requiring updates**: `users.service.spec.ts` — findOrCreateByOAuth tests (line 361+)
- **Blast radius size**: 2 files — low risk

## Overview

Download OAuth profile photos server-side and store locally via FileStorageService instead of saving external URLs (Google/GitHub). Prevents CSP blocking, expired URLs, and external dependency.

## Architecture Context

- **Module**: UsersModule (existing)
- **Pattern**: Same as uploadAvatar (SCRUM-306) — `this.storage.upload(buffer, key)` returns local `/uploads/avatars/` path
- **Dependency**: `FileStorageService` already injected in UsersService constructor as `this.storage`
- **No new modules/guards/services**

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-311-backend`

### Step 1: Create downloadAndStoreAvatar Private Method

**File**: `src/users/users.service.ts`

Add private method after `anonymizeAndDelete`:

```ts
private async downloadAndStoreAvatar(
  externalUrl: string,
  userId: string,
): Promise<string | null> {
  try {
    const response = await fetch(externalUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('webp') ? 'webp'
      : 'jpg';

    const buffer = Buffer.from(await response.arrayBuffer());
    const key = `${userId}-oauth.${ext}`;
    return await this.storage.upload(buffer, key);
  } catch {
    // Download failure must NOT block login
    return null;
  }
}
```

**Key design decisions**:
- 5 second timeout to avoid blocking login
- Extension from Content-Type (Google=JPEG, GitHub=PNG typically)
- Key format `{userId}-oauth.{ext}` — overwrites on each OAuth login (latest provider avatar)
- Returns null on any failure — login continues without avatar

### Step 2: Update findOrCreateByOAuth — profileData Construction

**File**: `src/users/users.service.ts` (line 140-145)

Replace synchronous avatar assignment with async download. The `profileData` object can no longer include avatarUrl directly since download is async. Instead, download after we have the userId.

**Strategy**: Remove avatarUrl from profileData. After user is found/created, if user has no avatarUrl and profile provides one, download and update.

```ts
const profileData = {
  ...(profile.firstName && { firstName: profile.firstName }),
  ...(profile.lastName && { lastName: profile.lastName }),
  // avatarUrl handled separately via downloadAndStoreAvatar (needs userId)
};
```

### Step 3: Add Avatar Download After Each User Path

There are 4 code paths in findOrCreateByOAuth where avatarUrl was set:

**Path A — Existing account, profile update** (line 176-194):
After the user update, if user had no avatar and profile provides one:
```ts
if (!existingUser.avatarUrl && profile.avatarUrl) {
  const localAvatar = await this.downloadAndStoreAvatar(profile.avatarUrl, existingUser.id);
  if (localAvatar) {
    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: { avatarUrl: localAvatar },
    });
  }
}
```

**Path B — Email lookup, auto-verify** (line 224-242):
Remove avatarUrl from profileData spread (already done in Step 2). After transaction, download:
```ts
if (!existingUser.avatarUrl && profile.avatarUrl) {
  const localAvatar = await this.downloadAndStoreAvatar(profile.avatarUrl, existingUser.id);
  if (localAvatar) {
    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: { avatarUrl: localAvatar },
    });
  }
}
```

**Path C — Email lookup, link** (line 261-278):
Same pattern after the transaction.

**Path D — New user** (line 283-297):
After user creation, download if profile has avatar:
```ts
if (profile.avatarUrl) {
  const localAvatar = await this.downloadAndStoreAvatar(profile.avatarUrl, user.id);
  if (localAvatar) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: localAvatar },
    });
  }
}
```

**Guard**: All paths check `!user.avatarUrl` before downloading — never overwrites user-uploaded avatars (SCRUM-306).

### Step 4: Update Tests

**File**: `src/users/tests/users.service.spec.ts`

**Mock setup**: Add `global.fetch` mock in beforeEach:
```ts
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  headers: { get: () => 'image/jpeg' },
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
});
```

**Test updates for findOrCreateByOAuth**:
- Verify `storage.upload` is called when profile has avatarUrl and user has none
- Verify `storage.upload` is NOT called when user already has avatarUrl
- Verify download failure does not throw (login continues)
- Verify correct key format: `{userId}-oauth.jpg`

### Step 5: Update Documentation

- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: downloadAndStoreAvatar method
3. Step 2: Remove avatarUrl from profileData
4. Step 3: Add download calls to 4 paths
5. Step 4: Update tests
6. Step 5: Documentation

## Testing Checklist

- [ ] OAuth login (Google) stores avatar at `/uploads/avatars/{userId}-oauth.jpg`
- [ ] OAuth login (GitHub) stores avatar locally
- [ ] User with existing uploaded avatar (SCRUM-306) is NOT overwritten on re-login
- [ ] Download failure does not block login (avatar stays null)
- [ ] Download timeout (5s) does not hang login
- [ ] No external URLs stored in user.avatarUrl
- [ ] Build: `nest build` clean
- [ ] Tests: all pass

## Dependencies

- No new dependencies — uses Node.js native `fetch` (available in Node 18+)

## Notes

- `AbortSignal.timeout(5000)` requires Node 18+ (project uses Node 22 per .nvmrc)
- The key `{userId}-oauth.{ext}` means each OAuth re-login overwrites the previous OAuth avatar — this is intentional (keeps latest provider photo)
- User-uploaded avatars use `{userId}-{timestamp}-cropped.{ext}` format — no collision with OAuth key pattern
- If we later want to preserve both OAuth and user-uploaded avatars, the key format allows differentiation
