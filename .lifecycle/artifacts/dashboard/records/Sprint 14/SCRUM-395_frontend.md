# Implementation Record: SCRUM-395 [SCRUM-387 C5] Audit cascade upgrades — React/Next cluster

## 2. Summary

Fifth closed sub-ticket of the SCRUM-387 cascade-audit campaign. **Largest framework jump** (Next 14→16 + React 18→19) but **smallest production-source delta** (1 file, 2 lines). Single commit `6bdd387` decomposed into 5 facets, all reconcile to **ACCEPT-NO-OP** via visual-fidelity-by-construction (VFC reused from C3). **Cures C4 residuals** (1 next direct HIGH + 1 postcss transitive MODERATE eliminated). **Two firsts** for the campaign: sub-PR pattern forecast self-corrected; strategic defer of baseline bump to C6.

- **Scope**: frontend (docs-only on ai-specs)
- **Branch**: `feature/SCRUM-395-frontend` (merged + deleted)
- **Implementation date**: 2026-05-10
- **Lifecycle elapsed**: same-day (~70 min — between C2's 45 and C4's 75 min; longer than C3 due to script bug bisection but shorter than C4)

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_verify.md` (verdict: **PASS**)
- **Plan was followed**: Yes — 6/6 plan steps complete, **0 deviations** (4th consecutive). Path A VRT gate + strategic defer to C6 executed as plan-recommended.

## 4. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `fea7b53` | ai-specs | main (squash) | SCRUM-395: C5 React/Next cluster — 1× ACCEPT-NO-OP + §13.5.2 row (PR #5) |
| (pending) | ai-specs | main (direct) | docs(SCRUM-395): record + lessons-learned for C6 |

No em-ecosystem-code commits.

## 5. Deviations from Plan

**Implementation followed the plan exactly. 0 deviations.**

The Path A VRT gate execution + strategic defer recommendation were explicit AC deliverables (AC3 + strategic note in plan §6.1), not deviations.

## 6. Test Results

N/A — docs-only ticket. Audited commit `6bdd387` evidence preserved in PR #262 CI history (dashboard 118/118 + 19 routes + 0 lint + 0 prod-vulns; satellite 14 routes + 0 vulns).

## 7. Bugs Found

### Two script bugs found (in /enrich-us script, not in the cluster being audited)

The `enrich-scrum-395.js` script failed twice during /enrich-us before succeeding:

1. **Missed `t()` wrap**: a string literal was passed directly to `para(...)` instead of wrapped in `t('...')`. Caught by Node.js parser (SyntaxError). Fix: wrap with `t()`. Lesson: avoid mixing bare strings with `t()`-wrapped nodes in `para()`.
2. **Block-level node inside paragraph**: I passed `bullet(...)` as a child of `para(...)`. ADF rule: paragraphs only accept inline content; bullet lists are block-level. Caught by Jira API (`INVALID_INPUT` HTTP 400). Fix: split into `para` + `bullet` siblings at the top level of the content array.

Both lessons join the SCRUM-393 lesson (ADF `code` + `strong` mark conflict) as recommended additions to the shared enrich-script template's runtime validation:
- Validate all `para(...)` children are inline (no block-level nodes)
- Validate all mark combinations exclude `code` from compositing with strong/em/underline

### No bugs in the audited cluster

`6bdd387` itself is clean: 5 CVEs cured + C4 residuals cleared + sole src/ change is a 2-line async migration with VFC defensibility.

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/specs/workflow-standards.mdc` | Appended C5 row to §13.5.2 (now 8 rows: 4 C1 + 1 C2 + 1 C4 + 1 C3 + 1 C5). Existing rows untouched. (committed `fea7b53`) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_frontend.md` | NEW (276 lines): plan with VRT Path A/B/C decision tree + strategic defer recommendation. (committed `fea7b53`) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_verify.md` | NEW (164 lines): verify report — PASS, 6/6 plan compliance, 0 deviations, AC5 C4 residuals cure verification, Path A documentation with strategic defer rationale. (committed `fea7b53`) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-395_frontend.md` | NEW: this record. |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` | MODIFIED: replaced "C5 React/Next — pending" placeholder with closure summary + lessons-learned for C6 (Tailwind — last cluster). |

