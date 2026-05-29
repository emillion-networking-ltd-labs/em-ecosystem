# Record: SCRUM-275 — Auth UI Polish

## 1. Ticket Reference
- **Jira**: SCRUM-275
- **Sprint**: 12 — UI Polish
- **Date**: 2026-03-17
- **Status**: Done

## 2. What Was Implemented

### 2.1 Card Contrast
- `.auth-card` background: `var(--surface-primary)` (#ffffff) → `var(--surface-secondary)` (#fbfbfb)
- Card shadow: `none` → `0 8px 32px rgba(0, 0, 0, 0.04)`
- Container/Footer separator: added `border-b border-border-strong` to Container div

### 2.2 Border Consistency
- Added `strong: 'var(--border-strong)'` to `tailwind.config.ts` border colors
- Replaced `border-border-default` → `border-border-strong` in 10 files (22 occurrences):
  - `Input.tsx` (1), `LanguageSelector.tsx` (3), `LoginForm.tsx` (7), `MfaTotpStep.tsx` (8)
  - `OAuthButtons.tsx` (2), `RegisterForm.tsx` (2), `ForgotPasswordForm.tsx` (1)
  - `ResetPasswordForm.tsx` (1), `VerifyEmailStatus.tsx` (1)

### 2.3 Animations Added to `globals.css`

| Animation | Keyframes | Duration | Easing | Usage |
|-----------|-----------|----------|--------|-------|
| `auth-card-enter` | opacity 0→1, translateY 12→0 | 400ms | cubic-bezier(0.16,1,0.3,1) | Card entrance on page load |
| `auth-step-forward` | reuses auth-card-enter | 300ms | same | Login email→password transition |
| `auth-step-back` | reuses auth-card-enter | 300ms | same | Login password→email transition |
| `icon-success` | scale 0.3→1.08→0.96→1 | 500ms | same | Verify email success check |
| `icon-error` | scale 0.5→1 + shake ±6px | 600ms | same | Verify email error X |

### 2.4 Card Smooth Resize (`AuthLayout.tsx`)
- Added `useRef` for card and content wrapper divs
- `ResizeObserver` watches content height changes
- Card has explicit `height` set via JS + `transition-[height] duration-300`
- `overflow-hidden` prevents content flash during resize

### 2.5 Icon Corrections
- `Key` icon in LoginForm passkey button: added `text-content-primary/50`
- `GoBackSection`: moved `House` icon inside `Link` — both share hover color transition
- GoBackSection entrance: `auth-card-enter` with `animationDelay: 120ms`

### 2.6 Verify Email Status Icons
- `CircleCheck`: added `icon-success` class (elastic bounce)
- `CircleX`: added `icon-error` class (scale + horizontal shake)

## 3. Files Modified

| File | Lines Changed | Nature |
|------|--------------|--------|
| `globals.css` | +45 (keyframes, classes), ~5 edits | Auth card styles, animations |
| `tailwind.config.ts` | +1 | `border-strong` token |
| `AuthLayout.tsx` | ~30 lines rewritten | ResizeObserver, animation classes |
| `LoginForm.tsx` | +3 state, +2 class edits, +1 icon | Step direction, animations |
| `GoBackSection.tsx` | ~6 lines rewritten | Icon in Link, animation |
| `VerifyEmailStatus.tsx` | 2 class additions | Icon animations |
| `Input.tsx` | 1 replace | border-strong |
| `LanguageSelector.tsx` | 3 replaces | border-strong |
| `OAuthButtons.tsx` | 2 replaces | border-strong |
| `RegisterForm.tsx` | 2 replaces | border-strong |
| `ForgotPasswordForm.tsx` | 1 replace | border-strong |
| `ResetPasswordForm.tsx` | 1 replace | border-strong |
| `MfaTotpStep.tsx` | 8 replaces | border-strong |

## 4. Deviations from Plan
None — implementation matches plan exactly (plan written retroactively).

## 5. Design Token Summary

### Light Mode Auth Values
| Token | Value | Usage |
|-------|-------|-------|
| Page bg | `--surface-tertiary` (#f2f2f2) | Auth page background |
| Card bg | `--surface-secondary` (#fbfbfb) | Auth card / footer area |
| Container bg | `--surface-primary` (#ffffff) | White content area |
| Border | `--border-strong` (rgba(0,0,0,0.08)) | All auth borders |
| Shadow | `0 8px 32px rgba(0,0,0,0.04)` | Card only |

### Dark Mode Auth Values
| Token | Value | Usage |
|-------|-------|-------|
| Page bg | `--surface-tertiary` (#2d2d2d) | Auth page background |
| Card bg | `--surface-secondary` (#242424) | Auth card / footer area |
| Container bg | `--surface-primary` (#1a1a1a) | Dark content area |
| Border | `--border-strong` (rgba(255,255,255,0.12)) | All auth borders |
| Shadow | `0 8px 32px rgba(0,0,0,0.04)` | Invisible in dark (intentional) |

### Icon Color Conventions
| Context | Color | Opacity |
|---------|-------|---------|
| Button icons (OAuth, passkey) | `text-content-primary` | 50% |
| Nav/footer icons (house, chevron) | `text-content-primary` | 75% → 100% on hover |
| Theme toggle (sun/moon) | `text-content-primary` | 50% → 100% on hover |
| Error icons (alert triangle) | `text-error` | 100% |
| Status success (circle check) | `#166534` | 100% |
| Status error (circle x) | `#8a1111` | 100% |

## 6. Testing Performed
- Visual verification: light mode ✓, dark mode ✓
- Card entrance animation on page load ✓
- Login email → password step transition ✓
- Card height smooth resize ✓
- GoBackSection hover (icon + text) ✓
- Border consistency across all auth components ✓

## 7. Pending
- [x] Update `ai-specs/specs/ui-design-system.md` with values from Section 5
- [x] Commit code changes (em-ecosystem PR #147, commit 511ec9a)
- [x] Transition SCRUM-275 to Done
