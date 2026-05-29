---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-490
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-19
status: draft
last_completed_ticket: SCRUM-492
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-490 Backend Coverage Debt Sweep (raise main above 90% line)

## 1. Codebase State Snapshot

- **Date**: 2026-05-19
- **Last completed ticket**: SCRUM-492 (AUTH v2 Phase 1.1 — Token Engine v2 internal scaffolding, merged `309c38f`)
- **Integration state verified**: Yes (read `ai-specs/specs/integration-state.md` header line confirms `Last update: SCRUM-492 (2026-05-19)`)
- **Files verified against live code** (all read from `nexacore-api/src/`):
  - `users/dto/admin-update-user.dto.ts` (12 LOC; decorators: `@IsOptional`, `@IsEnum(Role)`, `@IsBoolean`; fields: `role?: Role`, `isActive?: boolean`)
  - `users/dto/change-email.dto.ts` (11 LOC; `@IsEmail`, `@IsString`, `@MinLength(8)`, `@MaxLength(128)`; fields: `newEmail`, `password`)
  - `users/dto/change-password.dto.ts` (12 LOC; `@IsOptional`, `@IsString`, `@MinLength(8)`, `@MaxLength(128)`; fields: `currentPassword?`, `newPassword`)
  - `users/dto/delete-account.dto.ts` (9 LOC; `@IsOptional`, `@IsString`, `@MinLength(8)`, `@MaxLength(128)`; field: `password?`)
  - `users/dto/list-security-activity-query.dto.ts` (20 LOC; `@IsOptional`, `@Type(() => Number)`, `@IsInt`, `@Min`, `@Max`; fields: `page=1`, `limit=20`, defaults built-in)
  - `users/dto/unlink-oauth.dto.ts` (8 LOC; `@IsString`, `@MinLength(8)`, `@MaxLength(128)`; field: `password`)
  - `users/dto/update-profile.dto.ts` (22 LOC; `@IsOptional`, `@IsString`, `@MaxLength(100)`, `@IsUrl({require_protocol:true})`; fields: `firstName?`, `lastName?`, `avatarUrl?`)
  - `tenants/dto/invitation-response.dto.ts` (42 LOC; `@ApiProperty` decorators only — NO class-validator; shape: id, tenantId, email, role: TenantRole, token: string|null, expiresAt: Date, createdAt: Date)
  - `tenants/dto/member-response.dto.ts` (49 LOC; `@ApiProperty` only; exports BOTH `MemberResponseDto` AND `MemberListResponseDto` wrapper)
  - `users/enums/role.enum.ts` (Role = SUPERADMIN | ADMIN | USER)
  - `users/tests/list-users-query.dto.spec.ts` (existing convention reference)
  - `nexacore-api/package.json` jest.coverageThreshold.global = { branches:80, functions:85, lines:90, statements:90 }
- **Constructor signatures verified**: **N/A** — no class is modified by this ticket. DTOs have no constructor (use property assignment via class-transformer `plainToInstance`).
- **Methods verified to exist**: **N/A** — no service method is referenced as integration point. Pure test-file additions.
- **Guard dependency chain verified**: **N/A** — no controller or guard changes.
- **Discrepancies with integration-state.md**: **None**.

### Plan-time decisions

**CI Gate Anticipation** (per SCRUM-485 mandate):

| CI gate (em-ecosystem `Security Pipeline`) | Expected behavior |
|-----|-----|
| Layer 1: Secrets Detection | PASS / unchanged (no new secrets/tokens in test fixtures) |
| Layer 2: Dependency Audit (nexacore-api) | PASS / unchanged (no new dependencies) |
| Layer 2: Dependency Audit (nexacore-dashboard) | PASS / unchanged (not touched) |
| Layer 3: SAST (Backend) | PASS / unchanged (test code only, no production paths) |
| Layer 3: SAST (Frontend) | PASS / unchanged |
| **Layer 4: Tests (Backend)** | **PASS — primary target gate** (1241 + ~50 new tests; statements + lines ≥ 90.5% margin clears 90% threshold) |
| Layer 4: Tests (Frontend) | PASS / unchanged |
| Layer 5: Build (Backend) | PASS (gated by L4 — only runs if L4 green) |
| Layer 5: Build (Frontend) | PASS / unchanged |
| Security Gate (All Checks) | PASS (cascade from L4 unblock) |

