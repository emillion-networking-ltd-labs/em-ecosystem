# Implementation Record: SCRUM-384 Tag Last-Known-Good Visual Baseline

## 2. Summary

Created annotated git tag `v-baseline-2026-05-06-auth-green` on `em-ecosystem-code` commit `3a46248` (end of SCRUM-349, last visually-correct trunk state before the 2026-05-08–10 framework-major cascade). Documented the tag policy as new sub-section `§13.4 Visual Baseline Tag Policy` in `workflow-standards.mdc`. Establishes the rollback target for the SCRUM-383 visual baseline rescue epic.

- **Scope**: ops/docs (adapted from `_frontend` template per SCRUM-380 precedent)
- **Branch**: none — tag-only on em-ecosystem-code, docs-only direct-to-main on ai-specs (per `feedback_local_first_before_push.md` + SCRUM-329 Part B / SCRUM-348 Track B precedent)
- **Implementation date**: 2026-05-10

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-384_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-384_verify.md` (verdict: PASS)
- **Plan was followed**: Yes (with 2 lifecycle deviations both classified Accepted-Trivial in `/verify`, plus 1 `/commit`-time deviation classified Pre-existing — see Section 5)

## 4. Commits

| Hash | Repo | Message | Key Artifacts |
|------|------|---------|---------------|
| `4d9d461` (tag SHA) | em-ecosystem-code | `git tag -a v-baseline-2026-05-06-auth-green 3a46248 -m "...DO NOT MOVE..."` | tag pointing at `3a46248c81257bcf9636700f794135ff486ce035` (SCRUM-349 fix, PR #251) |
| `e39368e` | ai-specs | `docs(SCRUM-384): tag policy + lifecycle plan for visual baseline rescue` | `specs/workflow-standards.mdc` (+47 lines §13.4), `changes/dashboard/plans/Sprint 14/SCRUM-384_frontend.md` (plan), `changes/dashboard/plans/Sprint 14/SCRUM-384_verify.md` (verify) |

No commit on em-ecosystem-code (tag is metadata over an existing immutable commit, so no source change to commit).

## 5. Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|------|---------|--------|--------|----------|-----------|
| D1 | Plan Steps 3 & 5 | Push tag + commit ai-specs during `/develop` | Both deferred to `/commit` | `feedback_local_first_before_push.md` rule: `/develop` is local-only; `/commit` does push+PR+merge as one phase. Plan as originally written placed pushes inside `/develop`, violating this rule. Caught at start of `/develop`, plan adapted in-flight. | Accepted-Trivial (per `/verify`) | — |
| D2 | Plan Testing Checklist row #7 | `grep -cE 'SCRUM-383\|385\|386\|387' ≥4` (line count) | All 4 distinct refs verified per-grep loop, but `-c` counts lines (3) not refs. Wording bug in AC; intent met. | Accepted-Trivial (per `/verify`) | — |
| D3 | `/commit` — em-ecosystem-code tag push | `git push origin v-baseline-2026-05-06-auth-green` | Same command + `--no-verify` flag (user-approved bypass) | Pre-push hook (`.husky/pre-push` from SCRUM-370) runs CI parity (npm ci + eslint + build + test:cov for api + dashboard) unconditionally — no skip logic for tag-only pushes. Tag is metadata-only; CI parity validation inapplicable. Hook design predates this ticket. | **Pre-existing** | **SCRUM-388** (created — see below) |

**Classification rationale (D3)**: The bypass itself was Accepted-Trivial (no security impact, technically justified), but the *underlying gap* — pre-push hook lacks tag-push skip logic — is a Pre-existing condition that will recur for every future `v-baseline-*` tag push. Per `/update-docs` rule, Pre-existing creates a Jira ticket so the fix doesn't get lost.

## 6. Test Results

N/A — no functional code changes. Validation was operational (8 testing checklist items in plan, all PASS at `/verify`).

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `.husky/pre-push` runs CI parity (npm ci + eslint + build + test:cov) on tag pushes, blocking metadata-only operations | LOW | **Discovered, not fixed in this ticket** | Documented as deviation D3. Tracked in SCRUM-388 (backlog). Workaround: `--no-verify` for tag pushes (user approval per push). |

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/specs/workflow-standards.mdc` | NEW §13.4 Visual Baseline Tag Policy (47 lines, 5 sub-sections 13.4.1–13.4.5): when to create, naming convention, annotated requirement, immovability rule, cross-references to SCRUM-383/385/386/387 + §13 playbook |

No other technical doc updates required:
- `data-model.md` — N/A (no entity changes)
- `api-spec.yml` — N/A (no endpoint changes)
- `integration-state.md` — N/A (no module/guard/service/permission changes)
- `frontend-standards.mdc` / `backend-standards.mdc` / `audit-standards.mdc` — N/A

## 9. Audit Finding Verification

N/A — SCRUM-384 is not an audit remediation ticket. It is an ops/rescue Task under the SCRUM-383 epic, originating from the 2026-05-08–10 visual-regression incident, not from an `/audit` finding.

## 10. Lessons Learned

**What went well**:
- The `/enrich-us → /plan → /develop → /verify → /commit → /update-docs` lifecycle worked cleanly even for a trivial ops ticket. The discipline caught the plan-time error in placing pushes inside `/develop` (D1) before any irreversible action.
- Pre-tag verification step (3 halt-conditions) prevented the most common tag mistakes (collision, wrong commit, dirty tree). All passed first try.
- Path-scoped staging in ai-specs preserved the concurrent agent's work (audit-2026-05-06T22-44/, SCRUM-354_*.md) untouched per `feedback_concurrent_agents.md`.

**What was harder than expected**:
- The pre-push hook tag-skip gap was not anticipated. Hook design assumes all pushes carry source changes that need CI parity — true for branches, false for annotated tags. Future framework/release tickets should include "verify hook behaviour for the operation type" as a planning consideration.
- The frontend plan template is poorly fit for ops/docs tickets. Many sections (state management, ApiClient, Jest, UI/UX) are forced into "N/A" boilerplate. SCRUM-380 hit the same issue. May be worth a longer-term ticket to define an `ops/docs` scope variant of the template.

**Recommendations for similar tickets**:
- Future `v-baseline-*` tag tickets should reference §13.4 directly in the plan instead of re-deriving the policy.
- Tag-policy enforcement (immovability, annotated-only) is currently manual discipline. If `v-baseline-*` tags get accidentally moved or deleted in the future, consider escalating to a CI check (e.g. GitHub Action that fails any `git push --force` or tag-delete touching `v-baseline-*` refs).
- For ops/docs tickets that don't fit the backend/frontend templates: declare the scope-adaptation note at the top of the plan (as done here) so reviewers don't expect missing template sections.
