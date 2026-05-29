# SCRUM-303 — Plan: Frontend localStorage/sessionStorage security check

## Scope
Frontend audit (no code changes)

## Steps
1. Search entire nexacore-dashboard/src for localStorage, sessionStorage, IndexedDB, document.cookie
2. Verify no tokens, secrets, passwords, or PII stored in browser storage
3. Confirm access token is memory-only (api.ts)
4. Confirm CSRF token is memory-only (csrf.ts)
5. Document all localStorage usage and classify as sensitive/non-sensitive
