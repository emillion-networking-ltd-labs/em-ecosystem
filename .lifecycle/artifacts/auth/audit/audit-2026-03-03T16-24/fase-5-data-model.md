# Fase 5: DATA MODEL — Global

**Date**: 2026-03-03 16:50
**Module**: global
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: schema.prisma vs data-model.md

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 4     |
| FAIL    | 0     |
| WARN    | 0     |
| N/A     | 2     |

**Overall**: PASS (future-model gaps reclassified as N/A — by design)

---

## Detailed Findings

### D-01: Model Count
- **Verdict**: N/A | **Severity**: — (by design)
- **Evidence**: schema.prisma has **10 models**. data-model.md documents **20 entities**.
- **Actual**: 10 implemented models match documentation perfectly. The 10 remaining models are planned future-sprint entities documented as forward-looking specification.
- **Reclassified**: WARN → N/A (2026-03-03 post-audit review — data-model.md is explicitly a forward-looking spec; unimplemented models are roadmap items, not missing implementations).

### D-02: Field Inventory
- **Verdict**: PASS
- **Evidence**: All 10 implemented models have **100% field parity** with documentation:
  | Model | Fields | Status |
  |-------|--------|--------|
  | User | 20 scalar fields | PASS |
  | Session | 15 fields | PASS |
  | AuditLog | 8 fields | PASS |
  | EmailVerificationToken | 7 fields | PASS |
  | PasswordResetToken | 6 fields | PASS |
  | TrustedDevice | 10 fields | PASS |
  | WebAuthnCredential | 11 fields | PASS |
  | Permission | 6 fields | PASS |
  | RolePermission | 4 fields | PASS |
- No missing fields, no type mismatches, no extra undocumented fields.
- **Note**: The doc's embedded Prisma schema block is missing the `WebAuthnCredential` model and the `webAuthnCredentials` relation on User — this is a stale doc section.

### D-03: Enum Values
- **Verdict**: PASS
- **Evidence**: All 4 implemented enums match exactly:
  | Enum | Schema Values | Doc Values | Match |
  |------|--------------|------------|-------|
  | Role | SUPERADMIN, ADMIN, USER | Same | PASS |
  | Provider | LOCAL, GOOGLE, GITHUB | Same | PASS |
  | AuditAction | 36 values | 36 values | PASS |
  | EmailVerificationTokenType | REGISTRATION, EMAIL_CHANGE | Same | PASS |
- 10 documented enums are absent from schema (correspond to unimplemented future models).

### D-04: Relations
- **Verdict**: PASS
- **Evidence**: All 16 @relation directives on implemented models are documented correctly, including cascade behaviors (Cascade on Session, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, RolePermission; SetNull on AuditLog).
- **Note**: Doc's embedded Prisma block missing `webAuthnCredentials WebAuthnCredential[]` on User model (stale).

### D-05: Indices
- **Verdict**: PASS
- **Evidence**: All @@index and @@unique directives match:
  | Model | Indices | Documented |
  |-------|---------|-----------|
  | Session | 4 indices | All 4 match |
  | AuditLog | 6 indices | All 6 match |
  | EmailVerificationToken | 1 index | Match |
  | PasswordResetToken | 1 index | Match |
  | TrustedDevice | 1 unique + 1 index | Both match |
  | WebAuthnCredential | 1 index | Match |
  | Permission | 1 index | Match |
  | RolePermission | 1 unique + 1 index | Both match |

### D-06: Default Values
- **Verdict**: PASS
- **Evidence**: All 26 @default directives across all implemented models match documentation exactly.

---

## Discrepancy Register

| ID | Severity | Finding |
|----|----------|---------|
| DM-001 | N/A | schema has 10 models, doc has 20 — 10 are planned future work (by design, reclassified) |
| DM-002 | N/A | 10 enums documented but absent from schema — same cause as DM-001 (reclassified) |
| DM-003 | LOW | Doc embedded Prisma schema block missing WebAuthnCredential model entirely |
| DM-004 | LOW | Doc header says "19 entities" but lists 20; says "13 enums" but has 14 |

---

## Recommendations

1. **DM-003**: Update data-model.md embedded Prisma schema block to include WebAuthnCredential model and `webAuthnCredentials` relation on User.
2. **DM-004**: Correct header counts to match actual content.
