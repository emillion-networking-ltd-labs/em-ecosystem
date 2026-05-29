# Frontend Implementation Plan: SCRUM-340 Reconcile ui-design-system.md — Buttons + interactive

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B7 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Sibling of SCRUM-334 (B1), SCRUM-335 (B2), SCRUM-336 (B3), SCRUM-337 (B4), SCRUM-338 (B5), SCRUM-339 (B6) — all completed. **7th application** of carry-forward Accepted-Trivial pattern. **First sub-ticket since B4 with rewrite work** (Button §15 in place). User confirmed **Option A** for the Common Patterns Button sub-sections: DELETE both as part of §15 canonicalization. 3 user-approval gates. Section count grows §1-§41 → §1-§43 (+2). Doc shrinks slightly from the 2 Common Patterns deletes (-32 lines) but grows from §15 rewrite (+~80 lines) and 2 new sections (+~140 lines).

## 1. Codebase State Verification (2026-05-03)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B6)
  - Doc (`ai-specs`): `eb09097` (post-pre-B7 cross-reference fix — §18 → §15 Button Set in §41 EmptyState)
- **Common Patterns anchor**: line 2141 of `ui-design-system.md`
- **§15 Button Set heading**: line 745 (in-place rewrite target)
- **Common Patterns Button sub-sections to delete** (Option A confirmed):
  - "### Button (Primary)" — line 2182
  - "### Button (Secondary / Outline)" — line 2193
  - SCRUM-275 note about border-strong — line 2213 (redundant with broader rule at line 2180)
  - Total to delete: lines 2182-2213 (~32 lines, contiguous)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/components/ui/Button.tsx` (94 lines, 4 split exports — `baseClass` line 37, `variantClasses` line 23, `sizeClasses` line 40, `linkSizeClasses` line 46)
  - `nexacore-dashboard/src/components/ui/IconButton.tsx` (93 lines, 4 split exports — `baseClass` line 8, `variantClasses` line 11, `sizeClasses` line 23, `usage` line 28)
  - `nexacore-dashboard/src/components/ui/SegmentedControl.tsx` (90 lines, consolidated `segmentedControlSpecs` line 22 + extra `sizeClasses` line 16)
  - `ai-specs/specs/ui-design-system.md` — anchor at line 2141 (`## Common Patterns` heading) + lines 745-770 (current §15) + lines 2182-2213 (to delete)
- **File to be written**: `ai-specs/specs/ui-design-system.md` (3 Edits: rewrite §15 + delete Common Patterns Button sub-sections + insert §42/§43)

## 2. Overview

This ticket reconciles 3 components from the Buttons + interactive cluster — the smallest cluster by component count but the most complex per-component (Button is the most-used primitive in the dashboard). User-confirmed **Option A** for the Common Patterns Button sub-sections: DELETE both as part of canonicalization, making §15 the single source of truth.

After this ticket:
- **§15 Button Set**: REWRITTEN (token-based, 6 variants, 3 sizes, loading + fullWidth + as-prop documented; the 4 split exports cited)
- **§42 IconButton**: NEW (4 split exports, 4 variants in TS type + 1 orphan in runtime, 2 sizes, tooltip composition)
- **§43 SegmentedControl**: NEW (consolidated spec + extra `sizeClasses` export, 3 variants, 3 sizes, generic typed)
- **Common Patterns Button (Primary)**: DELETED (canonicalized into §15)
- **Common Patterns Button (Secondary / Outline)**: DELETED (canonicalized into §15)

Final section count: **§1–§43** (current §1-§41 + 2 new = +2). Common Patterns area shrinks by ~32 lines.

Per the design-system source-of-truth rule, /develop pauses for sign-off at each component — 3 gates total.

## 3. Architecture Context

```
ui-design-system.md (post-eb09097 cross-ref fix)
├─ §1-§14 (untouched)
├─ §15 Button Set                                     ← REWRITE in place (preserve heading + position)
├─ §16-§41 (untouched)
├─ #### Display primitives opacity pattern (B6)       ← (untouched)
└─ ## Common Patterns (line 2141)                     ← INSERT 2 new sections BEFORE this anchor
   ├─ ...                                             ← (untouched)
   ├─ ### Button (Primary)                            ← DELETE (Option A canonicalization)
   ├─ ### Button (Secondary / Outline) + SCRUM-275 note ← DELETE (Option A canonicalization)
   └─ ### Input Field (untouched, line 2215)
```

