# Frontend Implementation Plan: SCRUM-391 [SCRUM-387 C2] Audit cascade upgrades — TypeScript cluster

> **Scope adaptation note**: Audit-decision sub-ticket (precedent: SCRUM-390 C1). No feature code is written. Single commit `ee309e6` (TypeScript 5→6) already on `main`; this ticket only adjudicates it (ACCEPT-NO-OP / ACCEPT / REVERT / SPLIT) and records the decision as a new row in `workflow-standards.mdc` §13.5.2 (the audit log section opened by SCRUM-390). Standard frontend template sections apply but operational content concentrates in §6 (Implementation Steps) and the new §6.1 (Deferred ticket creation for `baseUrl` → `paths`). Filed under `dashboard/`, labeled `_frontend` per parent precedent.

## 1. Header

- **Ticket**: SCRUM-391 (Sprint 14, id=477)
- **Parent**: SCRUM-387 (cascade-audit meta-coordinator)
- **Cluster**: C2 — TypeScript (1 commit, 4 facets)
- **Issue type**: Subtask
- **Priority**: Medium
- **Predecessors**: SCRUM-390 (C1 closed 2026-05-10, methodology validated, lessons-learned threaded into this plan)
- **Successor**: C4 sub-ticket (Dependency security) — opened after C2 closes per parent §6 Step 3 + §7 implementation order

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed cluster**: SCRUM-390 (C1 Dev tooling) — record committed `f8b301c` on ai-specs main; PR #1 squash `320b1bd` shipped §13.5 stub + 4 ACCEPT-NO-OP rows.
- **Integration state verified**: Yes — no em-ecosystem-code module/guard/service/permission state changes anticipated on the expected (NO-OP) path.
- **Files verified against live state**:
  - `em-ecosystem-code/main` git history — `ee309e6` confirmed present; per-commit content read via `git show --stat ee309e6` during /enrich-us. 14 files: 3× package.json, 3× package-lock.json, 1× tsconfig.build.json, 1× tsconfig.json, 6× test files in api. **Production `src/` (excluding `tests/`): ZERO files changed across all 3 packages.**
  - `ai-specs/specs/workflow-standards.mdc` — §13.5 + §13.5.1 + §13.5.2 (with 4 C1 rows) confirmed on main (commit `320b1bd`).
  - `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` — C1 closure section + 7 lessons confirmed on main (commit `f8b301c`).
- **Discrepancies with integration-state.md**: None — this ticket touches no module/guard/service.

## 3. Regression Impact Analysis

**Expected path (1× ACCEPT-NO-OP)** — blast radius:
- `ai-specs/specs/workflow-standards.mdc`: +1 new table row in §13.5.2 (between existing C1 rows and end-of-file). No structural rewrite.
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-391_frontend.md`: this file (created by this plan).
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-391_verify.md`: created at `/verify`.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-391_frontend.md`: created at `/update-docs`.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md`: replace "C2 TypeScript — pending" placeholder with closure summary + lessons for C3.
- New Jira ticket: Deferred — `baseUrl` → `paths` switch before TS 7 (created at `/update-docs` Part 5).
- `em-ecosystem-code`: NO change. NO branch needed.
- VRT baseline PNGs: NO change.
- **Blast radius size**: 4 ai-specs files + 1 Jira ticket; 0 em-ecosystem-code files. Below the >5 file flag.

**Surprise paths (low probability)**:
- ACCEPT (visual diff): NOT plausible — TS types stripped at build, no rendering can change.
- REVERT: would require unwinding `ee309e6` — but that triggers cascading TS-typed code rewrites in 14 files including production `src/auth/tests/*`, `src/middleware/tests/*`. Strongly avoid unless absolutely justified.
- SPLIT: would mean carving out one of the 4 facets (TS bump, tsconfig.build, ignoreDeprecations, lint auto-fixes) for separate handling. Unlikely useful given they all reconcile to the same NO-OP signal.