**This is the FIRST plan in the wave where Layer 4 Backend Tests PASS is the explicit, primary success metric** — not a byproduct. Historical context: SCRUM-487 + SCRUM-492 needed admin override on this exact gate. SCRUM-490's entire purpose is to clear it organically. If `npx jest --coverage` does NOT show statements + lines ≥ 90.5% in dev verification, the implementation is incomplete — add more DTO specs until margin is met.

**No ai-specs artifact files created** by this ticket → no SKIP_PATHS / SCHEMA_BY_PATH additions needed.

**No `nexacore-api/prisma/schema.prisma` touch** → no migration. **No `src/auth/**` touch** → §15 review path does NOT apply. **No `src/audit/**` touch**. PR will be single-domain across `src/users/**` + `src/tenants/**` (tests only).

## 2. Regression Impact Analysis

- **Blast radius**: **ZERO production-code blast radius**. This ticket adds NEW `*.spec.ts` files only; modifies zero production source files. DTOs are read by `users.controller.ts` (`@Body`/`@Query` decorators) + `users.service.ts` (method signatures) + `tenants.controller.ts` (return types) + `tenants/invitations.service.ts` (return shape) — none of which need modification because DTO shapes do not change.
- **Direct dependents** (DTOs are imported here — unchanged by this ticket):
  - `nexacore-api/src/users/users.controller.ts:58/128/154/173/205/224/261` (`@Body`/`@Query` annotations for all 7 users DTOs)
  - `nexacore-api/src/users/users.service.ts:556/720/780/1037/1127/1184` (method signatures)
  - `nexacore-api/src/tenants/tenants.controller.ts:55/56/101/163` (response DTO return types)
  - `nexacore-api/src/tenants/invitations.service.ts:35` (`InvitationResponseDto` return shape)
- **Test dependents** (existing specs that mock or use these DTOs — unchanged):
  - `nexacore-api/src/users/tests/users.controller.spec.ts`, `users.service.spec.ts`, `users.service.platform-admin.spec.ts`, `list-users-query.dto.spec.ts`
  - `nexacore-api/src/tenants/tests/tenants.controller.spec.ts`, `invitations.service.spec.ts`, `invitations.dto.spec.ts`, `tenants.integration.spec.ts`
- **Breaking changes identified**: **None**. No constructor, method, export, or DTO shape is modified.
- **API contract impact**: **None**. No HTTP endpoint changes; `api-spec.yml` requires no update.
- **Schema migration impact**: **None**. No Prisma schema changes.
- **Test files requiring updates**: **None**. All existing 1241 tests continue to pass without modification (verified mentally: DTO shapes are read-only here).
- **Blast radius size**: **0 files affected** (production). 9 NEW test files. Smallest possible blast radius.

## 3. Overview

**Tech-debt ticket** that closes the pre-existing global coverage gap on `main` (statements + lines at 89.79% per the SCRUM-492 CI run vs the jest 90% threshold). The wave already paid the cost: SCRUM-487 + SCRUM-492 each landed via admin merge override on this exact gate. **Phase 1.2 (opaque refresh + SessionsServiceV2) is blocked behind this sweep** to avoid a third consecutive override.

**Strategy**: target only validation-decorator DTOs and pure-shape response DTOs — the densest leverage in the repo. Each file is 5–22 LOC; adding `plainToInstance + validate()` specs takes coverage on those files from 0–37% → ~100% with ~30–60 lines of test code per DTO. Conservative math: ~120–150 newly-covered statements lifts the global metric from 89.79% to ~90.3–90.7%. Stop rule is hard: ≥ 90.5% with 0.5pp margin, then STOP — do not chase 100%.

**Architecture principles**:
- **Tests-only diff**: no production logic mutation (per ticket AC + `workflow-standards.mdc §8`).
- **Mock-free unit tests**: class-validator + class-transformer work without NestJS Testing module.
- **Existing pattern reuse**: `list-users-query.dto.spec.ts` is the canonical idiom. Every new spec follows it.

