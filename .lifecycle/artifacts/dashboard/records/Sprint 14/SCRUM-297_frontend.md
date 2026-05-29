# Implementation Record: SCRUM-297 Migrate Inline HTML to Reusable UI Components

## Summary
Migrated all inline HTML elements across auth, profile, settings, and admin modules to reusable UI components exported from the Design System showcase. Established a single-source-of-truth propagation chain: component exports specs/classes → showcase imports them → all usage sites import the component.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-297-frontend`
- **Implementation date**: 2026-03-27

## Plan Reference
- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-297_plan.md`
- Verify: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-297_verify.md`
- Plan followed: **Yes** (12/12 phases complete)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `e1ff698` | SCRUM-297: Migrate inline HTML to reusable UI components with showcase propagation | 45 files (8 new components, 1 new constants file, 36 modified) |

## Deviations from Plan

Imported from `/verify` report — classifications already approved.

| Item | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| MfaSetupStep copy button | Migrate to Button | Kept as IconButton (Copy/Check toggle) | Micro-interaction, now uses IconButton | Accepted-Trivial | — |
| 5 profile icon buttons | Migrate to IconButton | Left inline (Trash2/Pencil) | Custom spinners per-button, need IconButton size expansion | Accepted-Trivial | — |
| 3 admin toasts | Centralize to ADMIN_TOAST | Left inline | Dynamic content with modalType variable | Accepted-Trivial | — |
| Layout NavBar 7 + Sidebar 1 icon buttons | Migrate to IconButton | Left inline | Varied sizes (h-6/h-7/h-10) not covered by IconButton sm/md | Accepted-Quality | Deferred to future IconButton size expansion |
| PermissionsMatrix 2 + LayoutTemplates 2 buttons | Migrate to Button | Left inline | Admin-specific with non-standard colors (brand-primary) | Accepted-Quality | Deferred to future ticket |
| IconButton form submit bug | Not in plan | Fixed: added `type="button"` to IconButton | Discovered during testing — inline buttons had `type="button"`, migration lost it | Accepted-Trivial | — |
| Toast responsive | Not in plan | Fixed: `whitespace-nowrap` removed, container changed to `inset-x-0 px-[50px]` | Discovered during testing — toast overflowed on mobile | Accepted-Trivial | — |
| InlineError showcase | Not in plan | Connected InlineError to Feedback/Alerts showcase section | Was using inline HTML in showcase, now uses component import | Accepted-Trivial | — |
| IconButton showcase propagation | Not in plan | Eliminated local `iconButtonSpecs` duplicate in ComponentShowcase, now imports from IconButton.tsx | Local duplicate was disconnected from component — changes didn't propagate | Accepted-Trivial | — |

## Additional discoveries (not in plan scope)

| Discovery | Action | Ticket |
|-----------|--------|--------|
| Resend verification email button removed in SCRUM-217, auto-send on every login (email bombing risk) | Created ticket | SCRUM-300 |
| OAuth login blocked for unverified local accounts (user trapped, no path forward) | Created ticket | SCRUM-301 |

## Test Results
- TypeScript: 0 errors
- Next.js build: Compiled successfully, 20/20 static pages generated
- Prettier: All files pass
- Manual verification: Auth flows (login, register, MFA, password reset), profile forms, settings, admin dropdown tested
- No frontend test suite exists for dashboard (pre-existing)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| IconButton missing `type="button"` causing form submit on eye toggle click | HIGH | Fixed | Added `type="button"` to IconButton component — propagated to all 11 password forms |
| Toast `whitespace-nowrap` causing overflow on mobile | MEDIUM | Fixed | Removed `whitespace-nowrap`, changed container to `inset-x-0 px-[50px]` responsive layout |
| IconButton showcase using local duplicate specs (not propagating changes) | MEDIUM | Fixed | Eliminated local `iconButtonSpecs`, showcase now imports from `IconButton.tsx` directly |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-297_frontend.md` | This record |

No changes to `integration-state.md` (frontend-only, no backend module/guard/permission changes).
No changes to `api-spec.yml` (no API changes).
No changes to `data-model.md` (no schema changes).

## New Components Created

| Component | File | Description |
|-----------|------|-------------|
| IconButton | `ui/IconButton.tsx` | Icon-only button with default/danger/boxed variants, sm/md sizes, `type="button"`, p-2 clickable area |
| InlineError | `ui/InlineError.tsx` | AlertTriangle 16px + text-caption text-error |
| MfaDigitInput | `ui/MfaDigitInput.tsx` | 6-cell auto-advance with paste, ResizeObserver sizing |
| CopyField | `ui/CopyField.tsx` | Read-only copyable text with Copy/Check toggle |
| QrCodeCard | `ui/QrCodeCard.tsx` | QR code display + CopyField for secret key |
| RecoveryCodesGrid | `ui/RecoveryCodesGrid.tsx` | 2x5 grid with Copy all button |
| SegmentedControl | `ui/SegmentedControl.tsx` | Multi-option selector (theme picker) |
| EmailSelector | `ui/EmailSelector.tsx` | Email dropdown with avatar and change link |
| toast-messages.ts | `lib/toast-messages.ts` | Centralized toast constants (AUTH + PROFILE + ADMIN) |

## Showcase Propagation Architecture

The propagation chain verified and working:

```
Component (e.g. IconButton.tsx)
  └─ exports: baseClass, variantClasses, sizeClasses, usage
       ├─ ComponentShowcase.tsx imports these → renders demos + SpecsPanel
       └─ Auth/Profile/Admin files import <IconButton> component
           └─ Component uses the same exported classes internally
```

Change `IconButton.tsx` → showcase updates + all 11 password forms update + MFA copy button updates + theme toggle updates + admin dropdown updates.

## Lessons Learned
- **Showcase propagation requires shared exports**: Components must export their actual runtime classes (not separate documentation objects). Local duplicate specs in ComponentShowcase create disconnected copies that don't propagate.
- **`type="button"` is critical**: Any `<button>` inside a `<form>` defaults to `type="submit"`. Icon buttons must always have `type="button"`.
- **`next start` vs `next dev`**: Production server (`next start`) does NOT hot-reload. Development must use `next dev` for instant feedback.
- **Toast responsive**: `whitespace-nowrap` + `max-w-[650px]` fails on narrow viewports. Better approach: remove nowrap, use `inset-x-0` container with padding.
