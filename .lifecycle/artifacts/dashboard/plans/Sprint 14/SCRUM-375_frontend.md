# Frontend Implementation Plan: SCRUM-375 lucide-react 0.x → 1.x (dashboard)

## 2. Overview

Bump `lucide-react` from `^0.577.0` to `^1.14.0` (latest stable in 1.x line) in `nexacore-dashboard`. Closes the last "0.x major" residual on the dashboard. Satellite is already on `^1.8.0` (no change).

The dashboard has **64 unique icon imports** across `src/`. The 0.x → 1.x bump in lucide-react is mostly compatible — the API shape is preserved (named exports of icon components), but some icons may have been renamed.

Risk: **MEDIUM**. Icon renames are the main failure mode. Mitigation: rely on TypeScript's strict mode + `next build` to surface unresolved icon imports immediately, then patch each rename per case.

## 3. Architecture Context

- **Files involved**: `nexacore-dashboard/package.json`, `package-lock.json`, plus any source files referencing renamed icons.
- **Source surface**: 64 unique icons across ~30 source files (verified via grep).

## 4. Implementation Steps

### Step 0: Branch
- `git checkout main && git pull origin main && git checkout -b feature/SCRUM-375-lucide-1`

### Step 1: Bump dependency

```
"lucide-react": "^0.577.0" → "^1.14.0"
```

### Step 2: Reinstall + first build

- `cd nexacore-dashboard && rm -rf node_modules package-lock.json && npm install`
- `npm run build` — surfaces any renamed/removed icon imports as TS errors.

### Step 3: Patch icon renames per case

If any icon import fails to resolve, look up the new name in lucide-react v1 changelog. Common renames in major bumps:
- icons that were aliases for others may have been removed (use the canonical name)
- pluralisation changes (e.g. `Server` → `Server` likely unchanged; verify per case)

### Step 4: Verify

- `npm run build` — clean
- `npm run test:cov -- --silent --forceExit` — 118/118
- `npx eslint "src/**/*.{ts,tsx}" --max-warnings 0` — 0 errors
- `npm audit --audit-level=high` — no new vulns

### Step 5: Visual smoke test

Run `npm run dev` and verify:
- `/admin/design-system` (icon-heavy showcase)
- `/admin/audit-logs` (icons in header buttons)
- `/profile` (provider icons, action icons)
- Top navigation (icons in NavBar)

### Step 6: Documentation

- `frontend-standards.mdc` — no Tech Stack change (lucide is a UI library, not a stack pillar).
- `workflow-standards.mdc §12` — mark SCRUM-375 DONE.

## 5-9. Standard sections N/A — UI-library bump, no business logic / API.

## 10. Notes

- Out of scope: replacing lucide with a different icon set, refactoring icon usage patterns.
- Risk level: MEDIUM (renames are the only realistic failure).

## 11. Next Steps

`/develop` → `/verify` → `/commit` → `/update-docs`.
