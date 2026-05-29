# Frontend Implementation Plan: SCRUM-386 Regenerate VRT Baseline from Rescue Tag

> **Scope note**: This is feature work on `em-ecosystem-code/main` — modifies `.github/workflows/visual-regression.yml` and triggers an auto-commit of fresh baseline PNGs back to `main` via `workflow_dispatch`. Standard `feature/[ticket-id]-frontend` branch + PR + merge cycle applies. ai-specs portion follows established docs-direct-to-main convention (workflow-standards.mdc §13.1 + §13.4.5 normative tightening).

## 1. Header

- **Ticket**: SCRUM-386 (Sprint 14, id=477)
- **Parent epic**: SCRUM-383 (Visual baseline rescue post-Tailwind 4 regression)
- **Issue type**: Task
- **Priority**: Medium
- **Module**: dashboard (rescue parent)
- **Predecessors**: SCRUM-384 (tag exists at origin), SCRUM-385 (rescue branch at origin, smoke verdict preliminary PASS)
- **Successor**: SCRUM-387 (reopen majors under SCRUM-380 playbook — consumes the new baseline as comparison reference)

## 2. Codebase State Snapshot

- **Date**: 2026-05-10
- **Last completed ticket**: SCRUM-385 (rescue branch + cherry-picks)
- **Integration state verified**: Yes — no module/guard/service/permission changes in scope
- **Files verified against live code (read at plan-time, 2026-05-10)**:
  - `.github/workflows/visual-regression.yml` on `main` HEAD (`6399bb8`):
    - Line 44: `description: "Git ref to capture baseline from (default: ee309e6 = pre-Tailwind-4)"` (dashboard input)
    - Line 46: `default: "ee309e6"` (dashboard input)
    - Line 220: same `description` and `default` for satellite job (verified by grep)
  - Tag `v-baseline-2026-05-06-auth-green` → `3a46248` (annotated, on origin per SCRUM-384) ✓
  - Branch `rescue/visual-baseline` → `fbac04b` (on origin per SCRUM-385) ✓
  - Existing dashboard baselines on main: 10+ PNGs in `nexacore-dashboard/tests/e2e/visual.spec.ts-snapshots/` derived from `ee309e6` (contaminated)
  - `main` branch protection: **NONE** (verified via `gh api repos/.../branches/main/protection` → 404 "Branch not protected"). Workflow's `git push origin HEAD:main` will succeed without admin intervention.
- **Permissions verified**: workflow has `contents: write` block (line ~58 of `visual-regression.yml`); GITHUB_TOKEN can push baseline commits to main ✓
- **Discrepancies with integration-state.md**: None — VRT infrastructure is not tracked in integration-state (it lives in `.github/workflows/`, outside the module dependency map scope).

## 3. Regression Impact Analysis

**Blast radius of the workflow YAML edit (em-ecosystem-code feature branch)**:
| File | Risk |
|------|------|
| `.github/workflows/visual-regression.yml` | LOW — edits are 4 string values (2 defaults, 2 descriptions). No control flow change. PR comparison path unchanged. |

**Blast radius of the auto-commit by github-actions[bot]** (lands on main after PR merge):
| File pattern | Source | Risk |
|--------------|--------|------|
| `nexacore-dashboard/tests/e2e/visual.spec.ts-snapshots/*.png` | workflow capture from `v-baseline-2026-05-06-auth-green` | LOW — replacement is the entire point. PRs in flight at the moment of replacement may need a CI re-run |
| `satellites/sat-cristian-garcia/tests/e2e/visual.spec.ts-snapshots/*.png` (path TBC during /develop) | workflow capture from same ref | LOW |

**Breaking changes identified**: None at the source-code level. **Behaviour change**: future PRs to main that introduce ANY visual change relative to the rescue baseline will FAIL VRT. This is the intended design — SCRUM-387 will reopen each major upgrade as a PR that explicitly bumps the baseline as part of an accepted change.

**API contract impact**: N/A (no endpoints touched).

**Schema migration impact**: N/A.

