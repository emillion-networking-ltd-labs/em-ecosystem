# Frontend Implementation Plan: SCRUM-402 — WCAG 2.1 AA contrast pass on auth forms + re-enable color-contrast a11y rule

## 2. Overview

Re-enable the axe `color-contrast` rule in both a11y specs (dashboard + satellite) after fixing the WCAG 2.1 AA violations that the rule would otherwise flag on auth forms. This is **discovery-driven**: the static enumeration in `/enrich-us` identified 3 confirmed offenders (`text-content-primary/50` icons) plus a list of candidates that require a live axe run to confirm.

This is **the second item of the AUTH critical path** after SCRUM-403 (which landed empty/error/loader patterns). SCRUM-402 closes a deferred follow-up of SCRUM-381 (Issue 3) by reactivating the gate that the Tailwind 4 migration (SCRUM-373) surfaced violations against.

Architecture principles:
- **Visual baseline preservation**: TW3 visual identity must remain 100% intact. Any contrast fix that would shift the visual look beyond the VRT 0.2% threshold requires user approval before merge.
- **Token-system discipline**: prefer contrast bumps via existing token replacement (e.g., `text-content-primary/50` → `text-content-secondary`) over adding new tokens. New tokens require design coordination — out of pre-freeze scope.
- **Scope discipline**: ONLY auth-form context for dashboard. ONLY `/contacto` for satellite (strict scope confirmed in /enrich-us). Marketing-site marketing pages are NOT in scope.
- **WCAG 1.4.3 vs 1.4.11 distinction**: text needs 4.5:1; non-text (icons, borders) needs 3:1. Some icons axe flags as text-contrast violations may actually be 1.4.11 candidates with `aria-hidden="true"` as the correct fix instead of a contrast bump.

## 3. Architecture Context

**Files affected** (dashboard):

