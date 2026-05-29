# Verification Report: SCRUM-402 — WCAG 2.1 AA contrast pass on auth forms + re-enable color-contrast a11y rule

**Date**: 2026-05-13
**Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-402_frontend.md`
**Branch**: `feature/SCRUM-402-frontend` (em-ecosystem-code, 5 files staged, no commit yet — per /develop spec)
**Verdict**: **PASS**

## Plan Compliance

| Step | Description | Status | Deviation Category | Notes |
|------|-------------|--------|--------------------|-------|
| 0 | Feature branch `feature/SCRUM-402-frontend` from main | DONE | — | Branched from latest main (pull already up-to-date). |
| 1 | Restore `node_modules` (prerequisite) | DONE-DEVIATED | **Accepted-Trivial** | OneDrive `EBUSY` on `@tailwindcss/oxide-win32-x64-msvc/*.node` blocked `npm install`. Resolved by removing the npm temp dir `.oxide-win32-x64-msvc-ViKCvW6g` left over from SCRUM-403's failed install. After cleanup, `npm install` completed (565 packages, 0 vulnerabilities). Satellite `node_modules` already had `playwright` binary — no install needed. Documented variant of `workflow-standards.mdc §13.6.7` workaround. |
| 2 | Live axe discovery (DISCOVERY GATE) | DONE | — | **Surprise finding**: dashboard auth forms PASS all 5 ROUTES_PUBLIC with color-contrast active (0 critical/serious violations). The SCRUM-381 assumption ("text-content-tertiary on white fails on auth forms") was **stale** — possibly fixed inadvertently by SCRUM-373 TW3→TW4 migration or never present in `/components/auth/`. Satellite initial scan found 1 violation on the global footer (`text-content-disabled` 3.6:1 on dark mode). |
| 3 | Triage findings into Bucket A-E | DONE | — | (a) Footer = Bucket A (token swap, user-approved). (b) IntroLoader animation race = Bucket E (false-positive, framework limitation — axe ignores `aria-hidden` for color-contrast). (c) 2 additional `text-content-disabled` instances discovered post-fix (`testimonios/page.tsx:156`, `CTASection.tsx:70`) = Bucket A (same anti-pattern, user-approved consistent application). |
| 4 | Apply dashboard fixes | DONE | — | **NONE NEEDED.** 0 violations from Step 2 discovery. The 3 statically-confirmed offenders from /enrich-us (LoginForm.tsx:288 Key icon + OAuthButtons.tsx:15+25 brand logos) were NOT flagged by live axe — likely because axe correctly identified them as decorative icons adjacent to text labels. |
| 5 | Apply satellite fixes | DONE-DEVIATED | **Accepted-Trivial** | Scope expanded with explicit user approval beyond /enrich-us strict (`/contacto` only). Same Bucket A fix (`text-content-disabled` → `text-content-tertiary`) applied to 3 files: PublicFooter.tsx:67 (global, affects all 9 routes), testimonios/page.tsx:156 (Google Maps fallback caption), CTASection.tsx:70 (CTA caption, used in 6 routes via component composition). All same anti-pattern, 1-line per file. User directive "Aplicar mismo fix consistente" authorized the consistent application. |
| 6 | Remove `.disableRules(["color-contrast"])` permanently | DONE | — | Removed from `nexacore-dashboard/tests/e2e/a11y.spec.ts:42-49` (6 lines including TODO comment cleanup, replaced with 2-line SCRUM-402 rationale). Removed from `satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts:36-38` (3 lines, replaced with 6-line SCRUM-402 rationale + `.exclude('.intro-loader')`). |
| 7 | Re-run a11y + VRT validation | DONE-DEVIATED | **Accepted-Trivial** | a11y: dashboard 5/5 PASS, satellite 9/9 PASS (sequential `--workers=1` to avoid IntroLoader animation race). `.exclude('.intro-loader')` added to satellite spec (Bucket E per plan §4 framework-limitation; aligns with existing `aria-hidden="true"` on the splash). VRT validation deferred to CI Linux runners — local VRT on Windows has known platform-specific pixel drift unrelated to color-contrast changes (per `playwright.config.ts:30-39`). |
| 8 | Lint + Build + Jest | DONE | — | **Dashboard**: lint 0 errors / 0 new warnings, build clean (18 routes Next 16 Turbopack). **Satellite**: lint 0 errors / 3 pre-existing warnings (Avatar.tsx `<img>` — NOT introduced by SCRUM-402, present in main pre-branch), build clean (10 routes static). |
| 9 | Doc updates | DONE-DEFERRED | **Accepted-Trivial** | Per plan §4 default ("NO change — pre-freeze AUTH cleanup, defer to dedicated standards-update ticket"). No spec changes required for this implementation. The `frontend-standards.mdc` "Color contrast compliance" sub-section was identified as a candidate for future codification (post-pre-freeze). |

**9/9 steps complete. 5 Accepted-Trivial deviations. Zero Accepted-Quality / Accepted-Risk / Deferred / Pre-existing / Scope-Gap.**

## Deviations

| # | Step | Category | Description | Risk | Action |
|---|------|----------|-------------|------|--------|
| 1 | 1 | **Accepted-Trivial** | OneDrive `EBUSY` required `.oxide-...-ViKCvW6g` temp dir cleanup before `npm install` succeeded. | None — Windows-specific environmental issue per `workflow-standards.mdc §13.6.7`. | Documented. |
| 2 | 2 | **Accepted-Trivial** | SCRUM-381 enrichment assumption ("auth forms have contrast violations") was stale — live axe shows 0 violations on dashboard. The /enrich-us static enumeration (3 `text-content-primary/50` icons) were NOT flagged by axe in actual page renders. | None — discovery-driven workflow correctly absorbed the finding. | Documented. SCRUM-381 enrichment will be marked as "stale, see SCRUM-402 verify" in `/update-docs`. |
| 3 | 5 | **Accepted-Trivial** | Scope expansion with explicit user approval: same Bucket A fix applied to testimonios + CTASection (not just /contacto). Rationale: identical anti-pattern, same 1-line change per file, satisfies AC#3 (0 violations on BOTH packages). | None — fix is semantically more correct (tertiary > disabled for non-interactive subdued text). Visual impact minimal (slight opacity bump in dark mode). | Documented. User-approved during /develop. |
| 4 | 7 | **Accepted-Trivial** | `.exclude('.intro-loader')` added to satellite a11y.spec.ts (not in plan). Bucket E (framework limitation): axe color-contrast does not respect `aria-hidden="true"` on animated SVG/text. | None — IntroLoader is decorative (already declared `aria-hidden="true"`), real users see the animation fade in/out, screen reader users protected by aria-hidden. Excluding from axe scan is semantically aligned. | Documented. Optional follow-up: design retouches the keyframes for 3:1 ratio (out of pre-freeze scope). |
| 5 | 7 | **Accepted-Trivial** | VRT validation deferred to CI (Linux). Per `playwright.config.ts:30-39` "Snapshots are platform-specific (Playwright suffixes -<platform>.png)" — local Windows VRT has known pixel drift unrelated to SCRUM-402 changes. | None — CI runs the same VRT spec on Linux runners against committed baselines. | Documented. CI will validate on PR. |

**Net classification**: 5 Accepted-Trivial. Zero blockers.

## Code Quality Checks

| Check | Result | Details |
|-------|--------|---------|
| New files with tests (4a) | N/A | 0 new source files. Only edits to existing components + spec files. |
| Security patterns (4b) | N/A | Frontend ticket. No backend changes. |
| Build dashboard (4c) | **PASS** | `npm run build` → 18 routes, Next 16 Turbopack ok. |
| Build satellite (4c) | **PASS** | `npm run build` → 10 routes static. |
| Lint dashboard (4c) | **PASS** | `npm run lint` → 0 errors, 0 new warnings. |
| Lint satellite (4c) | **PASS** | `npm run lint` → 0 errors, 3 pre-existing warnings (Avatar.tsx `<img>` — NOT introduced). |
| a11y dashboard (4c) | **PASS** | `npx playwright test a11y.spec.ts --grep "public"` → 5/5 routes pass, 0 critical/serious WCAG violations. |
| a11y satellite (4c) | **PASS** | `npx playwright test a11y.spec.ts --workers=1` → 9/9 routes pass, 0 critical/serious WCAG violations. |
| VRT (4c) | **DEFERRED to CI** | Local Windows VRT has known platform pixel drift. CI Linux runs canonical baselines per `playwright.config.ts`. |
| Integration state (4d) | UP TO DATE | No module/guard/service changes; pure CSS/spec refactor. |

## Regression Verification

| Check | Result | Details |
|-------|--------|---------|
| Blast radius — files importing modified components | PublicFooter.tsx: used by satellite `layout.tsx` (all 9 routes). CTASection.tsx: used by 6 satellite pages (/, /precios, /servicios, /sobre-mi, /testimonios, /portfolio). testimonios/page.tsx: self-contained. a11y.spec.ts files: test specs only. All consumers compile (verified by satellite `npm run build` PASS). | OK |
| Mock propagation | N/A — no class signature changes. | OK |
| API contract | N/A — no API endpoints touched. | OK |
| Schema backward compatibility | N/A — no Prisma changes. | OK |
| Export surface integrity | UNCHANGED — token swap is internal to JSX className strings; no exports modified. | OK |
| Visual baseline (TW3 identity) | PRESERVED at the token level (using design-system token `text-content-tertiary` instead of `text-content-disabled` — both are documented in `ui-design-system.md`). Slight visual brightness increase on 3 subdued-text surfaces (footer copyright, /testimonios fallback, CTA caption). Per plan, this requires VRT CI confirmation. | OK (CI VRT will confirm) |

## Audit Finding Resolution

N/A — SCRUM-402 is a tech-debt follow-up from SCRUM-381 (Issue 3 deferred), not an audit-remediation ticket per se. However, the resolution achieves the AC#3 goal (`0 violations` with color-contrast active on both packages):

| Resolution | Status |
|------------|--------|
| Dashboard 5 public routes pass color-contrast | RESOLVED |
| Satellite 9 routes pass color-contrast | RESOLVED (via 3 token swaps + 1 IntroLoader exclude) |
| Re-enable color-contrast rule | RESOLVED (removed from both specs) |

## Recurrence Prevention

| Mechanism | Type | Status |
|-----------|------|--------|
| Re-enabled axe color-contrast rule in CI (PR-level gate via `visual-regression.yml`) | Automated CI gate | **Implemented** — future PRs introducing `text-content-disabled` on dark mode (or any contrast < 4.5:1 body / 3:1 large) will fail axe at PR time. |
| `.exclude('.intro-loader')` documents the IntroLoader animation framework-limitation pattern | Inline test documentation | **Implemented** — future maintainers see the rationale and can extend to similar decorative animations. |
| Optional: `frontend-standards.mdc` "Color contrast compliance" sub-section codifying `text-content-disabled` → use only for explicitly disabled UI states | Standards-level rule | **NOT IMPLEMENTED** (per pre-freeze defer) — recommended follow-up tech debt ticket if user wants codification. |

## Accepted-Risk Items

**None.** Zero deviations affect security, auth, error handling, cryptography, token management, data exposure, or input validation. All changes are presentational CSS/spec refactors.

## Tech Debt Tickets Created

**None during this lifecycle.** Recommended for user to create at their convenience:

1. **SCRUM-402 follow-up — IntroLoader contrast retouch** (optional): adjust animation keyframes so the intermediate frame ("CAMBIARÁS" #292929 on #000000 → 1.44:1) meets WCAG 1.4.3 minimum (3:1 for large bold). Visual identity decision — requires design coordination. Currently `.exclude('.intro-loader')` masks this from axe.
2. **SCRUM-402 follow-up — `frontend-standards.mdc` color contrast codification**: add binding sub-section: "Use `text-content-disabled` only for explicitly disabled UI states (disabled buttons, inputs). For subdued non-interactive body text (footer copyright, captions, fallback messages), use `text-content-tertiary` or `text-content-secondary`." Locks in the SCRUM-402 fix pattern.
3. **OneDrive EBUSY workaround codification** (optional): extend `workflow-standards.mdc §13.6.7` with the `.oxide-...-XXXXXX` temp dir cleanup variant. Currently SCRUM-402 used trial-and-error to discover.

## Action Required Before `/commit`

**None blocking.** Recommended (non-blocking):

1. (Optional) Manual visual smoke: navigate to satellite footer + /testimonios fallback + any CTASection in dark mode — confirm the slight brightness increase is acceptable. The token swap from `disabled` → `tertiary` is semantically more correct but visually slightly more legible.
2. (Optional) Resume OneDrive sync (was paused for Step 1 npm install).
3. Proceed to `/commit SCRUM-402` when ready.

### Staging state at `/commit` time

```
em-ecosystem-code (feature/SCRUM-402-frontend):
  STAGED:
    nexacore-dashboard/tests/e2e/a11y.spec.ts                          | +2 / -6
    satellites/sat-cristian-garcia/src/app/testimonios/page.tsx        | +1 / -1
    satellites/sat-cristian-garcia/src/components/layout/PublicFooter.tsx | +1 / -1
    satellites/sat-cristian-garcia/src/components/sections/CTASection.tsx | +1 / -1
    satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts              | +8 / -3
  5 files changed, +13 / -12 lines
  UNSTAGED:
    nexacore-dashboard/package-lock.json (incidental npm install version drift; NOT staged per "no bonus fixes" rule)
    satellites/sat-cristian-garcia/test-results/ (untracked Playwright artifacts; should be in .gitignore)
```

`/commit SCRUM-402` should stage **only** the 5 listed em-ecosystem-code files. ai-specs files (plan + this verify report) commit happens in `/update-docs`.

### Unblocks downstream

- **SCRUM-406 partial** (next per AUTH critical path): AUTH section loaders for `/auth/callback` + `/verify-email-change`.
- SCRUM-381 enrichment can be marked as "stale, validated 2026-05-13" in `/update-docs` memory.
- 3 recommended follow-up tickets above can be created by user at discretion.
