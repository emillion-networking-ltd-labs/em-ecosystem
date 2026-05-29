---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-462
sprint: backlog
scope: backend
module: common
date: 2026-05-15
branch: feature/SCRUM-462-backend
plan_path: ai-specs/changes/common/plans/backlog/SCRUM-462_backend.md
verify_path: ai-specs/changes/common/plans/backlog/SCRUM-462_verify.md
commits:
  - hash: c383e45
    message: "feat(SCRUM-462): regularize Phase 8 Cap 5 install in nexacore-api (shadow mode)"
    files:
      - .gitignore
      - nexacore-api/.env.example
      - nexacore-api/package.json
      - nexacore-api/package-lock.json
      - nexacore-api/src/app.module.ts
      - nexacore-api/online-enforcement-flags.example.yml
      - nexacore-api/src/common/services/online-ml-scorer.service.ts
      - nexacore-api/src/common/services/online-ml-scorer.module.ts
      - nexacore-api/src/common/interceptors/online-ml-scorer.interceptor.ts
      - nexacore-api/src/common/services/tests/online-ml-scorer.service.spec.ts
  - hash: 32b7875
    message: "chore(SCRUM-462): lint compliance for online-ml-scorer (eslint --max-warnings 0)"
    files:
      - nexacore-api/src/common/services/online-ml-scorer.service.ts
      - nexacore-api/src/common/services/tests/online-ml-scorer.service.spec.ts
pr: 310
merge_commit: 52b951b
is_audit_fix: false
plan_followed: "yes"
---

# Implementation Record: SCRUM-462 Regularize Phase 8 Cap 5 install in nexacore-api

## Summary

Regularization-only ticket: commits the pre-existing WIP from the 2026-05-15 Cap 5 install session (Bloques 1-6) to `em-ecosystem` main. **Zero new logic** — only the 10 originally-orphan files plus 3 inline `eslint-disable` comments needed to pass the project's `--max-warnings 0` pre-push hook. Cap 5 (`OnlineMlScorerService`) operates in shadow mode; no production traffic impact. Scope: `backend`. Branch: `feature/SCRUM-462-backend`. Implementation date: 2026-05-15.

## Plan Reference

