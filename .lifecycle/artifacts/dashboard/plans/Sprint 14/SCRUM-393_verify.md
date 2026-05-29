# Verification Report: SCRUM-393 [SCRUM-387 C4] Audit cascade upgrades — Dependency security cluster

**Date**: 2026-05-10
**Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_frontend.md`
**Branch**: `feature/SCRUM-393-frontend` (ai-specs repo)
**Verdict**: **PASS**

> **Scope adaptation note**: SCRUM-393 is the third audit-decision sub-ticket of the SCRUM-387 cascade-audit campaign. Single-commit-in-scope (`79059ea`) decomposed into 4 facets. **Two firsts** for the campaign: (1) explicit out-of-scope determination for `ffc3418` SCRUM-370 (per AC3); (2) residuals handoff to C5 cluster (per AC6) without spawning a new ticket. The deliverable is one populated row in §13.5.2 + the rationale captured in this verify report.

## Plan Compliance

| Step | Description | Status | Deviation Category | Notes |
|------|-------------|--------|-------------------|-------|
| 0 | Create `feature/SCRUM-393-frontend` branch in ai-specs | DONE | — | Branch confirmed via `git branch --show-current` |
| 1 | Per-facet `git show` evidence (4 facets) | DONE | — | All 4 facets independently confirmed; methodology default applied without AskUserQuestion (codified in C1+C2 lessons) |
| 2 | Append C4 stub row to §13.5.2 | DONE | — | +1 line; existing 5 rows (4 C1 + 1 C2) untouched |
| 3 | Stage 2 ai-specs files (no commit) | DONE | — | Per /develop spec point 10 |
| 4 | Confirm em-ecosystem-code clean (NO-OP) | DONE | — | Working tree state of em-ecosystem-code unchanged from pre-/develop. Concurrent agent's `nexacore-dashboard/tsconfig.json` modification pre-existed |
| 4-alt | Surprise paths | N/A | — | All 4 facets reconciled to NO-OP — no REVERT/SPLIT/ACCEPT-visual triggered |
| 5 | Doc-drift sweep | DONE | — | Only `workflow-standards.mdc` touched |

**Plan compliance: 6/6 steps complete (0 deviations).**

## Deviations

**None.** Second consecutive cluster sub-ticket with zero deviations (SCRUM-391 was first). Methodology now firmly established as default — no longer subject to per-cluster Accepted-Quality classification.

## Substantive Judgment: Cluster Decision

Per parent SCRUM-387 plan §6 Step 1 decision tree applied to commit `79059ea` across 4 facets:

| # | Facet | Evidence (from /develop git show) | Bundle reach | Per-facet verdict |
|---|-------|----------------------------------|--------------|-------------------|
| 1 | api version bumps | 5 direct: `@nestjs/common` `^11.1.17→^11.1.19`, `@nestjs/core` same, `@nestjs/platform-express` same, `@nestjs/testing` same, `@nestjs/config` `^4.0.3→^4.0.4`, `@nestjs/swagger` `^11.2.6→^11.4.2` (closes lodash + path-to-regexp transitive vulns), `@nestjs-modules/mailer` `^2.0.2→^2.3.4`, `nodemailer` `^8.0.1→^8.0.7` (closes SMTP CRLF injection) | Backend api runtime — minor patch versions, no API surface change | NO-OP |
| 2 | api overrides (security) | 7 new/tightened: `lodash ≥4.17.24` (closes Code Injection via `_.template`), `flatted ≥3.4.2` (Prototype Pollution), `liquidjs ≥10.25.7` (path traversal), `picomatch ≥4.0.4` (Method Injection in POSIX), `path-to-regexp ≥8.4.0` (DoS / ReDoS), `brace-expansion ≥2.0.3 <3` (process hang / memory exhaustion), `nodemailer ^8.0.7` | Backend api runtime via transitive dep tree | NO-OP |
| 3 | `mail.module.ts` 1-line path swap | `import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'` → `from '@nestjs-modules/mailer/adapters/handlebars.adapter'`. Forced by mailer 2.3.4 dropping the deep `/dist/` export. Same `HandlebarsAdapter` class via canonical path; class identity preserved | Backend api runtime — wrapper-equivalent (different import path, same exported class) | NO-OP |
| 4 | dashboard package + overrides (post-revert net) | `eslint-config-next 14.2.21→^14.2.35` (dev only, lint-time) + `flatted ≥3.4.2` + `picomatch ≥4.0.4` overrides. NOTE: `glob` + `minimatch` overrides included initially then REVERTED in same commit due to incompat with `jest 29` `babel-plugin-istanbul` instrumentation (per commit body) | NONE for browser bundle (eslint is build-time; the 2 retained overrides don't change emitted JS unless they pull a different runtime version of a runtime dep — neither flatted nor picomatch is a dashboard runtime dep) | NO-OP |

**Aggregate decision**: ACCEPT-NO-OP. C4 cluster fully adjudicated.

The §13.5.2 row was filled in `workflow-standards.mdc` with full per-facet rationale, plus explicit mentions of ffc3418 out-of-scope determination and residuals handoff to C5.

### Confidence assessment

**HIGH** — slightly below C2 (HIGHER) because Facet 3 ships 1 line to backend `src/`, similar to C1's `ab101f3` wrapper nuance. However, `HandlebarsAdapter` class identity preservation makes the runtime behavior identical: both import paths re-export the same class constructor with the same exports map. PR #260 CI confirmed this (api 1052/1052 tests pass; mail-related tests would have surfaced any regression at merge time).

## AC3 — `ffc3418` Out-of-Scope Determination

Per plan AC3 + §6.1, `ffc3418` (SCRUM-370 pre-push CI parity + Layer 2 fail-fast=false) is **explicitly out of cascade-audit scope**.

**Evidence** (verified during /enrich-us via `git show --stat ffc3418`):

- 2 files modified: `.github/workflows/security.yml` and `.husky/pre-push`
- Both are CI/dev-tooling artifacts that **never ship to production**
- No version bump; no framework change; no application code modification
- Pre-push hook now runs `npm ci` + `eslint` + `next lint` + `npm run build` + `npm run test:cov` (mirrors CI Layer 2-5)
- `security.yml` Layer 2 changed to `fail-fast=false`

**Reconciliation with parent §6 Step 0 inventory**:

The parent plan said "9 framework upgrade commits". My initial cascade inventory listed 10 (including SCRUM-370). Excluding `ffc3418` brings the count to 9, matching the parent. The grep `SCRUM-(36[2-9]|37[0-9])` from parent §6 Step 0 catches SCRUM-370 by ticket number, but the plan author's "framework upgrade" qualifier excludes pure CI/hook commits. **My initial inventory was off by one due to over-inclusive grep; this verify resolves the discrepancy.**

**Decision**: `ffc3418` left in main as-is. No cascade-audit decision needed. No §13.5 row required for it. First explicit out-of-scope determination of the campaign — pattern documented for future cascades that may include similar CI/hook commits (e.g., if a subsequent rescue-and-reopen campaign happens).

## AC6 — Residuals Handoff to C5

Per plan AC6 + §6.2, the dashboard residual vulns from `79059ea` are **bound to C5** (SCRUM-364 Next 14→16 cluster — to be created):

| Vuln | Severity | Source | Resolution path | Status here |
|------|----------|--------|-----------------|-------------|
| `next` direct (Image Optimizer DoS + 4 CVEs in 14.x) | HIGH | dashboard direct dep | Next 15+ — covered by C5 (SCRUM-364 commit `6bdd387`) | **Documented; not acted on by C4** |
| `postcss` transitive | MODERATE | dashboard transitive via Next | Next 16+ — covered by C5 | **Documented; not acted on by C4** |
| `glob` transitive | (false positive) | dashboard transitive via Next ESLint plugin | Compensating control: glob CLI is NEVER invoked in scripts/CI; library-API consumers (test-exclude, etc.) NOT exploitable | **Documented as known false-positive; permanent compensating control** |

**Why no Deferred ticket created** (unlike C2's SCRUM-392): the residuals are bound to an existing planned cluster (C5/SCRUM-364), not a standalone tech debt. Creating a separate ticket would duplicate the C5 scope. C5's plan will inherit this list as part of its baseline-state evidence.

**First explicit residuals handoff** of the campaign. Pattern documented for future clusters that surface vuln residuals dependent on a subsequent cluster's resolution.

## Code Quality Checks

| Check | Result | Details |
|-------|--------|---------|
| **4a New files with tests** | N/A | No source code created. The audited commit's own evidence is in `ai-specs/changes/auth/audit/audit-2026-05-06T22-44/` (concurrent — not staged). |
| **4b Security patterns (backend)** | N/A | No backend source code changed by this audit ticket. |
| **4c Build / tests** | N/A for ai-specs | Markdown-only. Verified §13.5.2 table now has 6 rows (4 C1 + 1 C2 + 1 C4). |
| **4d Integration state** | N/A | No module / guard / service / DI / permission changes. |
| **4e Regression — blast radius** | OK | 4 ai-specs files in plan blast radius; 0 em-ecosystem-code files. Below the >5 file flag. |
| **4e Regression — mocks / API / schema / exports** | N/A | No `.spec.ts`, no endpoints, no Prisma, no module exports affected. |

## Audit Finding Resolution

**Not applicable** — SCRUM-393 is a decision ticket, not an audit-fix-instances ticket.

The substantive audit deliverable is the **§13.5.2 C4 row** (committed via /commit) + the **/verify report's AC3 out-of-scope determination** for `ffc3418` + the **AC6 residuals handoff** to C5.

## Recurrence Prevention

| Prevention Mechanism | Type | Status |
|---------------------|------|--------|
| §13.5.2 audit log entry | Documentation | **IMPLEMENTED** (C4 row appended; 6 cluster decisions documented to date — 4 C1 + 1 C2 + 1 C4) |
| Per-commit inspection methodology | Process | **CODIFIED** as default (2nd consecutive 0-deviation cluster) |
| Out-of-scope determination pattern | Process | **NEW — IMPLEMENTED** (first instance: ffc3418) |
| Residuals handoff pattern | Process | **NEW — IMPLEMENTED** (first instance: next + postcss → C5) |
| Pre-push hook (closes the dep-drift gap that motivated SCRUM-362) | Automation | **ALREADY ACTIVE** on main since `ffc3418` merged (out-of-scope here but the same mechanism prevents future deps drift from reaching CI) |

## Accepted-Risk Items

None.

## Tech Debt Tickets Created

**None at /verify.** Unlike C2 which spawned SCRUM-392 (Deferred ticket for `baseUrl`→`paths`), C4's residuals are bound to an existing planned cluster (C5/SCRUM-364) — no new ticket needed.

## Files Staged for /commit

```
ai-specs/specs/workflow-standards.mdc                            +1 line  (C4 row in §13.5.2)
ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_frontend.md +239 lines  (NEW — plan)
ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_verify.md   +N lines (NEW — this file, to be staged)
```

Untracked (concurrent agent — left untouched per `feedback_concurrent_agents.md`):
```
ai-specs/changes/auth/audit/audit-2026-05-06T22-44/
ai-specs/changes/auth/plans/Sprint 14/SCRUM-354_backend.md
ai-specs/changes/auth/plans/Sprint 14/SCRUM-354_verify.md
```

## Verification Result

```
## Verification Result: PASS

### Plan Compliance: 6/6 steps complete

### Deviations: 0 found
- (Second consecutive cluster sub-ticket with zero deviations.)

### Code Quality Checks
- N/A across the board (docs-only ticket)

### Regression Checks
- Blast radius: 4 ai-specs files (within scope)
- 0 em-ecosystem-code impact
- §13.5 + §13.5.1 prose untouched; existing 5 rows untouched

### Substantive Judgment
- 1× ACCEPT-NO-OP for C4 commit 79059ea (4 facets all reconcile to NO-OP)
- HIGH confidence (slightly below C2's HIGHER due to Facet 3's 1-line backend src
  change, mitigated by class identity preservation)
- AC3 out-of-scope determination for ffc3418 — first in campaign
- AC6 residuals handoff to C5 (next + postcss + glob false-positive) — first
  in campaign
- No new Jira ticket created at /verify (C4 doesn't spawn Deferred unlike C2)

### Action required:
- Stage this verify.md file
- Run /commit SCRUM-393 to push the branch and open the PR against ai-specs main
- After /commit, run /update-docs to (1) write record file, (2) replace SCRUM-387
  C4 placeholder with closure summary + lessons for C3 (Icons — 4th per parent §7),
  (3) commit + push to ai-specs main, (4) add Jira comment to SCRUM-393
```
