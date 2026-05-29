# Frontend Implementation Plan: SCRUM-400 Rename `middleware.ts` → `proxy.ts` (Next 16 deprecation)

## 2. Overview

Next.js 16 (shipped via SCRUM-364, commit `6bdd387`) deprecated the `middleware.ts` file convention in favor of `proxy.ts`. The runtime warning on every `npm run dev`:

```
The "middleware" file convention is deprecated. Please use "proxy" instead.
```

This ticket performs the rename to drop the warning and future-proof against Next 17 (where the compatibility shim will be removed). The scope is intentionally minimal: 1 file rename + 1 function name change. No behavior, header, or matcher change.

Architecture principles applied:
- **Next.js File Convention**: Next consumes the middleware/proxy file by filename only (no `import` site). Renaming the file is structurally sufficient at the consumer level.
- **Single Responsibility**: the file remains a CSP/nonce/Turnstile allowlist proxy. We do not bundle CSP-policy changes in this ticket (separate concern, separate ticket if/when needed).
- **Frontend-only**: the satellite (`sat-cristian-garcia`) has no middleware/proxy file. The api package is NestJS (not affected). No fullstack work.

## 3. Architecture Context

**Components/pages involved**: none directly. The middleware/proxy executes on every incoming HTTP request that matches `config.matcher` (effectively every page except `_next/static`, `_next/image`, `favicon.ico`, image asset paths). Renaming does not affect any individual page.

**Files referenced**:

- `nexacore-dashboard/src/middleware.ts` (60 lines, will be renamed)
- `nexacore-dashboard/next.config.mjs` (verified — no middleware-specific config; nothing to update)
- `nexacore-dashboard/package.json` (verified — `next: ^16.2.6` supports both `middleware.ts` and `proxy.ts` during the deprecation window)
- `nexacore-dashboard/tests/e2e/visual.spec.ts` (consumes routes that pass through the matcher — implicit regression coverage)
- `nexacore-dashboard/tests/e2e/auth-flows.spec.ts` (consumes routes that pass through the matcher)
- `nexacore-dashboard/tests/e2e/a11y.spec.ts` (consumes routes that pass through the matcher)

**Routing considerations**: the `config.matcher` regex remains identical. Next 16 reads the same matcher schema from both `middleware.ts` and `proxy.ts`. No route mapping changes.

**State management approach**: N/A. The middleware/proxy is request-scoped, stateless (generates a fresh nonce per request). No client state, no React state, no Context.

## 4. Implementation Steps

### Step 0 — Create Feature Branch

- **Action**: Branch from up-to-date `main`, name per convention.
- **Branch Naming**: `feature/SCRUM-400-frontend` (required — no shared/general branch).
- **Implementation Steps**:
  1. `git checkout main`
  2. `git pull origin main` (must include commit `c3abfc5` or later — `chore(satellite): pin turbopack.root`)
  3. `git checkout -b feature/SCRUM-400-frontend`
  4. `git branch` → confirm the new branch is active
- **Notes**: Follow `ai-specs/specs/frontend-standards.mdc` "Development Workflow". This is the FIRST step.

### Step 1 — Rename the file via `git mv`

- **File**: `nexacore-dashboard/src/middleware.ts` → `nexacore-dashboard/src/proxy.ts`
- **Action**: Move the file preserving git history.
- **Command**:
  ```bash
  cd nexacore-dashboard
  git mv src/middleware.ts src/proxy.ts
  ```
- **Implementation Steps**:
  1. Run the `git mv` command above.
  2. Verify with `git status`: the change must appear as one line `R src/middleware.ts -> src/proxy.ts` (renamed), not as one delete + one add.
  3. Verify history continuity: `git log --follow -- nexacore-dashboard/src/proxy.ts` must list the prior commits that touched `middleware.ts` (CSP changes, SCRUM-373 cursor:pointer follow-up, etc).
- **Implementation Notes**: `git mv` is essential — a manual delete+create breaks `git log --follow` and obscures the file's history. Reviewers must be able to trace CSP-policy decisions back through the rename.

### Step 2 — Rename the exported function

- **File**: `nexacore-dashboard/src/proxy.ts` (the renamed file from Step 1)
- **Action**: Rename the exported function from `middleware` to `proxy` to match the new file convention.
- **Function Signature** (before):
  ```ts
  export function middleware(request: NextRequest) { ... }
  ```
- **Function Signature** (after):
  ```ts
  export function proxy(request: NextRequest) { ... }
  ```
- **Implementation Steps**:
  1. Open `nexacore-dashboard/src/proxy.ts`.
  2. Locate the single occurrence of `export function middleware` at line 3 (per current code state).
  3. Replace `middleware` with `proxy` (function name only — do NOT alter parameter name, return type, body, or the `config` export below it).
  4. Save.