- Original plan: `ai-specs/changes/common/plans/backlog/SCRUM-462_backend.md` (stub style, 12 schema-required H2 sections, concrete git/build/test steps for `/develop`)
- Plan was followed: **yes** with 2 trivial deviations + 1 quality deviation (resolved in this record).
- Verify report: `ai-specs/changes/common/plans/backlog/SCRUM-462_verify.md` (verdict: PASS-WITH-DEBT, 3 deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `c383e45` | feat(SCRUM-462): regularize Phase 8 Cap 5 install in nexacore-api (shadow mode) | 10 files: `.gitignore`, `nexacore-api/.env.example`, `package.json`, `package-lock.json`, `src/app.module.ts`, `online-enforcement-flags.example.yml`, `src/common/services/online-ml-scorer.{service,module}.ts`, `src/common/interceptors/online-ml-scorer.interceptor.ts`, `src/common/services/tests/online-ml-scorer.service.spec.ts` |
| `32b7875` | chore(SCRUM-462): lint compliance for online-ml-scorer (eslint --max-warnings 0) | 2 files: `online-ml-scorer.service.ts` (3 eslint-disable comments for security/detect-non-literal-fs-filename + rationale notes), `online-ml-scorer.service.spec.ts` (removed obsolete `import/first` disable comment) |

PR: [#310](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/310) (merged 2026-05-15 via squash, `--delete-branch`). Squash-merge commit on `em-ecosystem` main: **`52b951b`**.

## Deviations from Plan

Classifications imported verbatim from verify report. No reclassification.

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 0 | `git checkout -b feature/SCRUM-462-backend` (from current local main) | `git checkout -b feature/SCRUM-462-backend origin/main` | Local main was 2 commits ahead-of-upstream (SCRUM-453 WARNING banner + CODEOWNERS) — branching from origin/main isolated those unrelated AUTH commits from this PR, preserving AC-7 NOT-§15 | Accepted-Trivial | — |
| 3 | Commit with conventional message | Same commit message — but first attempt blocked by husky/prettier on `online-ml-scorer.service.ts` line-wrap. Applied `npx prettier --write` (no `--no-verify`), re-stage, retry → success | Cosmetic line-wrap fix, zero logic change | Accepted-Trivial | — |
| 5 | Update `integration-state.md` per `/develop` spec 8d | Deferred to `/update-docs` Part 2 (this record's flow). Plan explicitly consolidated doc updates here | Documentation step explicitly postponed to the natural lifecycle step for it | Accepted-Quality (per verify) | **Resolved in this record** — see §Documentation Updates below |
| (new during /commit) | Pre-push eslint passing | 1st push attempt failed: 3x `security/detect-non-literal-fs-filename` warnings + 1x `import/first` rule-not-found error. Fixed with `32b7875`: 3 inline `eslint-disable-next-line` with rationale comments + removed obsolete spec disable. NO `--no-verify` used (memory `feedback_auth_change_control`) | Project standards require `--max-warnings 0`; metadata-only changes needed for code to pass linting | Accepted-Trivial | — |

**Counts (mirror verify report)**: 2 Trivial · 0 Quality (resolved in this record) · 0 Risk · 0 Deferred · 0 Pre-existing · 0 Scope-Gap.

## Test Results

- **Targeted tests** (`npm test -- --testPathPatterns=online-ml-scorer`): **4 passed / 4 total** in 1.22s
- **Full jest suite** (`npm test -- --maxWorkers=1 --forceExit`): **1056 passed / 1056 total** across 70 suites, in 26.27s
- **Coverage**: not measured in this ticket (Cap 5 service spec is new; full coverage measurement deferred to T-4 of SCRUM-461 when 3 additional tests are added)
- **Build**: `nest build` exit 0, dist/ contains all 3 compiled JS artifacts
- **Tests skipped**: none
- **Manual verification scenarios** (executed during 2026-05-15 install session, not re-run here):
  - App boots with `Nest application successfully started`
  - `OnlineMlScorerModule dependencies initialized` log present in boot output
  - `GET /__shadow_probe__` (temporary probe, removed in SCRUM-461) returned HTTP 200 `{"ok":true}`
  - 1 line written to `/home/em-admin/projects/em-ecosystem/logs/shadow-decisions.jsonl` confirming end-to-end flow

## Bugs Found

No new bugs found during this ticket's lifecycle. The pre-existing `target.value=""` bug in line 122 of `online-ml-scorer.service.ts` (cross-repo propagation pending) is **intentionally preserved** per AC-6 — its fix lives in the framework template only (SCRUM-461 merge `95cd081`), and propagation will land in a future SCRUM-461-BATCH-2 ticket.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | **Module Registry**: added `OnlineMlScorerModule` row + updated `AppModule` imports list to include it. **Global Interceptors (APP_INTERCEPTOR)**: new section listing `OnlineMlScorerInterceptor`. **Test Mock Requirements**: added `OnlineMlScorerService` row. **Service Dependency Chains**: added `OnlineMlScorerInterceptor → OnlineMlScorerService` chain. **Changelog**: new row for 2026-05-15 SCRUM-462. Header updated to "Last update: SCRUM-462 (2026-05-15)" |
| `ai-specs/changes/common/records/backlog/SCRUM-462_backend.md` | NEW — this record |
| `ai-specs/changes/common/plans/backlog/SCRUM-462_backend.md` | NEW (committed for first time — created during `/plan`, untracked until this commit) |
| `ai-specs/changes/common/plans/backlog/SCRUM-462_verify.md` | NEW (committed for first time — created during `/verify`, untracked until this commit) |

**NOT updated** (intentional, no scope match):
- `ai-specs/specs/data-model.md` — no Prisma entity changes
- `ai-specs/specs/api-spec.yml` — no API endpoint changes
- `ai-specs/specs/*-standards.mdc` — no new patterns introduced (Cap 5 follows Phase 8 spec which is already documented in `online-enforcement-standards.mdc`)

## Lessons Learned

**What went well**:

- The Plan's Step 0 deviation (branch from `origin/main` vs local main) was a great pre-flight catch. Without that decision, the 2 unpushed AUTH commits would have polluted the SCRUM-462 PR and violated AC-7 + the `feedback_auth_change_control` memory ("split PRs cross-domain"). The lifecycle's hesitation-to-act protocol (pause + propose options) prevented a real cross-domain violation.
- The husky/prettier + eslint pre-push gates caught real issues before push (line-wrap, `security/detect-non-literal-fs-filename` warnings, obsolete eslint-disable rule). Fixing them in a follow-up commit (vs amending) gave a clean 2-commit branch history that squash-merge collapsed to a single main commit (`52b951b`).
- The state machine FW-004 caught the branch suffix lowercase rule early in SCRUM-461 (`-T3` → `-t3`); applied that learning preemptively here (`feature/SCRUM-462-backend` matches regex on first try).

**What was harder than expected**:

- The "regularization-only" pattern doesn't fit the standard `/develop` spec cleanly. The spec assumes `git checkout main && git pull origin main` from a clean main → branch → write code. For regularization, the working tree IS the implementation, so the order is reversed: branch FROM dirty working tree, then stage what's there. Plan stub had to explicitly document this deviation; otherwise the `/develop` agent would have done the standard sequence and lost the WIP.
- ESLint surprises: project enforces `--max-warnings 0` (not just errors). The `security/detect-non-literal-fs-filename` rule is a real signal but the warnings in `online-ml-scorer.service.ts` were FALSE positives (operator-controlled config paths, not user input). Required inline `eslint-disable-next-line` with rationale — the project's pre-push hook does NOT auto-suppress, which is correct (forces conscious decisions).
- The local main divergence post-merge (origin/main has SCRUM-462 squash; local main has 2 AUTH commits) is intentional but creates a `git status` that looks confusing. Documented in commit body and `/commit` summary so future sessions don't get tripped up.

**Recommendations for similar tickets (regularization-only)**:

- Always check `git log origin/<base>..<base>` before branching — surface ahead-of-upstream local commits BEFORE creating the feature branch. They're invisible in `git status` but can pollute downstream PRs.
- Plan should explicitly state "branch from dirty working tree" (not from clean main) when the implementation already exists as WIP.
- Pre-push hooks may surface issues that didn't appear during `/develop`'s targeted tests (different scope: full eslint vs spec-only tests). Run `npx eslint --max-warnings 0 <changed-files>` during `/develop`'s testing step to catch these earlier.

## Recommended Follow-ups

- **Push the 2 unpushed AUTH commits on local `em-ecosystem` main** (priority=MEDIUM, module=auth, type=tech-debt) — `7e21b2a chore(SCRUM-453)` + `96b66bc chore(auth) CODEOWNERS` ahead-of-upstream. Local main diverges from origin/main after SCRUM-462 squash-merge. Operator decision when to rebase + push.
- **Propagate T-3 fix to `nexacore-api/src/common/services/online-ml-scorer.service.ts` line 122** (priority=MEDIUM, module=common, type=bug) — was deferred per SCRUM-461 record `§Recommended Follow-ups`; now that the file is in `em-ecosystem` main as of `52b951b`, propagation is unblocked. Suitable for a small "SCRUM-461-BATCH-2 piloto" ticket.
- **Add `npx eslint --max-warnings 0 <files>` to `/develop`'s testing step** (priority=LOW, module=framework, type=doc) — the targeted-test step today catches jest failures but not the project's strict eslint warnings; pre-push hook caught it during `/commit`. Earlier detection would reduce roundtrip.
- **Document the regularization-only ticket pattern in `workflow-standards.mdc`** (priority=LOW, module=framework, type=doc) — branching from dirty working tree is an exception to the standard `/develop` flow. Should be a named pattern with examples (SCRUM-462 as case study).

## Rollback Playbook

### Trigger conditions

- `nest build` fails in `em-ecosystem` main after this commit lands
- Any test in the 1056-test suite fails on main (was passing on the branch)
- The shadow log file `~/projects/em-ecosystem/logs/shadow-decisions.jsonl` does NOT grow when the app receives traffic with `ml_inference.enabled: true` (Cap 5 silently broken)

### Rollback steps

1. **Revert merge commit**: `git revert -m 1 52b951b` on a hotfix branch from `em-ecosystem` main, then merge via PR. Note: the 2 AUTH commits on local main (unpushed) are independent and unaffected.
2. **Migration handling**: N/A — no Prisma migrations.
3. **Cache/state cleanup**:
   - `online-enforcement-flags.yml` (gitignored, per-environment) on the dev server stays — it's not committed and reverting the commit doesn't touch it
   - In-memory `OnlineMlScorerService.statsByEntity` Map is process-scoped; restart of nexacore-api after revert clears it
4. **External provider state**: N/A — no third-party integrations.
5. **Verification after revert**:
   ```bash
   cd ~/projects/em-ecosystem/nexacore-api
   npm run build  # expect: exit 0
   grep -rn "OnlineMlScorerModule" src/  # expect: 0 matches post-revert
   ls src/common/services/online-ml-scorer.service.ts  # expect: No such file
   ```

### Estimated rollback time

- Happy path (revert only): ~3 minutes (revert PR + CI checks + deploy).
- No migration to roll back, no external services to coordinate.

### Known risks of rollback

**None.** SCRUM-462 is purely additive (10 new/modified files, no deletions, no schema changes, no API changes). Reverting cleanly removes Cap 5 from the request pipeline; downstream services/consumers don't depend on it (only the JSONL log file, which is gitignored and operationally scoped).

NOT-§15 (`common/` paths only), so `workflow-standards.mdc §15.3.3` review NOT required for the revert.
