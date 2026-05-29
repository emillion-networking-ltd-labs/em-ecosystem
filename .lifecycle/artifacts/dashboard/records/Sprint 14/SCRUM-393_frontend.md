# Implementation Record: SCRUM-393 [SCRUM-387 C4] Audit cascade upgrades — Dependency security cluster

## 2. Summary

Third closed sub-ticket of the SCRUM-387 cascade-audit campaign. Adjudicated commit `79059ea` (SCRUM-362 Curated deps PR — closed 14 of 16 high-severity npm audit vulns). Single commit decomposed into **4 facets**, all reconcile to **ACCEPT-NO-OP**. **Two firsts** for the campaign: (1) explicit out-of-scope determination for `ffc3418` SCRUM-370 (pure CI/dev tooling, not a framework upgrade); (2) residuals handoff to C5 cluster without spawning a new Jira ticket (residuals bound to an existing planned cluster, not standalone tech debt).

- **Scope**: frontend (docs-only on ai-specs; no em-ecosystem-code change)
- **Branch**: `feature/SCRUM-393-frontend` (in ai-specs; merged + deleted)
- **Implementation date**: 2026-05-10
- **Lifecycle elapsed**: same-day (~75 minutes wall-clock — slightly longer than C2's 45 min due to ADF mark-conflict bug discovered+fixed in /enrich-us script and longer commit body needed for the two firsts)

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_verify.md` (verdict: **PASS**)
- **Plan was followed**: Yes — 6/6 plan steps complete, **0 deviations** (2nd consecutive 0-deviation cluster). The new patterns (out-of-scope determination + residuals handoff) were explicit AC items in the plan, not deviations.

## 4. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `9b30e7e` | ai-specs | main (squash from `feature/SCRUM-393-frontend`) | SCRUM-393: C4 Dependency security cluster — 1× ACCEPT-NO-OP + §13.5.2 row (PR #3) |
| (pending) | ai-specs | main (direct) | docs(SCRUM-393): record + lessons-learned for C3 (Icons next per parent §7) |

No em-ecosystem-code commits — docs-only adaptation per parent precedent.

## 5. Deviations from Plan

**Implementation followed the plan exactly. 0 deviations.**

| # | Step | Planned | Actual | Notes |
|---|------|---------|--------|-------|
| — | — | — | — | Second consecutive cluster sub-ticket with zero classified deviations. Methodology (per-commit `git show --stat`) is firmly established as default. Two new patterns (out-of-scope determination, residuals handoff) shipped as explicit AC deliverables, not as deviations. |

The `ffc3418` out-of-scope call and the residuals handoff to C5 are **plan AC deliverables** (AC3 + AC6), executed at /verify and /update-docs. Not deviations.

## 6. Test Results

N/A — docs-only ticket. The audited commit `79059ea`'s own evidence is preserved in PR #260 CI history (api 1052/1052 tests, dashboard 118/118 tests, npm audit `--omit=dev` = 0 vulns in api).

## 7. Bugs Found

### One process bug (in /enrich-us script, not in the cluster being audited)

The `enrich-scrum-393.js` script's first run failed with `INVALID_INPUT` (HTTP 400) from the Jira REST API. Bisection identified the cause: **ADF does not allow combining `code` + `strong` marks on the same text node** (the `code` mark is exclusive). My helper `codeStrong = (s) => t(s, [{ type: 'code' }, { type: 'strong' }])` produced an invalid node.

**Fix**: replaced `codeStrong('ffc3418')` usage with plain `code('ffc3418')` followed by separate text nodes for any emphasis. Mark conflict documented for future enrich-script authors.

**Side effect**: the bisection process (PUT-ing partial payloads to find the bad section) left residue in SCRUM-393's [original] section. Resolved via a one-shot "hard reset" path in the script that hardcodes the createTicket-time original content and rebuilds the description from scratch. After the reset, the [original]/[enhanced] structure is clean.

This is a **bug in the tooling script, not in the audited cluster**. Recommend updating the shared enrich-script template (used by enrich-scrum-359/390/391/393) to include `codeStrong` helper that issues a runtime validation error rather than producing an invalid ADF node — saves future enrichers the bisection time.

### No bugs in the audited cluster

`79059ea` itself is clean: 14/16 high-severity vulns closed, class identity preserved for `HandlebarsAdapter`, no production source diff outside the 1-line backend path swap.

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/specs/workflow-standards.mdc` | Appended C4 row to §13.5.2 Cascade Audit Log (now 6 rows: 4 C1 + 1 C2 + 1 C4). Existing 5 rows untouched. (committed in PR #3 squash `9b30e7e`) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_frontend.md` | NEW (239 lines): plan with 2 new sections (§6.1 out-of-scope determination, §6.2 residuals handoff), 4-facet audit checklist, AC3 + AC6. (committed `9b30e7e`) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-393_verify.md` | NEW (162 lines): verify report — PASS verdict, 6/6 plan compliance, 0 deviations, full AC3 + AC6 documentation. (committed `9b30e7e`) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-393_frontend.md` | NEW: this record. |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` | MODIFIED: replaced "C4 Dependency security — pending" placeholder (line 118) with closure summary + 6 lessons-learned that shape C3 (Icons) plan. |

No `data-model.md` / `api-spec.yml` / `frontend-standards.mdc` / `backend-standards.mdc` / `integration-state.md` / `documentation-standards.mdc` impact.

## 9. Audit Finding Verification

**Not applicable.** SCRUM-393 is an audit-DECISION ticket, not an audit-fix-instances ticket.

The substantive audit deliverable is the **§13.5.2 C4 row** (committed `9b30e7e`), which now includes explicit mentions of `ffc3418` out-of-scope status and residuals handoff to C5 — preserving traceability for future audits.

## 10. Lessons Learned

### What went well

- **Methodology firmly established.** 2nd consecutive 0-deviation cluster. The per-commit `git show --stat` pattern is now the default with no per-cluster Accepted-Quality classification needed.
- **Out-of-scope determination pattern works.** Cleanly excluded `ffc3418` with a 1-paragraph rationale in /verify report. Reconciled the campaign's commit count from 10 (my over-inclusive grep) back to 9 (parent §6 Step 0 inventory). This is the kind of bookkeeping clean-up that makes subsequent audits trustworthy.
- **Residuals handoff without new ticket.** First time the campaign passes vulns from one cluster to another without spawning a new Jira ticket — because the receiving cluster (C5/SCRUM-364) is already a planned subject of cascade audit. Saves ticket clutter while preserving traceability.
- **Bisection workflow caught an ADF bug.** When `enrich-scrum-393.js` failed with opaque `INVALID_INPUT`, bisection (PUT successive halves of the payload) localized the failure to a specific bullet item with a `code+strong` mark combination. Fix took ~10 minutes once root cause was identified.

### What was harder than expected

- **The ADF mark-conflict bug** added ~30 minutes to /enrich-us. Worth codifying: `code` mark is exclusive in ADF — can't combine with `strong`/`em`/`underline`. Future enrich-script authors should add a runtime check.
- **The bisection residue cleanup** (hard-reset path in the script) was an unexpected micro-tax. The lesson: when bisecting via partial PUTs, make the next full-script run smart enough to reset the entire description, not just merge new content over residue.

### Recommendations for C3 (Icons cluster — `872febb` SCRUM-375 lucide-react 0→1)

C3 is **substantively different** from C1, C2, and C4:

1. **Icons DO ship to the browser bundle**, unlike all 3 prior clusters. lucide-react components render visible UI. Bundle-reach analysis ALONE is INSUFFICIENT for NO-OP — a fresh VRT diff IS required.
2. **lucide v1 introduced systematic icon renames.** Plan must grep `lucide-react` imports across dashboard + satellite, verify each icon name still resolves in v1. If any rename forces a code change, that's source-shipping (similar to C1's `ab101f3`).
3. **Decision will likely be ACCEPT (not NO-OP)** if any icon visual differs from baseline. Per parent §6 Step 1.4.b, ACCEPT triggers `visual-regression.yml workflow_dispatch capture_baseline=true` against current main → adds new baseline PNGs to em-ecosystem-code main via auto-commit `[skip ci]`. This means C3 will be the **first non-NO-OP cluster decision**.
4. **Confidence drops to MEDIUM** for C3 (was HIGH for C4). Plan must explicitly state confidence level.
5. **Use the per-facet model.** Likely C3 facets: (a) lucide-react version bump, (b) icon-rename map (if any renamed), (c) downstream consumers (every dashboard/satellite import), (d) bundle-size delta.
6. **Watch for downstream cluster interaction.** C3 is fourth per parent §7; C5 React 19 (fifth) may interact if any icon usage relies on React 19-specific features. Plan should grep for icon usage in App Router pages.
7. **Use the new patterns proven in C4.** Out-of-scope determination (§6.1 in C4 plan) and residuals handoff (§6.2) are both reusable templates if C3 surfaces similar concerns.

### Recommendations for the cascade-audit campaign as a whole

- **Confidence calibration is now stable.** C1 HIGH-with-caveat → C2 HIGHER → C4 HIGH (slightly below C2 due to Facet 3 nuance). C3 will likely be MEDIUM. C5/C6 will be LOW-MEDIUM. Confidence should appear in every cluster's verify report.
- **§13.5.2 row template is rock-solid.** 6 columns + multi-paragraph rationale handles 4+ facets cleanly. C3-C6 reuse without modification.
- **The out-of-scope and residuals-handoff patterns** make the framework richer. C3-C6 plans can adopt either when applicable.
- **The audit log will reach 8-10 rows total** (4 C1 + 1 C2 + 1 C4 + likely 1+ for C3 + 1-3 for C5 (sub-PRs may surface more) + 1+ for C6). At ~10 rows, consider a summary header at the top of §13.5.2 with the verdict counts — defer that meta-decision to SCRUM-387 closure.
- **Pacing remains single-ticket-at-a-time.** Each cluster's lifecycle (~45-90 minutes for low-risk; will be hours-to-days for high-risk C5/C6) is naturally bounded.

---

## Closure Status

- **SCRUM-393**: lifecycle complete (`/enrich-us` → `/plan` → `/develop` → `/verify` → `/commit` → `/update-docs`). Awaiting user transition to Done per `feedback_no_close_sprints.md`.
- **SCRUM-387**: still in progress; C1 + C2 + C4 closed, C3 next.
- **SCRUM-383 epic**: still in progress.

**Next pickup point**: `/enrich-us SCRUM-3xx` for C3 (Icons cluster — `872febb` SCRUM-375 lucide-react 0→1). C3 sub-ticket to be created when user signals readiness. Confidence will likely be **MEDIUM** (first cluster with real browser-bundle reach).

## 11. Tech Debt Tickets Created (this /update-docs run)

**None.** Unlike C2's /update-docs which created SCRUM-392 (Deferred ticket for `baseUrl`→`paths`), C4's residuals are **bound to an existing planned cluster** (C5/SCRUM-364) — no new ticket needed. The handoff is documented in this record + verify report + §13.5.2 C4 row + SCRUM-387 record's C4 closure section.

This is the **first /update-docs run in the campaign with zero ticket creation**. Pattern: when a cluster's residuals are bound to a planned downstream cluster, no separate ticket is needed.