After B7:
```
ui-design-system.md (post-B7)
├─ §1-§14 (untouched)
├─ §15 Button Set (REWRITTEN — canonical token-based)
├─ §16-§41 (untouched)
├─ #### Display primitives opacity pattern (B6, untouched)
├─ §42 IconButton (NEW)
├─ §43 SegmentedControl (NEW)
└─ ## Common Patterns
   ├─ ...
   ├─ (Button sub-sections DELETED)
   └─ ### Input Field (untouched)
```

**Branching exception**: 7th application of carry-forward Accepted-Trivial. No `feature/SCRUM-340-frontend` branch in `em-ecosystem-code`. Convention silenced.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed (7th application).

### Step 1: Discovery — read 3 spec exports + verify §15 + verify deletes

- **Files**: read-only — 3 .tsx files (~277 lines total) + 4 doc regions
- **Action**: extract spec values (variants, sizes, base classes, polymorphic + loading mechanisms) into working notes.
- **Implementation steps**:
  1. Read `Button.tsx` — capture 4 split exports + verify polymorphic `as` prop mechanism + `fullWidth` default + InfinitySpinner integration (`opacity-30` children + absolute-positioned spinner)
  2. Read `IconButton.tsx` — capture 4 split exports + verify Tooltip composition (conditional render based on `tooltip` prop) + `inside input` orphan variant in runtime but NOT in TS type
  3. Read `SegmentedControl.tsx` — capture `segmentedControlSpecs` (line 22) + extra `sizeClasses` export (line 16, contains active-state classes inferred from `activeClasses` const) + generic typing (`<T extends string>`)
  4. Re-read `ui-design-system.md` lines 745-770 (current §15 to be replaced) and lines 2178-2215 (Common Patterns Button sub-sections + their boundaries)
- **Watch for surprises** (will become deviations if found):
  - Additional split exports beyond what's cataloged
  - `activeClasses` is internal (not exported) but `sizeClasses` IS exported — minor split-export quirk
  - SegmentedControl `sizeClasses` is duplicated content vs `segmentedControlSpecs.sizes` — unify in doc

### Step 2: Per-component drafting + user approval (3 sub-steps)

Order: Button first (canonical anchor for the cluster), then IconButton (smaller composition), then SegmentedControl (most independent).

#### Step 2a: Draft §15 Button Set REWRITE (Gate 1 — most complex)

- **Action**: from 4 split exports + JSX, draft a complete REWRITE of §15. Preserve the `### 15. Button Set` heading exactly; replace ALL content between heading and the `---` closing divider.
- **Content scope** (token-based — drops all raw hex):
  - 6 variants: `primary`, `secondary`, `outline`, `danger`, `link`, `link-underline` — each with full token bullet (bg, text, border, transition, hover, disabled)
  - 3 sizes: sm/md/lg — split into `sizeClasses` (filled/outline/danger) and `linkSizeClasses` (link/link-underline) since link variants drop padding/border
  - Props table: variant, size, loading, fullWidth, as, href, all native button props
  - Loading mechanism: InfinitySpinner sized to match (sm→sm, md+lg→md), children get `opacity-30`, spinner positioned absolute centered (cross-reference §37)
  - `fullWidth: true` default (non-obvious — call out)
  - `as` prop polymorphic: uses `React.createElement` to render as different element (consumer might pass `Link` for Next.js routing) — document with usage example
  - Use cases salvaged from deleted Common Patterns: OAuth buttons (Google, GitHub), Select Email Button, "Create account"
  - **Note**: Auth page border rule (border-strong vs border-default) is referenced via the broader rule at line 2180 — no need to duplicate inside §15
- **Source citation** (handles 4 split exports): `Source: Button.tsx:23 (variantClasses), :37 (baseClass), :40 (sizeClasses), :46 (linkSizeClasses)`
- **Disclosure**: 4-export split is the most yet — Source line cites all 4. Anticipated Accepted-Trivial.
- **Token references**: full bullet list per variant.
- **Cross-references**: §37 InfinitySpinner (loading), §43 SegmentedControl (sister interactive primitive)
- **Present for approval**: Gate 1.

#### Step 2b: Draft §42 IconButton (Gate 2)

- **Action**: from 4 split exports + JSX, draft a new section.
- **Content scope**:
  - 4 variants in TS type union (`default`, `danger`, `boxed`, `boxed-hover`) PLUS 1 orphan variant in runtime (`inside input`) — explicit honest disclosure for the orphan
  - 2 sizes: sm `p-2` / md `p-3`
  - Tooltip composition: when `tooltip` prop set, wraps the button in a Tooltip; uses `aria-label` as fallback text if tooltip is `true` (boolean) instead of a string
  - `usage` export (line 28) — documents 5 known use cases (theme toggle, copy secret, password eye, calendar nav, calendar day) — surface this as a sub-table
  - `forwardRef` support for parent imperative handles
  - Loading: simple inline circular spinner (NOT InfinitySpinner — uses local `border-current` SVG)
