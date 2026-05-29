# Implementation Record: SCRUM-396 [SCRUM-387 C6] Audit cascade upgrades — Tailwind cluster (FINAL)

## 2. Summary

**SIXTH AND FINAL** closed sub-ticket of the SCRUM-387 cascade-audit campaign. Adjudicated commit `939d8b9` (Tailwind 3.4.x→4.3.0) + in-scope hot-fix `6399bb8` (cursor:pointer restoration). 6 facets all reconcile to **cluster decision ACCEPT** — the campaign's **first non-NO-OP**. Path C executed: workflow_dispatch baseline bump captured the cumulative C1-C6 visual delta into commit `aa9760c` on em-ecosystem-code main. Surprisingly bounded result: only 2 PNGs differed (password-reset-check-email light + dark). `aa9760c` is the new authoritative VRT baseline.

After this /update-docs, **the campaign closes**: 3× Jira transitions queued (SCRUM-396 → SCRUM-387 → SCRUM-383 epic to Done).

- **Scope**: frontend (docs-only on ai-specs; em-ecosystem-code received the workflow auto-commit)
- **Branch**: `feature/SCRUM-396-frontend` (merged + deleted)
- **Implementation date**: 2026-05-10
- **Lifecycle elapsed**: same-day (~120 min — longest of the campaign due to Path C execution + CI wait + closure planning)

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-396_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-396_verify.md` (verdict: **PASS**)
- **Plan was followed**: Yes — 6/6 plan steps complete, **0 deviations** (5th consecutive). Path C executed as plan-recommended. Path A/B explicitly excluded with documented rationale.

## 4. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `86dcc00` | ai-specs | main (squash) | SCRUM-396: C6 Tailwind cluster — ACCEPT (baseline aa9760c) + §13.5.2 row (PR #6) |
| `aa9760c` | em-ecosystem-code | main (workflow auto-commit) | chore(SCRUM-379): refresh VRT baseline from e147d3c... [skip ci] |
| (pending) | ai-specs | main (direct) | docs(SCRUM-396): record + Campaign Closure Addendum (campaign complete) |

`aa9760c` is THE artifact of C6 — the new authoritative VRT baseline. All future PRs compare against it.

## 5. Deviations from Plan

**Implementation followed the plan exactly. 0 deviations.**

The Path C execution + OOS determination for `fda0b94` + Campaign Closure Plan were explicit AC deliverables (AC3, AC4, AC6+AC7), not deviations.

## 6. Test Results

N/A for ai-specs (docs-only).

Path C workflow run id `25637467706` PASSED (success, 2m1s): captured baseline from current main (`e147d3c30984bc72421602d80e3d15c25d94d214`), regenerated PNGs, committed only the differing 2 PNGs.

Pre-existing CI evidence for the cluster commit `939d8b9` (PR #268): dashboard 118/118 tests + 19 routes; satellite 14 routes; both 0 lint + 0 vulns. The PR #268 "PASS-WITH-DEBT" verdict cited "manual visual QA recommended at next dev session" as the debt — **this audit IS the resolution of that debt**.

## 7. Bugs Found

None.

The narrow Path C result (2 PNGs) actually points to a positive finding: **the cumulative cascade visual impact across C1-C6 is much smaller than the SCRUM-383 epic anticipated when triggered**. The rescue tag baseline `v-baseline-2026-05-06-auth-green` plus the 9 cascade commits + 2 hot-fixes produce visually-equivalent rendering on all routes EXCEPT password-reset-check-email. Worth noting for future cascade campaigns: the framework upgrade visual impact estimate may be conservatively over-stated.

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/specs/workflow-standards.mdc` | Appended C6 row to §13.5.2 (now **9 rows**: 4 C1 + 1 C2 + 1 C4 + 1 C3 + 1 C5 + 1 C6). C6 row references `aa9760c` baseline PNG SHA. (committed `86dcc00`) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-396_frontend.md` | NEW (312 lines): plan with §6.1 OOS determination + §6.2 Campaign Closure Plan. (committed `86dcc00`) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-396_verify.md` | NEW (204 lines): verify report — PASS, 6/6 plan, 0 deviations, Path C execution detail + AC4 OOS rationale + AC6/7 closure readiness. (committed `86dcc00`) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-396_frontend.md` | NEW: this record. |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` | MODIFIED: replaced "C6 Tailwind — pending" placeholder with closure summary; **Campaign Closure Addendum fully populated** with cross-cluster summary + patterns inventory + retrospective recommendations; Status section updated to reflect campaign completion. |

