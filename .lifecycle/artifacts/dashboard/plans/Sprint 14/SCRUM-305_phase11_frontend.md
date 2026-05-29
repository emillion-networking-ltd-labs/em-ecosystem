# Frontend Implementation Plan: SCRUM-305 Phase 11 — Typography Consistency Audit

## 1. Overview

Full typography audit revealed 6 inconsistencies between Auth and Dashboard pages. All text must use semantic design tokens — no opacity hacks (`text-content-primary/50`) where semantic tokens exist, no arbitrary sizes (`text-[11px]`), no inline CSS on elements that have ui/ components.

**Scope**: 39 files use `text-content-primary/50` (257 occurrences). Not all need changing — ui/ component internals and showcase labels are intentional. This plan targets the semantic misuses.

## 2. Architecture Context

### Token System (tailwind.config.ts)

| Token | Size | Purpose |
|---|---|---|
| `text-h1` | 24px/36px | Auth page titles, metric values |
| `text-h2` | 20px/28px | Dashboard page titles, modal titles |
| `text-h3` | 16px/24px | **Underused** — card subtitles, secondary headings |
| `text-body` | 14px/21px | Body text, card titles (with font-semibold) |
| `text-caption` | 12px/18px | Metadata, timestamps, labels, badges |

### Color Token Semantic Roles

| Token | Intended Use |
|---|---|
| `text-content-primary` | Main readable text |
| `text-content-secondary` | Descriptions, helper text, subtitles |
| `text-content-tertiary` | Metadata, timestamps, muted labels |
| `text-content-disabled` | Disabled interactive elements |
| `text-content-placeholder` | Input placeholders |
| `text-content-primary/50` | **Should only be used for**: icon opacity, showcase mono labels |

### Classification of `text-content-primary/50` Usages

| Category | Action | Files |
|---|---|---|
| **Auth subtitles/descriptions** | Replace with `text-content-secondary` | LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, MfaTotpStep, MfaSetupStep, VerifyEmailStatus, OAuthCallbackHandler, AuthErrorFallback, check-email, verify-email-change, activation/check-email, auth/callback |
| **Dashboard labels/legends** | Replace with `text-content-tertiary` | TotalUsersChart, UserRoleChart, design-system/page |
| **Showcase mono labels** | KEEP — intentional visual pattern | ComponentShowcase (152), TokenInspector (24), LayoutTemplates (13) |
| **UI component internals** | KEEP — component design decisions | IconButton, Accordion, Select, Slider, Calendar, Pagination, etc. |
| **Icon opacity** | KEEP — valid use of opacity on icons | NavBar, OAuthButtons |

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: Work directly on `main` (SCRUM-305 is an ongoing alignment ticket with incremental commits)
- **Verify**: `git status` clean, latest changes pulled

### Step 1: Standardize Auth Text Colors (11.1)

- **Action**: Replace `text-content-primary/50` with `text-content-secondary` in auth page subtitles and descriptions
- **Files** (13 files, ~20 occurrences):
  - `src/components/auth/LoginForm.tsx` (2): lines 201, 267 — subtitle paragraphs
  - `src/components/auth/RegisterForm.tsx` (1): line 98 — subtitle
  - `src/components/auth/ForgotPasswordForm.tsx` (1): line 69 — subtitle
  - `src/components/auth/ResetPasswordForm.tsx` (1): line 104 — subtitle
  - `src/components/auth/MfaTotpStep.tsx` (2): lines 60, 153 — step subtitles
  - `src/components/auth/MfaSetupStep.tsx` (6): lines 120, 139, 170, 197, 245, 317 — step subtitles and helper text
  - `src/components/auth/VerifyEmailStatus.tsx` (3): lines 30, 56, 58 — status messages
  - `src/components/auth/OAuthCallbackHandler.tsx` (1): line 47 — completion text
  - `src/components/auth/AuthErrorFallback.tsx` (1): line 32 — error message
  - `src/app/password-reset/check-email/page.tsx` (2): lines 19, 29 — paragraphs
  - `src/app/verify-email-change/page.tsx` (1): line 90
  - `src/app/auth/callback/page.tsx` (1): line 9
  - `src/app/activation/check-email/page.tsx` (1): line 17
- **Implementation**: `grep -rn "text-content-primary/50"` in each file, verify context is subtitle/description text (not icon), replace with `text-content-secondary`
- **Verification**: Visual check in light + dark mode. `text-content-secondary` adapts to theme; `text-content-primary/50` does not.

### Step 2: Standardize Dashboard Label Colors (11.2)