- **Source citation**: `Source: IconButton.tsx:8 (baseClass), :11 (variantClasses), :23 (sizeClasses), :28 (usage)`
- **Disclosure**: 4-export split + `inside input` orphan variant + simple-loading-spinner-not-InfinitySpinner divergence from §15 Button.
- **Token references**: per variant.
- **Cross-references**: §10 Tooltip (composition), §15 Button (sister button primitive — different use case)
- **Present for approval**: Gate 2.

#### Step 2c: Draft §43 SegmentedControl (Gate 3)

- **Action**: from `segmentedControlSpecs` + extra `sizeClasses` export, draft a new section.
- **Content scope**:
  - 3 variants: primary (default), secondary, outline — all share the `shadow-sm` ring
  - 3 sizes: sm (default — only component in cluster where sm is default), md, lg
  - Container: `inline-flex rounded-lg bg-surface-subtle p-1` (semantic tokens)
  - Active state: filled per variant; inactive: `border border-transparent text-content-primary/50 hover:text-content-primary` (note opacity pattern reference)
  - Generic typing: `<T extends string>` — option `value` is type-safe per usage
  - Optional `icon` per option — renders before label with `gap-1.5`
  - Comparison with §6 Tabs: SegmentedControl is bordered-group with shadow-sm active; Tabs is content-switcher with bottom-border style — different use cases
- **Source citation**: `Source: SegmentedControl.tsx:22 (segmentedControlSpecs), :16 (sizeClasses)` — note: `sizeClasses` is exported separately even though `segmentedControlSpecs.sizes` duplicates the info
- **Disclosure**: split-export quirk (consolidated `Specs` + extra `sizeClasses`); inactive uses `text-content-primary/50` opacity pattern (extends B6 disclosure cluster — could expand the Pattern note? OR keep as inline reference)
- **Token references**: per variant + opacity reference
- **Cross-references**: §6 Tabs (sister tab-like primitive — distinguishing note); B6 opacity pattern (reference, do NOT update the Pattern note table since this is a different cluster — instead inline-ref it)
- **Present for approval**: Gate 3.

### Step 3: Apply edits (3 Edits — staged for safety)

The edits are independent so can apply in any order, but recommended sequence: rewrite first (largest content delta), then deletes (cleanup), then adds (extend).

- **Edit 1**: Rewrite §15 Button Set in place
  - `old_string`: full current §15 content (line 745 heading through closing `---` at line 770)
  - `new_string`: rewritten content (token-based, 6 variants, 3 sizes, props, loading, `as` prop)
- **Edit 2**: Delete Common Patterns Button sub-sections (combined delete)
  - `old_string`: from `### Button (Primary)` (line 2182) through the SCRUM-275 note's blank line (line 2214)
  - `new_string`: empty (just preserves the surrounding context)
  - Anchor surrounding lines: line 2180 "Border rule" (preserved) + line 2215 "### Input Field" (preserved)
- **Edit 3**: Insert §42 + §43 before `## Common Patterns`
  - `old_string`: `## Common Patterns` (unique heading, same anchor as B6)
  - `new_string`: `### 42. IconButton` + content + `---` + `### 43. SegmentedControl` + content + `---` + `## Common Patterns`

### Step 4: Build verification (12 grep AC checks + 5 bonus integrity)

