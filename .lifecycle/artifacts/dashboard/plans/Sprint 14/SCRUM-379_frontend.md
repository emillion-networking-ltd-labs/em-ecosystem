# Frontend Implementation Plan: SCRUM-379 Visual Regression Testing + restore Tailwind 4 visual parity

## 2. Overview

Set up **Playwright Visual Regression Testing (VRT)** infrastructure in both `nexacore-dashboard` and `satellites/sat-cristian-garcia`. Capture a visual baseline from pre-Tailwind-4 commit `ee309e6` and use the diff against current `main` to triage and fix every visual regression introduced by the Sprint 14 migrations.

**Goals (in order)**:
1. Lock the pre-migration visual state as the canonical baseline.
2. Generate an automated, evidence-backed list of every regressed component/page (vs reading the UI manually).
3. Fix regressions at the lowest-affecting layer (e.g. global `@theme` variable, base component class) so a single change resolves N visual diffs.
4. Make visual regressions IMPOSSIBLE going forward via CI gate.

**Scope**: dashboard (50+ components in `/admin/design-system` showcase + 14 user-facing routes) AND satellite (14 static routes).

Risk: **MEDIUM** for the migration audit (depends on volume of regressions). LOW for the VRT infrastructure itself.

## 3. Architecture Context

- `@playwright/test ^1.59.1` already in dashboard `devDependencies` and `tests/e2e/` directory exists with `playwright.config.ts`.
- Satellite does NOT have Playwright yet — needs install.
- Dev servers: dashboard on port 3001, satellite on port 3002.
- Baseline source-of-truth commit: **`ee309e6`** (post-SCRUM-371 TS6 + SCRUM-374 Jest30 + SCRUM-375 lucide-1 + SCRUM-376 types/node22, BEFORE SCRUM-372 ESLint10 + SCRUM-373 Tailwind4). At `ee309e6` Tailwind is still 3.x — visual is the "correct" pre-migration state.

## 4. Implementation Steps

### Step 0: Branch
- `git checkout main && git pull && git checkout -b feature/SCRUM-379-vrt-baseline`

### Step 1: Dashboard Playwright VRT config
- Update `nexacore-dashboard/playwright.config.ts`:
  - `expect.toHaveScreenshot.maxDiffPixelRatio: 0.002` (0.2% pixel diff allowed)
  - `webServer`: spawn `npm run dev` on port 3001
  - `use.viewport`: 1440×900 (desktop) — capture light + dark mode
  - `projects`: `chromium-light`, `chromium-dark` (run same tests, set theme via cookie or class)
- Create `nexacore-dashboard/tests/e2e/visual.spec.ts`:
  - Auth-bypass: pre-set valid auth cookies via `page.context().addCookies(...)` OR navigate via mock-mode
  - Navigate to: `/login`, `/register`, `/forgot-password`, `/dashboard`, `/admin/design-system`, `/admin/audit-logs`, `/admin/permissions`, `/profile`, `/settings`
  - For `/admin/design-system`: scroll-and-snapshot each component card individually (locator-based) to get fine-grained per-component diffs
  - Use `page.evaluate(() => document.fonts.ready)` before snapshot to avoid font-flicker

### Step 2: Satellite Playwright VRT setup
- `cd satellites/sat-cristian-garcia && npm install -D @playwright/test`
- Create `satellites/sat-cristian-garcia/playwright.config.ts` mirroring dashboard but port 3002
- Create `satellites/sat-cristian-garcia/tests/e2e/visual.spec.ts`:
  - All 14 static routes: `/`, `/contacto`, `/legal/privacidad`, `/legal/terminos`, `/portfolio`, `/precios`, `/servicios`, `/sobre-mi`, `/testimonios` + dark/light variants

### Step 3: Capture baseline at `ee309e6`
**This is the trickiest step on Windows OneDrive.** Playwright snapshots are platform-specific (Windows vs Linux render fonts differently). Decision tree:

- **Option 3a (recommended)**: Capture baseline on Linux via the same CI runner that will validate. Implementation:
  1. Push the VRT config + spec to a temporary branch
  2. CI workflow at `.github/workflows/visual-baseline.yml` runs `git checkout ee309e6 -- nexacore-dashboard/src` (overlay pre-Tailwind-4 src on top of current package config)
  3. Boot dev server, run Playwright with `--update-snapshots`, push results back
- **Option 3b (faster, Windows-bound)**: Capture locally on Windows; CI must also run Windows OR accept higher diff threshold (0.5%). Less portable.

Going with **Option 3a** — Linux baseline + Linux CI = pixel-stable.

### Step 4: Run VRT against current main
- After baseline committed, switch back to current main src
- Boot dev server, `npx playwright test`
- Generates HTML report at `playwright-report/index.html` with side-by-side diffs

### Step 5: Triage diff by pattern
**Expected pattern signatures** (from migration knowledge):
- `outline` → `outline-solid` rename: components using `outline-2 outline-offset-2` may render thicker borders on focus rings. Fix at base `Input.tsx` / `Button.tsx`.
- Tailwind 4 `@theme` token resolution: colors using oklch may render slightly different than HSL. Fix at `globals.css` `@theme` block.
- Default `border` width: Tailwind 4 changed default from 1px to currentColor — may surface ghost borders. Fix in `@layer base`.
- `ring-*` defaults changed: ring color & opacity may differ.
- Container queries / `@container` differences: rare.

For each pattern:
1. Identify root component (e.g. all "outline" diffs trace to Input.tsx)
2. Apply ONE CSS or component-level fix
3. Re-run VRT → see how many diffs collapsed
4. Document the pattern in the commit body

### Step 6: Iterate until clean
- Re-run after each pattern fix
- Stop when all remaining diffs are <0.2% OR explicitly classified as "accepted intentional new defaults"
- Final state: `npx playwright test` → 0 fails

### Step 7: Lock baseline + add to CI
- Commit final baseline screenshots (tests/e2e/**/*.png snapshot files)
- Add `Layer 6: Visual Regression` job to `.github/workflows/security.yml` OR new `visual.yml`
- CI gate: PR fails if any visual diff >0.2% (configurable via threshold)

### Step 8: Documentation
- `frontend-standards.mdc`: new "Visual Regression Testing" section explaining:
  - When to run locally (before opening a UI-affecting PR)
  - How to update baselines (`npx playwright test --update-snapshots`) + when (intentional design changes only)
  - How to read the diff report
  - Integration with the design-system showcase

## 5-9. Standard sections — N/A (test infra + visual fixes)

## 10. Notes

- **Out of scope**: Storybook migration, Chromatic/Percy SaaS (Tier 2 alternatives).
- **Risk level**: MEDIUM — depends on regression volume. Mitigation: pattern-based fixing keeps work bounded.
- **Memory rules**: minimal-diff per fix (one pattern = one commit if possible), no bonus refactors.
- **Special note**: this ticket may grow if regression count is large. Acceptable: split into `SCRUM-379a` (infra + baseline) and `SCRUM-379b` (apply fixes) if total time exceeds 6h.

## 11. Next Steps

`/develop` → `/verify` → `/commit` → `/update-docs`. Multiple commits acceptable on the same branch (one per pattern fix) for clear audit trail.
