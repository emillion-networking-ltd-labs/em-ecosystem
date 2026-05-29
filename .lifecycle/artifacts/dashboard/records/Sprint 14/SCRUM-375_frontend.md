# Implementation Record: SCRUM-375 lucide-react 0.x → 1.x (dashboard)

## 2. Summary

Bumped `lucide-react` from `^0.577.0` to `^1.14.0` in `nexacore-dashboard`. Of 64 unique icon imports, only `Github` was affected (removed in v1 — lucide deprecated brand icons). Replaced with a project-local `GitHubIcon` SVG component, mirroring the existing `GoogleIcon` pattern.

- **Scope**: `frontend` (dashboard only — satellite already on lucide 1.8.0)
- **Branch**: `feature/SCRUM-375-lucide-1`
- **Date**: 2026-05-08

## 3. Plan Reference

- Original plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-375_frontend.md`
- Plan was followed: **Partially** — plan anticipated icon renames; reality was 1 icon removal (brand icon). Strategy changed mid-flight from "patch renames" to "create project-local SVG component".

## 4. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| (pending merge) | SCRUM-375: lucide-react 0.x -> 1.x (dashboard) | `package.json` + lock, `src/components/icons/GitHubIcon.tsx` (NEW), `src/components/auth/OAuthButtons.tsx` |

## 5. Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 2/3 | Patch icon renames | Created project-local `GitHubIcon` SVG | Lucide v1 removed `Github` (brand icons deprecated, not renamed) — same pattern as the existing `GoogleIcon.tsx` already in the codebase. | Accepted-Trivial | — |

## 6. Test Results

- Tests: 118/118 passing
- Build: PASS — 19 routes
- Lint: 0 errors / 0 warnings
- Audit: 0 vulnerabilities total

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `Github` import unresolved after lucide bump | HIGH (build-breaking) | Fixed | Project-local SVG icon component |

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-375_frontend.md` | This record (NEW) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-375_verify.md` | Verify report (committed in /verify phase) |
| `ai-specs/specs/workflow-standards.mdc` | §12 Migration backlog row marks SCRUM-375 DONE |

No `frontend-standards.mdc` changes — lucide is a UI library, not a stack pillar.

## 9. Audit Finding Verification

N/A — non-audit ticket.

## 10. Lessons Learned

- The existing `GoogleIcon.tsx` foreshadowed this exact problem: lucide never shipped a Google icon, so the project already had the "project-local brand icon" pattern. Lucide v1 broadened that approach to all brand icons; the codebase only had to apply the existing pattern once more.
- Future brand-icon needs (Microsoft, Apple, etc.) should follow the same pattern: drop a SVG component into `src/components/icons/`.