- **Action**: Replace `text-content-primary/50` with `text-content-tertiary` in dashboard chart legends and catalog descriptions
- **Files** (3 files, 6 occurrences):
  - `src/components/dashboard/TotalUsersChart.tsx` (2): lines 50, 57 — legend labels
  - `src/components/dashboard/UserRoleChart.tsx` (2): lines 99, 160 — error text and percentage
  - `src/app/admin/design-system/page.tsx` (2): lines 213, 220 — component description and file paths
- **Implementation**: Replace `text-content-primary/50` with `text-content-tertiary`
- **Note**: Do NOT touch ComponentShowcase, TokenInspector, or LayoutTemplates — those are showcase labels using opacity intentionally as a visual mono-label pattern

### Step 3: Document Section Header Pattern (11.3)

- **Action**: The profile page uses `text-body font-semibold uppercase tracking-wider text-content-primary` in 8+ components as a section header. Document this as a reusable pattern.
- **Files affected**: ProfileForm, ChangeEmailForm, ChangePasswordForm, AccountInfo, MfaSetup, PasskeyManager, TrustedDevices, ConnectedAccounts, ActiveSessions, DeleteAccount, SecurityActivity
- **Implementation**:
  1. Add a "Section Header" entry to the Typography section in `TokenInspector.tsx`
  2. Document pattern: `text-body font-semibold uppercase tracking-wider text-content-primary`
  3. Add to showcase under a "Typography Patterns" subsection showing the section header rendered
- **Note**: Do NOT extract to a CSS class or component — the pattern is simple enough as utility classes. Documentation is the deliverable.

### Step 4: Fix Arbitrary Text Size (11.4)

- **Action**: Replace `text-[11px]` with `text-caption` in PasskeyManager
- **File**: `src/components/profile/PasskeyManager.tsx` line 67
- **Current**: `text-[11px] font-normal text-content-secondary`
- **Replace with**: `text-caption font-normal text-content-secondary`
- **Impact**: Badge goes from 11px to 12px — 1px difference, visually negligible

### Step 5: Scan Auth Pages for Remaining Inline CSS (11.5)

- **Action**: Scan all auth components for `<Link>` or `<button>` elements with inline Tailwind classes that should use `Button`, `Input`, or other ui/ components
- **Files to scan**: All files in `src/components/auth/` and `src/app/` auth-related pages
- **Already fixed**: `check-email/page.tsx` — Link with `text-h3 font-normal bg-surface-inverse` replaced with `<Button as={Link}>`
- **Implementation**: Grep for `<Link` and `<button` in auth files, check if they have inline styling classes (`bg-`, `px-`, `py-`, `rounded-`, `border-`) that duplicate Button/Input behavior
- **Deliverable**: Fix any found instances; if none, document as clean

### Step 6: Promote Card Titles to text-h3 (11.6)

- **Action**: `text-h3` (16px) is unused. Card titles currently use `text-body font-semibold` (14px) — same size as body text, only differentiated by weight. Promote card titles to `text-h3 font-semibold` (16px) to create a real 4-level hierarchy:
  - `text-h2` (20px) — Page title
  - `text-h3` (16px) — Card title / section title
  - `text-body` (14px) — Body text
  - `text-caption` (12px) — Metadata / labels
- **Full audit found 24 ❌ WRONG classifications across 17 files.**
- **Dashboard cards** (5 files):
  - `ChartCard.tsx:23` — card title prop
  - `RightPanel.tsx:56,86,119` — section headers (Notifications, Activities, Contacts)
- **Profile sections** (11 files, 16 instances):
  - `ProfileForm.tsx:43` — "Profile Information"
  - `AccountInfo.tsx:31` — "Account Information"
  - `ChangeEmailForm.tsx:65` — "Change Email"
  - `ChangePasswordForm.tsx:70` — "Change Password"
  - `MfaSetup.tsx:161,219,310,368,419` — 5 section headings
  - `PasskeyManager.tsx:187` — "Passkeys"
  - `TrustedDevices.tsx:103` — "Trusted Devices"
  - `ConnectedAccounts.tsx:176` — "Connected Accounts"
  - `ActiveSessions.tsx:109` — "Active Sessions"
  - `DeleteAccount.tsx:67` — "Danger Zone"
  - `SecurityActivity.tsx:95` — "Security Activity"
- **Additional fixes**:
  - `AccountInfo.tsx:36,39,46,52` — definition labels use `text-body text-content-tertiary` → should be `text-caption text-content-tertiary` (they are metadata labels, not body text)
  - `RecentActivityFeed.tsx:90,96` — empty state messages use `text-caption` → should be `text-body` for readability
  - `UserRoleChart.tsx:99` — error message uses `text-caption` → should be `text-body`
