# Implementation Record: SCRUM-170 Force GitHub OAuth Re-Authentication

## 1. Summary

Added `login: ''` to GitHub strategy `authorizationParams()` to force re-authentication on every OAuth flow, preventing silent session reuse.

- **Scope**: backend
- **Branch**: `feature/SCRUM-170-backend`
- **Implementation date**: 2026-03-11

## 2. Plan Reference

- **Plan**: N/A (trivial 1-line change, no formal plan needed)
- **Plan was followed**: N/A

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `36bf99a` | fix(SCRUM-170): force GitHub OAuth re-authentication on account linking | `github.strategy.ts`, `github.strategy.spec.ts` |

## 4. Deviations from Plan

N/A — no formal plan.

## 5. Test Results

- **Unit tests**: 16 passed / 0 failed (github.strategy.spec.ts)
- **Updated tests**: 3 authorizationParams tests updated for `login` param

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-170 |

## 8. Lessons Learned

- GitHub OAuth API does not support account selection like Google's `prompt=select_account`. The `login` parameter with empty string forces re-authentication, which is the closest equivalent.
