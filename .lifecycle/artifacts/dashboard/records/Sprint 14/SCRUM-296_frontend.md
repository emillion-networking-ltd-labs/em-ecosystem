# SCRUM-296 — Implementation Record

## Ticket
**SCRUM-296**: Unify typography scale to 5 sizes (12/14/16/20/24px)

## Execution
- **Branch**: `feature/SCRUM-296-frontend`
- **Commit**: `28fa4cc`
- **Sprint**: 14
- **Date**: 2026-03-23

## Scope
FRONTEND — 75 files changed, 400 insertions, 436 deletions

## Changes

### tailwind.config.ts
Replaced 8 font size tokens with 5:
- `caption`: 12px / 18px line-height
- `body`: 14px / 21px line-height
- `subtitle`: 16px / 24px line-height
- `title`: 20px / 28px line-height
- `heading`: 24px / 36px line-height

Removed: `display` (36px), `heading-sm`, `body-md`, `body-lg`

### Class Consolidation (590 instances)
| Old classes | New token | Instances |
|-------------|-----------|-----------|
| text-xs, text-caption, text-[10px] | caption | 260 |
| text-sm, text-body-sm, text-[14px], text-[15px] | body | 260 |
| text-base, text-body-lg, text-heading-sm, text-lg | subtitle | 42 |
| text-heading-md, text-xl | title | 8 |
| text-heading-lg, text-2xl | heading | 20 |

### Files by Module
- Auth: 11 files
- Admin: 9 files
- Profile/Settings: 15 files
- Dashboard: 6 files
- UI components: 22 files
- Layout: 3 files
- Pages: 8 files
- Config: 1 file (tailwind.config.ts)

## Post-commit Fix
Token names `heading`/`title`/`subtitle` conflicted with Tailwind internals.
Renamed in SCRUM-294 phase 3 (`ae1e12c`):
- `heading` → `h1` (24px)
- `title` → `h2` (20px)
- `subtitle` → `h3` (16px)

## Deviations
| Type | Description |
|------|-------------|
| Accepted-Trivial | 10px→12px in CountdownTimer digits |
| Accepted-Trivial | 15px→14px in Input labels |
| Accepted-Trivial | Token rename (heading→h1, etc.) done in SCRUM-294 commit |

## Test Results
- 1011/1011 tests passing
- TypeScript: 0 errors
- Old classes remaining: 0
