# Implementation Record: SCRUM-252 Fix Jest Coverage Tooling

## Summary

Switched Jest coverage provider from Istanbul to V8 to fix `TypeError` caused by `test-exclude@6.0.0` + `glob@10.5.0` incompatibility. Adjusted coverage thresholds for V8 measurement differences.

- **Scope**: backend
- **Branch**: `feature/SCRUM-252-backend`
- **Date**: 2026-03-16

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 11/SCRUM-252_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `5158d53` | SCRUM-252: Switch Jest coverage provider from Istanbul to V8 | `nexacore-api/package.json` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Unit tests**: 919 passed / 0 failed (65 suites)
- **Coverage** (V8 provider):
  - Statements: 93.75% (threshold: 90%)
  - Lines: 93.75% (threshold: 90%)
  - Functions: 86.73% (threshold: 85%)
  - Branches: 80.64% (threshold: 80%)
- **Build**: `nest build` clean (0 errors)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| N/A | Config-only change — no technical documentation affected |

## Lessons Learned

- V8 coverage provider is significantly more reliable with modern dependency chains than Istanbul instrumentation
- V8 measures coverage at the bytecode level, producing slightly different (typically lower) branch/function numbers than Istanbul's source-level instrumentation
- When npm overrides force newer versions of transitive dependencies (glob@10.x), downstream packages using legacy APIs (callback-based glob) will break silently
