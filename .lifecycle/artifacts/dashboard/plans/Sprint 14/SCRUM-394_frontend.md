# Frontend Implementation Plan: SCRUM-394 [SCRUM-387 C3] Audit cascade upgrades — Icons cluster

> **Scope adaptation note**: Audit-decision sub-ticket (precedent: SCRUM-390 C1, SCRUM-391 C2, SCRUM-393 C4). **First cluster with REAL browser-bundle reach.** Single commit `872febb` (SCRUM-375 lucide-react 0→1, dashboard) adjudicated against 3 facets. Per /enrich-us evidence, only ONE icon affected (`Github`, dropped in lucide v1) — replaced by faithful local SVG `GitHubIcon.tsx`. Forecast revised from C4 lessons-learned: **likely NO-OP** (not "likely ACCEPT") because the SVG replacement is faithful by construction (same octocat path data, same dimensions, same `currentColor` inheritance). VRT gate still genuinely required per parent §6 Step 1.4.b — but evidence points to zero visual diff. Filed under `dashboard/`, labeled `_frontend` per parent precedent.

## 1. Header

- **Ticket**: SCRUM-394 (Sprint 14, id=477)
- **Parent**: SCRUM-387 (cascade-audit meta-coordinator)
- **Cluster**: C3 — Icons (1 commit, 3 facets)
- **Issue type**: Subtask
- **Priority**: Medium
- **Predecessors**: SCRUM-390 (C1), SCRUM-391 (C2 + Deferred SCRUM-392), SCRUM-393 (C4 + ffc3418 out-of-scope + residuals→C5)
- **Successor**: C5 sub-ticket (React/Next) — opened after C3 closes per parent §6 Step 3 + §7

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed cluster**: SCRUM-393 (C4 Dependency security) — record committed `7eb28f6`; PR #3 squash `9b30e7e` shipped §13.5.2 row + plan + verify.
- **Integration state verified**: Yes — no em-ecosystem-code module/guard/service/permission state changes anticipated on the expected (NO-OP) path.
- **Files verified against live state**:
  - `em-ecosystem-code/main` git history — `872febb` confirmed present; per-commit content read via `git show --stat 872febb` during /enrich-us. 4 files: dashboard package.json + lock + 1 NEW (`src/components/icons/GitHubIcon.tsx`, 22 lines) + 1 modified (`src/components/auth/OAuthButtons.tsx`, 8 lines).
  - **Grep verification across dashboard + satellite**: 0 lingering `Github` lucide imports (verified via `grep -rEn 'import.*\bGithub\b.*lucide-react|lucide-react.*\bGithub\b'`). All other 63 lucide icons in use (LayoutGrid, Atom, Search, CheckCircle, etc.) are non-brand and unchanged in v1.
  - **`GitHubIcon.tsx` content verified**: 22 lines, SVG with viewBox `0 0 24 24`, `fill="currentColor"`, default size `1em`, `SVGProps<SVGSVGElement>` spread, official GitHub octocat path. Comment: "uses currentColor to match lucide-react pattern" + "Figma uses lucide/github placeholder; always map it to this component in code".
  - **Satellite NOT affected**: `satellites/sat-cristian-garcia` was already on lucide-react ^1.8.0 per commit body; no satellite file in `git show --stat 872febb`.
  - `ai-specs/specs/workflow-standards.mdc` — §13.5.2 has 6 rows on main (4 C1 + 1 C2 + 1 C4) per commit `9b30e7e`.
  - `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` — C4 closure section + lessons committed `7eb28f6`. C3 placeholder still present at line 116 (verified by grep).
- **Discrepancies with integration-state.md**: None.

## 3. Regression Impact Analysis

**Expected path (1× ACCEPT-NO-OP)** — blast radius:
- `ai-specs/specs/workflow-standards.mdc`: +1 row in §13.5.2 (after 6 existing).
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-394_frontend.md`: this file.
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-394_verify.md`: created at /verify.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-394_frontend.md`: created at /update-docs.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md`: replace "C3 Icons — pending" placeholder.
- `em-ecosystem-code`: NO change.
- VRT baseline PNGs: NO change.
- New Jira ticket: NONE in C3 (no Deferred follow-up surfaces).
- **Blast radius size**: 4 ai-specs files; 0 em-ecosystem-code files. Below the >5 file flag.

