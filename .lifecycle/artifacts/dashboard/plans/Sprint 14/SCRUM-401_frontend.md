# Frontend Implementation Plan: SCRUM-401 — Fix RSC 'Functions cannot be passed' boundary

**Note**: This plan was written **retroactively** on 2026-05-12 after the fix already shipped. The plan accurately reflects the analysis + actions taken at execution time, but was not written before /develop as the lifecycle prescribes. Reason: SCRUM-381 had originally Deferred Issue 1 to SCRUM-401 with a note that "live browser repro" was required. When the user provided the runtime error trace, the boundary became immediately localisable and the fix was applied directly. The retroactive plan closes the lifecycle hygiene gap.

## 2. Overview

Fix the runtime RSC error `"Functions cannot be passed directly to Client Components"` that fires across dashboard public auth routes. The boundary, undiscoverable by static analysis during SCRUM-381, was located via the user-supplied runtime error trace pointing at `<... as={function LinkComponent}>` — a `<Button as={Link}>` JSX inside a Server Component.

## 3. Architecture Context

**Affected file**: `nexacore-dashboard/src/app/password-reset/check-email/page.tsx` (only Server Component page-level usage of `<Button as={Link}>` in the repo, confirmed by grep).

**Pattern**: Server Component renders a polymorphic Client Component with a function reference as a prop. At server→client serialization time, React 19 / Next 16 rejects the function reference.

**Other usages of `<Button as={Link}>` already inside client components** (verified safe — no fix needed):
- `src/components/auth/AuthErrorFallback.tsx` (use client)
- `src/components/auth/AuthFooter.tsx` (use client)
- `src/components/auth/ForgotPasswordForm.tsx` (use client)
- `src/components/auth/GoBackSection.tsx` (use client)
- `src/components/auth/LoginForm.tsx` (use client)
- `src/components/auth/RegisterForm.tsx` (use client)
- `src/components/auth/ResetPasswordForm.tsx` (use client)
- `src/components/auth/VerifyEmailStatus.tsx` (use client)

## 4. Implementation Steps

### Step 0 — Feature branch `feature/SCRUM-401-frontend`

### Step 1 — Extract JSX into client component

- **New file**: `nexacore-dashboard/src/app/password-reset/check-email/CheckEmailContent.tsx` (`'use client'`)
- Move the entire JSX (AuthLayout + heading + 2 `<Button as={Link}>` invocations) into this component
- Comment block referencing SCRUM-401 + Next 16 doc URL

### Step 2 — Slim `page.tsx` to Server Component shell

- Keep `export const metadata` (Server Component requirement)
- Body becomes `return <CheckEmailContent />`
- Net delta: 50 → 9 lines

### Step 3 — Remove fixture allowlist entry

- `nexacore-dashboard/tests/e2e/fixtures/no-console-errors.ts`
- Remove the `/Functions cannot be passed directly to Client Components/i` regex
- This intentionally returns the gate to fail-on-regression mode

### Step 4 — Verify

- Lint 0 errors
- Build clean
- `curl http://localhost:3001/password-reset/check-email` → HTTP 200
- Manual browser console check → no RSC error

## 5. Implementation Order

0 (branch) → 1 (CheckEmailContent.tsx) → 2 (page.tsx) → 3 (fixture) → 4 (verify) → commit

## 6. Testing Checklist

- [ ] `git status` shows: 1 new file + 1 modified page.tsx + 1 modified fixture
- [ ] Lint passes
- [ ] Build passes (19 routes preserved)
- [ ] Local curl on `/password-reset/check-email` → 200
- [ ] Console allowlist entry removed (so CI gate will catch any future regression)
- [ ] Manual smoke: open `/password-reset/check-email` in browser, check DevTools console → 0 RSC errors

## 7-8. Error handling / UI/UX considerations

N/A — pure mechanical refactor preserving identical render output.

## 9. Dependencies

None new. Uses existing AuthLayout, Button, Link.

## 10. Notes

- This is a **boundary-extraction refactor**, not a feature change. The user-facing behavior is byte-identical.
- The pattern (Server page wraps a Client content component to preserve metadata while moving function-prop-passing JSX into client context) is the canonical Next 16 App Router approach for this scenario.
- Allowlist entry removal is intentional and important — without it, future regressions of the same shape would silently re-introduce.

## 11. Next Steps After Implementation

`/verify SCRUM-401` → `/commit SCRUM-401` → `/update-docs SCRUM-401` → SCRUM-381 ledger Issue 1 marked resolved.

## 12. Implementation Verification

- [ ] Code shipped to em-ecosystem-code main
- [ ] Jira SCRUM-401 transitioned to Done
- [ ] SCRUM-381 record updated noting Issue 1 closed via SCRUM-401
- [ ] No new console errors on dashboard public auth routes
