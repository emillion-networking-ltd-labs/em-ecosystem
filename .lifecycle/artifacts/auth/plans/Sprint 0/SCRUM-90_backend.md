# Backend Implementation Plan: SCRUM-90 Fix Jest OOM — Add Worker Memory Limits to Config

## Codebase State Snapshot

- **Date**: 2026-02-27
- **Last completed ticket**: SCRUM-89 fullstack (password composition removal on `feature/SCRUM-89-frontend`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `package.json:88-117` — jest config block has `testEnvironment: "node"` but no `workerIdleMemoryLimit` or `maxWorkers`
  - `src/auth/tests/jwt.strategy.spec.ts` — exists but its test suite crashes with OOM (worker heap exhaustion)
  - `src/auth/strategies/jwt.strategy.ts` — 31 lines, 2 methods (`constructor`, `validate`). 0% coverage due to OOM crash.
- **Constructor signatures verified**: N/A — no service/guard code changes in this ticket
- **Guard dependency chain verified**: N/A — no guard changes in this ticket

## Overview

Jest 30 with ts-jest workers consumes significantly more memory than Jest 29. Without `workerIdleMemoryLimit` or `--max-old-space-size`, the worker running `jwt.strategy.spec.ts` exhausts the V8 heap and crashes with an OOM error. This causes the entire suite to report 1 failure despite all individual tests passing before the crash.

The fix adds two Jest configuration options to `package.json` to constrain worker memory and parallelism.

**Impact**: Resolves the OOM crash, enabling `jwt.strategy.spec.ts` to run successfully and contributing ~1.5-2% to functions and branches coverage automatically.

## Architecture Context

### Modules involved
- None — infrastructure-only change (test runner configuration)

### Components affected
- 1 file: `package.json` (jest config section only)
- 0 source files, 0 services, 0 controllers, 0 guards, 0 modules

### Files referenced
| File | Change |
|------|--------|
| `package.json` | Add `workerIdleMemoryLimit: "512MB"` and `maxWorkers: "50%"` to jest config |

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch name**: `feature/SCRUM-90-jest-oom-fix`
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-89-frontend` (base branch with all prior work)
  2. `git checkout -b feature/SCRUM-90-jest-oom-fix`
  3. Verify: `git branch`

---

### Step 1: Add Jest memory and worker configuration

- **File**: `package.json`
- **Action**: Add two properties to the `jest` configuration object
- **Implementation Steps**:
  1. Locate the `"jest"` object in `package.json` (line 88)
  2. After `"testEnvironment": "node"` (line 114), add:
     ```json
     "workerIdleMemoryLimit": "512MB",
     "maxWorkers": "50%"
     ```
  3. Ensure valid JSON (trailing comma on `"testEnvironment": "node",`)
- **Resulting config** (relevant section):
  ```json
  "testEnvironment": "node",
  "workerIdleMemoryLimit": "512MB",
  "maxWorkers": "50%"
  ```
- **Rationale**:
  - `workerIdleMemoryLimit: "512MB"` — Jest restarts workers that exceed 512MB heap, preventing OOM crashes
  - `maxWorkers: "50%"` — limits parallel workers to half of available CPU cores, reducing total memory pressure

---

### Step 2: Verify all test suites pass (including jwt.strategy.spec.ts)

- **Action**: Run the full test suite
- **Command**: `npx jest --passWithNoTests`
- **Expected**: 31/31 suites pass, ~395 tests pass, 0 failures. The previously-crashing `jwt.strategy.spec.ts` now completes successfully.
- **Verify**: `jwt.strategy.spec.ts` appears in the passed suites list (not in failures)

---

### Step 3: Verify coverage improvement

- **Action**: Run coverage to confirm OOM fix unlocks jwt.strategy.ts metrics
- **Command**: `npx jest --coverage --passWithNoTests` (optional — may still fail threshold but should show improvement)
- **Expected**: `jwt.strategy.ts` now shows >0% coverage (previously 0% due to OOM). Functions and branches metrics should increase by ~1.5-2%.

---

### Step 4: Verify build

- **Action**: Clean build
- **Command**: `rm -rf dist && npx nest build`
- **Expected**: Build succeeds with 0 errors. No source code was changed.

---

### Step 5: Update Technical Documentation

- **Action**: Create implementation record
- **Implementation Steps**:
  1. Create `ai-specs/ai-specs/changes/records/SCRUM-90_backend.md` with implementation details
- **Notes**: No `api-spec.yml` changes needed (no API changes). No `integration-state.md` changes needed (no module/guard/service changes). No `data-model.md` changes needed.

## Implementation Order

1. Step 0: Create branch `feature/SCRUM-90-jest-oom-fix`
2. Step 1: Add jest memory config to `package.json`
3. Step 2: Run tests — verify 31/31 suites pass
4. Step 3: Run coverage — verify jwt.strategy.ts now covered
5. Step 4: Verify build
6. Step 5: Documentation

## Testing Checklist

- [ ] All 31 test suites pass (previously 30/31)
- [ ] `jwt.strategy.spec.ts` completes without OOM crash
- [ ] Total test count ~395
- [ ] `nest build` succeeds
- [ ] No source code changes (only config)
- [ ] Runtime improvement observed (workers properly recycled)

## Error Response Format

N/A — no API changes.

## Dependencies

- None. No new libraries required. Only Jest configuration options.

## Notes

- **Zero risk**: No source code is modified. Only Jest runner configuration is added.
- **No migration needed**: No database or API changes.
- **Alternative approach**: Could use `NODE_OPTIONS=--max-old-space-size=4096` in the `test:cov` script, but `workerIdleMemoryLimit` is more surgical — it targets individual workers rather than the entire Node process.
- **Performance side effect**: `maxWorkers: "50%"` may improve test reliability on CI environments with limited memory (e.g., GitHub Actions default runners with 7GB RAM).

## Implementation Verification

- [ ] `workerIdleMemoryLimit` present in `package.json` jest config
- [ ] `maxWorkers` present in `package.json` jest config
- [ ] `jwt.strategy.spec.ts` passes (no OOM)
- [ ] 31/31 test suites pass
- [ ] `nest build` clean
- [ ] Implementation record created