**Test impact assessment**: NO `.spec.ts` test file modifications anticipated by this ticket. (Note: `ee309e6` itself modified 6 spec files for TS 6 compatibility, but that's the audited commit's content — already on main, not changed by this audit ticket.)

## 4. Overview

C2 is the second cluster sub-ticket of the SCRUM-387 cascade-audit campaign and the second validation of the per-commit `git show --stat` methodology codified by SCRUM-390 lessons-learned. Single commit `ee309e6` adjudicated against 4 distinct facets (TS version bump, `tsconfig.build.json` exclude rule, `ignoreDeprecations: "6.0"` flag, 13× `as` auto-fixes in tests). All 4 facets reconcile to ACCEPT-NO-OP because production `src/` (excluding `tests/`) is **untouched** across all 3 packages — TS compiles to JS at build, types are stripped, test code never ships, and the only runtime change is auto-fixed test assertions which are semantically equivalent per commit body.

Confidence is HIGHER than C1 because there is no `ab101f3`-equivalent (no source-code wrapper that ships to the bundle). The deliverable is structural: append one row to `workflow-standards.mdc` §13.5.2 + open a Deferred Jira ticket for the `baseUrl` deprecation tech debt before TS 7 GA.

## 5. Architecture Context

- **Touched docs**: `ai-specs/specs/workflow-standards.mdc` (append 1 row to §13.5.2). `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` (replace C2 placeholder).
- **Touched plans/records**: this plan + verify + record under `Sprint 14/`.
- **Touched code (NO-OP path)**: none.
- **Tooling consumed**: `git show` (read-only inspection); Jira MCP `createTicket` for Deferred tech debt at `/update-docs`.
- **Branching**:
  - Primary: `feature/SCRUM-391-frontend` in **ai-specs** repo.
  - Conditional: `feature/SCRUM-391-revert-<short>` in **em-ecosystem-code** ONLY if any facet → REVERT (very unlikely).

## 6. Implementation Steps

### Step 0: Create feature branch (in ai-specs repo)

- **Action**: Branch `feature/SCRUM-391-frontend` from `main` of the **ai-specs** repository. Em-ecosystem-code stays untouched on the NO-OP path.
- **Implementation**:
  1. From `ai-specs/`, ensure on `main` and clean (modulo concurrent-agent untracked files in `auth/audit/` and `auth/plans/Sprint 14/SCRUM-354_*` — leave those alone per `feedback_concurrent_agents.md`).
  2. `git checkout -b feature/SCRUM-391-frontend`.
  3. Verify: `git branch --show-current` → expect `feature/SCRUM-391-frontend`.

### Step 1: Per-facet audit via git show (read-only)

