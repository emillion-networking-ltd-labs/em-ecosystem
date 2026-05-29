# Implementation Record: SCRUM-181 Decompose AuthService God Class

## Summary

Decomposed the 1,259-line AuthService god class into 5 focused sub-services (TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService) using the Facade pattern. AuthService rewritten as thin delegator preserving backward-compatible API.

- **Scope**: backend
- **Branch**: `feature/SCRUM-181-backend`
- **Implementation date**: 2026-03-12

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 7/SCRUM-181_backend.md`
- **Plan was followed**: Partially (see deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `5ccda83` | refactor(auth): decompose AuthService god class into focused sub-services (SCRUM-181) | 8 new files, 11 modified files (19 total) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 2 | TokenService with 5 DI deps | TokenService with 9 DI deps (added UsersService, PrismaService, ImpossibleTravelService, SuspiciousLoginService) | `checkImpossibleTravel`, `handleTravelBlock`, `checkSuspiciousLoginSuccess` stayed with token generation flow; `signMfaChallengeToken` needed PrismaService | Accepted |
| Step 5 | OAuthAuthService with 5 DI deps | OAuthAuthService with 6 DI deps (added SuspiciousLoginService) | `checkSuspiciousLoginSuccess` called after OAuth login success | Accepted |
| Step 7 | AuthService facade with 7 DI deps | AuthService facade with 9 DI deps (added AuditService, JwtService for logout/logoutAll) | logout/logoutAll kept as direct implementations — need auditService for audit logging and jwtService for token decoding | Accepted |
| Step 10 | Split tests into 6 separate spec files | Tests kept in single auth.service.spec.ts with sub-services registered as real providers | Splitting 2,860 LOC of tests across 6 files would require massive mock reorganization with high risk of introducing regressions. Instead, registered real sub-services in test module and updated mock access patterns | Accepted |
| Step 10 | 149 tests redistributed | 152 tests (149 original + 3 new parseDurationMs utility tests) | parseDurationMs extracted to standalone function — added dedicated unit tests | Accepted |

## Test Results

- **Overall**: 829 tests passed / 0 failed (44 suites)
- **Unit tests**: 829 passed / 0 failed
- **Build**: `nest build` compiles clean
- **Verification**: Pre-push hooks passed (tests + build)
- **No tests skipped**

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated AuthModule exports, Service Dependency Chains (replaced monolithic AuthService with 6 entries), Test Mock Requirements (MfaController/PasskeyController updated), Controller Guard Chains (MfaController/PasskeyController services updated), added changelog entry |

## Lessons Learned

- **Test strategy**: Keeping tests in a single spec file with real sub-services registered in the test module proved more robust than splitting across 6 files. The sub-services share significant mock infrastructure that would have required extensive duplication.
- **DI dep counts shifted**: The plan estimated DI deps based on method grouping, but runtime dependencies like SuspiciousLoginService and ImpossibleTravelService are needed wherever login success/failure logic runs — these naturally migrated to TokenService and OAuthAuthService.
- **Prettier + CRLF**: Windows CRLF line endings required `sed -i 's/\r$//'` before staging, and all files needed `prettier --write` to pass pre-commit hooks.
