# Backend Implementation Plan: SCRUM-354 Restore 0-CRITICAL/0-HIGH npm audit baseline

> **Note**: This is a dependency-upgrade ticket. Several sections of the standard 16-section template (Architecture Context, DTO design, Service/Controller patterns, Module Registration, Module-Level Planning, Satellite Planning) are N/A for pure dependency work. Sections marked N/A explain why.

---

## 2. Codebase State Snapshot

- **Date**: 2026-05-07
- **Last completed ticket**: SCRUM-298 (Chart.js → Recharts migration, commit 0bde051)
- **Sprint**: Sprint 14 (id=477, active 2026-05-07 → 2026-05-21)
- **Integration state verified**: Yes — `integration-state.md` does not enumerate dependency versions (those live in `package.json`); no integration drift caused by package versions
- **Files verified against live code**:
  - `em-ecosystem-code/nexacore-api/package.json` (read fully)
  - `em-ecosystem-code/nexacore-api/package-lock.json` (header verified: lockfileVersion 3)
  - `em-ecosystem-code/nexacore-api/src/common/utils/validate-production-secrets.ts` (read fully — confirms no hardcoded version dependencies that the bumps would break)
  - `em-ecosystem-code/nexacore-api/src/main.ts` (boots cleanly per Phase 1 audit B-02 PASS)
- **Constructor signatures verified**: N/A — this ticket does not modify any class.
- **Methods verified to exist**: N/A — no method-level changes.
- **Guard dependency chain verified**: N/A — no guard changes.
- **Discrepancies with integration-state.md**: None.

---

## 3. Regression Impact Analysis

- **Blast radius**: Every backend file that imports from `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/testing`, `@nestjs-modules/mailer` (handlebars dep). That is essentially **every TS file in `nexacore-api/src/`** (~150+ files). Direct module imports also include 43 spec files.
- **Breaking changes identified**:
  - NestJS family 11.1.17 → 11.1.19 is a **patch bump**. Per semver, no breaking changes expected. Verified by inspecting NestJS CHANGELOG for 11.1.18 and 11.1.19 (security patches only, no API surface changes).
  - `@nestjs/swagger` 11.2.6 → 11.4.2 is a **minor bump** — possibly cosmetic Swagger UI changes. No API surface changes for our usage (we only use `@ApiProperty`/`@ApiResponse` decorators, stable since 11.0).
  - `@nestjs/config` 4.0.3 → 4.0.4 is a **patch**. No surface change.
  - lodash override `>=4.17.22` → `>=4.17.24`: lodash is not used directly by `nexacore-api/src/`. Only via transitive deps. No code surface impact.
  - **handlebars**: not changed in this ticket unless an upstream patch is available (4.7.9+). If handlebars is used directly (it is, via `@nestjs-modules/mailer` for email templates), template syntax must remain stable — verified by checking handlebars 4.x semver policy (templates compatible across all 4.x).
- **API contract impact**: None. No endpoint signatures change.
- **Schema migration impact**: None. No Prisma schema changes.
- **Test files requiring updates**: Expected to be **0** files. All bumps are patch/minor and tests should pass without modification. If any test breaks, root-cause it (do not suppress).
- **Blast radius size**: 150+ files transitive — but **0 files require explicit modification**. Risk mitigated by patch-level bumps. **Flag for full test-suite verification in /verify** (not just auth tests).

---

## 4. Overview

Restore the `npm audit` 0-CRITICAL/0-HIGH baseline that was lost between 2026-03-29 and 2026-05-06 due to new advisories on the NestJS family, `handlebars`, `lodash`, and `prisma` lines. Strategy: bump everything that has a clean upstream patch in this PR; document handlebars + prisma as Accepted-Risk-MEDIUM with compensating controls if upstream patches aren't yet available.

---

## 5. Architecture Context

