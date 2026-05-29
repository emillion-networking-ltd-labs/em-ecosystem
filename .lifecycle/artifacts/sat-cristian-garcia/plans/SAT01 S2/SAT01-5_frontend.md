# Frontend Implementation Plan: SAT01-5 Pre-launch UI/UX Corrections (LIVING PLAN)

> **Living plan.** This ticket is open and iterative — issues are added to
> SAT01-5's description as the user discovers them during QA. Each issue
> becomes a step (or set of steps) below. New issues append to this document
> until the user explicitly says "all issues reported, proceed to commit".
>
> **Stage gate**: after each batch of issues is implemented, the branch is
> pushed (NOT merged). Vercel auto-creates a preview deploy. User tests
> the preview, reports more issues if any, and we loop. When user signals
> "done", we run `/verify` and `/commit` once for the entire batch.

**Detected scope**: `frontend`

## 1. Codebase State Snapshot

- **Date**: 2026-05-01
- **Last completed ticket**: SAT01-4 (Done — production hardening)
- **Branch**: `feature/SAT01-5-frontend` (will be created in Step 0)
- **Files verified against live code**:
  - `satellites/sat-cristian-garcia/src/components/sections/ServicesPreview.tsx` — uses `window.scrollY`-based parallax (lines 32-42); per-card `useFadeInOnView` with `index % 3 * 120ms` delay
  - `satellites/sat-cristian-garcia/src/components/sections/PortfolioPreview.tsx`, `TransformationsPreview.tsx`, `AppPreview.tsx`, `CTASection.tsx` — all use `getBoundingClientRect()`-based parallax (the standard pattern)
  - `satellites/sat-cristian-garcia/src/app/globals.css` line 127 has `scroll-behavior: smooth` inside `@layer base { html { ... } }`
  - `satellites/sat-cristian-garcia/src/lib/useFadeInOnView.ts` — per-element IO hook
  - `satellites/sat-cristian-garcia/src/lib/useStaggerOnView.ts` — section-level IO hook (defined but **not consumed anywhere** — grep shows 0 imports)
  - `satellites/sat-cristian-garcia/src/components/layout/IntroLoader.tsx` — splash screen, sets `sessionStorage.intro_seen` in unmount timer (line 69)
  - Existing CSS classes ready in `globals.css`: `animate-stagger` (200ms / 40ms step), `animate-stagger-slow` (800ms / 150ms step), `animate-fade-up` (500ms / 80ms step), all with `:nth-child` rules up to 6 children
- **Components currently using per-card `useFadeInOnView` for grids/rows/columns** (audit grep):
  - `src/components/sections/ServicesPreview.tsx` — 3-card grid
  - `src/app/contacto/page.tsx` — 4 contact-method cards (manual `cardDelay = 100 + index * 100ms`)
  - `src/app/portfolio/page.tsx` — gallery grid (3 instances of the hook)
  - `src/app/precios/page.tsx` — pricing cards (1 hook)
  - `src/app/sobre-mi/page.tsx` — many fades for timeline/credentials (12+ hooks)
  - `src/components/sections/PortfolioPreview.tsx`, `TransformationsPreview.tsx`, `AppPreview.tsx` — to be audited per-component during develop

## 2. Regression Impact Analysis

**Blast radius (current 3 issues)**:

| File | Issue | Type |
|---|---|---|
| `src/components/sections/ServicesPreview.tsx` | #1 + #3 | Modify |
| `src/app/globals.css` | #2 + #3 | Modify |
| `src/lib/useFadeInOnView.ts` | #3 | Modify |
| `src/lib/useStaggerOnView.ts` | #3 | Modify |
| `src/components/layout/IntroLoader.tsx` | #3 | Modify (CustomEvent dispatch) |
| `src/components/sections/PortfolioPreview.tsx` | #3 | Modify (refactor) |
| `src/components/sections/TransformationsPreview.tsx` | #3 | Modify (refactor if grids found) |
| `src/components/sections/AppPreview.tsx` | #3 | Modify (refactor if grids found) |
| `src/app/contacto/page.tsx` | #3 | Modify (refactor) |
| `src/app/portfolio/page.tsx` | #3 | Modify (refactor) |
| `src/app/precios/page.tsx` | #3 | Modify (refactor) |
| `src/app/sobre-mi/page.tsx` | #3 | Modify (refactor) |

