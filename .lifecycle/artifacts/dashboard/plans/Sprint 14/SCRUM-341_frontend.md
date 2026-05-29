# Frontend Implementation Plan: SCRUM-341 Reconcile ui-design-system.md — Feedback / Alerts

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B8 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Sibling of SCRUM-334-340 (B1-B7) — all completed. **8th application** of carry-forward Accepted-Trivial pattern. **NEW JSX-only record**: 4 of 6 components have NO spec export (Toast, ToastContainer, ErrorAlert, RateLimitBanner) — B5 had 2, B7 had 0. User confirmed **Option A** for InlineError: promote to dedicated §47 section + update cross-references in Common Patterns + §24 FormField. 6 user-approval gates. Section count grows §1-§43 → §1-§48 (+5).

## 1. Codebase State Verification (2026-05-03)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B7)
  - Doc (`ai-specs`): `c816d31` (post-/update-docs of SCRUM-340 / B7)
- **Common Patterns anchor**: line 2141 of `ui-design-system.md` (will shift after Toast rewrite + 5 inserts; verify exact line at /develop start)
- **§19 Toast Message heading**: line 983 (in-place rewrite target — content from line 983 to closing `---`)
- **Cross-reference update targets** (Option A):
  - Line 1222 (§24 FormField — Error slot reference)
  - Line 1236-1238 (§24 FormField — InlineError documentation block)
  - Line 2379 (Common Patterns "Input Field" — InlineError styling reference)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/components/ui/Toast.tsx` (82 lines, NO spec export — JSX-only)
  - `nexacore-dashboard/src/components/ui/ToastContainer.tsx` (27 lines, NO spec export — JSX-only)
  - `nexacore-dashboard/src/components/ui/AlertBox.tsx` (71 lines, `alertBoxSpecs` line 34)
  - `nexacore-dashboard/src/components/ui/ErrorAlert.tsx` (50 lines, NO spec export — JSX-only)
  - `nexacore-dashboard/src/components/ui/InlineError.tsx` (29 lines, `inlineErrorSpecs` line 5)
  - `nexacore-dashboard/src/components/ui/RateLimitBanner.tsx` (58 lines, NO spec export — JSX-only)
  - `ai-specs/specs/ui-design-system.md` — anchor at line 2141 + lines 983+ (current §19) + cross-ref targets above
- **File to be written**: `ai-specs/specs/ui-design-system.md` (multiple Edits: rewrite §19 + insert §44-§48 + 2-3 cross-ref updates)

## 2. Overview

This ticket reconciles 6 Feedback / Alerts components — the most JSX-only-heavy cluster in Part B (4 of 6 lack spec exports). Toast §19 has significant drift (raw hex, pixel pill, wrong icon sizes/names) and gets a full rewrite. 5 components get new dedicated sections. User-confirmed **Option A** for InlineError: promote to §47 with cross-ref updates in §24 FormField + Common Patterns "Input Field".

After this ticket:
- **§19 Toast (Quick Notification)**: REWRITTEN (token-based, framer-motion documented, 4 variants, ARIA, 5s default duration, opacity-0/group-hover close-button reveal)
- **§44 ToastContainer**: NEW (JSX-only, fixed positioning, pointer-events layering, AnimatePresence wrapper)
- **§45 AlertBox**: NEW (sourced from `alertBoxSpecs`, 4 variants, inline-flex)
- **§46 ErrorAlert**: NEW (JSX-only, inline custom SVG disclosure, composes §42 IconButton — first B8→B7 cross-ref)
- **§47 InlineError**: NEW (sourced from `inlineErrorSpecs`, promoted from Common Patterns)
- **§48 RateLimitBanner**: NEW (JSX-only, composes §32 CountdownTimer, kind-based icon switch)
- **§24 FormField**: UPDATED — InlineError references redirected to §47
- **Common Patterns "Input Field"**: UPDATED — InlineError styling reference redirected to §47

Final section count: **§1–§48** (current §1-§43 + 5 new = +5).

Per the design-system source-of-truth rule, /develop pauses for sign-off at each component — **6 gates total**.

## 3. Architecture Context

```
ui-design-system.md (post-c816d31 / B7)
├─ §1-§18 (untouched)
├─ §19 Toast Message (Quick Notification)        ← REWRITE in place (preserve heading + position)
├─ §20-§23 (untouched)
├─ §24 FormField                                 ← UPDATE InlineError cross-references (lines 1222, 1236-1238)
├─ §25-§43 (untouched)
├─ #### Display primitives opacity pattern       ← (untouched)
└─ ## Common Patterns                            ← INSERT 5 new sections BEFORE this anchor
   ├─ ...
   ├─ ### Input Field                            ← UPDATE InlineError reference (line 2379)
   ├─ ...
