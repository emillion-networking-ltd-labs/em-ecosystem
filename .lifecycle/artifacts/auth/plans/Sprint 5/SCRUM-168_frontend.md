# Frontend Implementation Plan: SCRUM-168 Fix Jest ESM Transform for @marsidev/react-turnstile

## 1. Overview

Fix LoginForm.test.tsx failure caused by `@marsidev/react-turnstile` shipping ESM-only code that Jest cannot parse. The fix adds a jest.mock for TurnstileWidget in the test file, matching the existing pattern for other child component mocks.

**Sprint**: Sprint 5 - Security Hardening
**Scope**: frontend
**Origin**: Pre-existing since SCRUM-166, discovered during SCRUM-167

## 2. Architecture Context

### Root Cause
- `LoginForm.tsx` imports `TurnstileWidget` (line 20)
- `TurnstileWidget.tsx` imports `{ Turnstile }` from `@marsidev/react-turnstile` (line 4)
- `@marsidev/react-turnstile/dist/index.js` uses ESM `import` syntax
- `next/jest` sets `transformIgnorePatterns: ["node_modules/(?!.+\\.mjs$)"]` — does NOT cover `.js` files with ESM syntax
- Jest hits the untransformed ESM and throws `SyntaxError: Cannot use import statement outside a module`

### Existing Pattern
`LoginForm.test.tsx` already mocks 2 child components:
- `@/components/auth/OAuthButtons` (line 59)
- `@/components/auth/MfaTotpStep` (line 65)

TurnstileWidget is the only unmocked child that imports an ESM-only package.

### Files Involved
| File | Role |
|------|------|
| `tests/components/auth/LoginForm.test.tsx` | Test file — add TurnstileWidget mock |
| `src/components/ui/TurnstileWidget.tsx` | Source component (NOT modified) |
| `src/components/auth/LoginForm.tsx` | Source component (NOT modified) |

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Branch**: `feature/SCRUM-168-frontend`
- **Base**: `main`

### Step 1: Add TurnstileWidget Mock to LoginForm.test.tsx
- **File**: `nexacore-dashboard/tests/components/auth/LoginForm.test.tsx`
- **Action**: Add `jest.mock` for `@/components/ui/TurnstileWidget` after the MfaTotpStep mock (line 69)
- **Implementation**:
  ```typescript
  jest.mock('@/components/ui/TurnstileWidget', () => {
    return function MockTurnstileWidget({ onToken }: { onToken: (t: string) => void }) {
      onToken('mock-turnstile-token');
      return <div data-testid="turnstile-widget" />;
    };
  });
  ```
- **Notes**:
  - Mock auto-calls `onToken` so `turnstileToken` state is set and form submission works
  - Renders a `data-testid` div for optional assertion
  - Follows exact same pattern as OAuthButtons and MfaTotpStep mocks in the same file

### Step 2: Verify All Tests Pass
- **Action**: Run `npx jest tests/components/auth/LoginForm.test.tsx` — 4 tests should pass
- **Action**: Run `npx jest` — full suite should have 0 failures (67+ tests)

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add TurnstileWidget mock
3. Step 2: Verify tests

## 5. Testing Checklist

- [ ] LoginForm.test.tsx passes all 4 Conditional UI tests
- [ ] Full test suite: 0 failures
- [ ] No changes to source components
- [ ] No changes to jest.config.mjs

## 6. Error Handling Patterns

N/A — test-only fix.

## 7. Dependencies

No new dependencies.

## 8. Notes

- This is a ~5-line change in a single test file
- Option A (transformIgnorePatterns) was considered but rejected: riskier (global config change), and LoginForm tests don't need to exercise real Turnstile behavior
- A dedicated `TurnstileWidget.test.tsx` could be added as a follow-up but is not required for this ticket

## 9. Next Steps After Implementation

1. `/commit SCRUM-168`
2. `/update-docs SCRUM-168` (changelog entry only — no architecture changes)

## 10. Implementation Verification

- [ ] LoginForm.test.tsx: 4/4 tests pass
- [ ] Full suite: 0 failures
- [ ] No source code changes
- [ ] No jest.config.mjs changes
