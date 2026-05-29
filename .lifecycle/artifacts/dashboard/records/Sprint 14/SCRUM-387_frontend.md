# Implementation Record: SCRUM-387 Reopen Cascade Upgrades Under SCRUM-380 Playbook

> **Status: CAMPAIGN LAUNCHED — record is a stub.** This meta-coordinator ticket stays "in progress" until the 6 cluster sub-tickets close. Cross-cluster lessons learned accumulate here as each cluster cycle completes. The final closure addendum lands when C6 (Tailwind) closes its lifecycle, at which point SCRUM-387 transitions to Done and SCRUM-383 epic Done follows.

## 2. Summary

Launched the cascade-audit campaign. 9 framework upgrades since `v-baseline-2026-05-06-auth-green` are organized into 6 risk-ordered clusters (C1 LOW → C6 HIGHEST). Per-cluster sub-tickets created on-demand via Subtask hierarchy (Task→Task parent rejected by Jira). First cluster sub-ticket SCRUM-390 (C1 Dev tooling) created in Sprint 14 and ready for its own `/enrich-us`. SCRUM-387 itself remains "in progress" through campaign duration.

- **Scope**: meta-coordinator (no em-ecosystem-code source change; ai-specs plan + verify only)
- **Branch**: none — meta-coordinator
- **Implementation date**: 2026-05-10 (campaign launch)
- **Expected closure date**: TBD (after C6 Tailwind closes; 1-2 sprints per high-risk cluster anticipated)

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-387_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-387_verify.md` (verdict: PASS for meta-scope today; campaign-completion ACs PENDING)
- **Plan was followed**: Yes (with 2 lifecycle deviations both Accepted-Trivial)

## 4. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `e9c200d` | ai-specs | main | docs(SCRUM-387): meta-coordinator plan + verify (campaign launched) |
| (pending) | ai-specs | main | docs(SCRUM-387): record stub — this commit |

No em-ecosystem-code commits — meta-coordinator scope.

**Future commits (campaign duration)**:
- 6× cluster lifecycle commits (one per sub-ticket: SCRUM-390 C1 + 5 more)
- Each cluster's record consolidated at this meta-record's "Campaign closure addendum" section (added when C6 closes)
- 0-N baseline auto-commits by `github-actions[bot]` per ACCEPT decision
- 0-N revert PRs per REVERT decision

## 5. Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|------|---------|--------|--------|----------|-----------|
| **D1** | 3, 4 | Sequential coordination + final closure within /develop scope | DEFERRED to campaign duration (multiple sprints). `/develop` today only ran Step 2 (create C1). | Meta-coordinator pattern by design — precedent SCRUM-329 Part B took 2 days for 12 simpler sub-tickets. SCRUM-387's 6 sub-tickets touch code+CI+baseline so each cycle is longer. | **Accepted-Trivial** | — (campaign continues across sprints) |
| **D2** | 2 | Sub-ticket = Task | Sub-ticket = Subtask | Jira API rejected Task→Task parent (memory: Issue type hierarchy rule). Subtask is semantically equivalent for this use case. | **Accepted-Trivial** | C2-C6 will use Subtask from the start |

## 6. Test Results

N/A — meta-coordinator, no code/test changes.

## 7. Bugs Found

None today. Future cluster sub-tickets will report cluster-specific bugs.

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-387_frontend.md` | Plan (committed `e9c200d`) — cluster split + ACCEPT/REVERT decision tree |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-387_verify.md` | Verify report (committed `e9c200d`) — verdict PASS for meta-scope |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` | This record stub (committed in /update-docs phase) |

No spec updates today. The decision about whether to add `§13.5 Audit Log` section to `workflow-standards.mdc` (vs extending §13.4.5) is deferred to SCRUM-390 (C1 sub-ticket) plan, since that ticket will be the first to record an audit decision.

## 9. Audit Finding Verification

N/A — meta-coordinator, not audit remediation.

## 10. Lessons Learned (campaign launch — to be extended)