No other spec files affected.

## 9. Audit Finding Verification

**Not applicable** — SCRUM-395 is a decision ticket.

The substantive audit deliverables are the **§13.5.2 C5 row** + the AC5 C4 residuals-cure verification documented in /verify.

## 10. Lessons Learned

### What went well

- **VFC pattern reused cleanly across two distinct cluster shapes.** C3 used VFC for an SVG visual fidelity argument; C5 uses VFC for an async-API timing argument. Same first-principles framing, different surface concern. Confirms VFC is a generalizable NO-OP evidence type.
- **Strategic defer baseline bump worked as designed.** Acknowledging that C6 will require a Path C bump regardless, deferring C5's bump avoids redundant CI operations. Saves both time and unnecessary baseline-PNG-commit churn on em-ecosystem-code main.
- **Forecast → evidence self-correction** continues to refine the campaign. C3 lessons predicted "MEDIUM confidence + sub-PR pattern likely". /enrich-us evidence revised to "MEDIUM-HIGH confidence + sub-PR pattern absent". /verify confirmed. The cascade-audit pipeline is robust against initial-forecast bias.
- **AC5 cleanup wraps a residuals chain.** C4 residuals were documented as bound-to-C5; C5 verified cure via commit body claim. Closes the loop cleanly without requiring additional ticket creation.
- **Bounded production-source change** despite large framework version jump. 14 files but only 1 src/ file (2 lines). Pattern: framework cascades often have lots of mechanical-infrastructure files vs minimal application code. Worth noting for C6 (Tailwind 4) which may follow a similar pattern (lots of utility/build files but bounded application code).

### What was harder than expected

- **Two enrich-script bugs in one run** (missed `t()` wrap + block-in-paragraph). Both caught by linters / API validation. Total time lost: ~5 minutes. Cumulative lessons across SCRUM-393 + SCRUM-395 motivate codifying:
  - A `para()` helper that asserts inline-only children at construction time
  - A `code()` helper that asserts no other marks are present (avoids `code+strong` from SCRUM-393)
  - These validations would prevent silent invalid-ADF generation across all future enrich scripts. Future work item.
- **Defending VFC for async/await wrap** required clarifying that async/await is purely a server-side timing concern (not a behavior change). Subtle but important distinction. C6's plan should consider whether Tailwind 4's CSS variable / utility renames admit a similar VFC argument — most likely NO, because CSS changes DO affect rendered output.

### Recommendations for C6 (Tailwind cluster — `939d8b9` SCRUM-373 Tailwind 3→4)

C6 is **the last cluster** and **substantively different from all 5 prior**:

