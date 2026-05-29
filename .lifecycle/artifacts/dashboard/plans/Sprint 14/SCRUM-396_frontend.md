# Frontend Implementation Plan: SCRUM-396 [SCRUM-387 C6] Audit cascade upgrades — Tailwind cluster (FINAL)

> **Scope adaptation note**: Audit-decision sub-ticket (precedent: C1-C5). **LAST cluster of the SCRUM-387 cascade-audit campaign.** Single primary commit `939d8b9` (Tailwind 3→4) + in-scope hot-fix `6399bb8` (cursor:pointer restoration). Out-of-scope hot-fix `fda0b94` (Next 16-related nonce hydration, NOT Tailwind). 6 facets. Per /enrich-us evidence, this is the **visual heavyweight** that triggered the SCRUM-383 epic — and the cluster where **Path C (workflow_dispatch baseline bump) is the only defensible VRT path** because Tailwind 4 changes CSS directly. Decision very likely **ACCEPT (first non-NO-OP of the campaign)**. After C6 closes, campaign-closure ceremonies run: SCRUM-396 → SCRUM-387 → SCRUM-383 epic transitions to Done; no-op test PR confirms baseline stability.

## 1. Header

- **Ticket**: SCRUM-396 (Sprint 14, id=477)
- **Parent**: SCRUM-387 (cascade-audit meta-coordinator)
- **Cluster**: C6 — Tailwind (1 primary commit + 1 in-scope hot-fix, 6 facets)
- **Issue type**: Subtask
- **Priority**: Medium
- **Predecessors**: SCRUM-390 (C1), SCRUM-391 (C2 + SCRUM-392), SCRUM-393 (C4), SCRUM-394 (C3 + VFC NEW), SCRUM-395 (C5 + strategic-defer NEW)
- **Successor**: NONE — C6 is the last cluster. After /update-docs, campaign-closure transitions follow.

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed cluster**: SCRUM-395 (C5 React/Next) — record committed `2e139bb`; PR #5 squash `fea7b53` shipped §13.5.2 row.
- **Integration state verified**: Yes — no em-ecosystem-code module/guard/service/permission state changes. The Path C baseline bump (if triggered) auto-commits PNG files only.
- **Files verified against live state**:
  - `em-ecosystem-code/main` git history — `939d8b9` confirmed present (82 files, largest cluster commit); `6399bb8` confirmed present (2 globals.css files, +17 lines); `fda0b94` confirmed present (out-of-scope per its own commit body referencing Next 16).
  - **Tailwind 4 breaking-pattern grep verification**: `outline-solid` 5 instances (correct renames), `bg-opacity-*` / `text-opacity-*` 0 matches (clean migration), `oklch()` direct usage 0 matches in src/, `@theme` blocks present in both `globals.css`, `tailwind.config.ts` DELETED in both packages, `designTokens` migrated to `src/lib/design-tokens.ts`.
  - `ai-specs/specs/workflow-standards.mdc` — §13.5.2 has 8 rows on main (4 C1 + 1 C2 + 1 C4 + 1 C3 + 1 C5) per commit `fea7b53`.
  - `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` — C5 closure section + lessons committed `2e139bb`. C6 placeholder still present (last `### Cn — pending`).
- **Discrepancies with integration-state.md**: None.

## 3. Regression Impact Analysis

**Expected path (1× ACCEPT with Path C baseline bump)** — blast radius:
- `ai-specs/specs/workflow-standards.mdc`: +1 row in §13.5.2 (or +2 if SPLIT).
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-396_frontend.md`: this file.
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-396_verify.md`: created at /verify.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-396_frontend.md`: created at /update-docs.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md`: replace "C6 Tailwind — pending" + populate Campaign Closure Addendum.
- **em-ecosystem-code (Path C ACCEPT path)**: workflow_dispatch auto-commits new baseline PNGs to main with `[skip ci]`. **NEW reference baseline** for all future PRs. PNG-commit SHA captured for §13.5.2.
- Jira: SCRUM-396 → Done (user-confirmed); SCRUM-387 → Done (user-confirmed); SCRUM-383 epic → Done (user-confirmed).
- **Blast radius size**: 5 ai-specs files + 1 em-ecosystem-code [skip ci] PNG commit + 3 Jira transitions. Above the >5 file flag — flagged for careful regression review.

