# Frontend Implementation Plan: SCRUM-338 Reconcile ui-design-system.md — Auth-specific atoms

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B5 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Sibling of SCRUM-334 (B1), SCRUM-335 (B2), SCRUM-336 (B3), SCRUM-337 (B4) — all completed. 5th application of carry-forward Accepted-Trivial pattern. Structurally **the simplest Part B sub-ticket**: 5 pure additions, no rewrites, no deletes, no renumbers. Single big-edit insert at the end of Components list.

## 1. Codebase State Verification (2026-05-02)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2+B3+B4)
  - Doc (`ai-specs`): `b5f89dd` (post-/update-docs of SCRUM-337)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/components/ui/CopyField.tsx` (line 7 → `copyFieldSpecs`)
  - `nexacore-dashboard/src/components/ui/QrCodeCard.tsx` (line 6 → `qrCodeCardSpecs`)
  - `nexacore-dashboard/src/components/ui/RecoveryCodesGrid.tsx` (line 7 → `recoveryCodesGridSpecs`)
  - `nexacore-dashboard/src/components/ui/TurnstileWidget.tsx` (NO spec export — JSX read mandatory; ~56 lines)
  - `nexacore-dashboard/src/components/ui/CountdownTimer.tsx` (NO spec export — JSX read mandatory; ~93 lines)
  - `ai-specs/specs/ui-design-system.md` — anchor at line 1405 (`## Common Patterns` heading)
- **File to be written**: `ai-specs/specs/ui-design-system.md` (single insert before `## Common Patterns`)

## 2. Overview

This ticket adds 5 Auth-specific atoms — small primitives used primarily in auth/MFA flows. All 5 are Missing-from-doc per the audit. After this ticket:

- **§28 CopyField**: NEW (simplest — read-only text + copy button toggle, 2 sizes, used widely)
- **§29 QrCodeCard**: NEW (QR image + CopyField composition, single use case: MFA enrollment)
- **§30 RecoveryCodesGrid**: NEW (2-col monospace grid + copy-all Button, single use case: MFA setup)
- **§31 TurnstileWidget**: NEW (Cloudflare wrapper, theme-aware, **NO spec export** — JSX-sourced)
- **§32 CountdownTimer**: NEW (animated digit boxes via CSS keyframe, **NO spec export** — JSX-sourced; fulfills cross-reference from §26 IdleWarningModal)

Final section count: **§1–§32** (current §1-§27 + 5 new = +5).

Per the design-system source-of-truth rule, /develop pauses for sign-off at each component — 5 gates total.

## 3. Architecture Context

```
ui-design-system.md (post-/update-docs of SCRUM-337)
├─ §1-§27 (untouched)
├─ §27 CommandPalette (last existing numbered section, line 1313)
└─ ## Common Patterns (line 1405)         ← INSERT 5 new sections BEFORE this anchor
```

After B5:
```
ui-design-system.md (post-B5)
├─ §1-§27 (untouched)
├─ §28 CopyField (NEW)
├─ §29 QrCodeCard (NEW — composes §28)
├─ §30 RecoveryCodesGrid (NEW)
├─ §31 TurnstileWidget (NEW — JSX-sourced)
├─ §32 CountdownTimer (NEW — JSX-sourced, fulfills §26 forward-reference)
└─ ## Common Patterns
```

**Branching exception**: 5th application of carry-forward Accepted-Trivial. No `feature/SCRUM-338-frontend` branch in `em-ecosystem-code`. Convention silenced.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed.

### Step 1: Discovery — read 3 spec exports + 2 JSX-only components

- **Files**: read-only — 5 .tsx files
- **Action**: extract spec values + JSX details into working notes.
- **Implementation steps**:
  1. Open `CopyField.tsx`, locate `copyFieldSpecs` (line 7), copy values + scan JSX for copy mechanism details
  2. Open `QrCodeCard.tsx`, locate `qrCodeCardSpecs` (line 6), copy values + scan JSX for QR generation details
  3. Open `RecoveryCodesGrid.tsx`, locate `recoveryCodesGridSpecs` (line 7), copy values
  4. Open `TurnstileWidget.tsx`, **read entire file (~56 lines)** — no spec export
  5. Open `CountdownTimer.tsx`, **read entire file (~93 lines)** — no spec export, complex animation pattern (React key-remount + CSS keyframe)

### Step 2: Per-component drafting + user approval (5 sub-steps)

Order matters per /enrich-us recommendation: complexity ascending + dependency order + JSX-only at the end.