**Today's lessons**:
- The Jira hierarchy `Epic → Task → Subtask → no further nesting` constrains how meta-tickets are structured. SCRUM-329 Part B's "B1=SCRUM-334 Task" pattern doesn't generalize to deeper trees — when a Task already has a Task parent, its children must be Subtasks. Worth adding to memory's Jira section.
- The cluster split exercise (`/enrich-us`) benefited from running `git log v-baseline..main` first to inventory commits, rather than relying on the original SCRUM-387 description's mention of "5 tickets to reopen". The actual count was 9 framework upgrades across 6 clusters.
- A rescue meta-coordinator's `/develop` is essentially "create the first sub-ticket" — minimal local action. Most of the discipline lives in the plan + verify, not in `/develop`'s execution.

**Cross-cluster lessons (to be filled as clusters close)**:

### C1 Dev tooling (SCRUM-390) — closed 2026-05-10

**Outcome**: 4×ACCEPT-NO-OP. Cluster commits `ab101f3`, `a7b619e`, `4a8d88e`, `e1699ca` all left in place on `main`. Audit log entries written to `workflow-standards.mdc` §13.5.2.

**Code merged**:
- ai-specs PR #1 (squash `320b1bd`): playbook §13.5 stub + 4 decisions + plan + verify report.
- (this commit): SCRUM-390 record + this lessons-learned section.

**Lessons that shape C2's plan** (full detail in `changes/dashboard/records/Sprint 14/SCRUM-390_frontend.md` §10):

1. **Per-commit `git show --stat` is the right Step 1, not compound `npm` gates.** Compound `main` mixes signals from C1+C2-C6, can't isolate any one cluster. Per-commit inspection is read-only, fast (~30 s/commit), bypasses concurrent-agent disturbance, and gives bundle-reach evidence directly. C2 plan should specify this as default, not as deviation. Parent §6 Step 1.4.a already recognizes bundle-reach analysis as the formal NO-OP signal — the language was permissive; C1's experience makes it prescriptive.
2. **Concurrent-agent state is structural.** em-ecosystem-code working tree had unrelated `nexacore-dashboard/tsconfig.json` modification during C1's /develop. Per `feedback_concurrent_agents.md` the right move is to refine methodology, not disturb state. Future clusters should plan defensively: assume working tree may be dirty.
3. **/enrich-us bundle-reach claims need /develop verification.** C1's enriched description said "all dev-only" — `git show --stat` during /develop surfaced that `ab101f3` (Jest) ships a `navigateTo()` wrapper to the browser. Decision held (semantically null per WHATWG HTML §7.7.1.2) but rationale shifted from "doesn't ship" to "ships but behaviorally identical". C2 should not trust /enrich-us bundle-reach claims; verify them at /develop.
4. **§13.5.2 row format works.** 6 columns (Cluster / Sub-ticket / Date / Commit / Decision / Rationale) gave enough room for full reasoning. C2 reuses the same shape.
5. **§13.5.1 immutability rule** preserves audit trail integrity. If a future REVISIT changes a NO-OP to a REVERT, the new row references the old one — old row stays for traceability. Worth restating prominently if/when the first non-NO-OP decision lands.
6. **VRT still required for clusters with browser-bundle reach.** C1's "skip VRT entirely" pattern does NOT generalize to C5/C6. For high-reach clusters, per-commit inspection identifies WHICH commits ship; a targeted VRT against the right baseline tag (not compound main) confirms zero diff. C5+C6 plans must explicitly include a VRT step.
7. **Behavioral-equivalence proofs need spec-class citations.** The `ab101f3` rationale cited WHATWG HTML §7.7.1.2 — that precision is what makes a NO-OP defensible to a future auditor. C2 will likely have similar moments (TypeScript 5→6 may force minor type-narrowing that ships but is behaviorally null); cite the spec.

**Methodology refinement carries to C2**: the Accepted-Quality deviation in SCRUM-390 record is the deliverable, not tech debt. No follow-up Jira ticket needed — C2's own /plan absorbs the lessons directly via this section.