**Conditional surprise paths**:
- **REVERT** (firmly OUT): would unwind the Tailwind 4 migration + already-shipped cursor:pointer hot-fix. Re-introduces visual regressions. Only triggered if Path C surfaces UNINTENTIONAL diffs that can't be accepted as intentional.
- **SPLIT** (possible): if /verify finds that different routes have substantively different visual diffs (some intentional, some not), SPLIT carves out the problematic routes into a new sub-ticket. The §13.5.2 row becomes 2+ rows.
- **ACCEPT-NO-OP** (unlikely): would require asserting zero pixel diff for Tailwind 3→4 — highly improbable given the CSS reset, OKLCH defaults, utility renames. NOT recommended.

**Test impact assessment**: NO `.spec.ts` modifications. PR #268 ran 118 dashboard tests + satellite build clean. The visual baseline PNGs ARE the test artifact being adjudicated.

## 4. Overview

C6 is the final cluster sub-ticket and the only one expected to require a Path C baseline bump. Per /enrich-us evidence, the primary commit `939d8b9` migrated Tailwind 3.4.x→4.3.0 across dashboard + satellite via the official `@tailwindcss/upgrade` tool. The migration is substantively complete: 82 files migrated, theme moved to CSS `@theme` blocks, utility renames applied, postcss config updated, autoprefixer removed.

The in-scope hot-fix `6399bb8` restores `cursor:pointer` for `<button>` elements (Tailwind v4 preflight dropped the implicit cursor). Its commit body explicitly claims "Zero-pixel change — cursor doesn't render in VRT screenshots, so existing baselines remain valid" — so it inherits the cluster decision without independent visual impact.

The out-of-scope hot-fix `fda0b94` (dashboard nonce hydration warning) is Next 16-related per its own commit body ("Next 16 rewrites the nonce attribute on inline <script> tags") and excluded from C6 per the same precedent that excluded `ffc3418` from C4.

**Decision forecast**: ACCEPT with Path C baseline bump. The visual diff between the rescue-tag baseline (pre-cascade) and current main (post-9-cascade) is intentional + acceptable; Path C captures the post-cascade state as the new authoritative baseline. This is the campaign's **first non-NO-OP decision** and consolidates the cumulative cascade visual state.

After /update-docs, the campaign closes: 3 Jira transitions to Done + a no-op test PR confirms VRT stability.

## 5. Architecture Context

- **Touched docs**: `workflow-standards.mdc` (append 1-2 §13.5.2 rows). SCRUM-387 record (replace C6 placeholder + populate Campaign Closure Addendum).
- **Touched plans/records**: this plan + verify + record under `Sprint 14/`.
- **Touched code (NO-OP path)**: none. Path C ACCEPT path auto-commits PNGs only.
- **Tooling consumed**: `git show` (read-only at /develop), `gh workflow run` (at /verify Path C), `gh run watch` (monitor CI), `gh api` (transition Jira if MCP unavailable; primary path is Jira MCP).
- **Branching**:
  - Primary: `feature/SCRUM-396-frontend` in **ai-specs**.
  - Conditional: NO em-ecosystem-code branch (Path C auto-commits PNGs to main via workflow).

## 6. Implementation Steps

### Step 0: Create feature branch (in ai-specs repo)

- **Action**: Branch `feature/SCRUM-396-frontend` from `main` of ai-specs.
- **Implementation**:
  1. Ensure on `main` and clean (modulo concurrent-agent untracked files).
  2. `git checkout -b feature/SCRUM-396-frontend`.

### Step 1: Per-facet audit via git show + grep (read-only)

- **Action**: For commits `939d8b9` + `6399bb8`, capture per-facet evidence.
- **Commands** (run from `em-ecosystem-code/`):
  ```
  git show --stat 939d8b9
  git show --stat 6399bb8
  git show 939d8b9 -- nexacore-dashboard/postcss.config.mjs
  git show 939d8b9 -- nexacore-dashboard/package.json satellites/sat-cristian-garcia/package.json
  git show 939d8b9 -- "nexacore-dashboard/src/app/globals.css" | head -100
  git show 6399bb8 -- "*globals.css"
  grep -rEn "\\boutline-solid\\b|\\b(bg|text)-opacity-[0-9]|oklch\\(" nexacore-dashboard/src/ satellites/sat-cristian-garcia/src/
  ```