- **Dependencies**: `NextRequest` from `next/server` (already imported at line 1, unchanged).
- **Implementation Notes**:
  - Per Next 16 convention, the file's exported function name should match the new filename. The runtime accepts `middleware()` in `proxy.ts` during the deprecation shim window, but using `proxy()` future-proofs against Next 17 removing the alias.
  - The `export const config = { matcher: [...] }` block (lines 56-60) **remains unchanged**. The matcher schema didn't change between conventions.
  - The internal `function generateNonce(): string` (line 52) **remains unchanged**. It's a private helper, not exported, no convention applies.

### Step 3 — Smoke test locally (boot + headers)

- **Action**: Verify dev server boots without warning and CSP/nonce headers still emit correctly.
- **Implementation Steps**:
  1. From `nexacore-dashboard/`: `npm run dev`
  2. Confirm console output: **NO** line containing `"middleware" file convention is deprecated`.
  3. Confirm `▲ Next.js 16.2.6 (Turbopack)` boots in <2s with `✓ Ready in <Nms>`.
  4. In a second terminal, verify headers:
     ```powershell
     curl -s -D - http://localhost:3001/login -o NUL | findstr /B /C:"content-security-policy" /C:"x-nonce"
     ```
     Expected output: two lines, both headers present. The CSP header must contain `nonce-XXXX` where XXXX is base64. The `x-nonce` header must match.
  5. Open `http://localhost:3001/login` in a browser. Open DevTools → Network → click the document request → Headers tab. Confirm:
     - `Content-Security-Policy` header present, contains `nonce-...`, includes `https://challenges.cloudflare.com` in `script-src` and `connect-src`.
     - `x-nonce` header present.
  6. Stop the dev server (Ctrl+C).
- **Implementation Notes**:
  - The original warning has been observed in this codebase via SCRUM-396 audit (2026-05-12). Its absence post-rename is the primary acceptance signal.
  - If the warning persists after Step 2, the function may not have been renamed (Next 16 emits the warning when it detects `middleware`-shaped exports in a `proxy.ts` file too, depending on version). Re-verify Step 2.

### Step 4 — Lint and build

- **Action**: Confirm no lint/build regressions from the rename.
- **Implementation Steps**:
  1. From `nexacore-dashboard/`: `npm run lint`
     - Expected: 0 errors, 0 warnings (or the pre-existing warnings unchanged — no new entries from the rename).
  2. From `nexacore-dashboard/`: `npm run build`
     - Expected: clean build, 19 routes generated (or whatever the current main reports as baseline — must not decrease).
- **Implementation Notes**: ESLint config has no rules tied to the `middleware`/`proxy` filename. The TypeScript compiler treats `proxy.ts` and `middleware.ts` identically (both are TS modules). Any failure here is unexpected — investigate before proceeding.

### Step 5 — Run targeted e2e suites (optional, time-permitting)

- **Action**: Run Playwright suites that exercise routes passing through the matcher.
- **Implementation Steps**:
  1. From `nexacore-dashboard/`: `npm run dev` in one terminal.
  2. Wait for `Ready` then in another: `npx playwright test auth-flows.spec.ts a11y.spec.ts --workers=1`
  3. Expected: all green. Failures here indicate the rename broke something the smoke test missed (extremely unlikely given the surgical scope).
- **Implementation Notes**: CI Security Pipeline will run these on the PR regardless. Local run is for confidence at low cost (~3 min total). Skip if time-constrained — CI is the authoritative gate.

### Step 6 — Update Technical Documentation

- **Action**: Update any documentation that references `middleware.ts` by name.
- **Implementation Steps**:
  1. **Review Changes**: This ticket modifies 1 file (renamed). No new APIs, no schema changes, no UI changes, no new dependencies.
  2. **Identify Documentation Files**:
     ```bash
     # From repo root (em-ecosystem-code/), with grep on ai-specs/:
     cd ../ai-specs
     grep -rn "middleware\.ts\|src/middleware" ai-specs/specs ai-specs/changes 2>/dev/null
     ```
     Update any markdown lines that reference `middleware.ts` to `proxy.ts` — IF AND ONLY IF those lines are documenting current code state (not historical records of older work).
  3. **Update Documentation**: For each affected file:
     - If a `*-standards.mdc` references the file by name → update to `proxy.ts`
     - If a historical record (`changes/.../records/...`) references the file → DO NOT update (records are point-in-time snapshots)
     - If `integration-state.md` references → update
     - Maintain English
  4. **Verify Documentation**: confirm the only references remaining to `middleware.ts` are in historical records / git history, never in current-state specs.
  5. **Report Updates**: list in the implementation record (`/update-docs` step) which files were touched.
- **References**:
  - `ai-specs/specs/documentation-standards.mdc`
  - All docs in English.
- **Notes**: MANDATORY before considering the ticket done.

