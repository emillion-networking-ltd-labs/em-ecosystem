# Backend Implementation Plan: SCRUM-92 Spec for https-redirect.middleware.ts

## Codebase State Snapshot

- **Date**: 2026-02-27
- **Last completed ticket**: SCRUM-91 backend (OAuth strategy tests on `feature/SCRUM-91-backend`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/common/middleware/https-redirect.middleware.ts` (20 lines) — 1 exported function `registerHttpsRedirectMiddleware()`, 3 branches
  - `src/common/middleware/tests/helmet.middleware.spec.ts` (73 lines) — reference pattern: mocks `INestApplication` with `{ use: jest.fn() }`, captures middleware callback, invokes with mock req/res/next
- **Constructor signatures verified**: N/A — standalone function, no DI
- **Guard dependency chain verified**: N/A — no guards

## Overview

`registerHttpsRedirectMiddleware()` was added in SCRUM-88 with 0% test coverage. It is a plain function (not a NestJS class middleware) that calls `app.use()` to register an Express middleware. The middleware redirects HTTP→HTTPS in production via `x-forwarded-proto` header inspection.

## Architecture Context

### Modules involved
- None — standalone function, no module registration

### Components affected
- 1 new spec file
- 0 source file changes

### Files referenced
| File | Change |
|------|--------|
| `src/common/middleware/tests/https-redirect.middleware.spec.ts` | **Create** — 4 test cases |

### Pattern reference
| File | Reuse |
|------|-------|
| `src/common/middleware/tests/helmet.middleware.spec.ts` | Same `mockApp = { use: jest.fn() }` pattern, capture middleware callback from `app.use()` mock calls |

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch name**: `feature/SCRUM-92-backend`
- **Base**: `feature/SCRUM-91-backend`

---

### Step 1: Create spec file

- **File**: `src/common/middleware/tests/https-redirect.middleware.spec.ts`
- **Pattern**: Follow `helmet.middleware.spec.ts` — mock `INestApplication`, capture callback from `app.use()`
- **Environment handling**: Save/restore `process.env.NODE_ENV` in `beforeEach`/`afterEach`

4 test cases:

1. **NODE_ENV !== 'production' → does not call app.use()**
   - Set `NODE_ENV = 'development'`
   - Call `registerHttpsRedirectMiddleware(mockApp)`
   - Assert `mockApp.use` NOT called

2. **Production + x-forwarded-proto: 'http' → redirect 301**
   - Set `NODE_ENV = 'production'`
   - Call `registerHttpsRedirectMiddleware(mockApp)`
   - Extract middleware from `mockApp.use.mock.calls[0][0]`
   - Invoke with `req = { headers: { 'x-forwarded-proto': 'http' }, hostname: 'example.com', url: '/path' }`
   - Assert `res.redirect(301, 'https://example.com/path')`
   - Assert `next` NOT called

3. **Production + x-forwarded-proto: 'https' → next()**
   - Same setup, `req.headers['x-forwarded-proto'] = 'https'`
   - Assert `res.redirect` NOT called
   - Assert `next` called

4. **Production + no x-forwarded-proto header → next()**
   - `req.headers = {}` (no proto header)
   - Assert `res.redirect` NOT called
   - Assert `next` called

---

### Step 2: Run tests

- `npx jest https-redirect --verbose`
- `npx jest --passWithNoTests` (full suite)

---

### Step 3: Verify coverage

- `npx jest --coverage --collectCoverageFrom='**/common/middleware/https-redirect.middleware.ts'`
- Expected: 100% stmts, 100% branches, 100% functions

---

### Step 4: Documentation

- Create `ai-specs/ai-specs/changes/records/SCRUM-92_backend.md`

## Implementation Order

1. Step 0: Create branch
2. Step 1: Create spec file (4 tests)
3. Step 2: Run tests
4. Step 3: Verify coverage
5. Step 4: Documentation

## Testing Checklist

- [ ] All 4 tests pass
- [ ] Full suite (31+ suites) passes
- [ ] `https-redirect.middleware.ts` — 100% all metrics
- [ ] `nest build` succeeds

## Dependencies

None.

## Notes

- **Zero risk**: Test-only, no source changes.
- **No NestJS TestingModule needed**: The function takes `INestApplication` directly — just mock it as `{ use: jest.fn() }`.
- **`process.env.NODE_ENV`**: Must save original value in `beforeEach` and restore in `afterEach` to avoid test pollution.

## Implementation Verification

- [ ] Spec file created at correct path (`src/common/middleware/tests/`)
- [ ] 4 tests cover all 3 branches + the function itself
- [ ] `process.env.NODE_ENV` properly saved/restored
- [ ] Full test suite passes
- [ ] Coverage = 100%