**Breaking changes**: NONE. All changes are behavioural, no API/contract/schema changes. JSX visual output is preserved (same DOM, same classes for layout, just different animation triggers).

**Risk areas**:
- The `useFadeInOnView` hook signature is preserved; only internal IO behaviour changes (splash gate). Existing per-element call sites remain valid.
- Components refactored from per-card to parent-stagger keep the same VISIBLE animation effect — only the trigger mechanism changes.
- Bundle size impact: zero — we're consolidating existing hooks, not adding new ones. CSS classes already exist.

**Test impact**: N/A — satellite has no test framework (consistent with marketing satellite plan).

## 3. Overview

This is the iterative QA polish pass after SAT01-4. Three issues currently in scope:

1. **Issue #1 — ServicesPreview parallax misbehaves on tablet/mobile**: scrollY-based parallax fails on the smaller breakpoint due to the MobileStatsBlock spacer between Hero and Services. Switch to rect-based on `< lg` viewports while keeping scrollY-based on desktop.

2. **Issue #2 — Page reload jumps to top, then animates back**: `scroll-behavior: smooth` global directive in `globals.css` interferes with native scroll restoration. Remove the directive.

3. **Issue #3 — Entry animations inconsistent**: per-card IntersectionObserver pattern + splash interaction + sub-tuned stagger delays cause cards to enter inconsistently, sometimes simultaneously, sometimes skipped behind the splash. Refactor to section-level IO + CSS-driven nth-child stagger; add a splash-gate to the hooks; tune CSS stagger delays to industry best practice (30-70% of animation duration).

## 4. Architecture Context

- **Stack unchanged**: Next.js 14 + Tailwind 3.4 + system-ui + vanilla CSS keyframes (no Framer Motion / GSAP)
- **Animation strategy after refactor**:
  - **Solo elements** (hero images, single CTAs): keep per-element `useFadeInOnView` → IO per element, animation triggers when that specific element enters viewport
  - **Groups of cards/items in a grid/row/column**: switch to `useStaggerOnView` on the parent → ONE IO per group, CSS `:nth-child` rules cascade staggered delays to children deterministically
- **Splash interaction**: `IntroLoader` dispatches `CustomEvent('intro:exit')` on unmount; both hooks listen for this event before allowing `setInView(true)`. If `sessionStorage.intro_seen === '1'` when the hook mounts, gate is bypassed (repeat-visitor fast path)
- **CSS stagger tuning** (industry best practice 30-70% of duration):
  - `animate-fade-up` (current default for stagger): 500ms duration, **step 150ms** (was 80ms, +88%) → 0/150/300/450/600/750ms for 6 children
  - `animate-stagger-slow` (used by Hero stats today): 800ms duration, **step 200ms** (was 150ms, +33%) → 0/200/400/600/800/1000ms

## 5. Implementation Steps

### Step 0: Create Feature Branch

```bash
cd em-ecosystem-code
git checkout main && git pull origin main
git checkout -b feature/SAT01-5-frontend
```

### Step 1: Issue #1 — Fix ServicesPreview parallax on tablet/mobile

**File**: `satellites/sat-cristian-garcia/src/components/sections/ServicesPreview.tsx`

**Action**: Inside `handleScroll`, branch on `window.matchMedia('(max-width: 1023px)')`. On mobile/tablet, use the standard rect-based pattern (matches Portfolio/Transformations/AppPreview/CTA). On desktop, keep the existing `window.scrollY / 400` pattern.

**Implementation Notes**:
- Add `const ref = useRef<HTMLElement>(null)` to the component
- Apply `ref={ref}` to the `<section>` element
- Add a `resize` listener alongside the existing `scroll` listener so the breakpoint switch is re-evaluated on viewport changes
- ~10 lines diff total. JSX and styling unchanged.

### Step 2: Issue #2 — Remove global `scroll-behavior: smooth`

**File**: `satellites/sat-cristian-garcia/src/app/globals.css`

**Action**: Delete the line `scroll-behavior: smooth;` inside the `@layer base { html { ... } }` block (currently line 127).

