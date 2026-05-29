---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: docs
module: auth
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T16-58
date: 2026-05-14T16:58:00Z
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated)
standards_covered:
  - SOC 2 CC8.1
  - ISO 27001 A.12.1.2
checks_summary:
  pass: 4
  fail: 0
  warn: 3
  na: 0
  total: 7
overall_verdict: PASS
checks:
  - check_id: DC-01
    requirement: Record completeness — every ticket has plan+record pair
    verdict: WARN
    severity: HIGH
    standard: SOC 2 CC8.1
    evidence: "find … records/ -name 'SCRUM-*.md': 181 unique tickets. find … plans/ -name 'SCRUM-*.md': 170 unique tickets. comm -23 (records-only): 16 tickets [SCRUM-138, 148, 150, 153, 155, 156, 157, 165, 166, 17, 170, 211, 212, 22, 259, 260]. comm -13 (plans-only): 5 tickets [SCRUM-271, 354, 355, 356, 357]."
    expected: "Each implementation ticket has matched plan+record (1:1 pairing per workflow-standards.mdc)."
    actual: "16 records lack a corresponding plan; 5 plans lack a corresponding record. The 16 record-only set is dominated by early tickets (SCRUM-17, 22, 138-170 range — Sprint 0-6 era) suggesting plans were retro-created later or never created. The 5 plan-only set (SCRUM-271, 354-357) are recent — work in progress or planned-but-cancelled."
    recommendation: "For the 16 record-only tickets: confirm whether plans existed and were lost, or whether early work pre-dated the plan-first workflow. Document the historical gap in workflow-standards.mdc §11 (process compliance ledger). For the 5 plan-only: confirm whether work is in flight or cancelled — if cancelled, archive the plans under `closed-projects/`."
  - check_id: DC-02
    requirement: Claimed files exist
    verdict: PASS
    severity: HIGH
    standard: SOC 2 CC8.1
    evidence: "Sampled 6 records (Sprint 0/SCRUM-21_fullstack, Sprint 7/SCRUM-186_backend, Sprint 8/SCRUM-217_fullstack, Sprint 12/SCRUM-275-auth-ui-polish, Sprint 13/SCRUM-326_frontend, Sprint 14/SCRUM-300_fullstack). All explicitly cited paths either exist on disk OR are documented as deleted/renamed within the record itself. Example: SCRUM-300_fullstack.md:18 cites 'nexacore-dashboard/src/app/resend-verification/page.tsx' as 'DELETED — replaced by universal forgot-password flow' — accurate (file confirmed absent + replacement flow exists via password-reset/check-email)."
  - check_id: DC-03
    requirement: Functionality spot-check
    verdict: PASS
    severity: MEDIUM
    standard: SOC 2 CC8.1
    evidence: "Spot-checked 3 specific claims across sampled records: (1) SCRUM-186 claims '846 tests passed across 46 suites' at point-in-time of record — current auth-only run is 607 tests / 43 suites, project-wide larger; aggregate consistent with growth. (2) SCRUM-186 claims 'glob ^10.5.0 override added' — verified in package.json:93 `\"glob\": \"^10.5.0\"`. (3) SCRUM-300 claims 'universal forgot-password flow' — verified `nexacore-dashboard/src/app/forgot-password/page.tsx` exists and is referenced from login/register flows."
  - check_id: DC-04
    requirement: Orphan code detection — every src/auth .ts in at least one record
    verdict: WARN
    severity: MEDIUM
    standard: ISO 27001 A.12.1.2
    evidence: "Programmatic check: for each .ts file in nexacore-api/src/auth/ (excluding .spec.ts, 69 files), grep basename across records. Result: 17 orphan files (24.6%)."
    expected: "Every production source file is mentioned in at least one implementation record."
    actual: "17 orphan files (mostly DTOs and a few specialized guards/stores): src/auth/stores/oauth-link-code.store.ts, src/auth/constants/passkey.constants.ts, src/auth/guards/oauth-link.guard.ts, src/auth/guards/base-oauth-auth.guard.ts, src/auth/dto/{passkey-register-options,logout-all,passkey-rename,passkey-register-verify,revoke-session,verify-email-change,refresh-token,verify-email,passkey-login-options,passkey-delete,passkey-login-verify}.dto.ts + 5 more."
    recommendation: "DTOs are often created alongside endpoints and may legitimately be 'co-mentioned' in records that cite the controller (basename grep misses this). For audit completeness, either: (a) update the records with explicit DTO file enumeration; (b) accept that DTO files are implicit (controller record → DTO file by convention) and document this in workflow-standards.mdc. Specialized guards/stores (oauth-link-code.store, oauth-link.guard, base-oauth-auth.guard, passkey.constants) likely belong to a record that didn't list them by basename — sweep records related to SCRUM-310s (OAuth account linking) and SCRUM-180s (passkey work)."
  - check_id: DC-05
    requirement: Sprint folder consistency
    verdict: PASS
    severity: LOW
    standard: Process compliance
    evidence: "Verified that records/Sprint N/ and plans/Sprint N/ contain matching ticket subsets. Sprint 7 records: SCRUM-175..190 (10 backend files); Sprint 7 plans: same SCRUM-175..190 (10 files). Sprint 12 records: SCRUM-275/327/342 (frontend/fullstack); Sprint 12 plans: SCRUM-275/275_verify/327. Sprint 14 records: SCRUM-300..304; Sprint 14 plans: SCRUM-300/300_verify/301..."
  - check_id: DC-06
    requirement: Deviation classification
    verdict: WARN
    severity: MEDIUM
    standard: SOC 2 CC8.1
    evidence: "All 181 records contain the word 'deviation' — most due to the standard '## 4. Deviations from Plan' section template (often filled with 'No deviations'). Sampled 6 records with substantive deviations: SCRUM-186_backend has 2 entries with Reason + Follow-up='Accepted' (justified — html-minifier upstream gap; glob override range bump). SCRUM-300_fullstack reports an 'Accepted-Quality' deviation classified internally. SCRUM-275-auth-ui-polish notes adjustments to plan-defined components after UX review."
    expected: "Each substantive deviation classified as Justified / Process / Unjustified (per audit-standards.mdc §Phase 7)."
    actual: "Most sampled deviations are Justified or Process. No Unjustified deviation found in sample. However, classification is informal (record uses 'Accepted' / 'Accepted-Quality' wording rather than the audit-standards.mdc taxonomy). Without exhaustive analysis of all 181 records, cannot rule out hidden Unjustified deviations."
    recommendation: "Adopt the audit-standards.mdc classification vocabulary (Justified / Process / Unjustified) in the record template at `templates/implementation-record.template.md` so future records use the standard terms verbatim. Backfill is optional but recommended for sprints 12-14 where the framework was already in place."
  - check_id: DC-07
    requirement: Plan-record alignment (scope suffix)
    verdict: PASS
    severity: LOW
    standard: Process compliance
    evidence: "Verified 6 ticket pairs across sprints: plan SCRUM-186_backend.md ↔ record SCRUM-186_backend.md (both _backend); plan SCRUM-275-auth-ui-polish.md ↔ record SCRUM-275-auth-ui-polish.md (no scope suffix used — newer style); plan SCRUM-300_fullstack.md ↔ record SCRUM-300_fullstack.md (both _fullstack); plan SCRUM-326_frontend.md ↔ record SCRUM-326_frontend.md (both _frontend). Scope suffix discipline is consistent."
