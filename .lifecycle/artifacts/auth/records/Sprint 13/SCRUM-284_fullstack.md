# Implementation Record: SCRUM-284 Unify Login Response Shapes

## Summary

Replaced implicit property-presence discrimination on login responses with explicit `status` field discriminator. All login responses now use `status: 'success' | 'mfa_required' | 'mfa_setup_required'` instead of `mfaRequired: true` / `mfaSetupRequired: true` boolean flags. Mitigates EM-01 (error enumeration via response structure).

- **Scope**: Fullstack
- **Branch**: `feature/SCRUM-284-fullstack`
- **Date**: 2026-03-18
- **PR**: [#155](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/155)

## Plan Reference

- **Plan**: `ai-specs/ai-specs/changes/auth/plans/Sprint 13/SCRUM-284_fullstack.md`
- **Plan was followed**: Partially (2 Accepted-Trivial deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `58637a6` | SCRUM-284: Unify login response shapes with explicit status discriminator | 11 files (7 backend, 2 frontend, 2 extra backend) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| — | Plan listed 6 backend files | Also modified `oauth-auth.service.ts` (2 return sites) | TypeScript compiler caught missing `status` on OAuth AuthResult returns | Accepted-Trivial | — |
| — | Plan listed 6 backend files | Also modified `token.service.ts` (1 return site) | TypeScript compiler caught missing `status` on generateTokensForMfa return | Accepted-Trivial | — |

## Test Results

- **Unit tests**: 589 auth passed / 0 failed; 1011 total passed / 0 failed
- **Build (backend)**: `nest build` clean
- **Build (frontend)**: `npm run build` clean
- **Manual verification**: N/A (type-level change, verified via TypeScript + tests)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Added `status` field to AuthResponse, MfaChallengeResponse, MfaSetupRequiredResponse. Removed `mfaRequired`/`mfaSetupRequired` boolean properties. Added `setupToken` to MfaSetupRequiredResponse. |
| `ai-specs/specs/integration-state.md` | Changelog entry added (no module/guard/export changes — only type field additions) |

## Lessons Learned

- TypeScript strict mode catches all return sites that miss the new required field — valuable safety net for cross-cutting type changes
- Plan should grep for all files returning a given interface type, not just the files mentioned in the ticket — `oauth-auth.service.ts` and `token.service.ts` were missed
- Monorepo coordination is seamless — frontend and backend type changes deploy atomically
