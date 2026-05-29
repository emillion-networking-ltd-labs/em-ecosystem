---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-462
sprint: backlog
scope: backend
module: common
date: 2026-05-15
status: draft
last_completed_ticket: SCRUM-461
---

# Backend Implementation Plan: SCRUM-462 Regularize Phase 8 Cap 5 install in nexacore-api

> **STUB PLAN — regularization-only.** This ticket commits pre-existing WIP from the 2026-05-15 Cap 5 install session; **NO new code is written**. The source of truth for implementation lives in the Jira ticket's `[enhanced]` section (`File inventory (AC-4)`, `Branch + lifecycle`, `Verification commands`, `PR convention`). This plan provides the minimum schema-valid scaffolding for FW-004 + concrete git/build/test steps for `/develop`.
>
> **Scope override note**: schema `scope` enum requires `{backend, frontend, fullstack}`. The actual work-scope is "regularization" — `backend` is the closest schema-valid fit (10/10 files live in `nexacore-api/` backend). Module = `common` (most code in `src/common/`).

## Codebase State Snapshot

- **Date**: 2026-05-15
- **Last completed ticket**: SCRUM-461 (Phase 8 Cap 5 audit follow-up — T-3 pilot. State: documented. Merged to em-development-framework main as `98ef2c4`)
- **Integration state verified**: Per-file at `/develop` time. The WIP has been verified once already during `/enrich-us` of this ticket (10 files enumerated, all confirmed under `nexacore-api/` and the monorepo root). No re-verification needed at plan time — files are unchanged since enrichment.
- **Files verified against live code**:
  - `nexacore-api/src/app.module.ts` — read at multiple points in 2026-05-15 session; current state has `OnlineMlScorerModule` + `APP_INTERCEPTOR` provider wired
  - `nexacore-api/src/common/services/online-ml-scorer.service.ts` — read; 196 LOC, OQ-1 env fallback present
  - `nexacore-api/src/common/interceptors/online-ml-scorer.interceptor.ts` — read; 62 LOC, OQ-2 AUTH-skip duplicated
  - `nexacore-api/src/common/services/online-ml-scorer.module.ts` — read; 10 LOC trivial DI bundling
  - `nexacore-api/src/common/services/tests/online-ml-scorer.service.spec.ts` — read; 4 tests, verified passing during install
- **Constructor signatures verified**: `OnlineMlScorerInterceptor(scorer: OnlineMlScorerService)` (1 dep). `OnlineMlScorerService()` (0 deps — uses `process.env` + readFileSync internally).
- **Methods verified to exist**: `OnlineMlScorerService.score(req, durationMs, statusCode)` (line 65 of service.ts). `OnlineMlScorerInterceptor.intercept(ctx, next)` (line 40 of interceptor.ts).
- **Guard dependency chain verified**: N/A — this ticket does NOT touch guards. The only `@UseGuards` chains pre-exist (e.g., `JwtAuthGuard` on user/admin controllers); SCRUM-462 doesn't add/modify any.
- **Discrepancies with integration-state.md**: NONE intentional — `integration-state.md` will need an update during `/update-docs` (Part 2) to reflect the new `APP_INTERCEPTOR` provider + `OnlineMlScorerModule` import. This is correctly deferred to that step.

## Regression Impact Analysis

- **Blast radius**: 10 files in `em-ecosystem` repo:
  - 5 modified: `.gitignore`, `nexacore-api/{.env.example, package.json, package-lock.json, src/app.module.ts}`
  - 5 new: `nexacore-api/online-enforcement-flags.example.yml`, `nexacore-api/src/common/services/online-ml-scorer.{service,module}.ts`, `nexacore-api/src/common/interceptors/online-ml-scorer.interceptor.ts`, `nexacore-api/src/common/services/tests/online-ml-scorer.service.spec.ts`