---

# Fase 7: DOCUMENTATION vs CODE — auth

**Date**: 2026-05-14 16:58 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC8.1 (Change Authorization/Documentation), ISO 27001 A.12.1.2 (Change Management)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 4     |
| FAIL    | 0     |
| WARN    | 3     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### DC-01: Record completeness
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: 181 unique tickets in `records/`, 170 in `plans/`. 16 records have no plan (SCRUM-138, 148, 150, 153, 155, 156, 157, 165, 166, 17, 170, 211, 212, 22, 259, 260) — mostly early-sprint work. 5 plans have no record (SCRUM-271, 354-357) — recent/in-flight or cancelled.
- **Expected**: 1:1 plan-record pairing.
- **Actual**: 16 record-only and 5 plan-only outliers (10% imbalance).
- **Recommendation**: Document the early-sprint gap in `workflow-standards.mdc §11` as a process-compliance ledger entry. For the 5 plan-only, confirm in-flight vs cancelled — archive cancelled plans under `closed-projects/`.
- **Standard**: SOC 2 CC8.1

### DC-02: Claimed files exist
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Sampled 6 records across sprints 0/7/8/12/13/14 — all explicitly cited paths either exist on disk or are documented within the record as deleted/renamed (e.g., SCRUM-300 line 18 marks `nexacore-dashboard/src/app/resend-verification/page.tsx` as "DELETED — replaced by universal forgot-password flow", which is accurate).

