# Frontend Implementation Plan: SCRUM-393 [SCRUM-387 C4] Audit cascade upgrades — Dependency security cluster

> **Scope adaptation note**: Audit-decision sub-ticket (precedent: SCRUM-390 C1, SCRUM-391 C2). No feature code is written. **Single commit** `79059ea` (SCRUM-362 Curated deps PR — closed 14 of 16 high-severity npm audit vulns) adjudicated against 4 facets. **Explicit out-of-scope determination** for `ffc3418` (SCRUM-370 pre-push CI parity — pure CI/dev tooling, not a framework upgrade). **Residual high vulns** in dashboard (1 next direct + 1 postcss transitive) NOT addressed here — handed off to C5 (Next 14→16 cluster, SCRUM-364) per AC6. Filed under `dashboard/`, labeled `_frontend` per parent precedent.

## 1. Header

- **Ticket**: SCRUM-393 (Sprint 14, id=477)
- **Parent**: SCRUM-387 (cascade-audit meta-coordinator)
- **Cluster**: C4 — Dependency security (1 commit in-scope, 1 commit explicitly out-of-scope)
- **Issue type**: Subtask
- **Priority**: Medium
- **Predecessors**: SCRUM-390 (C1 closed 2026-05-10, methodology validated), SCRUM-391 (C2 closed 2026-05-10, 0 deviations + first Deferred follow-up SCRUM-392)
- **Successor**: C3 (Icons cluster) — opened after C4 closes per parent §6 Step 3 + §7 (C3 fourth per implementation order)

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed cluster**: SCRUM-391 (C2 TypeScript) — record committed `9732b6f`; PR #2 squash `0d0ccae` shipped §13.5.2 row + plan + verify.
- **Integration state verified**: Yes — no em-ecosystem-code module/guard/service/permission state changes anticipated on the expected (NO-OP) path.
- **Files verified against live state**:
  - `em-ecosystem-code/main` git history — `79059ea` confirmed present; per-commit content read via `git show --stat 79059ea` during /enrich-us. 5 files: api package.json + lock, dashboard package.json + lock, `nexacore-api/src/mail/mail.module.ts` (1-line import path swap from `/dist/adapters/` to `/adapters/` — same `HandlebarsAdapter` class, functionally equivalent).
  - `em-ecosystem-code/main` git history — `ffc3418` confirmed present, content read via `git show --stat ffc3418`. 2 files: `.github/workflows/security.yml` + `.husky/pre-push`. Confirmed pure CI/dev tooling — out of cascade-audit scope.
  - `ai-specs/specs/workflow-standards.mdc` — §13.5.2 has 5 rows on main (4 C1 + 1 C2) per commit `0d0ccae`.
  - `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` — C2 closure section + lessons committed `9732b6f`. C4 section still has "C4 Dependency security — pending" placeholder (verified by grep).
- **Discrepancies with integration-state.md**: None.

## 3. Regression Impact Analysis

**Expected path (1× ACCEPT-NO-OP)** — blast radius:
- `ai-specs/specs/workflow-standards.mdc`: +1 row in §13.5.2 (after 5 existing rows). No structural rewrite.
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_frontend.md`: this file (created by this plan).
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_verify.md`: created at /verify.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-393_frontend.md`: created at /update-docs.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md`: replace "C4 Dependency security — pending" placeholder with closure summary + lessons for C3.
- `em-ecosystem-code`: NO change.
- VRT baseline PNGs: NO change.
- New Jira ticket: NONE in C4 (unlike C2 which spawned SCRUM-392 Deferred). The handoff to C5 is documented in /verify and record, not as a new ticket — C5 is already an existing cluster.
- **Blast radius size**: 4 ai-specs files; 0 em-ecosystem-code files. Below the >5 file flag.

**Surprise paths**:
- ACCEPT (visual diff): not plausible — `79059ea`'s only source change is a 1-line backend import path swap to a functionally identical class. No browser rendering can change.
- REVERT: would unwind 14 high-severity vuln fixes. STRONGLY undesirable. Only triggered if /develop evidence contradicts the commit body's claim of class identity preservation.
- SPLIT: unlikely useful — all 4 facets share the same upstream commit and reconcile to NO-OP.

