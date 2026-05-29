# Frontend Implementation Plan: SCRUM-374 Jest 29 → 30 (dashboard)

> **Note**: Test-runner-only migration. Several sections of the standard 14-section frontend template are N/A and marked with one-line justifications.

## 2. Overview

Bump `jest`, `jest-environment-jsdom`, and `@types/jest` from `^29.x` to `^30.x` in `nexacore-dashboard`. Closes the 4 known low-severity vulns in the `jsdom → http-proxy-agent → @tootallnate/once` chain (the lows that SCRUM-364 left as residuals).

`nexacore-api` already runs Jest 30 (`jest@^30.0.0`, `@types/jest@^30.0.0`) — this brings the dashboard in line. Satellite has no test suite, so no change there.

## 3. Architecture Context

- **Files involved**: `nexacore-dashboard/package.json`, `package-lock.json`, `jest.config.mjs` (review for breaking changes), `tests/` files (verify they still pass).
- **Tests**: 118 existing tests must keep passing.

## 4. Implementation Steps

### Step 0: Branch
- `git checkout main && git pull origin main && git checkout -b feature/SCRUM-374-jest-30`

### Step 1: Bump jest deps

```
"jest":                    "^29.7.0"  →  "^30.4.1"
"jest-environment-jsdom":  "^29.7.0"  →  "^30.4.1"
"@types/jest":             "^29.5.14" →  "^30.0.0"
```

### Step 2: Re-evaluate previously-removed overrides

SCRUM-362 had to remove `glob` and `minimatch` overrides because `test-exclude@6.0.0` (jest 29 transitive) was incompatible with `glob@13`. **Jest 30 ships with `test-exclude@7.x` which uses `glob@10` API — these overrides may now be reintroducible. Verify post-install.**

### Step 3: Verify jest config compatibility

Read `jest.config.mjs`. Jest 30 breaking changes that may affect us:
- `globals` removed in favor of `injectGlobals` config — most config keys unchanged.
- `transformIgnorePatterns` semantics tightened for ESM packages.
- Snapshot serializers v3 (we don't use any).

If any breaking change surfaces, resolve in-place.

### Step 4: Reinstall + run tests

- `rm -rf node_modules package-lock.json && npm install`
- `npm run test:cov -- --silent --forceExit`
- Expected: 118/118 pass.
- `npm audit --audit-level=high` — expect the 4 jsdom lows to be GONE.

### Step 5: Build + lint

- `npm run build` — should still pass (jest doesn't affect Next build)
- `npx eslint "src/**/*.{ts,tsx}" --max-warnings 0` — 0 errors expected.

### Step 6: Documentation

- `frontend-standards.mdc` Tech Stack: Jest 29 → 30
- `workflow-standards.mdc §12`: mark SCRUM-374 DONE.

## 5-9. (Standard sections N/A — no business logic / API / data model touched)

## 10. Notes

- Out of scope: api jest config changes (already on 30), satellite test setup (none).
- Risk level: **MEDIUM** — Jest major version bumps occasionally surface transformIgnorePatterns / mock-related breakage. 118 existing tests are the regression net.

## 11. Next Steps

`/develop` → `/verify` → `/commit` → `/update-docs`.
