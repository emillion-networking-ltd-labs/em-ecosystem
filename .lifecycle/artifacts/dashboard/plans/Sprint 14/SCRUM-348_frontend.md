# Frontend Implementation Plan: SCRUM-348 Backfill componentRegistry + extend doc rule for catalog/showcase coverage (B11 / Part C of SCRUM-329)

## 2. Overview

Closes the catalog/showcase coverage drift in `nexacore-dashboard` and formalizes the satellite → ecosystem reverse-promotion governance. Two coordinated tracks:

- **Track A (em-ecosystem-code, full lifecycle)**: backfill the 8 missing components into `componentRegistry.ts`, fix the broken `Sidebar.tsx` reference, realign 2 misaligned `count:` fields, add 3 new `<ShowcaseSection>` blocks for the components that have no existing demo, and extend the `componentToSection` navigation mapping.
- **Track B (ai-specs, direct commit to main per Part B precedent)**: extend `frontend-standards.mdc` "New UI Component Documentation Rule" with point 5 (registry/showcase mandate); add a new "Satellite → Ecosystem Promotion Check" sub-section under "Shared UI Component Library Pattern"; add 1 line to `workflow-standards.mdc` Definition of DONE.

Architecture principles: Next.js App Router (file-system routing for `/admin/design-system`), single-source-of-truth alignment between code (`ui/*.tsx`), catalog (`componentRegistry.ts`), showcase (`ComponentShowcase.tsx`), navigation (`componentToSection`), and the doc spec (`ui-design-system.md` §1-§50, already reconciled in Part B). Zero backend changes — `nexacore-api` 0-FAIL audit baseline (2026-03-17) remains untouched.

## 3. Architecture Context

### Components/files involved

**em-ecosystem-code** (repo: `em-ecosystem`):

| File | Purpose | Modification type |
|---|---|---|
| `nexacore-dashboard/src/lib/component-registry.ts` | Source of truth for catalog cards | Edit existing entries + add 3 new entries |
| `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx` | Renders Atoms + Molecules tabs | Add 3 new `<ShowcaseSection>` blocks (verify 5 existing inline demos have meaningful labels) |
| `nexacore-dashboard/src/app/admin/design-system/page.tsx` | Hosts catalog + tab navigation; `componentToSection` mapping | Add 3 new mappings |

**ai-specs** (repo: `em-development-framework`):

| File | Insertion point | Modification type |
|---|---|---|
| `ai-specs/specs/frontend-standards.mdc` | After line 249 (end of point 4 in "New UI Component Documentation Rule") | Add point 5 + update point 4 + add anti-pattern bullet |
| `ai-specs/specs/frontend-standards.mdc` | After line 1226 (end of "Distribution model" paragraph in "Shared UI Component Library Pattern") | Add new sub-section "Satellite → Ecosystem Promotion Check (MANDATORY)" |
| `ai-specs/specs/workflow-standards.mdc` | After the line added in commit 8ea4d90 (Definition of DONE checklist) | Add 1 new checklist line for satellite component additions |

### Routing considerations

No new routes. `/admin/design-system` already exists; only catalog/showcase content changes.

### State management approach

No state changes. `componentRegistry` is a static const array; `componentToSection` is a static record literal. All edits are data-only.

### Working tree state (verified 2026-05-03)