- **Action**: For commit `ee309e6`, run 4 targeted `git show` invocations to capture per-facet evidence. No `npm ci/lint/build/test` against current main (parent `main` mixes C2-C6 signals — same reasoning as SCRUM-390 lessons-learned #1).
- **Commands** (run from `em-ecosystem-code/`):
  ```
  git show --stat ee309e6
  git show ee309e6 -- nexacore-api/tsconfig.build.json
  git show ee309e6 -- nexacore-api/tsconfig.json
  git show ee309e6 -- "nexacore-api/src/**/tests/*.ts" "nexacore-api/src/**/*.spec.ts"
  git show ee309e6 -- "nexacore-api/package.json" "nexacore-dashboard/package.json" "satellites/sat-cristian-garcia/package.json"
  ```
- **What to record per facet** (for /verify decision matrix):
  - **Facet 1 (TS bump)**: confirm `^5.x → ^6.0.3` in 3 package.json files. Bundle-reach: NONE (types stripped).
  - **Facet 2 (`tsconfig.build.json`)**: confirm `**/tests/**` added to `exclude`. Bundle-reach: build-time only; verify dist won't include test files.
  - **Facet 3 (`ignoreDeprecations`)**: confirm `"ignoreDeprecations": "6.0"` added to `nexacore-api/tsconfig.json`. Bundle-reach: build-time only. Document as Deferred tech debt (AC6 — see §6.1).
  - **Facet 4 (13× `as` auto-fixes)**: read each diff; confirm each removed `as X` is in a test file (not src/). Per commit body: "Semantically equivalent at runtime."
- **Cross-package check**: confirm dashboard + satellite have ZERO `.ts` source diff (only package.json + lock changed). Critical for the "no bundle reach" claim.
- **Fail-fast rule**: if any facet's evidence contradicts the NO-OP expectation (e.g., a non-test source file appears in the diff), STOP and escalate per parent §6 Step 1 decision tree.

### Step 2: Append C2 row to §13.5.2 audit log

- **File**: `ai-specs/specs/workflow-standards.mdc`
- **Action**: Append exactly **one new row** to the §13.5.2 table (after the 4 existing C1 rows). Do NOT modify existing rows. Use the same column layout (`Cluster | Sub-ticket | Date | Commit | Decision | Rationale`).
- **Stub row** (decisions and rationale filled at `/verify`; placeholders here):
  ```
  | C2      | SCRUM-391  | 2026-05-XX | ee309e6 | _to fill_  | _to fill at /verify (TS 5→6; 4 facets — bump/tsconfig/ignoreDeprecations/as-fixes)_ |
  ```
- **Notes**: Diff size: 1 added line. The existing §13.5 + §13.5.1 + §13.5.2 header row are NOT modified.

### Step 3: Stage ai-specs files (no commit, per /develop spec point 10)

- **Action**: `git add` only the 2 files affected by this ticket on this branch. Per `feedback_concurrent_agents.md`, stage by explicit path (no `git add -A` / `git add .`).
- **Files**:
  - `ai-specs/specs/workflow-standards.mdc` (modified — 1 row appended)
  - `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-391_frontend.md` (this file, new)
- **Stage-only**: per `/develop` spec point 10, do NOT commit. `/verify` runs first; `/commit` produces the final commit.

### Step 4: Confirm em-ecosystem-code untouched

- **Action**: `cd em-ecosystem-code && git status` → expect identical state to before /develop began (clean modulo concurrent-agent's `nexacore-dashboard/tsconfig.json` modification, which pre-existed and must not be disturbed).

### Step 4-alt: (Surprise paths only — skip on NO-OP)

- **REVERT** (very unlikely for C2 because the 14-file blast radius makes a clean revert costly):
  1. `cd em-ecosystem-code && git checkout -b feature/SCRUM-391-revert-ts5 main`
  2. `git revert ee309e6` — note this revert MUST also unwind the cascading test-file edits.
  3. Open PR with `[REVERT]` prefix and full SCRUM-380 playbook treatment.
- **SPLIT** (extremely unlikely): unhelpful here because all 4 facets share the same upstream commit. SPLIT would only make sense if one facet's evidence diverged sharply from the others.
- **ACCEPT-visual** (impossible for C2): no rendering path; types are stripped at build. Documented as N/A in the decision rationale.

### Step 5: Doc-drift sweep

- **Action**: Confirm no other docs need update. C2 (NO-OP path) only touches `workflow-standards.mdc` (§13.5.2 row). No `data-model.md` / `api-spec.yml` / `frontend-standards.mdc` / `integration-state.md` / `documentation-standards.mdc` impact.
- **Defer to /update-docs**: SCRUM-387 record (replace C2 placeholder) and the Deferred Jira ticket (§6.1 below) are `/update-docs` deliverables, not `/develop`.

## 6.1 Deferred ticket for `baseUrl` → `paths` (created at /update-docs)

- **Trigger**: Facet 3 (`ignoreDeprecations: "6.0"` for `baseUrl`) — TypeScript 6 deprecates `baseUrl`; TypeScript 7 will remove it. The `ignoreDeprecations` flag is a documented stopgap, not a permanent fix.
- **Classification**: Deferred (per `/verify` spec Step 3 + `workflow-standards.mdc` §8 deviation taxonomy). NOT this ticket's scope (would expand C2 from "audit decision" to "config refactor + verify all imports still resolve").
- **Ticket spec** (created via Jira MCP `createTicket` at `/update-docs` Part 5):
  - **Project**: SCRUM
  - **Type**: Task
  - **Parent**: none (standalone tech-debt — not a cluster sub-ticket)
  - **Sprint**: Backlog (Deferred — schedule when TS 7 RC announced)
  - **Title**: `Switch nexacore-api tsconfig from baseUrl to explicit paths (pre-TS 7 prep)`
  - **Description**: Context (`ignoreDeprecations: "6.0"` was added in `ee309e6` SCRUM-371 to suppress the deprecation warning); scope (replace `baseUrl: "./src"` + relative imports with explicit `paths` mappings; verify all `import` statements still resolve via `tsc --noEmit` + `nest build` + `jest`); acceptance (`ignoreDeprecations` line removed; build passes; no behavioral change).
- **Why Deferred not Accepted-Quality**: this is a forward-looking config migration with a known release deadline (TS 7 GA). It's NOT an immediate gap or risk. Per /verify spec Step 3 decision tree question 5 ("intentionally postponed with rationale → Deferred"), it fits Deferred.

## 7. Implementation Order

```
Step 0  Create feature/SCRUM-391-frontend branch in ai-specs
Step 1  Per-facet audit via git show ee309e6 (4 facets)
Step 2  Append 1 stub row to §13.5.2 audit log table
Step 3  Stage 2 ai-specs files (no commit per /develop spec point 10)
Step 4  Confirm em-ecosystem-code working tree unchanged
        — Step 4-alt (surprise paths) only fires on REVERT/SPLIT/ACCEPT-visual
Step 5  Doc-drift sweep (NO-OP confirms no other doc impact)
```

`/develop`'s diff is intentionally tiny: 1 plan file + 1 stub row in workflow-standards.mdc. Substantive judgment lands at `/verify` when the row is filled. `/update-docs` adds the record + replaces SCRUM-387 placeholder + creates the Deferred ticket.

## 8. Testing Checklist

- [ ] `git show --stat ee309e6` confirms 14 files changed, 0 production `src/` (non-test) files in api/dashboard/satellite.
- [ ] `tsconfig.build.json` change confirmed: `**/tests/**` added to `exclude`.
- [ ] `tsconfig.json` change confirmed: `"ignoreDeprecations": "6.0"` added.
- [ ] All 13 `as`-removal diffs are in `*.spec.ts` or `*.helpers.ts` (no production `src/` `.ts` files).
- [ ] Dashboard + satellite source-code diff: 0 files (only package.json + lock).
- [ ] §13.5.2 row appended without modifying existing C1 rows (verify by reading the diff).
- [ ] `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-391_frontend.md` (this file) tracked by git on the new branch.
- [ ] No file changes in `em-ecosystem-code` (NO-OP path).

**Regression test checklist**: N/A — no `.spec.ts` modified by this ticket; no constructor/method/export change.

## 9. Error Handling Patterns

N/A. Read-only audit; no runtime path.

If a verification gate (Step 1) emits unexpected evidence (e.g., a non-test `.ts` file appears in the diff), do NOT silence — escalate to the decision tree per parent §6 Step 1 and pause `/develop` until the new decision is settled.

## 10. UI/UX Considerations

N/A — docs-only ticket.

## 11. Dependencies

- **Repo access**: write access to ai-specs (always present); read-only access to em-ecosystem-code.
- **Tools**: `git`, Node 22 (for the Jira MCP enrich script and the /update-docs Deferred ticket creation).
- **External services**: Jira MCP server running on `http://localhost:4000`.
- **Conditional**: `gh` CLI (only if surprise REVERT path fires).

## 12. Notes

- **Documentation language**: English.
- **Local-only develop**: per `feedback_local_first_before_push.md`, `/develop` is local-only.
- **Concurrent-agents discipline**: per `feedback_concurrent_agents.md`. Stage by explicit path.
- **Plan immutability after develop start**: per `workflow-standards.mdc` §10. Any deviation classified at `/verify`.
- **Methodology default**: per-commit `git show --stat` (no `npm` gates against compound main). Codified in SCRUM-387 record C1 lessons-learned. C2 applies it without seeking user re-approval.
- **First Deferred deviation in cascade campaign**: AC6 introduces a new pattern (Deferred ticket creation at `/update-docs`). Document this clearly so C3-C6 plans can reuse the pattern when applicable (e.g., C5 React 19 fixes that get sub-PRed but require follow-ups; C6 Tailwind 4 visual decisions that may surface follow-up cleanup work).

## 13. Next Steps After Implementation

- `/verify` reads §13.5.2 stub row, fills decision + rationale, runs plan compliance, classifies any deviations, issues PASS verdict (expected).
- `/commit` opens PR against ai-specs main, squash-merges, deletes feature branch, lands the §13.5.2 row + plan + verify on main.
- `/update-docs`:
  1. Writes record file `SCRUM-391_frontend.md`.
  2. Replaces "C2 TypeScript — pending" placeholder in SCRUM-387 record with closure summary + lessons for C3.
  3. Creates the Deferred Jira ticket (`baseUrl` → `paths` switch). Adds the new SCRUM-XXX to the C2 record's deviation table follow-up column.
  4. Commits + pushes ai-specs changes (record + SCRUM-387 update + this plan + verify report).
  5. Adds Jira comment to SCRUM-391 with outcome + commit hashes.
- C4 sub-ticket created only after C2 transitions to Done, per parent §6 Step 3 + §7 (C4 third per implementation order).

## 14. Implementation Verification

Final verification checklist (run at `/verify`):

- **Code Quality**: §13.5.2 row matches existing column layout exactly. Markdown lints cleanly.
- **Functionality**: §13.5.2 table parses; new row appears between existing C1 rows and end-of-section. Decision + rationale cells filled in-place by `/verify` without restructuring.
- **Testing**: per Step 1 evidence — all 4 facets independently confirmed NO-OP.
- **Regression**: no spec files modified; existing §13.5 + §13.5.1 content untouched; existing C1 rows untouched.
- **Integration**: §13.5.2 row references parent SCRUM-387 and child SCRUM-391 for traceability.
- **Documentation updates completed**: workflow-standards.mdc + SCRUM-391 plan/verify staged at /develop; record + SCRUM-387 placeholder replacement + Deferred ticket at /update-docs.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 branch `feature/SCRUM-391-frontend` exists on ai-specs.
- [ ] Step 1 per-facet `git show` evidence captured for all 4 facets.
- [ ] Step 2 §13.5.2 stub row appended (existing C1 rows untouched).
- [ ] §13.5.2 stub row populated (decision + rationale filled) by `/verify`.
- [ ] Step 3 stage state confirmed (2 files staged on feature branch, no commit).
- [ ] Step 4 em-ecosystem-code clean (NO-OP) OR Step 4-alt fires with PR linked.
- [ ] Step 5 doc-drift sweep returns "no other docs affected".
- [ ] AC6 Deferred ticket creation queued for `/update-docs` (NOT created at /verify).
- [ ] No deviations OR all classified per `workflow-standards.mdc` §8.

## Out of scope for this plan

- Other clusters C3-C6 — each gets its own sub-ticket and plan.
- The actual `baseUrl` → `paths` migration — that's the Deferred ticket's scope, not this one.
- Frontend ESLint 9→10 upgrade (deferred to SCRUM-378).
- Pre-existing tech debt: SCRUM-388 (hook gap), SCRUM-389 (dashboard test failures).
- Any em-ecosystem-code change beyond Step 4-alt's explicit surprise paths.
