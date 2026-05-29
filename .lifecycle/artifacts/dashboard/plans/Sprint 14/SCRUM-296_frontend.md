# SCRUM-296 — Unify Typography Scale to 5 Sizes

## Scope: FRONTEND

## Objective
Consolidate 16 different font size classes into 5 semantic tokens following industry best practice (GitHub/Vercel pattern: 12/14/16/20/24px).

## Pre-Implementation Integrity Check
- Affects ALL frontend modules (auth, dashboard, profile, settings, admin, UI components)
- No backend impact
- Visual-only change — no logic changes
- ~590 instances across ~50 files

## Target Scale

| Token | Size | Line-height | Use |
|-------|------|-------------|-----|
| `caption` | 12px | 18px | Labels, ticks, tooltips, errors, metadata |
| `body` | 14px | 21px | Body text, buttons, links, inputs, descriptions |
| `subtitle` | 16px | 24px | Subtítles, auth buttons, emphasis |
| `title` | 20px | 28px | Page titles, section headers |
| `heading` | 24px | 36px | Main headings (Sign In, etc) |

## Steps

### Step 1: Update tailwind.config.ts
- Replace current 8 tokens with 5 new ones
- Remove: `display`, `heading-sm`, `body-md`, `body-lg`
- Rename: `heading-lg` → `heading`, `heading-md` → `title`, `body-sm` → `body`
- Keep `caption` as-is (already correct)

### Step 2: Replace text-[10px] (22 instances, 6 files)
- CountdownTimer: digit boxes → `text-caption` (12px)
- Sidebar: logo text → `text-caption`
- Impact: digits will be slightly larger (10→12px)

### Step 3: Replace text-[15px] (20 instances, 9 files)
- Input labels → `text-body` (14px)
- Calendar month/year cells → `text-body` (14px)
- Input text → `text-body` (14px)
- Impact: 1px smaller (15→14px), minimal visual change

### Step 4: Replace text-xs → text-caption (42 instances, 19 files)
- Same pixel value (12px), only class name changes
- Zero visual impact

### Step 5: Replace text-sm → text-body (73 instances, 26 files)
- Same pixel value (14px), only class name changes
- Zero visual impact

### Step 6: Replace text-base → text-subtitle (32 instances, 13 files)
- Same pixel value (16px), only class name changes
- Includes auth buttons that use `text-base`
- Zero visual impact

### Step 7: Replace text-lg/text-body-lg/text-heading-sm → text-subtitle (10 instances)
- All 16px, only class consolidation
- Zero visual impact

### Step 8: Replace text-xl/text-heading-md → text-title (8 instances)
- All 20px, only class consolidation
- Zero visual impact

### Step 9: Replace text-2xl/text-heading-lg → text-heading (20 instances)
- All 24px, only class consolidation
- Zero visual impact

### Step 10: Replace text-[14px] → text-body (3 instances, 1 file)
- Same value, class normalization
- Zero visual impact

### Step 11: Update TokenInspector
- Typography section: show 5 tokens only
- Remove old token references

### Step 12: Update Chart.js font config
- Verify `size: 12` in chart options matches `caption`
- Document in specs

### Step 13: Remove text-body-sm/text-body-md references from specs
- Update all exported specs in UI components
- Ensure dynamic specs reflect new token names

## Files to Modify
- `tailwind.config.ts` — token definitions
- `TokenInspector.tsx` — typography documentation
- ~50 component/page files — class replacements

## Acceptance Criteria
- Only 5 font size tokens used across entire project
- `grep -r "text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl\|text-\[10px\]\|text-\[14px\]\|text-\[15px\]" --include="*.tsx" src/` returns 0 results
- TokenInspector shows 5 typography tokens
- No visual regression in auth pages
- TypeScript compiles clean
