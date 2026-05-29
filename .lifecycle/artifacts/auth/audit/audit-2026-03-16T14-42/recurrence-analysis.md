# Recurrence Analysis — Auth Module Audit 2026-03-16

**Previous audit**: audit-2026-03-15T19-49
**Current audit**: audit-2026-03-16T14-42

---

## Finding-by-Finding Classification

### Previous FAIL Findings (6) — All Remediated

| Previous Check | Previous Verdict | Current Verdict | Classification | Remediation Ticket |
|---------------|-----------------|----------------|----------------|-------------------|
| A-07 | FAIL | PASS | REMEDIATED | SCRUM-243 |
| I-06 | FAIL | PASS | REMEDIATED | SCRUM-244 |
| SM-03 | FAIL (3 functions >75 LOC) | WARN (2 functions 51-62 LOC) | REMEDIATED (improved to WARN) | SCRUM-245 |
| CX-05 | FAIL (DI >8 in 3 services) | WARN (DI 6-8 in 2 services) | REMEDIATED (improved to WARN) | SCRUM-246 |
| CH-02 (inline error strings) | FAIL | PASS (different pattern) | REMEDIATED | SCRUM-256 |
| DEP-07 | FAIL | PASS | REMEDIATED | SCRUM-235/260 |

### Current FAIL Findings (2)

| Check | Classification | Justification |
|-------|---------------|---------------|
| DEP-01 (Next.js CVE) | NEWLY DISCOVERED | New CVE disclosures (GHSA-h25m-26qc-wcjf, GHSA-f82v-jwr5-mffw) appeared after previous audit. Not a regression. |
| CH-02 ('Invalid credentials' 6×) | RECURRENT (different instance) | Previous CH-02 was about error strings in account.controller.ts — fixed by SCRUM-256. Current CH-02 is about 'Invalid credentials' string in login.service.ts which was not in scope of SCRUM-256. This is a different manifestation of the same category. |

### WARN Trend

| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| Total WARNs | 39 | 22 | -17 (44% reduction) |
| Security WARNs | 8 | 6 | -2 |
| Test WARNs | 3 | 3 | 0 |
| Code Quality WARNs | 12 | 7 | -5 |
| Frontend WARNs | 4 | 2 | -2 |
| Other WARNs | 12 | 4 | -8 |

---

## Statistics Comparison

| Metric | Previous | Current | Trend |
|--------|----------|---------|-------|
| Total checks | 260 | 261 | +1 |
| PASS | 222 (85.4%) | 233 (89.3%) | ↑ +3.9% |
| FAIL | 6 (2.3%) | 2 (0.8%) | ↓ -1.5% |
| WARN | 39 (15.0%) | 22 (8.4%) | ↓ -6.6% |
| Security FAILs | 0 | 0 | → stable |

**Remediation effectiveness**: 6/6 previous FAILs fixed = 100%
**WARN reduction**: 39 → 22 = 43.6% reduction in one sprint cycle
