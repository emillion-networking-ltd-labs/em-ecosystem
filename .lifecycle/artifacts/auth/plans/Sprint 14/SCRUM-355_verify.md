# Verification Report: SCRUM-355 Document User.deletedAt in data-model.md

**Date**: 2026-05-09
**Audit finding**: D-02-A + D-02-B (consolidated) — HIGH severity
**Verdict**: **PASS**

## Audit Finding Resolution

**Audit check ID**: D-02-A + D-02-B
**Original finding**: `User.deletedAt` field added in Prisma migration `20260418165311_add_user_deleted_at` (2026-04-18) but missing from `data-model.md`. Plus 3 missing `/// @sensitive` directives in the User appendix block (D-02-B).

### Fixes applied (this commit)

1. Added `deletedAt` to **User §1 prose** (`data-model.md:94`):
   ```
   - `deletedAt`: Tombstone for GDPR Article 17 (Right to Erasure). When a user requests
     account deletion, the row is marked with this timestamp instead of being hard-deleted...
   ```

2. The User appendix block already contained `deletedAt   DateTime?` at line 1276 (post-edit) — no change needed there for that field.

3. Added 3 missing `/// @sensitive` directives to User appendix block (matching `schema.prisma`):
   - `passwordHash` — User password bcrypt hash
   - `mfaSecret` — TOTP secret, AES-256-GCM encrypted
   - `mfaRecoveryCodes` — Hashed MFA recovery codes

4. Updated GDPR tombstone prose (line 114) to explicitly reference the `deletedAt` field, satisfying the audit's "cross-reference" requirement.

### Acceptance criteria verification

```
$ grep -cE "deletedAt" data-model.md
3   # prose §1 (1 hit) + appendix (1 hit) + GDPR business invariant (1 hit)

$ grep -cE "@sensitive" data-model.md
3   # all 3 in the User appendix block, matching schema.prisma's 3 User-scoped @sensitive directives

$ awk '/^model User /,/^}/' data-model.md | grep -cE "@sensitive"
3   # confirmed all 3 are inside the User block
```

Audit AC fully satisfied.

## Plan Compliance

| Step | Description | Status |
|------|-------------|--------|
| 1 | Add `deletedAt` to User §1 prose | DONE |
| 2 | Verify `deletedAt` in User appendix block | DONE (already present at line 1276) |
| 3 | Add 3 missing `@sensitive` directives | DONE |
| 4 | Cross-reference GDPR tombstone prose to field | DONE (line 114 updated) |

## Deviations

**None.** Pure docs change, no code touched.

## Code Quality Checks

N/A — `data-model.md` only.

## Recurrence Prevention

Schema-doc drift was the third recurrence (DM-06 March, DM-W1 March, D-02 May). Long-term prevention requires either:
- A doc-from-code generator that derives the entity sections directly from `schema.prisma` (recommended; would also benefit other docs).
- A pre-commit hook that diffs `schema.prisma` field count vs `data-model.md` field count per entity.

Tracked as a future enhancement; no separate ticket created here, but the next audit run will surface drift if it recurs.

## Verdict: PASS

Ready to transition SCRUM-355 to Done.