- **Per-facet evidence checklist** (6 facets):
  - **Facet 1 (version bump)**: confirm `tailwindcss ^3.4.x → ^4.3.0` in both packages; confirm `autoprefixer` removed.
  - **Facet 2 (config migration)**: confirm `tailwind.config.ts` deleted in both packages; confirm `@theme` blocks present in both `globals.css`; confirm `designTokens` moved to `src/lib/design-tokens.ts`.
  - **Facet 3 (globals.css rewrite)**: confirm ~973 lines changed in dashboard `globals.css`; verify the rewrite uses `@theme` directive blocks per Tailwind 4 official guidance.
  - **Facet 4 (utility renames in 34+19 source files)**: confirm `outline → outline-solid` rename applied; spot-check 2-3 representative files (`ComponentShowcase.tsx`, `TokenInspector.tsx`).
  - **Facet 5 (TS variant revert in 6 files)**: confirm `Button.tsx` variant union types use `outline` (NOT `outline-solid`); confirm consumers (`SegmentedControl`, `ComponentShowcase`, `design-system page`, `PublicNavbar`, `PricingSection`) match.
  - **Facet 6 (cursor:pointer hot-fix `6399bb8`)**: confirm 2 globals.css files have base-layer rule for `cursor: pointer` on enabled buttons + `role="button"`. Confirm commit body's "zero-pixel" claim.
- **Out-of-scope verification**: confirm `fda0b94` commit body explicitly mentions Next 16 (not Tailwind 4) as the cause of the nonce hydration warning. Document the OOS rationale in /verify per AC4.
- **Fail-fast rule**: if any facet's evidence contradicts the commit body's claims, STOP and escalate.

### Step 2: Append C6 row(s) to §13.5.2 audit log

- **File**: `ai-specs/specs/workflow-standards.mdc`
- **Action**: Append one new row to §13.5.2 (after 8 existing). If /verify decides SPLIT, append 2+ rows.
- **Stub row** (decision + rationale filled at /verify after Path C completes):
  ```
  | C6      | SCRUM-396  | 2026-05-XX | 939d8b9 | _to fill_  | _to fill at /verify (Tailwind 3→4 + hot-fix 6399bb8 IN-SCOPE + fda0b94 OUT-OF-SCOPE Next 16-related; 6 facets; Path C baseline bump SHA TBD)_ |
  ```

### Step 3: Stage ai-specs files (no commit)

- **Action**: `git add` only the 2 files affected. Per `feedback_concurrent_agents.md`, stage by explicit path.
- **Files**:
  - `ai-specs/specs/workflow-standards.mdc` (modified — 1 row appended)
  - `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-396_frontend.md` (this file, new)
- Per /develop spec point 10: stage only, do NOT commit.

### Step 4: Confirm em-ecosystem-code untouched