**Conditional surprise paths**:
- **ACCEPT (visual diff)**: triggered IF VRT gate (Step 4-alt) shows pixel diff against current baseline. Requires `gh workflow run visual-regression.yml --ref main --field capture_baseline=true --field baseline_ref=<current-main-sha> --field package=dashboard`. Auto-commits new baseline PNGs to em-ecosystem-code main with `[skip ci]`. NO source code change either way.
- **REVERT**: triggered IF VRT shows UNINTENTIONAL diff (e.g., GitHubIcon SVG renders incorrectly). Would require restoring `<Github>` from lucide-react — but lucide v1 doesn't have it, so REVERT means rolling back the version bump too. Strongly avoid; would re-introduce dependency security drift since lucide v0.577 had its own transitive vulns.
- **SPLIT**: not applicable to C3 — single commit, single icon, single facet path.

**Test impact assessment**: NO `.spec.ts` modifications by this audit ticket. (`872febb` itself ran 118 dashboard tests at PR #265 merge time — all PASS per commit body.)

## 4. Overview

C3 is the fourth cluster sub-ticket of the SCRUM-387 cascade-audit campaign and the **first with real browser-bundle reach** (vs C1 wrapper, C2 zero source, C4 backend-equivalent). Single commit `872febb` adjudicated against 3 facets:

1. **lucide-react version bump** `^0.577.0 → ^1.14.0` (dashboard only; satellite already on ^1.8.0).
2. **`GitHubIcon.tsx` (NEW)**: 22-line local SVG component replacing the dropped lucide `Github` brand icon. Uses `currentColor` + viewBox `0 0 24 24` + default size `1em` + `SVGProps<SVGSVGElement>` spread — mirrors lucide's API surface.
3. **`OAuthButtons.tsx` swap**: `<Github size={16} className="text-content-primary/50" />` → `<GitHubIcon width={16} height={16} className="text-content-primary/50" />`. Same wrapping, same accent class.

Per /enrich-us evidence + parent §6 Step 1.4.b, **VRT gate is mandatory**. C3 introduces a NEW type of NO-OP evidence to the campaign: **visual-fidelity-by-construction** — the SVG replacement uses the same path data, dimensions, and color inheritance as lucide v0.x's Github icon, so visual rendering should be byte-identical. This is analogous to C1's `ab101f3` wrapper which used WHATWG semantics to argue runtime equivalence.

Confidence: **HIGH** (revised up from "MEDIUM" forecast in C4 lessons-learned, based on /enrich-us evidence). The bundle reach is real but the change is bounded (1 icon, faithful replacement).

## 5. Architecture Context

- **Touched docs**: `workflow-standards.mdc` (append 1 row to §13.5.2). SCRUM-387 record (replace C3 placeholder).
- **Touched plans/records**: this plan + verify + record under `Sprint 14/`.
- **Touched code (NO-OP path)**: none.
- **Tooling consumed**: `git show` (read-only inspection during /develop). Conditionally `gh workflow run visual-regression.yml` IF VRT gate fires at /verify.
- **Branching**:
  - Primary: `feature/SCRUM-394-frontend` in **ai-specs**.
  - Conditional: NO em-ecosystem-code branch even on ACCEPT path (the workflow_dispatch auto-commits the baseline PNGs to em-ecosystem-code main directly with `[skip ci]`).

## 6. Implementation Steps

### Step 0: Create feature branch (in ai-specs repo)

- **Action**: Branch `feature/SCRUM-394-frontend` from `main` of ai-specs.
- **Implementation**:
  1. From `ai-specs/`, ensure on `main` and clean (modulo concurrent-agent untracked files in `auth/audit/...` and `auth/plans/Sprint 14/SCRUM-354_*` — leave alone per `feedback_concurrent_agents.md`).
  2. `git checkout -b feature/SCRUM-394-frontend`.

### Step 1: Per-facet audit via git show + grep (read-only)

- **Action**: For commit `872febb`, capture per-facet evidence. Per SCRUM-390/391/393 lessons, no `npm` gate run against compound main.
- **Commands** (run from `em-ecosystem-code/`):
  ```
  git show --stat 872febb
  git show 872febb -- nexacore-dashboard/package.json
  git show 872febb -- nexacore-dashboard/src/components/icons/GitHubIcon.tsx
  git show 872febb -- nexacore-dashboard/src/components/auth/OAuthButtons.tsx
  grep -rEn "import.*\\bGithub\\b.*lucide-react|lucide-react.*\\bGithub\\b" nexacore-dashboard/src/ satellites/sat-cristian-garcia/src/
  grep -rE "from ['\"]lucide-react['\"]" nexacore-dashboard/src/ satellites/sat-cristian-garcia/src/ | wc -l
  ```
- **Per-facet evidence checklist**:
  - **Facet 1 (version bump)**: confirm `lucide-react` `^0.577.0 → ^1.14.0` in `nexacore-dashboard/package.json`. Confirm satellite untouched.
  - **Facet 2 (GitHubIcon.tsx fidelity)**: read full SVG path data. Compare semantically against lucide v0.577's Github icon path (the official GitHub octocat path is well-known and stable across lucide versions). Confirm dimensions match (`viewBox="0 0 24 24"`), color inheritance matches (`fill="currentColor"`), default size matches (`1em` ~ 16px when font-size is 16px, but call site overrides with explicit `width={16} height={16}`).
  - **Facet 3 (OAuthButtons.tsx swap)**: confirm 1 import line + 4 JSX lines changed. Confirm `className="text-content-primary/50"` preserved unchanged. Confirm wrapping `<Button as="a" variant="outline">` unchanged.
- **Cross-package guard**: confirm satellite has 0 changes (already on lucide v1).
- **Visual fidelity argument**: document the first-principles case for zero visual diff:
  1. The SVG `viewBox` (24x24) matches lucide's standard.
  2. The SVG path is the canonical GitHub octocat (compare against any GitHub brand asset reference).
  3. `fill="currentColor"` makes the rendered color depend on the parent's text color, which is set via `className="text-content-primary/50"` — preserved across the swap.
  4. Explicit `width={16} height={16}` at the call site enforces 16px rendering, identical to old `size={16}`.
  5. Therefore: rendered pixel output should be byte-identical (or near-identical, modulo any browser SVG anti-aliasing variance under same viewBox/path).

### Step 2: Append C3 row to §13.5.2 audit log

- **File**: `ai-specs/specs/workflow-standards.mdc`
- **Action**: Append one new row to §13.5.2 (after 6 existing: 4 C1 + 1 C2 + 1 C4). Do NOT modify existing rows.
- **Stub row** (decision + rationale filled at /verify):
  ```
  | C3      | SCRUM-394  | 2026-05-XX | 872febb | _to fill_  | _to fill at /verify (lucide-react 0→1; 3 facets — version bump / new GitHubIcon SVG / OAuthButtons swap; 1/64 icons affected; visual-fidelity-by-construction; VRT gate result)_ |
  ```

### Step 3: Stage ai-specs files (no commit)

- **Action**: `git add` only the 2 files affected. Per `feedback_concurrent_agents.md`, stage by explicit path.
- **Files**:
  - `ai-specs/specs/workflow-standards.mdc` (modified — 1 row appended)
  - `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-394_frontend.md` (this file, new)
- Per /develop spec point 10: stage only, do NOT commit.

### Step 4: Confirm em-ecosystem-code untouched

- **Action**: `cd em-ecosystem-code && git status` → expect identical state to before /develop began (clean modulo concurrent-agent's `nexacore-dashboard/tsconfig.json` modification, which pre-existed and must not be disturbed).

### Step 4-alt: VRT Gate Decision Tree (mandatory per AC3)

This is the substantive judgment of C3 and the **first time the campaign needs to genuinely consider a non-NO-OP outcome**. Three paths:

#### Path A: First-principles + manual smoke (recommended for NO-OP)

- **Used when**: Step 1's visual fidelity argument is convincing AND a quick manual smoke confirms the rendered button looks right.
- **Procedure**:
  1. From `em-ecosystem-code/`: `cd nexacore-dashboard && npm run dev`.
  2. Navigate to `/login` (where the GitHub OAuth button renders).
  3. Compare the rendered GitHub icon visually against either: (a) the committed baseline PNG `tests/e2e/visual.spec.ts-snapshots/login-*.png`, or (b) a memory of how it looked before — both work given the icon is a single recognizable shape.
  4. Document the smoke in /verify: "Manual smoke at `/login` confirms the GitHubIcon renders as the expected octocat at 16x16 with the muted accent color".
- **Pros**: fast (~10 minutes), local-only (respects /develop scope).
- **Cons**: subjective; not pixel-rigorous.

#### Path B: Local Playwright VRT (intermediate rigor)

- **Used when**: Path A surfaces ambiguity OR confidence requires pixel-level evidence.
- **Procedure**:
  1. From `em-ecosystem-code/`: `cd nexacore-dashboard && npx playwright test tests/e2e/visual.spec.ts --update-snapshots=none`.
  2. Compare the auth/login route's screenshot against the committed baseline.
  3. If no diff → NO-OP confirmed. If diff → ACCEPT path.
- **Pros**: pixel-rigorous; runs locally.
- **Cons**: requires Playwright env setup; the baseline is from the rescue tag (predates `872febb`) so the diff WILL show all cascade effects, not just C3 — same problem as C1 Step 1.

#### Path C: Remote workflow_dispatch (highest rigor, only for ACCEPT)

- **Used when**: a real ACCEPT decision is being made (not NO-OP confirmation).
- **Procedure**: per parent §6 Step 1 ACCEPT path:
  ```
  gh workflow run visual-regression.yml --ref main \
    --field capture_baseline=true \
    --field baseline_ref=<current-main-sha> \
    --field package=dashboard
  ```
  Workflow auto-commits new baseline PNGs to em-ecosystem-code main with `[skip ci]`. Document the baseline PNG commit SHA in the §13.5.2 row.
- **Pros**: authoritative; produces the formal artifact for ACCEPT.
- **Cons**: minutes of CI time; modifies em-ecosystem-code main (out-of-scope for /develop, only run at /verify or post-/commit).

**Recommended path for C3**: Path A. The visual-fidelity-by-construction argument is the same kind of first-principles reasoning that worked for C1's `ab101f3` wrapper (WHATWG semantics). Combined with a 10-minute manual smoke, this gives sufficient evidence for ACCEPT-NO-OP.

If the user prefers stricter evidence: escalate to Path B at /verify time. Path C is reserved for actual ACCEPT decisions.

### Step 5: Doc-drift sweep

- **Action**: Confirm no other docs need update. C3 (NO-OP path) only touches `workflow-standards.mdc`.

## 7. Implementation Order

```
Step 0  Create feature/SCRUM-394-frontend branch in ai-specs
Step 1  Per-facet evidence: git show + grep + visual-fidelity argument (3 facets)
Step 2  Append C3 stub row to §13.5.2 (1 line)
Step 3  Stage 2 ai-specs files (no commit per /develop spec point 10)
Step 4  Confirm em-ecosystem-code working tree unchanged
        — Step 4-alt VRT gate Path A (manual smoke) → recommended for NO-OP
        — Path B (local Playwright) escalation if needed
        — Path C (remote workflow_dispatch) only for actual ACCEPT
Step 5  Doc-drift sweep (NO-OP confirms no other doc impact)
```

## 8. Testing Checklist

- [ ] `git show --stat 872febb` confirms 4 files (1 NEW + 1 modified + 2 package).
- [ ] `GitHubIcon.tsx` SVG path verified as canonical GitHub octocat with viewBox 24x24 + currentColor.
- [ ] `OAuthButtons.tsx` swap preserves `className="text-content-primary/50"` and call-site `width/height` matches old `size={16}`.
- [ ] Grep confirms 0 lingering `Github` lucide imports across dashboard + satellite.
- [ ] §13.5.2 row appended without modifying existing 6 rows.
- [ ] `SCRUM-394_frontend.md` (this file) tracked by git on the new branch.
- [ ] No file changes in `em-ecosystem-code`.
- [ ] **VRT gate (AC3) executed**: Path A manual smoke documented in /verify, OR Path B Playwright result, OR Path C workflow_dispatch result.
- [ ] (only on ACCEPT path) baseline PNG commit SHA recorded in §13.5.2 row.

**Regression test checklist**: N/A.

## 9. Error Handling Patterns

N/A. Read-only audit + 1-row docs append.

If VRT gate (Step 4-alt) shows UNEXPECTED visual diff (e.g., GitHubIcon renders at wrong size or wrong color), STOP and escalate per parent §6 Step 1 decision tree. Do NOT silently force NO-OP.

## 10. UI/UX Considerations

This is the first cluster where UI/UX is genuinely relevant:

- **Icon visual fidelity**: the GitHubIcon SVG must render visually equivalent to the lucide v0.x Github icon. Path data, viewBox, and color inheritance preserve this by construction.
- **Accent color**: `text-content-primary/50` (50% opacity of primary content color) — preserved exactly via `className`.
- **Sizing**: explicit `width={16} height={16}` at call site matches old `size={16}` behavior.
- **Accessibility**: lucide icons are SVG with no inherent a11y attributes. The `<Button as="a">` wrapping provides the accessible name via its text content ("Continue with GitHub"). The icon is decorative. No a11y regression.

## 11. Dependencies

- Repo access: ai-specs (write), em-ecosystem-code (read-only, optional Playwright local run).
- Tools: `git`, optionally `npm run dev` for Path A smoke, optionally `npx playwright` for Path B.
- Conditional: `gh` CLI ONLY if Path C (ACCEPT path) fires.

## 12. Notes

- **Documentation language**: English.
- **Local-only develop**: per `feedback_local_first_before_push.md`. Path C (remote workflow_dispatch) is /verify-or-later territory, NOT /develop.
- **Concurrent-agents discipline**: per `feedback_concurrent_agents.md`. Stage by explicit path.
- **Plan immutability after develop start**: per `workflow-standards.mdc` §10.
- **Methodology default**: per-commit `git show --stat` (codified in C1+C2+C4 lessons).
- **NEW pattern this cluster**: visual-fidelity-by-construction as a third type of NO-OP evidence (alongside bundle-reach analysis and commit-time CI). Add to SCRUM-387 record at /update-docs.
- **First cluster with real browser-bundle reach** — but bounded to 1 icon swap + 22-line SVG component. All other 63 lucide icons unchanged in v1.

## 13. Next Steps After Implementation

- /verify reads §13.5.2 stub row, executes VRT gate (Path A recommended), fills decision + rationale, runs plan compliance.
- /commit opens PR against ai-specs main, squash-merges.
- /update-docs:
  1. Writes record file `SCRUM-394_frontend.md`.
  2. Replaces "C3 Icons — pending" placeholder in SCRUM-387 record with closure summary + lessons for C5 (React/Next — fifth per parent §7).
  3. **No new tech-debt ticket** expected (no Deferred / Risk findings predicted).
  4. Commits + pushes ai-specs changes.
  5. Adds Jira comment to SCRUM-394.
- C5 sub-ticket created only after C3 closes. C5 is the **largest framework jump** of the campaign (Next 14→16 + React 18→19); plan should account for sub-PR work and possibly multi-day timeline.

## 14. Implementation Verification

Final verification checklist (run at /verify):

- **Code Quality**: §13.5.2 row matches column layout; markdown parses cleanly.
- **Functionality**: §13.5.2 table now has 7 rows (4 C1 + 1 C2 + 1 C4 + 1 C3). New row appended after C4.
- **Testing**: per Step 1 evidence — 3 facets independently confirmed; visual-fidelity argument supported by SVG inspection.
- **VRT gate executed**: Path A (or B/C if escalated) result captured.
- **Regression**: §13.5 + §13.5.1 prose untouched; existing 6 rows untouched.
- **Integration**: §13.5.2 row references parent SCRUM-387 + child SCRUM-394.
- **Documentation updates completed**: workflow-standards.mdc + SCRUM-394 plan/verify staged at /develop; record + SCRUM-387 placeholder replacement at /update-docs.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 branch `feature/SCRUM-394-frontend` exists on ai-specs.
- [ ] Step 1 per-facet evidence captured for all 3 facets + grep verification.
- [ ] Step 2 §13.5.2 stub row appended (existing 6 rows untouched).
- [ ] §13.5.2 stub row populated (decision + rationale filled) by /verify.
- [ ] AC3 VRT gate executed via Path A/B/C; result documented in /verify.
- [ ] Step 3 stage state confirmed (2 files staged, no commit).
- [ ] Step 4 em-ecosystem-code clean (NO-OP) OR Path C ACCEPT auto-commits PNGs.
- [ ] Step 5 doc-drift sweep returns "no other docs affected".
- [ ] No deviations OR all classified per `workflow-standards.mdc` §8.

## Out of scope for this plan

- Other clusters: C5 (React/Next, next per parent §7), C6 (Tailwind).
- Bundle-size delta analysis — out of scope for NO-OP-vs-ACCEPT decision.
- Replacing the GoogleIcon (already a project-local SVG, predates this cascade).
- Pre-existing tech debt: SCRUM-388, SCRUM-389, SCRUM-392.
- Any em-ecosystem-code change beyond the conditional Path C baseline auto-commit.