- **Implementation**: Replace `text-body font-semibold` with `text-h3 font-semibold` on all section/card title elements. Fix additional misclassifications listed above.
- **Note**: All changes in a single pass. User reviews visually after.

### Step 7: Update Technical Documentation

- **Action**: Update frontend-standards.mdc with typography guidelines
- **Implementation**:
  1. Add a "Typography Hierarchy" section to frontend-standards.mdc documenting:
     - Page titles (auth): `text-h1 font-semibold text-content-primary` (24px)
     - Page titles (dashboard): `text-h2 font-semibold text-content-primary` (20px)
     - Card/section titles: `text-h3 font-semibold text-content-primary` (16px)
     - Section headers (profile): `text-h3 font-semibold uppercase tracking-wider text-content-primary` (16px)
     - Body text: `text-body font-normal text-content-primary` (14px)
     - Descriptions/subtitles: `text-body text-content-secondary` (14px)
     - Metadata/labels: `text-caption text-content-tertiary` (12px)
     - Metric labels: `text-caption text-content-primary` (12px)
     - Code: `font-mono`
  2. Document the color token rules:
     - `text-content-primary` — readable text
     - `text-content-secondary` — descriptions, subtitles
     - `text-content-tertiary` — metadata, timestamps, muted labels
     - `text-content-primary/50` — ONLY for icon opacity or showcase labels
  3. Update ui-design-system.md if it exists with the same rules

## 4. Implementation Order

1. Step 0: Verify branch state
2. Step 1: Auth text colors (13 files) ✅
3. Step 2: Dashboard label colors (3 files) ✅
4. Step 4: Fix text-[11px] (1 file) ✅
5. Step 5: Scan auth inline CSS (audit) ✅
6. Step 6 Phase 1: Promote dashboard card titles to text-h3 (5 files) — visual test
7. Step 6 Phase 2: Extend to profile/admin card titles (if approved)
8. Step 3: Document section header pattern (TokenInspector)
9. Step 7: Update technical documentation

## 5. Testing Checklist

- [ ] All auth pages render correctly in light mode
- [ ] All auth pages render correctly in dark mode (key test — `text-content-secondary` adapts, `text-content-primary/50` does not)
- [ ] Dashboard charts legends visible in both themes
- [ ] PasskeyManager "Synced" badge looks correct with text-caption
- [ ] check-email page buttons work correctly (already fixed)
- [ ] ComponentShowcase labels unchanged (no regression from selective replacement)
- [ ] `npx next build` passes
- [ ] No `text-[` arbitrary sizes in codebase (grep verify)
- [ ] No `text-content-primary/50` in auth components (grep verify)

## 6. Error Handling Patterns

N/A — This is a styling-only change with no logic modifications.

## 7. UI/UX Considerations

- **Dark mode is the critical test**: `text-content-secondary` and `text-content-tertiary` are defined as CSS variables that change per theme. `text-content-primary/50` is a fixed 50% opacity of the primary color, which may be too dark in dark mode or too light in light mode. Semantic tokens adapt correctly.
- **No visual regression expected**: The semantic tokens were designed to produce similar visual output to the opacity hacks, but with proper theme adaptation.

## 8. Dependencies

- No new packages
- No new components
- Uses existing design tokens from `tailwind.config.ts` and `globals.css`

## 9. Notes

- **DO NOT touch ComponentShowcase (152 occurrences)**: These are intentional showcase mono labels using opacity for visual hierarchy in the design system viewer.
- **DO NOT touch TokenInspector or LayoutTemplates**: Same showcase pattern.
- **DO NOT touch ui/ component internals** (IconButton, Accordion, Select, etc.): These are component design decisions where opacity is used for interactive states (hover, disabled).
- **Only change text/paragraph elements** where semantic tokens should be used instead of opacity hacks.

## 10. Next Steps After Implementation

- Verify all changes with `/verify` command
- Commit with descriptive message
- Consider creating a lint rule to prevent new `text-content-primary/50` usage in non-showcase, non-component contexts

## 11. Implementation Verification

- [ ] Code Quality: No arbitrary text sizes, no opacity hacks in auth/dashboard text
- [ ] Functionality: All pages render, no broken layouts
- [ ] Testing: Light + dark mode visual verification
- [ ] Integration: Build passes, no TypeScript errors
- [ ] Documentation: frontend-standards.mdc updated with typography hierarchy