- **Action**: `cd em-ecosystem-code && git status` → expect identical state (concurrent's `tsconfig.json` mod pre-existed).
- **NOTE**: at /develop time, Path C has NOT yet fired. em-ecosystem-code main is unchanged. The PNG-bump auto-commit happens at /verify time.

### Step 4-alt: VRT Gate (Path C — at /verify, NOT /develop)

- **Why Path C is mandatory for C6** (per /enrich-us VRT Gate Decision):
  - Tailwind 4 changes CSS directly — VFC argument unavailable.
  - Rescue-tag baseline predates all cascade commits — establishing post-cascade baseline requires Path C.
  - C5 explicitly deferred its bump to C6 — strategic-defer pattern lands here.
- **Procedure** (at /verify, not /develop — per `feedback_local_first_before_push.md`):
  ```
  # 1. Trigger workflow_dispatch
  gh workflow run visual-regression.yml --ref main \
    --field capture_baseline=true \
    --field baseline_ref=<current-main-sha> \
    --field package=both

  # 2. Monitor (note the run ID from workflow_dispatch output)
  gh run watch <run-id>

  # 3. After completion, capture the auto-committed [skip ci] commit SHA
  git fetch origin main
  git log --oneline origin/main | head -5
  # The top commit should be by github-actions[bot] with [skip ci] and a chore(SCRUM-379) message

  # 4. Document the PNG-bump SHA in §13.5.2 row's Decision column:
  #    "ACCEPT (baseline bump: <png-commit-sha>)"
  ```
- **Verification post-bump**: a no-op test PR against main should compare cleanly against the new baseline. This is part of campaign closure (Step 7).

### Step 5: Doc-drift sweep

- **Action**: Confirm no other docs need update. C6 (NO-OP path) only touches `workflow-standards.mdc`. ACCEPT path additionally touches `em-ecosystem-code/main` (PNGs) but that's by workflow auto-commit, not by ai-specs.

## 6.1 Out-of-Scope Determination for `fda0b94`

Documented as /verify report deliverable per AC4. Reasoning:

- `fda0b94` (dashboard nonce hydration warning suppression) modified 1 file: `nexacore-dashboard/src/app/layout.tsx` (added `suppressHydrationWarning` on a `<script>` element).
- Commit body explicitly: "Next 16 rewrites the nonce attribute on inline <script> tags using the response CSP header at HTML transform time. When `headers().get('x-nonce')` returns null at server-render time (prefetch / first render in dev), the React tree has nonce="" while the browser receives the rewritten nonce, triggering a benign hydration mismatch on this specific attribute."
- This is **Next 16 behavior**, not Tailwind 4. Same precedent as `ffc3418` excluded from C4 (CI/dev tooling out-of-scope) and the consistent OOS pattern across the campaign.
- Decision: `fda0b94` left in main as-is; NOT cascade-adjudicated as part of C6. If anyone wanted retroactive coverage, it would belong to C5 (React/Next) — but C5 is closed and the patch doesn't change a framework version, so practical retroactive inclusion offers no value.

## 6.2 Campaign Closure Plan (executed at /update-docs and after)

Per parent §6 Step 4 final closure procedure:

### Step A: After /update-docs SCRUM-396 commits the record
- SCRUM-387 record's Campaign Closure Addendum (per its own §10 stub) is populated with cross-cluster summary, ALL named patterns inventory (~10-12), and recommendations for next major-version cascade.

### Step B: Manual user-confirmed Jira transitions (per `feedback_no_close_sprints.md`)
1. SCRUM-396 → Done
2. SCRUM-387 → Done (gated: all 6 sub-tickets Done + Closure Addendum populated)
3. SCRUM-383 epic → Done (gated: SCRUM-384/385/386/387 all Done)

### Step C: No-op test PR (post-Path-C)
- Create a no-op PR (e.g., README typo fix) against main.
- Confirm VRT runs cleanly: compares current main against the new post-Path-C baseline → 0 diff.
- This satisfies parent §6 Step 4.2 "Run a no-op test PR to confirm main's VRT is stable".

### Step D: Archive rescue branch
- `rescue/visual-baseline` branch (created in SCRUM-385) stays on origin as historical reference. NOT deleted.

### Step E: Campaign retrospective (optional, recommended)
- 10-12 named patterns accumulated. Write to `ai-specs/specs/workflow-standards.mdc` or a dedicated `patterns.md` reference file. Future cascade audits inherit the playbook.

## 7. Implementation Order

```
Step 0   Create feature/SCRUM-396-frontend branch in ai-specs
Step 1   Per-facet evidence: git show + grep (6 facets, primary + hot-fix)
Step 2   Append C6 stub row to §13.5.2 (1 row; may expand to 2+ on SPLIT)
Step 3   Stage 2 ai-specs files (no commit per /develop spec point 10)
Step 4   Confirm em-ecosystem-code working tree unchanged
         — Step 4-alt VRT Gate Path C runs at /verify (NOT /develop)
Step 5   Doc-drift sweep
         (/develop ends here; /verify executes Path C; /commit ships)

Campaign closure (after /update-docs):
Step A   Populate SCRUM-387 Campaign Closure Addendum
Step B   3× Jira transitions (manual, user-confirmed)
Step C   No-op test PR confirms baseline stability
Step D   Archive rescue branch
Step E   Optional patterns retrospective
```

## 8. Testing Checklist

- [ ] `git show --stat 939d8b9` confirms 82 files.
- [ ] `git show --stat 6399bb8` confirms 2 globals.css files, +17 lines.
- [ ] `tailwind.config.ts` confirmed deleted in both packages.
- [ ] `@theme` blocks present in both `globals.css`.
- [ ] `designTokens` migrated to `src/lib/design-tokens.ts`.
- [ ] Grep verifies `outline-solid` 5 instances + 0 `bg-opacity-*` / `text-opacity-*` legacy + 0 raw `oklch()`.
- [ ] Button.tsx + 5 consumers: TS variant types use `outline` (NOT `outline-solid`).
- [ ] cursor:pointer base-layer rule confirmed in both globals.css.
- [ ] §13.5.2 row appended without modifying existing 8 rows.
- [ ] `fda0b94` confirmed out-of-scope per commit body Next 16 reference.
- [ ] **VRT gate (AC3) Path C executed at /verify** — `gh workflow run visual-regression.yml --field capture_baseline=true` triggered; PNG-commit SHA captured.
- [ ] **No-op test PR (campaign closure)** confirms baseline stability post-bump.

**Regression test checklist**: N/A — docs-only ticket; PNG-commit by workflow is the artifact.

## 9. Error Handling Patterns

N/A. Read-only audit + Path C workflow execution.

If Path C surfaces UNEXPECTED diffs (e.g., routes that visually broke beyond the cursor:pointer + hot-fix coverage), STOP and escalate. Two options:
- ACCEPT regardless (if design team approves the new look) → document explicitly
- SPLIT into per-route sub-clusters (carve broken routes for separate handling)
- REVERT specific portions (firmly out of scope unless catastrophic)

## 10. UI/UX Considerations

C6 is the most UI-relevant cluster of the campaign:

- **Tailwind 4 visual changes are intentional** by design (migration tool + manual fixes shipped this state).
- **Color system**: Tailwind 4 defaults to OKLCH internally. Our source uses CSS variables (no raw `oklch()` calls) so the impact is felt only via theme tokens — which migrated to `@theme` blocks preserving semantic mapping.
- **`outline` utility rename**: `outline` → `outline-solid` is a Tailwind 4 standardization. Visual rendering preserved.
- **Cursor restoration**: hot-fix `6399bb8` ensures `<button>` hover state shows the pointer cursor. Visual fidelity confirmed (cursor doesn't render in VRT screenshots).
- **`@theme` block migration**: theme tokens compile to the same CSS variables as before. Existing class names that consume those variables (`text-content-primary`, `bg-surface-base`, etc.) render identically.
- **Accessibility**: Tailwind 4 preflight changes don't affect ARIA / semantic HTML. No a11y regression.
- **Path C confirms or refutes** the above via pixel comparison. If pixel diff appears: it's the new authoritative reference (baseline bump captures it).

## 11. Dependencies

- Repo access: ai-specs (write), em-ecosystem-code (read-only + Path C workflow_dispatch trigger access).
- Tools: `git`, `gh` CLI (for Path C + monitoring + Jira if API used), optionally `npm run dev` for additional smoke.
- External services: GitHub Actions (visual-regression.yml workflow), Jira MCP (for transition transitions if user delegates).
- Conditional: Path C requires GitHub Actions to be operational on em-ecosystem-code main.

## 12. Notes

- **Documentation language**: English.
- **Local-only develop**: per `feedback_local_first_before_push.md`. Path C remote workflow_dispatch is /verify-or-later territory.
- **Concurrent-agents discipline**: per `feedback_concurrent_agents.md`. Stage by explicit path.
- **Plan immutability after develop start**: per `workflow-standards.mdc` §10.
- **Methodology default**: per-commit `git show --stat` + grep (codified). Path C execution is the new operational step introduced by C6.
- **First non-NO-OP cluster decision**: C6 is expected to ACCEPT (with baseline bump). All prior clusters were ACCEPT-NO-OP. Pattern: when CSS-affecting framework upgrades land, Path C is the formal acceptance mechanism.
- **First cluster bundling a related hot-fix**: `6399bb8` is in-scope of C6. Pattern: post-migration hot-fixes that directly remediate the cluster's changes inherit the cluster decision. Distinguished from `fda0b94` which is unrelated to the cluster's framework (Next 16, not Tailwind 4).
- **Campaign closure ceremonies**: 5 explicit steps (A-E). Pattern: every major cascade campaign should plan its closure explicitly in the last cluster's plan.

## 13. Next Steps After Implementation

- /verify reads §13.5.2 stub row, executes Path C, captures PNG-commit SHA, fills decision + rationale, runs plan compliance.
- /commit opens PR against ai-specs main, squash-merges. The em-ecosystem-code [skip ci] PNG commit landed at /verify time is separate.
- /update-docs:
  1. Writes record file `SCRUM-396_frontend.md` with campaign-closure focus.
  2. Replaces "C6 Tailwind — pending" placeholder in SCRUM-387 record with closure summary.
  3. **Populates Campaign Closure Addendum** in SCRUM-387 record (per its §10 stub): cross-cluster summary, patterns inventory (10-12 named), retrospective recommendations.
  4. Commits + pushes ai-specs changes.
  5. Adds Jira comment to SCRUM-396 + (optionally) to SCRUM-387 closure summary comment.
- **Post-/update-docs campaign closure** (per §6.2 plan):
  - User confirms 3× Jira transitions (SCRUM-396, SCRUM-387, SCRUM-383).
  - User triggers no-op test PR to confirm baseline stability.
  - User decides on optional patterns retrospective.

## 14. Implementation Verification

Final verification checklist (run at /verify):

- **Code Quality**: §13.5.2 row(s) match column layout; markdown parses cleanly.
- **Functionality**: §13.5.2 table now has 9 rows (or more if SPLIT).
- **Testing**: per Step 1 evidence — 6 facets independently confirmed; Path C executed and PNG-commit SHA captured.
- **VRT gate executed**: Path C result documented (PNG-commit SHA in §13.5.2 row).
- **OOS verification**: `fda0b94` documented as OOS with Next 16 reference.
- **Regression**: §13.5 + §13.5.1 prose untouched; existing 8 rows untouched.
- **Integration**: §13.5.2 row references parent SCRUM-387 + child SCRUM-396 + the baseline PNG-commit SHA.
- **Documentation updates completed**: workflow-standards.mdc + SCRUM-396 plan/verify staged at /develop; record + SCRUM-387 placeholder replacement + Campaign Closure Addendum at /update-docs.
- **Campaign closure readiness**: Closure Addendum is fully populated; Jira transitions queued.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 branch `feature/SCRUM-396-frontend` exists on ai-specs.
- [ ] Step 1 per-facet evidence captured for all 6 facets + grep + OOS verification of fda0b94.
- [ ] Step 2 §13.5.2 stub row appended (existing 8 rows untouched).
- [ ] §13.5.2 stub row populated (decision + rationale + PNG-commit SHA) by /verify after Path C.
- [ ] AC3 Path C VRT execution: workflow_dispatch triggered + monitored + PNG-commit SHA captured.
- [ ] AC4 OOS rationale for `fda0b94` documented.
- [ ] Step 3 stage state confirmed.
- [ ] Step 4 em-ecosystem-code clean at /develop end (Path C runs at /verify time).
- [ ] Step 5 doc-drift sweep returns "no other docs affected at /develop".
- [ ] AC6 Campaign Closure Addendum populated in SCRUM-387 record (at /update-docs).
- [ ] No deviations OR all classified per `workflow-standards.mdc` §8.

## Out of scope for this plan

- `fda0b94` (Next 16 nonce hydration) — documented OOS.
- Per-route Tailwind 4 refactors — separate future tickets if needed.
- Bundle-size analysis — out of audit-decision scope.
- Pre-existing tech debt: SCRUM-388, SCRUM-389, SCRUM-392.
- The actual Jira transitions and no-op test PR — those are USER actions post-/update-docs (Campaign Closure Plan §6.2 Steps B-D).