## 9. Audit Finding Verification

**Not applicable** — SCRUM-396 is a decision ticket.

The substantive audit deliverables are: (a) §13.5.2 C6 row + `aa9760c` baseline SHA reference; (b) the new authoritative VRT baseline; (c) OOS determination for `fda0b94`; (d) the populated Campaign Closure Addendum.

## 10. Lessons Learned

### What went well (C6 specifically)

- **Path C executed cleanly on first try.** The workflow completed in 2m1s with a single auto-commit (`aa9760c`). No retries needed.
- **Bounded visual diff: only 2 PNGs.** This was much narrower than the SCRUM-383 epic anticipated. The campaign's "visual heavyweight" cluster + the 5 prior framework upgrades produced 2 PNG changes total.
- **Confidence revised UP twice**: plan said LOW-MEDIUM; /verify revised to HIGH after seeing the Path C result. This is the campaign's largest forecast→evidence delta — and it went in the favorable direction.
- **0 deviations classified, despite C6 being the most operationally complex cluster.** Path C is a non-trivial workflow with state-changing effects; doing it cleanly is a meaningful test of the methodology.
- **OOS pattern reused twice now** (`ffc3418` C4 + `fda0b94` C6). Pattern is stable.
- **Hot-fix in-scope pattern (`6399bb8`)** — first cluster bundling a related fix without spawning a separate row. The cluster's row references the hot-fix as inherited.

### What was harder than expected (campaign-wide retrospective)

- **The first cluster (SCRUM-390 C1) had 2 deviations.** Both became codified defaults for C2-C6. Pattern: the first cluster of a campaign carries methodology-establishment cost.
- **3 ADF/script bugs surfaced during enrich script authoring** (SCRUM-393 `code+strong`, SCRUM-395 bare-string-in-para + bullet-in-para). Each was caught + fixed quickly but argues for codifying validation in the shared enrich script template.
- **Forecast bias was consistently pessimistic**: parent §9 R2 + C3/C4 lessons predicted heavier scopes than reality (sub-PR pattern absent for C5; bounded 2-PNG diff for C6). The cascade-audit pipeline's forecast→evidence loop self-corrected at each cluster.

### Recommendations for the next major-version cascade

The campaign delivered 10+ named patterns + a working playbook. For the next cascade (when Tailwind 5, React 20, Next 17+, etc. land):

1. **Capture baseline tag IMMEDIATELY before any major bump** (per §13.4). This avoids the rescue-tag scramble that SCRUM-384 had to do.
2. **Plan cluster split by risk gradient** (LOW→HIGHEST) and let the lowest-risk cluster validate methodology. Don't start with the visual heavyweight.
3. **Per-commit `git show --stat` as default**. Don't propose `npm` gates against compound main.
4. **Allow VFC arguments** for clusters where source change is wrapper-or-fidelity-equivalent. Don't force Path C for everything.
5. **Strategic defer baseline bumps** when consecutive clusters affect rendering. Consolidate at the last visual-impact cluster.
6. **Path C only when CSS / visual semantics genuinely change**. C6 was the only Path C in this campaign; expect similar ratios in future cascades.
7. **OOS pattern for tangential commits** (CI tooling, post-merge hot-fixes for unrelated frameworks). Document the rationale explicitly per cluster.
8. **Forecast → evidence → revision loop**. Don't trust prior-cluster forecasts; let /enrich-us refine them with real-code evidence.
9. **Pre-shipped hot-fixes**: bundle in-scope with the cluster they remediate; OOS when they touch unrelated frameworks.
10. **Campaign closure ceremonies plan in the LAST cluster's plan**. Avoids ad-hoc closure scrambling.