**Implementation Notes**:
- 1-line diff. No replacement — the absence of the rule defaults to `auto`, which is what we want for native scroll restoration on reload.
- Verified in audit (Issue #2 description): no in-page anchor links rely on this.

### Step 3: Issue #3 — Splash gate + section-level IO + tuned stagger

This issue has 4 sub-steps that work together. Order matters.

#### Step 3a: IntroLoader dispatches `intro:exit` event

**File**: `satellites/sat-cristian-garcia/src/components/layout/IntroLoader.tsx`

**Action**: In the `unmountTimer` callback (currently line 63-72), after setting `sessionStorage` and before `setShow(false)`, add:

```typescript
window.dispatchEvent(new CustomEvent('intro:exit'));
```

**Why**: this is the signal that the splash has finished its full sequence. Hooks subscribe to it.

#### Step 3b: Splash gate in `useFadeInOnView`

**File**: `satellites/sat-cristian-garcia/src/lib/useFadeInOnView.ts`

**Action**: Inside the existing `useEffect`, before observing the element, check whether the splash is currently active. If it is (sessionStorage flag absent AND DOM has `.intro-loader` element), defer `setInView(true)` until the `intro:exit` event fires. If splash already finished (or never showed because of `prefers-reduced-motion`), proceed immediately.

**Pseudo-code**:
```typescript
useEffect(() => {
  const el = ref.current;
  if (!el) return;

  const splashActive = !sessionStorage.getItem('intro_seen') && document.querySelector('.intro-loader');

  const observe = () => {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return io;
  };

  if (splashActive) {
    let io: IntersectionObserver | null = null;
    const onIntroExit = () => { io = observe(); };
    window.addEventListener('intro:exit', onIntroExit, { once: true });
    return () => {
      window.removeEventListener('intro:exit', onIntroExit);
      io?.disconnect();
    };
  } else {
    const io = observe();
    return () => io.disconnect();
  }
}, [threshold]);
```

#### Step 3c: Same splash gate in `useStaggerOnView`

**File**: `satellites/sat-cristian-garcia/src/lib/useStaggerOnView.ts`

**Action**: Same pattern as Step 3b — wait for `intro:exit` if splash is active, otherwise observe immediately.

#### Step 3d: Tune CSS stagger delays in `globals.css`

**File**: `satellites/sat-cristian-garcia/src/app/globals.css`

**Action**: Update the nth-child delays for `.animate-fade-up` and `.animate-stagger-slow` to match industry best practice (30-70% of animation duration).

**Diff**:
```diff
.animate-fade-up > *:nth-child(1) { animation-delay: 0ms; }
- .animate-fade-up > *:nth-child(2) { animation-delay: 80ms; }
- .animate-fade-up > *:nth-child(3) { animation-delay: 160ms; }
- .animate-fade-up > *:nth-child(4) { animation-delay: 240ms; }
- .animate-fade-up > *:nth-child(5) { animation-delay: 320ms; }
- .animate-fade-up > *:nth-child(6) { animation-delay: 400ms; }
+ .animate-fade-up > *:nth-child(2) { animation-delay: 150ms; }
+ .animate-fade-up > *:nth-child(3) { animation-delay: 300ms; }
+ .animate-fade-up > *:nth-child(4) { animation-delay: 450ms; }
+ .animate-fade-up > *:nth-child(5) { animation-delay: 600ms; }
+ .animate-fade-up > *:nth-child(6) { animation-delay: 750ms; }

.animate-stagger-slow > *:nth-child(1) { animation-delay: 100ms; }
- .animate-stagger-slow > *:nth-child(2) { animation-delay: 250ms; }
- .animate-stagger-slow > *:nth-child(3) { animation-delay: 400ms; }
- .animate-stagger-slow > *:nth-child(4) { animation-delay: 550ms; }
- .animate-stagger-slow > *:nth-child(5) { animation-delay: 700ms; }
- .animate-stagger-slow > *:nth-child(6) { animation-delay: 850ms; }
+ .animate-stagger-slow > *:nth-child(2) { animation-delay: 300ms; }
+ .animate-stagger-slow > *:nth-child(3) { animation-delay: 500ms; }
+ .animate-stagger-slow > *:nth-child(4) { animation-delay: 700ms; }
+ .animate-stagger-slow > *:nth-child(5) { animation-delay: 900ms; }
+ .animate-stagger-slow > *:nth-child(6) { animation-delay: 1100ms; }
```

#### Step 3e: Refactor home sections to use `useStaggerOnView`

For each home section that has a grid/row/column of cards (not solo elements):

**ServicesPreview** (already touched in Step 1):
- Remove per-card `useFadeInOnView` from `ServiceCard`
- On the grid container `<div className="grid grid-cols-1 gap-6 md:grid-cols-3">`, attach `useStaggerOnView` and apply `className`

**PortfolioPreview, TransformationsPreview, AppPreview**:
- Audit each for groups of cards
- Apply same pattern: parent grid gets `useStaggerOnView`, children lose individual hooks

#### Step 3f: Refactor pages with grids of cards

- `src/app/contacto/page.tsx` — 4 ContactMethodCard items in a column; replace per-card hooks (currently `linkFade` + `divFade` with manual `cardDelay`) with `useStaggerOnView` on the parent container
- `src/app/portfolio/page.tsx` — gallery grid; lightbox cards stagger
- `src/app/precios/page.tsx` — pricing cards stagger
- `src/app/sobre-mi/page.tsx` — group adjacent fades into containers; many existing hooks may simplify into 2-3 `useStaggerOnView` blocks for timeline + credentials, plus solo `useFadeInOnView` for hero image, story image, philosophy headline, etc.

### Step 4 (Issue #4 — added 2026-05-01 during /develop loop): rootMargin + threshold tuning in IO hooks

After local testing of Issues #1-#3, the user reported that section animations
fire prematurely — when one section enters the viewport, the next section's
animation also triggers because the IO `threshold: 0.15` only requires 15% of
the (large) section to be visible, which happens as soon as its top edge peeks
into the viewport bottom. By the time the user scrolls down, the animation is
already done.

**Root cause:** IntersectionObserver `threshold` is meant for "how much of the
element is visible", not for "where in the viewport the trigger fires". Using
threshold alone for trigger positioning is a known pitfall (per MDN docs).
The professional pattern is **`rootMargin` with negative bottom buffer**.

**Fix:**

`src/lib/useFadeInOnView.ts`:
```diff
 export function useFadeInOnView<T extends HTMLElement>({
-  threshold = 0.15,
+  threshold = 0.1,
+  rootMargin = "0% 0% -15% 0%",
   delay = 0,
   duration = 700,
   from = "bottom",
- }: { threshold?: number; ... } = {}) {
+ }: { threshold?: number; rootMargin?: string; ... } = {}) {
   ...
   const io = new IntersectionObserver(
     ([entry]) => { ... },
-    { threshold },
+    { threshold, rootMargin },
   );
```

Same change in `src/lib/useStaggerOnView.ts` (signature + IO config).

**Effect:** elements only fire IO when they cross above the bottom 15% of the
viewport — i.e., when actually visible to the user, not just peeking. Compatible
with parallax (the +40px translateY composes correctly with the buffer). No
regression on above-fold initial load (those elements are fully in viewport).

### Step 5: Local build verification

```bash
cd em-ecosystem-code/satellites/sat-cristian-garcia
rm -rf .next
npm run build
```

Expected:
- Compiles successfully
- All 15 routes still ○ Static
- First Load JS shared unchanged (~87.3 kB) — refactor uses existing hooks/CSS, no new deps

**`/develop` ENDS HERE** (per spec — `/develop` is local-only, no push). The lifecycle
naturally pauses at this point. The user can test on localhost (`npm run dev`) before
authorising `/verify` and `/commit` to proceed.

If user finds issues during local testing → loop back to discovery in SAT01-5
description, append new steps to this plan, repeat Step 4.

If local testing is OK → user signals "continue" → run the standard `/verify` →
`/commit` → `/update-docs` lifecycle.

## 6. Implementation Order

```
── /develop phase (LOCAL ONLY per spec — branch + edits + local build) ──
Step 0   Create feature branch
Step 1   Issue #1 — ServicesPreview mobile parallax (~10 lines)
Step 2   Issue #2 — Remove scroll-behavior: smooth (1 line)
Step 3a  Issue #3 — IntroLoader CustomEvent dispatch
Step 3b  Issue #3 — useFadeInOnView splash gate
Step 3c  Issue #3 — useStaggerOnView splash gate
Step 3d  Issue #3 — Tune CSS stagger delays
Step 3e  Issue #3 — Refactor home sections (Services, Portfolio, Transformations, AppPreview)
Step 3f  Issue #3 — Refactor pages (contacto, portfolio, precios, sobre-mi)
Step 4   Local build verification (npm run build)
         ── /develop ends here per spec ──
         ── User runs `npm run dev`, tests on localhost:3002 ──
         ── If new issues: discovery → append steps to plan → repeat /develop ──
         ── If local OK: user authorises continuing the lifecycle ──

── /verify phase (per spec — quality gate, no remote contact) ──
── /commit phase (per spec — push + PR + merge + cleanup, ALL remote ops here) ──
── /update-docs phase (per spec — record, auto-commit ai-specs, Jira transition) ──
```

## 7. Testing Checklist

Local (during develop):
- [ ] `npm run build` clean from `satellites/sat-cristian-garcia/`
- [ ] All 15 routes ○ Static
- [ ] First Load JS shared ≤ 90 kB

Preview deploy (post-push):
- [ ] **Issue #1**: scroll the home page on tablet/mobile-width viewport (DevTools responsive mode at 375px and 768px). ServicesPreview should enter viewport with progressive parallax (rect-based), not abrupt offset.
- [ ] **Issue #1**: scroll the home page on desktop. ServicesPreview should still feel attached to Hero (current behaviour preserved).
- [ ] **Issue #2**: scroll down to Portfolio block on home, F5. Page should restore scroll position INSTANTANEOUSLY, no animated jump from top.
- [ ] **Issue #3**: clear `sessionStorage.intro_seen` and reload home in incognito. Splash plays for 3.4s. After it exits, above-fold cards should THEN start their staggered fade-in animation (not appear static).
- [ ] **Issue #3**: scroll slowly through the home — cards in a group should enter strictly one after another with 150ms-250ms perceptible separation, never simultaneously, never out of order.
- [ ] **Issue #3**: same on /sobre-mi, /contacto, /portfolio, /precios — staggered groups behave consistently.
- [ ] No regression in IntroLoader behaviour, security headers, build size, or visual layout.

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Refactor breaks an animation that was working | LOW | MEDIUM | Verify each section visually post-deploy. The CSS classes already exist — refactor is connecting hook to existing CSS, not new logic. |
| Splash gate causes hooks to wait forever if `intro:exit` event never fires (e.g., reduced-motion users where splash never shows) | LOW | HIGH | The gate checks `sessionStorage.intro_seen` AND DOM presence of `.intro-loader`. If either is false, gate bypasses immediately. Reduced-motion path: splash element never renders → `document.querySelector('.intro-loader')` returns null → gate bypassed. |
| Tuned stagger delays feel too slow | LOW | LOW | 150ms is a tested industry baseline. If user feedback says it's slow, easy to roll back values. |
| Sobre-mi page has many fades that don't fit the "group" pattern cleanly | MEDIUM | LOW | Use judgement: group adjacent fades that share a parent container; keep as solo `useFadeInOnView` if the element has no peers. |

## 9. Acceptance Criteria

(Mirror SAT01-5 ticket description.) The plan delivers all current ACs end-to-end:

- All issues listed in SAT01-5 (currently #1, #2, #3 — possibly more added during the iteration loop) resolved
- `npm run build` passes clean
- All 15 routes still ○ Static; First Load JS shared not increased materially
- All fixes visible in production at https://sat-cristian-garcia.vercel.app post-deploy
- No regression in security headers, IntroLoader behaviour, or existing UX patterns

## 10. Verification Approach

`/verify` runs at the END of the iterative loop (not after each batch). It:
1. Reads this plan step by step against actual code in `feature/SAT01-5-frontend`
2. Confirms `npm run build` passes
3. After production deploy, validates each AC via curl (where applicable) + manual visual test
4. Generates verify report at `ai-specs/changes/sat-cristian-garcia/plans/SAT01 S2/SAT01-5_verify.md`

---

**Plan ready. Proceeding to `/develop` (Step 0 onwards).**

> **Reminder**: this plan is LIVING. If new issues are reported during the
> testing loop (Step 6), append new steps after Step 3f (numbered Step 4, 5, 6
> with new sub-letters as needed), then move the build/push/loop steps down.