1. **HIGHEST risk profile per parent §7** — Tailwind 4 is the visual heavyweight that triggered the SCRUM-383 epic in the first place. The whole rescue-and-cascade campaign exists BECAUSE Tailwind 4 shipped visual regressions.
2. **VFC argument unlikely to apply.** Tailwind 4 changed CSS variable semantics, utility renames, default `outline` behavior, etc. CSS changes DIRECTLY affect rendered output — first-principles fidelity is hard to argue.
3. **Decision very likely ACCEPT (with baseline bump via Path C).** This is the bump that C5 deferred. Triggers `gh workflow run visual-regression.yml --field capture_baseline=true --field baseline_ref=<current-main-sha> --field package=both`. Auto-commits new baseline PNGs to em-ecosystem-code main with `[skip ci]`.
4. **Confidence drops to LOW-MEDIUM.** Plan must state confidence explicitly. The Tailwind 4 cascading effects on the dashboard (cursor:pointer regression, recharts theming, etc.) are known visual changes — most are intentional but require formal capture in a new baseline.
5. **Possibly REVERT path triggered** for specific routes IF the visual diff includes UNINTENTIONAL regressions. The hot-fix `6399bb8 fix: restore cursor:pointer on buttons after Tailwind v4 migration` already addressed one such regression. /enrich-us should grep for `cursor:pointer` and other CSS-state-restoring patterns to inventory what's been fixed-post-merge.
6. **SPLIT path possible** if different routes warrant different decisions. Tailwind 4's blast radius is genuinely broad; subcluster-by-route may be justified.
7. **C6 closes the campaign.** After C6 transitions to Done, SCRUM-387 transitions to Done, then SCRUM-383 epic transitions to Done. Per parent §6 Step 4 "Final closure", a no-op test PR against main should confirm VRT is stable post-baseline-bump.
8. **Per-facet model still applies.** Likely C6 facets: (a) Tailwind 3→4 version bump, (b) PostCSS config changes, (c) global CSS changes, (d) any utility renames forced into source code, (e) the pre-shipped hot-fix (`6399bb8` cursor:pointer) as related context, (f) bundle-size/CSS-output delta.

### Recommendations for SCRUM-387 closure (post-C6)

When C6 closes its /update-docs:

- **§13.5.2 audit log will have 9-12 rows** by then (depending on whether C6 SPLITs). Consider a header summary ("X ACCEPT-NO-OP, Y ACCEPT, Z REVERT") if useful.
- **Campaign closure addendum** (already a placeholder in SCRUM-387 record): summarize ALL cluster decisions + cross-cluster lessons learned + recommendations for next major-version cascade.
- **Patterns inventory**: by end of campaign, 10-12 named patterns will be available for reuse. Document them in a workflow-standards.mdc subsection or a dedicated patterns reference file.
- **VRT stability**: confirm via no-op test PR against main that the new baseline (post-C6 bump) is stable + future PRs compare cleanly.

### Recommendations for the cascade-audit framework as a whole

- **VFC is a campaign-wide pattern**, not C3-specific. Use it for any cluster where the source change can be defended as semantically-or-visually equivalent by construction. Future cascade audits should explicitly consider VFC as Step 1 of evidence-gathering.
- **Strategic defer baseline bump** generalizes beyond C5/C6. Whenever consecutive clusters affect the same baseline, consolidate the bump at the last one. Add to the §13 playbook as guidance.
- **Forecast → evidence → revision loop** is the campaign's key quality-control mechanism. Each cluster's /enrich-us revises the prior cluster's forecast based on real-code evidence. This loop has worked for C2 (cleaner than expected), C3 (cleaner than expected), C5 (cleaner than expected). C6 will likely break the streak (it IS visually heavy by design).
- **Patterns accumulation rate**: 10 named patterns from 5 clusters = 2 patterns/cluster on average. C6 will add 1-3 more (Path C baseline bump execution, possibly SPLIT-by-route, possibly multi-row §13.5.2 for split decisions).

---

## Closure Status

- **SCRUM-395**: lifecycle complete. Awaiting user transition to Done.
- **SCRUM-387**: 5 of 6 sub-tickets closed. **Only C6 remains.**
- **SCRUM-383 epic**: still in progress.

**Next pickup point**: `/enrich-us SCRUM-3xx` for **C6 (Tailwind 3→4 — last cluster!)**. Sub-ticket to be created when user signals readiness. **Confidence: LOW-MEDIUM**. **Path C baseline bump likely required**. May SPLIT if visual diff is per-route-mixed. Closes the campaign upon completion.

## 11. Tech Debt Tickets Created (this /update-docs run)

**None.** Third consecutive /update-docs with zero ticket creation (SCRUM-393 + SCRUM-394 + SCRUM-395). The VFC + strategic-defer patterns avoid Deferred/Risk findings cleanly.

C6 will likely break this streak — Tailwind 4 hot-fix (`6399bb8`) is already in main; any further visual regressions surfaced at /verify may spawn Deferred / Pre-existing tickets.
