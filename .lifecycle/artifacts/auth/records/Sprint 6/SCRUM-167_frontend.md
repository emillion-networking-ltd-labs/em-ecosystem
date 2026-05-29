# Implementation Record: SCRUM-167 Frontend Test Debt — Unit Tests + Passkey E2E Verification

## 1. Summary

Added 40 unit tests across 6 profile components (PasskeyManager, TrustedDevices, ChangeEmailForm, DeleteAccount, ConnectedAccounts, SecurityActivity) plus shared mock factories. Achieved 73% statement coverage for `src/components/profile/`.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-167-frontend`
- **Implementation date**: 2026-03-10

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 6/SCRUM-167_frontend.md`
- **Plan was followed**: Partially (see Deviations)

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `e187553` | test(SCRUM-167): add unit tests for 6 profile components | `src/components/profile/PasskeyManager.test.tsx`, `src/components/profile/ConnectedAccounts.test.tsx`, `src/components/profile/SecurityActivity.test.tsx`, `src/components/profile/TrustedDevices.test.tsx`, `tests/helpers/profile-mocks.ts` + 2 more |

## 4. Deviations from Plan

| Step | Planned | Actual | Reason | Follow-up |
|------|---------|--------|--------|-----------|
| Step 1 | `setupToastMock()` helper in profile-mocks.ts | Not created — each test mocks `useToast` inline | Inline mocking is simpler and more explicit per test | Accepted |
| Step 2 | 8 PasskeyManager tests | 8 tests — all pass | Matches plan | — |
| Step 3 | 6 TrustedDevices tests | 6 tests — all pass (after fixing 3 assertion mismatches) | Component renders Spinner instead of text, uses aria-labels instead of generic buttons | Accepted |
| Step 4 | 5 ChangeEmailForm tests | 6 tests — added same-email validation test | Extra coverage for edge case | Accepted |
| Step 5 | 6 DeleteAccount tests | 6 tests — all pass | Matches plan | — |
| Step 6 | 7 ConnectedAccounts tests | 7 tests — all pass | Matches plan | — |
| Step 7 | 5 SecurityActivity tests | 7 tests — added System IP test + API error test | Extra coverage | Accepted |
| Step 9 | Passkey E2E manual verification | Not performed | Requires backend running locally + browser interaction — cannot be automated in CLI | Deferred |
| Coverage | >= 70% statement coverage | 73.03% statements, 63.5% branches | PasskeyManager (49%) and TrustedDevices (61%) lower due to complex interactive flows (WebAuthn, device trust) | Accepted |

## 5. Test Results

- **Overall profile coverage**: 73.03% statements, 63.5% branches, 77.61% functions, 78.45% lines
- **Unit tests**: 40 passed / 0 failed (profile), 67 passed total (full suite)
- **Pre-existing failure**: `LoginForm.test.tsx` — `@marsidev/react-turnstile` ESM module not transformed by Jest (not caused by SCRUM-167)

### Per-component coverage

| Component | Stmts | Branch | Funcs | Lines |
|-----------|-------|--------|-------|-------|
| ChangeEmailForm | 95% | 77.27% | 100% | 100% |
| ConnectedAccounts | 86.66% | 68.18% | 92.85% | 94.11% |
| DeleteAccount | 83.01% | 66.66% | 80% | 89.36% |
| PasskeyManager | 49.45% | 56.52% | 65% | 55% |
| SecurityActivity | 100% | 83.33% | 100% | 100% |
| TrustedDevices | 61.29% | 52.17% | 61.53% | 64.91% |

## 6. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| LoginForm.test.tsx fails — `@marsidev/react-turnstile` ESM not transformed by Jest | LOW | Pre-existing | Not caused by SCRUM-167, existed since SCRUM-166 added Turnstile → **SCRUM-168** |

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| None | Frontend-only test ticket — no API, data model, or architecture changes |

## 8. Lessons Learned

- **What went well**: Shared mock factories (`profile-mocks.ts`) made test setup consistent and fast across all 6 files. Testing through `ConfirmModal` (not mocking it) caught real interaction patterns.
- **What was harder than expected**: TrustedDevices assertions needed adjustment — component uses `<Spinner />` (CSS class) instead of text, and aria-labels instead of generic button text. SecurityActivity pagination test failed with dynamic `import()` for userEvent — top-level import resolved it.
- **Recommendations**: Always use top-level imports for `@testing-library/user-event`. For components using custom spinners, query by CSS class or test-id rather than text.
