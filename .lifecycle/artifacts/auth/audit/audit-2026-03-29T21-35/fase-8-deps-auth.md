# Phase 8: DEPENDENCIES — Auth Module Audit (2026-03-29)

## Summary: 9 PASS, 3 WARN, 0 FAIL

| Check | Verdict | Finding |
|-------|---------|---------|
| DEP-01 Inventory | **PASS** | 16 auth-related deps, all from npm registry |
| DEP-02 Known CVEs | **PASS** | No known vulnerabilities in auth-critical packages |
| DEP-03 Deprecated | **WARN** | @simplewebauthn/types@12 deprecated (types-only, zero runtime) |
| DEP-04 Licenses | **PASS** | 0 GPL/AGPL. All MIT/Apache-2.0/ISC/BSD |
| DEP-05 Pinning | **PASS** | Caret ranges + lockfile v3 + npm ci + 6 overrides |
| DEP-06 Major Updates | **WARN** | No major updates. passport-github2 + otplib in maintenance mode |
| DEP-07 Lock Integrity | **PASS** | lockfileVersion 3, all registry.npmjs.org |
| DEP-08 No file/git deps | **PASS** | 0 file/git protocol dependencies |
| DEP-09 Integrity Hashes | **PASS** | All auth-critical packages have sha512 |
| DEP-10 Node.js Pinning | **PASS** | Node 22 triple-pinned (.nvmrc + engines x2) |
| DEP-11 Audit Script | **PASS** | audit:deps script + weekly CI audit |
| DEP-12 Overrides | **PASS** | 6 overrides, all security-justified |