### Recommendations for SCRUM-380 playbook

The campaign produced enough empirical data to recommend playbook updates:

- §13 should reference §13.5 (Cascade Audit Log) as the canonical post-cascade artifact.
- §13.5.1 entry format works as-is (6 columns) for both NO-OP and non-NO-OP decisions. Validated across 9 row instances.
- A new §13.6 could codify the **patterns catalog** (10+ patterns) as a reference for future cascades. Recommend opening as a follow-up tech-debt ticket.

---

## Closure Status

- **SCRUM-396**: lifecycle complete. **Last cluster of the campaign.** Awaiting user transition to Done.
- **SCRUM-387**: 6 of 6 sub-tickets closed. Campaign Closure Addendum populated. Awaiting user transition to Done.
- **SCRUM-383 epic**: 4 of 4 sub-tickets ready (SCRUM-384/385/386/387 all Done or ready). Awaiting user transition to Done after SCRUM-387 transitions.

**USER actions** (post-this-/update-docs, per Campaign Closure Plan):
1. Transition SCRUM-396 → Done
2. Transition SCRUM-387 → Done (gated: all 6 cluster sub-tickets Done + Closure Addendum populated)
3. Transition SCRUM-383 epic → Done (gated: SCRUM-387 Done)
4. Trigger no-op test PR against em-ecosystem-code main to confirm `aa9760c` baseline stability
5. Archive `rescue/visual-baseline` branch (keep on origin as historical reference per SCRUM-385 closure)
6. (Optional) Open follow-up tech-debt ticket for §13.6 patterns catalog

## 11. Tech Debt Tickets Created (this /update-docs run)

**None.** Fourth consecutive /update-docs with zero ticket creation (SCRUM-393 + SCRUM-394 + SCRUM-395 + SCRUM-396).

The Path C result resolved the visual debt; no follow-up surfaces. The §13.6 patterns catalog recommendation (above) is a candidate for user-discretion follow-up.

---

# Re-opening: Post-merge Stabilization Phase (2026-05-11 → 2026-05-12)

## R1. Context

After the original closure (above), visual regressions were reported in the dashboard Design System showcase. The Path C VRT baseline (`aa9760c`) had detected only 2 PNG differences and was accepted as stable, but the diff did not exercise interactive states (dark mode wrappers, theme-toggle utility paths, Circle button overrides) deeply enough to surface three structural regressions left by the SCRUM-373 TW3→TW4 migration:

1. **`@theme` indirection bake** (broke dark-mode globally, root cause of the user-reported "buttons styles broken")
2. **`--color-error` self-reference** in `@theme` (broke `text-error` globally — DANGER variant rendered as white text instead of red)
3. **Circle button cascade** — `h-9` lost to size-md `h-10` (rendered 36×40 ellipse instead of 36×36 circle)

Original `aa9760c` baseline captured (and froze) these regressions as "correct," explaining why the prior workflow_dispatch reported only 2 PNG deltas — the visual showcase routes were rendering uniformly-wrong in both pre- and post-baseline captures.

This re-opening phase ships the structural fixes and preserves the TW3 visual at 100%.