```bash
cd ai-specs/ai-specs/specs

# AC1: §15 Button Set contains all 6 variants
for v in primary secondary outline danger link link-underline; do
  c=$(awk '/^### 15\. Button Set/,/^---$/' ui-design-system.md | grep -c "$v")
  echo "§15 variant $v: $c"
done
# expected: each ≥1

# AC2: §15 Button Set token-based (no raw hex inside)
awk '/^### 15\. Button Set/,/^---$/' ui-design-system.md | grep -ciE '#1c1c1c|#ffffff|#fbfbfb|#f2f2f2'
# expected: 0

# AC3: §15 documents linkSizeClasses distinction
awk '/^### 15\. Button Set/,/^---$/' ui-design-system.md | grep -c 'linkSizeClasses'
# expected: ≥1

# AC4: §15 documents loading mechanism (InfinitySpinner)
awk '/^### 15\. Button Set/,/^---$/' ui-design-system.md | grep -ciE '(InfinitySpinner|§37)'
# expected: ≥1

# AC5: §42 IconButton section exists
grep -cE '^### 42\. IconButton' ui-design-system.md
# expected: 1

# AC6: §43 SegmentedControl section exists
grep -cE '^### 43\. SegmentedControl' ui-design-system.md
# expected: 1

# AC7: Section numbering continuous §1-§43
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '^### [0-9]+' | grep -oE '[0-9]+' \
  | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=43

# AC8: All 3 sections (15 rewrite + 42 + 43) have **Source:** line
for n in 15 42 43; do
  c=$(awk "/^### $n\. /,/^---$/" ui-design-system.md | grep -cE '^\*\*Source:\*\*')
  echo "§$n Source: $c"
done
# expected: each = 1

# AC9: Cross-reference §15 ↔ §37 InfinitySpinner valid (mutual mentions)
echo "§15 → §37 mentions: $(awk '/^### 15\. Button Set/,/^---$/' ui-design-system.md | grep -c '§37')"
echo "§37 → §15 mentions: $(awk '/^### 37\. InfinitySpinner/,/^---$/' ui-design-system.md | grep -c '§15')"
# expected: §15→§37 ≥1; §37→§15 either ≥1 OR documented as one-way (Spinner doc predates §15 rewrite — OK if zero)

# AC10: Common Patterns Button (Primary) sub-section removed (Option A)
grep -cE '^### Button \(Primary\)' ui-design-system.md
# expected: 0

# AC11: Common Patterns Button (Secondary / Outline) sub-section removed (Option A)
grep -cE '^### Button \(Secondary' ui-design-system.md
# expected: 0

# AC12: §42 IconButton documents `inside input` orphan variant
awk '/^### 42\. IconButton/,/^---$/' ui-design-system.md | grep -c 'inside input'
# expected: ≥1

# Bonus 1: §15 covers use cases salvaged from deletes (OAuth, Select Email)
awk '/^### 15\. Button Set/,/^---$/' ui-design-system.md | grep -ciE '(OAuth|Google|GitHub|Select Email)'
# expected: ≥1 (any of the salvaged use cases mentioned)

# Bonus 2 (NEW post-B6 lesson — cross-reference text-match validation)
# For every §N <Name> reference introduced/touched in this PR, verify §N actually IS <Name>
echo "§15 Button Set heading exists at line: $(grep -n '^### 15\. Button Set' ui-design-system.md)"
echo "§37 InfinitySpinner heading exists at line: $(grep -n '^### 37\. InfinitySpinner' ui-design-system.md)"
echo "§10 Tooltip heading exists at line: $(grep -n '^### 10\. Tooltip' ui-design-system.md)"
echo "§6 Tabs heading exists at line: $(grep -n '^### 6\. Tabs' ui-design-system.md)"
# expected: each returns 1 line — confirms cross-references in B7 sections point to the right targets

# Bonus 3: SegmentedControl opacity reference uses correct pattern
awk '/^### 43\. SegmentedControl/,/^---$/' ui-design-system.md | grep -c 'text-content-primary/50'
# expected: ≥1 (inactive state styling)

# Bonus 4: Common Patterns area shrinks (file size delta check)
wc -l ui-design-system.md
# expected: lower-than-pre-B7 by ~32 lines (Common Patterns deletes) but +~220 (rewrite + 2 inserts) = net +~190 lines
```

**Note**: All AC checks use `grep -cE` flag per the lessons-learned from B4. **NEW bonus check**: cross-reference text-match validation (catches the broken-cross-reference class of bug from B6 regression).

### Step 5: Update Technical Documentation

Covered by Step 3. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 7th application)
Step 1   Read 3 spec exports + verify §15 + verify deletes (~15 min)
Step 2a  Draft §15 Button Set REWRITE → user approval (Gate 1)         ┐
Step 2b  Draft §42 IconButton → user approval (Gate 2)                 ├─ ~3 review cycles
Step 2c  Draft §43 SegmentedControl → user approval (Gate 3)           ┘  ~1.5h total
Step 3   Apply edits (3 separate Edits: rewrite + delete + insert)
Step 4   Build verification (12 grep AC checks + 4 bonus integrity)
Step 5   (covered by Step 3)
         ── /develop ends ──

