# Implementation Record: SCRUM-328 Badge overlay variant + BeforeAfterSlider component

## Summary

Added a new `overlay` variant to the `Badge` UI Core component and created a new `BeforeAfterSlider` molecule component for image comparison, both documented in `ComponentShowcase` and registered in the design-system catalog. Delivered as dashboard-only work; satellite consumption deferred to SAT01-1 integration.

- **Scope**: frontend (dashboard UI Core only)
- **Branch**: `feature/SCRUM-328-frontend`
- **Implementation date**: 2026-04-24

## Plan Reference

- Original plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-328_frontend.md`
- Plan was followed: Partially
  - Dashboard portion (Steps 0–4 in the adjusted plan) implemented
  - Satellite portion (original Part C, Steps 5–8 of the first plan draft) deferred per governance decision: `sat-cristian-garcia/` is untracked in `main`, so workflow-standards' "branch from main only" rule prevents doing satellite work on this ticket's branch. Scope adjustment documented in the plan itself (2026-04-24 note).

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `3559bdc` | SCRUM-328: Add Badge overlay variant + BeforeAfterSlider component in UI Core | Badge.tsx, BeforeAfterSlider.tsx (new), ComponentShowcase.tsx, component-registry.ts, design-system/page.tsx, em-wordmark-black.png (new), em-wordmark-white.png (new) |

**Merge status**: Fast-forward merged to `main` on 2026-04-24. Local + remote feature branch `feature/SCRUM-328-frontend` deleted. PR [#225](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/225) auto-closed by branch deletion.

**Pre-push checks**: 1032 backend tests passed (69 suites), nest build compiled clean. Pre-commit hook ran Prettier (auto-formatted 5 files), commit on second attempt succeeded.

**Ai-specs artifacts** (separate repo — not part of this commit, may be committed separately in the ai-specs repo):
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-328_frontend.md` (scope adjustment)
- `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-328_verify.md` (from `/verify`)
- `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-328_frontend.md` (this file)

## Deviations from Plan

Classifications imported from `SCRUM-328_verify.md` — not reclassified here.

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 1 | `bg-black/60 text-white backdrop-blur-sm` | `bg-surface-inverse text-content-inverse border border-border-components backdrop-blur-sm` | User iterated aesthetic twice: first to theme-aware tokens, then to primary-button style | Accepted-Trivial | — |
| 3 | Wrap overlay row in dark gradient backdrop tile | Render overlay like other variants (no wrapper) | User requested simplification after first iteration | Accepted-Trivial | — |
| 4 | Register `BeforeAfterSliderShowcase` in `AtomShowcase` | Registered in `MoleculeShowcase` (line 3210) | Atomic-design correct category — image-comparison is compound, not atomic. Also aligns with `componentRegistry` classification | Accepted-Trivial | — |
| 4 | Assets: placeholder/stand-in references | Generated `em-wordmark-black.png` + `em-wordmark-white.png` via ffmpeg `negate` | User requested EMILLION logotype B&W for the demo | Accepted-Trivial | — |
| 4 | (Not in plan) | Added catalog registration: `componentRegistry` entry, `componentToSection` mapping, Badge description updated | Plan missed the catalog view — user surfaced the gap during review | Accepted-Trivial | — |
| 5 | `npm run build` passes clean | `✓ Compiled successfully` (SCRUM-328 code), but full lint stage fails on pre-existing `Tooltip.tsx:16` (`@typescript-eslint/no-explicit-any` rule missing from ESLint config) | Pre-existing on main — verified in `/verify` with a clean checkout comparison | Pre-existing | Recommended tech debt ticket (not this ticket) — user decision |
| 6 | Manual QA | Pending user action | Requires dev server + human interaction | N/A (natural post-verify step) | — |
| 7 | Update `ui-design-system.md` | Deferred — proposed changes below, awaiting user approval | Memory preference: architecture doc edits require explicit user approval | Deferred | Handled by this `/update-docs` run (see Part 3 below) or separate ticket |

## Test Results

- **Unit tests**: N/A — project convention is "specs exports + showcase only" for UI components. Slider, Spinner, Avatar, Badge, and all existing UI Core components follow the same pattern. `/verify` confirmed no test required per convention.
- **Build**: `✓ Compiled successfully` for SCRUM-328 code. Full build exits non-zero due to a pre-existing lint error in `Tooltip.tsx:16` (reproducible on clean `main`, not caused by this ticket).
- **Manual verification**: Pending user QA in Component Showcase / Catalog view.

## Bugs Found

No bugs introduced by this implementation. One pre-existing issue discovered:

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `Tooltip.tsx:16` disables `@typescript-eslint/no-explicit-any` but the rule isn't registered by the ESLint config (only extends `next/core-web-vitals`). Causes `npm run build` lint stage to fail | LOW | Pre-existing on main — NOT fixed in this branch per "never commit fixes for other tickets" rule | Recommend separate tech debt ticket to add `@typescript-eslint/parser` + plugin to `.eslintrc.json` |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-328_frontend.md` | Scope adjustment (2026-04-24): deferred Part C satellite consumption to SAT01-1 |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-328_verify.md` | Created by `/verify` |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-328_frontend.md` | This record (new) |
| `ai-specs/specs/ui-design-system.md` | **PROPOSED, awaiting user approval** — see Part 3 of `/update-docs` |
| `ai-specs/specs/integration-state.md` | **No update needed** — SCRUM-328 did not change modules, guards, service DI, permissions, or mocks |
| `ai-specs/specs/api-spec.yml` | N/A — no endpoint changes |
| `ai-specs/specs/data-model.md` | N/A — no schema changes |

## Lessons Learned

- **Plan missed the catalog registration**: the initial plan enumerated `BadgeSizeGrid`, `BeforeAfterSliderShowcase`, and the main-render list, but missed `componentRegistry` and the `componentToSection` deep-link mapping. User caught it during review. Future plans for new UI Core components should include a "Catalog integration checklist": registry entry, category (atom/molecule), deep-link mapping, and updating any description on the component being modified.
- **Overlay variant visual refinement needed user feedback loops**: the first implementation (`bg-black/60 text-white`) was too aggressive for non-media contexts (looked like a "sticker"). Theme-aware (`bg-surface-primary/70`) was too muted. Primary-button style (`bg-surface-inverse`) landed right. For variants that need cross-context usage (media + surfaces), start with the existing component family's style (e.g., primary Button) rather than reaching for literal colors.
- **Pre-existing build failures surface during develop**: the Tooltip.tsx ESLint config issue was masked because the user's local was probably in a different state when previous tickets merged, or CI uses different config. Worth tracking as its own tech debt so builds reach a green baseline.
- **Scope adjustment for cross-repo satellite consumption**: when a satellite is uncommitted in main, governance-compliant tickets for shared UI Core must defer the satellite-side consumption. This preserves single-source-of-truth while respecting branching rules. Worth documenting as a workflow pattern for future satellite/platform coordination.