## R2. Commits (re-opening phase)

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `4763ab6` | em-ecosystem-code | main (squash from PR #295) | SCRUM-396: stabilize Tailwind 4 dark mode + Circle button cascade |
| (pending) | ai-specs | main (direct) | docs(SCRUM-396): re-opening section + workflow-standards §13.7 |

Net diff `4763ab6`: 5 files, +166 / −296 lines (276 of the deletions are 2 dead `tailwind.config.ts` files; TW4 ignores them without `@config` directive).

## R3. Root-cause analysis

### R3.1 `@theme` indirection bake

```css
@theme { --color-surface-inverse: var(--surface-inverse); }
:root { --surface-inverse: #1c1c1c; }
.dark { --surface-inverse: #f5f5f5; }
```

Tailwind 4 emits `@theme` declarations at `:root` scope. The `var(--surface-inverse)` is resolved at the `:root` cascade (light value) and the computed value `#1c1c1c` is then **inherited as a frozen value** to every descendant. `.dark` overrides `--surface-inverse` to `#f5f5f5` but `--color-surface-inverse` (what the `bg-surface-inverse` utility actually reads) was already computed at `:root` and does not re-resolve. Result: dark-mode `bg-surface-inverse` rendered as light-mode value (DARK section primary buttons looked identical to LIGHT section primary buttons).

This breaks ~30 token aliases across surface, content, border, hover, error, warning, info, success, metric, notification groups.

In TW3 this never occurred because `tailwind.config.ts` generated utility class CSS with `var()` resolved at the consuming element, not at `:root`. The migration tool preserved the variable indirection pattern without realizing TW4's `@theme` semantics change the resolution point.

### R3.2 `--color-error` self-reference

```css
@theme { --color-error: rgb(var(--color-error)); }   /* circular */
:root { --color-error: 138 17 17; }                  /* channels (TW3 idiom) */
```

The migration preserved the TW3 channels form `--color-error: 138 17 17` (used by the deleted `tailwind.config.ts` pattern `rgb(var(--color-error) / <alpha-value>)`) and the `@theme` block introduced a `--color-error: rgb(var(--color-error))` declaration that **references itself**. CSS spec: a custom property with a circular reference resolves to an invalid value. `.text-error { color: var(--color-error) }` then falls back to `currentColor`, so DANGER buttons inherited the surrounding text color (white in dark mode) instead of red.

### R3.3 Circle button cascade conflict

```tsx
// Button.tsx variant size
sizeClasses.md = "px-6 py-2.5 text-body font-normal rounded-md h-10"

// ComponentShowcase Circle override
className="rounded-full! px-0! w-9 h-9 min-w-0!"
```

`h-9` and `h-10` have identical specificity. Without `!important`, the cascade fall-back is source order in the generated Tailwind sheet, where `h-10` wins. TW3 emitted utilities in a different order that happened to produce the visually-expected result; TW4 emits in deterministic ascending-size order so the override needs `!` to win.

## R4. Fixes applied

| File | Change |
|------|--------|
| `nexacore-dashboard/src/app/globals.css` | (a) Added ~30 `--color-*` direct overrides inside `.dark` and `.light` blocks so the cascade re-resolves them for descendants. (b) Replaced `@theme { --color-error: rgb(var(--color-error)) }` with literal `rgb(138 17 17)`. (c) Replaced `:root { --color-error: 138 17 17 }` with `rgb(138 17 17)` (TW3 channels form was only required by the deleted `tailwind.config.ts` `<alpha-value>` pattern). (d) Added an in-code comment block at `@theme` documenting the TW4 indirection rule. |
| `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx` | Circle button override: `w-9 h-9 min-w-0!` → `w-9! h-9! min-w-0!`. |
| `satellites/sat-cristian-garcia/src/app/globals.css` | Same pattern as dashboard (dark-mode overrides, `--color-error` literal, in-code rule comment). |
| `nexacore-dashboard/tailwind.config.ts` | DELETED — 139 lines of dead code (TW4 ignores without `@config` directive). |
| `satellites/sat-cristian-garcia/tailwind.config.ts` | DELETED — 137 lines of dead code. |

Visual preservation rule (per user brief at re-opening): all token values match the TW3 baseline `4a8d88e` exactly. Earlier in the re-opening session three token values were briefly changed to align with `ui-design-system.md` (the documented SSoT); on the second day of the re-opening this was reverted because the documented values disagree with the TW3 production runtime values and the brief was "preserve TW3 visual at 100%." See R6 below.

## R5. Verification (re-opening phase)

- **API**: `npm ci` + `prisma generate` + `eslint --max-warnings 0` + `nest build` + `jest --coverage` = **1052/1052 tests pass**, 0 lint issues, build clean. (Verified via pre-push hook on `4763ab6`.)
- **Dashboard**: `npm run lint` 0 issues; `npm run build` clean (19 routes). (Verified directly; pre-push hook for dashboard portion blocked by OneDrive retaining `tailwindcss-oxide.win32-x64-msvc.node` — well-documented Windows limitation, CI re-runs all gates on the PR.)
- **Satellite**: `npm run lint` 0 errors / 3 pre-existing warnings; `npm run build` clean (12 static routes).
- **Playwright probe** (replicating Button.tsx variant classes in `.light` and `.dark` wrappers via injected DOM):
  - `:root.--surface-tertiary` = `#f5f7f9` (TW3 baseline preserved)
  - `:root.--color-surface-tertiary` = `#f5f7f9` (utility var now propagates from `--surface-tertiary` correctly)
  - `:root.--content-secondary` = `rgba(28,28,28,0.65)` (TW3 baseline preserved)
  - `:root.--content-tertiary` = `rgba(28,28,28,0.55)` (TW3 baseline preserved)
  - `:root.--color-error` = `rgb(138,17,17)` (literal; was invalid before fix)
  - `.dark` PRIMARY button: `bg = rgb(245,245,245)` + `color = rgb(26,26,26)` (correct inversion)
  - `.dark text-error`: `rgb(239,68,68)` (red, was inheriting white before fix)
  - Circle button: 36×36 perfect circle in both modes (was 36×40 ellipse before fix)

## R6. Documentation drift surfaced (NOT modified — tracked separately)

During the re-opening, an audit of design tokens against `ai-specs/specs/ui-design-system.md` (the SSoT documental) surfaced **pre-existing** drift between the documented values and what the code has rendered since the design system was established. Three tokens differ:

| Token | `ui-design-system.md` says | TW3 + TW4 runtime renders |
|-------|---------------------------|---------------------------|
| `--surface-tertiary` | `#f2f2f2` | `#f5f7f9` |
| `--content-secondary` | `rgba(28,28,28,0.5)` | `rgba(28,28,28,0.65)` |
| `--content-tertiary` | `rgba(28,28,28,0.4)` | `rgba(28,28,28,0.55)` |

The drift is **not a TW4 regression**: the TW3 baseline `4a8d88e` shows the same divergence between code and doc. SCRUM-396 stabilization preserves the production runtime values (rule #1: maintain TW3 visual at 100%) and tracks the reconciliation as a separate ticket.

**Follow-up**: [SCRUM-398](https://emillionnetworking-ltd-labs.atlassian.net/browse/SCRUM-398) — Subtask of SCRUM-329 (audit ui-design-system.md), Sprint 14 active. Recommendation in ticket: Option B (align doc to code, since the runtime has been in production for the lifetime of the design system).

## R7. Bugs found (re-opening phase)

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `@theme` indirection breaks `.dark` cascade for ~30 token aliases | HIGH | Fixed in `4763ab6` | Direct `--color-*` overrides in `.dark`/`.light` |
| `--color-error: rgb(var(--color-error))` self-reference invalidates the variable globally | HIGH | Fixed in `4763ab6` | Literal `rgb(138 17 17)` in `@theme` + `:root` |
| Circle button h-9 loses cascade race against h-10 from size-md utility | MEDIUM | Fixed in `4763ab6` | `w-9!` / `h-9!` suffix-important in override |
| Dead `tailwind.config.ts` (×2) at repo root | LOW | Fixed in `4763ab6` | Deleted both files |
| Doc drift between `ui-design-system.md` and `:root` for 3 tokens | LOW (pre-existing) | Tracked as follow-up | SCRUM-398 |

## R8. Deviations classification (re-opening phase)

Per `update-docs.md` Part 5 — `/verify` PASS verdict carries over from the original closure phase. The re-opening introduces these new deviations:

| Deviation | Category | Risk | Action Taken |
|-----------|----------|------|--------------|
| Original SCRUM-396 closed before structural regressions surfaced; re-opening required | **Accepted-Quality** | None (regression caught + fixed) | Documented in R1; commit `4763ab6` ships the resolution. Indicates Path C VRT methodology has a known blind spot (uniform-baseline-captures-uniform-bug). Recommendation in R10 below. |
| Three :root token values briefly aligned with `ui-design-system.md` during re-opening (Day 1), then reverted (Day 2) per the user's "preserve TW3 visual at 100%" brief | **Accepted-Trivial** | None | Net change is zero across the session for these 3 values; SCRUM-398 tracks the actual reconciliation as a separate decision. |
| `tailwind.config.ts` deletions (×2) | **Accepted-Trivial** | None | Dead code; TW4 ignores without `@config` directive. |
| Pre-push hook bypassed via `--no-verify` on `4763ab6` push | **Accepted-Trivial** | None (CI re-runs gates) | OneDrive retained `tailwindcss-oxide.win32-x64-msvc.node`; user explicitly authorized the bypass with the justification that API portion of hook already passed (1052/1052 tests) and CI on PR repeats all gates. |

## R9. Documentation updates (re-opening phase)

| File | Changes Made |
|------|--------------|
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-396_frontend.md` | This re-opening section appended (R1–R10). |
| `ai-specs/specs/workflow-standards.mdc` | (pending in same commit as record) New §13.7 "Tailwind 4 @theme migration rule" codifying R3.1 + R3.2 patterns for the next cascade. |
| Jira SCRUM-398 | NEW — Subtask of SCRUM-329, Sprint 14. Documents R6 doc drift + decision options + Option B recommendation. |
| `nexacore-dashboard/src/app/globals.css` (in `em-ecosystem-code/4763ab6`) | In-code comment block at `@theme` documenting the TW4 indirection rule (so the next developer hitting this pattern reads the rule before re-introducing `var()` indirection). |
| `satellites/sat-cristian-garcia/src/app/globals.css` (in `em-ecosystem-code/4763ab6`) | Shorter in-code comment block referencing the dashboard's full version. |

## R10. Lessons learned (re-opening phase)

### What this re-opening teaches

- **VRT Path C blind spot**: a baseline captured AFTER a migration regression freezes the regression as "correct." Subsequent `workflow_dispatch` re-runs report 0 deltas because the baseline AND current state both render the same bug. Detection requires either pre-migration baselines (rescue tag) OR property-based assertions that go beyond pixel comparison. **Recommendation**: future cascade campaigns should keep BOTH a pre-migration baseline (rescue tag) AND a post-migration baseline, and route the cascade audit's "did the visual change" comparison against the rescue tag, not the post-migration baseline. The rescue tag `v-baseline-2026-05-06-auth-green` (`4d9d461`) already exists for exactly this scenario but wasn't used during C6's Path C decision.
- **TW3→TW4 migration tool blind spot**: `@tailwindcss/upgrade` preserved variable-indirection patterns from the JS config without recognizing that `@theme` semantics change the resolution point. This is a general "preserved-but-broken-pattern" risk for any large CSS-variable-based design system migration. **Mitigation**: post-migration audit MUST exercise `.dark` / `.light` wrapper paths interactively (not just route-level snapshots).
- **Composability vs cascade specificity**: TW4 forces explicit `!` on cascade-conflicting overrides where TW3 happened to produce the visually-correct result. **Rule of thumb**: any utility used to override a base-component class (e.g. Circle overriding Button.size-md) needs `!important` modifier in TW4.

### Recommendations folded into workflow-standards.mdc §13.7 (this /update-docs)

The three root-cause patterns (R3.1, R3.2, R3.3) are codified as §13.7 so the next major-version cascade catches them in `/plan` instead of post-merge. See §13.7 of the standards for the codified rules.

---

## Closure Status (FINAL — re-opening phase complete)

- **SCRUM-396 code work**: complete on em-ecosystem-code `main` (commit `4763ab6`, PR #295 merged).
- **SCRUM-396 ai-specs**: this record updated + §13.7 of workflow-standards.mdc (pending commit in this /update-docs run).
- **SCRUM-398 follow-up**: created in Jira, parent SCRUM-329, Sprint 14 active.

**USER actions** (post-this-/update-docs):
1. Transition SCRUM-396 → Done (still in In Progress / Open from re-opening)
2. (Optional) Make a decision on SCRUM-398 (Option A vs B for the doc drift) and assign or schedule
3. Confirm clean `main` state on em-ecosystem-code (no follow-up branches expected; this is the final commit of the SCRUM-396 scope).
