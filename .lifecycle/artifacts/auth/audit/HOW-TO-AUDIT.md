# How to Use the Audit Framework

## Quick Reference

```
/audit [module] [phase]
```

| Argument | Options |
|----------|---------|
| **module** | `auth`, `users`, `permissions`, `security`, `sessions`, `audit`, `geolocation`, `mail`, `common`, `all` |
| **phase** | `build`, `tests`, `security`, `api`, `data-model`, `integration`, `docs`, `dependencies`, `frontend`, `code-quality`, `report`, `full` |

---

## Common Commands

### Full module audit (recommended first time)
```
/audit auth full
```
Runs all 11 phases sequentially. Produces individual phase reports + a Module Completion Report. Creates a Jira audit ticket with child tickets for any FAIL findings.

### Single phase audits
```
/audit auth security       # Security compliance only (OWASP, NIST, OAuth, JWT)
/audit auth tests          # Test health and coverage only
/audit auth api            # API contract: spec vs controllers
/audit auth integration    # Module imports/guards/DI vs integration-state.md
/audit auth docs           # Implementation records vs actual code
/audit auth code-quality   # Duplication, complexity, SOLID, TypeScript strictness
/audit all build           # Build and startup health (global)
/audit all data-model      # Prisma schema vs data-model.md (global)
/audit all dependencies    # npm audit, outdated, licenses (global)
```

### Generate completion report only
```
/audit auth report
```
Requires previous phase results in the same audit folder. Aggregates all findings into the Module Completion Report and creates Jira tickets.

---

## What Each Phase Does

### Phase 1: BUILD (8 checks, global)
Verifies `nest build` compiles, `nest start` boots all modules, route count matches API spec, database/Redis connectivity, and environment completeness. Standards: SOC 2 CC7.1, CC8.2.

### Phase 2: TESTS (14 checks, per module)
Runs Jest for the target module. Checks coverage thresholds (90/85/90/90), mock fidelity across ALL spec files, no skipped tests, error path coverage, test isolation, E2E existence, and execution time. Standards: ISO 25010, SOC 2 CC8.3.

### Phase 3: SECURITY (per module)
The most comprehensive phase. ~125 checks organized in 14 sub-phases:

| Sub-phase | Standard | Checks | What it verifies |
|-----------|----------|--------|------------------|
| 3a | OWASP ASVS Ch 2 | 18 | Password policy, MFA, breach check, credentials |
| 3b | OWASP ASVS Ch 3 | 10 | Session binding, logout, timeouts, concurrent limits |
| 3c | OWASP ASVS Ch 4 | 8 | RBAC, CSRF, deny-by-default, self-escalation |
| 3d | OWASP ASVS Ch 5 | 7 | Input validation, SQL injection, eval, UUID params |
| 3e | OWASP ASVS Ch 6 | 5 | Bcrypt, crypto.randomBytes, key management |
| 3f | NIST SP 800-63B | 9 | Digital identity, reauthentication, session compliance |
| 3g | RFC 9700 | 8 | OAuth PKCE, state, redirect, ephemeral codes |
| 3h | RFC 8725 | 6 | JWT algorithm, claims (iss, aud, exp, jti), rotation |
| 3i | HTTP Security | 12 | Helmet headers, CORS, rate limiting, lockout |
| 3j | CWE-200/203/209 | 13 | Error message info disclosure, user enumeration |
| **3k** | **OWASP ASVS Ch 7** | **7** | **Logging adequacy, no PII in logs, log injection, error handling** |
| **3l** | **OWASP ASVS Ch 8** | **7** | **Data protection: caching, browser storage, query strings, DB TLS** |
| **3m** | **OWASP ASVS Ch 13** | **5** | **API security: content-type, HTTP methods, transport integrity** |
| **3n** | **CWE-1321/1333/918** | **9** | **Prototype pollution, ReDoS, SSRF, secrets in git** |

Every check reads the actual source file and cites the line number as evidence.

### Phase 4: API CONTRACT (8 checks, per module)
Compares `api-spec.yml` against controller decorators. Classifies endpoints as Aligned/Spec-only/Code-only/Mismatched. Verifies DTO-to-schema match, response schemas, HTTP method semantics, and pagination consistency. Standards: OpenAPI 3.0, SOC 2 CC8.1.

### Phase 5: DATA MODEL (14 checks, global)
Compares `schema.prisma` against `data-model.md`. Verifies entities, enums, relations, indices, defaults, **plus**: migration integrity, cascade delete safety, audit trail fields (createdAt/updatedAt), unique constraints, seed safety, raw query absence. Standards: SOC 2 CC7.5, NIST AU-8.

### Phase 6: INTEGRATION (10 checks, per module)
Compares `integration-state.md` against actual module files. Verifies imports, exports, providers, guards, DI, permissions, **plus**: cross-module boundary violations and ConfigService centralization. Standards: ISO 25010, CWE-1047.