- **Modules involved**: All — `package.json` is the single dependency manifest for the backend. No code modules created or deleted.
- **Components affected**: None at the code level.
- **Files referenced**:
  - `em-ecosystem-code/nexacore-api/package.json` — version pins + overrides
  - `em-ecosystem-code/nexacore-api/package-lock.json` — auto-regenerated

---

## 6. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create feature branch `feature/SCRUM-354-deps-upgrade` from current `main`.
- **Branch Naming**: `feature/SCRUM-354-deps-upgrade` (per backend-standards.mdc Development Workflow). Concise — this is a backend-only ticket so no `-backend` suffix needed (single PR).
- **Implementation Steps**:
  1. From `em-ecosystem-code/` repo root, ensure on `main` and clean: `git status` → no uncommitted changes.
  2. Pull latest: `git pull origin main`.
  3. Create branch: `git checkout -b feature/SCRUM-354-deps-upgrade`.
  4. Confirm: `git branch --show-current` → `feature/SCRUM-354-deps-upgrade`.

### Step 1: Capture Baseline
- **File**: N/A (read-only)
- **Action**: Capture the current state of `npm audit` for the audit record.
- **Implementation Steps**:
  1. From `nexacore-api/`, run: `npm audit --json | jq '.metadata.vulnerabilities' > /tmp/scrum354-before.json`.
  2. Run: `npm audit --omit=dev --json | jq '.metadata.vulnerabilities' > /tmp/scrum354-before-prod.json`.
  3. Save both for inclusion in the implementation record.

### Step 2: Bump NestJS Family (patch)
- **File**: `nexacore-api/package.json`
- **Action**: Bump 5 NestJS packages to 11.1.19. Each is a patch-level bump.
- **Implementation Steps**:
  1. From `nexacore-api/`, run: `npm update @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/testing` — npm honors the existing `^11.x.x` ranges, so this resolves to 11.1.19.
  2. Verify: `npm ls @nestjs/core` → 11.1.19+. Repeat for each package above.
  3. **Expected effect on audit**: clears DEP-01 highs #2, #3, #4 (direct) + transitive #7 (defu), #12 (path-to-regexp), #13 (picomatch).

### Step 3: Bump @nestjs/swagger (minor)
- **File**: `nexacore-api/package.json`
- **Action**: Bump @nestjs/swagger 11.2.6 → 11.4.2.
- **Implementation Steps**:
  1. Run: `npm install @nestjs/swagger@^11.4.2`. Use `install` instead of `update` because the existing range `^11.2.6` does not include 11.4.x by default with strict semver — verify the resolved version with `npm ls @nestjs/swagger`.
  2. **Expected effect on audit**: clears DEP-01 high #5 (direct) + transitive #9 (flatted).

### Step 4: Update lodash Override
- **File**: `nexacore-api/package.json`
- **Action**: Update the `overrides` block to bump lodash to `>=4.17.24`.
- **Implementation Steps**:
  1. Open `package.json`. Find the `overrides` block (line ~102).
  2. Change `"lodash": ">=4.17.22"` → `"lodash": ">=4.17.24"`.
  3. Run: `npm install` to apply the override.
  4. Verify: `npm ls lodash` → all branches `>=4.17.24`.
  5. **Expected effect on audit**: clears DEP-01 transitive #11 (lodash), and cascades to chevrotain group (#1, #2, #6).

### Step 5: Intermediate Verification
- **File**: N/A (read-only)
- **Action**: Confirm intermediate audit state before tackling handlebars + prisma.
- **Implementation Steps**:
  1. Run: `npm audit --json | jq '.metadata.vulnerabilities'`.
  2. Expected after Steps 2-4: `critical: 1, high: 1-3` (handlebars + prisma + possibly transitive prisma items).
  3. If higher than expected, re-investigate which transitive did not auto-resolve. Do NOT proceed until intermediate state is understood.

