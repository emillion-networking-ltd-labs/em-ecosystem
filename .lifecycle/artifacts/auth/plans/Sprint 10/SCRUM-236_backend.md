# Backend Implementation Plan: SCRUM-236 Batch WARN Remediation

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-234 (Extract inline error strings)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/tsconfig.json` — `sourceMap: true` at line 15
  - `nexacore-api/nest-cli.json` — no tsconfig override, uses default tsconfig.json
  - `nexacore-api/package.json` — `dotenv` in devDependencies (line 83), build script: `nest build` (line 13)
  - `nexacore-api/prisma/schema.prisma` — Permission model at line 229 (no updatedAt), sensitive fields: passwordHash (69), mfaSecret (81), tokenFamily (102), tokenHash (148, 163), refreshTokenHash (103)
  - `nexacore-api/src/main.ts` — `import 'dotenv/config'` at line 1 (production import from devDep)
  - `ai-specs/specs/data-model.md` — Session fields (line 141-155, missing updatedAt), WebAuthnCredential fields (line 811-822, missing updatedAt)
  - `ai-specs/specs/api-spec.yml` — AuthResponse (line 3266-3276, has refreshToken), TokenResponse (line 3303-3309, has refreshToken), MFA setup (849, missing 409), MFA delete (961, missing 400/401), MFA status (1030, missing 401)
- **Discrepancies with integration-state.md**: None relevant to this ticket

## 2. Overview

Batch remediation of 6 low-severity WARN findings from audit-2026-03-14T01-32. All changes are independent, small, and span config, schema, and documentation files. No behavioral changes to application code.

## 3. Architecture Context

- **Modules involved**: None (no service/controller changes)
- **Files affected**:
  - `nexacore-api/tsconfig.prod.json` (new)
  - `nexacore-api/package.json` (move dotenv)
  - `nexacore-api/prisma/schema.prisma` (add comments + updatedAt)
  - `ai-specs/specs/data-model.md` (add updatedAt to 2 model descriptions)
  - `ai-specs/specs/api-spec.yml` (fix response schemas + add error responses)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-236-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-236-backend`

### Step 1: Create tsconfig.prod.json (B-08)

- **File**: `nexacore-api/tsconfig.prod.json` (new)
- **Action**: Create production TypeScript config that disables source maps
- **Implementation Steps**:
  1. Create `tsconfig.prod.json` extending `tsconfig.json` with `"sourceMap": false`
  2. Update `package.json` build script to use the production tsconfig: `"build": "nest build --config tsconfig.prod.json"` — **WAIT**: `nest build` uses `nest-cli.json`, not tsconfig directly. Instead:
     - Add `"build:prod"` script: `"build:prod": "nest build --tsc -- --project tsconfig.prod.json"`
     - OR simpler: just add `tsconfig.prod.json` for documentation/deployment reference. The `nest build` command uses `tsconfig.json` by default. Production deployments should strip `.map` files or use this tsconfig.
  3. **Decision**: Create the file as a deployment reference. Do NOT change the default build script (it would break `nest start --watch` which needs source maps for debugging).

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false
  }
}
```

### Step 2: Add `/// @sensitive` Comments to Schema (V8.3.4)

