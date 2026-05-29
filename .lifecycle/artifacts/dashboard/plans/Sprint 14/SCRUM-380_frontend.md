# Frontend Implementation Plan: SCRUM-380 Framework Upgrade Audit Playbook

## 2. Overview

Close the gap that let Sprint 14 migrations (Next 16, React 19, Tailwind 4, etc.) ship visual regressions and console warnings undetected by existing CI gates. SCRUM-379 added VRT but only covers 5 public auth routes; post-auth pages remain blind. This ticket extends coverage to **100% of UI surface** + adds **3 new gates** (console-error, a11y, optional perf) + documents a **Framework Upgrade Playbook**.

**Goals (in order)**:
1. Console-error gate in VRT (catches recharts -1 + Image aspect + hydration warnings BEFORE merge)
2. Auth fixture for Playwright (unblocks coverage of post-auth routes)
3. Expanded VRT scope (15+ new routes in dashboard + per-component design-system snapshots)
4. a11y gate with axe-core (WCAG 2.1 AA enforcement)
5. Pre-upgrade baseline workflow (capture full state before any major bump)
6. (Optional) Lighthouse CI for perf regression
7. Documented "Framework Upgrade Playbook" in workflow-standards.mdc

**Risk**: MEDIUM. Bundle is large (5-7 hours). Mitigation: each goal lands as a separate commit on the same branch so any single one can be reverted independently.

## 3. Architecture Context

- Existing VRT infra: `nexacore-dashboard/playwright.config.ts` + `tests/e2e/visual.spec.ts` + `.github/workflows/visual-regression.yml`
- Auth context: `src/context/AuthContext.tsx` — needs to recognize a `NEXT_PUBLIC_VRT_BYPASS_AUTH=1` env var to bypass guard
- Design-system showcase: `src/app/admin/design-system/page.tsx` — already organized in component cards, ideal for per-component snapshot
- Satellite already at 100% route coverage; only needs the 3 new gates added

## 4. Implementation Steps

### Step 0: Branch
- `git checkout main && git pull && git checkout -b feature/SCRUM-380-upgrade-playbook`

### Step 1: Console-error gate
- Add a global Playwright fixture in `nexacore-dashboard/tests/e2e/fixtures/no-console-errors.ts`:
  ```ts
  import { test as base } from '@playwright/test';
  
  export const test = base.extend({
    page: async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          errors.push(`[${msg.type()}] ${msg.text()}`);
        }
      });
      await use(page);
      if (errors.length > 0) {
        throw new Error(`Browser console reported errors/warnings:\n${errors.join('\n')}`);
      }
    },
  });
  ```
- Update `visual.spec.ts` to import from this fixture instead of `@playwright/test`.
- Same for satellite spec.
- **Allowlist** for known benign warnings (e.g. Next dev hot-reload messages) via regex filter.

### Step 2: Auth fixture for Playwright (post-auth coverage)
- Add `NEXT_PUBLIC_VRT_BYPASS_AUTH` env var. AuthContext checks at boot:
  ```ts
  const VRT_BYPASS = process.env.NEXT_PUBLIC_VRT_BYPASS_AUTH === '1';
  // In context init: if VRT_BYPASS, set state.user = MOCK_VRT_USER, state.status = 'authenticated'
  ```
- MOCK_VRT_USER constant with deterministic test data (id, email, role: 'ADMIN' for admin route access).
- Add `.env.vrt` with the env var, sourced by Playwright workflow.
- Document in code: this bypass NEVER ships in prod (env var has VRT prefix, only set in CI).

### Step 3: Expand VRT scope
- Add post-auth routes to `visual.spec.ts`:
  ```
  /dashboard
  /admin/audit-logs
  /admin/permissions
  /admin/design-system
  /profile
  /settings
  /verify-email-change
  /verify-email
  /reset-password
  ```
- For `/admin/design-system`: snapshot per component card (use `locator('[data-showcase-component="X"]')`) — 50+ component-level snapshots instead of one full-page.
- Re-capture baseline via workflow_dispatch.

### Step 4: a11y gate with axe-core
- Add `@axe-core/playwright` to dashboard + satellite devDeps.
- New test file `tests/e2e/a11y.spec.ts` with one test per route invoking `AxeBuilder().analyze()`.
- Filter to violations with `impact: 'critical' | 'serious'`. Less strict modes can be enabled later.
- Add `Layer 7: A11y` job to `.github/workflows/visual-regression.yml` (or split to its own workflow).

### Step 5: Pre-upgrade baseline workflow
- New `.github/workflows/upgrade-baseline.yml` with `workflow_dispatch` only:
  - Inputs: `migration_ticket` (e.g. `SCRUM-381`), `target_packages` (dashboard|satellite|both)
  - Captures: visual baseline + a11y baseline + console-output snapshot + bundle-size snapshot
  - Commits all baselines tagged with the migration ticket ID under `tests/e2e/upgrade-baselines/<ticket>/`
- Migration tickets reference this baseline; their PRs validate against it.

### Step 6: (Optional) Lighthouse CI
- Add `@lhci/cli` to dashboard devDeps.
- Workflow runs Lighthouse against key routes, fails if regression >10% on LCP/CLS/TBT/INP.
- Defer if Step 1-5 already at 5h+.

### Step 7: Documented playbook
- New section in `ai-specs/specs/workflow-standards.mdc`: **Framework Upgrade Playbook**
  - Pre-upgrade phase: run `upgrade-baseline.yml`, document expected breaking changes from changelog, define rollback criteria
  - During-upgrade phase: each major bump in own PR, must pass: VRT + console-gate + a11y + (perf if enabled)
  - Post-upgrade phase: 24h staging soak, monitor real-user telemetry, rollback signal
- Cross-reference: `audit-warn-register.md`, `audit-standards.mdc`, this plan

## 5-9. (N/A — test infra + docs)

## 10. Notes

- **Out of scope**: Storybook + Chromatic SaaS (Tier 2 alternative); real-user monitoring (Sentry/Datadog).
- **Risk level**: MEDIUM. Each step lands independently committable; no cascading dependency.
- **Memory rules**: minimal-diff per step, no bonus refactors.
- **Cleanup**: after this ticket, the next major framework bump (e.g. Tailwind 5 some day) follows the documented playbook end-to-end as a dry-run.

## 11. Next Steps

`/develop` (this plan) → `/verify` → `/commit` → `/update-docs`. Multiple commits per step OK.
