# Frontend Implementation Plan: SCRUM-307 Framer Motion Migration for List Animations

## Overview

Migrate list enter/exit animations from CSS @keyframes + setTimeout hacks to Framer Motion's AnimatePresence + motion.div. This eliminates fragile duration-matching between CSS and JS, giving React full control over animation lifecycle. Only 2 components have setTimeout hacks (TrustedDevices, Toast). All other animations (14 @keyframes, Tailwind animate-*, CSS transitions) stay as-is.

## Architecture Context

- **New dependency**: `framer-motion` (~30KB gzipped)
- **Components affected**: TrustedDevices.tsx, Toast.tsx, ToastContainer.tsx
- **Optional**: PasskeyManager.tsx (add enter animation), ComponentShowcase.tsx (showcase + demo update)
- **CSS**: globals.css — optionally remove slideInFade/slideOutFade/toast-in/toast-out @keyframes + their animate-* classes if fully replaced
- **No backend changes**

## Implementation Steps

### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-307-frontend`

### Step 1: Install framer-motion
- `cd nexacore-dashboard && npm install framer-motion`
- Justification: Required for AnimatePresence (orchestrates exit animations before unmount) — no CSS-only equivalent exists

### Step 2: Migrate TrustedDevices.tsx
- **File**: `src/components/profile/TrustedDevices.tsx`
- **Current state**: CSS class toggling (`animate-slide-in-fade` / `animate-slide-out-fade`) + 2 setTimeouts (line 72: 1000ms enter clear, line 95: 500ms exit gate)

**Changes**:
1. Import `{ motion, AnimatePresence }` from `framer-motion`
2. Define animation variants:
   ```ts
   const itemVariants = {
     initial: { opacity: 0, y: -8, scale: 0.97 },
     animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
     exit: { opacity: 0, x: -20, scale: 0.95, height: 0, marginBottom: 0, transition: { duration: 0.3 } },
   };
   ```
3. Wrap device list in `<AnimatePresence mode="popLayout">` (allows layout animation when items reorder)
4. Replace `<div key={device.id} className={...}>` with `<motion.div key={device.id} variants={itemVariants} initial="initial" animate="animate" exit="exit" layout>`
5. Remove CSS class conditionals: `animate-slide-in-fade` / `animate-slide-out-fade` no longer needed
6. Remove `newDeviceId` state + its `useEffect` (line 66-76) — Framer Motion auto-animates new items
7. Remove `removingId` state — AnimatePresence handles exit when item is removed from array
8. Simplify `handleRevoke`:
   ```ts
   const handleRevoke = async () => {
     if (!revokeTarget) return;
     const targetId = revokeTarget.id;
     setRevokeTarget(null);
     setIsRevoking(true);
     const ok = await revokeDevice(targetId);
     setIsRevoking(false);
     if (ok) addToast(PROFILE_TOAST.DEVICE_REVOKED);
     else addToast(PROFILE_TOAST.DEVICE_REVOKE_FAILED);
   };
   ```
   No more `setRemovingId`, no more `await setTimeout(500)`. The device disappears from the array → AnimatePresence handles the exit animation.

### Step 3: Migrate Toast.tsx + ToastContainer.tsx
- **Files**: `src/components/ui/Toast.tsx`, `src/components/ui/ToastContainer.tsx`
- **Current state**: `isExiting` state + `animate-toast-in` / `animate-toast-out` CSS classes + `setTimeout(300)` before `onClose`

**Toast.tsx changes**:
1. Import `{ motion }` from `framer-motion`
2. Replace `<div role="alert" ...>` with `<motion.div role="alert" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }} ...>`
3. Remove `isExiting` state
4. Remove `setTimeout(() => onClose(id), 300)` from `dismiss` — just call `onClose(id)` directly
5. Remove CSS class conditionals: no more `animate-toast-in` / `animate-toast-out`

**ToastContainer.tsx changes**:
1. Import `{ AnimatePresence }` from `framer-motion`
2. Wrap toast list in `<AnimatePresence>`:
   ```tsx
   <AnimatePresence>
     {toasts.map((toast) => (
       <Toast key={toast.id} ... />
     ))}
   </AnimatePresence>
   ```