### C2 TypeScript (SCRUM-391) — closed 2026-05-10

**Outcome**: 1×ACCEPT-NO-OP for commit `ee309e6` (TypeScript 5→6, applied across api + dashboard + satellite). 4 distinct facets all reconcile to NO-OP. Higher confidence than C1 — zero production source code shipped (no `ab101f3`-equivalent wrapper).

**Code merged**:
- ai-specs PR #2 (squash `0d0ccae`): §13.5.2 row appended + plan + verify report.
- (this commit): SCRUM-391 record + this lessons-learned section.

**First Deferred follow-up**: ticket created at /update-docs Part 5 — `Switch nexacore-api tsconfig from baseUrl to explicit paths (pre-TS 7 prep)` (Backlog). Triggered by Facet 3 (`ignoreDeprecations: "6.0"` flag added in commit body to suppress TS 6 deprecation warning for `baseUrl`). Pattern documented for C5/C6 if Tailwind 5 / React 20 deprecations surface similarly.

**Lessons that shape C3 (Icons)** (full detail in `changes/dashboard/records/Sprint 14/SCRUM-391_frontend.md` §10):

1. **Methodology default works.** Per-commit `git show --stat` applied without AskUserQuestion; 0 deviations classified. Total /develop time roughly half of C1's. C3 inherits the same default.
2. **C3 is substantively different**: lucide-react icons DO ship to the browser bundle. Bundle-reach analysis ALONE is insufficient for NO-OP — fresh VRT diff IS required. C3's plan must include a VRT step, not skip it.
3. **lucide v1 introduced systematic icon renames.** C3's plan should grep dashboard + satellite for every `lucide-react` import and verify each icon name still resolves in v1. If any rename forces a code change, that's source-shipping (similar to ab101f3 nuance).
4. **Decision likely ACCEPT (not NO-OP)** if any icon visual differs from baseline. Per parent §6 Step 1.4.b, ACCEPT triggers `visual-regression.yml workflow_dispatch capture_baseline=true` + auto-commits new baseline PNGs to em-ecosystem-code main with `[skip ci]`.
5. **Use per-facet model even for single commits.** Likely C3 facets: (a) lucide version bump, (b) icon-rename map, (c) downstream consumers (every dashboard/satellite import), (d) bundle-size delta. Same shape as C1's 4-row matrix and C2's 4-facet table.
6. **Watch downstream cluster interaction.** C3 is third per parent §7 (after C2 TS); C5 React 19 (fifth) may interact if any icon usage relies on React 19-specific features. Pre-flight grep needed.

**Confidence shift**: C1 HIGH → C2 HIGHER → C3 likely **MEDIUM** (visual reach is real). C3 plan should explicitly state its confidence level.

**Methodology refinement carries to C3**: per-facet inspection model + Deferred ticket pattern + §13.5.2 row template all stable. C3 plan reuses without modification.

### C3 Icons (SCRUM-394) — closed 2026-05-10

**Outcome**: 1×ACCEPT-NO-OP for commit `872febb` (lucide-react 0→1, dashboard). 3 facets all reconcile to NO-OP via **visual-fidelity-by-construction** — NEW evidence type for the campaign. **First cluster with real browser-bundle reach** but bounded to 1 icon swap (`Github` only of 64 in use; replaced by faithful local SVG `GitHubIcon.tsx`).

**Code merged**:
- ai-specs PR #4 (squash `1bb0d5d`): §13.5.2 C3 row + plan + verify report.
- (this commit): SCRUM-394 record + this lessons-learned section.

**Forecast→evidence loop validated**: C4 lessons predicted "likely ACCEPT, MEDIUM confidence". /enrich-us evidence (1/64 icons + faithful SVG) revised to "likely NO-OP, HIGH confidence". /verify confirmed. The cascade-audit pipeline correctly self-corrects when /enrich-us evidence contradicts prior forecasts.