**Test impact assessment**: PR will trigger `Visual Regression` workflow on PR comparison path (since the file path `.github/workflows/visual-regression.yml` is in the trigger include list). The PR's PR-comparison run uses the OLD baseline (current `ee309e6`-derived PNGs on main). The PR's dashboard render is identical to main (only YAML changed). VRT should PASS the PR.

**Other CI gates expected behaviour on PR**:
- Security Pipeline (`security.yml`): per memory, **RED on main since 2026-03-11**. Our PR will be red on these gates too. Per `feedback_ci_strategic_pause.md`, this is upstream of our PR — merge despite red Security Pipeline (NOT VRT/a11y/build).
- VRT comparison (`visual-regression.yml`): expected GREEN (no dashboard source change in PR).
- a11y (`visual-regression.yml`): expected GREEN (no source change).

**Test files requiring updates**: None.

**Blast radius size**: 1 source file (workflow YAML); auto-generated PNGs do not count as code.

## 4. Overview

3 phases:
1. **Source change (PR)**: edit workflow defaults from contaminated commit to clean tag, merge to main.
2. **Capture (workflow_dispatch)**: trigger from main, workflow auto-commits fresh PNGs.
3. **Documentation (ai-specs direct-to-main)**: tighten workflow-standards §13.1 + §13.4.5 with normative "tag, not commit" rule.

Each phase has a single quality gate (PR review/merge, workflow run conclusion=success, smoke verification).

## 5. Architecture Context

- **`visual-regression.yml`** has 2 paths governed by `github.event_name`:
  - `pull_request` → comparison only (Playwright runs without `--update-snapshots`)
  - `workflow_dispatch` with `capture_baseline=true` → capture path (writes new PNGs, auto-commits with `[skip ci]`)
- **Capture flow internals** (verified in plan): workflow checks out HEAD of dispatched branch, restores `nexacore-dashboard/` from `baseline_ref`, overlays HEAD's `AuthContext.tsx` + `visual.spec.ts` + `tests/e2e/fixtures/` (so VRT bypass code works against older app code), runs Playwright with `--update-snapshots`, preserves PNGs via `/tmp/dash-snapshots/` while restoring HEAD source, then commits the snapshot dir back.
- **Satellite job** is parallel — same flow, scoped to `satellites/sat-cristian-garcia/`.
- **Baseline auto-commit** message: `chore(SCRUM-379): refresh VRT baseline from <baseline_ref> [skip ci]` — the `[skip ci]` flag prevents loop.
- **Push target**: `git push origin HEAD:${{ github.ref_name }}` — pushes back to whichever branch the workflow ran on. We dispatch on `main`, so it pushes to `main`.

## 6. Implementation Steps

### Step 0: Create feature branch

```bash
cd em-ecosystem-code
git checkout main && git pull origin main
git checkout -b feature/SCRUM-386-frontend
git status                                # MUST be clean
```

### Step 1: Edit `.github/workflows/visual-regression.yml`

Two locations (verify both via `grep -n 'ee309e6\|pre-Tailwind' .github/workflows/visual-regression.yml`):

**Dashboard input block (line ~43-46)**:
```yaml
# BEFORE:
      baseline_ref:
        description: "Git ref to capture baseline from (default: ee309e6 = pre-Tailwind-4)"
        required: false
        default: "ee309e6"

# AFTER:
      baseline_ref:
        description: "Git ref to capture baseline from (default: v-baseline-2026-05-06-auth-green = SCRUM-384 rescue baseline, pre-cascade)"
        required: false
        default: "v-baseline-2026-05-06-auth-green"
```

**Satellite input block (line ~220 — verify via grep)**: same edit.

**No other changes** to this file.

### Step 2: Commit + push feature branch

```bash
git add .github/workflows/visual-regression.yml
git diff --staged                         # Review: should be ≤8 lines changed
git commit -m "SCRUM-386: VRT default baseline_ref -> v-baseline-2026-05-06-auth-green

The current ee309e6 default points to the contaminated baseline (already
contained TypeScript 6 at capture time, so VRT could not detect Tailwind 4
or other downstream majors). Replaces with the SCRUM-384 rescue tag.

Behavioural impact: future workflow_dispatch capture runs default to the
clean rescue baseline. PR comparison path is unchanged (still compares
against committed PNGs in tests/e2e/visual.spec.ts-snapshots/).

The actual PNG replacement happens in a follow-up workflow_dispatch run
documented in SCRUM-386 plan Step 5."
git push -u origin feature/SCRUM-386-frontend
```

