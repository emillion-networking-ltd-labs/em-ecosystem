# Implementation Record: SCRUM-182 Extract Shared Utilities — RequestMetaHelper, OAuthPkceStrategy

## Summary

Extracted two duplicated code patterns into shared utilities: `extractRequestMeta()` (duplicated across 3 controllers + 7 inline literals + 2 OAuth strategies = 12 occurrences) and OAuth PKCE `authenticate()`/`authorizationParams()` (duplicated identically in 2 strategies). Pure structural refactor with zero behavioral changes except normalizing UsersController `ipAddress` from `null` to `'unknown'` fallback.

- **Scope**: backend
- **Branch**: `feature/SCRUM-182-backend`
- **PR**: #63
- **Implementation date**: 2026-03-12

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 7/SCRUM-182_backend.md`
- **Plan followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `4f76636` | refactor: extract shared RequestMetaHelper and OAuthPkceStrategy utilities (SCRUM-182) | 9 files (3 new, 6 modified) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Unit tests**: 836 passed / 0 failed (7 new + 829 existing)
- **New test file**: `src/common/utils/tests/request-meta.spec.ts` (7 test cases)
- **Build**: `nest build` compiles clean
- **Pre-push hook**: All 836 tests pass, build verified

### Verification Checks
- Zero occurrences of `private extractRequestMeta` in any file
- Zero inline `{ ipAddress: req.ip || null }` literals in any controller
- All existing strategy tests pass without modification (PKCE helper preserves exact behavior)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-182 |

No changes needed to: Module Registry, Guard Dependency Map, Controller Guard Chains, Permissions Registry, Test Mock Requirements, Service Dependency Chains — this ticket introduced pure functions (not `@Injectable()` services), so no DI or module wiring changed.

## Lessons Learned

- **Helper functions over abstract base class**: TypeScript doesn't support multiple inheritance, and `PassportStrategy()` already uses a mixin — helper functions cleanly avoid the double-extends problem while still eliminating duplication.
- **Cross-module utility placement**: `extractRequestMeta` placed in `src/common/utils/` (not `src/auth/utils/`) because it's used by both AuthModule controllers and UsersModule controller.
- **ipAddress normalization**: UsersController previously used `req.ip || null` while auth controllers used `req.ip || req.socket?.remoteAddress || 'unknown'` — the shared utility normalizes to the auth pattern, which is strictly better for audit logging.
