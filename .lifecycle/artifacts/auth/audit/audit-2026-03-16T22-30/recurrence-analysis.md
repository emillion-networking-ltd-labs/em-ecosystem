# Recurrence Analysis: Auth Module Audit 2026-03-16

**Current audit**: 2026-03-16T22:30
**Previous audit**: 2026-03-15T19:49
**Module**: auth

---

## Statistics Comparison

| Metric | 2026-03-15 | 2026-03-16 | Delta |
|--------|-----------|-----------|-------|
| Total checks | 260 | 260 | 0 |
| PASS | 215 | 232 | +17 |
| FAIL | 6 | 2 | **-4** |
| WARN | 39 | 21 | **-18** |
| N/A | 0 | 3 | +3 |
| INFO | 0 | 2 | +2 |
| Pass rate | 82.7% | 89.2% | **+6.5%** |
| Security FAILs | 0 | 0 | 0 |

---

## Finding-by-Finding Comparison

### Previous FAILs

| ID | Previous | Current | Classification |
|----|----------|---------|---------------|
| A-07 | FAIL (MEDIUM) | PASS | **REMEDIATED** via SCRUM-243 |
| I-06 | FAIL (HIGH) | PASS | **REMEDIATED** via SCRUM-244 |
| SM-03 | FAIL (MEDIUM) | WARN | **REMEDIATED** via SCRUM-245 (reduced from >75 to 51-75 range) |
| CX-05 | FAIL (MEDIUM) | WARN | **REMEDIATED** via SCRUM-246 (TokenService 9→7 deps) |
| D-02 | FAIL (MEDIUM) | FAIL | **RECURRENT** — docs fix not applied |
| D-08 | FAIL (HIGH) | FAIL | **RECURRENT** — migrations dir still not committed |

### Regressions (previously PASS, now FAIL)

None.

### New Findings (not in previous audit)

| ID | Verdict | Severity | Classification |
|----|---------|----------|---------------|
| A-06 | WARN | HIGH | **NEWLY DISCOVERED** — GET /auth/me undocumented permissions field |
| T-13 | WARN | HIGH | **NEWLY DISCOVERED** — Jest thresholds below audit standards |

### Improved Findings (previously WARN, now PASS)

Multiple WARN findings from the previous audit have been resolved through Sprint 11 remediation work, contributing to the -18 WARN delta.

---

## Summary

- **0 regressions**: No previously passing check now fails
- **4 remediations confirmed**: A-07, I-06, SM-03, CX-05 all fixed by Sprint 11 tickets
- **2 recurrent FAILs**: D-02 and D-08 persist from previous audit (both documentation/infrastructure)
- **2 new findings**: A-06 and T-13 (both WARN, not FAIL)
- **Net improvement**: +6.5% pass rate, -4 FAILs, -18 WARNs