```

After B8:
```
ui-design-system.md (post-B8)
├─ §1-§18 (untouched)
├─ §19 Toast (REWRITTEN — token-based, framer-motion, 4 variants)
├─ §20-§23 (untouched)
├─ §24 FormField (cross-refs updated)
├─ §25-§43 (untouched)
├─ #### Display primitives opacity pattern (untouched)
├─ §44 ToastContainer (NEW — composes §19, JSX-only)
├─ §45 AlertBox (NEW — spec-export-sourced)
├─ §46 ErrorAlert (NEW — JSX-only, composes §42 IconButton)
├─ §47 InlineError (NEW — promoted from Common Patterns)
├─ §48 RateLimitBanner (NEW — JSX-only, composes §32 CountdownTimer)
└─ ## Common Patterns
   ├─ ...
   ├─ ### Input Field (InlineError reference updated to point to §47)
   ├─ ...
```

**Branching exception**: 8th application of carry-forward Accepted-Trivial. No `feature/SCRUM-341-frontend` branch in `em-ecosystem-code`. Convention silenced.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed (8th application).

### Step 1: Discovery — read 6 spec sources + verify §19 + verify cross-ref targets

- **Files**: read-only — 6 .tsx files (~317 lines total) + 4 doc regions
- **Action**: extract spec values + JSX details into working notes.
- **Implementation steps**:
  1. Open `Toast.tsx` (82 lines) — capture JSX layout (`grid-cols-[14px_1fr_auto] max-w-[550px] rounded-3xl py-3 pl-5 pr-4`), VARIANT_CONFIG (4 variants), framer-motion animation (`initial`/`animate`/`exit`/`transition`), ARIA (`role="alert" aria-live="assertive"`), 5s `DEFAULT_DURATION` + `useEffect(setTimeout)`, close-button opacity-0/group-hover reveal pattern, `text-content-primary/50` description (opacity pattern!), `text-content-tertiary` close-button (verify token name).
  2. Open `ToastContainer.tsx` (27 lines) — capture positioning (`fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2 px-[50px]`), `pointer-events-none` container + `pointer-events-auto` Toast layering, AnimatePresence wrapper, consumes `useToast()` context.
  3. Open `AlertBox.tsx` (71 lines) — capture `alertBoxSpecs` (line 34) — consolidated, 4 variants (warning/error/info/success), `inline-flex items-start gap-2 rounded-lg border p-3`, lucide icons at 16px, `mt-0.5 shrink-0`.
  4. Open `ErrorAlert.tsx` (50 lines) — capture `flex items-start gap-3 rounded-xl border p-4`, **inline custom SVG** for info-circle (NOT lucide — disclosure), composes §42 IconButton (`variant="danger"`, `size="sm"`), null-render when message empty.
  5. Open `InlineError.tsx` (29 lines) — capture `inlineErrorSpecs` (line 5) — already aligned per audit; tiny component (3-line spec).
  6. Open `RateLimitBanner.tsx` (58 lines) — capture `flex items-start gap-2`, kind-based icon switch (`Lock` for `lockout` / `AlertTriangle` otherwise), `useEffect(setInterval)` countdown logic, `onExpired` callback, composes §32 CountdownTimer.
  7. Re-read `ui-design-system.md` lines 983+ (current §19 — full extent through closing `---`) and cross-ref targets at lines 1222, 1236-1238, 2379.
- **Watch for surprises** (will become deviations if found):
  - Toast `text-content-tertiary` token — verify it exists or is intended (could be a 3rd opacity step beyond /50)
  - Animation library framer-motion — first time documented in Part B; reusable note
  - ErrorAlert vs AlertBox `error` variant overlap — when-to-use disclosure
  - Toast close-button keyboard a11y — opacity-0 means hidden until hover; check focus-visible behavior

### Step 2: Per-component drafting + user approval (6 sub-steps)

Order: Toast first (canonical anchor for cluster), then composers and adjacent (ToastContainer, AlertBox, ErrorAlert, InlineError), RateLimitBanner last (composes B5 + B7 — most cross-references).

#### Step 2a: Draft §19 Toast Message REWRITE (Gate 1 — most complex)

- **Action**: from JSX directly (no spec export — JSX-only disclosure required), draft a complete REWRITE of §19. Preserve the `### 19. Toast Message (Quick Notification)` heading; replace ALL content between heading and closing `---`.
- **Content scope** (token-based — drops all raw hex):
  - JSX-only disclosure blockquote at top (B5 §31/§32 precedent)
  - Container: `grid grid-cols-[14px_1fr_auto] items-start gap-x-2 max-w-[550px] rounded-3xl border border-border-components bg-surface-primary py-3 pl-5 pr-4 pointer-events-auto group`
  - 3-column grid layout: icon col / title+description col / close button col — explicit
  - 4 variants from VARIANT_CONFIG (error/success/warning/info) with `text-error`/`text-success`/`text-warning`/`text-info` tokens; lucide icons (TriangleAlert/CircleCheck/CircleAlert/Info) at 14px (NOT 16)
  - Title: `text-caption font-semibold leading-4 text-content-primary`
  - Description (optional): `text-caption leading-4 text-content-primary/50` — extends opacity pattern
  - Close button: `text-content-tertiary opacity-0 transition-all hover:text-content-primary group-hover:opacity-100`, X 12px, `-mt-[7px] -mr-[7px]` negative margins
  - 5s default duration (`DEFAULT_DURATION = 5000`) with `useEffect(setTimeout)` auto-dismiss; `duration` prop allows override
  - Animation: framer-motion `motion.div` with `layout`, `initial={{opacity:0, y:-20}}`, `animate={{opacity:1, y:0}}`, `exit={{opacity:0, x:40, transition:{duration:0.25}}}`, `transition={{duration:0.3}}`
  - ARIA: `role="alert" aria-live="assertive"` (must-have for screen-reader announcements)
  - **Drop the "Quick Notification" suffix from heading?** NO — keep for backward compat (§11 Quick Notification will be addressed in B10 cleanup). Add note that the suffix is historical.