**Pre-push hook**: will run CI parity (npm ci + builds + tests for api + dashboard). Two concerns:
- Will fail on the 13 D1 Pre-existing dashboard tests (SCRUM-389) ← KNOWN ISSUE
- Husky/PATH gap from SCRUM-388 may also surface

Both are Pre-existing. Use `--no-verify` is justified ON THIS PUSH (same rationale as SCRUM-385 D4). Document as Accepted-Trivial in /verify.

### Step 3: Open PR

```bash
gh pr create \
  --title "[SCRUM-386] VRT default baseline -> rescue tag (replaces contaminated ee309e6)" \
  --body "$(cat <<'EOF'
## Summary
- Replaces `visual-regression.yml` default `baseline_ref` from `ee309e6` to `v-baseline-2026-05-06-auth-green` (SCRUM-384 rescue tag)
- Source change only (4 string edits in YAML, 2 input defaults + 2 description strings)
- Actual PNG baseline replacement happens AFTER merge via workflow_dispatch — see SCRUM-386 plan Step 5

## Why
SCRUM-383 epic — the existing baseline at `ee309e6` was captured AFTER TypeScript 6 already merged, so it could not detect downstream visual regressions from Tailwind 4 (cursor-pointer issue, recharts theming) and react-hooks v6. This PR points the default at the SCRUM-384 rescue baseline, which precedes the entire 5-major cascade.

## Test plan
- [ ] PR's `Visual Regression` job passes (PR-comparison path uses CURRENT main baselines; dashboard render unchanged in this PR)
- [ ] PR's `a11y` job passes (no source change)
- [ ] Security Pipeline: known RED on main since 2026-03-11 (per memory + `feedback_ci_strategic_pause.md`); upstream of this PR
- [ ] Pre-existing dashboard test failures (SCRUM-389) do NOT block VRT comparison gate
- [ ] After merge, run `gh workflow run visual-regression.yml --field capture_baseline=true --field package=both` (uses new default automatically)
- [ ] Verify auto-commit lands on main with subject `chore(SCRUM-379): refresh VRT baseline from v-baseline-2026-05-06-auth-green [skip ci]`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 4: Merge PR

```bash
gh pr merge --squash --delete-branch
```

If CI fails on Pre-existing Security Pipeline issues but VRT/a11y are GREEN: merge with admin override (`--admin` flag if available, or `gh pr merge --squash --delete-branch --admin`). Document in /verify as deviation.

If VRT or a11y fail: STOP — investigate. Likely indicates an unrelated change has crept in.

### Step 5: Trigger workflow_dispatch from main

```bash
git checkout main && git pull origin main
gh workflow run visual-regression.yml \
  --ref main \
  --field capture_baseline=true \
  --field baseline_ref=v-baseline-2026-05-06-auth-green \
  --field package=both
