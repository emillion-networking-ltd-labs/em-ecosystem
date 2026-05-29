# Backend Implementation Plan: SCRUM-220 — Document Sensitive Prisma Fields (I-10)

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-219 (Unify authorization guard error messages)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/prisma/schema.prisma` — 8 sensitive fields across 5 models, none currently have `/// @sensitive` comments
  - `ai-specs/specs/data-model.md` — Entity definitions, no `[SENSITIVE]` badges on field descriptions
- **Constructor signatures verified**: N/A (no code changes)
- **Methods verified to exist**: N/A (no code changes)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## Overview

Add `/// @sensitive` documentation comments to all sensitive fields in `schema.prisma` and `[SENSITIVE]` badges in `data-model.md`, per OWASP ASVS V8.3.4 (sensitive data identification). Documentation-only — no code changes, no migration, no test impact.

**Standard**: OWASP ASVS V8.3.4

## Architecture Context

- **Module**: N/A (documentation-only)
- **Files affected**: 2 documentation files
  - `nexacore-api/prisma/schema.prisma` — Add `/// @sensitive` comments (8 fields)
  - `ai-specs/specs/data-model.md` — Add `[SENSITIVE]` badges (8 fields)

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-220-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-220-backend`
  3. Verify: `git branch`

### Step 1: Add @sensitive Comments to schema.prisma

- **File**: `nexacore-api/prisma/schema.prisma`
- **Action**: Add `/// @sensitive` triple-slash doc comments above each sensitive field
- **Implementation Steps**:
  1. **User.passwordHash** (line 69) — Add above:
     ```prisma
     /// @sensitive — bcrypt-hashed user password. Never include in API responses or logs.
     ```
  2. **User.mfaSecret** (line 81) — Add above:
     ```prisma
     /// @sensitive — TOTP shared secret, AES-256 encrypted at rest. Never expose outside MFA setup flow.
     ```
  3. **User.mfaRecoveryCodes** (line 82) — Add above:
     ```prisma
     /// @sensitive — bcrypt-hashed one-time recovery codes. Never expose after initial generation.
     ```
  4. **Session.refreshTokenHash** (line 103) — Add above:
     ```prisma
     /// @sensitive — bcrypt hash of refresh JWT. Used for token rotation theft detection.
     ```
  5. **EmailVerificationToken.tokenHash** (line 148) — Add above:
     ```prisma
     /// @sensitive — SHA-256 hash of verification token. Original token sent via email only.
     ```
  6. **PasswordResetToken.tokenHash** (line 162) — Add above:
     ```prisma
     /// @sensitive — SHA-256 hash of reset token. Original token sent via email only.
     ```
  7. **TrustedDevice.fingerprintHash** (line 177) — Add above:
     ```prisma
     /// @sensitive — HMAC-SHA256 hash of device fingerprint. Original fingerprint never stored.
     ```
  8. **WebAuthnCredential.publicKey** (line 195) — Add above:
     ```prisma
     /// @sensitive — COSE-encoded public key (cryptographic material). Used for WebAuthn assertion verification.
     ```

### Step 2: Add [SENSITIVE] Badges to data-model.md

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Add `[SENSITIVE]` badge after field type for each of the 8 sensitive fields in the corresponding model documentation
- **Implementation Steps**:
  1. Find each model section (User, Session, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential)
  2. Add `[SENSITIVE]` badge to field descriptions for: `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`, `refreshTokenHash`, `tokenHash` (x2), `fingerprintHash`, `publicKey`

### Step 3: Verify No Schema Changes

- **Action**: Confirm Prisma comments don't create a migration
- **Implementation Steps**:
  1. Run: `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma`
  2. Expected: no diff (triple-slash comments are metadata, not schema)
  3. Run: `npx nest build` — must compile clean
  4. Run: `npx jest --maxWorkers=1 --forceExit` — 870+ tests must pass

### Step 4: Update Technical Documentation

- **Action**: Integration-state.md changelog entry only.
- **Implementation Steps**:
  1. No `api-spec.yml` changes (no endpoints modified)
  2. `integration-state.md`: Add changelog entry

## Implementation Order

1. Step 0: Create feature branch `feature/SCRUM-220-backend`
2. Step 1: Add `/// @sensitive` comments to schema.prisma (8 fields)
3. Step 2: Add `[SENSITIVE]` badges to data-model.md (8 fields)
4. Step 3: Verify no schema changes, build clean, tests pass
5. Step 4: Documentation (changelog only)

## Testing Checklist

- [ ] All 8 sensitive fields have `/// @sensitive` comments in schema.prisma
- [ ] Comments include field purpose and hash/encryption algorithm
- [ ] `data-model.md` has `[SENSITIVE]` badges for all 8 fields
- [ ] No Prisma migration generated (comments are metadata only)
- [ ] `nest build` compiles clean
- [ ] All 870+ tests pass

## Error Response Format

N/A — no endpoint or error handling changes.

## Dependencies

- None

## Notes

- Prisma triple-slash comments (`///`) are documentation comments — they appear in generated Prisma Client types as JSDoc but do NOT affect the database schema
- No migration is needed — this is purely documentation
- The `@sensitive` tag is a project convention for marking fields that must never appear in API responses, logs, or error messages
- `toSafeUser()` already excludes `passwordHash`, `mfaSecret`, `mfaRecoveryCodes` from API responses — this annotation documents the intent

## Next Steps After Implementation

1. Run `/verify SCRUM-220` to validate implementation
2. Run `/commit SCRUM-220` to commit changes
3. Run `/update-docs SCRUM-220` to create implementation record

## Implementation Verification

- [ ] All sensitive fields annotated with `/// @sensitive`
- [ ] `data-model.md` updated with `[SENSITIVE]` badges
- [ ] No schema migration generated
- [ ] Build compiles clean
- [ ] All tests pass
