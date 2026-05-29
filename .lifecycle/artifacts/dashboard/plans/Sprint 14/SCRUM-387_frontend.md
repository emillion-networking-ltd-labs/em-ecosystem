# Frontend Implementation Plan: SCRUM-387 Reopen Cascade Upgrades Under SCRUM-380 Playbook

> **Scope adaptation note**: This is a **meta-coordinator ticket** (precedent: SCRUM-329 Part B). The plan defines the cluster split + ACCEPT/REVERT decision framework + first sub-ticket spec. Actual code work happens in 6 sub-tickets created on-demand. Standard backend/frontend template sections apply at the meta level only — most are N/A here and detailed in each sub-ticket's plan instead. Filed under `dashboard/` because the rescue concerns dashboard visual state; labeled `_frontend` per SCRUM-380/384/385/386 convention.

## 1. Header

- **Ticket**: SCRUM-387 (Sprint 14, id=477)
- **Parent epic**: SCRUM-383 (Visual baseline rescue post-Tailwind 4 regression)
- **Issue type**: Task (meta-coordinator)
- **Priority**: Medium
- **Predecessors**: SCRUM-384 (tag), SCRUM-385 (rescue branch), SCRUM-386 (VRT baseline regen)
- **Successors**: 6 sub-tickets to be created (C1-C6 clusters)

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed ticket**: SCRUM-386 (VRT baseline regen)
- **Integration state verified**: Yes — no module/guard/service/permission changes anticipated by this meta-ticket itself. Sub-tickets may touch state per their own scope.

**Files / refs verified against live state (2026-05-10)**:
- Tag `v-baseline-2026-05-06-auth-green` → `3a46248` (annotated, on origin) ✓
- Branch `rescue/visual-baseline` → `fbac04b` on origin ✓ (preserved per epic until closure)
- VRT baselines on `main` derived from rescue tag: 22 dashboard PNGs (commit `e147d3c`) + 14 satellite PNGs (commit `1d27ec2`) ✓
- 9 framework upgrade commits since rescue tag, all confirmed on `main` (verified via `git log v-baseline-2026-05-06-auth-green..main` grep for SCRUM-(36[2-9]|37[0-9]))
- workflow-standards.mdc §13.1 + §13.4.5 normative "tag, not commit" rule live ✓

**Discrepancies with integration-state.md**: None.

## 3. Regression Impact Analysis

This meta-ticket has **zero direct blast radius**. The blast radius lives in each sub-ticket — for an ACCEPT decision, only baseline PNGs change (controlled, additive); for a REVERT decision, the cluster's commits are rolled back and consumers must be re-validated (defined per sub-ticket).

**Meta-level coordination risk**: ordering matters because clusters interact. Documented in `Implementation Order` (Section 7) below.

## 4. Overview

The SCRUM-383 epic produced three artifacts so far: a frozen rescue tag (SCRUM-384), a clean rescue branch (SCRUM-385), and a fresh VRT baseline derived from the rescue (SCRUM-386). Main currently contains both: the rescue baseline (PNG references) AND the cascade upgrades (Next 14→16, TypeScript 5→6, Tailwind 3→4, etc.). This produces R8 expected drift on every PR — VRT fails because main's render no longer matches the baseline.

