# Implementation Record: SCRUM-90 Fix Jest OOM — Add Worker Memory Limits to Config

## Summary

- **What**: Added `workerIdleMemoryLimit: "512MB"` and `maxWorkers: "50%"` to Jest config in `package.json` to resolve OOM crash in `jwt.strategy.spec.ts` under Jest 30 with ts-jest.
- **Scope**: `backend`
- **Branch**: `feature/SCRUM-90-jest-oom-fix`
- **Date**: 2026-02-27

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/SCRUM-90_backend.md`
- **Plan was followed**: Yes — plan was written retroactively and aligned to actual implementation.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `289a82e` | fix(SCRUM-90): add Jest worker memory limits to resolve OOM crashes | `nexacore-api/package.json` (1 file, +3/-1) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Unit tests**: 31/31 suites pass, 395 tests pass, 0 failures
- **OOM fix confirmed**: `jwt.strategy.spec.ts` now completes successfully (previously crashed with OOM)
- **Runtime improvement**: Test suite runtime dropped from ~69s to ~5.5s (worker recycling prevents memory buildup)
- **Coverage impact**: `jwt.strategy.ts` now reports >0% coverage (previously 0% due to OOM crash). Estimated +1.5-2% contribution to functions and branches metrics.

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/plans/SCRUM-90_backend.md` | Retroactive plan created |
| `ai-specs/changes/records/SCRUM-90_backend.md` | This record |

## Lessons Learned

- **What went well**: Minimal 2-line config change with outsized impact — fixed the OOM crash, improved test runtime by ~12x, and unlocked ~1.5-2% coverage gain with zero source code changes.
- **What was harder than expected**: Nothing — the fix was straightforward once the root cause was identified in the Fase 7 audit.
- **Recommendations**: For future Jest version upgrades, always verify `workerIdleMemoryLimit` is set. Jest 30's ts-jest workers are significantly more memory-hungry than Jest 29.