### Step 6: Investigate handlebars
- **File**: `nexacore-api/package.json` (potentially — only if patch exists)
- **Action**: Check if handlebars 4.7.9+ is available, apply if so; otherwise document as Accepted-Risk-MEDIUM.
- **Implementation Steps**:
  1. Run: `npm view handlebars versions --json | jq '.[-5:]'` to see latest 5 versions.
  2. If 4.7.9+ exists: add `"handlebars": "^4.7.9"` to the `overrides` block in package.json. Run `npm install`. Re-audit.
  3. If only 4.7.8 exists upstream: do NOT downgrade or migrate engine in this ticket. Document as **Accepted-Risk-MEDIUM** in the implementation record (and `risk-analysis.md` per audit-standards Section 6.4) with compensating controls:
     - Templates are static `.hbs` files compiled at startup, never with user input
     - User context is passed as variables (auto-escaped)
     - No `Handlebars.compile(userInput)` call exists in `src/`
     - Verified by grep: `grep -rn "Handlebars\.compile\|handlebars\.compile" src/` → 0 matches
  4. Risk acceptance documented; ticket can proceed.

### Step 7: Investigate Prisma
- **File**: `nexacore-api/package.json` (potentially — only if patch exists)
- **Action**: Check if Prisma 7.x has a clean upstream patch; do NOT downgrade to 6.19.3.
- **Implementation Steps**:
  1. Run: `npm view prisma versions --json | jq '.[-5:]'` to see latest 7.x versions.
  2. If a clean 7.x version exists (post the vulnerable range `>=6.20.0-dev.1`): apply via `npm install prisma@<clean-version>` + `npm install @prisma/client@<clean-version>`.
  3. If no clean 7.x patch exists: do NOT downgrade. Apply selective overrides if clean transitives are available:
     - `"@prisma/config": "<clean-version>"` (if exists)
     - `"@prisma/dev": "<clean-version>"` (if exists)
  4. If neither path is feasible: document as **Accepted-Risk-MEDIUM** with compensating controls:
     - Prisma CLI vulnerabilities are dev-only (CLI not exposed in prod runtime)
     - `@prisma/client` runtime is at 7.5.0 (clean per DEP-03)
     - `prisma` CLI dev dependency only runs during migrations + studio + generate (developer machines, not production servers)

### Step 8: Final Verification
- **File**: N/A
- **Action**: Confirm DEP-01 + DEP-08 acceptance criteria.
- **Implementation Steps**:
  1. `npm audit --json | jq '.metadata.vulnerabilities'` — expect `critical: 0` AND `high: 0`. If 1-2 remain (handlebars + prisma), confirm both are formally Accepted-Risk per Step 6/7.
  2. `npm audit --omit=dev --json | jq '.metadata.vulnerabilities'` — same check.
  3. `npx jest --testPathPatterns=auth --forceExit --maxWorkers=2 --silent` — expect 607 passing.
  4. `npx jest --forceExit --maxWorkers=2 --silent` (full repo, no path filter) — expect all suites passing.
  5. `npm run build` — expect exit 0.
  6. Smoke boot: `node dist/main.js` — confirm "Nest application successfully started" appears within 10s.

### Step 9: Update Technical Documentation
- **Action**: Document version bumps in integration-state.md if it tracks versions; add audit fix note to relevant section.
- **Implementation Steps**:
  1. Read `ai-specs/specs/integration-state.md` — confirm if version pins are tracked. Currently they are NOT enumerated, only module dependencies. **No update required for this ticket** — versions live in package.json.
  2. If any Accepted-Risk was documented in Step 6 or 7: ensure `risk-analysis.md` exists in the audit folder `ai-specs/changes/auth/audit/audit-2026-05-06T22-44/risk-analysis.md` with formal acceptance per audit-standards Section 6.4 (no viable fix, compensating controls, residual risk, owner, review schedule).
  3. Implementation record (created during /commit + /update-docs) will document the resolution in `ai-specs/changes/auth/records/Sprint 14/SCRUM-354_record.md`.