## 4. Architecture Context

- **Modules involved**: none (tests-only).
- **Components affected**: zero production components. NEW test files only:
  - 7 specs under `nexacore-api/src/users/tests/`
  - 2 specs under `nexacore-api/src/tenants/tests/` (only if margin not yet hit)
- **Files referenced**:
  - Production sources (READ-ONLY for assertions): see §1 list.
  - Reference pattern: `nexacore-api/src/users/tests/list-users-query.dto.spec.ts`.
  - Coverage config: `nexacore-api/package.json` `jest.coverageThreshold.global`.

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch named after the ticket.
- **Branch Naming**: `feature/SCRUM-490-backend` (REQUIRED naming). Do NOT branch from another feature branch.
- **Implementation Steps**:
  1. Ensure on `main` and synced: `cd ~/projects/em-ecosystem && git checkout main && git pull origin main`.
  2. Confirm `git log --oneline -1` shows `309c38f` (SCRUM-492 squash merge).
  3. Create branch: `git checkout -b feature/SCRUM-490-backend`.
  4. Verify: `git branch --show-current` → `feature/SCRUM-490-backend`.
- **Notes**: Per `workflow-standards.mdc §2` — branch base MUST be latest main. NEVER branch from another feature branch.

### Step 1: Run baseline coverage report

- **File**: N/A (read-only command).
- **Action**: Capture the EXACT pre-implementation coverage numbers so the delta can be verified at /verify time.
- **Implementation Steps**:
  1. `cd ~/projects/em-ecosystem/nexacore-api && npx jest --coverage --maxWorkers=1 --forceExit > /tmp/scrum-490-baseline-coverage.txt 2>&1`.
  2. Tail the report and confirm the global summary line matches CI (statements 89.79% / branches PASS / functions PASS / lines 89.79%).
  3. Note the EXACT current percentage in scratch — it becomes the baseline for the delta in the verify report.
- **Notes**: This command takes ~60s. Run once at the start so you have ground truth.

### Step 2: Add spec for `AdminUpdateUserDto`

- **File**: `nexacore-api/src/users/tests/admin-update-user.dto.spec.ts` (NEW).
- **Action**: Create spec covering all decorator paths.
- **Implementation Steps**:
  1. Follow `list-users-query.dto.spec.ts` idiom: `import 'reflect-metadata'`, `plainToInstance` from `class-transformer`, `validate` from `class-validator`, `AdminUpdateUserDto` from `../dto/admin-update-user.dto`, `Role` from `../enums/role.enum`.
  2. Test cases (min 4):
     - Empty payload validates OK (both fields optional).
     - `role: Role.ADMIN` + `isActive: true` validates OK.
     - `role: 'NOT_A_ROLE'` triggers `IsEnum` error (assert `errors[0].constraints?.isEnum` present).
     - `isActive: 'not-a-boolean'` triggers `IsBoolean` error.
- **Dependencies**: `reflect-metadata` (already in deps), `class-transformer`, `class-validator` (both already used by jest).
- **Implementation Notes**: After committing this file, re-run `npx jest --coverage --testPathPattern='admin-update-user'` to confirm the target file is at ≥90%; then re-run full coverage to track the global delta.

### Step 3: Add spec for `ChangeEmailDto`

- **File**: `nexacore-api/src/users/tests/change-email.dto.spec.ts` (NEW).
- **Action**: Same pattern; cover `@IsEmail`, `@MinLength(8)`, `@MaxLength(128)`.
- **Implementation Steps**:
  1. Valid case: `newEmail: 'user@example.com'`, `password: 'correcthorse'` → 0 errors.
  2. Invalid email: `newEmail: 'not-an-email'` → `isEmail` error.
  3. Password too short: `password: 'short1'` → `minLength` error.
  4. Password too long: `password: 'x'.repeat(129)` → `maxLength` error.
- **Dependencies**: same as Step 2.

### Step 4: Add spec for `ChangePasswordDto`