- `em-ecosystem-code`: clean, on `main`, up to date with origin
- `ai-specs`: clean, on `main`, up to date with origin
- No dependency conflicts with SCRUM-342 (already merged via PR #231 / commit d9cd7d9)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-348-frontend` in em-ecosystem-code only. ai-specs work happens directly on `main` per Part B B1-B10b precedent for docs-only deliverables.
- **Branch Naming**: `feature/SCRUM-348-frontend` (mandatory per `frontend-standards.mdc` Development Workflow). Do NOT use the bare `SCRUM-348` form.
- **Implementation Steps**:
  1. `cd em-ecosystem-code`
  2. Verify on `main`: `git status` should show `On branch main` + `working tree clean`
  3. Pull latest: `git pull origin main`
  4. Create branch: `git checkout -b feature/SCRUM-348-frontend`
  5. Verify: `git branch` should show `* feature/SCRUM-348-frontend`
- **Notes**: Track B (ai-specs work) is NOT done on a branch — the convention since Part B (SCRUM-334-346) is direct commits to `ai-specs/main` for docs-only deliverables. This is the same pattern used in commit 8ea4d90 (the original rule that we are extending).

---

### Step 1: Fix `componentRegistry.ts` — Track A.1

- **File**: `nexacore-dashboard/src/lib/component-registry.ts`
- **Action**: Apply 3 categories of edits in a single file modification — broken file ref fix, count: realignment, new entries.

#### Step 1.1 — Broken file reference (Table A from enrichment, 1 fix)

- Locate the `Sidebar` entry at lines 205-211.
- Change `files: ["Sidebar.tsx"]` → `files: ["SidebarNav.tsx"]`.
- **Decision** (recorded in plan, no further user prompt needed): keep entry name as `"Sidebar"` (display name in catalog). This avoids touching the `componentToSection` mapping key and the `<ShowcaseSection title="Sidebar">` block. Update the `description:` to read `"SidebarNav — collapsible navigation, sections, collapsed/expanded, propagable specs"` (already says SidebarNav — leave as is).

#### Step 1.2 — count: realignment by adding missing files (Table B + closes Table C #1, #4)

- `Select / Dropdown` entry (lines 133-140): currently `files: ["Select.tsx", "LanguageSelector.tsx"], count: 3`. Add `EmailSelector.tsx` to `files[]`. Result: `files: ["Select.tsx", "LanguageSelector.tsx", "EmailSelector.tsx"], count: 3`. Update `description:` to keep "Select, LanguageSelector, EmailSelector — auto edge detection" (already lists EmailSelector — leave as is).
- `Feedback / Alerts` entry (lines 156-170): currently 6 files + `count: 7`. Add `AlertBox.tsx` to the `files[]` array. Result: 7 files matching count: 7. Update `description:` to mention AlertBox.

#### Step 1.3 — Expand existing entries (closes Table C #2, #3)

- `Button` entry (lines 13-19): currently `files: ["Button.tsx"]`. Change to `files: ["Button.tsx", "IconButton.tsx", "SegmentedControl.tsx"], count: 3`. Update `description:` to "Primary/secondary/outline/danger + link buttons + IconButton + SegmentedControl".

#### Step 1.4 — Add 3 new entries (closes Table C #5, #6, #7)

Add the following entries (insert after the appropriate semantic neighbor):

```typescript
// Insert after "Card" entry (currently last atom, around line 124), before the
// "// ─── Molecules ───────────────" comment:
{
  name: "StickyCard",
  category: "atom",
  description: "Container that becomes sticky on scroll — IntersectionObserver + ResizeObserver + window.resize trio, 2 sub-components (StickyShell + content), mobile collapsible strip",
  files: ["StickyCard.tsx"],
},
{
  name: "ThemeToggle",
  category: "atom",
  description: "Light/dark theme toggle — composes IconButton, dynamic aria-label, SSR-safe mounted state",
  files: ["ThemeToggle.tsx"],
},
```

Insert after `Image Cropper` entry (around line 204), before `Sidebar`:

```typescript
{
  name: "TurnstileWidget",
  category: "molecule",
  description: "Cloudflare Turnstile CAPTCHA widget for auth forms — exposes useTurnstileReset hook for retry",
  files: ["TurnstileWidget.tsx"],
},
```

- **Implementation Notes**:
  - Use the existing entry style (2-space indent, trailing comma after each property and after each entry's closing brace).
  - Do NOT add a `count:` field on entries with only 1 file (matches existing convention — see `Avatar`, `Toggle`, `Checkbox`, etc.).
  - Verify with `npm run build` after edits — TypeScript will catch malformed objects against `ComponentEntry` interface.

---

### Step 2: Update `ComponentShowcase.tsx` — Track A.2

- **File**: `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx`
- **Action**: Add 3 new `<ShowcaseSection>` blocks for components with no current demo. The 5 already-imported components (IconButton, SegmentedControl, AlertBox, EmailSelector, SidebarNav) are already shown inside other ShowcaseSections — verify they have labeled demo blocks; only add labels if missing.

#### Step 2.1 — Verify existing inline demos (verify-only, no edit unless missing)

- IconButton: confirm label "Icon Buttons" exists at line ~412 inside the Button ShowcaseSection. Already verified during enrichment — no edit needed.
- SegmentedControl: confirm label exists at lines 1637-1665 area inside the Tabs ShowcaseSection. Add a demo header (`<p className="text-body font-semibold ...">SegmentedControl</p>`) if missing.
- AlertBox: locate usage (likely inside "Feedback / Alerts" ShowcaseSection at line 2249+). Verify a labeled demo exists; if not, add `<p className="text-body font-semibold ...">AlertBox</p>` + a 4-variant demo (info/warning/error/success).
- EmailSelector: locate usage (likely inside "Select / Dropdown" ShowcaseSection at line 1876+). Verify a labeled demo exists; if not, add `<p className="text-body font-semibold ...">EmailSelector</p>` + a single-action dropdown demo.
- SidebarNav: confirm Sidebar ShowcaseSection (line 3855+) demonstrates SidebarNav with `<SidebarNav sections={...} />`. Already imported — should be present.

#### Step 2.2 — Add new `<ShowcaseSection>` for StickyCard

Insert near the end of `AtomShowcase` function, before the closing fragment / before `MoleculeShowcase`. Follow the existing ShowcaseSection pattern:

```tsx
<ShowcaseSection title="StickyCard">
  <p className="text-caption text-content-tertiary">
    Becomes sticky on scroll using IntersectionObserver. Composes a fixed
    container + sentinel div for state detection. 2 positions: <code>top</code>
    and <code>bottom</code>.
  </p>
  <div className="relative h-64 overflow-y-auto border border-border-strong rounded p-4">
    <div className="h-32" />
    <StickyCard position="top">
      <p className="text-body font-semibold">Sticky top</p>
    </StickyCard>
    <div className="h-96" />
  </div>
</ShowcaseSection>
```

- **Dependencies**: Add `import StickyCard from "@/components/ui/StickyCard";` if not already imported (it is — line 12 of `design-system/page.tsx`, but confirm in ShowcaseSection's import list at the top).

#### Step 2.3 — Add new `<ShowcaseSection>` for ThemeToggle

Insert in `AtomShowcase`, near the Toggle section (line 1060):

```tsx
<ShowcaseSection title="ThemeToggle">
  <p className="text-caption text-content-tertiary">
    JSX-only. Composes <code>IconButton</code> with dynamic aria-label.
    SSR-safe via mounted state — renders nothing until hydration to avoid
    hydration mismatch. Uses <code>ThemeContext</code>.
  </p>
  <div className="flex items-center gap-4">
    <ThemeToggle />
    <span className="text-caption text-content-tertiary">Click to toggle</span>
  </div>
</ShowcaseSection>
```

- **Dependencies**: Add `import ThemeToggle from "@/components/ui/ThemeToggle";`

#### Step 2.4 — Add new `<ShowcaseSection>` for TurnstileWidget

Insert in `MoleculeShowcase`, near the Modal section (line 3575):

```tsx
<ShowcaseSection title="TurnstileWidget">
  <p className="text-caption text-content-tertiary">
    Cloudflare Turnstile CAPTCHA wrapper. JSX-only. Exports{" "}
    <code>useTurnstileReset</code> hook for explicit retry after submission
    failures. Production usage requires <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>.
  </p>
  <div className="border border-border-strong rounded p-4">
    <p className="text-caption text-content-tertiary mb-2">
      Demo (test site key — always passes):
    </p>
    <TurnstileWidget
      siteKey="1x00000000000000000000AA"
      onVerify={(token) => console.log("Verified:", token)}
    />
  </div>
</ShowcaseSection>
```

- **Dependencies**: Add `import TurnstileWidget from "@/components/ui/TurnstileWidget";`

- **Implementation Notes for Step 2**:
  - All 3 new demos are deliberately minimal — JSX-only components don't need SpecsPanel.
  - The TurnstileWidget test key `1x00000000000000000000AA` is Cloudflare's official test key (always passes verification) — safe for showcase use without leaking production credentials.
  - For ThemeToggle showcase, do NOT wrap in a custom ThemeProvider — the showcase already runs inside `app/providers.tsx` which provides ThemeContext.

---

### Step 3: Update `componentToSection` mapping — Track A.3

- **File**: `nexacore-dashboard/src/app/admin/design-system/page.tsx`
- **Action**: Add 3 new entries to the `componentToSection` record (lines 29-79) for the 3 new registry entries. The existing `Sidebar` entry stays unchanged (we kept the registry name `"Sidebar"` in Step 1.1).

Insert after the `"Recovery Codes Grid"` entry (line 60):

```typescript
StickyCard: { tab: "atoms", section: "showcase-stickycard" },
ThemeToggle: { tab: "atoms", section: "showcase-themetoggle" },
TurnstileWidget: { tab: "molecules", section: "showcase-turnstilewidget" },
```

- **Implementation Notes**:
  - The `section` slug must match the kebab-case derivation from `ShowcaseSection`'s id template: `showcase-${title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/-$/, "")}`.
  - "StickyCard" → "stickycard" (no internal dash because letters only).
  - "ThemeToggle" → "themetoggle".
  - "TurnstileWidget" → "turnstilewidget".

---

### Step 4: Build, lint, and manual smoke verification — Track A.4

- **Action**: Verify all Track A changes compile, lint, and render correctly in the browser.
- **Implementation Steps**:
  1. From `em-ecosystem-code/nexacore-dashboard/`:
     - `npm run lint` — must pass with 0 errors
     - `npm run build` — must pass with 0 errors (TypeScript will catch malformed registry entries)
  2. Run dev server: `npm run dev`
  3. Navigate to `http://localhost:3000/admin/design-system`
  4. **Catalog tab smoke checks**:
     - Total card count: should show **34** (was 31; added StickyCard + ThemeToggle + TurnstileWidget)
     - Click on each new card → should scroll to the correct ShowcaseSection in the correct tab
     - Click on `Sidebar` card → should navigate to `Sidebar` ShowcaseSection (unchanged behavior)
     - Click on `Button` card → should navigate to Button section (which now showcases IconButton + SegmentedControl too)
  5. **Atoms tab smoke checks**:
     - StickyCard ShowcaseSection visible and demo renders without console errors
     - ThemeToggle ShowcaseSection visible and clicking toggles the theme
  6. **Molecules tab smoke checks**:
     - TurnstileWidget ShowcaseSection visible; Cloudflare iframe loads (test key)
  7. **No console errors or warnings** (other than pre-existing ones unrelated to this ticket)
- **Notes**: Do NOT proceed to /commit or Track B until all 7 checks pass. If StickyCard demo causes layout issues in the showcase, simplify the demo (the goal is to make the component navigable from catalog, not to perfect the demo).

---

### Step 5: Update Technical Documentation — Track B

- **Action**: Three coordinated edits in `ai-specs/` (direct commit to `ai-specs/main`, no branch, per Part B B1-B10b precedent).

#### Step 5.1 — Extend Forward-flow Rule

- **File**: `ai-specs/specs/frontend-standards.mdc`
- **Insertion point**: After line 249 (end of point 4 "PR review checkpoint"), before line 251 ("**Anti-patterns to avoid:**")
- **Edit operations**:
  1. **Update existing point 4** (line 249) in place. Change from:
     > 4. **PR review checkpoint**: reviewers MUST confirm the new `ui/*.tsx` file has a corresponding §section in `ui-design-system.md`. PRs that add components in `ui/` without doc updates should be blocked at review unless the addition is explicitly out-of-scope and tagged with a follow-up doc ticket.

     To:
     > 4. **PR review checkpoint**: reviewers MUST confirm the new `ui/*.tsx` file has (a) a corresponding §section in `ui-design-system.md`, (b) an entry in `componentRegistry.ts`, AND (c) a `<ShowcaseSection>` block in `ComponentShowcase.tsx` (either standalone OR inside a family section like "Button" or "Feedback / Alerts"). PRs missing any of these should be blocked at review unless the addition is explicitly out-of-scope and tagged with a follow-up ticket.

  2. **Add new point 5** after the updated point 4:
     > 5. **Update `componentRegistry.ts` and `<ShowcaseSection>` in `ComponentShowcase.tsx`**: every new `ui/*.tsx` file MUST be reachable from `/admin/design-system` catalog. Either (a) add a new entry to `componentRegistry` with category `atom` or `molecule`, plus a corresponding `<ShowcaseSection title="...">` block, OR (b) expand an existing family entry (e.g., add `IconButton` to the "Button" entry's `files[]`) and ensure the family's `<ShowcaseSection>` includes a labeled demo for the new component. Update the `componentToSection` mapping in `app/admin/design-system/page.tsx` if a new standalone entry is created. Verify by counting catalog cards in the rendered `/admin/design-system` page.

  3. **Add new anti-pattern bullet** to the existing list (after line 255 "Embedding spec values directly in JSX..."):
     > - Adding a `ui/*.tsx` component without a `componentRegistry` entry — component is invisible from `/admin/design-system` catalog and cannot be linked or discovered. (This was the exact 17% drift category SCRUM-348 fixed: AlertBox, IconButton, SegmentedControl, EmailSelector, StickyCard, ThemeToggle, TurnstileWidget were all in `ui/` but absent from registry.)

#### Step 5.2 — Add Reverse-flow Rule (NEW)

- **File**: `ai-specs/specs/frontend-standards.mdc`
- **Insertion point**: After line 1226 (end of "Distribution model" paragraph in "Shared UI Component Library Pattern"), before line 1228 ("### Production Hardening Baseline")
- **Insert new sub-section**:

```markdown
#### Satellite → Ecosystem Promotion Check (MANDATORY)

The "Distribution model" above describes the forward flow (ecosystem → satellite via the `em-ui` CLI / manual copy). The reverse flow — satellite components that turn out to be generic enough for ecosystem use — needs explicit governance, otherwise satellites accumulate generic primitives that other satellites and the dashboard re-implement from scratch.

**Whenever a satellite developer creates a new component** in any of these locations:
- `satellites/sat-{client}/src/components/ui/`
- `satellites/sat-{client}/src/components/layout/`
- as an inline `function ComponentName()` declaration inside `satellites/sat-{client}/src/app/**/page.tsx`

…the developer MUST perform a **Promotion Check**:

1. **Evaluate genericity** against three criteria:
   - (a) Does the component encode SAT-specific business logic, branding, or data schema? If YES → keeps SAT-local, no promotion.
   - (b) Is the pattern reasonably reusable across ≥2 contexts (other satellites, dashboard modules, future projects)? If YES → promotion candidate.
   - (c) Does the component depend on SAT-specific assets (images, fonts, copy, third-party SDKs not used elsewhere) that would be deadweight in the ecosystem? If YES → SAT-local; if assets are easily replaceable parameters, still a candidate.

2. **Document the decision** either in the satellite's `STYLE_GUIDE.md` (preferred — long-term residence) or in the ticket's record file (acceptable when STYLE_GUIDE.md does not yet exist).

3. **If promotion is decided**: open a ticket against `nexacore-dashboard` (in the `dashboard` module's plans folder) to copy/adapt the component into `nexacore-dashboard/src/components/ui/`, register it per the forward-flow rule (point 5 of "New UI Component Documentation Rule"), then optionally re-adopt it in the originating satellite via the `em-ui` CLI sync (or manual copy until the CLI ships).

4. **PR review checkpoint**: reviewers of any satellite PR adding a new component file (or a non-trivial inline component, ~25+ lines) MUST confirm the Promotion Check was performed and documented. PRs missing the check are blocked.

**Anti-patterns to avoid:**
- Implementing a generic primitive (image viewer, splash loader, star rating, timeline entry) inline in a satellite page without flagging promotion potential.
- Skipping the Promotion Check on the assumption "it's just for this satellite" — components age into reuse pressure unpredictably.
- Promoting speculatively — only open the dashboard ticket when there is concrete need (current dashboard module OR another satellite signaling demand). Pre-promotion bloats the ecosystem with unused primitives.

**Reference**: SCRUM-348 catalogued 4 promotion candidates discovered in SAT01 post-hoc — Lightbox (~185 lines, inline `portfolio/page.tsx:87`), IntroLoader (`layout/IntroLoader.tsx`), StarRating (13 lines, inline `testimonios/page.tsx:15`), TimelineEntry (26 lines, inline `sobre-mi/page.tsx:14`). All would have been evaluated at creation time if this rule had existed during SAT01-1.
```

#### Step 5.3 — Update `workflow-standards.mdc` Definition of DONE

- **File**: `ai-specs/specs/workflow-standards.mdc`
- **Insertion point**: Immediately after the line added in commit 8ea4d90 (the existing `ui/*` checklist line). Should be at line 67 (one after the original line 66 `/update-docs completed`).
- **Edit**: Add 1 new checklist line:
  > - [ ] **If the ticket adds new component(s) inside a satellite**: promotion check performed and documented per `frontend-standards.mdc` "Satellite → Ecosystem Promotion Check" rule

- **Implementation Notes for Step 5**:
  - Use a single Edit per file for ai-specs work — keeps the diff focused.
  - All 3 ai-specs edits go in **one commit** to `ai-specs/main`. Recommended commit message: `docs(SCRUM-348): extend rule with registry/showcase coverage + add satellite reverse-promotion rule`.
  - Push immediately after the commit. No PR needed (per Part B convention for ai-specs docs-only changes).

---

## 5. Implementation Order

1. **Step 0** — Create `feature/SCRUM-348-frontend` branch in em-ecosystem-code
2. **Step 1** — Edit `componentRegistry.ts` (Track A.1)
3. **Step 2** — Edit `ComponentShowcase.tsx` (Track A.2 — verify 5 existing + add 3 new sections)
4. **Step 3** — Edit `componentToSection` mapping in `design-system/page.tsx` (Track A.3)
5. **Step 4** — Build + lint + manual smoke (Track A.4)
6. **Step 5** — `/commit` Track A (em-ecosystem-code PR + merge to main)
7. **Step 6** — Track B in ai-specs: extend forward rule, add reverse rule, update workflow-standards (Step 5.1, 5.2, 5.3) — single commit + push to `ai-specs/main`
8. **Step 7** — `/update-docs` (record file + integration-state if applicable + deviation resolution + Jira ticket transition to Done)

## 6. Testing Checklist

### Track A (em-ecosystem-code)

- [ ] `npm run lint` passes (0 errors) in `nexacore-dashboard/`
- [ ] `npm run build` passes (0 errors) in `nexacore-dashboard/`
- [ ] Catalog tab shows **34** component cards (was 31)
- [ ] All 3 new cards (StickyCard, ThemeToggle, TurnstileWidget) navigate correctly to their ShowcaseSection
- [ ] `Sidebar` card still navigates correctly (broken file ref fix verified — no 404 in console)
- [ ] `Select / Dropdown` showcase still includes EmailSelector demo (was already present, just registry-aligned now)
- [ ] `Feedback / Alerts` showcase still includes AlertBox demo (was already imported, count: now matches)
- [ ] `Button` showcase still shows IconButton + SegmentedControl variants (registry now declares them in family)
- [ ] No new console errors or warnings on `/admin/design-system`
- [ ] Dark mode toggle on ThemeToggle showcase works correctly

### Track B (ai-specs)

- [ ] `frontend-standards.mdc` line numbers around the rule extension look correct (no markdown indentation breaks, no broken bullet lists)
- [ ] `workflow-standards.mdc` Definition of DONE checklist remains valid markdown (8 items now, was 7)
- [ ] No regressions in cross-references — search the ai-specs repo for broken `frontend-standards.mdc#anchor` references

## 7. Error Handling Patterns

This ticket has no runtime error paths — all changes are static data + documentation. Build-time errors (TypeScript) are the only failure mode for Track A. For Track B, markdown lint (if configured) is the only failure mode.

## 8. UI/UX Considerations

- **Catalog count visible to user**: changes from "31" to "34" in the Filter accordion title (`Filter by category — All (34)`). This is the user-facing evidence of the fix.
- **No visual regressions expected**: existing showcases unchanged; only 3 new sections added at semantic positions.
- **TailwindCSS theme compliance**: all new ShowcaseSection demos use semantic tokens (`text-content-primary`, `text-content-tertiary`, `bg-surface-tertiary`, `border-border-strong`) — verified during Step 2 authoring.
- **Accessibility**: new ShowcaseSection blocks inherit the established `id={showcase-{slug}}` + `<h3 className="text-h3 font-semibold">` pattern. ThemeToggle demo respects the existing aria-label dynamic behavior.
- **Loading states**: TurnstileWidget demo will show a brief Cloudflare iframe loading state before the test challenge completes — expected.

## 9. Dependencies

### External libraries

None added. All used imports already exist in the project (`StickyCard`, `ThemeToggle`, `TurnstileWidget` are local; Cloudflare Turnstile uses the test key, no env var setup required for showcase).

### Custom UI components used in Track A demos

- `StickyCard` — existing
- `ThemeToggle` — existing
- `TurnstileWidget` — existing

### ai-specs files modified (Track B)

- `frontend-standards.mdc` (2 sections touched)
- `workflow-standards.mdc` (1 line added)

## 10. Notes

- **Language requirement**: all new content in English (rule + anti-pattern bullets + showcase demo descriptions). Spanish only in commit messages if user-facing.
- **Lifecycle convention**: Track A uses full `/develop → /verify → /commit` lifecycle (branch + PR + merge). Track B uses Part B B1-B10b precedent (direct commit to `ai-specs/main`, no branch, no PR). Both are coordinated in a single ticket.
- **Inventory carry-overs from enrichment** (NOT executed in this ticket — explicitly out of scope):
  1. Tier 1 recurrence prevention (Jest/script test asserting registry vs `ls ui/*.tsx`) — recommended as follow-up ticket post-SCRUM-348.
  2. 4 SAT01 promotion candidates (Lightbox, IntroLoader, StarRating, TimelineEntry) — separate tickets when need arises.
  3. SAT01 internal cleanup (`ServiceCard` duplication) — belongs to SAT01-2 STYLE_GUIDE extraction.
  4. Doc-from-code generator — long-term initiative.
- **Backend untouched**: `nexacore-api` 0-FAIL audit baseline (2026-03-17) remains valid. No regression risk on backend.
- **Commit hygiene**: 1 commit for Track A (PR-merged squash or single descriptive commit), 1 commit for Track B (ai-specs). Total 2 commits across 2 repos.

## 11. Next Steps After Implementation

- After `/commit` (Track A merged) and Track B pushed:
  - Update `MEMORY.md` with the SCRUM-348 closure summary (deviation count, approach taken, lessons learned)
  - Record the actual file:line numbers achieved in the `_record.md` file at `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-348_frontend.md`
  - Mark SCRUM-348 as Done in Jira (only after `/update-docs` completes)
- Recommended follow-up ticket: Tier 1 automated recurrence prevention (Jest test or build-time script). Estimate: ~1-2 hours.

## 12. Implementation Verification

- **Code Quality**:
  - [ ] All Track A edits use existing TypeScript types correctly (`ComponentEntry`, `componentToSection` Record signature)
  - [ ] All Track B markdown edits preserve list/header/code-block formatting
- **Functionality**:
  - [ ] All 7 acceptance criteria from the enriched ticket (AC1-AC7 in description) pass
  - [ ] AC8 (workflow-standards.mdc checklist line) added per Step 5.3
- **Testing**:
  - [ ] `npm run lint` + `npm run build` pass in nexacore-dashboard
  - [ ] Manual smoke checks on `/admin/design-system` all pass (Step 4)
  - [ ] No new console errors
- **Integration**:
  - [ ] Catalog → ShowcaseSection navigation verified for all 3 new + the renamed Sidebar entry
  - [ ] Existing showcase sections unchanged (no regression in Button, Feedback/Alerts, Select/Dropdown, Sidebar)
- **Documentation updates completed**:
  - [ ] `frontend-standards.mdc` extended (forward + reverse rules) and committed to `ai-specs/main`
  - [ ] `workflow-standards.mdc` Definition of DONE updated and committed
  - [ ] Record file created at `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-348_frontend.md` per /update-docs convention

## 13. Module-Level Planning

N/A — this ticket is not creating or modifying a NexaCore internal module. It is governance/tooling work on the design system catalog and standards.

## 14. Satellite App Planning

N/A — this ticket does not create or modify a satellite app. It does add the **reverse-flow governance rule** that future satellite work must follow, but no SAT01 (or any other satellite) code is touched in scope.
