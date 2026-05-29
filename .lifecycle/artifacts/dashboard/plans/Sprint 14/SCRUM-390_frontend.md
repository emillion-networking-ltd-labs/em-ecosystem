# Frontend Implementation Plan: SCRUM-390 [SCRUM-387 C1] Audit cascade upgrades — Dev tooling cluster

> **Scope adaptation note**: This is an **audit-decision sub-ticket** (precedent: parent SCRUM-387 meta-coordinator). No feature code is written. The four cluster commits already live on `main` of `em-ecosystem-code`; this ticket only adjudicates each one (ACCEPT-NO-OP / ACCEPT / REVERT / SPLIT) and records the decisions in `workflow-standards.mdc` under a new audit-log section. Standard frontend template sections apply but most operational content concentrates in §4 (Implementation Steps) and §13 (Module-Level Planning equivalent — the §13.5 audit-log section design). Filed under `dashboard/` per parent precedent (rescue concerns dashboard visual state); labeled `_frontend` per SCRUM-380/384/385/386/387 convention.

## 1. Header

- **Ticket**: SCRUM-390 (Sprint 14, id=477)
- **Parent**: SCRUM-387 (cascade-audit meta-coordinator)
- **Cluster**: C1 — Dev tooling (4 commits)
- **Issue type**: Subtask
- **Priority**: Medium
- **Predecessors**: SCRUM-387 plan approved (§6 Step 1 decision tree + §6 Step 2 C1 spec are this ticket's contract)
- **Successor**: C2 sub-ticket (TypeScript cluster) — opened after C1 closes per parent §6 Step 3

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed ticket** (relevant chain): SCRUM-387 (parent meta-coordinator plan approved)
- **Integration state verified**: Yes — no em-ecosystem-code module/guard/service/permission state changes anticipated on the expected (NO-OP) path.
- **Files verified against live state (read during /enrich-us + /plan)**:
  - `ai-specs/specs/workflow-standards.mdc` lines 667-772 (§13 Framework Upgrade Playbook + §13.4 + §13.4.5) — read confirms §13.4.5 is "Cross-references" scoped to tag policy; appending audit-log to §13.4.5 would be off-topic.
  - `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-387_frontend.md` (parent plan) — §6 Step 1 decision tree + §6 Step 2 C1 spec are operational source-of-truth.
  - `em-ecosystem-code/main` git history — 4 cluster commits confirmed present (`ab101f3`, `a7b619e`, `4a8d88e`, `e1699ca`) via `git log -1 --format`. No prior rewrite/revert.
- **Discrepancies with integration-state.md**: None — this ticket touches no module/guard/service.

## 3. Regression Impact Analysis

**Expected path (4× ACCEPT-NO-OP)** — blast radius:
- `ai-specs/specs/workflow-standards.mdc`: +1 new subsection (§13.5). Net addition; no existing content rewritten.
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-390_frontend.md`: this file (created by this plan).
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-390_frontend.md`: created at `/update-docs`.
- `em-ecosystem-code`: NO change. NO branch needed.
- VRT baseline PNGs: NO change.
- **Blast radius size**: 3 files in ai-specs, 0 in em-ecosystem-code → well below the >5 file flag.

**Surprise paths (low probability per parent §6 Step 1 risk profile)**:
- ACCEPT (visual diff intentional): would require `gh workflow run visual-regression.yml --field capture_baseline=true` against current main. Adds baseline PNG commit to em-ecosystem-code. NOT expected for any of the 4 cluster commits (none ships to browser bundle).
- REVERT: would require `feature/SCRUM-390-revert-<short>` branch in em-ecosystem-code, full SCRUM-380 playbook treatment, and downstream-cluster impact review. NOT expected.
- SPLIT: would generate new sub-tickets SCRUM-39x for each split half, with a record-file note linking them.

**Test impact assessment**: NO `.spec.ts` test file modifications anticipated. No mocked classes change.

## 4. Overview

C1 functions as the **playbook smoke test** for the SCRUM-387 cascade-audit campaign. Per parent §6 Step 1, each cluster runs a 4-gate audit (build / lint / test / VRT-diff) on each commit, then triages into ACCEPT-NO-OP / ACCEPT / REVERT / SPLIT. The four C1 commits are dev-only (Jest, @types/node, ESLint api-only, react-hooks lint plugin) — none reaches the browser bundle. The four expected outcomes are all NO-OP, and the deliverable is structural: a §13.5 audit log appended to `workflow-standards.mdc` capturing the decisions for traceability and to seed C2-C6.

If the smoke test reveals a surprise (e.g. ESLint 10 in api breaks dashboard build via shared types), the cluster splits or one commit reverts — both contingencies are spelled out in §6 Step 1 of the parent plan and recorded here for completeness.

## 5. Architecture Context

- **Touched docs**: `ai-specs/specs/workflow-standards.mdc` (append §13.5).
- **Touched plans/records**: this plan + record file under `Sprint 14/`.
- **Touched code (NO-OP path)**: none.
- **Tooling consumed (NO-OP path)**: `git log` (verification only). No workflow_dispatch trigger needed.
- **Tooling consumed (surprise paths)**: `visual-regression.yml workflow_dispatch` (ACCEPT-visual), `git revert` + SCRUM-380 playbook PR (REVERT), new sub-ticket creation via Jira MCP (SPLIT).
- **Branching**:
  - Primary: `feature/SCRUM-390-frontend` in **ai-specs** repo (for the §13.5 doc append + record file).
  - Conditional: `feature/SCRUM-390-revert-<short>` in **em-ecosystem-code** ONLY if any commit decision = REVERT.
  - No rescue-branch involvement.

## 6. §13.5 Audit-Log Section Decision (binding for /develop)

Parent plan §6 Step 1 deferred the choice of "extend §13.4.5 vs new §13.5" to this sub-ticket. **Decision: NEW §13.5 "Cascade Audit Log"**.

**Rationale**:
1. **Topical coherence**: §13.4.5 is titled "Cross-references" and lists where the visual baseline tag policy intersects with other parts of the playbook. Cluster decisions (ACCEPT/REVERT/NO-OP per commit) are a different concept — appending them under "Cross-references" would make §13.4.5 incoherent and harder to find.
2. **Discoverability**: A peer-level subsection (§13.5) sits next to §13.4 in the §13 outline, signalling its first-class role as part of the playbook (not a footnote of the tag policy).
3. **Append-only growth**: An audit log table grows over time as new cascades are audited. Keeping it under its own subsection makes the growth visually contained and the diff history clean.
4. **Symmetry with §13.4**: §13.4 has subsections §13.4.1–§13.4.5; §13.5 will likewise grow subsections (§13.5.1 entry format, §13.5.2 the live audit-log table) without polluting §13.4.

**Rejected alternative**: extending §13.4.5 with a sub-bullet listing C1-C6 decisions. Rejected because (a) it conflates "where is the tag policy referenced" with "what cluster decisions were made"; (b) future cascades (post-SCRUM-387) would force §13.4.5 to grow indefinitely off-topic.

**Final §13.5 structure** (to be implemented at /develop):

```
### 13.5 Cascade Audit Log (added by SCRUM-387)

> When the §13 playbook is invoked retrospectively against commits already on main
> (the SCRUM-387 scenario), each cluster's adjudication is recorded here for
> traceability. ACCEPT-NO-OP entries document why a commit was deemed safe to
> leave in place; ACCEPT/REVERT/SPLIT entries link to the PR or sub-ticket that
> implemented the consequence.

#### 13.5.1 Entry format

Each row records: cluster code (C1, C2, ...), parent ticket, sub-ticket, date,
commit SHA, decision (ACCEPT-NO-OP | ACCEPT | REVERT | SPLIT), and a one-line
rationale citing the verification gate(s) that produced the decision.

#### 13.5.2 Audit log

| Cluster | Sub-ticket | Date       | Commit  | Decision      | Rationale                            |
|---------|------------|------------|---------|---------------|--------------------------------------|
| C1      | SCRUM-390  | 2026-05-XX | ab101f3 | <to fill>     | <to fill at /verify>                 |
| C1      | SCRUM-390  | 2026-05-XX | a7b619e | <to fill>     | <to fill at /verify>                 |
| C1      | SCRUM-390  | 2026-05-XX | 4a8d88e | <to fill>     | <to fill at /verify>                 |
| C1      | SCRUM-390  | 2026-05-XX | e1699ca | <to fill>     | <to fill at /verify>                 |
```

The header text + 13.5.1 + the 4 placeholder rows are appended at /develop. Decisions and rationales are filled by /verify (which then commits the final row contents). This keeps /develop's diff small and reviewable, and concentrates the substantive judgment in /verify.

## 7. Implementation Steps

### Step 0: Create feature branch (in ai-specs repo)

- **Action**: Branch `feature/SCRUM-390-frontend` from `main` of the **ai-specs** repository. Em-ecosystem-code stays untouched on the NO-OP path.
- **Implementation**:
  1. From `ai-specs/`, ensure on `main` and clean: `git status`.
  2. Pull: `git pull origin main`.
  3. Create branch: `git checkout -b feature/SCRUM-390-frontend`.
  4. Verify: `git branch --show-current` → expect `feature/SCRUM-390-frontend`.
- **Notes**: Per parent §6 Step 1, the branch suffix `-frontend` is the convention for cascade-audit sub-tickets even when the work is documentation. No corresponding em-ecosystem-code branch unless a REVERT is triggered.

### Step 1: Run the per-commit audit gates

- **Action**: From `em-ecosystem-code/main` (clean working tree), run the verification block from the enriched ticket and capture results.
- **Commands** (run as a single block to capture all evidence at once):
  ```
  cd em-ecosystem-code
  git log -1 --format="%h %s" ab101f3 a7b619e 4a8d88e e1699ca
  cd nexacore-api          && npm ci && npm run lint && npm run build && npm test
  cd ../nexacore-dashboard && npm ci && npm run lint && npm run build && npm test
  cd ../satellites/sat-cristian-garcia && npm ci && npm run lint && npm run build
  ```
- **What to record**: For each commit, whether each of the 4 gates (build / lint / test / VRT-diff) PASSED. Capture any unexpected output verbatim into the `/develop` notes for `/verify`.
- **Fail-fast rule**: If any single gate fails, STOP. Do not append to §13.5 yet — escalate the failure to the decision tree (parent §6 Step 1) and re-plan if needed.
- **Cross-package guard** (commit `4a8d88e` ESLint 9→10 api): explicitly confirm `nexacore-dashboard/package.json` ESLint stays on v9 (frontend deferred to SCRUM-378). If api's lint config changes affect shared types consumed by dashboard, the cluster SPLITs.
- **VRT diff check**: For C1 the diff is expected to be NONE (no commit reaches the browser bundle). A formal `gh workflow run visual-regression.yml` run is **NOT** triggered for NO-OP. If a developer suspects visual impact, the smoke is `npm run dev` + manual route walk-through.

### Step 2: Append §13.5 stub to workflow-standards.mdc

- **File**: `ai-specs/specs/workflow-standards.mdc`
- **Action**: Append the §13.5 stub defined in §6 of this plan (header text + §13.5.1 + §13.5.2 with 4 placeholder rows containing `<to fill>` markers). Do NOT yet fill decisions — that's `/verify`'s job.
- **Position**: At the very end of the file (after current line 772). Preserve existing trailing newline behavior.
- **Notes**: This is the only writable change in the NO-OP path. Diff size: ~25 added lines.

### Step 3: Commit ai-specs Step 0 + Step 2 work locally (no push yet)

- **Action**: `git add ai-specs/specs/workflow-standards.mdc ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-390_frontend.md` then `git commit` with message `SCRUM-390: append §13.5 cascade audit log stub (decisions pending /verify)`.
- **Scope**: Per `feedback_concurrent_agents.md`, stage by explicit path only. Do NOT use `git add .` or `git add -A`.
- **Local-only**: Per `feedback_local_first_before_push.md`, `/develop` does not push. Push happens at `/commit`.

### Step 4: (NO-OP path) — no em-ecosystem-code change

- **Action**: Confirm `em-ecosystem-code` working tree remains clean: `cd em-ecosystem-code && git status` → expect clean and on `main`.
- **Notes**: If Step 1 surfaced a real failure, this step is replaced by the surprise-path branch (Step 4-alt below).

### Step 4-alt: (Surprise paths only — REVERT or ACCEPT-visual)

- **REVERT path**:
  1. `cd em-ecosystem-code && git checkout -b feature/SCRUM-390-revert-<short> main`
  2. `git revert <cluster-commit>` (one or more)
  3. Open PR with `[REVERT]` prefix and full SCRUM-380 playbook treatment (VRT, a11y, console gates green).
  4. Document revert SHA in the `/develop` notes for `/verify`.
- **ACCEPT-visual path** (NOT expected for any C1 commit):
  1. From a test branch, run `gh workflow run visual-regression.yml --ref main --field capture_baseline=true --field baseline_ref=<current-main-sha> --field package=both`.
  2. Workflow auto-commits the new baseline PNGs to main with `[skip ci]`.
  3. Verify with a no-op test PR.
  4. Document the baseline-bump commit SHA in `/develop` notes.

### Step 5: Update Technical Documentation

- **Action**: Per `/plan` template Step N+1, identify which docs need updating now. For C1 NO-OP path, the only doc touched is `workflow-standards.mdc` (§13.5 added in Step 2). No `data-model.md` / `api-spec.yml` / `frontend-standards.mdc` / `integration-state.md` change.
- **Notes**: The substantive `/update-docs` deliverable comes after `/verify` (record file + final §13.5 row contents). Step 5 here just confirms there's no other doc drift to address pre-`/verify`.

## 8. Implementation Order

```
Step 0  Create feature/SCRUM-390-frontend branch in ai-specs
Step 1  Run per-commit audit gates from em-ecosystem-code/main (read-only)
Step 2  Append §13.5 stub to workflow-standards.mdc (placeholder rows)
Step 3  Local commit in ai-specs (no push)
Step 4  Confirm em-ecosystem-code working tree unchanged (NO-OP path)
        — OR Step 4-alt for REVERT / ACCEPT-visual surprises
Step 5  Doc-drift sweep (NO-OP confirms no other doc impact)
```

The plan deliberately keeps `/develop`'s diff small (one §13.5 stub append + this plan file) so that `/verify` can focus on the audit-evidence judgment without re-reviewing prose.

## 9. Testing Checklist

- [ ] All 4 commits PASS build gate (`npm run build` in api + dashboard + satellite).
- [ ] All 4 commits PASS lint gate.
- [ ] All 4 commits PASS test gate (api + dashboard).
- [ ] No VRT diff observed via manual `npm run dev` walk-through (sample 3 routes: `/`, `/login`, `/dashboard`).
- [ ] Cross-package guard for ESLint cluster: dashboard ESLint version unchanged at v9.
- [ ] §13.5 stub appended without disturbing existing §13–§13.4.5 content (verify by reading the diff).
- [ ] `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-390_frontend.md` (this file) tracked by git on the new branch.
- [ ] No file changes in `em-ecosystem-code` (NO-OP path).

**Regression test checklist**: N/A — no `.spec.ts` modified. No constructor signatures change. No mocks affected.

## 10. Error Handling Patterns

N/A. This ticket emits no runtime errors.

If a verification gate (Step 1) emits an unexpected error, treat it as a decision-tree input — do NOT silence or work around. Re-classify the affected commit per parent §6 Step 1 and stop appending §13.5 until the new decision is settled.

## 11. Dependencies

- **Repo access**: write access to ai-specs (always present in EM Ecosystem dev workspace); read-only access to em-ecosystem-code (no push needed on NO-OP path).
- **Tools**: `node` v22, `npm`, `git`. No new packages.
- **External services**: none.
- **Conditional dependencies (surprise paths)**: `gh` CLI (for `gh workflow run` if ACCEPT-visual fires); Jira MCP (already running locally) for SPLIT path sub-ticket creation.

## 12. Notes

- **Documentation language**: English (per `documentation-standards.mdc`).
- **Local-only develop**: per `feedback_local_first_before_push.md`, `/develop` is local-only — push and PR live in `/commit`.
- **Concurrent-agents discipline**: per `feedback_concurrent_agents.md`, stage by explicit path. Do not run repo-wide git operations.
- **Plan immutability after develop start**: per `workflow-standards.mdc` §10, this plan is frozen once `/develop` begins. Any deviation is recorded at `/verify` per the deviation classification system.
- **Decision discipline**: a NO-OP decision is the default; an ACCEPT or REVERT requires explicit gate evidence (Step 1 capture) cited inline in the §13.5 row's Rationale column.

## 13. Next Steps After Implementation

- Hand-off to `/verify`: `/verify` reads the §13.5 stub, fills the 4 decision cells + rationale cells, and confirms gates from Step 1 evidence.
- After `/verify` PASS, `/commit` opens the PR (single PR against ai-specs main). Per parent precedent and SCRUM-329 Part B docs-only adaptation, the commit lands on ai-specs main directly via PR.
- After `/commit`, `/update-docs` writes the record file `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-390_frontend.md` capturing the per-commit gate evidence + final decisions, and appends a "lessons learned for C2 (TypeScript)" paragraph to SCRUM-387's record file (parent §6 Step 3).
- C2 sub-ticket is opened only after C1 transitions to Done, per parent §6 Step 3 single-ticket-at-a-time discipline.

## 14. Implementation Verification

Final verification checklist (run at `/verify`):

- **Code Quality**: §13.5 prose follows the playbook's existing voice (subsection headers, callout block format). Markdown lints cleanly.
- **Functionality**: §13.5 audit log table is parsable Markdown; placeholder rows can be filled in-place at `/verify` without restructuring.
- **Testing**: per Step 1 evidence, all 4 commits' gates captured; decision matrix populated.
- **Regression**: no `.spec.ts` mock churn; no em-ecosystem-code change on NO-OP path; existing §13.4.5 content untouched.
- **Integration**: §13.5 cross-references parent SCRUM-387 and child SCRUM-390 for traceability.
- **Documentation updates completed**: `workflow-standards.mdc` updated; record file at `/update-docs` will close the loop.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 branch `feature/SCRUM-390-frontend` exists on ai-specs.
- [ ] Step 1 gates run against em-ecosystem-code/main and evidence captured.
- [ ] Step 2 §13.5 stub appended to `workflow-standards.mdc` with 4 placeholder rows referencing the 4 commits.
- [ ] §13.5 decision matrix populated (4 rows filled with decision + rationale) by `/verify`.
- [ ] Step 3 local commit exists (not pushed).
- [ ] Step 4 confirms em-ecosystem-code clean (NO-OP) OR Step 4-alt fires with PR linked.
- [ ] No deviations OR all classified per `workflow-standards.mdc` §8 with formal record.

## Out of scope for this plan

- Other clusters C2-C6 — each has its own sub-ticket and plan.
- Frontend ESLint 9→10 upgrade — deferred to SCRUM-378 (separate ticket).
- Pre-existing tech debt: SCRUM-388 (hook gap), SCRUM-389 (dashboard test failures).
- Any em-ecosystem-code change beyond Step 4-alt's explicit surprise paths.
- Tag policy revisions — §13.4 is finalized by SCRUM-384/386.
