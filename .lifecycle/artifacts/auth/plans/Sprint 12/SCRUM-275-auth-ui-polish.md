# Plan: SCRUM-275 — Auth UI Polish

## 1. Ticket Reference
- **Jira**: SCRUM-275
- **Sprint**: 12 — UI Polish
- **Type**: Story (frontend)
- **Module**: auth

## 2. Objective
Improve visual quality of all auth pages: fix card/background contrast, standardize border opacity, add professional page and step transition animations, smooth card resizing, and update the design system document.

## 3. Current State Analysis
- Auth card and page background both near-white (#ffffff / #fbfbfb) — no visual separation
- Border opacity inconsistent: card uses 0.05, some components 0.05, Figma specifies 0.08
- No page/step transition animations — content switches are abrupt
- Card resizes abruptly when content changes (email → password step)
- `border-strong` token missing from tailwind.config.ts
- GoBackSection icon and text have separate hover states
- Verify email status icons appear without animation
- ui-design-system.md does not reflect actual implemented values

## 4. Planned Changes

### 4.1 Card Contrast (Option A — Industry Standard)
- Page background: `#f2f2f2` (surface-tertiary) — already correct
- Auth card fill: `#ffffff` → `#fbfbfb` (surface-secondary)
- Card border: `border-default` (0.05) → `border-strong` (0.08)
- Card shadow: `0 8px 32px rgba(0,0,0,0.04)` — subtle, no border interference
- Container/Footer separator: add `border-b border-border-strong`

### 4.2 Border Consistency
- All auth component borders → `border-strong` (0.08)
- Affected: inputs, buttons, OAuth, passkey, dividers, language selector
- Add `border-strong` token to `tailwind.config.ts`
- Scope: only auth components + shared UI components used in auth (Input, LanguageSelector)

### 4.3 Page Animations (CSS-only, no dependencies)
- Card entrance: `auth-card-enter` — fade + slide-up (opacity 0→1, translateY 12→0, 400ms)
- GoBackSection: same animation with 120ms delay
- Step transitions: `auth-step-forward` / `auth-step-back` — reuse card-enter animation
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo ease-out)

### 4.4 Card Smooth Resize
- ResizeObserver on card content wrapper
- Explicit height set on card with `transition-[height] duration-300`
- `overflow-hidden` on card during transitions

### 4.5 Icon Corrections
- Key (passkey) icon: add `text-content-primary/50` (matches OAuth icon pattern)
- GoBackSection: wrap icon inside Link for shared hover color transition
- Verify email success: `icon-success` — scale bounce (0→1.08→0.96→1, 500ms)
- Verify email error: `icon-error` — scale + horizontal shake (600ms)

### 4.6 Design Document Update
- Update `ai-specs/specs/ui-design-system.md` with:
  - Auth card: bg, border opacity, shadow, border-radius
  - Border tokens: document border-strong usage in auth context
  - Animation specs: keyframes, durations, easing curves
  - Icon color conventions: 50% for button icons, 75% for nav icons, 100% for primary

## 5. Files to Modify
| File | Change |
|------|--------|
| `globals.css` | auth-card styles, 6 animation keyframes |
| `tailwind.config.ts` | border-strong token |
| `AuthLayout.tsx` | entrance animation, ResizeObserver, overflow-hidden |
| `LoginForm.tsx` | step direction state, animation classes, Key icon color |
| `GoBackSection.tsx` | icon in Link, entrance animation delay |
| `VerifyEmailStatus.tsx` | icon animation classes |
| `Input.tsx` | border-default → border-strong |
| `LanguageSelector.tsx` | border-default → border-strong |
| `OAuthButtons.tsx` | border-default → border-strong |
| `RegisterForm.tsx` | border-default → border-strong |
| `ForgotPasswordForm.tsx` | border-default → border-strong |
| `ResetPasswordForm.tsx` | border-default → border-strong |
| `MfaTotpStep.tsx` | border-default → border-strong |
| `VerifyEmailStatus.tsx` | border-default → border-strong |
| `ui-design-system.md` | design doc update |

## 6. Testing Strategy
- Visual: verify light mode and dark mode for all auth pages
- Verify card entrance animation on page load
- Verify login email → password step transition
- Verify card height smooth resize
- Verify verify-email success/error icon animations
- Verify border consistency across all auth components in both modes
- Verify GoBackSection hover state (icon + text change together)

## 7. Risk Assessment
- **Low risk**: CSS-only animations, no logic changes
- **No API changes**: purely frontend visual
- **No breaking changes**: border-strong is additive to tailwind config
- **Dark mode**: verified — borders use same token, card border looks correct

## 8. Status
**COMPLETE** (retroactive plan — implementation done 2026-03-17)