#### Step 2a: Draft §28 CopyField (Gate 1 — simplest, dependency for §29)

- **Action**: from `copyFieldSpecs`, draft a new section.
- **Content scope**: 2 sizes (sm/md), copy mechanism (`navigator.clipboard.writeText`), Copy/Check icon toggle (1.5s revert), use cases (MFA secret, API token, generic copy).
- **Cross-reference**: forward to §29 QrCodeCard which composes CopyField for the secret display.
- **Present for approval**: Gate 1.

#### Step 2b: Draft §29 QrCodeCard (Gate 2 — composes §28)

- **Action**: from `qrCodeCardSpecs`, draft a new section.
- **Content scope**: container (white bg always — NOT theme-aware so QR remains scannable), QR image (192×192 generated via `qrcode` library), CopyField below for the secret, MFA enrollment use case.
- **Cross-reference**: composes §28 CopyField.
- **Present for approval**: Gate 2.

#### Step 2c: Draft §30 RecoveryCodesGrid (Gate 3 — independent simple grid)

- **Action**: from `recoveryCodesGridSpecs`, draft a new section.
- **Content scope**: container, 2-col grid (`grid grid-cols-2 gap-2`), monospace codes (`font-mono text-body text-content-primary`), copy-all Button (Button outline sm fullWidth with Copy/Check icon swap), MFA setup use case.
- **Present for approval**: Gate 3.

#### Step 2d: Draft §31 TurnstileWidget (Gate 4 — JSX-only)

- **Action**: from `TurnstileWidget.tsx` JSX directly (no spec export). Disclose pattern (same as B4 §26 IdleWarningModal):
  > **Note:** This component does NOT export a spec object. Section content is sourced directly from the JSX (`TurnstileWidget.tsx`). Future code-side cleanup could add `turnstileWidgetSpecs` to align with the rest of the catalog.