- **Source citation**: `Source: Toast.tsx (no spec export — JSX-only)` + cite library `framer-motion` + cross-ref §44 ToastContainer (forward).
- **Disclosure**: JSX-only + `text-content-primary/50` opacity pattern extension + close-button keyboard a11y consideration + 14px icon (not 16) + `text-content-tertiary` token verification.
- **Cross-references**: §44 ToastContainer (forward); §45 AlertBox (sister inline notification — different positioning + persistence model)
- **Present for approval**: Gate 1.

#### Step 2b: Draft §44 ToastContainer (Gate 2)

- **Action**: from JSX directly (no spec export), draft a new section. JSX-only disclosure blockquote.
- **Content scope**:
  - Container: `pointer-events-none fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2 px-[50px]`
  - Layering rationale: `pointer-events-none` on container + `pointer-events-auto` on each Toast — allows clicking through gaps to underlying UI but Toast itself is interactive
  - Position: 24px from viewport top (`top-6`), centered horizontally, 50px lateral safe area, 8px gap between toasts
  - Z-index 50 (same layer as modals — verify with §5 Modal)
  - Composes §19 Toast (forward cross-ref)
  - AnimatePresence wrapper from framer-motion — handles enter/exit animations from each Toast
  - Consumes `useToast()` context — provides `{toasts, removeToast}` — context is implicit dependency
- **Source citation**: `Source: ToastContainer.tsx (no spec export — JSX-only)` + library `framer-motion` + context `@/context/ToastContext`.
- **Disclosure**: JSX-only + pointer-events layering rationale + z-index = §5 Modal collision check.
- **Cross-references**: §19 Toast (composes); §5 Modal (z-index sibling).
- **Present for approval**: Gate 2.

#### Step 2c: Draft §45 AlertBox (Gate 3)