## 5. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-400-frontend` from up-to-date `main`.
2. **Step 1**: `git mv src/middleware.ts src/proxy.ts` (preserve history).
3. **Step 2**: Rename `export function middleware` → `export function proxy` (single occurrence).
4. **Step 3**: Smoke test — dev server boots cleanly + CSP/nonce headers present.
5. **Step 4**: `npm run lint` + `npm run build` clean.
6. **Step 5** (optional): Playwright `auth-flows.spec.ts` + `a11y.spec.ts` green.
7. **Step 6**: Update doc references (`grep -rn middleware\.ts` in ai-specs/).
8. → Continue to `/verify SCRUM-400`.

## 6. Testing Checklist

Post-implementation manual verification:

- [ ] `git status` shows exactly 1 rename `R src/middleware.ts -> src/proxy.ts` + 1 small modification inside `proxy.ts` (function-name change only). No other files modified.
- [ ] `git log --follow -- nexacore-dashboard/src/proxy.ts` lists prior `middleware.ts` history (rename detection works).
- [ ] `npm run dev` boots with NO deprecation warning. Console line `'middleware' file convention is deprecated` is absent.
- [ ] `npm run dev` Ready in <2s (baseline: ~600ms).
- [ ] `curl -D - http://localhost:3001/login` returns 200 with `Content-Security-Policy` and `x-nonce` headers present.
- [ ] CSP header contains a fresh `nonce-...` base64 value (different per request — re-curl twice and compare).
- [ ] CSP `script-src` and `connect-src` include `https://challenges.cloudflare.com`.
- [ ] Browser DevTools: Network → document → CSP header matches; no CSP violations in Console.
- [ ] `npm run lint` 0 errors (warnings ≤ baseline).
- [ ] `npm run build` clean, 19 routes generated.
- [ ] (Optional) Playwright `auth-flows.spec.ts` green.
- [ ] (Optional) Playwright `a11y.spec.ts` green.

## 7. Error Handling Patterns

N/A. The rename does not change error handling. The proxy/middleware function returns `NextResponse.next()` for all matched routes — no error paths introduced or removed.

## 8. UI/UX Considerations

N/A. No UI changes. CSP/nonce/Turnstile behavior identical pre- and post-rename.

## 9. Dependencies

- `next: ^16.2.6` (already installed) — accepts both `middleware.ts` and `proxy.ts` during deprecation shim window.
- `crypto.getRandomValues` (Web Crypto API, native in Node 22 / Edge runtime — already in use, unchanged).
- No new packages.
- No package.json changes.
- No `package-lock.json` changes.

## 10. Notes

- **Scope discipline**: this ticket is rename-only. Do NOT bundle CSP-policy changes, Turnstile-allowlist tweaks, or new directives. Those belong in separate tickets.
- **Convention source**: the function-name rename (`middleware` → `proxy`) is per Next 16 file-convention idiom (file name = function name). Next 16 docs: https://nextjs.org/docs/messages/middleware-to-proxy.
- **Compatibility window**: Next 16 accepts both conventions. Next 17 (expected Q4 2026 / Q1 2027) will remove the alias. Doing the rename now means no urgency later.
- **Language**: all code and comments stay in English (per `base-standards.mdc`).
- **Satellite carry-forward**: satellite `sat-cristian-garcia` has no middleware/proxy file. No parallel rename required.

## 11. Next Steps After Implementation

1. Run `/verify SCRUM-400` to check the plan was followed and there are no regressions.
2. If `/verify` returns PASS or PASS-WITH-DEBT → run `/commit SCRUM-400` (feature branch PR + squash merge to main).
3. After merge, run `/update-docs SCRUM-400` to write the implementation record and propagate any spec touches.

## 12. Implementation Verification

Before transitioning the Jira ticket to Done:

- [ ] **Code Quality**: function name matches file name (`proxy` in `proxy.ts`); no leftover references to `middleware()` inside the file.
- [ ] **Functionality**: CSP / nonce / Turnstile allowlist behavior identical to pre-rename (manual curl + browser check).
- [ ] **Testing**: lint + build clean; smoke test passes; optional e2e green.
- [ ] **Integration**: no other file in `nexacore-dashboard/src/` or `nexacore-dashboard/tests/` references `middleware.ts` or imports the old `middleware` symbol (grep returns 0 matches).
- [ ] **Documentation updates completed**: any `*-standards.mdc` or `integration-state.md` references to `middleware.ts` updated to `proxy.ts`; historical records preserved as-is.

## 13. Module-Level Planning

N/A — this ticket does not introduce or significantly modify a full frontend module. It's a single-file cleanup within the dashboard's `src/` root.

## 14. Satellite App Planning

N/A — the satellite `sat-cristian-garcia` has no middleware/proxy file. Confirmed via:

```bash
ls satellites/sat-cristian-garcia/src/middleware.* satellites/sat-cristian-garcia/src/proxy.* 2>/dev/null
# No such file or directory
```

If a future satellite adds CSP/middleware via Next.js file convention, it should start as `proxy.ts` directly (skip the deprecation path entirely).