### Step 4: Update ComponentShowcase ToastDemo
- **File**: `src/components/admin/ComponentShowcase.tsx`
- **Current**: `setTimeout(() => setVisible(false), 300)` mirroring Toast's exit delay
- **Change**: Remove setTimeout, directly set `setVisible(false)` — AnimatePresence in ToastContainer handles exit

### Step 5: Clean up globals.css (optional)
- **File**: `src/app/globals.css`
- If TrustedDevices no longer uses `slideInFade`/`slideOutFade` → remove those @keyframes + their `.animate-slide-in-fade` / `.animate-slide-out-fade` classes
- If Toast no longer uses `toast-in`/`toast-out` → remove those @keyframes + their `.animate-toast-in` / `.animate-toast-out` classes
- **Only remove if zero grep matches in src/ for those class names**

### Step 6: Document in ComponentShowcase
- Add a "Motion Patterns" section to the showcase documenting:
  - AnimatePresence for list enter/exit
  - motion.div variant pattern
  - When to use Framer Motion vs CSS @keyframes vs Tailwind animate-*
  - Decision tree: "Use Framer Motion when React state controls mount/unmount timing"

### Step 7: Update Technical Documentation
- `ai-specs/specs/frontend-standards.mdc` — add note about Framer Motion usage for list animations
- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Install framer-motion
3. Step 2: Migrate TrustedDevices
4. Step 3: Migrate Toast + ToastContainer
5. Step 4: Update ComponentShowcase ToastDemo
6. Step 5: Clean up globals.css
7. Step 6: Document motion patterns in showcase
8. Step 7: Update documentation

## Testing Checklist

- [ ] TrustedDevices: new device animates in smoothly (no setTimeout)
- [ ] TrustedDevices: revoking device animates out, then API call fires (no setTimeout)
- [ ] TrustedDevices: "Revoke All" still works
- [ ] Toast: appears with enter animation
- [ ] Toast: auto-dismisses after 5s with exit animation
- [ ] Toast: manual dismiss (X button) triggers exit animation then unmounts
- [ ] Toast: multiple toasts stack correctly
- [ ] All 14 remaining @keyframes still work (auth cards, dropdowns, spinners, tabs, countdown, icons)
- [ ] All Tailwind animate-* classes still work
- [ ] Build: `npm run build` clean
- [ ] TypeScript: `tsc --noEmit` 0 new errors

## Error Handling Patterns

- Framer Motion errors are compile-time (missing variants, wrong prop types)
- No runtime error handling needed — animations are fire-and-forget
- If AnimatePresence is removed from JSX accidentally, items just mount/unmount instantly (graceful degradation)

## UI/UX Considerations

- Animation durations match current CSS values: enter ~400ms, exit ~300ms
- Exit animations use `height: 0` collapse for list items (smooth layout shift)
- Toast exit uses horizontal slide (matches current behavior)
- `layout` prop on motion.div enables smooth reflow when items are added/removed from list
- `mode="popLayout"` prevents layout jank during exit animations

## Dependencies

- `framer-motion` (new) — ~30KB gzipped, React 18 compatible, tree-shakeable

## Notes

- Only migrate components with setTimeout animation hacks — don't over-migrate
- CSS @keyframes are fine for non-React-controlled animations (auth pages, dropdown open/close, hover states)
- Framer Motion is only for animations where React needs to control the lifecycle (mount/unmount timing)
- `AnimatePresence` is the key feature — it delays unmount until exit animation completes (impossible with CSS alone)

## Implementation Verification

- [ ] Zero setTimeout calls used for animation timing in migrated components
- [ ] `grep -r "setTimeout" src/components/profile/TrustedDevices.tsx` returns 0 matches
- [ ] `grep -r "setTimeout.*300\|setTimeout.*500" src/components/ui/Toast.tsx` returns 0 matches
- [ ] All existing animations unaffected (visual regression test)
- [ ] Bundle size impact < 35KB gzipped (check next build output)
