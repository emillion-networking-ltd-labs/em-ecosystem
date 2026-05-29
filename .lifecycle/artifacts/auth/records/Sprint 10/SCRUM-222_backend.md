# Implementation Record: SCRUM-222 — Add updatedAt to Token Models (D-11)

## Summary

Added `updatedAt DateTime @updatedAt` to `EmailVerificationToken` and `PasswordResetToken` Prisma models, and created a backwards-compatible migration. Both models are mutable but previously lacked the standard `updatedAt` field that all other mutable models already have. No service code changes needed — Prisma auto-manages `@updatedAt`.

- **Scope**: backend
- **Branch**: `feature/SCRUM-222-backend`
- **Date**: 2026-03-14

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-222_backend.md`
- **Plan followed**: Yes (0 deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `0521c69` | SCRUM-222: Add updatedAt to EmailVerificationToken and PasswordResetToken models (D-11) | 2 files (1 new, 1 modified) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- Backend: 870 passed / 0 failed (57 suites)
- No new tests (schema-only change — `@updatedAt` is auto-managed by Prisma)
- Build: `nest build` compiles clean
- Prisma: `prisma validate` confirms schema is valid

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `nexacore-api/prisma/schema.prisma` | Added `updatedAt DateTime @updatedAt` to EmailVerificationToken and PasswordResetToken |
| `nexacore-api/prisma/migrations/20260314000000_add_updated_at_token_models/migration.sql` | New migration: ALTER TABLE ADD COLUMN for both tables |
| `ai-specs/ai-specs/specs/data-model.md` | Added `updatedAt` to both models: field lists, TypeScript interfaces, ASCII diagram, Prisma schema section |
| `ai-specs/ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-222 |

## Lessons Learned

- Manual migrations following the established precedent pattern (`ALTER TABLE ADD COLUMN ... DEFAULT CURRENT_TIMESTAMP`) are straightforward and consistent.
- Prisma's `@updatedAt` requires zero service code changes — it auto-sets on every `.update()` / `.updateMany()` call, making schema-level additions very low-risk.
