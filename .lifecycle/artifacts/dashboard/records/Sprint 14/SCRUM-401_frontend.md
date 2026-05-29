# Implementation Record: SCRUM-401 — Fix RSC 'Functions cannot be passed' boundary

## 2. Summary

Live error trace (provided by user 2026-05-12) localized the RSC boundary that SCRUM-381 static analysis couldn't find. Root cause: `<Button as={Link}>` rendered directly from a Server Component (`page.tsx`) passes the `Link` function reference across the server→client boundary. Fix: extract JSX into a sibling client component, preserve Server Component for metadata export.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-401-frontend` (merged + deleted)
- **Implementation date**: 2026-05-12
- **Lifecycle elapsed**: same-day (~10 min — runtime trace narrowed location instantly, fix is mechanical)

## 3. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `777208c` | em-ecosystem-code | feature/SCRUM-401-frontend | SCRUM-401: fix RSC 'Functions cannot be passed' boundary in check-email page |
| `314508c` | em-ecosystem-code | main (squash via PR #303) | same |
| (pending) | ai-specs | main | docs(SCRUM-401): record |

## 4. Root Cause

`src/app/password-reset/check-email/page.tsx` was a Server Component (no `'use client'`) rendering two `<Button as={Link}>` invocations directly (lines 37 + 48). The polymorphic `as` prop receives Next's `Link` (a function reference); when this JSX lives directly in a Server Component, the function reference is serialized as a prop across the boundary to the Client Component `<Button>`, which React 19 / Next 16 rejects with a runtime error.

## 5. Fix

| File | Change |
|------|--------|
| `nexacore-dashboard/src/app/password-reset/check-email/CheckEmailContent.tsx` | NEW (`'use client'`) — contains the full JSX |
| `nexacore-dashboard/src/app/password-reset/check-email/page.tsx` | Stripped to 9 lines: imports CheckEmailContent + exports metadata + renders `<CheckEmailContent />`. Stays Server Component for static metadata export. |
| `nexacore-dashboard/tests/e2e/fixtures/no-console-errors.ts` | Removed `/Functions cannot be passed directly to Client Components/i` allowlist entry — gate now fails on regression. |

## 6. Why SCRUM-381 Static Analysis Missed This

SCRUM-381's grep patterns (`from.*middleware`, `export function middleware`, etc.) looked for symbol-level references. The actual violation is a JSX expression value: `as={Link}` where `Link` is a function passed as a prop. No grep pattern would catch this without specifically searching JSX prop expressions with function references — a much harder static check.

**Lesson**: RSC boundary errors are runtime-serialization errors. Live browser console + React DevTools narrows location in seconds; static grep can spend hours not finding it. SCRUM-381's choice to defer rather than burn time on static analysis was correct.

## 7. Verification

- Lint 0 errors
- Build clean (19 routes)
- `curl /password-reset/check-email` → HTTP 200
- Allowlist entry removed: any future regression of the same shape fails the SCRUM-380 console-error gate

## 8. Closure Status

- **SCRUM-401**: complete, transitioned Done.
- **Closes** the Deferred Issue 1 from SCRUM-381 ledger.
- **SCRUM-381 ledger now**: Issue 1 ✅ (this ticket), Issue 2 ✅ (SCRUM-381 commit), Issue 3 deferred (SCRUM-402), Issues 4-6 closed/out-of-scope.

**No follow-up tickets created.**