---

## 7. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Capture baseline npm audit state
3. Step 2: Bump NestJS family (patch)
4. Step 3: Bump @nestjs/swagger (minor)
5. Step 4: Update lodash override
6. Step 5: Intermediate verification — confirm 1 critical + 1-3 high remain
7. Step 6: Investigate + apply handlebars patch OR Accepted-Risk
8. Step 7: Investigate + apply Prisma patch OR Accepted-Risk
9. Step 8: Final verification (audit + tests + build + smoke boot)
10. Step 9: Update technical documentation (only if Accepted-Risk applied)

---

## 8. Testing Checklist

- [ ] Step 1 baseline captured to `/tmp/scrum354-before*.json`
- [ ] After Step 4: `npm ls @nestjs/core` returns 11.1.19+
- [ ] After Step 4: `npm ls lodash` all branches `>=4.17.24`
- [ ] After Step 5: intermediate audit returns expected count (1 crit + 1-3 high)
- [ ] After Step 8: `npm audit --json | jq '.metadata.vulnerabilities.{critical,high}'` returns 0/0 (or formally Accepted-Risk)
- [ ] After Step 8: `npm audit --omit=dev --json | jq '.metadata.vulnerabilities.{critical,high}'` returns 0/0
- [ ] After Step 8: `Test Suites: 43 passed, 43 total. Tests: 607 passed, 607 total.` (auth filter)
- [ ] After Step 8: full repo test run passes (no regressions in non-auth modules)
- [ ] After Step 8: `nest build` exit 0
- [ ] After Step 8: smoke boot succeeds (Nest app started)

**Regression test checklist**: All auth specs (43 files, 607 tests) — expected to pass without modification. If any spec breaks, **stop and root-cause** — do not classify as Accepted-Quality.

---

## 9. Error Response Format

N/A — no endpoint changes.

---

## 10. Partial Update Support

N/A — no API or behavior changes.

---

## 11. Dependencies

- `npm` 10+ (already pinned via package.json engines)
- `node` 22+ (already pinned via .nvmrc)
- `jq` (CLI utility, available on dev machines)

---

## 12. Notes

- **Do NOT downgrade Prisma** to 6.19.3. The fixAvailable indication is misleading — semver-major downgrade would break migrations and schema features adopted in 7.x.
- **Atomic commit**: `package.json` + `package-lock.json` must be committed together.
- **No --no-verify**: pre-commit hooks must run (per memory feedback).
- **Memory feedback applies**: if any test breaks during this ticket, classify the deviation correctly. NestJS patch bumps breaking tests would be a **regression flag**, not Accepted-Quality.

---

## 13. Next Steps After Implementation

- After /commit + /update-docs: open SCRUM-355 (parallel-OK, docs-only) and proceed.
- Re-run `/audit auth dependencies` (Phase 8 only) post-merge to confirm DEP-01 + DEP-08 → PASS in the next audit.
- Wave 2 tickets (SCRUM-358, 357, 356) will land after this ticket is on `main` because subsequent typing work (SCRUM-358) benefits from the bumped NestJS types.

---

## 14. Implementation Verification

- [ ] Code Quality: package.json + package-lock.json well-formed; no orphan entries
- [ ] Functionality: smoke boot succeeds, all 607 tests pass
- [ ] Testing: `npm test` full repo passes
- [ ] **Regression**: every file in blast radius (~150+) compiles cleanly via `nest build`; no broken imports surfaced
- [ ] Integration: app boots with PrismaModule, RedisModule, AuthModule all initialized
- [ ] Documentation: implementation record drafted; risk-analysis.md updated if Accepted-Risk used

---

## 15. Module-Level Planning

N/A — this ticket does not create or modify a NexaCore module.

## 16. Satellite App Planning

N/A — backend dependency upgrade only.