- **Action**: from `alertBoxSpecs` (line 34) — consolidated spec, the ONLY one in B8 cluster. Draft section per B5+ template.
- **Content scope**:
  - Container: `inline-flex items-start gap-2 rounded-lg border p-3` — note `inline-flex` (NOT block) — disclosure for non-obvious sizing
  - 4 variants (warning/error/info/success) — same set as §19 Toast (cross-reference for consistency)
  - Each variant: `border-{variant}-border bg-{variant}-bg` with matching lucide icon at 16px (`AlertTriangle`/`CircleX`/`Info`/`CircleCheck`) and `text-{variant}` color
  - Icon styling: `mt-0.5 shrink-0 16px` — slight top offset for vertical alignment with text
  - Body: `text-caption text-content-primary`
  - ARIA: `role="alert"` (consistent with Toast/ErrorAlert/InlineError/RateLimitBanner)
- **Source citation**: `Source: AlertBox.tsx:34 (alertBoxSpecs)` — only B8 component with consolidated spec.
- **Disclosure**: `inline-flex` not block (sizing surprise); 4-variant set alignment with §19 Toast.
- **Cross-references**: §19 Toast (sister 4-variant notification — different position + dismiss model); §46 ErrorAlert (sister error-specific component — when-to-use disclosure).
- **Present for approval**: Gate 3.

#### Step 2d: Draft §46 ErrorAlert (Gate 4)

- **Action**: from JSX directly (no spec export), draft a new section. JSX-only disclosure blockquote.
- **Content scope**:
  - Container: `flex items-start gap-3 rounded-xl border border-error-border bg-error-bg p-4`
  - **Inline custom SVG** for info-circle icon (NOT lucide) — disclosure required. SVG is `viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"` with explicit `<circle>` + `<line>` elements
  - Body: `text-body text-error` (NOT `text-caption text-content-primary` like AlertBox — different typography density)
  - Optional `onDismiss` prop — when provided, renders §42 IconButton (`variant="danger" size="sm"`) with X icon — first B8→B7 cross-ref
  - Single `error` variant (no variant prop)
  - Null-render when `message` is empty — protects against blank rendering
  - ARIA: `role="alert"`
- **Source citation**: `Source: ErrorAlert.tsx (no spec export — JSX-only)` + composes §42 IconButton.
- **Disclosure**: JSX-only + inline custom SVG (rationale: predates lucide adoption? or intentional minimalism?) + when-to-use vs §45 AlertBox (`text-body` vs `text-caption`; no variant; null-render).
- **Cross-references**: §45 AlertBox (sister); §42 IconButton (composes for dismiss button).
- **Present for approval**: Gate 4.

#### Step 2e: Draft §47 InlineError (Gate 5 — promoted from Common Patterns)