SCRUM-387 closes the loop by **walking through each cascade upgrade individually** and deciding: ACCEPT (the upgrade's visual changes are intentional → bump baseline to capture them) or REVERT (the upgrade is incompatible → rollback its commits). After all 6 cluster sub-tickets close, main's VRT is stable: every visual change is either documented-and-accepted or eliminated.

## 5. Architecture Context

- **Meta-coordinator scope**: this plan, the per-sub-ticket lifecycle template, and the ACCEPT/REVERT decision tree.
- **Per-sub-ticket scope**: each cluster gets its own `_frontend` plan + verify + record under `Sprint 14` (or successor sprints if pacing extends).
- **Tooling**: `visual-regression.yml` workflow_dispatch (for ACCEPT path: re-capture baseline against main), `gh pr revert` or manual `git revert` (for REVERT path).
- **Documentation**: each cluster's decision logged in `workflow-standards.mdc` (extending §13.4.5 or a new §13.5 audit-log section — to be decided in C1 sub-ticket).
- **Branching**: each sub-ticket creates its own `feature/SCRUM-XXX-frontend` branch from latest `main`. No rescue branch involvement (rescue branch stays preserved as historical reference).

## 6. Implementation Steps

### Step 0: Validate cluster split (this plan = validation)

The 6-cluster split from `/enrich-us` is validated by:
- 9 framework upgrade commits inventoried — none missed
- Risk gradient (LOW → HIGHEST) gives natural ordering
- Each cluster has bounded scope (1-4 commits)
- Inter-cluster dependencies acknowledged (Tailwind 4 applied AFTER TS 6, so reverting C2 in isolation may be infeasible if C6 introduced TS6-specific code — sub-ticket plans must check)

**No changes** to the cluster split proposed in `/enrich-us`. Proceed.

### Step 1: Define per-sub-ticket lifecycle template (ACCEPT/REVERT decision tree)

For each cluster sub-ticket, the lifecycle adds an explicit decision step in `/verify`:

#### Decision tree (run during sub-ticket `/develop` + finalize at `/verify`)

```
For each cluster:
  1. Identify the cluster's commits (from inventory).
  2. Run UI smoke against current main (cluster commits applied).
     Note: rescue branch is comparison reference, not running target.
  3. Capture cluster-specific visual diff:
     - Take Playwright screenshot of affected routes on current main
     - Compare against current baseline (which was captured from rescue tag)
     - The diff IS the cluster's visual impact
  4. Triage diff:
     a. NO visual diff (e.g. C1 Dev tooling, C4 deps that don't ship to bundle)
        → DECISION = ACCEPT-NO-OP (no baseline bump needed; document rationale)
     b. SMALL/intentional visual diff (e.g. C2 TS, C3 icon renames if mapped 1:1)
        → DECISION = ACCEPT (bump baseline via workflow_dispatch
          baseline_ref=<current-main-sha>; document in playbook)
     c. LARGE/intentional diff but design team approves (e.g. C5 React 19
        rendering, C6 Tailwind 4 padding intentional)
        → DECISION = ACCEPT (same as above; flag for /update-docs that this
          was a deliberate accept of significant visual change)
     d. UNINTENTIONAL diff (regression / broken layout / functional break)
        → DECISION = REVERT (git revert the cluster's commit(s); open
          revert PR with full SCRUM-380 playbook treatment; downstream
          sub-tickets check whether reverted dependencies block them)
     e. MIXED (some routes accept, some revert)
        → SPLIT cluster into sub-clusters; create new sub-tickets;
          document split in this cluster's record
```

#### Pre-flight per sub-ticket
- Verify current `main` state (commits, baseline PNGs SHA)
- Verify sub-ticket's commits are still in main's history (none reverted by prior cluster)
- Verify dependency on prior clusters (e.g. C6 may depend on C2 TS6 syntax)

#### ACCEPT path implementation
1. Branch `feature/SCRUM-XXX-frontend` from main
2. (Optional) Make any UI fixes needed to make the cluster's render visually correct (if minor)
3. Trigger `gh workflow run visual-regression.yml --ref main --field capture_baseline=true --field baseline_ref=<current-main-sha-or-branch> --field package=<both|dashboard|satellite>`
4. Workflow auto-commits new baselines to main with `[skip ci]`
5. Verify PR comparison passes for a no-op test PR (proves new baseline is operational)
6. Document decision in playbook §13.4.5 (or new §13.5)

#### REVERT path implementation
1. Branch `feature/SCRUM-XXX-revert-<short>` from main
2. `git revert <cluster-commit-1> <cluster-commit-2> ...` (or single squash commit's revert)
3. Run full SCRUM-380 playbook for the revert: a revert IS a major change in the same way the upgrade was, requires VRT/a11y/console gates green
4. Open PR with `[REVERT]` prefix in title for visibility
5. After merge, no baseline change needed (current main render now matches old baseline)
6. Document decision in playbook with revert rationale + impact on downstream clusters

### Step 2: Create first sub-ticket — C1 Dev tooling

After this plan is approved (in `/develop` SCRUM-387), create the C1 sub-ticket:

- **Title**: "[SCRUM-387 C1] Audit cascade upgrades — Dev tooling cluster"
- **Issue type**: Task
- **Sprint**: 14 (active)
- **Parent**: SCRUM-387 (this ticket)
- **Description**: cluster commits (SCRUM-374 Jest, SCRUM-376 @types/node, SCRUM-372 ESLint api, SCRUM-377 react-hooks), expected outcome (likely all ACCEPT-NO-OP — none ships to dashboard bundle), per-sub-ticket lifecycle template reference, decision tree reference

The C1 sub-ticket then runs its own `/enrich-us → ... → /update-docs` cycle. SCRUM-387's `/develop` waits on C1 closure before opening C2.

### Step 3: Coordinate sequential sub-tickets (C2 → C6)

After C1 closes:
1. Read C1's record to capture lessons learned
2. Update SCRUM-387's status (this ticket's record will accumulate cross-cluster lessons)
3. Open C2 sub-ticket using same template
4. Repeat through C6

If at any cluster the decision = REVERT and the revert blocks downstream clusters (e.g. reverting C2 TS6 makes C5/C6 commits non-applicable), pause and re-plan SCRUM-387 with updated cluster contents.

### Step 4: Final closure (after C6 closes)

When all 6 sub-tickets are Done:
1. Verify SCRUM-387's epic-level ACs (Section 8 below) all PASS
2. Run a no-op test PR to confirm main's VRT is stable
3. Generate SCRUM-387's record summarizing the 6-cluster campaign
4. Transition SCRUM-387 to Done
5. Verify SCRUM-383 epic ACs all PASS (per the epic description)
6. Transition SCRUM-383 to Done
7. Cleanup: rescue branch `rescue/visual-baseline` can be archived (kept on origin as historical reference; not deleted)

## 7. Implementation Order

```
C1 Dev tooling          [LOW]      → first (validate playbook)
   ↓
C2 TypeScript           [LOW-MED]  → second (foundation for C5+C6)
   ↓
C4 Dependency security  [LOW]      → third (gets deps audit out of the way)
   ↓
C3 Icons                [MED]      → fourth (icon renames may interact with C5)
   ↓
C5 React/Next           [HIGH]     → fifth (largest framework jump, full sprint)
   ↓
C6 Tailwind             [HIGHEST]  → sixth (visual heavyweight, full sprint + canary)
```

Rationale: low-to-high risk + dependency order. C2 (TS) before C5/C6 because they may have TS6-specific syntax. C4 (deps) before C3 (icons) because some Dependabot bumps may affect icon library compat. C3 before C5 because lucide icons used throughout dashboard are surfaced in React 19 components.

## 8. Acceptance Criteria (epic-level)

| AC | Description |
|----|-------------|
| AC1 | 6 sub-tickets created (C1-C6), each with parent=SCRUM-387, sprint=14 (or successor) |
| AC2 | Each sub-ticket completes its full lifecycle and is transitioned to Done |
| AC3 | Each cluster's decision (ACCEPT-NO-OP / ACCEPT / REVERT / SPLIT) is documented in playbook §13.4.5 (or new §13.5) with date + rationale |
| AC4 | After all 6 close, a no-op test PR against main passes VRT cleanly (no R8 drift remaining) |
| AC5 | SCRUM-387's record file consolidates cross-cluster lessons learned for future framework cascades |
| AC6 | SCRUM-383 epic transitions to Done after SCRUM-387 closes |

## 9. Risks (epic-level)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | C6 Tailwind requires partial revert | HIGH | Allocate full sprint + canary; if needed, split C6 into sub-clusters by route |
| R2 | C5 React 19 reveals additional fixes (like fda0b94 nonce) | MED | Each fix shipped as a sub-PR within C5; record each as deviation |
| R3 | Cluster ordering breaks dependencies | MED | Pre-flight check at each sub-ticket's plan; if blocked, escalate to SCRUM-387 plan revision |
| R4 | Pacing fatigue (6 clusters, multiple sprints) | LOW | One-at-a-time discipline (precedent: Part B); user can pause between clusters |
| R5 | Sub-ticket scope creep — cluster grows mid-flight | LOW | Sub-ticket /verify enforces plan compliance; drift caught early |
| R6 | New cascade introduced during SCRUM-387 (someone merges another major upgrade) | LOW | Communicate freeze to team: no major bumps until SCRUM-387 closes; SCRUM-380 §13.4 + §13.4.4 immovability rule support |

## 10-14. (Backend / module / satellite-specific sections)

N/A at this meta level. Each sub-ticket addresses these in its own plan.

## 15. Module-Level Planning

N/A — coordination only.

## 16. Satellite App Planning

N/A — coordination only. Satellite affected by C5+C6 specifically; addressed in those sub-tickets.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 cluster split validated (no commits missed, no clusters merged)
- [ ] Step 1 ACCEPT/REVERT decision tree documented and accessible to sub-ticket plans
- [ ] Step 2 C1 Dev tooling sub-ticket created in Jira (Sprint 14, parent=SCRUM-387)
- [ ] Step 3 sub-ticket protocol enforced (one-at-a-time, no parallel)
- [ ] Step 4 final closure procedure documented
- [ ] Implementation Order documented with dependency rationale
- [ ] Acceptance criteria epic-level visible
- [ ] No deviations OR all classified per workflow-standards §8

## Out of scope for this plan

- Sub-ticket detailed plans (each cluster has its own /plan invocation)
- Actual ACCEPT/REVERT decisions (each sub-ticket's /verify)
- Tag policy revisions (SCRUM-384 §13.4 already final)
- Pre-existing tech debt (SCRUM-388 hook gap, SCRUM-389 dashboard tests)
