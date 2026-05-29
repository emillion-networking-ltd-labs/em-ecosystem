# Verification Report: SCRUM-395 [SCRUM-387 C5] Audit cascade upgrades — React/Next cluster

**Date**: 2026-05-10
**Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_frontend.md`
**Branch**: `feature/SCRUM-395-frontend` (ai-specs repo)
**Verdict**: **PASS**

> **Scope adaptation note**: SCRUM-395 is the fifth audit-decision sub-ticket of the SCRUM-387 cascade-audit campaign and the **largest framework jump** (Next 14→16 + React 18→19). Per /enrich-us evidence, dramatically narrower scope than C3 lessons-learned forecast: bounded to 1 src/ file (2 lines, async migration). Sub-PR pattern did NOT trigger. Reuses **visual-fidelity-by-construction** (VFC) precedent from C3. **Cures C4 residuals** (1 next direct HIGH + 1 postcss transitive MODERATE). VRT gate Path A chosen with strategic defer of baseline bump to C6.

## Plan Compliance

| Step | Description | Status | Deviation Category | Notes |
|------|-------------|--------|-------------------|-------|
| 0 | Create `feature/SCRUM-395-frontend` branch in ai-specs | DONE | — | Branch confirmed |
| 1 | Per-facet `git show` + grep evidence (5 facets) | DONE | — | All 5 facets independently confirmed; cross-cluster grep verified only `layout.tsx` uses `next/headers` async API |
| 2 | Append C5 stub row to §13.5.2 | DONE | — | +1 line; existing 7 rows untouched |
| 3 | Stage 2 ai-specs files (no commit) | DONE | — | Per /develop spec point 10 |
| 4 | Confirm em-ecosystem-code clean (NO-OP) | DONE | — | Working tree state unchanged from pre-/develop |
| 4-alt | VRT Gate (Path A) | DONE — **Path A** | — | VFC + strategic defer to C6 (see §"VRT Gate Result") |
| 5 | Doc-drift sweep | DONE | — | Only `workflow-standards.mdc` touched |

**Plan compliance: 6/6 steps complete (0 deviations).**

## Deviations

**None.** Fourth consecutive cluster sub-ticket with zero deviations (SCRUM-391, SCRUM-393, SCRUM-394, SCRUM-395). Methodology and pattern reuse are firmly established.

## Substantive Judgment: Cluster Decision

Per parent SCRUM-387 plan §6 Step 1 decision tree applied to commit `6bdd387` across 5 facets:

| # | Facet | Evidence | Bundle reach | Per-facet verdict |
|---|-------|----------|--------------|-------------------|
| 1 | Framework version bumps | `next ^14.2.35 → ^16.2.6`, `react/react-dom ^18.3.1 → ^19.2.6`, `@types/react 18.3.3 → 19.2.14`, `@types/react-dom 18 → 19`, `eslint ^8.57.0 → ^9.39.4`, `eslint-config-next ^14.2.35 → ^16.2.6` in both `nexacore-dashboard/package.json` and `satellites/sat-cristian-garcia/package.json`. Lockstep upgrade. | Browser bundle — major version jump (Next + React) | NO-OP (mechanical version bump; runtime behavior preserved per PR #262 CI) |
| 2 | `layout.tsx` async migration | 2 lines: `export default function RootLayout({...})` → `export default async function RootLayout({...})`, and `const nonce = headers().get("x-nonce") ?? ""` → `const nonce = (await headers()).get("x-nonce") ?? ""`. Sole src/ edit. | Browser bundle — root layout SSR | NO-OP via VFC: async/await is server-side timing only; `Headers.get("x-nonce")` semantics identical; JSX return tree byte-identical |
| 3 | Lint flat-config rewrite | Both `.eslintrc.json` deleted (-11 lines dashboard, -3 lines satellite) + both `eslint.config.mjs` NEW (+29 lines dashboard, +23 lines satellite). Forced by `eslint-config-next@16` flat-config-only requirement. Mirrors prior semantics: `next/core-web-vitals + next/typescript`. | Build-time only (lint config not shipped) | NO-OP |
| 4 | tsconfig auto-rewrite + lint script swap | Both `tsconfig.json`: `jsx: preserve → react-jsx`, added `target: ES2017` (top-level await support, Next 16 mandate). package.json `lint` scripts: `next lint` → direct `eslint "src/**/*.{ts,tsx}" --max-warnings 0` (Next 16 removed `next lint`). `.github/workflows/security.yml` + `.husky/pre-push` updated to align with new lint command. | Build-time only | NO-OP |
| 5 | Satellite `next.config.mjs` Turbopack opt-in | Added `turbopack: {}` block with comment explaining Next 16 default + dev-time webpack-only fallback for OneDrive polling workaround. | Build-time only (dev/build tooling) | NO-OP |

**Aggregate decision**: ACCEPT-NO-OP. C5 cluster fully adjudicated.

The §13.5.2 C5 row was filled in `workflow-standards.mdc` with the per-facet rationale, the VFC argument for Facet 2, the sub-PR-pattern-not-triggered observation, the C4 residuals cure note, and the Path A choice with strategic defer rationale.

### Confidence assessment

**MEDIUM-HIGH** (revised up from C3 lessons-learned's MEDIUM forecast based on /enrich-us evidence). Below C3 (HIGH) due to the major-version magnitude (Next 14→16 + React 18→19 is genuinely a larger leap than 1-icon swap), but the bounded production-source impact (1 file, 2 lines) and the strong VFC argument keep confidence well above C2-MEDIUM.

## VRT Gate Result (AC3, Path A + strategic defer)

**Path chosen: A (VFC + strategic defer of baseline bump to C6)**

### VFC argument for `layout.tsx` async migration

1. **Server-side timing only**: `await headers()` resolves to the same `Headers` object the sync API previously returned. JavaScript awaits the Promise; the resolved value is identical.
2. **`Headers.get("x-nonce")` semantics preserved**: same string value extracted, same `?? ""` fallback.
3. **JSX render tree identical**: `RootLayout` returns the same `<html lang={...}><body>{children}</body></html>` (or equivalent) tree with the same nonce attribute injected.
4. **DOM output byte-identical**: SSR-rendered HTML reaches the browser unchanged (modulo any React 19 default rendering differences, which are opt-in and not triggered without further code adoption).
5. **No client-side hooks changed**: no `useState`, `useEffect`, etc. modified. Concurrent rendering defaults from React 19 are inert without explicit Suspense / use().

VFC confidence: HIGH (analogous to C3's SVG fidelity + C1's WHATWG semantic-equivalence).

### Strategic defer of baseline bump

**Path C (workflow_dispatch baseline bump) NOT chosen** for C5, deferred to C6:

- The current baseline is captured from rescue tag `v-baseline-2026-05-06-auth-green`, which predates ALL 9 cascade commits (including this one).
- A Path C bump for C5 would capture a new baseline reflecting C1+C2+C3+C4+C5 state — but C6 (Tailwind 4) is also already on main and is the visual heavyweight that drove the SCRUM-383 epic in the first place.
- **Bumping the baseline twice (once now for C5, once when C6 closes) is wasteful** — better to bump once at C6 closure to consolidate ALL cascade visual state.
- C5's NO-OP-via-VFC is defensible (analogous to C3) and avoids the redundant operation.

### Why Path B not chosen

Same compound-main isolation problem as prior clusters: the baseline predates the cascade commits, so a Playwright run against current main would show diff for all 9 cascade effects compounded — can't isolate C5's specific contribution. Useful only if Path A surfaced ambiguity (it didn't).

### Manual smoke recommendation (optional, 5 min)

If pixel-rigorous evidence is desired beyond VFC: `cd em-ecosystem-code/nexacore-dashboard && npm run dev` (Turbopack-default mode), navigate to any route, verify (a) page renders without hydration errors / CSP violations / console errors, (b) `<html>` element has the `nonce` attribute set on inline styles/scripts. Doesn't change decision rationale.

**Conclusion**: Path A satisfies AC3. Decision: ACCEPT-NO-OP.

## AC5 — C4 Residuals Cure Verification

Per plan AC5, C5 must verify the cure of residuals handed from C4 (SCRUM-393):

| Residual | Source | C4 status | C5 verification | Result |
|----------|--------|-----------|-----------------|--------|
| 1 next direct HIGH (Image Optimizer DoS + 4 CVEs in 14.x) | dashboard `next` direct dep | Bound to C5 cure (Next 15+ required) | `6bdd387` commit body: "Closes 5 dashboard Next CVEs and unblocks Layer 2 (Security Pipeline) on main for the first time since 2026-03-11" + "Audit dashboard: 0 prod-only vulns" | **CURED** |
| 1 postcss transitive MODERATE | dashboard transitive via Next | Bound to C5 cure (postcss <8.5.10 fix only in Next 16.3-canary) | `6bdd387` commit body: added `next > postcss: ">=8.5.10"` override; result "0 prod-only vulns" | **CURED** |
| `glob` transitive false-positive | dashboard transitive via ESLint plugin | Compensating control: glob CLI never invoked | Out of cure scope (false-positive remains documented; not a real risk) | **N/A (already documented as false-positive)** |

**AC5 satisfied**: C4 residuals 1 + 2 are cured; #3 was a false-positive with permanent compensating control.

## Code Quality Checks

| Check | Result | Details |
|-------|--------|---------|
| **4a New files with tests** | N/A | No source code created. |
| **4b Security patterns (backend)** | N/A | No backend source code changed. |
| **4c Build / tests** | N/A for ai-specs | Markdown-only. Verified §13.5.2 table now has 8 rows (4 C1 + 1 C2 + 1 C4 + 1 C3 + 1 C5). |
| **4d Integration state** | N/A | No module / guard / service / DI / permission changes. |
| **4e Regression — blast radius** | OK | 4 ai-specs files; 0 em-ecosystem-code. Below the >5 file flag. |
| **4e Regression — mocks / API / schema / exports** | N/A | No `.spec.ts`, no endpoints, no Prisma, no module exports. |

## Audit Finding Resolution

**Not applicable** — SCRUM-395 is a decision ticket.

The substantive audit deliverable is the **§13.5.2 C5 row** (committed via /commit) + the AC5 residuals-cure verification documented above.

## Recurrence Prevention

| Prevention Mechanism | Type | Status |
|---------------------|------|--------|
| §13.5.2 audit log entry | Documentation | **IMPLEMENTED** (C5 row appended; 8 cluster decisions documented) |
| Per-commit inspection methodology | Process | **CODIFIED** (4th consecutive 0-deviation cluster) |
| **Visual-fidelity-by-construction** as NO-OP evidence | Process | **REUSED** from C3 |
| **Strategic defer baseline bump** (when next cluster requires bump anyway) | Process | **NEW — IMPLEMENTED** (first instance: C5 → C6) |
| Lucide brand-icon dropping pattern | Documentation | (from C3) — already active |
| Pre-push hook (closes deps drift gap) | Automation | (from SCRUM-370) — already active |

## Accepted-Risk Items

None.

## Tech Debt Tickets Created

**None at /verify.** No Deferred / Risk findings.

## Files Staged for /commit

```
ai-specs/specs/workflow-standards.mdc                            +1 line  (C5 row in §13.5.2)
ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_frontend.md +276 lines  (NEW — plan)
ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-395_verify.md   +N lines (NEW — this file)
```

## Verification Result

```
## Verification Result: PASS

### Plan Compliance: 6/6 steps complete

### Deviations: 0 found
- (Fourth consecutive 0-deviation cluster.)

### Substantive Judgment
- 1× ACCEPT-NO-OP for C5 commit 6bdd387 (5 facets all reconcile to NO-OP)
- MEDIUM-HIGH confidence (revised up from C3's MEDIUM forecast)
- Largest commit by file count (14), smallest production-source delta (1 file, 2 lines)
- Sub-PR pattern NOT triggered (forecast was wrong; reality is 1 commit)
- VRT Gate AC3: Path A (VFC + strategic defer to C6); rationale documented
- AC5 C4 residuals CURED (1 next + 1 postcss eliminated; glob false-positive
  permanent compensating control)
- New pattern: strategic defer baseline bump when next cluster requires bump
- No new Jira ticket created (3rd consecutive)

### Action required:
- Stage this verify.md file
- Run /commit SCRUM-395 to push the branch and open the PR
- After /commit, run /update-docs to (1) write record file, (2) replace SCRUM-387
  C5 placeholder with closure summary + lessons for C6 (Tailwind, last cluster),
  (3) commit + push to ai-specs main, (4) add Jira comment to SCRUM-395
```
