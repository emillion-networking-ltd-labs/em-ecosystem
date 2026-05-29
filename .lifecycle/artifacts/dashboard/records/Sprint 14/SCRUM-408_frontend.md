# Implementation Record: SCRUM-408 — EmptyState error variant

## 2. Summary

Extended `<EmptyState>` with `variant?: "default" | "error"` so consumers can render failed-to-load placeholders with consistent visual treatment (AlertTriangle icon + `text-error` semantic color) without re-doing layout. 100% backward compatible. Added showcase demo (4th block) + spec documentation. Unblocks SCRUM-403 (B1 SecurityActivity error path) + SCRUM-407 (B5 DataTable error rendering).

- **Scope**: frontend
- **Branch**: `feature/SCRUM-408-frontend` (merged + deleted)
- **Implementation date**: 2026-05-12
- **Lifecycle elapsed**: same-day (~25 min — including /enrich-us state-check, /plan, /develop with TypeScript fix mid-way, /verify, /commit, this record)

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-408_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-408_verify.md` (verdict: **PASS**, 1 Accepted-Trivial)
- **Plan was followed**: Yes (6/6 steps), with 1 documented Accepted-Trivial deviation on `emptyStateSpecs` shape (flat vs nested) for TypeScript compatibility with the existing `SpecsPanel` signature.

## 4. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `6236f38` | em-ecosystem-code | feature/SCRUM-408-frontend | SCRUM-408 (B6): EmptyState error variant + showcase demo |
| (squash hash on main after merge) | em-ecosystem-code | main (PR #304 squash) | same |
| (pending) | ai-specs | main | docs(SCRUM-408): plan + verify + record + ui-design-system §36 + design-system-viewer cross-ref |

## 5. Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 2 | `emptyStateSpecs.variants` nested object: `{ default: { icon: "..." }, error: { icon: "..." } }` | Flat keys: `"icon (variant=default)": "..."`, `"icon (variant=error)": "..."` | `SpecsPanel` TypeScript signature is `Record<string, Record<string, string>>` — nested object broke compile because `variants` would be `Record<string, { icon: string }>` not `Record<string, string>`. Flat keys preserve the same information without changing SpecsPanel's contract. | **Accepted-Trivial** | — (none needed) |

**Net classification**: 1 Accepted-Trivial. Zero Accepted-Quality / Accepted-Risk / Deferred / Pre-existing / Scope-Gap.

## 6. Test Results

- **Lint**: `npm run lint` → 0 errors, 0 new warnings
- **Build**: `npm run build` → clean, 19 routes generated (`ƒ Proxy (Middleware)` unchanged)
- **Targeted Jest**: `npx jest tests/components/ui --silent` → 5 suites / 18 tests pass in 4.4s. No regression on UI component test suite.
- **Smoke test**: `curl http://localhost:3001/admin/design-system` → HTTP 200
- **CI on PR #304**:
  - Security Pipeline: **GREEN** ✓
  - **Structural Design-Token Probe: GREEN** ✓ (the new gate from SCRUM-396 follow-through correctly triggered because the PR touched `ComponentShowcase.tsx`; verified the variant change didn't break design-token cascade)
  - Visual Regression: failure pre-existing (CSRF/RSC environment-level, same as recent PRs; not introduced)

## 7. Bugs Found

None. The TypeScript signature mismatch surfaced by `SpecsPanel` was an in-flight refinement (caught at first `npm run build`, fixed by flattening — total time ≈90s), not a bug.

**Worth noting**: the structural probe CI gate (added in SCRUM-396 follow-through) ran on this PR and passed. This validates that future EmptyState-style API extensions touching showcase components are exercised by the probe — early signal of regressions if any token-cascade interaction were to break.

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/specs/ui-design-system.md` §36 EmptyState | Added `variant` prop to props table; new "Variants" table with per-variant default icon + color + use case; updated Composition section to mention variant-dependent icon; updated Use cases (split by variant); cross-references to §0 (SCRUM-352 Loading/Empty/Error patterns) + §47 DataTable (future SCRUM-407 consumer) |
| `ai-specs/specs/design-system-viewer.md:47` | Annotated EmptyState atom entry: `(icon + message + action; variant=default\|error per SCRUM-408)` |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-408_frontend.md` | NEW — plan |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-408_verify.md` | NEW — verdict PASS |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-408_frontend.md` | NEW — this record |

No `integration-state.md` updates (no module-level / guard / service changes — pure component API extension).

## 9. Audit Finding Verification

N/A — SCRUM-408 is a sub-ticket of an audit deliverable (SCRUM-352), not an audit-fix ticket itself. No "Instances to Fix" table applies.

## 10. Lessons Learned

### What went well

- **API extension was minimal-surface**: just `variant` prop + 2 ternary branches in the component body. Zero impact on existing consumers (0 production callers + 1 showcase caller adapted in same PR).
- **Doc-from-code pattern preserved**: `emptyStateSpecs` export documents both variants (flat key format) so future audits stay aligned with code.
- **Structural Design-Token Probe gate caught the showcase change**: the SCRUM-396 follow-through CI gate triggered correctly on this PR (because ComponentShowcase.tsx is in its path filter), ran the probe, and passed — validating that the variant change doesn't break token cascade. First time this gate runs against a real-world EmptyState consumer change.
- **TypeScript caught the SpecsPanel signature mismatch at build time**: nested-object proposal in the plan was rejected by `tsc` immediately, forcing the flat-key correction before merge. No runtime regression possible.

### What was harder than expected

- **`SpecsPanel` rigid signature**: `Record<string, Record<string, string>>` doesn't tolerate nested objects beyond 2 levels. Future SpecsPanel consumers that need multi-dimensional spec entries (variants × properties) will hit the same flat-key workaround. Worth a follow-up tech-debt ticket to broaden the signature — but **out of pre-freeze AUTH cleanup scope**.

### Recommendations for downstream (SCRUM-403 + SCRUM-407)

- **SCRUM-403 (B1) planning** can now use `<EmptyState variant="error" title="Couldn't load X" description={errorMessage} action={<Button>Retry</Button>} />` as the canonical error placeholder pattern for the 4 profile components.
- **SCRUM-407 (B5) planning** can extend DataTable to render `<EmptyState variant="error">` inside `<tbody>` (using `colSpan={columns.length}`) when a new `error` prop is set. The `<EmptyState>` API is ready.
- **Spec drift prevention**: when implementing B1 or B5, reference `ui-design-system.md §36` first. The variant table is now binding.

## 11. Tech Debt Tickets Created (this lifecycle)

**None.** No deferred items. The lessons-learned `SpecsPanel` signature note above is informational; no automatic ticket created.

## Closure Status

- **SCRUM-408 code**: complete on em-ecosystem-code `main` (commit `6236f38` → squash on main via PR #304 merge + branch deleted)
- **SCRUM-408 ai-specs**: this record + plan + verify + spec updates pending commit in this `/update-docs` run
- **Downstream unblocked**: SCRUM-403 (B1) and SCRUM-407 (B5) can proceed without further API design discussion

**USER actions**:
1. Transition SCRUM-408 → Done in Jira when ready.
2. (Optional) Visually inspect `/admin/design-system` after dev server restart to confirm error variant renders correctly in light + dark mode.
3. Proceed with SCRUM-403 (B1) lifecycle next per the AUTH critical path (4 AUTH profile components empty/error/loader refactor).
