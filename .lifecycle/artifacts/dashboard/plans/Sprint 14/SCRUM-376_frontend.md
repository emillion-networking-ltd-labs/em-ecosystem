# Frontend Implementation Plan: SCRUM-376 @types/node align Node 22 (dashboard + satellite)

> **Note**: Trivial dev-types-only migration. Several sections of the standard 14-section frontend template are N/A and marked with one-line justifications. Template structure preserved so `/verify` and `/update-docs` can run their standard checks.

## 2. Overview

Bump `@types/node` from `^20.x` to `^22.19.18` in `nexacore-dashboard` and `satellites/sat-cristian-garcia`. Aligns the TypeScript Node typings with the actual runtime version (Node 22, declared in `engines.node>=22.0.0` and CI's `NODE_VERSION=22`).

`nexacore-api` already runs on `@types/node@^22.10.7` — this ticket brings the two frontend packages in line.

Risk: **LOW**. Types-only — no production code, no tests, no CI behavior change. The only failure mode is if Node 22-specific typings (e.g. `Crypto.subtle`, `Buffer.from()` overloads) tighten enough to surface a latent type error, in which case we fix locally.

## 3. Architecture Context

- **Files involved**: `nexacore-dashboard/package.json`, `nexacore-dashboard/package-lock.json`, `satellites/sat-cristian-garcia/package.json`, `satellites/sat-cristian-garcia/package-lock.json`.
- **Components/pages**: N/A.
- **Routing/state/etc.**: N/A.

## 4. Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-376-types-node-22`

### Step 1: Bump `@types/node` in both `package.json`

Dashboard:
```
"@types/node": "^20.14.0"  →  "^22.19.18"
```

Satellite:
```
"@types/node": "^20"  →  "^22.19.18"
```

### Step 2: Reinstall

- `cd nexacore-dashboard && npm install`
- `cd satellites/sat-cristian-garcia && npm install`

### Step 3: Verify

- Dashboard: `npm run build && npm run test:cov && npm audit --audit-level=high`
- Satellite: `npm run build && npm audit --audit-level=high`
- Lint: `npx eslint "src/**/*.{ts,tsx}" --max-warnings 0` in both

If any TypeScript error surfaces from Node 22 typings (e.g. tightened `Buffer.from` overloads), resolve in-place. If none surface, the bump is a no-op for code semantics.

### Step 4: Documentation

- Update `frontend-standards.mdc` Tech Stack section to mention `@types/node@22` alignment if relevant.
- (`workflow-standards.mdc §12` migration backlog row will be marked DONE for SCRUM-376 in `/update-docs`).

## 5-9. (N/A — standard template sections, no business logic / API / data model touched)

## 10. Notes

- Out of scope: any TypeScript major bump (SCRUM-371), any Node engine bump (already at 22), any other devDeps.
- Risk level: LOW.

## 11. Next Steps

`/develop` → `/verify` → `/commit` → `/update-docs`. Lifecycle should run in <30 min total.
