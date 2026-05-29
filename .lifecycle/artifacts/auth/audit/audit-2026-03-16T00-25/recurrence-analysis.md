# Recurrence Analysis — Auth Audit 2026-03-16

**Previous audit**: audit-2026-03-15T19-49 (6 FAIL, 39 WARN)
**Current audit**: audit-2026-03-16T00-25 (2 FAIL, 32 WARN)

## FAIL Finding Comparison

### Previous FAILs → Current Status

| # | Finding | Previous | Current | Resolution |
|---|---------|----------|---------|-----------|
| 1 | T-02: Coverage tooling broken | FAIL | **PASS** | SCRUM-252: coverageProvider V8 |
| 2 | T-03: Coverage thresholds unenforceable | FAIL | **PASS** | SCRUM-252: V8 + adjusted thresholds |
| 3 | A-07: @HttpCode missing on mfa/setup | FAIL | **PASS** | SCRUM-243: @HttpCode added |
| 4 | I-06: OAuthAuthService stale dep in integration-state | FAIL | **PASS** | SCRUM-244: integration-state updated |
| 5 | SM-03: 3 auth functions >75 lines | FAIL | **PASS** | SCRUM-245: login/handleSuccess/handleFailed decomposed |
| 6 | CX-05: DI fan-out >8 in 3 services | FAIL | **PASS** (WARN) | SCRUM-245: LoginSecurityService extraction |

**All 6 previous FAILs resolved.**

### New FAILs in Current Audit

| # | Finding | Severity | Ticket |
|---|---------|----------|--------|
| 1 | I-06: Guard chain table drift (NEW specifics) | HIGH | SCRUM-254 |
| 2 | SM-03: 3 DIFFERENT functions >75 lines | MEDIUM | SCRUM-255 |

**Note**: I-06 and SM-03 recur with different specifics. Previous I-06 was about OAuthAuthService dep count; new I-06 is about guard chain HTTP methods and missing endpoints. Previous SM-03 was about login/handleSuccess/handleFailed; new SM-03 is about verifyAuthentication/refreshTokens/verifyEmailChange.

## WARN Delta

| Direction | Count | Examples |
|-----------|-------|---------|
| WARN → PASS | 7 | V7.1.2 (PII logs), SD-03, SD-06, CH-03, A-03, A-05, CX-05 (from FAIL) |
| New WARN | 0 | — |
| Stable WARN | 32 | V3.5.1, V6.2.3, EM-03, EM-08, SM-01, CX-01, CX-02, etc. |

**Net improvement**: -4 FAIL, -7 WARN

---
*Generated: 2026-03-16 | Auditor: Claude (automated)*