- **Action**: from `inlineErrorSpecs` (line 5) — already aligned, this is the promotion. Draft new dedicated section.
- **Content scope**:
  - Container: `flex items-center gap-2`
  - Icon: `AlertTriangle` lucide 16px `shrink-0 text-error`
  - Text: `flex-1 text-caption leading-6 text-error`
  - Null-render when `message` is empty
  - ARIA: `role="alert"`
  - Used by §24 FormField for control-level error messages (not page-level — that's §46 ErrorAlert)
  - Composition contrast with §46 ErrorAlert (page-level, larger, optional dismiss) and §45 AlertBox (general-purpose, multi-variant)
- **Source citation**: `Source: InlineError.tsx:5 (inlineErrorSpecs)` + cross-ref §24 FormField (consumer).
- **Disclosure**: promotion from Common Patterns (Option A, B7 canonicalization precedent); tiny component but coherent placement in cluster.
- **Cross-references**: §24 FormField (consumer); §45 AlertBox + §46 ErrorAlert (sister error displays — composition contrast table).
- **Present for approval**: Gate 5.

#### Step 2f: Draft §48 RateLimitBanner (Gate 6 — composes B5 §32 CountdownTimer)

- **Action**: from JSX directly (no spec export), draft a new section. JSX-only disclosure blockquote.
- **Content scope**:
  - Container: `flex items-start gap-2`
  - Icon switches by `kind` prop: `Lock` (16px) for `kind="lockout"`, `AlertTriangle` (16px) otherwise — both `mt-1 shrink-0 text-error`
  - Body: `flex flex-1 flex-wrap items-center gap-x-2 gap-y-1` — wraps when narrow
  - Message: `text-caption leading-6 text-error`
  - **Composes §32 CountdownTimer** (B5 cross-ref) for visible countdown — only when `secondsLeft > 0`
  - Internal timer: `useEffect(setInterval, 1000)` decrements `secondsLeft`; calls `onExpired` callback when reaches 0; cleanup on unmount + early-exit on prop change
  - `RateLimitKind` type from `@/lib/types` (verify type definition during JSX read)
  - ARIA: `role="alert"`
- **Source citation**: `Source: RateLimitBanner.tsx (no spec export — JSX-only)` + composes §32 CountdownTimer + type `RateLimitKind` from `@/lib/types`.
- **Disclosure**: JSX-only + composes B5 §32 (4th forward cross-ref to a non-cluster section in B8) + internal timer behavior (consumer-managed `retryAfter` reset via `useEffect` on prop change).
- **Cross-references**: §32 CountdownTimer (composes — first B8→B5 cross-ref).
- **Present for approval**: Gate 6.

### Step 3: Apply edits (4-6 Edits — staged for safety)

Mixed pattern: 1 rewrite + 1 multi-section insert + 2-3 cross-ref updates.

- **Edit 1**: Rewrite §19 Toast Message in place
  - `old_string`: full current §19 content (line 983 heading through closing `---`)
  - `new_string`: rewritten content (token-based, JSX-only disclosure, framer-motion, 4 variants, ARIA, 5s default, opacity-0/hover close-reveal)
- **Edit 2**: Single big-edit insert §44-§48 before `## Common Patterns`
  - `old_string`: `## Common Patterns` (anchor — same as B5/B6/B7)
  - `new_string`: §44 ToastContainer + `---` + §45 AlertBox + `---` + §46 ErrorAlert + `---` + §47 InlineError + `---` + §48 RateLimitBanner + `---` + `## Common Patterns`
- **Edit 3**: Update §24 FormField — InlineError cross-reference (line 1236)
  - `old_string`: `Rendered via \`InlineError\` component (see Common Patterns "Input Field" section for the inline-error spec)`
  - `new_string`: `Rendered via \`InlineError\` component — see §47 InlineError for the canonical spec.`
- **Edit 4**: Update §24 FormField — InlineError styling reference (line 1238) — possibly merge with Edit 3 depending on adjacency
  - `old_string`: line 1238 InlineError styling reference (verify exact text at /develop)
  - `new_string`: condense or remove (covered by §47)
- **Edit 5**: Update Common Patterns "Input Field" — InlineError reference (line 2379)
  - `old_string`: `the error message uses \`InlineError\` (\`AlertTriangle\` 16px + \`text-caption text-error\`)`
  - `new_string`: `the error message uses \`InlineError\` — see §47 for the canonical spec.`

**Strategy**: Edit 1 + Edit 2 are independent (different doc regions). Edit 3+4 may be combined if adjacent. Edit 5 is at line 2379 — independent of others.

### Step 4: Build verification (14 grep AC checks + 4-5 bonus integrity)

```bash
cd ai-specs/ai-specs/specs

# AC1: §19 Toast token-based (no raw hex)
awk '/^### 19\. Toast/,/^---$/' ui-design-system.md | grep -ciE '#ffffff|#166534|#8a1111|#1c1c1c|#fbfbfb|#f2f2f2'
# expected: 0

# AC2: §19 documents framer-motion animation
awk '/^### 19\. Toast/,/^---$/' ui-design-system.md | grep -ciE '(framer-motion|motion\.div)'
# expected: ≥1

# AC3: §19 documents max-w-[550px] AND rounded-3xl
awk '/^### 19\. Toast/,/^---$/' ui-design-system.md | grep -c 'max-w-\[550px\]'
awk '/^### 19\. Toast/,/^---$/' ui-design-system.md | grep -c 'rounded-3xl'
# expected: ≥1 each

# AC4: §19 documents 14px icon (NOT 16)
awk '/^### 19\. Toast/,/^---$/' ui-design-system.md | grep -ciE '(14px|size=\{14\}|size=14)'
# expected: ≥1

# AC5-AC9: each new section exists
grep -cE '^### 44\. ToastContainer' ui-design-system.md     # expected: 1
grep -cE '^### 45\. AlertBox' ui-design-system.md           # expected: 1
grep -cE '^### 46\. ErrorAlert' ui-design-system.md         # expected: 1
grep -cE '^### 47\. InlineError' ui-design-system.md        # expected: 1
grep -cE '^### 48\. RateLimitBanner' ui-design-system.md    # expected: 1

# AC10: section numbering continuous §1-§48
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '^### [0-9]+' | grep -oE '[0-9]+' \
  | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=48

# AC11: each new section has **Source:** line
for n in 19 44 45 46 47 48; do
  c=$(awk "/^### $n\\. /,/^---$/" ui-design-system.md | grep -cE '^\*\*Source:\*\*')
  echo "§$n Source: $c"
done
# expected: each = 1

# AC12: cross-references valid
echo "§19 → §44: $(awk '/^### 19\. Toast/,/^---$/' ui-design-system.md | grep -c '§44')"
echo "§44 → §19: $(awk '/^### 44\. ToastContainer/,/^---$/' ui-design-system.md | grep -c '§19')"
echo "§46 → §42: $(awk '/^### 46\. ErrorAlert/,/^---$/' ui-design-system.md | grep -c '§42')"
echo "§47 → §24: $(awk '/^### 47\. InlineError/,/^---$/' ui-design-system.md | grep -c '§24')"
echo "§48 → §32: $(awk '/^### 48\. RateLimitBanner/,/^---$/' ui-design-system.md | grep -c '§32')"
# expected: each ≥1

# AC13: Common Patterns "Input Field" InlineError reference updated to §47
awk '/^### Input Field/,/^---$/' ui-design-system.md | grep -c '§47'
# expected: ≥1

# AC14 (NEW post-B6): cross-reference text-match validation for all §N <Name> in B8
for spec in "19:Toast Message" "44:ToastContainer" "45:AlertBox" "46:ErrorAlert" "47:InlineError" "48:RateLimitBanner" "42:IconButton" "32:CountdownTimer" "24:FormField" "5:Modal"; do
  n="${spec%%:*}"; name="${spec#*:}"
  count=$(grep -cE "^### $n\\. $name" ui-design-system.md || echo 0)
  echo "§$n $name: $count"
done
# expected: each = 1 (10 references touched in B8)

# Bonus 1: §19 + §44 documented as composed pair
awk '/^### 19\. Toast/,/^---$/' ui-design-system.md | grep -c 'ToastContainer'
# expected: ≥1

# Bonus 2: §46 ErrorAlert vs §45 AlertBox when-to-use disclosure
awk '/^### 46\. ErrorAlert/,/^---$/' ui-design-system.md | grep -ciE '(AlertBox|§45)'
# expected: ≥1

# Bonus 3: §47 InlineError promotion attribution
awk '/^### 47\. InlineError/,/^---$/' ui-design-system.md | grep -ciE '(promot|Common Patterns)'
# expected: ≥1

# Bonus 4: file size delta
wc -l ui-design-system.md
# expected: +~250-350 lines (rewrite + 5 inserts + cross-ref updates)
```

**Note**: All AC checks use `grep -cE` flag per the lessons-learned from B4. AC14 is the **permanent post-B6 cross-reference text-match validation** check, now standard from B7 onward.

### Step 5: Update Technical Documentation

Covered by Steps 3 + cross-ref Edits. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 8th application)
Step 1   Read 6 spec sources + verify §19 + verify cross-ref targets (~20 min)
Step 2a  Draft §19 Toast REWRITE → user approval (Gate 1)             ┐
Step 2b  Draft §44 ToastContainer → user approval (Gate 2)            │
Step 2c  Draft §45 AlertBox → user approval (Gate 3)                  ├─ ~6 review cycles
Step 2d  Draft §46 ErrorAlert → user approval (Gate 4)                │  ~2-2.5h total
Step 2e  Draft §47 InlineError → user approval (Gate 5)               │
Step 2f  Draft §48 RateLimitBanner → user approval (Gate 6)           ┘
Step 3   Apply edits (Edit 1 rewrite + Edit 2 multi-insert + Edits 3-5 cross-ref updates)
Step 4   Build verification (14 grep AC checks + 4 bonus integrity)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B7 ──
```

**Estimated effort**: ~2-2.5h /develop with 6 user-approval gates. Larger than B7 (3 gates) due to component count + JSX-only depth + 4 sections requiring full JSX read (no spec to drive draft).

## 6. Testing Checklist

- [ ] §19 Toast rewritten with token-based content (AC1 passes — 0 raw hex)
- [ ] §19 documents framer-motion animation (AC2 passes)
- [ ] §19 documents max-w-[550px] + rounded-3xl (AC3 passes)
- [ ] §19 documents 14px icon (AC4 passes)
- [ ] §44 ToastContainer added (AC5 passes)
- [ ] §45 AlertBox added (AC6 passes)
- [ ] §46 ErrorAlert added (AC7 passes)
- [ ] §47 InlineError added (AC8 passes)
- [ ] §48 RateLimitBanner added (AC9 passes)
- [ ] Numbering continuous §1-§48 (AC10 passes — max=48)
- [ ] All 6 sections cite spec/JSX source (AC11 passes — 6/6 = 1)
- [ ] Cross-references valid (AC12 passes — 5 mutual cross-refs)
- [ ] Common Patterns "Input Field" InlineError reference updated to §47 (AC13 passes)
- [ ] Cross-reference text-match validation (AC14 passes — all 10 §N <Name> verified)
- [ ] §19 + §44 documented as composed pair (Bonus 1)
- [ ] §46 ErrorAlert vs §45 AlertBox when-to-use disclosed (Bonus 2)
- [ ] §47 InlineError promotion attribution explicit (Bonus 3)
- [ ] File size delta consistent with rewrite + adds + cross-ref updates (Bonus 4)
- [ ] §24 FormField cross-references updated to point to §47
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit. If JSX read reveals additional behaviors not anticipated (e.g., new opacity tokens, framer-motion configurations, ARIA patterns), document with the standard honest-disclosure pattern (B5/B6/B7 precedent).

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to 6 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for 6 approval gates (slightly larger than B7's 3 — single session feasible if focused; 2 sessions split if needed: gates 1-3 + gates 4-6)

## 10. Notes

- **6 user-approval gates** — second-largest count after B6 (9 gates).
- **NEW JSX-only record**: 4 of 6 components have NO spec export (Toast, ToastContainer, ErrorAlert, RateLimitBanner). B5 had 2, B7 had 0. Largest JSX-only proportion in any cluster.
- **Cross-cluster cross-references**: B8 introduces 4 forward cross-references to prior B-cluster sections — §46 → §42 IconButton (B7), §48 → §32 CountdownTimer (B5). First time multi-cluster compositions are heavily documented.
- **Toast rewrite is the largest single section in B8** — drops raw hex, adds framer-motion, ARIA, 4 variants table, opacity pattern reference, 5s default duration, close-button hover-reveal.
- **Toast extends opacity pattern to 9th occurrence across 3 clusters** (B6 + B7 + B8). Inline cross-reference to existing Pattern note (do NOT modify the Pattern note table to preserve cluster-scope semantics — same B7 decision).
- **First framer-motion documentation in Part B** — reusable note for future ticker-style components.
- **InlineError promotion (Option A)** — coherence with cluster (5 add + 1 promote = 6 sections). Same canonicalization precedent as B4 Ambiguity 1 + B7 Common Patterns Button cleanup. Cross-references in §24 FormField + Common Patterns "Input Field" updated.
- **AC grep checks use `-cE` flag** — lesson from B4.
- **NEW permanent post-B6 cross-reference text-match validation** — AC14. Verifies every `§N <Name>` reference (B8 introduces 10 cross-references — highest count yet).
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-341's edits, the next sub-ticket of SCRUM-329 Part B is **B9 — Misc + selectors** (audit-B8b): DataTable (add), StickyCard (add), Calendar (drift), LanguageSelector (drift in Common Patterns "Selector Trigger"), EmailSelector (drift in Common Patterns "Selector Trigger"). 5 components — TurnstileWidget already done (B5), ImageCropper + BeforeAfterSlider + ThemeToggle could fit here OR be grouped differently. Plan to revisit cluster composition during /enrich-us. B9 will be opened only after this `/update-docs` lands.

Remaining Part B clusters after B8:
- **B9 (audit-B8b)**: Misc + selectors — 5+ components
- **B10 (audit-B9)**: Cleanup — must run last (deletes orphaning cross-references; remove §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification + §2 Icon Set — all Doc-only with no code; reconcile §1 Card with globals.css; fix registry "Sidebar.tsx" → "SidebarNav.tsx"; **also fix Toast §19 heading "(Quick Notification)" suffix** since §11 will be deleted in B10)

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §19 Toast rewritten + §44-§48 new + 2-3 cross-ref updates
- [ ] **Testing**: Step 4's 14 grep AC checks all pass + 4 bonus integrity
- [ ] **Integration**: section numbering continuous §1-§48; cross-references valid (§19↔§44, §46→§42, §47→§24, §48→§32)
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-341`.**