- **File**: `nexacore-api/src/users/tests/change-password.dto.spec.ts` (NEW).
- **Implementation Steps**:
  1. Valid: `newPassword: 'newpass123'` (no currentPassword — it's optional) → 0 errors.
  2. Valid with currentPassword: `currentPassword: 'oldpass'`, `newPassword: 'newpass123'` → 0 errors.
  3. Invalid newPassword type: `newPassword: 123` → `isString` error.
  4. newPassword too short: `newPassword: 'short'` → `minLength` error.
  5. newPassword too long: `newPassword: 'x'.repeat(129)` → `maxLength` error.

### Step 5: Add spec for `DeleteAccountDto`

- **File**: `nexacore-api/src/users/tests/delete-account.dto.spec.ts` (NEW).
- **Implementation Steps**:
  1. Empty payload validates OK (password is optional).
  2. Valid password: `password: 'correcthorse'` → 0 errors.
  3. password too short → `minLength` error.
  4. password too long → `maxLength` error.

### Step 6: Add spec for `ListSecurityActivityQueryDto`

- **File**: `nexacore-api/src/users/tests/list-security-activity-query.dto.spec.ts` (NEW).
- **Implementation Steps**:
  1. Empty payload uses defaults (`page=1`, `limit=20`). After `plainToInstance(ListSecurityActivityQueryDto, {})`, assert `dto.page === 1` and `dto.limit === 20`.
  2. String coercion via `@Type(() => Number)`: `plainToInstance(...)` with `{ page: '5', limit: '50' }` yields `typeof dto.page === 'number'` and `dto.page === 5`.
  3. `page: 0` triggers `@Min(1)` error.
  4. `limit: 101` triggers `@Max(100)` error.
  5. `page: 1.5` triggers `@IsInt` error.
- **Implementation Notes**: This is the SAME pattern as the reference `list-users-query.dto.spec.ts` but for the security-activity query.

### Step 7: Add spec for `UnlinkOAuthDto`

- **File**: `nexacore-api/src/users/tests/unlink-oauth.dto.spec.ts` (NEW).
- **Implementation Steps**:
  1. Valid: `password: 'correcthorse'` → 0 errors.
  2. Missing password → `isString` error (field is required, no `@IsOptional`).
  3. password too short → `minLength` error.
  4. password too long → `maxLength` error.

### Step 8: Add spec for `UpdateProfileDto`

- **File**: `nexacore-api/src/users/tests/update-profile.dto.spec.ts` (NEW).
- **Implementation Steps**:
  1. Empty payload validates OK (all 3 fields optional).
  2. Valid all fields: `firstName: 'Ana'`, `lastName: 'Pérez'`, `avatarUrl: 'https://cdn.example.com/a.png'` → 0 errors.
  3. `firstName` > 100 chars → `maxLength` error.
  4. `lastName` > 100 chars → `maxLength` error.
  5. `avatarUrl: 'cdn.example.com/a.png'` (no protocol) → `isUrl` error (config requires protocol).
  6. `avatarUrl: 'ftp://example.com/x.png'` → assert behavior (class-validator default `@IsUrl` permits ftp; if assertion expects http(s) only, document the gap as Pre-existing — DO NOT change the production DTO).
  7. `avatarUrl` > 500 chars → `maxLength` error.

### Step 9: Coverage check + STOP decision

- **File**: N/A.
- **Action**: After Step 8 commits, re-run full coverage and decide whether Steps 10–11 are needed.
- **Implementation Steps**:
  1. `npx jest --coverage --maxWorkers=1 --forceExit | tail -30`.
  2. Inspect the global summary row (last `All files` line).
  3. **If statements ≥ 90.5% AND lines ≥ 90.5%**: skip Steps 10–11. Proceed to Step 12 (documentation).
  4. **If margin not yet hit**: proceed to Step 10 + Step 11.
- **Notes**: This is the STOP rule from the ticket. Save the coverage tail to `/tmp/scrum-490-after-step8.txt` for the verify record.

### Step 10: (Conditional) Add spec for `InvitationResponseDto`

- **File**: `nexacore-api/src/tenants/tests/invitation-response.dto.spec.ts` (NEW).
- **Action**: Pure shape DTO — no validators. Test by instantiating + asserting property assignment.
- **Implementation Steps**:
  1. `import { InvitationResponseDto } from '../dto/invitation-response.dto'; import { TenantRole } from '@prisma/client';`
  2. Test 1 — fresh-create shape (token populated):
     ```
     const dto = new InvitationResponseDto();
     dto.id = '...'; dto.tenantId = '...'; dto.email = 'a@b.com';
     dto.role = TenantRole.MEMBER;
     dto.token = 'plaintext-43-char-token';
     dto.expiresAt = new Date('2026-06-01');
     dto.createdAt = new Date('2026-05-19');
     ```
     Assert each property reflects the assigned value.
  3. Test 2 — idempotent-duplicate shape (`token: null`).
  4. Test 3 — using `plainToInstance(InvitationResponseDto, payload)` from a raw payload, assert all keys are present on the instance.
- **Dependencies**: `class-transformer` (for plainToInstance), `@prisma/client` (for TenantRole enum).
- **Implementation Notes**: This file has 0% coverage today because no spec imports it. The mere import + minimal instantiation lifts it to ~100% (42 statements).

### Step 11: (Conditional) Add spec for `MemberResponseDto` + `MemberListResponseDto`

- **File**: `nexacore-api/src/tenants/tests/member-response.dto.spec.ts` (NEW).
- **Implementation Steps**:
  1. Cover BOTH classes exported from `member-response.dto.ts`.
  2. Test 1 — `MemberResponseDto` instance, assert all 6 properties (`userId`, `email`, `role`, `status`, `joinedAt`, `lastActiveAt`).
  3. Test 2 — `MemberListResponseDto` wrapper: `data: [dto1, dto2]`, `page: 1`, `pageSize: 20`, `total: 2`. Assert wrapper integrity (length, types).
- **Dependencies**: `@prisma/client` for `TenantRole` + `MembershipStatus` enums.

### Step 12: Final coverage check

- **File**: N/A.
- **Action**: Confirm the global thresholds are cleared with margin.
- **Implementation Steps**:
  1. `npx jest --coverage --maxWorkers=1 --forceExit > /tmp/scrum-490-final-coverage.txt 2>&1`.
  2. Verify the FINAL `All files` row: statements ≥ 90.5% AND lines ≥ 90.5%. Branches still ≥ 80%. Functions still ≥ 85%.
  3. If thresholds NOT met → return to Step 10/11 and add the remaining response-DTO specs. Do NOT modify production code to bump coverage.
  4. Record the per-file deltas on the touched files (every target DTO should be at 100% or near-100%).

### Step 13: Update Technical Documentation

- **Action**: Update post-implementation documentation per `documentation-standards.mdc`. **NOT in this branch** — documentation lives in ai-specs and is updated by `/update-docs` after merge. The TICKET delivery is tests-only on em-ecosystem.
- **Implementation Steps**:
  1. No `ai-specs/specs/data-model.md` update (no schema change).
  2. No `ai-specs/specs/api-spec.yml` update (no endpoint change).
  3. `ai-specs/specs/integration-state.md` Changelog row will be added by `/update-docs`.
  4. `ai-specs/changes/auth/programs/AUTH-v2.md` §6 Phase 1.1 row updated by `/update-docs` to append "Coverage threshold cleared by SCRUM-490 — Phase 1.2 unblocked for organic CI green".
- **Notes**: This step is DEFERRED-BY-DESIGN to `/update-docs` (per the SCRUM-491/492 convention). No spec files are touched in this PR.

## 6. Implementation Order

1. Step 0: Create feature branch from latest main.
2. Step 1: Capture baseline coverage.
3. Step 2: Add `AdminUpdateUserDto` spec.
4. Step 3: Add `ChangeEmailDto` spec.
5. Step 4: Add `ChangePasswordDto` spec.
6. Step 5: Add `DeleteAccountDto` spec.
7. Step 6: Add `ListSecurityActivityQueryDto` spec.
8. Step 7: Add `UnlinkOAuthDto` spec.
9. Step 8: Add `UpdateProfileDto` spec.
10. Step 9: STOP check — if ≥ 90.5%, skip 10–11.
11. Step 10 (conditional): Add `InvitationResponseDto` spec.
12. Step 11 (conditional): Add `MemberResponseDto` spec.
13. Step 12: Final coverage confirmation.
14. Step 13: Documentation deferred to `/update-docs`.

## 7. Testing Checklist

- [ ] Baseline coverage captured at Step 1 (89.79% / 89.79% expected).
- [ ] Each new spec file passes individually: `npx jest --testPathPattern='<dto-name>'`.
- [ ] Full project: `npx jest --maxWorkers=1 --forceExit` → 1241 + N new passing, 0 failing.
- [ ] Coverage: `npx jest --coverage --maxWorkers=1 --forceExit` → global statements ≥ 90.5% AND lines ≥ 90.5%.
- [ ] Each TARGET DTO file at ≥ 90% per-file coverage in the coverage report.
- [ ] No production source files modified (`git diff --stat` shows only `*.spec.ts` under `src/users/tests/` + `src/tenants/tests/`).
- [ ] `nest build` exit 0.
- [ ] ESLint clean (`npx eslint src/users/tests/*.dto.spec.ts src/tenants/tests/*-response.dto.spec.ts --fix`).

**Regression test checklist** (per §2 — empty):

| File from blast radius | Updated? | Why |
|---|---|---|
| (none — zero production blast radius) | N/A | DTO shapes unchanged |

## 8. Error Response Format

**N/A** — no HTTP surface introduced or modified.

## 9. Dependencies

- `class-validator` (already in `nexacore-api/package.json`).
- `class-transformer` (already in `nexacore-api/package.json`).
- `reflect-metadata` (already imported at app bootstrap; specs re-import explicitly per existing convention).
- `@prisma/client` enums (`TenantRole`, `MembershipStatus`) for tenant response DTO specs.

**Zero new dependencies.** Zero `package.json` edits.

## 10. Notes

- **English only** for spec content (per `base-standards.mdc`).
- **Tests-only diff invariant**: any temptation to "while we're here, fix this small thing in production code" is OUT OF SCOPE. Open a separate ticket per `workflow-standards.mdc §8`.
- **STOP rule is hard**: don't pursue 100% per-file coverage after the global 90.5% margin is achieved. Remaining sub-threshold files (mail.service, turnstile, sessions.service) get a separate ticket if leadership wants them addressed.
- **Determinism**: no `Date.now()` in assertions without `new Date('2026-05-19')` style fixed values. No `Math.random()` in test data.
- **DO NOT** modify `nexacore-api/package.json` jest threshold to lower it — that would game the gate, not pay the debt.
- **DO NOT** add `/* istanbul ignore next */` annotations to dodge coverage — same reasoning.
- **NOT-§15**: PR touches `src/users/**` + `src/tenants/**` only — no `src/auth/**`, no `src/audit/**`, no `prisma/schema.prisma`. §15 AUTH change-control review path does NOT apply. Standard CODEOWNERS.

## 11. Next Steps After Implementation

- `/verify SCRUM-490`: must confirm coverage delta + zero production-file diff.
- `/commit SCRUM-490`: expect **one-shot CI green** on PR — no admin override needed. If CI fails on Layer 4 again, the sweep was insufficient — return to add more specs.
- `/update-docs SCRUM-490`: append to AUTH-v2.md §6 and integration-state.md Changelog.
- **Unblocks Phase 1.2** (opaque refresh + SessionsServiceV2) — that ticket can now be enriched + planned + developed without override risk.

## 12. Implementation Verification

- **Code Quality**: spec files follow `list-users-query.dto.spec.ts` idiom; mock-free; deterministic.
- **Functionality**: each DTO's validation decorators are exercised in valid + invalid paths.
- **Testing**: 1241 baseline + N new specs (estimated 40–60 new tests) all pass; coverage ≥ 90.5% margin.
- **Regression**: blast radius empty → nothing to verify beyond green CI.
- **Integration**: no module/guard/service changes; integration-state.md unchanged in this branch (updated later by /update-docs).
- **Documentation**: deferred-by-design to `/update-docs`.