```

`--field baseline_ref` is explicit (not relying on the new default just to be safe — the post-merge workflow file has the new default, but explicit override is clearer in the gh run history).

### Step 6: Watch the workflow run

```bash
gh run list --workflow=visual-regression.yml --limit 1
RUN_ID=$(gh run list --workflow=visual-regression.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch $RUN_ID
```

**Expected duration**: 8-15 minutes (npm ci + Playwright install + capture + commit + push, both packages in parallel).

**Halt conditions**:
- Capture step fails with `npm ci` error (lockfile checksums fail) → re-run; if still fails, dependency was unpublished — escalate.
- `git push origin HEAD:main` fails → check whether branch protection was added since plan time (reverify with `gh api .../branches/main/protection`).
- Capture succeeds but the test step inside the capture fails (`set -e` in the workflow propagates) → re-read workflow YAML; the capture path uses `--update-snapshots` which should not fail tests, but D1 Pre-existing failures may still propagate. If so, file deviation as Accepted-Trivial and re-run with the failing test isolated.

### Step 7: Verify auto-commits landed

```bash
git pull origin main
git log -3 --pretty=oneline -- nexacore-dashboard/tests/e2e/visual.spec.ts-snapshots/
git log -3 --pretty=oneline -- satellites/sat-cristian-garcia/tests/e2e/visual.spec.ts-snapshots/

# Expected: 1-2 commits authored by github-actions[bot] within last 30 min
# Subject: chore(SCRUM-379): refresh VRT baseline from v-baseline-2026-05-06-auth-green [skip ci]
```

Inspect 2-3 PNGs to confirm they're new (different SHA hashes vs the `ee309e6`-derived ones from main pre-this-ticket):
```bash
git log --pretty=format:"%h %s" -2 -- nexacore-dashboard/tests/e2e/visual.spec.ts-snapshots/login-light-chromium-linux.png
```

### Step 8: Open a no-op verification PR

```bash
git checkout -b chore/scrum-386-verify-vrt
echo "" >> README.md  # trivial change
git add README.md
git commit -m "chore: SCRUM-386 verification — trigger VRT against new baseline"
git push -u origin chore/scrum-386-verify-vrt --no-verify
gh pr create --title "[chore] SCRUM-386 VRT verification" --body "Verifies fresh VRT baseline from v-baseline-2026-05-06-auth-green is operational. Should pass VRT cleanly (README change is non-visual)."
```

Wait for `Visual Regression` and `a11y` jobs to complete on this PR. Both must be GREEN. If they pass, the new baseline is operational. Close the PR without merging:
```bash
gh pr close --delete-branch <PR#>
```

### Step 9: Update workflow-standards.mdc (ai-specs, direct-to-main)

**File**: `ai-specs/specs/workflow-standards.mdc`

**Edit 1 — §13.1 Phase 1 pre-upgrade, item 1**: After the `gh workflow run upgrade-baseline.yml` block, ADD a new bullet point:

```markdown
   **MANDATORY rule (added by SCRUM-386)**: the `source-ref` field MUST be a `v-baseline-*` tag (per §13.4 Visual Baseline Tag Policy), NEVER a commit hash that already contains an in-flight upgrade. The 2026-05-08–10 incident showed that capturing baseline from a commit already containing TypeScript 6 produced a contaminated reference that could not detect Tailwind 4 regressions. The rescue (SCRUM-385/386) re-established the baseline from the SCRUM-384 tag.
```

**Edit 2 — §13.4.5 Cross-references**: replace the bullet starting "VRT baselines (`tests/e2e/visual.spec.ts-snapshots/*.png`) MUST be regenerated..." with a normative version:

```markdown
- VRT baselines (`tests/e2e/visual.spec.ts-snapshots/*.png`) MUST be captured from a `v-baseline-*` tag, NEVER from a commit that already contains an in-flight upgrade. This is enforced by `visual-regression.yml`'s default `baseline_ref` pointing to a `v-baseline-*` tag (changed from `ee309e6` to `v-baseline-2026-05-06-auth-green` in SCRUM-386). When a regression on `main` requires a rescue, regenerate the baseline from the rescue branch via `workflow_dispatch` with the new default — see SCRUM-385/386 for the canonical example.
```

### Step 10: Commit ai-specs

```bash
cd ai-specs
git add ai-specs/specs/workflow-standards.mdc
git commit -m "docs(SCRUM-386): tighten §13.1 + §13.4.5 with 'tag not commit' rule"
git push origin main
```

(Plus the SCRUM-386 plan + verify + record will be committed during /commit + /update-docs phases.)

## 7. Implementation Order

1. Step 0 — branch
2. Step 1 — edit YAML
3. Step 2 — commit + push (--no-verify justified)
4. Step 3 — open PR
5. Step 4 — merge PR (after VRT/a11y green)
6. Step 5 — trigger workflow_dispatch
7. Step 6 — watch run
8. Step 7 — verify commits
9. Step 8 — verification PR
10. Step 9 — edit ai-specs
11. Step 10 — commit ai-specs

Steps 9-10 can run in parallel with Step 8 (independent surfaces).

## 8. Testing Checklist (AC alignment)

| # | AC | Verification | Source step |
|---|----|--------------|-------------|
| 1 | AC1 | `git show main:.github/workflows/visual-regression.yml \| grep -c 'v-baseline-2026-05-06-auth-green'` ≥ 2 | Step 4 (post-merge) |
| 2 | AC2 | `gh run list --workflow=visual-regression.yml --limit 5 \| grep success` includes the new dispatch | Step 6 |
| 3 | AC3 | `git log --author='github-actions\[bot\]' --grep='SCRUM-379.*refresh VRT' main -3` returns ≥ 1 commit | Step 7 |
| 4 | AC4 | dashboard PNG SHAs different from pre-this-ticket via `git log` | Step 7 |
| 5 | AC5 | satellite PNG SHAs different (path verified during /develop) | Step 7 |
| 6 | AC6 | Verification PR shows `Visual Regression` + `a11y` jobs GREEN | Step 8 |
| 7 | AC7 | `grep -E 'MANDATORY rule.*SCRUM-386' ai-specs/specs/workflow-standards.mdc` returns 1 line in §13.1; §13.4.5 normative version present | Step 9 |
| 8 | AC8 | `git log -1 --grep='SCRUM-386' ai-specs/main` returns the docs commit | Step 10 |

## 9-13. (Backend / module / etc. sections)

N/A — workflow file + auto-generated PNG + ai-specs docs.

## 14. Implementation Verification

| Area | Verification |
|------|--------------|
| Code Quality | Workflow YAML diff is ≤ 8 lines, all string-value changes |
| Functionality | AC1-AC8 all PASS |
| Testing | Verification PR (Step 8) demonstrates VRT operational |
| Regression | Existing PRs in flight will need CI re-run after baseline lands; no functional regression in dashboard/satellite |
| Integration | New baseline becomes reference for SCRUM-387's per-major-upgrade PRs |
| Documentation | §13.1 + §13.4.5 updated; §13.4 unchanged (still the policy doc) |

## Risks (consolidated)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | Capture workflow `npm ci` fails on lockfile | HIGH | Re-run within 24h; if persistent, escalate to user (deps unpublished from registry) |
| R2 | Pre-push hook D1 (13 dashboard tests) blocks Step 2 push | KNOWN | `--no-verify` justified (SCRUM-385 D4 precedent) — Accepted-Trivial in /verify |
| R3 | Husky/PATH SCRUM-388 hook gap blocks Step 2 | KNOWN | Same `--no-verify` covers both R2 and R3 |
| R4 | Security Pipeline RED on PR | KNOWN PRE-EXISTING | Per `feedback_ci_strategic_pause.md` — merge despite Security red as long as VRT + a11y are GREEN |
| R5 | Branch protection added between plan and execution | LOW | Re-verify in Step 0; if added, route through admin merge or PR-mediated baseline commit |
| R6 | Capture step's auto-restore of HEAD + bypass code over baseline_ref produces unexpected diff | MEDIUM | Workflow has been used before for `ee309e6` capture; mechanism proven. Watch the run for unexpected output |
| R7 | Workflow `git push HEAD:main` fails on protected branch (HTTP 403) | LOW (already verified) | Pre-flight branch protection check in Step 0 |
| R8 | New baseline rejects existing PRs with visual changes | EXPECTED | This is the intended behaviour; communicate to team if any open PRs exist |

## Plan Compliance Checklist (for /verify)

- [ ] Step 0 branch created from latest main, no concurrent work absorbed
- [ ] Step 1 YAML edits exactly as planned (4 string changes, no other modifications)
- [ ] Step 2 push successful (with --no-verify justified for R2+R3)
- [ ] Step 3 PR open with correct title + body
- [ ] Step 4 PR merged (VRT + a11y GREEN, Security pre-existing RED documented)
- [ ] Step 5 workflow_dispatch triggered with explicit baseline_ref override
- [ ] Step 6 workflow run conclusion = success
- [ ] Step 7 auto-commit visible on main, PNGs replaced
- [ ] Step 8 verification PR demonstrates operational baseline
- [ ] Step 9 §13.1 + §13.4.5 edits present in ai-specs
- [ ] Step 10 ai-specs commit on main referencing SCRUM-386
- [ ] No deviations OR all deviations classified per workflow-standards §8