- **File**: `nexacore-api/prisma/schema.prisma`
- **Action**: Add `/// @sensitive` comment above each sensitive field
- **Implementation Steps**:
  1. Add `/// @sensitive — User password bcrypt hash` above `passwordHash` (line 69)
  2. Add `/// @sensitive — TOTP secret, AES-256-GCM encrypted` above `mfaSecret` (line 81)
  3. Add `/// @sensitive — Hashed MFA recovery codes` above `mfaRecoveryCodes` (line 82)
  4. Add `/// @sensitive — Bcrypt hash of refresh token` above `refreshTokenHash` (line 103)
  5. Add `/// @sensitive — SHA-256 hash of verification token` above `tokenHash` in EmailVerificationToken (line 148)
  6. Add `/// @sensitive — SHA-256 hash of reset token` above `tokenHash` in PasswordResetToken (line 163)
  7. Run `npx prisma format` to ensure schema formatting is correct
  8. Run `npx prisma generate` to verify schema is valid (no migration needed — comments don't change schema)

### Step 3: Add updatedAt to Permission Model (D-11)

- **File**: `nexacore-api/prisma/schema.prisma`
- **Action**: Add `updatedAt DateTime @updatedAt` to Permission model
- **Implementation Steps**:
  1. Add `updatedAt DateTime @updatedAt` after `createdAt` (line 235) in the Permission model
  2. Run `npx prisma migrate dev --name add_updated_at_permission` to create migration
  3. Run `npx prisma generate` to update the client

### Step 4: Move dotenv to dependencies (DEP-05)

- **File**: `nexacore-api/package.json`
- **Action**: Move `dotenv` from `devDependencies` to `dependencies`
- **Implementation Steps**:
  1. Remove `"dotenv": "^17.3.1"` from `devDependencies` (line 83)
  2. Add `"dotenv": "^17.3.1"` to `dependencies` section (alphabetical order, after `cookie-parser`)
  3. Run `npm install` to update the lock file

### Step 5: Update data-model.md (D-02)

- **File**: `ai-specs/ai-specs/specs/data-model.md`
- **Action**: Add `updatedAt` to Session and WebAuthnCredential field descriptions
- **Implementation Steps**:
  1. **Session** (after line 153 `createdAt`): Add `- \`updatedAt\`: Record update timestamp (auto-managed by Prisma @updatedAt)`
  2. **WebAuthnCredential** (after line 822 `createdAt`): Add `- \`updatedAt\`: Record update timestamp (auto-managed by Prisma @updatedAt)`
  3. **Permission** (after line 292 `createdAt`): Add `- \`updatedAt\`: Record update timestamp (auto-managed by Prisma @updatedAt)` — since Step 3 adds it to the schema
  4. Fix model count if documented as "12 implemented models" — actual count is 10

### Step 6: Update api-spec.yml (A-05 / A-06)

- **File**: `ai-specs/ai-specs/specs/api-spec.yml`
- **Action**: Fix response schemas and add missing error responses
- **Implementation Steps**:
  1. **AuthResponse** (line 3266): Remove `refreshToken` property. Add comment: `# Refresh token sent via httpOnly cookie, not in response body`
  2. **TokenResponse** (line 3303): Remove `refreshToken` property. Add same comment.
  3. **POST /auth/mfa/setup** (line 849): Add `409` response: `description: MFA is already enabled`
  4. **DELETE /auth/mfa** (line 961): Add `400` response: `description: Invalid password` and `401` response: `description: Unauthorized`
  5. **GET /auth/mfa/status** (line 1030): Add `401` response: `description: Unauthorized`

### Step 7: Update Technical Documentation

- **Action**: Add changelog entry to integration-state.md
- **Implementation Steps**:
  1. Update header with SCRUM-236 reference
  2. Add changelog entry: `SCRUM-236: Add @sensitive schema comments, updatedAt to Permission, fix api-spec response schemas, move dotenv to deps, add tsconfig.prod.json`

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create tsconfig.prod.json (B-08)
3. Step 2: Add @sensitive comments to schema (V8.3.4)
4. Step 3: Add updatedAt to Permission + migrate (D-11)
5. Step 4: Move dotenv to dependencies (DEP-05)
6. Step 5: Update data-model.md (D-02)
7. Step 6: Update api-spec.yml (A-05/A-06)
8. Step 7: Update integration-state.md

## 6. Testing Checklist

- [ ] `npx prisma generate` succeeds
- [ ] `npx prisma migrate status` shows no pending migrations
- [ ] `nest build` compiles without errors
- [ ] `npm test` — all tests pass (no behavioral changes expected)
- [ ] `npm install` succeeds with dotenv in dependencies

## 7. Error Response Format

N/A — no endpoint changes.

## 8. Dependencies

- No new external libraries
- `dotenv` moved from devDependencies to dependencies (same version)

## 9. Notes

- **No behavioral changes**: This ticket only touches config, schema comments, a schema field addition, and documentation.
- **Migration**: Only one new migration (Permission updatedAt). The Permission table is small (9 rows from seed), so the migration is instant.
- **tsconfig.prod.json**: Created as reference for deployment. Default build is unchanged to preserve dev experience.
- **api-spec.yml**: Removing refreshToken from response schemas reflects actual code behavior (tokens sent via httpOnly cookies, not response body). This is a spec correction, not a code change.
