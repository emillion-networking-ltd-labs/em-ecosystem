# Frontend Implementation Plan: SCRUM-384 Tag Last-Known-Good Visual Baseline

> **Scope adaptation note**: This is an **ops/docs-only ticket** under the SCRUM-383 visual baseline rescue epic. It is filed under `dashboard/` because the rescue concerns dashboard visual state, and labeled `_frontend` to match the SCRUM-380 (Framework Upgrade Audit Playbook) precedent. Sections that apply only to React/Next.js code work (component trees, ApiClient, Jest tests, etc.) are marked `N/A — ops/docs ticket` with a one-line reason rather than padded with placeholder content.

## 1. Header

- **Ticket**: SCRUM-384 (Sprint 14, id=477)
- **Parent epic**: SCRUM-383 (Visual baseline rescue post-Tailwind 4 regression)
- **Issue type**: Task
- **Priority**: Medium
- **Module**: dashboard (rescue parent), workflow-standards (doc target)

## 2. Overview

Create the immovable rollback target for the SCRUM-383 rescue: an annotated git tag `v-baseline-2026-05-06-auth-green` on commit `3a46248` (last visually-correct trunk state, end of SCRUM-349, 2026-05-06). Document the baseline-tag policy as a new sub-section `§13.4 Visual Baseline Tag Policy` in `workflow-standards.mdc`, extending the SCRUM-380 Framework Upgrade Playbook with the rescue concept.

This ticket is intentionally trivial in code scope (zero files modified in `em-ecosystem-code`, one section appended to `workflow-standards.mdc`). The lifecycle rigor exists to preserve traceability — the same discipline that was missing during 2026-05-08 to 2026-05-10 when 5 majors and 9 Dependabot bumps merged in 3 days without baseline snapshots.

## 3. Architecture Context

- **em-ecosystem-code** (`main` at `6399bb8`, post-Tailwind 4): tag-only operation, no working-tree change, no commit, no PR, no CI run.
- **ai-specs** (`main`): single edit to `ai-specs/specs/workflow-standards.mdc` — new sub-section `§13.4 Visual Baseline Tag Policy` inserted after current §13 Rationale block (before §14 if it exists, or as final §13.X section).
- **Cross-reference target**: `§13.4` will be referenced from SCRUM-385 (rescue branch creation), SCRUM-386 (VRT regeneration), and SCRUM-387 (major-bump reopen).

## 4. Implementation Steps

### Step 0: Branch

**em-ecosystem-code**: NO branch needed. The tag operation does not require a working-tree change. Tagging works on `main` directly with no commit; pushing is `git push origin <tag>` which only adds the tag ref to origin.

**ai-specs**: Per the docs-only adaptation precedent (SCRUM-329 Part B, SCRUM-348 Track B), commit goes directly to `main`. No feature branch needed — the §13.4 addition is a self-contained, non-breaking documentation change with no risk of conflict with other in-flight work.

### Step 1: Pre-tag verification (em-ecosystem-code)

Run from `em-ecosystem-code` working directory on `main`:

```bash
git fetch origin --tags
git tag -l 'v-baseline-*'                    # MUST return empty (no collision)
git log -1 --pretty=oneline 3a46248          # MUST show: 3a46248 ... fix(SCRUM-349): add localStorage fallback for cross-tab auth sync (#251)
git status                                    # MUST be clean (no uncommitted changes)
```

**Halt conditions**: if any of the three checks fails, stop and report. Do NOT proceed to Step 2.

### Step 2: Create annotated tag (em-ecosystem-code)

```bash
git tag -a v-baseline-2026-05-06-auth-green 3a46248 -m "Last visually-correct trunk state. End of SCRUM-349 (cross-tab auth sync, 2026-05-06). Rescue rollback target for SCRUM-383 (visual baseline rescue post-Tailwind 4 regression). DO NOT MOVE: this tag is the immovable reference point for SCRUM-385/386/387."
```

Local verification before push:

```bash
git cat-file -t v-baseline-2026-05-06-auth-green        # MUST return "tag" (annotated, not "commit" which means lightweight)
git rev-parse v-baseline-2026-05-06-auth-green^{commit} # MUST return 3a46248... (full SHA starting with 3a46248)
git tag -l --format='%(refname:short) -> %(objectname:short) (%(taggertype))' 'v-baseline-*'
```

### Step 3: Push tag to origin (em-ecosystem-code)

```bash
git push origin v-baseline-2026-05-06-auth-green
git ls-remote --tags origin v-baseline-2026-05-06-auth-green   # MUST return one line ending in refs/tags/v-baseline-2026-05-06-auth-green
```

### Step 4: Add §13.4 Visual Baseline Tag Policy to workflow-standards.mdc

**File**: `ai-specs/specs/workflow-standards.mdc`

**Insertion point**: after current §13 Rationale block (around line 724, end of §13). Before §14 if one exists, otherwise as the final sub-section of §13.

**Content** (drafted; minor wording polish OK at /develop time):

