# Backend Implementation Plan: SCRUM-200 Update data-model.md with WebAuthnCredential and OAuthAccount

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-199 (Extract repeated magic strings to named constants)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `ai-specs/specs/data-model.md` — embedded Prisma schema starts at line 1069
    - Note at line 1071 says "10 implemented models" — actually 12
    - User model (line 1208) missing `webAuthnCredentials WebAuthnCredential[]` and `oauthAccounts OAuthAccount[]` relations
    - `WebAuthnCredential` model block: MISSING from embedded schema (exists at line 190-206 in actual `schema.prisma`)
    - `OAuthAccount` model block: MISSING from embedded schema (exists at line 209-223 in actual `schema.prisma`)
    - Both entity detail sections already exist (lines 805-847 and 850-883) — the gap is ONLY in the embedded Prisma schema block
  - `nexacore-api/prisma/schema.prisma` — lines 92-93 (User relations), 190-207 (WebAuthnCredential), 209-223 (OAuthAccount)
- **Constructor signatures verified**: Not applicable (no code changes)
- **Methods verified to exist**: Not applicable (no code changes)
- **Guard dependency chain verified**: Not applicable (no code changes)
- **Discrepancies with integration-state.md**: None

## Overview

Audit findings D-01/D-02: The embedded Prisma schema section of `data-model.md` is missing the `WebAuthnCredential` and `OAuthAccount` models that were added during Sprint 6 (SCRUM-160/161). The entity detail sections (fields, validation, invariants) already exist — only the embedded schema block and its note need updating. Documentation-only change, zero code changes.

## Architecture Context

- **Module**: None (documentation only)
- **Files modified**: `ai-specs/specs/data-model.md` only
- **No code, tests, or build changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-200-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-200-backend`

### Step 1: Update Embedded Schema Note

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Update the note at line 1071
- **Implementation Steps**:
  1. Change: `The Prisma schema below contains only the 10 implemented models and 4 implemented enums.`
  2. To: `The Prisma schema below contains only the 12 implemented models and 4 implemented enums.`
  3. Update: `Planned models (8-18)` → `Planned models (8-18)` (keep as-is — numbering refers to entity section numbers, not model count)

### Step 2: Add User Model Relations

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Add missing relations to the User model in the embedded Prisma schema
- **Implementation Steps**:
  1. After line 1240 (`trustedDevices TrustedDevice[]`), add:
     ```prisma
       webAuthnCredentials      WebAuthnCredential[]
       oauthAccounts            OAuthAccount[]
     ```
- **Implementation Notes**: Must match the actual schema.prisma (lines 92-93) exactly

### Step 3: Add WebAuthnCredential and OAuthAccount Model Blocks

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Insert both model blocks into the embedded Prisma schema, after the `TrustedDevice` model and before `// ─── RBAC ───`
- **Implementation Steps**:
  1. After line 1335 (`}` closing TrustedDevice), insert:
     ```prisma

     model WebAuthnCredential {
       id           String    @id @default(uuid())
       userId       String
       credentialId String    @unique
       publicKey    Bytes
       signCount    Int       @default(0)
       transports   String[]  @default([])
       backedUp     Boolean   @default(false)
       deviceType   String    @default("singleDevice")
       name         String?
       lastUsedAt   DateTime?
       createdAt    DateTime  @default(now())

       user User @relation(fields: [userId], references: [id], onDelete: Cascade)

       @@index([userId])
       @@map("webauthn_credentials")
     }

     model OAuthAccount {
       id         String   @id @default(uuid())
       userId     String
       provider   Provider
       providerId String
       email      String
       createdAt  DateTime @default(now())

       user User @relation(fields: [userId], references: [id], onDelete: Cascade)

       @@unique([provider, providerId])
       @@unique([userId, provider])
       @@index([userId])
       @@map("oauth_accounts")
     }
     ```
- **Implementation Notes**: Copy exactly from `schema.prisma` lines 190-223. Insert before the `// ─── RBAC ───` comment (line 1337).

### Step 4: Update Technical Documentation

- **Action**: Run `/update-docs SCRUM-200` after implementation

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update embedded schema note (10 → 12 models)
3. Step 2: Add User model relations (webAuthnCredentials, oauthAccounts)
4. Step 3: Add WebAuthnCredential and OAuthAccount model blocks
5. Step 4: Update documentation

## Testing Checklist

- [ ] No code changes — no tests to run
- [ ] Embedded schema matches actual `schema.prisma` for all 12 implemented models
- [ ] User model relations in embedded schema match actual schema
- [ ] Note correctly says "12 implemented models"

## Error Response Format

No new error responses. Documentation-only change.

## Dependencies

No new dependencies.

## Notes

- **No code changes** — this is purely a documentation fix
- **Entity detail sections already exist** — sections 20 (WebAuthnCredential) and 21 (OAuthAccount) in data-model.md are complete with fields, validation rules, business invariants, and domain events
- **Only the embedded Prisma schema block** (starting at line 1069) was not updated when these models were added during Sprint 6
- No tests, build, or runtime verification needed

## Next Steps After Implementation

1. Run `/update-docs SCRUM-200`
2. Create PR, merge to main
3. Transition SCRUM-200 to Done
4. Proceed with next Sprint 8 ticket

## Implementation Verification

- [ ] Documentation: Embedded Prisma schema includes all 12 implemented models
- [ ] Accuracy: Model blocks match actual `schema.prisma` exactly
- [ ] Consistency: Note updated to reflect correct model count