- **Content scope**:
  - Wrapper around `@marsidev/react-turnstile` Turnstile component
  - SITE_KEY: `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` with fallback `1x00000000000000000000AA` (Cloudflare's always-pass test key for dev)
  - Theme-aware: passes `theme` prop from `useTheme` hook
  - Layout: `size: "flexible"`, `action: "auth"` (for Cloudflare analytics tagging)
  - Callbacks: `onToken` (success), `onExpire` (auto-reset), `onError` (auto-reset)
  - Reset mechanism: `resetKey` prop forces remount; bonus `useTurnstileReset(ref)` hook exported
  - Wrapping `<div className="mb-4">` — 16px bottom margin (designed for auth forms)
  - Use cases: auth pages (login, register, forgot-password)
- **Present for approval**: Gate 4.

#### Step 2e: Draft §32 CountdownTimer (Gate 5 — JSX-only, fulfills §26 forward-reference)

- **Action**: from `CountdownTimer.tsx` JSX directly (no spec export). Disclose pattern. Note that this fulfills the cross-reference made in §26 IdleWarningModal (B4).
- **Content scope**:
  - Animated digit boxes: each digit in a small box with `tabular-nums` font; React key-remount on value change triggers `countdown-slide` CSS keyframe (declared in globals.css)
  - Display format: MM:SS when `seconds >= 60`, just SS otherwise
  - 2 variants: `error` (default — bg-error-bg + text-error), `warning` (bg-warning-bg + text-warning)
  - 2 sizes: `sm` (default — w-[1.25em] h-[1.5em], text-11px, rounded-[3px], gap-px) and `lg` (w-8 h-10, text-2xl, rounded-lg, gap-1)
  - Use cases: MFA throttle (lockout countdown), idle session warning (used in §26 IdleWarningModal with variant=warning + size=lg)
  - Token references: `--color-error-bg`, `--color-error`, `--color-warning-bg`, `--color-warning`
- **Present for approval**: Gate 5.

### Step 3: Apply single big-edit insert

- **File**: `ai-specs/specs/ui-design-system.md`
- **Action**: ONE Edit operation. Anchor: `### 27. CommandPalette content + closing ---` followed by `## Common Patterns`. Replace with same content + 5 new sections + `## Common Patterns`.
- **Rationale**: simpler than 5 separate inserts. The anchor (`---\n\n## Common Patterns`) is unique in the doc.
- **Implementation steps**:
  1. Construct the combined new_string: §28 CopyField + `---` + §29 QrCodeCard + `---` + §30 RecoveryCodesGrid + `---` + §31 TurnstileWidget + `---` + §32 CountdownTimer + `---` + (the original `## Common Patterns` heading)
  2. Apply the Edit
  3. Verify each section landed correctly

### Step 4: Build verification (7 grep AC checks)

```bash
cd ai-specs/ai-specs/specs

# AC1-AC5: each new section exists (5 checks)
grep -cE '^### [0-9]+\. CopyField' ui-design-system.md          # expected: 1
grep -cE '^### [0-9]+\. QrCodeCard' ui-design-system.md         # expected: 1
grep -cE '^### [0-9]+\. RecoveryCodesGrid' ui-design-system.md  # expected: 1
grep -cE '^### [0-9]+\. TurnstileWidget' ui-design-system.md    # expected: 1
grep -cE '^### [0-9]+\. CountdownTimer' ui-design-system.md     # expected: 1

# AC6: §31 + §32 each have "no spec export" disclosure
awk '/TurnstileWidget/,/^---$/' ui-design-system.md | grep -ciE '(no spec|not export)'   # expected: ≥1
awk '/CountdownTimer/,/^---$/' ui-design-system.md | grep -ciE '(no spec|not export)'   # expected: ≥1

# AC7: section numbering continuous §1-§32
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '[0-9]+' | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=32
```

**Note**: All AC checks use `grep -cE` flag per the lessons-learned from B4 (the bash `+` requires extended regex).

### Step 5: Update Technical Documentation

Covered by Step 3. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 5th application)
Step 1   Read 3 spec exports + 2 JSX-only components (~15 min)
Step 2a  Draft §28 CopyField → user approval (Gate 1)             ┐
Step 2b  Draft §29 QrCodeCard → user approval (Gate 2)            │
Step 2c  Draft §30 RecoveryCodesGrid → user approval (Gate 3)     ├─ ~5 review cycles
Step 2d  Draft §31 TurnstileWidget → user approval (Gate 4)       │  ~1.5h total
Step 2e  Draft §32 CountdownTimer → user approval (Gate 5)        ┘
Step 3   Apply single big-edit insert (5 sections + closing dividers)
Step 4   Build verification (7 grep AC checks)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B4 ──
```

**Estimated effort**: ~1.5-2h /develop with 5 user-approval gates. Simpler structure than B4 (no renumber, no deletes), but 2 JSX-only sections require deeper JSX read. Could split into 2 sessions (gates 1-3 in session 1, gates 4-5 + apply in session 2) if user busy.

## 6. Testing Checklist

- [ ] §28 CopyField added (AC1 passes)
- [ ] §29 QrCodeCard added (AC2 passes)
- [ ] §30 RecoveryCodesGrid added (AC3 passes)
- [ ] §31 TurnstileWidget added with no-spec disclosure (AC4 + AC6 pass)
- [ ] §32 CountdownTimer added with no-spec disclosure + fulfills §26 cross-reference (AC5 + AC6 + AC7 pass)
- [ ] Numbering continuous §1-§32 (AC7 passes — max=32)
- [ ] Spot-check 2-3 spec values per section against spec exports
- [ ] §29 QrCodeCard cross-references §28 CopyField (verify §28 exists)
- [ ] §32 CountdownTimer cross-references §26 IdleWarningModal (verify §26 exists)
- [ ] §26 IdleWarningModal's existing forward-reference to CountdownTimer is now valid (verify the ref points to the new §32)
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit. If JSX-only components reveal additional behaviors not anticipated, document with the standard JSX-sourced disclosure pattern.

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to 5 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for ~5 approval gates

## 10. Notes

- **5 user-approval gates** — same count as B4 but simpler scope per gate.
- **2 JSX-only components** — TurnstileWidget + CountdownTimer. Same disclosure pattern as B4 §26 IdleWarningModal.
- **Single big-edit insert** — saves ~4 individual edits vs inserting 5 sections separately.
- **CountdownTimer fulfills §26 IdleWarningModal forward-reference** from B4. AC verification ensures the cross-ref is now valid.
- **AC grep checks use `-cE` flag** — lesson from B4 (bash `+` requires extended regex).
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-338's edits, the next sub-ticket of SCRUM-329 Part B is **B6 — Display primitives**: Avatar, Badge, IconButton, Spinner, InfinitySpinner, RingSpinner, Divider, Accordion, EmptyState, IconBadge (10 components). Largest cluster in Part B by component count. May need to split into B6a/B6b during /enrich-us. B6 will be opened only after this `/update-docs` lands.

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with 5 new sections at end
- [ ] **Testing**: Step 4's 7 grep AC checks all pass
- [ ] **Integration**: section numbering continuous §1-§32; cross-references valid (§28 ↔ §29, §32 ↔ §26)
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-338`.**