── /verify + /update-docs phases — same lifecycle as B1-B6 ──
```

**Estimated effort**: ~1.5-2h /develop with 3 user-approval gates. Smaller cluster than B6 (3 vs 9 components) but each gate's content is more substantial — Button §15 rewrite is the largest single section in the cluster.

## 6. Testing Checklist

- [ ] §15 Button Set rewritten with 6 variants (AC1 passes — each variant name found ≥1)
- [ ] §15 Button Set token-based (AC2 passes — 0 raw hex)
- [ ] §15 documents `linkSizeClasses` distinction (AC3 passes)
- [ ] §15 documents InfinitySpinner loading mechanism (AC4 passes)
- [ ] §42 IconButton added (AC5 passes)
- [ ] §43 SegmentedControl added (AC6 passes)
- [ ] Numbering continuous §1-§43 (AC7 passes — max=43)
- [ ] All 3 sections cite spec export source (AC8 passes — 3/3 = 1)
- [ ] §15 ↔ §37 cross-references valid (AC9 passes for §15→§37)
- [ ] Common Patterns Button (Primary) deleted (AC10 passes — 0 matches)
- [ ] Common Patterns Button (Secondary / Outline) deleted (AC11 passes — 0 matches)
- [ ] §42 IconButton discloses `inside input` orphan variant (AC12 passes)
- [ ] §15 covers OAuth + Select Email use cases (Bonus 1 passes)
- [ ] Cross-reference text-match validation: §15, §37, §10, §6 headings exist at expected lines (Bonus 2 passes — NEW post-B6 check)
- [ ] §43 SegmentedControl uses correct opacity pattern reference (Bonus 3 passes)
- [ ] File size delta consistent with rewrite + adds + deletes (Bonus 4 passes)
- [ ] Spot-check 2-3 spec values per section against spec exports
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit. If JSX read reveals additional behaviors not anticipated, document with the standard honest-disclosure pattern (B5/B6 precedent).

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to 3 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for 3 approval gates (smaller than B6's 9 — single session feasible)

## 10. Notes

- **3 user-approval gates** — smallest count since B3 (4 gates).
- **First sub-ticket since B4 with rewrite work** — §15 in-place rewrite preserves heading + position (no renumber needed).
- **First sub-ticket with deletes since B4** — Option A confirmed by user; 2 contiguous Common Patterns Button sub-sections + redundant SCRUM-275 note removed.
- **Most-split-export component yet** — Button has 4 split exports (`baseClass` + `variantClasses` + `sizeClasses` + `linkSizeClasses`). Source citation lists all 4.
- **`inside input` orphan variant in IconButton** — declared in `variantClasses` runtime object but NOT in `IconButtonVariant` TS union type. Honest disclosure (similar pattern to B5 §29 QrCodeCard `onGenerate` dead prop).
- **`fullWidth: true` default in Button** — non-obvious. Most button libraries default to inline. Explicit documentation prevents bug reports ("why is my button stretching to full width?").
- **`as` prop polymorphic in Button** — uses `React.createElement` to render as different element. Document with usage example (e.g., `<Button as={Link} href="/dashboard">Go</Button>`).
- **SegmentedControl extends B6 opacity pattern** — `text-content-primary/50` for inactive state. Could be added to the Pattern note table in §41 area, but B6's Pattern note is scoped to "Display primitives cluster" — instead inline-reference it from §43 to avoid scope creep.
- **AC grep checks use `-cE` flag** — lesson from B4.
- **NEW bonus check (post-B6 regression lesson)**: cross-reference text-match validation. For every `§N <Name>` reference introduced/touched, verify the heading actually exists at that number with that name. Catches the broken-cross-ref bug class.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-340's edits, the next sub-ticket of SCRUM-329 Part B is **B8 — Feedback / Alerts** (audit-B5): Toast (drift), ToastContainer (add), AlertBox (add), ErrorAlert (add), InlineError (already aligned in Common Patterns — promote optional), RateLimitBanner (add). 6 components — mostly adds with one rewrite (Toast). CountdownTimer was originally in this cluster but already covered in B5/SCRUM-338. B8 will be opened only after this `/update-docs` lands.

Remaining Part B clusters after B7:
- **B8 (audit-B5)**: Feedback / Alerts (6 components — rewrite + 5 adds, CountdownTimer already done)
- **B9 (audit-B8b)**: Misc + selectors (5 components — TurnstileWidget already done; LanguageSelector + EmailSelector are drift in Common Patterns "Selector Trigger")
- **B10 (audit-B9)**: Cleanup — must run last (deletes orphaning cross-references; remove §13 Speedometer / §12 Payment Form / §2 Icon Set / §11 Quick Notification / §14 Notification — all Doc-only with no code; reconcile §1 Card with globals.css; fix registry "Sidebar.tsx" → "SidebarNav.tsx")

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §15 rewritten + §42/§43 new + 2 Common Patterns deletes
- [ ] **Testing**: Step 4's 12 grep AC checks all pass + 4 bonus integrity
- [ ] **Integration**: section numbering continuous §1-§43; cross-references valid (§15↔§37, §42→§10 Tooltip, §43→§6 Tabs)
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-340`.**