**Test impact assessment**: NO `.spec.ts` modifications by this audit ticket. (`79059ea` itself ran 1052 api tests + 118 dashboard tests at PR #260 merge time — all PASS per commit body.)

## 4. Overview

C4 is the third cluster sub-ticket of the SCRUM-387 cascade-audit campaign and the third application of the per-commit `git show --stat` methodology codified by SCRUM-390 + SCRUM-391. **In-scope**: single commit `79059ea` adjudicated against 4 facets (api version bumps, api overrides, api source-line path swap, dashboard package + overrides post-revert net). **Out-of-scope**: commit `ffc3418` SCRUM-370 (pre-push CI parity) is documented as not a framework upgrade and excluded from cascade audit — bringing the campaign's framework-upgrade-commit count to **9** (matches parent §6 Step 0 inventory).

The campaign's first explicit handoff: 1 next direct high vuln + 1 postcss transitive moderate are **acknowledged in /verify but NOT acted on here** — they clear when C5 (Next 14→16, SCRUM-364) cluster decision lands. Documented in §6.2 below.

## 5. Architecture Context

- **Touched docs**: `workflow-standards.mdc` (append 1 row to §13.5.2). SCRUM-387 record (replace C4 placeholder).
- **Touched plans/records**: this plan + verify + record under `Sprint 14/`.
- **Touched code (NO-OP path)**: none.
- **Tooling consumed**: `git show` (read-only inspection during /develop).
- **Branching**:
  - Primary: `feature/SCRUM-393-frontend` in **ai-specs**.
  - Conditional: `feature/SCRUM-393-revert-deps` in **em-ecosystem-code** ONLY if any facet → REVERT (strongly unlikely; would unwind 14 vuln fixes).

## 6. Implementation Steps

### Step 0: Create feature branch (in ai-specs repo)

- **Action**: Branch `feature/SCRUM-393-frontend` from `main` of ai-specs. em-ecosystem-code stays untouched on the NO-OP path.
- **Implementation**:
  1. From ai-specs/, ensure on `main` and clean (modulo concurrent-agent untracked files in `auth/audit/audit-2026-05-06T22-44/` and `auth/plans/Sprint 14/SCRUM-354_*` — leave those alone per `feedback_concurrent_agents.md`).
  2. `git checkout -b feature/SCRUM-393-frontend`.

### Step 1: Per-facet audit via git show (read-only)

- **Action**: For commit `79059ea`, run targeted `git show` invocations to capture per-facet evidence. Per SCRUM-391 lessons, no `npm` gate run against compound main.
- **Commands** (run from `em-ecosystem-code/`):
  ```
  git show --stat 79059ea
  git show 79059ea -- nexacore-api/package.json
  git show 79059ea -- nexacore-dashboard/package.json
  git show 79059ea -- nexacore-api/src/mail/mail.module.ts
  ```
- **Per-facet evidence checklist**:
  - **Facet 1 (api version bumps)**: confirm @nestjs/* 11.1.17→11.1.19, @nestjs/swagger 11.2.6→11.4.2, @nestjs-modules/mailer 2.0.2→2.3.4, nodemailer 8.0.1→8.0.7. Bundle-reach: backend api runtime, minor patches.
  - **Facet 2 (api overrides)**: confirm new/tightened overrides for lodash, flatted, liquidjs, picomatch, path-to-regexp, brace-expansion, nodemailer. Bundle-reach: backend api runtime via transitive deps.
  - **Facet 3 (api source: mail.module.ts)**: confirm 1-line import path swap. Bundle-reach: backend api runtime, but `HandlebarsAdapter` class identity preserved (same constructor, same exports — verified by class-name match).
  - **Facet 4 (dashboard package + overrides post-revert)**: confirm eslint-config-next 14.2.21→^14.2.35, new overrides flatted + picomatch (NOT glob/minimatch — those were reverted in same commit due to jest 29 incompat). Bundle-reach: NONE for browser (eslint is build-time; flatted/picomatch don't change emitted JS unless they pull a different runtime version of an already-shipped lib — none touched here).
- **Cross-cluster check**: confirm next + postcss residuals are documented in commit body (Facet 4) and bound to SCRUM-364 (which becomes C5 cluster ticket later). Document residuals in /develop notes for /verify AC6.
- **Fail-fast rule**: if any facet's evidence contradicts the commit body's claim (e.g., a non-trivial dashboard `src/` file diff appears), STOP and escalate to parent §6 Step 1 decision tree.

### Step 2: Append C4 row to §13.5.2 audit log

- **File**: `ai-specs/specs/workflow-standards.mdc`
- **Action**: Append one new row to §13.5.2 (after 5 existing rows: 4 C1 + 1 C2). Do NOT modify existing rows.
- **Stub row** (decision + rationale filled at /verify):
  ```
  | C4      | SCRUM-393  | 2026-05-XX | 79059ea | _to fill_  | _to fill at /verify (Curated deps PR; 4 facets — api bumps / api overrides / mail.module.ts path swap / dashboard package post-revert; ffc3418 SCRUM-370 documented out-of-scope; residuals next+postcss handed to C5)_ |
  ```
- **Notes**: Diff size: 1 line. Existing 5 rows untouched.

### Step 3: Stage ai-specs files (no commit)

- **Action**: `git add` only the 2 files affected. Per `feedback_concurrent_agents.md`, stage by explicit path.
- **Files**:
  - `ai-specs/specs/workflow-standards.mdc` (modified — 1 row appended)
  - `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_frontend.md` (this file, new)
- Per /develop spec point 10: stage only, do NOT commit.

### Step 4: Confirm em-ecosystem-code untouched

- **Action**: `cd em-ecosystem-code && git status` → expect identical state to before /develop began (clean modulo concurrent-agent's `nexacore-dashboard/tsconfig.json` modification, which pre-existed and must not be disturbed).

### Step 4-alt: (Surprise paths only — extremely unlikely for C4)

- **REVERT** (very unlikely): would unwind 14 vuln fixes. Only if `mail.module.ts` change breaks the runtime mail flow despite class identity preservation. If triggered, restore via separate revert PR per SCRUM-380 playbook + careful coordination with security posture.
- **SPLIT** (unlikely): only if one facet's evidence diverges sharply (e.g., `mail.module.ts` change is found NOT functionally equivalent). Would carve `mail.module.ts` into its own sub-ticket.
- **ACCEPT-visual** (impossible): no rendering path; deps + 1-line backend swap don't reach browser.

### Step 5: Doc-drift sweep

- **Action**: Confirm no other docs need update. C4 (NO-OP path) only touches `workflow-standards.mdc` (§13.5.2 row). No `data-model.md` / `api-spec.yml` / `frontend-standards.mdc` / `integration-state.md` impact.

## 6.1 Out-of-Scope Determination for `ffc3418`

Documented as a /verify report deliverable per AC3. Reasoning:

- `ffc3418` (SCRUM-370) modified 2 files: `.github/workflows/security.yml` + `.husky/pre-push`. Pure CI/dev tooling: pre-push hook now runs `npm ci` + `eslint` + `next lint` + `npm run build` + `npm run test:cov` (mirrors CI Layer 2-5), and `security.yml` Layer 2 sets `fail-fast=false`.
- Neither file ships to production. Neither file modifies application code. Neither file changes a framework version.
- Parent §6 Step 0 inventory said "9 framework upgrade commits". Including `ffc3418` would make it 10 — but the plan author's "framework upgrade" qualifier excludes pure CI/hook commits. **Excluding `ffc3418` brings the count to 9, matching the parent inventory.**
- Verdict: explicitly out-of-scope of cascade audit. Documented in /verify report; NOT cascade-adjudicated; left in main as-is (no decision needed because no framework state changed).

This is the **first explicit out-of-scope determination** of the campaign. Pattern documented for future cascades that may include similar CI/hook commits.

## 6.2 Residuals Handoff to C5

Per `79059ea` commit body (Facet 4 dashboard section):

- **1 next DIRECT high vuln** (Image Optimizer DoS + 4 other CVEs in 14.x) — fix requires Next 15+, deferred to **SCRUM-364** (which is the upstream commit `6bdd387` adjudicated by C5 cluster).
- **1 postcss transitive moderate** — same Next-family root cause, same C5 fix.
- **glob transitive false-positive** — CVE is in glob CLI shell:true command injection; library-API consumers (test-exclude etc.) NOT exploitable. We don't invoke `glob` CLI anywhere. Compensating control: glob CLI is not invoked. Not C4's scope; documented in /verify rationale; reviewable by C5 as a pre-existing residual.

C4 documents these in /verify per AC6 — does NOT create new tickets, does NOT act on the residuals, does NOT modify em-ecosystem-code. C5 inherits the responsibility because SCRUM-364 (Next 14→16) is the cure for items 1+2.

## 7. Implementation Order

```
Step 0  Create feature/SCRUM-393-frontend branch in ai-specs
Step 1  Per-facet git show evidence (4 facets) for 79059ea
Step 2  Append C4 stub row to §13.5.2 (1 line)
Step 3  Stage 2 ai-specs files (no commit per /develop spec point 10)
Step 4  Confirm em-ecosystem-code working tree unchanged
        — Step 4-alt only on REVERT/SPLIT/ACCEPT-visual surprises (very unlikely)
Step 5  Doc-drift sweep (NO-OP confirms no other doc impact)
```

## 8. Testing Checklist

- [ ] `git show --stat 79059ea` confirms 5 files: 4 package + 1 source.
- [ ] `mail.module.ts` change verified as 1-line import path swap (`@nestjs-modules/mailer/dist/adapters/handlebars.adapter` → `@nestjs-modules/mailer/adapters/handlebars.adapter`).
- [ ] api package.json: 5 direct version bumps + 7 overrides confirmed.
- [ ] dashboard package.json: 1 direct bump (eslint-config-next) + 2 overrides (flatted, picomatch) confirmed (NOT glob/minimatch).
- [ ] §13.5.2 row appended without modifying existing 5 rows.
- [ ] `SCRUM-393_frontend.md` (this file) tracked by git on the new branch.
- [ ] No file changes in `em-ecosystem-code`.
- [ ] `ffc3418` confirmed not in any cluster's adjudication scope (out-of-scope rationale captured in /verify).
- [ ] Residuals handoff to C5 documented in /verify per AC6.

**Regression test checklist**: N/A.

## 9. Error Handling Patterns

N/A. Read-only audit.

If a facet contradicts the commit body's claim of class identity preservation (Facet 3) or vuln-free production deps (Facets 1-2), escalate immediately — do not silently proceed.

## 10. UI/UX Considerations

N/A — docs-only ticket.

## 11. Dependencies

- Repo access: ai-specs (write), em-ecosystem-code (read-only).
- Tools: `git`, Node 22 (for the Jira MCP if any new ticket creation needed at /update-docs — unlikely, since C4 doesn't spawn Deferred follow-ups).
- External services: Jira MCP (running locally).

## 12. Notes

- **Documentation language**: English.
- **Local-only develop**: per `feedback_local_first_before_push.md`.
- **Concurrent-agents discipline**: per `feedback_concurrent_agents.md`. Stage by explicit path.
- **Plan immutability after develop start**: per `workflow-standards.mdc` §10.
- **Methodology default**: per-commit `git show --stat` (codified in C1 + C2 lessons-learned).
- **First out-of-scope determination of the campaign**: `ffc3418` excluded with rationale. Pattern documented for future cascades.
- **First explicit residuals handoff**: 2 vulns + 1 false-positive bound to C5; C4 documents but does not act.

## 13. Next Steps After Implementation

- /verify reads §13.5.2 stub row, fills decision + rationale, runs plan compliance, classifies any deviations (expected 0 — same as C2).
- /commit opens PR against ai-specs main, squash-merges, deletes feature branch, lands the §13.5.2 row + plan + verify on main.
- /update-docs:
  1. Writes record file `SCRUM-393_frontend.md`.
  2. Replaces "C4 Dependency security — pending" placeholder in SCRUM-387 record with closure summary + lessons for C3 (Icons — fourth per parent §7).
  3. **No Deferred ticket creation** (unlike C2's SCRUM-392) — residuals are bound to C5, not standalone tickets.
  4. Commits + pushes ai-specs changes.
  5. Adds Jira comment to SCRUM-393.
- C3 sub-ticket created only after C4 closes, per parent §6 Step 3 + §7 (C3 fourth — note: C3 is NOT next sequentially, parent §7 explicitly orders C4 third + C3 fourth so deps audit is "out of the way" before icon visual work).

## 14. Implementation Verification

Final verification checklist (run at /verify):

- **Code Quality**: §13.5.2 row matches column layout; markdown lints cleanly.
- **Functionality**: §13.5.2 table parses; new row between C2 (existing) and end-of-section.
- **Testing**: per Step 1 evidence — all 4 facets independently confirmed NO-OP; `mail.module.ts` class identity preserved.
- **Regression**: §13.5 + §13.5.1 prose untouched; existing 5 rows untouched.
- **Integration**: §13.5.2 row references parent SCRUM-387 + child SCRUM-393.
- **Documentation updates completed**: workflow-standards.mdc + SCRUM-393 plan/verify staged at /develop; record + SCRUM-387 placeholder replacement at /update-docs.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 branch `feature/SCRUM-393-frontend` exists on ai-specs.
- [ ] Step 1 per-facet `git show` evidence captured for all 4 facets.
- [ ] Step 2 §13.5.2 stub row appended (existing 5 rows untouched).
- [ ] §13.5.2 stub row populated (decision + rationale filled) by /verify.
- [ ] AC3 out-of-scope rationale for `ffc3418` documented in /verify report.
- [ ] AC6 residuals handoff to C5 documented in /verify report.
- [ ] Step 3 stage state confirmed (2 files staged, no commit).
- [ ] Step 4 em-ecosystem-code clean (NO-OP) OR Step 4-alt fires.
- [ ] Step 5 doc-drift sweep returns "no other docs affected".
- [ ] No deviations OR all classified per `workflow-standards.mdc` §8.

## Out of scope for this plan

- `ffc3418` SCRUM-370 — pure CI/dev tooling, not a framework upgrade. Documented per AC3.
- Residuals (next direct + postcss transitive) — bound to C5/SCRUM-364. Documented per AC6.
- Other clusters C3 (Icons), C5 (React/Next), C6 (Tailwind) — separate sub-tickets.
- Pre-existing tech debt: SCRUM-388, SCRUM-389.
- Any em-ecosystem-code change beyond Step 4-alt's explicit surprise paths.