### Phase 7: DOCS vs CODE (7 checks, per module)
For each implementation record: verifies claimed files exist, spot-checks functionality claims, detects orphan code, classifies deviations. Standards: SOC 2 CC8.1, ISO 27001 A.12.1.2.

### Phase 8: DEPENDENCIES (12 checks, global)
Runs `npm audit` (full + production-only) and `npm outdated`. Checks CVEs, licenses, unused deps, **plus**: lock file integrity, `npm ci` verification, Node.js version pinning, integrity hashes, supply chain (no file:/git: deps), duplicate packages. Standards: OWASP A06:2021, NIST SA-11.

### Phase 9: FRONTEND-BACKEND INTEGRATION (26 checks, per module)
Verifies backend security features have corresponding frontend implementations. 23 existing checks **plus**: error boundaries, form validation consistency (frontend matches backend DTOs), accessibility on auth flows (WCAG 2.1 AA). Standards: OWASP V8.2, WCAG 2.1 AA.

### Phase 10: CODE QUALITY (per module)
35 checks organized in 6 sub-phases with **two-tier verification** (deterministic CLI tools + heuristic code reading):

| Sub-phase | Standard | Checks | What it verifies |
|-----------|----------|--------|------------------|
| 10a | ISO 25010, CWE-1080 | 6 | File length, function length, module concentration |
| 10b | CWE-1120/1121, SonarQube | 5 | Cyclomatic complexity, cognitive complexity, nesting depth, fan-out |
| 10c | SonarQube QG, CISQ | 5 | Duplicated lines %, clone blocks, cross-file clones (uses `jscpd`) |
| 10d | ISO 25010, SOLID | 6 | God class, controller thinness, SRP, circular deps, interface segregation |
| 10e | ISO 25010, TypeScript | 6 | strict mode, `any` usage, ESLint errors, `@ts-ignore`, type assertions |
| 10f | Clean Code, CWE-1006 | 7 | Magic numbers/strings, dead code, commented-out code, console.log, naming |

Applies **file-type thresholds**: production (base), tests (×3 length, ×2 duplication), DTOs (×1.5 length), controllers (×0.75 — stricter).

### Phase 11: COMPLETION REPORT (per module)
Aggregates all phases into a single executive document with: summary dashboard, traceability matrix, deviation summary, risk register, metrics, and sign-off checklist.

---

## Output Structure

All reports are saved to a timestamped folder:

```
ai-specs/ai-specs/changes/audit/audit-2026-03-03T14-30/
  fase-1-build.md                    # Global
  fase-2-tests-auth.md               # Per module
  fase-3-security-auth.md            # Per module (all sub-phases in one file)
  fase-4-api-auth.md                 # Per module
  fase-5-data-model.md               # Global
  fase-6-integration-auth.md         # Per module
  fase-7-docs-auth.md                # Per module
  fase-8-dependencies.md             # Global
  fase-9-frontend-auth.md            # Per module
  fase-10-code-quality-auth.md       # Per module (all sub-phases in one file)
  auth-completion-report.md          # Per module (Phase 11)
```

---

## Jira Integration

On `full` or `report`, the framework automatically:

1. Creates a parent ticket: **"Audit Report: Auth Module (2026-03-03)"**
2. For each FAIL finding, creates a child ticket: **"Audit Fix: V2.1.7 — Bcrypt cost below 10"**
3. All tickets are assigned to the current active sprint
4. If 0 FAIL findings, the parent ticket is closed as PASS

This follows the **ISO 27001 Corrective Action Request (CAR)** model — every finding is trackable and closable.

---

## Verdict and Severity Reference

| Verdict | Meaning |
|---------|---------|
| **PASS** | Verified against live code with file:line evidence |
| **FAIL** | Non-compliant — includes expected vs actual + standard reference |
| **WARN** | Partially compliant — needs manual review |
| **N/A** | Not applicable to this module |

| Severity | Action Required |
|----------|-----------------|
| **CRITICAL** | Immediate fix — blocks release |
| **HIGH** | Fix before next release |
| **MEDIUM** | Fix within current sprint |
| **LOW** | Backlog |
| **INFO** | No action |

---

## Typical Workflow

### First audit of a module
```
/audit auth full
```
Review the completion report. Fix any FAIL findings using the generated Jira child tickets. Then re-audit:
```
/audit auth full
```
Repeat until 0 FAIL findings. The module is now certified.

### After code changes
Run only the affected phases:
```
/audit auth tests          # If tests changed
/audit auth security       # If auth logic changed
/audit auth api            # If endpoints changed
/audit auth code-quality   # If services refactored or files added
```

### Before a release
```
/audit all full            # Audit every module
```

---

## Key Rules

- The audit is **read-only** — it never modifies code, tests, or docs
- Every check verifies against **live code** — never cached or previous results
- The standards file (`audit-standards.mdc`) is the single source of truth for all criteria
- Phase 3 (Security) uses **Opus** model for depth. All other phases use **Sonnet** for cost efficiency