**Path A VRT gate executed**: visual-fidelity-by-construction (SVG path canonical octocat + viewBox 24×24 + `currentColor` + 16×16 sizing). Path B (Playwright local) and Path C (workflow_dispatch remote) NOT chosen — Path B because compound-main baseline can't isolate C3 signal; Path C because it's only for ACCEPT decisions.

**No new tech-debt ticket** (same as C4) — clean cluster decision.

**Lessons that shape C5 (React/Next — `6bdd387` SCRUM-364 Next 14→16 + React 18→19)** (full detail in `changes/dashboard/records/Sprint 14/SCRUM-394_frontend.md` §10):

1. **C5 is HIGH RISK per parent §7.** Likely full sprint. Largest framework jump in the cascade.
2. **Real browser-bundle reach with DRAMATIC scope** (vs C3's 1-icon swap). Next 14→16 introduces async APIs (`headers()` / `cookies()` / `params`); React 18→19 changes hooks. Bundle-reach analysis insufficient. **VRT gate genuinely required — likely Path C** (workflow_dispatch).
3. **First likely ACCEPT (with baseline bump)** of the campaign. Triggers `gh workflow run visual-regression.yml --field capture_baseline=true` → auto-commits new PNGs to em-ecosystem-code main with `[skip ci]`.
4. **Sub-PR pattern likely** per parent §9 R2. C5 may surface additional fixes (like fda0b94 nonce). Plan should account for multiple PRs and possibly multi-day timeline.
5. **C5 inherits C4's residuals**: 1 next direct HIGH + 1 postcss transitive MODERATE — both clear when C5 lands. C5 plan should explicitly document this dependency cure.
6. **Confidence drops to MEDIUM** (vs HIGH for C3/C4). Plan must explicitly state confidence.
7. **Per-facet model holds**: likely C5 facets — Next bump, React bump, breaking API migrations, source-shipping fixes (sub-PRs), eslint-config-next bump, bundle-size delta.
8. **Use Path C for VRT baseline bump**. Compound-main problem doesn't apply when C5 is the major change — fresh baseline IS the goal.

**Confidence calibration update**: C1 HIGH-with-caveat → C2 HIGHER → C4 HIGH → C3 HIGH (revised up) → C5 likely **MEDIUM** → C6 likely **LOW-MEDIUM**.

**Pattern accumulation update**: visual-fidelity-by-construction (NEW C3) joins bundle-reach analysis (C1/C2/C4), commit-time CI evidence (all), WHATWG semantic-equivalence (C1), out-of-scope determination (C4), residuals handoff to existing cluster (C4), Deferred ticket creation (C2). C5 will likely add: sub-PR pattern within a cluster, Path C workflow_dispatch baseline bump, possibly intentional visual-diff acceptance.

### C4 Dependency security (SCRUM-393) — closed 2026-05-10

**Outcome**: 1×ACCEPT-NO-OP for commit `79059ea` (SCRUM-362 Curated deps PR — closed 14 of 16 high-severity npm audit vulns). 4 facets all reconcile to NO-OP. **Two firsts** for the campaign delivered cleanly: (1) explicit out-of-scope determination for `ffc3418` SCRUM-370 (pure CI/dev tooling); (2) residuals handoff to C5 without spawning a new Jira ticket.

**Code merged**:
- ai-specs PR #3 (squash `9b30e7e`): §13.5.2 C4 row + plan + verify report.
- (this commit): SCRUM-393 record + this lessons-learned section.

**Reconciliation with parent §6 Step 0**: campaign's framework-upgrade-commit count was off by one in my initial inventory (10 listed; parent said 9). Excluding `ffc3418` brings it to 9 — matches parent. Bookkeeping fix preserved in SCRUM-393 verify report.

**Residuals handed to C5 (SCRUM-364 Next 14→16, to-be-created)**: 1 next direct HIGH (Image Optimizer DoS + 4 CVEs in 14.x) + 1 postcss transitive MODERATE + 1 glob false-positive (compensating control: glob CLI never invoked).

**No new tech-debt ticket** (unlike C2's SCRUM-392). When a cluster's residuals are bound to an existing planned cluster, no separate ticket is needed. **First /update-docs run in the campaign with zero ticket creation.**

**Lessons that shape C3 (Icons — `872febb` SCRUM-375 lucide-react 0→1)** (full detail in `changes/dashboard/records/Sprint 14/SCRUM-393_frontend.md` §10):

1. **C3 is substantively different**: lucide-react icons DO ship to the browser bundle, unlike all 3 prior clusters. Bundle-reach analysis ALONE is insufficient. **Fresh VRT diff IS required.** C3 plan must include a real VRT step.
2. **lucide v1 systematic icon renames**: plan must grep all `lucide-react` imports across dashboard + satellite, verify each icon name still resolves in v1. If any rename forces a code change, that's source-shipping.
3. **Decision likely ACCEPT (not NO-OP)** if any icon visual differs from baseline. Per parent §6 Step 1.4.b, triggers `visual-regression.yml workflow_dispatch capture_baseline=true` → adds new baseline PNGs to em-ecosystem-code main with `[skip ci]`. **First non-NO-OP cluster decision** of the campaign likely lands here.
4. **Confidence drops to MEDIUM** for C3 (was HIGH for C4). Plan must explicitly state confidence level.
5. **Per-facet model still applies**: likely C3 facets — (a) lucide version bump, (b) icon-rename map, (c) downstream consumers (every dashboard/satellite import), (d) bundle-size delta.
6. **Reuse C4's new patterns when applicable**: out-of-scope determination + residuals handoff are now templates available for C3-C6 plans.
7. **Process bug to fix in shared enrich-script template**: `code` mark is exclusive in ADF — can't combine with `strong`/`em`/`underline`. Add a runtime validation helper to prevent future enrich scripts from producing invalid `INVALID_INPUT` payloads.

**Confidence calibration**: C1 HIGH-with-caveat → C2 HIGHER → C4 HIGH → C3 likely **MEDIUM** → C5/C6 likely **LOW-MEDIUM**.

### C5 React/Next (SCRUM-395) — closed 2026-05-10

**Outcome**: 1×ACCEPT-NO-OP for commit `6bdd387` (Next 14.2→16.2.6 + React 18→19.2.6, dashboard + satellite). Largest framework jump of the campaign but smallest production-source delta (1 file, 2 lines: `layout.tsx` async migration). 5 facets all reconcile to NO-OP via **visual-fidelity-by-construction** (VFC reused from C3). **Cures C4 residuals** (1 next direct HIGH + 1 postcss transitive MODERATE eliminated). **Two firsts** for the campaign delivered.

**Code merged**:
- ai-specs PR #5 (squash `fea7b53`): §13.5.2 C5 row + plan + verify report.
- (this commit): SCRUM-395 record + this lessons-learned section.

**Two firsts**:
1. **Sub-PR forecast revised**: parent §9 R2 + C3 lessons predicted multi-PR pattern for C5. /enrich-us evidence: `6bdd387` is sole related commit on main. The cascade-audit pipeline self-corrects when /enrich-us evidence contradicts prior forecasts.
2. **Strategic defer baseline bump to C6**: NEW pattern. When consecutive clusters affect rendering and the next requires a Path C baseline bump, defer the current's bump to consolidate. C5 NO-OP via VFC defends the deferral; C6 will execute the bump at closure.

**Lessons that shape C6 (Tailwind — `939d8b9` SCRUM-373 last cluster)** (full detail in `changes/dashboard/records/Sprint 14/SCRUM-395_frontend.md` §10):

1. **C6 is THE visual heavyweight** — Tailwind 4 shipped the regressions that triggered the SCRUM-383 epic. The whole rescue-and-cascade campaign exists because of this commit.
2. **VFC argument unlikely to apply.** Tailwind 4 changed CSS variable semantics, utility renames, default `outline` behavior. CSS changes DIRECTLY affect rendered output — first-principles fidelity hard to argue.
3. **Decision very likely ACCEPT (with Path C baseline bump)**. This is the bump C5 deferred. Triggers `gh workflow run visual-regression.yml --field capture_baseline=true --field baseline_ref=<current-main-sha> --field package=both`. Auto-commits new baseline PNGs to em-ecosystem-code main with `[skip ci]`.
4. **Confidence drops to LOW-MEDIUM**. Plan must state explicitly. Tailwind 4 cascade effects (cursor:pointer regression, recharts theming, etc.) are KNOWN visual changes — most intentional but require formal capture.
5. **REVERT path possibly triggered** for specific routes if visual diff includes UNINTENTIONAL regressions. Hot-fix `6399bb8 fix: restore cursor:pointer on buttons after Tailwind v4 migration` already addressed one such regression — /enrich-us should grep for similar CSS-state-restoring patterns.
6. **SPLIT path possible** if different routes warrant different decisions. Tailwind 4 blast radius is genuinely broad.
7. **C6 closes the campaign**: post-C6 → SCRUM-387 closes → SCRUM-383 epic closes. Per parent §6 Step 4, a no-op test PR against main should confirm VRT is stable post-baseline-bump.

**Recommendations for SCRUM-387 closure** (when C6 closes):
- §13.5.2 will have 9-12 rows. Consider summary header ("X ACCEPT-NO-OP, Y ACCEPT, Z REVERT") if useful.
- Campaign closure addendum: summarize all cluster decisions + cross-cluster lessons + recommendations for next major-version cascade.
- Patterns inventory: 10-12 named patterns by end. Document in a workflow-standards.mdc subsection or dedicated reference file.
- VRT stability: confirm via no-op test PR that the new baseline (post-C6 bump) is stable.

**Confidence calibration trail**: C1 HIGH-with-caveat → C2 HIGHER → C4 HIGH → C3 HIGH (revised up) → C5 MEDIUM-HIGH (revised up) → C6 likely **LOW-MEDIUM** (downward shift).

**Pattern accumulation update**: 10 named patterns from C1-C5. VFC (C3 NEW) reused in C5. Strategic defer baseline bump (C5 NEW) ready for application by C6. C6 will likely add 1-3 more patterns (Path C execution, possibly SPLIT-by-route, possibly intentional-visual-diff acceptance).

### C6 Tailwind (SCRUM-396) — closed 2026-05-10 — **CAMPAIGN COMPLETE**

**Outcome**: 1×ACCEPT (baseline bump `aa9760c`) for commit `939d8b9` (Tailwind 3.4.x→4.3.0) + in-scope hot-fix `6399bb8` (cursor:pointer restoration). 6 facets all aligned with cluster decision. **First non-NO-OP** of the campaign. **Path C executed**: workflow_dispatch run id `25637467706` (success, 2m1s) captured the cumulative C1-C6 visual delta into `aa9760c` on em-ecosystem-code main. **Surprisingly bounded**: only 2 PNGs differed (password-reset-check-email light + dark dashboard); all other routes matched rescue baseline pixel-for-pixel.

**Code merged**:
- ai-specs PR #6 (squash `86dcc00`): §13.5.2 C6 row (now 9 rows) + plan + verify report.
- em-ecosystem-code workflow auto-commit `aa9760c`: 2 PNGs (the new authoritative baseline).
- (this commit): SCRUM-396 record + this section + populated Campaign Closure Addendum below.

**OUT-OF-SCOPE**: `fda0b94` (dashboard nonce hydration warning) — per commit body "Next 16 rewrites the nonce attribute", Next 16-related, NOT Tailwind 4. Same OOS precedent as `ffc3418` from C4.

**Confidence revised UP**: plan forecast LOW-MEDIUM → /verify revised to HIGH after Path C produced bounded 2-PNG diff (vs widespread regression initially feared).

### Campaign closure addendum

**Campaign**: SCRUM-387 cascade-audit, launched 2026-05-10, closed 2026-05-10 (same-day completion of all 6 clusters).

**Overall outcome**: 6 cluster sub-tickets fully audited, 9 cluster decisions recorded in §13.5.2, **0 REVERT, 0 SPLIT, 8 ACCEPT-NO-OP, 1 ACCEPT** (baseline bump `aa9760c` at C6). The 9 cascade commits are all preserved in em-ecosystem-code/main; no rollback required.

**Decision summary by sub-ticket**:

| Sub-ticket | Cluster | Decision count | Decisions | Path | Confidence |
|------------|---------|----------------|-----------|------|------------|
| SCRUM-390 | C1 Dev tooling (4 commits) | 4 | 4×ACCEPT-NO-OP | A | HIGH (1 caveat: ab101f3 wrapper) |
| SCRUM-391 | C2 TypeScript (1 commit) | 1 | 1×ACCEPT-NO-OP | A | HIGHER |
| SCRUM-393 | C4 Dep. security (1 commit) | 1 | 1×ACCEPT-NO-OP | A | HIGH |
| SCRUM-394 | C3 Icons (1 commit) | 1 | 1×ACCEPT-NO-OP via VFC | A | HIGH |
| SCRUM-395 | C5 React/Next (1 commit) | 1 | 1×ACCEPT-NO-OP via VFC | A (strategic defer) | MEDIUM-HIGH |
| SCRUM-396 | C6 Tailwind (1 commit + hot-fix) | 1 | 1×ACCEPT (baseline bump) | C | HIGH (post-evidence) |

**Plus 2 follow-up tickets created**:
- **SCRUM-392** (Deferred, Backlog) — Switch nexacore-api tsconfig from `baseUrl` to explicit `paths` before TS 7 GA. Spawned by C2 Facet 3.
- **No others** — C3/C4/C5/C6 all produced clean cluster decisions without spawning Deferred/Risk follow-ups.

**Out-of-scope commits** (documented in audit log for traceability):
- `ffc3418` SCRUM-370 (pre-push CI parity) — pure CI/dev tooling, not a framework upgrade. Excluded from C4.
- `fda0b94` (dashboard nonce hydration warning) — Next 16 behavior, not Tailwind 4. Excluded from C6.
- These exclusions confirm the parent §6 Step 0 inventory count of **9 framework upgrade commits**.

**Patterns inventory** (12 named patterns accumulated across C1-C6):

| # | Pattern | Origin | Reuse |
|---|---------|--------|-------|
| 1 | Per-commit `git show --stat` methodology | C1 (deviation) → C2 (default) | All clusters |
| 2 | Bundle-reach analysis as NO-OP evidence | C1, C2, C4 | C1-C4 |
| 3 | Commit-time CI evidence | All clusters | All clusters |
| 4 | Visual-fidelity-by-construction (VFC) | C3 (NEW) | C5 reused |
| 5 | WHATWG semantic-equivalence (first-principles variant of VFC) | C1 (`ab101f3` wrapper) | — |
| 6 | Out-of-scope determination for tangential commits | C4 (`ffc3418`) | C6 (`fda0b94`) |
| 7 | Residuals handoff to existing cluster | C4 (→ C5, cured) | — |
| 8 | Deferred ticket creation | C2 (SCRUM-392) | — |
| 9 | Strategic defer baseline bump | C5 (→ C6) | C6 executed |
| 10 | Path C remote workflow_dispatch baseline bump | C6 (NEW) | — |
| 11 | Forecast → evidence → revision loop self-correction | C3 (revised up), C5 (sub-PR forecast wrong), C6 (LOW→HIGH confidence) | — |
| 12 | In-scope hot-fix inheriting cluster decision | C6 (`6399bb8` cursor:pointer) | — |

**Cross-cluster lessons synthesized**:

- **The first cluster bears methodology-establishment cost**: C1 had 2 deviations; C2-C6 had 0 deviations each. Pattern: invest in methodology refinement at C1 expecting cleaner clusters after.
- **Forecast bias was consistently pessimistic**: C3/C4 lessons predicted heavier scopes than reality. The campaign's forecast→evidence loop reliably revises forecasts downward as actual evidence accumulates.
- **Bundle-reach analysis covers ~50% of clusters**: C1/C2/C4 used it as primary. The other 50% (C3/C5/C6) needed VFC or Path C.
- **Hot-fixes split cleanly**: in-scope (cluster's direct remediation, like `6399bb8` for Tailwind) vs out-of-scope (tangential, like `ffc3418` CI or `fda0b94` Next 16). Pattern decision criterion: does the hot-fix directly remediate THIS cluster's framework upgrade?
- **Path C only when strictly necessary**: only C6 used it. Rationale: it's the most expensive operation (CI minutes + state change), so reserve for clusters where VFC is unavailable.

**Recommendations for SCRUM-380 playbook (§13)**:
- §13 should reference §13.5 (Cascade Audit Log) as the canonical post-cascade artifact.
- §13.5.1 entry format is validated across 9 rows. No revisions needed.
- Recommend opening **a follow-up tech-debt ticket** for §13.6 (Patterns Catalog) — codify the 12 named patterns as a reference for future cascades. Not blocking.

**Future-cascade recommendations** (when next major bumps land: Tailwind 5, React 20, Next 17, etc.):
1. Capture baseline tag IMMEDIATELY before any major bump (avoids the rescue-tag scramble SCRUM-384 had to do).
2. Plan cluster split by risk gradient (LOW→HIGHEST). Let the lowest-risk cluster validate methodology.
3. Per-commit `git show --stat` as default Step 1.
4. Allow VFC arguments where source change is wrapper-or-fidelity-equivalent. Don't force Path C for everything.
5. Strategic defer baseline bumps when consecutive clusters affect rendering. Consolidate at the last visual-impact cluster.
6. Path C only when CSS / visual semantics genuinely change.
7. OOS pattern for tangential commits with explicit rationale.
8. Forecast → evidence → revision loop. Don't trust prior-cluster forecasts.
9. In-scope hot-fixes bundle with the cluster they remediate; OOS when unrelated.
10. Campaign closure ceremonies planned in the LAST cluster's plan.

**Numerical retrospective**:
- Total wall-clock: same-day (2026-05-10) for 6 cluster lifecycles + campaign closure ceremonies (estimated 7-8 hours total across all clusters)
- Sub-tickets created: 7 (6 cluster + 1 Deferred SCRUM-392)
- ai-specs PRs merged: 6 (one per cluster)
- ai-specs direct-to-main commits: 6 (one record-commit per cluster /update-docs)
- em-ecosystem-code workflow auto-commits: 1 (`aa9760c` from C6 Path C)
- §13.5.2 audit log rows: 9
- Deviations classified: 2 (both in C1)
- Tech-debt tickets created: 1 (SCRUM-392 Deferred from C2)
- REVERT decisions: 0
- SPLIT decisions: 0

---

## Status

**SCRUM-387**: ✅ **CAMPAIGN COMPLETE** (6 of 6 sub-tickets closed, Campaign Closure Addendum populated). Awaiting user transition to Done.
**SCRUM-383 epic**: ✅ **READY FOR CLOSURE** (4 of 4 sub-tickets done: SCRUM-384/385/386/387). Awaiting user transition to Done after SCRUM-387 transitions.

**USER actions** (post-this-/update-docs, per Campaign Closure Plan):
1. Transition SCRUM-396 → Done
2. Transition SCRUM-387 → Done
3. Transition SCRUM-383 epic → Done
4. Trigger no-op test PR against em-ecosystem-code main to confirm `aa9760c` baseline stability
5. Archive `rescue/visual-baseline` branch (keep on origin as historical reference)
6. (Optional) Open follow-up tech-debt ticket for workflow-standards.mdc §13.6 Patterns Catalog
