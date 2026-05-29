# Frontend Implementation Plan: SCRUM-336 Reconcile ui-design-system.md — Navigation cluster

**Detected scope**: `frontend` (docs reconciliation of frontend components — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B3 of 9 sub-tickets** from SCRUM-329 Part B reconciliation. Sibling of SCRUM-334 (B1) and SCRUM-335 (B2), both completed. Same lifecycle adaptation as parent (docs-only, no `em-ecosystem-code` branch). Pattern proven across 2 prior B sub-tickets — carries forward without re-justification.

## 1. Codebase State Verification (2026-05-02)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors** (this plan and its /develop assume these specific commit states):
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2)
  - Doc (`ai-specs`): `4164342` (post-/update-docs of SCRUM-335)
- **Files to be read** (read-only inputs):
  - `nexacore-dashboard/src/components/ui/Tabs.tsx` (line 61 → `tabsSpecs` + `variantStyles` + `sizeClasses`)
  - `nexacore-dashboard/src/components/ui/Breadcrumbs.tsx` (line 16 → `breadcrumbsSpecs`)
  - `nexacore-dashboard/src/components/ui/Pagination.tsx` (line 20 → `paginationSpecs`)
  - `nexacore-dashboard/src/components/ui/SidebarNav.tsx` (line 41 → `sidebarNavSpecs`)
  - `ai-specs/specs/ui-design-system.md` — current content of §3 (line 203), §6 (line 278), §10 (line 392), §19 (line 657)
- **File to be written** (single deliverable):
  - `ai-specs/specs/ui-design-system.md` — modified in-place

## 2. Overview

This ticket reconciles 4 Navigation-cluster components that are all currently classified Documented-Drifted in the audit table. After this ticket:

- §6 Tabs is **rewritten** with all 3 variants (subtle/nav/nav-horizontal), 3 sizes for subtle, overflow handling, dot indicators
- §10 Breadcrumbs is **rewritten** with token-based values, lucide icons named (Birdhouse, ChevronRight), auto-collapse ResizeObserver behavior
- §19 Pagination is **rewritten** in OPPOSITE visual direction from current (32×32 dark active state — reverses doc's 38×38 light claim — this is the worst-drift component in the audit)
- §3 Sidebar Items is **rewritten** with the full collapsed/expanded model, accordion children, flyout popovers, embedded primitive integration (Tabs + IconButton + Tooltip)

**§3 title decision** (per /enrich-us): KEEP as "Sidebar Items" rather than rename to "SidebarNav". Rationale documented in /enrich-us; flag at /develop kickoff if user disagrees.

Per the design-system source-of-truth rule: every section's edits are presented to the user for approval before being applied. /develop pauses at each component for sign-off — 4 gates total.

## 3. Architecture Context

Doc structure post-B2 (the starting state):

```
ui-design-system.md (post-/update-docs of SCRUM-335)
├─ Global Design Tokens
├─ Theme System
├─ Components
│  ├─ §1 Card
│  ├─ §2 Icon Set
│  ├─ §3 Sidebar Items                ← REWRITE (largest section in B3)
│  ├─ §4 Calendar
│  ├─ §5 Modal
│  ├─ §6 Tabs                         ← REWRITE
│  ├─ §7 Context Menu (Doc-only)
│  ├─ §8-§9 (untouched)
│  ├─ §10 Breadcrumbs                 ← REWRITE
│  ├─ §11-§18 (untouched, includes B1+B2 work)
│  ├─ §19 Pagination                  ← REWRITE (worst drift in audit)
│  ├─ §20-§27 (untouched, includes B1+B2 work)
└─ Common Patterns
```

**Final numbered sections after B3**: §1-§27 (UNCHANGED from post-B2). B3 has no additions, no deletions — only 4 in-place rewrites. No renumber pass needed.

**Branching exception** (carries forward from SCRUM-329 → SCRUM-334 → SCRUM-335): no `feature/SCRUM-336-frontend` branch in `em-ecosystem-code`. Work directly in `ai-specs/` working tree on `main`. Lifecycle: `/develop` produces edits → `/verify` reviews → `/update-docs` commits to `ai-specs` `main` directly.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main` branch. Same Accepted-Trivial deviation declared in SCRUM-329's plan, validated through SCRUM-334 + SCRUM-335 verifies. No re-justification needed.

### Step 1: Discovery — read 4 spec exports + 4 existing doc sections

- **Files**: read-only — the 4 .tsx files + the 4 doc sections
- **Action**: extract spec export values AND current state of §3, §6, §10, §19 into working notes. /develop's drafting steps depend on knowing both sources.
- **Implementation steps**:
  1. Open `Tabs.tsx`, locate `tabsSpecs` (line 61) + `variantStyles` + `sizeClasses`, copy values
  2. Open `Breadcrumbs.tsx`, locate `breadcrumbsSpecs` (line 16), copy values
  3. Open `Pagination.tsx`, locate `paginationSpecs` (line 20), copy values
  4. Open `SidebarNav.tsx`, locate `sidebarNavSpecs` (line 41), copy values + read more of the JSX (largest component in B3, multi-mode behavior)
  5. Read existing §3 (line 203), §6 (line 278), §10 (line 392), §19 (line 657) for what's being replaced
- **Notes**: working notes are scratch — do not become a deliverable.

### Step 2: Per-component drafting + user approval (4 sub-steps)

Order matters per /enrich-us recommendation: smallest first → most-cross-referenced last.

#### Step 2a: Draft §10 Breadcrumbs rewrite (FIRST — smallest, clearest scope)

- **Action**: from `breadcrumbsSpecs`, draft a full rewrite. Drift items to fix:
  - Doc claims 20×20 home icon → code uses `Birdhouse` lucide 16px
  - Doc claims separator "/" 14px 20% opacity → code uses `ChevronRight` lucide 16px `text-content-tertiary`
  - Doc lacks the auto-collapse via ResizeObserver — code IMPLEMENTS this
- **Content scope**:
  - Properties table: home icon, separator icon, item layout, auto-collapse threshold
  - States: default link (text-content-secondary or similar), hover (text-content-primary), active/last item (text-content-primary, no link wrap)
  - Auto-collapse: when path width exceeds container, middle items collapse into `…` dropdown via ResizeObserver
  - Token references
- **Present for approval**: Gate 1.

#### Step 2b: Draft §6 Tabs rewrite

- **Action**: from `tabsSpecs` + `variantStyles` + `sizeClasses`, draft a full rewrite. Drift items:
  - Doc shows only `subtle` variant → code has 3 (subtle/nav/nav-horizontal)
  - Doc lacks size variants → code has 3 sizes for subtle only
  - Doc lacks overflow handling → code has horizontal-scroll on mobile + dot indicators
- **Content scope**:
  - 3 variants documented separately (subtle for general use, nav for sidebar, nav-horizontal for top bars)
  - 3 sizes (sm h-8 / md h-10 / lg h-12) — subtle only
  - Active vs inactive state per variant
  - Overflow: drag-to-scroll horizontal on narrow containers + dot indicators showing scroll position
  - Token references
- **Present for approval**: Gate 2.
- **Note**: §6 must land before §3 because §3 references "Tabs variant=nav".

#### Step 2c: Draft §19 Pagination rewrite (worst-drift component)

- **Action**: from `paginationSpecs`, draft a full rewrite reversing the visual direction documented in current §19. The current §19 describes 38×38 with light fill 5% — code is 32×32 with `bg-surface-inverse` (filled DARK). This is a confidence rebuild, not a tweak.
- **Content scope** (every value from `paginationSpecs`):
  - Page button size: `h-8 w-8` (32×32)
  - Active page: `bg-surface-inverse text-content-inverse`
  - Inactive page: `bg-transparent text-content-primary hover:bg-surface-subtle`
  - Disabled page: `opacity-50 cursor-not-allowed`
  - Prev/Next: icon buttons with `ChevronLeft` / `ChevronRight` lucide 16px (NOT text labels)
  - Layout: `gap-1` (4px) between items
  - Border radius: `rounded-md` (6px)
  - Ellipsis: `…` for collapsed page ranges
- **Present for approval**: Gate 3.
- **Visual sanity check**: after rewrite, the new §19 should match what's currently rendered on /admin/users (which uses Pagination). Independently visualize this during Gate 3 review.

#### Step 2d: Draft §3 Sidebar Items rewrite (LAST — largest, most cross-references)

- **Action**: from `sidebarNavSpecs` + significant JSX read, draft a full rewrite. This component is the most sophisticated in B3 — multi-mode, embeds 3 other primitives.
- **Content scope** — 2 main display modes:
  - **Expanded mode**: vertical column with section headers + nav items + accordion children. Items are `Tabs variant=nav` (so leaf items inherit nav styling).
  - **Collapsed mode** (icons-only): hover over leaf shows `Tooltip`; hover over parent shows flyout popover via `createPortal` (escapes sidebar's `overflow:hidden`).
  - Plus: collapse/expand toggle button (`IconButton variant=boxed`)
  - Plus: section headers (text styling distinct from items)
  - Plus: accordion behavior (parent click toggles open/closed, children indent)
- **Cross-references the new §3 must include**:
  - §6 Tabs (variant=nav for leaf items) — must already be rewritten (Gate 2)
  - IconButton (variant=boxed for collapse toggle) — references existing IconButton (currently undocumented in own section, but Common Patterns or registry covers it)
  - §11 Tooltip (for collapsed-state hover labels)
- **Present for approval**: Gate 4.
- **Note**: largest section by content. Plan for ~25-30 minutes of drafting + review at this gate alone.

### Step 3: Apply approved edits to `ui-design-system.md`

- **File**: `ai-specs/specs/ui-design-system.md`
- **Action**: apply the 4 approved drafts in the order they were approved.
- **Implementation steps**:
  1. Replace §10 Breadcrumbs content (anchor: `### 10. Breadcrumbs` heading + body + closing `---`)
  2. Replace §6 Tabs content (anchor: `### 6. Tabs` heading + body + closing `---`)
  3. Replace §19 Pagination content (anchor: `### 19. Pagination` heading + body + closing `---`)
  4. Replace §3 Sidebar Items content (anchor: `### 3. Sidebar Items` heading + body + closing `---`)
- **Notes**:
  - 4 separate Edit operations. Each old_string is the existing section content; each new_string is the approved draft.
  - No reordering or insertions — pure in-place rewrites. Section numbers preserved.
  - Order independent (no edits depend on others' line numbers since Edit tool uses string matching, not line refs).

### Step 4: Build verification (6 grep AC checks)

- **Action**: execute the 6 AC checkpoints from the enriched ticket as automated grep checks.
- **Implementation steps**:
  ```bash
  cd ai-specs/ai-specs/specs

  # AC1: §6 Tabs documents 3 variants
  awk '/^### 6\. Tabs/,/^---$/' ui-design-system.md | grep -ciE '(subtle|nav-horizontal|variant)'   # expected: ≥3

  # AC2: §10 Breadcrumbs cites lucide icons + ResizeObserver
  awk '/^### 10\. Breadcrumbs/,/^---$/' ui-design-system.md | grep -ciE '(Birdhouse|ChevronRight|ResizeObserver)'   # expected: ≥3

  # AC3: §19 Pagination uses tokens, NOT old pixel values
  awk '/^### 19\. Pagination/,/^---$/' ui-design-system.md | grep -ciE '(bg-surface-inverse|h-8 w-8|rounded-md)'   # expected: ≥1
  awk '/^### 19\. Pagination/,/^---$/' ui-design-system.md | grep -ciE '#[0-9a-f]{6}|38×38|38x38'   # expected: 0

  # AC4: §3 SidebarNav documents collapsed/expanded + flyout
  awk '/^### 3\. /,/^---$/' ui-design-system.md | grep -ciE '(collapsed|expanded|flyout|createPortal)'   # expected: ≥4

  # AC5: Section numbering still continuous §1-§27 (B3 has no additions/deletions)
  grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '[0-9]+' | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
  # expected: no GAP, max=27

  # AC6 (manual spot-check during /verify): every documented value in §3/§6/§10/§19 traces back to spec exports
  ```

### Step 5: Update Technical Documentation

The deliverable IS the documentation update. No `data-model.md`, `api-spec.yml`, or standards files need updates.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main, no em-ecosystem-code branch) ──
Step 0   No branch (carry-forward Accepted-Trivial, 3rd consecutive sub-ticket)
Step 1   Read 4 spec exports + 4 existing doc sections (~15-20 min — SidebarNav requires deeper JSX read)
Step 2a  Draft §10 Breadcrumbs rewrite → user approval (Gate 1)         ┐
Step 2b  Draft §6 Tabs rewrite → user approval (Gate 2)                 ├─ ~4 review cycles with user
Step 2c  Draft §19 Pagination rewrite → user approval (Gate 3)          │  ~1.5h total /develop
Step 2d  Draft §3 SidebarNav rewrite → user approval (Gate 4)           ┘
Step 3   Apply 4 edits to ui-design-system.md (in approval order)
Step 4   Build verification (6 grep AC checks)
Step 5   (covered by Step 3)
         ── /develop ends — user reviews final doc state ──

── /verify phase (review the deliverable + AC grep checks) ──
- Confirm 6 grep AC checks all pass
- Audit cluster resolution table (4 audit-table.md rows resolved: Tabs row 42, Breadcrumbs row 6, Pagination row 30, SidebarNav row 38)
- User signs off on the final doc state
- Verify report records "carry-forward Accepted-Trivial from SCRUM-329 / SCRUM-334 / SCRUM-335" for Step 0

── /update-docs phase (commit deliverable to ai-specs main) ──
- Stage: ai-specs/specs/ui-design-system.md, plan, verify, record
- Commit: docs(SCRUM-336): reconcile Navigation cluster — B3 of SCRUM-329 Part B
- Push to origin/main
```

**Estimated effort**: ~1.5h /develop with 4 user-approval gates. SidebarNav is the time sink (largest section); Breadcrumbs and Tabs are quicker. Could split into 2 sessions if user busy (Breadcrumbs+Tabs in session 1, Pagination+SidebarNav in session 2).

## 6. Testing Checklist

- [ ] §6 Tabs documents all 3 variants (AC1 passes)
- [ ] §10 Breadcrumbs cites Birdhouse + ChevronRight + ResizeObserver (AC2 passes)
- [ ] §19 Pagination uses tokens, no `38×38`/`38x38` strings remain (AC3 passes both subchecks)
- [ ] §3 SidebarNav covers collapsed/expanded/flyout (AC4 passes)
- [ ] Section numbering continuous §1-§27 (AC5 passes — should be UNCHANGED from post-B2)
- [ ] Spot-check 2-3 random claims in §3/§6/§10/§19 against spec exports (AC6 manual)
- [ ] Visual sanity: render the doc, confirm sections look like §22-§27 from B1/B2 (consistent template)
- [ ] No internal cross-reference broken — §3 references §6 Tabs and §11 Tooltip (verify both exist post-edit)

## 7. Error Handling Patterns

N/A — markdown doc edit. If a spec export is missing a documented field (e.g., the spec doesn't include the `nav-horizontal` variant), surface as a separate ticket — don't infer.

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to the 4 component .tsx files
- Write access to `ai-specs/specs/ui-design-system.md`
- User availability for ~4 approval gates during /develop
- No npm packages, no test frameworks. Standard editor tooling.

## 10. Notes

- **The user-approval rule is non-negotiable**. /develop MUST pause for sign-off at each component before applying edits.
- **Spec exports are authoritative**. Read exports first, then JSX for any details the spec doesn't capture (especially for SidebarNav which has multi-mode behavior the spec export only outlines).
- **SidebarNav is the time sink**. Plan for ~25-30 min just at Gate 4. If running short on time, consider splitting B3 into 2 sessions.
- **§3 title decision: KEEP "Sidebar Items"**. Rationale documented in /enrich-us. If user wants to rename to "SidebarNav" at /develop kickoff, it's a 1-line edit (heading only) — flag and we adjust.
- **No renumber pass in B3**. Section count stays §1-§27. Pure in-place rewrites only.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-336's edits, the next sub-ticket of SCRUM-329 Part B is **B4 — Modals + Overlays cluster** (ConfirmModal drift, IdleWarningModal new, Tooltip drift, CommandPalette new — plus SearchTrigger sub-section per Ambiguity 1 resolution). 5 components, mix of rewrites + new sections. B4 will be opened only after SCRUM-336 closes — single-ticket-at-a-time pacing.

## 12. Implementation Verification

Final verification checklist before /verify:

- [ ] **Code Quality**: N/A (no code changes)
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §3, §6, §10, §19 all rewritten
- [ ] **Testing**: Step 4's 6 grep AC checks all pass
- [ ] **Integration**: section numbering still continuous §1-§27; cross-references in new §3 (§6 Tabs, §11 Tooltip) point to existing sections
- [ ] **Documentation**: deliverable IS the doc; written in English; matches existing section convention (B1/B2 established the template)
- [ ] **No code branch in em-ecosystem-code**: confirm `git status` is clean in the code repo, all changes are in `ai-specs`

## 13. Module-Level Planning

N/A — this ticket doesn't touch a NexaCore module.

## 14. Satellite App Planning

N/A — dashboard UI Core docs reconciliation only.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-336`.**