- `nexacore-dashboard/tests/e2e/a11y.spec.ts` — line 49 `.disableRules(['color-contrast'])` removal + supporting TODO comment cleanup (lines 44-48)
- `nexacore-dashboard/src/components/auth/LoginForm.tsx:288` — Key icon, `text-content-primary/50` (confirmed offender #1)
- `nexacore-dashboard/src/components/auth/OAuthButtons.tsx:15,25` — Google + GitHub icons, `text-content-primary/50` (confirmed offenders #2 + #3)
- Any additional files surfaced by live axe scan in Step 2 (TBD list — may include AuthFooter.tsx, Input.tsx placeholder, helper text in forms)

**Files affected** (satellite, strict scope per /enrich-us):

- `satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts` — line 38 `.disableRules(['color-contrast'])` removal
- `satellites/sat-cristian-garcia/src/components/sections/ContactForm.tsx` — primary surface in `/contacto` route
- `satellites/sat-cristian-garcia/src/app/contacto/page.tsx` — page-level styling
- Any additional files surfaced by live axe scan against `/contacto`

**Files NOT affected**:

- `globals.css` token definitions in either repo (changing token values would impact ALL surfaces, not just auth — out of scope)
- Other dashboard pages outside ROUTES_PUBLIC (dashboard, profile, admin/*, settings — those are in the post-auth scope of separate audit work)
- Satellite marketing pages (servicios, precios, sobre-mi, portfolio, etc.) — out of scope per /enrich-us strict interpretation

**Dependencies (read-only)**:

- `@axe-core/playwright` (already installed in both repos)
- WCAG 2.1 AA color-contrast rule (4.5:1 body / 3:1 large text or non-text)
- Tailwind 4 `--color-content-*` tokens (defined in `globals.css:336-338` dark + `:410-412` light for dashboard)

**State management**: unchanged — pure CSS class refactor on existing JSX.

## 4. Implementation Steps

### Step 0 — Feature branch from latest main

```bash
cd em-ecosystem-code
git checkout main
git pull origin main
git checkout -b feature/SCRUM-402-frontend
```

### Step 1 — Restore dashboard `node_modules` (prerequisite)

The dashboard `node_modules/.bin/` was wiped during SCRUM-403 by an OneDrive `EBUSY` lock on `@tailwindcss/oxide-win32-x64-msvc/*.node` (documented in `workflow-standards.mdc §13.6.7`). Without this, `npm run test:e2e` cannot run.

**Action**:

1. Pause OneDrive sync on Windows (right-click OneDrive tray icon → "Pause syncing → 2 hours").
2. From `nexacore-dashboard/`: `npm install`.
3. Verify: `ls node_modules/.bin/jest node_modules/.bin/next node_modules/.bin/playwright` — all 3 must exist.
4. Also verify satellite: `cd satellites/sat-cristian-garcia && npm install` if `node_modules/.bin/playwright` is missing.

**If `EBUSY` persists**: investigate which process holds the lock (`Resource Monitor` → CPU → Associated handles → search `tailwindcss-oxide`). Common culprits: dev server, Windows Defender real-time scan, OneDrive sync. Kill the holding process or pause OneDrive longer.

### Step 2 — Live axe discovery (DISCOVERY GATE — MANDATORY before any code fix)

The /enrich-us enumeration is the **floor**, not the **ceiling**. Live axe will surface the full list.

**Dashboard**:

1. Temporarily remove `.disableRules(["color-contrast"])` from `tests/e2e/a11y.spec.ts:49` (don't commit yet).
2. Run: `cd nexacore-dashboard && npm run test:e2e -- a11y.spec.ts --reporter=list`.
3. **Capture the violations report** — each violation will list:
   - `id`: "color-contrast"
   - `impact`: "serious" (this is what blocks)
   - `nodes[]`: each with `target` (CSS selector), `html` (snippet), `failureSummary` (current ratio + required ratio)
4. **Save the output** to `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-402_axe-discovery.txt` (NEW file, NOT committed yet — reference document).

**Satellite (strict scope: `/contacto` only)**:

1. Temporarily remove `.disableRules(["color-contrast"])` from `satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts:38`.
2. Run: `cd satellites/sat-cristian-garcia && npm run test:e2e -- a11y.spec.ts --reporter=list`.
3. Filter the report by route — keep only violations on `/contacto`. Drop violations on marketing routes (out of scope).
4. Save to `SCRUM-402_axe-discovery-satellite.txt` alongside the dashboard one.

**Restore the `.disableRules` lines** before continuing to Step 3 (so unrelated work isn't blocked). The removal is the final step (Step 6).

### Step 3 — Triage axe findings + design decision per violation

For each violation in the discovery output, classify into one of these buckets:

| Bucket | Criteria | Fix pattern |
|--------|----------|-------------|
| **A. Text-on-white violation** | `<p>`/`<span>`/`<button>` text node with ratio < 4.5:1, impact=serious | Replace token with higher-contrast equivalent (e.g., `text-content-tertiary` → `text-content-secondary`) OR change opacity suffix (e.g., `text-content-primary/50` → `text-content-secondary`) |
| **B. Decorative icon flagged as text** | Icon adjacent to text label (button icon, input prefix), ratio < 4.5:1 but icon is semantically redundant with the label | Add `aria-hidden="true"` to the icon component — axe excludes hidden icons from text-contrast check. Visual unchanged. |
| **C. Brand logo (OAuth)** | Icon represents brand identity (Google G, GitHub octocat) | Brand colors are protected by WCAG 1.4.5; logos exempted from contrast. Add `aria-hidden="true"` if axe still flags. |
| **D. Non-text contrast (1.4.11)** | Border or focus ring with ratio < 3:1 | Bump border token (rarely needed since `border-strong` is dark) |
| **E. False positive / framework limitation** | Cannot fix without major refactor; e.g., third-party widget | `.exclude(selector)` with TODO + ticket ref (last resort) |

For each violation, **record the bucket** in the plan's working document `SCRUM-402_axe-discovery.txt`. Decisions on Bucket A items that require token swaps require user approval **before Step 4** (visual impact concern).

### Step 4 — Apply fixes (dashboard)

**Confirmed offenders (from static enumeration in /enrich-us)**:

| # | File:Line | Current | Suggested fix (per Step 3 triage) |
|---|-----------|---------|------------------------------------|
| 1 | `src/components/auth/LoginForm.tsx:288` | `<Key size={16} className="text-content-primary/50" />` | **Bucket B** — Add `aria-hidden="true"` (Key icon is decorative; "Sign in with passkey" text conveys meaning) |
| 2 | `src/components/auth/OAuthButtons.tsx:15` | `<GoogleIcon ... className="text-content-primary/50" />` | **Bucket C** — Brand logo. Add `aria-hidden="true"` on `<GoogleIcon>`. (Logos are exempt per WCAG 1.4.5, axe should not flag with `aria-hidden`.) |
| 3 | `src/components/auth/OAuthButtons.tsx:25` | `<GitHubIcon ... className="text-content-primary/50" />` | **Bucket C** — Same as #2 |

**Plus**: any additional violations discovered in Step 2 — apply per Step 3 triage bucket.

**Implementation notes**:

- `aria-hidden="true"` on `<Key size={16} ... />` from lucide-react: confirm lucide accepts the prop. If not, wrap in `<span aria-hidden="true">`.
- For `<GoogleIcon>` / `<GitHubIcon>` (custom SVG components in `src/components/icons/`), check if they accept `aria-hidden` as a prop. If not, wrap.
- **Do NOT change opacity values unless axe reports remain** after `aria-hidden` is applied. The visual baseline must be preserved.

### Step 5 — Apply fixes (satellite, strict scope)

1. For each violation on `/contacto` from Step 2 satellite discovery, apply per Step 3 triage.
2. Likely surfaces: `ContactForm.tsx` (input placeholders, helper text), `app/contacto/page.tsx` (page-level text).
3. Same `aria-hidden` / token-swap logic.

### Step 6 — Remove `.disableRules` from both specs + cleanup comments

**Dashboard**:

- `nexacore-dashboard/tests/e2e/a11y.spec.ts:42-49` — remove `.disableRules(["color-contrast"])` line.
- Remove the SCRUM-381 TODO comment block (lines 44-48) since the rule is now active.

**Satellite**:

- `satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts:38` — same removal.

### Step 7 — Re-run a11y + verify 0 violations + VRT preservation

```bash
# Dashboard
cd nexacore-dashboard
npm run test:e2e -- a11y.spec.ts --reporter=list
# Expected: 0 critical/serious violations across all ROUTES_PUBLIC

# Satellite
cd ../satellites/sat-cristian-garcia
npm run test:e2e -- a11y.spec.ts --reporter=list
# Expected: 0 critical/serious violations on /contacto
```

**VRT validation** (visual baseline preserved):

```bash
# Dashboard
cd nexacore-dashboard
npm run test:e2e -- visual.spec.ts --reporter=list
# Expected: 0 visual regressions > 0.2% threshold on auth pages
```

If VRT shows >0.2% diff on auth pages, the fix changed the visual — revisit Step 4 with bucket B/C (aria-hidden, not opacity bumps).

### Step 8 — Lint + Build + targeted Jest

```bash
cd nexacore-dashboard
npm run lint                              # 0 errors expected
npm run build                             # 18 routes clean
npx jest tests/components/auth --silent   # auth component tests pass

cd ../satellites/sat-cristian-garcia
npm run lint                              # 0 errors
npm run build                             # clean
```

### Step 9 — Update Technical Documentation

| File | Change |
|------|--------|
| `ai-specs/specs/frontend-standards.mdc` | (Optional) Add a "Color contrast compliance" sub-section: list the `text-content-*` token contrast ratios as binding spec; codify the WCAG 1.4.3 vs 1.4.11 distinction with `aria-hidden` pattern for decorative icons. Decision pending: include only if discovery surfaced patterns that need codification. Default: NO change (pre-freeze AUTH cleanup, defer to dedicated standards-update ticket). |
| `ai-specs/specs/integration-state.md` | NO CHANGE — no module/guard/service changes. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-402_axe-discovery.txt` | Working doc with live axe output. Commit alongside plan (for traceability of the discovery → fix mapping). |

## 5. Implementation Order

1. Step 0: Feature branch
2. Step 1: Restore `node_modules` (prerequisite — block until Playwright + jest runnable)
3. Step 2: **Live axe discovery** (DISCOVERY GATE — captures the full violation list)
4. Step 3: Triage findings (bucket per violation, user approval for Bucket A token swaps)
5. Step 4: Apply dashboard fixes (3 confirmed offenders + any discovered)
6. Step 5: Apply satellite fixes (`/contacto` only)
7. Step 6: Remove `.disableRules` from both specs
8. Step 7: Re-run a11y (0 violations) + VRT validation
9. Step 8: Full lint + build + targeted Jest
10. Step 9: Documentation updates (optional spec extension)
11. Handoff to `/verify SCRUM-402`

## 6. Testing Checklist

- [ ] `node_modules/.bin/` populated in both packages (jest, next, playwright executables)
- [ ] Step 2 discovery output captured in `SCRUM-402_axe-discovery.txt` (dashboard + satellite)
- [ ] Step 3 triage: every violation classified into a bucket (A/B/C/D/E)
- [ ] All Bucket A token swaps approved by user before applied
- [ ] All Bucket B/C `aria-hidden` applied via prop or wrapper
- [ ] `.disableRules(["color-contrast"])` removed from both specs
- [ ] `npm run test:e2e -- a11y.spec.ts` → 0 critical/serious violations in dashboard (5 routes)
- [ ] `npm run test:e2e -- a11y.spec.ts` → 0 critical/serious violations on satellite `/contacto`
- [ ] `npm run test:e2e -- visual.spec.ts` → 0 visual regressions > 0.2% on auth pages
- [ ] `npm run lint` 0 errors / 0 new warnings (both packages)
- [ ] `npm run build` clean (both packages)
- [ ] No new console errors at runtime (dashboard `/login`, `/register`, satellite `/contacto`)

## 7. Error Handling Patterns

N/A — pure CSS/a11y refactor. No new error states.

## 8. UI/UX Considerations

- **Decorative icons**: WCAG best practice for icons that don't convey meaning beyond adjacent text is `aria-hidden="true"`. This is the visually-preserving fix.
- **Brand logos** (Google G, GitHub octocat): semantically conveying "sign in with X provider". The text "Continue with Google" carries the meaning; the icon is decorative supplement. `aria-hidden` is appropriate.
- **Visual baseline (TW3 identity)**: any opacity bump that changes appearance must be flagged for user approval. Default approach: `aria-hidden` first (zero visual impact), opacity bump only if axe still flags after that.
- **Dark mode considerations**: token ratios in dark mode are similar (e.g., `--color-content-tertiary: rgba(245, 245, 245, 0.55)` on dark bg vs same on light). Axe runs in light mode by default in our spec. If dark-mode contrast issues emerge, they need a separate triage cycle (out of scope unless user requests).
- **Focus rings + non-text contrast (1.4.11)**: not in the static scope of "color-contrast" rule by default (axe runs `color-contrast` for text only). If axe surfaces 1.4.11 issues separately, they're in scope per WCAG AA full compliance.

## 9. Dependencies

- `@axe-core/playwright@^4` (already installed both packages)
- `@playwright/test` (already installed)
- Tailwind 4 `--color-content-*` tokens (already defined)
- No new npm packages required.

## 10. Notes

- **Pre-freeze AUTH cleanup**: this is the **second item** of the AUTH critical path after SCRUM-403. The next ticket is SCRUM-406 partial (AUTH section loaders).
- **Scope discipline**:
  - DO NOT modify `globals.css` token values (would impact non-auth surfaces).
  - DO NOT change visual look unless `aria-hidden` is insufficient + user approves opacity bump.
  - DO NOT widen satellite scope beyond `/contacto` per /enrich-us strict interpretation.
  - DO NOT add new color tokens.
- **OneDrive `EBUSY`**: if Step 1 (`npm install`) repeatedly fails after pausing OneDrive, escalate to user — environmental blocker. Alternative: clone the repo to a non-OneDrive path for the duration of /develop. Not standard practice but acceptable for this ticket if needed.
- **User approval gates**: Step 3 (Bucket A token swaps) requires user approval; Step 4 final fix list requires user review of the discovery + triage doc before code edits begin.
- **--no-verify discipline**: any hook bypass during /commit must follow the SCRUM-403 precedent — documented rationale in commit body + PR body.
- **All copy/comments in English** per `base-standards.mdc`.

## 11. Next Steps After Implementation

1. `/verify SCRUM-402` — quality gate.
2. `/commit SCRUM-402` — feature branch PR + squash merge to em-ecosystem-code main; ai-specs commit for plan+verify+record+axe-discovery.
3. `/update-docs SCRUM-402` — implementation record + memory update.
4. Continue with **SCRUM-406 partial** (AUTH section loaders for `/auth/callback` + `/verify-email-change`) per AUTH critical path.

## 12. Implementation Verification

- [ ] Step 2 discovery output committed (traceability: which violation → which file:line → which bucket → which fix)
- [ ] All 3 statically-confirmed offenders fixed (LoginForm.tsx:288, OAuthButtons.tsx:15+25)
- [ ] All additional violations from Step 2 discovery fixed per triage
- [ ] Both `.disableRules` lines removed
- [ ] `npm run test:e2e -- a11y.spec.ts` 0 critical/serious violations in BOTH packages
- [ ] VRT 0 regressions > 0.2% on auth pages (both packages)
- [ ] No new console errors
- [ ] Build clean, lint clean (both packages)
- [ ] Design rationale documented for each fix in `SCRUM-402_axe-discovery.txt` (before/after token, before/after ratio, bucket classification)

## 13. Module-Level Planning

N/A — this ticket modifies existing components and 2 spec files; does not introduce a new module.

## 14. Satellite App Planning

**Satellite identity**: `sat-cristian-garcia` (existing Next.js 14 marketing satellite, per SAT01-1 lifecycle). No NexaCore auth integration changes.

**Strict scope per /enrich-us**: only `/contacto` route (the satellite's only interactive form). Marketing routes (servicios, precios, sobre-mi, portfolio, etc.) are NOT in scope — those are 74 occurrences across 28 files that would require a separate marketing-WCAG-sweep ticket.

**Files to touch (expected)**:
- `satellites/sat-cristian-garcia/tests/e2e/a11y.spec.ts` (line 38 .disableRules removal)
- `satellites/sat-cristian-garcia/src/components/sections/ContactForm.tsx`
- `satellites/sat-cristian-garcia/src/app/contacto/page.tsx`

**Confirmed during Step 2 discovery**.

**SAT01-2 follow-up note**: if discovery reveals systemic patterns across satellite, consider scoping them to SAT01-2 (STYLE_GUIDE.md extraction) rather than expanding SCRUM-402's scope.