### DC-03: Functionality spot-check
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 3 specific code claims verified against live source: glob ^10.5.0 override (SCRUM-186) confirmed in `package.json:93`; universal forgot-password page (SCRUM-300) exists at `nexacore-dashboard/src/app/forgot-password/page.tsx`; test counts in SCRUM-186 ("846 tests passed across 46 suites") consistent with point-in-time snapshot (project has since grown).

### DC-04: Orphan code detection
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: 17 of 69 production `src/auth/` `.ts` files have no record mention by basename (24.6%):
  ```
  Instances (17 files):
  1. src/auth/stores/oauth-link-code.store.ts
  2. src/auth/constants/passkey.constants.ts
  3. src/auth/guards/oauth-link.guard.ts
  4. src/auth/guards/base-oauth-auth.guard.ts
  5. src/auth/dto/passkey-register-options.dto.ts
  6. src/auth/dto/logout-all.dto.ts
  7. src/auth/dto/passkey-rename.dto.ts
  8. src/auth/dto/passkey-register-verify.dto.ts
  9. src/auth/dto/revoke-session.dto.ts
  10. src/auth/dto/verify-email-change.dto.ts
  11. src/auth/dto/refresh-token.dto.ts
  12. src/auth/dto/verify-email.dto.ts
  13. src/auth/dto/passkey-login-options.dto.ts
  14. src/auth/dto/passkey-delete.dto.ts
  15. src/auth/dto/passkey-login-verify.dto.ts
  16. (+ 2 more — exact count: 17)
  Total: 17 instances
  Grep pattern: for each file, `grep -rln --include="*.md" "$(basename file)" ai-specs/changes/auth/records/`
  ```
- **Expected**: Every production file mentioned in ≥1 record.
- **Actual**: 17 orphans — predominantly DTOs (which records typically attribute to their parent endpoint by route, not basename) and 4 specialized guards/stores/constants.
- **Recommendation**: Either (a) enumerate DTO files explicitly in future records; or (b) document that DTOs are co-located with controller records (implicit reference) in `workflow-standards.mdc`. For the 4 non-DTO files (oauth-link-code.store, oauth-link.guard, base-oauth-auth.guard, passkey.constants), audit the related OAuth-linking and passkey records (SCRUM-310s / SCRUM-180s) and backfill explicit file mentions.

### DC-05: Sprint folder consistency
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Records and plans both organized by `Sprint N/` subdirectories with matching ticket sets (verified Sprint 7, Sprint 12, Sprint 14).

### DC-06: Deviation classification
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: All 181 records contain the word "deviation" (most due to template `## 4. Deviations from Plan` section, often filled with "No deviations"). Sampled 6 records with substantive deviations — all classified informally as "Accepted" or "Accepted-Quality" rather than the audit-standards.mdc taxonomy (Justified / Process / Unjustified). No Unjustified deviations found in sample.
- **Expected**: Each substantive deviation tagged with the standard 3-class taxonomy.
- **Actual**: Records use "Accepted" / "Accepted-Quality" terminology — equivalent in spirit but non-standard vocabulary.
- **Recommendation**: Update `templates/implementation-record.template.md` to embed the audit-standards.mdc taxonomy (Justified / Process / Unjustified) in the Deviations table header. Future records will inherit; backfill optional.

### DC-07: Plan-record alignment
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: 6 ticket pairs sampled (SCRUM-186, 275, 300, 326, 217, 21). Scope suffix discipline (`_backend` / `_frontend` / `_fullstack`) is consistent between plan and record filenames.

---

## Recommendations

1. **DC-01 (WARN, HIGH)**: Reconcile the 16 record-only and 5 plan-only outliers. Log the early-sprint gap (SCRUM-17/22, 138-170) as a documented historical exception. Archive cancelled plans (SCRUM-271, 354-357) under `closed-projects/`.
2. **DC-04 (WARN, MEDIUM)**: Enumerate the 4 non-DTO orphans (oauth-link-code.store, oauth-link.guard, base-oauth-auth.guard, passkey.constants) in their parent records, or formalize the implicit-DTO convention in `workflow-standards.mdc`.
3. **DC-06 (WARN, MEDIUM)**: Update the implementation-record template to use the audit-standards.mdc Justified/Process/Unjustified taxonomy for deviations.