- **Breaking changes identified**:
  - `app.module.ts` adds 1 new import + 1 new entry in `imports[]` + 1 new `APP_INTERCEPTOR` provider. No existing modules are modified or removed.
  - **NO constructor signature changes** in pre-existing classes.
  - **NO method signatures changed**.
  - **NO module exports removed or renamed**.
  - **NO DTO changes**.
  - **NO guard behavior changes**.
- **API contract impact**: NONE — no endpoints added/modified. `api-spec.yml` does not need update.
- **Schema migration impact**: NONE — no Prisma schema changes.
- **Test files requiring updates**: NONE for pre-existing tests. ONE new test file (the 4-test spec for `OnlineMlScorerService`) is created — but it's already written, not a regression risk.
- **Blast radius size**: 10 files affected (>5 threshold). **Flagged for careful regression testing in `/verify`** — run full jest suite, not just changed-files.

## Overview

Regularization of pre-existing WIP from the Cap 5 install session (2026-05-15 Bloques 1-6). The 10 files in `em-ecosystem` working tree wire `OnlineMlScorerService` (NestJS service computing per-request z-scores in shadow mode) + its interceptor + module + tests + config into `nexacore-api`. All code was previously verified end-to-end during the install session (build pass, test pass, app boot OK, JSONL line generated). This ticket's purpose is to commit + PR + merge that WIP, NOT to re-do or modify the implementation.

## Architecture Context

- **Target repo**: `em-ecosystem` (separate from this `em-development-framework` repo)
- **Target subpath**: `nexacore-api/` + `.gitignore` at monorepo root
- **Modules involved**: `OnlineMlScorerModule` (new — in `src/common/services/`) + `AppModule` (modified — wires the new module + `APP_INTERCEPTOR` provider)
- **Components affected**: 1 NestJS service, 1 interceptor (global via `APP_INTERCEPTOR`), 1 DI module, 1 test file, 1 flags YAML example file, 4 config-style modifications (gitignore, env.example, package.json, lock)
- **No cross-module dependencies introduced** beyond `OnlineMlScorerInterceptor → OnlineMlScorerService` (both inside the new `OnlineMlScorerModule`).

## Implementation Steps

### Step 0: Create feature branch from latest em-ecosystem main

- **Action**: Create `feature/SCRUM-462-backend` from `em-ecosystem` main `@ 7e21b2a`
- **Branch naming**: `feature/SCRUM-462-backend` (lowercase suffix per `state.schema.yml` regex)
- **Implementation Steps**:
  1. `cd /home/em-admin/projects/em-ecosystem`
  2. Verify clean state OR stash unrelated WIP: `git status` — expect the 10 SCRUM-462 items + nothing else. If other WIP exists, abort and report
  3. **Important**: do NOT run `git checkout main && git pull origin main` first — the 10 SCRUM-462 items are uncommitted in working tree on main; switching branches would lose them. Instead, branch directly: `git checkout -b feature/SCRUM-462-backend` (working tree carries over)
  4. Verify: `git rev-parse --abbrev-ref HEAD` returns `feature/SCRUM-462-backend`
- **Notes**: This is regularization — branching FROM the dirty working tree IS correct, because the working tree IS the "implementation".

### Step 1: Stage the 10 SCRUM-462 files explicitly

- **Action**: `git add` exactly the 10 files documented in the ticket's `[enhanced]` section `File inventory (AC-4)` table
- **Implementation Steps**:
  ```bash
  cd /home/em-admin/projects/em-ecosystem
  git add \
    .gitignore \
    nexacore-api/.env.example \
    nexacore-api/package.json \
    nexacore-api/package-lock.json \
    nexacore-api/src/app.module.ts \
    nexacore-api/online-enforcement-flags.example.yml \
    nexacore-api/src/common/services/online-ml-scorer.service.ts \
    nexacore-api/src/common/services/online-ml-scorer.module.ts \
    nexacore-api/src/common/interceptors/online-ml-scorer.interceptor.ts \
    nexacore-api/src/common/services/tests/online-ml-scorer.service.spec.ts
  ```
