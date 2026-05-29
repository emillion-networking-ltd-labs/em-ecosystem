# Frontend Implementation Plan: SCRUM-171 GitHub OAuth Session Tooltip on ConnectedAccounts

## 1. Overview

Add an informative tooltip next to the GitHub "Connect" button in ConnectedAccounts, explaining that the user's active GitHub browser session will be used and they must log out of github.com first to link a different account. This requires creating a reusable Tooltip component (none exists yet) following ui-design-system.md Section 11 specs.

## 2. Architecture Context

- **Component affected**: `src/components/profile/ConnectedAccounts.tsx` (209 lines)
- **New component**: `src/components/ui/Tooltip.tsx` (reusable)
- **Design system**: ui-design-system.md Section 11 — Tooltip specs
- **State management**: Local state only (hover/focus toggle)
- **No routing changes**
- **No API changes**

### Current ConnectedAccounts Structure
- Providers rendered via static array mapped at line 111: `[{id: 'GOOGLE', ...}, {id: 'GITHUB', ...}]`
- Connect button at lines 141-147: outline button with `handleConnect(provider.id)`
- `handleConnect` (lines 96-99): redirects to `/auth/link/{provider}` with token
- Safety guard: `!user.hasPassword && user.oauthProviders.length === 1` → shows "Set a password first"

### UI Components Available
17 components in `src/components/ui/` — no Tooltip. lucide-react v0.575.0 installed.

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-171-frontend` (from main)
- Pull latest main, create branch, verify

### Step 1: Create Tooltip Component (`src/components/ui/Tooltip.tsx`)

- **File**: `src/components/ui/Tooltip.tsx` (NEW)
- **Action**: Create reusable tooltip following design system Section 11

**Design System Specs**:
| Property | Value | Tailwind |
|----------|-------|----------|
| Max width | 241px | `max-w-[241px]` |
| Background | #ffffff | `bg-white dark:bg-surface-card` |
| Border | 1px #000000 5% | `border border-border-default` |
| Shadow | 6px 6px 50px #0000000d | `shadow-card` |
| Border radius | 4px | `rounded-xs` |
| Padding | 20px V / 16px H | `py-5 px-4` |
| Text | 16px/700 #1c1c1c | `text-heading-sm font-bold text-content-primary` |
| Arrow | 17x17 rotated 45°, #1c1c1c | Custom CSS transform |

**Component Props**:
```typescript
interface TooltipProps {
  children: React.ReactNode;      // trigger element
  content: string;                // tooltip text
  position?: 'top' | 'bottom' | 'left' | 'right';  // default: 'top'
}
```

**Implementation Steps**:
1. Create functional component with `useState` for visibility
2. Trigger: `onMouseEnter`/`onMouseLeave` + `onFocus`/`onBlur` (accessibility)
3. Render tooltip body with absolute positioning relative to trigger
4. Arrow: rotated div (45deg transform) positioned at edge
5. Position logic: CSS classes for top/bottom/left/right placement
6. Accessibility: `role="tooltip"`, `aria-describedby` on trigger, `id` on tooltip body
7. Use `useId()` hook for unique IDs (React 18)

**Notes**:
- Tooltip text should use `text-sm font-medium` instead of `text-heading-sm font-bold` since this is an informational tooltip, not a title tooltip — adjust if design review says otherwise
- Ensure tooltip doesn't render server-side (client component with `'use client'`)

### Step 2: Add Info Icon + Tooltip to GitHub Connect Button (`ConnectedAccounts.tsx`)

- **File**: `src/components/profile/ConnectedAccounts.tsx`
- **Action**: Add Info icon with Tooltip for GitHub provider only

**Implementation Steps**:
1. Import `Tooltip` from `../ui/Tooltip`
2. Import `Info` icon from `lucide-react`
3. In the providers map (line ~141-147), for the Connect button section:
   - Wrap in a `flex items-center gap-2` container when `provider.id === 'GITHUB'`
   - Add `<Tooltip content="Your active GitHub session will be used. To link a different account, log out of github.com first." position="left">`
   - Inside tooltip trigger: `<Info className="h-4 w-4 text-content-tertiary cursor-help" tabIndex={0} />`
4. Condition: only render when `provider.id === 'GITHUB' && !isConnected`
5. Google provider: no changes (Google handles account selection natively)

**Resulting JSX** (conceptual):
```tsx
{!isConnected && (
  <div className="flex items-center gap-2">
    <button onClick={() => handleConnect(provider.id)} className="...">
      Connect
    </button>
    {provider.id === 'GITHUB' && (
      <Tooltip
        content="Your active GitHub session will be used. To link a different account, log out of github.com first."
        position="left"
      >
        <Info className="h-4 w-4 text-content-tertiary cursor-help" tabIndex={0} />
      </Tooltip>
    )}
  </div>
)}
```

### Step 3: Update Technical Documentation

- **Action**: Review and update documentation
- **Steps**:
  1. No API changes → no api-spec.yml update
  2. Update `frontend-standards.mdc` if Tooltip becomes a documented UI pattern
  3. Verify design system alignment

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create Tooltip component
3. Step 2: Add Info icon + Tooltip to ConnectedAccounts
4. Step 3: Update documentation

## 5. Testing Checklist

- [ ] Tooltip renders on hover over Info icon
- [ ] Tooltip renders on keyboard focus (Tab to icon)
- [ ] Tooltip hides on mouse leave and blur
- [ ] Tooltip only appears for GitHub, not Google
- [ ] Tooltip does not appear when GitHub is already connected
- [ ] Tooltip text matches spec exactly
- [ ] Tooltip position doesn't clip viewport on small screens
- [ ] `next build` passes clean (no TypeScript errors)
- [ ] Dark mode: tooltip colors adjust properly

## 6. Error Handling Patterns

- No API calls → no error handling needed
- Tooltip is purely presentational — graceful degradation if JS fails (icon still visible, just no tooltip)

## 7. UI/UX Considerations

- **Responsive**: Tooltip `position="left"` on desktop; may need to adjust to `"top"` on mobile if it clips. Consider detecting viewport edge.
- **Accessibility**: `role="tooltip"`, `aria-describedby`, keyboard focusable via `tabIndex={0}` on trigger
- **Touch devices**: `onFocus` handles tap-to-focus on mobile
- **Animation**: Optional subtle fade-in (150ms opacity transition)
- **Z-index**: Tooltip needs `z-50` to render above other elements

## 8. Dependencies

- `lucide-react` (already installed v0.575.0) — `Info` icon
- React 18 `useId()` hook — unique tooltip IDs
- No new packages required

## 9. Notes

- The Tooltip component is intentionally simple (no portal rendering, no Popper.js) — this matches the project's no-external-UI-library approach
- If viewport clipping becomes an issue in testing, a future ticket can add portal-based rendering
- Tooltip arrow uses the design system's dark arrow (#1c1c1c) — this creates a visual anchor pointing to the trigger

## 10. Next Steps After Implementation

- SCRUM-172 may reuse the Tooltip component if needed
- The Tooltip component is now available for any future use across the dashboard

## 11. Implementation Verification

- [ ] Code Quality: No linting errors, follows existing component patterns
- [ ] Functionality: Tooltip appears/disappears correctly for GitHub only
- [ ] Testing: Manual verification on desktop + mobile viewport
- [ ] Integration: ConnectedAccounts still works (connect/disconnect flows unchanged)
- [ ] Documentation: Updated if applicable
