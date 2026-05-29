# Backend Implementation Plan: SCRUM-271 — Update Permission Model in Embedded Prisma Schema

## 1. Header

- **Ticket**: SCRUM-271
- **Type**: Documentation fix (audit remediation)
- **Scope**: docs-only — no code changes
- **Parent**: SCRUM-270 (Audit Report 2026-03-16 22:30)
- **Audit finding**: D-02 (RECURRENT from 2026-03-15)

## 2. Codebase State Snapshot

- **Date**: 2026-03-17
- **Last completed ticket**: SCRUM-269 (PR #143)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/prisma/schema.prisma` — 10 models, 4 enums. Permission model at line 235 includes `updatedAt DateTime @updatedAt`
  - `ai-specs/ai-specs/specs/data-model.md` — embedded schema at line 1114+. Permission model at line 1421 is MISSING `updatedAt`. Note at line 1112 says "12 implemented models" (should be 10)

## 3. Regression Impact Analysis

- **Blast radius**: 0 files. This is a documentation-only change to `data-model.md`
- **Breaking changes**: None
- **API contract impact**: None
- **Schema migration impact**: None
- **Test files requiring updates**: None
- **Blast radius size**: 0 files

## 4. Overview

Fix 2 documentation inconsistencies in `ai-specs/ai-specs/specs/data-model.md` embedded Prisma schema to match the live `schema.prisma`:
1. Add missing `updatedAt DateTime @updatedAt` to Permission model
2. Correct model count from "12" to "10"

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-271-backend`
- **Base**: `main`

### Step 1: Fix Permission Model in Embedded Schema

- **File**: `ai-specs/ai-specs/specs/data-model.md`
- **Line**: 1427
- **Action**: Add `updatedAt   DateTime         @updatedAt` after the `createdAt` line (line 1427), matching live schema.prisma:242
- **Before**:
  ```prisma
  createdAt   DateTime         @default(now())

  rolePermissions RolePermission[]
  ```
- **After**:
  ```prisma
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  rolePermissions RolePermission[]
  ```

### Step 2: Fix Model Count in Note

- **File**: `ai-specs/ai-specs/specs/data-model.md`
- **Line**: 1112
- **Action**: Change "12 implemented models" to "10 implemented models"
- **Before**: `> **Note**: The Prisma schema below contains only the 12 implemented models and 4 implemented enums.`
- **After**: `> **Note**: The Prisma schema below contains only the 10 implemented models and 4 implemented enums.`

### Step 3: Spot-Check Other Implemented Models

- **Action**: Verify that the other 9 implemented models (User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, OAuthAccount, RolePermission) in the embedded schema match their live schema.prisma counterparts. Flag any additional discrepancies found.

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add `updatedAt` to Permission model
3. Step 2: Fix model count note
4. Step 3: Spot-check other models

## 7. Testing Checklist

- [ ] Permission model in data-model.md matches live schema.prisma
- [ ] Model count note says "10 implemented models"
- [ ] Enum count note says "4 implemented enums" (already correct)
- [ ] No other embedded model discrepancies found

## 8. Notes

- This is a RECURRENT finding (2nd audit cycle). Root cause: embedded schema in data-model.md is manually maintained.
- No automated sync exists — recurrence prevention recommendation: add "sync embedded schema" to `/update-docs` checklist when Prisma changes occur.