- **Verify**: `git diff --staged --name-only` must list EXACTLY these 10 paths in any order. If extra files appear (e.g., the gitignored `online-enforcement-flags.yml`), unstage them with `git restore --staged <file>`.

### Step 2: Build + test verification BEFORE commit (catches regressions)

- **Action**: Confirm `nest build` exit 0 + jest tests pass with the staged code
- **Implementation Steps**:
  ```bash
  cd /home/em-admin/projects/em-ecosystem/nexacore-api
  npm run build  # AC-3: expect exit 0
  npm test -- --testPathPatterns=online-ml-scorer  # AC-5: expect 4 passed
  ```
- **Stop conditions**: if either fails, halt and report; do NOT commit a broken state.

### Step 3: Commit with conventional message

- **Action**: Single commit covering the 10 files
- **Implementation Steps**:
  ```bash
  cd /home/em-admin/projects/em-ecosystem
  git commit -m "$(cat <<'EOF'
  feat(SCRUM-462): regularize Phase 8 Cap 5 install in nexacore-api (shadow mode)

  Commits the pre-existing WIP from the 2026-05-15 Cap 5 install session.
  NO new code added — this regularizes the orphan work from SCRUM-460
  install + SCRUM-461 audit. Cap 5 is in shadow mode (ml_inference.enabled
  in the gitignored online-enforcement-flags.yml; example committed).

  Files (10):
    - .gitignore (M) — Phase 8 block (logs/, flags file)
    - nexacore-api/.env.example (M) — SHADOW_LOG_PATH + ONLINE_* env vars
    - nexacore-api/package.json (M) — +js-yaml ^4.1.1, +@types/js-yaml ^4.0.9
    - nexacore-api/package-lock.json (M) — npm install side effect
    - nexacore-api/src/app.module.ts (M) — APP_INTERCEPTOR + OnlineMlScorerModule
    - nexacore-api/online-enforcement-flags.example.yml (NEW) — committed example
    - nexacore-api/src/common/services/online-ml-scorer.service.ts (NEW) — Cap 5 svc
    - nexacore-api/src/common/services/online-ml-scorer.module.ts (NEW) — DI module
    - nexacore-api/src/common/interceptors/online-ml-scorer.interceptor.ts (NEW)
    - nexacore-api/src/common/services/tests/online-ml-scorer.service.spec.ts (NEW)

  Known carry-over (intentional, NOT fixed in this ticket):
    - online-ml-scorer.service.ts:122 still has split(':', 2)[1] bug. T-3 fix
      lives in framework template only (SCRUM-461 commit 95cd081). Propagation
      to this installed copy is deferred to SCRUM-461-BATCH-2 (future ticket).

  Refs: SCRUM-462 (regularization), Relates: SCRUM-460 (templates source),
  SCRUM-461 (audit follow-up).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

### Step 4: Push branch + create PR

- **Action**: Push to remote + open PR via gh CLI
- **Implementation Steps**:
  ```bash
  git push -u origin feature/SCRUM-462-backend
  gh pr create --base main --head feature/SCRUM-462-backend \
    --title "[SCRUM-462] Regularize Phase 8 Cap 5 install in nexacore-api (shadow mode)" \
    --body-file <(echo "<see PR body template in ticket §[enhanced] PR convention>")
  ```
- The PR body must include the AC-4 file inventory table + AC compliance evidence + links to SCRUM-460/461 + T-3 propagation note.

### Step 5: Update Technical Documentation (per /update-docs flow)

- **Action**: Identify which docs need updates at `/update-docs` time
- **Implementation Steps**:
  1. **integration-state.md**: ADD `OnlineMlScorerModule` (provider) + `OnlineMlScorerInterceptor` (APP_INTERCEPTOR) + Service Dependency Chain for the new module. Also add to Changelog row.
  2. **data-model.md**: NO update (no entity changes).
  3. **api-spec.yml**: NO update (no endpoint changes).
  4. **`*-standards.mdc`**: NO update (no new patterns introduced; existing patterns followed).
- **Notes**: Step 5 is executed by `/update-docs`, NOT during `/develop`.

## Implementation Order

0. Create feature branch `feature/SCRUM-462-backend` (Step 0)
1. Stage 10 files explicitly (Step 1)
2. Verify build + tests pass (Step 2) — halt if either fails
3. Commit with conventional message (Step 3)
4. Push branch + create PR (Step 4)
5. (`/verify` runs here — separate command)
6. (`/commit` merges to main, deletes branch — separate command)
7. (`/update-docs` writes record + updates integration-state.md — separate command, Step 5 docs identified there)

## Testing Checklist

- [ ] `nest build` exit 0 (Step 2)
- [ ] `npm test -- --testPathPatterns=online-ml-scorer`: 4 passed (Step 2)
- [ ] `git diff --staged --name-only` lists exactly the 10 SCRUM-462 files (Step 1)
- [ ] `git log -1 main..HEAD` shows the single SCRUM-462 commit on the branch (after Step 3)
- [ ] PR opens cleanly with the AC-evidence body (Step 4)
- [ ] **Regression test**: confirm pre-existing jest suite still passes (`npm test` without filter) — full suite, not just changed-files
- [ ] AC-7 check: `grep -r "src/auth\|src/audit\|prisma/schema.prisma" <staged-files>` → 0 matches (NOT-§15)

## Error Response Format

N/A — no new HTTP endpoints, no API surface changes. Existing fail-open behavior of `OnlineMlScorerService` (try/catch swallow on logging errors, per Phase 8 §0 contract) is preserved verbatim from the install session.

## Dependencies

- `js-yaml@^4.1.1` (already installed in working tree's `node_modules` from the install session; declared in staged `package.json`)
- `@types/js-yaml@^4.0.9` (devDep, already installed)
- No other new external dependencies.

## Notes

- **NOT-§15** — no AUTH, audit, or Prisma paths touched. Pre-commit hooks should pass without `--no-verify`.
- **Shadow mode preserved** — `ml_inference.enabled` lives in `online-enforcement-flags.yml` (gitignored), defaulting to `false` in the committed `online-enforcement-flags.example.yml`. No production traffic impact.
- **T-3 propagation deferred** — line 122 of `online-ml-scorer.service.ts` retains the `split(':', 2)[1]` bug. This is INTENTIONAL per AC-6; the propagation belongs to a future SCRUM-461-BATCH-2 ticket. Do NOT fix it in this PR.
- **English-only commit messages** per `base-standards.mdc`.
- **Branch must be created BEFORE switching to main** — branching from dirty working tree is intentional here (regularization pattern, unique to this ticket type).

## Next Steps After Implementation

- `/verify SCRUM-462` — confirms AC-1..AC-7 + regression suite
- `/commit SCRUM-462` — squash-merges PR to `em-ecosystem` main, deletes branch, advances state
- `/update-docs SCRUM-462` — writes record, updates `integration-state.md` to reflect the new `APP_INTERCEPTOR` provider + `OnlineMlScorerModule`, commits ai-specs

## Implementation Verification

- [ ] Code Quality: `nest build` exit 0, no new lint errors introduced
- [ ] Functionality: 10/10 staged files match the AC-4 inventory; commit message references SCRUM-462 + Relates to SCRUM-460/461
- [ ] Testing: 4 jest tests pass; full jest suite still green
- [ ] Regression: 10-file blast radius verified — `git diff main..HEAD` shows ONLY the SCRUM-462 changes; no incidental files
- [ ] Integration: app.module.ts wiring matches the documented structure (APP_INTERCEPTOR provider after APP_GUARD, OnlineMlScorerModule in imports[] after StorageModule)
- [ ] Documentation: `/update-docs` step queued (handles `integration-state.md` update there, not at `/develop` time)
- [ ] NOT-§15 confirmed: zero modifications under `nexacore-api/src/auth/**`, `src/audit/**`, `prisma/schema.prisma`
