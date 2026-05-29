# Implementation Record: SCRUM-350 Phase 9b — Playwright scaffolding

## Summary

Shipped the executable infrastructure for the Phase 9b checks (FE-27..FE-32) already specified in `audit-standards.mdc`. Test BODIES, `docker-compose.e2e.yml`, and CI workflow are explicit Deferred follow-ups requiring supervised iteration.

- **Scope**: frontend (test infrastructure)
- **Branch**: `feature/SCRUM-350-frontend` (merged + deleted after PR #236)
- **Implementation date**: 2026-05-04

## Plan Reference

- Plan: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-350_frontend.md`](../../plans/Sprint%2012/SCRUM-350_frontend.md)
- Verify: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-350_verify.md`](../../plans/Sprint%2012/SCRUM-350_verify.md) — Verdict **PASS-WITH-DEBT**
- Plan was followed: **Yes** — within the explicit "scaffolding only" scope agreed in the plan. Test bodies + docker-compose + CI explicitly Deferred per plan rationale.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `69f8fcc` | SCRUM-350: Playwright scaffolding for Phase 9b auth E2E tests | 5 files: package.json (devDep + scripts), playwright.config.ts (NEW), tests/e2e/auth-flows.spec.ts (NEW, 6 stubs), .gitignore (Playwright artifacts), package-lock.json |

PR #236 merged into `main` at 2026-05-04 ~01:18 UTC. Built on top of SCRUM-349 (`f552c7c`).

## Deviations from Plan

(Imported from `/verify` PASS-WITH-DEBT report — all explicit Deferred items.)

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| Test bodies for FE-27..FE-32 | Stubs only | Stubs only | Bodies need interactive iteration against live stack; not feasible in a single development session without running app + manual selector capture | Deferred | Follow-up ticket: "[SCRUM-350 follow-up] Flesh out FE-27..FE-32 Playwright test bodies" |
| `docker-compose.e2e.yml` | Out of scope | Out of scope | Affects local dev workflow; needs supervised setup against fresh checkouts | Deferred | Follow-up ticket: "[SCRUM-350 follow-up] docker-compose.e2e.yml + seed scripts" |
| `.github/workflows/e2e.yml` | Out of scope | Out of scope | Modifies shared CI infrastructure; needs supervised review (secrets, runner sizing, browser cache, service containers) | Deferred | Follow-up ticket: "[SCRUM-350 follow-up] CI workflow for E2E with browser cache + service containers" |
| Cross-browser matrix | chromium-only | chromium-only | Incremental, not a missing requirement | (no follow-up — incremental improvement) | — |

**0 Risk, 0 Scope-Gap.** All deviations are explicit Deferred follow-ups.

## Test Results

- `npx playwright --version` → `1.59.1`.
- `npx playwright test` → "6 skipped" (clean exit).
- `npx jest --listTests` → does NOT include `tests/e2e/**`.
- TS check on new files: 0 errors.
- Build unaffected (devDependency only).
- Frontend unit-test baseline unchanged (13 pre-existing failures from post-SCRUM-327).

## Bugs Found

None.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog row for SCRUM-350 (test infrastructure scaffold). |
| `ai-specs/changes/auth/records/Sprint 12/SCRUM-350_frontend.md` | This record. |
| `ai-specs/specs/audit-standards.mdc` | NO change — Phase 9b already specified via SCRUM-347 commit `5ec1199`. |
| `ai-specs/specs/frontend-standards.mdc` | NO change — E2E test conventions deferred until bodies are fleshed out (avoids stale docs). |

## Audit Finding Verification

Not an audit-fix ticket. SCRUM-350 implements the audit framework's Phase 9b (specification already in audit-standards.mdc).

## Lessons Learned

- **Scaffolding-only ship is honest about a 3-day infrastructure ticket**: rather than rushing test bodies + docker-compose + CI workflow into one session, splitting into "scaffolding lands" + "follow-ups iterate" delivers immediate value (Playwright is now a recognized devDep, scripts work, file layout is in place) AND keeps each piece supervised. Reusable pattern for any multi-day infra ticket.
- **`test.skip` + TODO comments per AC reference** is a solid bookmark format for the next contributor: each stub names the FE-XX check, the SCRUM ticket and AC it satisfies, and what the body should assert. The next session can iterate without re-reading audit-standards.mdc.
- **Jest vs Playwright extension separation works without config changes**: Jest's default `*.test.ts(x)` testMatch and Playwright's default `*.spec.ts` are naturally disjoint. No `testPathIgnorePatterns` needed in Jest config — confirmed via `npx jest --listTests` excluding `tests/e2e/**`.
- **`webServer` intentionally unset**: documenting that the contributor boots backend + dashboard manually for now is more honest than wiring `webServer.command` to `npm run dev` and pretending a CI-ready setup exists. The setup steps are in the spec file header for the next person.
- **`.gitignore` first-time discipline**: Playwright generates `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`. Adding all 4 patterns to `.gitignore` in the same commit prevents accidental commits in future sessions.
