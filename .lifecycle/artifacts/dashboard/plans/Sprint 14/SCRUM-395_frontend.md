# Frontend Implementation Plan: SCRUM-395 [SCRUM-387 C5] Audit cascade upgrades — React/Next cluster

> **Scope adaptation note**: Audit-decision sub-ticket (precedent: SCRUM-390 C1, SCRUM-391 C2, SCRUM-393 C4, SCRUM-394 C3). Single commit `6bdd387` (Next 14.2 → 16.2.6 + React 18 → 19.2.6, dashboard + satellite) decomposed into 5 facets. **Largest commit by file count (14)** but **smallest production-source impact (1 file, 2 lines)**. Per /enrich-us evidence, sub-PR pattern did NOT trigger (`6bdd387` is the sole related commit on main). Forecast revised from C3 lessons-learned: **MEDIUM-HIGH confidence** (was MEDIUM); **likely ACCEPT-NO-OP** via visual-fidelity-by-construction (was "likely ACCEPT"). Reuses VFC argument pattern from C3 (analogous to C1's WHATWG semantic-equivalence): async-await wrapping is server-side timing, not DOM output. **Cures C4 residuals** (1 next direct HIGH + 1 postcss transitive MODERATE). Filed under `dashboard/`, labeled `_frontend` per parent precedent.

## 1. Header

- **Ticket**: SCRUM-395 (Sprint 14, id=477)
- **Parent**: SCRUM-387 (cascade-audit meta-coordinator)
- **Cluster**: C5 — React/Next (1 commit, 5 facets)
- **Issue type**: Subtask
- **Priority**: Medium
- **Predecessors**: SCRUM-390 (C1), SCRUM-391 (C2 + Deferred SCRUM-392), SCRUM-393 (C4 + ffc3418 OOS + residuals→C5), SCRUM-394 (C3 + visual-fidelity-by-construction precedent)
- **Successor**: C6 (Tailwind, last per parent §7) — opened after C5 closes

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed cluster**: SCRUM-394 (C3 Icons) — record committed `ec05291`; PR #4 squash `1bb0d5d` shipped §13.5.2 row + plan + verify.
- **Integration state verified**: Yes — no em-ecosystem-code module/guard/service/permission state changes anticipated on the expected (NO-OP) path.
- **Files verified against live state**:
  - `em-ecosystem-code/main` git history — `6bdd387` confirmed present; per-commit content read via `git show --stat 6bdd387` during /enrich-us. 14 files across 6 categories. **Production source: 1 file (`nexacore-dashboard/src/app/layout.tsx`), 2 lines** (function → async function + headers() → await headers()).
  - **Sub-PR search**: confirmed via cascade inventory grep — `6bdd387` is the only commit related to Next/React migration on main since rescue tag. The hypothetical "fda0b94 nonce" reference in parent §9 R2 did NOT manifest.
  - **C4 residuals cure**: commit body claims "0 prod-only vulns in both packages". To be verified at /develop via `npm audit --omit=dev` against current main if accessible without disturbing concurrent state.
  - **Grep verification across dashboard + satellite**: only `layout.tsx` uses `next/headers` async API (verified during /enrich-us). 0 other Next 15+ async migrations needed (no `cookies()`, no `params: Promise<...>`, no `searchParams: Promise<...>`).
  - `ai-specs/specs/workflow-standards.mdc` — §13.5.2 has 7 rows on main (4 C1 + 1 C2 + 1 C4 + 1 C3) per commit `1bb0d5d`.
  - `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md` — C3 closure section + lessons committed `ec05291`. C5 placeholder still present at line 120 (verified by grep).
- **Discrepancies with integration-state.md**: None.

## 3. Regression Impact Analysis

**Expected path (1× ACCEPT-NO-OP via VFC)** — blast radius:
- `ai-specs/specs/workflow-standards.mdc`: +1 row in §13.5.2 (after 7 existing).
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_frontend.md`: this file.
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_verify.md`: created at /verify.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-395_frontend.md`: created at /update-docs.
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-387_frontend.md`: replace "C5 React/Next — pending" placeholder.
- `em-ecosystem-code`: NO change.
- VRT baseline PNGs: NO change (Path A recommended; baseline bump deferred to C6).
- New Jira ticket: NONE in C5 (no Deferred follow-up surfaces).
- **Blast radius size**: 4 ai-specs files; 0 em-ecosystem-code files. Below the >5 file flag.

**Conditional surprise paths**:
- **ACCEPT (Path C, baseline bump)**: triggered IF /verify confidence requires pixel-rigorous evidence. Auto-commits new baseline PNGs to em-ecosystem-code main with `[skip ci]`. The §13.5.2 row's Decision column would say "ACCEPT (baseline bump SHA: <commit>)". **Strategic note**: this should be deferred to C6 if possible — bumping the baseline twice (once for C5, once for C6) is wasteful when C6 is the visual heavyweight that will require a bump regardless.
- **REVERT**: firmly OUT — would re-introduce 5 next CVEs that were the original motivation for the migration. Only triggered if a critical functional regression surfaces (extremely unlikely for a 2-line async migration).
- **SPLIT**: not applicable. Single commit, single source-shipping facet.

**Test impact assessment**: NO `.spec.ts` modifications by this audit ticket. (`6bdd387` itself ran 118 dashboard tests at PR #262 merge time — all PASS per commit body.)

## 4. Overview

C5 is the fifth cluster sub-ticket of the SCRUM-387 cascade-audit campaign and the **largest framework jump** (Next 14→16 + React 18→19) — but with the **smallest production-source delta** (1 file, 2 lines). The /enrich-us evidence dramatically narrowed the scope vs the C3 lessons-learned forecast: no sub-PR pattern, no multi-day timeline, no compound source migrations. The cluster is bounded to one mechanical async-headers migration in `layout.tsx`, plus 4 facets of forced infrastructure changes (lint flat config, tsconfig auto-rewrite, lint script swap, satellite Turbopack config) that were already self-classified as Accepted-Trivial in the original SCRUM-364 verify report.

The visual-fidelity-by-construction (VFC) argument introduced by C3 applies cleanly to C5's `layout.tsx` async migration: `await headers()` resolves to the same Headers object the sync API previously returned; the surrounding JSX tree (html/body wrapping with the CSP nonce string injected) is byte-identical. Confidence: **MEDIUM-HIGH** (revised up from C3 lessons' MEDIUM forecast based on /enrich-us evidence).

C5 also **cures C4 residuals**: 1 next direct HIGH (Image Optimizer DoS + 4 CVEs) + 1 postcss transitive MODERATE — both eliminated per commit body. AC5 verifies this.

## 5. Architecture Context

- **Touched docs**: `workflow-standards.mdc` (append 1 row to §13.5.2). SCRUM-387 record (replace C5 placeholder).
- **Touched plans/records**: this plan + verify + record under `Sprint 14/`.
- **Touched code (NO-OP path)**: none.
- **Tooling consumed**: `git show` (read-only inspection during /develop). Conditionally `gh workflow run visual-regression.yml` IF Path C fires at /verify.
- **Branching**:
  - Primary: `feature/SCRUM-395-frontend` in **ai-specs**.
  - Conditional: NO em-ecosystem-code branch even on Path C ACCEPT (workflow_dispatch auto-commits the baseline PNGs to em-ecosystem-code main directly with `[skip ci]`).

## 6. Implementation Steps

### Step 0: Create feature branch (in ai-specs repo)

- **Action**: Branch `feature/SCRUM-395-frontend` from `main` of ai-specs.
- **Implementation**:
  1. From `ai-specs/`, ensure on `main` and clean (modulo concurrent-agent untracked files in `auth/audit/...` and `auth/plans/Sprint 14/SCRUM-354_*` — leave alone per `feedback_concurrent_agents.md`).
  2. `git checkout -b feature/SCRUM-395-frontend`.

### Step 1: Per-facet audit via git show + grep (read-only)

- **Action**: For commit `6bdd387`, capture per-facet evidence. Methodology: per-commit `git show --stat` + grep (codified in C1-C4 lessons).
- **Commands** (run from `em-ecosystem-code/`):
  ```
  git show --stat 6bdd387
  git show 6bdd387 -- nexacore-dashboard/src/app/layout.tsx
  git show 6bdd387 -- nexacore-dashboard/package.json satellites/sat-cristian-garcia/package.json
  git show 6bdd387 -- nexacore-dashboard/eslint.config.mjs satellites/sat-cristian-garcia/eslint.config.mjs
  git show 6bdd387 -- nexacore-dashboard/tsconfig.json satellites/sat-cristian-garcia/tsconfig.json satellites/sat-cristian-garcia/next.config.mjs
  grep -rEn "from ['\"]next/headers['\"]|await headers\\(\\)|await cookies\\(\\)|params: Promise<|searchParams: Promise<" nexacore-dashboard/src/ satellites/sat-cristian-garcia/src/
  ```
- **Per-facet evidence checklist**:
  - **Facet 1 (framework version bumps)**: confirm next ^14.2.35→^16.2.6, react/react-dom ^18.3.1→^19.2.6, @types/react/dom 18→19, eslint-config-next 14→16, eslint 8→9 in BOTH packages.
  - **Facet 2 (`layout.tsx` async)**: confirm 2-line change. Verify `headers()` → `await headers()` is the only semantic-shape change (function `async` keyword is mandatory enabler). Capture VFC argument:
    - async/await wrapping: server-side timing only
    - `Headers` object identity: same `.get("x-nonce")` semantics
    - JSX return: same `<html>...</html>` tree with same nonce attribute
    - DOM output: byte-identical
  - **Facet 3 (lint flat-config rewrite)**: confirm both `.eslintrc.json` deleted + both `eslint.config.mjs` NEW. Compare semantic intent (extends `next/core-web-vitals + next/typescript`).
  - **Facet 4 (tsconfig auto-rewrite + lint scripts)**: confirm `target → ES2017`, `jsx → react-jsx` in both `tsconfig.json`. Confirm package.json `lint` scripts swap from `next lint` to direct `eslint` (because Next 16 removed `next lint`).
  - **Facet 5 (satellite next.config)**: confirm `turbopack: {}` added (Next 16 Turbopack-default compat). Webpack block retained.
- **C4 residuals cure verification (AC5)**: confirm commit body claim "0 prod-only vulns in both packages" by reading the body's "Audit dashboard: 0 prod-only vulns" + "Audit satellite: 0 vulnerabilities total" lines. Direct `npm audit --omit=dev` re-run against current main is OPTIONAL (would require `npm install` on a possibly-dirty working tree; Path A recommendation is to trust the commit-time CI evidence).
- **Cross-cluster check**: confirm dashboard + satellite both upgraded in lockstep (Next/React mandates aligned versions).
- **Fail-fast rule**: if any facet's evidence contradicts the commit body's claims (e.g., a non-`layout.tsx` source file appears in the diff, or `npm audit` shows residual high vulns), STOP and escalate to parent §6 Step 1 decision tree.

### Step 2: Append C5 row to §13.5.2 audit log

- **File**: `ai-specs/specs/workflow-standards.mdc`
- **Action**: Append one new row to §13.5.2 (after 7 existing). Do NOT modify existing rows.
- **Stub row** (decision + rationale filled at /verify):
  ```
  | C5      | SCRUM-395  | 2026-05-XX | 6bdd387 | _to fill_  | _to fill at /verify (Next 14→16 + React 18→19; 5 facets — versions / layout.tsx async / lint flat / tsconfig+scripts / satellite next.config; sub-PR pattern NOT triggered; C4 residuals cured; VRT path TBD)_ |
  ```

### Step 3: Stage ai-specs files (no commit)

- **Action**: `git add` only the 2 files affected. Per `feedback_concurrent_agents.md`, stage by explicit path.
- **Files**:
  - `ai-specs/specs/workflow-standards.mdc` (modified — 1 row appended)
  - `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_frontend.md` (this file, new)
- Per /develop spec point 10: stage only, do NOT commit.

### Step 4: Confirm em-ecosystem-code untouched

- **Action**: `cd em-ecosystem-code && git status` → expect identical state to before /develop began (clean modulo concurrent-agent's `nexacore-dashboard/tsconfig.json` modification, which pre-existed and must not be disturbed).

### Step 4-alt: VRT Gate Decision Tree (mandatory per AC3)

Same 3 paths as C3 (SCRUM-394) with C5-specific recommendations:

#### Path A: VFC + manual smoke (RECOMMENDED for C5)

- **Used when**: Step 1's VFC argument is convincing AND a quick manual smoke confirms the rendered layout/nonce works.
- **Procedure**:
  1. From `em-ecosystem-code/`: `cd nexacore-dashboard && npm run dev` (Turbopack-default mode now; ensure it boots).
  2. Navigate to `/login` (or any route — root layout wraps everything).
  3. Verify the page renders without hydration errors / CSP violations / console errors. Check `<html>` element has the `nonce` attribute set on inline styles/scripts.
  4. Document the smoke in /verify: "Manual smoke at `/login` confirms the async-headers migration produces the same SSR-rendered HTML tree with the CSP nonce attribute correctly populated".
- **Pros**: fast (~10 minutes), local-only.
- **Cons**: subjective; not pixel-rigorous.

#### Path B: Local Playwright VRT (intermediate rigor)

- **Used when**: Path A surfaces ambiguity OR the user wants pixel evidence.
- **Procedure**: `cd nexacore-dashboard && npx playwright test tests/e2e/visual.spec.ts` against current baseline.
- **Cons**: baseline is rescue-tag-based (predates 6bdd387 + 939d8b9 Tailwind 4 + ...) — diff WILL show all cascade effects compounded, not isolated C5. Same isolation problem as prior clusters.

#### Path C: Remote workflow_dispatch baseline bump (formal ACCEPT)

- **Used when**: a real ACCEPT decision is being made. **NOT recommended for C5** — see strategic note below.
- **Procedure**: per parent §6 Step 1 ACCEPT path:
  ```
  gh workflow run visual-regression.yml --ref main \
    --field capture_baseline=true \
    --field baseline_ref=<current-main-sha> \
    --field package=both
  ```
  Workflow auto-commits new baseline PNGs to em-ecosystem-code main with `[skip ci]`. Document the baseline PNG commit SHA in the §13.5.2 row.

#### Strategic recommendation: Path A + defer baseline bump to C6

C5's production-source change is bounded (2 lines, async-only) and React 19 + Next 16 default rendering is unlikely to introduce subtle diffs without further code changes. The VFC argument is strong (analogous to C3 + C1).

**Bumping the baseline twice (once for C5, once for C6) is wasteful** when C6 (Tailwind 4) is the visual heavyweight that will REQUIRE a bump regardless. C5's NO-OP-via-VFC is defensible and avoids redundant CI operations.

**If /verify disagrees**: escalate to Path B for local pixel evidence; Path C only as last resort (preserves "single bump at C6" strategy).

### Step 5: Doc-drift sweep

- **Action**: Confirm no other docs need update. C5 (NO-OP path) only touches `workflow-standards.mdc`.

## 7. Implementation Order

```
Step 0  Create feature/SCRUM-395-frontend branch in ai-specs
Step 1  Per-facet evidence: git show + grep + VFC argument (5 facets)
Step 2  Append C5 stub row to §13.5.2 (1 line)
Step 3  Stage 2 ai-specs files (no commit per /develop spec point 10)
Step 4  Confirm em-ecosystem-code working tree unchanged
        — Step 4-alt VRT gate Path A (VFC + manual smoke) → recommended
        — Path B (local Playwright) escalation if needed
        — Path C (remote workflow_dispatch) DEFERRED to C6 by default
Step 5  Doc-drift sweep (NO-OP confirms no other doc impact)
```

## 8. Testing Checklist

- [ ] `git show --stat 6bdd387` confirms 14 files across 6 categories.
- [ ] `layout.tsx` change verified as 2-line async migration (function + headers() → await headers()).
- [ ] Grep confirms 0 OTHER Next 15+ async API usages in dashboard/satellite (no cookies, no params Promise, no searchParams Promise).
- [ ] dashboard + satellite package.json: next/react/types upgrades confirmed in both.
- [ ] Both eslint.config.mjs NEW; both .eslintrc.json deleted.
- [ ] Both tsconfig.json: target ES2017, jsx react-jsx (Next 16 mandate confirmed).
- [ ] Satellite next.config.mjs: turbopack: {} added.
- [ ] §13.5.2 row appended without modifying existing 7 rows.
- [ ] `SCRUM-395_frontend.md` (this file) tracked by git on the new branch.
- [ ] No file changes in `em-ecosystem-code`.
- [ ] **VRT gate (AC3) executed**: Path A documented in /verify with VFC argument + manual smoke evidence.
- [ ] **AC5 C4 residuals cure**: documented in /verify (commit body claim accepted as evidence; OR re-verified via npm audit if practical).

**Regression test checklist**: N/A.

## 9. Error Handling Patterns

N/A. Read-only audit + 1-row docs append.

If VRT gate (Step 4-alt) shows UNEXPECTED visual diff (e.g., layout/nonce not rendering correctly, or React 19 hydration errors in console), STOP and escalate per parent §6 Step 1 decision tree. Do NOT silently force NO-OP.

## 10. UI/UX Considerations

- **Layout SSR**: `RootLayout` is now async. Next 15+ requires this for `await headers()`. The async wrap doesn't change DOM output but DOES change the SSR rendering pipeline timing — ensure no race conditions in client-side hydration.
- **CSP nonce**: still injected via `headers().get("x-nonce")` (now async). The nonce attribute on inline `<style>` / `<script>` tags must continue to be applied — verify via DOM inspection during manual smoke.
- **React 19 default rendering**: subtle changes in form-element default styles, hydration timing, Suspense fallbacks. None of these activate without explicit code adoption — manual smoke should NOT see visual regressions in existing routes.
- **Turbopack default**: dashboard and satellite now use Turbopack as the dev bundler. Build output (production) is the same; dev experience may differ slightly (faster hot reloads, different log format). NOT a visual concern.
- **Accessibility**: no a11y attributes changed. React 19 aria handling is backward-compatible.

## 11. Dependencies

- Repo access: ai-specs (write), em-ecosystem-code (read-only, optional manual smoke).
- Tools: `git`, optionally `npm run dev` for Path A smoke.
- Conditional: `gh` CLI ONLY if Path C fires (NOT recommended for C5).

## 12. Notes

- **Documentation language**: English.
- **Local-only develop**: per `feedback_local_first_before_push.md`. Path C remote workflow_dispatch is /verify-or-later territory.
- **Concurrent-agents discipline**: per `feedback_concurrent_agents.md`. Stage by explicit path.
- **Plan immutability after develop start**: per `workflow-standards.mdc` §10.
- **Methodology default**: per-commit `git show --stat` + grep + VFC (codified in C1-C4 lessons).
- **First cluster to defer baseline bump strategically**: C5 documents the "wait for C6 to consolidate" reasoning. Pattern available for future cascades where multiple consecutive clusters affect rendering.
- **Largest commit by file count, smallest source impact**: 14 files but only 1 src/ file (2 lines). Pattern: framework cascades often have lots of infrastructure files (configs, types, locks) that are mechanical migrations vs minimal application code touched.

## 13. Next Steps After Implementation

- /verify reads §13.5.2 stub row, executes VRT gate (Path A recommended), fills decision + rationale, runs plan compliance, verifies AC5 C4 residuals cure claim.
- /commit opens PR against ai-specs main, squash-merges.
- /update-docs:
  1. Writes record file `SCRUM-395_frontend.md`.
  2. Replaces "C5 React/Next — pending" placeholder in SCRUM-387 record with closure summary + lessons for C6 (Tailwind — last cluster).
  3. **No new tech-debt ticket** expected (no Deferred / Risk findings predicted).
  4. Commits + pushes ai-specs changes.
  5. Adds Jira comment to SCRUM-395.
- C6 sub-ticket created only after C5 closes. C6 is the **visual heavyweight** — Tailwind 4 shipped the regressions that triggered the SCRUM-383 epic. Plan should account for actual ACCEPT-with-baseline-bump (Path C) at C6 time.

## 14. Implementation Verification

Final verification checklist (run at /verify):

- **Code Quality**: §13.5.2 row matches column layout; markdown parses cleanly.
- **Functionality**: §13.5.2 table now has 8 rows (4 C1 + 1 C2 + 1 C4 + 1 C3 + 1 C5).
- **Testing**: per Step 1 evidence — 5 facets independently confirmed; VFC argument supported by `layout.tsx` 2-line inspection.
- **VRT gate executed**: Path A result captured; Path B/C not chosen with documented rationale.
- **AC5 C4 residuals cure**: documented in /verify.
- **Regression**: §13.5 + §13.5.1 prose untouched; existing 7 rows untouched.
- **Integration**: §13.5.2 row references parent SCRUM-387 + child SCRUM-395.
- **Documentation updates completed**: workflow-standards.mdc + SCRUM-395 plan/verify staged at /develop; record + SCRUM-387 placeholder replacement at /update-docs.

---

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 branch `feature/SCRUM-395-frontend` exists on ai-specs.
- [ ] Step 1 per-facet evidence captured for all 5 facets + grep verification + VFC argument.
- [ ] Step 2 §13.5.2 stub row appended (existing 7 rows untouched).
- [ ] §13.5.2 stub row populated (decision + rationale filled) by /verify.
- [ ] AC3 VRT gate executed via Path A; result documented in /verify.
- [ ] AC5 C4 residuals cure verified in /verify.
- [ ] Step 3 stage state confirmed (2 files staged, no commit).
- [ ] Step 4 em-ecosystem-code clean (NO-OP) OR Path C fires (rare).
- [ ] Step 5 doc-drift sweep returns "no other docs affected".
- [ ] No deviations OR all classified per `workflow-standards.mdc` §8.

## Out of scope for this plan

- C6 (Tailwind, last cluster per parent §7).
- Bundle-size delta analysis.
- SCRUM-377 (react-hooks v6 rules) — already C1 ACCEPT-NO-OP.
- SCRUM-378 (frontend ESLint deferred from C1) — separate.
- Pre-existing tech debt: SCRUM-388, SCRUM-389, SCRUM-392.
- Any em-ecosystem-code change (the conditional Path C baseline auto-commit is deferred to C6 by recommendation).
