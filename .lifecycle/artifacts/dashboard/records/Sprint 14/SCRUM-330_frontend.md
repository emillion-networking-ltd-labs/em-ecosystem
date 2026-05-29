# Implementation Record: SCRUM-330 Clip BeforeAfterSlider labels + add objectFit prop

## Summary

Follow-up enhancement to SCRUM-328. Added dedicated label slots (`before.label`, `after.label`) that clip with their respective image, plus a new `objectFit?: "cover" | "contain"` prop. Updated the dashboard showcase to use the new API + swap the demo assets to the EM icon (same logo used across Sidebar/NavBar/AuthLayout). Dashboard UI Core only.

- **Scope**: frontend (dashboard UI Core)
- **Branch**: `feature/SCRUM-330-frontend` (deleted after merge)
- **Implementation date**: 2026-04-24

## Plan Reference

- Original plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-330_frontend.md`
- Verify report: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-330_verify.md`
- Plan was followed: Yes, with 2 user-directed scope additions (both Accepted-Trivial)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `a3b366a` | SCRUM-330: Clip BeforeAfterSlider labels with their respective image + add objectFit prop | BeforeAfterSlider.tsx (+38 −10), ComponentShowcase.tsx (+29 −14), em-icon-black/white.png (new), em-wordmark-black/white.png (deleted) |

**Merge status**: Fast-forward merged to `main` on 2026-04-24 (`3559bdc..a3b366a`). Local + remote feature branch `feature/SCRUM-330-frontend` deleted. PR [#226](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/226) auto-closed by branch deletion.

**Pre-commit / pre-push**: Prettier auto-formatted 2 files (commit succeeded on second attempt); 1032 backend tests passed (69 suites); nest build compiled clean; dashboard build passed the push gate.

## Deviations from Plan

Imported from `SCRUM-330_verify.md` — not reclassified here.

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 5 | Document `labels` slot + flat clip-path strings | `clipPath` restructured into nested `{horizontal, vertical} × {before, afterLabel}`; new `labels` key; new `objectFit` key | Required by the feature (inverse clip needs its own formula); `objectFit` added mid-develop per user ask | Accepted-Trivial | — |
| 6 | Showcase uses `before.label` + `after.label` slots | Done + also uses `em-icon-black/white.png` assets + `objectFit="contain"` | User asked to use the dashboard's small logo + fix perceived zoom from aspect mismatch | Accepted-Trivial | — |
| 7 | SpecsPanel reflects new `labels` keys | Done + added `Object fit` entry + split `Clip path` into two entries | Consistent with spec restructure | Accepted-Trivial | — |
| 8 | `npm run build` passes clean | `✓ Compiled successfully` for SCRUM-330 code; full build exits non-zero due to pre-existing `Tooltip.tsx:16` | Pre-existing on main — reproduced there, not caused by this ticket | Pre-existing | Same tech debt recommendation flagged in SCRUM-328 (user decision) |

### Scope additions beyond plan

| # | Addition | Category | Risk | Notes |
|---|----------|----------|------|-------|
| 1 | New `objectFit?: "cover" \| "contain"` prop, default `"cover"` | Accepted-Trivial | None | Backward-compatible API extension. Triggered by user question about image zoom in the showcase. |
| 2 | Asset swap `em-wordmark-*.png` → `em-icon-*.png` + deletion of orphaned wordmark files | Accepted-Trivial | None | User-directed. em-icon is the same logo used in Sidebar/NavBar/AuthLayout — consistent dashboard branding. |

## Test Results

- **Unit tests**: N/A — project convention for UI Core is specs exports + showcase only. No test files added; no mocks to propagate.
- **Build**: `✓ Compiled successfully` for SCRUM-330 code.
- **Pre-push**: 1032 backend tests passed, nest build clean.
- **Manual verification**: User confirmed visual QA on `/admin/design-system` → Molecules → Before / After Slider before `/commit` (label clipping correct at extremes, em-icon shown in full without zoom).

## Bugs Found

No bugs introduced. One pre-existing issue noted and carried forward from SCRUM-328:

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `Tooltip.tsx:16` ESLint rule `@typescript-eslint/no-explicit-any` not registered — fails lint stage of `npm run build` | LOW | Pre-existing on main — NOT fixed here (`never commit fixes for other tickets`) | Recommend a dedicated tech debt ticket to add `@typescript-eslint/parser` + plugin to `.eslintrc.json` |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-330_frontend.md` | Plan (from `/plan`, pre-develop) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-330_verify.md` | Verify report (from `/verify`) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-330_frontend.md` | This record (new) |
| `ai-specs/specs/ui-design-system.md` | **Not updated** — deferred to SCRUM-329 (Audit + reconcile doc with actual UI Core components). Rationale: SCRUM-330's spec changes (`labels`, `objectFit`, nested `clipPath`) will be absorbed into the comprehensive reconciliation rather than partially documented ahead of it. |
| `ai-specs/specs/integration-state.md` | **No update needed** — SCRUM-330 did not change modules, guards, service DI, permissions, or mocks |
| `ai-specs/specs/api-spec.yml` | N/A — no endpoint changes |
| `ai-specs/specs/data-model.md` | N/A — no schema changes |

## Lessons Learned

- **API scope discovered in use**: the label-clipping gap and the object-fit need both surfaced in first real-world usage of SCRUM-328. A "first consumer" integration step is a high-value discovery phase — new UI components benefit from being consumed at least once before they're considered "stable API".
- **`objectFit` generalizes cleanly**: the perceived-zoom issue surfaced via the em-icon showcase, but the fix (opt-in cover/contain) applies generally. Worth keeping as a pattern — if a component has a `fill`+`object-cover` image, the choice between cover and contain should usually be the consumer's, not hard-coded.
- **Tailwind JIT safety**: dynamic class names via string interpolation (`object-${objectFit}`) do NOT trigger Tailwind to emit the corresponding CSS — the JIT scanner only sees literal strings. Literal-ternary (`objectFit === "contain" ? "object-contain" : "object-cover"`) is the correct pattern. Caught during develop before shipping.
- **Spec-object shape changes are stealth breaking changes**: restructuring `beforeAfterSliderSpecs.clipPath` from flat to nested is technically breaking for any downstream spec consumer. A quick grep confirmed no external consumers, and the only in-repo consumer (`ComponentShowcase`) was updated in the same PR. For UI Core specs objects, audit consumers before restructuring — same discipline as component API changes.
- **Record-before-commit order**: the original plan had `/update-docs` running after `/commit`. Following that order here means the record has a real commit hash and merge status from the outset — cleaner than the SCRUM-328 flow where I ran `/update-docs` out of order and had to rewrite the Commits section afterward.