```markdown
### 13.4 Visual Baseline Tag Policy (MANDATORY)

> Added by SCRUM-384 after the 2026-05-08–10 incident, when 5 framework majors (TS 5→6, ESLint 9→10, Tailwind 3→4, lucide 0→1, react-hooks v6) and 9 Dependabot bumps merged into `main` in 3 days alongside audit FAIL fixes. Visual regressions (cursor:pointer, recharts theming) shipped because the in-flight VRT (SCRUM-379) baseline had been captured AFTER TypeScript 6 was already on `main` — the baseline was contaminated and could not detect Tailwind 4's downstream effects.

#### 13.4.1 When to create a baseline tag

A **visual baseline tag** is an annotated git tag that freezes the last known-good trunk state before a high-risk operation. Create one in any of these situations:

1. Before opening a major-version upgrade ticket under §13 Framework Upgrade Playbook.
2. Before launching a multi-PR remediation campaign (audit fixes, security patches).
3. When a regression is detected on `main` and a rescue branch is needed (this ticket's scenario).
4. At the close of every quarterly release cycle, regardless of upcoming work.

#### 13.4.2 Naming convention

Format: `v-baseline-YYYY-MM-DD-<short-context>`

Examples:
- `v-baseline-2026-05-06-auth-green` (last green before audit, end of auth work)
- `v-baseline-2026-Q2-end` (quarterly snapshot)
- `v-baseline-2026-06-01-pre-react-19` (pre-major-bump snapshot)

`<short-context>` MUST be a kebab-case slug describing the state, not the upcoming work (e.g., `auth-green` not `pre-audit`).

#### 13.4.3 Tag must be annotated

Always use `git tag -a`, never `git tag <name>` (lightweight). Lightweight tags carry no message, no tagger, no timestamp metadata — auditors will reject them as untraceable.

The tag message MUST include:
- The state being captured (one-sentence summary).
- The closing ticket or context that produced this state.
- The rescue/upgrade ticket consuming this tag, if known.
- A literal `DO NOT MOVE` directive.

#### 13.4.4 Tag is immovable

Once pushed to `origin`, a baseline tag MUST NOT be deleted, force-moved, or re-pointed. If a different commit becomes the desired baseline, create a new tag with a new date in the name. The old tag remains as historical evidence.

There is no GitHub branch-protection equivalent for tags in the current setup — discipline is manual. Any reviewer who sees a `git push --force` or `git tag -d` against a `v-baseline-*` tag in a PR description must block.

#### 13.4.5 Cross-references

- §13 Framework Upgrade Playbook consumes baseline tags as the `--baseline-ref` argument to `upgrade-baseline.yml`.
- SCRUM-383 (visual baseline rescue) is the canonical example of a rescue tag in use.
- VRT baselines (`tests/e2e/visual.spec.ts-snapshots/*.png`) MUST be regenerated from the rescue branch when a `v-baseline-*` tag is created in response to a regression — see SCRUM-386.
```

### Step 5: Commit ai-specs (no PR, direct to main per docs-only convention)

```bash
git add ai-specs/specs/workflow-standards.mdc
git commit -m "SCRUM-384: §13.4 Visual Baseline Tag Policy

Document the baseline-tag policy as a new sub-section under §13 Framework
Upgrade Playbook. Establishes naming convention, annotated-tag requirement,
immovability rule, and cross-references to SCRUM-383 (visual baseline rescue).

Tag created in em-ecosystem-code: v-baseline-2026-05-06-auth-green @ 3a46248.

Refs: SCRUM-383, SCRUM-385, SCRUM-386, SCRUM-387"
git push origin main
```

### Step 6: Update technical documentation

Per the lifecycle rule. For SCRUM-384, the documentation update IS the primary deliverable (Step 4). No additional doc updates are required:

- `data-model.md` — N/A (no entity changes)
- `api-spec.yml` — N/A (no endpoint changes)
- `integration-state.md` — N/A (no module dependency changes)
- `frontend-standards.mdc` — N/A (no UI/component pattern changes)
- `audit-standards.mdc` — N/A (Section 6.6 baseline document concept stays distinct from §13.4 tag policy; the two coexist)

`workflow-standards.mdc` is updated as Step 4. `MEMORY.md` (Claude memory) gets a one-line update per the existing SCRUM-383 entry — already done at ticket creation time.

## 5. Implementation Order

1. Step 0 — No branch needed (documented above)
2. Step 1 — Pre-tag verification in em-ecosystem-code
3. Step 2 — Create annotated tag locally
4. Step 3 — Push tag to origin
5. Step 4 — Edit `workflow-standards.mdc` §13.4
6. Step 5 — Commit + push ai-specs to `main`
7. Step 6 — Documentation review (no further changes expected)

## 6. Testing Checklist

This ticket has **no functional code change**, so unit/integration/e2e tests do not apply. The validation is operational:

| # | Check | Expected result |
|---|-------|-----------------|
| 1 | `git tag -l 'v-baseline-*'` (em-ecosystem-code, post Step 2) | `v-baseline-2026-05-06-auth-green` |
| 2 | `git cat-file -t v-baseline-2026-05-06-auth-green` | `tag` (NOT `commit`) |
| 3 | `git rev-parse v-baseline-2026-05-06-auth-green^{commit}` | starts with `3a46248` |
| 4 | `git ls-remote --tags origin v-baseline-2026-05-06-auth-green` | one line, ends in `refs/tags/v-baseline-2026-05-06-auth-green` |
| 5 | `git show v-baseline-2026-05-06-auth-green --stat \| head -20` | shows SCRUM-349 fix commit, includes "DO NOT MOVE" in message |
| 6 | `grep -n '^### 13.4' ai-specs/specs/workflow-standards.mdc` | returns one line (the new sub-section heading) |
| 7 | `grep -c 'SCRUM-383\|SCRUM-385\|SCRUM-386\|SCRUM-387' ai-specs/specs/workflow-standards.mdc` | ≥4 (cross-references) |
| 8 | `git log -1 --oneline ai-specs/specs/workflow-standards.mdc` | shows SCRUM-384 commit on `main` |

## 7. Error Handling Patterns

N/A — ops ticket, no runtime error paths.

## 8. UI/UX Considerations

N/A — no UI surface.

## 9. Dependencies

- `git` (any version supporting annotated tags — universal).
- Network access to `origin` (GitHub) for `git push`.
- Write access to `ai-specs/main` for the doc commit.

No new external libraries, no package.json changes.

## 10. Notes

- **No PR for em-ecosystem-code**: the tag is metadata over an existing immutable commit. There is no branch, no diff, no review surface. PR workflows do not protect tags in the current setup.
- **No PR for ai-specs**: docs-only, direct-to-main pattern matches SCRUM-329 Part B (12 sub-tickets) and SCRUM-348 Track B precedent.
- **Tag is immutable by policy**: §13.4.4 establishes this. Future tickets that need a different commit as baseline must create a *new* tag, not move this one.
- **Out of scope** (deferred / separate tickets):
  - GPG signing of tags (no signing infra yet).
  - GitHub branch-protection-equivalent rules for tags (manual discipline only).
  - Branch creation `rescue/visual-baseline` (SCRUM-385).
  - VRT baseline regeneration (SCRUM-386).
  - Reopening majors under playbook (SCRUM-387).

## 11. Next Steps After Implementation

- Transition SCRUM-384 to **Done** in Jira (manual transition by user — per `feedback_no_close_sprints.md`).
- Unblock SCRUM-385: rescue branch creation can begin once the tag is pushed and §13.4 is on `main`.

## 12. Implementation Verification

| Area | Verification |
|------|--------------|
| Code Quality | No code change — N/A. |
| Functionality | All 8 testing checklist items PASS. |
| Testing | N/A — ops ticket. |
| Integration | Tag is consumable by SCRUM-385/386/387 via `git checkout v-baseline-2026-05-06-auth-green` from any clone after `git fetch --tags`. |
| Documentation | `§13.4` present in `workflow-standards.mdc` on `ai-specs/main`. Cross-references to SCRUM-383/385/386/387 verifiable via grep. |
| Regression | No code in blast radius. The tag itself cannot regress anything (it adds a ref, doesn't change history). |

## 13. Module-Level Planning

N/A — not a NexaCore module change.

## 14. Satellite App Planning

N/A — not a satellite change. The rescue currently targets dashboard; satellite VRT regeneration is in scope of SCRUM-386, not SCRUM-384.

---

## Risks (additional, beyond §10)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | Tag name collision with an existing `v-baseline-*` tag | LOW | Pre-tag verification (Step 1) — already confirmed empty 2026-05-10. |
| R2 | Wrong target commit (typo `3a46248` → different SHA) | LOW | Step 1 verification reads the commit message back; Step 2 verification re-extracts the SHA. |
| R3 | Lightweight tag created accidentally (forgot `-a`) | LOW | Step 2 explicitly uses `-a -m`. Verification check #2 detects this (`git cat-file -t` would return `commit` not `tag`). |
| R4 | Tag accidentally moved later by a future operator | LOW | §13.4.4 immovability rule + literal `DO NOT MOVE` in tag message. No technical enforcement available. |
| R5 | Push fails due to remote permissions | LOW | Verified via `git remote -v` access during Step 1; if it fails, halt and escalate. |

## Plan Compliance Checklist (for /verify)

- [ ] Branch step (Step 0) executed per "no branch needed" rationale
- [ ] Pre-tag verification (Step 1) all 3 commands PASS
- [ ] Tag created with `-a` flag (verified via `cat-file -t` = `tag`)
- [ ] Tag points at `3a46248` (verified via `rev-parse`)
- [ ] Tag pushed to origin (verified via `ls-remote --tags`)
- [ ] §13.4 inserted in `workflow-standards.mdc` after §13 Rationale block
- [ ] §13.4 contains all 5 sub-headings (13.4.1 through 13.4.5)
- [ ] Cross-references to SCRUM-383/385/386/387 present
- [ ] ai-specs commit on `main` references SCRUM-384
- [ ] All 8 testing checklist items PASS
- [ ] No deviations OR deviations documented per workflow-standards.mdc §8
