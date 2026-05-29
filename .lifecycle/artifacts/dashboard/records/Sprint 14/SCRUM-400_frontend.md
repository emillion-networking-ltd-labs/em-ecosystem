# Implementation Record: SCRUM-400 Rename `middleware.ts` → `proxy.ts` (Next 16 deprecation)

## 2. Summary

Surgical rename to drop the Next 16 deprecation warning on `middleware.ts` and align the dashboard with the new `proxy.ts` file convention. 1 file moved via `git mv`, 1 exported function renamed (`middleware` → `proxy`). No behavior change.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-400-frontend` (merged + deleted)
- **Implementation date**: 2026-05-12
- **Lifecycle elapsed**: same-day (~10 min total — enrich + plan + develop + verify + commit + update-docs)

## 3. Plan Reference

- **Plan**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-400_frontend.md`
- **Verify report**: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-400_verify.md` (verdict: **PASS**)
- **Plan was followed**: Yes — 7/7 steps complete, 1 step (optional e2e) skipped per plan's explicit "skip if time-constrained — CI is the authoritative gate" note.

## 4. Commits

| Hash | Repo | Branch | Message |
|------|------|--------|---------|
| `2529387` | em-ecosystem-code | feature/SCRUM-400-frontend | SCRUM-400: rename middleware.ts to proxy.ts (Next 16 deprecation) |
| `b5e275e` | em-ecosystem-code | main (squash via PR #298) | same as above |
| (pending) | ai-specs | main (direct) | docs(SCRUM-400): plan + verify + record + audit-standards.mdc reference update |

## 5. Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 5 | (Optional) Run Playwright `auth-flows.spec.ts` + `a11y.spec.ts` locally | Skipped | Plan explicitly listed Step 5 as "optional, time-permitting" with note "Skip if time-constrained — CI is the authoritative gate". CI Security Pipeline + Visual Regression run all e2e on PR. | Accepted-Trivial | — |

**1 deviation classified as Accepted-Trivial.** Zero Accepted-Quality / Accepted-Risk / Deferred / Pre-existing / Scope-Gap. No tech-debt tickets created.

## 6. Test Results

- **Build**: `npm run build` clean, 19 routes generated (Next 16 reports `ƒ Proxy (Middleware)`, confirming runtime acknowledges the new convention)
- **Lint**: `npm run lint` 0 errors, 0 new warnings
- **Smoke test**: `curl -D - http://localhost:3001/login` returned HTTP 200 with `Content-Security-Policy: default-src 'self'; script-src ...nonce-pAIdbDh3xIF/qrpRxKeHkA== 'strict-dynamic' ...` and matching `x-nonce: pAIdbDh3xIF/qrpRxKeHkA==`. Turnstile allowlist (`https://challenges.cloudflare.com` in `script-src`, `connect-src`, `frame-src`) intact.
- **Cross-file impact grep**: `grep -rn "from.*middleware\|src/middleware\|export function middleware" nexacore-dashboard/src nexacore-dashboard/tests` returned **0 matches** — confirming the file is consumed via Next file-convention, not via `import`, so the rename has zero cross-file blast radius.
- **User-confirmed visual signal**: deprecation warning `'middleware' file convention is deprecated` no longer appears in `npm run dev` console output after the rename + dev server restart.
- **CI on PR #298**:
  - Security Pipeline: **GREEN** ✓
  - Visual Regression: **failure** (pre-existing pattern — CSRF token fetch errors when API is not deployed in CI; same failure mode observed in PR #296 and recent main commits e147d3c, c4f161d. Not introduced by this PR.)
  - Structural Design-Token Probe: not triggered (PR doesn't touch `globals.css` / design tokens / Button.tsx / ComponentShowcase.tsx / TokenInspector.tsx — workflow path filters correctly excluded this PR, expected).

## 7. Bugs Found

None.

The rename was a pure mechanical migration. No edge cases, no surprises. The only minor finding was that running `git diff --staged` reports the post-edit file as `new file mode` (does not show the rename detection in the diff output), but `git status` correctly shows `R src/middleware.ts -> src/proxy.ts` (97% similarity). Both representations are correct — `git diff` and `git status` use different rename-detection heuristics for staged vs index display. Behavior documented for future PR reviewers.

## 8. Documentation Updates

| File | Changes Made |
|------|--------------|
| `ai-specs/specs/audit-standards.mdc` | Line 895 updated: file path reference `nexacore-dashboard/src/middleware.ts` → `nexacore-dashboard/src/proxy.ts`, with annotation `— was middleware.ts pre-SCRUM-400 (Next 16 rename)`. This is the audit framework's "files-relevant-to-Phase-N" registry; keeping it accurate prevents future audits from grepping the wrong path. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-400_frontend.md` | NEW: 6-step implementation plan written during `/plan`. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-400_verify.md` | NEW: verification report (verdict PASS). |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-400_frontend.md` | NEW: this record. |

**Historical record files preserved as-is** (per plan rule "DO NOT update historical records (records are point-in-time snapshots)"). 6 references to `middleware.ts` in `ai-specs/changes/.../`(audit reports + previous records) remain intact — they accurately reflect the codebase state at those points in time.

**Backend NestJS middleware references unaffected**: 8+ grep matches for `helmet.middleware.ts` and `src/common/middleware/*.middleware.ts` all live in `nexacore-api/`. These are NestJS middleware (different framework, different convention). Not in scope of SCRUM-400.

## 9. Audit Finding Verification

**Not applicable** — SCRUM-400 is a refactoring ticket (Next 16 deprecation cleanup), not an audit remediation ticket. No "Instances to Fix" table existed in the Jira description because Step 3 of `/enrich-us` (audit enumeration) was correctly skipped.

## 10. Lessons Learned

### What went well

- **Single-pass execution**: 6 lifecycle steps (`/enrich-us` → `/plan` → `/develop` → `/verify` → `/commit` → `/update-docs`) completed in same-day, ~10 minutes of effective dev work, zero rework. The minimal-scope discipline (`rename-only, no bundled CSP changes`) paid off.
- **Git rename detection at 97% similarity**: confirms `git mv` worked cleanly. Reviewers can trace history with `git log --follow src/proxy.ts`.
- **Next 16 internal acknowledgement**: build report changed from `ƒ Middleware` (pre-rename) to `ƒ Proxy (Middleware)` (post-rename) without any other config change. The runtime had already adopted the new naming; we just aligned the source.
- **Plan explicitly listed Step 5 as optional**: this avoided a false Accepted-Quality classification. The Verify report's deviation table correctly reflects the plan's intent (Accepted-Trivial, not "Quality / coverage gap").

### What was harder than expected

- **OneDrive file-lock recurrence**: pre-push hook would have run `npm ci` and locked on `@tailwindcss/oxide-win32-x64-msvc.node` (yet again). Used `--no-verify` per the workaround codified in `workflow-standards.mdc §13.6.7` shipped 2 days ago via SCRUM-396. The workaround worked exactly as documented — first real validation of §13.6.7 as a procedure.

### What to reuse for future similar tickets

- **Rename-only PR template**: 1-file `git mv` + 1-line function rename is a reproducible pattern for any Next.js deprecation that moves convention names. When Next 17 ships and removes more conventions (or adds renames), the same 6-step lifecycle applies with minor adjustments.
- **The `[original]` + `[enhanced]` Jira description pattern** worked here as well as it has in audit fix tickets. Even for non-audit refactoring tickets, the `## [enhanced]` section with codebase analysis + cross-package check + step-by-step + AC made `/plan` and `/verify` straightforward.
- **CI strategic pause is a stable pattern**: this PR's Visual Regression failure (pre-existing CSRF issue) was correctly identified as non-blocking via the audit-style triage memory rule. PR shipped to main on Security Pipeline GREEN alone.

### Tech debt observations (informational, NOT creating new tickets)

- **SCRUM-373 retro-comment**: this PR's clean lifecycle is a good case study to reference when future major-bumps land. The deferred satellite turbopack.root pin (`c3abfc5`) + this SCRUM-400 rename together close out the Next 16 follow-up debt from SCRUM-364.
- **No new tech debt surfaced**: the rename was clean. CSP policy hardening (a known future ticket) is not coupled to the rename and remains in backlog.

## 11. Tech Debt Tickets Created (this /update-docs run)

**None.** The single deviation (Step 5 optional e2e skipped) is Accepted-Trivial — no follow-up ticket needed because CI workflows run those suites on every PR.

## Closure Status

- **SCRUM-400 code**: complete on em-ecosystem-code `main` (commit `b5e275e`, PR #298 merged + branch deleted).
- **SCRUM-400 ai-specs**: this record + plan + verify + audit-standards.mdc update (pending commit in this /update-docs run).
- **No follow-up tickets**: 0 created.

**USER actions** (post-this-/update-docs):
1. Transition SCRUM-400 → Done in Jira when ready.
2. No further follow-up actions required.
